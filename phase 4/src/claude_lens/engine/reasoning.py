"""Progressive transparency accordion JSON."""

from __future__ import annotations

import json
import re
from typing import Any

from claude_lens.env import env_flag
from claude_lens.integration.groq_client import groq_chat_completion
from claude_lens.integration.prompt_builder import reasoning_messages
from claude_lens.engine.demo_playback import demo_reasoning
from claude_lens.shared.config import load_llm_config


def _parse_json(raw: str) -> dict[str, Any]:
    t = raw.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return json.loads(t)


def run_reasoning(original_content: str) -> dict[str, Any]:
    if env_flag("CLAUDE_LENS_DEMO_MODE"):
        return demo_reasoning()

    cfg = load_llm_config()
    raw = groq_chat_completion(
        reasoning_messages(original_content),
        max_completion_tokens=cfg.max_completion_tokens,
        temperature=0.2,
    )
    return _parse_json(raw)
