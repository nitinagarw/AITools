"""Intelligence and analysis endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import CurrentUser, Role, get_current_user, require_role
from libs.shared.schemas import ApiResponse

from ..dependencies import get_db
from ..models import AnalysisReport, OrganizationAIModel
from ..schemas import AIModelOut, AnalysisReportOut, ChatRequest, ChatResponse, GraphNodeOut

router = APIRouter()


@router.get("/organizations/{org_id}/analysis", response_model=ApiResponse[list[AnalysisReportOut]])
async def list_analysis_reports(
    org_id: str,
    _user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AnalysisReport)
        .where(AnalysisReport.organization_id == org_id)
        .order_by(AnalysisReport.generated_at.desc())
    )
    reports = [AnalysisReportOut.model_validate(r) for r in result.scalars().all()]
    return ApiResponse(data=reports)


@router.post("/organizations/{org_id}/analysis/refresh", status_code=202)
async def trigger_analysis_refresh(
    org_id: str,
    _user: CurrentUser = Depends(require_role(Role.ADMIN, Role.ANALYST)),
):
    return {"message": "Analysis refresh triggered", "organization_id": org_id}


@router.get("/organizations/{org_id}/graph", response_model=ApiResponse[list[GraphNodeOut]])
async def get_org_graph(
    org_id: str,
    _user: CurrentUser = Depends(get_current_user),
):
    return ApiResponse(data=[])


@router.get("/organizations/{org_id}/model", response_model=ApiResponse[AIModelOut])
async def get_org_model(
    org_id: str,
    _user: CurrentUser = Depends(get_current_user),
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
    return ApiResponse(data=AIModelOut.model_validate(model))


@router.post("/organizations/{org_id}/chat", response_model=ApiResponse[ChatResponse])
async def chat(
    org_id: str,
    body: ChatRequest,
    _user: CurrentUser = Depends(get_current_user),
):
    return ApiResponse(
        data=ChatResponse(
            reply="Placeholder response. Chat integration pending.",
            sources=[],
            credits_used=0.0,
        )
    )
