export interface AIResponseDTO {
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
    };
  }>;
}
