# Docker

TriageOS can run as a static Vite build served by Nginx.

## Build

Vite embeds `VITE_*` values at build time, so rebuild the image whenever these values change. AI provider secrets are not passed to Docker because AI calls go through Convex actions.

```bash
docker build \
  --build-arg VITE_CONVEX_URL="https://your-convex-url" \
  -t triageos .
```

## AI Provider Setup

Set OpenRouter secrets in Convex, not in Vite or Docker:

```bash
npx convex env set OPENROUTER_API_KEY "xxxxxxx"
npx convex env set OPENROUTER_MODEL "google/gemma-4-26b-a4b-it:free"
npx convex env set OPENROUTER_FALLBACK_MODEL "google/gemini-3.1-flash-lite-preview"
```

`OPENROUTER_MODEL` and `OPENROUTER_FALLBACK_MODEL` are optional. If they are not set, the server uses Gemma 4 26B A4B free first, then falls back to Gemini 3.1 Flash Lite Preview when the primary model is unavailable or rate-limited.

## Run

```bash
docker run --rm -p 8080:80 triageos
```

Open `http://localhost:8080`.

## Notes

- The container serves the built `dist` folder with Nginx.
- Runtime environment variables do not change Vite client values after the image is built.
- Do not put OpenRouter or Gemini API keys in `VITE_*` variables; browser env values are public.
- Docker build was not run while adding this setup.
