-- ============================================================
-- AI360 — user_db schema
-- Tables: users, role_change_audit_log, notification_preferences
-- ============================================================

\connect user_db

-- ─── Enum types ────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer');

-- ─── Users ─────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sso_id          VARCHAR(255) NOT NULL UNIQUE,
    email           VARCHAR(320) NOT NULL UNIQUE,
    display_name    VARCHAR(255) NOT NULL,
    role            user_role    NOT NULL DEFAULT 'viewer',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_sso_id   ON users (sso_id);
CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_role     ON users (role);

-- ─── Role change audit log ─────────────────────────────────

CREATE TABLE role_change_audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_by  UUID        NOT NULL REFERENCES users(id),
    old_role    user_role   NOT NULL,
    new_role    user_role   NOT NULL,
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id    ON role_change_audit_log (user_id);
CREATE INDEX idx_audit_changed_by ON role_change_audit_log (changed_by);
CREATE INDEX idx_audit_created_at ON role_change_audit_log (created_at DESC);

-- ─── Notification preferences ──────────────────────────────

CREATE TABLE notification_preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    email_address       VARCHAR(320),
    sms_enabled         BOOLEAN      NOT NULL DEFAULT FALSE,
    sms_phone_number    VARCHAR(20),
    push_enabled        BOOLEAN      NOT NULL DEFAULT FALSE,
    push_subscription   JSONB,
    quiet_hours_start   TIME,
    quiet_hours_end     TIME,
    notify_on           JSONB        NOT NULL DEFAULT '{
        "analysis_ready":      ["in_app", "email"],
        "analysis_failed":     ["in_app", "email"],
        "enrichment_complete": ["in_app"],
        "export_ready":        ["in_app", "email"],
        "credit_low":          ["in_app", "email"],
        "quota_reached":       ["in_app", "email"]
    }'::jsonb,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Triggers ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notif_prefs_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
