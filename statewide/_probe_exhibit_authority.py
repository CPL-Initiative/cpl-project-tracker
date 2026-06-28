#!/usr/bin/env python3
"""Probe: which data combo identifies the AUTHORITATIVE statewide exhibit?

Problem: each statewide credential groups to one card, but adopting colleges tag
their ADAPTED exhibit "CCC Collaborative" too, so the rec list inflates (POST →
15 ExhibitIDs / 42 recs vs the authoritative ~10). We need the column combo that
marks the ONE authoritative (MAP-published) statewide exhibit so we can keep only
its recs.

A runner CAN reach the unauthenticated MAP Custom Report API (the agent sandbox
can't). This pulls View_ArticulatedMAPExhibits and, for a few sample credentials,
prints every ExhibitID's (College, Articulation College, Version, Collaborative
Type, row count, distinct recs) so the authoritative signal becomes obvious.
Curriculum/articulation data only — NO student PII. Prints to the log; commits
nothing.
"""
import json
import sys
import urllib.request

API_URL = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
PAYLOAD = [{
    "viewName": "View_ArticulatedMAPExhibits_APIDataset",
    "columnName": ["College", "ExhibitID", "Exhibit Title", "Version Number",
                   "Articulation College", "Course", "Credit Recommendation",
                   "Collaborative Type", "TOP Code", "CID Number",
                   "Mode Of Learning", "CPL Mode of Learning", "CPL Type",
                   "CPL Type Description"]
}]
SAMPLES = ["POST Basic Academy", "Peace Officer Standards and Training",
           "EMT Certification", "Real Estate Salesperson"]


def banner(t):
    print("\n" + "=" * 72 + "\n" + t + "\n" + "=" * 72, flush=True)


def main():
    req = urllib.request.Request(API_URL, data=json.dumps(PAYLOAD).encode(),
                                 method="POST", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read().decode("utf-8", "replace"))
    ds = None
    for rep in (data if isinstance(data, list) else [data]):
        if "Exhibit" in (rep.get("viewName") or ""):
            ds = rep
            break
    if not ds:
        print("exhibit dataset not found; top-level:", [r.get("viewName") for r in data]); return 1
    cm = {c: i for i, c in enumerate(ds["columnName"])}
    print("columns:", ds["columnName"])
    rows = ds["columnValue"]
    print("total exhibit rows:", len(rows))

    def g(row, col, d=""):
        i = cm.get(col)
        return (row[i] if i is not None and i < len(row) else d) or ""

    for sample in SAMPLES:
        match = [r for r in rows if sample.lower() in (g(r, "Exhibit Title") or "").lower()]
        if not match:
            continue
        banner(f"{sample!r}: {len(match)} rows")
        # Per ExhibitID, summarize the distinguishing columns + its recs.
        by_eid = {}
        for r in match:
            eid = g(r, "ExhibitID")
            d = by_eid.setdefault(eid, {"college": set(), "artic": set(), "ver": set(),
                                        "collab": set(), "cpltype": set(), "recs": set(),
                                        "cids": set(), "n": 0})
            d["n"] += 1
            d["college"].add(g(r, "College"))
            d["artic"].add(g(r, "Articulation College"))
            d["ver"].add(g(r, "Version Number"))
            d["collab"].add(g(r, "Collaborative Type"))
            d["cpltype"].add(g(r, "CPL Type Description"))
            cr = g(r, "Credit Recommendation")
            if cr:
                d["recs"].add(cr)
            cidv = g(r, "CID Number")
            if cidv:
                d["cids"].add(cidv)
        print(f"  distinct ExhibitIDs: {len(by_eid)}")
        for eid, d in sorted(by_eid.items(), key=lambda kv: -kv[1]["n"]):
            blank_artic = "" in d["artic"] or not any(d["artic"])
            print(f"\n  ExhibitID={eid}  rows={d['n']}")
            print(f"     College(owner)={sorted(d['college'])}")
            print(f"     ArticulationCollege has-blank={bool('' in d['artic'])} distinct={len([a for a in d['artic'] if a])}")
            print(f"     Version={sorted(d['ver'])}  Collab={sorted(d['collab'])}  CPLType={sorted(d['cpltype'])}")
            print(f"     distinct recs={len(d['recs'])}  cids={sorted(d['cids'])[:8]}")
            for rec in sorted(d["recs"])[:14]:
                print("        -", rec)
    banner("DONE — look for the column(s) that single out the authoritative ExhibitID")
    return 0


if __name__ == "__main__":
    sys.exit(main())
