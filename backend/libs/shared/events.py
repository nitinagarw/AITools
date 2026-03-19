"""Redis Streams event bus helpers for inter-service communication."""

import json
import uuid
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis
from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    source_service: str
    payload: dict[str, Any]
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class EventBus:
    """Thin async wrapper around Redis Streams for publishing and consuming events."""

    def __init__(self, redis_url: str) -> None:
        self._redis: aioredis.Redis | None = None
        self._redis_url = redis_url

    async def connect(self) -> None:
        self._redis = aioredis.from_url(self._redis_url, decode_responses=True)

    async def disconnect(self) -> None:
        if self._redis:
            await self._redis.aclose()

    async def publish(self, stream: str, event: EventEnvelope) -> str:
        assert self._redis is not None, "EventBus not connected"
        message_id = await self._redis.xadd(
            stream, {"data": event.model_dump_json()}
        )
        return message_id

    async def ensure_consumer_group(
        self, stream: str, group: str
    ) -> None:
        assert self._redis is not None
        try:
            await self._redis.xgroup_create(stream, group, id="0", mkstream=True)
        except aioredis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

    async def consume(
        self,
        stream: str,
        group: str,
        consumer: str,
        count: int = 10,
        block_ms: int = 5000,
    ) -> list[tuple[str, EventEnvelope]]:
        assert self._redis is not None
        results = await self._redis.xreadgroup(
            group, consumer, {stream: ">"}, count=count, block=block_ms
        )
        events: list[tuple[str, EventEnvelope]] = []
        for _stream_name, messages in results:
            for msg_id, fields in messages:
                envelope = EventEnvelope.model_validate_json(fields["data"])
                events.append((msg_id, envelope))
        return events

    async def ack(self, stream: str, group: str, message_id: str) -> None:
        assert self._redis is not None
        await self._redis.xack(stream, group, message_id)
