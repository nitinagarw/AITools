"""SSO authentication and user resolution middleware for the API Gateway."""

import time
from typing import Any

import httpx
from fastapi import HTTPException, Request, status

from .config import settings

_user_cache: dict[str, tuple[dict[str, Any], float]] = {}
_CACHE_TTL = 300  # 5 minutes


async def resolve_user_from_sso(request: Request) -> dict[str, Any]:
    """Validate the SSO token and resolve the user profile from User Service.

    In production this would verify the SSO/OIDC token against the IdP,
    extract the subject (sso_id), then look up the user in User Service.
    For dev/staging, it also accepts a simple X-SSO-Id header for testing.
    """
    sso_id = _extract_sso_id(request)
    if not sso_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid SSO token",
        )

    cached = _user_cache.get(sso_id)
    if cached and (time.time() - cached[1]) < _CACHE_TTL:
        return cached[0]

    user = await _fetch_user_profile(sso_id)
    _user_cache[sso_id] = (user, time.time())
    return user


def _extract_sso_id(request: Request) -> str | None:
    """Extract SSO identity.

    Production: decode and verify the Bearer/OIDC token.
    Dev shortcut: accept X-SSO-Id header directly.
    """
    if dev_header := request.headers.get("x-sso-id"):
        return dev_header

    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        # TODO: validate OIDC token against settings.sso_issuer_url
        # For now, treat the token value as the sso_id (dev mode)
        return auth.removeprefix("Bearer ").strip() or None
    return None


async def _fetch_user_profile(sso_id: str) -> dict[str, Any]:
    """Look up user by SSO ID from User Service (internal API)."""
    from jose import jwt as josejwt

    internal_token = josejwt.encode(
        {"sub": "api-gateway", "iss": "ai360"},
        settings.jwt.internal_secret,
        algorithm=settings.jwt.algorithm,
    )
    url = f"{settings.user_service_url}/internal/users/{sso_id}"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(
                url, headers={"Authorization": f"Bearer {internal_token}"}
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="User Service unavailable")

    if resp.status_code == 404:
        raise HTTPException(status_code=401, detail="User not found in system")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Error resolving user profile")

    return resp.json()["data"]
