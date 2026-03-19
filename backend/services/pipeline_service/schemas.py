"""Pydantic schemas for Pipeline Service API."""

from datetime import datetime

from pydantic import BaseModel


class AnalysisRequestCreate(BaseModel):
    organization_name: str
    ticker_symbol: str | None = None
    sector: str | None = None


class AnalysisRequestOut(BaseModel):
    id: str
    user_id: str
    organization_name: str
    ticker_symbol: str | None = None
    sector: str | None = None
    organization_id: str | None = None
    status: str
    estimated_completion: datetime | None = None
    failure_reason: str | None = None
    submitted_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class SeedInitRequest(BaseModel):
    organization_ids: list[str]


class SeedStatusOut(BaseModel):
    organization_id: str
    status: str
    progress_pct: float
