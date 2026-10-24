"""Turn a Grype JSON report into CI annotations and fail on fixable high/critical issues.

Usage: python3 .github/scripts/grype-report.py <report.json> <image-label>
One annotation per affected package, so the run page lists what to upgrade.
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict

FILE = "grype-report.py"
BLOCKING = {"High", "Critical"}


def load_report(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        print(f"::error title=Image scan::[{FILE}:load_report] Cannot read {path}: {error}")
        sys.exit(1)


def blocking_by_package(report: dict) -> dict[tuple[str, str, str], dict]:
    grouped: dict[tuple[str, str, str], dict] = defaultdict(
        lambda: {"ids": set(), "fixes": set(), "severity": "High"}
    )
    for match in report.get("matches", []):
        vuln = match.get("vulnerability", {})
        fix = vuln.get("fix", {})
        if vuln.get("severity") not in BLOCKING or fix.get("state") != "fixed":
            continue
        art = match.get("artifact", {})
        key = (art.get("name", "?"), art.get("version", "?"), art.get("type", "?"))
        entry = grouped[key]
        entry["ids"].add(vuln.get("id", "?"))
        entry["fixes"].update(fix.get("versions", []))
        if vuln.get("severity") == "Critical":
            entry["severity"] = "Critical"
    return grouped


def main() -> None:
    if len(sys.argv) != 3:
        print(f"::error title=Image scan::[{FILE}:main] Usage: grype-report.py <report.json> <label>")
        sys.exit(1)
    path, label = sys.argv[1], sys.argv[2]
    grouped = blocking_by_package(load_report(path))
    for (name, version, kind), entry in sorted(grouped.items()):
        ids = ", ".join(sorted(entry["ids"]))
        fixes = ", ".join(sorted(entry["fixes"])) or "see advisory"
        print(
            f"::error title={label}: {entry['severity']} in {name}::"
            f"{name} {version} ({kind}) -> fixed in {fixes}. {ids}"
        )
    if grouped:
        print(f"[{FILE}] {label}: {len(grouped)} package(s) with fixable high/critical issues.")
        sys.exit(1)
    print(f"[{FILE}] {label}: no fixable high/critical issues.")


if __name__ == "__main__":
    main()
