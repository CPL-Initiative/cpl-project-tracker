#!/usr/bin/env python3
"""The family-tag plan: which titles take a `credential_family` row, given as rows to insert and never as SQL.

WHY. Sam saved 31 folds into "ASE Certificate Bundles" on 2026-11-11 (unified_title_override plus
unified_title_merge_confirm under `_CREDENTIAL_REVIEW::<title>`). He then ruled (in session; cpl_memory
`sam-bundle-family-is-a-field-2026-11-11`, "A, C as recommended") that each bundle STAYS its own canonical title and
gains a family, because a fold put unlike bundles on one card and nine surfaces misread adoption. His saved rows are
read as family tags, never as folds. kb/reference/credential_families.json declares the families.

WHAT IT GIVES. plan() names, per title saved into a declared family, whether it converts, is held for Sam, or already
carries a family. tag_rows() turns the converts into insert rows ({course_id, field "credential_family", value}) and
lists the conflicts: a title that another title's pending merge confirm names as its target (Rule 10a: a write whose
key is a pending merge target fights the curator), or a title whose live family row holds another value. The tag is a
NEW row beside Sam's fold rows: nothing here edits or deletes a row. The readers hold any fold whose target is a
declared family title (kb/fold_issuer.py hold_family_folds, called by the rename dry-run and the rename apply).

WHO WRITES. kb/_family_tag_apply.py, run by .github/workflows/credential-family-apply.yml, reads live at dispatch,
calls these two functions and inserts under CREDENTIAL_FAMILY_COHORT with a committed receipt. The 47 KB SQL plan
#3117 wrote (one transaction that also deleted the fold rows) never ran and is retired (S639).

HELD for Sam, untouched: the ASE Master titles stay their own titles and are not family members by default;
"Advanced Electrical and Electronic Systems", "ASE Certification (any A1–A8)" and "ASE C1 or G1" are not bundles of
named tests, because any one test qualifies (the last agreed with COBIx on #3111, comment 6808460886). Any other title
whose saved override names a family but whose own title names no test mix (kb/test_mix.py) is held the same way.

Usage (offline inspection of a read; the workflow makes the live one):
  python3 kb/_family_tag_plan.py --rows LIVE_ROWS.json
LIVE_ROWS.json holds the kb_curation rows whose course_id starts with `_CREDENTIAL_REVIEW::` and whose field is one of
READ_FIELDS.
"""
import argparse
import json
import os
import sys

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
FAMILY_FIELD = "credential_family"
READ_FIELDS = FOLD_FIELDS + (FAMILY_FIELD,)
HOLD = {
    "ASE Master Automobile Technician": "Master stays its own title (ruling 3: ASE awards it)",
    "ASE Master Automobile Technician (A1–A8 + L1)": "Master stays its own title (ruling 3: ASE awards it)",
    "ASE Master Automobile Technician (A1–A8) or L3": "Master stays its own title (ruling 3: ASE awards it)",
    "ASE Master Medium/Heavy Truck Technician (T1–T8)": "Master stays its own title (ruling 3: ASE awards it)",
    "Advanced Electrical and Electronic Systems": "not a bundle of named tests",
    "ASE Certification (any A1–A8)": "not a bundle of named tests: any one test qualifies",
    "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair":
        "not a bundle of named tests: either test qualifies (agreed with COBIx on #3111, comment 6808460886)",
}


def families(path=FAMILIES):
    with open(path, encoding="utf-8") as f:
        return json.load(f).get("families") or {}


def plan(rows, fams):
    """{"convert": [{title, family, rows}], "held": [{title, family, why, rows}], "already": [{..., existing}]}.
    `rows` on each item are Sam's fold rows as read, kept for the receipt; nothing deletes them."""
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
        tagged = [r for r in rs if r.get("field") == FAMILY_FIELD]
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


def merge_targets(rows):
    """{title: [course_id, ...]} for every title a unified_title_merge_confirm names as its target."""
    out = {}
    for r in rows:
        if r.get("field") == "unified_title_merge_confirm" and (r.get("course_id") or "").startswith(PREFIX):
            out.setdefault(r.get("value") or "", []).append(r["course_id"])
    return out


def tag_rows(p, rows):
    """(insert rows, written, conflicts) for a plan and the rows it was made from. A convert gives one insert row; a
    title already tagged with its family is written; a title another title's merge confirm names as its target, or one
    whose live family row holds another value, is a conflict and gives nothing."""
    targets = merge_targets(rows)
    tags, written, conflicts = [], [], []
    for it in sorted(p["convert"] + p["already"], key=lambda x: x["title"]):
        cid = PREFIX + it["title"]
        fights = [c for c in targets.get(it["title"], []) if c != cid]
        have = it.get("existing") or []
        if fights:
            conflicts.append({"title": it["title"], "why": "a pending merge confirm on %s names it as target" % fights[0]})
        elif have and have[0].get("value") != it["family"]:
            conflicts.append({"title": it["title"], "why": "holds family %r (by %s); a person's word wins"
                              % (have[0].get("value"), have[0].get("reviewer_email"))})
        elif have:
            written.append({"title": it["title"], "family": it["family"], "by": have[0].get("reviewer_email")})
        else:
            tags.append({"course_id": cid, "field": FAMILY_FIELD, "value": it["family"]})
    return tags, written, conflicts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows", required=True)
    a = ap.parse_args()
    with open(a.rows, encoding="utf-8") as fh:
        rows = json.load(fh)
    p = plan(rows, families())
    tags, written, conflicts = tag_rows(p, rows)
    print("%d to write, %d already written, %d held for Sam, %d conflicts"
          % (len(tags), len(written), len(p["held"]), len(conflicts)))
    for t in tags:
        print("  tag       %s" % t["course_id"][len(PREFIX):])
    for it in p["held"]:
        print("  HOLD      %s  (%s)" % (it["title"], it["why"]))
    for c in conflicts:
        print("  CONFLICT  %s  (%s)" % (c["title"], c["why"]))


if __name__ == "__main__":
    main()
