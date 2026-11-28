#!/usr/bin/env python3
"""S748, lane 1 (readers) at Sierra: four filed records collected with their gap named (kb/_program_piles_s748_sierra.py).

WHY. The census of 2026-11-28 lists 99 Sierra programs with no passing record; fourteen have a filed record, and
twelve of those were read from their own section of a department page and fail on a check. Sam's ruling of
2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with its gap named. Plan
s748r2 files four from each record's own note, with existing kinds, and holds eight by key with a reason. The shared
checks are tests/program_piles_s739_common.py's. Pinned here:

  * the keys are the census's twelve Sierra programs with a filed record that places courses, and no earlier plan
    named any of them;
  * 33639 and 33646 (pair_read_as_alternatives, 50): the record keeps CHEM 0003A and CHEM 0003B as two alternatives
    of CHEM 0001A with no units, the row prints 5-6, and with the pair read as one alternative at 6 the major adds
    to its printed total at both ends; each files a second note for the degree's Cal-GETC units;
  * 36718 (noted_no_total, 40) states no total; 39209 (noted_section_cut_off, 20) states none and its note says
    where the text is cut;
  * each row is live on its filed run by the conductor's live read of 2026-11-28 07:38Z, the one proof of Sierra's
    runs (no committed receipt posts them);
  * the holds: 40181 is the same pair, and today's scorer passes its own arithmetic, so it is never gap-filed;
    21525's live row holds an older run than main files; 45624, 17979, 31922, 31923, 32007 and 38522 each keep
    their reason and carry no gap;
  * the plan's test holds before and after its apply (the shared checks' skip).

Run from repo root: python3 tests/program_piles_s748_sierra_test.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s739 as B  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s748_sierra as M  # noqa: E402

W = M.W
NG, S = B9.NG, B.S
ROOT = T.ROOT
ROWS = {"33639": "pair_read_as_alternatives", "33646": "pair_read_as_alternatives", "36718": "noted_no_total",
        "39209": "noted_section_cut_off"}
HELD = {"40181": ["CHEM 0003A & CHEM 0003B", "scorer_passes", "reconcile step"],
        "21525": ["38675248607", "39726642315", "reread"],
        "45624": ["BIOL 0056", "ESCI 0010", "40-43"],
        "17979": ["may have been cut", "page read"],
        "31922": ["FASH 0095", "30.5"],
        "31923": ["31922's reading"],
        "32007": ["coverage alone", "27 of 31"],
        "38522": ["coverage alone", "25 of 29"]}

t = T.run(W, rows=ROWS, held=HELD, scores={"pair_read_as_alternatives": 50, "noted_no_total": 40,
                                            "noted_section_cut_off": 20},
          day="2026-11-28", boundaries=17, prior_held=set(M.KEYS),
          own={"36718": "own_heading", "39209": "own_section"})
check = t.check
check(isinstance(W, B9.Pile) and W.receipt_path("2026-11-28").endswith("piles_s742_sierra_2026-11-28_s748r2.json")
      and not W.held_by, "the plan is s748r2, on S742's shared code, over no earlier plan's holds")

# The keys: the census's Sierra programs with a filed record that places courses.
with open(os.path.join(ROOT, "kb", "program_requirements_college", "sierra", "named_gaps_s739.json"),
          encoding="utf-8") as fh:
    named = {str(p["control_number"]) for p in json.load(fh)["programs"]}
check(set(M.KEYS) == set(ROWS) | set(HELD) and len(M.KEYS) == 12 and not set(M.KEYS) & named,
      "twelve keys, four rows and eight holds, none of them one of the college's named gaps with no record")
for cn in M.KEYS:
    f = W.load(cn)
    cov = f["score"]["coverage"]
    check(f is not None and not cov.get("none_placed") and cov.get("placed"),
          "%s: a filed record that places courses" % cn)

# The live read: the one proof of Sierra's live runs.
with open(os.path.join(ROOT, "kb", "receipts", "program_requirements_reread_s748_sierra_checked.json"),
          encoding="utf-8") as fh:
    read = json.load(fh)
live = read["live_runs"][M.COLLEGE]
check(read["read_at"] == "2026-11-28T07:38:12Z" and read["count"][M.COLLEGE] == len(live) == 103
      and read["by_college"][M.COLLEGE] == [],
      "the conductor's live read of 2026-11-28 07:38Z: 103 Sierra rows, none checked by a person")
for cn in ROWS:
    f = W.load(cn)
    check(live.get(cn) == str(f["extracted_run"]) and W.on_live_run(f)
          and not B9.LiveRead(M.COLLEGE, M.SLUG).on_live_run(f),
          "%s: live on its filed run %s by that read, and by no earlier receipt or read" % (cn, f["extracted_run"]))

# The pair rows.
for cn in ("33639", "33646"):
    f, e = W.load(cn), M.REVIEWED[cn]
    row = [c for b in f["record"]["blocks"] for c in b["courses"] if c["code"] == "CHEM 0001A"]
    alts = [a for a in row[0]["alternatives"]] if len(row) == 1 else []
    check(len(row) == 1 and row[0]["units"] == 5 and row[0]["units_max"] == 6
          and [a["code"] for a in alts] == ["CHEM 0003A", "CHEM 0003B"] and all(a.get("units") is None for a in alts),
          "%s: CHEM 0001A prints 5-6, and the record keeps CHEM 0003A and CHEM 0003B as two alternatives with no "
          "units" % cn)
    a = B.C.fresh_score(dict(f, record=B.apply_ops(f, e["ops"])))["arithmetic"]
    major = a.get("major") or {}
    check(a.get("against") == "degree" and major.get("status") == "equal"
          and B.same(major.get("computed"), e["stated"]) and B.same(major.get("stated"), e["stated"]),
          "%s: with the pair read as one alternative at 6 the major adds to the printed %s at both ends"
          % (cn, e["stated"]))
    words = f["score"]["gaps"][0]["words"]
    check(e["words"] in words and e["also_words"] in words and " | " in words,
          "%s: the gap files the pair's note and the note on the degree's Cal-GETC units" % cn)
    check(not B.scorer_passes(f), "%s: today's scorer does not pass the record's own arithmetic" % cn)

f = W.load("36718")
check(f["score"]["arithmetic"].get("stated") is None and f["record"]["program"]["total_units"]["min"] is None
      and M.REVIEWED["36718"]["words"] in f["score"]["gaps"][0]["words"],
      "36718: the record states no total, and its note says the section prints none")
f = W.load("39209")
check(f["score"]["arithmetic"].get("stated") is None and M.REVIEWED["39209"]["words"] in f["score"]["gaps"][0]["words"],
      "39209: the record states no total, and its note says where the text is cut")

# The holds.
f = W.load("40181")
check(B.scorer_passes(f) and not S.passes_live(f["score"]) and not f["score"].get("gaps")
      and B.same(f["score"]["arithmetic"]["computed"], [39, 45]) and B.same(f["score"]["arithmetic"]["stated"], [41, 45]),
      "40181: today's scorer passes its own arithmetic and the filed score fails it (39-45 against 41-45): no gap")
f = W.load("21525")
check(live.get("21525") == "38675248607" and str(f["extracted_run"]) == "39726642315" and not W.on_live_run(f)
      and not f["score"].get("gaps"),
      "21525: its live row holds 38675248607, main files 39726642315, and it carries no gap")
for cn in ("45624", "17979", "31922", "31923", "32007", "38522"):
    check(not W.load(cn)["score"].get("gaps"), "%s: held, and it carries no gap" % cn)
for cn in ("32007", "38522"):
    sc = W.load(cn)["score"]
    check(sc["arithmetic"].get("status") == "equal" and not sc["coverage"].get("pass"),
          "%s: its arithmetic is equal and its coverage fails" % cn)

sys.exit(t.done())
