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

Usage, from the repo root:  python3 kb/_build_standards_rename_plan.py [--plan standards|standards-2] [--out PATH]
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

PLANS_DIR = os.path.join(HERE, "cred_rename_plans")
A578 = ("Brakes (ASE A5 standards)", "Heating and Air Conditioning (ASE A7 standards)",
        "Engine Performance (ASE A8 standards)")
# Two plan definitions, one builder. "standards" is ruling A's three titles; "standards-2" is Sam's seven other saved
# standards folds of the same rename batch, read under ruling A's principle and applied after the first plan.
PLANS = {
    "standards": {
        "out": os.path.join(PLANS_DIR, "2026-11-12_standards.json"),
        "plan_id": "standards-2026-11-12",
        "ruling": ('Sam Lee in session S638, 2026-11-11, verbatim "A, C as recommended" (cpl_memory '
                   "sam-ic-exhibits-go-to-cert-title-2026-11-11). A: the industry-certification exhibits under Brakes "
                   "(ASE A5 standards), Heating and Air Conditioning (ASE A7 standards) and Engine Performance (ASE A8 "
                   "standards) belong under the cert title; only college-exam titles fold into the standards title"),
        "decided_by": "Sam Lee (in session S638, 2026-11-11); carried out by the Session 640 conductor",
        # The ruling's minute is not committed. This is the first commit that cites it (#3118, 38d69e55, 21:33:36Z):
        # the ruling came no later. kb/ruled_renames.py stamps it only on a slot it rewrites, and this plan rewrites
        # none.
        "decided_at": "2026-11-11T21:33:36Z",
        "targets": A578,
        "other_why": ("ruling A names the A5, A7 and A8 standards titles only; Sam's saved fold stays as it is and "
                      "waits for its own scope"),
        "exhibit_types": False,
    },
    "standards-2": {
        "out": os.path.join(PLANS_DIR, "2026-11-12_standards_2.json"),
        "plan_id": "standards-2-2026-11-12",
        "ruling": ("Sam Lee's saved folds of 2026-11-11 15:26:54Z in the rename batch (unified_title_override into "
                   "each \"(ASE ... standards)\" title), read under ruling A's principle (cpl_memory "
                   "sam-ic-exhibits-go-to-cert-title-2026-11-11): only college-exam titles fold into the standards "
                   "title; an industry-certification exhibit goes to the cert title"),
        "decided_by": ("Sam Lee's saved folds (rename batch, 2026-11-11); scoped and carried out by the Session 640 "
                       "conductor"),
        # The saves' own stamp. kb/ruled_renames.py stamps it only on a slot it rewrites, and this plan rewrites none.
        "decided_at": "2026-11-11T15:26:54Z",
        "targets": ("Advanced Engine Performance Specialist (ASE L1 standards)",
                    "Automatic Transmission/Transaxle (ASE A2 standards)",
                    "Electrical/Electronic Systems (ASE A6 standards)",
                    "Light Duty Hybrid/Electric Vehicle Specialist (ASE L3 standards)",
                    "Light Vehicle Diesel Engines (ASE A9 standards)",
                    "Manual Drive Train and Axles (ASE A3 standards)",
                    "Suspension and Steering (ASE A4 standards)"),
        "other_why": "the A5, A7 and A8 standards folds are plan standards-2026-11-12's",
        "exhibit_types": True,
    },
}
OUT = PLANS["standards"]["out"]
PLAN_ID = PLANS["standards"]["plan_id"]
RULED_TARGETS = A578
NONCREDIT_FROM_TITLE = "read from the title: no committed file carries a MAP id for this exhibit"
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


def exhibit_types(raws, unified_titles, adoption_ids):
    """Each raw's CPL path and where it was read: the MAP ids kb/unified_titles.json or kb/exhibits_adoption.json
    carries for it (path from the id, kb/exhibit_paths.py), else a "Noncredit" title read as noncredit, else unknown."""
    out = []
    for raw in sorted(raws):
        ids = [(i, "kb/unified_titles.json") for i in ((unified_titles.get(raw) or {}).get("source_exhibit_ids") or [])]
        ids += [(i, "kb/exhibits_adoption.json") for i in (adoption_ids or {}).get(raw) or [] if i not in dict(ids)]
        if ids:
            for i, src in ids:
                key = exhibit_paths.path_of(i)
                out.append({"exhibit": raw, "id": i, "type": exhibit_paths.PATHS[key][0] if key else "",
                            "from": "the MAP id, in " + src})
        elif raw.lower().startswith("noncredit"):
            out.append({"exhibit": raw, "id": None, "type": "noncredit", "from": NONCREDIT_FROM_TITLE})
        else:
            out.append({"exhibit": raw, "id": None, "type": "", "from": "no committed file shows its CPL type"})
    return out


def _not_college_exams(old, credentials, ids_by_ut, types=None):
    """Why a source is not ruling A's to fold (an industry-certification exhibit, an issuer other than the college
    system, or an exhibit whose type no committed file shows), or "" when it is. Ruling A sends an
    industry-certification exhibit to the cert title, never here."""
    ic = sorted(set(i for i in ids_by_ut.get(old) or [] if exhibit_paths.path_of(i) == "ic")
                | {t["id"] for t in types or () if t["type"] == exhibit_paths.PATHS["ic"][0]})
    if ic:
        return ("holds an industry-certification exhibit (%s): ruling A sends it to the cert title, so the fold "
                "waits for a person" % ", ".join(ic))
    unknown = sorted(t["exhibit"] for t in types or () if not t["type"])
    if unknown:
        return ("holds an exhibit whose CPL type no committed file shows (%s), so the fold waits for a person"
                % ", ".join(unknown))
    iss = sorted({(r or {}).get("issuing_agency") or "" for r in credentials.get(old) or []} - {COLLEGE})
    if iss:
        return ("its issuer is %s, not %s: ruling A folds only a college's own exams, so the fold waits for a person"
                % (", ".join(repr(i) for i in iss), COLLEGE))
    return ""


def adoption_ids(adoption, unified_titles=None):
    """{raw title: [MAP exhibit ids]} from kb/exhibits_adoption.json's credentials[...]["x"] rows. Keyed by the raw
    exhibit title, never by the credential the nightly last filed it under: the id's path belongs to the exhibit, and
    which source holds the raw is kb/unified_titles.json's to say, so a lagging adoption file changes nothing."""
    out = collections.defaultdict(list)
    for c in ((adoption or {}).get("credentials") or {}).values():
        for x in (c or {}).get("x") or []:
            if len(x) >= 2 and x[0] not in out[x[1]]:
                out[x[1]].append(x[0])
    return dict(out)


def build(overrides, credentials, unified_titles, plan=None, adoption=None):
    plan = plan or PLANS["standards"]
    targets = plan["targets"]
    ad_ids = adoption_ids(adoption, unified_titles)
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
        elif new not in targets:
            left_out.append({"old": old, "new": new, "kind": kind, "why": plan["other_why"]})
        elif _not_college_exams(old, credentials, ids_by_ut, exhibit_types(raws[old], unified_titles, ad_ids)):
            left_out.append({"old": old, "new": new, "kind": kind, "why": _not_college_exams(
                old, credentials, ids_by_ut, exhibit_types(raws[old], unified_titles, ad_ids))})
        else:
            groups[new].append(old)
    entries = []
    for new in targets:
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
            if plan["exhibit_types"]:
                ev["exhibit_types"] = exhibit_types(raws.get(old) or [], unified_titles, ad_ids)
            entries.append({"old": old, "new": new, "kind": "rename" if lead else "merge",
                            "why": ("creates the standards title; its exhibits are college exams and noncredit "
                                    "(ruling A)" if lead else
                                    "Sam confirmed the merge into %r, which %r creates in the same apply" % (new, olds[0])),
                            "evidence": ev})
    return {
        "_about": "A frozen plan of credential renames and merges ruled in session, read by kb/ruled_renames.py in the "
                  "rename dry run and the apply (cred-rename-apply.yml, only_plan=%s). Built by "
                  "kb/_build_standards_rename_plan.py from committed files. Each entry's slot already holds Sam's own "
                  "fold into the same title; the plan marks it as this scope's and changes no row." % plan["plan_id"],
        "plan_id": plan["plan_id"],
        "ruling": plan["ruling"],
        "decided_by": plan["decided_by"],
        "decided_at": plan["decided_at"],
        "entries": entries,
        "left_out": sorted(left_out, key=lambda x: (x["new"], x["old"])),
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--plan", choices=sorted(PLANS), default="standards")
    ap.add_argument("--out", default=None)
    a = ap.parse_args(argv)
    plan = PLANS[a.plan]
    out = a.out or plan["out"]
    doc = build((_load(os.path.join(HERE, "credential_review_overlay.json"), {}) or {}).get("overrides") or {},
                _load(os.path.join(HERE, "credentials.json"), {}), _load(os.path.join(HERE, "unified_titles.json"), {}),
                plan, _load(os.path.join(HERE, "exhibits_adoption.json"), {}))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    kinds = collections.Counter(e["kind"] for e in doc["entries"])
    print("wrote %s: %d renames, %d merges, %d left out" % (os.path.relpath(out), kinds["rename"], kinds["merge"],
                                                             len(doc["left_out"])))


if __name__ == "__main__":
    main()
