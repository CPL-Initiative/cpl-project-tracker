#!/usr/bin/env python3
"""Write the proposed common subject codes into the Common Subjects Reference (S717).

Sam, 2026-11-23: "we don't need to make it 'proposed', instead it should have a confidence bar indicating how sure we
are of it--no human confirmation needed unless confidence is low, in which case we'd ask for human input on the rules
or data you need/use to increase confidence". kb/_csr_propose_codes.py scores each code; this adds every one at
Likely (75%) or better to kb/discipline_canonical_subj4.json as a new discipline entry, source `assigned`, with its
confidence, level and basis. Every code is assigned, whatever its level; a person changes one on the Common Subjects Reference tab, with a note,
and kb/_apply_canonical_subj4.py refuses a change that takes a code already in use.

Only a discipline with no entry is added; an existing entry, a curator's pick above all, is never touched. The
nightly sync (kb/_apply_canonical_subj4.py) keeps the entries and folds any later curator edit onto them. Writes
kb/receipts/csr_assigned_codes_s717.json listing each key added; `git revert` of the commit removes them. Pure stdlib.
  python3 kb/_csr_assign_codes.py           # dry run: what would be added
  python3 kb/_csr_assign_codes.py --apply
"""
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _csr_propose_codes as pc  # noqa: E402

CANON = "kb/discipline_canonical_subj4.json"
RECEIPT = "kb/receipts/csr_assigned_codes_s717.json"
# The handbook's name -> the key the Common Subjects Reference and mq_sections.json use (19th-edition spelling).
KEY = {"Counseling: Extended Opportunity Programs and Services": "Counseling: Extended Opportunity",
       "Health Services Director/Health Services Coordinator/College Nurse": "Health Services Director/Health",
       "Specialized Instruction (Disabled Student Programs and Services): Vocational Noncredit": "Specialized Instruction: Vocational Noncredit"}
BASIS_NOTE = {"cid": "C-ID's own prefix for the discipline", "college": "the local code colleges already use", "minted": "four letters minted from the discipline's name"}


def entry(row, at):
    cid = [row["code"]] if row["basis"] == "cid" else []
    return {"canonical_subj4": row["code"], "source": "assigned", "confidence": row["confidence"], "confidence_level": row["level"],
            "basis": row["basis"], "basis_words": row["words"],
            "data_modal": None, "data_modal_is_4letter": False, "data_modal_share": None, "variants_observed": {}, "total_mids": 0,
            "local_subject_variants": {}, "local_subject_variants_truncated": 0, "local_subject_total": 0, "rows_total": 0,
            "corroborated_voters": 0, "top_only": False, "top_modal_6digit": None, "top_modal_4digit": None, "top_modal_title": None,
            "top_category_2digit": None, "top_category_title": None, "cte_share": None, "cte_flag": None, "cte_known_n": 0, "cte_unknown_n": 0,
            "cip_code": None, "needs_review": False, "reviewed_at": at, "reviewed_by": "csr-s717@bot",   # a machine's pick: the CSR counts it settled, never as a person's
            "validated_at": None, "validated_by": None,
            "_notes": f"Assigned at {row['level']} ({round(row['confidence'] * 100)}%): {BASIS_NOTE[row['basis']]}. {row['words']}. No M-ID is minted under it yet."
                      + (f" {row['note']}" if row.get("note") else ""),
            "ccn_subject_code": None, "cid_subject_codes": cid, "canonical_source": "c-id" if cid else "csr",
            "authority_chips": [], "authority_flag": None if cid else "proposed",
            "authority_note": (f"Common SUBJ {row['code']} is the C-ID subject code." if cid else
                               f"Common SUBJ {row['code']} is assigned by the CSR; no C-ID or CCN code names this discipline's courses yet.")}


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    doc = pc.build()
    if doc["problems"]:
        print("[csr_assign] the proposals have problems; nothing written:\n  " + "\n  ".join(doc["problems"]))
        return 1
    path = os.path.join(ROOT, CANON)
    with open(path, encoding="utf-8") as f:
        canon = json.load(f)
    disc = canon["disciplines"]
    at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    add, held = [], []
    for r in doc["rows"]:
        key = KEY.get(r["discipline"], r["discipline"])
        if not r["assign"]:
            held.append((key, r))
            continue
        if key in disc:
            continue
        add.append((key, r))
    print(f"[csr_assign] {len(add)} codes to add; {len(held)} held: " + ", ".join(f"{k} {r['code']} ({r['level']})" for k, r in held))
    if "--apply" not in argv:
        return 0
    for key, r in add:
        disc[key] = entry(r, at)
    canon["disciplines"] = dict(sorted(disc.items()))
    c = canon.setdefault("_counts", {})
    c["total_disciplines"] = len(disc)
    c["assigned_s717"] = sum(1 for v in disc.values() if v.get("source") == "assigned")
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(canon, ensure_ascii=False, indent=2) + "\n")
    os.makedirs(os.path.dirname(os.path.join(ROOT, RECEIPT)), exist_ok=True)
    with open(os.path.join(ROOT, RECEIPT), "w", encoding="utf-8") as f:
        f.write(json.dumps({"_what": "The common subject codes kb/_csr_assign_codes.py added to kb/discipline_canonical_subj4.json; git revert of the commit removes them.",
                            "at": at, "by": "SkyGannet (S717)", "rule": "r-confidence-not-person-settled-sam-2026-11-23; Sam, 2026-11-23, no confirmation unless confidence is low",
                            "added": [{"key": k, "code": r["code"], "confidence": r["confidence"], "level": r["level"], "basis": r["basis"]} for k, r in add],
                            "held": [{"key": k, "code": r["code"], "confidence": r["confidence"], "level": r["level"], "note": r.get("note", "")} for k, r in held]},
                           ensure_ascii=False, indent=1) + "\n")
    print(f"[csr_assign] wrote {len(add)} entries; receipt {RECEIPT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
