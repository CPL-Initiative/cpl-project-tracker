# Re-mint 1c-ii validation — go/no-go (output diff)

Method: ran `export_unified_courses()` against the **preview** kb (re-minted
files + re-keyed `coci_curation.json`, via the `UC_KB_DIR`/`UC_OUT_DIR` test
seam) and compared the generated `unified_courses_*.js` to the **committed
production** files (old code + old data). No live or Supabase writes.

## Coupling proof (why this must land atomically)
Running the **new export against the OLD kb** (no `control_number`, no
`promotions.json`) collapsed Phase B to **0** and member rows to **76 identities**
— a fully regressed dashboard. New consumer + old producer is broken, exactly as
flagged. Producer (kb) + consumer (export) must land together.

## Baseline (committed) vs preview (re-mint)
| metric | baseline | preview | note |
|---|---|---|---|
| in-browser rows | 15,719 | 16,912 | ↑ — 1,554 old singletons promoted to corroborated (1a tier flips) |
| Phase B official rows (`consolidated_from`) | 209 | **288** | ↑ — **≥ old ✓** |
| M-IDs consumed by Phase B | 896 | **1,323** | ↑ — promotions are control-number-exact, catch more ✓ |
| kind: Course | 14,213 | 15,377 | ↑ (tier flips) |
| kind: Cluster | 1,253 | 1,216 | ≈ |
| kind: C-ID | 195 | 261 | ↑ (more official consolidation) |
| kind: CCN-ID | 58 | 58 | = |
| members.js identities | 73,217 | 72,823 | ≈ |
| members.js member rows | 141,951 | **129,482** | ↓ 12,469 — the over-merge fix: exact join drops spurious lossy-join members |

Phase B **increased** (896→1,323 M-IDs, 209→288 rows) — satisfies the "must be ≥
old" gate; no wiring bug.

## Spot-checks
- **Anchor fold:** `ACCT 110` (locked C-ID anchor) ← 10 M-IDs consolidated. ✓
- **ACC 1A remnant:** `M-ID ACC 116 → ACC M1004`, consumed (not a standalone row),
  folded into `ACCT 110` (`consolidated_from` contains it). ✓
- **Synthesized official row:** 239 of them, e.g. `BUS 115` ← 4 M-IDs
  ("Business Communications"). ✓
- **Exact member-join:** `ELET M1001` lists exactly its 6 1a members (Irvine
  Valley, Laney, North Orange ×2, Palo Verde, San Joaquin Delta). ✓
- **Member-join faithfulness:** on a 300-row corroborated sample, 297 match the 1a
  membership count exactly; 3 off-by-one from duplicate `CourseControlNumber`s in
  the raw list + the intentional `(college,code,title)` dedup. ✓
- **`POLS 110`:** correctly NOT a unified-courses row — its title has no minted
  remnant (all colleges teach it C-ID-aligned); its adoption leverage lives on the
  C-ID in the articulations layer (1b), unchanged at 72.

## Headline re-rank (the 1b effect, no new surprise)
Adoption leverage 64,732 → 47,994 is the over-merge double-count removal validated
in 1b (AP US Gov: C-ID `POLS 110` keeps lev 72; the duplicate over-merged M-ID
collapses to its 1-college remnant). The "Articulations by Unified Course" card
will lead with C-ID identities instead of inflated M-IDs.

## Verdict: **GO.**
Phase B ≥ old, member-join exact and faithful, all spot-checks pass, deltas all
explained by the intended fix. Ready for the atomic land (kb overwrite + re-keyed
curation + export change in one commit), then the gated Supabase re-key — in one
window before the next daily cron (10:17 UTC).
