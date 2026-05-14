# Docker

TriageOS can run as a static Vite build served by Nginx.

## Build

Vite embeds `VITE_*` values at build time, so rebuild the image whenever these values change.

```bash
docker build \
  --build-arg VITE_CONVEX_URL="https://your-convex-url" \
  --build-arg VITE_GEMINI_API_KEY="your-gemini-api-key" \
  -t triageos .
```

## Run

```bash
docker run --rm -p 8080:80 triageos
```

Open `http://localhost:8080`.

## Notes

- The container serves the built `dist` folder with Nginx.
- Runtime environment variables do not change Vite client values after the image is built.
- Docker build was not run while adding this setup.
