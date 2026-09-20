"""Hulakico intelligence service — FastAPI entrypoint."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from doc_qc import run_document_qc
from eta_risk import assess_eta_risk
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


class EtaRiskRequest(BaseModel):
    lane: str
    destinationCity: str
    serviceClass: str


class DocQcRequest(BaseModel):
    lane: str
    packageType: str
    contents: str
    declaredValue: float | None = None
    currency: str
    originAddress: str
    destinationAddress: str
    originCountry: str
    destinationCountry: str


def _require_service_token(authorization: str | None) -> None:
    expected = os.getenv("INTELLIGENCE_SERVICE_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=500, detail="Service token not configured.")
    if not authorization or authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Unauthorized.")


@app.get("/health")
def health() -> JSONResponse:
    try:
        return JSONResponse(
            content={
                "status": "ok",
                "service": "hulakico-intelligence",
                "version": "0.1.0",
                "time": datetime.now(timezone.utc).isoformat(),
            }
        )
    except Exception as exc:
        print(f"[main.py:health] {type(exc).__name__}: {exc}")
        return JSONResponse(content={"status": "error"}, status_code=500)


@app.post("/v1/rank-quotes")
def rank_quotes(
    body: RankRequest,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    try:
        _require_service_token(authorization)
        ranked = rank_quote_options(
            [option.model_dump() for option in body.options],
            wants_cod=body.wantsCod,
        )
        return JSONResponse(content={"options": ranked})
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[main.py:rank_quotes] {type(exc).__name__}: {exc}")
        return JSONResponse(content={"error": "Ranking failed."}, status_code=500)


@app.post("/v1/eta-risk")
def eta_risk(
    body: EtaRiskRequest,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    try:
        _require_service_token(authorization)
        return JSONResponse(content=assess_eta_risk(body.model_dump()))
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[main.py:eta_risk] {type(exc).__name__}: {exc}")
        return JSONResponse(content={"error": "ETA risk failed."}, status_code=500)


@app.post("/v1/document-qc")
def document_qc(
    body: DocQcRequest,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    try:
        _require_service_token(authorization)
        return JSONResponse(content=run_document_qc(body.model_dump()))
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[main.py:document_qc] {type(exc).__name__}: {exc}")
        return JSONResponse(content={"error": "Document QC failed."}, status_code=500)
