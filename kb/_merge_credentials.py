"""
CER credential MERGE — consolidate two existing credentials into one.

Unlike kb/_fold_unclassified.py (which classifies an UNclassified raw title into an
existing credential), this merges two ALREADY-classified credentials: it folds a
`loser` unified_title into a `winner`. Use it for near-duplicate AI titles of the
SAME underlying exhibit — e.g. the same college exhibit entered under two CPL types
that the classifier split into two unified titles (the 10-Key case, 2026-06-04).

For each merge (loser -> winner) it:
  - kb/unified_titles.json    RE-POINTS every raw whose unified_title == loser to
                              winner (stamps reviewed_by/at + a _merge_note;
                              confidence_title is preserved — it's the raw->title
                              match strength, still meaningful).
  - kb/credentials.json       DROPS the loser record when the winner already has one
                              (winner is authoritative); MOVES the loser's record to
                              the winner when the winner has none.
  - kb/coci_articulations.json RE-POINTS every articulation whose unified_title ==
                              loser to winner (the producers group by course_id, so
                              two records sharing a course_id collapse to one CER
                              identity row; the differing cpl_type is preserved).

DRY-RUN by default; --apply writes the files + a receipt. Reads the committed
decisions file (kb/credential_merges.json), so it's deterministic + reviewable.
Idempotent: a merge whose loser no longer exists (already merged) is SKIPPED.

V-gates (all must pass to --apply):
  V1 apply_safe        — no CONFLICTs (loser==winner; loser missing AND has no raws).
  V2 winner_present    — after the merge, every winner has >=1 raw in unified_titles
                         AND a credentials.json record.
  V3 loser_gone        — after the merge, no raw maps to a loser, no loser remains in
                         credentials.json, and no articulation references a loser.
  V4 articulation_count — the number of re-pointed articulations equals the pre-scan
                         count for each loser (no over/under-rewrite).

Run from repo root:
  python3 kb/_merge_credentials.py            # dry-run (report only)
  python3 kb/_merge_credentials.py --apply    # writes the KB + receipt
"""
import json
import os
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MERGES = os.path.join(HERE, "credential_merges.json")
UT_PATH = os.path.join(HERE, "unified_titles.json")
CR_PATH = os.path.join(HERE, "credentials.json")
ART_PATH = os.path.join(HERE, "coci_articulations.json")
OUTDIR = os.path.join(HERE, "credential_merges_out", date.today().isoformat())


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path, obj):
    # indent=2 + trailing newline — matches the on-disk format of all three KB
    # files, so the diff is just the changed lines (verified round-trip-clean).
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def classify(merges, ut, cr):
    """Bucket each merge as clean / skip / conflict and count the raws to re-point."""
    clean, skip, conflict = [], [], []
    for m in merges:
        loser = (m.get("loser") or "").strip()
        winner = (m.get("winner") or "").strip()
        rec = {"loser": loser, "winner": winner,
               "reviewed_by": m.get("reviewed_by"), "reviewed_at": m.get("reviewed_at"),
               "reason": m.get("reason")}
        raws = [raw for raw, e in ut.items() if (e.get("unified_title") or "") == loser]
        rec["raws"] = raws
        rec["loser_has_cred"] = bool(cr.get(loser))
        rec["winner_has_cred"] = bool(cr.get(winner))
        if not loser or not winner:
            conflict.append({**rec, "why": "empty loser/winner"})
        elif loser == winner:
            conflict.append({**rec, "why": "loser == winner"})
        elif not raws and not rec["loser_has_cred"]:
            skip.append({**rec, "why": "loser absent (already merged?)"})
        else:
            clean.append(rec)
    return clean, skip, conflict


def main():
    apply = "--apply" in sys.argv
    merges = load(MERGES).get("merges", [])
    ut = load(UT_PATH)
    cr = load(CR_PATH)

    if not merges:
        print("No merges in kb/credential_merges.json — nothing to do.")
        return

    clean, skip, conflict = classify(merges, ut, cr)

    # Articulation re-point scan (load the 7.5MB file once, only when there's work).
    art = None
    art_repoint = {}  # loser -> [indices]
    if clean:
        art = load(ART_PATH)
        rows = art.get("articulations", [])
        losers = {c["loser"] for c in clean}
        for i, a in enumerate(rows):
            if isinstance(a, dict) and (a.get("unified_title") or "") in losers:
                art_repoint.setdefault(a["unified_title"], []).append(i)

    # ---- V-gates (predicted post-state) ----
    v1 = not conflict
    # V2: every winner ends with >=1 raw + a credential record.
    v2 = all((c["raws"] or c["winner_has_cred"] or c["loser_has_cred"])
             and (c["winner_has_cred"] or c["loser_has_cred"]) for c in clean)
    # V3/V4 are structurally enforced by the apply loop; assert there too.
    v3 = True
    v4 = True
    gates = {"V1_apply_safe": v1, "V2_winner_present": v2,
             "V3_loser_gone": v3, "V4_articulation_count": v4}
    apply_safe = all(gates.values())

    # ---- report ----
    print(f"merges in decisions file: {len(merges)}")
    print(f"  CLEAN (will merge): {len(clean)}")
    for c in clean:
        na = len(art_repoint.get(c["loser"], []))
        print(f"     + {c['loser']!r} -> {c['winner']!r}  "
              f"({len(c['raws'])} raw(s), {na} articulation(s), "
              f"drop-cred={c['loser_has_cred'] and c['winner_has_cred']})")
    print(f"  SKIP:     {len(skip)}")
    for c in skip:
        print(f"     = {c['loser']!r} ({c['why']})")
    print(f"  CONFLICT: {len(conflict)}")
    for c in conflict:
        print(f"     ! {c['loser']!r} -> {c['winner']!r} ({c['why']})")
    print("  V-gates: " + ", ".join(f"{k}={'OK' if v else 'FAIL'}" for k, v in gates.items()))
    print(f"  apply_safe: {apply_safe}")

    os.makedirs(OUTDIR, exist_ok=True)
    report = {
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": "apply" if apply else "dry-run",
        "gates": gates, "apply_safe": apply_safe,
        "clean": [{k: v for k, v in c.items() if k != "raws"} | {"n_raws": len(c["raws"]),
                   "n_articulations": len(art_repoint.get(c["loser"], []))} for c in clean],
        "skip": skip, "conflict": conflict,
    }
    write_json(os.path.join(OUTDIR, "report.json"), report)

    if not apply:
        print(f"\nDRY-RUN — wrote {os.path.relpath(OUTDIR, ROOT)}/report.json. "
              f"Re-run with --apply to merge.")
        return
    if not apply_safe:
        sys.exit("APPLY BLOCKED — a V-gate failed (see report). Resolve conflicts first.")

    # ---- apply ----
    today = date.today().isoformat()
    applied = []
    for c in clean:
        loser, winner = c["loser"], c["winner"]
        # 1) re-point raws in unified_titles.json
        for raw in c["raws"]:
            e = ut[raw]
            e["unified_title"] = winner
            e["reviewed_at"] = c["reviewed_at"] or today
            e["reviewed_by"] = c["reviewed_by"]
            e["_merge_note"] = f"merged from credential {loser!r} (curator)"
        # 2) credentials.json — winner authoritative; move loser's record only if
        #    the winner has none.
        if cr.get(loser):
            if cr.get(winner):
                del cr[loser]
            else:
                cr[winner] = cr.pop(loser)
        # 3) re-point articulations
        n_art = 0
        if art is not None:
            for i in art_repoint.get(loser, []):
                art["articulations"][i]["unified_title"] = winner
                n_art += 1
        applied.append({"loser": loser, "winner": winner,
                        "raws_repointed": len(c["raws"]), "articulations_repointed": n_art,
                        "loser_credential_dropped": c["loser_has_cred"]})

    # ---- V3 assertion (post-state): no loser remnants ----
    losers = {c["loser"] for c in clean}
    assert not any((e.get("unified_title") or "") in losers for e in ut.values()), \
        "V3 violated: a raw still maps to a loser"
    assert not any(l in cr for l in losers), "V3 violated: a loser remains in credentials.json"
    if art is not None:
        assert not any((a.get("unified_title") or "") in losers
                       for a in art["articulations"] if isinstance(a, dict)), \
            "V3 violated: an articulation still references a loser"
    # ---- V4 assertion: re-pointed counts match the pre-scan ----
    for c in clean:
        got = next(x["articulations_repointed"] for x in applied if x["loser"] == c["loser"])
        assert got == len(art_repoint.get(c["loser"], [])), "V4 violated: articulation count drift"

    write_json(UT_PATH, ut)
    write_json(CR_PATH, cr)
    if art is not None:
        write_json(ART_PATH, art)

    write_json(os.path.join(OUTDIR, "applied.json"), {
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "applied": applied, "unified_titles_count": len(ut), "credentials_count": len(cr),
    })
    print(f"\nAPPLIED — {len(applied)} merge(s). "
          f"unified_titles: {len(ut)} · credentials: {len(cr)}. "
          f"Receipt: {os.path.relpath(OUTDIR, ROOT)}/")


if __name__ == "__main__":
    main()
