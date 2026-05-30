"""Phase 4 — API tests (demo mode + optional live Groq)."""

from __future__ import annotations

import json
import os

import pytest
from fastapi.testclient import TestClient

from claude_lens.env import load_project_dotenv, project_root, groq_configured
from claude_lens.api.app import create_app

MBA = "Should I pursue an MBA in 2027?"


@pytest.fixture(scope="module")
def client():
    load_project_dotenv(project_root())
    os.environ["CLAUDE_LENS_DEMO_MODE"] = "1"
    return TestClient(create_app())


def test_health_demo_mode(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["demo_mode"] is True


def test_chat_stream_demo_mba(client: TestClient):
    r = client.post(
        "/api/v1/chat/stream",
        json={
            "message": MBA,
            "history": [],
            "high_stakes_mode": True,
            "tags": ["career", "high-stakes"],
        },
    )
    assert r.status_code == 200
    text = r.text
    assert "MBA" in text or "mba" in text.lower()
    assert "event: token" in text


def test_classify_demo_returns_claims(client: TestClient):
    r = client.post(
        "/api/v1/chat/classify",
        json={"user_message": MBA, "sentences": []},
    )
    assert r.status_code == 200
    claims = r.json()["claims"]
    assert len(claims) >= 6
    assert claims[0]["label"]


def test_challenge_demo_sections(client: TestClient):
    r = client.post(
        "/api/v1/challenge",
        json={"original_content": "Sample assistant answer about MBA ROI."},
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data["counterarguments"]) >= 1
    assert len(data["weak_assumptions"]) >= 1


@pytest.mark.integration
def test_live_classify_short_sentence():
    """Optional live Groq — skipped without API key."""
    load_project_dotenv(project_root())
    if not groq_configured():
        pytest.skip("GROQ_API_KEY not set")
    os.environ["CLAUDE_LENS_DEMO_MODE"] = "0"
    client = TestClient(create_app())
    r = client.post(
        "/api/v1/chat/classify",
        json={
            "sentences": ["The job market for MBA graduates has remained strong."],
            "user_message": "",
        },
    )
    assert r.status_code == 200
    claims = r.json()["claims"]
    assert claims[0]["label"] in (
        "well_supported",
        "inferred",
        "speculative",
        "multiple_interpretations",
        "limited_evidence",
        "requires_human_judgment",
        "strongly_supported",
    )
