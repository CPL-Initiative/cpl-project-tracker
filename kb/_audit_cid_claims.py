#!/usr/bin/env python3
"""Find COCI C-ID claims that a course's own content calls a mis-entry (SkyHarbor, 2026-11-06).

A college enters a course's C-ID in COCI with no gatekeeper, and the identity layer
trusts it. Moreno Valley College's HES 1 Health Science claimed HIST 150 (World History
to 1500), so its Basic Military Training articulation read as a peer path to every world
history course (Sam, 2026-11-06: "Definitely don't want Sierra recommending this").

THE CONTENT DECIDES (Sam, 2026-11-07, on the HIST 150 mock-up): "the control number
characters carry no meaning that should be use to align course numbers are titles. The
weight of the comparison between 'HIS' and 'HES' has been vastly overweighted. More
important factors are the indicator in the course title, description, slos, soc, CIP."
So a member of a C-ID group (three or more members) is reported when:
  1. the ASCCC approval table (kb/cid_articulation_joins.json) holds no approval of that
     course under that C-ID; and
  2. its title shares no content word with any other member's title; and
  3. its catalog description (coci_lookup_desc_*.js) matches no member's closely: its
     best overlap is under 0.3 of the median of how closely the group's members match
     their own nearest neighbor (HES 1: best 0.056 against a group whose members share
     a median 0.073 with each other, and 1.000 with Norco's HES 1).
Subject letters and TOP family never qualify a finding by themselves. They stand in
for (3) only when the course has no description, and then both must disagree with the
group. Course SLOs, SOC and course CIP join (3) when the repo carries them; it does not yet.

Writes kb/cid_claim_audit.json: each finding, the signals that carried it, whether
kb/reference/cid_claim_holds.json already holds it, and the CPL articulations its group
carries. A finding not yet held is an item for the team: hold it (with the home its
sister colleges give it) and ask the college to correct COCI. Read-only on everything
else; run daily after the export.

    python3 kb/_audit_cid_claims.py
"""
from __future__ import annotations

import glob
import json
import os
import re
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STOP = set("i ii iii iv a an the and of to in for with introduction intro principles fundamentals basic survey "
           "course general part level advanced beginning elementary intermediate".split())


def load_js(name):
    txt = open(os.path.join(ROOT, name), encoding="utf-8").read()
    start = txt.index("=", txt.index("window.")) + 1  # past the header comment
    return json.loads(txt[txt.index("{", start): txt.rindex("}") + 1])


def words(t):
    out = set()
    for w in re.sub(r"[^a-z ]", " ", str(t or "").lower()).split():
        if len(w) > 2 and w not in STOP:
            out.add(re.sub(r"(ies|es|s|al|ing)$", "", w))
    return out


def subj(n):
    return re.sub(r"[^A-Z]", "", str(n or "").strip().split(" ")[0].upper())


DESC_STOP = set("this that these those course courses students student will also include includes including "
                "through from with which such their they them into upon each both other more most than then "
                "study studies topics topic introduction principles basic general prerequisite none "
                "advisory recommended preparation transfer units hours lecture laboratory".split())


def desc_words(t):
    return {w for w in re.findall(r"[a-z]{4,}", str(t or "").lower()) if w not in DESC_STOP}


# Under 0.3 of the group's own closeness. Measured 2026-11-07: at 0.5, real members with a typo or a thin
# description read as findings (Principles of Macroecononics under ECON 202 at 0.33, IT Fundamentals under
# ITIS 110 at 0.39); the clear mis-entries sit under 0.2 (Addiction Counseling under AJ 110, 0.08).
DESC_FLOOR = 0.3


def jaccard(a, b):
    return len(a & b) / len(a | b) if (a or b) else 0.0


def load_descriptions():
    out = {}
    for path in sorted(glob.glob(os.path.join(ROOT, "coci_lookup_desc_*.js"))):
        txt = open(path, encoding="utf-8").read()
        i = txt.find("] = {")
        if i >= 0:
            out.update(json.loads(txt[i + 4: txt.rindex("}") + 1]))
    return out


def group_findings(key, members, approved, desc):
    """The members of one C-ID group whose own content disagrees with the group. Each
    member is {n, t, p, cn}; desc maps a control number to its catalog description."""
    if len(members) < 3:
        return []
    fam = Counter(str(x.get("p") or "")[:2] for x in members)
    modal = fam.most_common(1)[0][0]
    sc = Counter(subj(x.get("n")) for x in members)
    dw = [desc_words(desc.get(x.get("cn"))) for x in members]
    nn = None
    out = []
    for i, x in enumerate(members):
        if (x.get("cn"), key) in approved:
            continue
        others = set()
        for j, y in enumerate(members):
            if j != i:
                others |= words(y.get("t"))
        if words(x.get("t")) & others:
            continue
        signals = ["no ASCCC approval for " + key, "title shares no word with any other member"]
        if dw[i]:
            if nn is None:  # the group's own closeness, computed once per group that needs it
                nn = sorted(max((jaccard(dw[a], dw[b]) for b in range(len(members)) if b != a and dw[b]), default=0.0)
                            for a in range(len(members)) if dw[a])
            best = max((jaccard(dw[i], dw[j]) for j in range(len(members)) if j != i and dw[j]), default=0.0)
            peers = [v for v in nn if v]  # the median of the members' nearest-neighbor overlaps
            floor = peers[len(peers) // 2] if peers else 0.0
            if not floor or best >= DESC_FLOOR * floor:
                continue
            signals.append("description best overlap %.3f, the group's members %.3f" % (best, floor))
        else:
            if str(x.get("p") or "")[:2] == modal or sc[subj(x.get("n"))] >= 2:
                continue  # no description: both corroborators must disagree, never one alone
            signals.append("no description; subject and TOP family both differ from the group")
        out.append((x, signals))
    return out


def main():
    mem = load_js("unified_courses_members.js")
    aligned = load_js("unified_courses_aligned.js").get("aligned", {})
    joins = json.load(open(os.path.join(ROOT, "kb", "cid_articulation_joins.json"), encoding="utf-8"))
    approved = {(j["control_number"], j["cid"]) for j in joins.get("joins", []) if j.get("disposition") != "coci_conflict"}
    try:
        holds = json.load(open(os.path.join(ROOT, "kb", "reference", "cid_claim_holds.json"), encoding="utf-8")).get("holds", [])
    except (IOError, ValueError):
        holds = []
    held = {(h["control_number"], h["claimed_cid"]) for h in holds}
    desc = load_descriptions()
    cols = mem.get("colleges", [])
    found = []
    for k, v in mem.get("members", {}).items():
        if re.search(r" M\d{3,}$", k):
            continue  # M-IDs are ours; a claim is a C-ID or CCN key
        for x, signals in group_findings(k, v, approved, desc):
            found.append({"claimed_cid": k, "college": cols[x["c"]] if x["c"] < len(cols) else x["c"],
                          "course": x.get("n"), "title": x.get("t"), "top": x.get("p"), "control_number": x.get("cn"),
                          "signals": signals, "held": (x.get("cn"), k) in held,
                          "cpl_articulations_in_group": len(aligned.get(k) or [])})
    found.sort(key=lambda f: (f["held"], -f["cpl_articulations_in_group"], f["claimed_cid"]))
    out = {"_about": __doc__.split("\n\n")[0], "_generated_by": "kb/_audit_cid_claims.py",
           "found": len(found), "not_held": sum(1 for f in found if not f["held"]),
           "holds_in_force": len(holds),
           "findings": found}
    with open(os.path.join(ROOT, "kb", "cid_claim_audit.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"cid claim audit: {len(found)} found, {out['not_held']} not held")


if __name__ == "__main__":
    main()
