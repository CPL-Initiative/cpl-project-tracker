"""
Exhibit-canonicalization auditor — credential-identity layer.

Purpose
-------
Read-only diagnostic over `kb/unified_titles.json` + `kb/credentials.json`
(the synthetic credential-identity layer above MAP's freehand exhibit
titles). The credential layer is the analog of the course-identity layer
audited by `kb/_row_audit.py`: each raw MAP exhibit title gets a unified
title + issuer + trainer + confidence, classified by the
`exhibit-canonicalization` skill (`.claude/skills/exhibit-canonicalization/
SKILL.md`). This auditor surfaces what's stale, low-confidence, or
suspect so a curator can work the backlog without re-classifying.

Output
------
  kb/exhibit_audit/<YYYY-MM-DD>.md       — top-50 + dists, gitted
  kb/exhibit_audit/latest.json           — slim per-row summaries, gitted
  kb/exhibit_audit/<YYYY-MM-DD>.full.json — full per-row breakdown, gitignored

READ-ONLY. Never mutates kb/unified_titles.json or kb/credentials.json.
Re-runnable; deterministic on a given KB + MAP snapshot.

Run from repo root:  python3 kb/_audit_exhibits.py
"""
from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "exhibit_audit")

TODAY = date.today().isoformat()
NOW_ISO = datetime.now(timezone.utc).isoformat(timespec="seconds")

# Confidence bands — mirror skill Rule 8.
BANDS = [
    ("0.95-1.00", 0.95, 1.001),
    ("0.80-0.94", 0.80, 0.95),
    ("0.60-0.79", 0.60, 0.80),
    ("0.40-0.59", 0.40, 0.60),
    ("<0.40",     -0.001, 0.40),
]


def _band(c):
    for label, lo, hi in BANDS:
        if lo <= c < hi:
            return label
    return "?"


# Stopwords that don't carry agency signal — used to detect agency-name
# variants (e.g. "Google" vs "Google Inc" vs "Google LLC").
AGENCY_STOP = {
    "the", "of", "and", "for", "a", "an", "&", "co", "corp", "corporation",
    "inc", "incorporated", "ltd", "llc", "company", "association",
    "organization", "org", "international", "national", "american",
    "california", "us", "u.s.", "u.s.a.", "usa",
}


def _agency_tokens(name):
    if not name:
        return frozenset()
    s = re.sub(r"[^a-zA-Z0-9]+", " ", name.lower())
    return frozenset(t for t in s.split() if t and t not in AGENCY_STOP and len(t) >= 3)


def _load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_map_raw_titles():
    """Read every distinct raw Exhibit Title from CustomReport_latest.json.

    Returns the set of titles or None if the file is missing. The auditor
    falls back to KB-only mode if CustomReport_latest.json is absent (e.g.
    when running outside the daily cron context).
    """
    path = os.path.join(ROOT, "CustomReport_latest.json")
    if not os.path.exists(path):
        return None
    try:
        doc = _load_json(path)
    except Exception:
        return None
    reports = doc.get("reports", doc) if isinstance(doc, dict) else doc
    titles = set()
    for r in reports:
        if r.get("viewName") != "View_ArticulatedMAPExhibits_APIDataset":
            continue
        cm = {c: i for i, c in enumerate(r.get("columnName", []))}
        i_title = cm.get("Exhibit Title", 2)
        for row in r.get("columnValue", []):
            t = (row[i_title] or "").strip()
            if t:
                titles.add(t)
        break
    return titles or None


# ─── per-row rule classifiers ───────────────────────────────────────────

def _title_tags(rec):
    """Tags to fire on a unified_titles.json entry.

    Returns a list of tag strings. Confidence-band rules are reported via
    the band classification, not as tags, to avoid double-counting.
    """
    tags = []
    c = rec.get("confidence_title", 0)
    if c < 0.60:
        tags.append("very_low_confidence_title")
    elif c < 0.80:
        tags.append("low_confidence_title")
    qf = rec.get("quality_flag")
    if qf:
        tags.append(qf)  # passes through "suspect_course_as_exhibit"
    if not rec.get("unified_title"):
        tags.append("blank_unified_title")
    return tags


def _credential_tags(unified_title, rec, peer_agency_tokens):
    """Tags to fire on a credentials.json issuer record."""
    tags = []
    ci = rec.get("confidence_issuer", 0)
    ct = rec.get("confidence_trainer", 0)
    iss = rec.get("issuing_agency")
    trn = rec.get("training_agency")
    if ci < 0.60:
        tags.append("very_low_confidence_issuer")
    elif ci < 0.80:
        tags.append("low_confidence_issuer")
    if trn:
        if ct < 0.60:
            tags.append("very_low_confidence_trainer")
        elif ct < 0.80:
            tags.append("low_confidence_trainer")
    # Note: an earlier draft fired "null_issuer_with_high_confidence" here
    # (issuer is null AND confidence_issuer >= 0.85). That rule turned out
    # to be ~95% noise — the batch classifier confidently sets `null` for
    # the 1,100+ local college CBE / portfolio-review buckets where null
    # is semantically correct. Dropped.
    # Agency-name collision signal: this agency's tokens are a (proper)
    # subset / superset of another distinct agency. Suggests canonicalization
    # opportunity (e.g. "Google" vs "Google LLC").
    my_tokens = _agency_tokens(iss)
    if my_tokens:
        for other_name, other_tokens in peer_agency_tokens.items():
            if other_name == iss or not other_tokens:
                continue
            if my_tokens < other_tokens or other_tokens < my_tokens:
                tags.append("agency_name_collision_signal")
                break
    return tags


# ─── main ───────────────────────────────────────────────────────────────

def main():
    print(f"[exhibit_audit] running for {TODAY}")
    ut = _load_json(os.path.join(HERE, "unified_titles.json"))
    cr = _load_json(os.path.join(HERE, "credentials.json"))
    print(f"  loaded: {len(ut)} unified_titles entries, {len(cr)} credential keys")

    map_titles = _load_map_raw_titles()
    if map_titles is None:
        print("  WARN: CustomReport_latest.json missing; drift checks skipped")
    else:
        print(f"  loaded: {len(map_titles)} raw titles from current MAP data")

    # Pre-compute peer agency tokens once for collision detection.
    all_agencies = {}
    for unified, records in cr.items():
        for r in records:
            iss = r.get("issuing_agency")
            if iss and iss not in all_agencies:
                all_agencies[iss] = _agency_tokens(iss)

    # ─── per-title cards ───────────────────────────────────────────
    title_cards = []
    confidence_bands = Counter()
    reviewed = 0
    tag_counts = Counter()

    # unified_title → raw count (for compression analysis)
    raw_per_unified = Counter()

    for raw_title, rec in ut.items():
        unified = rec.get("unified_title")
        if unified:
            raw_per_unified[unified] += 1
        c = rec.get("confidence_title", 0)
        confidence_bands[_band(c)] += 1
        if rec.get("reviewed_at"):
            reviewed += 1
        tags = _title_tags(rec)
        if map_titles is not None and raw_title not in map_titles:
            tags.append("stale_kb_entry")
        for t in tags:
            tag_counts[t] += 1
        title_cards.append({
            "raw_title": raw_title,
            "unified_title": unified,
            "confidence_title": c,
            "band": _band(c),
            "quality_flag": rec.get("quality_flag"),
            "reviewed_at": rec.get("reviewed_at"),
            "tags": tags,
        })

    # ─── unclassified-in-MAP rows (titles in MAP but not in KB) ──
    unclassified = []
    if map_titles is not None:
        for raw_title in sorted(map_titles - set(ut.keys())):
            unclassified.append({
                "raw_title": raw_title,
                "unified_title": None,
                "confidence_title": 0.0,
                "band": "<0.40",
                "quality_flag": None,
                "reviewed_at": None,
                "tags": ["unclassified_in_map"],
            })
            tag_counts["unclassified_in_map"] += 1

    # ─── per-credential cards ─────────────────────────────────────
    credential_cards = []
    credential_bands = Counter()  # by confidence_issuer
    credential_reviewed = 0

    for unified, records in cr.items():
        for rec in records:
            ci = rec.get("confidence_issuer", 0)
            credential_bands[_band(ci)] += 1
            if rec.get("reviewed_at"):
                credential_reviewed += 1
            tags = _credential_tags(unified, rec, all_agencies)
            for t in tags:
                tag_counts[t] += 1
            credential_cards.append({
                "unified_title": unified,
                "issuing_agency": rec.get("issuing_agency"),
                "training_agency": rec.get("training_agency"),
                "confidence_issuer": ci,
                "confidence_trainer": rec.get("confidence_trainer", 0),
                "band": _band(ci),
                "reviewed_at": rec.get("reviewed_at"),
                "tags": tags,
            })

    # ─── compression analysis ─────────────────────────────────────
    distinct_unified = len(raw_per_unified)
    singletons = sum(1 for n in raw_per_unified.values() if n == 1)
    compression_pct = 100.0 * distinct_unified / max(1, len(ut))

    stats = {
        "total_raw_titles": len(ut),
        "distinct_unified_titles": distinct_unified,
        "compression_pct": round(compression_pct, 1),
        "singleton_unified_titles": singletons,
        "title_confidence_bands": confidence_bands,
        "title_reviewed_count": reviewed,
        "credential_records": len(credential_cards),
        "credential_confidence_bands": credential_bands,
        "credential_reviewed_count": credential_reviewed,
        "distinct_issuers": len(all_agencies),
        "tag_counts": tag_counts,
        "map_titles_in_current_dataset": len(map_titles) if map_titles is not None else None,
        "unclassified_in_map": len(unclassified),
        "stale_kb_entries": tag_counts.get("stale_kb_entry", 0),
    }

    # ─── write outputs ────────────────────────────────────────────
    if not os.path.isdir(OUT):
        os.makedirs(OUT)

    metadata = {
        "_generated_at": NOW_ISO,
        "_generated_by": "kb/_audit_exhibits.py — credential-identity layer auditor",
        "_scope": "kb/unified_titles.json + kb/credentials.json; drift checked against "
                  "CustomReport_latest.json (current MAP raw titles).",
        "_rules_active": [
            "low_confidence_title", "very_low_confidence_title",
            "low_confidence_issuer", "very_low_confidence_issuer",
            "low_confidence_trainer", "very_low_confidence_trainer",
            "agency_name_collision_signal",
            "suspect_course_as_exhibit",  # pass-through from _flag_hinky_exhibits.py
            "blank_unified_title",
            "unclassified_in_map",
            "stale_kb_entry",
        ],
        "_confidence_bands": [b[0] for b in BANDS],
    }

    summary_payload = {
        **metadata,
        "stats": stats,
        "title_cards": title_cards + unclassified,
        "credential_cards": credential_cards,
        "top_unified_by_variants": raw_per_unified.most_common(25),
    }
    latest_path = os.path.join(OUT, "latest.json")
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, ensure_ascii=False, separators=(",", ":"))

    full_payload = dict(summary_payload)  # same shape; future-proofed for divergence
    full_path = os.path.join(OUT, f"{TODAY}.full.json")
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(full_payload, f, ensure_ascii=False, separators=(",", ":"))

    md_path = os.path.join(OUT, f"{TODAY}.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(_render_md(stats, title_cards, credential_cards, unclassified,
                           raw_per_unified))

    # ─── stdout summary ───────────────────────────────────────────
    print(f"[exhibit_audit] {TODAY}: {stats['total_raw_titles']} raw → "
          f"{stats['distinct_unified_titles']} unified "
          f"({stats['compression_pct']}% compression, "
          f"{stats['singleton_unified_titles']} singletons)")
    print(f"  title confidence: " + " · ".join(
        f"{b}={stats['title_confidence_bands'].get(b, 0)}" for b, _, _ in BANDS))
    print(f"  reviewed: {stats['title_reviewed_count']} titles, "
          f"{stats['credential_reviewed_count']} credentials")
    if map_titles is not None:
        print(f"  drift: {stats['unclassified_in_map']} unclassified-in-MAP, "
              f"{stats['stale_kb_entries']} stale KB entries")
    top_tags = stats["tag_counts"].most_common(8)
    if top_tags:
        print(f"  top tags: " + " · ".join(f"{t}={n}" for t, n in top_tags))
    print(f"  wrote: {latest_path} ({os.path.getsize(latest_path)//1024} KB)")
    print(f"  wrote: {md_path} ({os.path.getsize(md_path)//1024} KB)")
    print(f"  wrote: {full_path} ({os.path.getsize(full_path)//1024} KB, gitignored)")


def _render_md(stats, title_cards, credential_cards, unclassified, raw_per_unified):
    """Human-readable audit report. Top-50 by lowest confidence first."""
    lines = []
    lines.append(f"# Exhibit Canonicalization Audit — {TODAY}")
    lines.append("")
    lines.append(f"Generated: `{NOW_ISO}`  ")
    lines.append("Scope: `kb/unified_titles.json` + `kb/credentials.json`; "
                 "drift checked against `CustomReport_latest.json`.")
    lines.append("")
    lines.append("## Headline")
    lines.append("")
    lines.append(f"- **{stats['total_raw_titles']}** raw exhibit titles in KB")
    lines.append(f"- **{stats['distinct_unified_titles']}** distinct unified titles "
                 f"({stats['compression_pct']}% compression)")
    lines.append(f"- **{stats['singleton_unified_titles']}** unified titles with only "
                 f"1 raw variant (low compression value)")
    lines.append(f"- **{stats['credential_records']}** credential records "
                 f"across **{stats['distinct_issuers']}** distinct issuers")
    if stats["map_titles_in_current_dataset"] is not None:
        lines.append(f"- **{stats['unclassified_in_map']}** raw titles in current MAP "
                     f"data but **NOT** in KB (unclassified backlog)")
        lines.append(f"- **{stats['stale_kb_entries']}** KB entries no longer in "
                     f"current MAP data (stale; safe to retain but flagged)")
    lines.append(f"- **{stats['title_reviewed_count']}** titles reviewed · "
                 f"**{stats['credential_reviewed_count']}** credentials reviewed")
    lines.append("")

    lines.append("## Title confidence distribution")
    lines.append("")
    lines.append("| band | count | % |")
    lines.append("|---|---:|---:|")
    total = stats["total_raw_titles"]
    for band, _, _ in BANDS:
        n = stats["title_confidence_bands"].get(band, 0)
        pct = (100.0 * n / total) if total else 0
        lines.append(f"| {band} | {n} | {pct:.1f}% |")
    lines.append("")

    lines.append("## Credential issuer confidence distribution")
    lines.append("")
    lines.append("| band | count | % |")
    lines.append("|---|---:|---:|")
    ctotal = stats["credential_records"]
    for band, _, _ in BANDS:
        n = stats["credential_confidence_bands"].get(band, 0)
        pct = (100.0 * n / ctotal) if ctotal else 0
        lines.append(f"| {band} | {n} | {pct:.1f}% |")
    lines.append("")

    lines.append("## Active tag counts")
    lines.append("")
    lines.append("| tag | count |")
    lines.append("|---|---:|")
    for tag, n in stats["tag_counts"].most_common():
        lines.append(f"| `{tag}` | {n} |")
    lines.append("")

    lines.append("## Top 25 unified titles by raw-variant count")
    lines.append("")
    lines.append("Higher = more title-drift collapsed into one credential identity. "
                 "Quality anchor candidates: skim these for any over-merges before "
                 "wiring the EACR pipeline to group by unified title.")
    lines.append("")
    lines.append("| # raw | unified title |")
    lines.append("|---:|---|")
    for title, n in raw_per_unified.most_common(25):
        lines.append(f"| {n} | {title} |")
    lines.append("")

    # Top-50 low-confidence titles
    lines.append("## Top 50 lowest-confidence title classifications")
    lines.append("")
    lines.append("Curator review queue, ranked lowest confidence first.")
    lines.append("")
    low = sorted(title_cards, key=lambda c: (c["confidence_title"], c["raw_title"]))[:50]
    lines.append("| conf | unified | raw_title | flag |")
    lines.append("|---:|---|---|---|")
    for c in low:
        raw = c["raw_title"].replace("|", "\\|")[:60]
        unified = (c["unified_title"] or "—").replace("|", "\\|")[:50]
        flag = c.get("quality_flag") or ""
        lines.append(f"| {c['confidence_title']:.2f} | {unified} | {raw} | {flag} |")
    lines.append("")

    # Unclassified-in-MAP sample
    if unclassified:
        lines.append(f"## Unclassified raw titles in current MAP data ({len(unclassified)})")
        lines.append("")
        lines.append("Sample (first 25). Run `kb/classify_exhibits.py` to classify these.")
        lines.append("")
        for c in unclassified[:25]:
            lines.append(f"- `{c['raw_title']}`")
        lines.append("")

    # Agency-collision sample
    collisions = [c for c in credential_cards if "agency_name_collision_signal" in c["tags"]]
    if collisions:
        lines.append(f"## Agency-name collision candidates ({len(collisions)})")
        lines.append("")
        lines.append("Issuer-name pairs where one is a token-subset of another. Often "
                     "indicates the same agency under two slightly different names "
                     "(e.g. `Google` vs `Google LLC`). Review for canonicalization.")
        lines.append("")
        # Group by issuing_agency to dedupe the list
        seen = set()
        for c in collisions[:50]:
            iss = c["issuing_agency"]
            if iss in seen:
                continue
            seen.add(iss)
            lines.append(f"- `{iss}`")
        lines.append("")

    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    main()
