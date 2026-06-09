"""
COARSE TOP-DIVISION discipline inference — the lowest-precision fallback pass.

The precise passes (subject_map / title_keyword / description / top_code) leave
~5.9k single-college staging courses blank because their 6-digit TOP code is a
catch-all ("*99.00 Other", "* General", 4930.xx Interdisciplinary) deliberately
omitted from kb/top_discipline_map.json. Those orphans are invisible to the
discipline-grain Common Subjects Reference (CSR). This pass fills them with the
broad, MQ-verified umbrella discipline of their 2-digit TOP *division* (e.g.
49xx -> Interdisciplinary Studies, 12xx -> Health, 09xx -> Industrial Technology)
via the authored kb/top_division_discipline_map.json.

IMPORTANT — this is the COARSEST tier and a deliberate, reversible relaxation of
the "leave catch-alls blank" guardrail (Sam, 2026-06-09: "whole tail please").
Fills are written at confidence 0.4 with discipline_source="top_division",
surfaced for reviewer refinement (the tab's Generated-by filter + ⚙ TOP-div
badge). A division-level fill is honest (a 09xx course IS an industrial
technology) but coarse (welding vs drafting both land in Industrial Technology).
Divisions with no honest single umbrella (Media, Fine/Applied Arts, Commercial
Services, …) are intentionally absent from the map, so those stay blank.

Guardrails (same as the sibling inference passes):
  * Every target discipline MUST exist in reference/mq_disciplines.json.
  * NEVER touches a reviewed (`reviewed_at`) or curated (coci_curation.json) entry.
  * NEVER overwrites a non-blank discipline (runs AFTER the precise passes).
  * Only fills entries whose `discipline` is still blank. Idempotent / re-runnable.

Run from repo root:  python3 kb/_infer_disciplines_from_top_division.py
"""
import json
import os
from collections import Counter
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIDENCE = 0.4
SOURCE = "top_division"


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def dump(name, obj):
    # Preserve the committed pretty-printed format (indent=2, raw UTF-8) so the
    # daily/PR diff shows only the changed records, not a whole-file reformat.
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def discipline_for(record, divmap):
    """Coarse umbrella discipline for a record's 2-digit TOP division, or None
    (None ⇒ unmapped division → record stays blank). Pure; the testable seam."""
    code = str(record.get("top_code") or "").strip()
    return divmap.get(code[:2])


def main():
    valid = set(load(os.path.join("reference", "mq_disciplines.json"))["disciplines"])
    divmap = load("top_division_discipline_map.json")["map"]
    bad = {d for d in divmap.values() if d not in valid}
    if bad:
        print("ABORT — top_division_discipline_map targets not in reference/mq_disciplines.json:")
        for d in sorted(bad):
            print("   ", repr(d))
        raise SystemExit(1)

    curated = set((load("coci_curation.json") or {}).get("curations", {}).keys())
    today = date.today().isoformat()
    stats = Counter()
    by_disc = Counter()
    skipped_div = Counter()

    def fill(record):
        if record.get("reviewed_at") or record.get("discipline"):
            return False
        code = str(record.get("top_code") or "").strip()
        div = code[:2]
        disc = discipline_for(record, divmap)
        if not disc:
            stats["no_map"] += 1
            if div:
                skipped_div[div] += 1
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
                stats[key + "_" + fname] += 1
                stats["filled"] += 1
        dump(fname, doc)

    print("COARSE TOP-division discipline inference complete:")
    print(f"  TOTAL filled                    : {stats['filled']}")
    print(f"  blank but division unmapped     : {stats['no_map']} "
          f"(divisions intentionally skipped — Media/Fine Arts/Commercial/…)")
    print(f"  skipped (curated)               : {stats['skip_curated']}")
    print("  umbrella disciplines assigned:")
    for d, n in by_disc.most_common():
        print(f"    {n:5}  {d}")
    if skipped_div:
        print("  left blank by division (no honest umbrella):")
        for d, n in skipped_div.most_common():
            print(f"    {n:5}  div {d}xxxx")


if __name__ == "__main__":
    main()
