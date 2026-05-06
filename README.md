# AI Studio to Netlify Template

This is a copyable base project for turning a Google AI Studio React app into a standalone Netlify app.

It keeps Gemini calls server-side, gives local Vite development the same `/.netlify/functions/...` API path as production, and includes simple structured logging for browser and function failures.

## Use As A New Project

```powershell
cd ai-studio-netlify-template
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Set `GEMINI_API_KEY` in `.env.local` before calling Gemini locally.

Open:

```text
http://localhost:3000/
```

If you are using Command Prompt instead of PowerShell, `npm install` and `npm run dev` are fine.

## Deploy On Netlify

1. Push this folder as its own GitHub repository, or copy it into a new repo.
2. Create a Netlify site from that repository.
3. Use the default build settings from `netlify.toml`.
4. Add an environment variable named `GEMINI_API_KEY`.
5. Make sure the variable is available to Functions and marked as secret.

Do not create `VITE_GEMINI_API_KEY`. Anything prefixed with `VITE_` can be exposed to browser code.

## Port An AI Studio App

1. Copy the AI Studio app files into this project, usually starting with `App.tsx`, `components/`, `data/`, and `types.ts`.
2. Keep `index.tsx` unless the app has custom root setup. It already installs global error handlers.
3. Remove the AI Studio import map from `index.html`; dependencies should come from `package.json`.
4. Add any packages used by the app to `package.json`, then run `npm.cmd install`.
5. Move direct `@google/genai` browser calls into `server/gemini.ts` or a new server helper.
6. Expose that server helper through `netlify/functions`.
7. Call the function from browser services with `fetch("/.netlify/functions/name")`.
8. Add the matching local route in `server/localFunctionsPlugin.ts` so Vite development behaves like Netlify.

The included sample endpoint is:

```text
POST /.netlify/functions/generate
```

Client code for it lives in `services/apiClient.ts`, Netlify production code lives in `netlify/functions/generate.ts`, and the local development equivalent lives in `server/localFunctionsPlugin.ts`.

## File Map

- `App.tsx`: replaceable sample React UI.
- `services/apiClient.ts`: browser-side function caller.
- `services/errorLogger.ts`: browser error reporting.
- `server/gemini.ts`: server-only Gemini helper.
- `server/localFunctionsPlugin.ts`: Vite middleware that emulates Netlify Functions locally.
- `server/logger.ts`: structured JSON logs with basic secret redaction.
- `netlify/functions/generate.ts`: production Gemini function.
- `netlify/functions/log-error.ts`: production client-error logging function.
- `netlify.toml`: Netlify build and function configuration.

## Notes

Run the app with Vite. Do not open `index.html` directly and do not use a static file server for development.

This template leaves the Tailwind CDN in `index.html` because AI Studio exports often use Tailwind utility classes. If a future app needs a stricter production CSS pipeline, replace it with a normal Tailwind/PostCSS setup.
