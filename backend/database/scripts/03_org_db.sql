-- ============================================================
-- AI360 — org_db schema
-- Tables: organizations, platform_settings, data_source_configs,
--         news_articles, financial_snapshots, annual_reports
-- ============================================================

\connect org_db

-- ─── Enum types ────────────────────────────────────────────

CREATE TYPE scraping_frequency AS ENUM ('hourly', 'every_6h', 'every_12h', 'daily');
CREATE TYPE news_sentiment     AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE report_processing_status AS ENUM (
    'pending', 'parsing', 'extracting', 'embedding', 'completed', 'failed'
);

-- ─── Organizations ─────────────────────────────────────────

CREATE TABLE organizations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL UNIQUE,
    ticker_symbol       VARCHAR(20),
    sector              VARCHAR(255),
    headquarters        VARCHAR(500),
    description         TEXT,
    logo_url            VARCHAR(2048),
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    scraping_frequency  scraping_frequency  NOT NULL DEFAULT 'daily',
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_name    ON organizations USING gin (name gin_trgm_ops);
CREATE INDEX idx_org_ticker  ON organizations (ticker_symbol);
CREATE INDEX idx_org_sector  ON organizations (sector);
CREATE INDEX idx_org_active  ON organizations (is_active);

-- trigram index requires pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Platform settings (singleton) ─────────────────────────

CREATE TABLE platform_settings (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    default_user_role           VARCHAR(20)  NOT NULL DEFAULT 'viewer',
    default_scraping_frequency  scraping_frequency NOT NULL DEFAULT 'daily',
    llm_provider                VARCHAR(50)  NOT NULL DEFAULT 'anthropic',
    llm_model                   VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    llm_api_key                 TEXT,                -- encrypted at app layer
    llm_endpoint_url            VARCHAR(2048),
    embedding_provider          VARCHAR(50)  NOT NULL DEFAULT 'bge-m3',
    embedding_model             VARCHAR(100) NOT NULL DEFAULT 'BAAI/bge-m3',
    embedding_dimensions        INTEGER      NOT NULL DEFAULT 1024,
    embedding_endpoint_url      VARCHAR(2048),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by                  VARCHAR(255)
);

-- Insert default singleton row
INSERT INTO platform_settings (id) VALUES (uuid_generate_v4());

-- ─── Data source configs ───────────────────────────────────

CREATE TYPE data_source_type AS ENUM ('financial', 'news');

CREATE TABLE data_source_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type     data_source_type NOT NULL,
    provider_name   VARCHAR(100) NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    adapter_class   VARCHAR(500) NOT NULL,
    base_url        VARCHAR(2048) NOT NULL,
    api_key         TEXT,                    -- encrypted at app layer
    config          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    is_enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    priority        INTEGER      NOT NULL DEFAULT 100,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dsc_source_type ON data_source_configs (source_type);
CREATE INDEX idx_dsc_enabled     ON data_source_configs (is_enabled, priority);

-- Seed default free data sources
INSERT INTO data_source_configs (source_type, provider_name, display_name, adapter_class, base_url, is_default, priority)
VALUES
    ('financial', 'yahoo_finance', 'Yahoo Finance', 'services.ingestion_service.adapters.yahoo.YahooFinanceAdapter', 'https://query1.finance.yahoo.com', TRUE, 10),
    ('news', 'google_news_rss', 'Google News RSS', 'services.ingestion_service.adapters.google_news.GoogleNewsRSSAdapter', 'https://news.google.com/rss', TRUE, 10),
    ('news', 'newsapi_free', 'NewsAPI (Free Tier)', 'services.ingestion_service.adapters.newsapi.NewsAPIAdapter', 'https://newsapi.org/v2', TRUE, 20);

-- ─── News articles ─────────────────────────────────────────

CREATE TABLE news_articles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    headline            VARCHAR(1000) NOT NULL,
    source              VARCHAR(500),
    source_url          VARCHAR(2048) NOT NULL,
    published_at        TIMESTAMPTZ NOT NULL,
    summary             TEXT,
    sentiment           news_sentiment,
    sentiment_score     REAL,
    raw_content         TEXT,
    ingested_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_expires_at TIMESTAMPTZ NOT NULL,
    is_archived         BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_news_source_url UNIQUE (source_url)
);

CREATE INDEX idx_news_org_id        ON news_articles (organization_id);
CREATE INDEX idx_news_published     ON news_articles (published_at DESC);
CREATE INDEX idx_news_sentiment     ON news_articles (sentiment);
CREATE INDEX idx_news_retention     ON news_articles (retention_expires_at) WHERE NOT is_archived;

-- ─── Annual reports ────────────────────────────────────────

CREATE TABLE annual_reports (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fiscal_year             INTEGER NOT NULL,
    title                   VARCHAR(500) NOT NULL,
    source_url              VARCHAR(2048) NOT NULL,
    file_path               VARCHAR(2048),
    processing_status       report_processing_status NOT NULL DEFAULT 'pending',
    pages_count             INTEGER,
    extracted_entities_count INTEGER NOT NULL DEFAULT 0,
    embeddings_count        INTEGER NOT NULL DEFAULT 0,
    processed_by            VARCHAR(255),
    ingested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at            TIMESTAMPTZ,

    CONSTRAINT uq_annual_report_org_year UNIQUE (organization_id, fiscal_year)
);

CREATE INDEX idx_ar_org_id  ON annual_reports (organization_id);
CREATE INDEX idx_ar_status  ON annual_reports (processing_status);

-- ─── Financial snapshots ───────────────────────────────────

CREATE TABLE financial_snapshots (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    share_price       NUMERIC(18, 4),
    daily_change_pct  REAL,
    market_cap        NUMERIC(22, 4),
    revenue_ttm       NUMERIC(22, 4),
    profit_ttm        NUMERIC(22, 4),
    employee_count    INTEGER,
    snapshot_date     DATE    NOT NULL,
    source            VARCHAR(255),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_fin_snapshot_org_date UNIQUE (organization_id, snapshot_date)
);

CREATE INDEX idx_fs_org_id  ON financial_snapshots (organization_id);
CREATE INDEX idx_fs_date    ON financial_snapshots (snapshot_date DESC);

-- ─── Triggers ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_org_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_dsc_updated_at
    BEFORE UPDATE ON data_source_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Auto-set retention_expires_at on news insert ──────────

CREATE OR REPLACE FUNCTION set_news_retention()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.retention_expires_at IS NULL THEN
        NEW.retention_expires_at = NEW.published_at + INTERVAL '7 years';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_news_retention
    BEFORE INSERT ON news_articles
    FOR EACH ROW EXECUTE FUNCTION set_news_retention();
