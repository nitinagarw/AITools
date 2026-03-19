"""Internal service-to-service endpoints (not routed via Gateway)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import verify_internal_jwt
from libs.shared.schemas import ApiResponse

from ..dependencies import get_db
from ..models import NotificationPreferences, User
from ..schemas import NotificationPrefsOut, UserOut

router = APIRouter(prefix="/internal", dependencies=[Depends(verify_internal_jwt)])


@router.get("/users/{sso_id}", response_model=ApiResponse[UserOut])
async def get_user_by_sso(sso_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.sso_id == sso_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(data=UserOut.model_validate(user))


@router.get("/users/{user_id}/notification-preferences", response_model=ApiResponse[NotificationPrefsOut])
async def get_user_notification_prefs(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(NotificationPreferences).where(NotificationPreferences.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        raise HTTPException(status_code=404, detail="Notification preferences not found")
    return ApiResponse(data=NotificationPrefsOut.model_validate(prefs))
