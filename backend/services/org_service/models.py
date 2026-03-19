"""SQLAlchemy models for org_db."""

import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from libs.shared.database import Base


class ScrapingFrequency(str, enum.Enum):
    HOURLY = "hourly"
    EVERY_6H = "every_6h"
    EVERY_12H = "every_12h"
    DAILY = "daily"


class NewsSentiment(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class ReportProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PARSING = "parsing"
    EXTRACTING = "extracting"
    EMBEDDING = "embedding"
    COMPLETED = "completed"
    FAILED = "failed"


class DataSourceType(str, enum.Enum):
    FINANCIAL = "financial"
    NEWS = "news"


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    name: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    ticker_symbol: Mapped[str | None] = mapped_column(String(20))
    sector: Mapped[str | None] = mapped_column(String(255))
    headquarters: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(String(2048))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    scraping_frequency: Mapped[ScrapingFrequency] = mapped_column(
        Enum(ScrapingFrequency, name="scraping_frequency"), nullable=False, default=ScrapingFrequency.DAILY
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    news_articles: Mapped[list["NewsArticle"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    financial_snapshots: Mapped[list["FinancialSnapshot"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    annual_reports: Mapped[list["AnnualReport"]] = relationship(back_populates="organization", cascade="all, delete-orphan")


class PlatformSettings(Base):
    __tablename__ = "platform_settings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    default_user_role: Mapped[str] = mapped_column(String(20), nullable=False, default="viewer")
    default_scraping_frequency: Mapped[ScrapingFrequency] = mapped_column(
        Enum(ScrapingFrequency, name="scraping_frequency", create_type=False), nullable=False, default=ScrapingFrequency.DAILY
    )
    llm_provider: Mapped[str] = mapped_column(String(50), nullable=False, default="anthropic")
    llm_model: Mapped[str] = mapped_column(String(100), nullable=False, default="claude-sonnet-4-20250514")
    llm_api_key: Mapped[str | None] = mapped_column(Text)
    llm_endpoint_url: Mapped[str | None] = mapped_column(String(2048))
    embedding_provider: Mapped[str] = mapped_column(String(50), nullable=False, default="bge-m3")
    embedding_model: Mapped[str] = mapped_column(String(100), nullable=False, default="BAAI/bge-m3")
    embedding_dimensions: Mapped[int] = mapped_column(Integer, nullable=False, default=1024)
    embedding_endpoint_url: Mapped[str | None] = mapped_column(String(2048))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[str | None] = mapped_column(String(255))


class DataSourceConfig(Base):
    __tablename__ = "data_source_configs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    source_type: Mapped[DataSourceType] = mapped_column(Enum(DataSourceType, name="data_source_type"), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    adapter_class: Mapped[str] = mapped_column(String(500), nullable=False)
    base_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    api_key: Mapped[str | None] = mapped_column(Text)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default='{}')
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class NewsArticle(Base):
    __tablename__ = "news_articles"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    headline: Mapped[str] = mapped_column(String(1000), nullable=False)
    source: Mapped[str | None] = mapped_column(String(500))
    source_url: Mapped[str] = mapped_column(String(2048), unique=True, nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    sentiment: Mapped[NewsSentiment | None] = mapped_column(Enum(NewsSentiment, name="news_sentiment"))
    sentiment_score: Mapped[float | None] = mapped_column(Float)
    raw_content: Mapped[str | None] = mapped_column(Text)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    retention_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    organization: Mapped["Organization"] = relationship(back_populates="news_articles")


class AnnualReport(Base):
    __tablename__ = "annual_reports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(2048))
    processing_status: Mapped[ReportProcessingStatus] = mapped_column(
        Enum(ReportProcessingStatus, name="report_processing_status"), nullable=False, default=ReportProcessingStatus.PENDING
    )
    pages_count: Mapped[int | None] = mapped_column(Integer)
    extracted_entities_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    embeddings_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    processed_by: Mapped[str | None] = mapped_column(String(255))
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped["Organization"] = relationship(back_populates="annual_reports")


class FinancialSnapshot(Base):
    __tablename__ = "financial_snapshots"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    share_price: Mapped[float | None] = mapped_column(Numeric(18, 4))
    daily_change_pct: Mapped[float | None] = mapped_column(Float)
    market_cap: Mapped[float | None] = mapped_column(Numeric(22, 4))
    revenue_ttm: Mapped[float | None] = mapped_column(Numeric(22, 4))
    profit_ttm: Mapped[float | None] = mapped_column(Numeric(22, 4))
    employee_count: Mapped[int | None] = mapped_column(Integer)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization: Mapped["Organization"] = relationship(back_populates="financial_snapshots")
