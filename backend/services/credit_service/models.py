"""SQLAlchemy models for credit_db."""

import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Integer, Numeric, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from libs.shared.database import Base


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"
    DEBIT_ANALYSIS_REQUEST = "debit_analysis_request"
    DEBIT_EXPORT = "debit_export"
    DEBIT_AI_QUERY = "debit_ai_query"
    REFUND = "refund"
    ADMIN_ADJUSTMENT = "admin_adjustment"


class PricingActionType(str, enum.Enum):
    ANALYSIS_REQUEST = "analysis_request"
    EXPORT_PDF = "export_pdf"
    EXPORT_CSV = "export_csv"
    AI_QUERY = "ai_query"
    AI_QUERY_FOLLOWUP = "ai_query_followup"


class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), unique=True, nullable=False)
    total_credits_purchased: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    credits_balance: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    quota_limit: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    quota_used: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    billing_cycle_start: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    billing_cycle_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    low_credit_threshold: Mapped[float | None] = mapped_column(Numeric(14, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type", create_type=False), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    balance_after: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reference_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CreditPricing(Base):
    __tablename__ = "credit_pricing"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, server_default=func.uuid_generate_v4())
    action_type: Mapped[PricingActionType] = mapped_column(
        Enum(PricingActionType, name="pricing_action_type", create_type=False), nullable=False
    )
    credits_cost: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
