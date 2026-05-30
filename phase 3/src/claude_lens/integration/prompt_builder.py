"""Assemble system prompts and message lists for Groq."""

from __future__ import annotations

import json
import os
from typing import Any, Optional

from claude_lens.env import env_flag
from claude_lens.integration.corpus_loader import (
    ActionKind,
    corpus_snippet_for_parts,
    load_artifact,
    select_corpus_parts,
)
from claude_lens.integration.keyword_detect import DOMAIN_VERIFICATION, detect_domain

BASE_PERSONA = """You are Claude Lens, a thoughtful AI that helps users inspect answers before acting.
Write in clear, distinct claims—one idea per sentence where possible.
Use markdown links [Title](URL) when citing sources. Never invent numeric trust scores.
Do NOT output bracket chip tags like [Well-supported] in your prose; trust labels are added separately."""

HS_APPENDIX = """
High-Stakes Mode is ON. Surface uncertainty honestly.
You may prefix fragile claims in prose with [WEAK EVIDENCE] or [ASSUMPTION] where appropriate.
End with a short "Before acting on this:" list of 3–5 concrete verification steps.
Tone: calm, precise, research-oriented — never alarmist."""


def disclaimer_text() -> str:
    try:
        return load_artifact("part05")["disclaimer"]
    except (OSError, KeyError):
        return (
            "This recommendation depends heavily on personal financial assumptions and "
            "labour market conditions that cannot be verified at this time. "
            "Independent verification is strongly advised before making a decision of this magnitude."
        )


def build_system_prompt(
    *,
    high_stakes_mode: bool = False,
    tags: Optional[list[str]] = None,
    user_message: str = "",
    action: ActionKind = "chat",
    use_corpus: Optional[bool] = None,
) -> str:
    use_corpus = env_flag("CLAUDE_LENS_USE_CORPUS", True) if use_corpus is None else use_corpus
    parts = [BASE_PERSONA]

    if use_corpus:
        corpus_parts = select_corpus_parts(action, high_stakes_mode)
        snippet = corpus_snippet_for_parts(corpus_parts)
        if snippet:
            parts.append("\n\nTRAINING CORPUS (style and depth reference — do not copy verbatim):\n")
            parts.append(snippet)

    domain = detect_domain(user_message, tags)
    if domain and domain in DOMAIN_VERIFICATION:
        bullets = "\n".join(f"- {b}" for b in DOMAIN_VERIFICATION[domain])
        parts.append(f"\n\nDomain ({domain}) verification reminders:\n{bullets}")

    if high_stakes_mode or (tags and "high-stakes" in tags):
        parts.append(HS_APPENDIX)
        try:
            steps = load_artifact("part05").get("high_stakes_main", {}).get("verification_steps", [])
            if steps:
                parts.append("\nExample verification steps:\n" + "\n".join(f"- {s}" for s in steps[:5]))
        except OSError:
            pass

    return "\n".join(parts)


def trim_history(
    history: list[dict[str, str]],
    max_turns: int = 20,
) -> list[dict[str, str]]:
    if len(history) <= max_turns:
        return history
    first = history[0]
    rest = history[-(max_turns - 1) :]
    if first not in rest:
        return [first] + rest
    return rest


def build_messages(
    *,
    user_message: str,
    history: Optional[list[dict[str, str]]] = None,
    high_stakes_mode: bool = False,
    tags: Optional[list[str]] = None,
    action: ActionKind = "chat",
) -> list[dict[str, Any]]:
    system = build_system_prompt(
        high_stakes_mode=high_stakes_mode,
        tags=tags,
        user_message=user_message,
        action=action,
    )
    messages: list[dict[str, Any]] = [{"role": "system", "content": system}]
    for turn in trim_history(history or []):
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})
    return messages


def challenge_messages(original_answer: str, user_followup: Optional[str] = None) -> list[dict[str, Any]]:
    system = build_system_prompt(action="challenge", user_message=original_answer)
    system += (
        "\n\nYou are reviewing an AI answer as a collaborative critic. "
        "Return ONLY valid JSON with keys: counterarguments (array of strings), "
        "weak_assumptions (array of strings), alternative_viewpoints (array of strings), "
        "where_it_may_fail (array of strings)."
    )
    user = f"Challenge this answer:\n\n{original_answer}"
    if user_followup:
        user += f"\n\nFollow-up: {user_followup}"
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def reasoning_messages(original_answer: str) -> list[dict[str, Any]]:
    system = build_system_prompt(action="reasoning", user_message=original_answer)
    system += (
        "\n\nReturn ONLY valid JSON with keys: quick_answer (string), "
        "key_assumptions (array of strings), reasoning_summary (string), "
        "source_grounding (array of {title, url, confidence}), "
        "alternative_interpretations (array of strings)."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Produce full reasoning transparency for:\n\n{original_answer}"},
    ]


def classify_messages(sentences: list[str]) -> list[dict[str, Any]]:
    from claude_lens.integration.corpus_loader import load_artifact

    few = load_artifact("part06").get("chip_explanations", [])[:3]
    system = (
        "You are a confidence classifier. For each sentence, assign one label: "
        "strongly_supported, well_supported, inferred, multiple_interpretations, "
        "limited_evidence, requires_human_judgment, speculative. "
        "Return ONLY JSON: {\"claims\": [{\"index\": 0, \"label\": \"...\", \"explanation\": \"...\"}, ...]}"
    )
    user = "Few-shot examples:\n" + json.dumps(few, ensure_ascii=False)
    user += "\n\nSentences to classify:\n" + json.dumps(sentences, ensure_ascii=False)
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]
