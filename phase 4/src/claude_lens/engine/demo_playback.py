"""Serve canned responses from Phase 1 training JSON when DEMO_MODE=1."""

from __future__ import annotations

import json
from typing import Any, Optional

from claude_lens.integration.corpus_loader import load_artifact


def _norm(s: str) -> str:
    return " ".join(s.lower().split())


def match_turn(user_message: str) -> Optional[dict[str, Any]]:
    data = load_artifact("part02")
    for turn in data.get("turns", []):
        if _norm(turn["user"]) == _norm(user_message):
            return turn["assistant"]
    # fuzzy: MBA question
    if "mba" in user_message.lower() and "2027" in user_message:
        turns = data.get("turns", [])
        if turns:
            return turns[0]["assistant"]
    return None


def demo_chat_content(user_message: str) -> str:
    matched = match_turn(user_message)
    if matched:
        return matched.get("content", "")
    return (
        "Demo mode: no exact training turn for this query. "
        "Try: Should I pursue an MBA in 2027?"
    )


def demo_classify_for_message(user_message: str) -> list[dict[str, Any]]:
    matched = match_turn(user_message)
    if not matched:
        return []
    claims = matched.get("claims", [])
    return [
        {
            "index": i,
            "sentence": c["sentence"],
            "label": c.get("label", "inferred"),
            "explanation": c.get("explanation", ""),
        }
        for i, c in enumerate(claims)
    ]


def demo_challenge() -> dict[str, Any]:
    return load_artifact("part03")["challenge"]


def demo_reasoning() -> dict[str, Any]:
    return load_artifact("part04")["reasoning"]
