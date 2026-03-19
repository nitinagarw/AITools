"""Pydantic schemas for Organization Service API."""

from datetime import date, datetime

from pydantic import BaseModel, Field


# ─── Organization ───────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str = Field(max_length=500)
    ticker_symbol: str | None = None
    sector: str | None = None
    headquarters: str | None = None
    description: str | None = None
    logo_url: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    ticker_symbol: str | None = None
    sector: str | None = None
    headquarters: str | None = None
    description: str | None = None
    logo_url: str | None = None
    is_active: bool | None = None


class OrganizationOut(BaseModel):
    id: str
    name: str
    ticker_symbol: str | None = None
    sector: str | None = None
    headquarters: str | None = None
    description: str | None = None
    logo_url: str | None = None
    is_active: bool
    scraping_frequency: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScrapingFrequencyUpdate(BaseModel):
    frequency: str = Field(pattern="^(hourly|every_6h|every_12h|daily)$")


# ─── Platform Settings ─────────────────────────────────────

class PlatformSettingsOut(BaseModel):
    id: str
    default_user_role: str
    default_scraping_frequency: str
    llm_provider: str
    llm_model: str
    llm_endpoint_url: str | None = None
    embedding_provider: str
    embedding_model: str
    embedding_dimensions: int
    embedding_endpoint_url: str | None = None
    updated_at: datetime
    updated_by: str | None = None

    model_config = {"from_attributes": True}


class PlatformSettingsUpdate(BaseModel):
    default_user_role: str | None = None
    default_scraping_frequency: str | None = None
    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None
    llm_endpoint_url: str | None = None
    embedding_provider: str | None = None
    embedding_model: str | None = None
    embedding_dimensions: int | None = None
    embedding_endpoint_url: str | None = None


# ─── Data Source Config ─────────────────────────────────────

class DataSourceConfigCreate(BaseModel):
    source_type: str = Field(pattern="^(financial|news)$")
    provider_name: str
    display_name: str
    adapter_class: str
    base_url: str
    api_key: str | None = None
    config: dict = Field(default_factory=dict)
    is_enabled: bool = True
    is_default: bool = False
    priority: int = 100


class DataSourceConfigOut(BaseModel):
    id: str
    source_type: str
    provider_name: str
    display_name: str
    adapter_class: str
    base_url: str
    config: dict
    is_enabled: bool
    is_default: bool
    priority: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── News ───────────────────────────────────────────────────

class NewsArticleOut(BaseModel):
    id: str
    organization_id: str
    headline: str
    source: str | None = None
    source_url: str
    published_at: datetime
    summary: str | None = None
    sentiment: str | None = None
    sentiment_score: float | None = None
    ingested_at: datetime

    model_config = {"from_attributes": True}


# ─── Financial ──────────────────────────────────────────────

class FinancialSnapshotOut(BaseModel):
    id: str
    organization_id: str
    share_price: float | None = None
    daily_change_pct: float | None = None
    market_cap: float | None = None
    revenue_ttm: float | None = None
    profit_ttm: float | None = None
    employee_count: int | None = None
    snapshot_date: date
    source: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Annual Reports ────────────────────────────────────────

class AnnualReportOut(BaseModel):
    id: str
    organization_id: str
    fiscal_year: int
    title: str
    source_url: str
    processing_status: str
    pages_count: int | None = None
    extracted_entities_count: int
    embeddings_count: int
    ingested_at: datetime
    processed_at: datetime | None = None

    model_config = {"from_attributes": True}


# ─── Dashboard ──────────────────────────────────────────────

class OrgDashboard(BaseModel):
    organization: OrganizationOut
    latest_financial: FinancialSnapshotOut | None = None
    recent_news: list[NewsArticleOut] = []
    annual_reports: list[AnnualReportOut] = []
    ai_model_status: str | None = None
    kg_node_count: int | None = None
