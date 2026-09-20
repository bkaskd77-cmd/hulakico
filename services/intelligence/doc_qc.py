"""Document / shipment field QC for international handovers."""

from __future__ import annotations


def run_document_qc(payload: dict) -> dict:
    """Check completeness and basic consistency before handover."""
    try:
        warnings: list[dict] = []
        lane = str(payload.get("lane", "DOMESTIC")).upper()
        contents = str(payload.get("contents", "")).strip()
        package_type = str(payload.get("packageType", "")).upper()
        declared = payload.get("declaredValue")
        currency = str(payload.get("currency", "")).upper()
        origin = str(payload.get("originAddress", "")).strip()
        destination = str(payload.get("destinationAddress", "")).strip()
        origin_country = str(payload.get("originCountry", "")).upper()
        dest_country = str(payload.get("destinationCountry", "")).upper()

        if len(contents) < 8:
            warnings.append(
                {
                    "code": "CONTENTS_TOO_SHORT",
                    "message": "Contents description is too vague for customs/handover.",
                }
            )

        if not origin or len(origin) < 8:
            warnings.append(
                {
                    "code": "ORIGIN_ADDRESS_WEAK",
                    "message": "Origin address looks incomplete.",
                }
            )

        if not destination or len(destination) < 8:
            warnings.append(
                {
                    "code": "DEST_ADDRESS_WEAK",
                    "message": "Destination address looks incomplete.",
                }
            )

        if lane == "INTERNATIONAL":
            if declared is None or float(declared) <= 0:
                warnings.append(
                    {
                        "code": "DECLARED_VALUE_MISSING",
                        "message": "International shipments need a declared value.",
                    }
                )
            if currency not in {"USD", "NPR"}:
                warnings.append(
                    {
                        "code": "CURRENCY_UNCLEAR",
                        "message": "Use NPR or USD for declared value currency.",
                    }
                )
            if origin_country == dest_country:
                warnings.append(
                    {
                        "code": "LANE_COUNTRY_MISMATCH",
                        "message": "Marked international but origin/destination countries match.",
                    }
                )
            if package_type == "DOCUMENT" and declared is not None and float(declared) > 500:
                warnings.append(
                    {
                        "code": "DOC_VALUE_HIGH",
                        "message": "Document package with high value — verify classification.",
                    }
                )
            if "invoice" not in contents.lower() and package_type != "DOCUMENT":
                warnings.append(
                    {
                        "code": "INVOICE_HINT",
                        "message": "Add commercial invoice reference in contents or upload docs (later).",
                    }
                )

        severity = "OK"
        if any(w["code"].endswith("MISSING") or "MISMATCH" in w["code"] for w in warnings):
            severity = "BLOCKER"
        elif warnings:
            severity = "WARN"

        return {
            "severity": severity,
            "passed": severity == "OK",
            "warnings": warnings,
        }
    except Exception as exc:
        print(f"[doc_qc.py:run_document_qc] {type(exc).__name__}: {exc}")
        raise
