# Code Decisions

This file records significant implementation decisions so future contributors understand why the code is shaped the way it is. Add a new entry when a change affects architecture, data flow, prompts, deployment behavior, security posture, or user-facing behavior in a way that is not obvious from the code alone.

## Decision Log

### 2026-05-11: Keep Gemini Calls Server-Side

Gemini requests are routed through Netlify Functions in production and through `server/localFunctionsPlugin.ts` during local Vite development. This keeps `GEMINI_API_KEY` out of browser code and gives local development the same `/.netlify/functions/...` route shape as production.

Avoid adding `VITE_GEMINI_API_KEY`. `VITE_` variables can be exposed to the browser bundle.

### 2026-05-11: Put the Fact-Check Prompt in `server/factCheckPrompt.ts`

The fact-check prompt was moved out of `server/factCheck.ts` so prompt edits are easier to review, diff, and discuss. The server orchestration file should stay focused on calling Gemini, parsing JSON, attaching grounding URLs, and normalizing the response.

Prompt changes should preserve the JSON response contract unless the UI, shared types, and parsing logic are updated together.

### 2026-05-11: Treat Non-Grounded Fact Checks as Reasoning, Not Retrieval

Google Search grounding requires API access that may not be available with the configured key. When grounding is disabled, the prompt explicitly tells Gemini that it has no live web access and must not invent page titles, URLs, or citations.

`server/factCheck.ts` also clears source arrays when grounding is off. This is a server-side guard against fabricated sources and keeps the UI honest about whether retrieved evidence exists.

### 2026-05-11: Keep Search Grounding Behind Two Flags

Search grounding is enabled only when both the server allows it and the browser exposes the toggle:

- `ENABLE_SEARCH_GROUNDING=true`
- `VITE_ENABLE_SEARCH_GROUNDING=true`

This prevents the browser from offering a feature the server will refuse, and it lets deployments without paid grounding access keep the UI simple.

### 2026-05-11: Split Version History into `versionHistory.ts`

The version history started inside `App.tsx`, but it is app metadata rather than component behavior. Moving it to `versionHistory.ts` reduces noise in the main UI component and gives future changes a single obvious place for update-log entries.

When making significant user-facing behavior, UI, API, prompt, or deployment changes, update `versionHistory.ts`.
