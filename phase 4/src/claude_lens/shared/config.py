"""Non-secret LLM tuning from environment."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class LlmConfig:
    model: str
    max_completion_tokens: int
    temperature: float
    classify_max_tokens: int


def load_llm_config() -> LlmConfig:
    return LlmConfig(
        model=(os.environ.get("GROQ_MODEL") or "llama-3.1-8b-instant").strip(),
        max_completion_tokens=int(os.environ.get("CLAUDE_LENS_MAX_TOKENS", "1024")),
        temperature=float(os.environ.get("CLAUDE_LENS_TEMPERATURE", "0.2")),
        classify_max_tokens=int(os.environ.get("CLAUDE_LENS_CLASSIFY_MAX_TOKENS", "512")),
    )
