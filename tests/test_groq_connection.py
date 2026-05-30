"""
Live Groq connectivity for Claude Lens (max 4 tests).

Requires GROQ_API_KEY in Claude Lens/.env. Never logs the key.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from claude_lens.env import load_project_dotenv
from claude_lens.groq_client import groq_chat_completion, groq_chat_completion_response

PROJECT_ROOT = Path(__file__).resolve().parents[1]

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module", autouse=True)
def _load_dotenv_once():
    load_project_dotenv(project_root=PROJECT_ROOT)


def _skip_if_no_key() -> None:
    if not (os.environ.get("GROQ_API_KEY") or "").strip():
        pytest.skip("GROQ_API_KEY not set — add it to Claude Lens/.env")


def test_env_key_loaded_without_printing_value():
    """`.env` is loaded and exposes a non-empty GROQ_API_KEY to the process."""
    _skip_if_no_key()
    assert len(os.environ["GROQ_API_KEY"].strip()) >= 8


def test_groq_simple_completion_returns_pong():
    """Single-turn completion reaches Groq and returns expected text."""
    _skip_if_no_key()
    text = groq_chat_completion(
        [{"role": "user", "content": "Reply with exactly the word PONG and nothing else."}],
        max_completion_tokens=16,
        temperature=0.0,
    )
    assert isinstance(text, str) and text
    assert "PONG" in text.upper()


def test_groq_response_has_model_and_usage():
    """Response includes model id and token usage (real API round-trip)."""
    _skip_if_no_key()
    resp = groq_chat_completion_response(
        [{"role": "user", "content": "Say OK only."}],
        max_completion_tokens=8,
        temperature=0.0,
    )
    assert resp.model
    assert resp.choices[0].message.content
    usage = resp.usage
    assert usage is not None
    assert int(usage.total_tokens) > 0


def test_claude_lens_style_one_sentence_claim():
    """Claude Lens–style prompt returns a short, non-empty answer (smoke test)."""
    _skip_if_no_key()
    text = groq_chat_completion(
        [
            {
                "role": "system",
                "content": (
                    "You are Claude Lens. Answer in one calm sentence. "
                    "Do not use bracket tags like [Well-supported]."
                ),
            },
            {
                "role": "user",
                "content": "In one sentence: is an MBA useful for career switching?",
            },
        ],
        max_completion_tokens=80,
        temperature=0.2,
    )
    assert len(text) > 20
    assert "[" not in text or "Well-supported" not in text
