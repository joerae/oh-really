import React, { useState, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { checkClaim } from './services/geminiService';
import { AnalysisResponse } from './types';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Version history data
  const versions = [
    { version: '1.0', desc: 'Initial release of Oh Really???' },
    { version: '1.1', desc: 'Added charitable interpretation to claim analysis' },
    { version: '1.2', desc: 'Implemented clickable source links and fallback search' },
    { version: '1.3', desc: 'Added 60s progress bar for deep research' },
    { version: '1.4', desc: 'Redesigned skepticism meter and result layout' },
    { version: '1.5', desc: 'Added footer credits and version tracker' },
  ];

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const data = await checkClaim(claim);
      setResult(data);
    } catch (err) {
      setError("Oops! My research brain got a bit scrambled. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [
    "Rumaging through the internet...",
    "Interrogating search engines...",
    "Putting on my reading glasses...",
    "Fact-checking at light speed...",
    "Separating truth from fiction...",
    "Consulting the archives of knowledge...",
    "Double-checking the sources...",
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setResult(null); setClaim('');}}>
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

          {loading && (
            <div className="mt-8 max-w-xl mx-auto text-center space-y-3 animate-fade-in">
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
              <div className="h-6 overflow-hidden">
                <p className="text-gray-500 italic text-sm">{loadingMsg}</p>
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
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <ResultCard data={result} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-200 mt-auto bg-white/80 backdrop-blur-sm">
        <p className="font-semibold mb-1 text-gray-700">Made by John Raeburns VII and IX, 2025</p>
        <p className="text-xs text-gray-400 mb-4">Powered by Gemini 2.5 & Google Search Grounding</p>
        
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
                        {[...versions].reverse().map((ver, idx) => (
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