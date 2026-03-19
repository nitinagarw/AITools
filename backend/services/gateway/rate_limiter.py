"""Simple in-memory sliding-window rate limiter."""

import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from .config import settings

_windows: dict[str, list[float]] = defaultdict(list)


async def check_rate_limit(request: Request) -> None:
    """Enforce per-user rate limiting (sliding window)."""
    user_id = request.headers.get("x-user-id", request.client.host if request.client else "unknown")
    now = time.time()
    window = _windows[user_id]

    cutoff = now - 60.0
    _windows[user_id] = [t for t in window if t > cutoff]

    if len(_windows[user_id]) >= settings.rate_limit_per_minute:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again shortly.",
            headers={"Retry-After": "60"},
        )
    _windows[user_id].append(now)
