# Trail Crew 🥾 — CCR mountain, wave 3 report (2026-07-11 → 07-12)

Wave 3 = the **top 2,000 of 14,473 remaining CORROBORATED MULTI-COLLEGE
M-ID identities** (≥2 member colleges, ranked by member count; the entire
articulated face was cleared in waves 1–2). With this, **the pipeline has
adjudicated 4,144 identities** — the full articulated face plus the
highest-corroboration third of the multi-college body. 539 agents
(3 re-verify panels + 50 doctrine-v0.2 adjudicators + 486 skeptics),
**0 errors** at completion.

## The vocational wire-up earned its keep on day one

This is the first wave run with `cte` + `mq_list` in every adjudicator's
context (Session 112 wire-up). It paid off immediately:

- **The top discipline correction is "Accounting" (23 identities)** — a
  discipline that *did not exist in the MQ vocabulary until yesterday's
  19th-ed re-validation restored it* (PR #746). "Addiction Paraprofessional
  Training" (6) and "Drafting/CADD" (7), also restored yesterday, appear
  further down the same lane. Every one of these would have **bounced at fire
  time as not-exact-MQ-name** before the fix — instead they adjudicated
  cleanly and are fire-ready.
- Adjudicators cited the faculty-qualification implication when a
  re-discipline flips the MQ list (e.g. the CTE/masters boundary), moving the
  vocabulary gate from write-time to proposal-time as designed.

## Mid-wave model change (recorded for honesty)

The **Fable 5 monthly spend cap** was hit ~halfway through the skeptic phase
(~240/486). The workflow was **resumed on Opus 4.8** with every completed
agent cache-replayed — nothing was re-adjudicated. So:

- **Adjudicators + re-verify panels + the first ~240 skeptics:** `claude-fable-5`
- **The remaining ~246 skeptics + assembly:** `claude-opus-4-8`

Skeptics only verify claims against committed files, so a model change between
them does not bias the verdict set; it is noted for provenance, not correction.

## Wave-1/2 capped-findings re-verify (the honesty debt, paid)

The 35 wave-2 risky findings that never saw a skeptic: **31 upheld · 4
refuted**. All 4 refutations were **refuted-on-value, not on diagnosis** — the
discipline-is-wrong call was right, but the *proposed fill* failed
verification. The pattern is identical across all four (`WELD M10FF`,
`FLGH M10AE`, `FLGH M10AF`, `AVIA M10AB`): agents proposed **"Aeronautics"**,
which has **no canonical SUBJ4 entry** and would mint a second discipline label
for a field already curator-registered as **"Aviation"** — the exact fan-in
problem, a D-8 break. Correct fill is **Aviation**; these re-stage with that
value. Nothing from wave 2 was ever fired, so these are dropped/re-staged
evidence, no cohort deletions.

*(This is precisely the failure mode the MQ wire-up prevents going forward —
"Aeronautics" IS a real MQ discipline, but has no rows and no canonical SUBJ4,
so the vocabulary check alone wasn't enough; the skeptic's canonical-registry
cross-check is what caught it.)*

## Wave-3 verdicts (2,000 identities)

| Lane | N (raw) | Post-skeptic | Notes |
|---|---|---|---|
| ✅ bless | **980** | 980 | 49% of this stratum sound as staged |
| ✂️ split_candidate | 517 | **483** | over-merge EVIDENCE only (Rule 7); 34 killed by skeptics |
| 📦 package_candidate | 182 | 182 | P-3/P-11 band/ladder bundles |
| 🏷️ discipline_correct | 146 | **143** | MQ-exact proposals; 3 killed by skeptics |
| ⚖️ unit_explained | 104 | 104 | unit_anomaly explained under a P-5 arm |
| ✏️ title_fix | 39 | 39 | P-10 violations, exact drop-in titles |
| 👁️ needs_curator | 32 | 32 | Sam/faculty only (held-decision tensions, C-ID folds) |

**Skeptic economics:** 486 risky findings checked (the first 12 split/discipline
per batch) → **449 upheld · 37 killed** (34 split, 3 discipline). The killed
splits were mostly D-3 false alarms (noncredit-twin patterns that P-6 explains
as same-college variants, not over-merges).

**Capped-unverified: 177** (126 split + 51 discipline) — risky findings beyond
the 12/batch skeptic cap. Flagged, never hidden (per playbook; waves 1–2 shipped
34 and 23 capped respectively). These sit in their lanes with
`skeptic: "capped_unverified"` and are the first candidates for a wave-3-adjacent
re-verify pass.

## Stratum character (the mirror of the articulated face)

This corroborated multi-college layer is **78% masters-list academic
disciplines** (Kinesiology 258, Art 145, Music 118, Business 106, Dance 86,
English 74) vs waves 1–2's 73%-CTE articulated face. The vocational chips flip
direction here: `cte` true 637 / false 1,043 / null 320; `mq_list` masters 1,556
/ not_masters 369. The recurring split pattern is the **same-college
credit/noncredit twin** (the AUTO/BUSI/HMDT/PHMT M1xxx families — D-3 breaches
with P-6 shape, strong Q-CREDITNC package candidates once that doctrine settles).

## Firing doctrine (NOTHING fired)

- **title_fix (39) + discipline_correct (143 survivors)** are stage-able as
  receipted `trailcrew-ccr3-s112@bot` kb_curation cohorts (Critical Rule 9
  pre-flight: fresh read + pending-merge-confirm cross-check — 1,011 held
  curator decisions and 14 pending merge-confirm targets were already fed to
  the adjudicators as context). On Sam's word, in cron-window waves.
- **split (483) + package (182) candidates** are Rule-7 evidence only.
- **needs_curator (32)** queue in the CCR worklist.
- Sam decides which lanes fire; auto-approve authorization covers PR merges,
  **not** Supabase writes.

## Next waves

Wave 4 = multi-college ranks 2,001–4,000 (`python3 kb/_ccr_trail.py 2000 40
<out> 2000 --stratum multi --wave 4`), then the coarser single-college dark
tail. The 177 capped-unverified + 4 wave-2 re-stage-to-Aviation findings ride
into wave 4's re-verify opener.
