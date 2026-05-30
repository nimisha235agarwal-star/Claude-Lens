#!/usr/bin/env bash
cd "phase 4/src"
python3 -m uvicorn claude_lens.api.app:app --host 0.0.0.0 --port $PORT

