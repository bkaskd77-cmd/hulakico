"""Batch ETA risk route for the Admin dashboard (live delay features optional)."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from eta_risk import assess_eta_risk_batch
from main_auth import require_service_token

router = APIRouter()


class EtaRiskBatchItem(BaseModel):
    id: str
    lane: str
    destinationCity: str
    serviceClass: str
    status: str | None = None
    hoursInStatus: float | None = Field(default=None, ge=0, le=100_000)
    hoursSinceBooking: float | None = Field(default=None, ge=0, le=100_000)
    etaDaysMax: float | None = Field(default=None, ge=0, le=365)
    openExceptions: int | None = Field(default=None, ge=0, le=1000)
    routeOnTime: int | None = Field(default=None, ge=0)
    routeDelivered: int | None = Field(default=None, ge=0)


class EtaRiskBatchRequest(BaseModel):
    items: list[EtaRiskBatchItem] = Field(default_factory=list)


@router.post("/v1/eta-risk-batch")
def eta_risk_batch(
    body: EtaRiskBatchRequest,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    try:
        require_service_token(authorization)
        capped = body.items[:40]
        scored = assess_eta_risk_batch([item.model_dump() for item in capped])
        return JSONResponse(content={"results": scored})
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[eta_risk_batch_route.py:eta_risk_batch] {type(exc).__name__}: {exc}")
        return JSONResponse(
            content={"error": "ETA risk batch failed."},
            status_code=500,
        )
