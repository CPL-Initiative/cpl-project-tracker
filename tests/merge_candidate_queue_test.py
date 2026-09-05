#!/usr/bin/env python3
"""Fixture checks for kb/_merge_candidate_queue.py — Sam's ruling 6 (2026-09-05).

The point of this lane is what it does NOT do. Sam ruled that the candidates be
queued and the merge wait for a faculty reviewer, because sufficiency is a
curriculum judgment — so the first and most important check here is that the
module contains no write path at all. The rest guard the evidence a reviewer
reads: that bands never cross, that a cross-discipline group is flagged rather
than proposed, that the survivor's basis is the rule that actually DECIDED, and
that a human-named group is recorded as theirs.

Run from repo root: python3 tests/merge_candidate_queue_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _merge_candidate_queue as q  # noqa: E402

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (f"\n      {why}" if why and not cond else ""))


def row(i, title, n, kind="Course", disc="Welding", credit="Credit"):
    return {"id": i, "title": title, "members": n, "kind": kind, "disc": disc, "credit": credit}


ROWS = {r["id"]: r for r in [
    row("WELD M1001", "Introduction to Welding", 24),
    row("WELD M1002", "introduction to  welding", 2),      # same title once normalized
    row("WELD M1003", "Pipe Welding", 5),
    row("WELD M9001", "Pipe Welding", 5, credit="Noncredit"),  # ⚠️ crosses the band
    row("WELD M1004", "Brazing", 3),
    row("MATH M1005", "Brazing", 9, disc="Mathematics"),    # ⚠️ crosses the discipline
]}
ARTS = {"WELD M1001": 7, "WELD M1002": 3, "WELD M1003": 1, "WELD M9001": 40}

# ── the whole point: this lane writes nothing ────────────────────────────────
src = open(os.path.join(ROOT, "kb", "_merge_candidate_queue.py"), encoding="utf-8").read()
check("it never writes a merge_into row — the merge is the reviewer's to make",
      "merge_into" not in src.replace("`merge_into`", "").replace("merge_into` row", ""),
      "found a merge_into write path")
check("it reaches no live table",
      not any(w in src for w in ("execute_sql", "supabase", "PostgREST", "requests.post", "urlopen")))
check("it names the ruling it exists under",
      "ruling 6" in src and "faculty reviewer" in src)

# ── the lanes ────────────────────────────────────────────────────────────────
groups = q.build("Welding", ROWS, ARTS)
by_survivor = {g["survivor"]: g for g in groups}
seeded = [g for g in groups if g["lane"] == "seeded"]
check("a seeded group is recorded as the human's, with who and when",
      all(g.get("source") and "Sam" in g["source"] for g in seeded) if seeded else True)
check("seeded groups sort first — a human asked for those",
      not groups or groups[0]["lane"] == "seeded" or not seeded)

same = [g for g in groups if g["lane"] == "same_title"]
check("titles that differ only in case and spacing are one group",
      any(sorted(m["id"] for m in g["members"]) == ["WELD M1001", "WELD M1002"] for g in same),
      str([[m["id"] for m in g["members"]] for g in same]))

# ── the two things that must be FLAGGED, not proposed ────────────────────────
band = [g for g in groups if {m["id"] for m in g["members"]} == {"WELD M1003", "WELD M9001"}]
check("a cross-band pair is found", len(band) == 1)
check("⭐ bands never cross: it is flagged, and NOT proposable",
      band and not band[0]["proposable"] and any("band" in f for f in band[0]["flags"]),
      str(band[0]["flags"]) if band else "")
disc = [g for g in groups if {m["id"] for m in g["members"]} == {"WELD M1004", "MATH M1005"}]
check("a cross-discipline pair does not even enter a single-discipline queue", not disc)
allg = q.build(None, ROWS, ARTS)
disc2 = [g for g in allg if {m["id"] for m in g["members"]} == {"WELD M1004", "MATH M1005"}]
check("but across disciplines it appears, flagged rather than proposed",
      disc2 and not disc2[0]["proposable"] and any("discipl" in f for f in disc2[0]["flags"]),
      str(disc2[0]["flags"]) if disc2 else "no group")

# ── the survivor basis names the rule that DECIDED ───────────────────────────
g1 = by_survivor.get("WELD M1001")
check("most-adopted survives a same-title pair", g1 is not None)
check("and the basis is the rule that actually separated them",
      g1 and g1["survivor_basis"] == "taught at more colleges", g1 and g1["survivor_basis"])
tie = q.group_of(["WELD M1003", "WELD M9001"], ROWS, ARTS, "same_title", "t")
check("⭐ a tie on colleges falls to articulations, not to the alphabet",
      tie["survivor"] == "WELD M9001" and tie["survivor_basis"] == "more articulations",
      f"{tie['survivor']} / {tie['survivor_basis']}")
# a REAL tie: same colleges (5 and 5) and same articulations (1 and 1)
flat = q.group_of(["WELD M9001", "WELD M1003"], ROWS, {"WELD M9001": 1, "WELD M1003": 1},
                  "same_title", "t")
check("and only a real tie is broken alphabetically, and says so",
      flat["survivor_basis"].startswith("alphabetically") and flat["survivor"] == "WELD M1003",
      f"{flat['survivor']} / {flat['survivor_basis']}")

# ── an id the catalog does not carry is named, never silently dropped ────────
ghost = q.group_of(["WELD M1001", "WELD M9999"], ROWS, ARTS, "same_title", "t")
check("an id missing from the catalog is flagged by name",
      any("WELD M9999" in f for f in ghost["flags"]), str(ghost["flags"]))
check("it is still listed as a member, not dropped",
      any(m["id"] == "WELD M9999" for m in ghost["members"]))

# ── the committed queue, on real data ────────────────────────────────────────
live = os.path.join(ROOT, "kb", "merge_candidates")
if os.path.isdir(live):
    newest = sorted(os.listdir(live))[-1]
    doc = json.load(open(os.path.join(live, newest, "queue.json"), encoding="utf-8"))
    check("the committed queue says plainly that it applied nothing",
          "NOTHING APPLIED" in doc["_status"] and doc["_writes"].startswith("none"))
    trio = [g for g in doc["groups"] if g["lane"] == "seeded"]
    check("Sam's intro-welding trio is in it with M1109 surviving",
          trio and trio[0]["survivor"] == "WELD M1109"
          and {m["id"] for m in trio[0]["members"]} == {"WELD M1109", "WELD M1106", "WELD M10VQ"},
          str(trio))
    check("the SMAW pair is queued behind it",
          any({m["id"] for m in g["members"]} == {"WELD M1052", "WELD M1054"} for g in doc["groups"]))
    check("and the real cross-band pair is flagged, not proposed",
          all(g["proposable"] is False for g in doc["groups"]
              if {m["id"] for m in g["members"]} == {"WELD M1009", "WELD M90AI"}))

failed = [n for n, ok in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
