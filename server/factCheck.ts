import { GoogleGenAI } from "@google/genai";
import type { AnalysisResponse, FactCheckResult, GroundingChunk } from "../types";

interface ServerFactCheckRequest {
  apiKey?: string;
  claim: string;
}

const MODEL = "gemini-2.5-flash";

const buildPrompt = (claim: string) => `
You are "Oh Really???", a playful, smart, and skeptical fact-checking assistant.

CRITICAL INSTRUCTION ON INTERPRETATION:
Before researching, interpret the user's claim charitably and in the most logical context.
Do not be pedantic or literal-minded if the user uses colloquialisms or loose phrasing.

Example:
User: "The brain stops at 83."
Bad Interpretation: "The human brain ceases biological function and the person dies at 83."
Good Interpretation: "The user likely means a specific phase of brain development or growth ends at age 83."

ALWAYS fact-check the intended, most reasonable version of the claim.

Your goal is to verify the following claim: "${claim}".

Step 1: Use Google Search to find information about this claim. Look for reputable sources that support it and reputable sources that contradict it.
Step 2: Assess the credibility of these sources.
Step 3: Assign a "Skepticism Score" from 0 to 95.
- 0 means "Totally True / Verified Fact".
- 50 means "Debatable / Mixed Evidence / Context Missing".
- 95 means "Complete Hogwash / False".
- IMPORTANT: NEVER return a score higher than 95. We never want to be 100% certain of falsehood.
Step 4: Formulate a playful verdict title.

Output ONLY a valid JSON object wrapped in a markdown code block (\`\`\`json ... \`\`\`).
The JSON must match this structure:
{
  "skepticismScore": number,
  "verdictTitle": string,
  "verdictSummary": "A 1-2 sentence high-level summary of the verdict.",
  "supportingAnalysis": "A short, distinct paragraph explaining evidence that supports the claim or why someone might think it is true.",
  "contradictingAnalysis": "A short, distinct paragraph explaining evidence that contradicts the claim or adds missing context.",
  "supportingSources": [
    { "title": "Exact Page Title from Search Result", "url": "", "trustworthiness": "High/Medium/Low - reason" }
  ],
  "contradictingSources": [
    { "title": "Exact Page Title from Search Result", "url": "", "trustworthiness": "High/Medium/Low - reason" }
  ]
}

IMPORTANT FOR SOURCES:
- Leave the "url" field empty in the JSON. The server will match your selected titles to the actual links.
- Ensure you copy the "title" EXACTLY as it appears in the search tool output so the server can find the correct link.
`;

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
    const cleanSourceTitle = sourceTitle.toLowerCase();

    const match = groundingChunks.find(chunk => {
      const chunkTitle = chunk.web?.title?.toLowerCase();
      return (
        chunkTitle &&
        (chunkTitle.includes(cleanSourceTitle) || cleanSourceTitle.includes(chunkTitle))
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
};

export const checkClaimWithGeminiServer = async ({
  apiKey,
  claim,
}: ServerFactCheckRequest): Promise<AnalysisResponse> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!claim.trim()) {
    throw new Error("Claim is required.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(claim),
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.3,
    },
  });

  const text = response.text || "";
  const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ||
    []) as GroundingChunk[];
  const structuredResult = parseStructuredResult(text);

  attachGroundingUrls(structuredResult, groundingChunks);

  return {
    structuredResult,
    rawGroundingChunks: groundingChunks,
  };
};
