"""External-facing notification endpoints (routed via API Gateway)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import CurrentUser, get_current_user
from libs.shared.schemas import PaginatedResponse, PaginationMeta

from ..dependencies import get_db
from ..models import Notification
from ..schemas import NotificationOut

router = APIRouter()


@router.get("/notifications", response_model=PaginatedResponse[NotificationOut])
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_read: bool | None = Query(None, description="Filter by read status"),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[NotificationOut]:
    """List notifications for the current user, paginated and filterable by is_read."""
    query = select(Notification).where(Notification.user_id == current_user.user_id)
    count_query = select(sqlfunc.count()).select_from(Notification).where(Notification.user_id == current_user.user_id)

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
        count_query = count_query.where(Notification.is_read == is_read)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    result = await db.execute(
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    notifications = [NotificationOut.model_validate(n) for n in result.scalars().all()]

    return PaginatedResponse(
        data=notifications,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total,
            total_pages=total_pages,
        ),
    )


@router.put("/notifications/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationOut:
    """Mark a notification as read. Only the owner can mark their notifications."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.user_id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    await db.flush()
    return NotificationOut.model_validate(notification)
