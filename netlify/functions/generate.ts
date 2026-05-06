import { generateWithGeminiServer } from "../../server/gemini";
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
    logWarn("generate_method_not_allowed", {
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
    logWarn("generate_invalid_json", {
      requestId,
      error,
    });

    return jsonResponse(400, {
      error: "Invalid JSON body.",
      requestId,
    });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  if (!prompt.trim()) {
    return jsonResponse(400, {
      error: "Prompt is required.",
      requestId,
    });
  }

  try {
    logInfo("generate_started", {
      requestId,
      promptLength: prompt.length,
      deployContext: process.env.CONTEXT,
      siteName: process.env.SITE_NAME,
    });

    const result = await generateWithGeminiServer({
      prompt,
      systemInstruction:
        typeof body.systemInstruction === "string" ? body.systemInstruction : undefined,
      model: typeof body.model === "string" ? body.model : undefined,
      temperature: typeof body.temperature === "number" ? body.temperature : undefined,
      apiKey: process.env.GEMINI_API_KEY,
    });

    logInfo("generate_completed", {
      requestId,
      durationMs: Date.now() - startedAt,
      model: result.model,
    });

    return jsonResponse(200, {
      ...result,
      requestId,
    });
  } catch (error) {
    logError("generate_failed", {
      requestId,
      durationMs: Date.now() - startedAt,
      error,
    });

    return jsonResponse(500, {
      error: "Generation failed. Please try again later.",
      requestId,
    });
  }
};
