"""Tests for the /health Redis probe (#428) and the production JWT
secret guard (#430).

Both checks live outside the standard service tests because they reach
into the FastAPI startup + module-level settings layer, so they're
kept in their own file to make the failure surface easy to read.
"""

import importlib
import os
import pathlib
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))


# ── #428 — Redis health probe ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_check_redis_health_returns_degraded_when_not_initialised():
    """If init_redis() was never called the probe must not crash."""
    from app.config import redis as redis_module

    # Save + clear the module-level pool.
    saved_pool = redis_module.redis_pool
    redis_module.redis_pool = None
    try:
        result = await redis_module.check_redis_health()
        assert result["status"] == "degraded"
        assert "not initialised" in result["detail"]
    finally:
        redis_module.redis_pool = saved_pool


@pytest.mark.asyncio
async def test_check_redis_health_healthy_on_successful_ping():
    from app.config import redis as redis_module

    fake = MagicMock()
    fake.ping = AsyncMock(return_value=True)

    saved_pool = redis_module.redis_pool
    redis_module.redis_pool = fake
    try:
        result = await redis_module.check_redis_health()
        assert result == {"status": "healthy"}
    finally:
        redis_module.redis_pool = saved_pool


@pytest.mark.asyncio
async def test_check_redis_health_degraded_on_exception():
    from app.config import redis as redis_module

    fake = MagicMock()
    fake.ping = AsyncMock(side_effect=RuntimeError("connection refused"))

    saved_pool = redis_module.redis_pool
    redis_module.redis_pool = fake
    try:
        result = await redis_module.check_redis_health()
        assert result["status"] == "degraded"
        assert "connection refused" in result["detail"]
    finally:
        redis_module.redis_pool = saved_pool


@pytest.mark.asyncio
async def test_health_endpoint_includes_redis_key():
    """The /health response must include a `redis` field with a status."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.config import redis as redis_module

    fake = MagicMock()
    fake.ping = AsyncMock(return_value=True)
    saved_pool = redis_module.redis_pool
    redis_module.redis_pool = fake

    # Mock DB + stellar so we exercise the redis path.
    with (
        patch("app.config.database.engine") as engine,
        patch.object(
            __import__("app.main", fromlist=["stellar_client"]).stellar_client,
            "health_check",
            AsyncMock(return_value={"status": "healthy"}),
        ),
    ):
        engine.connect.return_value.__aenter__.return_value.execute = AsyncMock()
        try:
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/health")
                body = resp.json()
                assert "redis" in body
                assert body["redis"]["status"] == "healthy"
        finally:
            redis_module.redis_pool = saved_pool


# ── #430 — Production JWT secret guard ──────────────────────────────────────


def _reload_settings_with(env_overrides):
    """Reimport `app.config.settings` with the given env overrides applied."""
    from app.config import settings as settings_module

    previous = {key: os.environ.get(key) for key in env_overrides}
    for key, value in env_overrides.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value
    try:
        return importlib.reload(settings_module)
    finally:
        for key, value in previous.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def test_production_mode_rejects_default_jwt_secret():
    with pytest.raises(Exception) as excinfo:
        _reload_settings_with(
            {
                "DEBUG": "false",
                "JWT_SECRET_KEY": "change-me-in-production",
            }
        )
    message = str(excinfo.value)
    # Should name the offending setting so the operator knows what to fix.
    assert "JWT_SECRET_KEY" in message
    assert "default JWT secret" in message.lower() or "default" in message.lower()


def test_production_mode_accepts_custom_jwt_secret():
    module = _reload_settings_with(
        {
            "DEBUG": "false",
            "JWT_SECRET_KEY": "this-is-a-real-secret-not-the-default",
        }
    )
    assert module.settings.debug is False
    assert module.settings.jwt_secret_key == "this-is-a-real-secret-not-the-default"


def test_debug_mode_keeps_default_secret_convenient():
    module = _reload_settings_with(
        {
            "DEBUG": "true",
            "JWT_SECRET_KEY": "change-me-in-production",
        }
    )
    assert module.settings.debug is True
    assert module.settings.jwt_secret_key == "change-me-in-production"
