export interface PayloadDTO {
  action: string;
  installation: {
    id: number;
  };
  pull_request: PullRequestDTO;
}

export interface PullRequestDTO {
  number: number;
  base: {
    repo: {
      full_name: string;
    };
  };
  title: string;
  user: {
    login: string;
  };
}
