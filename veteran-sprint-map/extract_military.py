#!/usr/bin/env python3
"""
extract_military.py — snapshot per-college service-member/veteran CPL counts.

Reads live_metrics.json (the daily CCCCO scrape committed in cpl-project-tracker)
and writes military_by_college.json keyed by the college names used in data.py,
so the maps can show how many veterans & service members each college has already
served through CPL. Refreshable: re-run whenever live_metrics.json updates.

live_metrics.json lookup order: $LIVE_METRICS, ./live_metrics.json,
../live_metrics.json, ../../live_metrics.json (repo root when nested in a subfolder).
"""
import json, os, sys
import data

# data.py name  ->  live_metrics.json name (when they differ; whitespace is also stripped)
ALIASES = {
    "Barstow College": "Barstow Community College",
    "Compton Community College": "Compton College",
    "Los Angeles Trade-Tech College": "Los Angeles Trade Technical College",
}

HERE = os.path.dirname(os.path.abspath(__file__))
CANDIDATES = [os.environ.get("LIVE_METRICS"),
              os.path.join(HERE, "live_metrics.json"),
              os.path.join(HERE, "..", "live_metrics.json"),
              os.path.join(HERE, "..", "..", "live_metrics.json")]

def find_live():
    for p in CANDIDATES:
        if p and os.path.exists(p):
            return p
    return None

def main():
    path = find_live()
    if not path:
        print("live_metrics.json not found in", [c for c in CANDIDATES if c], file=sys.stderr)
        sys.exit(1)
    d = json.load(open(path, encoding="utf-8"))
    # build a whitespace-insensitive lookup of name -> militaryStudents
    live = {}
    for tier in ("leading", "advancing", "inactive"):
        for c in d.get("tiers", {}).get(tier, {}).get("colleges", []):
            nm = (c.get("college") or "").strip()
            if nm:
                live[nm] = c.get("militaryStudents")

    out = {}
    missing = []
    for name, _, _ in data.COLLEGES:
        key = ALIASES.get(name, name).strip()
        val = live.get(key)
        if val is None:
            missing.append(name)
        out[name] = val if isinstance(val, (int, float)) else None

    total = sum(v for v in out.values() if isinstance(v, (int, float)))
    payload = {
        "_as_of": d.get("scraped_at"),
        "_source": "live_metrics.json (CCCCO MAP CPL Insights daily scrape)",
        "_statewide_military_total": total,
        "_note": "Per-college count of service members & veterans served through CPL. "
                 "Refresh by re-running extract_military.py against a newer live_metrics.json.",
        "colleges": out,
    }
    dest = os.path.join(HERE, "military_by_college.json")
    json.dump(payload, open(dest, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("saved", dest)
    print(f"colleges: {len(out)} | with count: {sum(1 for v in out.values() if v is not None)}"
          f" | statewide military total: {total:,} | as of {payload['_as_of']}")
    if missing:
        print("WARNING — no count for:", missing, file=sys.stderr)

if __name__ == "__main__":
    main()
