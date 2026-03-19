"""API Gateway — FastAPI application entry point.

Single entry point for all client traffic. Handles:
- SSO authentication
- RBAC enforcement
- Rate limiting
- Request routing to downstream services
- CORS
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from libs.shared.schemas import HealthResponse

from .config import settings
from .routers import api


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="AI360 API Gateway",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)


@app.get("/health/live", response_model=HealthResponse)
async def liveness():
    return HealthResponse(service=settings.service_name)


@app.get("/health/ready", response_model=HealthResponse)
async def readiness():
    return HealthResponse(service=settings.service_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.gateway.main:app", host=settings.host, port=settings.port, reload=settings.debug)
