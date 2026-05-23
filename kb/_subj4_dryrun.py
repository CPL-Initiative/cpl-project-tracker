"""
Phase 1e SUBJ4-canonicalization dry-run.

MEASUREMENT ONLY. Writes nothing to kb/coci_*.json, nothing to Supabase, nothing
to live curation. Reads the curator-confirmed canonical map at
kb/discipline_canonical_subj4.json plus the current M-ID catalog and produces
reviewable artifacts under kb/subj4_dryrun/:

  report.md         — human-readable summary + per-discipline impact
                      + curated-M-ID fate + validation results
  alias_map.json    — old course_id -> new course_id (only clean re-keys)
  collisions.json   — new (SUBJ4, band, kind) buckets where 2+ old M-IDs collide
                      (sequence-reallocation receipt)
  blocked.json      — M-IDs blocked because canonical_subj4 isn't set yet

Re-runnable. Curators fill the canonical map in the dashboard's Canonical SUBJ4
tab; re-running this surfaces the new impact + validation as the map fills out.

When the canonical map is incomplete (some disciplines still null), THIS DRY-RUN
IS A PREVIEW only. A full apply requires every multi-SUBJ4 discipline to have
a curator-confirmed 4-letter canonical_subj4. The report flags incomplete state
prominently so 5c (apply) cannot be triggered mistakenly.

Run from repo root:  python3 kb/_subj4_dryrun.py
"""
from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
CANONICAL = os.path.join(HERE, "discipline_canonical_subj4.json")
CURATION = os.path.join(HERE, "coci_curation.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
UNIFIED_COURSES = os.path.join(HERE, "coci_unified_courses.json")
OUT_DIR = os.path.join(HERE, "subj4_dryrun")

SUBJ4_RE = re.compile(r"^[A-Z]{4}$")
# A current M-ID course_id is "<SUBJ> M<band><suffix>" where SUBJ is 1-4 letters
# (the 27 single-letter SUBJ outliers are Rule-7 invariant violations the
# re-mint is fixing). Suffix is either 3 digits (corroborated) or
# digit + 2 letters (stand-alone).
COURSE_ID_RE = re.compile(r"^([A-Z]+) M(\d)([A-Z0-9]{3})$")
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
# Generic / scaffolding title tokens — copied from the 2026-05-22 re-mint so the
# sort order inside a bucket is stable across the two re-mints.
TITLE_STOP = {"and","the","of","for","with","into","from","this","that",
              "an","a","to","in","on","or","as","by","at","is","be"}


def ntitle(t: str | None) -> str:
    """Normalized title — lowercased, non-alnum stripped, stopwords dropped,
    tokens sorted. Used as the deterministic sort key within a re-allocation
    bucket so the dry-run is repeatable across runs."""
    if not t:
        return ""
    t = re.sub(r"[^a-z0-9 ]+", " ", t.lower())
    tokens = [x for x in t.split() if x and x not in TITLE_STOP]
    return " ".join(sorted(tokens))


def standalone_code(n: int) -> str:
    """0-based seq → '<d><L><L>' (base 10·26·26 = 6,760 per bucket)."""
    d, r = divmod(n, 26 * 26)
    l1, l2 = divmod(r, 26)
    return f"{d}{LETTERS[l1]}{LETTERS[l2]}"


def parse_old(course_id: str):
    """Decompose old course_id → (subj, band, suffix, kind).

    kind ∈ {"corroborated", "standalone", "unknown"}. unknown is reserved for
    keys that don't match the expected M-ID shape (shouldn't happen post the
    2026-05-22 re-mint, but we surface it rather than crash).
    """
    m = COURSE_ID_RE.match(course_id or "")
    if not m:
        return (None, None, None, "unknown")
    subj, band, suffix = m.group(1), m.group(2), m.group(3)
    if suffix.isdigit():
        return (subj, band, suffix, "corroborated")
    if re.match(r"^\d[A-Z]{2}$", suffix):
        return (subj, band, suffix, "standalone")
    return (subj, band, suffix, "unknown")


def main():
    if not os.path.exists(CANONICAL):
        raise SystemExit(f"Missing {CANONICAL} — run kb/_seed_canonical_subj4.py first.")
    with open(CANONICAL, encoding="utf-8") as f:
        canon_doc = json.load(f)
    with open(COURSES, encoding="utf-8") as f:
        courses = json.load(f)["courses"]
    with open(SINGLETONS, encoding="utf-8") as f:
        singletons = json.load(f)["courses"]
    with open(CURATION, encoding="utf-8") as f:
        curation_doc = json.load(f)
    curations = curation_doc.get("curations", {}) or {}

    canon_map = canon_doc.get("disciplines", {}) or {}

    # Apply curation overlay to the in-memory views so curator-set discipline
    # wins over the (often-blank) baseline in coci_minted_*.json. This mirrors
    # what excel_to_dashboard.py does at render time; matching its behaviour
    # here is what surfaces curated M-IDs (BSIC/EGDT/ELET) properly in this
    # dry-run instead of mis-classifying them as skip_no_discipline.
    def _overlay(record_map):
        for cid, cur in curations.items():
            if cid not in record_map:
                continue
            d = (cur or {}).get("discipline")
            if d:
                record_map[cid]["discipline"] = d
    _overlay(courses)
    _overlay(singletons)

    # ── Pass 1: classify each M-ID's fate ──────────────────────────────────
    # Per M-ID, decide what happens. Fates:
    #   re_key:                old SUBJ4 ≠ canonical, all green → assign new key
    #   no_change:             old SUBJ4 == canonical (already at canonical)
    #   blocked_on_curator:    canonical_subj4 is null for this discipline
    #   skip_no_discipline:    discipline blank
    #   skip_unknown_disc:     discipline not in canonical map (out-of-sync)
    #   invalid_canonical:     canonical_subj4 set but doesn't match ^[A-Z]{4}$
    rows = []
    fate_counts = Counter()
    # Walk minted catalog + singletons. Both files use the same M-ID id family
    # and need the same SUBJ4 canonicalization — the singletons aren't "less
    # M-IDish," they're "deferred until a second college teaches the title."
    sources = [("minted", courses), ("singleton", singletons)]
    for source_label, record_map in sources:
        for cid, rec in record_map.items():
            # Singletons file has no id_system field; minted may carry one. C-IDs
            # / CCN-IDs (rare in this file) are out of scope.
            if rec.get("id_system") and rec["id_system"] != "M-ID":
                continue
            disc = rec.get("discipline")
            old_subj4 = rec.get("subject_4letter") or ""
            old_subj, old_band, old_suffix, kind = parse_old(cid)
            title = rec.get("common_title") or ""
            norm = ntitle(title)
            row = {
                "old_id": cid,
                "source": source_label,
                "title": title,
                "norm_title": norm,
                "discipline": disc,
                "old_subj4": old_subj4,
                "old_band": old_band,
                "old_suffix": old_suffix,
                "kind": kind,
                "corroboration_members": rec.get("corroboration_members") or 0,
            }
            if not disc:
                row["fate"] = "skip_no_discipline"
            elif disc not in canon_map:
                row["fate"] = "skip_unknown_disc"
            elif kind == "unknown":
                row["fate"] = "skip_offscheme_id"
            else:
                canon = canon_map[disc].get("canonical_subj4")
                if not canon:
                    row["fate"] = "blocked_on_curator"
                elif not SUBJ4_RE.match(canon):
                    row["fate"] = "invalid_canonical"
                    row["bad_canonical"] = canon
                elif canon == old_subj4:
                    row["fate"] = "no_change"
                    row["new_subj4"] = canon
                else:
                    row["fate"] = "re_key"
                    row["new_subj4"] = canon
            fate_counts[row["fate"]] += 1
            rows.append(row)

    # ── Pass 2: assign new course_ids ──────────────────────────────────────
    # Group ALL rows whose fate ∈ {"re_key", "no_change"} by
    # (new_subj4, band, kind) and reallocate sequence numbers deterministically
    # by (norm_title, old_id). Both fates participate so that a no_change row's
    # OLD sequence isn't sticky — within a canonical bucket the post-canonicaliz-
    # ation ordering must be the same regardless of which rows happened to land
    # on the canonical SUBJ4 by chance pre-canonicalization.
    by_bucket = defaultdict(list)
    for r in rows:
        if r["fate"] not in ("re_key", "no_change"):
            continue
        bucket = (r["new_subj4"], r["old_band"], r["kind"])
        by_bucket[bucket].append(r)

    overflow_corr = []
    overflow_sing = []
    collisions = {}  # bucket_str -> list of rows landing in same bucket (≥2 == collision)
    for bucket, brows in by_bucket.items():
        s4, band, kind = bucket
        brows.sort(key=lambda r: (r["norm_title"], r["old_id"]))
        bucket_str = f"{s4} M{band}* ({kind})"
        if len(brows) >= 2:
            collisions[bucket_str] = []
        for i, r in enumerate(brows):
            if kind == "corroborated":
                if i >= 1000:
                    overflow_corr.append((bucket_str, i))
                    r["new_id"] = None
                    continue
                r["new_id"] = f"{s4} M{band}{i:03d}" if i >= 1 else f"{s4} M{band}001"
                # Actually: 0-based index i → display as i+1? Or 0-padded i?
                # The 2026-05-22 re-mint used 1-based (M1001 = first). Mirror that.
                r["new_id"] = f"{s4} M{band}{(i+1):03d}"
            elif kind == "standalone":
                if i >= 10 * 26 * 26:
                    overflow_sing.append((bucket_str, i))
                    r["new_id"] = None
                    continue
                r["new_id"] = f"{s4} M{band}{standalone_code(i)}"
            if len(brows) >= 2:
                collisions[bucket_str].append({
                    "old_id": r["old_id"],
                    "new_id": r.get("new_id"),
                    "title": r["title"],
                    "discipline": r["discipline"],
                    "old_subj4": r["old_subj4"],
                })

    # ── Pass 3: build alias map (only clean re-keys + no_change rows) ──────
    alias_map = {}
    for r in rows:
        if r["fate"] in ("re_key", "no_change") and r.get("new_id"):
            alias_map[r["old_id"]] = {
                "new_id": r["new_id"],
                "fate": r["fate"],
                "source": r["source"],
                "discipline": r["discipline"],
                "old_subj4": r["old_subj4"],
                "new_subj4": r["new_subj4"],
                "kind": r["kind"],
                "band": r["old_band"],
                "title": r["title"],
            }

    # ── Pass 4: validation ──────────────────────────────────────────────────
    validation = {}
    # V1: all new SUBJ4 are 4 letters
    bad_subj4 = sorted({r["new_subj4"] for r in rows
                        if r["fate"] in ("re_key", "no_change")
                        and r.get("new_subj4")
                        and not SUBJ4_RE.match(r["new_subj4"])})
    validation["all_new_subj4_are_4letter"] = {
        "pass": not bad_subj4,
        "bad_subj4_values": bad_subj4,
    }
    # V2: within each touched discipline, exactly one new SUBJ4
    disc_to_new_subj4 = defaultdict(set)
    for r in rows:
        if r["fate"] in ("re_key", "no_change") and r.get("new_subj4"):
            disc_to_new_subj4[r["discipline"]].add(r["new_subj4"])
    disc_violations = {d: sorted(s) for d, s in disc_to_new_subj4.items() if len(s) > 1}
    validation["one_subj4_per_discipline"] = {
        "pass": not disc_violations,
        "violations": disc_violations,
    }
    # V3: new course_ids unique
    new_id_counts = Counter(r["new_id"] for r in rows if r.get("new_id"))
    dups = {nid: n for nid, n in new_id_counts.items() if n > 1}
    validation["new_course_ids_unique"] = {"pass": not dups, "duplicates": dups}
    # V4: no overflows
    validation["no_seq_overflow"] = {
        "pass": not overflow_corr and not overflow_sing,
        "corroborated_overflow": overflow_corr,
        "standalone_overflow": overflow_sing,
    }

    # ── Pass 5: curation impact ─────────────────────────────────────────────
    # Per curated M-ID in coci_curation.json: report its fate. Per the playbook
    # safety patterns, we surface (don't decide) on any curated M-ID whose new
    # key lands in a collision bucket with ≥1 other curated M-ID (the operator
    # picks the canonical row at apply time).
    # Index rows by old_id for O(1) curation-impact lookup of fates that didn't
    # produce an alias (blocked_on_curator, skip_no_discipline, etc.).
    rows_by_id = {r["old_id"]: r for r in rows}
    curation_impact = []
    for old_key in sorted(curations.keys()):
        if old_key.startswith("UC-CUR-"):
            curation_impact.append({"old_id": old_key, "fate": "cluster_skipped",
                                     "note": "cluster (not an M-ID); re-key out of scope"})
            continue
        if old_key not in alias_map:
            row = rows_by_id.get(old_key)
            if row is None:
                curation_impact.append({"old_id": old_key, "fate": "not_found_in_minted"})
                continue
            curation_impact.append({
                "old_id": old_key,
                "fate": row["fate"],
                "discipline": row.get("discipline"),
                "old_subj4": row.get("old_subj4"),
                "title": row.get("title"),
            })
            continue
        a = alias_map[old_key]
        curation_impact.append({
            "old_id": old_key,
            "new_id": a["new_id"],
            "fate": a["fate"],
            "discipline": a["discipline"],
            "old_subj4": a["old_subj4"],
            "new_subj4": a["new_subj4"],
            "title": a["title"],
        })
    # Find collisions where ≥2 curated keys land in the same bucket.
    curated_set = set(curations.keys())
    curated_collisions = []
    for bucket_str, members in collisions.items():
        curated_in_bucket = [m for m in members if m["old_id"] in curated_set]
        if len(curated_in_bucket) >= 2:
            curated_collisions.append({"bucket": bucket_str, "curated": curated_in_bucket})

    # ── Pass 5b: downstream apply scope (memberships + articulations + clusters) ──
    # The dry-run doesn't TOUCH these — we just count what the apply step (5c)
    # will need to re-key, so the operator has a scope number going into the
    # apply window. All three look up old M-ID by string against alias_map.
    aliased_old_ids = set(alias_map.keys())
    downstream = {"memberships": 0, "articulations": 0, "cluster_members": 0,
                  "cluster_total_touched": 0}
    if os.path.exists(MEMBERSHIPS):
        with open(MEMBERSHIPS, encoding="utf-8") as f:
            mem = json.load(f).get("memberships", {})
        downstream["memberships"] = sum(1 for k in mem if k in aliased_old_ids)
    if os.path.exists(ARTICULATIONS):
        with open(ARTICULATIONS, encoding="utf-8") as f:
            arts = json.load(f).get("articulations", [])
        downstream["articulations"] = sum(
            1 for r in arts if r.get("course_id") in aliased_old_ids
        )
    if os.path.exists(UNIFIED_COURSES):
        with open(UNIFIED_COURSES, encoding="utf-8") as f:
            clusters = json.load(f).get("clusters", {})
        for c in clusters.values():
            members = c.get("members") or []
            touched = sum(1 for m in members if m in aliased_old_ids)
            if touched:
                downstream["cluster_total_touched"] += 1
                downstream["cluster_members"] += touched

    # ── Pass 6: per-discipline summary (top by impact) ──────────────────────
    disc_summary = defaultdict(lambda: {"total": 0, "re_key": 0, "no_change": 0, "blocked": 0,
                                         "canonical": None, "needs_review": True})
    for r in rows:
        d = r["discipline"]
        if not d: continue
        s = disc_summary[d]
        s["total"] += 1
        if r["fate"] == "re_key": s["re_key"] += 1
        elif r["fate"] == "no_change": s["no_change"] += 1
        elif r["fate"] == "blocked_on_curator": s["blocked"] += 1
        s["canonical"] = canon_map.get(d, {}).get("canonical_subj4")
        s["needs_review"] = canon_map.get(d, {}).get("needs_review", True)

    # ── Write artifacts ─────────────────────────────────────────────────────
    os.makedirs(OUT_DIR, exist_ok=True)
    today = date.today().isoformat()
    alias_doc = {
        "_status": "DRY-RUN — Phase 1e SUBJ4 canonicalization; no kb files mutated, no Supabase writes.",
        "_generated_by": "kb/_subj4_dryrun.py",
        "_generated_at": today,
        "_canonical_map_synced_at": canon_doc.get("_synced_at") or canon_doc.get("_seeded_at"),
        "_canonical_map_counts": canon_doc.get("_counts"),
        "count": len(alias_map),
        "aliases": dict(sorted(alias_map.items())),
    }
    with open(os.path.join(OUT_DIR, "alias_map.json"), "w", encoding="utf-8") as f:
        json.dump(alias_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    blocked_rows = [r for r in rows if r["fate"] == "blocked_on_curator"]
    blocked_by_disc = defaultdict(list)
    for r in blocked_rows:
        blocked_by_disc[r["discipline"]].append({"old_id": r["old_id"], "title": r["title"], "old_subj4": r["old_subj4"]})
    blocked_doc = {
        "_about": ("M-IDs that cannot be re-keyed yet because their discipline has no "
                   "curator-confirmed canonical_subj4. Fill these out via the Canonical SUBJ4 "
                   "curator tab, then re-run this dry-run."),
        "count_blocked_mids": len(blocked_rows),
        "count_blocked_disciplines": len(blocked_by_disc),
        "by_discipline": {d: {"count": len(v), "members_sample": v[:5]}
                          for d, v in sorted(blocked_by_disc.items(), key=lambda kv: -len(kv[1]))},
    }
    with open(os.path.join(OUT_DIR, "blocked.json"), "w", encoding="utf-8") as f:
        json.dump(blocked_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    collisions_doc = {
        "_about": ("New (SUBJ4, band, kind) buckets where ≥2 old M-IDs land — sequence "
                   "numbers are re-allocated. This is NORMAL for canonicalization (the "
                   "whole point); only the curated_collisions list within report.md is "
                   "an operator decision-point."),
        "bucket_count": len(collisions),
        "buckets": dict(sorted(collisions.items())),
    }
    with open(os.path.join(OUT_DIR, "collisions.json"), "w", encoding="utf-8") as f:
        json.dump(collisions_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # Source-split counts (minted vs singleton) for the apply-step planning.
    source_split = defaultdict(lambda: Counter())
    for r in rows:
        source_split[r["source"]][r["fate"]] += 1

    # Report.md
    report = _render_report(
        today=today, canon_doc=canon_doc, rows=rows, fate_counts=fate_counts,
        alias_map=alias_map, collisions=collisions, blocked_by_disc=blocked_by_disc,
        validation=validation, curation_impact=curation_impact,
        curated_collisions=curated_collisions, disc_summary=disc_summary,
        overflow_corr=overflow_corr, overflow_sing=overflow_sing,
        source_split=source_split, downstream=downstream,
    )
    with open(os.path.join(OUT_DIR, "report.md"), "w", encoding="utf-8") as f:
        f.write(report)

    # Console summary.
    print(f"[subj4_dryrun] {today}")
    print(f"  M-IDs total:               {sum(fate_counts.values())}")
    for k in ("re_key", "no_change", "blocked_on_curator", "skip_no_discipline",
              "skip_unknown_disc", "skip_offscheme_id", "invalid_canonical"):
        if fate_counts.get(k):
            mn = source_split["minted"].get(k, 0)
            sg = source_split["singleton"].get(k, 0)
            print(f"    {k:24} {fate_counts[k]:>6}  (minted {mn}, singletons {sg})")
    n_pass = sum(1 for v in validation.values() if v["pass"])
    print(f"  validation:                {n_pass}/{len(validation)} pass")
    if blocked_by_disc:
        print(f"  blocked disciplines:       {len(blocked_by_disc)} "
              f"({sum(len(v) for v in blocked_by_disc.values())} M-IDs)")
    if curated_collisions:
        print(f"  CURATED collisions:        {len(curated_collisions)} buckets — review report.md")
    print(f"  artifacts: {OUT_DIR}/{{alias_map.json,blocked.json,collisions.json,report.md}}")


def _render_report(*, today, canon_doc, rows, fate_counts, alias_map, collisions,
                   blocked_by_disc, validation, curation_impact, curated_collisions,
                   disc_summary, overflow_corr, overflow_sing, source_split,
                   downstream) -> str:
    cm_counts = canon_doc.get("_counts") or {}
    pct_complete = ((cm_counts.get("seeded_default", 0)
                     + (cm_counts.get("total_disciplines", 0) - cm_counts.get("needs_review", 0))
                     - cm_counts.get("seeded_default", 0))
                    / max(cm_counts.get("total_disciplines", 1), 1))
    n_reviewed = cm_counts.get("total_disciplines", 0) - cm_counts.get("needs_review", 0)
    map_ready = cm_counts.get("needs_review", 0) == 0

    lines = []
    lines.append("---")
    lines.append("title: SUBJ4 Canonicalization Dry-Run — Phase 1e")
    lines.append(f"date: {today}")
    lines.append("session: 5b (Bruh Quad)")
    lines.append("status: DRY-RUN — no kb files mutated, no Supabase writes")
    lines.append("tags: [remint, dry-run, phase-1e, subj4-canonicalization, m-id]")
    lines.append("artifacts:")
    lines.append("  - kb/subj4_dryrun/alias_map.json")
    lines.append("  - kb/subj4_dryrun/collisions.json")
    lines.append("  - kb/subj4_dryrun/blocked.json")
    lines.append("---\n")
    lines.append("# SUBJ4 Canonicalization Dry-Run — Phase 1e\n")

    # TL;DR
    lines.append("## TL;DR\n")
    lines.append(f"- Canonical map: **{n_reviewed} / {cm_counts.get('total_disciplines','?')}** "
                 f"disciplines reviewed; **{cm_counts.get('needs_review','?')}** still need a "
                 f"4-letter canonical SUBJ4.")
    mn = sum(source_split["minted"].values())
    sg = sum(source_split["singleton"].values())
    lines.append(f"- M-IDs total: **{sum(fate_counts.values())}** "
                 f"(corroborated catalog: {mn}, singletons: {sg})")
    lines.append(f"  - **{fate_counts.get('re_key', 0)}** would re-key to new SUBJ4 "
                 f"(minted {source_split['minted'].get('re_key', 0)}, "
                 f"singletons {source_split['singleton'].get('re_key', 0)})")
    lines.append(f"  - **{fate_counts.get('no_change', 0)}** already on canonical SUBJ4 (no change) "
                 f"(minted {source_split['minted'].get('no_change', 0)}, "
                 f"singletons {source_split['singleton'].get('no_change', 0)})")
    lines.append(f"  - **{fate_counts.get('blocked_on_curator', 0)}** blocked on missing canonical "
                 f"(minted {source_split['minted'].get('blocked_on_curator', 0)}, "
                 f"singletons {source_split['singleton'].get('blocked_on_curator', 0)})")
    if fate_counts.get('skip_no_discipline'):
        lines.append(f"  - {fate_counts['skip_no_discipline']} skipped (no discipline)")
    if fate_counts.get('skip_unknown_disc'):
        lines.append(f"  - {fate_counts['skip_unknown_disc']} skipped (discipline not in canonical map)")
    if fate_counts.get('skip_offscheme_id'):
        lines.append(f"  - {fate_counts['skip_offscheme_id']} skipped (old course_id off-scheme)")
    lines.append(f"- Sequence-reallocation buckets: **{len(collisions)}** new (SUBJ4, band, kind) "
                 f"buckets contain ≥2 old M-IDs.")
    lines.append("")

    # Apply gate
    lines.append("## Apply gate (5c readiness)\n")
    if map_ready and all(v["pass"] for v in validation.values()) and not curated_collisions:
        lines.append("**✅ READY FOR APPLY** — canonical map complete, validation clean, no curated collisions.")
    else:
        lines.append("**🟡 NOT READY for apply** — open items:")
        if not map_ready:
            lines.append(f"  - {cm_counts.get('needs_review','?')} disciplines need a curator-confirmed canonical SUBJ4 "
                         "(fill via the Canonical SUBJ4 tab and re-run this dry-run)")
        for vk, vv in validation.items():
            if not vv["pass"]:
                lines.append(f"  - validation failure: `{vk}`")
        if curated_collisions:
            lines.append(f"  - {len(curated_collisions)} bucket(s) contain ≥2 curated M-IDs — operator decision required")
    lines.append("")

    # Curation impact
    lines.append("## Curation impact\n")
    lines.append(f"`coci_curation.json` has **{len(curation_impact)}** entries. Per-entry fate:\n")
    lines.append("| old_id | fate | new_id | discipline | old → new SUBJ4 |")
    lines.append("|---|---|---|---|---|")
    for c in curation_impact:
        lines.append(f"| `{c['old_id']}` | {c['fate']} | `{c.get('new_id','—')}` | "
                     f"{c.get('discipline','—')} | "
                     f"{c.get('old_subj4','—')} → {c.get('new_subj4','—')} |")
    lines.append("")
    if curated_collisions:
        lines.append("### Curated-M-ID collisions (operator decision points)\n")
        lines.append("These buckets contain ≥2 curated M-IDs whose old keys all rename into the same canonical bucket. "
                     "The dry-run assigns sequence numbers by (normalized_title, old_id); the operator approves at apply.\n")
        for c in curated_collisions:
            lines.append(f"**Bucket `{c['bucket']}`:**")
            for m in c["curated"]:
                lines.append(f"- `{m['old_id']}` → `{m['new_id']}` · {m['title']}")
            lines.append("")
    lines.append("")

    # Top 25 disciplines by re-key impact
    lines.append("## Top 25 disciplines by re-key impact\n")
    lines.append("| discipline | canonical | n M-IDs | re-key | no-change | blocked | reviewed? |")
    lines.append("|---|---|---:|---:|---:|---:|:---:|")
    ranked = sorted(disc_summary.items(), key=lambda kv: -(kv[1]["re_key"]))[:25]
    for d, s in ranked:
        reviewed = "✓" if not s["needs_review"] else "—"
        canon = s["canonical"] or "*(unset)*"
        lines.append(f"| {d} | `{canon}` | {s['total']} | {s['re_key']} | {s['no_change']} | "
                     f"{s['blocked']} | {reviewed} |")
    lines.append("")

    # Validation
    lines.append("## Validation\n")
    for vk, vv in validation.items():
        emoji = "✅" if vv["pass"] else "❌"
        lines.append(f"- {emoji} **{vk}**: {'pass' if vv['pass'] else 'FAIL'}")
        if not vv["pass"]:
            if vk == "all_new_subj4_are_4letter":
                lines.append(f"  - bad SUBJ4 values: {vv['bad_subj4_values']}")
            elif vk == "one_subj4_per_discipline":
                for d, ss in sorted(vv['violations'].items())[:10]:
                    lines.append(f"  - {d}: {ss}")
            elif vk == "new_course_ids_unique":
                for nid, n in sorted(vv['duplicates'].items())[:10]:
                    lines.append(f"  - `{nid}` × {n}")
            elif vk == "no_seq_overflow":
                if vv['corroborated_overflow']:
                    lines.append(f"  - corroborated overflow: {vv['corroborated_overflow'][:5]}")
                if vv['standalone_overflow']:
                    lines.append(f"  - standalone overflow: {vv['standalone_overflow'][:5]}")
    lines.append("")

    # Blocked-on-curator backlog
    if blocked_by_disc:
        lines.append("## Blocked on curator — top disciplines\n")
        lines.append("These disciplines have ≥1 M-ID waiting on a canonical SUBJ4. Fill in the "
                     "Canonical SUBJ4 tab.\n")
        lines.append("| discipline | n blocked M-IDs | data-modal | sample old SUBJ4s |")
        lines.append("|---|---:|---|---|")
        ranked_blocked = sorted(blocked_by_disc.items(), key=lambda kv: -len(kv[1]))
        for d, members in ranked_blocked[:25]:
            sample = sorted({m["old_subj4"] for m in members})[:6]
            modal = (canon_doc.get("disciplines", {}).get(d) or {}).get("data_modal", "—")
            lines.append(f"| {d} | {len(members)} | `{modal}` | {', '.join('`'+x+'`' for x in sample)} |")
        lines.append("")
        if len(ranked_blocked) > 25:
            lines.append(f"_…and {len(ranked_blocked) - 25} more disciplines — see `blocked.json`._")
        lines.append("")

    # Sequence-collision summary (count only — full list in collisions.json)
    lines.append("## Sequence-collision summary\n")
    lines.append(f"{len(collisions)} new buckets contain ≥2 old M-IDs. Top 10 by collision count:\n")
    top_colls = sorted(collisions.items(), key=lambda kv: -len(kv[1]))[:10]
    lines.append("| new bucket | colliding M-IDs |")
    lines.append("|---|---:|")
    for b, members in top_colls:
        lines.append(f"| `{b}` | {len(members)} |")
    lines.append("")

    # Downstream apply scope (what 5c will need to re-key beyond minted/singletons)
    lines.append("## Downstream apply scope\n")
    lines.append("Beyond `coci_minted_courses.json` + `coci_minted_singletons.json`, the apply "
                 "step (5c) re-keys references in three downstream files. The numbers below count "
                 "records that touch at least one old M-ID in this dry-run's alias map.\n")
    lines.append("| file | records re-keyed |")
    lines.append("|---|---:|")
    lines.append(f"| `kb/coci_minted_memberships.json` | {downstream.get('memberships', 0)} |")
    lines.append(f"| `kb/coci_articulations.json` (articulations[]) | {downstream.get('articulations', 0)} |")
    lines.append(f"| `kb/coci_unified_courses.json` (clusters[].members) | "
                 f"{downstream.get('cluster_total_touched', 0)} clusters, "
                 f"{downstream.get('cluster_members', 0)} member refs |")
    lines.append(f"| `kb/coci_curation.json` (key rename) | "
                 f"{sum(1 for c in curation_impact if c.get('fate') in ('re_key',))} |")
    lines.append("")

    # How to proceed
    lines.append("## How to proceed\n")
    lines.append("1. Curators fill any blank `canonical_subj4` entries via the **Canonical SUBJ4** tab.")
    lines.append("2. Re-run `python3 kb/_subj4_dryrun.py` to refresh this report.")
    lines.append("3. When the apply-gate above goes ✅, Session 5c builds `kb/_subj4_apply.py` "
                 "for the atomic re-key (producer + consumer + curation overlay + Supabase live "
                 "kb_curation, all in one 10:17 UTC window).")
    lines.append("4. Rollback inverse alias lives in `kb/subj4_dryrun/alias_map.json` (right-to-left).")
    lines.append("")

    return "\n".join(lines)


if __name__ == "__main__":
    main()
