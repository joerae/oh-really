import type { AnalysisResponse } from "../types";

export const checkClaim = async (claim: string): Promise<AnalysisResponse> => {
  const response = await fetch("/.netlify/functions/check-claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ claim }),
  });

  let payload: Partial<AnalysisResponse> & { error?: string } = {};
  try {
    payload = await response.json();
  } catch {
    // The status code below still decides whether the request failed.
  }

  if (!response.ok) {
    throw new Error(payload.error || "Fact check failed.");
  }

  return {
    structuredResult: payload.structuredResult || null,
    rawGroundingChunks: Array.isArray(payload.rawGroundingChunks) ? payload.rawGroundingChunks : [],
  };
};
