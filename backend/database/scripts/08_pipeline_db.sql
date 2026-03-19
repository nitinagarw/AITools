-- ============================================================
-- AI360 — pipeline_db schema
-- Tables: analysis_requests
-- ============================================================

\connect pipeline_db

-- ─── Enum types ────────────────────────────────────────────

CREATE TYPE request_status AS ENUM (
    'queued', 'scraping', 'building_knowledge_base',
    'training_model', 'ready', 'failed', 'cancelled'
);

-- ─── Analysis requests ─────────────────────────────────────

CREATE TABLE analysis_requests (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               VARCHAR(255)   NOT NULL,
    organization_name     VARCHAR(500)   NOT NULL,
    ticker_symbol         VARCHAR(20),
    sector                VARCHAR(255),
    organization_id       UUID,
    status                request_status NOT NULL DEFAULT 'queued',
    estimated_completion  TIMESTAMPTZ,
    failure_reason        TEXT,
    submitted_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    completed_at          TIMESTAMPTZ
);

CREATE INDEX idx_areq_user_id ON analysis_requests (user_id);
CREATE INDEX idx_areq_status  ON analysis_requests (status);
CREATE INDEX idx_areq_org_id  ON analysis_requests (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_areq_submitted ON analysis_requests (submitted_at DESC);
