import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { checkClaim, FactCheckRequestError } from './services/geminiService';
import { AnalysisResponse } from './types';
import ResultCard from './components/ResultCard';
import { versionHistory } from './versionHistory';

interface DisplayError {
  message: string;
  detail?: string;
  model?: string;
  providerCode?: number;
  providerStatus?: string;
  requestId?: string;
  status?: number;
}

const enableSearchGrounding = import.meta.env.VITE_ENABLE_SEARCH_GROUNDING === 'true';

const suggestedClaims = [
  "Octopuses have three hearts",
  "Lightning can strike the same place twice",
  "Cracking your knuckles causes arthritis",
  "The Great Wall of China is visible from space",
  "Humans only use 10% of their brains",
];

const App: React.FC = () => {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<DisplayError | null>(null);
  const [progress, setProgress] = useState(0);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [checkedClaim, setCheckedClaim] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const claimToCheck = claim.trim();
    if (!claimToCheck) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setCheckedClaim(claimToCheck);

    try {
      const data = await checkClaim(claimToCheck, {
        useSearchGrounding: enableSearchGrounding && useSearchGrounding,
      });
      setResult(data);
    } catch (err) {
      if (err instanceof FactCheckRequestError) {
        setError({
          message: err.message,
          detail: err.detail,
          model: err.model,
          providerCode: err.providerCode,
          providerStatus: err.providerStatus,
          requestId: err.requestId,
          status: err.status,
        });
      } else {
        setError({
          message: err instanceof Error ? err.message : "Fact check failed.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [
    "Rummaging through the evidence...",
    "Testing the claim from a few angles...",
    "Putting on my reading glasses...",
    "Fact-checking at light speed...",
    "Separating truth from fiction...",
    "Checking for missing context...",
    "Looking for the boring-but-important caveats...",
    "Analyzing context and nuance..."
  ];
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);

  // Loading animation logic
  useEffect(() => {
    let msgInterval: number;
    let progressInterval: number;

    if (loading) {
      // Rotate messages
      msgInterval = window.setInterval(() => {
        setLoadingMsg(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      }, 3000);

      // Progress bar animation (target ~60s to 95%)
      setProgress(0);
      progressInterval = window.setInterval(() => {
        setProgress(prev => {
           // Slow down as we get closer to 95%
           // Initial jump is faster
           const target = 95;
           const distance = target - prev;
           // If we have a lot of distance, move faster (0.3). If close, move slower (0.05).
           // This curve ensures it takes roughly a minute to get really high.
           const increment = Math.max(0.05, distance * 0.008); 
           return Math.min(prev + increment, 95);
        });
      }, 100);

    } else {
      // If done, jump to 100 (though user might not see it if component unmounts/swaps)
      setProgress(100);
    }

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [loading]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6 sticky top-0 z-50 bg-opacity-90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setResult(null); setClaim(''); setCheckedClaim('');}}>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg transform -rotate-3">
              <span className="text-white font-bold text-xl">?!</span>
            </div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Oh Really???</h1>
          </div>
          <div className="text-sm font-medium text-gray-500 hidden sm:block">
            Your friendly skeptical fact-checker
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 w-full py-8">
        
        {/* Search Input Section */}
        <div className={`transition-all duration-500 ease-in-out ${result ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center'}`}>
          
          {!result && (
            <div className="text-center mb-10 space-y-4 animate-fade-in-down">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                Heard something <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">wild?</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Type in a claim, rumor, or factoid. I'll scour the web to see if it holds water or if it's total nonsense.
              </p>
            </div>
          )}

          <form onSubmit={handleCheck} className="relative max-w-2xl mx-auto w-full group">
            <div className="absolute inset-0 bg-purple-200 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative flex items-center bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent focus-within:border-purple-500 transition-colors duration-300">
              <input
                type="text"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g., 'Do octopuses actually have three hearts?'"
                className="flex-1 px-6 py-5 text-lg text-gray-800 placeholder-gray-400 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !claim.trim()}
                className="mr-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-bold text-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <span>Check it!</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {!result && !loading && (
            <div className="mt-5 max-w-2xl mx-auto w-full animate-fade-in">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-center">
                Try a suggested check
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedClaims.map((suggestedClaim) => (
                  <button
                    key={suggestedClaim}
                    type="button"
                    onClick={() => {
                      setClaim(suggestedClaim);
                      setError(null);
                    }}
                    className="max-w-full px-3 py-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-lg transition-colors break-words"
                  >
                    {suggestedClaim}
                  </button>
                ))}
              </div>
            </div>
          )}

          {enableSearchGrounding && (
            <label className="mt-4 max-w-2xl mx-auto w-full flex items-center gap-3 text-sm font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={useSearchGrounding}
                onChange={(e) => setUseSearchGrounding(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Use Google Search grounding</span>
            </label>
          )}

          {loading && (
            <div className="mt-8 w-full max-w-xl mx-auto text-center space-y-3 animate-fade-in">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-purple-700">
                <span>Researching...</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="h-6 w-full overflow-hidden">
                <p className="block w-full truncate text-gray-500 italic text-sm">{loadingMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 animate-fade-in">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error.message}</p>
              {error.detail && (
                <p className="mt-2 text-sm text-red-700">{error.detail}</p>
              )}
              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-red-700">
                {error.model && (
                  <>
                    <dt className="font-semibold">Model</dt>
                    <dd className="font-mono break-all">{error.model}</dd>
                  </>
                )}
                {(error.providerStatus || error.providerCode) && (
                  <>
                    <dt className="font-semibold">Gemini status</dt>
                    <dd className="font-mono">
                      {[error.providerStatus, error.providerCode].filter(Boolean).join(" ")}
                    </dd>
                  </>
                )}
                {error.status && (
                  <>
                    <dt className="font-semibold">HTTP status</dt>
                    <dd className="font-mono">{error.status}</dd>
                  </>
                )}
                {error.requestId && (
                  <>
                    <dt className="font-semibold">Request ID</dt>
                    <dd className="font-mono break-all">{error.requestId}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <ResultCard data={result} checkedClaim={checkedClaim} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 mt-auto bg-white/80 backdrop-blur-sm">
        <p className="font-semibold mb-1 text-gray-700">Made by John Raeburns VII and IX, 2025</p>
        <p className="text-xs text-gray-400 mb-4">Powered by Gemini Flash</p>
        
        <div className="flex flex-col items-center">
            <button 
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="text-xs text-purple-500 hover:text-purple-700 font-medium hover:underline transition-colors mb-2 focus:outline-none"
            >
                {showVersionHistory ? 'Hide Version History' : 'Show Version History'}
            </button>

            {showVersionHistory && (
                <div className="w-full max-w-md bg-white border border-gray-100 rounded-xl shadow-lg p-5 text-left mx-4 transform transition-all duration-300 ease-out">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Update Log</h4>
                    <div className="space-y-3">
                        {[...versionHistory].reverse().map((ver, idx) => (
                            <div key={idx} className="flex gap-3 text-xs items-start">
                                <span className="font-mono font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded shrink-0">v{ver.version}</span>
                                <span className="text-gray-600 leading-tight py-0.5">{ver.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </footer>
    </div>
  );
};

export default App;
