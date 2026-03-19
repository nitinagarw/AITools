"""HTTP reverse proxy helper that forwards requests to backend services."""

from typing import Any

import httpx
from fastapi import HTTPException, Request, Response


async def proxy_request(
    request: Request,
    target_base_url: str,
    path: str,
    *,
    extra_headers: dict[str, str] | None = None,
    timeout: float = 30.0,
) -> Response:
    """Forward an incoming request to a downstream service and return its response."""
    url = f"{target_base_url.rstrip('/')}/{path.lstrip('/')}"

    headers = dict(request.headers)
    headers.pop("host", None)
    if extra_headers:
        headers.update(extra_headers)

    body = await request.body()

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params),
            )
        except httpx.ConnectError as exc:
            raise HTTPException(status_code=502, detail=f"Service unavailable: {exc}") from exc
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="Upstream service timeout") from exc

    excluded_headers = {"content-encoding", "content-length", "transfer-encoding"}
    response_headers = {
        k: v for k, v in resp.headers.items() if k.lower() not in excluded_headers
    }
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
        media_type=resp.headers.get("content-type"),
    )
