-- ============================================================
-- AI360 — intelligence_db schema
-- Tables: organization_ai_models, analysis_reports
-- ============================================================

\connect intelligence_db

-- ─── Enum types ────────────────────────────────────────────

CREATE TYPE ai_model_status AS ENUM ('building', 'ready', 'updating', 'failed');
CREATE TYPE report_type     AS ENUM ('growth_trajectory', 'sentiment_summary', 'competitive_landscape');

-- ─── Organization AI Models ────────────────────────────────

CREATE TABLE organization_ai_models (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID         NOT NULL UNIQUE,
    model_type              VARCHAR(50)  NOT NULL DEFAULT 'rag_knowledgebase',
    llm_provider            VARCHAR(50)  NOT NULL DEFAULT 'anthropic',
    base_model              VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    embedding_model         VARCHAR(100) NOT NULL DEFAULT 'BAAI/bge-m3',
    embedding_dimensions    INTEGER      NOT NULL DEFAULT 1024,
    config                  JSONB        NOT NULL DEFAULT '{}'::jsonb,
    knowledge_base_version  INTEGER      NOT NULL DEFAULT 0,
    status                  ai_model_status NOT NULL DEFAULT 'building',
    last_trained_at         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aim_org_id ON organization_ai_models (organization_id);
CREATE INDEX idx_aim_status ON organization_ai_models (status);

-- ─── Analysis Reports ──────────────────────────────────────

CREATE TABLE analysis_reports (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID        NOT NULL,
    report_type       report_type NOT NULL,
    content           JSONB       NOT NULL,
    confidence_score  REAL        CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until       TIMESTAMPTZ,
    model_version     VARCHAR(100)
);

CREATE INDEX idx_ar_org_id      ON analysis_reports (organization_id);
CREATE INDEX idx_ar_type        ON analysis_reports (report_type);
CREATE INDEX idx_ar_generated   ON analysis_reports (generated_at DESC);

-- ─── Triggers ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aim_updated_at
    BEFORE UPDATE ON organization_ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
