import React, { useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
import { generateText } from "./services/apiClient";
import { logClientError } from "./services/errorLogger";

type RequestStatus = "idle" | "loading" | "success" | "error";

const DEFAULT_PROMPT =
  "Create a concise launch checklist for moving a Google AI Studio React app to Netlify.";

function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "loading";
  const canSubmit = prompt.trim().length > 0 && !isLoading;

  const handleGenerate = async () => {
    if (!canSubmit) return;

    setStatus("loading");
    setError(null);

    try {
      const result = await generateText({
        prompt,
        systemInstruction:
          "You are a concise product engineer. Give practical, implementation-ready answers.",
        temperature: 0.4,
      });

      setOutput(result.text);
      setStatus("success");
    } catch (err) {
      logClientError(err, {
        source: "handleGenerate",
        metadata: {
          promptLength: prompt.length,
        },
      });

      setError(err instanceof Error ? err.message : "Generation failed.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
    setOutput("");
    setError(null);
    setStatus("idle");
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                AI Studio Netlify Template
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Vite, React, Gemini, and Netlify Functions
              </p>
            </div>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm">
            Gemini runs server-side
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-base font-semibold">Prompt</h2>
              <span className="text-xs tabular-nums text-zinc-500">{prompt.length} chars</span>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <textarea
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                className="min-h-[360px] resize-y rounded-md border border-zinc-300 bg-white p-3 text-sm leading-6 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                placeholder="Enter a prompt for Gemini"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canSubmit}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  Generate
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-base font-semibold">Response</h2>
              <span className="text-xs uppercase tracking-wide text-zinc-500">{status}</span>
            </div>
            <div className="min-h-[456px] p-4">
              {error ? (
                <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              ) : output ? (
                <pre className="whitespace-pre-wrap rounded-md bg-zinc-950 p-4 text-sm leading-6 text-zinc-50">
                  {output}
                </pre>
              ) : (
                <div className="grid min-h-[424px] place-items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-6 text-center text-sm text-zinc-500">
                  Output appears here after a successful request.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
