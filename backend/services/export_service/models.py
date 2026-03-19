"""SQLAlchemy models for export_db."""

import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from libs.shared.database import Base


class ExportFormat(str, enum.Enum):
    PDF = "pdf"
    CSV = "csv"
    JSON = "json"


class ExportStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ExportJob(Base):
    __tablename__ = "export_jobs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    format: Mapped[ExportFormat] = mapped_column(Enum(ExportFormat, name="export_format"), nullable=False)
    sections: Mapped[list] = mapped_column(JSONB, nullable=False, server_default="[\"all\"]")
    status: Mapped[ExportStatus] = mapped_column(
        Enum(ExportStatus, name="export_status"), nullable=False, default=ExportStatus.QUEUED
    )
    file_path: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    download_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
