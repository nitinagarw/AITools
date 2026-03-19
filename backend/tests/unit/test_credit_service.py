"""Unit tests for Credit Service — UT-CS-01 through UT-CS-17."""

import pytest
from httpx import ASGITransport, AsyncClient

from libs.shared.auth import Role, get_current_user
from services.credit_service.main import app
from services.credit_service.dependencies import get_db

from tests.conftest import (
    ADMIN_USER,
    ANALYST_USER,
    VIEWER_USER,
    SAMPLE_CREDIT_PRICING,
    override_current_user,
)


@pytest.fixture
def admin_app(db_session):
    app.dependency_overrides[get_current_user] = override_current_user(ADMIN_USER)
    app.dependency_overrides[get_db] = lambda: db_session
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
def analyst_app(db_session):
    app.dependency_overrides[get_current_user] = override_current_user(ANALYST_USER)
    app.dependency_overrides[get_db] = lambda: db_session
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
def viewer_app(db_session):
    app.dependency_overrides[get_current_user] = override_current_user(VIEWER_USER)
    app.dependency_overrides[get_db] = lambda: db_session
    yield app
    app.dependency_overrides.clear()


class TestGetCredits:
    """UT-CS-01, UT-CS-02: Credit account retrieval."""

    @pytest.mark.asyncio
    async def test_get_credits_creates_account(self, analyst_app):
        """UT-CS-01/02: New user gets account; returns balance info."""
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/me/credits")
            assert resp.status_code == 200
            body = resp.json()
            assert body["data"]["credits_balance"] >= 0
            assert "quota_limit" in body["data"]
            assert "billing_cycle_start" in body["data"]


class TestQuotaManagement:
    """UT-CS-06, UT-CS-07: Quota update logic."""

    @pytest.mark.asyncio
    async def test_update_quota_within_balance(self, analyst_app):
        """UT-CS-06: Update quota <= balance succeeds."""
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            # First fetch to create account
            await client.get("/api/me/credits")
            resp = await client.put(
                "/api/me/credits/quota",
                json={"quota_limit": 0},
            )
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_quota_exceeding_balance_rejected(self, analyst_app):
        """UT-CS-07: Quota > balance returns 400."""
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            await client.get("/api/me/credits")
            resp = await client.put(
                "/api/me/credits/quota",
                json={"quota_limit": 999999},
            )
            assert resp.status_code == 400
            assert "exceed" in resp.json().get("detail", "").lower()


class TestLowThreshold:
    """UT-CS-08: Low credit threshold."""

    @pytest.mark.asyncio
    async def test_set_low_threshold(self, analyst_app):
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            await client.get("/api/me/credits")
            resp = await client.put(
                "/api/me/credits/low-threshold",
                json={"threshold": 50.0},
            )
            assert resp.status_code == 200
            assert resp.json()["data"]["low_credit_threshold"] == 50.0


class TestTransactionHistory:
    """UT-CS-09, UT-CS-10: Transaction listing."""

    @pytest.mark.asyncio
    async def test_list_transactions(self, analyst_app):
        """UT-CS-09: Returns paginated history."""
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/me/credits/transactions")
            assert resp.status_code == 200
            body = resp.json()
            assert "data" in body
            assert "pagination" in body


class TestAdminCreditOperations:
    """UT-CS-11 through UT-CS-16: Admin credit management."""

    @pytest.mark.asyncio
    async def test_admin_add_credits(self, admin_app):
        """UT-CS-11: Admin adds credits to user."""
        user_id = ANALYST_USER.user_id
        async with AsyncClient(
            transport=ASGITransport(app=admin_app), base_url="http://test"
        ) as client:
            resp = await client.post(
                f"/api/admin/credits/adjust/{user_id}",
                json={"amount": 100.0, "description": "Test credit top-up"},
            )
            assert resp.status_code == 200
            assert resp.json()["data"]["credits_balance"] >= 100

    @pytest.mark.asyncio
    async def test_admin_deduct_below_zero_rejected(self, admin_app):
        """UT-CS-04 (via admin): Deduction below zero rejected."""
        user_id = ANALYST_USER.user_id
        async with AsyncClient(
            transport=ASGITransport(app=admin_app), base_url="http://test"
        ) as client:
            # Create account with 0 balance
            await client.post(
                f"/api/admin/credits/adjust/{user_id}",
                json={"amount": 0, "description": "init"},
            )
            resp = await client.post(
                f"/api/admin/credits/adjust/{user_id}",
                json={"amount": -500, "description": "deduct too much"},
            )
            assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_non_admin_adjust_rejected(self, analyst_app):
        """UT-CS-13: Non-admin gets 403."""
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.post(
                f"/api/admin/credits/adjust/{VIEWER_USER.user_id}",
                json={"amount": 50, "description": "test"},
            )
            assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_list_pricing(self, admin_app):
        """UT-CS-15: List all pricing rules."""
        async with AsyncClient(
            transport=ASGITransport(app=admin_app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/admin/credits/pricing")
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_create_pricing(self, admin_app):
        """UT-CS-16: Create pricing rule."""
        async with AsyncClient(
            transport=ASGITransport(app=admin_app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/admin/credits/pricing",
                json=SAMPLE_CREDIT_PRICING[0],
            )
            assert resp.status_code == 201
            assert resp.json()["data"]["credits_cost"] == 25.0
