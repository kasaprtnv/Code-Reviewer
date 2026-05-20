import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReviewService } from './review.service';
import { GithubService } from '../github/github.service';
import { AIService } from '../ai/ai.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'review' })],
  providers: [ReviewService, GithubService, AIService],
  exports: [ReviewService],
})
export class ReviewModule {}
