"""Stub place/address suggestions — swap for Places/geocoder later."""

from __future__ import annotations


CATALOG = [
    {
        "label": "The Soaltee Kathmandu — P72R+6CR, Tahachal Marg, Kathmandu, Bagmati Province 44600, Nepal",
        "company": "The Soaltee Kathmandu",
        "line1": "P72R+6CR, Tahachal Marg",
        "line2": "",
        "city": "Kathmandu",
        "postalCode": "44600",
        "country": "NP",
    },
    {
        "label": "Yak & Yeti Hotel, Kathmandu",
        "company": "Hotel Yak & Yeti",
        "line1": "Durbar Marg",
        "line2": "",
        "city": "Kathmandu",
        "postalCode": "44600",
        "country": "NP",
    },
    {
        "label": "Tribhuvan International Airport (KTM)",
        "company": "Tribhuvan International Airport",
        "line1": "Airport Road",
        "line2": "Sinamangal",
        "city": "Kathmandu",
        "postalCode": "44600",
        "country": "NP",
    },
    {
        "label": "Pokhara Lakeside, Lakeside Road",
        "company": "",
        "line1": "Lakeside Road",
        "line2": "Baidam",
        "city": "Pokhara",
        "postalCode": "33700",
        "country": "NP",
    },
    {
        "label": "Birgunj Customs / Dry Port area",
        "company": "",
        "line1": "Dry Port Road",
        "line2": "",
        "city": "Birgunj",
        "postalCode": "44300",
        "country": "NP",
    },
    {
        "label": "Clarion Hotel The Hub, Oslo",
        "company": "Clarion Hotel The Hub",
        "line1": "Biskop Gunnerus gate 3",
        "line2": "",
        "city": "Oslo",
        "postalCode": "0155",
        "country": "NO",
    },
    {
        "label": "Connaught Place, New Delhi",
        "company": "",
        "line1": "Connaught Place",
        "line2": "",
        "city": "New Delhi",
        "postalCode": "110001",
        "country": "IN",
    },
]


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
            matches.append(place)

        hint = (country_hint or "").strip().upper()
        if hint:
            matches.sort(key=lambda item: 0 if item["country"] == hint else 1)
        return matches[:6]
    except Exception as exc:
        print(f"[address_suggest.py:suggest_places] {type(exc).__name__}: {exc}")
        return []
