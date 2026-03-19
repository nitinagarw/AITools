"""Test data factories for creating model instances."""

import uuid
from datetime import date, datetime, timedelta, timezone

from tests.conftest import ORG_RELIANCE


def user_factory(
    *,
    user_id: str | None = None,
    sso_id: str | None = None,
    email: str | None = None,
    display_name: str = "Test User",
    role: str = "viewer",
    is_active: bool = True,
) -> dict:
    uid = user_id or str(uuid.uuid4())
    return {
        "id": uid,
        "sso_id": sso_id or f"sso-{uid[:8]}",
        "email": email or f"user-{uid[:8]}@ai360.test",
        "display_name": display_name,
        "role": role,
        "is_active": is_active,
    }


def organization_factory(
    *,
    org_id: str | None = None,
    name: str | None = None,
    ticker: str | None = None,
    sector: str = "Technology",
    is_active: bool = True,
    scraping_frequency: str = "daily",
) -> dict:
    oid = org_id or str(uuid.uuid4())
    return {
        "id": oid,
        "name": name or f"Org-{oid[:8]}",
        "ticker_symbol": ticker,
        "sector": sector,
        "headquarters": "Test City, Test Country",
        "description": f"Description for Org-{oid[:8]}",
        "is_active": is_active,
        "scraping_frequency": scraping_frequency,
    }


def news_article_factory(
    *,
    article_id: str | None = None,
    organization_id: str | None = None,
    headline: str = "Test headline",
    sentiment: str = "positive",
    sentiment_score: float = 0.7,
    days_ago: int = 0,
) -> dict:
    aid = article_id or str(uuid.uuid4())
    pub_date = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return {
        "id": aid,
        "organization_id": organization_id or ORG_RELIANCE["id"],
        "headline": headline,
        "source": "Test News Source",
        "source_url": f"https://example.com/news/{aid[:8]}",
        "published_at": pub_date.isoformat(),
        "summary": f"Summary of {headline}",
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "retention_expires_at": (pub_date + timedelta(days=365 * 7)).isoformat(),
        "is_archived": False,
    }


def financial_snapshot_factory(
    *,
    snapshot_id: str | None = None,
    organization_id: str | None = None,
    share_price: float = 1000.0,
    daily_change_pct: float = 1.5,
    snapshot_date: date | None = None,
) -> dict:
    return {
        "id": snapshot_id or str(uuid.uuid4()),
        "organization_id": organization_id or ORG_RELIANCE["id"],
        "share_price": share_price,
        "daily_change_pct": daily_change_pct,
        "market_cap": 5000000000000,
        "revenue_ttm": 2000000000000,
        "profit_ttm": 200000000000,
        "employee_count": 100000,
        "snapshot_date": (snapshot_date or date.today()).isoformat(),
        "source": "yahoo_finance",
    }


def credit_account_factory(
    *,
    user_id: str | None = None,
    balance: float = 1000.0,
    quota_limit: float = 500.0,
    quota_used: float = 0.0,
    low_threshold: float | None = 100.0,
) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id or str(uuid.uuid4()),
        "total_credits_purchased": balance,
        "credits_balance": balance,
        "quota_limit": quota_limit,
        "quota_used": quota_used,
        "billing_cycle_start": date.today().isoformat(),
        "billing_cycle_days": 30,
        "low_credit_threshold": low_threshold,
    }


def analysis_request_factory(
    *,
    request_id: str | None = None,
    user_id: str | None = None,
    org_name: str = "Test Organization",
    status: str = "queued",
) -> dict:
    return {
        "id": request_id or str(uuid.uuid4()),
        "user_id": user_id or str(uuid.uuid4()),
        "organization_name": org_name,
        "ticker_symbol": "TEST.NS",
        "sector": "Technology",
        "organization_id": None,
        "status": status,
        "estimated_completion": None,
        "failure_reason": None,
    }


def notification_factory(
    *,
    notification_id: str | None = None,
    user_id: str | None = None,
    ntype: str = "analysis_ready",
    is_read: bool = False,
) -> dict:
    return {
        "id": notification_id or str(uuid.uuid4()),
        "user_id": user_id or str(uuid.uuid4()),
        "type": ntype,
        "title": f"Test notification: {ntype}",
        "message": f"This is a test {ntype} notification",
        "link_url": "/org/test-org-id",
        "is_read": is_read,
        "delivery_channels": ["in_app", "email"],
        "delivery_status": {"in_app": "delivered", "email": "delivered"},
    }


def export_job_factory(
    *,
    job_id: str | None = None,
    user_id: str | None = None,
    organization_id: str | None = None,
    fmt: str = "pdf",
    status: str = "queued",
) -> dict:
    return {
        "id": job_id or str(uuid.uuid4()),
        "user_id": user_id or str(uuid.uuid4()),
        "organization_id": organization_id or ORG_RELIANCE["id"],
        "format": fmt,
        "sections": ["executive_summary", "financials", "growth_trajectory"],
        "status": status,
        "file_path": None,
        "download_url": None,
        "error_message": None,
        "expires_at": None,
    }
