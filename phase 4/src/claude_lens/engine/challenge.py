"""Challenge this answer — devil's advocate JSON."""

from __future__ import annotations

import json
import re
from typing import Any, Optional

from claude_lens.env import env_flag
from claude_lens.integration.groq_client import groq_chat_completion
from claude_lens.integration.prompt_builder import challenge_messages
from claude_lens.engine.demo_playback import demo_challenge
from claude_lens.shared.config import load_llm_config


def _parse_json(raw: str) -> dict[str, Any]:
    t = raw.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return json.loads(t)


def run_challenge(original_content: str, user_followup: Optional[str] = None) -> dict[str, Any]:
    if env_flag("CLAUDE_LENS_DEMO_MODE"):
        return demo_challenge()

    cfg = load_llm_config()
    raw = groq_chat_completion(
        challenge_messages(original_content, user_followup),
        max_completion_tokens=cfg.max_completion_tokens,
        temperature=0.3,
    )
    data = _parse_json(raw)
    return {
        "counterarguments": data.get("counterarguments", []),
        "weak_assumptions": data.get("weak_assumptions", []),
        "alternative_viewpoints": data.get("alternative_viewpoints", []),
        "where_it_may_fail": data.get("where_it_may_fail", []),
    }
