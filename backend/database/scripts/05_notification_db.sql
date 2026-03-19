-- ============================================================
-- AI360 — notification_db schema
-- Tables: notifications
-- ============================================================

\connect notification_db

-- ─── Enum types ────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM (
    'analysis_ready', 'analysis_failed', 'enrichment_complete',
    'export_ready', 'credit_low', 'quota_reached'
);

-- ─── Notifications ─────────────────────────────────────────

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID              NOT NULL,
    type                notification_type NOT NULL,
    title               VARCHAR(500)      NOT NULL,
    message             TEXT              NOT NULL,
    link_url            VARCHAR(2048),
    is_read             BOOLEAN           NOT NULL DEFAULT FALSE,
    delivery_channels   JSONB             NOT NULL DEFAULT '["in_app"]'::jsonb,
    delivery_status     JSONB             NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_id      ON notifications (user_id);
CREATE INDEX idx_notif_user_unread  ON notifications (user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_notif_type         ON notifications (type);
CREATE INDEX idx_notif_created      ON notifications (created_at DESC);

-- Archival: notifications older than retention period (default 1 year)
-- are purged by a scheduled job. No cascade needed since this is a standalone table.
