"""Shared service-token gate for intelligence routes."""

from __future__ import annotations

import os

from fastapi import HTTPException


def require_service_token(authorization: str | None) -> None:
    expected = os.getenv("INTELLIGENCE_SERVICE_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=500, detail="Service token not configured.")
    if not authorization or authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized.")
