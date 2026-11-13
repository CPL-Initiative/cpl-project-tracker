#!/usr/bin/env python3
"""Build the frozen plan for Open Asks Sheet 181's credential renames: kb/cred_rename_plans/2026-11-12_sheet181.json.

Sam answered Sheet 181 on 2026-11-11 at 22:55Z, cards taken as decided (cpl_memory d-sheet-181-replies-2026-11-11):

  1. ASE Master: one Automobile title and one Truck title. "ASE Master Automobile Technician (A1–A8 + L1)" merges
     into "ASE Master Automobile Technician" (a college's extra test is a local requirement; Sam's ruling 3); the old
     name stays a search alias (kb/credential_aliases.py reads the apply's snapshot). "ASE Master Medium/Heavy Truck
     Technician (T1–T8)" keeps its title. Both stay canonical and outside the bundle family: ASE awards Master status.
     "ASE Master Automobile Technician (A1–A8) or L3" does not merge (S639 conductor, 2026-11-12): L3 alone
     qualifies there, and an L3 holder is no Master, so it keeps its own title and is left for a person.
  2. Each bundle member of "ASE Certificate Bundles" takes the family's naming form (kb/test_mix.py family_read):
     "ASE Certificate Bundles: A4 + A5", a non-ASE part after "with". Two members with one mix become one title: the
     member ASE issues with the most local titles leads (as kb/_build_exhibits_related.py picks it), the other merges
     into it. A member the parser cannot code is listed under `unparseable` and left for a person.
  3. The any-one-test members keep their titles (kb/reference/credential_families.json any_one_test); the emptied
     "Advanced Electrical and Electronic Systems" is left out.

The members are the titles kb/_family_tag_plan.py converts, read from the committed overlay (Sam's saved folds into
the family). The plan is frozen once committed: kb/ruled_renames.py lays it over the overlay in the rename dry run and
the apply, and an entry whose old title has gone is done. Re-running this script on later data writes a different
file; commit a new one only for a new ruling.

Usage, from the repo root:  python3 kb/_build_sheet181_rename_plan.py [--out PATH]
"""
import argparse
import collections
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _family_tag_plan as ftp  # noqa: E402
import cert_naming  # noqa: E402
import test_mix  # noqa: E402

OUT = os.path.join(HERE, "cred_rename_plans", "2026-11-12_sheet181.json")
PLAN_ID = "sheet181-2026-11-12"
RULING = ("Open Asks Sheet 181, answered by Sam Lee 2026-11-11 22:55Z, cards taken as decided "
          "(cpl_memory d-sheet-181-replies-2026-11-11)")
DECIDED_BY = "Sam Lee (Open Asks Sheet 181)"
DECIDED_AT = "2026-11-11T22:55:00Z"
FAMILY = "ASE Certificate Bundles"
MASTER_AUTO = "ASE Master Automobile Technician"
MASTER_MERGES = ["ASE Master Automobile Technician (A1–A8 + L1)"]
# Any one of: the full Master series or L3 alone. Never a Master, never a bundle; a person decides its home.
FOR_A_PERSON = {"ASE Master Automobile Technician (A1–A8) or L3":
                "L3 alone qualifies, so an L3 holder is no Master: keeps its own title, no fold, no rename "
                "(S639 conductor, 2026-11-12)"}
MASTER_KEPT = ["ASE Master Medium/Heavy Truck Technician (T1–T8)"]
LEFT_OUT = {"Advanced Electrical and Electronic Systems": "an emptied title, left out (Sheet 181)"}


def _load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def overlay_rows(overrides):
    """kb_curation-shaped rows for the fold fields and the family field, from the overlay's entries."""
    rows = []
    for t, e in (overrides or {}).items():
        for f in ftp.READ_FIELDS:
            if (e or {}).get(f):
                rows.append({"course_id": ftp.PREFIX + t, "field": f, "value": e[f],
                             "reviewer_email": (e or {}).get("reviewed_by")})
    return rows


def build(overrides, credentials, unified_titles, fams):
    p = ftp.plan(overlay_rows(overrides), fams, set(credentials))
    members = sorted([it["title"] for it in p["convert"] + p["already"]
                      if it["family"] == FAMILY and it["member_kind"] == ftp.BUNDLE])
    any_one = sorted(ftp.any_one_test(fams, FAMILY))
    locals_n = collections.Counter((v or {}).get("unified_title") for v in (unified_titles or {}).values()
                                   if isinstance(v, dict))

    def issuer(t):
        return (((credentials.get(t) or [{}])[0] or {}).get("issuing_agency") or "").strip()

    named, unparseable, already = collections.defaultdict(list), [], []
    for t in members:
        r = test_mix.family_read(FAMILY, t)
        if r["status"] == "named":
            named[r["title"]].append(t)
        elif r["status"] == "already":
            already.append(t)
        elif r["status"] == "any-one":
            # Its title is only a choice of tests ("C1 or G1"): any one qualifies, so it is no bundle and keeps its
            # title, as test_mix.exception() also says (no exception for a person).
            any_one = sorted(set(any_one) | {t})
        else:
            unparseable.append({"title": t, "mix": (test_mix.from_title(t) or {}).get("label"), "why": r["why"]})
    entries = []
    for new in sorted(named):
        olds = sorted(named[new], key=lambda o: (issuer(o) != cert_naming.ASE_ISSUER, -locals_n.get(o, 0), o.lower()))
        for k, o in enumerate(olds):
            entries.append({"old": o, "new": new, "kind": "rename" if k == 0 else "merge", "family": FAMILY,
                            "why": ("a bundle member takes the family's naming form" if k == 0 else
                                    "the same mix as %r, which leads; one title by an ordinary merge" % olds[0])})
    for o in MASTER_MERGES:
        if o in credentials and MASTER_AUTO in credentials:
            entries.append({"old": o, "new": MASTER_AUTO, "kind": "merge",
                            "why": "one ASE Master Automobile title; the old name stays a search alias"})
    return {
        "_about": "A frozen plan of credential renames and merges ruled on a decision sheet, read by kb/ruled_renames.py "
                  "in the rename dry run and the apply (cred-rename-apply.yml). Built by kb/_build_sheet181_rename_plan.py "
                  "from committed files. Nothing here writes kb_curation: the rows the route would otherwise read are "
                  "occupied by Sam's family-tag folds, which no plan edits or deletes.",
        "plan_id": PLAN_ID,
        "ruling": RULING,
        "decided_by": DECIDED_BY,
        "decided_at": DECIDED_AT,
        "entries": entries,
        "unparseable": unparseable,
        # Every title the plan leaves for a person: the members the parser cannot code, and the any-one-of Master.
        "left_for_person": sorted([{"title": u["title"], "why": u["why"]} for u in unparseable]
                                  + [{"title": t, "why": w} for t, w in FOR_A_PERSON.items() if t in credentials],
                                  key=lambda x: x["title"]),
        "already_named": already,
        "kept": {t: "ASE Master stays its own canonical title, outside the bundle family (ASE awards it)"
                 for t in MASTER_KEPT + [MASTER_AUTO]},
        "any_one_test": {t: "keeps its own title; a member of %s any one of whose tests qualifies" % FAMILY
                         for t in any_one},
        "left_out": LEFT_OUT,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args(argv)
    doc = build((_load(os.path.join(HERE, "credential_review_overlay.json"), {}) or {}).get("overrides") or {},
                _load(os.path.join(HERE, "credentials.json"), {}), _load(os.path.join(HERE, "unified_titles.json"), {}),
                ftp.families())
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    kinds = collections.Counter(e["kind"] for e in doc["entries"])
    print("wrote %s: %d renames, %d merges, %d unparseable" % (os.path.relpath(a.out), kinds["rename"], kinds["merge"],
                                                               len(doc["unparseable"])))


if __name__ == "__main__":
    main()
