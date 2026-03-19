"""SQLAlchemy models for pipeline_db."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from libs.shared.database import Base


class RequestStatus(str, enum.Enum):
    QUEUED = "queued"
    SCRAPING = "scraping"
    BUILDING_KNOWLEDGE_BASE = "building_knowledge_base"
    TRAINING_MODEL = "training_model"
    READY = "ready"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AnalysisRequest(Base):
    __tablename__ = "analysis_requests"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4()
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    organization_name: Mapped[str] = mapped_column(String(500), nullable=False)
    ticker_symbol: Mapped[str | None] = mapped_column(String(20))
    sector: Mapped[str | None] = mapped_column(String(255))
    organization_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False))
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status"),
        nullable=False,
        default=RequestStatus.QUEUED,
    )
    estimated_completion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_reason: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
