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

HELD, untouched: the ASE Master titles stay their own titles and outside the family (Sam, Open Asks Sheet 181,
2026-11-11: ASE awards Master status itself); "Advanced Electrical and Electronic Systems" is an emptied title and is
left out. Any other title whose saved override names a family but whose own title names no test mix (kb/test_mix.py)
is held the same way.

ANY ONE TEST (Sheet 181, cpl_memory d-sheet-181-replies-2026-11-11): "ASE Certification (any A1–A8)" and "ASE C1 or
G1" keep their own titles and take the family tag as members any one of whose tests qualifies. The family declares
them under `any_one_test` in kb/reference/credential_families.json, the one place membership kind lives; the tag row is
the same family row as a bundle's, and readers that must tell the two apart read the declaration (member_kind here,
kb/credential_aliases.py family_members). An any-one-test member is never proposed in the family's naming form.

A title that is no longer a credential (`titles`, kb/credentials.json's keys, when the caller passes them) is listed
as gone and gives no row: after a rename, Sam's fold rows stay on the old title, and they must not tag it again.

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
    "ASE Master Automobile Technician (A1–A8) or L3": "any one of: the Master series or L3 alone; keeps its own title, "
        "left for a person (S639 conductor, 2026-11-12)",
    "ASE Master Medium/Heavy Truck Technician (T1–T8)": "Master stays its own title (ruling 3: ASE awards it)",
    "Advanced Electrical and Electronic Systems": "an emptied title, left out (Sheet 181)",
}
BUNDLE, ANY_ONE_TEST = "bundle", "any_one_test"


def families(path=FAMILIES):
    with open(path, encoding="utf-8") as f:
        return json.load(f).get("families") or {}


def any_one_test(fams, family):
    """{title: why} of the members a family declares as any-one-test members."""
    return dict(((fams or {}).get(family) or {}).get(ANY_ONE_TEST) or {})


def member_kind(fams, family, title):
    return ANY_ONE_TEST if title in any_one_test(fams, family) else BUNDLE


def plan(rows, fams, titles=None):
    """{"convert": [{title, family, member_kind, rows}], "held": [{title, family, why, rows}], "already": [{...,
    existing}], "gone": [{title, family, rows}]}. `rows` on each item are Sam's fold rows as read, kept for the
    receipt; nothing deletes them. `titles`, when given, is the set of current credential titles."""
    by = {}
    for r in rows:
        cid = r.get("course_id") or ""
        if cid.startswith(PREFIX):
            by.setdefault(cid[len(PREFIX):], []).append(r)
    out = {"convert": [], "held": [], "already": [], "gone": []}
    for title in sorted(by):
        rs = by[title]
        ov = [r for r in rs if r.get("field") == "unified_title_override" and r.get("value") in fams]
        if not ov:
            continue
        fam = ov[0]["value"]
        fold = [r for r in rs if r.get("field") in FOLD_FIELDS and r.get("value") == fam]
        tagged = [r for r in rs if r.get("field") == FAMILY_FIELD]
        item = {"title": title, "family": fam, "member_kind": member_kind(fams, fam, title), "rows": fold}
        if title == fam:
            continue
        if titles is not None and title not in titles:
            out["gone"].append(item)
        elif title in HOLD:
            out["held"].append(dict(item, why=HOLD[title]))
        elif item["member_kind"] != ANY_ONE_TEST and not test_mix.from_title(title):
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
    for it in p["gone"]:
        print("  GONE      %s  (no longer a credential)" % it["title"])
    for c in conflicts:
        print("  CONFLICT  %s  (%s)" % (c["title"], c["why"]))


if __name__ == "__main__":
    main()
