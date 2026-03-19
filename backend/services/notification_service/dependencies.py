"""FastAPI dependencies for Notification Service."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from libs.shared.database import create_session_factory, get_session

from .config import settings

_session_factory = create_session_factory(settings.db)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session(_session_factory):
        yield session
