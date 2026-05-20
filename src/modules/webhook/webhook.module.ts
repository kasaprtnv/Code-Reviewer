import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { GithubService } from '../github/github.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'review' })],
  controllers: [WebhookController],
  providers: [WebhookService, GithubService],
  exports: [WebhookService],
})
export class WebhookModule {}
