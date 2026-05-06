import React from 'react';
import { AnalysisResponse } from '../types';
import SkepticismMeter from './SkepticismMeter';
import SourceList from './SourceList';
import { Info, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

interface ResultCardProps {
  data: AnalysisResponse;
}

const ResultCard: React.FC<ResultCardProps> = ({ data }) => {
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
            <p className="text-gray-600 leading-relaxed flex-grow">
                {supportingAnalysis || "No strong evidence found to support this claim."}
            </p>
          </div>

          {/* Contradicting Analysis */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <ThumbsDown className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Why it's doubtful</h3>
            </div>
            <p className="text-gray-600 leading-relaxed flex-grow">
                {contradictingAnalysis || "No strong contradictions found."}
            </p>
          </div>
      </div>

      {/* Sources Section */}
      <div className="flex flex-wrap gap-6">
        {supportingSources && supportingSources.length > 0 && (
          <SourceList sources={supportingSources} type="supporting" />
        )}
        {contradictingSources && contradictingSources.length > 0 && (
          <SourceList sources={contradictingSources} type="contradicting" />
        )}
      </div>

      {/* Fallback for Empty Sources or Raw Grounding Data Transparency */}
      {((!supportingSources?.length && !contradictingSources?.length) || rawGroundingChunks.length > 0) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center text-gray-500 mb-3">
                <Info className="w-4 h-4 mr-2" />
                <h4 className="text-sm font-semibold uppercase tracking-wider">Research Notes & Raw Links</h4>
            </div>
            {(!supportingSources?.length && !contradictingSources?.length) && (
                <p className="text-gray-500 text-sm mb-4">
                    I couldn't categorize specific sites as strictly "supporting" or "contradicting", but here are the sources I analyzed:
                </p>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
    </div>
  );
};

export default ResultCard;