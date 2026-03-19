"""Celery tasks for AI360 Ingestion Service."""

from .worker import app


@app.task(name="services.ingestion_service.tasks.scrape_news_all_orgs")
def scrape_news_all_orgs():
    """Placeholder: iterate active orgs, fetch news from configured data sources."""
    pass


@app.task(name="services.ingestion_service.tasks.scrape_financials_all_orgs")
def scrape_financials_all_orgs():
    """Placeholder: iterate active orgs, fetch financial snapshots."""
    pass


@app.task(name="services.ingestion_service.tasks.scrape_org_news", bind=True)
def scrape_org_news(self, org_id: str):
    """Placeholder: scrape news for a single organization."""
    pass


@app.task(name="services.ingestion_service.tasks.scrape_org_financials", bind=True)
def scrape_org_financials(self, org_id: str):
    """Placeholder: scrape financials for a single organization."""
    pass


@app.task(name="services.ingestion_service.tasks.archive_expired_news")
def archive_expired_news():
    """Placeholder: mark news articles past retention_expires_at as archived."""
    pass
