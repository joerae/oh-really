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

const getPublicErrorMessage = (provider: GeminiProviderError) => {
  if (provider.status === "RESOURCE_EXHAUSTED" || provider.code === 429) {
    return {
      error:
        "Gemini quota looks exhausted. The API key may be out of free credits, over its rate limit, or missing billing access.",
      detail:
        "Try again later, switch to another Gemini API key, or check the Google AI Studio / Google Cloud quota and billing settings for this key.",
    };
  }

  if (provider.status === "UNAVAILABLE" || provider.code === 503) {
    return {
      error: "Gemini is not responding right now.",
      detail:
        "This usually means the Gemini API is temporarily unavailable or overloaded. Try again in a few minutes.",
    };
  }

  if (provider.code === 401 || provider.code === 403 || provider.status === "PERMISSION_DENIED") {
    return {
      error: "Gemini rejected the API key or model access.",
      detail:
        "Check that GEMINI_API_KEY is valid, has access to the selected model, and is enabled for this deployment.",
    };
  }

  if (provider.message?.includes("GEMINI_API_KEY is not configured")) {
    return {
      error: "Gemini API key is not configured.",
      detail: "Set GEMINI_API_KEY in the local .env.local file or in the Netlify site environment.",
    };
  }

  if (provider.message?.includes("Gemini returned an empty response")) {
    return {
      error: "Gemini did not return a fact check.",
      detail:
        "The API responded without usable content. This can happen when the key is out of credits, rate-limited, or Gemini is temporarily unable to answer.",
    };
  }

  return {
    error: "Gemini API request failed.",
    detail: provider.message || "Unknown Gemini API error.",
  };
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
  const publicMessage = getPublicErrorMessage(provider);

  return {
    statusCode,
    payload: {
      error: publicMessage.error,
      detail: publicMessage.detail,
      model,
      providerCode: provider.code,
      providerStatus: provider.status,
      retryable,
    },
  };
};
