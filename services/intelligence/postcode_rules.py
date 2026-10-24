"""Postcode shape checks per country, so impossible codes are not pre-filled.

This only checks the FORMAT. It cannot tell whether a well-formed code is the right
one for the street (Nepal needs the 2025 official list for that; see PLAN.md).
"""

from __future__ import annotations

import re

# Countries without a public postcode system: never pre-fill one.
NO_POSTCODE = {"AE", "QA", "HK", "MO", "FJ", "GH"}

PATTERNS: dict[str, str] = {
    "NP": r"\d{5}",
    "IN": r"\d{6}",
    "US": r"\d{5}(-\d{4})?",
    "CA": r"[A-Z]\d[A-Z] ?\d[A-Z]\d",
    "GB": r"[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}",
    "AU": r"\d{4}",
    "NZ": r"\d{4}",
    "DE": r"\d{5}",
    "FR": r"\d{5}",
    "IT": r"\d{5}",
    "ES": r"\d{5}",
    "NL": r"\d{4} ?[A-Z]{2}",
    "BE": r"\d{4}",
    "CH": r"\d{4}",
    "AT": r"\d{4}",
    "NO": r"\d{4}",
    "DK": r"\d{4}",
    "SE": r"\d{3} ?\d{2}",
    "FI": r"\d{5}",
    "PL": r"\d{2}-\d{3}",
    "JP": r"\d{3}-?\d{4}",
    "KR": r"\d{5}",
    "CN": r"\d{6}",
    "SG": r"\d{6}",
    "MY": r"\d{5}",
    "TH": r"\d{5}",
    "BD": r"\d{4}",
    "LK": r"\d{5}",
    "PK": r"\d{5}",
    "SA": r"\d{5}(-\d{4})?",
    "KW": r"\d{5}",
    "BH": r"\d{3,4}",
    "OM": r"\d{3}",
    "MV": r"\d{5}",
}


def clean_postcode(country: str, postcode: str) -> str:
    """Return the postcode if it has a valid shape for the country, else an empty string."""
    code = (postcode or "").strip().upper()
    cc = (country or "").strip().upper()
    if not code or cc in NO_POSTCODE:
        return ""
    pattern = PATTERNS.get(cc)
    if pattern is None:
        return code[:12]  # unknown country: keep a short value as given
    return code if re.fullmatch(pattern, code) else ""
