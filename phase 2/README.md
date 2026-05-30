# Claude Lens — Phase 2 (UI + API)

Mode A focus chat wired to **Phase 4 API** at `http://localhost:8000`.

## E2E — run both services

**Terminal 1 — API (Phase 4):**

```bash
cd "Claude Lens"
export CLAUDE_LENS_DEMO_MODE=0   # or 1 for training JSON without Groq
PYTHONPATH="phase 4/src:phase 3/src" uvicorn claude_lens.api.app:app --reload --port 8000
```

**Terminal 2 — UI (Phase 2):**

```bash
cd "Claude Lens/phase 2"
npm install
npm run dev
```

Open http://localhost:3001 → ask *"Should I pursue an MBA in 2027?"* → streaming reply + confidence chips.

## Features

- SSE streaming from `/api/v1/chat/stream`
- Chips from `/api/v1/chat/classify` after stream completes
- **DisclaimerBox** when High-Stakes Mode is on
- API status bar (health check)
- Serif assistant prose + chip colors per UI sample

## Env

Copy `.env.local.example` to `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
