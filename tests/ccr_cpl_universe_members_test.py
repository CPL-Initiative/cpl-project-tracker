#!/usr/bin/env python3
"""Guards kb/_build_ccr_cpl_universe_members.py — the rows behind SkyView's CPL universe.

Sam, 2026-09-10: "a Firefighter 1 Exhibit would be like a MID grouping showing
all the local exhibits as members of the group as if they were courses. Then we
would show the course(s), perhaps on the exhibit cards, that have CPL based on
the exhibit." The universe payload carries the counts; this one carries the rows
— per identity, the local MAP exhibits folded in (m) and the course identities
articulated to it (courses).

⭐ THE ID IS IMPORTED, NEVER RESTATED. A members payload keyed one character
differently from the universe is a map of credentials with no members, which
reads as a corpus with nothing in it — and a dict lookup does not error. The
first check asserts the import; the second that every key here is a point there.

⭐ THE ARTICULATED COURSES ARE THE RING'S OWN JOIN. `ar` on the universe point
is the CER's n_articulation_lines — one per receiving college course under the
`articulations` the card lists (one identity can carry three). A card and a
ring that disagree is the S250 lesson one surface over.

Run from repo root:  python3 tests/ccr_cpl_universe_members_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import _build_ccr_cpl_universe as U                                # noqa: E402
import _build_ccr_cpl_universe_members as M                        # noqa: E402

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))


PAY = os.path.join(ROOT, "prototype", "ccr_cpl_universe_members.json")
UNI = os.path.join(ROOT, "prototype", "ccr_cpl_universe.json")
pay = json.load(open(PAY, encoding="utf-8"))
uni = json.load(open(UNI, encoding="utf-8"))
points = {p["i"]: p for i in uni["islands"] for p in i["p"]}
c = pay["counts"]

# ── 1 · one id function ──────────────────────────────────────────────────────
src = open(os.path.join(ROOT, "kb", "_build_ccr_cpl_universe_members.py"), encoding="utf-8").read()
check("⭐ ident_id is IMPORTED from the universe builder, never redefined",
      "from _build_ccr_cpl_universe import" in src and "ident_id" in src.split("from _build_ccr_cpl_universe import", 1)[1].split("\n")[0]
      and "def ident_id" not in src and "def slug" not in src)
check("the builder reads the CER through the universe builder's own loader", "load_js_object(CER_JS)" in src)

# ── 2 · every key here is a point there ─────────────────────────────────────
missing_m = [k for k in pay["m"] if k not in points]
missing_c = [k for k in pay["courses"] if k not in points]
check("⭐ every members key is a universe point (the two files agree on the id)", not missing_m, missing_m[:3])
check("⭐ every courses key is a universe point", not missing_c, missing_c[:3])

# ── 3 · the card and the ring agree ─────────────────────────────────────────
# `ar` is the CER's n_articulation_lines: one per RECEIVING COLLEGE COURSE, not
# per course identity (AP English Language: one identity, three lines). The
# card's header says both numbers; the ring and the card agree on the lines.
disagree = [k for k, p in points.items() if (p.get("ar") or 0) != sum(len(r[4]) for r in pay["courses"].get(k, []))]
check("⭐ a point's `ar` equals the receiving college courses under the identities the card lists — the same join",
      not disagree, f"{len(disagree)} disagree, e.g. {disagree[:3]}")
n_disagree = [k for k, p in points.items() if (p.get("n") or 0) != len(pay["m"].get(k, []))]
check("⭐ a point's `n` equals the number of local exhibits the card lists",
      not n_disagree, f"{len(n_disagree)} disagree, e.g. {n_disagree[:3]}")

# ── 4 · the row shapes the client reads ─────────────────────────────────────
mrows = [r for rows in pay["m"].values() for r in rows]
check("a member row is [title, confidence or null, quality flag]",
      mrows and all(len(r) == 3 and isinstance(r[0], str) and r[0] and (r[1] is None or isinstance(r[1], (int, float)))
                    and isinstance(r[2], str) for r in mrows))
check("members are listed best confidence first",
      all(rows == sorted(rows, key=lambda r: (-(r[1] if r[1] is not None else 0), r[0].lower())) for rows in pay["m"].values()))
crows = [r for rows in pay["courses"].values() for r in rows]
check("a course row is [course id, id system, title, discipline, [[code, title, [colleges]]]]",
      crows and all(len(r) == 5 and r[0] and isinstance(r[4], list)
                    and all(len(l) == 3 and isinstance(l[2], list) for l in r[4]) for r in crows))
check("courses are listed most-local first",
      all(rows == sorted(rows, key=lambda r: (-len(r[4]), r[0])) for rows in pay["courses"].values()))
check("the counts on the payload are the payload's own",
      c["members"] == len(mrows) and c["courses"] == len(crows)
      and c["identities_with_members"] == len(pay["m"]) and c["identities_with_courses"] == len(pay["courses"])
      and c["local_receiving_courses"] == sum(len(r[4]) for r in crows))

# ── 5 · a fresh build ────────────────────────────────────────────────────────
try:
    built = M.build(U.load_js_object(U.CER_JS))
    err = None
except SystemExit as exc:
    built, err = None, str(exc)
check("⭐ the committed payload is a fresh build of today's CER",
      err is None and json.dumps(built, separators=(",", ":"), ensure_ascii=False) == open(PAY, encoding="utf-8").read(),
      err or "stale — re-run kb/_build_ccr_cpl_universe_members.py")
check("the payload names its generator and its inputs",
      pay.get("_generated_by") == "kb/_build_ccr_cpl_universe_members.py"
      and "raw_variants" in pay["_generated_from"]["members"] and "articulations" in pay["_generated_from"]["courses"])

# ── 6 · only the CER is read ────────────────────────────────────────────────
opened = []
_real_open = open
def _spy(path, *a, **k):
    opened.append(str(path))
    return _real_open(path, *a, **k)
U.open = _spy
try:
    M.build(U.load_js_object(U.CER_JS))
finally:
    del U.open
read = {os.path.basename(f) for f in opened}
check("⭐ its only data input is the curated CER (never ccr_cpl.json, whose join runs the other way)",
      read <= {"credential_reference_data.js"}, sorted(read))

passed = sum(1 for _, ok, _ in results if ok)
for name, ok, detail in results:
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok or not detail else f"  — {detail}"))
print(f"\n{passed}/{len(results)} checks passed")
sys.exit(0 if passed == len(results) else 1)
