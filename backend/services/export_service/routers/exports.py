"""Export endpoints (routed via API Gateway)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.auth import CurrentUser, get_current_user
from libs.shared.schemas import ApiResponse, PaginatedResponse, PaginationMeta

from ..dependencies import get_db
from ..models import ExportJob, ExportFormat, ExportStatus
from ..schemas import ExportJobCreate, ExportJobOut

router = APIRouter()


@router.post("/export", response_model=ApiResponse[ExportJobOut], status_code=status.HTTP_202_ACCEPTED)
async def create_export(
    body: ExportJobCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create an export job (status=queued). Returns 202 Accepted."""
    job = ExportJob(
        user_id=current_user.user_id,
        organization_id=body.organization_id,
        format=ExportFormat(body.format),
        sections=body.sections,
        status=ExportStatus.QUEUED,
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return ApiResponse(data=ExportJobOut.model_validate(job))


@router.get("/export", response_model=PaginatedResponse[ExportJobOut])
async def list_exports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Paginated list of export jobs for the current user."""
    count_result = await db.execute(
        select(sqlfunc.count()).select_from(ExportJob).where(ExportJob.user_id == current_user.user_id)
    )
    total = count_result.scalar() or 0
    total_pages = (total + page_size - 1) // page_size if total else 0

    result = await db.execute(
        select(ExportJob)
        .where(ExportJob.user_id == current_user.user_id)
        .order_by(ExportJob.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    jobs = [ExportJobOut.model_validate(j) for j in result.scalars().all()]

    return PaginatedResponse(
        data=jobs,
        pagination=PaginationMeta(
            page=page, page_size=page_size, total_items=total, total_pages=total_pages
        ),
    )


@router.get("/export/{export_id}", response_model=ApiResponse[ExportJobOut])
async def get_export(
    export_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single export job status."""
    result = await db.execute(
        select(ExportJob).where(
            ExportJob.id == export_id,
            ExportJob.user_id == current_user.user_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Export job not found")
    return ApiResponse(data=ExportJobOut.model_validate(job))


@router.get("/export/{export_id}/download")
async def download_export(
    export_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """If completed, return redirect URL or file path. If not ready, return 404."""
    result = await db.execute(
        select(ExportJob).where(
            ExportJob.id == export_id,
            ExportJob.user_id == current_user.user_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Export job not found")
    if job.status != ExportStatus.COMPLETED:
        raise HTTPException(status_code=404, detail="Export not ready for download")
    if job.download_url:
        from fastapi.responses import RedirectResponse

        return RedirectResponse(url=job.download_url, status_code=302)
    if job.file_path:
        from fastapi.responses import FileResponse

        return FileResponse(path=job.file_path, filename=f"export_{export_id}.{job.format.value}")
    raise HTTPException(status_code=404, detail="No download available")
