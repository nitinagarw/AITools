"""Organization CRUD and dashboard endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from libs.shared.auth import CurrentUser, Role, get_current_user, require_role
from libs.shared.schemas import ApiResponse, PaginatedResponse, PaginationMeta

from ..dependencies import get_db
from ..models import (
    AnnualReport,
    FinancialSnapshot,
    NewsArticle,
    Organization,
    ScrapingFrequency,
)
from ..schemas import (
    AnnualReportOut,
    FinancialSnapshotOut,
    NewsArticleOut,
    OrgDashboard,
    OrganizationCreate,
    OrganizationOut,
    OrganizationUpdate,
    ScrapingFrequencyUpdate,
)

router = APIRouter()


@router.get("/search", response_model=PaginatedResponse[OrganizationOut])
async def search_organizations(
    q: str = Query("", min_length=0),
    sector: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Organization).where(Organization.is_active.is_(True))
    count_query = select(sqlfunc.count()).select_from(Organization).where(Organization.is_active.is_(True))

    if q:
        pattern = f"%{q}%"
        query = query.where(
            Organization.name.ilike(pattern) | Organization.ticker_symbol.ilike(pattern)
        )
        count_query = count_query.where(
            Organization.name.ilike(pattern) | Organization.ticker_symbol.ilike(pattern)
        )
    if sector:
        query = query.where(Organization.sector == sector)
        count_query = count_query.where(Organization.sector == sector)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size

    result = await db.execute(
        query.order_by(Organization.name).offset((page - 1) * page_size).limit(page_size)
    )
    orgs = [OrganizationOut.model_validate(o) for o in result.scalars().all()]

    return PaginatedResponse(
        data=orgs,
        pagination=PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=total_pages),
    )


@router.post("/organizations", response_model=ApiResponse[OrganizationOut], status_code=201)
async def create_organization(
    body: OrganizationCreate,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    org = Organization(**body.model_dump())
    db.add(org)
    await db.flush()
    return ApiResponse(data=OrganizationOut.model_validate(org))


@router.get("/organizations/{org_id}", response_model=ApiResponse[OrganizationOut])
async def get_organization(
    org_id: str,
    _user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return ApiResponse(data=OrganizationOut.model_validate(org))


@router.put("/organizations/{org_id}", response_model=ApiResponse[OrganizationOut])
async def update_organization(
    org_id: str,
    body: OrganizationUpdate,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    await db.flush()
    return ApiResponse(data=OrganizationOut.model_validate(org))


@router.put("/organizations/{org_id}/scraping-frequency", response_model=ApiResponse[OrganizationOut])
async def update_scraping_frequency(
    org_id: str,
    body: ScrapingFrequencyUpdate,
    _admin: CurrentUser = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.scraping_frequency = ScrapingFrequency(body.frequency)
    await db.flush()
    return ApiResponse(data=OrganizationOut.model_validate(org))


@router.get("/organizations/{org_id}/dashboard", response_model=ApiResponse[OrgDashboard])
async def get_org_dashboard(
    org_id: str,
    _user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    fin_result = await db.execute(
        select(FinancialSnapshot)
        .where(FinancialSnapshot.organization_id == org_id)
        .order_by(FinancialSnapshot.snapshot_date.desc())
        .limit(1)
    )
    latest_fin = fin_result.scalar_one_or_none()

    news_result = await db.execute(
        select(NewsArticle)
        .where(NewsArticle.organization_id == org_id, NewsArticle.is_archived.is_(False))
        .order_by(NewsArticle.published_at.desc())
        .limit(10)
    )
    recent_news = news_result.scalars().all()

    ar_result = await db.execute(
        select(AnnualReport)
        .where(AnnualReport.organization_id == org_id)
        .order_by(AnnualReport.fiscal_year.desc())
    )
    annual_reports = ar_result.scalars().all()

    return ApiResponse(
        data=OrgDashboard(
            organization=OrganizationOut.model_validate(org),
            latest_financial=FinancialSnapshotOut.model_validate(latest_fin) if latest_fin else None,
            recent_news=[NewsArticleOut.model_validate(n) for n in recent_news],
            annual_reports=[AnnualReportOut.model_validate(r) for r in annual_reports],
        )
    )


@router.get("/organizations/{org_id}/news", response_model=PaginatedResponse[NewsArticleOut])
async def list_org_news(
    org_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sentiment: str | None = None,
    _user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(NewsArticle).where(
        NewsArticle.organization_id == org_id, NewsArticle.is_archived.is_(False)
    )
    count_query = select(sqlfunc.count()).select_from(NewsArticle).where(
        NewsArticle.organization_id == org_id, NewsArticle.is_archived.is_(False)
    )
    if sentiment:
        query = query.where(NewsArticle.sentiment == sentiment)
        count_query = count_query.where(NewsArticle.sentiment == sentiment)

    total = (await db.execute(count_query)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size

    result = await db.execute(
        query.order_by(NewsArticle.published_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    articles = [NewsArticleOut.model_validate(a) for a in result.scalars().all()]

    return PaginatedResponse(
        data=articles,
        pagination=PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=total_pages),
    )


@router.get("/organizations/{org_id}/financials", response_model=PaginatedResponse[FinancialSnapshotOut])
async def list_org_financials(
    org_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    _user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count_query = select(sqlfunc.count()).select_from(FinancialSnapshot).where(
        FinancialSnapshot.organization_id == org_id
    )
    total = (await db.execute(count_query)).scalar() or 0
    total_pages = (total + page_size - 1) // page_size

    result = await db.execute(
        select(FinancialSnapshot)
        .where(FinancialSnapshot.organization_id == org_id)
        .order_by(FinancialSnapshot.snapshot_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    snapshots = [FinancialSnapshotOut.model_validate(s) for s in result.scalars().all()]

    return PaginatedResponse(
        data=snapshots,
        pagination=PaginationMeta(page=page, page_size=page_size, total_items=total, total_pages=total_pages),
    )


@router.get("/organizations/{org_id}/annual-reports", response_model=ApiResponse[list[AnnualReportOut]])
async def list_annual_reports(
    org_id: str,
    _user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AnnualReport)
        .where(AnnualReport.organization_id == org_id)
        .order_by(AnnualReport.fiscal_year.desc())
    )
    reports = [AnnualReportOut.model_validate(r) for r in result.scalars().all()]
    return ApiResponse(data=reports)
