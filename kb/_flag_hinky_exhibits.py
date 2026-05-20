"""
Triage flag (2026-05-20): mark "course-as-exhibit" data-entry artifacts.

Some colleges (notably Modesto Junior College, ~half of these) created MAP
exhibits typed as "Industry Certification" whose title is actually a *course*
with no associated industry certification — faculty listed courses that "could
qualify for CPL" without naming the credential a student would use. These
canonicalize to a null issuing agency (there's no credential to name).

This is a HEURISTIC triage flag, not a verdict: signature = an exhibit typed
'Industry Certification' that resolved to no identifiable issuing agency. A few
flagged items may be genuine certs we simply couldn't pin down (e.g. "Welding
Certificates"); they're flagged for human review, not asserted as errors.

Adds `quality_flag` (null normally; "suspect_course_as_exhibit" for these) to
every kb/unified_titles.json entry. One-shot; do NOT re-run after hand-edits.
"""
import json
import os
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def with_flag(rec, flag):
    """Insert quality_flag right before _notes for readable diffs."""
    out = {}
    for k, v in rec.items():
        if k == "quality_flag":
            continue
        if k == "_notes":
            out["quality_flag"] = flag
        out[k] = v
    out.setdefault("quality_flag", flag)
    return out


def main():
    ut = json.load(open(os.path.join(HERE, "unified_titles.json"), encoding="utf-8"))
    cr = json.load(open(os.path.join(HERE, "credentials.json"), encoding="utf-8"))
    data = json.load(open(os.path.join(ROOT, "CustomReport_latest.json")))
    ex = data[0]
    ix = {c: i for i, c in enumerate(ex["columnName"])}

    cpl_by_title = defaultdict(set)
    colleges_by_title = defaultdict(set)
    for r in ex["columnValue"]:
        t = r[ix["Exhibit Title"]]
        cpl_by_title[t].add(r[ix["CPL Type Description"]])
        colleges_by_title[t].add(r[ix["Articulation College"]])

    def null_issuer(unified_title):
        recs = cr.get(unified_title, [])
        return bool(recs) and all(not r.get("issuing_agency") for r in recs)

    flagged = 0
    by_college = Counter()
    for raw in list(ut):
        v = ut[raw]
        flag = None
        if "Industry Certification" in cpl_by_title.get(raw, set()) and null_issuer(v["unified_title"]):
            flag = "suspect_course_as_exhibit"
            flagged += 1
            for c in colleges_by_title.get(raw, ()):
                by_college[c] += 1
        ut[raw] = with_flag(v, flag)

    ut = {k: ut[k] for k in sorted(ut)}
    with open(os.path.join(HERE, "unified_titles.json"), "w", encoding="utf-8") as f:
        json.dump(ut, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"flagged {flagged} 'suspect_course_as_exhibit' of {len(ut)} unified titles")
    print("top colleges:")
    for c, n in by_college.most_common(6):
        print(f"   {n:>4}  {c or '(blank)'}")


if __name__ == "__main__":
    main()
