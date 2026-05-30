# Claude Lens — Phase 1

Data ingestion and model training corpus from `answers.md`.

## Layout

```
phase 1/
├── scripts/ingest_answers.py    # Parse answers.md → training/
├── training/                    # Generated JSON + corpus_digest.txt
├── tests/test_corpus_parsing.py
├── src/claude_lens/corpus_loader.py
├── shared/types/conversation.ts
├── constants/highStakesKeywords.ts
└── design-tokens/tokens.css
```

## Quick start

```bash
cd "phase 1"
python scripts/ingest_answers.py
python -m pytest tests/ -q
```

## Outputs (`training/`)

| File | Source |
|------|--------|
| `part01_onboarding.json` | Part 1 — HS banner |
| `part02_main_chat.json` | Part 2 — 4 chat turns |
| `part03_challenge.json` | Part 3 — challenge panel |
| `part04_reasoning.json` | Part 4 — accordion |
| `part05_high_stakes.json` | Part 5 — HS copy |
| `part06_chip_explanations.json` | Part 6 — 9 chip goldens |
| `part07_extended_qa.json` | Part 7 — 6 Q&A topics |
| `mba_journey.json` | Full threaded journey |
| `corpus_digest.txt` | Token-capped prompt digest |

## Re-ingest after editing `answers.md`

```bash
python scripts/ingest_answers.py \
  --source "../answers.md" \
  --out training/
```
