#!/usr/bin/env python3
"""Honors S652: delete two bot rows so two Honors courses stand apart from their bases. A dry run first.

THE RULING. Sam, Open Asks Sheet 197 card 2 ("Delete two bot rows so two Honors courses stand apart"), his own call,
14:35Z 2026-11-14: "delete" (the button *Delete both rows*). It carries out his Sheet 191 card 1 ruling
(cpl_memory sam-honors-own-mid-2026-11-13): an Honors course gets its own M-ID, with a declared equivalence to its base.
MiraCosta College's RELG 101H and LIBR 201H already have their own records, HUMA M10ME and LIBR M10CJ, which the June
auto-merge (automerge-v1@bot, 2026-06-12, the cohort Sam approved that night) folded into HUMA M1110 and LIBR M1040.
Deleting those two merge_into rows returns each course to its own record; nothing is inserted. The S649 plan laid the
route out (kb/reclustering_s649_out/2026-11-14/plan.md, section C) and the S649 BUSI delete is the pattern
(kb/_reclustering_s649.py, run 43542044321). Sheet 197 card 3 (numbering, equivalence, the honors_of field) is a
separate build and writes nothing here.

WHAT EACH MODE WRITES.
  --sql [--check]   the migration pair under kb/migrations/ (deterministic; --check fails when the committed pair
                    differs from what this tool writes).
  --plan --tmp DIR  kb/honors_delete_s652_out/2026-11-14/plan.json and plan.md: the two rows as the committed overlay
                    mirrors them, the alias chain, the identities-map check, the conductor's reads, and the simulated
                    post-apply export: export_unified_courses() run twice through its UC_KB_DIR / UC_OUT_DIR seam,
                    once on kb/ and once on a symlink copy of kb/ whose coci_curation.json lacks the two entries (the
                    way kb/_apply_curation.py writes the overlay after the delete). DIR holds the scratch runs.
  No mode writes a kb/ data file, a generated file, kb/migrations/.apply or a Supabase row.

The rows are deleted through .github/workflows/supabase-migrate.yml: a claude/** push that changes
kb/migrations/.apply, which is the conductor's step after review.

Run (from repo root):
  python3 kb/_honors_two_row_delete_s652.py --sql [--check]
  python3 kb/_honors_two_row_delete_s652.py --plan --tmp <scratch dir>
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

DATE = "2026-11-14"
OUT = os.path.join(HERE, "honors_delete_s652_out", DATE)
NAME = "s652_honors_two_row_delete"
MIGRATION = f"kb/migrations/{DATE}_{NAME}.sql"
ROLLBACK = f"kb/migrations/{DATE}_{NAME}_rollback.sql"

RULING = {"where": "Open Asks Sheet 197 card 2", "title": "Delete two bot rows so two Honors courses stand apart",
          "said": "delete", "button": "Delete both rows", "at": "2026-11-14T14:35Z", "by": "his own call",
          "background": "sam-honors-own-mid-2026-11-13 (Sheet 191 card 1)"}

BOT = "automerge-v1" + "@bot"
STAMP = "2026-06-12T22:47:01.69179+00:00"
# The two rows Sam's card 2 deletes, as the committed overlay mirrors them (synced 13:44Z 2026-11-14) and the S649 plan
# read them. The guard matches every column; validated_at and validated_by are null, as the rollback re-inserts them.
ROWS = [
    {"course_id": "HUMA M10ME", "field": "merge_into", "value": "HUMA M1110", "reviewer_email": BOT,
     "reviewed_at": STAMP, "validated_at": None, "validated_by": None},
    {"course_id": "LIBR M10CJ", "field": "merge_into", "value": "LIBR M1040", "reviewer_email": BOT,
     "reviewed_at": STAMP, "validated_at": None, "validated_by": None},
]
LEAVES = [r["course_id"] for r in ROWS]
BASES = [r["value"] for r in ROWS]
IDS = LEAVES + BASES
# MiraCosta College's two Honors courses and their bases (control numbers, the S649 plan's section C).
COURSES = {
    "HUMA M10ME": {"college": "MiraCosta College", "code": "RELG 101H", "title": "World Religions (Honors)",
                   "control_number": "CCC000588084",
                   "base": {"code": "RELG 101", "control_number": "CCC000545257", "own_leaf": "PHIL M1116"}},
    "LIBR M10CJ": {"college": "MiraCosta College", "code": "LIBR 201H", "title": "Media & Information Literacy (Honors)",
                   "control_number": "CCC000572223",
                   "base": {"code": "LIBR 201", "control_number": "CCC000354460", "own_leaf": "LIBR M10CS"}},
}
HONORS_CNS = [COURSES[i]["control_number"] for i in LEAVES]
# Fields where a person's row naming one of the four ids means a person decided the merge (or against it).
MERGE_FIELDS = ("merge_into", "unified_title_merge_confirm", "merge_dismissed")
# Person-saved rows the guard allows: rows on the four ids, or merge-field rows naming one of them, saved by a reviewer
# outside @bot. The conductor's read (b) sets this; a person's row saved after that read refuses the delete.
EXPECTED_PERSON_ROWS = 0


def q(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"


def _in(xs):
    return ", ".join(q(x) for x in xs)


# ── the migration pair ──────────────────────────────────────────────────────────────────────────────────────────────

def sql_text():
    keys = " or ".join(f"(k.course_id = {q(r['course_id'])} and k.field = {q(r['field'])})" for r in ROWS)
    exact = "\n         or ".join(
        f"(t.course_id = {q(r['course_id'])} and t.value = {q(r['value'])})" for r in ROWS)
    likes = " or ".join(f"p.value like {q('%' + i + '%')}" for i in IDS)
    cns = _in("CN:" + c for c in HONORS_CNS)
    rows_txt = "\n".join(f"--   ({r['course_id']}, {r['field']}, {r['value']}), {r['reviewer_email']}, {r['reviewed_at']}"
                         for r in ROWS)
    mig = f"""-- Honors S652: delete two rows the June auto-merge saved, so two Honors courses stand apart from their bases.
-- Sam, Open Asks Sheet 197 card 2, 14:35Z 2026-11-14, his own call: "delete" (Delete both rows). It carries out his
-- Sheet 191 card 1 ruling (sam-honors-own-mid-2026-11-13): an Honors course gets its own M-ID. Plan:
-- kb/honors_delete_s652_out/{DATE}/plan.md. Written by kb/_honors_two_row_delete_s652.py --sql.
-- The rows:
{rows_txt}
-- With them gone, MiraCosta College RELG 101H (CCC000588084) returns to its own record HUMA M10ME and LIBR 201H
-- (CCC000572223) to LIBR M10CJ; nothing is inserted.
-- One plain statement: the delete runs only when the guard holds, and a failed guard raises, so nothing is written.
-- The guard: exactly these two rows at their (course_id, field) keys, each with its value, this reviewer and this
-- reviewed_at, never validated (validated_at and validated_by null, as the rollback re-inserts them); exactly
-- {EXPECTED_PERSON_ROWS} rows by a reviewer outside @bot on {', '.join(IDS)}, or in {', '.join(MERGE_FIELDS)} naming one
-- of them (the conductor's read); no row by anyone pointing into {' or '.join(LEAVES)}; no CN: row re-homing either
-- Honors course. RETURNING puts each whole deleted row (to_jsonb) into the runner's receipt
-- (kb/receipts/migration_{NAME}_<run>.json, its `response`), so a session that did not do the write can put them
-- back. Rollback: {ROLLBACK}.

with target as (
  select k.* from public.kb_curation k
  where {keys}
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and (p.course_id in ({_in(IDS)})
         or (p.field in ({_in(MERGE_FIELDS)}) and ({likes})))
),
inward as (
  select count(*) as n from public.kb_curation i
  where (i.field = 'merge_into' and i.value in ({_in(LEAVES)})) or i.course_id in ({cns})
),
guard as (
  select (select count(*) from target) = {len(ROWS)}
     and (select count(*) from target t
          where ({exact})
            and t.field = 'merge_into'
            and t.reviewer_email = {q(BOT)}
            and t.reviewed_at::timestamptz = {q(STAMP)}::timestamptz
            and t.validated_at is null
            and t.validated_by is null) = {len(ROWS)}
     and (select n from person) = {EXPECTED_PERSON_ROWS}
     and (select n from inward) = 0 as ok,
     (select count(*) from target) as target_rows,
     (select n from person) as person_rows,
     (select n from inward) as inward_rows
),
gone as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.reviewer_email = {q(BOT)}
    and ({keys})
  returning to_jsonb(k) as image
)
select case when g.ok and (select count(*) from gone) = {len(ROWS)}
            then (select jsonb_agg(image order by image->>'course_id') from gone)
            else ('refused by the guard: target rows ' || g.target_rows || ', person rows ' || g.person_rows
                  || ', rows pointing in ' || g.inward_rows || ', or a row differs from the plan')::int::text::jsonb
       end as deleted
from guard g;

-- Read back: expect 0.
--   select count(*) from public.kb_curation where course_id in ({_in(LEAVES)}) and field = 'merge_into';
"""
    vals = ",\n       ".join(
        f"({q(r['course_id'])}, {q(r['field'])}, {q(r['value'])}, {q(r['reviewer_email'])}, {q(r['reviewed_at'])}, "
        f"{q(r['validated_at'])}, {q(r['validated_by'])})" for r in ROWS)
    rb = f"""-- Rollback for {os.path.basename(MIGRATION)}: puts back exactly the two rows it deleted, reviewer and reviewed_at
-- unchanged. The receipt of the forward run (kb/receipts/migration_{NAME}_<run>.json, `response`) holds each row
-- whole as read; if it shows a column this list does not name (reviewer_label is generated, never inserted), add it
-- before running this. A slot taken again since, by a person or a procedure, is skipped: their row wins.
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by)
values {vals}
on conflict (course_id, field) do nothing
returning course_id, field, value, reviewer_email, reviewed_at;
-- Read back: expect two rows, each merge_into its base, {BOT}.
--   select course_id, field, value, reviewer_email, reviewed_at from public.kb_curation where course_id in ({_in(LEAVES)}) and field = 'merge_into';
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


# ── the conductor's reads (each returns one JSON value) ─────────────────────────────────────────────────────────────

def selects():
    cols = "course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by"
    keys = ", ".join(f"({q(r['course_id'])}, {q(r['field'])})" for r in ROWS)
    likes = " or ".join(f"k.value like {q('%' + i + '%')}" for i in IDS)
    lk = lambda alias: " or ".join(f"{alias}.course_id like {q('%' + i + '%')} or {alias}.value like {q('%' + i + '%')}"
                                   for i in IDS)
    return [
        {"n": "a", "what": "the two bot rows as they stand, whole",
         "expect": "two rows: HUMA M10ME merge_into HUMA M1110 and LIBR M10CJ merge_into LIBR M1040, "
                   f"{BOT}, 2026-06-12 22:47:01.69179+00, validated_at and validated_by null, reviewer_label "
                   f"{BOT}",
         "if_different": "a row changed or is gone: hold; the guard would refuse anyway",
         "sql": "select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id), '[]'::jsonb) from public.kb_curation k "
                f"where (k.course_id, k.field) in ({keys});"},
        {"n": "b", "what": "every other row on the four ids or naming them, by any reviewer: whole rows on the ids, "
                           "pointer counts into them by reviewer, every person-saved row naming them, CN: rows on the "
                           "four MiraCosta courses",
         "expect": {"on_ids": "HUMA M1110 discipline (Religious Studies) and unified_title (World Religions "
                              "(Honors)); LIBR M1040 unified_title (Media & Information Literacy (Honors)); all @bot "
                              "(the overlay: trailcrew-ccr3-s112 and automerge-v1)",
                    "pointers_in": "HUMA M1110 9 and LIBR M1040 3 merge_into rows, all @bot (each count includes "
                                   "the Honors row); none into HUMA M10ME or LIBR M10CJ",
                    "person_rows": [], "cn_rows": []},
         "if_different": "a person's row: read it; the guard's person count is finalized from this read. A pointer "
                         "into a leaf or a CN: row: the course would follow it; hold and read it",
         "sql": "select jsonb_build_object("
                f"'on_ids', (select coalesce(jsonb_agg(jsonb_build_object('course_id', k.course_id, 'field', k.field, "
                "'value', k.value, 'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at, 'validated_at', "
                "k.validated_at, 'validated_by', k.validated_by) order by k.course_id, k.field), '[]'::jsonb) "
                f"from public.kb_curation k where k.course_id in ({_in(IDS)}) and (k.course_id, k.field) not in "
                f"({keys})), "
                "'pointers_in', (select coalesce(jsonb_object_agg(x.v || ' / ' || x.who, x.n), '{}'::jsonb) from "
                "(select k.value as v, case when k.reviewer_email like '%@bot' then k.reviewer_email else 'a person' "
                "end as who, count(*) as n from public.kb_curation k where k.field = 'merge_into' and k.value in "
                f"({_in(IDS)}) group by 1, 2) x), "
                "'person_rows', (select coalesce(jsonb_agg(jsonb_build_object('course_id', k.course_id, 'field', "
                "k.field, 'value', k.value, 'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at) order "
                "by k.reviewed_at), '[]'::jsonb) from public.kb_curation k where k.reviewer_email not like '%@bot' "
                f"and (k.course_id in ({_in(IDS)}) or {likes})), "
                "'cn_rows', (select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id), '[]'::jsonb) from "
                "public.kb_curation k where k.course_id in ("
                + _in("CN:" + c for c in HONORS_CNS + [COURSES[i]["base"]["control_number"] for i in LEAVES])
                + ")));"},
        {"n": "c", "what": "pending unified_title_merge_confirm rows touching the four ids (Rule 10's cross-check)",
         "expect": {"n": 0, "rows": []},
         "if_different": "a pending merge confirm names one of them: hold and read it",
         "sql": "select jsonb_build_object('n', count(*), 'rows', coalesce(jsonb_agg(jsonb_build_object('course_id', "
                "k.course_id, 'value', k.value, 'reviewer', case when k.reviewer_email like '%@bot' then "
                "k.reviewer_email else 'a person' end, 'reviewed_at', k.reviewed_at)), '[]'::jsonb)) from "
                f"public.kb_curation k where k.field = 'unified_title_merge_confirm' and ({lk('k')});"},
        {"n": "d", "what": "the table's shape: columns, the conflict key, triggers, and foreign keys into it (the "
                           "BUSI plan's read 5, widened: a delete trigger or a cascading key would write more than "
                           "two rows)",
         "expect": {"columns": "course_id, field, value, reviewer_email, reviewed_at (default now()), reviewer_label "
                               "(generated always, never inserted), validated_at, validated_by",
                    "unique": "a unique index on (course_id, field)", "triggers": [], "fks_in": []},
         "if_different": "a column the rollback does not name: add it to the rollback; a trigger or a foreign key: "
                         "read what it writes before the apply",
         "sql": "select jsonb_build_object("
                "'columns', (select jsonb_agg(jsonb_build_object('name', c.column_name, 'type', c.data_type, "
                "'default', c.column_default, 'generated', c.is_generated) order by c.ordinal_position) from "
                "information_schema.columns c where c.table_schema = 'public' and c.table_name = 'kb_curation'), "
                "'indexes', (select jsonb_agg(i.indexdef) from pg_indexes i where i.schemaname = 'public' and "
                "i.tablename = 'kb_curation'), "
                "'triggers', (select coalesce(jsonb_agg(pg_get_triggerdef(t.oid)), '[]'::jsonb) from pg_trigger t "
                "where t.tgrelid = 'public.kb_curation'::regclass and not t.tgisinternal), "
                "'fks_in', (select coalesce(jsonb_agg(conname), '[]'::jsonb) from pg_constraint where confrelid = "
                "'public.kb_curation'::regclass and contype = 'f'));"},
        {"n": "post", "what": "after the apply: the two keys are gone",
         "expect": 0, "if_different": "the delete did not land; read the receipt's response",
         "sql": "select to_jsonb(count(*)) from public.kb_curation where (course_id, field) in "
                f"({keys});"},
    ]


# ── the simulation ──────────────────────────────────────────────────────────────────────────────────────────────────

_EXPORT = ("import sys, os; sys.path.insert(0, {root!r}); os.chdir({root!r}); "
           "import excel_to_dashboard as e; e.export_unified_courses()")
FILES = ("unified_courses_index.js", "unified_courses_data.js", "unified_courses_standalone.js",
         "unified_courses_members.js", "unified_courses_details.js", "unified_courses_member_desc.js",
         "unified_courses_suggestions.js", "unified_courses_aligned.js")


def overlay_without_rows(doc):
    """The overlay kb/_apply_curation.py writes after the delete: each leaf's entry held only the merge, so it goes."""
    cur = doc["curations"]
    for r in ROWS:
        e = cur.get(r["course_id"]) or {}
        if (e.get(r["field"]), e.get("reviewed_by"), e.get("reviewed_at")) != (r["value"], r["reviewer_email"],
                                                                                 r["reviewed_at"]):
            raise SystemExit(f"ABORT: the overlay's {r['course_id']} entry is not the plan's row: {e}")
        rest = {k for k in e if k not in (r["field"], "reviewed_by", "reviewed_at")}
        if rest:
            raise SystemExit(f"ABORT: {r['course_id']} carries other fields {sorted(rest)}")
        del cur[r["course_id"]]
    doc["count"] = len(cur)
    return doc


def run_exports(tmp):
    farm, before, after = (os.path.join(tmp, x) for x in ("kb_after", "before", "after"))
    for d in (farm, before, after):
        if os.path.exists(d):
            raise SystemExit(f"ABORT: {d} exists; pass an empty --tmp")
        os.makedirs(d)
    for name in os.listdir(HERE):
        if name != "coci_curation.json":
            os.symlink(os.path.join(HERE, name), os.path.join(farm, name))
    doc = overlay_without_rows(json.load(open(os.path.join(HERE, "coci_curation.json"), encoding="utf-8")))
    with open(os.path.join(farm, "coci_curation.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    procs = []
    for kdir, odir in ((HERE, before), (farm, after)):
        env = dict(os.environ, UC_KB_DIR=kdir, UC_OUT_DIR=odir)
        procs.append(subprocess.Popen([sys.executable, "-c", _EXPORT.format(root=ROOT)], env=env,
                                      stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True))
    for p in procs:
        _, err = p.communicate()
        if p.returncode:
            raise SystemExit("export failed: " + (err or "")[-400:])
    return before, after, farm


def _js_payload(path):
    s = open(path, encoding="utf-8").read()
    i = s.index("=", s.index("window.")) + 1
    while s[i].isspace():
        i += 1
    return json.JSONDecoder().raw_decode(s, i)[0]


def _keyed(d):
    """{key: entry} for any of the export files: a list keyed by its first cell, row lists keyed by id, and the
    members / descriptions maps keyed by id; scalars keyed by name. generated_at is left out."""
    if isinstance(d, list):
        return {r[0]: r for r in d}
    out = {}
    for k, v in d.items():
        if k == "generated_at":
            continue
        if isinstance(v, list) and v and isinstance(v[0], dict) and "id" in v[0]:
            for r in v:
                out[f"{k}/{r['id']}"] = r
        elif isinstance(v, dict) and k in ("members", "desc"):
            for kk, vv in v.items():
                out[f"{k}/{kk}"] = vv
        else:
            out[k] = v
    return out


def compare(before, after):
    res = {"what": "simulated, not applied: export_unified_courses() through its UC_KB_DIR / UC_OUT_DIR seam on kb/ "
                   "and on a symlink copy of kb/ whose overlay lacks the two entries, in the same session",
           "files": {}, "ids": {}}
    raw = {}
    for name in FILES:
        b, a = _keyed(_js_payload(os.path.join(before, name))), _keyed(_js_payload(os.path.join(after, name)))
        raw[name] = (b, a)
        changed = sorted(k for k in set(b) | set(a) if b.get(k) != a.get(k))
        res["files"][name] = {"keys_before": len(b), "keys_after": len(a), "changed": changed}
    db, da = raw["unified_courses_data.js"]
    sb, sa = raw["unified_courses_standalone.js"]
    mb, ma = raw["unified_courses_members.js"]
    ib, ia = raw["unified_courses_index.js"]
    cols_b = _js_payload(os.path.join(before, "unified_courses_members.js"))["colleges"]
    cols_a = _js_payload(os.path.join(after, "unified_courses_members.js"))["colleges"]

    def mem(m, cols, i):
        rows = m.get("members/" + i) or []
        return {"members": len(rows), "colleges": len({r["c"] for r in rows}),
                "units": sorted({r["u"] for r in rows if r.get("u") is not None}),
                "rows": [[cols[r["c"]], r["n"], r["t"], r["u"], r.get("cn")] for r in rows] if len(rows) <= 3 else None}

    def row(d, s, i):
        r = d.get("rows/" + i) or s.get("rows/" + i)
        if not r:
            return None
        return {k: r.get(k) for k in ("kind", "title", "disc", "dsrc", "units", "top", "subj", "members", "auto_n",
                                      "adopted", "potential")}

    for i in IDS:
        res["ids"][i] = {"index": {"before": ib.get(i), "after": ia.get(i)},
                         "row": {"before": row(db, sb, i), "after": row(da, sa, i)},
                         "members": {"before": mem(mb, cols_b, i), "after": mem(ma, cols_a, i)}}
    res["member_rows"] = {"before": sum(len(v) for k, v in mb.items() if k.startswith("members/")),
                          "after": sum(len(v) for k, v in ma.items() if k.startswith("members/"))}
    gb = {json.dumps(g, sort_keys=True) for g in _js_payload(os.path.join(before, "unified_courses_suggestions.js"))["groups"]}
    ga = {json.dumps(g, sort_keys=True) for g in _js_payload(os.path.join(after, "unified_courses_suggestions.js"))["groups"]}
    res["suggestion_groups"] = {"before": len(gb), "after": len(ga),
                                "gone": [[m["id"] for m in json.loads(g)["members"]] for g in sorted(gb - ga)],
                                "new": [[m["id"] for m in json.loads(g)["members"]] for g in sorted(ga - gb)]}
    return res


def identities_check(farm):
    """kb/_identities_rebuild.py --check's own test (missing_entries), on kb/ and on the post-delete copy. The test
    reads the articulation records and the two M-ID catalogs, never the overlay, so the delete cannot move it; the
    four ids' records and entries are listed so the reader sees why."""
    import _identities_rebuild as ir
    out = {}
    for tag, d in (("before", HERE), ("after", farm)):
        art = json.load(open(os.path.join(d, "coci_articulations.json"), encoding="utf-8"))
        cat = json.load(open(os.path.join(d, "coci_minted_courses.json"), encoding="utf-8"))["courses"]
        sg = json.load(open(os.path.join(d, "coci_minted_singletons.json"), encoding="utf-8"))["courses"]
        ident, recs = art.get("identities") or {}, art.get("articulations") or []
        out[tag] = {"missing_entries": len(ir.missing_entries(ident, recs, cat, sg))}
        if tag == "before":
            out["identities_entries"] = len(ident)
            out["articulation_records"] = len(recs)
            out["records_on_the_four_ids"] = {i: sum(1 for r in recs if r.get("course_id") == i) for i in IDS}
            out["entries_on_the_four_ids"] = {i: i in ident for i in IDS}
            out["catalog"] = {i: ("minted course" if i in cat else "stand-alone record" if i in sg else "neither")
                              for i in IDS}
    out["follow_up_rebuild_fills"] = 0
    out["why"] = ("None of the four ids carries an articulation record, so none needs an identities entry and the "
                  "rollup's adopter and potential lists stay empty on all four; a later rebuild has nothing to fill "
                  "for them.")
    return out


def alias_facts():
    import alias_chain
    maps = alias_chain.load_maps(alias_chain.ALIAS_MAPS)
    pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])
    res = {}
    for i in IDS:
        cur, hops = alias_chain.resolve(i, maps)
        res[i] = {"through_every_map": cur, "hops": hops,
                  "through_pending": alias_chain.resolve_id(i, alias_chain.load_maps(pending))}
        if res[i]["through_pending"] != i:
            raise SystemExit(f"ABORT: {i} resolves to {res[i]['through_pending']}; the plan names live-era ids")
    keyed = sorted({p for p in alias_chain.ALIAS_MAPS for i in IDS
                    if i in alias_chain.load_alias(p) and alias_chain.step(alias_chain.load_alias(p)[i]) != i})
    return {"newest_applied_map": alias_chain.ALIAS_MAPS[-1], "pending_maps": pending, "resolved": res,
            "maps_renaming_one_of_them": keyed,
            "effect": "none: no map renames any of the four ids, no map is pending, and a delete re-keys nothing; "
                      "supabase-rekey.yml has no row left to carry for the two leaves"}


def build(tmp):
    overlay = json.load(open(os.path.join(HERE, "coci_curation.json"), encoding="utf-8"))
    cur = overlay["curations"]
    naming = {k: v for k, v in cur.items() if k in IDS or any(x in json.dumps(v) for x in IDS)}
    persons = sorted(k for k, v in naming.items() if not str(v.get("reviewed_by") or "").endswith("@bot"))
    inward = sorted(k for k, v in cur.items() if v.get("merge_into") in LEAVES)
    cn = sorted(k for k in cur if k in {"CN:" + c for c in HONORS_CNS})
    if persons or inward or cn:
        raise SystemExit(f"ABORT: the overlay names the ids in a way the plan does not cover: {persons} {inward} {cn}")
    before, after, farm = run_exports(tmp)
    sim = compare(before, after)
    with open(os.path.join(OUT, "post_apply_simulated.json"), "w", encoding="utf-8") as f:
        json.dump(sim, f, indent=1, ensure_ascii=False)
        f.write("\n")
    return {
        "_about": "Honors S652 dry-run plan: delete the two automerge-v1 rows HUMA M10ME and LIBR M10CJ merge_into "
                  "their bases. Written by kb/_honors_two_row_delete_s652.py --plan; nothing applied.",
        "date": DATE, "ruling": RULING,
        "rows_before": ROWS, "rows_after": None, "inserts": [],
        "why_no_insert": "each Honors course's own record already exists as a stand-alone record in "
                         "kb/coci_minted_singletons.json; with the bot's row gone nothing folds it, nothing points "
                         "into it and no CN: row re-homes it, so the export emits it as its own row.",
        "courses": COURSES,
        "overlay": {"synced": overlay.get("_synced_at"), "entries_naming_the_ids": naming,
                    "person_entries": persons, "pointers_into_leaves": inward, "cn_rows": cn},
        "alias_chain": alias_facts(),
        "identities_map": identities_check(farm),
        "simulated": sim,
        "not_covered": [
            "The base titles keep '(Honors)': HUMA M1110's unified_title 'World Religions (Honors)' "
            "(trailcrew-ccr3-s112 bot) and LIBR M1040's 'Media & Information Literacy (Honors)' (the same June "
            "auto-merge cohort). Changing either is an UPDATE or DELETE of a saved row that card 2 does not name.",
            "HUMA M10ME returns with a discipline inferred from its TOP division (Humanities, dconf 0.4), shown "
            "with the inferred mark and held out of the SUBJ4 fold; its base HUMA M1110 carries Religious Studies "
            "from a curated row.",
            "The two ids are the records' existing ids (HUMA M10ME, LIBR M10CJ), not the base-plus-H numbers card 3 "
            "rules for a new Honors M-ID; whether card 3 renames them is the Honors design's call.",
            "The nightly suggested-merge worklist proposes each pair again (LIBR M1040 with LIBR M10CJ, score "
            "0.84; HUMA M1110 with HUMA M10ME and HUMA M10OI, 0.527). No procedure acts on it; a curator's merge "
            "would fold them back until honors_of exists.",
        ],
        "migration": {"forward": MIGRATION, "rollback": ROLLBACK,
                      "apply_lines": f"file={MIGRATION}\nname={NAME}",
                      "receipt": f"kb/receipts/migration_{NAME}_<run>.json"},
        "selects": selects(),
    }


def write_md(plan, path):
    s = plan["simulated"]
    ids = s["ids"]
    lines = [
        f"# Honors S652: delete two bot rows (dry run, {DATE})", "",
        f"Sam, {RULING['where']} (*{RULING['title']}*), {RULING['by']}, 14:35Z {DATE}: \"{RULING['said']}\" "
        f"(*{RULING['button']}*). Background: {RULING['background']}. Nothing here is applied.", "",
        "## The rows", "",
    ]
    for r in ROWS:
        c = COURSES[r["course_id"]]
        lines.append(f"- `({r['course_id']}, {r['field']}, {r['value']})`, `{r['reviewer_email']}`, {r['reviewed_at']}, "
                     f"unvalidated. Its course: {c['college']} {c['code']} *{c['title']}* ({c['control_number']}).")
    lines += ["", "Nothing is inserted: " + plan["why_no_insert"], "",
              "## The guard and the receipt", "",
              f"`{MIGRATION}`, one plain statement. The delete runs only when: both rows stand at their keys with "
              "this value, reviewer and stamp, unvalidated; the person-saved rows on the four ids (or in a merge "
              f"field naming one) number {EXPECTED_PERSON_ROWS}; no row points into either leaf; no CN: row "
              "re-homes either Honors course. Otherwise the cast raises and nothing is written. RETURNING sends both "
              f"rows whole to `{plan['migration']['receipt']}`. Undo: `{ROLLBACK}` re-inserts both, ON CONFLICT DO "
              "NOTHING.", "",
              "## What moves (simulated)", ""]
    for i in IDS:
        m, r = ids[i]["members"], ids[i]["row"]
        rb, ra = r["before"] or {}, r["after"] or {}
        lines.append(f"- `{i}`: members {m['before']['members']} to {m['after']['members']}, colleges "
                     f"{m['before']['colleges']} to {m['after']['colleges']}, units {m['before']['units']} to "
                     f"{m['after']['units']}; row {rb.get('kind')} to {ra.get('kind')}, title {ra.get('title')!r}, "
                     f"subjects {rb.get('subj')} to {ra.get('subj')}, TOP {rb.get('top')} to {ra.get('top')}.")
    f = s["files"]
    lines += ["",
              f"Identities in the index {f['unified_courses_index.js']['keys_before']:,} to "
              f"{f['unified_courses_index.js']['keys_after']:,}; stand-alone rows "
              f"{f['unified_courses_standalone.js']['keys_before']:,} to {f['unified_courses_standalone.js']['keys_after']:,} "
              f"(the Commons CCR card's *stand-alone in today's build*); member rows {s['member_rows']['before']:,} "
              f"to {s['member_rows']['after']:,}; suggestion groups {s['suggestion_groups']['before']:,} to "
              f"{s['suggestion_groups']['after']:,}. Articulations, credit recommendations and adopter lists: none "
              "on any of the four ids, before or after. Only COBI reads these files (Unified Courses, COCI Lookup, the CPL "
              "Pathways workbook, Exhibits), with SkyView's canvas and the Commons status rebuilt from them nightly; "
              "no public page and no Fact Sheet figure reads them.", "",
              "## Identities map, alias chain", "",
              plan["identities_map"]["why"] + f" `--check` logic: missing entries "
              f"{plan['identities_map']['before']['missing_entries']} before, "
              f"{plan['identities_map']['after']['missing_entries']} after.", "",
              "Alias chain: " + plan["alias_chain"]["effect"] + ".", "",
              "## Not covered by card 2", ""]
    lines += ["- " + x for x in plan["not_covered"]]
    lines += ["", "## The conductor's reads (one JSON value each)", ""]
    for sel in plan["selects"]:
        lines += [f"**{sel['n']}.** {sel['what']}. Expect: {json.dumps(sel['expect']) if not isinstance(sel['expect'], str) else sel['expect']}.",
                  "", "```sql", sel["sql"], "```", ""]
    lines += ["## Apply sequence", "",
              "(i) The conductor runs reads a to d, in a window clear of 06:17, 09:17 and 12:17 UTC, and sets the "
              "guard's person count from read b. (ii) On this branch, `kb/migrations/.apply` takes the two lines "
              f"`file={MIGRATION}` and `name={NAME}`, one commit, one push; `supabase-migrate.yml` applies on that "
              "push. (iii) The runner commits the receipt; its `response` holds both rows. (iv) Read post. (v) The PR "
              "merges on a green `test`. (vi) One `daily-dashboard.yml` dispatch (or the next cron), then read the "
              "members file against `post_apply_simulated.json`.", ""]
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def do_plan(tmp):
    os.makedirs(OUT, exist_ok=True)
    plan = build(tmp)
    with open(os.path.join(OUT, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1, ensure_ascii=False)
        f.write("\n")
    write_md(plan, os.path.join(OUT, "plan.md"))
    print("wrote " + os.path.relpath(OUT, ROOT) + "/plan.json, plan.md and post_apply_simulated.json")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--plan", action="store_true")
    g.add_argument("--sql", action="store_true")
    ap.add_argument("--check", action="store_true", help="with --sql: fail when the committed pair differs")
    ap.add_argument("--tmp", help="with --plan: an empty scratch directory for the two export runs")
    a = ap.parse_args()
    if a.plan:
        if not a.tmp:
            raise SystemExit("--plan needs --tmp <empty scratch directory>")
        do_plan(a.tmp)
    else:
        do_sql(check=a.check)
    return 0


if __name__ == "__main__":
    sys.exit(main())
