---
title: Rules-based official-ID folds — the severed evidence index + tiered fold rule (the SPAN 200 case)
date: 2026-06-10
status: APPROVED + BUILT (Session 40, 2026-06-11) — Sam signed off all four §7 gates: R1+R2+R3 in one PR, tier-1 AUTO-FOLD, R4 singletons as a follow-up PR, retire the M-ID SPAN 104/106/108 anchors into the C-IDs (separate small PR). One spec deviation, flagged: unanimous single-witness folds stay AUTO (today's behavior — demoting them would UNFOLD 174 established rows / 795 member courses); the ≥80%+≥2 bar applies where dissent exists (any 80% share over a dissenter implies ≥5 witnesses, so the intent holds). ⚠ R1 DEFECT FOUND + CORRECTED (Session 42, same day): the re-key resolver graph-walked the alias maps (iterate-until-stable + liveness shortcut) and included the never-dispatched over-merge plan — 1,066 of 2,083 records (51%) mis-keyed. Rebuilt with permutation semantics (single-step chronological, era-stamped, V5 stamp gate) and re-applied from the pre-R1 baseline; receipt kb/promotions_rekey_out/2026-06-11-slotfix/. Semantics: docs/kb-notes/methodology-alias-map-resolution-semantics.md; story: docs/ccr_cluster_cleanup_lessons.md (Session 42). The §3/§4 measured numbers below describe the R1-era resolution and are superseded by the slot-fix receipt (1,972 re-keyed / 111 unchanged / 0 unresolved; lane 158 all-kin groups; R4 folds 610).
session: 40
tags: [scope, ccr, c-id, m-id, merge, phase-a, phase-b, promotions, alias-map, spanish, rules-based-merging, knowledge-base]
related:
  - docs/kb-notes/adr-official-ids-as-common-course-reference.md (the governing ADR — officials ARE the reference)
  - docs/kb-notes/methodology-within-credential-identity-consolidation.md (the ordinal rule the fold keys honor)
  - docs/ccr_cluster_cleanup_lessons.md (Sessions 37–39 — the cleanup workstream this continues)
  - docs/coursecontrolnumber_remint.md (the playbook that gains a new checklist item)
artifacts:
  - kb/_analyze_official_fold_evidence.py (read-only; reproduces every number in this doc)
---

# Rules-based official-ID folds — scope

> **The ask (Sam, 2026-06-10, Session 40).** *"SPAN 200 C-IDs should include
> all the variations of Intermediate Spanish and Spanish II. I thought this was
> baked into our rules by having the algo check the title and description for
> alignment, but obviously not quite… if we can get to rules-based merging
> first, the same logic would apply to other courses."*

**TL;DR — Sam's instinct is right, and the rule already exists.** The
automatic official-ID fold (Phase A/B in `export_unified_courses()`) keys on
member-level COCI `CIDNumber` evidence — stronger than any title/description
heuristic. But its evidence index (`kb/promotions.json`) still speaks the
2026-05-22 minted ids, and **four subsequent re-keys never re-keyed it**, so
the rule has been silently severed for every re-keyed family — including 100%
of the Spanish set. Resolving the keys through the existing Rule-7 alias
receipts restores **1,386 evidence-bearing rows (vs 174 working today)**, of
which **722 auto-fold cleanly** under the proposed thresholds. No new
similarity algorithm needed for this tier; the colleges already told us the
answer in COCI.

## 1. The presenting case (the screenshot)

`SPAN 200` (C-ID, "Intermediate Spanish I") sits at **1 member** while these
stand as separate CCR rows:

| Row | Title | Colleges | What it should be |
|---|---|---|---|
| FLSP M1342 | Intermediate Spanish I | 23 | SPAN 200 |
| FLSP M1379 | Intermediate Spanish (bare) | 24 | **mixed** — see §4 |
| FLSP M1352 | Intermediate Spanish II | 21 | SPAN 210 |
| FLSP M1036 | Intermediate Spanish 2 | 2 | SPAN 210 |
| FLSP M1043 | Spanish 3 | 6 | SPAN 200 |
| FLSP M1045 | Spanish 4 | 5 | SPAN 210 |

Two of these (M1342→200, M1352/M1036→210) are **already queued** in the ✨
worklist as anchor-led groups awaiting a Confirm click — the title-exact rule
caught them. The rest are invisible to every rule in production today.

## 2. The merge rules that exist today (inventory)

1. **Re-mint control-number split** (2026-05-22, authoritative). Members whose
   COCI row carries a `CIDNumber`/`CommonCourseNumber` were split out of their
   M-ID to the official id. The surviving M-ID remnants carry **zero** member
   official ids (verified: 0 of 63,754 membership records).
2. **Phase A badge + Phase B auto-consolidation** — *the only automatic merge
   rule*. Reads `kb/promotions.json` `official_targets` (the split receipts):
   unanimous single C-ID/CCN → `match` badge → Phase B folds the row under the
   anchor (or synthesizes the official row). `cid_conflict` rows excluded.
3. **✨ Worklist anchored groups** (curator-confirmed). Groups by the
   level-safe `_sug_sig` — exact normalized title only. By design, bare
   "Intermediate Spanish" ≠ "Intermediate Spanish I" here, and "Spanish 3"
   never matches "Intermediate Spanish I".
4. **Co-articulation family pass** (`_fam_key`, bare==I) — M-ID↔M-ID only,
   gated on a shared credential; **officials are not targets in this pass**.
5. **One-shot strict scripts** (twin-merge, convergences) — M-ID↔M-ID,
   strictest keys, receipts.

**No rule reads course descriptions.** The description tie-breaker is a parked
Phase-C idea (CLAUDE.md backlog). For level discrimination it would be weak
anyway: all six SPAN descriptors share the same boilerplate ("listening,
speaking, reading and writing…"); SPAN 200 vs 210 differ by a few words.

## 3. Root cause — the severed evidence index

`_row_official()` (excel_to_dashboard.py ~6566) looks promotions keys up by
**exact current row id**. The manifest was written 2026-05-22; since then the
ids moved four times without the manifest moving:

```
SPAN M1069  ──(canonical-SUBJ4 fold)──>  FLNG M1342  ──(FL split #328)──>  FLSP M1342
            kb/subj4_apply/alias_map     kb/fl_subj4_out/2026-06-09       (current id)
```

Plus the over-merge splits (2026-05-29), KIN/PE + Drama/Theater convergences,
and the twin-merge (2026-06-10) — every receipt exists, none were folded back
into `promotions.json`, and the lookup does no alias resolution.

**Measured** (`kb/_analyze_official_fold_evidence.py`):

| | keys |
|---|---|
| promotions records | 2,083 |
| still live as-is | 941 |
| **re-keyed → severed from Phase A/B today** | **1,111 (53%)** |
| dead ends (need investigation in the build) | 31 |

Today's live CCR payload carries only **174 `match` badges**. After
resolution, **1,386 minted rows** hold official-id evidence:

| Tier (proposed thresholds) | Rows | Member courses |
|---|---|---|
| **AUTO-FOLD** — top target ≥80% of witnesses, ≥2 witnesses | **722** | 5,067 |
| QUEUE — single witness | 530 | 2,570 |
| QUEUE — 50–80% plurality | 128 | 943 |
| REVIEW/SPLIT — <50% top share | 6 | 58 |
| *(plus stand-alone singletons with evidence)* | *653* | — |

The twin-merge makes the evidence *stronger*, not weaker: e.g. the witnesses
of twin-folded `FLSP M1365` ride into winner `FLSP M1043` "Spanish 3", giving
it 6 unanimous SPAN 200 witnesses.

## 4. What the restored evidence says about Spanish

| Current id | Title | Evidence (witnesses) | Outcome |
|---|---|---|---|
| FLSP M1342 | Intermediate Spanish I | SPAN 200 ×30 | **auto → SPAN 200** |
| FLSP M1043 | Spanish 3 | SPAN 200 ×6 | **auto → SPAN 200** |
| FLSP M1362 | Intermediate Spanish III | SPAN 200 ×2 | auto → SPAN 200 (watch-list example: evidence-true, lexically surprising — quarter-system mappings) |
| FLSP M1352 | Intermediate Spanish II | SPAN 210 ×24, SPAN 200 ×1 | **auto → SPAN 210** (96% — needs the R2 plurality rule; strict unanimity calls this a "conflict") |
| FLSP M1045 | Spanish 4 | SPAN 210 ×6 | **auto → SPAN 210** |
| FLSP M1036 | Intermediate Spanish 2 | SPAN 210 ×3 | **auto → SPAN 210** |
| FLSP M1337 | High-Intermediate Spanish | SPAN 210 ×2 | auto → SPAN 210 |
| FLSP M1246 / M1237 | Third / Fourth Course in Spanish | SPAN 200 ×1 / SPAN 210 ×1 | queue (single witness) |
| FLSP M11HH / M11HY / M11IW / M10HF | Intermediate "Level I/II", "IV", "Advanced Intermediate" | 1–3 witnesses each | singleton queue (R4) |
| **FLSP M1379** | **Intermediate Spanish (bare)** | **SPAN 200 ×8, SPAN 210 ×6** | **held for review — genuinely mixed.** Colleges using the bare title split ~50/50 between third- and fourth-semester courses. This row is a title-level over-merge; folding it anywhere would be wrong. The level-safe conservatism was *right* about this one. |

So "all the variations of Intermediate Spanish and Spanish II" land under SPAN
200/210 — **except the bare-titled row, which the evidence proves is two
courses wearing one title.** That's the strongest argument for evidence-first
over title/description similarity: no lexical rule could (a) put "Spanish 3"
under SPAN 200 safely, or (b) detect that "Intermediate Spanish" must NOT fold.

Notes: "Spanish 1/2", Elementary, and Heritage rows are already hand-merged
(Sam, #341/#342) — the rule reproduces those (§6). C-ID minimum units are
*minimums* (units variance like M1036's 4.0 vs the anchor's 5.0 is advisory,
not blocking, when control-number evidence exists).

## 5. Recommendations

- **R1 — Re-key `kb/promotions.json` through the applied alias chain.**
  One-time apply script (dry-run → receipt → idempotent apply, the standard
  V-gate shape), folding evidence across merged keys (twin losers → winners).
  Investigate the 31 dead ends. **Playbook change:** "re-key
  `kb/promotions.json`" becomes a mandatory checklist item in the Rule-7
  re-mint playbook (it's the 5th artifact class that must move in every
  re-key, alongside memberships, articulations, curation, and Supabase).
- **R2 — Plurality threshold replaces strict unanimity.** `match.cid` when the
  top target has ≥80% of witnesses AND ≥2 witnesses; keep the full
  distribution on the row (e.g. `match.evidence`) so the CCR badge/tooltip can
  show "30× SPAN 200" and dissent counts. Without R2, restoring the keys would
  *newly* mark FLSP M1352 (24:1) a conflict.
- **R3 — Evidence lane instead of silent exclusion.** Today `cid_conflict`
  rows are dropped from the worklist entirely (excel_to_dashboard.py ~6823,
  ~6913). After R1 that exclusion would *hide* currently-queued groups (M1352's
  SPAN 210 group would vanish — a regression). Replace blanket exclusion with
  surfacing: queue/review rows appear in the worklist (or Triage) WITH their
  evidence distribution, so a curator confirms single-witness folds in bulk
  and sees mixed rows as split candidates. **R1+R2+R3 ship as one PR.**
- **R4 — Singleton extension (second PR).** 653 stand-alones carry evidence;
  fold/queue them under their official ids the same way (they're invisible to
  every rule today).
- **R5 — NOT recommended now: description-similarity matching.** Boilerplate
  dominates the descriptors; the discriminating signal (level) is exactly what
  similarity gets wrong; and the evidence tier already resolves the cases that
  matter. Revisit only for the no-evidence residue after R1–R4 shrink it.

**Governance (unchanged from today's Phase B + the ADR):** folds are
display-level consolidation recomputed each regen — no KB mutation, no
curation writes on official records, fully reversible; folded rows stay
**Generated until a curator Verifies** (merge ≠ verify); `over_merged`-flagged
rows stay excluded; badges carry witness counts for auditability. Sam can keep
clicking the queued SPAN confirms now — manual `merge_into` and the rule write
the same pointers; nothing conflicts.

## 6. Validation against the curator's existing merges

Of Sam's 62 hand-confirmed `merge_into` pointers, 15 have promotions evidence:

- **11 reproduced exactly at tier 1** (Spanish 1/2 → SPAN 100/110, Elementary,
  Heritage, etc. — the rule would have made these merges automatically).
- **3 same target, held below auto thresholds** (M1245 single witness; M1349 at
  65%, M1359 at 70% — both "FOR SPANISH SPEAKERS" heritage rows where Sam used
  title semantics the rule can't). The human out-curated the rule; the rule
  never contradicted the human.
- **1 surfaced-for-review, not contradicted**: ARTS M1160 "Modern Art History"
  → curator target ARTS M1159 (the Session-39 cluster merge); evidence holds a
  single ARTH 150 witness → tier-2 queue only. Per the ADR (officials first),
  that queue entry is a *feature*: it asks whether the whole ARTS M1159
  cluster belongs under C-ID ARTH 150.
- 47 curator merges had no evidence — title-only confirms; the worklist keeps
  owning that class.

## 7. Decisions for Sam (gates the build)

> **ANSWERED (Sam, 2026-06-11):** 1 = yes, one PR; 2 = auto-fold; 3 = thresholds
> OK (built with the single-witness-unanimous grandfather noted in the status
> header); 4 = follow-up PR; 5 = retire into the C-IDs (separate small PR).
> Built results (first regen): Phase B 1,155 M-IDs → 235 official rows + 45
> anchor folds (CCR 16,080 → 15,492 rows); SPAN 200 = anchor + M1342/M1043/
> M1362/M1246; SPAN 210 = anchor + M1352/M1045/M1237/M1337/M1036; 151
> evidence-lane groups; FLSP M1379 surfaced contested under SPAN 200.

1. **Build R1+R2+R3 as one PR?** (recommended — they're coupled; dry-run
   receipts posted before the apply lands)
2. **Tier-1 auto-fold, or queue-everything first?** Recommendation: auto-fold.
   It is exactly today's Phase B behavior with its index repaired, it's
   display-level/reversible, and 722 rows ≈ 5,067 member courses is precisely
   the "rules-based merging" outcome you asked for. (Queue-only would put 722
   more Confirm clicks on you.)
3. **Thresholds 80% / ≥2 witnesses OK?** (Your own merge history suggests you
   accept ~65–70% pluralities; the auto tier is deliberately stricter.)
4. **R4 singletons in the same pass or after?**
5. **Follow-up flag:** locked anchors `M-ID SPAN 104/106/108` ("Spanish
   1/2/3", from firewalled `common_courses.json`) now duplicate SPAN
   100/110/200 — per the ADR they should eventually retire into the C-IDs.
   Firewalled → your call, separate small PR.

## 8. Build plan (post sign-off)

1. `kb/_rekey_promotions.py` — dry-run (receipt: per-key old→new + evidence
   fold log + dead-end report) → `--apply` with V-gates (count conservation,
   no target drift, idempotency) → receipt under `kb/promotions_rekey_out/<date>/`.
2. Generator: R2 plurality + `match.evidence`; R3 worklist lanes; badge/tooltip
   witness counts (consumer `unified_courses.js` + a jsdom test per house rule).
3. Re-run `kb/_row_audit.py`; regen to `/tmp` (UC_OUT_DIR) and diff SPAN
   200/210 rosters against §4 before shipping.
4. Playbook edits: re-mint checklist + fan-in methodology gain the
   "re-key promotions.json" guard.
