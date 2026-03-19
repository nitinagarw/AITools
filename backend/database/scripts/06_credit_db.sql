-- ============================================================
-- AI360 — credit_db schema
-- Tables: credit_accounts, credit_transactions, credit_pricing
-- ============================================================

\connect credit_db

-- ─── Enum types ────────────────────────────────────────────

CREATE TYPE transaction_type AS ENUM (
    'purchase', 'debit_analysis_request', 'debit_export',
    'debit_ai_query', 'refund', 'admin_adjustment'
);

CREATE TYPE pricing_action_type AS ENUM (
    'analysis_request', 'export_pdf', 'export_csv',
    'ai_query', 'ai_query_followup'
);

-- ─── Credit accounts (one per user) ───────────────────────

CREATE TABLE credit_accounts (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                  UUID           NOT NULL UNIQUE,
    total_credits_purchased  NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credits_balance          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quota_limit              NUMERIC(14, 2) NOT NULL DEFAULT 0,
    quota_used               NUMERIC(14, 2) NOT NULL DEFAULT 0,
    billing_cycle_start      DATE           NOT NULL DEFAULT CURRENT_DATE,
    billing_cycle_days       INTEGER        NOT NULL DEFAULT 30,
    low_credit_threshold     NUMERIC(14, 2),
    created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_balance_non_negative   CHECK (credits_balance >= 0),
    CONSTRAINT chk_quota_within_balance   CHECK (quota_limit <= credits_balance),
    CONSTRAINT chk_quota_used_non_negative CHECK (quota_used >= 0)
);

CREATE INDEX idx_ca_user_id ON credit_accounts (user_id);

-- ─── Credit transactions (append-only ledger) ─────────────

CREATE TABLE credit_transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID             NOT NULL,
    transaction_type transaction_type NOT NULL,
    amount           NUMERIC(14, 2)   NOT NULL,
    balance_after    NUMERIC(14, 2)   NOT NULL,
    description      TEXT             NOT NULL,
    reference_id     UUID,
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ct_user_id    ON credit_transactions (user_id);
CREATE INDEX idx_ct_type       ON credit_transactions (transaction_type);
CREATE INDEX idx_ct_created    ON credit_transactions (created_at DESC);
CREATE INDEX idx_ct_reference  ON credit_transactions (reference_id) WHERE reference_id IS NOT NULL;

-- ─── Credit pricing (admin-managed rate card) ──────────────

CREATE TABLE credit_pricing (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type   pricing_action_type NOT NULL,
    credits_cost  NUMERIC(14, 2)     NOT NULL,
    description   TEXT               NOT NULL,
    is_active     BOOLEAN            NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cp_action ON credit_pricing (action_type, is_active);

-- Seed default pricing
INSERT INTO credit_pricing (action_type, credits_cost, description) VALUES
    ('analysis_request',    50.00, 'New organization analysis request'),
    ('export_pdf',           5.00, 'Export report as PDF'),
    ('export_csv',           3.00, 'Export data as CSV'),
    ('ai_query',             1.00, 'AI Q&A question'),
    ('ai_query_followup',    0.50, 'AI Q&A follow-up in same conversation');

-- ─── Triggers ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ca_updated_at
    BEFORE UPDATE ON credit_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cp_updated_at
    BEFORE UPDATE ON credit_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
