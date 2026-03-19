"""Admin endpoints for platform settings and data source configuration."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import CurrentUser, Role, require_role
from libs.shared.schemas import ApiResponse

from ..dependencies import get_db
from ..models import DataSourceConfig, DataSourceType, PlatformSettings
from ..schemas import (
    DataSourceConfigCreate,
    DataSourceConfigOut,
    PlatformSettingsOut,
    PlatformSettingsUpdate,
)

router = APIRouter()


@router.get("/admin/settings", response_model=ApiResponse[PlatformSettingsOut])
async def get_platform_settings(
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PlatformSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Platform settings not initialized")
    return ApiResponse(data=PlatformSettingsOut.model_validate(settings))


@router.put("/admin/settings", response_model=ApiResponse[PlatformSettingsOut])
async def update_platform_settings(
    body: PlatformSettingsUpdate,
    admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PlatformSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Platform settings not initialized")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    settings.updated_by = admin.user_id
    await db.flush()
    return ApiResponse(data=PlatformSettingsOut.model_validate(settings))


@router.get("/admin/data-sources", response_model=ApiResponse[list[DataSourceConfigOut]])
async def list_data_sources(
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DataSourceConfig).order_by(DataSourceConfig.source_type, DataSourceConfig.priority)
    )
    sources = [DataSourceConfigOut.model_validate(s) for s in result.scalars().all()]
    return ApiResponse(data=sources)


@router.post("/admin/data-sources", response_model=ApiResponse[DataSourceConfigOut], status_code=201)
async def create_data_source(
    body: DataSourceConfigCreate,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    ds = DataSourceConfig(**body.model_dump())
    db.add(ds)
    await db.flush()
    return ApiResponse(data=DataSourceConfigOut.model_validate(ds))


@router.put("/admin/data-sources/{ds_id}", response_model=ApiResponse[DataSourceConfigOut])
async def update_data_source(
    ds_id: str,
    body: DataSourceConfigCreate,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSourceConfig).where(DataSourceConfig.id == ds_id))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    for field, value in body.model_dump().items():
        setattr(ds, field, value)
    await db.flush()
    return ApiResponse(data=DataSourceConfigOut.model_validate(ds))


@router.delete("/admin/data-sources/{ds_id}", status_code=204)
async def delete_data_source(
    ds_id: str,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DataSourceConfig).where(DataSourceConfig.id == ds_id))
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")
    if ds.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete a default data source")
    await db.delete(ds)
