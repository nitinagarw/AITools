"""Authentication and RBAC dependencies shared across services."""

from enum import StrEnum
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel


class Role(StrEnum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class CurrentUser(BaseModel):
    user_id: str
    sso_id: str
    email: str
    role: Role
    display_name: str | None = None


_internal_secret: str = "internal-cluster-key"
_algorithm: str = "HS256"


def configure_auth(internal_secret: str, algorithm: str = "HS256") -> None:
    global _internal_secret, _algorithm
    _internal_secret = internal_secret
    _algorithm = algorithm


def _decode_internal_token(token: str) -> dict:
    try:
        return jwt.decode(token, _internal_secret, algorithms=[_algorithm])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal JWT",
        ) from exc


async def get_current_user(
    x_user_id: Annotated[str | None, Header()] = None,
    x_user_role: Annotated[str | None, Header()] = None,
    x_user_email: Annotated[str | None, Header()] = None,
    x_user_sso_id: Annotated[str | None, Header()] = None,
    x_user_display_name: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    """Extract user context injected by the API Gateway.

    The Gateway validates the SSO token, resolves the user profile from User
    Service, and forwards identity headers to downstream services.
    """
    if not x_user_id or not x_user_role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user context headers (request must pass through API Gateway)",
        )
    return CurrentUser(
        user_id=x_user_id,
        sso_id=x_user_sso_id or "",
        email=x_user_email or "",
        role=Role(x_user_role),
        display_name=x_user_display_name,
    )


def require_role(*allowed_roles: Role):
    """FastAPI dependency that rejects requests from users without an allowed role."""

    async def _check(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not authorized. Required: {[str(r) for r in allowed_roles]}",
            )
        return user

    return _check


async def verify_internal_jwt(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """Validate internal service-to-service JWT (Bearer token)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed internal authorization header",
        )
    token = authorization.removeprefix("Bearer ")
    return _decode_internal_token(token)
