# App Runtime Notes

## Start

```bash
npm install
npm run dev
```

If you want to test the real proxy flow locally, start the backend from the repo root in another terminal:

```bash
npm run dev:server
```

## AI Narration Modes

The result page supports three narration modes:

- `mock`: uses the local fallback generator for predictable demos
- `proxy`: posts a structured narration request to a backend endpoint
- `fallback`: automatically used when proxy mode fails

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
VITE_NARRATOR_MODE=mock
VITE_NARRATOR_PROXY_URL=/api/persona/narrate
VITE_NARRATOR_MOCK_DELAY_MS=900
VITE_DEV_PROXY_TARGET=http://localhost:8787
```

Recommended local pairing:

- `VITE_NARRATOR_MODE=mock` for stable offline demos
- `VITE_NARRATOR_MODE=proxy` for real OpenAI-backed narration
- Keep `VITE_DEV_PROXY_TARGET=http://localhost:8787` during local full-stack development

## Expected Proxy Contract

`POST /api/persona/narrate`

Request body includes:

- `systemPrompt`
- `userPrompt`
- `input`
- `responseFormat`

Response should include one of:

```json
{
  "narration": {
    "opener": "...",
    "fieldNote": "...",
    "pressurePattern": "...",
    "socialPattern": "...",
    "growthEdge": "...",
    "shareLine": "..."
  },
  "meta": {
    "model": "gpt-5"
  }
}
```

or

```json
{
  "data": {
    "opener": "...",
    "fieldNote": "...",
    "pressurePattern": "...",
    "socialPattern": "...",
    "growthEdge": "...",
    "shareLine": "..."
  }
}
```

On proxy failure, the front-end automatically falls back to the local narration generator and surfaces the proxy error message on the result page.
