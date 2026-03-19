"""SQLAlchemy models for notification_db."""

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from libs.shared.database import Base


class NotificationType(str, enum.Enum):
    ANALYSIS_READY = "analysis_ready"
    ANALYSIS_FAILED = "analysis_failed"
    ENRICHMENT_COMPLETE = "enrichment_complete"
    EXPORT_READY = "export_ready"
    CREDIT_LOW = "credit_low"
    QUOTA_REACHED = "quota_reached"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType, name="notification_type"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    link_url: Mapped[str | None] = mapped_column(String(2048))
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    delivery_channels: Mapped[list] = mapped_column(JSONB, nullable=False, default=lambda: ["in_app"])
    delivery_status: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
