"""Multi-objective quote ranking for Hulakico."""

from __future__ import annotations


def _normalize_low_better(values: list[float]) -> list[float]:
    if not values:
        return []
    lo = min(values)
    hi = max(values)
    span = hi - lo
    if span <= 1e-9:
        return [1.0 for _ in values]
    return [1.0 - ((value - lo) / span) for value in values]


def rank_quote_options(
    options: list[dict],
    *,
    wants_cod: bool = False,
) -> list[dict]:
    """Rank quote options by price, ETA, and light reliability heuristic."""
    try:
        if not options:
            return []

        amounts = [float(item["amount"]) for item in options]
        eta_mids = [
            (float(item["etaDaysMin"]) + float(item["etaDaysMax"])) / 2.0
            for item in options
        ]
        price_scores = _normalize_low_better(amounts)
        eta_scores = _normalize_low_better(eta_mids)

        ranked: list[dict] = []
        for index, item in enumerate(options):
            name = str(item.get("carrierName", "")).lower()
            reliability = 0.72
            if "dhl" in name or "fedex" in name:
                reliability = 0.88
            elif "domestic" in name:
                reliability = 0.8

            cod_bonus = 0.05 if wants_cod else 0.0
            score = (
                0.55 * price_scores[index]
                + 0.35 * eta_scores[index]
                + 0.10 * reliability
                + cod_bonus
            )
            reason = (
                f"price={price_scores[index]:.2f}, "
                f"eta={eta_scores[index]:.2f}, "
                f"trust={reliability:.2f}"
            )
            ranked.append(
                {
                    **item,
                    "rankScore": round(score, 4),
                    "rankReason": reason,
                }
            )

        ranked.sort(key=lambda row: row["rankScore"], reverse=True)
        for position, row in enumerate(ranked, start=1):
            row["rank"] = position
        return ranked
    except Exception as exc:
        print(f"[ranker.py:rank_quote_options] {type(exc).__name__}: {exc}")
        raise
