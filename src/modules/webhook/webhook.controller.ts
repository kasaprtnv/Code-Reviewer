import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';

import { WebhookService } from './webhook.service';
import type { PayloadDTO } from './dto/webhook.dto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Req() req: Request & { rawBody?: Buffer },
    @Body() payload: PayloadDTO,
  ) {
    if (process.env.NODE_ENV === 'production') {
      this.webhookService.verifySignature(signature, req.rawBody);
    }

    if (
      event === 'pull_request' &&
      ['opened', 'synchronize'].includes(payload.action)
    ) {
      await this.webhookService.queueReview(
        payload.pull_request,
        payload.installation.id,
      );
    }

    return { ok: true };
  }
}
