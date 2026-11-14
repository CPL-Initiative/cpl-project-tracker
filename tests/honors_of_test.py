#!/usr/bin/env python3
"""Guards for the `honors_of` field (S653; docs/reference/honors_of_design.md).

Sam's rulings: an Honors course gets its own M-ID with a declared equivalence to its base (Sheet 191 card 1); the id
is "Base number plus H (MATH M1036H)" and the equivalence is "Two-way: either satisfies the other" (Sheet 197 card 3);
CCN structures are the gold standard and C-ID keeps its own numbers, so Honors reaches M-IDs only.

What this pins:
  1. An Honors M-ID with honors_of survives the fold apart from its base: a bot merge that would join them is cut,
     directly, through a chain, or through a third id both land on, and the cut is reported, never silent.
  2. The pair is never offered for merge, including after a third id merges into the base (the pairwise hold that
     COBIx's review of #3304 asked for: a group-signature dismissal re-offers the pair once the group changes).
  3. A person's merge wins (Rule 10): it stands, and the pair's honors_of is set aside and reported.
  4. An H id passes every shape check that reads an M-ID; a C-ID or CCN never takes a minted H, and its record is
     untouched by the fold.
  5. No row carries the field: the fold leaves today's overlay byte for byte (the committed overlay, rebuilt as
     rows, folds back to the committed bytes; the generator's check is in the PR's dry-run receipt).
  6. The live re-key moves an honors_of value with its base, as it moves merge_into.

Run from repo root: python3 tests/honors_of_test.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(ROOT, "kb")
sys.path.insert(0, KB)

import honors_of as ho  # noqa: E402
import _apply_curation as ac  # noqa: E402
import _row_audit  # noqa: E402
import _rekey_kb_curation_supabase as rk  # noqa: E402

results = []


def check(name, cond):
    results.append((name, bool(cond)))


def row(cid, field, value, who="automerge-v1@bot", at="2026-06-12T22:47:01+00:00"):
    return {"course_id": cid, "field": field, "value": value, "reviewer_email": who, "reviewed_at": at,
            "validated_at": None, "validated_by": None}


HON = "honors-s653@bot"

# 1. The fold holds the pair apart.
cur, skipped, honors = ac.fold_rows([
    row("HUMA M1110H", "honors_of", "HUMA M1110", HON, "2026-11-14T18:00:00+00:00"),
    row("HUMA M1110H", "merge_into", "HUMA M1110"),
])
check("fold: a bot merge of the Honors id into its base is cut", "merge_into" not in cur.get("HUMA M1110H", {}))
check("fold: the Honors id keeps its honors_of", cur.get("HUMA M1110H", {}).get("honors_of") == "HUMA M1110")
check("fold: the cut is reported under held", [h["merge_source"] for h in honors.get("held", [])] == ["HUMA M1110H"])
doc = ac.overlay_doc(cur, honors, "2026-11-14T18:00:00Z")
check("fold: the overlay names the hold", doc.get("_honors_held", [{}])[0].get("merge_into") == "HUMA M1110")

cur, _, honors = ac.fold_rows([
    row("HUMA M1110H", "honors_of", "HUMA M1110", HON),
    row("HUMA M1110H", "merge_into", "HUMA M10OI"),
    row("HUMA M10OI", "merge_into", "HUMA M1110"),
])
check("fold: a chain through a third id is cut at the Honors id's own hop",
      "merge_into" not in cur.get("HUMA M1110H", {}) and cur["HUMA M10OI"]["merge_into"] == "HUMA M1110")

cur, _, honors = ac.fold_rows([
    row("HUMA M1110H", "honors_of", "HUMA M1110", HON),
    row("HUMA M1110H", "merge_into", "HUMA M1999"),
    row("HUMA M1110", "merge_into", "HUMA M1999"),
])
check("fold: both landing on one third id: the Honors id stands, the base's merge stays",
      "merge_into" not in cur.get("HUMA M1110H", {}) and cur["HUMA M1110"]["merge_into"] == "HUMA M1999")

cur, _, honors = ac.fold_rows([
    row("LIBR M1040H", "honors_of", "LIBR M1040", HON),
    row("LIBR M1040", "merge_into", "LIBR M1040H"),
])
check("fold: the base merged into its Honors id is cut on the base's side",
      "LIBR M1040" not in cur and honors["held"][0]["merge_source"] == "LIBR M1040")

# The generator's merge map takes the same cut (excel_to_dashboard.py calls hold_merges on the overlay's map).
kept, held, _ = ho.hold_merges({"HUMA M1110H": "HUMA M1110", "HUMA M10OI": "HUMA M1110", "X M1001": "X M1002"},
                               {"HUMA M1110H": "HUMA M1110"})
check("generator map: only the joining edge leaves",
      kept == {"HUMA M10OI": "HUMA M1110", "X M1001": "X M1002"} and len(held) == 1)

# 2. Never offered, including after a third id merges into the base.
group = ["HUMA M10OI", "HUMA M1110", "HUMA M1110H"]
hmap = {"HUMA M1110H": "HUMA M1110"}
check("worklist: the Honors member leaves a group holding its base",
      ho.without_honors_pairs(group, hmap) == ["HUMA M10OI", "HUMA M1110"])
after_third = ["HUMA M1110", "HUMA M1110H"]   # M10OI merged into M1110: the group's signature changed
check("worklist: after a third id merges into the base the pair is still not offered",
      len(ho.without_honors_pairs(after_third, hmap)) < 2)
check("worklist: an unrelated group is unchanged", ho.without_honors_pairs(["A M1001", "A M1002"], hmap)
      == ["A M1001", "A M1002"])
check("worklist: no honors_of, no change", ho.without_honors_pairs(group, {}) == group)
src_amw = open(os.path.join(KB, "_auto_merge_worklist.py"), encoding="utf-8").read()
check("auto-merge worklist reads honors_of through kb/honors_of.py",
      "from honors_of import honors_map, load_live_ids, without_honors_pairs" in src_amw and "without_honors_pairs([m[\"id\"]" in src_amw)

# 3. A person's merge wins.
cur, _, honors = ac.fold_rows([
    row("MATH M1036H", "honors_of", "MATH M1036", HON, "2026-11-14T18:00:00+00:00"),
    row("MATH M1036H", "merge_into", "MATH M1036", "curator@example.org", "2026-11-15T09:00:00+00:00"),
])
check("person: the person's merge stands", cur["MATH M1036H"].get("merge_into") == "MATH M1036")
check("person: the honors_of is set aside and reported",
      "honors_of" not in cur["MATH M1036H"] and honors["set_aside"][0]["reviewer"] == "curator@example.org")

# 4. Shapes.
for i in ("MATH M1036H", "HUMA M10MEH", "ABCD M90AIH"):
    check(f"shape: {i} is an M-ID and an Honors id", ho.is_m_id(i) and ho.is_honors_id(i))
    check(f"shape: {i} passes the row auditor's M-ID shape", bool(_row_audit.M_ID_RE.match(i)))
    check(f"shape: {i} reads as an M-ID in the generator and the CCR",
          bool(re.search(r"\sM[0-9A-Z]{4}H?\b", i)))
check("shape: a stand-alone base ending in H is a base, not Honors", not ho.is_honors_id("ABCD M10GH"))
check("shape: base of MATH M1036H", ho.base_of_id("MATH M1036H") == "MATH M1036")
check("shape: MATH M1036 takes MATH M1036H", ho.honors_id_for("MATH M1036") == "MATH M1036H")
for official in ("ENGL C1000", "ACCT 110", "ENGL C1000H", "MATH M1036H"):
    check(f"shape: {official} takes no minted H", ho.honors_id_for(official) is None)
gen = open(os.path.join(ROOT, "excel_to_dashboard.py"), encoding="utf-8").read()
ucjs = open(os.path.join(ROOT, "unified_courses.js"), encoding="utf-8").read()
check("shape: the generator's id-system regex takes the H", r'r"\sM[0-9A-Z]{4}H?\b"' in gen)
check("shape: the CCR's applyMergeLocal regex takes the H", r"/\sM[0-9A-Z]{4}H?\b/" in ucjs)
check("shape: the claim audit skips an Honors M-ID",
      r'r" M\d{3,}H?$"' in open(os.path.join(KB, "_audit_cid_claims.py"), encoding="utf-8").read())

cur, _, honors = ac.fold_rows([
    row("ENGL C1000", "unified_title", "College Composition", "someone@example.org"),
    row("ENGL M1999", "honors_of", "ENGL C1000", HON),
])
check("official: a C-ID or CCN record is untouched by the fold",
      cur["ENGL C1000"] == {"unified_title": "College Composition", "reviewed_by": "someone@example.org",
                            "reviewed_at": "2026-06-12T22:47:01+00:00"} and not honors["held"])
check("official: the derived partner of a CCN base reads both ways",
      ho.partners(ho.honors_map(cur)) == {"ENGL M1999": ["ENGL C1000"], "ENGL C1000": ["ENGL M1999"]})


# 5. Byte-identical with no honors_of row: rebuild rows from the committed overlay; fold with main's code and this.
def rows_from_overlay(doc):
    out = []
    for cid, e in doc["curations"].items():
        fields = [k for k in e if k in ac.FIELDS]
        for f in fields:
            out.append({"course_id": cid, "field": f, "value": e[f], "reviewer_email": e.get("reviewed_by"),
                        "reviewed_at": e.get("reviewed_at"), "validated_at": e.get("validated_at"),
                        "validated_by": e.get("validated_by")})
    return out


committed_text = open(os.path.join(KB, "coci_curation.json"), encoding="utf-8").read()
committed = json.loads(committed_text)
rows = rows_from_overlay(committed)
cur, _, honors = ac.fold_rows(rows)
new_text = ac.serialize(ac.overlay_doc(cur, honors, committed["_synced_at"]))
check("byte-identical: no committed row carries honors_of", not any(r["field"] == "honors_of" for r in rows))
check("byte-identical: today's overlay, rebuilt as rows, folds back to the committed bytes",
      new_text == committed_text)
check("byte-identical: no honors key appears without the field", "_honors" not in new_text)

# 6. The live re-key moves honors_of with merge_into.
check("re-key: honors_of is an id pointer", rk.POINTER_FIELDS == ("merge_into", "honors_of")
      and rk.POINTER_FILTER == "field=in.(merge_into,honors_of)")

# ── COBIx's review of #3313 ─────────────────────────────────────────────────────────────────────────────────────
# Item 1: an honors_of row never restamps the entry a person saved.
cur, _, _ = ac.fold_rows([
    row("ENGL M1261", "unified_title", "Introduction to Shakespeare", "person@example.org", "2026-10-01T00:00:00+00:00"),
    row("ENGL M1261", "honors_of", "ENGL M1260", HON, "2026-11-15T00:00:00+00:00"),
], live={"ENGL M1260", "ENGL M1261"})
check("stamp: a later honors_of row leaves the person's reviewer and time",
      cur["ENGL M1261"]["reviewed_by"] == "person@example.org"
      and cur["ENGL M1261"]["reviewed_at"] == "2026-10-01T00:00:00+00:00"
      and cur["ENGL M1261"]["honors_of"] == "ENGL M1260")
cur, _, _ = ac.fold_rows([row("ENGL M1999", "honors_of", "ENGL M1998", HON)], live={"ENGL M1998"})
check("stamp: an entry holding only honors_of carries no reviewer", "reviewed_by" not in cur["ENGL M1999"])

# Item 2: the base resolves through the alias chain (a dead base only) and, for the worklists, to its merge end.
MAPS = [{"MATH M1036": "MATH M1050"}]   # a re-mint after the field was born
cur, _, honors = ac.fold_rows([
    row("MATH M1036H", "honors_of", "MATH M1036", HON),
    row("MATH M1036H", "merge_into", "MATH M1050"),
], live={"MATH M1050"}, maps=MAPS)
check("re-mint: a base the re-mint moved still holds the pair (the bot merge into the new base is cut)",
      "merge_into" not in cur.get("MATH M1036H", {}) and len(honors["held"]) == 1)
check("re-mint: a live base is never resolved again (no telescoping through an older slot)",
      ho.honors_map({"X M1001H": {"honors_of": "MATH M1036"}}, live={"MATH M1036"}, maps=MAPS)
      == {"X M1001H": "MATH M1036"})
check("re-mint: the maps read are those after the field's baseline (none today)",
      ho.pending_alias_maps() == [] and ho.FIELD_BASELINE.endswith("2026-11-08/alias_map.json"))
merged_base = {"MATH M1036H": {"honors_of": "MATH M1036"}, "MATH M1036": {"merge_into": "MATH M1050"}}
hm_end = ho.honors_map(merged_base, merge_end=True)
check("merged base: the worklists read the base at its merge end",
      hm_end == {"MATH M1036H": ["MATH M1036", "MATH M1050"]})
check("merged base: the pair with the third id is never offered",
      ho.without_honors_pairs(["MATH M1036H", "MATH M1050"], hm_end) == ["MATH M1050"])
src_amw = open(os.path.join(KB, "_auto_merge_worklist.py"), encoding="utf-8").read()
check("merged base: the auto-merge worklist reads the merge end and the live set",
      "merge_end=True" in src_amw and "load_live_ids(SD)" in src_amw)

# Item 3: both paths walked to the meeting point; the first bot edge is cut before a person's merge wins.
kept, held, pw = ho.hold_merges({"H M1001H": "X M1001", "X M1001": "H M1001"}, {"H M1001H": "H M1001"},
                                {"H M1001H": "person@example.org", "X M1001": "automerge-v1@bot"})
check("case C: a person's H->X stands, the bot's X->B is cut, the pair holds",
      kept == {"H M1001H": "X M1001"} and [h["merge_source"] for h in held] == ["X M1001"] and not pw)
cur, _, honors = ac.fold_rows([
    row("H M1001H", "honors_of", "H M1001", HON),
    row("H M1001H", "merge_into", "X M1001", "person@example.org", "2026-10-01T00:00:00+00:00"),
    row("X M1001", "merge_into", "H M1001"),
], live={"H M1001", "X M1001"})
check("case C through the fold: honors_of kept, the bot edge leaves the overlay",
      cur["H M1001H"].get("honors_of") == "H M1001" and "X M1001" not in cur and not honors.get("set_aside"))
kept, held, pw = ho.hold_merges({"H M1001H": "X M1001", "X M1001": "H M1001"}, {"H M1001H": "H M1001"},
                                {"H M1001H": "person@example.org", "X M1001": "someone@example.org"})
check("case C, both people: the merges stand and the honors_of is set aside", kept["X M1001"] == "H M1001" and pw)
kept, held, pw = ho.hold_merges({"H M1001H": "X M1001", "X M1001": "T M1001", "H M1001": "T M1001"},
                                {"H M1001H": "H M1001"}, {"H M1001H": "person@example.org"})
check("meeting at a third id: the first bot edge on either side is cut",
      [h["merge_source"] for h in held] == ["X M1001"] and kept["H M1001"] == "T M1001")

# Item 4: the generator's later in-memory folds ask before each write (Phase B, R4, routing x2). Round 2: the ask
# is a trial over EVERY pair, so a fold of a third id that one side already merged into is refused too.
P = ho.pair_list
pends = P({"MATH M1036H": "MATH M1036"})
mems = [{"id": "MATH M1036H"}, {"id": "MATH M1036"}, {"id": "MATH M1040"}]
kept_rows = ho.phase_b_members(mems, "MATH 110", {}, pends, {"MATH M1036H"})
check("Phase B: a pair sharing the official id's group: the base folds, the Honors id stays its own row",
      [m["id"] for m in kept_rows] == ["MATH M1036", "MATH M1040"])
check("Phase B: an Honors id whose base IS the official id stays out",
      ho.phase_b_members([{"id": "ENGL M1999"}], "ENGL 100", {}, P({"ENGL M1999": "ENGL 100"}), {"ENGL M1999"}) == [])
check("R4: a stand-alone whose partner already ends at the official row does not fold",
      ho.would_join("ENGL M10AAH", "ENGL 100", {"ENGL M10AA": "ENGL 100"}, P({"ENGL M10AAH": "ENGL M10AA"})))
check("routing: a stand-alone whose partner is the descriptor row does not fold",
      ho.would_join("ENGL M10ABH", "ENGL 110", {}, P({"ENGL M10ABH": "ENGL 110"})))
check("routing: an M-ID base whose Honors partner already folded there does not fold",
      ho.would_join("ENGL M1040", "ENGL 110", {"ENGL M1040H": "ENGL 110"}, P({"ENGL M1040H": "ENGL M1040"})))
check("routing: an unrelated id folds as before", not ho.would_join("ENGL M1041", "ENGL 110", {}, pends))
# Round 2's blocker: H merged into a third id X; Phase B's group for MATH 110 holds [B, X], in both orders.
mi = {"MATH M1036H": "MATH M10XX"}
for order in (["MATH M1036", "MATH M10XX"], ["MATH M10XX", "MATH M1036"]):
    kept_ids = [m["id"] for m in ho.phase_b_members([{"id": i} for i in order], "MATH 110", mi, pends,
                                                    {"MATH M1036H"})]
    trial = dict(mi, **{i: "MATH 110" for i in kept_ids})
    check(f"Phase B, H into X, group {order}: the pair stays apart, and the same member is kept",
          not ho.joined_pairs(trial, pends) and kept_ids == ["MATH M1036"])
check("R4/routing: a fold of X, which the Honors id merged into, onto the base's target is refused",
      ho.would_join("MATH M10XX", "MATH 110", {"MATH M1036": "MATH 110", "MATH M1036H": "MATH M10XX"}, pends))
check("base side: M1001 into M10YY, M1001H into ENGL 100: folding M10YY into ENGL 100 is refused",
      ho.would_join("ENGL M10YY", "ENGL 100", {"ENGL M1001": "ENGL M10YY", "ENGL M1001H": "ENGL 100"},
                    P({"ENGL M1001H": "ENGL M1001"})))
check("would_join leaves the map as it found it", mi == {"MATH M1036H": "MATH M10XX"})
try:
    ho.check_apart({"A M1001H": "A M1001"}, P({"A M1001H": "A M1001"}), strict=True)
    strict_failed = False
except SystemExit:
    strict_failed = True
check("check_apart: strict mode fails the run on a joined pair", strict_failed
      and ho.check_apart({"A M1001H": "A M1001"}, P({"A M1001H": "A M1001"})) == [("A M1001H", "A M1001")])

# Property: over random small merge maps and random write sequences, no accepted write ever joins a pair that was
# apart when the sequence began.
import random  # noqa: E402
rng = random.Random(653)
ids = [f"X M10{i:02d}" for i in range(12)]
maps_tried = writes_tried = writes_accepted = writes_refused = joined = 0
for _ in range(400):
    hmap = {}
    for _k in range(rng.randint(1, 3)):
        h, b = rng.sample(ids, 2)
        if h not in hmap and h not in hmap.values() and b not in hmap:
            hmap[h] = b
    pairs = P(hmap)
    m = {}
    for _k in range(rng.randint(0, 5)):   # a random acyclic start, then cut whatever already joins a pair
        s_, t_ = rng.sample(ids, 2)
        if s_ not in m and ho._end(m, t_) != s_:
            m[s_] = t_
    for a_, b_ in pairs:
        while ho._end(m, a_) == ho._end(m, b_):
            m.pop(next(e for e in ho._path(m, a_) + ho._path(m, b_) if e in m))
    maps_tried += 1
    for _k in range(rng.randint(1, 10)):
        s_, t_ = rng.sample(ids + ["OFFL 100", "OFFL 110"], 2)
        if s_ in m or ho._end(m, t_) == s_:
            continue
        writes_tried += 1
        if ho.would_join(s_, t_, m, pairs):
            writes_refused += 1
            continue
        m[s_] = t_
        writes_accepted += 1
        if ho.joined_pairs(m, pairs):
            joined += 1
check(f"property: {maps_tried} random maps, {writes_tried} writes ({writes_accepted} accepted, {writes_refused} "
      "refused): no accepted write ever joins a pair", joined == 0 and writes_refused > 0 and writes_accepted > 0)
print(f"property counts: maps {maps_tried}, writes {writes_tried}, accepted {writes_accepted}, "
      f"refused {writes_refused}, joined {joined}")

gen_src = open(os.path.join(ROOT, "excel_to_" + "dashboard.py"), encoding="utf-8").read()
check("generator: Phase B filters its members through phase_b_members",
      "_honors_of.phase_b_members(mems, oid, merge_into, _hpairs, set(_hmap))" in gen_src)
check("generator: R4 and both routing folds ask would_join before writing",
      gen_src.count("_honors_of.would_join(") == 3)
check("generator: every pair is checked again after the folds, strict under --check or HONORS_OF_STRICT",
      "_honors_of.check_apart(" in gen_src and "HONORS_OF_STRICT" in gen_src and "honors-pair-joined" in gen_src)
check("generator: the overlay map is alias-resolved against the live set",
      "_honors_of.honors_map(curation, live=set(cat) | set(sg))" in gen_src)

# Item 5: the merge candidate queue never proposes a pair.
import _merge_candidate_queue as mq  # noqa: E402
qrows = {"MATH M1036": {"title": "Calculus I", "disc": "Mathematics", "members": 30},
         "MATH M1036H": {"title": "Calculus I", "disc": "Mathematics", "members": 3}}
qg = [g for g in mq.build(None, qrows, {}, {"MATH M1036H": "MATH M1036"}) if g["lane"] == "same_title"]
check("queue: a same-title pair that is an Honors pair is flagged and never proposable",
      len(qg) == 1 and not qg[0]["proposable"] and any("honors_of" in f for f in qg[0]["flags"]))
qg0 = [g for g in mq.build(None, qrows, {}) if g["lane"] == "same_title"]
check("queue: without the field the same group is proposable as before", qg0 and qg0[0]["proposable"])

# Item 6: one pointer re-key for every live overlay re-keyer; the allocator refuses an H id.
import curation_pointers as cp  # noqa: E402
e, n = cp.rekey_entry({"honors_of": "ETHS M1001", "merge_into": "ETHS M1001", "x": 1}, {"ETHS M1001": "ETHN M1001"})
check("pointers: one call moves merge_into and honors_of, counted as one entry moved",
      e == {"honors_of": "ETHN M1001", "merge_into": "ETHN M1001", "x": 1} and n == 1)
src0 = {"merge_into": "A M1001"}
e, n = cp.rekey_entry(src0, {"B M1001": "C M1001"})
check("pointers: nothing named, the same entry back", e is src0 and n == 0)
check("pointers: the live re-key reads the same list", rk.POINTER_FIELDS is cp.POINTER_FIELDS)
import _zband_retire_dryrun as zd  # noqa: E402
_, _, cur2, _ = zd.rekey_state({}, {}, {"ETHS M1001H": {"honors_of": "ETHS M1001"}, "X M1001": {"merge_into": "ETHS M1001"}},
                               {}, {"ETHS M1001": "ETHN M1001"})
check("pointers: a shared overlay re-keyer moves honors_of with merge_into",
      cur2["ETHS M1001H"]["honors_of"] == "ETHN M1001" and cur2["X M1001"]["merge_into"] == "ETHN M1001")
for f in ("_eths_remint.py", "_uc_cur_promote.py", "_zband_retire_dryrun.py", "_prefix_fold_apply.py",
          "_authority_recode_apply.py", "_zband_retire_apply.py", "_overmerge_apply.py", "_subj4_apply.py"):
    check(f"pointers: {f} re-keys through curation_pointers.rekey_entry",
          "curation_pointers.rekey_entry(" in open(os.path.join(KB, f), encoding="utf-8").read())
import _authority_recode_dryrun as rec  # noqa: E402
try:
    rec.Allocator(set(), {}).place("ETHS M1001H", "ETHN")
    refused = False
except ValueError:
    refused = True
check("allocator: place refuses an Honors id (no 'ETHN NoneNoneNone')", refused)
try:
    rec.kept_number("ETHS M1001H", "ETHN")
    refused = False
except ValueError:
    refused = True
check("allocator: kept_number refuses an Honors id", refused)
check("allocator: a numbered id keeps its number as before", rec.kept_number("ETHS M1001", "ETHN") == "ETHN M1001"
      and rec.Allocator(set(), {}).place("ETHS M1001", "ETHN")[0] == "ETHN M1001")
for f in ("_agab_one_remint.py", "_agri_family_remint.py", "_athl_four_remint.py", "_blank_stray_remint.py",
          "_fl_stray_remint.py", "_forestry_wine_remint.py", "_subjects_list_recode.py", "_eths_remint.py"):
    check(f"allocator: {f} takes its kept number through rec.kept_number",
          "rec.kept_number(cid," in open(os.path.join(KB, f), encoding="utf-8").read())

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
