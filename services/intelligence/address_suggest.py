"""Stub Places catalog + adapter (kind-aware). Live provider comes in Step 2."""

from __future__ import annotations

GEO_WORDS = {
    "kathmandu", "pokhara", "birgunj", "biratnagar", "nepal", "delhi", "india",
    "oslo", "norway", "province", "bagmati", "road", "marg", "street", "hotel",
    "the", "and",
}

STUB_CATALOG: list[dict] = [
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
        "label": "Nabil Bank Limited — Bina Marg, Kathmandu",
        "kind": "BUSINESS",
        "company": "Nabil Bank Limited",
        "line1": "Bina Marg",
        "line2": "",
        "city": "Kathmandu",
        "postalCode": "44600",
        "country": "NP",
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
    kind = (place.get("kind") or "").strip().upper()
    company = (place.get("company") or "").strip()
    if kind not in {"BUSINESS", "ADDRESS"}:
        kind = "BUSINESS" if company else "ADDRESS"
    return {
        **place,
        "kind": kind,
        "company": company if kind == "BUSINESS" else "",
    }


def query_matches(query: str, place: dict) -> bool:
    q = query.strip().lower()
    if len(q) < 2:
        return False
    hay = " ".join(
        [
            place.get("label") or "",
            place.get("company") or "",
            place.get("line1") or "",
            place.get("city") or "",
        ]
    ).lower()
    if q in hay:
        return True
    parts = [part for part in q.split() if len(part) > 2]
    if not parts:
        return False
    distinctive = [part for part in parts if part not in GEO_WORDS]
    if distinctive:
        return any(part in hay for part in distinctive)
    return any(part in hay for part in parts)


class StubPlacesProvider:
    name = "stub"

    def suggest(
        self,
        query: str,
        country_hint: str | None = None,
        city_hint: str | None = None,
    ) -> list[dict]:
        try:
            # Strip trailing ", City" added by the UI so stub matching stays clean.
            q = (query or "").strip()
            city = (city_hint or "").strip()
            if city and q.lower().endswith(f", {city.lower()}"):
                q = q[: -(len(city) + 2)].strip()
            matches = [
                normalize_place(place)
                for place in STUB_CATALOG
                if query_matches(q, place)
            ]
            country = (country_hint or "").strip().upper()
            if country:
                matches = [item for item in matches if item.get("country") == country]
            if city:
                city_l = city.lower()
                matches = [
                    item
                    for item in matches
                    if city_l in (item.get("city") or "").lower()
                    or (item.get("city") or "").lower() in city_l
                ]
            return matches[:6]
        except Exception as exc:
            print(f"[address_suggest.py:StubPlacesProvider.suggest] {type(exc).__name__}: {exc}")
            return []


def suggest_places(query: str, country_hint: str | None = None) -> list[dict]:
    try:
        return StubPlacesProvider().suggest(query, country_hint)
    except Exception as exc:
        print(f"[address_suggest.py:suggest_places] {type(exc).__name__}: {exc}")
        return []
