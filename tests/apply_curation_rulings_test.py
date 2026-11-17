#!/usr/bin/env python3
"""Issue 3447: rulings stick.

Sam's Keeps on merged cards never saved (the confirmation PATCH was refused by the merge bots' row policy), and the
reseed asked him again about cards he had ruled on, because the overlay sync dropped the ruling rows and the reseed
ignored them. What this pins:

  1. A `ccr_procedure_request` row folds into the overlay under the M-ID its JSON value names, as
     `ruling: {ruling, to, at}`; the latest ruling wins; no reviewer account is added for it.
  2. A person's `discipline` row on a merge target sets that target's validated_at / validated_by; a bot's does not,
     and neither does a person's row on a card nothing merges into.
  3. The reseed's curated() is true for an overlay entry with only validated_at, only a ruling, or a minted
     machine-decided source; write_doubt omits a ruled card even if classify() let it through.

Run from repo root: python3 tests/apply_curation_rulings_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(ROOT, "kb")
sys.path.insert(0, KB)
import _apply_curation as ac  # noqa: E402
import _ccr_seed_recheck_dryrun as rs  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


BOT = "trailcrew-ccr3-s112" + ac.BOT_SUFFIX
PERSON = "curator@example.edu"


def rule_row(mid, ruling, to, at):
    return {"course_id": "_CCR_PROCEDURE_REQUEST::" + at + "-" + mid.replace(" ", "_"), "field": "ccr_procedure_request",
            "value": json.dumps({"mid": mid, "ruling": ruling, "to": to, "words": "why"}), "reviewer_email": PERSON,
            "reviewed_at": at}


rows = [
    rule_row("KINE M1847", "keep", None, "2026-11-09T15:07:00Z"),
    rule_row("KINE M1847", "crosslist", "Psychology", "2026-11-10T15:48:00Z"),
    rule_row("KINE M1152", "keep", None, "2026-11-09T14:57:00Z"),
    {"course_id": "_CCR_PROCEDURE_REQUEST::x", "field": "ccr_procedure_request", "value": "not json",
     "reviewer_email": PERSON, "reviewed_at": "2026-11-09T00:00:00Z"},
    # KINE M1152 is a merge target (a bot merged KINE M9001 into it); Sam's Keep is now a discipline row.
    {"course_id": "KINE M9001", "field": "merge_into", "value": "KINE M1152", "reviewer_email": BOT,
     "reviewed_at": "2026-06-12T00:00:00Z"},
    {"course_id": "KINE M1152", "field": "discipline", "value": "Kinesiology", "reviewer_email": PERSON,
     "reviewed_at": "2026-11-09T14:57:30Z"},
    # A bot's discipline row on a merge target verifies nothing.
    {"course_id": "MATH M9002", "field": "merge_into", "value": "MATH M1194", "reviewer_email": BOT,
     "reviewed_at": "2026-06-12T00:00:00Z"},
    {"course_id": "MATH M1194", "field": "discipline", "value": "Mathematics", "reviewer_email": BOT,
     "reviewed_at": "2026-07-13T00:00:00Z"},
    # A person's discipline row on a card nothing merges into is a confirmation, not a merged card's validation.
    {"course_id": "ENGL M1001", "field": "discipline", "value": "English", "reviewer_email": PERSON,
     "reviewed_at": "2026-11-09T00:00:00Z"},
]
cur, skipped, _h = ac.fold_rows(rows, live=set())

k = cur.get("KINE M1847") or {}
check("(1) ⭐ a ruling folds under the M-ID its value names", k.get("ruling", {}).get("ruling") == "crosslist", json.dumps(k))
check("(1) the latest ruling wins, with its to and at",
      k.get("ruling") == {"ruling": "crosslist", "to": "Psychology", "at": "2026-11-10T15:48:00Z"}, json.dumps(k))
check("(1) a ruling adds no reviewer account to the overlay", "reviewed_by" not in k and "validated_by" not in k, json.dumps(k))
check("(1) the ruling row's own key never enters the overlay", not any(c.startswith("_CCR_PROCEDURE_REQUEST") for c in cur))
check("(1) a ruling whose value names no M-ID is skipped and counted", skipped == 1, str(skipped))

t = cur.get("KINE M1152") or {}
check("(2) ⭐ a person's discipline row on a merge target sets validated_at and validated_by",
      t.get("validated_at") == "2026-11-09T14:57:30Z" and t.get("validated_by") == PERSON, json.dumps(t))
check("(2) and the target keeps its ruling beside it", (t.get("ruling") or {}).get("ruling") == "keep", json.dumps(t))
check("(2) a bot's discipline row on a merge target sets no validation", "validated_at" not in (cur.get("MATH M1194") or {}),
      json.dumps(cur.get("MATH M1194")))
check("(2) a person's row on a card nothing merges into sets no validation", "validated_at" not in (cur.get("ENGL M1001") or {}),
      json.dumps(cur.get("ENGL M1001")))
before = json.dumps(cur, sort_keys=True)
ac.stamp_person_validation(cur, rows)
check("(2) the stamp is idempotent", json.dumps(cur, sort_keys=True) == before)

# 3. The reseed honors rulings.
rec = {"discipline": "Kinesiology"}
check("(3) ⭐ curated() is true for an overlay entry with only validated_at",
      rs.curated("X", rec, {"X": {"validated_at": "2026-11-09T00:00:00Z"}}))
check("(3) ⭐ curated() is true for an overlay entry with only a ruling", rs.curated("X", rec, {"X": {"ruling": {"ruling": "keep"}}}))
check("(3) curated() is true for a machine-decided card",
      rs.curated("X", {"discipline": "Art", "discipline_source": "confidence_v1"}, {})
      and rs.curated("X", {"discipline": "Art History", "discipline_source": "past_rulings_v1"}, {}))
check("(3) curated() stays false for an untouched seed", not rs.curated("X", rec, {}))

rows_doubt = {"no_top": [{"id": "KINE M1847", "title": "A", "colleges": 2, "members": 2, "votes": {},
                          "desc": [["Psychology", 0.3], ["Kinesiology", 0.2]], "desc_kind": "desc_differs_clear"},
                         {"id": "KINE M1142", "title": "B", "colleges": 2, "members": 2, "votes": {},
                          "desc": [["Psychology", 0.3], ["Kinesiology", 0.2]], "desc_kind": "desc_differs_clear"}]}
here = rs.HERE
with tempfile.TemporaryDirectory() as tmp:
    rs.HERE = tmp
    try:
        doc = rs.write_doubt("Kinesiology", rows_doubt, None, {"KINE M1847": {"ruling": {"ruling": "keep"}}})
    finally:
        rs.HERE = here
ids = [c["id"] for c in doc["cards"]]
check("(3) ⭐ write_doubt omits a ruled card even when classify() let it through", ids == ["KINE M1142"], str(ids))

bad = [r for r in results if not r[1]]
for name, ok, why in results:
    print(("  PASS " if ok else "  FAIL ") + name + ("" if ok else "  " + why[:300]))
print("apply_curation_rulings_test.py: %d/%d passed" % (len(results) - len(bad), len(results)))
sys.exit(1 if bad else 0)
