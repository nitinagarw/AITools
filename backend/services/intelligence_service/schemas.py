"""Pydantic schemas for Intelligence Service API."""

from datetime import datetime

from pydantic import BaseModel, Field


class AIModelOut(BaseModel):
    id: str
    organization_id: str
    model_type: str
    llm_provider: str
    base_model: str
    embedding_model: str
    embedding_dimensions: int
    config: dict
    knowledge_base_version: int
    status: str
    last_trained_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnalysisReportOut(BaseModel):
    id: str
    organization_id: str
    report_type: str
    content: dict
    confidence_score: float
    generated_at: datetime
    valid_until: datetime | None = None
    model_version: str | None = None

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[dict]
    credits_used: float


class GraphNodeOut(BaseModel):
    id: str
    entity_type: str
    entity_name: str
    properties: dict = Field(default_factory=dict)
