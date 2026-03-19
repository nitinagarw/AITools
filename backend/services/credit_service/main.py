"""Credit Service — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from libs.shared.auth import configure_auth
from libs.shared.schemas import HealthResponse

from .config import settings
from .routers import credits, internal


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_auth(settings.jwt.internal_secret, settings.jwt.algorithm)
    yield


app = FastAPI(
    title="AI360 Credit Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(credits.router, prefix="/api", tags=["Credits"])
app.include_router(internal.router, tags=["Internal"])


@app.get("/health/live", response_model=HealthResponse)
async def liveness():
    return HealthResponse(service=settings.service_name)


@app.get("/health/ready", response_model=HealthResponse)
async def readiness():
    return HealthResponse(service=settings.service_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "services.credit_service.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
