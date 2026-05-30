"""Main chat — Groq stream or demo playback."""

from __future__ import annotations

from typing import Iterator, Optional

from claude_lens.env import env_flag
from claude_lens.integration.groq_client import GroqNotConfiguredError, groq_chat_stream
from claude_lens.integration.prompt_builder import build_messages, disclaimer_text
from claude_lens.engine.demo_playback import demo_chat_content
from claude_lens.shared.config import load_llm_config


def stream_chat_reply(
    *,
    message: str,
    history: Optional[list[dict[str, str]]] = None,
    high_stakes_mode: bool = False,
    tags: Optional[list[str]] = None,
) -> Iterator[str]:
    if env_flag("CLAUDE_LENS_DEMO_MODE"):
        content = demo_chat_content(message)
        for word in content.split(" "):
            yield word + " "
        return

    messages = build_messages(
        user_message=message,
        history=history,
        high_stakes_mode=high_stakes_mode,
        tags=tags,
        action="chat",
    )
    cfg = load_llm_config()
    yield from groq_chat_stream(
        messages,
        max_completion_tokens=cfg.max_completion_tokens,
        temperature=cfg.temperature,
    )


def chat_meta(high_stakes_mode: bool) -> dict:
    meta = {"demo_mode": env_flag("CLAUDE_LENS_DEMO_MODE")}
    if high_stakes_mode:
        meta["disclaimer"] = disclaimer_text()
    return meta
