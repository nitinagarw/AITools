"""User Service — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from libs.shared.auth import configure_auth
from libs.shared.schemas import HealthResponse

from .config import settings
from .routers import internal, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_auth(settings.jwt.internal_secret, settings.jwt.algorithm)
    yield


app = FastAPI(
    title="AI360 User Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(internal.router, tags=["Internal"])


@app.get("/health/live", response_model=HealthResponse)
async def liveness():
    return HealthResponse(service=settings.service_name)


@app.get("/health/ready", response_model=HealthResponse)
async def readiness():
    return HealthResponse(service=settings.service_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.user_service.main:app", host=settings.host, port=settings.port, reload=settings.debug)
