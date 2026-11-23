"""City-in-country check route used by the booking form."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from main_auth import require_service_token
from place_check import check_place

router = APIRouter()


class PlaceCheckRequest(BaseModel):
    city: str = Field(min_length=1, max_length=120)
    country: str = Field(min_length=2, max_length=2)


@router.post("/v1/place-check")
def place_check(
    body: PlaceCheckRequest,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    try:
        require_service_token(authorization)
        return JSONResponse(content=check_place(body.city, body.country))
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[place_check_route.py:place_check] {type(exc).__name__}: {exc}")
        return JSONResponse(content={"verdict": "UNKNOWN"})
