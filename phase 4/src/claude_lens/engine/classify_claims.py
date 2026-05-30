"""Sentence → confidence chip classification."""

from __future__ import annotations

import json
import re
from typing import Any

from claude_lens.env import env_flag
from claude_lens.integration.corpus_loader import chip_explanation_lookup
from claude_lens.integration.groq_client import groq_chat_completion
from claude_lens.integration.prompt_builder import classify_messages
from claude_lens.engine.demo_playback import demo_classify_for_message
from claude_lens.engine.sentence_split import split_sentences
from claude_lens.shared.config import load_llm_config


def _parse_json(raw: str) -> dict[str, Any]:
    t = raw.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return json.loads(t)


def _lookup_explanation(sentence: str, lookup: dict[str, str]) -> str:
    norm = " ".join(sentence.lower().split())
    for key, expl in lookup.items():
        if norm == key or norm.startswith(key.rstrip(".")) or key.rstrip(".") in norm:
            return expl
    return ""


def _heuristic_label(sentence: str) -> str:
    lower = sentence.lower()
    if any(w in lower for w in ("may", "might", "uncertain", "cannot be predicted")):
        return "speculative"
    if any(w in lower for w in ("assume", "likely", "typically")):
        return "inferred"
    return "well_supported"


def classify_sentences(
    sentences: list[str],
    *,
    demo_user_message: str | None = None,
) -> list[dict[str, Any]]:
    if env_flag("CLAUDE_LENS_DEMO_MODE") and demo_user_message:
        demo = demo_classify_for_message(demo_user_message)
        if demo:
            return demo

    if not sentences:
        return []

    cfg = load_llm_config()
    lookup = chip_explanation_lookup()

    try:
        raw = groq_chat_completion(
            classify_messages(sentences),
            max_completion_tokens=cfg.classify_max_tokens,
            temperature=0.0,
        )
        data = _parse_json(raw)
        claims = data.get("claims", [])
        out: list[dict[str, Any]] = []
        for item in claims:
            idx = int(item.get("index", len(out)))
            sentence = sentences[idx] if idx < len(sentences) else item.get("sentence", "")
            expl = item.get("explanation") or _lookup_explanation(sentence, lookup)
            out.append(
                {
                    "index": idx,
                    "sentence": sentence,
                    "label": item.get("label", "inferred"),
                    "explanation": expl,
                }
            )
        return out
    except Exception:
        return [
            {
                "index": i,
                "sentence": s,
                "label": _heuristic_label(s),
                "explanation": _lookup_explanation(s, lookup),
            }
            for i, s in enumerate(sentences)
        ]


def classify_text(text: str, *, demo_user_message: str | None = None) -> list[dict[str, Any]]:
    return classify_sentences(split_sentences(text), demo_user_message=demo_user_message)
