import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as crypto from 'crypto';
import { PullRequestDTO } from './dto/webhook.dto';
import { GithubService } from '../github/github.service';

@Injectable()
export class WebhookService {
  constructor(
    @InjectQueue('review') private reviewQueue: Queue,
    private readonly githubService: GithubService,
  ) {}

  verifySignature(signature: string, rawBody?: Buffer) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret)
      throw new UnauthorizedException(
        'GITHUB_WEBHOOK_SECRET is not configured',
      );

    if (!signature)
      throw new UnauthorizedException('Missing x-hub-signature-256');
    if (!rawBody) throw new UnauthorizedException('Missing raw body');

    const hash =
      'sha256=' +
      crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (hash !== signature.trim()) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  async queueReview(pr: PullRequestDTO, installationId: number) {
    const [owner, repo] = pr.base.repo.full_name.split('/');
    const headSha = await this.githubService.getPullRequestHeaderSha(
      installationId,
      owner,
      repo,
      pr.number,
    );

    await this.reviewQueue.add(
      'review-pr',
      {
        prNumber: pr.number,
        repoFullName: pr.base.repo.full_name,
        title: pr.title,
        owner: pr.user.login,
        installationId,
        headSha,
      },
      {
        jobId: `pr-${pr.base.repo.full_name}-${pr.number}-${headSha}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }
}
