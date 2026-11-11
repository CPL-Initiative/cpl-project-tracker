#!/usr/bin/env python3
"""Turn a saved fold into a declared family title into a family tag: the plan, its receipt and its rollback.

WHY. Sam saved 31 folds into "ASE Certificate Bundles" on 2026-11-11 (unified_title_override plus
unified_title_merge_confirm under `_CREDENTIAL_REVIEW::<title>`). He then ruled (in session; cpl_memory
`sam-bundle-family-is-a-field-2026-11-11`) that each bundle STAYS its own canonical title and gains a family,
because a fold put unlike bundles on one card and nine surfaces misread adoption. His saved rows are read as
family tags, not merges. kb/reference/credential_families.json declares the families.

WHAT IT WRITES (nothing to Supabase; a person reviews and runs the SQL):
  plan.sql      one transaction. Per member title: INSERT a `credential_family` row naming the family, under the
                cohort CREDENTIAL_FAMILY_COHORT, only while the saved override still stands; then DELETE that
                title's unified_title_override and unified_title_merge_confirm rows, each guarded on its own
                value AND reviewed_at, so a row Sam has touched since the read is left alone.
  rollback.sql  deletes the cohort's credential_family rows and re-inserts every deleted row's full image.
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


def plan_sql(p):
    lines = ["-- Family tags for the saved folds into a declared family title (kb/_family_tag_plan.py).",
             "-- " + SOURCE,
             "-- Rule 10: the insert is insert-only under %s and runs only while the saved override" % CREDENTIAL_FAMILY_COHORT,
             "-- still stands; each delete is guarded on the row's own value and reviewed_at, so a row changed",
             "-- since the read stays. Rollback: rollback.sql beside this file (full row images in receipt.json).",
             "begin;"]
    for it in p["convert"]:
        cid = PREFIX + it["title"]
        ov = next(r for r in it["rows"] if r["field"] == "unified_title_override")
        lines.append("")
        lines.append("-- %s -> family %s" % (it["title"], it["family"]))
        lines.append("insert into public.kb_curation (course_id, field, value, reviewer_email)")
        lines.append("select %s, 'credential_family', %s, %s" % (q(cid), q(it["family"]), q(CREDENTIAL_FAMILY_COHORT)))
        lines.append(" where exists (select 1 from public.kb_curation where course_id = %s and field = 'unified_title_override'"
                     % q(cid))
        lines.append("                  and value = %s and reviewed_at = %s::timestamptz)" % (q(ov["value"]), q(ov["reviewed_at"])))
        lines.append("on conflict (course_id, field) do nothing;")
        for r in sorted(it["rows"], key=lambda r: r["field"]):
            lines.append("delete from public.kb_curation where course_id = %s and field = %s and value = %s"
                         % (q(cid), q(r["field"]), q(r["value"])))
            lines.append("   and reviewed_at = %s::timestamptz;" % q(r["reviewed_at"]))
    lines += ["", "-- Read back: expect %d credential_family rows under the cohort and no fold row left for them."
              % len(p["convert"]),
              "select course_id, field, value, reviewer_email from public.kb_curation",
              " where course_id in (%s)" % ", ".join(q(PREFIX + it["title"]) for it in p["convert"]),
              "   and field in ('credential_family', 'unified_title_override', 'unified_title_merge_confirm')",
              " order by course_id, field;",
              "commit;", ""]
    return "\n".join(lines)


def rollback_sql(p):
    lines = ["-- Rollback of plan.sql (kb/_family_tag_plan.py). Read live first (data_write_rollback.md):",
             "-- a credential_family row a person has since changed is no longer the cohort's and stays.",
             "begin;",
             "delete from public.kb_curation where field = 'credential_family' and reviewer_email = %s" % q(CREDENTIAL_FAMILY_COHORT),
             "   and course_id in (%s);" % ", ".join(q(PREFIX + it["title"]) for it in p["convert"])]
    for it in p["convert"]:
        for r in sorted(it["rows"], key=lambda r: r["field"]):
            cols = sorted(r)
            lines.append("insert into public.kb_curation (%s) values (%s) on conflict (course_id, field) do nothing;"
                         % (", ".join(cols), ", ".join(q(r[c]) for c in cols)))
    lines += ["commit;", ""]
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
