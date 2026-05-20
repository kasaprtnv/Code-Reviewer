import { Injectable } from '@nestjs/common';
import type { App as GithubApp } from '@octokit/app';
import {
  ListPullRequestFilesResponse,
  PullRequestFileDTO,
} from './dto/github.dto';
import type { Octokit } from '@octokit/rest';

@Injectable()
export class GithubService {
  private app?: GithubApp;

  private async getApp(): Promise<GithubApp> {
    if (!this.app) {
      const [{ App }, { Octokit }] = await Promise.all([
        import('@octokit/app'),
        import('@octokit/rest'),
      ]);

      this.app = new App({
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_PRIVATE_KEY!,
        Octokit,
      });
    }

    return this.app;
  }

  async getPullRequestFiles(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<PullRequestFileDTO[]> {
    const app = await this.getApp();
    const octokit = (await app.getInstallationOctokit(
      installationId,
    )) as Octokit;

    const response: ListPullRequestFilesResponse =
      await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });

    return response.data.map((file) => ({
      filename: file.filename,
      patch: file.patch,
      changes: file.changes,
      additions: file.additions,
      deletions: file.deletions,
      blob_url: file.blob_url,
    }));
  }

  async postComment(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
  ) {
    const app = await this.getApp();
    const octokit = (await app.getInstallationOctokit(
      installationId,
    )) as Octokit;
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body,
    });
  }

  async getPullRequestHeaderSha(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<string> {
    const app = await this.getApp();
    const octokit = (await app.getInstallationOctokit(
      installationId,
    )) as Octokit;

    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return response.data.head.sha;
  }

  async postInlineReviewComment(params: {
    installationId: number;
    owner: string;
    repo: string;
    pullNumber: number;
    commitSha: string;
    filePath: string;
    line: number;
    side?: 'RIGHT' | 'LEFT';
    body: string;
  }) {
    const app = await this.getApp();
    const octokit = (await app.getInstallationOctokit(
      params.installationId,
    )) as Octokit;

    await octokit.rest.pulls.createReviewComment({
      owner: params.owner,
      repo: params.repo,
      pull_number: params.pullNumber,
      commit_id: params.commitSha,
      path: params.filePath,
      line: params.line,
      side: params.side ?? 'RIGHT',
      body: params.body,
    });
  }
}
