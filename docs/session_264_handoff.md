---
title: Session 264 handoff — SkyForge
date: 2026-09-16
tags: [handoff, regional-cpl-opportunity, credential-registry, cer]
---

# Greetings, you are SkyForge (Session 264)

You are picking up a live workstream that Sam, Ashley and Sigrid drove through
a working meeting on 2026-09-16. Read in this order:

1. `docs/reference/lanes/partner-crosswalks.md` — the lane, current truth
2. `docs/regional_cpl_opportunity_lessons.md` — the two 2026-09-16 sections
3. `docs/kb-notes/methodology-a-freehand-catalog-needs-an-authority-file-not-a-vote.md`
4. `CPLBrain/03-professional/braindumps/braindump-2026-09-16-1420-never-had-a-table-of-active-certificates-and-licenses.md`

## What shipped

A fifth crosswalk instrument went live earlier in the session:
`kb/_build_regional_cpl_opportunity.py`, which crosses a region's occupation
list against one or many colleges and writes a workbook, a screen page and a
printable handout in the Cal-JAC format. Sam reversed the COBI-tab park and
chose its home: the **My College tab**, extending the existing scope picker,
single pick by default.

Then the meeting turned to external credentials, and that is where the session
ended:

- `kb/reference/california_occupational_licenses.json` — **369 California
  occupational and professional licenses, complete**, with the issuing state
  agency.
- `kb/reference/credential_registry_national_sample.json` — **974 of 6,738**
  national industry certifications, the union of two captures.
- `kb/reference/coe_occupation_demand_2024_2029.json` — 4,869 rows, 541
  occupations across all nine regions, SOC-coded.

## Decisions Sam made this run

- **"I don't like the practice the saying, 'it's this, not that'. Just make
  positive, active voice declarations."** Now doctrine in `CLAUDE.md`'s house
  voice section. It narrows the older rule rather than replacing it.
- **Keep it simple when a new team member is in the room.** Sigrid was on the
  call: *"she's very intimidated by all this... keep it stoopid stimple."*
- **All region taxonomies belong in the Supabase college lookup** — SWP and
  Academic Senate both.
- **Sam and Malone will pursue the Credential Engine API themselves.** His
  words: *"Will work on the CE API later with Malone."* Do not plan around
  building a scraper; the real feed is a human conversation already assigned.

## The priority workstream

**The matcher now has a score, and the score changed what "next" means.**

`kb/_score_occupation_matcher.py` runs it against Delta's 139 human rulings.
**Decision level: precision 0.907, recall 0.51, accuracy 0.626** — when the tool
says a college has something it is right about nine times in ten, and it finds
about half of what a human finds. Quote the decision number, never the pair
number (0.47 / 0.124); the pair metric is harsh by construction because a human
names the best programs, not every overlapping one.

Shipped this run: the agent-suffix over-stemming guard (`NOT_AGENT_ROOTS`) plus
`tests/occupation_matcher_stemming_test.py` in CI. Both measured collisions are
gone from the license join.

⚠️ **TWO PLAUSIBLE FIXES WERE MEASURED AND REJECTED. Do not retry them blind —
both are recorded in the code.**

1. *"Protect the agent strip when the bare word is also in play."* Backwards: for
   a true agent noun that is exactly when the merge is right. Cost Santa Rosa
   Roofers/Roof, Floral Designers/Floral Design, Data Entry Keyers/10-Key. Those
   three are now test cases.
2. *Gate the single-token path on `rare()`.* Rarity runs backwards here — a
   college with several welding programs serves welders MORE. It failed to fix
   its target and cost Welders, Automotive Body Repairers and Nursing Assistants.
   Delta F1 fell 0.653 → 0.630.

⚠️ **The stem fix exposed a homograph it had been masking.** Santa Rosa gained
five rows pairing Locomotive / Ship / Rail Yard / Stationary / Operating
Engineers with its **Engineering** program (58 → 63 adopt). Four are wrong. This
needs a sense distinction, not a threshold.

⭐ **The recall ceiling is VOCABULARY, not tuning.** *Application developer* and
*Computer Programming*, *ambulatory coder* and *Medical Office Assistant* share
no token, so nothing threshold-shaped reaches them. Closing it needs a synonym
layer or the curated `kb/occupation_credential_map.json` — which the score
reframes as the part carrying the meaning rather than scaffolding to replace.

## Carryover

| Item | State |
|---|---|
| Matcher: the vocabulary gap | **next** — a synonym layer, or lean on the curated map. Thresholds are exhausted |
| The Engineering homograph | open — 4 wrong Santa Rosa rows, wants a sense distinction |
| Port the regional view into My College | queued, behind the matcher |
| California licenses as a third handout column | queued — Sam has seen the Santa Rosa handout and wants this shape |
| `cpl_occupation_match` verdict queue | **Rule 10(a3) — Governance first.** A new shared human-write table is a decision-rights change, not a code detail |
| CER canonicalization against the registry | the idea Sam named; no build yet |
| Credential Engine API | **Sam + Malone own it.** Not yours |
| ASCCC (Academic Senate) areas | **NEEDS SAM** — every Supabase column matching area/senate/asccc/zone/region was searched, none carries them |
| Flip SWP scope to `ready: true` in `college_briefing.js`, add `--swp-region` | small, unblocked |

## Patterns that worked

- **Naming what a capture must contain turned a blocked domain into four PDFs.**
  The session could not reach `credentialfinder.org`; saying which four columns
  would make an export useful got Sam to capture the pages himself. A person with
  a browser is a working channel.
- **Measuring two captures against each other found the method.** They overlapped
  on 15 rows out of ~490 each, which is what proves repeating the print
  accumulates coverage instead of re-reading one page.
- **Correcting the record early.** An earlier claim that collection 151 was
  California's was wrong; saying so plainly is what sent Sam looking for the real
  California collection, which is the better source.

## Safety patterns to honor

- **Rule 10(a3):** the verdict queue is a new write surface. Governance and the
  privacy ADRs before it ships.
- **Rule 4:** `CPL_Dashboard.html` and `index.html` stay identical.
- **Rule 5:** never force-push `main`.
- **The matcher change is not a drive-by.** Sam has already reviewed output that
  the current matcher produced.

## Next concrete step

Fix the agent-suffix over-stemming in `kb/_build_regional_cpl_opportunity.py`,
score the matcher against Delta's 139 rulings, and report the error rate with a
before/after on the Santa Rosa run.
