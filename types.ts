export interface GenerateRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
  requestId: string;
}
