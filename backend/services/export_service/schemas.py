"""Pydantic schemas for Export Service API."""

from datetime import datetime

from pydantic import BaseModel, Field


class ExportJobCreate(BaseModel):
    organization_id: str
    format: str = Field(pattern=r"^(pdf|csv|json)$")
    sections: list[str] = Field(default=["all"])


class ExportJobOut(BaseModel):
    id: str
    user_id: str
    organization_id: str
    format: str
    sections: list[str]
    status: str
    file_path: str | None = None
    file_size_bytes: int | None = None
    download_url: str | None = None
    error_message: str | None = None
    expires_at: datetime | None = None
    created_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}
