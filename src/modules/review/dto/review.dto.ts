export interface JobDataDTO {
  prNumber: number;
  repoFullName: string;
  title: string;
  owner: string;
  installationId: number;
  headSha: string;
}

export interface fileDiffDTO {
  filename: string;
  patch?: string;
}

export interface ReviewResultDTO {
  summary: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  overallScore: number;
  issues: issuesDTO;
  comments: commentsDTO[];
  side?: 'RIGHT' | 'LEFT';
}

interface issuesDTO {
  critical: number;
  warning: number;
  info: number;
}

interface commentsDTO {
  filePath: string;
  line: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  side?: 'RIGHT' | 'LEFT';
  issue: string;
  suggestion: string;
}
