#!/usr/bin/env bash
# Ensure both source roots are on PYTHONPATH (handle space in directory name)
export PYTHONPATH="${PWD}/phase 4/src:${PWD}/phase 3/src"
cd "phase 4/src"
python3 -m pip install -r ../requirements.txt
python3 -m uvicorn claude_lens.api.app:app --host 0.0.0.0 --port $PORT

