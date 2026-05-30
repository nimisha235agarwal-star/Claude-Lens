# Claude Lens — Phase 4 (Reasoning Engine & API)

FastAPI backend: chat stream, classify, challenge, reasoning, insight.

## Run API

```bash
cd "Claude Lens"
pip3 install fastapi uvicorn groq python-dotenv pydantic httpx pytest

# Demo mode (no Groq calls):
export CLAUDE_LENS_DEMO_MODE=1
PYTHONPATH="phase 3/src:phase 4/src" uvicorn claude_lens.api.app:app --reload --port 8000

# Live Groq (uses Claude Lens/.env):
export CLAUDE_LENS_DEMO_MODE=0
PYTHONPATH="phase 3/src:phase 4/src" uvicorn claude_lens.api.app:app --reload --port 8000
```

## Tests

```bash
cd "Claude Lens"
PYTHONPATH="phase 3/src:phase 4/src" python3 -m pytest "phase 4/tests" -q -m "not integration"
# Optional live classify (needs GROQ_API_KEY):
PYTHONPATH="phase 3/src:phase 4/src" python3 -m pytest "phase 4/tests/test_phase4_api.py::test_live_classify_short_sentence" -v
```

## Endpoints

| Method | Path |
|--------|------|
| GET | `/health` |
| POST | `/api/v1/chat/stream` (SSE) |
| POST | `/api/v1/chat/classify` |
| POST | `/api/v1/challenge` |
| POST | `/api/v1/reasoning` |
| POST | `/api/v1/insight` |

Frontend wiring is **deferred** — see `architecture.md` § Phase 5 / Frontend integration.
