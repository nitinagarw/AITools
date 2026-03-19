"""Unit tests for Notification Service — UT-NS-01 through UT-NS-10."""

import pytest
from httpx import ASGITransport, AsyncClient

from libs.shared.auth import get_current_user
from services.notification_service.main import app
from services.notification_service.dependencies import get_db
from services.notification_service.models import Notification, NotificationType

from tests.conftest import ADMIN_USER, ANALYST_USER, override_current_user
from tests.factories import notification_factory


@pytest.fixture
def analyst_app(db_session):
    app.dependency_overrides[get_current_user] = override_current_user(ANALYST_USER)
    app.dependency_overrides[get_db] = lambda: db_session
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def seeded_notifications(db_session):
    """Seed 5 notifications for ANALYST_USER: 3 unread, 2 read."""
    notifications = []
    for i in range(5):
        data = notification_factory(
            user_id=ANALYST_USER.user_id,
            ntype="analysis_ready" if i % 2 == 0 else "credit_low",
            is_read=i >= 3,
        )
        notif = Notification(
            id=data["id"],
            user_id=data["user_id"],
            type=NotificationType(data["type"]),
            title=data["title"],
            message=data["message"],
            link_url=data["link_url"],
            is_read=data["is_read"],
            delivery_channels=data["delivery_channels"],
            delivery_status=data["delivery_status"],
        )
        db_session.add(notif)
    await db_session.flush()
    return notifications


class TestListNotifications:
    """UT-NS-02: GET /api/notifications."""

    @pytest.mark.asyncio
    async def test_list_notifications(self, analyst_app):
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/notifications")
            assert resp.status_code == 200
            body = resp.json()
            assert "data" in body
            assert "pagination" in body

    @pytest.mark.asyncio
    async def test_list_unread_only(self, analyst_app):
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/notifications?is_read=false")
            assert resp.status_code == 200


class TestMarkRead:
    """UT-NS-03: PATCH /api/notifications/{id}/read."""

    @pytest.mark.asyncio
    async def test_mark_nonexistent_returns_404(self, analyst_app):
        async with AsyncClient(
            transport=ASGITransport(app=analyst_app), base_url="http://test"
        ) as client:
            resp = await client.put("/api/notifications/nonexistent-id/read")
            assert resp.status_code == 404


class TestNotificationDelivery:
    """UT-NS-04 through UT-NS-08: Delivery logic tests (unit-level)."""

    def test_notification_factory_defaults(self):
        """UT-NS-01: Factory creates valid notification data."""
        data = notification_factory(user_id="user-1", ntype="analysis_ready")
        assert data["type"] == "analysis_ready"
        assert data["is_read"] is False
        assert "in_app" in data["delivery_channels"]
        assert data["delivery_status"]["in_app"] == "delivered"

    def test_notification_types(self):
        """Validate all notification types."""
        valid_types = [
            "analysis_ready", "analysis_failed", "enrichment_complete",
            "export_ready", "credit_low", "quota_reached",
        ]
        for ntype in valid_types:
            data = notification_factory(ntype=ntype)
            assert data["type"] == ntype

    def test_analysis_ready_includes_link(self):
        """UT-NS-09: analysis_ready notification includes link to org dashboard."""
        data = notification_factory(ntype="analysis_ready")
        assert data["link_url"] is not None
        assert "/org/" in data["link_url"]
