---
title: "Session 412 handoff: Sheet 93 and the CER on procedures; SmartCatalog and Merced reads; 182e810e207d"
date: 2026-10-18
session: 411 (SkySotol)
tags: [handoff, program-requirements, catalog-sweep, coursedog, smartcatalog, cer, exhibit-canonicalization, ui-pass]
status: current
superseded: true
superseded_by: session_421_handoff.md
---

# You are Session 412

Your moniker is **SkyJoshua**. Session 411 (**SkySotol**, `session_01XGF133HPzzu2EigvXkRmXZ`, from 02:08Z on
2026-10-18) checkpointed with runway left. If the routine started you, follow `docs/reference/scheduled_sessions.md`
first.

## Sam's words this run

- ~02:55Z, unasked (vault braindump `braindump-2026-10-18-0300-cer-procedures-automate-curation`; `cpl_memory`
  `sam-cer-procedures-automate-curation-2026-10-18`): *"When you're ready for the new UI audit can you take another hard
  pass at CER tab to make it as simple and intuitive as possible. I want to be able to add more procedures to have you
  classify and complete common exhibit titles and elements as we go. I don't have enough time to curate the growing list
  and want to further automate so curation is manageable."*
- Rulings in force: no approval per item (2026-10-17); extraction with no card up to $40 a college (2026-10-14).

## What shipped (S411)

- **`d6cc1fde7ea3` applied** (15,647 written; run 39084444048).
- **#2216** (merge it if still open, on a green `test`; then dispatch `program-requirements-college.yml` from `main`
  with `step=display` to apply **`182e810e207d`, 15,651 programs at 111 colleges**; 15,651 written is the good result):
  - **Hartnell by its Coursedog code headings** (`pdf_code_assign()`): 8 loaded, 14 moved to their own heading
    (reread), 4 wrong-page rows removed under a receipt (migrate run 39090450880). Hartnell holds 72.
  - **`filed_from()`**: a kept record must come from its source's page (a reconcile's fresh sources had kept 127 stale).
  - **SmartCatalog by the generic road** (`child_base()`), **vendor-host page reads** (`network_hosts`), plans for
    Merced, Crafton Hills and Taft under `kb/college_reads/`.
  - The CER v3 mock-up's source and the S411 docs.
- **CER:** lane `docs/reference/lanes/cer-procedures.md` (new, §11 row), mock-up
  https://claude.ai/artifact/Gu6HTwqSwMYLSy4C4xRag3, **Open Asks Sheet 93** https://claude.ai/artifact/MZXYEqiNitiWGiTakDHUwW
  (current; three cards, store empty at publish).
- Eight `cpl_memory` rows (`author = 'SkySotolS411'`).

## In flight at sign-off (check each first)

1. **#2216** and the display apply, above.
2. **Crafton Hills' capture-only read is filed** (run 39091435061, `kb/program_requirements_college/crafton_hills/capture_preview.json`): the SmartCatalog walk read 229 pages (no sitemap) and found **64 of 79** listed programs (13 not found, 2 page_claimed); `would_extract` names 64, about $5. Dispatch its extraction read (`step=read`, `extract=1`), then load, then Taft's capture-only read.
3. **CPLBrain #378** (the braindump, Sheet 93, the session note): merge it.

## Priority after that

1. **Read Sheet 93's `replies`** (`ArtifactData` `list` on `replies` and `replies/done`), carry each verdict into
   `cer-procedures.md` and remove its card in the same change.
2. **The CER build, as the UI pass on `cobi:credential-reference`** (Sam put it ahead of the queue's own order, which
   names the Pipeline tab). Order: the fold applies clean assignments and holds only conflicts (if card 1 says so; a test
   that one conflict holds only itself), then the procedures store (`kb/cer_procedures.json`, seeded from the skill's
   rules and Sam's rulings, each with its words and date), the nightly classifier run under a bot cohort with a receipt
   (`cer-decision-apply.yml`'s shape), then the tab's three views. The research map is in the lane file.
3. **SmartCatalog:** Crafton Hills' extraction and load (above), then Taft (one at a time: one vendor host), then one
   display build for the wave. Crafton's 13 not found: read their near misses first.
4. **Merced:** a Coursedog walk, the program search (191 programs, `merced_colleague_ethos`, catalogId
   `QTM2GIg9kimBOfyC8Dbb`), then each program's Requisites tab (`/programs/<code>/requisites-<slug>`).
5. **Cañada's 11** (capture-only read first; its copy is not reachable from a session).

## Patterns that worked

- **Measure a reader change on the real file first.** The vendor's S3 bucket answered the session, so Hartnell's 427
  pages were scored locally before any runner time; the runner's capture then matched to the program.
- **A capture-only read tests a reader change for free and replaces nothing.**
- **A research agent maps a large surface and returns a page.** The CER map (5,869-line tab, its pipeline, prior
  rulings) cost this session one report.

## Lessons to honor

- **`bash scripts/check_generated.sh` before every push** that touches `kb/*.py`: a 12-line addition moved the
  dependency map's line anchors and failed `lints`.
- **The Supabase guard holds a `delete` sent by `execute_sql`**; a receipted delete goes through `supabase-migrate.yml`.

## Not refreshed this checkpoint

- `kb/README.md`, `README.md`, the Pipeline tab: nothing they cover moved. No KB note crossed the bar.
- The UI pass ledger: the CER pass is designed, not shipped, so the view stays due.

## Subscriptions and check-ins

#2216 and CPLBrain #378 are watched until they merge; drop them then. No check-in is pending.
