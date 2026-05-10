# Oh Really???

Oh Really??? is a React/Vite fact-checking app backed by Gemini. Users enter a claim, the app asks Gemini for a structured skepticism assessment, and the UI displays a score, verdict summary, supporting analysis, contradicting analysis, and source links when available.

Gemini calls run server-side through Netlify Functions in production and through a Vite middleware shim during local development. Browser code never receives the Gemini API key.

## Features

- Claim checking UI with a skepticism score from 0 to 95.
- Playful verdict titles and short evidence summaries.
- Separate supporting and contradicting source lists.
- Optional Google Search grounding behind environment flags for deployments with access to the paid grounding capability.
- Server-side prompt in `server/factCheckPrompt.ts` for easier editing and review.
- Structured error responses with request IDs and provider details.
- Local Vite development routes that mirror Netlify Function paths.

## Local Setup

Install dependencies:

```powershell
npm.cmd install
```

Create local environment variables:

```powershell
Copy-Item .env.example .env.local
```

Set `GEMINI_API_KEY` in `.env.local`.

Run the app:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000/
```

## Windows Command Note

On this machine, PowerShell may block `npm` because it tries to execute `npm.ps1` and the execution policy rejects scripts. Use `npm.cmd` from PowerShell instead:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

In Command Prompt, the normal `npm install`, `npm run dev`, and `npm run build` commands should work. This belongs in the README because it affects normal project setup; an `AGENTS.md` would be better for instructions that only automation tools should follow.

## Environment Variables

Required:

```text
GEMINI_API_KEY=replace-with-your-gemini-api-key
```

Optional:

```text
GEMINI_MODEL=gemini-3-flash-preview
ENABLE_SEARCH_GROUNDING=false
VITE_ENABLE_SEARCH_GROUNDING=false
```

`GEMINI_MODEL` controls the model used by the fact-check endpoint. `ENABLE_SEARCH_GROUNDING` allows the server to use Google Search grounding if the configured Gemini API key has access to that paid capability. `VITE_ENABLE_SEARCH_GROUNDING` exposes the UI toggle in the browser. Both search flags must be enabled for a user-selected grounded check to run.

When Search grounding is disabled, the app uses Gemini's model knowledge and reasoning only. It does not present invented source links or page titles.

Do not create `VITE_GEMINI_API_KEY`. Any variable prefixed with `VITE_` can be exposed to browser code.

## Scripts

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```

- `dev`: starts Vite on port 3000 with local Netlify Function emulation.
- `build`: creates the production bundle in `dist`.
- `preview`: previews the built Vite app.

## Deploy On Netlify

1. Push this repository to GitHub.
2. Create a Netlify site from the repository.
3. Use the build settings from `netlify.toml`.
4. Add `GEMINI_API_KEY` as a secret environment variable.
5. Optionally add `GEMINI_MODEL`, `ENABLE_SEARCH_GROUNDING`, and `VITE_ENABLE_SEARCH_GROUNDING`.

Netlify settings:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

## Project Map

- `App.tsx`: main React UI.
- `versionHistory.ts`: in-app version history entries.
- `CODEDECISIONS.md`: rationale for significant architecture, prompt, deployment, and behavior decisions.
- `components/`: result cards, skepticism meter, and source list UI.
- `services/geminiService.ts`: browser client for the fact-check endpoint.
- `services/apiClient.ts`: browser client for the generic generation endpoint.
- `server/factCheck.ts`: server-side fact-check orchestration and source URL handling.
- `server/factCheckPrompt.ts`: editable Gemini fact-check prompt.
- `server/gemini.ts`: generic server-side Gemini generation helper.
- `server/localFunctionsPlugin.ts`: Vite middleware that mirrors Netlify Functions locally.
- `server/logger.ts`: structured logging and basic redaction.
- `netlify/functions/check-claim.ts`: production fact-check endpoint.
- `netlify/functions/generate.ts`: production generic generation endpoint.
- `netlify/functions/log-error.ts`: production client-error logging endpoint.
- `types.ts`: shared response and source types.

## API Routes

Fact checking:

```text
POST /.netlify/functions/check-claim
```

Request body:

```json
{
  "claim": "Do octopuses have three hearts?",
  "useSearchGrounding": false
}
```

Generic Gemini generation:

```text
POST /.netlify/functions/generate
```

Client error logging:

```text
POST /.netlify/functions/log-error
```

## Development Notes

Run the app with Vite. Do not open `index.html` directly because the app expects Vite and the local function middleware.

The fact-check prompt is intentionally kept in `server/factCheckPrompt.ts` so prompt changes are visible in diffs. When changing response shape, update `types.ts`, `components/ResultCard.tsx`, and any server parsing/normalization code together.

When making a significant user-facing behavior, UI, API, prompt, or deployment change, update the in-app version tracker in `versionHistory.ts` with a short note.

When making a significant code decision, add an entry to `CODEDECISIONS.md` explaining what changed and why. This is especially important for decisions involving prompts, API boundaries, environment variables, deployment behavior, security, or data shown to users.
