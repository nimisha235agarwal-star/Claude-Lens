"""FastAPI — Claude Lens Phase 4 API."""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from claude_lens.env import env_flag, groq_configured, load_project_dotenv
from claude_lens.integration.groq_client import GroqNotConfiguredError
from claude_lens.api.schemas import (
    ChallengeRequest,
    ChallengeResponse,
    ChatStreamRequest,
    ClassifyRequest,
    ClassifyResponse,
    InsightRequest,
    InsightResponse,
    ReasoningRequest,
    ReasoningResponse,
    SourceItem,
)
from claude_lens.engine.stream_chat import chat_meta, stream_chat_reply
from claude_lens.engine.classify_claims import classify_sentences, classify_text
from claude_lens.engine.challenge import run_challenge
from claude_lens.engine.reasoning import run_reasoning
from claude_lens.engine.insight import run_insight
from claude_lens.engine.sentence_split import split_sentences


def _require_llm_or_demo() -> None:
    if env_flag("CLAUDE_LENS_DEMO_MODE"):
        return
    if not groq_configured():
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not configured. Set it in Claude Lens/.env or enable CLAUDE_LENS_DEMO_MODE=1.",
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_project_dotenv()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Claude Lens API", version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
def health():
    return {
        "status": "ok",
        "groq_configured": groq_configured(),
        "demo_mode": env_flag("CLAUDE_LENS_DEMO_MODE"),
    }

@app.get("/")
def root():
    return {"message": "Claude Lens API is running. Visit /docs for Swagger UI."}

    @app.post("/api/v1/chat/stream")
    def chat_stream(req: ChatStreamRequest):
        _require_llm_or_demo()
        history = [{"role": t.role, "content": t.content} for t in req.history]

        def event_stream():
            meta = chat_meta(req.high_stakes_mode)
            yield f"event: meta\ndata: {json.dumps(meta)}\n\n"
            try:
                for token in stream_chat_reply(
                    message=req.message,
                    history=history,
                    high_stakes_mode=req.high_stakes_mode,
                    tags=req.tags,
                ):
                    payload = json.dumps({"text": token})
                    yield f"event: token\ndata: {payload}\n\n"
            except GroqNotConfiguredError as e:
                yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"
                return
            yield "event: done\ndata: {}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    @app.post("/api/v1/chat/classify", response_model=ClassifyResponse)
    def chat_classify(req: ClassifyRequest):
        _require_llm_or_demo()
        sentences = req.sentences or (split_sentences(req.text) if req.text else [])
        claims = classify_sentences(
            sentences,
            demo_user_message=req.user_message or None,
        )
        return ClassifyResponse(claims=claims)

    @app.post("/api/v1/challenge", response_model=ChallengeResponse)
    def challenge(req: ChallengeRequest):
        _require_llm_or_demo()
        data = run_challenge(req.original_content, req.user_followup)
        return ChallengeResponse(**data)

    @app.post("/api/v1/reasoning", response_model=ReasoningResponse)
    def reasoning(req: ReasoningRequest):
        _require_llm_or_demo()
        data = run_reasoning(req.original_content)
        grounding = [
            SourceItem(**s) if isinstance(s, dict) else SourceItem(title=str(s), url="")
            for s in data.get("source_grounding", [])
        ]
        return ReasoningResponse(
            quick_answer=data.get("quick_answer", ""),
            key_assumptions=data.get("key_assumptions", []),
            reasoning_summary=data.get("reasoning_summary", ""),
            source_grounding=grounding,
            alternative_interpretations=data.get("alternative_interpretations", []),
        )

    @app.post("/api/v1/insight", response_model=InsightResponse)
    def insight(req: InsightRequest):
        _require_llm_or_demo()
        data = run_insight(req.sentence, req.conversation_context)
        sources = [
            SourceItem(**s) if isinstance(s, dict) else SourceItem(title=str(s))
            for s in data.get("sources", [])
        ]
        return InsightResponse(
            evidence_strength=data.get("evidence_strength", ""),
            assumptions=data.get("assumptions", []),
            reasoning=data.get("reasoning", ""),
            sources=sources,
        )

    return app


app = create_app()
