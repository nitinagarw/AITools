"""Pipeline and analysis request endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import CurrentUser, Role, get_current_user, require_role
from libs.shared.events import EventBus, EventEnvelope
from libs.shared.schemas import ApiResponse, PaginatedResponse, PaginationMeta

from ..dependencies import get_db
from ..models import AnalysisRequest, RequestStatus
from ..schemas import (
    AnalysisRequestCreate,
    AnalysisRequestOut,
    SeedInitRequest,
    SeedStatusOut,
)

router = APIRouter()


def get_event_bus(request: Request) -> EventBus:
    return request.app.state.event_bus


@router.post("/analysis-requests", response_model=ApiResponse[AnalysisRequestOut], status_code=201)
async def submit_analysis_request(
    body: AnalysisRequestCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    event_bus: EventBus = Depends(get_event_bus),
):
    request = AnalysisRequest(
        user_id=user.user_id,
        organization_name=body.organization_name,
        ticker_symbol=body.ticker_symbol,
        sector=body.sector,
        status=RequestStatus.QUEUED,
    )
    db.add(request)
    await db.flush()

    envelope = EventEnvelope(
        event_type="pipeline.analysis_requested",
        source_service="pipeline-service",
        payload={
            "request_id": request.id,
            "user_id": user.user_id,
            "organization_name": body.organization_name,
            "ticker_symbol": body.ticker_symbol,
            "sector": body.sector,
        },
    )
    await event_bus.publish("pipeline.requests", envelope)

    return ApiResponse(data=AnalysisRequestOut.model_validate(request))


@router.get("/analysis-requests", response_model=PaginatedResponse[AnalysisRequestOut])
async def list_analysis_requests(
    page: int = 1,
    page_size: int = 20,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count_query = select(sqlfunc.count()).select_from(AnalysisRequest).where(
        AnalysisRequest.user_id == user.user_id
    )
    total = (await db.execute(count_query)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    result = await db.execute(
        select(AnalysisRequest)
        .where(AnalysisRequest.user_id == user.user_id)
        .order_by(AnalysisRequest.submitted_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    requests = [AnalysisRequestOut.model_validate(r) for r in result.scalars().all()]

    return PaginatedResponse(
        data=requests,
        pagination=PaginationMeta(
            page=page, page_size=page_size, total_items=total, total_pages=total_pages
        ),
    )


@router.get("/analysis-requests/{request_id}", response_model=ApiResponse[AnalysisRequestOut])
async def get_analysis_request(
    request_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AnalysisRequest).where(
            AnalysisRequest.id == request_id,
            AnalysisRequest.user_id == user.user_id,
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Analysis request not found")
    return ApiResponse(data=AnalysisRequestOut.model_validate(req))


@router.put("/analysis-requests/{request_id}/cancel", response_model=ApiResponse[AnalysisRequestOut])
async def cancel_analysis_request(
    request_id: str,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AnalysisRequest).where(
            AnalysisRequest.id == request_id,
            AnalysisRequest.user_id == user.user_id,
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Analysis request not found")
    if req.status != RequestStatus.QUEUED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only queued requests can be cancelled",
        )
    req.status = RequestStatus.CANCELLED
    await db.flush()
    return ApiResponse(data=AnalysisRequestOut.model_validate(req))


@router.post("/seed/initialize", status_code=202)
async def seed_initialize(
    body: SeedInitRequest,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
):
    return {"message": "Seed initialization accepted", "organization_ids": body.organization_ids}


@router.get("/seed/status", response_model=ApiResponse[list[SeedStatusOut]])
async def seed_status(
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
):
    return ApiResponse(data=[])
