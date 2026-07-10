# Trail Crew 🥾 — CSR pass report (2026-07-10)

The crew walked the **Common Subject Reference** — the 146-discipline
canonical-SUBJ4 registry (`kb/discipline_canonical_subj4.json`, synced
2026-07-10T15:06Z, live overlay verified drift-free) — against the official
CCN vocabulary (14 COCI-observed prefixes + 11 anchor officials), the M-ID
mint path, and the curated common-courses anchor.

Method: `kb/_csr_trail.py` (185 findings) → 6 canon-guided adjudicators →
adversarial skeptic on every change proposal (5 skeptics: **2 proposals
refuted and killed**, 4 upheld). Verdict mix: **58 bless · 3 rekey-evidence ·
3 fix-wiring · 3 curator/doctrine**.

## Headline: the CSR is in excellent shape

146/146 four-letter canonicals, zero duplicates, zero blanks, zero live-sync
drift, and **zero semantic squats** on official CCN prefixes. 15 canonicals
equal official prefixes and every one is the official subject's semantic twin
(ENGL, PSYC, MATH, HIST, ECON, COMM, ANTH, ARTH, BIOL, ASTR, SOCI, EDUC,
ENGR, GEOG, JOUR) — the aligned steady state the CSR exists to reach.
**Alignment doctrine recorded (CSR0001):** when discipline, official prefix,
and field usage agree, the M-ID namespace matches what CCN colleges already
print in catalogs.

## Lane 1 — Rule-7 re-mint evidence (Sam fires; nothing written)

1. **POSC → POLS (Political Science), skeptic-upheld 0.8/verified.**
   Official CCN prefix POLS carries 144 official rows; POLS is also the field
   modal (223 vs POSC 42); the POSC override has no recorded rationale.
   Scope: 283 M-IDs. If any deliberate reason for POSC exists, record it
   instead — otherwise this is the one clean convergence of the pass.

## Lane 2 — Doctrine question (Sam's call)

2. **Weak-adoption officials: ECED vs CDEV + 4 siblings (CSR0013).** Does an
   official prefix with near-zero adoption command CS4 convergence?
   - ECED vs **CDEV** (2 official rows; 1,349 M-IDs to re-mint; name favors ECED)
   - OTEC vs **BSOT** · MUSC vs **CMUS** · CSIS vs **ITIS** (0 rows each)
   - HEIT vs **HIT** (0 rows — and HIT is 3 letters, CS1-invalid as a canonical)
   **Recommended:** keep current canonicals, record the divergence reason per
   entry ("official prefix adoption nominal; revisit when CCN lands"), and
   let the registry's `_notes` carry it. Converge later only if adoption grows.

## Lane 3 — Wiring fixes (code, not data)

3. **Seeder bypass (CSR0066, skeptic-upheld 0.92) — the find of the pass.**
   `kb/_seed_coci_minted_mids.py` keys new M-IDs from the raw modal subject
   (both mint loops) and never loads the canonical registry — despite Rule 7
   documenting that consultation. New mints can silently re-introduce the
   variants the Session-50 fold eliminated. Proposal: load the registry at
   startup; after discipline resolution, key mints under the canonical SUBJ4
   (with the **umbrella-discipline carve-out** — Foreign Languages must mint
   per-language FL**, never FLNG; Kinesiology KINE/ATHL per Session 37/50
   scopes). **Held for Sam's nod — identity-mint path is architecturally
   significant.**
4. **Scanner heuristic fixes (CSR0040 + CSR0014) — APPLIED same-day** to
   `kb/_csr_trail.py`: mnemonic subsequence/variant-prefix checks (noise
   23→14) and anchor-official twin entries (false squats 4→0).

## Lane 4 — Anchor debt (promote-time plan; anchor stays firewalled)

5. **`common_courses.json`: 221/243 keys in the dead pre-remint
   `M-ID SUBJ NNN` format** (CSR0067, skeptic-upheld 0.85), 123 with subjects
   diverging from CSR canonicals across 35 distinct folds (AJ→CRIM, 3-letter
   MUS→MUSC, CIS→CSIS…). Staged as ONE promote-time re-key plan: strip the
   dead prefix + fold to canonical subjects at individual-entry promote time,
   per the anchor's own promote-individually rule. No bulk edit now.

## Lane 5 — Curator queue (3 rows)

- **Furniture Making → CSTF** (CSR0028): opaque code breaking the curator's
  own CNS* construction family; variants CFT/WMT/MAKR don't back it.
- **Upholstering → THAR** (CSR0065): seeded from a single-row "100% modal"
  that repo evidence ties to a theater-arts workshop course, not the trade.
- **"Disabled Student Programs and"** (truncated discipline name upstream in
  minted-course data; the adjudicator's proposed fold was **skeptic-refuted**
  — it would mis-key already-reminted identities — so this is flagged as
  observe-and-decide, no proposed action).

## Killed by skeptics (the system working)

- ESCI→ENVT re-key (factual error: all 590 M-IDs already keyed ESCI; churn > value).
- The DSPS truncated-name fold (would have mis-keyed reminted identities).

## Blessed (no action): 58 entries

Including all 15 official-prefix alignments, 20/23 mnemonic flags, 22/24
unreviewed seeds (obviously-right picks), and the EDTC-over-LINC modal
divergence (deliberate; suggest a `_notes` line).

---
Artifacts: `findings.{json,csv}` (method) · `adjudicated.json` (magic + skeptics)
· this report. Scanner: `kb/_csr_trail.py` (committed, re-runnable, read-only).
Doctrine honored: **evidence only — every apply is a Rule-7 re-mint on Sam's word.**
