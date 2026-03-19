"""Main API Gateway router — authenticates, enforces RBAC, and proxies to downstream services."""

from fastapi import APIRouter, Request, Response

from ..auth_middleware import resolve_user_from_sso
from ..config import settings
from ..proxy import proxy_request
from ..rate_limiter import check_rate_limit
from ..rbac import check_rbac

router = APIRouter()

SERVICE_ROUTES: list[tuple[str, str]] = [
    ("/api/me", settings.user_service_url),
    ("/api/admin/users", settings.user_service_url),
    ("/api/admin/audit-log", settings.user_service_url),
    ("/api/search", settings.org_service_url),
    ("/api/organizations", settings.org_service_url),
    ("/api/compare", settings.org_service_url),
    ("/api/admin/settings", settings.org_service_url),
    ("/api/admin/data-sources", settings.org_service_url),
    ("/api/analysis-requests", settings.pipeline_service_url),
    ("/api/seed", settings.pipeline_service_url),
    ("/api/notifications", settings.notification_service_url),
    ("/api/export", settings.export_service_url),
]


def _resolve_target(path: str) -> str | None:
    for prefix, url in SERVICE_ROUTES:
        if path.startswith(prefix):
            return url

    if "/analysis" in path or "/graph" in path or "/model" in path or "/chat" in path:
        return settings.intelligence_service_url

    if "/credits" in path:
        return settings.credit_service_url

    return None


@router.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
)
async def gateway_proxy(request: Request, path: str) -> Response:
    full_path = f"/api/{path}"

    user = await resolve_user_from_sso(request)
    await check_rate_limit(request)
    check_rbac(request.method, full_path, user["role"])

    target_url = _resolve_target(full_path)
    if not target_url:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Unknown API route")

    user_headers = {
        "X-User-Id": user["id"],
        "X-User-SSO-Id": user["sso_id"],
        "X-User-Email": user["email"],
        "X-User-Role": user["role"],
        "X-User-Display-Name": user.get("display_name", ""),
        "X-Correlation-ID": request.headers.get("x-correlation-id", ""),
    }

    return await proxy_request(
        request, target_url, full_path, extra_headers=user_headers
    )
