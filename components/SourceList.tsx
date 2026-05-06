import React from 'react';
import { Source } from '../types';
import { ExternalLink, CheckCircle, AlertTriangle, Search } from 'lucide-react';

interface SourceListProps {
  sources: Source[];
  type: 'supporting' | 'contradicting';
}

const SourceList: React.FC<SourceListProps> = ({ sources, type }) => {
  if (!sources || sources.length === 0) return null;

  const isSupporting = type === 'supporting';
  const borderColor = isSupporting ? 'border-green-200' : 'border-red-200';
  const bgColor = isSupporting ? 'bg-green-50' : 'bg-red-50';
  const titleColor = isSupporting ? 'text-green-800' : 'text-red-800';
  const Icon = isSupporting ? CheckCircle : AlertTriangle;

  return (
    <div className={`flex-1 min-w-[300px] p-4 rounded-xl border-2 ${borderColor} ${bgColor} transition-all hover:shadow-md`}>
      <h3 className={`flex items-center text-lg font-bold mb-4 ${titleColor}`}>
        <Icon className="w-5 h-5 mr-2" />
        {isSupporting ? 'Supporting Evidence' : 'Contradicting Evidence'}
      </h3>
      <div className="space-y-3">
        {sources.slice(0, 3).map((source, index) => {
           const isValidUrl = source.url && source.url.startsWith('http') && !source.url.includes('grounding.google');
           const href = isValidUrl
                ? source.url
                : `https://www.google.com/search?q=${encodeURIComponent(source.title)}`;
            
           return (
            <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
                >
                <div className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors flex items-start justify-between">
                    <span className="line-clamp-2 leading-tight">{source.title || 'Unknown Source'}</span>
                    {isValidUrl ? (
                        <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0 text-gray-400 group-hover:text-purple-500" />
                    ) : (
                        <Search className="w-4 h-4 ml-2 flex-shrink-0 text-gray-400 group-hover:text-purple-500" />
                    )}
                </div>
                {isValidUrl ? (
                    <div className="text-xs text-gray-400 mt-1 truncate">{new URL(source.url).hostname}</div>
                ) : (
                    <div className="text-xs text-gray-400 mt-1">Learn more</div>
                )}
                </a>
                <div className="mt-2 text-xs font-medium text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                Trustworthiness: {source.trustworthiness}
                </div>
            </div>
        );
        })}
      </div>
    </div>
  );
};

export default SourceList;
