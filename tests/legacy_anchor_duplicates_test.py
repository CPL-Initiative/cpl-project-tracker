#!/usr/bin/env python3
"""Curated-anchor duplicates lane — generator verification (2026-09-04, SkyLand S226).

Guards legacy_anchor_duplicate_groups() in excel_to_dashboard.py, the lane that
turns the Z-band retirement's duplicates.json — 130 May 2026 curated anchors
whose title and discipline exactly match a catalog identity — into a curator's
merge worklist on the CCR tab. The retirement receipt's own words: "a curator's
merge worklist after the fold, not folded by it."

THE FAILURE MODES, each proven to fail here when broken:
  1. A loose title key would pair "Accounting I" with "Accounting II" the way the
     worklist's level-safe signature deliberately does NOT — the lane's key must be
     the strict one (case, punctuation and whitespace only).
  2. The same title in ANOTHER discipline is not a duplicate ("Keyboarding" in
     Music vs Office Technologies — the homonym case the cross-discipline flag
     exists for).
  3. An anchor the curator already merged must leave the lane (or it re-offers a
     done decision, the Session-51 failure the dismissal signature was built for).
  4. A twin merged away must resolve to its LIVE target; a twin that resolves to
     the anchor itself is already merged in and is not a twin.
  5. The twin must come FIRST and the anchor LAST: the tab's survivor rule takes
     the first non-Stand-Alone member, so member order IS the merge direction.
  6. A C-ID anchor in the file is not this lane's.
  7. Against the committed files: every anchor in the retirement receipt's
     duplicates.json either has a group here or already carries merge_into — the
     shape the lane exists to drain.

Run from the repo root:

    python3 tests/legacy_anchor_duplicates_test.py
"""
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

spec = importlib.util.spec_from_file_location(
    "gen", os.path.join(ROOT, "excel_to_dashboard.py"))
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def row(cid, title, disc, sysid="M-ID", members=2, locked=False):
    return {"id": cid, "title": title, "disc": disc, "subj": [cid.split()[0]],
            "units": 3.0, "id_system": sysid, "members": members, "locked": locked}


# ── fixtures ────────────────────────────────────────────────────────────────
cc = {
    "BUSI M11TR": {"id_system": "M-ID", "common_title": "Computerized Accounting", "discipline": "Business",
                   "subject": "ACCT", "typical_units": 3.0, "source_college_count": 1,
                   "reviewed_by": "samueltlee", "reviewed_at": "2026-05-20T10:00:00",
                   "_notes": "Accounting is an area within MQ discipline 'Business'.",
                   "origin": "curated common-course anchor (2026-05)"},
    "MUSI M11AA": {"id_system": "M-ID", "common_title": "Keyboarding", "discipline": "Music",
                   "subject": "MUS", "typical_units": 2.0, "source_college_count": 1},
    "ACCT M11BB": {"id_system": "M-ID", "common_title": "Accounting I", "discipline": "Business",
                   "subject": "ACCT", "typical_units": 4.0, "source_college_count": 1},
    "ARTS M11CC": {"id_system": "M-ID", "common_title": "Beginning Drawing", "discipline": "Art",
                   "subject": "ART", "typical_units": 3.0, "source_college_count": 1},
    "ENGL M11DD": {"id_system": "M-ID", "common_title": "Intro. to Literature", "discipline": "English",
                   "subject": "ENGL", "typical_units": 3.0, "source_college_count": 1},
    "HIST M11EE": {"id_system": "M-ID", "common_title": "World History", "discipline": "History",
                   "subject": "HIST", "typical_units": 3.0, "source_college_count": 1},
    "CHEM M11FF": {"id_system": "M-ID", "common_title": "General Chemistry", "discipline": "Chemistry",
                   "subject": "CHEM", "typical_units": 5.0, "source_college_count": 1},
    "ACCT 110": {"id_system": "C-ID", "common_title": "Financial Accounting", "discipline": "Business",
                 "subject": "ACCT", "typical_units": 4.0},
    "ESOL M11GG": {"id_system": "M-ID", "common_title": "Beginning Reading and Writing",
                   "discipline": "English as a Second Language (ESL)", "subject": "ESL", "typical_units": 0.0,
                   "source_college_count": 1},
    "THTR M11HH": {"id_system": "M-ID", "common_title": "Beginning Stagecraft", "discipline": "Theater Arts",
                   "subject": "THEA", "typical_units": 3.0, "source_college_count": 1},
}
cat = {
    "BUSI M1027": {"common_title": "Computerized Accounting", "discipline": "Business", "subject": "ACCT",
                   "typical_units": 3.0, "corroboration_members": 27},
    "OFTC M1002": {"common_title": "Keyboarding", "discipline": "Office Technologies", "subject": "OFTC",
                   "typical_units": 2.0, "corroboration_members": 4},
    "ACCT M1003": {"common_title": "Accounting II", "discipline": "Business", "subject": "ACCT",
                   "typical_units": 4.0, "corroboration_members": 6},
    "ENGL M1010": {"common_title": "Intro to Literature", "discipline": "English", "subject": "ENGL",
                   "typical_units": 3.0, "corroboration_members": 9},
    "HIST M1001": {"common_title": "World History", "discipline": "History", "subject": "HIST",
                   "typical_units": 3.0, "corroboration_members": 3},
    "HIST M1002": {"common_title": "World History", "discipline": "History", "subject": "HIST",
                   "typical_units": 3.0, "corroboration_members": 12},
    "CHEM M1001": {"common_title": "General Chemistry", "discipline": "Chemistry", "subject": "CHEM",
                   "typical_units": 5.0, "corroboration_members": 30},
    "ARTS M1099": {"common_title": "Beginning Drawing", "discipline": "Art", "subject": "ART",
                   "typical_units": 3.0, "corroboration_members": 2},
    "ESOL M9168": {"common_title": "Beginning Reading and Writing", "discipline": "English as a Second Language",
                   "subject": "ESL", "typical_units": 0.0, "corroboration_members": 40},
    "THES M1087": {"common_title": "Beginning Stagecraft", "discipline": "Drama/Theater Arts", "subject": "DRAM",
                   "typical_units": 3.0, "corroboration_members": 3},
}
ALIASES = {"Drama/Theater Arts": ["Theater Arts"], "Kinesiology": ["Physical Education"]}
sg = {
    "ARTS M10ZZ": {"common_title": "Beginning Drawing", "discipline": "Art", "subject": "ART",
                   "typical_units": 3.0, "control_number": "CCC000000001"},
    "ARTS M10YY": {"common_title": "Beginning Drawing", "discipline": "Art", "subject": "ART",
                   "typical_units": 3.0, "control_number": "CCC000000002"},
}
# HIST M1001 was merged into HIST M1002 (flattened one-hop map); CHEM M1001 was
# merged INTO the anchor itself; ARTS M1099 was merged into the anchor too.
merge_into = {"HIST M1001": "HIST M1002", "CHEM M1001": "CHEM M11FF", "ARTS M1099": "ARTS M11CC"}
rows = [row("BUSI M1027", "Computerized Accounting", "Business", members=27),
        row("OFTC M1002", "Keyboarding", "Office Technologies", members=4),
        row("ACCT M1003", "Accounting II", "Business", members=6),
        row("ENGL M1010", "Intro to Literature", "English", members=9),
        row("HIST M1002", "World History", "History", members=15),
        row("CHEM M11FF", "General Chemistry", "Chemistry", members=31),
        row("ESOL M9168", "Beginning Reading and Writing", "English as a Second Language", members=40),
        row("THES M1087", "Beginning Stagecraft", "Drama/Theater Arts", members=3),
        row("BUSI M11TR", "Computerized Accounting", "Business", members=1, locked=True)]

groups = gen.legacy_anchor_duplicate_groups(cc, cat, sg, merge_into, rows, None, ALIASES)
by_anchor = {g["anchor"]: g for g in groups}

# 1. the exact pair
g = by_anchor.get("BUSI M11TR")
check("exact title + discipline pairs the anchor with its catalog twin", g is not None)
check("the twin is the FIRST member (the survivor under the tab's ★ rule)",
      g and g["members"][0]["id"] == "BUSI M1027" and g["members"][0]["k"] == "M-ID")
check("the anchor is the LAST member and is flagged anchor:1",
      g and g["members"][-1]["id"] == "BUSI M11TR" and g["members"][-1].get("anchor") == 1)
check("the twin carries its member count (n) from its live row", g and g["members"][0].get("n") == 27)
check("the group carries the anchor's provenance (reviewed_by / reviewed_at[:10] / note / n_src / origin)",
      g and g.get("reviewed_by") == "samueltlee" and g.get("reviewed_at") == "2026-05-20"
      and g.get("note", "").startswith("Accounting is an area") and g.get("n_src") == 1
      and g.get("origin") == "curated common-course anchor (2026-05)")
check("score is 1.0 (an exact duplicate, not a similarity)", g and g["score"] == 1.0)
check("n counts every member including the anchor", g and g["n"] == 2)

# 2. same title, another discipline: not a duplicate
check("the same title in another discipline is NOT paired (Keyboarding: Music vs Office Technologies)",
      "MUSI M11AA" not in by_anchor)

# 1b. the strict key: level words and digits are NOT dropped
check("a strict title key keeps Accounting I apart from Accounting II", "ACCT M11BB" not in by_anchor)
check("…but punctuation and spacing differences DO match (Intro. to Literature = Intro to Literature)",
      "ENGL M11DD" in by_anchor and by_anchor["ENGL M11DD"]["members"][0]["id"] == "ENGL M1010")
check("_legacy_title_key collapses case, punctuation and whitespace only",
      gen._legacy_title_key("Intro.  to LITERATURE!") == "intro to literature"
      and gen._legacy_title_key("Accounting I") != gen._legacy_title_key("Accounting II"))

# 4. merged-away twin resolves to its live target; a twin resolving to the anchor is dropped
g = by_anchor.get("HIST M11EE")
check("a twin merged away resolves to its LIVE target, de-duplicated with the target itself",
      g is not None and [m["id"] for m in g["members"]] == ["HIST M1002", "HIST M11EE"])
check("a twin already merged INTO the anchor is not a twin (no group for CHEM M11FF)", "CHEM M11FF" not in by_anchor)

# 5. stand-alone twins: listed as Stand-Alone (so the tab's rule makes the anchor the survivor)
g = by_anchor.get("ARTS M11CC")
check("stand-alone twins are members with k=Stand-Alone and g=1 (the catalog twin merged into the anchor is dropped)",
      g is not None and [m["id"] for m in g["members"]] == ["ARTS M10YY", "ARTS M10ZZ", "ARTS M11CC"]
      and all(m["k"] == "Stand-Alone" and m.get("g") == 1 for m in g["members"][:2]))
check("groups with a multi-college twin sort BEFORE stand-alone-only groups",
      [x["anchor"] for x in groups].index("ARTS M11CC") > [x["anchor"] for x in groups].index("BUSI M11TR"))

# 3. an anchor already merged leaves the lane
groups2 = gen.legacy_anchor_duplicate_groups(cc, cat, sg, dict(merge_into, **{"BUSI M11TR": "BUSI M1027"}), rows, None, ALIASES)
check("an anchor already carrying merge_into is skipped (the lane drains as the curator confirms)",
      "BUSI M11TR" not in {x["anchor"] for x in groups2})

# discipline spelling: a trailing parenthetical and the alias file resolve before matching
check("an anchor spelled 'English as a Second Language (ESL)' matches a twin in 'English as a Second Language'",
      "ESOL M11GG" in by_anchor and by_anchor["ESOL M11GG"]["members"][0]["id"] == "ESOL M9168")
check("an anchor spelled 'Theater Arts' matches 'Drama/Theater Arts' through kb/discipline_aliases.json",
      "THTR M11HH" in by_anchor and by_anchor["THTR M11HH"]["members"][0]["id"] == "THES M1087")
check("without the alias file the alias spelling does NOT match (the resolution is the file's, not a guess)",
      "THTR M11HH" not in {x["anchor"] for x in gen.legacy_anchor_duplicate_groups(cc, cat, sg, merge_into, rows)})
check("_legacy_disc_key: parenthetical stripped, alias resolved, canonical passes through",
      gen._legacy_disc_key("English as a Second Language (ESL)", {}) == "English as a Second Language"
      and gen._legacy_disc_key("Theater Arts", {"Theater Arts": "Drama/Theater Arts"}) == "Drama/Theater Arts"
      and gen._legacy_disc_key("Business", {}) == "Business")

# 6. official anchors are not this lane's
check("a C-ID anchor in the file is skipped", "ACCT 110" not in by_anchor)

# disc_of: the curated discipline of the twin wins
def disc_of(cid, base):
    return "Business" if cid == "OFTC M1002" else base
groups3 = gen.legacy_anchor_duplicate_groups(cc, cat, sg, merge_into, rows, disc_of, ALIASES)
check("disc_of (the curated discipline) decides the twin's discipline for matching",
      "MUSI M11AA" not in {x["anchor"] for x in groups3}
      and any(x["anchor"] == "BUSI M11TR" for x in groups3))

# ── 7. the committed files ──────────────────────────────────────────────────
def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)

real_cc = load("kb/common_courses.json")
real_cat = load("kb/coci_minted_courses.json")["courses"]
real_sg = load("kb/coci_minted_singletons.json")["courses"]
real_cur = load("kb/coci_curation.json")["curations"]
real_mi = {k: v["merge_into"] for k, v in real_cur.items() if isinstance(v, dict) and v.get("merge_into")}
gen.flatten_merge_chains(real_mi)
real_rows = [{"id": k, "title": v.get("common_title"), "disc": (real_cur.get(k) or {}).get("discipline") or v.get("discipline"),
              "subj": [v.get("subject")] if v.get("subject") else [], "units": v.get("typical_units"),
              "id_system": "M-ID", "members": v.get("corroboration_members")}
             for k, v in real_cat.items() if k not in real_mi]
real_disc_of = lambda cid, base: ((real_cur.get(cid) or {}).get("discipline") or base)
real_aliases = load("kb/discipline_aliases.json").get("aliases") or {}
real_groups = gen.legacy_anchor_duplicate_groups(real_cc, real_cat, real_sg, real_mi, real_rows, real_disc_of, real_aliases)
real_by_anchor = {g["anchor"]: g for g in real_groups}
receipt = load("kb/zband_retire_out/2026-09-03/duplicates.json")["rows"]
# The receipt matched on each record's OWN discipline; the lane matches on the
# discipline the CCR tab DISPLAYS (the curated overlay wins), so the one
# legitimate way a receipt anchor can be absent is a twin whose curated
# discipline no longer agrees with the anchor's — a real signal, not a miss.
# Receipt twins are pre-fold ids: resolve them through the fold's alias map.
fold = {o: v["new_id"] for o, v in load("kb/prefix_fold_out/2026-09-03/alias_map.json")["aliases"].items()}
def cur_disc(i):
    return (real_cur.get(fold.get(i, i)) or {}).get("discipline")
uncovered = [r for r in receipt if r["new_id"] not in real_by_anchor and r["new_id"] not in real_mi]
explained = [r for r in uncovered
             if any(cur_disc(t) and gen._legacy_disc_key(cur_disc(t), {}) != gen._legacy_disc_key(r["discipline"], {})
                    for t in r["catalog_twins"])]
check("committed files: every receipt anchor (%d) has a group, already carries merge_into, or its twin was "
      "re-disciplined by a curator since (%d uncovered, %d explained by a curated discipline)"
      % (len(receipt), len(uncovered), len(explained)), len(uncovered) == len(explained))
check("committed files: the lane offers at least as many groups as the receipt minus the explained (%d ≥ %d)"
      % (len(real_groups), len(receipt) - len(explained)), len(real_groups) >= len(receipt) - len(explained))
for r in uncovered:
    print("  receipt anchor not in the lane: %s (%s) — twin curated discipline %r vs anchor %r"
          % (r["new_id"], r["title"], [cur_disc(t) for t in r["catalog_twins"]], r["discipline"]))
check("committed files: every group's anchor is an M-ID anchor of common_courses.json with no merge_into",
      all(real_cc.get(g["anchor"], {}).get("id_system") == "M-ID" and g["anchor"] not in real_mi for g in real_groups))
check("committed files: no group names a dead id (every twin is a live catalog id or a live merge target)",
      all(m["id"] in real_cat or m["id"] in real_sg or m["id"] in real_cc or m["id"] in set(real_mi.values())
          for g in real_groups for m in g["members"]))
check("committed files: the anchor is always last and never also a twin",
      all(g["members"][-1]["id"] == g["anchor"] and all(m["id"] != g["anchor"] for m in g["members"][:-1])
          for g in real_groups))
print("  committed-file lane: %d groups today (receipt: %d rows); stand-alone-only groups: %d"
      % (len(real_groups), len(receipt), sum(1 for g in real_groups if g["members"][0]["k"] == "Stand-Alone")))

passed = 0
for name, ok in results:
    print(("PASS  " if ok else "FAIL  ") + name)
    passed += ok
print("\n%d/%d assertions passed" % (passed, len(results)))
sys.exit(0 if passed == len(results) and results else 1)
