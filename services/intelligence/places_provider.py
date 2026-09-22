"""Places provider seam — stub by default; live via PLACES_PROVIDER env."""

from __future__ import annotations

import os
from typing import Protocol

from address_suggest import StubPlacesProvider


class PlacesProvider(Protocol):
    name: str

    def suggest(self, query: str, country_hint: str | None = None) -> list[dict]:
        ...


class FallbackPlacesProvider:
    """Prefer live results; use stub when live is empty or errors."""

    def __init__(self, primary: PlacesProvider, fallback: PlacesProvider) -> None:
        self._primary = primary
        self._fallback = fallback
        self.name = f"{primary.name}+{fallback.name}"

    def suggest(self, query: str, country_hint: str | None = None) -> list[dict]:
        try:
            places = self._primary.suggest(query, country_hint)
            hint = (country_hint or "").strip().upper()
            if hint:
                places = [p for p in places if (p.get("country") or "").upper() == hint]
            if places:
                return places
        except Exception as exc:
            print(f"[places_provider.py:FallbackPlacesProvider] {type(exc).__name__}: {exc}")
        return self._fallback.suggest(query, country_hint)


def get_places_provider() -> PlacesProvider:
    """
    PLACES_PROVIDER=stub (default) | nominatim
    nominatim uses OpenStreetMap; falls back to stub if no matches / network error.
    """
    stub = StubPlacesProvider()
    try:
        provider_name = (os.getenv("PLACES_PROVIDER") or "stub").strip().lower()
        if provider_name in {"", "stub"}:
            return stub
        if provider_name == "nominatim":
            from places_live import NominatimPlacesProvider

            return FallbackPlacesProvider(NominatimPlacesProvider(), stub)
        print(
            f"[places_provider.py:get_places_provider] "
            f"Unknown provider '{provider_name}' — using stub."
        )
        return stub
    except Exception as exc:
        print(f"[places_provider.py:get_places_provider] {type(exc).__name__}: {exc}")
        return stub
