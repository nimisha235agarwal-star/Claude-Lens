"""Phase 3 — prompt assembly & corpus (no live Groq required)."""

from __future__ import annotations

import os

import pytest

from claude_lens.env import load_project_dotenv, project_root
from claude_lens.integration.corpus_loader import select_corpus_parts, training_dir, load_artifact
from claude_lens.integration.keyword_detect import detect_domain
from claude_lens.integration.prompt_builder import build_system_prompt, disclaimer_text, build_messages


@pytest.fixture(scope="module", autouse=True)
def _dotenv():
    load_project_dotenv(project_root())


def test_training_dir_and_part02_turns():
    assert training_dir().is_dir()
    data = load_artifact("part02")
    assert len(data["turns"]) == 4


def test_detect_domain_mba_career():
    assert detect_domain("Should I pursue an MBA in 2027?", ["career"]) == "career"


def test_build_system_prompt_high_stakes_includes_corpus_and_hs():
    os.environ["CLAUDE_LENS_USE_CORPUS"] = "1"
    prompt = build_system_prompt(
        high_stakes_mode=True,
        tags=["high-stakes"],
        user_message="Should I pursue an MBA in 2027?",
        action="chat",
    )
    assert "Claude Lens" in prompt
    assert "High-Stakes Mode is ON" in prompt
    assert "TRAINING CORPUS" in prompt
    disc = disclaimer_text()
    assert "personal financial assumptions" in disc


def test_build_messages_appends_user_turn():
    msgs = build_messages(
        user_message="Hello",
        history=[{"role": "user", "content": "Hi"}],
        high_stakes_mode=False,
    )
    assert msgs[-1]["role"] == "user"
    assert msgs[-1]["content"] == "Hello"
