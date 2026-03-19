"""Celery worker for AI360 Ingestion Service."""

from celery import Celery

from .config import settings

app = Celery(
    "ai360_ingestion",
    broker=settings.redis.url,
    backend=settings.redis.url,
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "scrape-news-daily": {
            "task": "services.ingestion_service.tasks.scrape_news_all_orgs",
            "schedule": 86400.0,
        },
        "scrape-financials-daily": {
            "task": "services.ingestion_service.tasks.scrape_financials_all_orgs",
            "schedule": 86400.0,
        },
        "archive-expired-news": {
            "task": "services.ingestion_service.tasks.archive_expired_news",
            "schedule": 86400.0,
        },
    },
)

from . import tasks  # noqa: E402, F401 - register tasks
