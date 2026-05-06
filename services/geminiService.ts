import type { AnalysisResponse } from "../types";

interface CheckClaimErrorResponse {
  error?: string;
  detail?: string;
  model?: string;
  providerCode?: number;
  providerStatus?: string;
  requestId?: string;
  retryable?: boolean;
}

export class FactCheckRequestError extends Error {
  detail?: string;
  model?: string;
  providerCode?: number;
  providerStatus?: string;
  requestId?: string;
  retryable?: boolean;
  status?: number;

  constructor(
    message: string,
    options: CheckClaimErrorResponse & { status?: number } = {},
  ) {
    super(message);
    this.name = "FactCheckRequestError";
    this.detail = options.detail;
    this.model = options.model;
    this.providerCode = options.providerCode;
    this.providerStatus = options.providerStatus;
    this.requestId = options.requestId;
    this.retryable = options.retryable;
    this.status = options.status;
  }
}

interface CheckClaimOptions {
  useSearchGrounding: boolean;
}

export const checkClaim = async (
  claim: string,
  { useSearchGrounding }: CheckClaimOptions,
): Promise<AnalysisResponse> => {
  const response = await fetch("/.netlify/functions/check-claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ claim, useSearchGrounding }),
  });

  let payload: Partial<AnalysisResponse> & CheckClaimErrorResponse = {};
  try {
    payload = await response.json();
  } catch {
    // The status code below still decides whether the request failed.
  }

  if (!response.ok) {
    throw new FactCheckRequestError(payload.error || "Fact check failed.", {
      detail: payload.detail,
      model: payload.model,
      providerCode: payload.providerCode,
      providerStatus: payload.providerStatus,
      requestId: payload.requestId,
      retryable: payload.retryable,
      status: response.status,
    });
  }

  return {
    model: payload.model,
    requestId: payload.requestId,
    useSearchGrounding: payload.useSearchGrounding,
    structuredResult: payload.structuredResult || null,
    rawGroundingChunks: Array.isArray(payload.rawGroundingChunks) ? payload.rawGroundingChunks : [],
  };
};
