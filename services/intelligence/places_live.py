"""Live Places adapter (Nominatim) — opt-in via PLACES_PROVIDER=nominatim."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request

from address_suggest import normalize_place

BUSINESS_CLASSES = {
    "amenity",
    "tourism",
    "shop",
    "office",
    "craft",
    "healthcare",
    "leisure",
}


def _kind_from_osm(item: dict) -> str:
    cls = (item.get("class") or "").lower()
    typ = (item.get("type") or "").lower()
    if cls in BUSINESS_CLASSES or typ in {"hotel", "guest_house", "hostel", "motel"}:
        return "BUSINESS"
    return "ADDRESS"


def _map_nominatim(item: dict) -> dict | None:
    try:
        addr = item.get("address") or {}
        kind = _kind_from_osm(item)
        name = (item.get("name") or addr.get("amenity") or addr.get("tourism") or "").strip()
        road = (addr.get("road") or addr.get("pedestrian") or addr.get("neighbourhood") or "").strip()
        city = (
            addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or addr.get("municipality")
            or ""
        ).strip()
        country = (addr.get("country_code") or "").strip().upper()
        postal = (addr.get("postcode") or "").strip()
        line1 = road or (item.get("display_name") or "").split(",")[0].strip()
        if not line1 or not city or not country:
            return None
        label = (item.get("display_name") or f"{line1}, {city}").strip()
        company = name if kind == "BUSINESS" else ""
        return normalize_place(
            {
                "label": label,
                "kind": kind,
                "company": company,
                "line1": line1,
                "line2": "",
                "city": city,
                "postalCode": postal,
                "country": country,
            }
        )
    except Exception as exc:
        print(f"[places_live.py:_map_nominatim] {type(exc).__name__}: {exc}")
        return None


class NominatimPlacesProvider:
    name = "nominatim"

    def suggest(self, query: str, country_hint: str | None = None) -> list[dict]:
        q = (query or "").strip()
        if len(q) < 2:
            return []
        try:
            params: dict[str, str] = {
                "q": q,
                "format": "json",
                "addressdetails": "1",
                "limit": "6",
            }
            hint = (country_hint or "").strip().lower()
            if hint:
                params["countrycodes"] = hint
            url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
                params
            )
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "HulakicoIntelligence/0.1 (local-dev; places-suggest)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=6) as response:
                raw = response.read().decode("utf-8")
            data = json.loads(raw)
            places: list[dict] = []
            for item in data if isinstance(data, list) else []:
                mapped = _map_nominatim(item)
                if mapped:
                    places.append(mapped)
            return places[:6]
        except Exception as exc:
            print(f"[places_live.py:NominatimPlacesProvider.suggest] {type(exc).__name__}: {exc}")
            return []
