"""
Re-mint generator — STEP 1b: re-key coci_articulations.json onto the new minted
identities and realize the split promotions.

Reads the LIVE kb/coci_articulations.json + the step-1a preview
(kb/remint_out/{alias_map,coci_minted_courses,coci_minted_singletons,
coci_minted_memberships}.json) and writes kb/remint_out/coci_articulations.json.
Writes nothing to live files or Supabase.

METHOD. Each earned articulation was already resolved (by the seed) to an
identity: a C-ID/CCN when the MAP row carried a CID Number, else an M-ID. So:
  - C-ID/CCN identities + their records pass through unchanged (CID-bearing rows
    were already routed to the official identity — the promotion is already there).
  - M-ID identities are re-keyed via the 1a alias (old M-ID -> new id), 1:1, and
    their `colleges_offering` is RECOMPUTED from the new control-number membership
    (the exact member-college set) instead of the old lossy (subject,number) union.
    `adoption_leverage` = offering - earned is recomputed per record.
This realizes the 2,083 splits: a split M-ID's offering shrinks to its true
remnant colleges (the official-bearing members are no longer over-counted), so
inflated leverage deflates. over_merged / subject_spread / credit flags are
refreshed from the re-keyed catalog so records stay consistent with step 1a.
"""
import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "remint_out")
OVER_MERGE_SPREAD = 8


def load(p):
    return json.load(open(p, encoding="utf-8"))


def main():
    old = load(os.path.join(HERE, "coci_articulations.json"))
    alias = load(os.path.join(OUT_DIR, "alias_map.json"))["alias"]
    cat = load(os.path.join(OUT_DIR, "coci_minted_courses.json"))["courses"]
    sing = load(os.path.join(OUT_DIR, "coci_minted_singletons.json"))["courses"]
    mem = load(os.path.join(OUT_DIR, "coci_minted_memberships.json"))["memberships"]

    # New exact member-college set per new identity (the over-merge fix).
    new_offering = {}
    for nid, members in mem.items():
        new_offering[nid] = {m["college"] for m in members if m.get("college")}
    for nid, r in sing.items():
        new_offering[nid] = {r["college"]} if r.get("college") else set()

    def new_meta(nid):
        r = cat.get(nid) or sing.get(nid) or {}
        spread = r.get("subject_spread", 1) or 1
        return {
            "identity_system": "M-ID", "title": r.get("common_title"),
            "discipline": r.get("discipline"), "confidence": r.get("confidence"),
            "subject_spread": r.get("subject_spread", 1),
            "over_merged": spread >= OVER_MERGE_SPREAD,
            "is_singleton": nid in sing,
            "credit_status": r.get("credit_status"),
            "credit_status_mixed": bool(r.get("credit_status_mixed")),
            "top_code_mixed": bool(r.get("top_code_mixed")),
            "noncredit_category_mixed": bool(r.get("noncredit_category_mixed")),
        }

    # ── identities ──
    identities = {}
    for oid, meta in old["identities"].items():
        if meta.get("identity_system") == "M-ID":
            nid = alias[oid]
            m = new_meta(nid)
            off = sorted(new_offering.get(nid, set()))
            m["colleges_offering"] = off
            m["colleges_offering_count"] = len(off)
            identities[nid] = m
        else:  # C-ID / CCN — unchanged (offering already complete via CID Number)
            identities[oid] = meta

    # ── articulation records ──
    records = []
    leverage_old = leverage_new = 0
    for g in old["articulations"]:
        g = dict(g)
        oid = g["course_id"]
        leverage_old += g.get("adoption_leverage_count", 0)
        if g["identity_system"] == "M-ID":
            nid = alias[oid]
            g["course_id"] = nid
            g["_remint_from"] = oid
            m = identities[nid]
            g["over_merged"] = m["over_merged"]
            g["identity_confidence"] = m["confidence"]
            offering = set(m["colleges_offering"])
        else:
            offering = set(identities[oid]["colleges_offering"])
        adoptable = sorted(offering - set(g.get("earned_by_colleges", [])))
        g["adoption_leverage"] = adoptable
        g["adoption_leverage_count"] = len(adoptable)
        leverage_new += len(adoptable)
        records.append(g)
    records.sort(key=lambda x: (x["course_id"], x.get("exhibit_id", "")))

    n_with = sum(1 for g in records if g["adoption_leverage_count"])
    out = {
        "_status": "PREVIEW — step 1b re-key of coci_articulations onto the re-minted identities.",
        "_method": ("M-ID identities re-keyed via the 1a alias (1:1); colleges_offering recomputed "
                    "from the new College/CourseControlNumber membership (exact), so over-merged "
                    "leverage deflates. C-ID/CCN identities + records pass through unchanged."),
        "_generated_by": "kb/_remint_apply_articulations.py",
        "_supersedes": "kb/coci_articulations.json (live, old keys)",
        "identities_with_articulations": len(identities),
        "articulation_records": len(records),
        "records_with_nonempty_leverage": n_with,
        "total_adoption_leverage": leverage_new,
        "total_adoption_leverage_before_remint": leverage_old,
        "identities": dict(sorted(identities.items())),
        "articulations": records,
    }
    with open(os.path.join(OUT_DIR, "coci_articulations.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    n_mid = sum(1 for m in identities.values() if m["identity_system"] == "M-ID")
    print(f"identities: {len(identities)} (M-ID re-keyed {n_mid}, C-ID/CCN passthrough {len(identities)-n_mid})")
    print(f"records: {len(records)} | with leverage: {n_with}")
    print(f"total adoption leverage: {leverage_old:,} (old) -> {leverage_new:,} (re-mint); "
          f"deflation {leverage_old-leverage_new:,} from the over-merge fix")
    print(f"wrote {os.path.join(OUT_DIR,'coci_articulations.json')}")


if __name__ == "__main__":
    main()
