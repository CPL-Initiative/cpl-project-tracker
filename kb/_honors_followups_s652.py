#!/usr/bin/env python3
"""Honors S652, the follow-ups to the two-row delete: the bases' titles and the pairs held apart. A dry run first.

WHY. The delete (kb/_honors_two_row_delete_s652.py; Sam, Open Asks Sheet 197 card 2, 14:35Z 2026-11-14, "delete";
supabase-migrate.yml run 43607926526, both rows in the receipt) returned MiraCosta College's RELG 101H and LIBR 201H
to their own records, HUMA M10ME and LIBR M10CJ. Its reader named two follow-ups, and the conductor carries them out
under Sam's standing view given in session today: an M-ID is our own construct and a low-stakes attempt, the care
goes into the rewiring, and "CCN structures should be our gold standard" (in the CCN layer every Honors course is its
own H record beside its base, and no base holds an Honors course).

  1. Titles. After the delete neither base holds an Honors course, yet both still carry the June auto-merge's Honors
     title. One guarded UPDATE per row, the value alone (reviewer and reviewed_at stay, as the S649 CVMA update kept
     its rows' stamps):
       HUMA M1110  "World Religions (Honors)"               to "World Religions"
       LIBR M1040  "Media & Information Literacy (Honors)"  to "Media & Information Literacy"
     The two Honors records keep their catalog titles, "World Religions (Honors)" and "Media & Information Literacy
     (Honors)". The CCN form ("<base> - Honors", as ENGL C1000H "Academic Reading and Writing - Honors") needs more
     than a row: the export builds a stand-alone row's title from its catalog record (excel_to_dashboard.py, the
     stand-alone rows read v["common_title"]) and the worklist replays a curated title only on a merge target, so a
     unified_title row there would sit inert. It waits for an export change or Sheet 197 card 3's Honors build.
  2. Hold the pairs apart. The nightly suggested-merge payload proposes each Honors record with its base again, and
     kb/_auto_merge_worklist.py (the June bot's own tool) and the Unified Courses worklist both skip a group whose
     live-member signature (ids sorted by code point, "|"-joined) a merge_dismissed row holds; the row is keyed on the
     signature's first id, as the worklist's Keep as-is button saves it (unified_courses.js, groupSig). One
     INSERT-only merge_dismissed row per pair. The HUMA group has three ids (HUMA M10OI, "World Religion", joins it),
     so its dismissal also stops proposing HUMA M10OI with HUMA M1110 until the group's membership changes.
  Both inserts are under cohort honors-s652@bot, ON CONFLICT DO NOTHING.

WHAT EACH MODE WRITES.
  --sql [--check]   the migration pair under kb/migrations/.
  --plan --tmp DIR  kb/honors_delete_s652_out/2026-11-14/followups_plan.json and followups_plan.md: the export run on
                    the post-delete overlay and on the post-follow-up overlay (symlink copies of kb/), and every
                    suggestion group naming an Honors record or its base, with its signature and whether a dismissal
                    holds it.
  No mode writes a kb/ data file, a generated file, kb/migrations/.apply or a Supabase row.

Run (from repo root):
  python3 kb/_honors_followups_s652.py --sql [--check]
  python3 kb/_honors_followups_s652.py --plan --tmp <scratch dir that does not exist yet>
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

import _honors_two_row_delete_s652 as d1  # noqa: E402  (the delete's ids, quoting and export helpers)

DATE = d1.DATE
OUT = d1.OUT
NAME = "s652_honors_followups"
MIGRATION = f"kb/migrations/{DATE}_{NAME}.sql"
ROLLBACK = f"kb/migrations/{DATE}_{NAME}_rollback.sql"
COHORT = "honors-s652" + "@bot"
BOT, STAMP = d1.BOT, d1.STAMP
DELETE_RECEIPT = "kb/receipts/migration_s652_honors_two_row_delete_43607926526.json"

# The bases' title rows, as the June auto-merge saved them (kb/automerge_out/2026-06-12/plan.json writes both; the July
# trail-crew cohort wrote HUMA M1110's discipline only, kb/ccr_out/2026-07-12/fire_receipt_wave3.json).
UPDATES = [
    {"course_id": "HUMA M1110", "field": "unified_title", "before": "World Religions (Honors)",
     "after": "World Religions"},
    {"course_id": "LIBR M1040", "field": "unified_title", "before": "Media & Information Literacy (Honors)",
     "after": "Media & Information Literacy"},
]
# One Keep as-is row per pair: course_id the signature's first id, value the group's whole live-member signature as
# the post-follow-up payload builds it (--plan checks each against the simulation).
INSERTS = [
    {"course_id": "HUMA M10ME", "field": "merge_dismissed", "value": "HUMA M10ME|HUMA M10OI|HUMA M1110"},
    {"course_id": "LIBR M1040", "field": "merge_dismissed", "value": "LIBR M1040|LIBR M10CJ"},
]
LEAVES, BASES, IDS = d1.LEAVES, d1.BASES, d1.IDS
q, _in = d1.q, d1._in


def sql_text():
    exp = ",\n    ".join(f"({q(u['course_id'])}, {q(u['before'])}, {q(u['after'])})" for u in UPDATES)
    ins = ",\n    ".join(f"({q(i['course_id'])}, {q(i['field'])}, {q(i['value'])})" for i in INSERTS)
    slots = ", ".join(f"({q(i['course_id'])}, {q(i['field'])})" for i in INSERTS)
    likes = " or ".join(f"p.value like {q('%' + i + '%')}" for i in IDS)
    lines = "\n".join(f"--   UPDATE {u['course_id']} unified_title: {u['before']!r} to {u['after']!r}" for u in UPDATES)
    lines += "\n" + "\n".join(f"--   INSERT {i['course_id']} {i['field']}: {i['value']!r}" for i in INSERTS)
    mig = f"""-- Honors S652 follow-ups: the bases' titles, and the pairs held apart.
-- After Sam's Sheet 197 card 2 delete (14:35Z 2026-11-14, "delete"; run 43607926526, {DELETE_RECEIPT}), MiraCosta
-- College's RELG 101H and LIBR 201H stand on their own records. The conductor carries out the delete's two follow-ups
-- under Sam's standing view (an M-ID is our own construct; CCN structures are the gold standard, and no base holds an
-- Honors course). Plan: kb/honors_delete_s652_out/{DATE}/followups_plan.md. Written by kb/_honors_followups_s652.py --sql.
{lines}
-- The two updates change the value alone: reviewer_email and reviewed_at stay the June auto-merge's, as the S649 CVMA
-- update kept its rows' stamps; the result carries each row's before-image. The two inserts are cohort {COHORT}.
-- One plain statement: the writes hang on one guard CTE, and a failed guard raises, so nothing is written. The guard:
-- exactly the two title rows, each with its before-value, {BOT} and {STAMP}, never validated; no row at all on
-- {' or '.join(LEAVES)} (so the delete has landed); neither insert's slot taken; no row by a reviewer outside @bot on
-- the four ids, or in merge_into, unified_title_merge_confirm or merge_dismissed naming one of them.
-- RETURNING puts every change (each update's before-image and after-value, each insert whole) into the runner's
-- receipt (kb/receipts/migration_{NAME}_<run>.json). Rollback: {ROLLBACK}.

with expected (course_id, value_before, value_after) as (
  values
    {exp}
),
target as (
  select k.* from public.kb_curation k
  where k.field = 'unified_title' and k.course_id in (select course_id from expected)
),
leaf_rows as (
  select count(*) as n from public.kb_curation l where l.course_id in ({_in(LEAVES)})
),
slots as (
  select count(*) as n from public.kb_curation s where (s.course_id, s.field) in ({slots})
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and (p.course_id in ({_in(IDS)})
         or (p.field in ({_in(d1.MERGE_FIELDS)}) and ({likes})))
),
guard as (
  select (select count(*) from target) = {len(UPDATES)}
     and (select count(*) from target t join expected e on e.course_id = t.course_id
          where t.value = e.value_before
            and t.reviewer_email = {q(BOT)}
            and t.reviewed_at::timestamptz = {q(STAMP)}::timestamptz
            and t.validated_at is null
            and t.validated_by is null) = {len(UPDATES)}
     and (select n from leaf_rows) = 0
     and (select n from slots) = 0
     and (select n from person) = 0 as ok,
     (select count(*) from target) as target_rows,
     (select n from leaf_rows) as leaf_rows,
     (select n from slots) as slot_rows,
     (select n from person) as person_rows
),
retitled as (
  update public.kb_curation k
  set value = e.value_after
  from guard g, target t, expected e
  where g.ok and k.course_id = t.course_id and k.field = t.field and e.course_id = t.course_id
    and k.value = e.value_before and k.reviewer_email = {q(BOT)}
  returning jsonb_build_object('op', 'update', 'value_after', k.value, 'row_before', to_jsonb(t)) as image
),
added as (
  insert into public.kb_curation as k (course_id, field, value, reviewer_email)
  select v.course_id, v.field, v.value, {q(COHORT)}
  from guard g cross join (values
    {ins}
  ) as v (course_id, field, value)
  where g.ok
  on conflict (course_id, field) do nothing
  returning jsonb_build_object('op', 'insert', 'row', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from retitled) = {len(UPDATES)} and (select count(*) from added) = {len(INSERTS)}
            then (select jsonb_agg(x.image) from (select image from retitled union all select image from added) x)
            else ('refused by the guard: title rows ' || g.target_rows || ', rows on the Honors records '
                  || g.leaf_rows || ', taken slots ' || g.slot_rows || ', person rows ' || g.person_rows
                  || ', or a row differs from the plan')::int::text::jsonb
       end as changed
from guard g;

-- Read back: expect the two bases' titles without "(Honors)", and two {COHORT} merge_dismissed rows.
--   select course_id, field, value, reviewer_email from public.kb_curation where course_id in ({_in(IDS)}) and field in ('unified_title', 'merge_dismissed') order by 1, 2;
"""
    back = ",\n    ".join(f"({q(u['course_id'])}, {q(u['before'])}, {q(u['after'])})" for u in UPDATES)
    rb = f"""-- Rollback for {os.path.basename(MIGRATION)}: the two bases take back their before-values, and the cohort's two
-- inserts go. The forward receipt (kb/receipts/migration_{NAME}_<run>.json) holds every before-image. One plain
-- statement on one guard: it runs only while BOTH titles still hold the follow-up's value under the same reviewer
-- and stamp, and otherwise raises and changes nothing. A title restamped since (S653 step 1 moves both to
-- honors-s652@bot: run 2026-11-14_s653_honors_of_field_rollback.sql first) or edited by a person refuses the whole
-- rollback, so the Keep as-is rows are never deleted while a title stays unrestored (#3315's review, item 3). The
-- delete keys on the cohort and the field, never on ids (the anchored plan mints no HUMA M1110H; #3315). A
-- row a person has validated stays, and the result counts it (kept_for_a_person).
with expected (course_id, value_before, value_after) as (
  values
    {back}
),
target as (
  select k.* from public.kb_curation k join expected e on e.course_id = k.course_id where k.field = 'unified_title'
),
guard as (
  select (select count(*) from target t join expected e on e.course_id = t.course_id
          where t.value = e.value_after and t.reviewer_email = {q(BOT)}
            and t.reviewed_at::timestamptz = {q(STAMP)}::timestamptz) = 2 as ok,
         (select count(*) from target t where t.reviewer_email <> {q(BOT)}) as restamped,
         (select count(*) from public.kb_curation c where c.reviewer_email = {q(COHORT)}
          and c.field = 'merge_dismissed' and not (c.validated_by is null or c.validated_by like '%@bot')) as kept,
         (select count(*) from target) as title_rows
),
restored as (
  update public.kb_curation k
  set value = e.value_before
  from guard g, expected e
  where g.ok and k.course_id = e.course_id and k.field = 'unified_title' and k.value = e.value_after
    and k.reviewer_email = {q(BOT)} and k.reviewed_at::timestamptz = {q(STAMP)}::timestamptz
  returning jsonb_build_object('op', 'restore', 'course_id', k.course_id, 'value', k.value) as image
),
removed as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.reviewer_email = {q(COHORT)} and k.field = 'merge_dismissed'
    and (k.validated_by is null or k.validated_by like '%@bot')
  returning jsonb_build_object('op', 'delete', 'row', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from restored) = 2
                 and (select count(*) from removed) + g.kept = {len(INSERTS)}
            then jsonb_build_object('kept_for_a_person', g.kept, 'changed',
                   (select coalesce(jsonb_agg(x.image), '[]'::jsonb)
                    from (select image from restored union all select image from removed) x))
            else ('refused by the guard: ' || g.title_rows || ' title rows, ' || g.restamped
                  || ' under another reviewer, and both must hold the follow-up value under the June stamp')::int::text::jsonb
       end as undone
from guard g;
-- Read back: expect the two bases' "(Honors)" titles and no {COHORT} row.
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


def select_before():
    """The one read the conductor runs before the apply: one JSON value."""
    likes = lambda a: " or ".join(f"{a}.value like {q('%' + i + '%')}" for i in IDS)
    slots = ", ".join(f"({q(i['course_id'])}, {q(i['field'])})" for i in INSERTS)
    return ("select jsonb_build_object("
            "'title_rows', (select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id), '[]'::jsonb) from "
            f"public.kb_curation k where k.field = 'unified_title' and k.course_id in ({_in(BASES)})), "
            "'rows_on_honors_records', (select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id, k.field), "
            f"'[]'::jsonb) from public.kb_curation k where k.course_id in ({_in(LEAVES)})), "
            "'insert_slots_taken', (select count(*) from public.kb_curation k where (k.course_id, k.field) in "
            f"({slots})), "
            "'dismissals_naming_the_ids', (select coalesce(jsonb_agg(jsonb_build_object('course_id', k.course_id, "
            "'value', k.value, 'reviewer', case when k.reviewer_email like '%@bot' then k.reviewer_email else "
            f"'a person' end)), '[]'::jsonb) from public.kb_curation k where k.field = 'merge_dismissed' and "
            f"({likes('k')})), "
            "'person_rows', (select count(*) from public.kb_curation p where p.reviewer_email not like '%@bot' and "
            f"(p.course_id in ({_in(IDS)}) or (p.field in ({_in(d1.MERGE_FIELDS)}) and ({likes('p')})))));")


# ── the simulation ──────────────────────────────────────────────────────────────────────────────────────────────────

def overlay_after(doc):
    """The overlay kb/_apply_curation.py writes after the delete and the follow-ups."""
    doc = d1.overlay_without_rows(doc)
    cur = doc["curations"]
    for u in UPDATES:
        e = cur[u["course_id"]]
        if e.get("unified_title") != u["before"]:
            raise SystemExit(f"ABORT: {u['course_id']}'s overlay title is {e.get('unified_title')!r}")
        e["unified_title"] = u["after"]
    for i in INSERTS:
        e = cur.setdefault(i["course_id"], {})
        if e.get(i["field"]):
            raise SystemExit(f"ABORT: {i['course_id']} already holds {i['field']}")
        e[i["field"]] = i["value"]
    doc["count"] = len(cur)
    return doc


def run(tmp):
    os.makedirs(tmp)
    runs = {}
    base = json.load(open(os.path.join(HERE, "coci_curation.json"), encoding="utf-8"))
    for tag, doc in (("after_delete", d1.overlay_without_rows(json.loads(json.dumps(base)))),
                     ("after_followups", overlay_after(json.loads(json.dumps(base))))):
        farm, odir = os.path.join(tmp, "kb_" + tag), os.path.join(tmp, tag)
        os.makedirs(farm)
        os.makedirs(odir)
        for name in os.listdir(HERE):
            if name != "coci_curation.json":
                os.symlink(os.path.join(HERE, name), os.path.join(farm, name))
        with open(os.path.join(farm, "coci_curation.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=1, ensure_ascii=False)
        runs[tag] = (farm, odir, doc)
    procs = [subprocess.Popen([sys.executable, "-c", d1._EXPORT.format(root=ROOT)],
                              env=dict(os.environ, UC_KB_DIR=farm, UC_OUT_DIR=odir),
                              stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
             for farm, odir, _ in runs.values()]
    for p in procs:
        _, err = p.communicate()
        if p.returncode:
            raise SystemExit("export failed: " + (err or "")[-400:])
    return runs


def groups_naming(odir, doc):
    """Every suggestion group, in every lane of the payload, that names an Honors record or its base, with the
    live-member signature both readers compute (members not merged away, ids sorted, '|'-joined) and whether a
    merge_dismissed value in the overlay holds it."""
    cur = doc["curations"]
    merged = {k for k, v in cur.items() if v.get("merge_into")}
    dismissed = {v["merge_dismissed"] for v in cur.values() if v.get("merge_dismissed")}
    pay = d1._js_payload(os.path.join(odir, "unified_courses_suggestions.js"))
    out = []
    for lane, groups in pay.items():
        if not isinstance(groups, list):
            continue
        for g in groups:
            if not isinstance(g, dict):
                continue
            ids = [m.get("id") for m in (g.get("members") or []) if isinstance(m, dict)]
            if not any(i in IDS for i in ids):
                continue
            seen, live = set(), []
            for i in ids:
                if i not in merged and i not in seen:
                    seen.add(i)
                    live.append(i)
            sig = "|".join(sorted(live))
            out.append({"lane": lane, "sig_words": g.get("sig"), "score": g.get("score"), "members": ids,
                        "live_signature": sig,
                        "pairs_an_honors_record_with_its_base": any(a in live and b in live
                                                                    for a, b in zip(LEAVES, BASES)),
                        "held_by_a_dismissal": sig in dismissed, "offered": len(live) >= 2 and sig not in dismissed})
    return out


def facts(odir):
    data = d1._keyed(d1._js_payload(os.path.join(odir, "unified_courses_data.js")))
    sa = d1._keyed(d1._js_payload(os.path.join(odir, "unified_courses_standalone.js")))
    idx = d1._keyed(d1._js_payload(os.path.join(odir, "unified_courses_index.js")))
    res = {}
    for i in IDS:
        r = data.get("rows/" + i) or sa.get("rows/" + i) or {}
        res[i] = {"kind": r.get("kind"), "title": r.get("title"), "index_title": (idx.get(i) or [None, None])[1],
                  "reviewed": (r.get("flags") or {}).get("reviewed"), "members": r.get("members")}
    return res


def do_plan(tmp):
    runs = run(tmp)
    plan = {"_about": "Honors S652 follow-ups dry run: two title updates and two dismissal inserts (cohort "
                      + COHORT + "). Written by kb/_honors_followups_s652.py --plan; nothing applied.",
            "date": DATE, "delete_receipt": DELETE_RECEIPT, "updates": UPDATES, "inserts": INSERTS,
            "cohort": COHORT, "no_title_row_for_the_honors_records": (
                "The export builds a stand-alone row's title from its catalog record and the worklist replays a "
                "curated title only on a merge target, so a unified_title row on HUMA M10ME or LIBR M10CJ would be "
                "inert; the CCN form waits for an export change or card 3's Honors build."),
            "migration": {"forward": MIGRATION, "rollback": ROLLBACK, "apply_lines": f"file={MIGRATION}\nname={NAME}"},
            "select_before": select_before(), "simulated": {}}
    for tag, (farm, odir, doc) in runs.items():
        plan["simulated"][tag] = {"ids": facts(odir), "groups": groups_naming(odir, doc)}
    after = plan["simulated"]["after_followups"]
    before = plan["simulated"]["after_delete"]
    want = {i["value"] for i in INSERTS}
    pairing = [g for g in after["groups"] if g["pairs_an_honors_record_with_its_base"]]
    plan["checks"] = {
        "the post-delete payload offers both pairs": sum(1 for g in before["groups"]
                                                         if g["pairs_an_honors_record_with_its_base"]
                                                         and g["offered"]) >= 2,
        "every pairing group is held after": bool(pairing) and all(g["held_by_a_dismissal"] for g in pairing),
        "every dismissal is a pairing group's signature": want <= {g["live_signature"] for g in pairing},
        "the bases read their new titles": after["ids"]["HUMA M1110"]["title"] == UPDATES[0]["after"]
                                           and after["ids"]["LIBR M1040"]["title"] == UPDATES[1]["after"],
        "the Honors records stay stand-alone": after["ids"]["HUMA M10ME"]["kind"] == "Stand-Alone"
                                               and after["ids"]["LIBR M10CJ"]["kind"] == "Stand-Alone",
    }
    with open(os.path.join(OUT, "followups_plan.json"), "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1, ensure_ascii=False)
        f.write("\n")
    write_md(plan, os.path.join(OUT, "followups_plan.md"))
    print("checks: " + json.dumps(plan["checks"]))
    if not all(plan["checks"].values()):
        raise SystemExit("a check failed")


def write_md(plan, path):
    s = plan["simulated"]
    L = [f"# Honors S652 follow-ups (dry run, {DATE})", "",
         "After the two-row delete (run 43607926526), the conductor's two follow-ups under Sam's standing view "
         "(CCN structures are the gold standard: no base holds an Honors course). Nothing here is applied.", "",
         "## The writes", ""]
    L += [f"- UPDATE `{u['course_id']}` unified_title *{u['before']}* to *{u['after']}* (value alone; reviewer and "
          "reviewed_at kept, as the S649 CVMA update)." for u in UPDATES]
    L += [f"- INSERT `{i['course_id']}` {i['field']} `{i['value']}` ({COHORT})." for i in INSERTS]
    L += ["", "No title row for the Honors records: " + plan["no_title_row_for_the_honors_records"], "",
          f"`{MIGRATION}`, one plain statement on one guard; rollback `{ROLLBACK}`.", "",
          "## Simulated (export on the post-delete overlay, then on the post-follow-up overlay)", ""]
    for i in IDS:
        a, b = s["after_delete"]["ids"][i], s["after_followups"]["ids"][i]
        L.append(f"- `{i}`: title *{a['title']}* to *{b['title']}*; {b['kind']}, {b['members']} members.")
    L += ["", "Suggestion groups naming an Honors record or its base:", ""]
    for tag in ("after_delete", "after_followups"):
        for g in s[tag]["groups"]:
            L.append(f"- {tag}: {g['lane']} `{g['live_signature']}` (score {g['score']}): "
                     + ("held by a dismissal" if g["held_by_a_dismissal"] else "offered" if g["offered"]
                        else "not offered"))
    L += ["", "Checks: " + "; ".join(f"{k}: {v}" for k, v in plan["checks"].items()) + ".", "",
          "## The conductor's read before the apply (one JSON value)", "", "```sql", plan["select_before"], "```", ""]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--plan", action="store_true")
    g.add_argument("--sql", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--tmp")
    a = ap.parse_args()
    if a.plan:
        if not a.tmp:
            raise SystemExit("--plan needs --tmp <scratch dir that does not exist yet>")
        do_plan(a.tmp)
    else:
        do_sql(check=a.check)
    return 0


if __name__ == "__main__":
    sys.exit(main())
