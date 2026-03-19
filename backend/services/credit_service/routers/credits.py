"""External-facing credit endpoints (routed via API Gateway)."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import CurrentUser, Role, get_current_user, require_role
from libs.shared.schemas import ApiResponse, PaginatedResponse, PaginationMeta

from ..dependencies import get_db
from ..models import CreditAccount, CreditPricing, CreditTransaction, PricingActionType, TransactionType
from ..schemas import (
    AdminCreditAdjust,
    CreditAccountOut,
    CreditPricingCreate,
    CreditPricingOut,
    CreditTransactionOut,
    LowThresholdUpdate,
    QuotaUpdate,
)


router = APIRouter()


async def _get_or_create_account(db: AsyncSession, user_id: str) -> CreditAccount:
    """Get existing account or create one for the user."""
    result = await db.execute(select(CreditAccount).where(CreditAccount.user_id == user_id))
    account = result.scalar_one_or_none()
    if not account:
        account = CreditAccount(
            user_id=user_id,
            billing_cycle_start=date.today(),
        )
        db.add(account)
    return account


def _maybe_reset_quota(account: CreditAccount) -> None:
    """Reset quota_used if billing cycle has rolled over."""
    cycle_end = account.billing_cycle_start + timedelta(days=account.billing_cycle_days)
    if date.today() > cycle_end:
        account.quota_used = 0
        account.billing_cycle_start = date.today()


@router.get("/me/credits", response_model=ApiResponse[CreditAccountOut])
async def get_my_credits(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_create_account(db, current_user.user_id)
    _maybe_reset_quota(account)
    await db.flush()
    return ApiResponse(data=CreditAccountOut.model_validate(account))


@router.get("/me/credits/transactions", response_model=PaginatedResponse[CreditTransactionOut])
async def list_my_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(sqlfunc.count()).select_from(CreditTransaction).where(
            CreditTransaction.user_id == current_user.user_id
        )
    )
    total = count_result.scalar() or 0
    total_pages = (total + page_size - 1) // page_size if total else 0

    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == current_user.user_id)
        .order_by(CreditTransaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    transactions = [CreditTransactionOut.model_validate(t) for t in result.scalars().all()]

    return PaginatedResponse(
        data=transactions,
        pagination=PaginationMeta(
            page=page, page_size=page_size, total_items=total, total_pages=total_pages
        ),
    )


@router.put("/me/credits/quota", response_model=ApiResponse[CreditAccountOut])
async def update_quota(
    body: QuotaUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_create_account(db, current_user.user_id)
    _maybe_reset_quota(account)
    if body.quota_limit > float(account.credits_balance):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quota limit cannot exceed available credit balance",
        )
    account.quota_limit = body.quota_limit
    await db.flush()
    return ApiResponse(data=CreditAccountOut.model_validate(account))


@router.put("/me/credits/low-threshold", response_model=ApiResponse[CreditAccountOut])
async def update_low_threshold(
    body: LowThresholdUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_create_account(db, current_user.user_id)
    account.low_credit_threshold = body.threshold
    await db.flush()
    return ApiResponse(data=CreditAccountOut.model_validate(account))


@router.get("/admin/credits/pricing", response_model=ApiResponse[list[CreditPricingOut]])
async def list_pricing(
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CreditPricing).order_by(CreditPricing.action_type))
    items = [CreditPricingOut.model_validate(p) for p in result.scalars().all()]
    return ApiResponse(data=items)


@router.post("/admin/credits/pricing", response_model=ApiResponse[CreditPricingOut], status_code=201)
async def create_pricing(
    body: CreditPricingCreate,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    pricing = CreditPricing(
        action_type=PricingActionType(body.action_type),
        credits_cost=body.credits_cost,
        description=body.description,
    )
    db.add(pricing)
    await db.flush()
    return ApiResponse(data=CreditPricingOut.model_validate(pricing))


@router.put("/admin/credits/pricing/{pricing_id}", response_model=ApiResponse[CreditPricingOut])
async def update_pricing(
    pricing_id: str,
    body: CreditPricingCreate,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CreditPricing).where(CreditPricing.id == pricing_id))
    pricing = result.scalar_one_or_none()
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing not found")
    pricing.action_type = PricingActionType(body.action_type)
    pricing.credits_cost = body.credits_cost
    pricing.description = body.description
    await db.flush()
    return ApiResponse(data=CreditPricingOut.model_validate(pricing))


@router.post("/admin/credits/adjust/{user_id}", response_model=ApiResponse[CreditAccountOut])
async def admin_adjust_credits(
    user_id: str,
    body: AdminCreditAdjust,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    account = await _get_or_create_account(db, user_id)
    new_balance = float(account.credits_balance) + body.amount
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit balance cannot go negative",
        )
    account.credits_balance = new_balance
    if body.amount > 0:
        account.total_credits_purchased = float(account.total_credits_purchased) + body.amount
    if account.quota_limit > new_balance:
        account.quota_limit = new_balance

    tx = CreditTransaction(
        user_id=user_id,
        transaction_type=TransactionType.ADMIN_ADJUSTMENT,
        amount=body.amount,
        balance_after=new_balance,
        description=body.description,
    )
    db.add(tx)
    await db.flush()
    return ApiResponse(data=CreditAccountOut.model_validate(account))
