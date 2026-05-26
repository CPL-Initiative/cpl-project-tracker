"""
EACR Phase 4 (re-pivot) dry-run.

MEASUREMENT ONLY. Writes nothing to kb/*.json, nothing to Supabase, nothing
to statewide_data.js. Reads the current MAP exhibit rows (CustomReport_latest.json)
plus kb/unified_titles.json + kb/credentials.json and produces reviewable
artifacts under kb/eacr_dryrun/:

  report.md         — human-readable summary (today vs proposed card counts,
                      top-50 biggest collapses, multi-issuer cases, confidence
                      bands, unclassified raw-title backlog, PR-D flag
                      migration shape)
  alias_map.json    — old_card_key -> new_card_key (PR-D flag migration plan)
  collisions.json   — unified_titles with 2+ issuers (each becomes a separate
                      card per vision §6.1)
  unclassified.json — raw titles in MAP today with no entry in
                      kb/unified_titles.json (these keep raw-title grouping in
                      the re-pivoted generator so coverage is preserved)

Re-runnable. Read-only. Decisions encoded:
  - Grouping key: (unified_title, issuing_agency, CPL Type, Collaborative Type)
  - Multi-issuer per unified_title -> SEPARATE cards (vision §6.1)
  - Issuer selection per raw row: highest-confidence issuer record from
    credentials.json[unified_title] (MAP rows don't carry issuer context)
  - Sector + discipline aggregation: modal across constituents
  - Raw titles missing from unified_titles.json: keep raw-title grouping
    (preserves coverage; surfaces a reviewer-actionable backlog)

Run from repo root:  python3 kb/_eacr_dryrun.py
"""
from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CUSTOMREPORT = os.path.join(REPO, "CustomReport_latest.json")
UNIFIED_TITLES = os.path.join(HERE, "unified_titles.json")
CREDENTIALS = os.path.join(HERE, "credentials.json")
OUT_DIR = os.path.join(HERE, "eacr_dryrun")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_exhibit_dataset(all_data):
    """Return (rows, column_index_map) for View_ArticulatedMAPExhibits."""
    for report in all_data:
        if report.get("viewName") == "View_ArticulatedMAPExhibits_APIDataset":
            cm = {c: i for i, c in enumerate(report.get("columnName", []))}
            return report.get("columnValue", []), cm
    raise SystemExit("View_ArticulatedMAPExhibits_APIDataset not found in CustomReport_latest.json")


def pick_best_issuer(records):
    """Highest-confidence issuer record for a unified_title; ties broken
    deterministically by issuer name. records is the list from credentials.json."""
    if not records:
        return None
    return sorted(
        records,
        key=lambda r: (-(r.get("confidence_issuer") or 0.0), r.get("issuing_agency") or "")
    )[0]


def modal(values):
    """Most common non-empty string; ties broken alphabetically. Returns ''."""
    c = Counter(v for v in values if v)
    if not c:
        return ""
    return sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


def main():
    print("Loading inputs…")
    print(f"  CustomReport: {CUSTOMREPORT}")
    all_data = load_json(CUSTOMREPORT)
    exhibit_rows, cm = find_exhibit_dataset(all_data)
    print(f"  exhibit rows: {len(exhibit_rows):,}")

    print(f"  unified_titles: {UNIFIED_TITLES}")
    unified_titles = load_json(UNIFIED_TITLES)
    print(f"  unified_titles entries: {len(unified_titles):,}")

    print(f"  credentials: {CREDENTIALS}")
    credentials = load_json(CREDENTIALS)
    print(f"  credentials entries (distinct unified_titles): {len(credentials):,}")

    # ── Column indices (mirror _build_statewide_adoption) ──
    i_eid = cm.get("ExhibitID", 1)
    i_title = cm.get("Exhibit Title", 2)
    i_artic = cm.get("Articulation College", 4)
    i_top = cm.get("TOP Code", 8)
    i_collab = cm.get("Collaborative Type", 7)
    i_cpl = cm.get("CPL Type Description", 13)

    # ── Pre-pick best issuer per unified_title (deterministic) ──
    # records arity per unified_title: 1 means single-issuer, ≥2 means multi-issuer
    issuer_pick = {}        # unified_title -> issuer record (single best)
    multi_issuer = {}       # unified_title -> [list of issuer records]
    for ut, records in credentials.items():
        issuer_pick[ut] = pick_best_issuer(records)
        if len(records) >= 2:
            multi_issuer[ut] = records

    # ── PASS 1: today's grouping (mirror current generator) ──
    today_keys = defaultdict(lambda: {"eids": set(), "rows": 0})
    skipped = 0
    for row in exhibit_rows:
        eid = (row[i_eid] or "").strip()
        title = (row[i_title] or "").strip()
        if not eid or not title:
            skipped += 1
            continue
        cpl = (row[i_cpl] or "").strip()
        collab = (row[i_collab] or "").strip()
        key = (title, cpl, collab)
        e = today_keys[key]
        e["eids"].add(eid)
        e["rows"] += 1

    today_card_count = len(today_keys)
    print(f"\nToday's EACR cards (raw title grouping): {today_card_count:,}")

    # ── Build the same exact→stripped lookup the generator uses ──
    # kb/unified_titles.json keys preserve the raw MAP whitespace (the classifier
    # never .strip()s before saving). Most EACR call sites .strip() the raw_title
    # before lookup, so we mirror the generator's behaviour: try exact match
    # first, then fall back to the stripped variant. Without this fallback the
    # dry-run over-reports unclassified raw titles (the 194 vs 58 discrepancy
    # caught on 2026-05-26 — see PR description for #127).
    unified_lookup = {}
    for raw_key, entry in unified_titles.items():
        unified_lookup[raw_key] = entry
        stripped = raw_key.strip()
        if stripped and stripped != raw_key and stripped not in unified_lookup:
            unified_lookup[stripped] = entry

    # ── PASS 2: proposed grouping (unified_title, issuing_agency, CPL, Collab) ──
    # For raw titles missing from unified_titles.json, keep raw-title grouping
    # (preserves coverage). For raw titles whose unified_title has no credentials
    # entry (issuer unknown), use issuer="" and surface for review.
    new_keys = defaultdict(lambda: {
        "eids": set(),                # all raw exhibit IDs that fold into this card
        "raw_titles": Counter(),      # which raw titles fold in (with row counts)
        "raw_card_keys": set(),       # which today-card keys fold in (for alias_map)
        "rows": 0,
        "adopters": set(),
        "tops": Counter(),
        "confidence_titles": [],      # per-row confidence_title (used for modal)
        "quality_flags": Counter(),
        "issuer_record": None,        # the chosen credential record
        "unified_title": None,
        "issuing_agency": None,
        "is_classified": False,       # False = raw_title not in KB (fell back to raw grouping)
    })

    no_unified = Counter()           # raw_titles with no unified_titles entry
    no_credentials = Counter()       # unified_titles with no credentials.json record
    rows_unclassified = 0
    rows_with_issuer = 0
    rows_without_issuer = 0

    for row in exhibit_rows:
        eid = (row[i_eid] or "").strip()
        raw_title = (row[i_title] or "").strip()
        if not eid or not raw_title:
            continue
        cpl = (row[i_cpl] or "").strip()
        collab = (row[i_collab] or "").strip()
        artic = (row[i_artic] or "").strip()
        top = (row[i_top] or "").strip()

        # KB lookup — exact (matches classifier's un-stripped storage) then stripped
        ut_entry = unified_lookup.get(row[i_title] or "") or unified_lookup.get(raw_title)
        if ut_entry:
            unified_title = ut_entry.get("unified_title") or raw_title
            conf_title = ut_entry.get("confidence_title") or 0.0
            quality_flag = ut_entry.get("quality_flag") or ""
            issuer_rec = issuer_pick.get(unified_title)
            issuer = (issuer_rec.get("issuing_agency") if issuer_rec else "") or ""
            if not issuer_rec:
                no_credentials[unified_title] += 1
                rows_without_issuer += 1
            else:
                rows_with_issuer += 1
            new_key = (unified_title, issuer, cpl, collab)
            is_classified = True
        else:
            # Fallback: keep raw-title grouping; surface for reviewer.
            unified_title = raw_title
            conf_title = 0.0
            quality_flag = ""
            issuer = ""
            issuer_rec = None
            new_key = (raw_title, "", cpl, collab)
            is_classified = False
            no_unified[raw_title] += 1
            rows_unclassified += 1

        e = new_keys[new_key]
        e["eids"].add(eid)
        e["raw_titles"][raw_title] += 1
        e["raw_card_keys"].add((raw_title, cpl, collab))
        e["rows"] += 1
        if artic:
            e["adopters"].add(artic)
        if top:
            e["tops"][top] += 1
        if conf_title:
            e["confidence_titles"].append(conf_title)
        if quality_flag:
            e["quality_flags"][quality_flag] += 1
        e["issuer_record"] = issuer_rec
        e["unified_title"] = unified_title
        e["issuing_agency"] = issuer
        e["is_classified"] = is_classified

    new_card_count = len(new_keys)
    classified_cards = sum(1 for k, v in new_keys.items() if v["is_classified"])
    unclassified_cards = new_card_count - classified_cards
    collapse_ratio = (1.0 - new_card_count / today_card_count) if today_card_count else 0.0
    print(f"Proposed EACR cards (unified_title + issuer grouping): {new_card_count:,}")
    print(f"  of which classified (KB-mapped): {classified_cards:,}")
    print(f"  of which raw-fallback (no KB entry): {unclassified_cards:,}")
    print(f"  collapse ratio vs today: {collapse_ratio*100:.1f}% reduction")

    # ── Biggest collapses ──
    # For each NEW card, how many TODAY cards folded into it?
    fold_size = [(k, len(v["raw_card_keys"]), v) for k, v in new_keys.items()]
    fold_size.sort(key=lambda x: -x[1])
    biggest_collapses = [x for x in fold_size if x[1] >= 2][:50]

    # ── Multi-issuer cases (would_be_one_card_under_unified_alone) ──
    # Count unified_titles where 2+ issuer records exist AND have at least one
    # raw row in the data → those drive multiple new cards.
    seen_unified = {v["unified_title"] for v in new_keys.values()}
    multi_issuer_active = {
        ut: recs for ut, recs in multi_issuer.items() if ut in seen_unified
    }
    # For each, how many cards would we get (count of distinct issuers in records)
    multi_issuer_card_count = sum(len(recs) for recs in multi_issuer_active.values())

    # ── Confidence bands (per resulting CLASSIFIED card; modal confidence) ──
    bands = Counter()
    BAND_EDGES = [(0.95, "0.95–1.00"), (0.80, "0.80–0.94"), (0.60, "0.60–0.79"),
                  (0.40, "0.40–0.59"), (0.0, "<0.40")]

    def band_label(conf):
        for edge, label in BAND_EDGES:
            if conf >= edge:
                return label
        return "<0.40"

    quality_flagged_cards = 0
    for k, v in new_keys.items():
        if not v["is_classified"]:
            continue
        confs = v["confidence_titles"]
        modal_conf = max(set(confs), key=confs.count) if confs else 0.0
        bands[band_label(modal_conf)] += 1
        if v["quality_flags"]:
            quality_flagged_cards += 1

    # ── PR-D flag-migration alias map ──
    # PR-D's flag key is exhibit_id || title in statewide_interactive.js. The
    # exhibit_id is the merged_id from _build_statewide_adoption: "|".join(sorted(eids)).
    # So for each (raw_title, cpl, collab) card today, compute its merged_id; then
    # find the new card that contains that raw_title.
    #
    # Today's merged_id per old card:
    old_merged_id = {}  # (title, cpl, collab) -> merged_id
    for old_key, v in today_keys.items():
        old_merged_id[old_key] = "|".join(sorted(v["eids"]))

    # New merged_id per new card:
    new_merged_id = {k: "|".join(sorted(v["eids"])) for k, v in new_keys.items()}

    # Build alias map: each old card maps to the new card that absorbs its raw_title.
    # Using raw_card_keys index on new_keys.
    raw_card_to_new_card = {}  # (raw_title, cpl, collab) -> new_key
    for nk, v in new_keys.items():
        for old_card_key in v["raw_card_keys"]:
            raw_card_to_new_card[old_card_key] = nk

    alias_map_by_merged_id = {}    # old_merged_id -> new_merged_id
    alias_map_by_title = {}        # old title -> new merged_id (PR-D's fallback key)
    one_to_one = 0
    many_to_one = 0
    for old_key, omid in old_merged_id.items():
        nk = raw_card_to_new_card.get(old_key)
        if nk is None:
            continue
        nmid = new_merged_id[nk]
        alias_map_by_merged_id[omid] = nmid
        # The title-fallback PR-D uses
        alias_map_by_title[old_key[0]] = nmid
        if omid == nmid:
            one_to_one += 1
        else:
            many_to_one += 1

    # Detect alias collisions: 2+ old flags map to the same new card.
    # If both carry different flag values, this is a curator-conflict.
    new_card_inbound = Counter(alias_map_by_merged_id.values())
    multi_inbound = {nmid: cnt for nmid, cnt in new_card_inbound.items() if cnt >= 2}

    # ── Write artifacts ──
    os.makedirs(OUT_DIR, exist_ok=True)

    # alias_map.json
    alias_path = os.path.join(OUT_DIR, "alias_map.json")
    with open(alias_path, "w", encoding="utf-8") as f:
        json.dump({
            "_meta": {
                "generated_at": date.today().isoformat(),
                "purpose": "PR-D _EACR_FLAG:: key migration plan for the EACR Phase 4 re-pivot.",
                "format": "merged_exhibit_id (sorted, '|'-joined) is the primary PR-D key; title is the fallback.",
                "by_merged_id_count": len(alias_map_by_merged_id),
                "by_title_count": len(alias_map_by_title),
                "old_cards_unchanged": one_to_one,
                "old_cards_folded": many_to_one,
                "new_cards_with_multiple_inbound": len(multi_inbound),
            },
            "by_merged_id": alias_map_by_merged_id,
            "by_title": alias_map_by_title,
            "multi_inbound": multi_inbound,
        }, f, indent=2, sort_keys=True, ensure_ascii=False)
    print(f"\nWrote {alias_path}")

    # collisions.json (multi-issuer cases)
    collisions_path = os.path.join(OUT_DIR, "collisions.json")
    with open(collisions_path, "w", encoding="utf-8") as f:
        json.dump({
            "_meta": {
                "generated_at": date.today().isoformat(),
                "purpose": "unified_titles with 2+ issuing_agency records — each becomes a separate EACR card per vision §6.1.",
                "active_multi_issuer_count": len(multi_issuer_active),
                "additional_cards_introduced": multi_issuer_card_count - len(multi_issuer_active),
            },
            "cases": [
                {
                    "unified_title": ut,
                    "issuer_count": len(recs),
                    "issuers": [
                        {
                            "issuing_agency": r.get("issuing_agency"),
                            "training_agency": r.get("training_agency"),
                            "confidence_issuer": r.get("confidence_issuer"),
                            "_notes": r.get("_notes"),
                        }
                        for r in recs
                    ],
                }
                for ut, recs in sorted(multi_issuer_active.items())
            ],
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {collisions_path}")

    # unclassified.json
    unclassified_path = os.path.join(OUT_DIR, "unclassified.json")
    with open(unclassified_path, "w", encoding="utf-8") as f:
        json.dump({
            "_meta": {
                "generated_at": date.today().isoformat(),
                "purpose": "Raw MAP titles with no entry in kb/unified_titles.json. PR-C1 generator falls back to raw-title grouping for these so coverage is preserved; they're the re-classification backlog.",
                "count": len(no_unified),
                "rows_affected": rows_unclassified,
            },
            "titles": [
                {"raw_title": t, "row_count": c}
                for t, c in sorted(no_unified.items(), key=lambda kv: (-kv[1], kv[0]))
            ],
        }, f, indent=2, ensure_ascii=False)
    print(f"Wrote {unclassified_path}")

    # report.md
    report_path = os.path.join(OUT_DIR, "report.md")
    lines = []
    lines.append("# EACR Phase 4 (re-pivot) dry-run report")
    lines.append("")
    lines.append(f"Generated: {date.today().isoformat()}")
    lines.append("")
    lines.append("Measurement only. Reads the current MAP exhibit rows + the credential-")
    lines.append("identity layer (`kb/unified_titles.json` + `kb/credentials.json`) and")
    lines.append("projects what the EACR table would look like under the proposed grouping")
    lines.append("key `(unified_title, issuing_agency, CPL Type, Collaborative Type)`.")
    lines.append("")
    lines.append("Per vision doc §6.1, multi-issuer unified_titles (e.g. Fire Inspector I")
    lines.append("issued by ICC vs NFPA) become **separate cards** rather than one.")
    lines.append("")
    lines.append("## Headline")
    lines.append("")
    lines.append("| Metric | Today | Proposed | Change |")
    lines.append("|---|---:|---:|---:|")
    lines.append(f"| EACR card count | **{today_card_count:,}** | **{new_card_count:,}** | {new_card_count - today_card_count:+,} ({collapse_ratio*100:+.1f}%) |")
    lines.append(f"| Raw exhibit rows | {len(exhibit_rows):,} | {len(exhibit_rows):,} | (unchanged) |")
    lines.append(f"| Skipped rows (no eid/title) | {skipped:,} | {skipped:,} | (unchanged) |")
    lines.append("")
    lines.append("## Card composition (proposed)")
    lines.append("")
    lines.append("| Status | Cards | Notes |")
    lines.append("|---|---:|---|")
    lines.append(f"| Classified (KB-mapped) | {classified_cards:,} | raw_title was in `unified_titles.json` |")
    lines.append(f"| Unclassified (raw-fallback) | {unclassified_cards:,} | preserved 1:1 from today; surfaces re-classification backlog |")
    lines.append(f"| Quality-flagged | {quality_flagged_cards:,} | at least one constituent raw row carries `quality_flag = \"suspect_course_as_exhibit\"` |")
    lines.append("")
    lines.append("### Row coverage")
    lines.append("")
    lines.append(f"- Rows with classified unified_title + issuer: **{rows_with_issuer:,}** / {len(exhibit_rows):,}")
    lines.append(f"- Rows with unified_title but missing credential entry (issuer unknown): **{rows_without_issuer:,}**")
    lines.append(f"- Rows with no unified_title (raw-fallback): **{rows_unclassified:,}**")
    if no_credentials:
        lines.append("")
        lines.append("Unified titles with no credentials.json record (issuer unknown):")
        for ut, cnt in sorted(no_credentials.items(), key=lambda kv: (-kv[1], kv[0]))[:20]:
            lines.append(f"  - `{ut}` — {cnt} rows")
    lines.append("")
    lines.append("## Confidence bands (classified cards, modal `confidence_title`)")
    lines.append("")
    lines.append("| band | cards | % |")
    lines.append("|---|---:|---:|")
    for edge, label in BAND_EDGES:
        cnt = bands.get(label, 0)
        pct = (cnt / classified_cards * 100.0) if classified_cards else 0.0
        lines.append(f"| {label} | {cnt:,} | {pct:.1f}% |")
    lines.append("")
    lines.append("## Multi-issuer unified titles (each issuer → own card)")
    lines.append("")
    lines.append(f"- unified titles with 2+ issuer records (`credentials.json`) active in the data: **{len(multi_issuer_active):,}**")
    lines.append(f"- additional cards introduced by multi-issuer splitting: **{multi_issuer_card_count - len(multi_issuer_active):,}**")
    lines.append("")
    lines.append("Cases listed in `collisions.json`. Top 20 by issuer count:")
    lines.append("")
    top_multi = sorted(multi_issuer_active.items(), key=lambda kv: -len(kv[1]))[:20]
    for ut, recs in top_multi:
        issuer_list = " · ".join(f"`{r.get('issuing_agency') or '(null)'}`" for r in recs)
        lines.append(f"  - **{ut}** — {len(recs)} issuers: {issuer_list}")
    lines.append("")
    lines.append("## Top 50 biggest collapses (today-cards → new-card)")
    lines.append("")
    lines.append("Each row shows how many of today's `(raw title, CPL Type, Collab Type)` cards")
    lines.append("fold into a single new `(unified_title, issuer, CPL Type, Collab Type)` card.")
    lines.append("")
    lines.append("| New card | Today cards folded | Raw rows | Adopters | Top raw variants |")
    lines.append("|---|---:|---:|---:|---|")
    for nk, fold_cnt, v in biggest_collapses:
        ut, issuer, cpl, collab = nk
        top_variants = " · ".join(f"`{t}` ({c})" for t, c in v["raw_titles"].most_common(3))
        issuer_short = issuer or "(null issuer)"
        collab_short = "Statewide" if "CCC" in (collab or "") else (collab or "Local")
        lines.append(f"| **{ut}** / {issuer_short} / {cpl} / {collab_short} | {fold_cnt} | {v['rows']:,} | {len(v['adopters'])} | {top_variants} |")
    lines.append("")
    lines.append("## Re-classification backlog")
    lines.append("")
    lines.append(f"- Raw titles in current MAP with no `unified_titles.json` entry: **{len(no_unified):,}**")
    lines.append(f"- Rows affected: **{rows_unclassified:,}**")
    lines.append("")
    lines.append("Full list in `unclassified.json`. These keep raw-title grouping in PR-C1 so")
    lines.append("coverage is preserved; running `kb/classify_exhibits.py` against this set is")
    lines.append("the natural follow-up (see Session 7 handoff §2).")
    lines.append("")
    lines.append("## PR-D flag-key migration plan")
    lines.append("")
    lines.append("PR-D's `_EACR_FLAG::<exhibit_id || title>` rows in Supabase need to be re-keyed")
    lines.append("when the EACR cards change identity. `alias_map.json` carries the mapping:")
    lines.append("")
    lines.append(f"- old EACR cards: **{today_card_count:,}**")
    lines.append(f"  - unchanged (same merged_id post-pivot): **{one_to_one:,}**")
    lines.append(f"  - folded into a larger card (new merged_id): **{many_to_one:,}**")
    lines.append(f"- new cards receiving 2+ old flag namespaces (potential conflict if both flagged differently): **{len(multi_inbound):,}**")
    lines.append("")
    lines.append("`alias_map.json` provides two lookup tables:")
    lines.append("")
    lines.append("- `by_merged_id` — old `'|'-joined sorted exhibit ids` → new merged_id")
    lines.append("- `by_title` — old raw title → new merged_id (PR-D's fallback key)")
    lines.append("")
    lines.append("Migration step (executed during PR-C2 land, atomic within one cron window):")
    lines.append("")
    lines.append("1. Pull all `_EACR_FLAG::*` rows from Supabase `kb_curation`.")
    lines.append("2. For each, look up the new key in `alias_map.json`.")
    lines.append("3. If 2+ old rows map to the same new card with different flag values, halt and")
    lines.append("   surface for curator decision (per re-mint playbook).")
    lines.append("4. Write new rows; delete old. Atomic.")
    lines.append("")
    lines.append("## Decisions encoded in this dry-run")
    lines.append("")
    lines.append("1. Grouping key: `(unified_title, issuing_agency, CPL Type, Collaborative Type)`")
    lines.append("2. Multi-issuer per unified_title → separate cards (vision §6.1)")
    lines.append("3. Issuer pick per raw row: highest-`confidence_issuer` from `credentials.json[unified_title]`")
    lines.append("4. Sector + discipline: modal across raw rows (PR-C1 will encode this)")
    lines.append("5. Raw titles missing from `unified_titles.json`: keep raw-title grouping (preserves coverage)")
    lines.append("6. PR-D flag migration: alias-map re-key, atomic at PR-C2 land")
    lines.append("")
    lines.append("## What's NOT in the dry-run (PR-C1+ scope)")
    lines.append("")
    lines.append("- The new `statewide_data.js` schema (`raw_titles[]`, `confidence_*`, `quality_flag`, …)")
    lines.append("- The `statewide_interactive.js` 'also entered as…' disclosure")
    lines.append("- Issuing-agency filter typeahead")
    lines.append("- Visual confidence badge (threshold TBD, vision §6.2 suggests 0.75)")
    lines.append("- Live Supabase query of `_EACR_FLAG::*` (the alias map is precomputed; the")
    lines.append("  actual migration runs at PR-C2 land with a Supabase fresh-read)")
    lines.append("")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Wrote {report_path}")
    print(f"\nDone.")


if __name__ == "__main__":
    main()
