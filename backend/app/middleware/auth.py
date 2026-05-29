"""Authentication middleware: API key and JWT support (#27)."""

import logging
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import APIKeyHeader
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.config.settings import settings
from app.models.api_key import APIKey

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def redact_api_key(key: str) -> str:
    """Return a log-safe redacted form of an API key.

    Keeps the first 3 and last 4 characters; replaces everything in between
    with ``***`` so the key is identifiable but not reconstructible.
    """
    if not key or len(key) <= 8:
        return "***"
    return f"{key[:3]}***{key[-4:]}"


def generate_api_key() -> str:
    return f"cb_{secrets.token_urlsafe(32)}"


def create_jwt_token(subject: str) -> dict:
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expiration_minutes
    )
    payload = {"sub": subject, "exp": expires, "iat": datetime.now(timezone.utc)}
    token = jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.jwt_expiration_minutes * 60,
    }


def decode_jwt_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.InvalidTokenError:
        return None


async def _resolve_api_key(
    api_key: Optional[str],
    db: AsyncSession,
    request: Optional[Request] = None,
) -> APIKey:
    """Shared key validation logic used by both require_api_key and require_admin_key."""
    path = request.url.path if request else "-"
    request_id = (request.headers.get("X-Request-ID", "-") if request else "-")

    if not api_key:
        logger.warning(
            "Auth failure: missing API key | path=%s request_id=%s", path, request_id
        )
        raise HTTPException(status_code=401, detail="API key required")

    result = await db.execute(
        select(APIKey).where(APIKey.key == api_key, APIKey.is_active == True)
    )
    key_record = result.scalar_one_or_none()
    if not key_record:
        logger.warning(
            "Auth failure: invalid or inactive API key | key=%s path=%s request_id=%s",
            redact_api_key(api_key),
            path,
            request_id,
        )
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")

    await db.execute(
        update(APIKey)
        .where(APIKey.id == key_record.id)
        .values(
            request_count=APIKey.request_count + 1,
            last_used_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()
    return key_record


async def require_api_key(
    request: Request,
    api_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    return await _resolve_api_key(api_key, db, request)


async def require_admin_key(
    request: Request,
    api_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    key_record = await _resolve_api_key(api_key, db, request)
    if not key_record.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return key_record
