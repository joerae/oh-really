# Code Decisions

This file records major implementation decisions so future contributors understand why the code is shaped the way it is. Add a new entry only when a change affects architecture, primary data flow, API boundaries, prompt ownership, deployment behavior, security posture, or another durable project-level path.

## Decision Log

### 2026-05-11: Keep Gemini Calls Server-Side

Gemini requests are routed through Netlify Functions in production and through `server/localFunctionsPlugin.ts` during local Vite development. This keeps `GEMINI_API_KEY` out of browser code and gives local development the same `/.netlify/functions/...` route shape as production.

Avoid adding `VITE_GEMINI_API_KEY`. `VITE_` variables can be exposed to the browser bundle.

### 2026-05-11: Put the Fact-Check Prompt in `server/factCheckPrompt.ts`

The fact-check prompt was moved out of `server/factCheck.ts` so prompt edits are easier to review, diff, and discuss. The server orchestration file should stay focused on calling Gemini, parsing JSON, attaching grounding URLs, and normalizing the response.

Prompt changes should preserve the JSON response contract unless the UI, shared types, and parsing logic are updated together.

### 2026-05-11: Treat Non-Grounded Fact Checks as Reasoning Plus Search Leads

Google Search grounding requires API access that may not be available with the configured key. When grounding is disabled, the prompt explicitly tells Gemini that it has no live web access and must not invent URLs or claim suggested links were retrieved or analyzed.

The app still asks Gemini for useful search-lead titles because those often produce good Google results for follow-up reading. `server/factCheck.ts` clears URLs when grounding is off, and the UI labels those entries as search leads instead of verified sources.

### 2026-05-11: Keep Search Grounding Behind Two Flags

Search grounding is enabled only when both the server allows it and the browser exposes the toggle:

- `ENABLE_SEARCH_GROUNDING=true`
- `VITE_ENABLE_SEARCH_GROUNDING=true`

This prevents the browser from offering a feature the server will refuse, and it lets deployments without paid grounding access keep the UI simple.
