#!/usr/bin/env python3
"""DR-25 — the subject-discipline edge fill (Sam's rulings of 2026-09-08).

Guards `discipline_edge_fill()` in excel_to_dashboard.py, which fills a BLANK
discipline from the edge that the M-ID-only inference passes never reached.

The failure it was written for: all five discipline-inference passes read
kb/coci_minted_courses.json (19,568 records, every one an M-ID), so no
externally-minted identifier has ever been seen by one. `PSYC C1000` carried
"discipline": "Psychology" in the identifier reference since 2026-05-20 and
disc:null on every surface a reader looks at.

⚠️ THE CHECK THAT MATTERS MOST IS `_subj` READING THE ID PREFIX. `row["subj"]`
is the LOCAL college subject code(s) -- freehand, multi-valued, dirty
("AEROST", "ARTHIST", "DANCE (DANCE)") -- and reading it mis-filed four rows
on the live payload before it was caught. The canonical SUBJ4 is the id's own
prefix, which is the rule SkyView's subjCode() already applies.

Run from repo root:  python3 tests/discipline_edge_fill_test.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from excel_to_dashboard import discipline_edge_fill          # noqa: E402

KB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kb")

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def main():
    # 1 · the edge fills a blank from the SUBJ4 on the id
    rows = [{"id": "PSYC C1000", "disc": None, "subj": ["PSYC"]}]
    st = discipline_edge_fill(rows, KB)
    check("a blank identity is filled from the subject map",
          rows[0]["disc"] == "Psychology", repr(rows[0].get("disc")))
    check("and the fill says where it came from",
          rows[0].get("dsrc") == "subject_map_edge", repr(rows[0].get("dsrc")))
    check("the return names what it did", st["filled_map"] == 1 and st["blank_after"] == 0, repr(st))

    # 2 · ⭐ the SUBJ4 is the ID PREFIX, never the local college codes.
    #     AERO M1001 really carries local `AEROST`; ARTF M1003 carries five.
    rows = [{"id": "AERO M1001", "disc": None, "subj": ["AEROST"]},
            {"id": "ARTF M1003", "disc": None, "subj": ["AHIS", "ART", "ARTF", "ARTH", "ARTHIST"]},
            {"id": "DANC M1456", "disc": None, "subj": ["DANCFOLK"]}]
    discipline_edge_fill(rows, KB)
    check("a dirty local SUBJ does not block the fill — the id prefix decides",
          [r["disc"] for r in rows] == ["Aviation", "Art", "Dance"],
          repr([r.get("disc") for r in rows]))

    # 3 · never overrides — curation and the seed keep winning
    rows = [{"id": "PSYC C1000", "disc": "Kinesiology", "subj": ["PSYC"]}]
    st = discipline_edge_fill(rows, KB)
    check("a row that already has a discipline is untouched",
          rows[0]["disc"] == "Kinesiology" and "dsrc" not in rows[0] and st["filled_map"] == 0,
          repr(rows[0]))

    # 4 · the identifier reference fills only where the map has no entry
    #     (Sam's item 1: the map file is the authority for the edge).
    rows = [{"id": "BSOT C1000", "disc": None}]
    discipline_edge_fill(rows, KB)
    check("a subject the map does not carry falls through to the identifier reference "
          "or stays blank — never guessed",
          rows[0].get("dsrc") in (None, "coci_reference", "subject_map_edge"),
          repr(rows[0]))

    # 5 · an unknown subject is left alone rather than filled with a guess
    rows = [{"id": "ZZZZ M9999", "disc": None}]
    st = discipline_edge_fill(rows, KB)
    check("an unknown subject stays blank", rows[0]["disc"] is None and st["blank_after"] == 1,
          repr(rows[0]))

    # 6 · the older id shape ("M-ID WELD 1109") steps over the system word
    rows = [{"id": "M-ID PSYC 1000", "disc": None}]
    discipline_edge_fill(rows, KB)
    check("the legacy `<system> <SUBJ4> <n>` id shape is read correctly",
          rows[0]["disc"] == "Psychology", repr(rows[0].get("disc")))

    # 7 · the real payload, if it is present: the measured shape of the fix
    payload = os.path.join(os.path.dirname(KB), "unified_courses_data.js")
    if os.path.exists(payload):
        import json
        src = open(payload, encoding="utf-8").read()
        i = src.index("window."); i = src.index("=", i) + 1
        live = json.loads(src[i:].strip().rstrip(";"))["rows"]
        blank_before = sum(1 for r in live if not r.get("disc"))
        st = discipline_edge_fill(live, KB)
        filled = blank_before - st["blank_after"]
        # ⚠️ THIS CHECK ONCE MEASURED YIELD, AND YIELD GOES TO ZERO ON SUCCESS
        # (2026-09-10). It read `filled >= blank_before * 0.5` -- written when
        # the fill was a post-hoc repair a reader applied to a committed
        # payload. S242 (#1517, 2026-09-08) wired discipline_edge_fill() INTO
        # excel_to_dashboard.py, so the generator now fills at generation time
        # and the committed payload arrives already at the fixed point. The
        # cron died the same day and ran no payload until 2026-09-10, so the
        # old assertion stayed green on a payload predating its own premise;
        # the first run afterwards filled 240 of 326 upstream and the check
        # failed 0-of-86 ON SUCCESS.
        #
        # So assert the FIXED POINT instead, which catches the same failure
        # from the other side: if the generator ever stops applying the fill,
        # the blanks come back and `filled` jumps off zero.
        check(f"the committed payload is already edge-filled -- re-running finds "
              f"nothing to do ({blank_before} blank, {filled} fillable)",
              filled == 0,
              f"{filled} of {blank_before} blanks are still fillable -- the "
              f"generator emitted a payload it had not run the edge fill over")
        # The residue is real (SUBJ4s absent from every store), not a stall, so
        # it is bounded rather than zero. 86 on 2026-09-10 of 16,480 rows.
        check(f"the unfillable residue stays small ({blank_before} of {len(live)})",
              blank_before <= len(live) * 0.02,
              f"{blank_before} blank of {len(live)}")

        # ⭐ AND THE ROUND TRIP, WHICH THE FIXED POINT CANNOT SEE (S249).
        # Two sessions fixed this check the same day from opposite sides, and
        # BOTH are kept because each is blind where the other looks. The fixed
        # point above asks "did the GENERATOR apply the fill" -- but it reads
        # `filled == 0`, and a discipline_edge_fill() that has stopped filling
        # anything at all ALSO returns 0 against a payload an earlier run
        # already filled. So ask the other question directly: CLEAR the edge's
        # own fills on the live rows and make it re-derive every one. Measured
        # by falsification -- emptying `edge` inside the function drops this to
        # 155 of 196 while the fixed-point check above stays green.
        stamped = [r for r in live if r.get("dsrc") == "subject_map_edge"]
        for r in stamped:
            r["disc"] = None
            r.pop("dsrc", None)
        discipline_edge_fill(live, KB)
        refilled = sum(1 for r in stamped if r.get("disc"))
        check(f"and the edge re-derives every fill it shipped "
              f"({refilled} of {len(stamped)})",
              bool(stamped) and refilled == len(stamped),
              f"re-filled {refilled} of {len(stamped)}")
        psyc = [r for r in live if r["id"] == "PSYC C1000"]
        if psyc:
            check("PSYC C1000 lands in Psychology — the row Sam asked about",
                  psyc[0]["disc"] == "Psychology", repr(psyc[0].get("disc")))

    ok = sum(1 for _, c, _ in results if c)
    for name, cond, why in results:
        print(("PASS" if cond else "FAIL") + "  " + name + (("  — " + why) if not cond and why else ""))
    print("\n%d/%d checks passed" % (ok, len(results)))
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
