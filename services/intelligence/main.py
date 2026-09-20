"""Hulakico intelligence service — FastAPI entrypoint."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ranker import rank_quote_options

load_dotenv()

app = FastAPI(
    title="Hulakico Intelligence",
    description="AI/ML and algorithm engine for Hulakico logistics.",
    version="0.1.0",
)


class RankOptionIn(BaseModel):
    id: str
    carrierName: str
    serviceName: str
    currency: str
    amount: float
    etaDaysMin: int
    etaDaysMax: int
    zoneLabel: str


class RankRequest(BaseModel):
    options: list[RankOptionIn] = Field(default_factory=list)
    wantsCod: bool = False


def _require_service_token(authorization: str | None) -> None:
    expected = os.getenv("INTELLIGENCE_SERVICE_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=500, detail="Service token not configured.")
    if not authorization or authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized.")


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
        print(f"[main.py:health] {type(exc).__name__}: {exc}")
        return JSONResponse(
            content={"status": "error", "message": "Health check failed."},
            status_code=500,
        )


@app.post("/v1/rank-quotes")
def rank_quotes(
    body: RankRequest,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    """Rank quote options with a multi-objective score."""
    try:
        _require_service_token(authorization)
        ranked = rank_quote_options(
            [option.model_dump() for option in body.options],
            wants_cod=body.wantsCod,
        )
        return JSONResponse(content={"options": ranked}, status_code=200)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[main.py:rank_quotes] {type(exc).__name__}: {exc}")
        return JSONResponse(
            content={"error": "Ranking failed.", "message": str(exc)},
            status_code=500,
        )
