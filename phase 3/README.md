# Claude Lens — Phase 3 (Integration Layer)

Prompt assembly, corpus injection, domain detection, and **Groq** client.

## Layout

```
phase 3/src/claude_lens/integration/
├── groq_client.py
├── prompt_builder.py
├── corpus_loader.py   → ../phase 1/training/
└── keyword_detect.py
```

## Tests (no API key required)

```bash
cd "Claude Lens"
PYTHONPATH="phase 4/src:phase 3/src" python3 -m pytest "phase 3/tests" -q
```

## Used by

Phase 4 API (`phase 4/`) — run with `PYTHONPATH="phase 3/src:phase 4/src"`.
