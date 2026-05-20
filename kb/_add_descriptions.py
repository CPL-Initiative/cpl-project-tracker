"""
Add consolidated course descriptions to kb/common_courses.json.

One-shot, reproducible from the committed state:
    python3 kb/_add_descriptions.py
Do NOT re-run after further hand-edits; kept for provenance.

Adds two fields to every catalog entry (placed after `common_title`):
  - description        : the course description, or null
  - description_source : "C-ID" | "C-ID (cross-listed <id>)" | null

Population policy (2026-05-20):
  - C-ID entries -> authoritative C-ID descriptor text from
    kb/reference/cid_descriptors.json.
  - Cross-listed M-ID mirrors with no description inherit their C-ID
    sibling's description (same course), source "C-ID (cross-listed <id>)".
  - CCN and the remaining synthetic M-ID descriptions -> null for now;
    M-ID synthesis is deferred to the Phase 3 classification pass.
"""
import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))


def with_after(rec, anchor, **fields):
    """Return a copy of rec with `fields` inserted right after `anchor` key."""
    out = {}
    for k, v in rec.items():
        if k in fields:
            continue
        out[k] = v
        if k == anchor:
            for fk, fv in fields.items():
                out[fk] = fv
    for fk, fv in fields.items():
        out.setdefault(fk, fv)
    return out


def main():
    cc = json.load(open(os.path.join(HERE, "common_courses.json")))
    cid_ref = json.load(open(os.path.join(HERE, "reference", "cid_descriptors.json")))
    desc_by_cid = {d["descriptor"]: d.get("description") or None
                   for d in cid_ref["descriptors"]}

    # 1) Add fields (null) after common_title; populate C-ID descriptions.
    for k, v in list(cc.items()):
        desc, src = None, None
        if v["id_system"] == "C-ID" and v.get("c_id") in desc_by_cid:
            desc = desc_by_cid[v["c_id"]]
            src = "C-ID" if desc else None
        cc[k] = with_after(v, "common_title", description=desc, description_source=src)

    # 2) Cross-listing inheritance: a mirror without a description borrows
    #    a group sibling's (same course).
    groups = defaultdict(list)
    for k, v in cc.items():
        g = v.get("cross_listing_group")
        if g:
            groups[g].append(k)
    for g, members in groups.items():
        donor = next((m for m in members if cc[m]["description"]), None)
        if not donor:
            continue
        for m in members:
            if not cc[m]["description"]:
                cc[m]["description"] = cc[donor]["description"]
                cc[m]["description_source"] = f"C-ID (cross-listed {donor})"

    cc = {k: cc[k] for k in sorted(cc)}
    with open(os.path.join(HERE, "common_courses.json"), "w") as f:
        json.dump(cc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    with_desc = sum(1 for v in cc.values() if v["description"])
    from collections import Counter
    bysrc = Counter(v["description_source"] for v in cc.values() if v["description"])
    print(f"entries: {len(cc)} | with description: {with_desc}")
    print(f"by source: {dict(bysrc)}")


if __name__ == "__main__":
    main()
