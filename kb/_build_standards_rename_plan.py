#!/usr/bin/env python3
"""Build the frozen plan for the "standards" folds Sam's ruling A covers: kb/cred_rename_plans/2026-11-12_standards.json.

Sam ruled on 2026-11-11 in session S638, verbatim "A, C as recommended" (cpl_memory
sam-ic-exhibits-go-to-cert-title-2026-11-11). A: the industry-certification exhibits under Brakes (ASE A5 standards),
Heating and Air Conditioning (ASE A7 standards) and Engine Performance (ASE A8 standards) belong under the cert title;
only college-exam titles fold into the standards title. Phases 1 and 2 of the ASE plan (kb/cer_decisions_out/2026-11-11,
-2) moved those exhibits to the cert titles; phase 3 (-3) runs only after these folds have created the three standards
titles. The scoped rename apply of 2026-11-12 (only_plan=sheet181-2026-11-12) deferred them; this plan gives them their
own scope, so cred-rename-apply.yml runs them with only_plan=standards-2026-11-12 and nothing else.

What the builder reads, all committed: Sam's saved folds in kb/credential_review_overlay.json (unified_title_override
naming one of the three ruled targets, and unified_title_merge_confirm), kb/unified_titles.json (which titles still hold
an exhibit) and kb/credentials.json. The entries are the dry run's own reading of those rows, frozen:

  - a saved fold into a ruled target whose source still holds an exhibit is an entry. In each target's group the source
    with no merge confirm leads (the earliest saved, as kb/_cred_rename_dryrun.py picks it) and is a rename that creates
    the target; a source whose confirm names the target merges into it. A target already in the reference takes merges
    only. A sibling with no confirm is left out (the dry run would queue it).
  - a saved fold into a ruled target whose source holds no exhibit is left out: fold_issuer.hold_emptied_folds keeps
    it inert (the restored rows of kb/cer_decisions_out/2026-11-11-4; DECIDED, Sky and COBIx, #3110).
  - a saved fold into any other "(ASE ... standards)" title is left out: ruling A names A5, A7 and A8 only.

The plan stands in for nothing: each entry's slot already holds Sam's own fold into the same title, so
kb/ruled_renames.py lays it over the overlay unchanged and only marks the entry as this plan's, which is what
--only-plan scopes on. The plan is frozen once committed; an entry whose old title has gone is done. Re-running this
script after the apply writes a different file; commit a new one only for a new ruling.

Usage, from the repo root:  python3 kb/_build_standards_rename_plan.py [--out PATH]
"""
import argparse
import collections
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import exhibit_paths  # noqa: E402
import fold_issuer  # noqa: E402

OUT = os.path.join(HERE, "cred_rename_plans", "2026-11-12_standards.json")
PLAN_ID = "standards-2026-11-12"
RULING = ('Sam Lee in session S638, 2026-11-11, verbatim "A, C as recommended" (cpl_memory '
          "sam-ic-exhibits-go-to-cert-title-2026-11-11). A: the industry-certification exhibits under Brakes (ASE A5 "
          "standards), Heating and Air Conditioning (ASE A7 standards) and Engine Performance (ASE A8 standards) "
          "belong under the cert title; only college-exam titles fold into the standards title")
DECIDED_BY = "Sam Lee (in session S638, 2026-11-11); carried out by the Session 640 conductor"
# The ruling's minute is not committed. This is the first commit that cites it (#3118, 38d69e55, 21:33:36Z): the
# ruling came no later. kb/ruled_renames.py stamps it only on a slot it rewrites, and this plan rewrites none.
DECIDED_AT = "2026-11-11T21:33:36Z"
RULED_TARGETS = ("Brakes (ASE A5 standards)", "Heating and Air Conditioning (ASE A7 standards)",
                 "Engine Performance (ASE A8 standards)")
OVERRIDE, CONFIRM = "unified_title_override", "unified_title_merge_confirm"
# Ruling A folds only a college's own exams into a standards title: the source's issuer is the college system.
COLLEGE = "California Community Colleges"


def _load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def _saved(e, field):
    st = ((e or {}).get("field_reviews") or {}).get(field) or {}
    return {"by": st.get("by") or (e or {}).get("reviewed_by"), "at": st.get("at") or (e or {}).get("reviewed_at")}


def _is_standards(title):
    return bool(title) and "(ASE " in title and title.endswith(" standards)")


def _not_college_exams(old, credentials, ids_by_ut):
    """Why a source is not ruling A's to fold (an industry-certification exhibit, or an issuer other than the college
    system), or "" when it is. Ruling A sends an industry-certification exhibit to the cert title, never here."""
    ic = sorted(i for i in ids_by_ut.get(old) or [] if exhibit_paths.path_of(i) == "ic")
    if ic:
        return ("holds an industry-certification exhibit (%s): ruling A sends it to the cert title, so the fold "
                "waits for a person" % ", ".join(ic))
    iss = sorted({(r or {}).get("issuing_agency") or "" for r in credentials.get(old) or []} - {COLLEGE})
    if iss:
        return ("its issuer is %s, not %s: ruling A folds only a college's own exams, so the fold waits for a person"
                % (", ".join(repr(i) for i in iss), COLLEGE))
    return ""


def build(overrides, credentials, unified_titles):
    holding = fold_issuer.titles_holding_exhibits(unified_titles)
    raws, ids_by_ut = collections.defaultdict(list), collections.defaultdict(list)
    for raw, v in (unified_titles or {}).items():
        if isinstance(v, dict) and v.get("unified_title"):
            raws[v["unified_title"]].append(raw)
            ids_by_ut[v["unified_title"]].extend(v.get("source_exhibit_ids") or [])
    groups, left_out = collections.defaultdict(list), []
    for old, e in sorted((overrides or {}).items()):
        new = (e or {}).get(OVERRIDE)
        if not _is_standards(new) or new == old:
            continue
        kind = "merge" if (e or {}).get(CONFIRM) == new else "rename"
        if old not in holding:
            left_out.append({"old": old, "new": new, "kind": kind,
                             "why": fold_issuer.EMPTIED_HELD_LINE
                                    + " (kb/cer_decisions_out/2026-11-11-4 restored them; they must stay inert)"})
        elif new not in RULED_TARGETS:
            left_out.append({"old": old, "new": new, "kind": kind,
                             "why": "ruling A names the A5, A7 and A8 standards titles only; Sam's saved fold stays "
                                    "as it is and waits for its own scope"})
        elif _not_college_exams(old, credentials, ids_by_ut):
            left_out.append({"old": old, "new": new, "kind": kind, "why": _not_college_exams(old, credentials, ids_by_ut)})
        else:
            groups[new].append(old)
    entries = []
    for new in RULED_TARGETS:
        olds = sorted(groups.get(new) or [], key=lambda o: ((overrides[o] or {}).get(CONFIRM) == new,
                                                            _saved(overrides[o], OVERRIDE)["at"] or "", o))
        for k, old in enumerate(olds):
            e = overrides[old] or {}
            confirmed = e.get(CONFIRM) == new
            lead = k == 0 and new not in credentials
            if not lead and not confirmed:
                left_out.append({"old": old, "new": new, "kind": "rename",
                                 "why": "a second source into %r with no merge confirm: the dry run queues it" % new})
                continue
            ev = {"overlay": "kb/credential_review_overlay.json overrides[%r]" % old,
                  OVERRIDE: dict(_saved(e, OVERRIDE), value=new),
                  "exhibits": sorted(raws.get(old) or []),
                  "issuer": [r.get("issuing_agency") for r in credentials.get(old) or []]}
            if e.get(CONFIRM):
                ev[CONFIRM] = dict(_saved(e, CONFIRM), value=e[CONFIRM])
            entries.append({"old": old, "new": new, "kind": "rename" if lead else "merge",
                            "why": ("creates the standards title; its exhibits are college exams and noncredit "
                                    "(ruling A)" if lead else
                                    "Sam confirmed the merge into %r, which %r creates in the same apply" % (new, olds[0])),
                            "evidence": ev})
    return {
        "_about": "A frozen plan of credential renames and merges ruled in session, read by kb/ruled_renames.py in the "
                  "rename dry run and the apply (cred-rename-apply.yml, only_plan=%s). Built by "
                  "kb/_build_standards_rename_plan.py from committed files. Each entry's slot already holds Sam's own "
                  "fold into the same title; the plan marks it as this scope's and changes no row." % PLAN_ID,
        "plan_id": PLAN_ID,
        "ruling": RULING,
        "decided_by": DECIDED_BY,
        "decided_at": DECIDED_AT,
        "entries": entries,
        "left_out": sorted(left_out, key=lambda x: (x["new"], x["old"])),
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args(argv)
    doc = build((_load(os.path.join(HERE, "credential_review_overlay.json"), {}) or {}).get("overrides") or {},
                _load(os.path.join(HERE, "credentials.json"), {}), _load(os.path.join(HERE, "unified_titles.json"), {}))
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    kinds = collections.Counter(e["kind"] for e in doc["entries"])
    print("wrote %s: %d renames, %d merges, %d left out" % (os.path.relpath(a.out), kinds["rename"], kinds["merge"],
                                                             len(doc["left_out"])))


if __name__ == "__main__":
    main()
