"""Common Pydantic response schemas used by all services."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    message: str
    code: str | None = None
    details: dict[str, Any] | None = None


class ApiResponse(BaseModel, Generic[T]):
    data: T | None = None
    error: ErrorDetail | None = None


class PaginationMeta(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=0)


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: PaginationMeta
    error: ErrorDetail | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str
    version: str = "1.0.0"
