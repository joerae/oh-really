import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createLocalFunctionsPlugin } from "./server/localFunctionsPlugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      createLocalFunctionsPlugin({
        apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL || process.env.GEMINI_MODEL,
        allowSearchGrounding:
          env.ENABLE_SEARCH_GROUNDING === "true" ||
          env.VITE_ENABLE_SEARCH_GROUNDING === "true" ||
          process.env.ENABLE_SEARCH_GROUNDING === "true" ||
          process.env.VITE_ENABLE_SEARCH_GROUNDING === "true",
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
