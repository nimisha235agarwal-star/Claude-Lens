"""Minimal Groq Chat Completions client (Phase 3)."""

from __future__ import annotations

import os
from typing import Any

DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"


def _require_api_key() -> str:
    key = (os.environ.get("GROQ_API_KEY") or "").strip()
    if not key:
        raise RuntimeError(
            "GROQ_API_KEY is not set; add it to Claude Lens/.env or the environment."
        )
    return key


def _resolve_model(model: str | None = None) -> str:
    return (model or os.environ.get("GROQ_MODEL") or DEFAULT_GROQ_MODEL).strip()


def groq_chat_completion(
    messages: list[dict[str, Any]],
    *,
    model: str | None = None,
    max_completion_tokens: int = 256,
    temperature: float = 0.2,
) -> str:
    from groq import Groq

    client = Groq(api_key=_require_api_key())
    resp = client.chat.completions.create(
        model=_resolve_model(model),
        messages=messages,
        max_completion_tokens=max_completion_tokens,
        temperature=temperature,
    )
    return (resp.choices[0].message.content or "").strip()


def groq_chat_completion_response(
    messages: list[dict[str, Any]],
    *,
    model: str | None = None,
    max_completion_tokens: int = 256,
    temperature: float = 0.0,
):
    from groq import Groq

    client = Groq(api_key=_require_api_key())
    return client.chat.completions.create(
        model=_resolve_model(model),
        messages=messages,
        max_completion_tokens=max_completion_tokens,
        temperature=temperature,
    )
