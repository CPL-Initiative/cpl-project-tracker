#!/usr/bin/env python3
"""S703's named gaps for the census page-not-found levers (Ohlone, San Joaquin Delta, Mt. San Antonio, Santa Barbara
City, Orange Coast): kb/program_requirements_college/<slug>/no_record_s703.json; and S713's for City College of San
Francisco (no_record_s713.json).

    python3 tests/program_requirements_named_gaps_s703_test.py

Each file names its capture and page read; each program appears once, carries a reason the file defines, has no
record file, and is one the college's filed capture reads with no page (not_found or page_claimed). A program a
later read binds leaves its file, so this test fails until the file is updated. Pure stdlib.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAILS = []
N = [0]


def check(ok, what):
    N[0] += 1
    print(("ok   " if ok else "FAIL ") + what)
    if not ok:
        FAILS.append(what)


SLUGS = {"ohlone": 34, "san_joaquin_delta": 24, "mt_san_antonio": 28, "santa_barbara_city": 28, "orange_coast": 27,
         # S713: City College of San Francisco's lever 4, filed the same way (no_record_s713.json).
         "city_of_san_francisco": (47, "no_record_s713.json")}
for slug, want in SLUGS.items():
    want, name = want if isinstance(want, tuple) else (want, "no_record_s703.json")
    folder = os.path.join(ROOT, "kb", "program_requirements_college", slug)
    gaps = json.load(open(os.path.join(folder, name)))
    cap = json.load(open(os.path.join(folder, "capture.json")))
    no_page = {n["control_number"] for n in cap.get("not_found") or []} | \
              {n["control_number"] for n in cap.get("page_claimed") or []}
    cns = [p["control_number"] for p in gaps["programs"]]
    check(len(cns) == len(set(cns)) == want, "%s: %d programs, once each" % (slug, want))
    check(gaps.get("capture") and (gaps.get("page_read") or gaps.get("page_reads")) and gaps.get("written"),
          "%s: the file names its capture, its page read and when it was written" % slug)
    check(all(p["reason"] in gaps["reasons"] for p in gaps["programs"]) and set(gaps["reasons"]) ==
          {p["reason"] for p in gaps["programs"]}, "%s: every reason is defined, and every defined one is used" % slug)
    check(not [cn for cn in cns if os.path.exists(os.path.join(folder, "records", cn + ".json"))],
          "%s: no gap program has a record file" % slug)
    check(not [cn for cn in cns if cn not in no_page],
          "%s: every gap program is one the filed capture reads with no page" % slug)
    held = [p for p in gaps["programs"] if p["reason"] == "page_held_by_another_program"]
    check(all(p.get("held_by") and p["held_by"] != p["control_number"] and p["held_by"] not in cns for p in held),
          "%s: each held page names its holder, another program and no gap" % slug)

# S713: City College of San Francisco's seven pinned programs are each held (held_s713.json) or filed as a gap, on the
# page the reconcile entry pins, and none of the 53 is both held and a gap.
_ccsf = os.path.join(ROOT, "kb", "program_requirements_college", "city_of_san_francisco")
_pins = (json.load(open(os.path.join(ROOT, "kb", "program_requirements_reconcile.json")))["colleges"]
         ["City College of San Francisco"].get("pdf_pages") or {})
_held = {h["control_number"]: h for h in json.load(open(os.path.join(_ccsf, "held_s713.json")))["held"]}
_gaps = {p["control_number"] for p in json.load(open(os.path.join(_ccsf, "no_record_s713.json")))["programs"]}
check(set(_pins) == set(_held) | ({"45768"} & _gaps) and not set(_held) & _gaps,
      "city_of_san_francisco: each of the seven pins is held or filed as a gap, never both")
check(all(_held[cn]["page"] == _pins[cn]["page"] and _held[cn].get("reason") and "share" in _held[cn] for cn in _held),
      "city_of_san_francisco: each held program names its pinned page, its share and its reason")

print("\n%d/%d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
