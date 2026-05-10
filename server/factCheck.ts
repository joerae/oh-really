import { GoogleGenAI } from "@google/genai";
import type { AnalysisResponse, FactCheckResult, GroundingChunk, Source } from "../types";
import { buildFactCheckPrompt } from "./factCheckPrompt";

interface ServerFactCheckRequest {
  apiKey?: string;
  claim: string;
  model?: string;
  useSearchGrounding?: boolean;
}

export const DEFAULT_FACT_CHECK_MODEL = "gemini-3-flash-preview";

const normalizeTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getTitleTokens = (title: string) => {
  const stopWords = new Set([
    "about",
    "after",
    "from",
    "have",
    "into",
    "over",
    "that",
    "the",
    "this",
    "with",
    "your",
  ]);

  return normalizeTitle(title)
    .split(" ")
    .filter(token => token.length > 3 && !stopWords.has(token));
};

const getSourceDomain = (source: Source) => {
  if (!source.url) return "";

  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const sourceMatches = (left: Source, right: Source) => {
  const leftTitle = normalizeTitle(left.title);
  const rightTitle = normalizeTitle(right.title);
  const leftDomain = getSourceDomain(left);
  const rightDomain = getSourceDomain(right);

  return Boolean(
    (leftTitle && rightTitle && leftTitle === rightTitle) ||
      (left.url && right.url && left.url === right.url) ||
      (leftDomain && rightDomain && leftDomain === rightDomain),
  );
};

const parseStructuredResult = (text: string): FactCheckResult | null => {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const possibleJson = jsonMatch?.[1] || text.trim();

  if (!possibleJson.startsWith("{") || !possibleJson.endsWith("}")) {
    return null;
  }

  try {
    return JSON.parse(possibleJson) as FactCheckResult;
  } catch {
    return null;
  }
};

const attachGroundingUrls = (
  structuredResult: FactCheckResult | null,
  groundingChunks: GroundingChunk[],
) => {
  if (!structuredResult) return;

  structuredResult.skepticismScore = Math.min(
    95,
    Math.max(0, Number(structuredResult.skepticismScore) || 0),
  );

  const resolveUrl = (sourceTitle: string) => {
    const cleanSourceTitle = normalizeTitle(sourceTitle);
    const sourceTokens = getTitleTokens(sourceTitle);

    const match = groundingChunks.find(chunk => {
      const chunkTitle = chunk.web?.title ? normalizeTitle(chunk.web.title) : "";
      return (
        chunkTitle &&
        (chunkTitle.includes(cleanSourceTitle) ||
          cleanSourceTitle.includes(chunkTitle) ||
          sourceTokens.some(token => chunkTitle.includes(token)))
      );
    });

    return match?.web?.uri || "";
  };

  structuredResult.supportingSources?.forEach(source => {
    source.url = resolveUrl(source.title);
  });

  structuredResult.contradictingSources?.forEach(source => {
    source.url = resolveUrl(source.title);
  });

  structuredResult.contradictingSources = (structuredResult.contradictingSources || []).filter(
    contradictingSource =>
      !(structuredResult.supportingSources || []).some(supportingSource =>
        sourceMatches(supportingSource, contradictingSource),
      ),
  );
};

export const checkClaimWithGeminiServer = async ({
  apiKey,
  claim,
  model = DEFAULT_FACT_CHECK_MODEL,
  useSearchGrounding = false,
}: ServerFactCheckRequest): Promise<AnalysisResponse> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!claim.trim()) {
    throw new Error("Claim is required.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = model.trim() || DEFAULT_FACT_CHECK_MODEL;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: buildFactCheckPrompt(claim, useSearchGrounding),
    config: {
      tools: useSearchGrounding ? [{ googleSearch: {} }] : undefined,
      temperature: 0.3,
    },
  });

  const text = response.text || "";
  const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ||
    []) as GroundingChunk[];
  const structuredResult = parseStructuredResult(text);

  attachGroundingUrls(structuredResult, groundingChunks);

  return {
    model: modelName,
    useSearchGrounding,
    structuredResult,
    rawGroundingChunks: groundingChunks,
  };
};
