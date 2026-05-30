"""Claim-level insight for a single sentence."""

from __future__ import annotations

from typing import Any

from claude_lens.env import env_flag
from claude_lens.integration.groq_client import groq_chat_completion
from claude_lens.integration.corpus_loader import chip_explanation_lookup
from claude_lens.shared.config import load_llm_config


def run_insight(sentence: str, conversation_context: str = "") -> dict[str, Any]:
    lookup = chip_explanation_lookup()
    norm = " ".join(sentence.lower().split())
    for key, expl in lookup.items():
        if norm == key or key.rstrip(".") in norm:
            return {
                "evidence_strength": "See chip explanation below.",
                "assumptions": ["Context from training corpus match."],
                "reasoning": expl,
                "sources": [],
            }

    if env_flag("CLAUDE_LENS_DEMO_MODE"):
        return {
            "evidence_strength": "Moderate — demo mode.",
            "assumptions": ["General MBA decision framing."],
            "reasoning": "No exact Part 6 match for this sentence in demo mode.",
            "sources": [],
        }

    cfg = load_llm_config()
    prompt = (
        f"For this claim: \"{sentence}\"\n"
        f"Context: {conversation_context[:500]}\n"
        "Return a short JSON object with keys: evidence_strength (string), "
        "assumptions (array of strings), reasoning (string), "
        "sources (array of {{title, url, confidence}})."
    )
    raw = groq_chat_completion(
        [{"role": "user", "content": prompt}],
        max_completion_tokens=400,
        temperature=0.2,
    )
    import json
    import re

    t = raw.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return json.loads(t)
