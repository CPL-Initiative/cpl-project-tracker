---
title: Playbook — Merging two existing CER credentials (existing→existing fold)
created: 2026-06-04
updated: 2026-06-04
tags: [playbook, exhibit-canonicalization, credential-identity, kb, cer]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/kb-notes/methodology-cer-fold-articulation-ripple-sync]]"
artifacts:
  - kb/_merge_credentials.py
  - kb/credential_merges.json
  - kb/unified_titles.json
  - kb/credentials.json
  - kb/coci_articulations.json
---

# Playbook — Merging two existing CER credentials (existing→existing fold)

> **One-sentence summary** — when two *already-classified* credentials are really
> the same exhibit (e.g. one exhibit a college entered under two CPL types →
> two near-duplicate AI titles), fold the `loser` unified_title into the `winner`
> with `kb/_merge_credentials.py` (dry-run → V-gates → `--apply`), which re-keys
> all three KB files; this is the sibling of `_fold_unclassified.py`.

## Context

The Common Exhibit Reference (CER) row grain is `unified_title`. It does **not**
group or split by CPL type. So when the classifier assigns two slightly different
unified titles to the *same* underlying exhibit, you get two CER rows — and there
is no render-time "consolidation rule" to change. The fix is a data-level
**credential merge**. (Motivating case, Session 32 #285: "10-Key Data Entry" vs
"10-Key Numeric Data Entry" — both `BIT 375 "10-Key on the Computer"` at Modesto
JC, same `course_id CNSR M10AA`, same credit rec, split only by CPL type.)

## The claim

There are **two** distinct credential-fold operations; pick the right tool:

| Operation | Tool | What it does |
|---|---|---|
| **unclassified → existing** | `_fold_unclassified.py` | a raw title with NO unified_title gets ADDed pointing at an existing credential |
| **existing → existing** | `_merge_credentials.py` | a `loser` unified_title (already classified) is folded INTO a `winner` |

`_merge_credentials.py` applies each `{loser, winner}` decision across all three
KB files so no layer is left dangling:

1. **`unified_titles.json`** — re-point every raw whose `unified_title == loser`
   to `winner` (stamp `reviewed_by`/`reviewed_at` + a `_merge_note`; **preserve
   `confidence_title`** — it's the raw→title match strength, still meaningful).
2. **`credentials.json`** — the winner is authoritative: **DROP** the loser
   record when the winner already has one; **MOVE** the loser's record to the
   winner only when the winner has none.
3. **`coci_articulations.json`** — re-point every articulation whose
   `unified_title == loser` to `winner`. The producers group by `course_id`, so
   two records sharing a course_id collapse to one CER identity row; the differing
   `cpl_type_description` is preserved (each record keeps its own).

**V-gates (all must pass to `--apply`):** V1 no conflicts (loser==winner / empty /
loser absent with no raws) · V2 winner ends with ≥1 raw + a credentials record ·
V3 (post-assert) no loser remnant in any of the 3 files · V4 re-pointed
articulation count == the pre-scan count. Dry-run by default; `--apply` writes +
a receipt under `kb/credential_merges_out/<date>/`. Idempotent (loser already
gone → SKIP).

## How to run it

1. Diagnose: confirm the pair is the SAME exhibit — scan
   `coci_articulations.json` for both unified_titles; if they share `course_id` +
   local course + college and differ only in `cpl_type_description`, it's a merge.
2. Add a one-line decision to `kb/credential_merges.json`
   (`{loser, winner, reviewed_by, reviewed_at, reason}`).
3. `python3 kb/_merge_credentials.py` (dry-run) → check CLEAN/SKIP/CONFLICT + all
   V-gates OK.
4. `python3 kb/_merge_credentials.py --apply`, then **regenerate the baked file**
   (`python3 -c "import excel_to_dashboard as m; m.export_credential_reference()"`)
   so it ships live on merge (CER producer reads committed inputs).
5. Commit the 3 KB files + the receipt + the regenerated
   `credential_reference_data.js`; PR; merge on green.

## When this applies (and when it doesn't)

- **Applies** to the *class*: same exhibit entered under ≥2 CPL types → ≥2
  near-duplicate AI titles. A cheap detector: articulations sharing a `course_id`
  + local course but carrying different `unified_title`s.
- **Does NOT apply** when the two titles are genuinely different credentials that
  merely look alike — that's a judgment call for the `exhibit-canonicalization`
  skill, not a mechanical merge.
- **Articulation-ripple caveat:** unlike `_fold_unclassified.py` (whose V4 *blocks*
  on an articulation that disagrees), this tool *intentionally rewrites* the
  articulation layer (that IS the merge). If a winner has its own articulation
  spelling subtleties, see
  `[[docs/kb-notes/methodology-cer-fold-articulation-ripple-sync]]`.

## See also

- `[[docs/exhibit_canonicalization_lessons]]` — Session 32 section (the 10-Key case)
- PR `#285` — the tool + the first merge
- `kb/_fold_unclassified.py` — the unclassified→existing sibling

---

*Authoring check: durable (the merge operation recurs as the CPL-type-duplicate
class is worked down), reusable (any future CER curator), distilled (one concept:
existing→existing credential merge), self-contained.*
