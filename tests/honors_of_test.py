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
      "from honors_of import honors_map, without_honors_pairs" in src_amw and "without_honors_pairs([m[\"id\"]" in src_amw)

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

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("PASS " if ok else "FAIL ") + n)
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
