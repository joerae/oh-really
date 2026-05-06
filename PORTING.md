# Porting Checklist

Use this checklist when moving a fresh Google AI Studio app into this template.

## App Shell

- Replace the sample `App.tsx` with the AI Studio app.
- Copy supporting folders such as `components`, `data`, `hooks`, `lib`, and `services`.
- Keep `index.tsx` unless the app needs custom providers or routing at the root.
- Keep the `<script type="module" src="/index.tsx"></script>` line in `index.html`.
- Remove AI Studio import maps from `index.html`.

## Dependencies

- Check imported packages in the copied app.
- Add missing packages to `package.json`.
- Run `npm.cmd install`.
- Commit `package-lock.json` in the new project after install.

## Gemini Calls

- Search for `@google/genai`, `GoogleGenAI`, `API_KEY`, `GEMINI_API_KEY`, and `VITE_`.
- Keep `@google/genai` imports out of browser components and browser services.
- Put Gemini logic in `server/`.
- Expose browser-safe endpoints from `netlify/functions/`.
- Add matching local routes in `server/localFunctionsPlugin.ts`.
- Keep the browser calling `/.netlify/functions/...` in both local and production builds.

## Secrets

- Local secret: `.env.local` with `GEMINI_API_KEY=...`.
- Netlify secret: `GEMINI_API_KEY` scoped to Functions.
- Never use `VITE_GEMINI_API_KEY` for Gemini API keys.
- Never log prompts, uploaded documents, API keys, or full request bodies unless you explicitly intend to store them.

## Verification

```powershell
npm.cmd run build
npm.cmd run dev
```

Then test one successful request and one expected failure path in the browser.
