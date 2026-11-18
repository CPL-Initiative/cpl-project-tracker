#!/usr/bin/env python3
"""Run the S649 and S652 guarded kb_curation migrations against a throwaway Postgres: each guard refuses, each rollback restores.

WHY. A guarded write to `kb_curation` (Sam's rows always win, CLAUDE.md Rule 10) is only as good as its guard, and a
guard read on paper can still match the wrong row or none. This runs the committed files themselves, as the runner
would post them, against a table shaped like `kb_curation` (kb/supabase_curation_setup.sql's table, the
2026-11-09 generated reviewer_label, validated_at and validated_by), and proves for each pair:
  * on the planned state the forward file writes exactly its rows and returns each before-image;
  * each guard refuses its own failure (the row changed, a person's row, a validation, the row gone), and a refusal
    writes nothing;
  * the rollback puts every row back as it was, reviewer and reviewed_at included (to_jsonb equal).

It needs a Postgres server: PGHOST/PGPORT (or a local socket) and createdb rights. With none reachable it prints
SKIP and exits 0, so CI without a database passes; a session runs it locally before asking for an apply.

Run: PGHOST=/path/to/socket PGPORT=54329 python3 tests/kb_curation_guarded_sql_proof.py
"""
import json
import os
import subprocess
import sys
import uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA = """
create table public.kb_curation (
  course_id text not null, field text not null default 'discipline', value text, reviewer_email text not null,
  reviewed_at timestamptz not null default now(), validated_at timestamptz, validated_by text,
  primary key (course_id, field));
alter table public.kb_curation add column reviewer_label text
  generated always as (case when reviewer_email is null then null
                            when reviewer_email ~ '@bot$' then reviewer_email else 'a reviewer' end) stored;
"""

# Each pair: the forward and rollback files, the planned rows (the state the plan read), and the failures each guard
# must refuse, as SQL run on the planned state before the forward file.
PAIRS = []
BUSI_ROWS = [
    ("BUSI M10XW", "merge_into", "BUSI M1228", "automerge-titlelane-v1@bot", "2026-06-13T17:47:56.243497+00:00"),
    ("BUSI M10XV", "merge_into", "BUSI M1228", "automerge-titlelane-v1@bot", "2026-06-13T17:47:56.243497+00:00"),
    ("BUSI M1228", "unified_title", "International Documentation and Supply Chain Management",
     "automerge-titlelane-v1@bot", "2026-06-13T17:47:56.243497+00:00"),
]
BUSI = {
    "name": "busi", "forward": "kb/migrations/2026-11-14_s649_busi_split_delete.sql",
    "rollback": "kb/migrations/2026-11-14_s649_busi_split_delete_rollback.sql",
    "rows": BUSI_ROWS, "changed_keys": [("BUSI M10XW", "merge_into")],
    "refusals": {
        "the row's value differs": "update kb_curation set value = 'BUSI M1227' where course_id = 'BUSI M10XW'",
        "the row's reviewer differs": "update kb_curation set reviewer_email = 'someone@college.edu' "
                                      "where course_id = 'BUSI M10XW'",
        "a person validated the merge": "update kb_curation set validated_at = now(), validated_by = 'someone' "
                                        "where course_id = 'BUSI M10XW'",
        "the row names a validator without a stamp": "update kb_curation set validated_by = 'someone' "
                                                     "where course_id = 'BUSI M10XW'",
        "a person's merge into BUSI M1228": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                            "values ('BUSI M10ZZ', 'merge_into', 'BUSI M1228', 'someone@college.edu')",
        "a person's Keep as-is naming BUSI M10XW": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                                  "values ('UC:x', 'merge_dismissed', 'BUSI M10XW|BUSI M1228', "
                                                  "'someone@college.edu')",
        "the row is gone": "delete from kb_curation where course_id = 'BUSI M10XW'",
    },
}
if os.path.exists(os.path.join(ROOT, BUSI["forward"])):
    PAIRS.append(BUSI)
CV = "_CREDENTIAL_REVIEW::"
TYPO = "alifornia Veterinary Medical Association (CVMA)"
CVMA_ROWS = [
    (CV + "Veterinary Assistance & Nursing: Emergency Procedures", "issuing_agency_additional_override", TYPO,
     "person@example.org", "2026-07-09T00:37:39.286263+00:00"),
    (CV + "Veterinary Equipment, Operation, Instrumentation and Safety", "issuing_agency_additional_override", TYPO,
     "person@example.org", "2026-07-09T00:37:42.376764+00:00"),
    (CV + "Water Treatment Facilities", "issuing_agency_additional_override", TYPO,
     "person@example.org", "2026-07-09T00:38:14.078346+00:00"),
    (CV + "Water Treatment Facilities", "issuing_agency_override",
     "California State Water Resources Control Board (SWRCB)", "person@example.org",
     "2026-07-09T00:38:14.063018+00:00"),
]
CVMA = {
    "name": "cvma", "forward": "kb/migrations/2026-11-14_s649_cvma_three_rows.sql",
    "rollback": "kb/migrations/2026-11-14_s649_cvma_three_rows_rollback.sql",
    "rows": CVMA_ROWS, "changed_keys": [(r[0], r[1]) for r in CVMA_ROWS[:3]],
    "reviewer_placeholder": True,
    "refusals": {
        "a veterinary row was already corrected": "update kb_curation set value = 'California Veterinary Medical "
            "Association (CVMA)' where course_id like '%Emergency Procedures' and field = "
            "'issuing_agency_additional_override'",
        "the Water Treatment row names another agency": "update kb_curation set value = 'Another Agency' where "
            "course_id like '%Water Treatment Facilities' and field = 'issuing_agency_additional_override'",
        "a row is a bot's": "update kb_curation set reviewer_email = 'somebody@bot' where course_id like "
                            "'%Instrumentation and Safety'",
        "a row was re-saved since": "update kb_curation set reviewed_at = now() where course_id like "
                                    "'%Water Treatment Facilities' and field = 'issuing_agency_additional_override'",
        "a row is gone": "delete from kb_curation where course_id like '%Instrumentation and Safety'",
        "a person validated a row": "update kb_curation set validated_at = now(), validated_by = 'someone' where "
                                    "course_id like '%Emergency Procedures' and field = "
                                    "'issuing_agency_additional_override'",
        "a row names a validator without a stamp": "update kb_curation set validated_by = 'someone' where course_id "
                                                   "like '%Water Treatment Facilities' and field = "
                                                   "'issuing_agency_additional_override'",
        "a row was saved by another person": "update kb_curation set reviewer_email = 'another.person@college.edu' "
                                             "where course_id like '%Instrumentation and Safety'",
    },
}
if os.path.exists(os.path.join(ROOT, CVMA["forward"])):
    PAIRS.append(CVMA)
# S652: Sam's Sheet 197 card 2 ("delete") removes the June auto-merge's two Honors rows. The planned state carries the
# rows around them that must survive: the bases' title and discipline rows, the other pointers into each base under
# the same reviewer and stamp, and an unrelated person's row.
AM, AM_AT = "automerge-v1" + "@bot", "2026-06-12T22:47:01.69179+00:00"
HONORS_ROWS = [
    ("HUMA M10ME", "merge_into", "HUMA M1110", AM, AM_AT),
    ("LIBR M10CJ", "merge_into", "LIBR M1040", AM, AM_AT),
    ("PHIL M1116", "merge_into", "HUMA M1110", AM, AM_AT),
    ("LIBR M10CS", "merge_into", "LIBR M1040", AM, AM_AT),
    ("LIBR M10CR", "merge_into", "LIBR M1040", AM, AM_AT),
    ("LIBR M1040", "unified_title", "Media & Information Literacy (Honors)", AM, AM_AT),
    ("HUMA M1110", "unified_title", "World Religions (Honors)", AM, AM_AT),
    ("HUMA M1110", "discipline", "Religious Studies", "trailcrew-ccr3-s112@bot", "2026-07-12T21:17:48.970211+00:00"),
    ("BUSI M1228", "discipline", "Business", "someone@college.edu", "2026-10-01T00:00:00+00:00"),
]
HONORS = {
    "name": "honors", "forward": "kb/migrations/2026-11-14_s652_honors_two_row_delete.sql",
    "rollback": "kb/migrations/2026-11-14_s652_honors_two_row_delete_rollback.sql",
    "rows": HONORS_ROWS, "changed_keys": [("HUMA M10ME", "merge_into"), ("LIBR M10CJ", "merge_into")],
    "refusals": {
        "one row's value differs": "update kb_curation set value = 'HUMA M1111' where course_id = 'HUMA M10ME'",
        "one row's reviewer differs": "update kb_curation set reviewer_email = 'someone@college.edu' "
                                      "where course_id = 'LIBR M10CJ'",
        "one row was re-saved since": "update kb_curation set reviewed_at = now() where course_id = 'HUMA M10ME'",
        "a person validated one row": "update kb_curation set validated_at = now(), validated_by = 'someone' "
                                      "where course_id = 'LIBR M10CJ'",
        "one row names a validator without a stamp": "update kb_curation set validated_by = 'someone' "
                                                     "where course_id = 'HUMA M10ME'",
        "one row is gone": "delete from kb_curation where course_id = 'LIBR M10CJ'",
        "a person saved a row on a base": "update kb_curation set reviewer_email = 'someone@college.edu' "
                                          "where course_id = 'HUMA M1110' and field = 'discipline'",
        "a person saved a row on a leaf": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                          "values ('LIBR M10CJ', 'description', 'x', 'someone@college.edu')",
        "a person merged a course into a base": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                                "values ('LIBR M10ZZ', 'merge_into', 'LIBR M1040', "
                                                "'someone@college.edu')",
        "a person's Keep as-is names a leaf": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                              "values ('UC:y', 'merge_dismissed', 'HUMA M10ME|HUMA M1110', "
                                              "'someone@college.edu')",
        "a bot points into a leaf": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                    "values ('HUMA M10ZZ', 'merge_into', 'HUMA M10ME', 'somebody@bot')",
        "a CN: row re-homes an Honors course": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                               "values ('CN:CCC000572223', 'merge_into', 'LIBR M1040', "
                                               "'somebody@bot')",
    },
}
if os.path.exists(os.path.join(ROOT, HONORS["forward"])):
    PAIRS.append(HONORS)
# S652 follow-ups: on the post-delete state, the bases' two Honors titles lose "(Honors)" (value alone) and two Keep
# as-is rows hold the pairs apart (cohort honors-s652@bot).
FOLLOWUP_ROWS = [r for r in HONORS_ROWS if r[0] not in ("HUMA M10ME", "LIBR M10CJ")]
FOLLOWUPS = {
    "name": "honors follow-ups", "forward": "kb/migrations/2026-11-14_s652_honors_followups.sql",
    "rollback": "kb/migrations/2026-11-14_s652_honors_followups_rollback.sql",
    "rows": FOLLOWUP_ROWS,
    "changed_keys": [("HUMA M1110", "unified_title"), ("LIBR M1040", "unified_title"),
                     ("HUMA M10ME", "merge_dismissed"), ("LIBR M1040", "merge_dismissed")],
    "refusals": {
        "a base title was changed since": "update kb_curation set value = 'World Religions' "
                                          "where course_id = 'HUMA M1110' and field = 'unified_title'",
        "a base title's reviewer differs": "update kb_curation set reviewer_email = 'someone@college.edu' "
                                           "where course_id = 'LIBR M1040' and field = 'unified_title'",
        "a base title was re-saved since": "update kb_curation set reviewed_at = now() "
                                           "where course_id = 'LIBR M1040' and field = 'unified_title'",
        "a person validated a base title": "update kb_curation set validated_at = now(), validated_by = 'someone' "
                                           "where course_id = 'HUMA M1110' and field = 'unified_title'",
        "a base title is gone": "delete from kb_curation where course_id = 'HUMA M1110' and field = 'unified_title'",
        "the delete has not landed": "insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at) "
                                     "values ('LIBR M10CJ', 'merge_into', 'LIBR M1040', '" + AM + "', '" + AM_AT + "')",
        "a dismissal slot is taken": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                     "values ('LIBR M1040', 'merge_dismissed', 'LIBR M1040|LIBR M10CS', "
                                     "'somebody@bot')",
        "a person saved a row on a base": "update kb_curation set reviewer_email = 'someone@college.edu' "
                                          "where course_id = 'HUMA M1110' and field = 'discipline'",
    },
}
if os.path.exists(os.path.join(ROOT, FOLLOWUPS["forward"])):
    PAIRS.append(FOLLOWUPS)

# S653, step 1 of the Honors build (a draft, not in .apply): on the post-follow-up state, the two retitled base rows
# are restamped honors-s652@bot and the first two honors_of rows land (cohort honors-s653@bot).
HS = "honors-s652" + "@bot"
FIELD_ROWS = [r for r in FOLLOWUP_ROWS if r[1] != "unified_title"] + [
    ("LIBR M1040", "unified_title", "Media & Information Literacy", AM, AM_AT),
    ("HUMA M1110", "unified_title", "World Religions", AM, AM_AT),
    ("HUMA M10ME", "merge_dismissed", "HUMA M10ME|HUMA M10OI|HUMA M1110", HS, "2026-11-14T15:21:04.075029+00:00"),
    ("LIBR M1040", "merge_dismissed", "LIBR M1040|LIBR M10CJ", HS, "2026-11-14T15:21:04.075029+00:00"),
]
FIELD = {
    "name": "honors_of field", "forward": "kb/migrations/2026-11-14_s653_honors_of_field.sql",
    "rollback": "kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql",
    "rows": FIELD_ROWS,
    "changed_keys": [("HUMA M1110", "unified_title"), ("LIBR M1040", "unified_title"),
                     ("HUMA M10ME", "honors_of"), ("LIBR M10CJ", "honors_of")],
    "refusals": {
        "a base title was changed since": "update kb_curation set value = 'World Religion' "
                                          "where course_id = 'HUMA M1110' and field = 'unified_title'",
        "a base title was re-saved since": "update kb_curation set reviewed_at = now() "
                                           "where course_id = 'LIBR M1040' and field = 'unified_title'",
        "a person validated a base title": "update kb_curation set validated_at = now(), validated_by = 'someone' "
                                           "where course_id = 'HUMA M1110' and field = 'unified_title'",
        "an honors_of row already exists": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                           "values ('MATH M10ZZ', 'honors_of', 'MATH M1036', 'somebody@bot')",
        "the delete was undone": "insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at) "
                                 "values ('HUMA M10ME', 'merge_into', 'HUMA M1110', '" + AM + "', '" + AM_AT + "')",
        "a person saved a row on a base": "update kb_curation set reviewer_email = 'someone@college.edu' "
                                          "where course_id = 'HUMA M1110' and field = 'discipline'",
        "a person merged a course into a base": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                                "values ('LIBR M10ZZ', 'merge_into', 'LIBR M1040', "
                                                "'someone@college.edu')",
    },
}
if os.path.exists(os.path.join(ROOT, FIELD["forward"])):
    PAIRS.append(FIELD)

# S653, step 2 (a draft): the honors_of rows for every pair the plan writes, insert-only under its own cohort, on the
# state step 1 leaves. Redrawn for #3315's review: the person guard holds a pair only where a merge joins it, so the
# overlay's person merges into planned ids today must PASS; the result is a count and a digest; the rollback keys on the
# cohort and the field.
_OUT = os.path.join(ROOT, "kb", "honors_of_s653_out")
_DATED = sorted(n for n in (os.listdir(_OUT) if os.path.isdir(_OUT) else [])
                if os.path.exists(os.path.join(_OUT, n, "plan.json")))
PLAN_DIR = os.path.join(_OUT, _DATED[-1]) if _DATED else None   # the newest plan, as --check reads it
ROWS_FWD = "kb/migrations/2026-11-14_s653_honors_of_rows.sql"
ROWS_RB = "kb/migrations/2026-11-14_s653_honors_of_rows_rollback.sql"
STEP1_COHORT, ROWS_COHORT = "honors-s653" + "@bot", "honors-rows-s653" + "@bot"
STEP1_AT = "2026-11-14T18:30:00+00:00"
STEP1_DONE = [r for r in FIELD_ROWS if r[1] != "unified_title"] + [
    ("LIBR M1040", "unified_title", "Media & Information Literacy", HS, STEP1_AT),
    ("HUMA M1110", "unified_title", "World Religions", HS, STEP1_AT),
    ("HUMA M10ME", "honors_of", "HUMA M1110", STEP1_COHORT, STEP1_AT),
    ("LIBR M10CJ", "honors_of", "LIBR M1040", STEP1_COHORT, STEP1_AT),
]
PLANNED, PERSON_MERGES = [], []
if os.path.exists(os.path.join(ROOT, ROWS_FWD)):
    import re as _re
    _src = open(os.path.join(ROOT, ROWS_FWD), encoding="utf-8").read()
    _planned = _re.search(r"planned \(course_id, value\) as \(\s*values\s*(.*?)\n\),", _src, _re.S).group(1)
    PLANNED = _re.findall(r"\('([^']+)', '([^']+)'\)", _planned)
    _named = {i for p in PLANNED for i in p}
    # Today's person merges whose value names a planned id (the overlay's view; the reviewer is a placeholder). The
    # old guard refused the whole insert on these; the redrawn one must pass them.
    _cur = json.load(open(os.path.join(ROOT, "kb", "coci_curation.json"), encoding="utf-8"))["curations"]
    PERSON_MERGES = sorted((k, "merge_into", v["merge_into"], "someone@college.edu", "2026-10-01T00:00:00+00:00")
                           for k, v in _cur.items()
                           if v.get("merge_into") in _named and v.get("reviewed_by")
                           and not str(v["reviewed_by"]).endswith("@bot"))
    _h0, _b0 = PLANNED[0]
    _h1, _b1 = PLANNED[1]
    PAIRS.append({
        "name": "honors_of rows", "forward": ROWS_FWD, "rollback": ROWS_RB,
        "rows": STEP1_DONE + PERSON_MERGES, "changed_keys": [(h, "honors_of") for h, _ in PLANNED],
        "result": "digest",
        "refusals": {
            "step 1 has not landed": "delete from kb_curation where field = 'honors_of'",
            "another honors_of row exists": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                            "values ('MATH M10ZZ', 'honors_of', 'MATH M1036', 'somebody@bot')",
            "a planned Honors id already holds a row (a person's honors_of)":
                "insert into kb_curation (course_id, field, value, reviewer_email) "
                f"values ('{_h0}', 'honors_of', '{_b0}', 'someone@college.edu')",
            "a named id was merged away by a bot": "insert into kb_curation (course_id, field, value, reviewer_email) "
                                                   f"values ('{_b1}', 'merge_into', 'ZZZZ M1999', 'somebody@bot')",
            "a person merged the Honors id into its base": "insert into kb_curation (course_id, field, value, "
                                                           f"reviewer_email) values ('{_h0}', 'merge_into', '{_b0}', "
                                                           "'someone@college.edu')",
            "a person merged the Honors id into a course that ends at its base":
                "insert into kb_curation (course_id, field, value, reviewer_email) values "
                f"('{_h0}', 'merge_into', 'ZZZZ M1998', 'someone@college.edu'), "
                f"('ZZZZ M1998', 'merge_into', '{_b0}', 'somebody@bot')",
            "a curator's pending unified_title_merge_confirm names a planned id (Rule 10 a)":
                "insert into kb_curation (course_id, field, value, reviewer_email) "
                f"values ('{_h1}', 'unified_title_merge_confirm', 'ZZZZ M1996', 'someone@college.edu')",
            "a row is keyed on an H id (the step-4 mint has landed)":
                "insert into kb_curation (course_id, field, value, reviewer_email) "
                "values ('ZZZZ M1995H', 'honors_of', 'ZZZZ M1995', 'somebody@bot')",
        },
        # Each must refuse when the file itself is edited: the guard re-reads its own planned rows.
        "sql_refusals": {
            "a planned row was edited after the plan (the count and digest)": (f"('{_h0}', '{_b0}')", f"('{_h0}', 'ZZZZ M1997')"),
        },
    })


def code_only(sql):
    return "\n".join(l for l in sql.splitlines() if not l.lstrip().startswith("--"))


def psql(db, sql, ok_fail=False):
    r = subprocess.run(["psql", "-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-d", db], input=sql,
                       capture_output=True, text=True)
    if r.returncode and not ok_fail:
        raise RuntimeError(r.stderr.strip())
    return r.returncode, r.stdout.strip(), r.stderr.strip()


def state(db):
    _, out, _ = psql(db, "select coalesce(jsonb_agg(to_jsonb(k) order by course_id, field), '[]') from kb_curation k;")
    return json.loads(out)


def seed(db, rows, reviewer=None):
    psql(db, "drop table if exists public.kb_curation;" + SCHEMA)
    vals = ",\n".join("(%s)" % ", ".join("'" + str(v).replace("'", "''") + "'" for v in
                                          (r[:3] + ((reviewer or r[3]),) + r[4:])) for r in rows)
    psql(db, "insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at) values " + vals + ";")


def sequences(db, results):
    """S653: the Honors steps run in order and undone in reverse, across a mint's re-key (#3315's review, items 2-6)."""
    if not PLANNED or not os.path.exists(os.path.join(ROOT, FIELD["forward"])):
        return
    sql = {k: open(os.path.join(ROOT, v), encoding="utf-8").read() for k, v in {
        "s652_rb": FOLLOWUPS["rollback"], "step1": FIELD["forward"], "step1_rb": FIELD["rollback"],
        "step2": ROWS_FWD, "step2_rb": ROWS_RB}.items()}
    plan = json.load(open(os.path.join(PLAN_DIR, "plan.json"), encoding="utf-8"))
    before_file = json.load(open(os.path.join(ROOT, "kb", "honors_of_s653_out", "2026-11-14",
                                              "step1_restamp_before.json"), encoding="utf-8"))["rows"]
    name = "honors sequence: "

    def run(key):
        return psql(db, sql[key], ok_fail=True)

    def count(where):
        return int(psql(db, "select count(*) from kb_curation where " + where + ";")[1])

    def titles():
        return sorted((r["course_id"], r["value"], r["reviewer_email"], r["reviewed_at"])
                      for r in state(db) if r["field"] == "unified_title")

    # 1. The committed before-values are what step 1's guard expects and what its rollback restores.
    seed(db, FIELD_ROWS)
    start = state(db)
    got = [{k: r[k] for k in ("course_id", "field", "value", "reviewer_email", "validated_at", "validated_by")}
           for r in start if r["field"] == "unified_title"]
    want = [{k: r[k] for k in ("course_id", "field", "value", "reviewer_email", "validated_at", "validated_by")}
            for r in before_file]
    results.append((name + "step1_restamp_before.json is the state step 1 reads",
                    sorted(got, key=str) == sorted(want, key=str)
                    and all(r["reviewed_at"].startswith("2026-06-12T22:47:01.69179") for r in start
                            if r["field"] == "unified_title"), got))
    # 2. Run after step 1, the S652 follow-ups rollback refuses and changes nothing (it used to exit 0 having
    #    deleted both Keep as-is rows and restored no title).
    run("step1")
    s1 = state(db)
    c, _, e = run("s652_rb")
    results.append((name + "after step 1 the S652 follow-ups rollback refuses and changes nothing",
                    c != 0 and "refused by the guard" in e and state(db) == s1, e[:200] or "it ran"))
    # 3. A person edits a title after step 1: the step-1 rollback refuses rather than restore one title of two.
    psql(db, "update kb_curation set value = 'World Religions!', reviewer_email = 'someone@college.edu' "
             "where course_id = 'HUMA M1110' and field = 'unified_title';")
    s1p = state(db)
    c, _, e = run("step1_rb")
    results.append((name + "a person's later title edit makes the step-1 rollback refuse, whole",
                    c != 0 and "refused by the guard" in e and state(db) == s1p, e[:200] or "it ran"))
    # 4. Last in, first out: with step 2 applied, the step-1 rollback refuses.
    seed(db, FIELD_ROWS + PERSON_MERGES)
    c1, _, e1 = run("step1")
    c2, out2, e2 = run("step2")
    results.append((name + f"steps 1 and 2 apply beside today's {len(PERSON_MERGES)} person merges into planned ids",
                    c1 == 0 and c2 == 0 and count("field = 'honors_of'") == len(PLANNED) + 2,
                    (e1 or e2)[:200]))
    s2 = state(db)
    c, _, e = run("step1_rb")
    results.append((name + "the step-1 rollback refuses while a step-2 row stands",
                    c != 0 and "refused by the guard" in e and state(db) == s2, e[:200] or "it ran"))
    # 5. A mint re-keys the rows: each 'row and mint' Honors id moves to its H id, one to one, by the live re-key's
    #    rule (every field of the key moves). No key collides; each follower then merges into its lead's H id.
    mints = {p["honors_id"]: p["proposed_h_id"] for p in plan["pairs"] if p["action"] == "row and mint"}
    folds = {p["honors_id"]: p["fold_into"] for p in plan["pairs"] if p["action"].startswith("row, fold")}
    results.append((name + "the mint's alias map is one to one (no two Honors ids onto one H id)",
                    len(set(mints.values())) == len(mints) and not set(mints.values()) & set(mints), len(mints)))
    pairs_sql = ",".join(f"('{a}','{b}')" for a, b in sorted(mints.items()))
    c, _, e = psql(db, f"update kb_curation k set course_id = m.new from (values {pairs_sql}) as m(old, new) "
                       "where k.course_id = m.old;", ok_fail=True)
    fold_sql = ",".join(f"('{a}','merge_into','{b}','somebody@bot')" for a, b in sorted(folds.items()))
    c3, _, e3 = psql(db, "insert into kb_curation (course_id, field, value, reviewer_email) values " + fold_sql + ";",
                     ok_fail=True) if folds else (0, "", "")
    moved = count("field = 'honors_of' and course_id like '% M____H'")
    results.append((name + "the re-key and the follower merges hit no key", c == 0 and c3 == 0 and moved == len(mints),
                    (e or e3)[:200] or moved))
    # 6. After the mint, the step-2 rollback refuses and changes nothing (COBIx: a minted H id would lose its
    #    honors_of row while the pair hold stands on the field), and so does the step-1 rollback.
    minted_state = state(db)
    c, _, e = run("step2_rb")
    results.append((name + "after the mint the step-2 rollback refuses on the mint's marker and changes nothing",
                    c != 0 and "refused by the guard" in e and "H id" in e and state(db) == minted_state,
                    e[:200] or "it ran"))
    c, _, e = run("step1_rb")
    results.append((name + "after the mint the step-1 rollback refuses too, and changes nothing",
                    c != 0 and "refused by the guard" in e and state(db) == minted_state, e[:200] or "it ran"))
    # 7. The mint's own rollback (its inverse alias map, and the follower merges removed) runs first; then the
    #    step-2 rollback leaves zero rows of its cohort.
    back_sql = ",".join(f"('{b}','{a}')" for a, b in sorted(mints.items()))
    psql(db, "delete from kb_curation where field = 'merge_into' and reviewer_email = 'somebody@bot';")
    psql(db, f"update kb_curation k set course_id = m.new from (values {back_sql}) as m(old, new) "
             "where k.course_id = m.old;")
    c, out, e = run("step2_rb")
    left = count(f"reviewer_email = '{ROWS_COHORT}'")
    results.append((name + "after the mint's own rollback the step-2 rollback leaves zero rows of its cohort",
                    c == 0 and left == 0 and json.loads(out.splitlines()[-1]).get("deleted") == len(PLANNED),
                    (e or out)[:200]))
    # 8. Then the step-1 rollback removes its rows by cohort and restores both titles, and the S652 follow-ups
    #    rollback runs last, restoring the "(Honors)" titles.
    c, _, e = run("step1_rb")
    results.append((name + "the step-1 rollback then removes its rows by cohort and restores both titles",
                    c == 0 and count("field = 'honors_of'") == 0
                    and titles() == sorted((r[0], r[2], r[3], "2026-06-12T22:47:01.69179+00:00")
                                           for r in FIELD_ROWS if r[1] == "unified_title"), e[:200] or titles()))
    c, _, e = run("s652_rb")
    results.append((name + "the S652 follow-ups rollback then runs and restores both titles",
                    c == 0 and count("field = 'merge_dismissed'") == 0
                    and all(t[1].endswith("(Honors)") for t in titles()), e[:200] or titles()))
    # 9. A person's Verify stamps every row of a course, honors_of included (#3315's review): each rollback keeps the
    #    row a person validated and counts it, the rest of its cohort goes, and the kept row blocks no later
    #    rollback. No row is deleted by hand (#3315's third review, finding 7).
    seed(db, FIELD_ROWS + PERSON_MERGES)
    run("step1")
    run("step2")
    h0 = PLANNED[0][0]
    psql(db, "update kb_curation set validated_at = now(), validated_by = 'someone@college.edu' "
             f"where course_id in ('{h0}', 'HUMA M10ME');")
    c, out, e = run("step2_rb")
    res = json.loads(out.splitlines()[-1]) if c == 0 and out else {}
    results.append((name + "the step-2 rollback keeps a row a person verified and counts it",
                    c == 0 and res.get("kept_for_a_person") == 1 and res.get("deleted") == len(PLANNED) - 1
                    and count(f"course_id = '{h0}' and field = 'honors_of'") == 1, (e or out)[:300]))
    c, out, e = run("step1_rb")
    res = json.loads(out.splitlines()[-1]) if c == 0 and out else {}
    results.append((name + "with that kept step-2 row standing, the step-1 rollback runs and keeps its own verified row",
                    c == 0 and res.get("kept_for_a_person") == 1
                    and count("course_id = 'HUMA M10ME' and field = 'honors_of'") == 1
                    and count("course_id = 'LIBR M10CJ' and field = 'honors_of'") == 0
                    and count(f"course_id = '{h0}' and field = 'honors_of'") == 1, (e or out)[:300]))
    c, _, e = run("s652_rb")
    # The Verify stamped HUMA M10ME's Keep as-is too, so the S652 rollback keeps that one and counts it.
    results.append((name + "and the S652 follow-ups rollback runs after it, keeping the verified Keep as-is",
                    c == 0 and count("field = 'merge_dismissed'") == 1
                    and count("field = 'merge_dismissed' and course_id = 'HUMA M10ME'") == 1
                    and all(t[1].endswith("(Honors)") for t in titles()), e[:200] or titles()))
    # 10. One Verify on a step-2 row alone: all three rollbacks run; only that row remains.
    seed(db, FIELD_ROWS + PERSON_MERGES)
    run("step1")
    run("step2")
    psql(db, "update kb_curation set validated_at = now(), validated_by = 'someone@college.edu' "
             f"where course_id = '{h0}' and field = 'honors_of';")
    codes = [run(k)[0] for k in ("step2_rb", "step1_rb", "s652_rb")]
    results.append((name + "one Verify on a step-2 row blocks neither the step-1 nor the S652 rollback",
                    codes == [0, 0, 0] and count("field = 'honors_of'") == 1
                    and count(f"course_id = '{h0}' and field = 'honors_of'") == 1
                    and all(t[1].endswith("(Honors)") for t in titles()), codes))


def main():
    if subprocess.run(["psql", "-X", "-At", "-d", "postgres", "-c", "select 1"], capture_output=True).returncode:
        print("SKIP: no Postgres reachable (set PGHOST/PGPORT); kb_curation_guarded_sql_proof.py proves nothing here")
        return 0
    db = "proof_" + uuid.uuid4().hex[:8]
    subprocess.run(["createdb", db], check=True)
    results = []
    try:
        for p in PAIRS:
            fwd = open(os.path.join(ROOT, p["forward"]), encoding="utf-8").read()
            rb = open(os.path.join(ROOT, p["rollback"]), encoding="utf-8").read()
            reviewer = None
            if p.get("reviewer_placeholder"):
                # the rows are a person's: seed them under the address the rollback restores, so "restores
                # exactly" is tested against the reviewer the live rows carry
                import re
                m = re.search(r"'([^'\s@]+@[^'\s@]+\.[a-z]+)'", code_only(rb))
                reviewer = m.group(1) if m else None
            seed(db, p["rows"], reviewer)
            before = state(db)
            code, out, err = psql(db, fwd, ok_fail=True)
            after = state(db)
            changed = {(r["course_id"], r["field"]) for r in before} ^ {(r["course_id"], r["field"]) for r in after}
            changed |= {(a["course_id"], a["field"]) for a in after for b in before
                        if (a["course_id"], a["field"]) == (b["course_id"], b["field"]) and a != b}
            results.append((p["name"] + ": the forward file runs on the planned state", code == 0, err))
            results.append((p["name"] + ": it changes exactly the planned keys",
                            changed == set(p["changed_keys"]), sorted(changed)))
            res = json.loads(out.splitlines()[-1]) if code == 0 and out else []
            if p.get("result") == "digest":
                results.append((p["name"] + ": its result is a count and a digest, small enough for the receipt",
                                isinstance(res, dict) and res.get("inserted") == len(p["changed_keys"])
                                and len(out) < 4000, out[:300]))
            else:
                results.append((p["name"] + ": its result carries one before-image per changed row",
                                len(res) == len(p["changed_keys"]), out[:300]))
            code2, _, err2 = psql(db, rb, ok_fail=True)
            restored = state(db)
            results.append((p["name"] + ": the rollback restores every row exactly (to_jsonb equal)",
                            code2 == 0 and restored == before, err2 or "differs"))
            for why, breaker in p["refusals"].items():
                seed(db, p["rows"], reviewer)
                psql(db, breaker + ";")
                broken = state(db)
                c, _, e = psql(db, fwd, ok_fail=True)
                results.append((p["name"] + ": the guard refuses when " + why + ", and writes nothing",
                                c != 0 and "refused by the guard" in e and state(db) == broken, e[:200] or "it ran"))
            for why, (old, new) in (p.get("sql_refusals") or {}).items():
                seed(db, p["rows"], reviewer)
                broken = state(db)
                c, _, e = psql(db, fwd.replace(old, new, 1), ok_fail=True)
                results.append((p["name"] + ": the guard refuses when " + why + ", and writes nothing",
                                fwd.count(old) >= 1 and c != 0 and "refused by the guard" in e and state(db) == broken,
                                e[:200] or "it ran"))
        sequences(db, results)
    finally:
        subprocess.run(["dropdb", db])
    bad = [r for r in results if not r[1]]
    for name, ok, why in results:
        print(("  ok  " if ok else "  FAIL ") + name + ("" if ok else "\n        " + str(why)))
    print("\nkb_curation_guarded_sql_proof.py: %d/%d checks passed" % (len(results) - len(bad), len(results)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
