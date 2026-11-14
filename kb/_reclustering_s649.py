#!/usr/bin/env python3
"""Re-clustering S649: the BUSI M1228 split by removing one bot row, and the Honors step laid out. A dry run first.

THE RULINGS. Sam pressed Complete on Open Asks Sheet 195 at 01:18Z 2026-11-14, his own call, no notes
(cpl_memory sam-sheet-195-answers-2026-11-14):
  card 3 "Remove the row": delete (BUSI M10XW, merge_into, BUSI M1228), the row automerge-titlelane-v1@bot saved at
      2026-06-13 17:47Z, so Santa Ana College BUS 115 leaves BUSI M1228 and the split he ruled on Sheet 186 card 6
      is clean (d-busi-split-held-for-delete-s648).
  card 2 "Take every recommendation": Honors reaches M-IDs only (3 new M-IDs, an Honors course its own M-ID with a
      declared equivalence to its base, sam-honors-own-mid-2026-11-13); AJ 160, MUS 130 and REAL M1038 with M1040
      stay as they are; MATH M1036 with M1044 waits for the MAP team to settle the refrigeration lab articulation.

WHAT EACH MODE WRITES.
  --plan          kb/reclustering_s649_out/2026-11-14/plan.json and plan.md from the committed inputs (the S648
                  World: members file, overlay, singletons, memberships, alias chain). No kb file, no generated file,
                  no Supabase row.
  --sql [--check] the BUSI migration pair under kb/migrations/ (deterministic; --check fails when the committed
                  pair differs).
  --overlay PATH  removes the row from a COPY of kb/coci_curation.json the way the nightly sync would (the entry
                  holds no other field, so it goes), to simulate the post-apply export.
  --compare BASE AFTER  reads two simulated export directories and writes post_apply_simulated.json.

The row is deleted through .github/workflows/supabase-migrate.yml: a claude/** push that changes
kb/migrations/.apply. This file never edits kb/migrations/.apply.

Run (from repo root):
  python3 kb/_reclustering_s649.py --plan
  python3 kb/_reclustering_s649.py --sql [--check]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

DATE = "2026-11-14"
OUT = os.path.join(HERE, "reclustering_s649_out", DATE)
MIGRATION = "kb/migrations/2026-11-14_s649_busi_split_delete.sql"
ROLLBACK = "kb/migrations/2026-11-14_s649_busi_split_delete_rollback.sql"
COHORT = "reclustering-s649@bot"   # named for any later insert; this apply inserts nothing

RULINGS = {
    "sheet195": {"memory": "sam-sheet-195-answers-2026-11-14", "where": "Open Asks Sheet 195, Complete pressed",
                 "at": "2026-11-14T01:18Z",
                 "card3": "Remove the row", "card2": "Take every recommendation"},
    "sheet186": {"memory": "sam-sheet-186-six-cases-as-recommended-2026-11-13", "where": "Open Asks Sheet 186 card 6",
                 "at": "2026-11-13T13:16Z", "said": "All six as recommended"},
    "honors": {"memory": "sam-honors-own-mid-2026-11-13", "where": "Open Asks Sheet 191 card 1, reply 'two'",
               "at": "2026-11-13T14:08Z"},
}

# The one row Sam's card 3 removes, as the S648 plan and the committed overlay read it and the S649 conductor read
# it live at 01:22Z 2026-11-14. The guard matches every one of these, and a person's validation refuses.
ROW = {"course_id": "BUSI M10XW", "field": "merge_into", "value": "BUSI M1228",
       "reviewer_email": "automerge-titlelane-v1@bot", "reviewed_at": "2026-06-13T17:47:56.243497+00:00",
       "validated_at": None, "validated_by": None}
SURVIVOR, LEAF = "BUSI M1228", "BUSI M10XW"
MOVER = {"college": "Santa Ana College", "code": "BUS 115", "control_number": "CCC000609492"}
# Fields where a person's row naming either id would mean a person decided the merge (or against it) since.
GUARD_FIELDS = ("merge_into", "unified_title_merge_confirm", "merge_dismissed")

HONORS_IDS = ("HUMA M1110", "IDST M1120", "LIBR M1040")


def q(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"


# ── the migration pair ──────────────────────────────────────────────────────────────────────────────────────────────

def sql_text():
    r = ROW
    ids = f"{q(LEAF)}, {q(SURVIVOR)}"
    fields = ", ".join(q(f) for f in GUARD_FIELDS)
    mig = f"""-- Re-clustering S649: remove one row the title-matching bot saved, so the BUSI M1228 split is clean.
-- Sam, Open Asks Sheet 195 card 3, 01:18Z 2026-11-14: "Remove the row" (sam-sheet-195-answers-2026-11-14), carrying
-- out his Sheet 186 card 6 split of BUSI M1228 (d-busi-split-held-for-delete-s648). Plan:
-- kb/reclustering_s649_out/{DATE}/plan.md. Written by kb/_reclustering_s649.py --sql.
-- The row: ({r['course_id']}, {r['field']}, {r['value']}), {r['reviewer_email']}, {r['reviewed_at']}.
-- With it gone, Santa Ana College BUS 115 (CCC000609492) returns to its own record {LEAF}; nothing is inserted.
-- One plain statement: the delete runs only when the guard holds, and a failed guard raises, so nothing is written.
-- The guard: exactly one row at ({r['course_id']}, {r['field']}), with this value, reviewer and reviewed_at, never
-- validated by a person; and no row by a reviewer outside @bot, in {', '.join(GUARD_FIELDS)}, whose course_id or
-- value names {LEAF} or {SURVIVOR}. RETURNING puts the whole deleted row (to_jsonb) into the runner's receipt
-- (kb/receipts/migration_s649_busi_split_delete_<run>.json, its `response`), so a session that did not do the write
-- can put it back. Rollback: {ROLLBACK}.

with target as (
  select k.* from public.kb_curation k
  where k.course_id = {q(r['course_id'])} and k.field = {q(r['field'])}
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and p.field in ({fields})
    and (p.course_id in ({ids}) or p.value like {q('%' + LEAF + '%')} or p.value like {q('%' + SURVIVOR + '%')})
),
guard as (
  select (select count(*) from target) = 1
     and (select count(*) from target t
          where t.value = {q(r['value'])}
            and t.reviewer_email = {q(r['reviewer_email'])}
            and t.reviewed_at::timestamptz = {q(r['reviewed_at'])}::timestamptz
            and t.validated_at is null) = 1
     and (select n from person) = 0 as ok,
     (select count(*) from target) as target_rows,
     (select n from person) as person_rows
),
gone as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.course_id = {q(r['course_id'])} and k.field = {q(r['field'])}
  returning to_jsonb(k) as image
)
select case when g.ok and (select count(*) from gone) = 1
            then (select jsonb_agg(image) from gone)
            else ('refused by the guard: target rows ' || g.target_rows || ', person rows ' || g.person_rows
                  || ', or the row differs from the plan')::int::text::jsonb
       end as deleted
from guard g;

-- Read back: expect 0.
--   select count(*) from public.kb_curation where course_id = {q(r['course_id'])} and field = {q(r['field'])};
"""
    rb = f"""-- Rollback for {os.path.basename(MIGRATION)}: puts back exactly the row it deleted, its reviewer and reviewed_at
-- unchanged. The receipt of the forward run (kb/receipts/migration_s649_busi_split_delete_<run>.json, `response`)
-- holds the whole row as read; if it shows a column this list does not name, add it before running this.
-- Skipped (nothing written) when the slot is taken again, by a person or a procedure: their row wins.
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
values ({q(r['course_id'])}, {q(r['field'])}, {q(r['value'])}, {q(r['reviewer_email'])},
        {q(r['reviewed_at'])}, {q(r['validated_at'])}, {q(r['validated_by'])})
on conflict (course_id, field) do nothing
returning course_id, field, value, reviewer_email, reviewed_at;
-- Read back: expect one row, ({r['course_id']}, {r['field']}, {r['value']}, {r['reviewer_email']}).
--   select course_id, field, value, reviewer_email, reviewed_at from public.kb_curation where course_id = {q(r['course_id'])} and field = {q(r['field'])};
"""
    return mig, rb


def do_sql(check=False):
    mig, rb = sql_text()
    stale = []
    for rel, text in ((MIGRATION, mig), (ROLLBACK, rb)):
        p = os.path.join(ROOT, rel)
        if check:
            cur = open(p, encoding="utf-8").read() if os.path.exists(p) else None
            if cur != text:
                stale.append(rel)
        else:
            with open(p, "w", encoding="utf-8") as f:
                f.write(text)
            print("wrote " + rel)
    if check:
        if stale:
            raise SystemExit("STALE: " + ", ".join(stale) + " (run --sql)")
        print("migration pair current")


# ── the simulation ──────────────────────────────────────────────────────────────────────────────────────────────────

def do_overlay(path):
    """kb/_apply_curation.py rebuilds each entry from the rows it reads; BUSI M10XW's one row is the merge, so after
    the delete it has no entry at all."""
    if os.path.realpath(path) == os.path.realpath(os.path.join(HERE, "coci_curation.json")):
        raise SystemExit("--overlay writes a copy, never the committed overlay")
    doc = json.load(open(path, encoding="utf-8"))
    cur = doc["curations"]
    e = cur.get(LEAF) or {}
    if e.get(ROW["field"]) != ROW["value"] or e.get("reviewed_by") != ROW["reviewer_email"]:
        raise SystemExit(f"ABORT: the copy's {LEAF} entry is not the plan's row: {e}")
    rest = {k: v for k, v in e.items() if k not in (ROW["field"], "reviewed_by", "reviewed_at")}
    if rest:
        raise SystemExit(f"ABORT: {LEAF} carries other fields {sorted(rest)}; this simulation assumes it does not")
    del cur[LEAF]
    doc["count"] = len(cur)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print(f"overlay {path}: {LEAF} removed")


def _js_payload(path):
    """The JSON a `window.X = ...;` file assigns (the leading comment may hold an `=`)."""
    s = open(path, encoding="utf-8").read()
    i = s.index("=", s.index("window.")) + 1
    while s[i].isspace():
        i += 1
    return json.JSONDecoder().raw_decode(s, i)[0]


def _by_id(name, d):
    """{id: entry} for the two files read: the index is a list of [id, title, subjects, kind, units]; the members
    file is {generated_at, colleges, ... id: [member rows]} with each member's college as an index into colleges."""
    if name == "unified_courses_index.js":
        return {r[0]: r for r in d}
    cols = d.get("colleges") or []
    out = {}
    for k, v in (d.get("members") or {}).items():
        if isinstance(v, list):
            out[k] = sorted([cols[m["c"]] if isinstance(m.get("c"), int) and m["c"] < len(cols) else m.get("c"),
                             m.get("n"), m.get("t"), m.get("u"), m.get("cn")] for m in v)
    return out


def do_compare(base, after):
    res = {"what": "simulated, not applied: export_unified_courses() run through its UC_KB_DIR / UC_OUT_DIR seam on "
                   "kb/ with the BUSI row removed from a copy of the overlay (kb/_reclustering_s649.py --overlay), "
                   "beside the same run on the untouched kb/ in the same session",
           "ids": {}}
    for name in ("unified_courses_index.js", "unified_courses_members.js"):
        mb = _by_id(name, _js_payload(os.path.join(base, name)))
        ma = _by_id(name, _js_payload(os.path.join(after, name)))
        changed = sorted(k for k in set(mb) | set(ma) if mb.get(k) != ma.get(k))
        res[name] = {"ids_before": len(mb), "ids_after": len(ma), "changed_ids": changed}
        for i in (SURVIVOR, LEAF):
            b, a = mb.get(i), ma.get(i)
            if name == "unified_courses_members.js":
                b = {"members": len(b or []), "units": sorted({x[3] for x in b or [] if x[3] is not None})}
                a = {"members": len(a or []), "units": sorted({x[3] for x in a or [] if x[3] is not None}),
                     "rows": ma.get(i) if len(ma.get(i) or []) <= 3 else None}
            res["ids"].setdefault(i, {})[name] = {"before": b, "after": a}
        if name == "unified_courses_members.js":
            res[name]["member_rows_before"] = sum(len(v) for v in mb.values())
            res[name]["member_rows_after"] = sum(len(v) for v in ma.values())
    path = os.path.join(OUT, "post_apply_simulated.json")
    os.makedirs(OUT, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("wrote " + os.path.relpath(path, ROOT))


# ── the plan ────────────────────────────────────────────────────────────────────────────────────────────────────────

def build():
    import _reclustering_s648_dryrun as d48
    w = d48.World()
    named = (SURVIVOR, LEAF) + HONORS_IDS
    resolved = {i: w.resolve(i) for i in named}
    for i, r in resolved.items():
        if r != i:
            raise SystemExit(f"ABORT: {i} resolves to {r} through kb/alias_chain.py; the plan names ids in the live era")
    # BUSI: the row as the committed overlay mirrors it, and what points where
    e = w.cur.get(LEAF) or {}
    if (e.get("merge_into"), e.get("reviewed_by"), e.get("reviewed_at")) != (ROW["value"], ROW["reviewer_email"],
                                                                              ROW["reviewed_at"]):
        raise SystemExit(f"ABORT: the overlay's {LEAF} entry is not the plan's row: {e}")
    prov = w.provenance(SURVIVOR, MOVER["college"], MOVER["code"])
    if prov.get("control_number") != MOVER["control_number"] or prov.get("sits_by") != "leaf_merge_into":
        raise SystemExit(f"ABORT: BUS 115 does not sit by the bot's row: {prov}")
    naming = {k: v for k, v in w.cur.items()
              if k in (LEAF, SURVIVOR) or any(x in json.dumps(v) for x in (LEAF, SURVIVOR))}
    persons = {k: v for k, v in naming.items() if not str(v.get("reviewed_by") or "").endswith("@bot")}
    survivor_members = [{"college": r.get("college"), "code": r.get("code"), "title": r.get("title"),
                         "units": r.get("units")} for r in (w.members.get(SURVIVOR) or [])]
    leaf_rec = {k: (w.sg.get(LEAF) or {}).get(k) for k in ("common_title", "college", "control_number",
                                                           "typical_units", "discipline", "subject", "course_number")}
    busi = {
        "row_before": ROW, "row_after": None,
        "mover": dict(MOVER, **{k: prov.get(k) for k in ("title", "units", "coci_cid", "coci_ccn", "asccc_approvals",
                                                       "claim_hold", "leaf_ids", "cn_rehome", "sits_by")}),
        "leaf_record": leaf_rec,
        "leaf_in_singletons": LEAF in w.sg, "leaf_in_memberships": LEAF in w.memships,
        "pointers_into_leaf": sorted(k for k, v in w.merge_into.items() if v == LEAF),
        "cn_rows_into_either": sorted(k for k, v in w.cur.items() if k.startswith("CN:")
                                      and v.get("merge_into") in (LEAF, SURVIVOR)),
        "overlay_rows_naming_either": naming,
        "overlay_rows_naming_either_by_a_person": persons,
        "survivor_members_before": survivor_members,
        "inserts": [],
        "why_no_insert": (f"BUS 115's own leaf is {LEAF}, a stand-alone record in kb/coci_minted_singletons.json "
                          f"(control {MOVER['control_number']}); with the bot's row gone nothing folds it anywhere, "
                          "nothing points into it and no CN: row re-homes the course, so the export emits it as its "
                          "own row. The delete alone carries out the split; an insert would mint a second record "
                          "beside a live one (the S648 plan's route B residue)."),
    }
    if busi["pointers_into_leaf"] or busi["cn_rows_into_either"] or persons:
        raise SystemExit(f"ABORT: something else names the BUSI ids: {busi['pointers_into_leaf']} "
                         f"{busi['cn_rows_into_either']} {sorted(persons)}")
    honors = honors_layout(w, d48)
    sim_path = os.path.join(OUT, "post_apply_simulated.json")
    sim = json.load(open(sim_path, encoding="utf-8")) if os.path.exists(sim_path) else None
    return {
        "_about": "Re-clustering S649 dry-run plan: the BUSI row delete (ready for the conductor's apply) and the "
                  "Honors step (laid out, stopped for the conductor). Written by kb/_reclustering_s649.py --plan.",
        "date": DATE, "rulings": RULINGS,
        "alias_chain": {"newest_applied_map": w.newest_map, "pending_maps": w.pending_maps, "resolved": resolved},
        "inputs": {"members_file_generated": w.members_at, "overlay_synced": w.cur_synced},
        "busi": busi, "honors": honors, "simulated": sim,
        "migration": {"forward": MIGRATION, "rollback": ROLLBACK,
                      "apply_line": f"file={MIGRATION}\nname=s649_busi_split_delete"},
        "selects": selects(),
        "held_no_write": {
            "AJ 160": "kept as is (Sheet 195 card 2)", "MUS 130": "kept as is (Sheet 195 card 2)",
            "REAL M1038 with REAL M1040": "kept apart (Sheet 195 card 2)",
            "MATH M1036 with MATH M1044": "waits until the MAP team settles the refrigeration lab articulation "
                                          "(exhibit MAPCBES-CBES-1-001); a lane NEXT line names who is asked"},
    }


def honors_layout(w, d48):
    rows = json.load(open(os.path.join(HERE, "reclustering_s648_out", "2026-11-13", "honors_worklist.json"),
                          encoding="utf-8"))["rows"]
    out = []
    for i in HONORS_IDS:
        mine = [r for r in rows if r["identity"] == i and r["base_identity"] == i
                and r["fate"].startswith("shares its base's identity")]
        courses = []
        for r in mine:
            p = w.provenance(i, r["college"], r["code"])
            b = w.provenance(i, r["college"], r["base_code"])
            leaf = (p.get("leaf_ids") or [None])[0]
            courses.append({"college": r["college"], "code": r["code"], "title": r["title"], "units": r["units"],
                            "control_number": p.get("control_number"), "sits_by": p.get("sits_by"),
                            "own_leaf": leaf, "own_leaf_is_standalone": leaf in w.sg,
                            "own_leaf_row": w.cur.get(leaf) if leaf and leaf != i else None,
                            "base": {"code": r["base_code"], "title": r["base_title"],
                                     "control_number": b.get("control_number"), "sits_by": b.get("sits_by"),
                                     "own_leaf": (b.get("leaf_ids") or [None])[0]}})
        all_by_leaf = all(c["sits_by"] == "leaf_merge_into" and c["own_leaf_is_standalone"] for c in courses)
        route = ("own record exists: each Honors course is a stand-alone record the June auto-merge folded in; "
                 "deleting that bot row returns it to its own id, no mint (the BUSI shape, which needs Sam's word "
                 "for a delete)" if all_by_leaf else
                 "true mint: the Honors courses are members of the identity's own cluster, so a new id and a "
                 "CN:<control number> merge_into row per course are the only route")
        out.append({"identity": i, "identity_title": (w.index.get(i) or {}).get("title"),
                    "identity_curation": w.cur.get(i), "discipline": w.discipline(i),
                    "members": len(w.members.get(i) or []), "honors_courses": courses, "route": route})
    return {
        "reach": "M-IDs only (Sheet 195 card 2, the recommendation)",
        "identities": out,
        "stopped": True,
        "why_stopped": [
            "Numbering: a new Honors M-ID takes its base's number plus H (breaks the four-character shape) or the "
            "next free number in its bucket; the S648 sheet asked it (plan.md, Honors question 6) and card 2's "
            "five answers do not settle it.",
            "Two of the three already have their own record (HUMA M10ME, LIBR M10CJ), folded in by "
            "automerge-v1@bot on 2026-06-12: the clean route is a delete of a bot row, like card 3, and card 2 "
            "authorizes no delete.",
            "The equivalence row (field honors_of) is a field kb/_apply_curation.py does not fold (FIELDS) and the "
            "export does not read: a code change and its tests land before any row, or the row is inert.",
            "Equivalence direction (one-way or both ways) is unanswered (plan.md, Honors question 2).",
            "Option (a) on the S648 sheet read 'the equivalence for every pair': 508 pairs already apart would "
            "take an honors_of row each; the conductor's brief names the 3 new M-IDs only.",
            "Two base identities carry the Honors title as their curated title (HUMA M1110 'World Religions "
            "(Honors)', trailcrew-ccr3-s112@bot; LIBR M1040 'Media & Information Literacy (Honors)', "
            "automerge-v1@bot): once the Honors course leaves, the base keeps an Honors title unless that bot "
            "row is changed, which is an UPDATE or DELETE of a saved row.",
            "IDST M1120's two Glendale Honors courses have different bases (BIOL 298 and ENGL 298); the rule makes "
            "one Honors M-ID of both (units 1 to 4).",
        ],
        "atomic_steps_if_approved": [
            "1. A code PR: kb/_apply_curation.py FIELDS learns honors_of; export_unified_courses() shows the "
            "equivalence on both rows; supabase-rekey.yml and kb/alias_chain.py re-key its value; tests guard each.",
            "2. A dry run under docs/coursecontrolnumber_remint.md: the new id for IDST (and, if the delete route is "
            "refused, for HUMA and LIBR) from the bucket's counter, never hand-picked; an alias map is not needed "
            "(no id is renamed) but kb/promotions.json is read so no promotion names the moved control numbers.",
            "3. One migration, one plain statement on a guard CTE, cohort reclustering-s649@bot, INSERT-only: per "
            "moved course a CN:<control number> merge_into <new id> row (IDST), the new id's unified_title and "
            "discipline rows, and one honors_of row per new id; or, on Sam's word, the two automerge-v1@bot deletes "
            "(HUMA M10ME, LIBR M10CJ) with their rows in the receipt.",
            "4. The fresh read, the .apply push, the read-back, the merge, one daily-dashboard dispatch, all in one "
            "cron window (06:17, 09:17, 12:17 UTC clear).",
        ],
    }


def selects():
    ids = f"'{LEAF}', '{SURVIVOR}'"
    return [
        {"n": 1, "expect": [[ROW["course_id"], ROW["field"], ROW["value"], ROW["reviewer_email"],
                            "2026-06-13 17:47:56.243497+00", None, None]],
         "if_different": "the row changed since the conductor's 01:22Z read: hold; the guard would refuse anyway",
         "sql": "select course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by from "
                f"public.kb_curation where course_id = '{LEAF}' and field = 'merge_into';"},
        {"n": 2, "expect": 0,
         "if_different": "a person saved a merge, a confirm or a Keep as-is naming either id: read it; the guard "
                         "refuses",
         "sql": "select count(*) from public.kb_curation where reviewer_email not like '%@bot' and field in "
                "('merge_into', 'unified_title_merge_confirm', 'merge_dismissed') and (course_id in "
                f"({ids}) or value like '%{LEAF}%' or value like '%{SURVIVOR}%');"},
        {"n": 3, "expect": [["merge_into", 9], ["unified_title", 1]],
         "if_different": "the bot's ten rows on BUSI M1228 changed (9 pointers including this one, 1 title): "
                         "read them before applying",
         "sql": "select field, count(*) from public.kb_curation where (field = 'merge_into' and value = "
                f"'{SURVIVOR}') or course_id = '{SURVIVOR}' group by 1 order by 1;"},
        {"n": 4, "expect": 0,
         "if_different": "something points into BUSI M10XW or re-homes BUS 115: it would follow the course; read it",
         "sql": f"select count(*) from public.kb_curation where (field = 'merge_into' and value = '{LEAF}') or "
                "course_id = 'CN:CCC000609492';"},
        {"n": 5, "expect": "course_id, field, value, reviewer_email, reviewed_at (default now()), reviewer_label "
                           "(generated from reviewer_email, never inserted), validated_at, validated_by; the "
                           "committed migrations name no other",
         "if_different": "a column the rollback does not name: the tool adds it to the rollback before the apply",
         "sql": "select column_name, data_type, column_default from information_schema.columns where "
                "table_schema = 'public' and table_name = 'kb_curation' order by ordinal_position;"},
        {"n": "post", "expect": 0, "if_different": "the delete did not land; read the receipt's response",
         "sql": f"select count(*) from public.kb_curation where course_id = '{LEAF}' and field = 'merge_into';"},
    ]


def write_md(plan, path):
    b, h, s = plan["busi"], plan["honors"], plan.get("simulated")
    L = [f"# Re-clustering S649: the BUSI row delete and the Honors step, dry-run plan ({DATE})", "",
         "Written by `kb/_reclustering_s649.py --plan`. Nothing was applied. Every id is in `plan.json` beside "
         "this file.", "",
         "Rulings: Open Asks Sheet 195, Complete pressed at 01:18Z 2026-11-14, Sam's own call, no notes "
         "(`sam-sheet-195-answers-2026-11-14`): card 3 *Remove the row*; card 2 *Take every recommendation*. "
         "They carry out Sheet 186 card 6 (`sam-sheet-186-six-cases-as-recommended-2026-11-13`) and Sheet 191 "
         "card 1 (`sam-honors-own-mid-2026-11-13`).", "",
         f"Alias chain: newest applied map `{plan['alias_chain']['newest_applied_map']}`, "
         f"{len(plan['alias_chain']['pending_maps'])} maps pending; every named id resolves to itself. Members file "
         f"generated {plan['inputs']['members_file_generated']}; overlay synced {plan['inputs']['overlay_synced']}.",
         "", "## A. The BUSI M1228 split: one guarded DELETE, no insert", "",
         "| | course_id | field | value | reviewer_email | reviewed_at |", "|---|---|---|---|---|---|",
         f"| before | {ROW['course_id']} | {ROW['field']} | {ROW['value']} | {ROW['reviewer_email']} | "
         f"{ROW['reviewed_at']} |", "| after | (no row) | | | | |", "",
         f"The course: {MOVER['college']} {MOVER['code']} *{b['mover'].get('title')}* (control "
         f"{MOVER['control_number']}, {b['mover'].get('units')} units, no COCI C-ID or CCN, no ASCCC approval), "
         f"sitting under {SURVIVOR} by the bot's row alone (`{b['mover'].get('sits_by')}`). Its own record "
         f"{LEAF} is a stand-alone in `kb/coci_minted_singletons.json` (*{b['leaf_record'].get('common_title')}*, "
         f"{b['leaf_record'].get('discipline')}).", "",
         f"Inserted under `{COHORT}`: nothing. {b['why_no_insert']}", "",
         "The overlay rows naming either id are all the bot's: nine `merge_into` pointers into BUSI M1228 (this "
         "one among them) and BUSI M1228's `unified_title` *International Documentation and Supply Chain "
         "Management*, all saved 2026-06-13 17:47Z. The other eight pointers and the title stay; the title is "
         "Santa Ana BUS 114's, which stays.", "",
         "**The guard** (one statement, `" + MIGRATION + "`): exactly one row at (BUSI M10XW, merge_into) with this "
         "value, reviewer and reviewed_at and no person's validation; and no row by a reviewer outside `@bot` in "
         "merge_into, unified_title_merge_confirm or merge_dismissed naming BUSI M10XW or BUSI M1228. A failed "
         "guard raises, so the statement writes nothing. The deleted row comes back whole (`to_jsonb`) in the "
         "receipt's `response`.", "",
         "**The rollback** (`" + ROLLBACK + "`): re-inserts the row with its reviewer and reviewed_at, "
         "`on conflict do nothing` so a row saved in the slot since wins.", "",
         "**What the next daily run does:**", ""]
    if s and s.get("ids"):
        L.append("From `post_apply_simulated.json`, " + s["what"] + ".")
        L.append("")
        for i, v in s["ids"].items():
            m, x = v["unified_courses_members.js"], v["unified_courses_index.js"]
            L.append(f"- `{i}`: members {m['before']['members']} to {m['after']['members']}, units "
                     f"{m['before']['units']} to {m['after']['units']}; index row {json.dumps(x['before'])} to "
                     f"{json.dumps(x['after'])}.")
        for name in ("unified_courses_index.js", "unified_courses_members.js"):
            r = s[name]
            L.append(f"- `{name}`: ids {r['ids_before']:,} to {r['ids_after']:,}; ids whose entry changed: "
                     f"{', '.join(r['changed_ids'])}"
                     + (f"; member rows {r['member_rows_before']:,} to {r['member_rows_after']:,}"
                        if "member_rows_before" in r else "") + ".")
        L.append("- Committed files the nightly changes: `kb/coci_curation.json` (BUSI M10XW's entry goes), then "
                 "the `unified_courses_*.js` export. Not rebuilt nightly, so they keep BUS 115 under BUSI M1228 "
                 "until their own builders run: `coci_lookup_data.js` (`kb/_build_coci_lookup.py`).")
    else:
        L.append("- (not simulated yet: run the export simulation and `--compare`)")
    L += ["", "**Pre-apply reads (aggregates or exact keys; the conductor runs them):**", ""]
    for x in plan["selects"]:
        L += [f"{x['n']}. Expect `{json.dumps(x['expect'])}`. If different: {x['if_different']}.", "",
              "```sql", x["sql"], "```", ""]
    L += ["**`.apply` (the conductor's word only):**", "", "```", plan["migration"]["apply_line"], "```", "",
          "Undo: `file=" + ROLLBACK + "`, `name=s649_busi_split_delete_rollback`.", "",
          "## B. Card 2's held cases: no write", ""]
    L += [f"- {k}: {v}." for k, v in plan["held_no_write"].items()]
    L += ["", "## C. Honors, M-IDs only: laid out and stopped for the conductor", "",
          f"Reach: {h['reach']}. The three identities and their four Honors courses:", ""]
    for x in h["identities"]:
        L.append(f"- `{x['identity']}` *{x['identity_title']}* ({x['discipline']}, {x['members']} members). "
                 f"Route: {x['route']}.")
        for c in x["honors_courses"]:
            leafrow = c.get("own_leaf_row") or {}
            L.append(f"  - {c['college']} {c['code']} *{c['title']}* ({c['units']} units, control "
                     f"{c['control_number']}): sits by `{c['sits_by']}`, own record `{c['own_leaf']}`"
                     + (f" folded in by {leafrow.get('reviewed_by')} at {leafrow.get('reviewed_at')}"
                        if leafrow else "")
                     + f"; base {c['base']['code']} *{c['base']['title']}* (control {c['base']['control_number']}).")
    L += ["", "Why it stops here:", ""] + [f"- {y}" for y in h["why_stopped"]]
    L += ["", "The atomic steps once those are settled:", ""] + [f"{y}" for y in h["atomic_steps_if_approved"]]
    L += ["", "## Apply sequence for A", "",
          "(i) The conductor runs reads 1 to 5 against their expectations, in a window clear of 06:17, 09:17 and "
          "12:17 UTC. (ii) Within minutes, on this branch, `kb/migrations/.apply` takes the two lines above, one "
          "commit, one push; `supabase-migrate.yml` applies on that claude/** push. (iii) The runner commits "
          "`kb/receipts/migration_s649_busi_split_delete_<run>.json`; its `response` holds the deleted row. "
          "(iv) The post-apply read. (v) The PR merges on a green `test`. (vi) One `daily-dashboard.yml` dispatch "
          "(or the next cron): `kb/_apply_curation.py` drops BUSI M10XW's entry from `kb/coci_curation.json` and "
          "the export rebuilds; read the members file against `post_apply_simulated.json`.", ""]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))


def do_plan():
    plan = build()
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1, ensure_ascii=False)
        f.write("\n")
    write_md(plan, os.path.join(OUT, "plan.md"))
    print("wrote " + os.path.relpath(OUT, ROOT) + "/plan.json and plan.md")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--plan", action="store_true")
    g.add_argument("--sql", action="store_true")
    g.add_argument("--overlay", metavar="PATH")
    g.add_argument("--compare", nargs=2, metavar=("BASE", "AFTER"))
    ap.add_argument("--check", action="store_true", help="with --sql: fail when the committed pair differs")
    a = ap.parse_args()
    if a.plan:
        do_plan()
    elif a.sql:
        do_sql(check=a.check)
    elif a.overlay:
        do_overlay(a.overlay)
    else:
        do_compare(*a.compare)
    return 0


if __name__ == "__main__":
    sys.exit(main())
