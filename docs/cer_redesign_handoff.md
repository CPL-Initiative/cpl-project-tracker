---
title: "CER redesign handoff: the credential panel built; Sam's first saves and EACR next"
date: 2026-10-31
session: CER redesign build, side session after S531 (SkyBunchberry)
tags: [handoff, cer, eacr, catalog-commons, exhibits]
status: current
---

# You are SkyBayberry, the Exhibits tab's next build

SkyBunchberry ran the CER redesign queue on 2026-10-31 from about 02:09Z, alone (no other session live, no open PR at
start). This is a **full checkpoint** for the CER lane; this file carries it, and `docs/session_532_handoff.md` item 5
points here.

## What shipped

- **#2603 (Exhibits tab, Credentials and the credential panel):** *Credentials* beside *Review*. Every credential from
  `credential_reference_data.js` (loaded on the first visit to the view) with the live `_CREDENTIAL_REVIEW::` rows
  applied, most students first, a search, the Credentials, Issuers and Training sites tiles. A credential's panel asks
  the three questions. The issuer and the training sites are editable, each site with the college it trains for or
  *Any college*. Save writes `issuing_agency_override`, `training_sites_override` (JSON `{site, college}`) and
  `training_agency_override` (the sites joined). `resolve_sites` / `resolveSites` decide which stands. Mode A3 fills an
  empty trainer with the first site; the bake emits `trainers`; the Review card's training site links the panel.
  Code-only: the daily run regenerates `credential_reference_data.js`, so `trainers` appears after the next daily run.
- **The first published `kb/exhibits_review.json`** (daily run 41158291292, 02:12Z): 468 held (401 Proposed, 36 Wording
  check, 13 Two issuers, 18 Conflict), 209 aligned, 0 settled since the 2026-10-30 14:35Z procedures run. Sam had saved
  nothing from the card by 02:30Z.
- **Governance:** `field:kb_curation.training_sites_override` mapped to DR-07.
- **KB note:** `methodology-widen-a-field-by-saving-its-old-reading-beside-it`. **cpl_memory:**
  `exhibits-credential-panel-built-2026-10-31` and `widen-a-field-by-saving-its-old-reading-2026-10-31`, each logged.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The redesign*, the credential panel paragraph, NEXT),
`docs/cer_v2_redesign_lessons.md` (2026-10-31, SkyBunchberry), the mock-up
`docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html` (version 26).

## Open work, in order

1. **Read the 07:47Z procedures run and the first `high-school-rop` save** (expected 55, cohort
   `cer-procedure-high-school-rop@bot`, its receipt in `kb/cer_procedures_out/saved/`); the queue should fall to about
   413 at the next build. Then read Sam's first saves: `kb_curation` rows under `_UNCLASSIFIED::` and
   `_CREDENTIAL_REVIEW::` with his email after 2026-10-31 02:00Z, a `training_sites_override` row above all, and check
   that the next daily run's overlay (`kb/credential_review_overlay.json`) carries `training_sites` for it.
2. **Training sites for a held title new to the reference**, only if Sam asks before the fold adds it: a field the fold
   reads on `_UNCLASSIFIED::`, mapped in `kb/governance_surface_map.json` before it is built (Rule 10 a3). The *Held
   titles by group* table (version 26) if he asks.
3. **EACR folds in** (Sheet 147 card 1: the two tabs stay until Exhibits carries what they show), then the public
   adoption page (settled credentials only, Malone's CPL/AI look, its name Sam's).
4. Carried: the college short-name editor (college-district-identity lane NEXT); the CPL-AI snapshot refreshed by hand
   (`python3 kb/_build_cpl_ai.py --fetch`) until Sam picks a schedule.

Nothing waits on Sam in this lane; Sheet 147 is answered whole.

## Lessons to honor

- Widen a field by saving its old reading beside it, and resolve the two by content before time: the panel's trainer
  row lands milliseconds after its list.
- `npm run a11y` measures width as well as height: a panel beside a table squeezed an input to 14px at 1024.
- `git add`, then `bash scripts/check_generated.sh`, before every push (this run: the dependency map).

## This checkpoint

Full for the CER lane: the lint, the lane file, the lessons doc, a KB note, the docs index, this handoff with handoff
532's pointer, the memory rows, the vault note and the Exhibit run log. Both READMEs and the pipeline reference name the panel.
Skipped as untouched: `CLAUDE.md` (no lane state row moved), the pipeline view, and `kb/status/program-requirements.json` (the main queue's).

## Let go

At sign-off this session drops its watch on #2603. No check-ins are scheduled and no artifact is watched.
