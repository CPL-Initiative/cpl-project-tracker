#!/usr/bin/env python3
"""Run the S649 guarded kb_curation migrations against a throwaway Postgres: each guard refuses, each rollback restores.

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
            imgs = json.loads(out.splitlines()[-1]) if code == 0 and out else []
            results.append((p["name"] + ": its result carries one before-image per changed row",
                            len(imgs) == len(p["changed_keys"]), out[:300]))
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
    finally:
        subprocess.run(["dropdb", db])
    bad = [r for r in results if not r[1]]
    for name, ok, why in results:
        print(("  ok  " if ok else "  FAIL ") + name + ("" if ok else "\n        " + str(why)))
    print("\nkb_curation_guarded_sql_proof.py: %d/%d checks passed" % (len(results) - len(bad), len(results)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
