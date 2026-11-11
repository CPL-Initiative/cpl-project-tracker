#!/usr/bin/env python3
"""Turn a saved fold into a declared family title into a family tag: the plan, its receipt and its rollback.

WHY. Sam saved 31 folds into "ASE Certificate Bundles" on 2026-11-11 (unified_title_override plus
unified_title_merge_confirm under `_CREDENTIAL_REVIEW::<title>`). He then ruled (in session; cpl_memory
`sam-bundle-family-is-a-field-2026-11-11`) that each bundle STAYS its own canonical title and gains a family,
because a fold put unlike bundles on one card and nine surfaces misread adoption. His saved rows are read as
family tags, not merges. kb/reference/credential_families.json declares the families.

WHAT IT WRITES (nothing to Supabase; a person reviews and runs the SQL):
  plan.sql      one transaction. Per member title, all or nothing: a check first lists the title as skipped when
                its rows are no longer exactly the rows read (a fold row re-saved, added or gone, or a credential_family
                row already there); otherwise it INSERTs a `credential_family` row under the cohort
                CREDENTIAL_FAMILY_COHORT and DELETEs the title's unified_title_override and unified_title_merge_confirm
                rows. The read-back lists each title as converted or skipped.
  rollback.sql  per title, all or nothing: deletes the cohort's credential_family row and re-inserts every deleted
                row's image (INSERTABLE columns only; reviewer_label is generated), unless a person has saved on the
                title since, which skips it whole and lists it.
  receipt.json  the live rows read (full images, the before-values), what each title becomes, what is held.

HELD for Sam, untouched (the conductor's scope, 2026-11-11): the ASE Master titles stay their own titles and
are not family members by default, and "Advanced Electrical and Electronic Systems" and "ASE Certification
(any A1–A8)" are not bundles of named tests. Any other title whose saved override names a family but whose own
title names no test mix (kb/test_mix.py) is held the same way.

Usage:
  python3 kb/_family_tag_plan.py --rows LIVE_ROWS.json            (dry run: prints the plan)
  python3 kb/_family_tag_plan.py --rows LIVE_ROWS.json --write [--out DIR]
LIVE_ROWS.json is the result of: select * from kb_curation where course_id like '\\_CREDENTIAL\\_REVIEW::%'
and field in ('unified_title_override','unified_title_merge_confirm','credential_family'), read at write time.
"""
import argparse
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import test_mix  # noqa: E402

PREFIX = "_CREDENTIAL_REVIEW::"
FAMILIES = os.path.join(HERE, "reference", "credential_families.json")
CREDENTIAL_FAMILY_COHORT = "credential-family-s638@bot"
SOURCE = "Sam, 2026-11-11, in session: each ASE bundle stays its own title and carries the family " \
         "(cpl_memory sam-bundle-family-is-a-field-2026-11-11); his saved folds are read as family tags."
FOLD_FIELDS = ("unified_title_override", "unified_title_merge_confirm")
HOLD = {
    "ASE Master Automobile Technician": "Master stays its own title (ruling 3: ASE awards it)",
    "ASE Master Automobile Technician (A1–A8 + L1)": "Master stays its own title (ruling 3: ASE awards it)",
    "ASE Master Automobile Technician (A1–A8) or L3": "Master stays its own title (ruling 3: ASE awards it)",
    "ASE Master Medium/Heavy Truck Technician (T1–T8)": "Master stays its own title (ruling 3: ASE awards it)",
    "Advanced Electrical and Electronic Systems": "not a bundle of named tests",
    "ASE Certification (any A1–A8)": "not a bundle of named tests: any one test qualifies",
}


def families(path=FAMILIES):
    with open(path, encoding="utf-8") as f:
        return json.load(f).get("families") or {}


def q(v):
    """A SQL literal."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (dict, list)):
        v = json.dumps(v, ensure_ascii=False)
    return "'" + str(v).replace("'", "''") + "'"


def plan(rows, fams):
    """{"convert": [{title, family, rows}], "held": [{title, family, why, rows}], "already": [...]}"""
    by = {}
    for r in rows:
        cid = r.get("course_id") or ""
        if cid.startswith(PREFIX):
            by.setdefault(cid[len(PREFIX):], []).append(r)
    out = {"convert": [], "held": [], "already": []}
    for title in sorted(by):
        rs = by[title]
        ov = [r for r in rs if r.get("field") == "unified_title_override" and r.get("value") in fams]
        if not ov:
            continue
        fam = ov[0]["value"]
        fold = [r for r in rs if r.get("field") in FOLD_FIELDS and r.get("value") == fam]
        tagged = [r for r in rs if r.get("field") == "credential_family"]
        item = {"title": title, "family": fam, "rows": fold}
        if title == fam:
            continue
        if title in HOLD:
            out["held"].append(dict(item, why=HOLD[title]))
        elif not test_mix.from_title(title):
            out["held"].append(dict(item, why="its title names no test mix"))
        elif tagged:
            out["already"].append(dict(item, existing=tagged))
        else:
            out["convert"].append(item)
    return out


# kb_curation's columns (kb/supabase_curation_setup.sql plus the later migrations). A re-insert names only the
# columns a person's save can carry; reviewer_label is `generated always ... stored`
# (kb/migrations/2026-11-09_kb_curation_reviewer_label.sql) and Postgres refuses any value for it, which aborted the
# whole rollback (#3117 review). A column this list does not know stops the plan rather than being dropped unread.
INSERTABLE = ("course_id", "field", "value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")
GENERATED = ("reviewer_label",)
SKIP = "_family_skip"


def image_cols(r):
    unknown = sorted(set(r) - set(INSERTABLE) - set(GENERATED))
    if unknown:
        raise SystemExit("kb_curation row carries columns this plan does not know: %s. Classify them in INSERTABLE "
                         "or GENERATED before writing a rollback." % ", ".join(unknown))
    return [c for c in INSERTABLE if c in r]


def _same(cid, r):
    """True for the live row that is exactly the row read: its field, value, reviewer and reviewed_at."""
    return ("(field = %s and value = %s and reviewer_email = %s and reviewed_at = %s::timestamptz)"
            % (q(r["field"]), q(r["value"]), q(r["reviewer_email"]), q(r["reviewed_at"])))


def _fold_in(cid):
    return "course_id = %s and field in (%s)" % (q(cid), ", ".join(q(f) for f in FOLD_FIELDS))


def plan_sql(p):
    """One transaction. Per title, a check first records whether the title's rows are still exactly the rows read
    (every fold row, nothing added, no credential_family row yet); only then the insert and the deletes run, each
    gated on that one record, so a title converts whole or not at all (#3117 review). Skipped titles are listed."""
    lines = ["-- Family tags for the saved folds into a declared family title (kb/_family_tag_plan.py).",
             "-- " + SOURCE,
             "-- Rule 10: insert-only under %s. Per title, all or nothing: a title whose rows changed since the read"
             % CREDENTIAL_FAMILY_COHORT,
             "-- (a fold row re-saved, added or removed, or a credential_family row already there) is skipped whole and",
             "-- listed at the end. Rollback: rollback.sql beside this file (row images in receipt.json).",
             "begin;",
             "create temp table %s (course_id text primary key, why text);" % SKIP]
    for it in p["convert"]:
        cid = PREFIX + it["title"]
        rows = sorted(it["rows"], key=lambda r: r["field"])
        lines.append("")
        lines.append("-- %s -> family %s" % (it["title"], it["family"]))
        lines.append("insert into %s (course_id, why) select %s, 'rows changed since the read'" % (SKIP, q(cid)))
        lines.append(" where (select count(*) from public.kb_curation where %s) <> %d" % (_fold_in(cid), len(rows)))
        lines.append("    or (select count(*) from public.kb_curation where course_id = %s and (%s)) <> %d"
                     % (q(cid), " or ".join(_same(cid, r) for r in rows), len(rows)))
        lines.append("    or exists (select 1 from public.kb_curation where course_id = %s and field = 'credential_family');" % q(cid))
        lines.append("insert into public.kb_curation (course_id, field, value, reviewer_email)")
        lines.append("select %s, 'credential_family', %s, %s" % (q(cid), q(it["family"]), q(CREDENTIAL_FAMILY_COHORT)))
        lines.append(" where not exists (select 1 from %s where course_id = %s)" % (SKIP, q(cid)))
        lines.append("on conflict (course_id, field) do nothing;")
        lines.append("delete from public.kb_curation where %s" % _fold_in(cid))
        lines.append("   and not exists (select 1 from %s where course_id = %s);" % (SKIP, q(cid)))
    ids = ", ".join(q(PREFIX + it["title"]) for it in p["convert"])
    lines += ["", "-- Read back: expect %d converted and none skipped; a skipped title is untouched." % len(p["convert"]),
              "select 'skipped' as outcome, course_id, why from %s" % SKIP,
              "union all",
              "select 'converted', course_id, null from public.kb_curation",
              " where field = 'credential_family' and reviewer_email = %s and course_id in (%s)"
              % (q(CREDENTIAL_FAMILY_COHORT), ids),
              " order by 1, 2;",
              "drop table %s;" % SKIP,
              "commit;", ""]
    return "\n".join(lines)


def rollback_sql(p):
    """Per title, all or nothing: restore a title only while it still holds the cohort's family row and no fold row
    (a person's save since then wins, and the title is listed as skipped). Each re-insert names INSERTABLE columns."""
    lines = ["-- Rollback of plan.sql (kb/_family_tag_plan.py). Read live first (data_write_rollback.md).",
             "-- Per title: restored whole, or skipped whole and listed when a person has saved on it since.",
             "begin;",
             "create temp table %s (course_id text primary key, why text);" % SKIP]
    for it in p["convert"]:
        cid = PREFIX + it["title"]
        lines.append("")
        lines.append("-- %s" % it["title"])
        lines.append("insert into %s (course_id, why) select %s, 'saved on since the plan ran'" % (SKIP, q(cid)))
        lines.append(" where exists (select 1 from public.kb_curation where %s)" % _fold_in(cid))
        lines.append("    or not exists (select 1 from public.kb_curation where course_id = %s and field = 'credential_family'"
                     % q(cid))
        lines.append("                   and value = %s and reviewer_email = %s);" % (q(it["family"]), q(CREDENTIAL_FAMILY_COHORT)))
        lines.append("delete from public.kb_curation where course_id = %s and field = 'credential_family'" % q(cid))
        lines.append("   and reviewer_email = %s and not exists (select 1 from %s where course_id = %s);"
                     % (q(CREDENTIAL_FAMILY_COHORT), SKIP, q(cid)))
        for r in sorted(it["rows"], key=lambda r: r["field"]):
            cols = image_cols(r)
            lines.append("insert into public.kb_curation (%s)" % ", ".join(cols))
            lines.append("select %s where not exists (select 1 from %s where course_id = %s)"
                         % (", ".join(q(r[c]) for c in cols), SKIP, q(cid)))
            lines.append("on conflict (course_id, field) do nothing;")
    lines += ["", "select course_id, why from %s order by 1;" % SKIP, "drop table %s;" % SKIP, "commit;", ""]
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows", required=True)
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--out", default=os.path.join(ROOT, "kb", "receipts",
                                                  "credential_family_%s_s638" % date.today().isoformat()))
    a = ap.parse_args()
    rows = json.load(open(a.rows, encoding="utf-8"))
    p = plan(rows, families())
    print("convert %d titles, hold %d for Sam, already tagged %d" % (len(p["convert"]), len(p["held"]), len(p["already"])))
    for it in p["convert"]:
        print("  tag   %s  (%d fold rows to delete)" % (it["title"], len(it["rows"])))
    for it in p["held"]:
        print("  HOLD  %s  (%s)" % (it["title"], it["why"]))
    if not a.write:
        print("dry run: nothing written (pass --write)")
        return
    os.makedirs(a.out, exist_ok=True)
    open(os.path.join(a.out, "plan.sql"), "w", encoding="utf-8").write(plan_sql(p))
    open(os.path.join(a.out, "rollback.sql"), "w", encoding="utf-8").write(rollback_sql(p))
    receipt = {"_about": "Receipt for plan.sql: the live rows it read (full images, the before-values of every row "
                         "it deletes), what each title becomes, and what it holds for Sam. Written before the plan runs.",
               "source": SOURCE, "cohort": CREDENTIAL_FAMILY_COHORT, "rows_read": len(rows),
               "convert": p["convert"], "held": p["held"], "already": p["already"]}
    with open(os.path.join(a.out, "receipt.json"), "w", encoding="utf-8") as f:
        json.dump(receipt, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("wrote %s" % a.out)


if __name__ == "__main__":
    main()
