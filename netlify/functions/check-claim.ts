import { checkClaimWithGeminiServer } from "../../server/factCheck";
import { createRequestId, logError, logInfo, logWarn } from "../../server/logger";

const jsonResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const safeParseBody = (body: string | null) => {
  if (!body) return {};
  return JSON.parse(body);
};

export const handler = async (event: any, context: any) => {
  const requestId = context?.awsRequestId || createRequestId();
  const startedAt = Date.now();

  if (event.httpMethod !== "POST") {
    logWarn("check_claim_method_not_allowed", {
      requestId,
      method: event.httpMethod,
    });

    return jsonResponse(405, {
      error: "Method not allowed.",
      requestId,
    });
  }

  let body: any;
  try {
    body = safeParseBody(event.body);
  } catch (error) {
    logWarn("check_claim_invalid_json", {
      requestId,
      error,
    });

    return jsonResponse(400, {
      error: "Invalid JSON body.",
      requestId,
    });
  }

  const claim = typeof body.claim === "string" ? body.claim : "";
  if (!claim.trim()) {
    return jsonResponse(400, {
      error: "Claim is required.",
      requestId,
    });
  }

  try {
    logInfo("check_claim_started", {
      requestId,
      claimLength: claim.length,
      deployContext: process.env.CONTEXT,
      siteName: process.env.SITE_NAME,
    });

    const result = await checkClaimWithGeminiServer({
      apiKey: process.env.GEMINI_API_KEY,
      claim,
    });

    logInfo("check_claim_completed", {
      requestId,
      durationMs: Date.now() - startedAt,
    });

    return jsonResponse(200, {
      ...result,
      requestId,
    });
  } catch (error) {
    logError("check_claim_failed", {
      requestId,
      durationMs: Date.now() - startedAt,
      error,
    });

    return jsonResponse(500, {
      error: "Fact check failed. Please try again later.",
      requestId,
    });
  }
};
