"""Validate training artifacts produced by ingest_answers.py."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

TRAINING = Path(__file__).resolve().parents[1] / "training"


def load(name: str) -> dict:
    path = TRAINING / name
    assert path.is_file(), f"Missing {path}; run: python scripts/ingest_answers.py"
    return json.loads(path.read_text(encoding="utf-8"))


def test_part01_onboarding():
    data = load("part01_onboarding.json")
    assert data["version"] == "1.0"
    assert "banner" in data
    assert "high-stakes" in data["on_enable"]["tags"]


def test_part02_four_turns():
    data = load("part02_main_chat.json")
    turns = data["turns"]
    assert len(turns) == 4
    assert "MBA in 2027" in turns[0]["user"]
    assert turns[0]["assistant"]["content"]
    assert len(turns[0]["assistant"]["claims"]) >= 6
    # Part 6 explanations merged when sentence text matches exactly
    job_market = next(
        c
        for c in turns[0]["assistant"]["claims"]
        if c["sentence"].startswith("The job market for MBA graduates")
    )
    assert "2023 and 2024" in job_market.get("explanation", "")


def test_part06_nine_chips():
    data = load("part06_chip_explanations.json")
    entries = data["chip_explanations"]
    assert len(entries) == 9
    for e in entries:
        assert e["sentence"] and e["label"] and e["explanation"]


def test_part07_extended_qa():
    data = load("part07_extended_qa.json")
    assert len(data["extended_qa"]) == 6


def test_mba_journey():
    data = load("mba_journey.json")
    assert data["reference_query"]
    assert len(data["turns"]) == 4
    assert data["challenge"]["counterarguments"]
    assert data["reasoning"]["quick_answer"]
    assert data["high_stakes"]["disclaimer"]


def test_corpus_digest_exists():
    path = TRAINING / "corpus_digest.txt"
    assert path.is_file()
    assert "MBA Decision 2027" in path.read_text(encoding="utf-8")
