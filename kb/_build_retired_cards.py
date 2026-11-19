#!/usr/bin/env python3
"""Retired shared courses, under the version 5 rule: kept for the record, out of every count (Sam, 2026-11-17,
relayed by COBIx: "Yes, drop all retired courses ... by flagging as retired so they don't show needing attention";
COBIx's version 5 the same morning: retired means inactive at the source, never missing from one term).

  A college's course is GONE when every row for its control number in the state's program course file
  (kb/reference/coci_program_course_file.csv.gz, field CourseStatus) says Inactive or Deleted. A course with no
  status row counts as gone only when it is also missing from Fall 2025 (kb/reference/cb_course_basic_fall2025.csv)
  and from the state's course list (coci_lookup_data.js, which kb/_build_coci_lookup.py builds from
  kb/reference/coci_course_list.xlsx, so it holds the same control numbers).
  A card is RETIRED when it has at least one college's course in the minted memberships and every one is gone.
  A card that is not retired and none of whose courses is in Fall 2025 is NOT SEEN THIS TERM: it stays in every count
  and its note says so. The list is written here for the note only.

Ported from the version 5 scorer's rule (#3510 file set 3, `discipline_confidence.py`), applied to every card rather
than the seedless ones only. Nothing is deleted. This writes kb/coci_retired_cards.json; kb/_flags.py reads it.

    python3 kb/_build_retired_cards.py            # write kb/coci_retired_cards.json
    python3 kb/_build_retired_cards.py --check    # exit 1 when the committed file differs from a rebuild
"""
import csv
import gzip
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _flags as F  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT = "kb/coci_retired_cards.json"
INPUTS = {
    "memberships": "kb/coci_minted_memberships.json",
    "curation": "kb/coci_curation.json",
    "status": "kb/reference/coci_program_course_file.csv.gz",
    "fall_2025": "kb/reference/cb_course_basic_fall2025.csv",
    "coci_courses": "coci_lookup_data.js",
}
INACTIVE_STATUSES = frozenset({"Inactive", "Deleted"})


def read_status(path):
    out = defaultdict(set)
    with gzip.open(path, "rt", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            out[(r.get("CourseControlNumber") or "").strip()].add((r.get("CourseStatus") or "").strip())
    return out


def read_fall(path):
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as f:
        return {(r.get("CB_CONTROL_NUMBER") or "").strip() for r in csv.DictReader(f)}


def build(memberships, curation, status, fall, listed):
    """status: control number -> set of CourseStatus values; fall: Fall 2025 control numbers; listed: control numbers
    in the state's course list. Returns (retired cards, not-seen-this-term card ids)."""
    def gone(cn):
        st = status.get(cn)
        if st:
            return st <= INACTIVE_STATUSES
        return cn not in fall and cn not in listed

    retired, not_seen = {}, []
    for cid in sorted(memberships):
        if cid.startswith("_"):
            continue
        cns = [c for c in (str((m or {}).get("control_number") or "").strip() for m in memberships[cid] or []) if c]
        if not cns:
            continue
        if all(gone(c) for c in cns):
            retired[cid] = {"courses": [[c, sorted(status.get(c) or ["no status row; in no list"])] for c in cns],
                            "merged": bool((curation.get(cid) or {}).get("merge_into"))}
        elif not any(c in fall for c in cns):
            not_seen.append(cid)
    return retired, not_seen


def main(argv):
    check = "--check" in argv
    ROOT = argv[argv.index("--root") + 1] if "--root" in argv else globals()["ROOT"]   # a fixture checkout, for tests
    p = lambda k: os.path.join(ROOT, INPUTS[k])  # noqa: E731
    mem = F._read(ROOT, INPUTS["memberships"]) or {}
    memberships = mem.get("memberships", mem)
    curation = (F._read(ROOT, INPUTS["curation"]) or {}).get("curations") or {}
    listed = {str(r[1]).strip() for r in F.loadjs(p("coci_courses")).get("rows") or []}
    retired, not_seen = build(memberships, curation, read_status(p("status")), read_fall(p("fall_2025")), listed)
    payload = {
        "_about": "Retired shared courses (the version 5 rule), kept for the record and out of every count, waiting "
                  "pile, to-do and fetch plan (Sam, 2026-11-17). Built by kb/_build_retired_cards.py; read through "
                  "kb/_flags.py. not_seen_this_term lists cards that stay counted and carry the Fall 2025 note.",
        "_note": F.NOTES["retired"],
        "_not_seen_note": F.NOT_SEEN_NOTE,
        "_inputs": {k: {"path": v, "sha256": F.sha256_of(p(k))} for k, v in sorted(INPUTS.items())},
        F.ERA_KEY: F.current_era(),
        "count": len(retired),
        "live": sum(1 for v in retired.values() if not v["merged"]),
        "cards": retired,
        "not_seen_this_term": not_seen,
    }
    if check:
        cur = F._read(ROOT, OUT) or {}
        same = cur.get("cards") == retired and cur.get("not_seen_this_term") == not_seen and F.is_current_era(cur)
        print("%s: %s" % (OUT, "current" if same else "STALE: run python3 kb/_build_retired_cards.py"))
        return 0 if same else 1
    F.write_json(os.path.join(ROOT, OUT), payload)
    print("wrote %s: %d retired cards (%d live, %d merged away); %d not seen this term"
          % (OUT, len(retired), payload["live"], len(retired) - payload["live"], len(not_seen)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
