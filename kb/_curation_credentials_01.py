"""
Credential curation pass 1 (2026-05-20) — review of the Phase 3 low-confidence
(<0.60) unified_titles classifications. One-shot; edits kb/credentials.json.
Do NOT re-run after further hand-edits; kept for provenance.

Finding: of 242 low-confidence unified titles, 226 are correctly null-issuer
local/non-credential items (course titles, apprenticeship competencies, CBE
references) — left as-is for the COCI course-identity track. 16 carry an
external issuer guess; 14 are correct, 2 are errors.

Actions (reviewer: samueltlee):
- FIX: carpentry apprenticeship items ("Abutments", "Foundations and Flatwork")
  were attributed to IBEW (electrical workers) — wrong for carpentry. Null the
  issuer (local apprenticeship competency, not an external credential).
  Applied dataset-wide, not just the low-confidence set.
- CONFIRM: the other low-confidence issuer identifications (ASE/NCCER/NWCG/OSHA/
  TNCC/Microsoft/CompTIA/CARB/ACE) are correct — mark reviewed.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REVIEWED_AT = "2026-05-20"
REVIEWER = "samueltlee"


def main():
    ut = json.load(open(os.path.join(HERE, "unified_titles.json"), encoding="utf-8"))
    cr = json.load(open(os.path.join(HERE, "credentials.json"), encoding="utf-8"))

    low_titles = {v["unified_title"] for v in ut.values() if v["confidence_title"] < 0.60}

    fixed = 0
    confirmed = 0
    for title, recs in cr.items():
        for r in recs:
            issuer = r.get("issuing_agency") or ""
            # Dataset-wide fix: IBEW wrongly attributed to a carpentry item.
            if "IBEW" in issuer and ("Carpentry" in title or "carpenter" in title.lower()):
                r["issuing_agency"] = None
                r["training_agency"] = None
                r["_notes"] = ("Corrected: local carpentry apprenticeship competency, not an "
                               "external IBEW (electrical) credential — issuer null. "
                               "Course-track item. Credential curation 2026-05-20.")
                r["reviewed_at"] = REVIEWED_AT
                r["reviewed_by"] = REVIEWER
                fixed += 1
            # Confirm the correct external-issuer identifications in the low set.
            elif title in low_titles and r.get("issuing_agency"):
                r["_notes"] = ((r.get("_notes") or "") +
                               " | Issuer confirmed (credential curation 2026-05-20).").strip(" |")
                r["reviewed_at"] = REVIEWED_AT
                r["reviewed_by"] = REVIEWER
                confirmed += 1

    cr = {k: cr[k] for k in sorted(cr)}
    with open(os.path.join(HERE, "credentials.json"), "w", encoding="utf-8") as f:
        json.dump(cr, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"credentials curation: fixed {fixed} (IBEW/carpentry), confirmed {confirmed} issuers.")


if __name__ == "__main__":
    main()
