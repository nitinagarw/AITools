"""Pydantic schemas for Credit Service API."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class CreditAccountOut(BaseModel):
    id: str
    user_id: str
    total_credits_purchased: float
    credits_balance: float
    quota_limit: float
    quota_used: float
    billing_cycle_start: date
    billing_cycle_days: int
    low_credit_threshold: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreditTransactionOut(BaseModel):
    id: str
    user_id: str
    transaction_type: str
    amount: float
    balance_after: float
    description: str
    reference_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreditPricingOut(BaseModel):
    id: str
    action_type: str
    credits_cost: float
    description: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuotaUpdate(BaseModel):
    quota_limit: float = Field(ge=0)


class LowThresholdUpdate(BaseModel):
    threshold: float | None = Field(default=None, ge=0)


class CreditPricingCreate(BaseModel):
    action_type: str = Field(pattern="^(analysis_request|export_pdf|export_csv|ai_query|ai_query_followup)$")
    credits_cost: float = Field(ge=0)
    description: str


class AdminCreditAdjust(BaseModel):
    amount: float = Field(description="Positive to add, negative to deduct")
    description: str
