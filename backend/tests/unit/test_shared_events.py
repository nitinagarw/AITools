"""Unit tests for libs.shared.events — UT-SH-10, UT-SH-11."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from libs.shared.events import EventBus, EventEnvelope


class TestEventEnvelope:
    def test_default_fields(self):
        env = EventEnvelope(
            event_type="test.event",
            source_service="test-service",
            payload={"key": "value"},
        )
        assert env.event_type == "test.event"
        assert env.source_service == "test-service"
        assert env.payload == {"key": "value"}
        assert env.event_id  # auto-generated
        assert env.timestamp  # auto-generated
        assert env.correlation_id  # auto-generated

    def test_serialization(self):
        env = EventEnvelope(
            event_type="pipeline.completed",
            source_service="pipeline-service",
            payload={"request_id": "abc-123"},
        )
        json_str = env.model_dump_json()
        parsed = EventEnvelope.model_validate_json(json_str)
        assert parsed.event_type == "pipeline.completed"
        assert parsed.payload["request_id"] == "abc-123"


class TestEventBus:
    @pytest.mark.asyncio
    async def test_publish(self, mock_redis):
        """UT-SH-10: EventBus.publish writes to correct Redis stream."""
        bus = EventBus(redis_url="redis://localhost:6379")
        bus._redis = mock_redis

        envelope = EventEnvelope(
            event_type="test.event",
            source_service="test",
            payload={"data": 42},
        )
        msg_id = await bus.publish("test.stream", envelope)

        mock_redis.xadd.assert_called_once()
        call_args = mock_redis.xadd.call_args
        assert call_args[0][0] == "test.stream"
        assert "data" in call_args[0][1]

    @pytest.mark.asyncio
    async def test_ensure_consumer_group_creates(self, mock_redis):
        bus = EventBus(redis_url="redis://localhost:6379")
        bus._redis = mock_redis
        await bus.ensure_consumer_group("stream", "group")
        mock_redis.xgroup_create.assert_called_once()

    @pytest.mark.asyncio
    async def test_connect_and_disconnect(self):
        bus = EventBus(redis_url="redis://localhost:6379")
        with patch("libs.shared.events.aioredis.from_url") as mock_from_url:
            mock_client = AsyncMock()
            mock_from_url.return_value = mock_client
            await bus.connect()
            assert bus._redis is not None
            await bus.disconnect()
            mock_client.aclose.assert_called_once()
