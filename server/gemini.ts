import { GoogleGenAI } from "@google/genai";
import type { GenerateRequest } from "../types";

interface ServerGenerateRequest extends GenerateRequest {
  apiKey?: string;
}

interface ServerGenerateResult {
  text: string;
  model: string;
}

const DEFAULT_MODEL = "gemini-2.5-flash";

const normalizeTemperature = (temperature: unknown): number | undefined => {
  if (typeof temperature !== "number" || Number.isNaN(temperature)) return undefined;
  return Math.max(0, Math.min(2, temperature));
};

export const generateWithGeminiServer = async ({
  apiKey,
  prompt,
  systemInstruction,
  model = DEFAULT_MODEL,
  temperature,
}: ServerGenerateRequest): Promise<ServerGenerateResult> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!prompt.trim()) {
    throw new Error("Prompt is required.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: normalizeTemperature(temperature),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    text,
    model,
  };
};
