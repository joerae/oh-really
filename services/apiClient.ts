import type { GenerateRequest, GenerateResult } from "../types";

interface GenerateFunctionResponse {
  text?: string;
  model?: string;
  requestId?: string;
  error?: string;
}

export class FunctionRequestError extends Error {
  requestId?: string;
  status?: number;

  constructor(message: string, options: { requestId?: string; status?: number } = {}) {
    super(message);
    this.name = "FunctionRequestError";
    this.requestId = options.requestId;
    this.status = options.status;
  }
}

export const generateText = async (request: GenerateRequest): Promise<GenerateResult> => {
  const response = await fetch("/.netlify/functions/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  let payload: GenerateFunctionResponse = {};
  try {
    payload = await response.json();
  } catch {
    // The status code still decides whether this request failed.
  }

  if (!response.ok || typeof payload.text !== "string") {
    const fallbackMessage = response.ok
      ? "The function returned an empty response."
      : "The function request failed.";
    const suffix = payload.requestId ? ` Reference: ${payload.requestId}` : "";

    throw new FunctionRequestError(`${payload.error || fallbackMessage}${suffix}`, {
      requestId: payload.requestId,
      status: response.status,
    });
  }

  return {
    text: payload.text,
    model: payload.model || request.model || "gemini-2.5-flash",
    requestId: payload.requestId || "",
  };
};
