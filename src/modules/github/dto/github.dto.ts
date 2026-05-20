import type { RestEndpointMethodTypes } from '@octokit/rest';

export type ListPullRequestFilesResponse =
  RestEndpointMethodTypes['pulls']['listFiles']['response'];

export interface PullRequestFileDTO {
  filename: string;
  patch?: string;
  changes: number;
  additions: number;
  deletions: number;
  blob_url: string;
}
