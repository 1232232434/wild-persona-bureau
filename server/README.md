# Server Runtime Notes

## Start

```bash
cd server
npm run dev
```

Production-style start:

```bash
cd server
npm start
```

## Environment

Copy `.env.example` to `.env` and set:

```bash
PORT=8787
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.4-mini
ALLOWED_ORIGIN=http://localhost:5173
```

The server intentionally keeps a very small footprint:

- Node native `http`
- Node native `fetch`
- No framework dependency
- Structured JSON output validation before responding to the front-end

## Endpoint

`POST /api/persona/narrate`

The route accepts the front-end narration payload and forwards a structured request to the OpenAI Responses API.

This server can also target Groq's OpenAI-compatible Responses API with only env changes.

Example free-tier oriented setup:

```bash
OPENAI_API_KEY=gsk_xxx
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=openai/gpt-oss-20b
```

That is useful for this project because the current proxy already speaks an OpenAI-style Responses API shape.

Cloudflare Workers AI is also supported through its native REST API and JSON Mode:

```bash
AI_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_AUTH_TOKEN=your_workers_ai_token
CLOUDFLARE_MODEL=@cf/meta/llama-3.1-8b-instruct-fast
ALLOWED_ORIGIN=http://localhost:5173
```

This path is useful when you want a free-tier model without relying on an OpenAI-compatible third-party provider.

It returns:

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
    "model": "gpt-5.4-mini",
    "response_id": "resp_123"
  }
}
```

Typical error payload:

```json
{
  "error": "OPENAI_API_KEY is missing"
}
```

## Health Check

`GET /health`

Example response:

```json
{
  "ok": true,
  "service": "wild-persona-bureau-server",
  "provider": "openai",
  "model": "gpt-5.4-mini",
  "credentialsReady": false
}
```
