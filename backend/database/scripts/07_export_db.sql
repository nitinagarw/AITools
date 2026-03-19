-- ============================================================
-- AI360 — export_db schema
-- Tables: export_jobs
-- ============================================================

\connect export_db

-- ─── Enum types ────────────────────────────────────────────

CREATE TYPE export_format AS ENUM ('pdf', 'csv', 'json');
CREATE TYPE export_status AS ENUM ('queued', 'processing', 'completed', 'failed');

-- ─── Export jobs ───────────────────────────────────────────

CREATE TABLE export_jobs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID          NOT NULL,
    organization_id   UUID          NOT NULL,
    format            export_format NOT NULL,
    sections          JSONB         NOT NULL DEFAULT '["all"]'::jsonb,
    status            export_status NOT NULL DEFAULT 'queued',
    file_path         VARCHAR(2048),
    file_size_bytes   BIGINT,
    download_url      VARCHAR(2048),
    error_message     TEXT,
    expires_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_ej_user_id ON export_jobs (user_id);
CREATE INDEX idx_ej_status  ON export_jobs (status);
CREATE INDEX idx_ej_expires ON export_jobs (expires_at) WHERE status = 'completed';

-- Auto-set expiry to 30 days on completion
CREATE OR REPLACE FUNCTION set_export_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
        NEW.expires_at = NOW() + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_export_expiry
    BEFORE UPDATE ON export_jobs
    FOR EACH ROW EXECUTE FUNCTION set_export_expiry();
