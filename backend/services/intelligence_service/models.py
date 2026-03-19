"""SQLAlchemy models for intelligence_db."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from libs.shared.database import Base


class AIModelStatus(str, enum.Enum):
    BUILDING = "building"
    READY = "ready"
    UPDATING = "updating"
    FAILED = "failed"


class ReportType(str, enum.Enum):
    GROWTH_TRAJECTORY = "growth_trajectory"
    SENTIMENT_SUMMARY = "sentiment_summary"
    COMPETITIVE_LANDSCAPE = "competitive_landscape"


class OrganizationAIModel(Base):
    __tablename__ = "organization_ai_models"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4()
    )
    organization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), unique=True, nullable=False
    )
    model_type: Mapped[str] = mapped_column(String(50), nullable=False, default="rag_knowledgebase")
    llm_provider: Mapped[str] = mapped_column(String(50), nullable=False, default="anthropic")
    base_model: Mapped[str] = mapped_column(
        String(100), nullable=False, default="claude-sonnet-4-20250514"
    )
    embedding_model: Mapped[str] = mapped_column(
        String(100), nullable=False, default="BAAI/bge-m3"
    )
    embedding_dimensions: Mapped[int] = mapped_column(Integer, nullable=False, default=1024)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")
    knowledge_base_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[AIModelStatus] = mapped_column(
        Enum(AIModelStatus, name="ai_model_status"),
        nullable=False,
        default=AIModelStatus.BUILDING,
    )
    last_trained_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4()
    )
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    report_type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, name="report_type"), nullable=False
    )
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    model_version: Mapped[str | None] = mapped_column(String(100))
