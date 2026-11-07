#!/usr/bin/env python3
"""Find COCI C-ID claims that four signals call a mis-entry (SkyHarbor, 2026-11-06).

A college enters a course's C-ID in COCI with no gatekeeper, and the identity layer
trusts it. Moreno Valley College's HES 1 Health Science claimed HIST 150 (World History
to 1500), so its Basic Military Training articulation read as a peer path to every world
history course (Sam, 2026-11-06: "Definitely don't want Sierra recommending this").

A member of a C-ID group is reported when all four agree:
  1. the ASCCC approval table (kb/cid_articulation_joins.json) holds no approval of that
     course under that C-ID;
  2. its subject is shared by no other member (a subject two members share is a real
     cross-listing);
  3. its TOP family differs from the group's most common family;
  4. its title shares no content word with any other member's title.
The group must have three or more members. Measured 2026-11-06: 2 statewide.

Writes kb/cid_claim_audit.json: each finding, whether kb/reference/cid_claim_holds.json
already holds it, and the CPL articulations its group carries. A finding not yet held is
an item for the team: hold it (with the home its sister colleges give it) and ask the
college to correct COCI. Read-only on everything else; run daily after the export.

    python3 kb/_audit_cid_claims.py
"""
from __future__ import annotations

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
    cols = mem.get("colleges", [])
    found = []
    for k, v in mem.get("members", {}).items():
        if re.search(r" M\d{3,}$", k) or len(v) < 3:
            continue  # M-IDs are ours; a claim is a C-ID or CCN key
        fam = Counter(str(x.get("p") or "")[:2] for x in v)
        modal = fam.most_common(1)[0][0]
        sc = Counter(subj(x.get("n")) for x in v)
        for x in v:
            if str(x.get("p") or "")[:2] == modal or sc[subj(x.get("n"))] >= 2 or (x.get("cn"), k) in approved:
                continue
            others = set()
            for y in v:
                if y is not x:
                    others |= words(y.get("t"))
            if words(x.get("t")) & others:
                continue
            found.append({"claimed_cid": k, "college": cols[x["c"]] if x["c"] < len(cols) else x["c"],
                          "course": x.get("n"), "title": x.get("t"), "top": x.get("p"), "control_number": x.get("cn"),
                          "held": (x.get("cn"), k) in held,
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
