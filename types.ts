export interface Source {
  title: string;
  url: string;
  trustworthiness: string;
}

export interface FactCheckResult {
  skepticismScore: number; // 0 to 95 (never 100)
  verdictTitle: string;
  verdictSummary: string;
  supportingAnalysis: string;
  contradictingAnalysis: string;
  supportingSources: Source[];
  contradictingSources: Source[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisResponse {
  structuredResult: FactCheckResult | null;
  rawGroundingChunks: GroundingChunk[];
}