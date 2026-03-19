"""RBAC enforcement for the API Gateway routing layer."""

from fastapi import HTTPException, Request, status

ROUTE_PERMISSIONS: dict[str, dict[str, list[str]]] = {
    # Admin-only routes
    "PUT /api/admin/*":  {"roles": ["admin"]},
    "GET /api/admin/*":  {"roles": ["admin"]},
    "POST /api/admin/*": {"roles": ["admin"]},
    "DELETE /api/admin/*": {"roles": ["admin"]},
    "POST /api/seed/*":  {"roles": ["admin"]},
    "GET /api/seed/*":   {"roles": ["admin"]},

    # Analyst + Admin routes
    "POST /api/analysis-requests":           {"roles": ["admin", "analyst"]},
    "POST /api/organizations/*/analysis/*":  {"roles": ["admin", "analyst"]},
    "POST /api/organizations/*/chat":        {"roles": ["admin", "analyst"]},
    "POST /api/export":                      {"roles": ["admin", "analyst"]},

    # All authenticated roles
    "GET /api/*": {"roles": ["admin", "analyst", "viewer"]},
    "PUT /api/me/*": {"roles": ["admin", "analyst", "viewer"]},
}


def check_rbac(method: str, path: str, user_role: str) -> None:
    """Check if the user's role allows access to the given method + path.

    Uses a simple pattern-matching approach with wildcard support.
    More specific patterns are checked first.
    """
    key = f"{method.upper()} {path}"

    for pattern, config in ROUTE_PERMISSIONS.items():
        if _match_pattern(key, pattern):
            if user_role not in config["roles"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{user_role}' is not authorized for {method.upper()} {path}",
                )
            return

    # If no pattern matches, deny by default for /api/ routes
    if path.startswith("/api/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No RBAC policy found for this route",
        )


def _match_pattern(key: str, pattern: str) -> bool:
    """Simple wildcard pattern matching (* matches any single path segment, ** not supported)."""
    key_parts = key.split("/")
    pattern_parts = pattern.split("/")

    if len(key_parts) < len(pattern_parts):
        return False

    for k, p in zip(key_parts, pattern_parts):
        if p == "*":
            continue
        if k != p:
            return False
    return True
