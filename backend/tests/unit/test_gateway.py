"""Unit tests for API Gateway — UT-GW-01 through UT-GW-10."""

import pytest
from httpx import ASGITransport, AsyncClient

from services.gateway.main import app


class TestGatewayHealth:
    """UT-GW-10: Health check endpoints."""

    @pytest.mark.asyncio
    async def test_liveness(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/health/live")
            assert resp.status_code == 200
            body = resp.json()
            assert body["status"] == "ok"

    @pytest.mark.asyncio
    async def test_readiness(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/health/ready")
            assert resp.status_code == 200
            body = resp.json()
            assert body["status"] == "ok"


class TestGatewayCORS:
    """UT-GW-08: CORS headers."""

    @pytest.mark.asyncio
    async def test_cors_headers_present(self):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.options(
                "/health/live",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "GET",
                },
            )
            assert resp.status_code == 200
            assert "access-control-allow-origin" in resp.headers
