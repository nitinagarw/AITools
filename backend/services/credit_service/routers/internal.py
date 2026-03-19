"""Internal service-to-service endpoints (not routed via Gateway)."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import verify_internal_jwt
from libs.shared.schemas import ApiResponse

from ..dependencies import get_db
from ..models import CreditAccount, CreditTransaction, TransactionType
from ..schemas import CreditAccountOut


router = APIRouter(prefix="/internal", dependencies=[Depends(verify_internal_jwt)])


class CreditCheckBody(BaseModel):
    user_id: str
    amount: float = Field(ge=0)


class CreditCheckResponse(BaseModel):
    sufficient: bool
    balance: float


class CreditReserveBody(BaseModel):
    user_id: str
    amount: float = Field(gt=0)
    transaction_type: str = Field(
        pattern="^(debit_analysis_request|debit_export|debit_ai_query)$"
    )
    description: str = ""
    reference_id: str | None = None


async def _get_or_create_account(db: AsyncSession, user_id: str) -> CreditAccount:
    from datetime import date

    result = await db.execute(select(CreditAccount).where(CreditAccount.user_id == user_id))
    account = result.scalar_one_or_none()
    if not account:
        account = CreditAccount(user_id=user_id, billing_cycle_start=date.today())
        db.add(account)
    return account


def _maybe_reset_quota(account: CreditAccount) -> None:
    from datetime import date, timedelta

    cycle_end = account.billing_cycle_start + timedelta(days=account.billing_cycle_days)
    if date.today() > cycle_end:
        account.quota_used = 0
        account.billing_cycle_start = date.today()


@router.post("/credits/check", response_model=ApiResponse[CreditCheckResponse])
async def check_credits(
    body: CreditCheckBody,
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_create_account(db, body.user_id)
    _maybe_reset_quota(account)
    await db.flush()
    balance = float(account.credits_balance)
    quota_remaining = float(account.quota_limit) - float(account.quota_used)
    sufficient = balance >= body.amount and quota_remaining >= body.amount
    return ApiResponse(
        data=CreditCheckResponse(sufficient=sufficient, balance=balance)
    )


@router.post("/credits/reserve", response_model=ApiResponse[CreditAccountOut])
async def reserve_credits(
    body: CreditReserveBody,
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_create_account(db, body.user_id)
    _maybe_reset_quota(account)
    await db.flush()
    balance = float(account.credits_balance)
    quota_remaining = float(account.quota_limit) - float(account.quota_used)

    if balance < body.amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credit balance",
        )
    if quota_remaining < body.amount:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quota reached for this billing cycle",
        )

    new_balance = balance - body.amount
    account.credits_balance = new_balance
    account.quota_used = float(account.quota_used) + body.amount

    tx = CreditTransaction(
        user_id=body.user_id,
        transaction_type=TransactionType(body.transaction_type),
        amount=-body.amount,
        balance_after=new_balance,
        description=body.description or f"Reserved {body.amount} credits",
        reference_id=body.reference_id,
    )
    db.add(tx)
    await db.flush()
    return ApiResponse(data=CreditAccountOut.model_validate(account))
