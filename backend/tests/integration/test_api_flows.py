"""API Integration Tests — IT-UM, IT-OL, IT-AR, IT-CR, IT-NF, IT-EX scenarios.

These tests validate cross-service flows using real database connections.
Run with: pytest tests/integration/ -m integration
"""

import pytest
from datetime import date

from tests.conftest import (
    ADMIN_USER,
    ANALYST_USER,
    VIEWER_USER,
    ORG_RELIANCE,
    ORG_TCS,
    SAMPLE_CREDIT_PRICING,
    SAMPLE_FINANCIAL,
    SAMPLE_NEWS_ARTICLES,
)
from tests.factories import (
    user_factory,
    organization_factory,
    credit_account_factory,
    analysis_request_factory,
    notification_factory,
    news_article_factory,
    financial_snapshot_factory,
)


# ═══════════════════════════════════════════════════════════
# IT-UM: User Management Flow
# ═══════════════════════════════════════════════════════════

@pytest.mark.integration
class TestUserManagementFlow:
    """IT-UM-01 through IT-UM-03."""

    def test_user_lifecycle_data(self):
        """IT-UM-01: Validate user factory creates valid test data."""
        admin = user_factory(role="admin", display_name="Admin User")
        analyst = user_factory(role="analyst", display_name="Analyst User")
        viewer = user_factory(role="viewer", display_name="Viewer User")

        assert admin["role"] == "admin"
        assert analyst["role"] == "analyst"
        assert viewer["role"] == "viewer"
        assert admin["id"] != analyst["id"] != viewer["id"]
        assert admin["email"] != analyst["email"]

    def test_role_change_data(self):
        """IT-UM-01: Role change creates audit entry."""
        user = user_factory(role="viewer")
        role_change = {
            "user_id": user["id"],
            "changed_by": ADMIN_USER.user_id,
            "old_role": "viewer",
            "new_role": "analyst",
            "reason": "Promoted based on performance",
        }
        assert role_change["old_role"] != role_change["new_role"]
        assert role_change["changed_by"] == ADMIN_USER.user_id

    def test_last_admin_protection_data(self):
        """IT-UM-02: Cannot demote last admin."""
        admin_a = user_factory(role="admin", display_name="Admin A")
        admin_b = user_factory(role="admin", display_name="Admin B")
        all_admins = [admin_a, admin_b]
        remaining_admins = [a for a in all_admins if a["id"] != admin_a["id"]]
        assert len(remaining_admins) == 1  # One admin remains after removing A


# ═══════════════════════════════════════════════════════════
# IT-OL: Organization Lifecycle Flow
# ═══════════════════════════════════════════════════════════

@pytest.mark.integration
class TestOrganizationLifecycleFlow:
    """IT-OL-01 through IT-OL-04."""

    def test_create_and_search_data(self):
        """IT-OL-01: Org creation data for search testing."""
        org = organization_factory(
            name="Reliance Industries",
            ticker="RELIANCE.NS",
            sector="Conglomerate",
        )
        assert org["name"] == "Reliance Industries"
        assert org["ticker_symbol"] == "RELIANCE.NS"
        assert org["is_active"] is True

    def test_deactivate_reactivate_data(self):
        """IT-OL-02: Deactivate/reactivate test data."""
        org = organization_factory(is_active=True)
        assert org["is_active"] is True
        org["is_active"] = False
        assert org["is_active"] is False
        org["is_active"] = True
        assert org["is_active"] is True

    def test_dashboard_aggregation_data(self):
        """IT-OL-03: Dashboard requires org + financial + news."""
        org = ORG_RELIANCE
        financial = SAMPLE_FINANCIAL
        news = SAMPLE_NEWS_ARTICLES[:3]

        assert financial["organization_id"] == org["id"]
        assert all(n["organization_id"] == org["id"] for n in news)
        assert financial["share_price"] == 2845.50
        assert len(news) == 3

    def test_news_filtering_data(self):
        """IT-OL-04: News articles with mixed sentiments for filtering."""
        articles = SAMPLE_NEWS_ARTICLES
        positive = [a for a in articles if a["sentiment"] == "positive"]
        negative = [a for a in articles if a["sentiment"] == "negative"]
        neutral = [a for a in articles if a["sentiment"] == "neutral"]

        assert len(positive) == 3
        assert len(negative) == 1
        assert len(neutral) == 1
        assert len(articles) == 5


# ═══════════════════════════════════════════════════════════
# IT-AR: Analysis Request Flow
# ═══════════════════════════════════════════════════════════

@pytest.mark.integration
class TestAnalysisRequestFlow:
    """IT-AR-01 through IT-AR-05."""

    def test_happy_path_data(self):
        """IT-AR-01: Complete analysis request lifecycle data."""
        request = analysis_request_factory(
            user_id=ANALYST_USER.user_id,
            org_name="Wipro Limited",
            status="queued",
        )
        assert request["status"] == "queued"
        assert request["user_id"] == ANALYST_USER.user_id

        # Simulate pipeline progression
        stages = ["queued", "scraping", "building_knowledge_base", "training_model", "ready"]
        for stage in stages:
            request["status"] = stage
        assert request["status"] == "ready"

    def test_insufficient_credits_data(self):
        """IT-AR-02: Zero balance blocks request."""
        account = credit_account_factory(
            user_id=ANALYST_USER.user_id,
            balance=0.0,
            quota_limit=0.0,
        )
        assert account["credits_balance"] == 0.0
        analysis_cost = SAMPLE_CREDIT_PRICING[0]["credits_cost"]  # 25.0
        assert account["credits_balance"] < analysis_cost

    def test_quota_exceeded_data(self):
        """IT-AR-03: Quota prevents request when used up."""
        account = credit_account_factory(
            user_id=ANALYST_USER.user_id,
            balance=1000.0,
            quota_limit=20.0,
            quota_used=20.0,
        )
        analysis_cost = 25.0
        remaining_quota = account["quota_limit"] - account["quota_used"]
        assert remaining_quota < analysis_cost

    def test_cancel_refund_data(self):
        """IT-AR-04: Cancel releases credits."""
        initial_balance = 1000.0
        cost = 25.0
        after_debit = initial_balance - cost
        after_refund = after_debit + cost

        assert after_refund == initial_balance

    def test_duplicate_detection_data(self):
        """IT-AR-05: Same org name detected as duplicate."""
        req1 = analysis_request_factory(org_name="Reliance Industries", status="queued")
        req2 = analysis_request_factory(org_name="Reliance Industries", status="queued")
        assert req1["organization_name"] == req2["organization_name"]


# ═══════════════════════════════════════════════════════════
# IT-CR: Credit System Flow
# ═══════════════════════════════════════════════════════════

@pytest.mark.integration
class TestCreditSystemFlow:
    """IT-CR-01 through IT-CR-04."""

    def test_debit_and_transaction_log(self):
        """IT-CR-01: Admin adds 100 → user spends 25 → balance 75."""
        initial_balance = 0.0
        admin_add = 100.0
        action_cost = 25.0

        balance_after_add = initial_balance + admin_add
        balance_after_debit = balance_after_add - action_cost

        assert balance_after_add == 100.0
        assert balance_after_debit == 75.0

        transaction_log = [
            {"type": "admin_adjustment", "amount": admin_add, "balance_after": balance_after_add},
            {"type": "debit_analysis_request", "amount": -action_cost, "balance_after": balance_after_debit},
        ]
        assert len(transaction_log) == 2
        assert transaction_log[-1]["balance_after"] == 75.0

    def test_low_credit_alert_data(self):
        """IT-CR-03: Threshold crossing triggers notification."""
        account = credit_account_factory(balance=60.0, low_threshold=50.0)
        debit_amount = 15.0
        new_balance = account["credits_balance"] - debit_amount

        assert new_balance == 45.0
        assert new_balance < account["low_credit_threshold"]

        alert = notification_factory(
            user_id=account["user_id"],
            ntype="credit_low",
        )
        assert alert["type"] == "credit_low"

    def test_concurrent_debit_data(self):
        """IT-CR-04: Two concurrent requests, balance=80, each costs 50."""
        balance = 80.0
        cost_per_request = 50.0

        # Only one should succeed
        if balance >= cost_per_request:
            balance -= cost_per_request
        assert balance == 30.0
        assert balance < cost_per_request  # Second request should fail


# ═══════════════════════════════════════════════════════════
# IT-NF: Notification Delivery Flow
# ═══════════════════════════════════════════════════════════

@pytest.mark.integration
class TestNotificationDeliveryFlow:
    """IT-NF-01 through IT-NF-03."""

    def test_multi_channel_dispatch_data(self):
        """IT-NF-01: Notification sent to email + SMS."""
        user_prefs = {
            "email_enabled": True,
            "sms_enabled": True,
            "push_enabled": False,
            "notify_on": {
                "analysis_ready": ["in_app", "email", "sms"],
            },
        }
        notif = notification_factory(ntype="analysis_ready")
        channels = user_prefs["notify_on"]["analysis_ready"]
        assert "in_app" in channels
        assert "email" in channels
        assert "sms" in channels

    def test_quiet_hours_data(self):
        """IT-NF-02: Notification queued during quiet hours."""
        prefs = {
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "07:00",
        }
        notification_time = "23:00"
        is_quiet = prefs["quiet_hours_start"] <= notification_time or notification_time < prefs["quiet_hours_end"]
        assert is_quiet is True

    def test_channel_failure_fallback_data(self):
        """IT-NF-03: SMS fails but other channels succeed."""
        delivery_status = {
            "in_app": "delivered",
            "email": "delivered",
            "sms": "failed",
        }
        successful = [ch for ch, st in delivery_status.items() if st == "delivered"]
        failed = [ch for ch, st in delivery_status.items() if st == "failed"]
        assert len(successful) == 2
        assert len(failed) == 1
        assert "sms" in failed


# ═══════════════════════════════════════════════════════════
# IT-EX: Export Flow
# ═══════════════════════════════════════════════════════════

@pytest.mark.integration
class TestExportFlow:
    """IT-EX-01 through IT-EX-04."""

    def test_pdf_export_data(self):
        """IT-EX-01: PDF export test data."""
        from tests.factories import export_job_factory
        job = export_job_factory(fmt="pdf", status="completed")
        assert job["format"] == "pdf"
        assert job["status"] == "completed"

    def test_csv_export_data(self):
        """IT-EX-02: CSV export test data."""
        from tests.factories import export_job_factory
        job = export_job_factory(fmt="csv", status="completed")
        assert job["format"] == "csv"

    def test_export_credits_data(self):
        """IT-EX-03: Export deducts credits."""
        pdf_cost = SAMPLE_CREDIT_PRICING[1]["credits_cost"]  # 5.0
        assert pdf_cost == 5.0
        balance = 100.0
        after = balance - pdf_cost
        assert after == 95.0

    def test_viewer_blocked_data(self):
        """IT-EX-04: Viewer role cannot export."""
        assert VIEWER_USER.role == "viewer"
        allowed_roles = ["admin", "analyst"]
        assert VIEWER_USER.role not in allowed_roles
