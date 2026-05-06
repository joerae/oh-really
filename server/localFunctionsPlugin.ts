import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { generateWithGeminiServer } from "./gemini";
import { createRequestId, logError, logInfo, logWarn } from "./logger";

interface LocalFunctionsPluginOptions {
  apiKey?: string;
}

const MAX_BODY_SIZE = 1_000_000;

const readJsonBody = async (request: IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", chunk => {
      body += chunk;

      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
};

const sendJson = (response: ServerResponse, statusCode: number, payload: Record<string, unknown>) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
};

export const createLocalFunctionsPlugin = ({
  apiKey,
}: LocalFunctionsPluginOptions = {}): Plugin => ({
  name: "local-netlify-functions",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const pathname = request.url?.split("?")[0];

      if (pathname === "/.netlify/functions/generate") {
        const requestId = createRequestId();
        const startedAt = Date.now();

        if (request.method !== "POST") {
          logWarn("generate_method_not_allowed", {
            requestId,
            method: request.method,
            runtime: "vite-dev",
          });
          sendJson(response, 405, { error: "Method not allowed.", requestId });
          return;
        }

        try {
          const body = await readJsonBody(request);
          const prompt = typeof body.prompt === "string" ? body.prompt : "";

          if (!prompt.trim()) {
            sendJson(response, 400, { error: "Prompt is required.", requestId });
            return;
          }

          logInfo("generate_started", {
            requestId,
            promptLength: prompt.length,
            runtime: "vite-dev",
          });

          const result = await generateWithGeminiServer({
            apiKey,
            prompt,
            systemInstruction:
              typeof body.systemInstruction === "string" ? body.systemInstruction : undefined,
            model: typeof body.model === "string" ? body.model : undefined,
            temperature: typeof body.temperature === "number" ? body.temperature : undefined,
          });

          logInfo("generate_completed", {
            requestId,
            durationMs: Date.now() - startedAt,
            model: result.model,
            runtime: "vite-dev",
          });

          sendJson(response, 200, { ...result, requestId });
        } catch (error) {
          logError("generate_failed", {
            requestId,
            durationMs: Date.now() - startedAt,
            runtime: "vite-dev",
            error,
          });

          sendJson(response, 500, {
            error: "Generation failed. Please try again later.",
            requestId,
          });
        }

        return;
      }

      if (pathname === "/.netlify/functions/log-error") {
        const requestId = createRequestId();

        if (request.method !== "POST") {
          sendJson(response, 405, { error: "Method not allowed.", requestId });
          return;
        }

        try {
          const body = await readJsonBody(request);

          logError("client_error", {
            requestId,
            runtime: "vite-dev",
            source: body.source,
            name: body.name,
            message: body.message,
            stack: body.stack,
            url: body.url,
            userAgent: body.userAgent,
            metadata: body.metadata,
          });

          sendJson(response, 200, { ok: true, requestId });
        } catch (error) {
          logError("client_error_logging_failed", {
            requestId,
            runtime: "vite-dev",
            error,
          });

          sendJson(response, 400, {
            error: "Invalid log payload.",
            requestId,
          });
        }

        return;
      }

      next();
    });
  },
});
