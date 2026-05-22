"""
TOP-aware discipline inference for blank-discipline COCI staging courses.

Every staging course carries a `top_code` (the MAP TOP code, e.g. "0948.00").
The TOP program title is a curated category that often names the discipline
outright ("0948.00" = Automotive Technology, "1230.10" = Registered Nursing).
This pass maps the unambiguous TOP codes to an MQ discipline via the authored
kb/top_discipline_map.json and fills blanks with it.

IMPORTANT — colleges vary in how they assign TOP codes, so this is a *signal of
intent*, not ground truth: fills are written at confidence 0.5 with
discipline_source="top_code", surfaced for reviewer verification (the tab's
Generated-by filter + ⚙ badge). The coarse catch-all codes (4930.xx
Interdisciplinary/Basic-Skills/Guidance, the "*99.00 Other" and "* General"
buckets) are DELIBERATELY omitted from the map, so they stay blank rather than
get a misleading lump-discipline.

Guardrails (same as the sibling inference passes):
  * Every target discipline MUST exist in reference/mq_disciplines.json.
  * NEVER touches a reviewed (`reviewed_at`) or curated (coci_curation.json) entry.
  * Only fills entries whose `discipline` is still blank. Idempotent / re-runnable.

Run from repo root:  python3 kb/_infer_disciplines_from_top.py
"""
import json
import os
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIDENCE = 0.5
SOURCE = "top_code"


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def dump(name, obj):
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
        f.write("\n")


def main():
    valid = set(load(os.path.join("reference", "mq_disciplines.json"))["disciplines"])
    topmap = load("top_discipline_map.json")["map"]
    bad = {d for d in topmap.values() if d not in valid}
    if bad:
        print("ABORT — top_discipline_map targets not in reference/mq_disciplines.json:")
        for d in sorted(bad):
            print("   ", repr(d))
        raise SystemExit(1)

    curated = set((load("coci_curation.json") or {}).get("curations", {}).keys())
    today = date.today().isoformat()
    stats = Counter()
    by_disc = Counter()

    def fill(record):
        if record.get("reviewed_at") or record.get("discipline"):
            return False
        code = str(record.get("top_code") or "").strip()
        disc = topmap.get(code)
        if not disc:
            stats["no_map"] += 1
            return False
        record["discipline"] = disc
        record["discipline_source"] = SOURCE
        record["discipline_confidence"] = CONFIDENCE
        record["discipline_inferred_at"] = today
        by_disc[disc] += 1
        return True

    for fname, key in [("coci_minted_courses.json", "courses"),
                       ("coci_unified_courses.json", "clusters"),
                       ("coci_minted_singletons.json", "courses")]:
        doc = load(fname)
        for cid, v in doc[key].items():
            if cid in curated:
                stats["skip_curated"] += 1
                continue
            if fill(v):
                stats[key] += 1
        dump(fname, doc)

    total = stats["courses"] + stats["clusters"]
    print("TOP-aware discipline inference complete:")
    print(f"  minted+singleton courses filled : {stats['courses']}")
    print(f"  clusters filled                 : {stats['clusters']}")
    print(f"  TOTAL filled                    : {total}")
    print(f"  blank but TOP code unmapped     : {stats['no_map']}")
    print(f"  skipped (curated)               : {stats['skip_curated']}")
    print("  top disciplines assigned:")
    for d, n in by_disc.most_common(15):
        print(f"    {n:5}  {d}")


if __name__ == "__main__":
    main()
