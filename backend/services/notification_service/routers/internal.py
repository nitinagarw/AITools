"""Internal service-to-service endpoints (not routed via Gateway)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import verify_internal_jwt
from libs.shared.schemas import ApiResponse

from ..dependencies import get_db
from ..models import Notification, NotificationType
from ..schemas import NotificationCreate, NotificationOut

router = APIRouter(prefix="/internal", dependencies=[Depends(verify_internal_jwt)])


@router.post("/notifications", response_model=ApiResponse[NotificationOut])
async def create_notification(
    body: NotificationCreate,
    db: AsyncSession = Depends(get_db),
) -> ApiResponse[NotificationOut]:
    """Create a notification. Persists to DB; future work will dispatch to email/SMS/push channels."""
    notification = Notification(
        user_id=body.user_id,
        type=NotificationType(body.type),
        title=body.title,
        message=body.message,
        link_url=body.link_url,
        delivery_channels=body.delivery_channels,
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    return ApiResponse(data=NotificationOut.model_validate(notification))
