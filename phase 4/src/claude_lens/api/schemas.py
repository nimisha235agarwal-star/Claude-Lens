"""HTTP request/response models."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatStreamRequest(BaseModel):
    conversation_id: str = ""
    message: str
    history: List[ChatTurn] = Field(default_factory=list)
    high_stakes_mode: bool = False
    tags: List[str] = Field(default_factory=list)


class ClassifyRequest(BaseModel):
    message_id: str = ""
    text: str = ""
    sentences: List[str] = Field(default_factory=list)
    high_stakes_mode: bool = False
    user_message: str = ""


class ClaimOut(BaseModel):
    index: int
    sentence: str
    label: str
    explanation: str = ""


class ClassifyResponse(BaseModel):
    claims: List[ClaimOut]


class ChallengeRequest(BaseModel):
    message_id: str = ""
    original_content: str
    user_followup: Optional[str] = None


class ChallengeResponse(BaseModel):
    counterarguments: List[str]
    weak_assumptions: List[str]
    alternative_viewpoints: List[str]
    where_it_may_fail: List[str]


class SourceItem(BaseModel):
    title: str
    url: str = ""
    confidence: str = "moderate"


class ReasoningRequest(BaseModel):
    message_id: str = ""
    original_content: str


class ReasoningResponse(BaseModel):
    quick_answer: str
    key_assumptions: List[str]
    reasoning_summary: str
    source_grounding: List[SourceItem]
    alternative_interpretations: List[str]


class InsightRequest(BaseModel):
    sentence: str
    conversation_context: str = ""


class InsightResponse(BaseModel):
    evidence_strength: str
    assumptions: List[str]
    reasoning: str
    sources: List[SourceItem] = Field(default_factory=list)
