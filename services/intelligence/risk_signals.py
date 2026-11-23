"""Live delay signals: time in status, ETA progress, festival load, learned route reliability.

Each signal returns (score_delta, factor_text) or (0.0, None) when it does not apply.
Weights are hand-set now; they are the features a fitted model will replace once
enough delivered shipments exist.
"""

from __future__ import annotations

from datetime import datetime

# Longest normal stay in each status, in hours, before the shipment counts as stuck.
EXPECTED_DWELL_HOURS = {
    "BOOKED": 24.0,
    "HANDOVER_PENDING": 24.0,
    "OUT_FOR_DELIVERY": 12.0,
}
TRANSIT_DWELL_HOURS = {"DOMESTIC": 72.0, "INTERNATIONAL": 120.0}

# Prior belief about on-time delivery before any history exists (Beta prior).
PRIOR_ON_TIME = 0.8
PRIOR_WEIGHT = 10.0


def _number(value: object) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def dwell_signal(status: str, lane: str, hours_in_status: object) -> tuple[float, str | None]:
    """Penalise a shipment that has stayed in one status longer than normal."""
    hours = _number(hours_in_status)
    if hours is None or hours < 0:
        return 0.0, None
    if status == "EXCEPTION":
        return 0.25, f"On hold for {hours:.0f} h"
    limit = TRANSIT_DWELL_HOURS.get(lane, 72.0) if status == "IN_TRANSIT" else EXPECTED_DWELL_HOURS.get(status)
    if limit is None:
        return 0.0, None
    ratio = hours / limit
    if ratio >= 2.0:
        return 0.3, f"No movement for {hours:.0f} h ({ratio:.1f}x the normal {limit:.0f} h)"
    if ratio >= 1.0:
        return 0.15, f"In {status.replace('_', ' ').lower()} longer than usual ({hours:.0f} h)"
    return 0.0, None


def eta_progress_signal(hours_since_booking: object, eta_days_max: object) -> tuple[float, str | None]:
    """Compare time already used with the promised delivery window."""
    used = _number(hours_since_booking)
    promised = _number(eta_days_max)
    if used is None or promised is None or promised <= 0:
        return 0.0, None
    fraction = used / (promised * 24.0)
    if fraction > 1.0:
        return 0.4, f"Past the promised {promised:.0f}-day window"
    if fraction >= 0.8:
        return 0.15, f"{fraction:.0%} of the promised window used"
    return 0.0, None


def festival_signal(now: datetime) -> tuple[float, str | None]:
    """Dashain, Tihar and Chhath fall between October and mid-November; couriers back up."""
    if now.month == 10 or (now.month == 11 and now.day <= 20):
        return 0.1, "Festival season (Dashain, Tihar, Chhath): courier backlogs"
    return 0.0, None


def exception_signal(open_exceptions: object) -> tuple[float, str | None]:
    """Each open exception case is a strong sign of delay."""
    count = _number(open_exceptions)
    if count is None or count <= 0:
        return 0.0, None
    return min(0.35, 0.2 + 0.05 * (count - 1)), f"{count:.0f} open exception case(s)"


def route_reliability(on_time: object, delivered: object) -> dict:
    """Beta-Binomial estimate of on-time rate; starts at the prior and learns per route."""
    hits = max(0.0, _number(on_time) or 0.0)
    total = max(hits, _number(delivered) or 0.0)
    rate = (hits + PRIOR_ON_TIME * PRIOR_WEIGHT) / (total + PRIOR_WEIGHT)
    confidence = total / (total + PRIOR_WEIGHT)
    return {"rate": round(rate, 3), "confidence": round(confidence, 3), "samples": int(total)}


def history_signal(on_time: object, delivered: object) -> tuple[float, str | None]:
    """Add risk when this route and partner have a poor on-time record."""
    estimate = route_reliability(on_time, delivered)
    if estimate["samples"] == 0:
        return 0.0, None
    gap = PRIOR_ON_TIME - estimate["rate"]
    text = f"Route on time {estimate['rate']:.0%} of the time ({estimate['samples']} delivered)"
    if gap <= 0:
        return -0.05 * estimate["confidence"], text
    return min(0.25, gap * 1.2), text
