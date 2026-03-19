"""Unit tests for libs.shared.config — UT-SH-07, UT-SH-08."""

from libs.shared.config import BaseServiceSettings, DatabaseSettings, RedisSettings


class TestDatabaseSettings:
    def test_default_values(self):
        """UT-SH-07: DatabaseSettings loads defaults."""
        settings = DatabaseSettings()
        assert settings.host == "localhost"
        assert settings.port == 5432
        assert settings.user == "ai360"
        assert "asyncpg" in settings.url
        assert "psycopg2" in settings.sync_url

    def test_env_prefix(self, monkeypatch):
        """UT-SH-07: DatabaseSettings reads DB_ env vars."""
        monkeypatch.setenv("DB_HOST", "db.test.internal")
        monkeypatch.setenv("DB_PORT", "5433")
        monkeypatch.setenv("DB_NAME", "test_db")
        settings = DatabaseSettings()
        assert settings.host == "db.test.internal"
        assert settings.port == 5433
        assert "test_db" in settings.url


class TestRedisSettings:
    def test_url_without_password(self):
        settings = RedisSettings(host="redis-host", port=6380, db=1)
        assert settings.url == "redis://redis-host:6380/1"

    def test_url_with_password(self):
        settings = RedisSettings(host="redis-host", password="secret")
        assert ":secret@" in settings.url


class TestBaseServiceSettings:
    def test_defaults(self):
        settings = BaseServiceSettings()
        assert settings.service_name == "ai360-service"
        assert settings.port == 8000
        assert settings.debug is False
        assert settings.log_level == "INFO"
