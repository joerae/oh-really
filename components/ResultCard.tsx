import React from 'react';
import { AnalysisResponse } from '../types';
import SkepticismMeter from './SkepticismMeter';
import SourceList from './SourceList';
import { Info, ThumbsUp, ThumbsDown, MessageCircle, Search } from 'lucide-react';

interface ResultCardProps {
  data: AnalysisResponse;
  checkedClaim: string;
}

const getGoogleSearchUrl = (query: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const buildSuggestedSearches = (claim: string, verdictTitle: string) => {
  const baseClaim = claim.trim();
  const cleanVerdict = verdictTitle.replace(/^["']|["']$/g, "").trim();

  return [
    baseClaim,
    `${baseClaim} fact check`,
    `${baseClaim} evidence`,
    cleanVerdict && cleanVerdict.toLowerCase() !== baseClaim.toLowerCase()
      ? `${cleanVerdict} fact check`
      : `${baseClaim} myth`,
  ]
    .filter(Boolean)
    .filter((query, index, queries) => queries.indexOf(query) === index)
    .slice(0, 4);
};

const getAnalysisParagraphs = (text: string | undefined, fallback: string) => {
  const content = (text || fallback).trim();
  if (!content) return [fallback];

  const explicitParagraphs = content
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const normalized = content.replace(/\s+/g, " ");
  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=(?:["'])?[A-Z0-9])/)
    .map(sentence => sentence.trim())
    .filter(Boolean);

  if (normalized.length < 320 || sentences.length < 3) {
    return [normalized];
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" "));
  }

  return paragraphs;
};

const AnalysisText: React.FC<{ text?: string; fallback: string }> = ({ text, fallback }) => (
  <div className="text-gray-600 leading-relaxed flex-grow space-y-4">
    {getAnalysisParagraphs(text, fallback).map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ))}
  </div>
);

const ResultCard: React.FC<ResultCardProps> = ({ data, checkedClaim }) => {
  const { structuredResult, rawGroundingChunks } = data;

  if (!structuredResult) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Uh oh!</h2>
        <p className="text-gray-500">I couldn't quite structure the result, but I did some research. Try asking differently!</p>
      </div>
    );
  }

  const { 
      skepticismScore, 
      verdictTitle, 
      verdictSummary, 
      supportingAnalysis, 
      contradictingAnalysis,
      supportingSources, 
      contradictingSources 
  } = structuredResult;
  const hasCategorizedSources = Boolean(supportingSources?.length || contradictingSources?.length);
  const hasRawLinks = rawGroundingChunks.some(chunk => chunk.web?.uri);
  const suggestedSearches = !hasCategorizedSources && !hasRawLinks
    ? buildSuggestedSearches(checkedClaim, verdictTitle)
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header & Score Section */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                "{verdictTitle}"
            </h2>
             <div className="bg-purple-50 rounded-xl p-5 text-gray-700 text-lg leading-relaxed border border-purple-100 relative">
                <MessageCircle className="w-6 h-6 text-purple-300 absolute -top-3 -left-3 bg-white rounded-full" />
                <span className="font-semibold text-purple-900 block mb-1 text-xs uppercase tracking-wide">The Gist</span>
                {verdictSummary}
            </div>
        </div>
        <div className="flex-shrink-0">
            <SkepticismMeter score={skepticismScore} />
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid md:grid-cols-2 gap-6">
          {/* Supporting Analysis */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <ThumbsUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Why it might be true</h3>
            </div>
            <AnalysisText
              text={supportingAnalysis}
              fallback="No strong evidence found to support this claim."
            />
          </div>

          {/* Contradicting Analysis */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <ThumbsDown className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Why it's doubtful</h3>
            </div>
            <AnalysisText
              text={contradictingAnalysis}
              fallback="No strong contradictions found."
            />
          </div>
      </div>

      {/* Sources Section */}
      <div className="flex flex-wrap gap-6">
        {supportingSources && supportingSources.length > 0 && (
          <SourceList
            sources={supportingSources}
            type="supporting"
            grounded={data.useSearchGrounding === true}
          />
        )}
        {contradictingSources && contradictingSources.length > 0 && (
          <SourceList
            sources={contradictingSources}
            type="contradicting"
            grounded={data.useSearchGrounding === true}
          />
        )}
      </div>

      {/* Fallback for Empty Sources or Raw Grounding Data Transparency */}
      {(suggestedSearches.length > 0 || hasRawLinks) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center text-gray-500 mb-3">
                <Info className="w-4 h-4 mr-2" />
                <h4 className="text-sm font-semibold uppercase tracking-wider">
                  {hasRawLinks ? 'Research Notes & Raw Links' : 'Suggested Searches'}
                </h4>
            </div>
            {suggestedSearches.length > 0 && (
                <p className="text-gray-500 text-sm mb-4">
                    Search grounding was off for this check, so these are follow-up searches rather than sources I analyzed.
                </p>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedSearches.map((query) => (
                    <li key={query}>
                        <a
                            href={getGoogleSearchUrl(query)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-600 hover:underline text-sm"
                        >
                            <Search className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{query}</span>
                        </a>
                    </li>
                ))}
                {rawGroundingChunks.map((chunk, idx) => chunk.web?.uri ? (
                    <li key={idx}>
                        <a 
                            href={chunk.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline text-sm truncate block"
                        >
                            {chunk.web.title || chunk.web.uri}
                        </a>
                    </li>
                ) : null)}
            </ul>
        </div>
      )}
      {(data.model || data.requestId) && (
        <div className="text-center text-xs text-gray-400 font-mono">
          {[
            data.model ? `model: ${data.model}` : "",
            `search: ${data.useSearchGrounding === false ? "off" : "on"}`,
            data.requestId ? `request: ${data.requestId}` : "",
          ]
            .filter(Boolean)
            .join(" | ")}
        </div>
      )}
    </div>
  );
};

export default ResultCard;
