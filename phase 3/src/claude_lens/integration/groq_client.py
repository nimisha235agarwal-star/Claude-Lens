"""Groq Chat Completions — sync, stream, and raw response."""

from __future__ import annotations

import os
from typing import Any, Generator, Iterator, Optional

DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"


class GroqNotConfiguredError(RuntimeError):
    pass


def _require_api_key() -> str:
    key = (os.environ.get("GROQ_API_KEY") or "").strip()
    if not key:
        raise GroqNotConfiguredError(
            "GROQ_API_KEY is not set. Add it to Claude Lens/.env or set CLAUDE_LENS_DEMO_MODE=1."
        )
    return key


def resolve_model(model: Optional[str] = None) -> str:
    return (model or os.environ.get("GROQ_MODEL") or DEFAULT_GROQ_MODEL).strip()


def groq_chat_completion(
    messages: list[dict[str, Any]],
    *,
    model: Optional[str] = None,
    max_completion_tokens: int = 1024,
    temperature: float = 0.2,
) -> str:
    from groq import Groq

    client = Groq(api_key=_require_api_key())
    resp = client.chat.completions.create(
        model=resolve_model(model),
        messages=messages,
        max_completion_tokens=max_completion_tokens,
        temperature=temperature,
    )
    return (resp.choices[0].message.content or "").strip()


def groq_chat_completion_response(
    messages: list[dict[str, Any]],
    *,
    model: Optional[str] = None,
    max_completion_tokens: int = 1024,
    temperature: float = 0.0,
):
    from groq import Groq

    client = Groq(api_key=_require_api_key())
    return client.chat.completions.create(
        model=resolve_model(model),
        messages=messages,
        max_completion_tokens=max_completion_tokens,
        temperature=temperature,
    )


def groq_chat_stream(
    messages: list[dict[str, Any]],
    *,
    model: Optional[str] = None,
    max_completion_tokens: int = 1024,
    temperature: float = 0.2,
) -> Iterator[str]:
    from groq import Groq

    client = Groq(api_key=_require_api_key())
    stream = client.chat.completions.create(
        model=resolve_model(model),
        messages=messages,
        max_completion_tokens=max_completion_tokens,
        temperature=temperature,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
