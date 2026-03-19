"""Internal service-to-service endpoints for Organization Service."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import verify_internal_jwt
from libs.shared.schemas import ApiResponse

from ..dependencies import get_db
from ..models import Organization, PlatformSettings
from ..schemas import OrganizationOut, PlatformSettingsOut

router = APIRouter(prefix="/internal", dependencies=[Depends(verify_internal_jwt)])


@router.get("/organizations/{org_id}", response_model=ApiResponse[OrganizationOut])
async def get_org_internal(org_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return ApiResponse(data=OrganizationOut.model_validate(org))


@router.get("/settings", response_model=ApiResponse[PlatformSettingsOut])
async def get_settings_internal(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlatformSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Platform settings not initialized")
    return ApiResponse(data=PlatformSettingsOut.model_validate(settings))
