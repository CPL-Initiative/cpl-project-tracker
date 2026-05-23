"""
Stamp `cte` (bool) on every M-ID and singleton based on its TOP code.

Reads:
  kb/coci_minted_courses.json     — minted M-ID catalog
  kb/coci_minted_singletons.json  — single-college M-IDs
  kb/reference/top_categories.json — TOP code -> CTE flag (parsed from
                                     the 2023 CCC Taxonomy of Programs Manual)

Writes (in place):
  kb/coci_minted_courses.json
  kb/coci_minted_singletons.json
  — adds `cte: bool` to each row whose `top_code` is in the reference map.
    Rows without a TOP code, or with a TOP code not in the reference (e.g.
    a stray noncredit category not in the manual), get `cte: null`.

Idempotent: re-running on already-stamped state just refreshes the values.

Why M-ID-level CTE matters:
  * The Common Subject Code tab aggregates this to discipline-level
    `cte_share` for the new CTE column.
  * Phase 5 of the §11 roadmap (CTE classifier → CIDx submission lane)
    consumes the M-ID-level flag directly. So we get most of Phase 5's
    data for free by doing this now.

Run from repo root:  python3 kb/_join_cte_from_top.py
"""
from __future__ import annotations

import json
import os
from collections import Counter
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TOP_REF = os.path.join(HERE, "reference", "top_categories.json")
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")


def load_cte_map():
    """Returns {top_code: bool} where True == CTE-designated (asterisk in the
    source manual). Unknown/missing codes are absent from the map (callers
    set cte=None for those)."""
    with open(TOP_REF, encoding="utf-8") as f:
        data = json.load(f)
    return {code: rec["cte"] for code, rec in data.get("codes", {}).items()}


def stamp_file(path: str, cte_map: dict, now_iso: str) -> dict:
    """Stamp cte on every row in `path`. Returns counts for the console summary."""
    with open(path, encoding="utf-8") as f:
        blob = json.load(f)
    courses = blob.get("courses") or {}
    counts = Counter()
    for rec in courses.values():
        top = (rec.get("top_code") or "").strip()
        if not top:
            rec["cte"] = None
            counts["no_top_code"] += 1
            continue
        if top in cte_map:
            rec["cte"] = bool(cte_map[top])
            counts["cte" if rec["cte"] else "non_cte"] += 1
        else:
            # TOP code is set but not in the manual — likely a niche/legacy
            # code (e.g. 6000-series noncredit not in the 2023 manual).
            rec["cte"] = None
            counts["top_unknown"] += 1
    blob["_cte_stamped_at"] = now_iso
    blob["_cte_source"] = "kb/reference/top_categories.json (CCC 2023 TOP Manual, 7th Ed)"
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(blob, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)
    return dict(counts)


def main():
    cte_map = load_cte_map()
    cte_count = sum(1 for v in cte_map.values() if v)
    print(f"[join_cte_from_top] CTE map: {len(cte_map)} TOP codes, {cte_count} CTE-designated")
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for path in (COURSES, SINGLETONS):
        c = stamp_file(path, cte_map, now_iso)
        n = sum(c.values())
        print(f"  {os.path.basename(path):32} n={n}  cte={c.get('cte',0)}  non_cte={c.get('non_cte',0)}  "
              f"no_top={c.get('no_top_code',0)}  top_unknown={c.get('top_unknown',0)}")


if __name__ == "__main__":
    main()
