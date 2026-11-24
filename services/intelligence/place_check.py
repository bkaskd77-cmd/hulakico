"""City-in-country check: catches a foreign city booked under the wrong country.

Verdicts:
  OK            the city is known in the chosen country
  WRONG_COUNTRY not found in the chosen country, but clearly a city elsewhere (block)
  UNKNOWN       not found anywhere, e.g. a small village the map does not list (warn only)
"""

from __future__ import annotations

import json
import os
import re
import urllib.parse
import urllib.request

from eta_risk import MAJOR, VALLEY

ENDPOINT = "https://api.geoapify.com/v1/geocode/search"
TIMEOUT_S = 4
MIN_CONFIDENCE = 0.9
CACHE_MAX = 500
_cache: dict[tuple[str, str], dict] = {}

NP_SUFFIX = re.compile(r"\s+(sub-?metropolitan city|metropolitan city|rural municipality|municipality|nagarpalika|gaunpalika)$", re.IGNORECASE)
NP_KNOWN = VALLEY | MAJOR | {"itahari", "dhangadhi", "janakpurdham", "narayanghat", "damak", "birtamod", "ghorahi", "tulsipur", "lumbini"}


def _norm(name: str) -> str:
    return NP_SUFFIX.sub("", re.sub(r"\s+", " ", name or "").strip()).casefold()


def _search(city: str, country: str = "") -> list[dict] | None:
    """Up to 5 city matches (worldwide, or inside one country); None when the call fails."""
    key = (os.getenv("GEOAPIFY_API_KEY") or "").strip()
    if not key:
        print("[place_check.py:_search] GEOAPIFY_API_KEY is not set.")
        return None
    try:
        params = {"text": city[:100], "format": "json", "limit": "5", "lang": "en", "apiKey": key}
        if country:
            # Inside one country any place type counts: London, UK is listed as a region, not a city.
            params["filter"] = f"countrycode:{country.lower()}"
        else:
            params["type"] = "city"
        request = urllib.request.Request(
            f"{ENDPOINT}?{urllib.parse.urlencode(params)}",
            headers={"Accept": "application/json", "User-Agent": "HulakicoIntelligence/0.1"},
        )
        with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
            return json.loads(response.read().decode("utf-8")).get("results", [])
    except Exception as exc:
        # Message only: the request URL carries the API key and must not reach the logs.
        print(f"[place_check.py:_search] {type(exc).__name__}: {getattr(exc, 'code', '')} {getattr(exc, 'reason', '')}")
        return None


def _names(item: dict) -> set[str]:
    fields = ("city", "name", "town", "village", "county", "state", "state_district", "address_line1")
    names = {_norm(str(item.get(field) or "")) for field in fields}
    # Some big cities carry their name only in the label: "London, ENG, United Kingdom" (city = "Greater London").
    names.add(_norm(str(item.get("formatted") or "").split(",")[0]))
    return names - {""}


def wanted_in(city: str, item: dict) -> bool:
    """True when the geocoder result carries this city name."""
    return _norm(city) in _names(item)


def _confidence(item: dict) -> float:
    try:
        return float((item.get("rank") or {}).get("confidence", 0))
    except (TypeError, ValueError):
        return 0.0


def verdict_from(city: str, country: str, results: list[dict]) -> dict:
    """Pure decision from geocoder results, kept separate so it can be tested without the API."""
    wanted = _norm(city)
    named = [item for item in results if wanted in _names(item)]
    if any(str(item.get("country_code", "")).upper() == country for item in named):
        return {"verdict": "OK"}
    strong = [item for item in named if _confidence(item) >= MIN_CONFIDENCE]
    if strong:
        found = strong[0]
        return {
            "verdict": "WRONG_COUNTRY",
            "foundCountryCode": str(found.get("country_code", "")).upper(),
            "foundCountry": str(found.get("country") or ""),
        }
    return {"verdict": "UNKNOWN"}


def check_place(city: str, country: str) -> dict:
    """Check that a city belongs to the chosen country; cached, never raises."""
    try:
        code = (country or "").strip().upper()[:2]
        name = (city or "").strip()
        if len(name) < 2 or len(code) != 2:
            return {"verdict": "UNKNOWN"}
        if code == "NP" and _norm(name) in NP_KNOWN:
            return {"verdict": "OK"}
        key = (_norm(name), code)
        if key in _cache:
            return _cache[key]
        results = _search(name)
        if results is None:
            return {"verdict": "UNKNOWN"}
        result = verdict_from(name, code, results)
        if result["verdict"] == "WRONG_COUNTRY":
            # The worldwide top 5 can miss the right place (London, UK lost to London, Canada).
            # Search inside the chosen country before blocking anything.
            local = _search(name, code)
            if local is None:
                return {"verdict": "UNKNOWN"}
            if any(wanted_in(name, item) for item in local):
                result = {"verdict": "OK"}
        if len(_cache) >= CACHE_MAX:
            _cache.pop(next(iter(_cache)))
        _cache[key] = result
        return result
    except Exception as exc:
        print(f"[place_check.py:check_place] {type(exc).__name__}: {exc}")
        return {"verdict": "UNKNOWN"}
