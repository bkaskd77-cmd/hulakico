"""Stub place/address suggestions — swap for Places/geocoder later.

Each place carries kind:
  BUSINESS — hotel/company/org; may fill empty Company field
  ADDRESS  — street/area only; never treated as a company name
Phase 4 Places APIs map types (lodging, establishment vs street_address) into kind.
"""

from __future__ import annotations


CATALOG = [
    {
        "label": "The Soaltee Kathmandu — P72R+6CR, Tahachal Marg, Kathmandu, Bagmati Province 44600, Nepal",
        "kind": "BUSINESS",
        "company": "The Soaltee Kathmandu",
        "line1": "P72R+6CR, Tahachal Marg",
        "line2": "",
        "city": "Kathmandu",
        "postalCode": "44600",
        "country": "NP",
    },
    {
        "label": "Yak & Yeti Hotel, Kathmandu",
        "kind": "BUSINESS",
        "company": "Hotel Yak & Yeti",
        "line1": "Durbar Marg",
        "line2": "",
        "city": "Kathmandu",
        "postalCode": "44600",
        "country": "NP",
    },
    {
        "label": "Tribhuvan International Airport (KTM)",
        "kind": "BUSINESS",
        "company": "Tribhuvan International Airport",
        "line1": "Airport Road",
        "line2": "Sinamangal",
        "city": "Kathmandu",
        "postalCode": "44600",
        "country": "NP",
    },
    {
        "label": "Pokhara Lakeside, Lakeside Road",
        "kind": "ADDRESS",
        "company": "",
        "line1": "Lakeside Road",
        "line2": "Baidam",
        "city": "Pokhara",
        "postalCode": "33700",
        "country": "NP",
    },
    {
        "label": "Birgunj Customs / Dry Port area",
        "kind": "ADDRESS",
        "company": "",
        "line1": "Dry Port Road",
        "line2": "",
        "city": "Birgunj",
        "postalCode": "44300",
        "country": "NP",
    },
    {
        "label": "Clarion Hotel The Hub, Oslo",
        "kind": "BUSINESS",
        "company": "Clarion Hotel The Hub",
        "line1": "Biskop Gunnerus gate 3",
        "line2": "",
        "city": "Oslo",
        "postalCode": "0155",
        "country": "NO",
    },
    {
        "label": "Connaught Place, New Delhi",
        "kind": "ADDRESS",
        "company": "",
        "line1": "Connaught Place",
        "line2": "",
        "city": "New Delhi",
        "postalCode": "110001",
        "country": "IN",
    },
]


def normalize_place(place: dict) -> dict:
    """Ensure kind is set; never invent a company from the display label."""
    kind = (place.get("kind") or "").strip().upper()
    company = (place.get("company") or "").strip()
    if kind not in {"BUSINESS", "ADDRESS"}:
        kind = "BUSINESS" if company else "ADDRESS"
    return {
        **place,
        "kind": kind,
        "company": company if kind == "BUSINESS" else "",
    }


def suggest_places(query: str, country_hint: str | None = None) -> list[dict]:
    try:
        q = (query or "").strip().lower()
        if len(q) < 2:
            return []

        matches: list[dict] = []
        for place in CATALOG:
            hay = " ".join(
                [
                    place["label"],
                    place.get("company") or "",
                    place["line1"],
                    place["city"],
                ]
            ).lower()
            if q not in hay and not any(
                part in hay for part in q.split() if len(part) > 2
            ):
                continue
            matches.append(normalize_place(place))

        hint = (country_hint or "").strip().upper()
        if hint:
            matches.sort(key=lambda item: 0 if item["country"] == hint else 1)
        return matches[:6]
    except Exception as exc:
        print(f"[address_suggest.py:suggest_places] {type(exc).__name__}: {exc}")
        return []
