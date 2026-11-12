---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-12
tags: [reference, roadmap-lane, commons, program-requirements, cer, ccr, cr-reference, csr]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[program-requirements-harvest]]"
  - "[[cer-procedures]]"
  - "[[skyview-ccr-interface]]"
  - "[[common-cr-reference]]"
---

# The Commons

**What this lane is:** the Program Requirements way of working (procedures that handle the gaps, a Progress dash, a
feedback loop) carried to every common reference, with one look across their dashes and a Commons dash above them.
Sam, 2026-10-18 ~14:28Z, in chat (vault braindump `braindump-2026-10-18-1430-commons-dash-one-tracking-system`;
`cpl_memory` `sam-commons-dash-one-tracking-system-2026-10-18`): *"each of our "common" projects should have the same
approach and tracking and feedback system. Would be nice to get used to the screen appearance and as we make changes to
one, keep the other related dashes aligned... It all needs to culminate in a "Commons" dash that brings all the efforts
together and places them in some order of priority and completion and known issues and settled procedures and..."*

## The pattern, named (what Program Requirements carries today)

1. **A universe and a definition of complete**, one headline pair. Program Requirements: COCI's active programs, and
   the ones whose record passes the machine checks (S415; 11,621 of 20,282 on 2026-10-18).
2. **Procedures that do the work**, versioned (per college there), so a misread changes a procedure, never one item by
   hand.
3. **Machine checks on every item**, so known issues are a list that opens, each naming its owner: a procedure, a
   college, or Sam.
4. **Milestones and parts**, each count opening its list (`MILESTONES`, `PARTS`, `WHOLE` in `program_requirements.js`).
5. **A run log** written at every checkpoint: last run, next step, calls waiting on Sam, what changed
   (`kb/status/program-requirements.json`, `scripts/queue_status.py`, checkpoint step 12).

## The common references

| Reference | Tab | Lane | Where it stands |
|---|---|---|---|
| Program Requirements (Catalog ROEP) | `#program-requirements` | [program-requirements-harvest](program-requirements-harvest.md) | carries all five parts |
| Common Exhibit Reference | `#credential-reference` | [cer-procedures](cer-procedures.md) | procedures run nightly; the Progress view since S436 |
| Common Course Reference, SkyView | `#unified-courses`, SkyView | [skyview-ccr-interface](skyview-ccr-interface.md) | built and stable; the auditor's receipt on the Pipeline tab |
| Common CR Reference, with its military half | `#cr-reference` | [common-cr-reference](common-cr-reference.md), [military-ace-cr-reference](military-ace-cr-reference.md) | worklist live; the military half scoped |
| Common Subjects Reference (Sam's addition, Sheet 95) | `#canonical-subj4` | [common-subjects-reference](common-subjects-reference.md) | carries all five parts since S425: the Progress view, a procedure per card, the daily scan, the run log |

## Status

**The first view opens on one batch (Sam's Commons rulings relayed on #2921, 2026-11-08, *"yes to all"*; S604).** *Your next batch* leads the page: Another look's open cards in Exhibits, six at most (`next_batch` in `kb/status/commons.json`, from `kb/exhibits_sweep.json`), with what the answers teach and when to stop; *Start* opens `#exhibits/another-look`, so the cards and their saves stay in Exhibits. Under it one line counts what people did with the procedures' work (placed, checked, moved elsewhere; *the rest are unchecked, not proven*), its word opening the trust table. The pools and the trust table start folded. A reference whose headline pair is all done reads *Complete* (Subjects, 147 of 147); its repair jobs stay in its issues. Kept from the house rules where COBIx's mock departs: controls are underlined words, no arrows, live data only.

**The batch is capped (#2923, S604, COBIx's finding).** *Start* opens `#exhibits/another-look/batch`: the first six open cards, fixed for the visit, no bulk acceptance, a trail back to the Commons, and a stop screen after the last. Exhibits reconciles the nightly sweep with `kb_curation` saves written since it was built. **Exhibits queue-first (S611, #2933).** A Queue view leads the Exhibits views at `#exhibits/queue/<lens>`: six lenses in the ruled order, each a set of entry points into a list the tab already holds, counted from the set that list opens. A failed read or the classifier's errors show as Blocked on Sky. Review stays the default view; Park is named visit-only. **The panel's trail (S611, #2934):** the shared List's side panel opens on `CPL Commons / <List> / <filter> / <row>` (spec `trail` in `commons_list.js`), set on Exhibits, the CR Reference, Program Requirements and Subjects; the List's word, or the filter's when one is on, is the underlined return and keeps the filter and the row's place. **NEXT (#2921):** the CCR (below); Subjects' 93 stray codes stay with the curator. Sam's path still waits on his reaction to the mock.

**LIVE: the Docket, steps 1 to 3 (#2963, #2966, #2968, #2969, 2026-11-09).** Batches close in place and offer the next; a case in `kb/docket/cases.json` is ruled in place; `kb/_docket_process.py` carries rulings out nightly or from *Process my rulings now*. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**RULED (Sam, Open Asks Sheet 158 cards 2 and 3, 15:01Z 2026-11-02, his own call: "malone", "rename").** The CPL
Commons first view ports into this tab in **Malone's CPL/AI look**, the first COBI tab to carry it (First Light stays the
rule for the other tabs; this is the one departure inside COBI, beside the public pages' departure of 2026-10-24). The
side menu reads **CPL Commons** (`cobi_nav` row `commons`, one guarded UPDATE, receipt
`kb/receipts/cobi_nav_commons_label_cpl_commons_2026-11-02_s552.sql`, the rollback in its header).

**LIVE: the CPL Commons first view (S552, #2697).** `commons.js` draws the locked mock as the tab's first view. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**The opened page, one renderer (S556 to S559).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws the opened page for every reference. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**The Courses List's filter words sit in two groups (S622, #2998, issue #2997; Sam, 2026-11-09: *"put them in order of priority for me to act on ... categorize the ones that need action and the others that are just convenient filters"*).** `commons_list.js` takes an optional `filterGroups: [{ label, ids }]`: each group on its own line, its label first, its words in the group's order; a List that sets none draws as before. The Courses List: **To do** (Discipline in doubt, On a stray identity code, No catalog description, A unit anomaly, Discipline no seed has touched), then **Browse** (the ten census words). The rule holds for every List that gains job filters. Open beside it: #2995, keep the current row in view after a ruling.

**LIVE: a stalled routine becomes a queue item (S624).** `kb/status/commons.json` `queue.stalled`; the record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S639, 2026-11-11)*.

**DECIDED: every credential gets a Common SUBJ (SkyTamarind, S638, 2026-11-11, on Sam's in-session ask: *"add a check into that in our common plan and procedure so we can get those fill as automatically as possible"*).** Exhibits' List reads the subject as the Catalog does (M-ID and C-ID articulations, then a stored `subj_override`); its *No Common SUBJ* filter is where the Exhibit card's routine count opens. `kb/_exhibit_subject_fill.py`, a step in the nightly `cer-procedures.yml` (preview until a dispatch sets `subject_fill=on`), fills a blank from the credited courses (several colleges, then one, majority over half), else the issuer family (`kb/reference/issuer_family_subject.json`; ASE is automotive, Sam's MIL7 ruling), through the Common Subjects Reference; title words, TOP and CIP never decide; a family or cert link that disagrees with the courses holds the title. It writes `subj_override` and `subj_source` under `exhibit-subject-s638@bot`, insert-only, receipt first, `--undo` by cohort; a stored subject always wins. Governance DR-07 (the credential record's subject). The rest go to `kb/exhibit_subject_out/worklist.json` with a title-word suggestion for a later accept-all batch. Guards `tests/exhibit_subject_fill_test.py`, `tests/exhibits_list_subject.test.js`. First live run 21:41Z (run 43104720166): 747 filled, 362 left.

**BUILT: the ASE slice (S641, #3152, merged `ed886d36`; plan #3111 comment 6808952144; Sam's go, Sheet 181 card 10, "Go when built").** `commons_ase.js`, read-only, inside COBI: `#commons/ase` (52 ASE certifications by 120 colleges, 6,240 pairs, 18% with an answer) and `#commons/ase/<title>` (each college: *Lists credit*, *Likely match* or *No answer yet*, with sources). Titles resolve through `CPL_MAP_LINKS.nowTitle`. The page lists its gaps: Request CPL Review (no table holds the state; a new table goes through Rule 10 a3), CPL-AI coverage, the identity-signal list. Guard `tests/commons_ase.test.js`.

**NEXT:** (1) the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER, military. (2) From the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; the confidence count for the Course auditor, which needs a receipt of what the auditor scored before a person changed the card (none is committed today); the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List from a spec the tab hands it. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04).** Why (the inventory): `docs/commons_lessons.md`, *The CCR tab's inventory*. #2776 carried the common course's card and Rename, Set the discipline and Confirm into the List's panel. NEXT: the ways in (SkyView's three `#unified-courses/list` links, Quickstart's routing, Subjects' *Fix on CCR*, `excel_to_dashboard.py`'s script injection) and the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Suggested merges (about 7,300 written daily, none acted on since Sep 27): carry or retire, asked in chat 2026-11-04 (recommended: retire). Handoff: `docs/courses_retirement_handoff.md`.

**The CCR, next (ruling 4).** The auditor's `seed_untouched_discipline` (14,523 cards capped at 0.79). Sam (Sheet 173): use descriptions, TOP alongside. `kb/_ccr_seed_recheck_dryrun.py` (88% held out, clear margin): of 12,504 cards, 1,964 confirmed by description and TOP, 1,823 for a curator; Kinesiology 627 and 8. **Applied (S615, 2026-11-09), on Sam's *confirm* (Open Asks Sheet 174 card 1, 02:25Z):** `kb/_ccr_seed_confirm_apply.py --discipline Kinesiology --expect 627 --apply` stamped the 627 cards `discipline_source` `description_and_top` (confidence 0.8, `_seed_confirm_from` names the ruling and both signals); the discipline never changes. The auditor scores the source inferred-high, so they leave `seed_untouched_discipline` at the next daily audit. Receipt `kb/ccr_seed_confirm_out/2026-11-09/kinesiology.json` (before-values; `--undo` restores the file byte for byte). Guard `tests/ccr_seed_confirm_test.py`. The 8 are the *Discipline in doubt* job. **Applied (S621, 2026-11-09), on Sam's *five* (Open Asks Sheet 175 card 1, 15:14Z; also the Docket's first case, now `done`):** the same apply per discipline, `--ruling` naming the reply: Music 250, Fire Technology 169, Mathematics 128, Child Development/Early Childhood Education 107, English 99 (753 cards). Receipts `kb/ccr_seed_confirm_out/2026-11-09/<slug>.json`, each reverses alone with `--undo`. Their 108 curator cards stay in the *Discipline in doubt* job. **Applied (S634, 2026-11-10), on Sam's *all* (Open Asks Sheet 180 card 1, 19:34Z):** the same apply for every remaining discipline, 26 disciplines and 584 cards as the dry run named them, each with its receipt under `kb/ccr_seed_confirm_out/2026-11-10/<slug>.json`; each reverses alone with `--undo`. **DECIDED (S634, 2026-11-10, under decide-and-record):** Kinesiology's 10 cards that came to qualify after S615's 627 took the same stamp on Sheet 174's ruling (receipt `2026-11-10/kinesiology.json`). The recount after the apply finds no confirmed card left in any discipline; the cards where the two signals disagree stay in the *Discipline in doubt* job.

**The Courses List keeps the row you are ruling on (S623, issue #2995; Sam, 2026-11-09: *"the list view shifts focus to the top row every time you take action in the sidebar and the listview is not obviously highlighted as to which row you're acting on. the save ruling and other buttons are a bit jumbled together."*).** In the list engine (`commons_list.js`, so every List gets it): a redraw asked for by a panel (`api.redraw`, now `redrawKeep`) puts the table's scroll back and brings the current row into sight; the row whose panel is open carries `aria-current` and a bar (`<prefix>cur`), and its band carries one too (`<prefix>bandcur`). In the Discipline in doubt panel (`coci_lookup.js`): the ruling is one box with *Save the ruling* on its own line, the edits sit under *Or edit the common course*, and *Open … in SkyView* has its own line. Guards `tests/coci_list_doubt.test.js` (9).

**LIVE: Discipline in doubt, a ruling that teaches the procedure (S614, 2026-11-09; #3025 adds a second discipline beside the home).** The Courses List's *Discipline in doubt* filter (`#coci-lookup/list/doubt`) carries the cards; a ruling with its reason marked for similar cards becomes a procedure. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**LIVE: the one queue (S573, 2026-11-04, Sam: "yes, start building the one queue").** Every issue in `kb/status/commons.json` names its `carry` (`routine`, or a person's reason: `no_procedure`, `unsure`, `reaches`, `keep_call`); the file's `queue` groups the person items, and an issue naming none lands under `unsorted`. The tab draws it as *Waiting on a person*, under the decisions band. Guards: `tests/commons_status_build_test.py`, `tests/commons.test.js` (queue 1 to 10).

**LIVE: the confidence count (S573, 2026-11-04, Sam: "start on the confidence count next").** `kb/status/commons.json`'s `confidence` says what a person did with each procedure's work afterward: the Exhibit procedures' receipts (`kb/cer_procedures_out/saved/`) against `kb/unified_titles.json`, the nightly Subjects confirm's (`kb/csr_out/confirm/`) against the seed. A result a person looked at is kept, renamed with its family (its old name is gone and its siblings moved together), or moved (a correction). 2026-11-04: of 1,178 titles placed, a person looked at 94, kept 23, renamed 71, moved 0; none of the 13 confirmed picks looked at yet. The tab shows it as *How far to trust the procedures*. **The CR rule rungs joined it (S624, #3027):** the groups a rung 1 to 4 rule folded (`kb/cr_reference_worklist.json`) against the curator's decisions (`kb/receipts/cr_reference_decisions_*.json`, which matched the live table's 30 rows on 2026-11-10), one line a rung. Confirmed with the rule's own wordings is kept; confirmed with wordings a person added from another group is *widened*, its own state (COBIx's finding: the rule set none wrong and missed some); a wording set aside or *not a topic* is moved. 2026-11-10: of 226 groups a person looked at 20 (rung 1: 9 of 113, rung 2: 11 of 26, rungs 3 and 4: none of 87), kept 0 as the rule left them and widened all 20. The 20 are Sam's 2026-09-20 sheet verdicts on fold proposals, matched to today's groups by key; no person has yet been asked to review a rung's output as such, so the count says the rungs under-fold and says nothing yet of whether they over-fold.

**RULED: a count opens its job, filtered; the queue in process order; TOP waits on no one (Sam, S574, 2026-11-04).** *"the links on all surfaces should open to the filtered view of the job needed"*; *"put the procedural things to act in a process order within their cards"* (subjects, courses, exhibits, CR, programs); TOP disagreements *"are input unchecked by colleges. CIP from the COCI programs records should be more dependable"*, so they left the queue. Guards `tests/commons_jobs_filtered.test.js`, `tests/coci_list_jobs.test.js` (the Courses jobs and the strays). **The Courses List first, SkyView beside it** (Sam, same day: *"I want to be able to use list or skyview. Skyview is still too buggy to make the main workspace"*), reversing 2026-11-03's SkyView first. Exhibits' 622 open `#exhibits/list/left`. **The look on every Commons view** (S574): `commons_look.js` gives the five references' tabs commons.js's palette and, in light mode, maps First Light's roles onto it (dark keeps First Light's); `tests/commons_look.test.js`, `npm run a11y` passes on all 13 Commons routes.

**RULED: every Commons view in Malone's look, and the path (Sam, S573, 2026-11-04, in chat).** *"Use the new UI format rather than first light on this and all commons views."* This widens Sheet 158 card 2 from the first view to every Commons view (the Lists, the Progress pages, the side panels); First Light stays the rule for the rest of COBI. The same morning he asked for a visual of the curator's steps and decision points, *"available on every commons surface"*, plain words, with *"a generic term"* for him. The mock is **the path** (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9, source in `CPLBrain/04-projects/cpl-initiative/commons-path-mock/`): six steps every reference shares (know what belongs, let the daily check run, work the list, get the lead's call, check the connections, clean), the CPL Commons view and the Common Subjects view. NEXT: his reaction, then the other references' paths, then the port (`commons_page.js` and `commons_list.js` onto the `--cmn` tokens, the path as a fold above each List).


**The Commons tab's first build (S417, 2026-10-18)**, its machine side, session side and the Course row's SkyView-alone ruling (since reversed: the Courses List first, S574), moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04, SkyJujube*).

**Steps 1 and 2 (S419 #2237, S423): the shared Progress module `commons_progress.js` and the five run logs under `kb/status/`.** The record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*).

**What the tab leaves for the build** (2026-10-18) moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04*): a count now opens its job's filtered list.

**Fable's advice, the Sheet 95 ruling and step 3's Progress views (2026-10-18 to 2026-10-25)** moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, SkyBeacon, 2026-11-06*).

Each reference's Progress view now draws the opened page; Course's landed last (S559, above).

**The figures agree across every Commons tab** (Sam, S490, 2026-10-26; done S560 and S561): the record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-09, SkyCigar*).
