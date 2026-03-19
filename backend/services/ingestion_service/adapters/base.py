"""Base adapter interface for data sources."""

from abc import ABC, abstractmethod
from typing import Any


class DataSourceAdapter(ABC):
    @abstractmethod
    async def fetch_news(self, org_name: str, ticker: str | None = None) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    async def fetch_financials(self, ticker: str) -> dict[str, Any]:
        ...
