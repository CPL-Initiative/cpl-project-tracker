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
target by a HUMAN is a CONFLICT (rejected, never clobbered).

SUPERSEDE lane (added 2026-07-07 — the Sam triage-of-2026-07-07 case): when the
existing classification standing in the way is an UNREVIEWED MACHINE draft
(reviewed_by empty + classified_by is not the curator sentinel — e.g. the
0.40-0.45-confidence Phase-3 batch fallbacks like "AUTO 600 — Long Beach City
College Auto Course"), the curator's worklist assignment WINS: the entry is
re-pointed to the assigned title (confidence 1.0, curator provenance,
source_exhibit_ids preserved). This also covers WHITESPACE-TWIN spellings —
MAP data carries e.g. both "AUTO 600 Completion" and "AUTO 600 Completion "
(trailing space); the audit lists the trimmed one as unclassified while the
KB classified the padded one — every spelling whose .strip() matches the
assigned raw is superseded together, so the credential row consolidates
instead of splitting on invisible whitespace. Ripple handling for superseded
raws: their coci_articulations.json rows are re-pointed to the assigned title
in the same apply (receipted) — that's methodology strategy 3
(docs/kb-notes/methodology-cer-fold-articulation-ripple-sync.md) made
mechanical for the one case where it's unambiguous (the displaced title is a
machine draft, not a valid alternate spelling). Machine credential records
orphaned by a supersede (no raw maps to them anymore, record unreviewed) are
pruned. A target credential record that is unreviewed-machine with a NULL
issuer gains the assignment's issuer (stamped curator).

V-gates:
  V1 apply_safe          — no CONFLICTs (human-reviewed disagreements only;
                           unreviewed machine drafts route to SUPERSEDE).
  V2 target_credential   — every assigned unified_title has a credentials.json
                           record after the fold.
  V3 additive_plus_declared — apply adds only NEW raw keys and modifies only the
                           DECLARED superseded spellings; count delta == #clean.
  V4 no_articulation_ripple — for each folded raw, 0 coci_articulations.json records
                           whose exhibit_title is that raw but whose inlined
                           unified_title differs from the assignment, EXCEPT
                           ripples on superseded raws (resolved by the in-apply
                           re-point). Remaining ripples (clean-lane raws — the
                           "two valid spellings" case) still block for the human
                           call per the methodology note.

Run from repo root:
  python3 kb/_fold_unclassified.py                  # dry-run (report only)
  python3 kb/_fold_unclassified.py --apply          # writes the KB + receipt
  python3 kb/_fold_unclassified.py --apply-if-safe  # cron mode: apply when all
                                                    # V-gates pass, else report +
                                                    # exit 0 (never fails the run)
"""
import json
import os
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OVERLAY = os.path.join(HERE, "unclassified_assignments.json")
SUGGEST = os.path.join(HERE, "unclassified_suggestions.json")
UT_PATH = os.path.join(HERE, "unified_titles.json")
CR_PATH = os.path.join(HERE, "credentials.json")
AUDIT_PATH = os.path.join(HERE, "exhibit_audit", "latest.json")
ART_PATH = os.path.join(HERE, "coci_articulations.json")
OUTDIR = os.path.join(HERE, "unclassified_fold", date.today().isoformat())

CLASSIFIED_BY = "curator (CER unclassified-triage)"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _machine_unreviewed(entry):
    """True when a unified_titles entry is an unreviewed machine draft — the
    only kind a curator assignment may supersede. Human-reviewed entries and
    prior curator folds always CONFLICT instead."""
    return not (entry.get("reviewed_by") or "") and entry.get("classified_by") != CLASSIFIED_BY


def _spellings_of(raw, ut):
    """Every unified_titles key that is this raw modulo surrounding whitespace
    (the MAP data carries trailing-space twins of some titles)."""
    want = raw.strip()
    return [k for k in ut if k.strip() == want]


def _entry_ts(entry):
    """Latest human/curation timestamp on a unified_titles entry (string compare
    is safe: ISO dates/datetimes)."""
    return max(entry.get("reviewed_at") or "", entry.get("classified_at") or "")


def classify(assignments, ut):
    """Bucket each assignment as clean / skip / supersede / stale / conflict.

    supersede rec shape adds: spellings (the ut keys being re-pointed) and
    displaced (the machine unified_titles they currently hold). stale = the KB
    already holds a NEWER curator/human decision for this raw (e.g. a
    strategy-2 adopt-the-article-spelling rename after the overlay assignment
    was made) — the overlay record is outdated, report-only, never a gate."""
    clean, skip, supersede, stale, conflict = [], [], [], [], []
    for raw, a in sorted(assignments.items()):
        assigned = (a.get("unified_title") or "").strip()
        rec = {"raw": raw, "assigned": assigned, "issuer": (a.get("issuing_agency") or "").strip(),
               "reviewed_by": a.get("reviewed_by"), "reviewed_at": a.get("reviewed_at")}
        if not assigned:
            conflict.append({**rec, "why": "empty unified_title"})
            continue
        spellings = _spellings_of(raw, ut)
        disagreeing = [s for s in spellings if (ut[s].get("unified_title") or "") != assigned]
        if not spellings:
            clean.append(rec)
        elif not disagreeing:
            skip.append({**rec, "why": "already classified to the same target"})
        elif all(_machine_unreviewed(ut[s]) for s in disagreeing):
            supersede.append({**rec, "spellings": spellings, "disagreeing": disagreeing,
                              "displaced": sorted({ut[s].get("unified_title") or "" for s in disagreeing})})
        else:
            held = [(s, ut[s]) for s in disagreeing if not _machine_unreviewed(ut[s])]
            newest = max(_entry_ts(e) for _, e in held)
            if (rec["reviewed_at"] or "") <= newest:
                stale.append({**rec, "why": "KB holds a newer curator decision: "
                              + "; ".join(f"{s!r} -> {e.get('unified_title')!r} ({_entry_ts(e)})"
                                          for s, e in held)})
            else:
                conflict.append({**rec, "why": "human-reviewed classification stands: "
                                 + "; ".join(f"{s!r} -> {e.get('unified_title')!r}" for s, e in held)})
    return clean, skip, supersede, stale, conflict


def articulation_ripples(recs, art):
    """For each folded raw, count articulation records whose exhibit_title is that
    raw (whitespace-insensitive) but whose inlined unified_title differs from the
    assignment."""
    rows = art.get("articulations", []) if isinstance(art, dict) else []
    want = {r["raw"].strip(): r["assigned"] for r in recs}
    ripples = []
    for i, a in enumerate(rows):
        if not isinstance(a, dict):
            continue
        ex = (a.get("exhibit_title") or "").strip()
        if ex in want and (a.get("unified_title") or "") != want[ex]:
            ripples.append({"idx": i, "raw": a.get("exhibit_title"), "has": a.get("unified_title"), "want": want[ex]})
    return ripples


def main():
    apply_if_safe = "--apply-if-safe" in sys.argv
    apply = "--apply" in sys.argv or apply_if_safe
    assignments = load(OVERLAY).get("assignments", {})
    ut = load(UT_PATH)
    cr = load(CR_PATH)

    if not assignments:
        print("No assignments in the overlay — nothing to fold.")
        return

    clean, skip, supersede, stale, conflict = classify(assignments, ut)
    fold_recs = clean + supersede

    # Articulation ripple scan (load the big file only when there's work to do).
    art = None
    ripples = []
    if fold_recs:
        art = load(ART_PATH)
        ripples = articulation_ripples(fold_recs, art)
    # Ripples on SUPERSEDED raws are resolved by the in-apply re-point (the
    # displaced title is a machine draft, not a valid alternate spelling —
    # methodology strategy 3). Ripples on CLEAN raws still block: those are the
    # "two valid spellings" case that needs the human call.
    superseded_raws = {r["raw"].strip() for r in supersede}
    resolved_ripples = [x for x in ripples if (x["raw"] or "").strip() in superseded_raws]
    blocking_ripples = [x for x in ripples if (x["raw"] or "").strip() not in superseded_raws]

    # Which assigned unified_titles lack a credentials.json record? (would be
    # added — deduped by target title, since two raws may mint the same one.)
    cred_adds, _seen_titles = [], set()
    for r in fold_recs:
        t = r["assigned"]
        if not cr.get(t) and t not in _seen_titles:
            cred_adds.append(r)
            _seen_titles.add(t)

    # Existing target credential records that are unreviewed-machine with a NULL
    # issuer, where the assignment supplies one — fill it (stamped curator).
    issuer_fills, _fill_titles = [], set()
    for r in fold_recs:
        recs = cr.get(r["assigned"])
        if (r["issuer"] and recs and not recs[0].get("issuing_agency")
                and r["assigned"] not in _fill_titles
                and not (recs[0].get("reviewed_by") or "")
                and recs[0].get("classified_by") != CLASSIFIED_BY):
            issuer_fills.append({"title": r["assigned"], "issuer": r["issuer"],
                                 "reviewed_by": r["reviewed_by"], "reviewed_at": r["reviewed_at"]})
            _fill_titles.add(r["assigned"])

    # Machine credential records ORPHANED by a supersede: no unified_titles entry
    # will map to the displaced title after the fold, and the record itself is an
    # unreviewed machine draft → prune (receipted). Reviewed records always stay.
    displaced_titles = sorted({t for r in supersede for t in r["displaced"] if t})
    all_superseded_spellings = {s for r in supersede for s in r["disagreeing"]}
    cred_prunes = []
    for t in displaced_titles:
        still_mapped = any(v.get("unified_title") == t for k, v in ut.items()
                           if k not in all_superseded_spellings)
        recs = cr.get(t)
        if (not still_mapped and recs
                and all(not (x.get("reviewed_by") or "")
                        and x.get("classified_by") != CLASSIFIED_BY for x in recs)):
            cred_prunes.append(t)

    # ---- V-gates ----
    v1 = not conflict
    v2 = True  # every fold target either has a credential record or we add one below
    v3 = True  # enforced structurally: new keys + declared superseded spellings only
    v4 = not blocking_ripples
    gates = {"V1_apply_safe": v1, "V2_target_credential": v2,
             "V3_additive_plus_declared": v3, "V4_no_articulation_ripple": v4}
    apply_safe = all(gates.values())

    # ---- report ----
    print(f"overlay assignments: {len(assignments)}")
    print(f"  CLEAN (will add):   {len(clean)}")
    for r in clean:
        print(f"     + {r['raw']!r} -> {r['assigned']!r}"
              + ("  [+credential]" if r in cred_adds else ""))
    print(f"  SUPERSEDE (curator over unreviewed machine draft): {len(supersede)}")
    for r in supersede:
        print(f"     ^ {r['raw']!r} -> {r['assigned']!r}  (displaces {r['displaced']}, "
              f"re-points {r['disagreeing']})")
    print(f"  SKIP (already):     {len(skip)}")
    for r in skip:
        print(f"     = {r['raw']!r} ({r['why']})")
    print(f"  STALE (overlay outdated, report-only): {len(stale)}")
    for r in stale:
        print(f"     . {r['raw']!r} ({r['why']})")
    print(f"  CONFLICT (rejected):{len(conflict)}")
    for r in conflict:
        print(f"     ! {r['raw']!r} ({r['why']})")
    print(f"  articulation ripples: {len(ripples)} "
          f"({len(resolved_ripples)} resolved by supersede re-point, {len(blocking_ripples)} blocking)")
    for x in ripples[:10]:
        print(f"     ~ art[{x['idx']}] {x['raw']!r}: has {x['has']!r}, want {x['want']!r}")
    if issuer_fills:
        print(f"  issuer fills: {[(f['title'], f['issuer']) for f in issuer_fills]}")
    if cred_prunes:
        print(f"  orphaned machine credential records to prune: {cred_prunes}")
    print("  V-gates: " + ", ".join(f"{k}={'OK' if v else 'FAIL'}" for k, v in gates.items()))
    print(f"  apply_safe: {apply_safe}")

    # NO-OP apply → no receipt writes. Two reasons: (1) the daily
    # --apply-if-safe run must not churn the receipts dir (a fresh
    # _generated_at every day would defeat the workflow's "no staged diff →
    # no commit" idempotency), and (2) a same-day re-run must not clobber the
    # day's REAL apply receipt with an all-zeros one.
    if apply and not (fold_recs or conflict or blocking_ripples):
        print("Nothing to fold — receipts left untouched.")
        return

    os.makedirs(OUTDIR, exist_ok=True)
    report = {
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": "apply" if apply else "dry-run",
        "gates": gates, "apply_safe": apply_safe,
        "clean": clean, "skip": skip, "supersede": supersede,
        "stale": stale, "conflict": conflict,
        "credential_adds": cred_adds, "credential_issuer_fills": issuer_fills,
        "credential_prunes": cred_prunes,
        "articulation_ripples": ripples,
        "articulation_ripples_resolved": resolved_ripples,
        "articulation_ripples_blocking": blocking_ripples,
    }
    with open(os.path.join(OUTDIR, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write("\n")

    if not apply:
        print(f"\nDRY-RUN — wrote {os.path.relpath(OUTDIR, ROOT)}/report.json. "
              f"Re-run with --apply to fold.")
        return
    if not apply_safe:
        if apply_if_safe:
            print("APPLY SKIPPED (--apply-if-safe) — a V-gate failed; see the report. "
                  "Conflicts/blocking ripples need the manual fold path.")
            return
        sys.exit("APPLY BLOCKED — a V-gate failed (see report). Resolve conflicts/ripples first.")

    # ---- apply ----
    # Phase-2 of the Rule-5c identity integration (2026-07-07): when the
    # curator's assigned title matches an identity-anchored suggestion
    # (CCN/C-ID tier) for that raw, stamp title_anchor on the new entry so a
    # future re-key / M-ID→C-ID promotion can ripple CER titles mechanically.
    try:
        _suggest = load(SUGGEST).get("suggestions", {})
    except (FileNotFoundError, ValueError):
        _suggest = {}

    def anchor_for(raw, assigned):
        for s in _suggest.get(raw, []):
            if s.get("kind") in ("ccn", "cid") \
                    and (s.get("title") or "").strip().lower() == assigned.strip().lower():
                return {"system": "CCN" if s["kind"] == "ccn" else "C-ID", "id": s.get("id")}
        return None

    today = date.today().isoformat()
    ut_before = len(ut)
    supersede_adds = 0
    anchored = 0
    def new_entry(r):
        nonlocal anchored
        e = {
            "unified_title": r["assigned"],
            "confidence_title": 1.0,
            "classified_at": today,
            "classified_by": CLASSIFIED_BY,
            "reviewed_at": r["reviewed_at"],
            "reviewed_by": r["reviewed_by"],
        }
        a = anchor_for(r["raw"], r["assigned"])
        if a:
            e["title_anchor"] = a
            anchored += 1
        return e

    for r in clean:
        ut[r["raw"]] = new_entry(r)
    for r in supersede:
        # Re-point only the DISAGREEING whitespace-twin spellings (an agreeing
        # spelling is usually an earlier curator fold — leave its provenance
        # alone); keep each entry's source_exhibit_ids and record what it
        # displaced.
        for s in r["disagreeing"]:
            old = ut[s]
            e = new_entry(r)
            e["source_exhibit_ids"] = old.get("source_exhibit_ids")
            e["_notes"] = (f"Curator triage superseded the unreviewed machine "
                           f"classification {old.get('unified_title')!r} "
                           f"(conf {old.get('confidence_title')}).")
            ut[s] = e
        # The trimmed spelling itself may be absent (only padded twins existed)
        # — add it so the overlay-assigned key is a first-class entry.
        if r["raw"] not in ut:
            ut[r["raw"]] = new_entry(r)
            supersede_adds += 1
    assert len(ut) == ut_before + len(clean) + supersede_adds, \
        "V3 violated: unexpected unified_titles delta"

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
    for f_ in issuer_fills:
        rec0 = cr[f_["title"]][0]
        rec0["issuing_agency"] = f_["issuer"]
        rec0["confidence_issuer"] = 1.0
        rec0["reviewed_at"] = f_["reviewed_at"]
        rec0["reviewed_by"] = f_["reviewed_by"]
    for t in cred_prunes:
        del cr[t]

    # Re-point the resolved articulation rows (superseded raws only) so the
    # articulation layer moves WITH the curator's credential — 0 residual ripple.
    art_rows = art.get("articulations", []) if isinstance(art, dict) else []
    for x in resolved_ripples:
        art_rows[x["idx"]]["unified_title"] = x["want"]
    if resolved_ripples:
        with open(ART_PATH, "w", encoding="utf-8") as f:
            json.dump(art, f, indent=2, ensure_ascii=False)

    # Prune the folded raws from the exhibit-audit snapshot so the worklist drops
    # them immediately (auditor isn't in the cron + needs the purged CustomReport).
    pruned = 0
    if os.path.exists(AUDIT_PATH):
        audit = load(AUDIT_PATH)
        # Prune every overlay-assigned raw that's now classified — the CLEAN +
        # SUPERSEDE ones this fold just landed AND the SKIP ones already
        # classified (stale audit snapshot) — so the worklist drops all the
        # curator acted on, not just the new adds.
        folded = {r["raw"]: r["assigned"] for r in (clean + skip + supersede)}
        # Superseded twin spellings have CLASSIFIED cards pointing at the
        # displaced machine title — re-point those too so the snapshot coheres.
        twin_targets = {s: r["assigned"] for r in supersede for s in r["disagreeing"]}
        for card in audit.get("title_cards", []):
            rt = card.get("raw_title")
            if rt in folded and not card.get("unified_title"):
                card["unified_title"] = folded[rt]
                card["tags"] = [t for t in (card.get("tags") or []) if t != "unclassified_in_map"]
                pruned += 1
            elif rt in twin_targets and card.get("unified_title") \
                    and card.get("unified_title") != twin_targets[rt]:
                card["unified_title"] = twin_targets[rt]
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
    if cred_adds or issuer_fills or cred_prunes:
        with open(CR_PATH, "w", encoding="utf-8") as f:
            json.dump(cr, f, indent=2, ensure_ascii=False)
            f.write("\n")

    applied = {"folded": clean, "superseded": supersede,
               "credential_added": cred_adds, "credential_issuer_fills": issuer_fills,
               "credential_pruned": cred_prunes,
               "articulations_repointed": len(resolved_ripples),
               "title_anchors_stamped": anchored,
               "audit_pruned": pruned,
               "unified_titles_count": len(ut)}
    with open(os.path.join(OUTDIR, "applied.json"), "w", encoding="utf-8") as f:
        json.dump(applied, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nAPPLIED — folded {len(clean)} + superseded {len(supersede)} into "
          f"unified_titles.json ({ut_before} -> {len(ut)}), "
          f"{len(cred_adds)} credential record(s) added, "
          f"{len(issuer_fills)} issuer(s) filled, {len(cred_prunes)} orphan record(s) pruned, "
          f"{len(resolved_ripples)} articulation row(s) re-pointed, "
          f"{pruned} audit card(s) pruned. Receipt: {os.path.relpath(OUTDIR, ROOT)}/")


if __name__ == "__main__":
    main()
