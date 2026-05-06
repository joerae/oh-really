const API_KEY_PATTERN = /AIza[0-9A-Za-z\-_]{20,}/g;

interface GeminiProviderError {
  code?: number;
  status?: string;
  message?: string;
}

export interface PublicGeminiError {
  statusCode: number;
  payload: {
    error: string;
    detail?: string;
    model?: string;
    providerCode?: number;
    providerStatus?: string;
    retryable?: boolean;
  };
}

const scrub = (value: string) => value.replace(API_KEY_PATTERN, "[redacted-google-api-key]");

const parseProviderError = (error: unknown): GeminiProviderError => {
  if (!(error instanceof Error)) {
    return {
      message: scrub(String(error)),
    };
  }

  const message = scrub(error.message);

  try {
    const parsed = JSON.parse(message) as { error?: GeminiProviderError };
    if (parsed.error) {
      return {
        code: parsed.error.code,
        status: parsed.error.status,
        message: parsed.error.message ? scrub(parsed.error.message) : message,
      };
    }
  } catch {
    // Plain Error messages are handled below.
  }

  return { message };
};

export const toPublicGeminiError = (error: unknown, model?: string): PublicGeminiError => {
  const provider = parseProviderError(error);
  const retryable =
    provider.code === 429 ||
    provider.code === 503 ||
    provider.status === "RESOURCE_EXHAUSTED" ||
    provider.status === "UNAVAILABLE";
  const statusCode =
    provider.code && provider.code >= 400 && provider.code <= 599 ? provider.code : 500;
  const detail = provider.message || "Unknown Gemini API error.";
  const retryHint = retryable ? " This is usually temporary; retrying later may work." : "";

  return {
    statusCode,
    payload: {
      error: `Gemini API request failed.${retryHint}`,
      detail,
      model,
      providerCode: provider.code,
      providerStatus: provider.status,
      retryable,
    },
  };
};
