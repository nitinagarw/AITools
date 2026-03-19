"""Pipeline Service — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from libs.shared.auth import configure_auth
from libs.shared.events import EventBus
from libs.shared.schemas import HealthResponse

from .config import settings
from .routers import pipelines


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_auth(settings.jwt.internal_secret, settings.jwt.algorithm)
    event_bus = EventBus(settings.redis.url)
    await event_bus.connect()
    app.state.event_bus = event_bus
    try:
        yield
    finally:
        await event_bus.disconnect()


app = FastAPI(
    title="AI360 Pipeline Orchestrator",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(pipelines.router, prefix="/api", tags=["Pipeline"])


@app.get("/health/live", response_model=HealthResponse)
async def liveness():
    return HealthResponse(service=settings.service_name)


@app.get("/health/ready", response_model=HealthResponse)
async def readiness():
    return HealthResponse(service=settings.service_name)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "services.pipeline_service.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
