"""Rule-based ETA delay risk for Nepal logistics lanes."""

from __future__ import annotations

from datetime import datetime, timezone

VALLEY = {"kathmandu", "lalitpur", "bhaktapur", "kirtipur", "madhyapur thimi"}
MAJOR = {
    "pokhara",
    "biratnagar",
    "birgunj",
    "butwal",
    "bharatpur",
    "chitwan",
    "dharan",
    "nepalgunj",
    "hetauda",
    "janakpur",
}


def assess_eta_risk(payload: dict) -> dict:
    """Return risk level, score 0-1, and human-readable factors."""
    try:
        lane = str(payload.get("lane", "DOMESTIC")).upper()
        dest = str(payload.get("destinationCity", "")).strip().lower()
        service = str(payload.get("serviceClass", "ECONOMY")).upper()
        month = datetime.now(timezone.utc).month

        score = 0.15
        factors: list[str] = []

        if lane == "INTERNATIONAL":
            score += 0.28
            factors.append("International lane via transit corridors")
        elif dest in VALLEY:
            score += 0.05
            factors.append("Valley destination - lower delay risk")
        elif dest in MAJOR:
            score += 0.12
            factors.append("Major city - moderate road variability")
        else:
            score += 0.28
            factors.append("Remote/hill district - higher delay risk")

        if month in {6, 7, 8, 9}:
            score += 0.18
            factors.append("Monsoon season - landslide/road disruption risk")

        if service == "ECONOMY":
            score += 0.1
            factors.append("Economy service - wider ETA window")
        elif service == "EXPRESS":
            score += 0.02
            factors.append("Express service - tighter SLA")

        score = max(0.0, min(1.0, score))
        if score >= 0.65:
            level = "HIGH"
        elif score >= 0.4:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "level": level,
            "score": round(score, 3),
            "factors": factors,
        }
    except Exception as exc:
        print(f"[eta_risk.py:assess_eta_risk] {type(exc).__name__}: {exc}")
        raise


def assess_eta_risk_batch(items: list[dict]) -> list[dict]:
    """Score many shipments; each item may include an opaque id for join-back."""
    try:
        results: list[dict] = []
        for item in items:
            scored = assess_eta_risk(item)
            row = {
                "id": item.get("id"),
                "level": scored["level"],
                "score": scored["score"],
                "factors": scored["factors"],
            }
            results.append(row)
        return results
    except Exception as exc:
        print(f"[eta_risk.py:assess_eta_risk_batch] {type(exc).__name__}: {exc}")
        raise
