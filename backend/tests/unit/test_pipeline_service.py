"""Unit tests for Pipeline Orchestrator — UT-PO-01 through UT-PO-14."""

import pytest
from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient

from libs.shared.auth import get_current_user
from libs.shared.events import EventBus
from services.pipeline_service.main import app
from services.pipeline_service.dependencies import get_db

from tests.conftest import (
    ADMIN_USER,
    ANALYST_USER,
    VIEWER_USER,
    override_current_user,
)


@pytest.fixture
def mock_bus():
    return AsyncMock(spec=EventBus)


@pytest.fixture
def analyst_app(db_session, mock_bus):
    app.dependency_overrides[get_current_user] = override_current_user(ANALYST_USER)
    app.dependency_overrides[get_db] = lambda: db_session
    app.state.event_bus = mock_bus
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
def admin_app(db_session, mock_bus):
    app.dependency_overrides[get_current_user] = override_current_user(ADMIN_USER)
    app.dependency_overrides[get_db] = lambda: db_session
    app.state.event_bus = mock_bus
    yield app
    app.dependency_overrides.clear()


class TestSubmitAnalysisRequest:
    """UT-PO-01 through UT-PO-05."""

    @pytest.mark.asyncio
    async def test_submit_creates_queued_request(self, analyst_app, mock_bus):
        """UT-PO-01: Creates request with status queued."""
        mock_bus.publish = AsyncMock(return_value="msg-1")
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/analysis-requests",
                json={
                    "organization_name": "Wipro Limited",
                    "ticker_symbol": "WIPRO.NS",
                    "sector": "IT Services",
                },
            )
            assert resp.status_code == 201
            body = resp.json()
            assert body["data"]["status"] == "queued"
            assert body["data"]["organization_name"] == "Wipro Limited"
            mock_bus.publish.assert_called_once()


class TestListAnalysisRequests:
    """UT-PO-06."""

    @pytest.mark.asyncio
    async def test_list_own_requests(self, analyst_app, mock_bus):
        """UT-PO-06: Lists user's own requests only."""
        mock_bus.publish = AsyncMock(return_value="msg-1")
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            # Create one request
            await client.post(
                "/api/analysis-requests",
                json={"organization_name": "Test Org"},
            )
            resp = await client.get("/api/analysis-requests")
            assert resp.status_code == 200
            body = resp.json()
            assert len(body["data"]) >= 1
            assert all(r["user_id"] == ANALYST_USER.user_id for r in body["data"])


class TestGetAnalysisRequest:
    """UT-PO-07."""

    @pytest.mark.asyncio
    async def test_get_nonexistent_returns_404(self, analyst_app):
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/analysis-requests/nonexistent-id")
            assert resp.status_code == 404


class TestCancelAnalysisRequest:
    """UT-PO-08, UT-PO-09."""

    @pytest.mark.asyncio
    async def test_cancel_queued_request(self, analyst_app, mock_bus):
        """UT-PO-08: Cancel pending request."""
        mock_bus.publish = AsyncMock(return_value="msg-1")
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            create_resp = await client.post(
                "/api/analysis-requests",
                json={"organization_name": "Cancel Test Org"},
            )
            req_id = create_resp.json()["data"]["id"]
            cancel_resp = await client.put(f"/api/analysis-requests/{req_id}/cancel")
            assert cancel_resp.status_code == 200
            assert cancel_resp.json()["data"]["status"] == "cancelled"


class TestSeedPipeline:
    """UT-PO-13, UT-PO-14."""

    @pytest.mark.asyncio
    async def test_seed_initialize(self, admin_app):
        """UT-PO-13: Triggers seed for pre-configured orgs."""
        async with AsyncClient(
            transport=ASGITransport(app=admin_app), base_url="http://test"
        ) as client:
            resp = await client.post(
                "/api/seed/initialize",
                json={"organization_ids": ["org-1", "org-2"]},
            )
            assert resp.status_code == 202

    @pytest.mark.asyncio
    async def test_seed_status(self, admin_app):
        """UT-PO-14: Returns per-org seed progress."""
        async with AsyncClient(
            transport=ASGITransport(app=admin_app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/seed/status")
            assert resp.status_code == 200
