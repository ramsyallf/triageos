# Docker

TriageOS can run as a static Vite build served by Nginx.

## Build

Vite embeds `VITE_*` values at build time, so rebuild the image whenever these values change. AI provider secrets are not passed to Docker because AI calls go through Convex actions.

```bash
docker build --build-arg VITE_CONVEX_URL="https://uncommon-jaguar-86.convex.cloud" -t triageos .
docker tag triageos kkafi09/triageos
docker push kkafi09/triageos
```

## AI Provider Setup

Set OpenRouter secrets in Convex, not in Vite or Docker:

```bash
npx convex env set OPENROUTER_API_KEY "xxxxxxx"
npx convex env set OPENROUTER_MODEL "google/gemini-3.5-flash"
npx convex env set OPENROUTER_FALLBACK_MODEL "google/gemini-3.5-flash"
```

`OPENROUTER_MODEL` and `OPENROUTER_FALLBACK_MODEL` are optional. If they are not set, the server uses Gemini 3.5 Flash for both primary and fallback model defaults.

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
