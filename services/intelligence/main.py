"""Hulakico intelligence service — FastAPI entrypoint."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Hulakico Intelligence",
    description="AI/ML and algorithm engine for Hulakico logistics.",
    version="0.1.0",
)


@app.get("/health")
def health() -> JSONResponse:
    """Readiness probe for the intelligence service."""
    try:
        payload = {
            "status": "ok",
            "service": "hulakico-intelligence",
            "version": "0.1.0",
            "time": datetime.now(timezone.utc).isoformat(),
            "env": os.getenv("HULAKICO_ENV", "development"),
        }
        return JSONResponse(content=payload, status_code=200)
    except Exception as exc:
        print(
            f"[main.py:health] Failed health check: {type(exc).__name__}: {exc}"
        )
        return JSONResponse(
            content={
                "status": "error",
                "service": "hulakico-intelligence",
                "message": "Health check failed.",
            },
            status_code=500,
        )
