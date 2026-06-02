"""
CER unclassified-triage PR-3 — the FOLD.

Promotes confirmed worklist assignments (kb/unclassified_assignments.json, synced
from the Supabase _UNCLASSIFIED:: namespace) into the curated credential KB so
the raw titles leave the `unclassified_in_map` queue and render as credential
rows:

  - kb/unified_titles.json        ADD raw_title -> {unified_title, confidence 1.0,
                                  classified_by curator, reviewed_*}. This is what
                                  classifies the title (removes it from the
                                  unclassified set on the next audit).
  - kb/credentials.json           ENSURE a record exists for the assigned
                                  unified_title; ADD one (with the assigned issuer)
                                  only if the title has none. Existing credential
                                  records are authoritative + left untouched.
  - kb/exhibit_audit/latest.json  PRUNE the folded raw titles from the unclassified
                                  set (set unified_title on their title_card, drop
                                  the `unclassified_in_map` tag, fix the two count
                                  fields) so the worklist reflects the fold
                                  immediately (the exhibit auditor isn't in the
                                  daily cron + needs the PII-purged CustomReport).

DRY-RUN by default; --apply writes the files. Reads the COMMITTED overlay (not
Supabase) so it's deterministic + reviewable. Idempotent: an assignment already
classified to the same target is SKIPPED; one already classified to a DIFFERENT
target is a CONFLICT (rejected, never clobbered).

V-gates:
  V1 apply_safe          — no CONFLICTs.
  V2 target_credential   — every assigned unified_title has a credentials.json
                           record after the fold.
  V3 additive_only       — apply adds only NEW raw keys; no existing unified_titles
                           entry is modified; count delta == #clean.
  V4 no_articulation_ripple — for each folded raw, 0 coci_articulations.json records
                           whose exhibit_title is that raw but whose inlined
                           unified_title differs from the assignment (else manual
                           handling — don't silently rewrite the articulations layer).

Run from repo root:
  python3 kb/_fold_unclassified.py            # dry-run (report only)
  python3 kb/_fold_unclassified.py --apply    # writes the KB + receipt
"""
import json
import os
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OVERLAY = os.path.join(HERE, "unclassified_assignments.json")
UT_PATH = os.path.join(HERE, "unified_titles.json")
CR_PATH = os.path.join(HERE, "credentials.json")
AUDIT_PATH = os.path.join(HERE, "exhibit_audit", "latest.json")
ART_PATH = os.path.join(HERE, "coci_articulations.json")
OUTDIR = os.path.join(HERE, "unclassified_fold", date.today().isoformat())

CLASSIFIED_BY = "curator (CER unclassified-triage)"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def classify(assignments, ut):
    """Bucket each assignment as clean / skip / conflict."""
    clean, skip, conflict = [], [], []
    for raw, a in sorted(assignments.items()):
        assigned = (a.get("unified_title") or "").strip()
        rec = {"raw": raw, "assigned": assigned, "issuer": (a.get("issuing_agency") or "").strip(),
               "reviewed_by": a.get("reviewed_by"), "reviewed_at": a.get("reviewed_at")}
        if not assigned:
            conflict.append({**rec, "why": "empty unified_title"})
        elif raw not in ut:
            clean.append(rec)
        elif (ut[raw].get("unified_title") or "") == assigned:
            skip.append({**rec, "why": "already classified to the same target"})
        else:
            conflict.append({**rec, "why": f"already classified to {ut[raw].get('unified_title')!r}"})
    return clean, skip, conflict


def articulation_ripples(clean, art):
    """For each folded raw, count articulation records whose exhibit_title is that
    raw but whose inlined unified_title differs from the assignment."""
    rows = art.get("articulations", []) if isinstance(art, dict) else []
    want = {r["raw"]: r["assigned"] for r in clean}
    ripples = []
    for i, a in enumerate(rows):
        if not isinstance(a, dict):
            continue
        ex = a.get("exhibit_title")
        if ex in want and (a.get("unified_title") or "") != want[ex]:
            ripples.append({"idx": i, "raw": ex, "has": a.get("unified_title"), "want": want[ex]})
    return ripples


def main():
    apply = "--apply" in sys.argv
    assignments = load(OVERLAY).get("assignments", {})
    ut = load(UT_PATH)
    cr = load(CR_PATH)

    if not assignments:
        print("No assignments in the overlay — nothing to fold.")
        return

    clean, skip, conflict = classify(assignments, ut)

    # Articulation ripple scan (load the big file only when there's work to do).
    ripples = []
    if clean:
        ripples = articulation_ripples(clean, load(ART_PATH))

    # Which assigned unified_titles lack a credentials.json record? (would be added)
    cred_adds = []
    for r in clean:
        t = r["assigned"]
        if not cr.get(t):
            cred_adds.append(r)

    # ---- V-gates ----
    v1 = not conflict
    v2 = True  # every clean target either has a credential record or we add one below
    v3 = True  # enforced structurally by only inserting new keys
    v4 = not ripples
    gates = {"V1_apply_safe": v1, "V2_target_credential": v2,
             "V3_additive_only": v3, "V4_no_articulation_ripple": v4}
    apply_safe = all(gates.values())

    # ---- report ----
    print(f"overlay assignments: {len(assignments)}")
    print(f"  CLEAN (will add):   {len(clean)}")
    for r in clean:
        print(f"     + {r['raw']!r} -> {r['assigned']!r}"
              + ("  [+credential]" if r in cred_adds else ""))
    print(f"  SKIP (already):     {len(skip)}")
    for r in skip:
        print(f"     = {r['raw']!r} ({r['why']})")
    print(f"  CONFLICT (rejected):{len(conflict)}")
    for r in conflict:
        print(f"     ! {r['raw']!r} ({r['why']})")
    print(f"  articulation ripples: {len(ripples)}")
    for r in ripples[:10]:
        print(f"     ~ art[{r['idx']}] {r['raw']!r}: has {r['has']!r}, want {r['want']!r}")
    print("  V-gates: " + ", ".join(f"{k}={'OK' if v else 'FAIL'}" for k, v in gates.items()))
    print(f"  apply_safe: {apply_safe}")

    os.makedirs(OUTDIR, exist_ok=True)
    report = {
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": "apply" if apply else "dry-run",
        "gates": gates, "apply_safe": apply_safe,
        "clean": clean, "skip": skip, "conflict": conflict,
        "credential_adds": cred_adds, "articulation_ripples": ripples,
    }
    with open(os.path.join(OUTDIR, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write("\n")

    if not apply:
        print(f"\nDRY-RUN — wrote {os.path.relpath(OUTDIR, ROOT)}/report.json. "
              f"Re-run with --apply to fold.")
        return
    if not apply_safe:
        sys.exit("APPLY BLOCKED — a V-gate failed (see report). Resolve conflicts/ripples first.")

    # ---- apply (additive) ----
    today = date.today().isoformat()
    ut_before = len(ut)
    for r in clean:
        ut[r["raw"]] = {
            "unified_title": r["assigned"],
            "confidence_title": 1.0,
            "classified_at": today,
            "classified_by": CLASSIFIED_BY,
            "reviewed_at": r["reviewed_at"],
            "reviewed_by": r["reviewed_by"],
        }
    assert len(ut) == ut_before + len(clean), "V3 violated: unexpected unified_titles delta"

    for r in cred_adds:
        cr.setdefault(r["assigned"], []).append({
            "issuing_agency": r["issuer"] or None,
            "training_agency": None,
            "confidence_issuer": 1.0,
            "confidence_trainer": 0.9,
            "classified_at": today,
            "classified_by": CLASSIFIED_BY,
            "reviewed_at": r["reviewed_at"],
            "reviewed_by": r["reviewed_by"],
        })

    # Prune the folded raws from the exhibit-audit snapshot so the worklist drops
    # them immediately (auditor isn't in the cron + needs the purged CustomReport).
    pruned = 0
    if os.path.exists(AUDIT_PATH):
        audit = load(AUDIT_PATH)
        # Prune every overlay-assigned raw that's now classified — the CLEAN ones
        # this fold just added AND the SKIP ones already classified (stale audit
        # snapshot) — so the worklist drops all the curator acted on, not just the
        # new adds.
        folded = {r["raw"]: r["assigned"] for r in (clean + skip)}
        for card in audit.get("title_cards", []):
            if card.get("raw_title") in folded and not card.get("unified_title"):
                card["unified_title"] = folded[card["raw_title"]]
                card["tags"] = [t for t in (card.get("tags") or []) if t != "unclassified_in_map"]
                pruned += 1
        st = audit.get("stats", {})
        if "tag_counts" in st and "unclassified_in_map" in st["tag_counts"]:
            st["tag_counts"]["unclassified_in_map"] = max(0, st["tag_counts"]["unclassified_in_map"] - pruned)
        if st.get("unclassified_in_map") is not None:
            st["unclassified_in_map"] = max(0, st["unclassified_in_map"] - pruned)
        # Match the auditor's on-disk format exactly (minified, no trailing newline)
        # so the prune is a 1-line diff, not a 55k-line reformat.
        with open(AUDIT_PATH, "w", encoding="utf-8") as f:
            json.dump(audit, f, ensure_ascii=False, separators=(",", ":"))

    with open(UT_PATH, "w", encoding="utf-8") as f:
        json.dump(ut, f, indent=2, ensure_ascii=False)
        f.write("\n")
    if cred_adds:
        with open(CR_PATH, "w", encoding="utf-8") as f:
            json.dump(cr, f, indent=2, ensure_ascii=False)
            f.write("\n")

    applied = {"folded": clean, "credential_added": cred_adds, "audit_pruned": pruned,
               "unified_titles_count": len(ut)}
    with open(os.path.join(OUTDIR, "applied.json"), "w", encoding="utf-8") as f:
        json.dump(applied, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nAPPLIED — folded {len(clean)} into unified_titles.json "
          f"({ut_before} -> {len(ut)}), {len(cred_adds)} credential record(s) added, "
          f"{pruned} audit card(s) pruned. Receipt: {os.path.relpath(OUTDIR, ROOT)}/")


if __name__ == "__main__":
    main()
