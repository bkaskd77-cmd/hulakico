"""Places provider seam — selects stub now; live adapter in Step 2."""

from __future__ import annotations

import os
from typing import Protocol

from address_suggest import StubPlacesProvider


class PlacesProvider(Protocol):
    name: str

    def suggest(self, query: str, country_hint: str | None = None) -> list[dict]:
        ...


def get_places_provider() -> PlacesProvider:
    """Step 1 always returns stub. Step 2 may select a live provider via env."""
    try:
        provider_name = (os.getenv("PLACES_PROVIDER") or "stub").strip().lower()
        if provider_name and provider_name != "stub":
            print(
                f"[places_provider.py:get_places_provider] "
                f"Unknown provider '{provider_name}' — using stub until Step 2."
            )
        return StubPlacesProvider()
    except Exception as exc:
        print(f"[places_provider.py:get_places_provider] {type(exc).__name__}: {exc}")
        return StubPlacesProvider()
