"""Root conftest — shared fixtures for all backend tests."""

import asyncio
import uuid
from datetime import date, datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from libs.shared.auth import CurrentUser, Role, configure_auth, get_current_user
from libs.shared.database import Base
from libs.shared.events import EventBus, EventEnvelope


# ─── Constants / Test Data ──────────────────────────────────

TEST_JWT_SECRET = "test-secret"
TEST_ALGORITHM = "HS256"

ADMIN_USER = CurrentUser(
    user_id="00000000-0000-0000-0000-000000000001",
    sso_id="admin-sso-001",
    email="admin@ai360.test",
    role=Role.ADMIN,
    display_name="Admin User",
)

ANALYST_USER = CurrentUser(
    user_id="00000000-0000-0000-0000-000000000002",
    sso_id="analyst-sso-002",
    email="analyst@ai360.test",
    role=Role.ANALYST,
    display_name="Analyst User",
)

VIEWER_USER = CurrentUser(
    user_id="00000000-0000-0000-0000-000000000003",
    sso_id="viewer-sso-003",
    email="viewer@ai360.test",
    role=Role.VIEWER,
    display_name="Viewer User",
)

ORG_RELIANCE = {
    "id": "10000000-0000-0000-0000-000000000001",
    "name": "Reliance Industries",
    "ticker_symbol": "RELIANCE.NS",
    "sector": "Conglomerate",
    "headquarters": "Mumbai, India",
    "description": "Indian multinational conglomerate",
    "is_active": True,
    "scraping_frequency": "daily",
}

ORG_TCS = {
    "id": "10000000-0000-0000-0000-000000000002",
    "name": "Tata Consultancy Services",
    "ticker_symbol": "TCS.NS",
    "sector": "IT Services",
    "headquarters": "Mumbai, India",
    "description": "Global IT services and consulting company",
    "is_active": True,
    "scraping_frequency": "every_6h",
}

ORG_INFOSYS = {
    "id": "10000000-0000-0000-0000-000000000003",
    "name": "Infosys",
    "ticker_symbol": "INFY.NS",
    "sector": "IT Services",
    "headquarters": "Bengaluru, India",
    "description": "Global IT services and consulting",
    "is_active": True,
    "scraping_frequency": "daily",
}

SAMPLE_NEWS_ARTICLES = [
    {
        "id": f"20000000-0000-0000-0000-00000000000{i}",
        "organization_id": ORG_RELIANCE["id"],
        "headline": headline,
        "source": source,
        "source_url": f"https://example.com/news/{i}",
        "published_at": datetime(2026, 3, 17 - i, tzinfo=timezone.utc).isoformat(),
        "summary": f"AI-generated summary for article {i}",
        "sentiment": sentiment,
        "sentiment_score": score,
        "retention_expires_at": datetime(2033, 3, 17 - i, tzinfo=timezone.utc).isoformat(),
        "is_archived": False,
    }
    for i, (headline, source, sentiment, score) in enumerate([
        ("Reliance posts record Q4 revenue", "Economic Times", "positive", 0.85),
        ("Reliance Jio adds 10M subscribers", "Mint", "positive", 0.72),
        ("Reliance faces regulatory scrutiny", "Reuters", "negative", -0.60),
        ("Reliance plans new data centers", "TechCrunch", "positive", 0.65),
        ("Reliance retail expansion slows", "Bloomberg", "neutral", 0.10),
    ])
]

SAMPLE_FINANCIAL = {
    "id": "30000000-0000-0000-0000-000000000001",
    "organization_id": ORG_RELIANCE["id"],
    "share_price": 2845.50,
    "daily_change_pct": 2.3,
    "market_cap": 19200000000000,
    "revenue_ttm": 9800000000000,
    "profit_ttm": 790000000000,
    "employee_count": 389000,
    "snapshot_date": "2026-03-17",
    "source": "yahoo_finance",
}

SAMPLE_CREDIT_PRICING = [
    {"action_type": "analysis_request", "credits_cost": 25.0, "description": "New organization analysis request"},
    {"action_type": "export_pdf", "credits_cost": 5.0, "description": "PDF report export"},
    {"action_type": "export_csv", "credits_cost": 3.0, "description": "CSV data export"},
    {"action_type": "ai_query", "credits_cost": 1.0, "description": "AI Q&A query"},
    {"action_type": "ai_query_followup", "credits_cost": 0.5, "description": "Follow-up AI query"},
]


# ─── Database Fixtures ──────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def async_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


# ─── Auth Fixtures ──────────────────────────────────────────

@pytest.fixture
def admin_user():
    return ADMIN_USER


@pytest.fixture
def analyst_user():
    return ANALYST_USER


@pytest.fixture
def viewer_user():
    return VIEWER_USER


def override_current_user(user: CurrentUser):
    """Return a dependency override function for get_current_user."""
    async def _override():
        return user
    return _override


# ─── Event Bus Mock ─────────────────────────────────────────

@pytest.fixture
def mock_event_bus():
    bus = AsyncMock(spec=EventBus)
    bus.publish = AsyncMock(return_value="mock-msg-id")
    bus.consume = AsyncMock(return_value=[])
    bus.ack = AsyncMock()
    bus.connect = AsyncMock()
    bus.disconnect = AsyncMock()
    return bus


# ─── Redis Mock ─────────────────────────────────────────────

@pytest.fixture
def mock_redis():
    redis = AsyncMock()
    redis.xadd = AsyncMock(return_value="1234567890-0")
    redis.xreadgroup = AsyncMock(return_value=[])
    redis.xack = AsyncMock()
    return redis


# ─── Helper Functions ───────────────────────────────────────

def make_uuid() -> str:
    return str(uuid.uuid4())


def make_headers(user: CurrentUser) -> dict:
    """Create gateway-style user context headers for test requests."""
    return {
        "x-user-id": user.user_id,
        "x-user-role": user.role.value,
        "x-user-email": user.email,
        "x-user-sso-id": user.sso_id,
        "x-user-display-name": user.display_name or "",
    }
