"""Internal service-to-service endpoints for Intelligence Service."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import verify_internal_jwt
from libs.shared.schemas import ApiResponse

from ..dependencies import get_db
from ..models import OrganizationAIModel

router = APIRouter(prefix="/internal", dependencies=[Depends(verify_internal_jwt)])


@router.get("/organizations/{org_id}/kg/stats")
async def get_kg_stats(org_id: str):
    return {"node_count": 0, "edge_count": 0}


@router.get("/organizations/{org_id}/model/status")
async def get_model_status(
    org_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrganizationAIModel).where(
            OrganizationAIModel.organization_id == org_id
        )
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="AI model not found for organization")
    return {"status": model.status.value}
