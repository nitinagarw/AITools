"""Pydantic schemas for Notification Service API."""

from datetime import datetime

from pydantic import BaseModel, Field


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    link_url: str | None = None
    is_read: bool
    delivery_channels: list[str]
    delivery_status: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    user_id: str
    type: str = Field(pattern="^(analysis_ready|analysis_failed|enrichment_complete|export_ready|credit_low|quota_reached)$")
    title: str = Field(max_length=500)
    message: str
    link_url: str | None = Field(None, max_length=2048)
    delivery_channels: list[str] = Field(default_factory=lambda: ["in_app"])
