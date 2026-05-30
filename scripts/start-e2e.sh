#!/usr/bin/env bash
# Start Claude Lens API + UI for local E2E testing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_PID=""
UI_PID=""

cleanup() {
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "$UI_PID" ]] && kill "$UI_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> Starting API on http://127.0.0.1:8000"
export CLAUDE_LENS_DEMO_MODE="${CLAUDE_LENS_DEMO_MODE:-0}"
PYTHONPATH="phase 4/src:phase 3/src" python3 -m uvicorn claude_lens.api.app:app \
  --host 127.0.0.1 --port 8000 &
API_PID=$!

sleep 2
if ! curl -sf http://127.0.0.1:8000/health >/dev/null; then
  echo "ERROR: API did not start. Check GROQ_API_KEY in .env or set CLAUDE_LENS_DEMO_MODE=1"
  exit 1
fi
echo "    API OK"

echo "==> Starting UI on http://127.0.0.1:3001 (production mode — avoids dev watcher issues)"
cd "$ROOT/phase 2"
if [[ ! -d .next ]]; then
  npm run build
fi
npm run start &
UI_PID=$!

sleep 2
if ! curl -sf -o /dev/null http://127.0.0.1:3001/; then
  echo "WARN: UI may still be starting — open http://127.0.0.1:3001 in a few seconds"
else
  echo "    UI OK"
fi

echo ""
echo "Open:  http://127.0.0.1:3001"
echo "API:   http://127.0.0.1:8000/health"
echo "Press Ctrl+C to stop both."
wait
