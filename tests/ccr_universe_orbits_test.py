#!/usr/bin/env python3
"""Guards for SkyView's orbit layout — kb/_build_ccr_universe.py (2026-09-03).

Sam: "have unassigned course individually in orbit around the cluster they are
most aligned to (rather than having them all sit in a huge cluster as they are
now)." The builder scores every stand-alone course against the identities of
its discipline and places it on an orbit ring around the best match. Three
things about that must stay true, and each looks fine on screen when it is not:

  1. THE TITLE DECIDES, THE CORROBORATORS ONLY CORROBORATE. A stand-alone that
     shares TOP code, units and credit type with an identity but no title word
     and no subject code has NO parent — Rule 7's two-signals-agree gate. A
     bare SUBJ4 match never qualifies either: inside one discipline nearly
     every identity shares it.
  2. THE GEOMETRY NEVER OVERLAPS. Satellites sit on rings clear of their parent
     and of each other; identities' footprints (node + orbits) never intersect;
     the rim holds the unaligned; the island radius contains everything.
  3. THE SHARDS ARE KEYED BY CONTROL NUMBER, so a member the payload drops (no
     key) cannot shift every later description onto the wrong course.

Then the committed payload: no stand-alone island survives, every orbit names
a real identity in the same island, no id is drawn twice, and the counts agree
with the points.

Run:  python3 tests/ccr_universe_orbits_test.py
"""
import importlib
import json
import math
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
B = importlib.import_module("_build_ccr_universe")

FAILURES = []


def check(name, cond, detail=""):
    if cond:
        print(f"  ok    {name}")
    else:
        FAILURES.append(name)
        print(f"  FAIL  {name}{(': ' + detail) if detail else ''}")


def row(ident, title, subj, members=2, top="0956.50", units=3.0, credit="Credit",
        kind="Course", disc="Welding", system="M-ID"):
    return {"kind": kind, "id": ident, "title": title, "disc": disc, "subj": subj,
            "members": members, "top": top, "units": units, "credit": credit,
            "id_system": system, "flags": {}}


# ── 1. the alignment ─────────────────────────────────────────────────────────
print("1. alignment — what earns an orbit and what does not")
check("stemming folds swimming/swim and studies/study",
      B.stem("swimming") == "swim" and B.stem("studies") == "study" and B.stem("applications") == "application",
      f"{B.stem('swimming')} {B.stem('studies')} {B.stem('applications')}")
check("title tokens drop stopwords and bare level numbers",
      B.toks("Introduction to Swimming Conditioning 4") == {"swim", "condition"},
      str(B.toks("Introduction to Swimming Conditioning 4")))
check("a lone letter is noise, not a word (3-D / 2-D)",
      B.toks("3-D Design & Fabrication") == {"design", "fabrication"}, str(B.toks("3-D Design & Fabrication")))

idents = [
    row("WELD M1001", "Welding Fundamentals", ["WELD"], members=6),
    row("WELD M1002", "Pipe Welding", ["WLD"], members=3, units=2.0),
    row("WELD M1003", "Blueprint Reading", ["WELD"], members=2, units=2.0),
]
sas = [
    row("WELD M10AA", "Welding Fundamentals Lab", ["WELD"], members=1, units=1.0, kind="Stand-Alone"),
    row("WELD M10AB", "Pipe Fitting", ["PIPE"], members=1, units=2.0, kind="Stand-Alone"),
    # TOP + units + credit all match WELD M1002 — and NOTHING else does.
    row("WELD M10AC", "Kite Building", ["KITE"], members=1, units=2.0, kind="Stand-Alone"),
    row("WELD M10AD", "Reading Skills", ["WELD"], members=1, kind="Stand-Alone"),
    # Shares the subject code with two identities and no title word with any.
    row("WELD M10AE", "Safety Orientation", ["WELD"], members=1, kind="Stand-Alone"),
]
hits = B.align_standalones(idents, sas)
check("subject + title picks the parent", hits.get("WELD M10AA", (None,))[0] == "WELD M1001", str(hits.get("WELD M10AA")))
check("a title word alone is enough (Pipe Fitting → Pipe Welding)",
      hits.get("WELD M10AB", (None,))[0] == "WELD M1002", str(hits.get("WELD M10AB")))
check("⭐ TOP + units + credit with no subject or title signal earns NO orbit (two-signals gate)",
      "WELD M10AC" not in hits, str(hits.get("WELD M10AC")))
check("the title outvotes the shared subject code (Reading Skills → Blueprint Reading)",
      hits.get("WELD M10AD", (None,))[0] == "WELD M1003", str(hits.get("WELD M10AD")))
check("⭐ a shared subject code with no title overlap earns NO orbit",
      "WELD M10AE" not in hits, str(hits.get("WELD M10AE")))
why = hits["WELD M10AA"][2]
check("the why-bits name both signals on the first case",
      bool(why & B.W_SUBJ) and bool(why & B.W_TITLE) and bool(why & B.W_TOP), bin(why))
check("the score is reproducible and rounded", hits["WELD M10AA"][1] == round(hits["WELD M10AA"][1], 2))

# The weights. A CLEARLY better title must beat subject + TOP + units + credit
# stacked on a weaker one; a MARGINAL title gap may legitimately lose to them.
# Both halves are asserted, because the first build had the balance wrong the
# other way ("Swim Training for Competition" landed on "Aerobic Weight
# Training" over a swimming identity) and a guard on one side only would let
# the pendulum swing past the middle unnoticed.
strong = row("KINE M1001", "Swim Training Competition Prep", ["PE"], members=4, top="0835.00", units=1.0)
weak = row("KINE M1002", "Aerobic Weight Training", ["KINE"], members=9, top="0835.10", units=0.5)
sa = row("KINE M10ZZ", "Swim Training for Competition", ["KINE"], members=1, top="0835.10",
         units=0.5, kind="Stand-Alone", disc="Kinesiology")
h2 = B.align_standalones([strong, weak], [sa])
check("⭐ a clearly better title wins over subject + TOP + units + credit on a weaker one",
      h2["KINE M10ZZ"][0] == "KINE M1001", str(h2))
marginal = row("KINE M1003", "Swimming for Fitness", ["PE"], members=4, top="0835.00", units=1.0)
h3 = B.align_standalones([marginal, weak], [sa])
check("a marginal title gap (0.40 vs 0.33 Dice) yields to shared subject, TOP and units",
      h3["KINE M10ZZ"][0] == "KINE M1002", str(h3))

# ── 1b. orbits may cross disciplines ─────────────────────────────────────────
# Sam, 2026-09-03: Business courses sit under Business while others sit under
# Vocational (a noncredit practice); a vocational business course should orbit
# Business or Small Business. "vocational is a big grab bag of noncredit courses
# and many need to stay there and some need to be moved to a MID course in
# another discipline." Two rules, both asserted: a grab-bag course is scored
# against the whole reference with a bonus for staying home; any other course
# leaves its subject only when nothing at home fits AND a strong title match
# exists elsewhere.
print("\n1b. orbits may cross disciplines (a grab bag looks everywhere; others only when home has nothing)")
rows2 = [
    row("BUSI M1001", "Starting a New Business", ["BUS"], members=5, disc="Business", top="0506.40", units=3.0),
    row("VOCE M9001", "Vocational Skills Lab", ["VOC"], members=2, disc="Vocational", top="4930.00", units=0.0, credit="Noncredit"),
    row("VOCE M9002", "Home-Based Business Basics", ["VOC"], members=2, disc="Vocational", top="4930.00", units=0.0, credit="Noncredit"),
    row("ENGL M1001", "Composition and Rhetoric", ["ENGL"], members=9, disc="English"),
    row("READ M1001", "Reading Skills Development", ["READ"], members=4, disc="Reading"),
]
sas2 = [
    row("VOCE M90AA", "Entrepreneur Start-Up and Business Registration", ["VOC ED"], members=1, disc="Vocational",
        top="4930.00", units=0.0, credit="Noncredit", kind="Stand-Alone"),
    row("VOCE M90AB", "Vocational Skills Workshop", ["VOC ED"], members=1, disc="Vocational",
        top="4930.00", units=0.0, credit="Noncredit", kind="Stand-Alone"),
    row("VOCE M90AC", "Business Basics for the Trades", ["VOC ED"], members=1, disc="Vocational",
        top="4930.00", units=0.0, credit="Noncredit", kind="Stand-Alone"),
    row("ENGL M10AA", "Reading Skills Development Lab", ["ENGL"], members=1, disc="English", kind="Stand-Alone"),
    row("ENGL M10AB", "Development of the Novel", ["ENGL"], members=1, disc="English", kind="Stand-Alone"),
    # One shared word on a two-word title is Dice 0.5 — not enough to leave your subject.
    row("ENGL M10AC", "Mediation Skills", ["ENGL"], members=1, disc="English", kind="Stand-Alone"),
    # …but an identical title elsewhere is (the whole title agrees).
    row("ENGL M10AD", "Reading Skills Development", ["ENGL"], members=1, disc="English", kind="Stand-Alone"),
]
_o, _bd, _sd, sats2, rim2, _di, stats2 = B.group_corpus(rows2, sas2)
def parent_of(sid):
    for pid, lst in sats2.items():
        for item in lst:
            if item[0]["id"] == sid:
                return pid, (item[2] if len(item) > 2 else None)
    return None, None
check("⭐ a vocational business course orbits the Business identity, and says it is filed under Vocational",
      parent_of("VOCE M90AA") == ("BUSI M1001", "Vocational"), str(parent_of("VOCE M90AA")))
check("a vocational course that fits at home stays home (no cross flag)",
      parent_of("VOCE M90AB") == ("VOCE M9001", None), str(parent_of("VOCE M90AB")))
check("⭐ a tie between home and away stays home — the home bonus (\"many need to stay there\")",
      parent_of("VOCE M90AC") == ("VOCE M9002", None), str(parent_of("VOCE M90AC")))
check("⭐ a course with nothing at home and a STRONG title match elsewhere orbits there, flagged",
      parent_of("ENGL M10AA") == ("READ M1001", "English"), str(parent_of("ENGL M10AA")))
check("a course with nothing at home and only a weak match elsewhere stays on its rim",
      parent_of("ENGL M10AB") == (None, None) and any(r["id"] == "ENGL M10AB" for r in rim2["English"]),
      str(parent_of("ENGL M10AB")))
check("⭐ one shared word on a two-word title does not carry a course across (Mediation Skills stays)",
      parent_of("ENGL M10AC") == (None, None) and any(r["id"] == "ENGL M10AC" for r in rim2["English"]),
      str(parent_of("ENGL M10AC")))
check("an identical title elsewhere does (whole-title agreement)",
      parent_of("ENGL M10AD") == ("READ M1001", "English"), str(parent_of("ENGL M10AD")))
check("the cross count is three", stats2["aligned_cross"] == 3, str(stats2["aligned_cross"]))
pts2, _r2 = B.layout_island([rows2[0]], sats2, [])
cross_pt = [p for p in pts2 if p["i"] == "VOCE M90AA"]
check("the cross-discipline satellite is drawn in the parent's island carrying h",
      len(cross_pt) == 1 and cross_pt[0].get("h") == "Vocational" and cross_pt[0].get("o") == "BUSI M1001")

# ── 2. the geometry ──────────────────────────────────────────────────────────
print("\n2. geometry — rings, footprints and the rim never overlap")
rings = B.plan_rings(3.7, 20)
check("the rings carry exactly the satellites asked for", sum(s for _, s in rings) == 20, str(rings))
check("ring radii increase outward", all(rings[i][0] < rings[i + 1][0] for i in range(len(rings) - 1)))
check("no ring is packed tighter than its circumference allows",
      all(2 * math.pi * R / (2 * B.SAT_R + B.RING_GAP) >= slots - 1e-9 for R, slots in rings))

pos, outer = B.pack_rings([10, 5, 5, 5, 3, 3, 3, 3, 3])
radii = [10, 5, 5, 5, 3, 3, 3, 3, 3]
worst = 0.0
for i in range(len(pos)):
    for j in range(i + 1, len(pos)):
        d = math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1])
        worst = max(worst, radii[i] + radii[j] - d)
check(f"packed circles never overlap (worst intrusion {worst:.2f})", worst <= 1e-9)
check("the pack's outer radius contains every circle",
      all(math.hypot(x, y) + r <= outer + 1e-9 for (x, y), r in zip(pos, radii)))

sats_by_parent = {"WELD M1001": [(sas[0], (5.0, 5)), (sas[3], (3.0, 4))] + [
    (row(f"WELD M20{k:02d}", f"Weld {k}", ["WELD"], members=1, kind="Stand-Alone"), (2.0, 4))
    for k in range(18)]}
pts, radius = B.layout_island(idents, sats_by_parent, [sas[1], sas[2], sas[4]])
def rad_of(p):
    return B.SAT_R if p.get("a") else B.node_r(p["n"])
worst = 0.0
for i in range(len(pts)):
    for j in range(i + 1, len(pts)):
        d = math.hypot(pts[i]["x"] - pts[j]["x"], pts[i]["y"] - pts[j]["y"])
        worst = max(worst, rad_of(pts[i]) + rad_of(pts[j]) - d)
check(f"no two points in an island overlap (worst intrusion {worst:.2f})", worst <= 0.3)
check("every point sits inside the island radius",
      all(math.hypot(p["x"], p["y"]) + rad_of(p) <= radius + 1e-6 for p in pts))
orb = [p for p in pts if p.get("a") and p.get("o")]
rim = [p for p in pts if p.get("a") and not p.get("o")]
check("satellites carry parent, score and why; rim points carry none",
      len(orb) == 20 and all("q" in p and "w" in p for p in orb) and len(rim) == 3
      and all("q" not in p for p in rim), f"{len(orb)} orbiting, {len(rim)} rim")
parent = [p for p in pts if p["i"] == "WELD M1001"][0]
check("a parent knows how many satellites it carries (k)", parent.get("k") == 20, str(parent.get("k")))
dists = [math.hypot(p["x"] - parent["x"], p["y"] - parent["y"]) for p in orb]
check("every satellite sits clear of its parent's own radius",
      min(dists) >= B.node_r(6) + B.SAT_R, f"min {min(dists):.1f}")
check("identity points carry units when the row has them", all("u" in p for p in pts if not p.get("a")))
empty_pts, empty_r = B.layout_island([], {}, [sas[k] for k in range(5)] * 3)
worst = 0.0
for i in range(len(empty_pts)):
    for j in range(i + 1, len(empty_pts)):
        d = math.hypot(empty_pts[i]["x"] - empty_pts[j]["x"], empty_pts[i]["y"] - empty_pts[j]["y"])
        worst = max(worst, 2 * B.SAT_R - d)
check(f"a discipline with no identities still lays its courses out without overlap ({worst:.2f})",
      len(empty_pts) == 15 and worst <= 1e-6)

# ── 3. the shards ─────────────────────────────────────────────────────────────
print("\n3. description shards — keyed by control number")
with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
    rel = os.path.relpath(tmp, ROOT)
    islands = [{"d": "Welding", "sh": "welding", "p": [{"i": "WELD M1001"}, {"i": "WELD M10AA"}]}]
    mem = {"WELD M1001": [{"cn": "CCC000000101", "n": "WELD 100", "t": "Welding I", "u": 3},
                          {"cn": "NULL", "n": "WLD 1", "t": "Weld", "u": 3},
                          {"cn": "CCC000000103", "n": "WELD 102", "t": "Welding II", "u": 2}],
           "WELD M10AA": [{"cn": "CCC000000301", "n": "WELD 100L", "t": "Welding Lab", "u": 1}]}
    desc = {"WELD M1001": ["First description.", "Keyless description.", None],
            "WELD M10AA": ["Lab description."]}
    stats = B.write_desc_shards(islands, rel, mem, desc)
    shard = json.load(open(os.path.join(tmp, "welding.json"), encoding="utf-8"))
    check("the shard is keyed by control-number digits", set(shard) == {"101", "103", "301"}, str(sorted(shard)))
    check("⭐ a keyless member does not shift the descriptions that follow it",
          shard["103"][0] is None and shard["101"][0] == "First description.", str(shard["103"]))
    check("each record carries [description, title, units]",
          shard["301"] == ["Lab description.", "Welding Lab", 1] and shard["103"][1:] == ["Welding II", 2])
    check("the report counts courses and described courses separately",
          stats["courses"] == 3 and stats["described"] == 2, str(stats))

# ── 4. the committed payload ─────────────────────────────────────────────────
print("\n4. the committed payload")
uni_path = os.path.join(ROOT, "prototype", "ccr_universe.json")
if not os.path.exists(uni_path):
    check("prototype/ccr_universe.json is committed", False, "run kb/_build_ccr_universe.py")
else:
    U = json.load(open(uni_path, encoding="utf-8"))
    islands = U["islands"]
    check("⭐ no stand-alone island survives — stand-alones live inside their discipline",
          not any(i.get("a") or i["d"].endswith("stand-alone") for i in islands))
    ids = [p["i"] for i in islands for p in i["p"]]
    check("no point id is drawn twice", len(ids) == len(set(ids)), f"{len(ids) - len(set(ids))} duplicates")
    stray = 0
    for i in islands:
        here = {p["i"]: p for p in i["p"]}
        for p in i["p"]:
            if p.get("a") and p.get("o") and (p["o"] not in here or here[p["o"]].get("a")):
                stray += 1
    check("every orbit names a clustered identity in the same island", stray == 0, f"{stray} stray")
    c = U["counts"]
    orbiting = sum(1 for i in islands for p in i["p"] if p.get("a") and p.get("o"))
    rim = sum(1 for i in islands for p in i["p"] if p.get("a") and not p.get("o"))
    check("the counts agree with the points",
          c["orbiting"] == orbiting and c["rim"] == rim and c["stand_alone"] == orbiting + rim
          and c["identities"] == sum(1 for i in islands for p in i["p"] if not p.get("a")),
          f"{c} vs {orbiting}/{rim}")
    check(f"most stand-alones found a parent ({orbiting:,} of {orbiting + rim:,})",
          orbiting > 0.7 * (orbiting + rim))
    check("island counts (n, sa, al) match their points",
          all(i["n"] == sum(1 for p in i["p"] if not p.get("a")) and
              i.get("sa", 0) == sum(1 for p in i["p"] if p.get("a")) and
              i.get("al", 0) == sum(1 for p in i["p"] if p.get("a") and p.get("o")) for i in islands))
    check("islands do not overlap one another",
          all(math.hypot(a["x"] - b["x"], a["y"] - b["y"]) >= a["r"] + b["r"]
              for k, a in enumerate(islands) for b in islands[k + 1:]))
    check("the why-bits table ships with the payload for the client to decode",
          U.get("why_bits", {}).get("title") == B.W_TITLE)
    cross = [(i["d"], p) for i in islands for p in i["p"] if p.get("h")]
    check(f"cross-discipline orbits exist and are counted ({len(cross):,})",
          len(cross) > 0 and c.get("orbiting_cross") == len(cross), f"counts say {c.get('orbiting_cross')}")
    check("a cross-discipline satellite is never drawn in the island it is filed under",
          all(d != p["h"] for d, p in cross))
    check("every island's xin matches its cross-filed satellites",
          all(i.get("xin", 0) == sum(1 for p in i["p"] if p.get("h")) for i in islands))
    voc = [p for d, p in cross if p["h"] == "Vocational"]
    check(f"Vocational courses orbit identities in other disciplines ({len(voc):,}) — Sam's example",
          len(voc) > 50)

print()
if FAILURES:
    print(f"{len(FAILURES)} check(s) FAILED: " + ", ".join(FAILURES))
    sys.exit(1)
print("all checks passed")
