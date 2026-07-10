#!/usr/bin/env python3
"""Trail Crew 🥾 — CCR mountain, wave 1 (method half). READ-ONLY.

Builds the leverage-ordered adjudication work-list for the CCR M-ID mountain
per the playbook's scaling strategy (Sam, 2026-07-10):

  1. Triage by leverage — the ARTICULATED identities first (they carry the
     adoption-leverage payoff and feed the CER/EACR).
  2. Enrich each identity with its Trust Card + member evidence.
  3. Batch for canon-guided adjudicators (the magic half runs as a workflow).

Wave 1 = the TOP N articulated identities by articulation-record count
(default 600 of ~2,144 — the cap is LOGGED, never silent; later waves climb
the rest). Verdict types the batches ask for: discipline confirm/correct,
over-merge split candidates, unit-variant explanations, package candidates
(doctrine P-3/P-11), title fixes (P-10). Splits/merges are EVIDENCE ONLY
(Rule 7); doctrine cites required (kb/merge_doctrine.md v0.2).

Usage:  python3 kb/_ccr_trail.py [N] [BATCH_SIZE] [OUT_DIR]
Writes: <OUT_DIR>/wave1_manifest.json + batch_NN.json files
        (default OUT_DIR kb/ccr_out/<date>/batches — batch files are
        WORKING FILES; only the manifest + report are committed).
"""
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 600
BATCH = int(sys.argv[2]) if len(sys.argv) > 2 else 40
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, "ccr_out", str(date.today()), "batches")


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def main():
    courses = load("coci_minted_courses.json")["courses"]
    sing = load("coci_minted_singletons.json")["courses"]
    mem = load("coci_minted_memberships.json")["memberships"]
    arts = load("coci_articulations.json")["articulations"]
    cards = {c["row_id"]: c for c in load("row_audit/2026-07-10.full.json")["rows"]}

    # leverage = articulation records per identity
    lev, exh = Counter(), defaultdict(set)
    for g in arts:
        c = g.get("course_id")
        if not c or g.get("identity_system") not in (None, "M-ID"):
            continue
        if c in courses or c in sing:
            lev[c] += 1
            if g.get("exhibit_id"):
                exh[c].add(g["exhibit_id"])

    ranked = [c for c, _ in lev.most_common()]
    wave = ranked[:N]
    print(f"articulated M-ID identities: {len(ranked)} | wave 1: {len(wave)} "
          f"(top by leverage; REMAINING {len(ranked) - len(wave)} for later waves — logged, not silent)")

    def enrich(cid):
        r = courses.get(cid) or sing.get(cid) or {}
        card = cards.get(cid) or {}
        members = mem.get(cid) or []
        m_out = [{k: m.get(k) for k in ("college", "subject", "course_number", "units", "credit_status", "top_code")}
                 for m in members[:8]]
        a_out = []
        for g in arts:
            if g.get("course_id") == cid and len(a_out) < 5:
                a_out.append({"exhibit": g.get("exhibit_title"), "credential": g.get("unified_title"),
                              "cpl_type": g.get("cpl_type")})
        ff = card.get("faculty_fields") or {}
        return {
            "id": cid,
            "title": r.get("common_title"),
            "discipline": r.get("discipline"),
            "discipline_state": (ff.get("discipline") or {}).get("state"),
            "discipline_source": (ff.get("discipline") or {}).get("source"),
            "subject": r.get("subject") or cid.split()[0],
            "typical_units": r.get("typical_units"),
            "confidence": r.get("confidence"),
            "subject_spread": r.get("subject_spread"),
            "notes": r.get("_notes"),
            "audit_tags": card.get("tags") or [],
            "leverage": lev[cid],
            "distinct_exhibits": len(exh[cid]),
            "members_total": len(members),
            "members_sample": m_out,
            "member_units": sorted({m.get("units") for m in members if m.get("units") is not None}),
            "member_top_codes": sorted({(m.get("top_code") or "")[:7] for m in members if m.get("top_code")}),
            "articulations_sample": a_out,
        }

    enriched = [enrich(c) for c in wave]
    # batch by discipline so adjudicators see coherent families
    enriched.sort(key=lambda e: (e["discipline"] or "~", -e["leverage"]))
    os.makedirs(OUT, exist_ok=True)
    batches = [enriched[i:i + BATCH] for i in range(0, len(enriched), BATCH)]
    for i, b in enumerate(batches, 1):
        with open(os.path.join(OUT, f"batch_{i:02d}.json"), "w") as f:
            json.dump({"batch": i, "identities": b}, f, indent=1, ensure_ascii=False)

    manifest = {
        "_at": str(date.today()), "_wave": 1,
        "articulated_total": len(ranked), "wave_size": len(wave),
        "remaining_for_later_waves": len(ranked) - len(wave),
        "batch_size": BATCH, "batches": len(batches),
        "leverage_range": [lev[wave[-1]], lev[wave[0]]] if wave else None,
        "discipline_mix": dict(Counter(e["discipline"] or "(blank)" for e in enriched).most_common(15)),
        "seed_untouched_in_wave": sum(1 for e in enriched if (e["discipline_state"] or "").startswith(("seed", "inferred"))),
        "tag_mix": dict(Counter(t for e in enriched for t in e["audit_tags"]).most_common(10)),
        "wave_ids": wave,
    }
    mpath = os.path.join(os.path.dirname(OUT), "wave1_manifest.json")
    with open(mpath, "w") as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)
    print(f"batches: {len(batches)} × ≤{BATCH} → {OUT}")
    print(f"discipline mix (top): {list(manifest['discipline_mix'].items())[:6]}")
    print(f"tag mix: {manifest['tag_mix']}")
    print(f"seed/inferred disciplines in wave: {manifest['seed_untouched_in_wave']}")
    print(f"manifest: {mpath}")


if __name__ == "__main__":
    main()
