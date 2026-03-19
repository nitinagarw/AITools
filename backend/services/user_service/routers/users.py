"""External-facing user endpoints (routed via API Gateway)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import CurrentUser, Role, get_current_user, require_role
from libs.shared.schemas import ApiResponse, PaginatedResponse, PaginationMeta

from ..dependencies import get_db
from ..models import NotificationPreferences, RoleChangeAuditLog, User, UserRole
from ..schemas import (
    AuditLogOut,
    NotificationPrefsOut,
    NotificationPrefsUpdate,
    RoleChangeRequest,
    UserOut,
)

router = APIRouter()


@router.get("/me", response_model=ApiResponse[UserOut])
async def get_current_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.sso_id == current_user.sso_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    return ApiResponse(data=UserOut.model_validate(user))


@router.get("/admin/users", response_model=PaginatedResponse[UserOut])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str | None = None,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    count_query = select(sqlfunc.count()).select_from(User)
    if role:
        query = query.where(User.role == UserRole(role))
        count_query = count_query.where(User.role == UserRole(role))

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size

    result = await db.execute(
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    users = [UserOut.model_validate(u) for u in result.scalars().all()]

    return PaginatedResponse(
        data=users,
        pagination=PaginationMeta(
            page=page, page_size=page_size, total_items=total, total_pages=total_pages
        ),
    )


@router.put("/admin/users/{user_id}/role", response_model=ApiResponse[UserOut])
async def change_user_role(
    user_id: str,
    body: RoleChangeRequest,
    admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_role = user.role
    new_role = UserRole(body.new_role)
    if old_role == new_role:
        return ApiResponse(data=UserOut.model_validate(user))

    user.role = new_role

    audit = RoleChangeAuditLog(
        user_id=user.id,
        changed_by=admin.user_id,
        old_role=old_role,
        new_role=new_role,
        reason=body.reason,
    )
    db.add(audit)
    return ApiResponse(data=UserOut.model_validate(user))


@router.get("/admin/audit-log/roles", response_model=PaginatedResponse[AuditLogOut])
async def list_role_audit_log(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    total = (
        await db.execute(select(sqlfunc.count()).select_from(RoleChangeAuditLog))
    ).scalar() or 0
    total_pages = (total + page_size - 1) // page_size

    result = await db.execute(
        select(RoleChangeAuditLog)
        .order_by(RoleChangeAuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    logs = [AuditLogOut.model_validate(r) for r in result.scalars().all()]
    return PaginatedResponse(
        data=logs,
        pagination=PaginationMeta(
            page=page, page_size=page_size, total_items=total, total_pages=total_pages
        ),
    )


@router.get("/me/notification-preferences", response_model=ApiResponse[NotificationPrefsOut])
async def get_notification_prefs(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.sso_id == current_user.sso_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    prefs_result = await db.execute(
        select(NotificationPreferences).where(NotificationPreferences.user_id == user.id)
    )
    prefs = prefs_result.scalar_one_or_none()
    if not prefs:
        prefs = NotificationPreferences(user_id=user.id, email_address=user.email)
        db.add(prefs)
        await db.flush()

    return ApiResponse(data=NotificationPrefsOut.model_validate(prefs))


@router.put("/me/notification-preferences", response_model=ApiResponse[NotificationPrefsOut])
async def update_notification_prefs(
    body: NotificationPrefsUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.sso_id == current_user.sso_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    prefs_result = await db.execute(
        select(NotificationPreferences).where(NotificationPreferences.user_id == user.id)
    )
    prefs = prefs_result.scalar_one_or_none()
    if not prefs:
        prefs = NotificationPreferences(user_id=user.id, email_address=user.email)
        db.add(prefs)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prefs, field, value)

    await db.flush()
    return ApiResponse(data=NotificationPrefsOut.model_validate(prefs))
