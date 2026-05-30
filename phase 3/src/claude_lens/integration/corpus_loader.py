"""Load training JSON from Phase 1 ``training/`` directory."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from claude_lens.env import project_root

ActionKind = Literal["chat", "challenge", "reasoning", "classify"]

PART_FILES = {
    "part01": "part01_onboarding.json",
    "part02": "part02_main_chat.json",
    "part03": "part03_challenge.json",
    "part04": "part04_reasoning.json",
    "part05": "part05_high_stakes.json",
    "part06": "part06_chip_explanations.json",
    "part07": "part07_extended_qa.json",
    "journey": "mba_journey.json",
}


def training_dir() -> Path:
    td = project_root() / "phase 1" / "training"
    if not td.is_dir():
        raise FileNotFoundError(f"Training dir not found: {td}. Run phase 1 ingest.")
    return td


@lru_cache(maxsize=16)
def load_artifact(key: str) -> dict[str, Any]:
    filename = PART_FILES.get(key, key)
    path = training_dir() / filename
    if not path.is_file():
        raise FileNotFoundError(f"Missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_corpus_digest() -> str:
    return (training_dir() / "corpus_digest.txt").read_text(encoding="utf-8")


def select_corpus_parts(action: ActionKind, high_stakes: bool) -> list[str]:
    if action == "chat":
        parts = ["part02", "part07"]
        if high_stakes:
            parts.append("part05")
        return parts
    if action == "challenge":
        return ["part03"]
    if action == "reasoning":
        return ["part04"]
    if action == "classify":
        return ["part06"]
    return []


def corpus_snippet_for_parts(parts: list[str], max_chars: int = 6000) -> str:
    chunks: list[str] = []
    if any(p in parts for p in ("part02", "part07")):
        chunks.append(load_corpus_digest())
    for p in parts:
        if p not in PART_FILES:
            continue
        data = load_artifact(p)
        chunks.append(f"\n--- {p} ---\n{json.dumps(data, ensure_ascii=False)[:2500]}")
    return "\n".join(chunks)[:max_chars]


def chip_explanation_lookup() -> dict[str, str]:
    data = load_artifact("part06")
    out: dict[str, str] = {}
    for entry in data.get("chip_explanations", []):
        norm = " ".join(entry["sentence"].lower().split())
        out[norm] = entry["explanation"]
    return out
