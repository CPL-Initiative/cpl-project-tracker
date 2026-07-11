#!/usr/bin/env python3
"""Trail Crew 🥾 — CCR mountain, wave scanner (method half). READ-ONLY.

Builds the leverage-ordered adjudication work-list for the CCR M-ID mountain
per the playbook's scaling strategy (Sam, 2026-07-10):

  1. Triage by leverage — the ARTICULATED identities first (they carry the
     adoption-leverage payoff and feed the CER/EACR), then corroborated
     multi-college M-IDs, then the dark single-college tail.
  2. Enrich each identity with its Trust Card + member evidence + the
     vocational context (per-identity TOP-derived `cte` and the MQ 19th-ed
     `mq_list` — added Session 112 after a wave-2 adjudicator asked for
     "the official MQ Disciplines List" it was never given, and 16 wave-1
     discipline proposals bounced at fire time as not-exact-MQ-name).
  3. Batch for canon-guided adjudicators (the magic half runs as a workflow).

Strata:
  articulated (default) — ranked by articulation-record count. Waves 1–2
      (ranks 1–600, 601–2,144) adjudicated this ENTIRE face.
  multi — the corroborated multi-college stratum: identities with >= 2
      members, NOT already adjudicated (wave_ids of every committed
      kb/ccr_out/*/wave*_manifest.json are excluded), ranked by member
      count (corroboration = leverage), tiebreak audit-tag count.

Usage:  python3 kb/_ccr_trail.py [N] [BATCH_SIZE] [OUT_DIR] [START]
                                 [--stratum articulated|multi] [--wave K]
        START is a 0-based rank offset into the stratum (wave 2 used 600).
Writes: <OUT_DIR>/../wave<K>_manifest.json + <OUT_DIR>/batch_NN.json files
        (batch files are WORKING FILES; only the manifest + report are
        committed). Caps are LOGGED, never silent.
"""
import glob
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))

args, flags = [], {}
argv = sys.argv[1:]
i = 0
while i < len(argv):
    a = argv[i]
    if a.startswith("--"):
        if i + 1 < len(argv) and not argv[i + 1].startswith("--"):
            flags[a.lstrip("-")] = argv[i + 1]
            i += 2
        else:
            flags[a.lstrip("-")] = "1"
            i += 1
    else:
        args.append(a)
        i += 1
N = int(args[0]) if len(args) > 0 else 600
BATCH = int(args[1]) if len(args) > 1 else 40
OUT = args[2] if len(args) > 2 else os.path.join(HERE, "ccr_out", str(date.today()), "batches")
START = int(args[3]) if len(args) > 3 else 0
STRATUM = flags.get("stratum", "articulated")
WAVE = int(flags.get("wave", "1"))


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def prior_wave_ids():
    """Every id already adjudicated per the committed wave manifests."""
    done = set()
    for path in sorted(glob.glob(os.path.join(HERE, "ccr_out", "*", "wave*_manifest.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                done.update(json.load(f).get("wave_ids") or [])
        except Exception as e:  # a bad manifest should be loud, not skipped
            raise SystemExit(f"unreadable wave manifest {path}: {e}")
    return done


def latest_audit():
    paths = sorted(glob.glob(os.path.join(HERE, "row_audit", "*.full.json")))
    if not paths:
        raise SystemExit("no kb/row_audit/*.full.json found")
    return paths[-1]


def main():
    courses = load("coci_minted_courses.json")["courses"]
    sing = load("coci_minted_singletons.json")["courses"]
    mem = load("coci_minted_memberships.json")["memberships"]
    arts = load("coci_articulations.json")["articulations"]
    audit_path = latest_audit()
    cards = {c["row_id"]: c for c in load(os.path.relpath(audit_path, HERE))["rows"]}
    mq = load(os.path.join("reference", "mq_sections.json"))["disciplines"]

    # articulation leverage (used as evidence in every stratum)
    lev, exh = Counter(), defaultdict(set)
    for g in arts:
        c = g.get("course_id")
        if not c or g.get("identity_system") not in (None, "M-ID"):
            continue
        if c in courses or c in sing:
            lev[c] += 1
            if g.get("exhibit_id"):
                exh[c].add(g["exhibit_id"])

    if STRATUM == "articulated":
        ranked = [c for c, _ in lev.most_common()]
        pool_desc = f"articulated M-ID identities: {len(ranked)}"
    elif STRATUM == "multi":
        done = prior_wave_ids()
        pool = [(cid, len(mem.get(cid) or [])) for cid in courses
                if cid not in done and len(mem.get(cid) or []) >= 2]
        pool.sort(key=lambda t: (-t[1], -len((cards.get(t[0]) or {}).get("tags") or []), t[0]))
        ranked = [c for c, _ in pool]
        pool_desc = (f"multi-college stratum: {len(ranked)} identities with >=2 members "
                     f"({len(done)} prior-wave ids excluded)")
    else:
        raise SystemExit(f"unknown stratum {STRATUM!r}")

    wave = ranked[START:START + N]
    print(f"{pool_desc} | wave {WAVE}: {len(wave)} (ranks {START + 1}-{START + len(wave)}; "
          f"REMAINING {len(ranked) - START - len(wave)} for later waves — logged, not silent)")

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
        mq_rec = mq.get(r.get("discipline") or "") or {}
        return {
            "id": cid,
            "title": r.get("common_title"),
            "discipline": r.get("discipline"),
            "discipline_state": (ff.get("discipline") or {}).get("state"),
            "discipline_source": (ff.get("discipline") or {}).get("source"),
            # vocational context (Session 112): cte = TOP-manual CTE designation
            # already stamped on the row (kb/_join_cte_from_top.py); mq_list =
            # MQ 19th-ed faculty-qualification list for the CURRENT discipline
            # (masters / not_masters / both_lists / noncredit_53412) — a
            # re-discipline changes the implied faculty-qualification pool.
            "cte": r.get("cte"),
            "mq_list": mq_rec.get("mq_list"),
            "mq_special_ccr": mq_rec.get("special_ccr"),
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
    enriched.sort(key=lambda e: (e["discipline"] or "~", -e["members_total"], -e["leverage"]))
    os.makedirs(OUT, exist_ok=True)
    batches = [enriched[i:i + BATCH] for i in range(0, len(enriched), BATCH)]
    for i, b in enumerate(batches, 1):
        with open(os.path.join(OUT, f"batch_{i:02d}.json"), "w") as f:
            json.dump({"batch": i, "identities": b}, f, indent=1, ensure_ascii=False)

    manifest = {
        "_at": str(date.today()), "_wave": WAVE, "_stratum": STRATUM, "_rank_start": START + 1,
        "_audit_snapshot": os.path.basename(audit_path),
        "stratum_total": len(ranked), "wave_size": len(wave),
        "remaining_for_later_waves": len(ranked) - START - len(wave),
        "batch_size": BATCH, "batches": len(batches),
        "leverage_range": [lev[wave[-1]], lev[wave[0]]] if wave else None,
        "members_range": [len(mem.get(wave[-1]) or []), len(mem.get(wave[0]) or [])] if wave else None,
        "discipline_mix": dict(Counter(e["discipline"] or "(blank)" for e in enriched).most_common(15)),
        "mq_mix": dict(Counter(e["mq_list"] or "(no MQ entry)" for e in enriched)),
        "cte_mix": dict(Counter(str(e["cte"]) for e in enriched)),
        "seed_untouched_in_wave": sum(1 for e in enriched if (e["discipline_state"] or "").startswith(("seed", "inferred"))),
        "tag_mix": dict(Counter(t for e in enriched for t in e["audit_tags"]).most_common(10)),
        "wave_ids": wave,
    }
    mpath = os.path.join(os.path.dirname(OUT), f"wave{WAVE}_manifest.json")
    with open(mpath, "w") as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)
    print(f"batches: {len(batches)} × ≤{BATCH} → {OUT}")
    print(f"discipline mix (top): {list(manifest['discipline_mix'].items())[:6]}")
    print(f"mq mix: {manifest['mq_mix']} | cte mix: {manifest['cte_mix']}")
    print(f"tag mix: {manifest['tag_mix']}")
    print(f"seed/inferred disciplines in wave: {manifest['seed_untouched_in_wave']}")
    print(f"manifest: {mpath}")


if __name__ == "__main__":
    main()
