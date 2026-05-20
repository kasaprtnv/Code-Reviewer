import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { GithubService } from '../github/github.service';
import { fileDiffDTO, JobDataDTO } from './dto/review.dto';
import { AIService } from '../ai/ai.service';
import { PinoLogger } from 'nestjs-pino';
import { buildRightSidePromptLines } from '@/common/utils/diff-annotator';
import { shouldReviewForAI } from '@/ai/ignore/ignore-file';

@Processor('review')
export class ReviewService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly githubService: GithubService,
    private readonly aiService: AIService,
  ) {
    this.logger.setContext(ReviewService.name);
  }

  private buildHeaderSummaryMarkdown(reviewResult: {
    summary: string;
    riskLevel: string;
    overallScore: number;
  }) {
    return [
      '# AI PR Review',
      '',
      'Summary:',
      reviewResult.summary,
      '',
      'Risk:',
      `- ${reviewResult.riskLevel}`,
      // '',
      // 'Score:',
      // `- ${reviewResult.overallScore}/100`,
      '',
    ].join('\n');
  }

  private buildInlineCommentMarkdown(input: {
    severity: string;
    issue: string;
    suggestion: string;
  }) {
    return [
      `**${input.severity}**`,
      '',
      `**Issue**: ${input.issue}`,
      `**Suggestion**: ${input.suggestion}`,
    ].join('\n');
  }

  @Process({ name: 'review-pr', concurrency: 2 })
  async handleReviewPR(job: Job) {
    const { prNumber, repoFullName, title, installationId, headSha } =
      job.data as JobDataDTO;

    this.logger.info(
      { prNumber, repoFullName, installationId, headSha },
      'Start review job',
    );
    try {
      const [owner, repo] = repoFullName.split('/');

      const file = await this.githubService.getPullRequestFiles(
        installationId,
        owner,
        repo,
        prNumber,
      );

      const combinedDiff: string = file
        .filter((f) => shouldReviewForAI(f.filename))
        .map((file: fileDiffDTO) => {
          const rightLines = buildRightSidePromptLines(file.patch);

          if (!rightLines.trim()) {
            return `FILE: ${file.filename}\n(NO PATCH AVAILABLE FOR LINE ANCHORING)`;
          }

          const promptChunk = `FILE: ${file.filename}\n${rightLines}`;
          return promptChunk;
        })
        .join('\n\n');

      const reviewResult = await this.aiService.reviewDiff(combinedDiff, title);

      await this.githubService.postComment(
        installationId,
        owner,
        repo,
        prNumber,
        this.buildHeaderSummaryMarkdown(reviewResult),
      );

      for (const c of reviewResult.comments) {
        try {
          await this.githubService.postInlineReviewComment({
            installationId,
            owner,
            repo,
            pullNumber: prNumber,
            commitSha: headSha,
            filePath: c.filePath,
            line: c.line,
            side: c.side ?? 'RIGHT',
            body: this.buildInlineCommentMarkdown(c),
          });
        } catch (err) {
          // fallback ขั้นต่ำ: ถ้าลง inline ไม่ได้ ให้ log แล้วข้าม
          this.logger.warn(
            { filePath: c.filePath, line: c.line, err: (err as Error).message },
            'Failed to post inline comment',
          );
        }
      }
      this.logger.info(
        {
          prNumber,
          riskLevel: reviewResult.riskLevel,
          score: reviewResult.overallScore,
        },
        'AI review done',
      );
    } catch (error) {
      this.logger.error(
        { prNumber, error: (error as Error).message },
        'Failed to review PR',
      );
      throw error;
    }
  }
}
