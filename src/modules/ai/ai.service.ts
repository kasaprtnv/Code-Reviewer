import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ReviewResultDTO } from '../review/dto/review.dto';
import { ChatCompletion } from 'openai/resources';
import { REVIEW_PROMPT } from '@/ai/prompts/review.prompt';
import { SECURITY_GUIDELINES } from '@/guidelines/security.guideline';
import { BACKEND_GUIDELINES } from '@/guidelines/backend.guideline';

@Injectable()
export class AIService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
  });

  private promptBuilder(
    reviewPrompt: string,
    securityMarkdown: string,
    backendMarkdown?: string,
    frontendMarkdown?: string,
  ) {
    let prompt = reviewPrompt.replace('{SECURITY}', securityMarkdown);
    if (backendMarkdown) {
      prompt = prompt.replace('{BACKEND}', backendMarkdown);
    } else {
      prompt = prompt.replace('{BACKEND}', '');
    }
    if (frontendMarkdown) {
      prompt = prompt.replace('{FRONTEND}', frontendMarkdown);
    } else {
      prompt = prompt.replace('{FRONTEND}', '');
    }
    return prompt;
  }

  async reviewDiff(diff: string, prTitle: string): Promise<ReviewResultDTO> {
    const response: ChatCompletion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: Number.parseFloat(process.env.REVIEW_TEMPERATURE ?? '0.2'),
      messages: [
        {
          role: 'system',
          content: this.promptBuilder(
            REVIEW_PROMPT,
            SECURITY_GUIDELINES,
            BACKEND_GUIDELINES,
            undefined,
          ),
        },
        {
          role: 'user',
          content: `PR: ${prTitle}\n\nDiff:\n${diff.slice(0, 12000)}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content) as ReviewResultDTO;

    return parsed;
  }
}
