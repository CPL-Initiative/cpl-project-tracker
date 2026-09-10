#!/usr/bin/env python3
"""Guards kb/_build_ccr_cpl_universe.py — SkyView's CPL universe payload.

Sam, 2026-09-10: "another universe where the entities are exhibits rather than
courses". Each check below is a failure mode this build actually hit, or a
ruling that a later edit could silently undo.

⭐ THE ID COLLISION IS REAL AND FIRED ON THE FIRST RUN. slug() truncates at 60
characters because it names a description shard FILE; two Carpenters titles
differ only past the cut. Without the digest suffix, two credentials merge into
one entity — silently, since a dict just keeps the last writer.

⭐ THE LAYOUT IS IMPORTED, NEVER COPIED. The same rule kb/alias_chain.py carries:
a copied layout drifts, and two universes drawn by two packers stop agreeing
about what a discipline looks like. Guarded by asserting the import.

Run from repo root:  python3 tests/ccr_cpl_universe_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))

import _build_ccr_cpl_universe as B                                # noqa: E402

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))

# ⚠️ A GUARD THAT DIES REPORTS NOTHING. rows_from_cer() raises SystemExit on an
# id collision — correct for the builder, fatal for a test that prints its
# results at the end: removing the digest suffix crashed this file before one
# line of output, so the regression read as a broken test rather than a found
# bug. Every call into the builder goes through here.
def try_build():
    try:
        return B.build(B.load_js_object(B.CER_JS)), None
    except SystemExit as exc:
        return None, str(exc)


PAY = os.path.join(ROOT, "prototype", "ccr_cpl_universe.json")
pay = json.load(open(PAY, encoding="utf-8"))
isl = pay["islands"]
pts = [p for i in isl for p in i["p"]]
c = pay["counts"]

# ── 1 · the id collision guard, the bug this build hit on run one ────────────
try:
    B.rows_from_cer({"unified_titles": [
        {"ut": "Carpenters Training Committee for Northern California Apprenticeship — CARP 710"},
        {"ut": "Carpenters Training Committee for Northern California Apprenticeship — CARP 707"},
    ]})
    collided = False
except SystemExit:
    collided = False
    check("⭐ two titles differing past slug()'s 60-char cut do NOT collide", False,
          "rows_from_cer raised — the digest suffix is gone")
else:
    collided = True
if collided:
    a = B.ident_id("Carpenters Training Committee for Northern California Apprenticeship — CARP 710")
    b = B.ident_id("Carpenters Training Committee for Northern California Apprenticeship — CARP 707")
    check("⭐ two titles differing past slug()'s 60-char cut do NOT collide", a != b,
          f"{a} vs {b}")
    check("the readable stem survives the suffix", a.startswith("CPL-carpenters-training"), a)
check("ident_id is stable across calls",
      B.ident_id("EMT Certification") == B.ident_id("EMT Certification"))

# ── 2 · the payload is a FRESH build (the sibling payloads' rule) ────────────
built, err = try_build()
check("⭐ the committed payload is a fresh build of today's CER",
      err is None and json.dumps(built, separators=(",", ":")) == open(PAY, encoding="utf-8").read(),
      err or "stale — re-run kb/_build_ccr_cpl_universe.py")

# ── 3 · the layout is imported, not copied ──────────────────────────────────
src = open(os.path.join(ROOT, "kb", "_build_ccr_cpl_universe.py"), encoding="utf-8").read()
check("⭐ build_islands is IMPORTED from the course universe, never redefined",
      "from _build_ccr_universe import" in src and "def build_islands" not in src)
check("⭐ layout_island is not redefined here either", "def layout_island" not in src)

# ── 4 · agencies come from the CER, never the stale crosswalk ───────────────
# coci_articulations.json inlines a 2026-05-21 issuing_agency that disagrees
# with the curated CER on 1,743 of 4,592 records.
# ⚠️ ASSERT THE BEHAVIOR, NOT THE TEXT. The first version of this check grepped
# the source for "coci_articulations" and failed on the builder's own comment
# saying never to read it — a check that cannot distinguish a warning from a
# call. Record what the build actually opens instead.
opened = []
_real_open = open
def _spy(path, *a, **k):
    opened.append(str(path))
    return _real_open(path, *a, **k)
B.open = _spy                                  # module-level name the builder uses
try:
    try_build()
finally:
    del B.open
read = {os.path.basename(f) for f in opened}
check("⭐ the builder never READS kb/coci_articulations.json (the stale issuer)",
      "coci_articulations.json" not in read, sorted(read))
check("⭐ its only data input is the curated CER",
      read <= {"credential_reference_data.js"}, sorted(read))

# ── 5 · Sam's two rulings of 2026-09-10 ─────────────────────────────────────
singles = [p for p in pts if p.get("n") == 1]
check("⭐ a singleton draws as a full identity, not a lesser point (Sam's ruling)",
      len(singles) == c["singleton"] and all("i" in p and "t" in p for p in singles),
      f"{len(singles)} singleton points vs counts {c['singleton']}")
check("⭐ the no-discipline pile SHIPS as an island (Sam's ruling), not dropped",
      any(i["d"] == B.BLANK for i in isl) and c["no_discipline"] > 0,
      f"no_discipline={c['no_discipline']}")
blank_isl = [i for i in isl if i["d"] == B.BLANK]
check("the pile's island carries exactly its counted identities",
      blank_isl and len(blank_isl[0]["p"]) == c["no_discipline"])

# ── 6 · statewide — Sam asked these be visible ──────────────────────────────
sw = [p for p in pts if p.get("sw")]
check("⭐ every statewide exhibit is marked on its point (`sw`)",
      len(sw) == c["statewide"] and c["statewide"] > 0,
      f"{len(sw)} marked vs {c['statewide']} counted")
check("every statewide exhibit carries a ring — all 84 are articulated",
      all(p.get("ar") for p in sw), f"{sum(1 for p in sw if not p.get('ar'))} without a ring")
check("no statewide exhibit sits in the no-discipline pile",
      blank_isl and not any(p.get("sw") for p in blank_isl[0]["p"]))

# ── 7 · the payload agrees with itself ──────────────────────────────────────
check("counts.identities equals the points drawn", len(pts) == c["identities"],
      f"{len(pts)} vs {c['identities']}")
ids = [p["i"] for p in pts]
check("no point id is drawn twice", len(ids) == len(set(ids)),
      f"{len(ids) - len(set(ids))} duplicated")
check("counts.members equals the members folded in",
      sum(p.get("n", 0) for p in pts) == c["members"])
check("counts.articulated equals the points carrying a ring",
      sum(1 for p in pts if p.get("ar")) == c["articulated"])
check("grouped + singleton accounts for every identity",
      c["grouped"] + c["singleton"] == c["identities"],
      f"{c['grouped']}+{c['singleton']} vs {c['identities']}")
check("counts.disciplines equals the islands drawn", len(isl) == c["disciplines"])

# ── 8 · geometry: islands must not overlap, as in the course universe ───────
bad = []
for a in range(len(isl)):
    for b in range(a + 1, len(isl)):
        A, Bb = isl[a], isl[b]
        d = ((A["x"] - Bb["x"]) ** 2 + (A["y"] - Bb["y"]) ** 2) ** 0.5
        if d < A["r"] + Bb["r"]:
            bad.append((A["d"], Bb["d"]))
check("islands do not overlap one another", not bad, str(bad[:3]))
check("every point sits inside its island's radius",
      all(((p["x"] - i["x"]) ** 2 + (p["y"] - i["y"]) ** 2) ** 0.5 <= i["r"] + 0.5
          for i in isl for p in i["p"]))
b = pay["bounds"]
check("bounds enclose every island", all(
    b["x0"] <= i["x"] - i["r"] + 0.05 and i["x"] + i["r"] <= b["x1"] + 0.05 and
    b["y0"] <= i["y"] - i["r"] + 0.05 and i["y"] + i["r"] <= b["y1"] + 0.05 for i in isl))

# ── 9 · the CPL type table ──────────────────────────────────────────────────
check("six CPL types ship with the payload for the client to decode",
      len(pay["cpl_types"]) == 6, str(pay["cpl_types"]))
codes = {k for p in pts for k in p.get("c", [])}
check("every code on a point resolves to a named type",
      codes and max(codes) < len(pay["cpl_types"]), sorted(codes))

for name, ok, detail in results:
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail and not ok else ""))
bad_n = sum(1 for _, ok, _ in results if not ok)
print(f"\n{len(results) - bad_n}/{len(results)} checks passed")
sys.exit(1 if bad_n else 0)
