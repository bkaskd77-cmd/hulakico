"""Live Places adapter (Geoapify autocomplete) — opt-in via PLACES_PROVIDER=geoapify.

Needs GEOAPIFY_API_KEY in the service environment. The key never leaves this service.
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request

from address_suggest import normalize_place

ENDPOINT = "https://api.geoapify.com/v1/geocode/autocomplete"
LIMIT = 6
TIMEOUT_S = 4  # under the web app's 5 s limit, so a slow call still falls back cleanly


def _first(*values: object) -> str:
    for value in values:
        text = str(value or "").strip()
        if text:
            return text
    return ""


def _map_geoapify(item: dict) -> dict | None:
    try:
        country = _first(item.get("country_code")).upper()
        city = _first(item.get("city"), item.get("town"), item.get("village"), item.get("county"), item.get("state_district"))
        street = _first(item.get("street"))
        house = _first(item.get("housenumber"))
        area = _first(item.get("suburb"), item.get("district"), item.get("quarter"), item.get("neighbourhood"))
        name = _first(item.get("name"))
        is_business = item.get("result_type") == "amenity" or bool(item.get("category"))
        line1 = f"{house} {street}".strip() if street else _first(area, item.get("address_line1"))
        line2 = area if street and area and area != city else ""
        if is_business and name and line1 == name:
            line1 = _first(street, area, item.get("address_line2"))
        if not line1 or not city or len(country) != 2:
            return None
        return normalize_place(
            {
                "label": _first(item.get("formatted"), f"{line1}, {city}"),
                "kind": "BUSINESS" if is_business and name else "ADDRESS",
                "company": name if is_business else "",
                "line1": line1,
                "line2": line2,
                "city": city,
                "postalCode": _first(item.get("postcode")),
                "country": country,
            }
        )
    except Exception as exc:
        print(f"[places_geoapify.py:_map_geoapify] {type(exc).__name__}: {exc}")
        return None


class GeoapifyPlacesProvider:
    name = "geoapify"

    def __init__(self) -> None:
        self._key = (os.getenv("GEOAPIFY_API_KEY") or "").strip()

    def suggest(self, query: str, country_hint: str | None = None) -> list[dict]:
        q = (query or "").strip()
        if len(q) < 2:
            return []
        if not self._key:
            print("[places_geoapify.py:GeoapifyPlacesProvider.suggest] GEOAPIFY_API_KEY is not set.")
            return []
        try:
            params = {"text": q[:200], "format": "json", "limit": str(LIMIT), "lang": "en", "apiKey": self._key}
            hint = (country_hint or "").strip().lower()
            if len(hint) == 2 and hint.isalpha():
                params["filter"] = f"countrycode:{hint}"
            request = urllib.request.Request(
                f"{ENDPOINT}?{urllib.parse.urlencode(params)}",
                headers={"Accept": "application/json", "User-Agent": "HulakicoIntelligence/0.1"},
            )
            with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
                data = json.loads(response.read().decode("utf-8"))
            places = [p for p in (_map_geoapify(item) for item in data.get("results", [])) if p]
            return places[:LIMIT]
        except Exception as exc:
            # Message only: the request URL carries the API key and must not reach the logs.
            print(f"[places_geoapify.py:GeoapifyPlacesProvider.suggest] {type(exc).__name__}: {getattr(exc, 'code', '')} {getattr(exc, 'reason', '')}")
            return []
