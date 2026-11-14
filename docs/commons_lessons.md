---
title: "The Commons — lessons"
date: 2026-10-18
updated: 2026-11-14
tags: [lessons, commons, program-requirements, cer-procedures, skyview, common-cr-reference]
artifacts:
  - commons_progress.js
  - commons.js
  - kb/_build_commons_status.py
  - kb/status/commons.json
  - tests/commons.test.js
  - tests/commons_status_build_test.py
  - program_requirements.js
  - tests/commons_progress.test.js
  - kb/status/program-requirements.json
  - scripts/queue_status.py
related:
  - docs/reference/lanes/commons.md
  - docs/program_requirements_harvest_lessons.md
  - docs/kb-notes/methodology-a-shared-view-borrows-the-host-s-primitives.md
---

# The Commons — lessons

The lane ([`docs/reference/lanes/commons.md`](reference/lanes/commons.md)) states where the Commons stands; this doc
keeps what each step taught, once. Sam's framing (2026-10-18): *"each of our 'common' projects should have the same
approach and tracking and feedback system... It all needs to culminate in a 'Commons' dash."* The ruled order (Open
Asks Sheet 95 card 1): a shared Progress module, then each reference's Progress view, then the Commons tab.

## S437 and S433: moved to the archive (S649 compaction)

The CR Progress view, the C-ID site, Sheet 108 and the decision lock (S437), then the ENVR pairs, the quarterly comparison and the CSR lane compaction (S433): verbatim in [`commons_lessons_archive.md`](commons_lessons_archive.md).

## S432 and S431: moved to the archive (S649 final refresh)

Verbatim in [`commons_lessons_archive.md`](commons_lessons_archive.md).

## S430: moved to the archive (S650 compaction)

The section *S430 SkyLupine (2026-10-20)* moved verbatim to [`commons_lessons_archive.md`](commons_lessons_archive.md).

## S419 SkyCottonwood (2026-10-18): step 1, the shared Progress module (#2237)

- **What moved, what stayed.** `commons_progress.js` owns the renderer (run status, headline pair and bar, whole
  measure, milestone line, parts grid, side column), `readStatus()`, the milestone arithmetic, `partView()`,
  `wholeFacts()`, `since()`, the status words, the time words and the Progress CSS. `program_requirements.js` kept its
  definitions (`MILESTONES`, `PARTS`, `WHOLE`, `TO`, `SOURCE`), its live reads and `progressContext()`, gained a
  declarative `HEADLINE` and a `PROGRESS` spec (its words), and delegates `viewProgress()`. The host lends `section()`,
  `goControl()` and its call-card helpers through one object, so a count opens the tab's own list and the sections
  remember like their neighbors'.
- **The guard was the first host's own suite, unchanged in what it asserts.** The 417 checks of
  `tests/program_requirements.test.js` passed with the module loaded first; the harness loads the module before the
  tab's script, three CSS regexes read the module's source, and the status path moved. The class names kept their
  `prh-pg-` prefix on purpose: a rename changes nothing a reader sees and would have loosened the guard (SkyView keeps
  its `ccr_atlas_*` paths the same way). `tests/commons_progress.test.js` (30 checks, floored by hand) guards only what
  a shared module can get wrong: a second host's classes substituted into a style of its own, a spec with no whole
  measure drawing no band, a failed read saying so in both headline numbers, `readStatus` refusing a file with no
  `written_at`, the host tab drawing its other views when the module's lazy load fails, the boot order in both HTMLs.
- **A shared module fails soft or it fails the tab.** `CPL_TABS.loadScript` calls back on error as on load, so a 404 on
  the module would have reached `program_requirements.js` with the global undefined and killed the tab at load. A
  nine-line stub answers every helper safely and draws one line on the Progress view; the other four views read as
  usual.
- **CSS with the host's classes substituted, one style per host set.** The module's CSS names the host's section
  pattern (`prh-sec`, `prh-sec-b`, `prh-sec-t`, `prh-sec-label`) and its quiet text as `%name%` marks, filled from
  `h.classes` at injection under `cpg-css-<sec>`; with the defaults the injected CSS is byte-identical to the host's
  former block. A second host passes its own names and gets its own style.
- **One status file per project.** `kb/queue_status.json` became `kb/status/program-requirements.json` with a `project`
  field; `scripts/queue_status.py --project` names another project's file; checkpoint step 12, the a11y seed comment,
  the lane files and the dependency map followed (a seed records the read `commons_progress.js` makes on the host's
  behalf, which the literal scan no longer sees). The deploy-time asset manifest covers every root-level `.js`, so the
  new module is cache-busted without a change.
- **The one-writer carve-out worked across three sessions.** Sam told S417 at 19:08Z: *"Commons looks good. Just make
  sure I can collapse each and we have a collapse all button."* S417 took the mock-up file and artifact (version 4,
  #2239), S418 closed its competing record PR unmerged and named the branch to lift from, and this session recorded
  the ruling in the lane, section 11 and the status file with the time corrected (19:08Z, not 17:31Z) and the one
  memory row cited (`sam-approves-commons-mockup-collapse-2026-10-18`). Read the queued messages before writing.
- **Next, step 2.** Each reference's Progress view drawn from the module, in the ruled order (Exhibit on the CER tab,
  then Course, CR, Subjects), each with its definition of complete on a card for Sam and a status file under
  `kb/status/`. The CER tab's host object must lend a section pattern with its class names, a count control that opens
  its own lists, and call-card helpers (or none, with `callRecords` returning null and `callAnswered` reading the
  sheet's store); the collapse pattern Sam asked for belongs in step 3's Commons row component.

## S417 SkyManzanita (2026-10-18): the Commons tab, on Sam's word (step 3 before step 2)

- **The mock-up's figures reproduce from the committed files alone.** Every number the mock-up showed, measured
  against live tables at 16:35Z, came back from a committed file: the harvest's record files and
  `coci_programs_data.js` give the Program Requirements pair; `kb/exhibit_audit/latest.json` carries "left MAP" (the
  raw export is gitignored for PII); the auditor's `latest.json`, the CR worklist's `_stats` and the SUBJ4 seed carry
  the rest. So the builder needs no key and runs in the daily workflow after the steps that write those files.
- **A figure's stamp is the file's own field, never the clock.** The auditor's `_generated_at`, the fold report's
  `_generated_at`, the seed's `_synced_at`, a receipt's `at` (hyphens in its time part: `17-37-29Z`, normalized). The
  CR worklist carries no stamp, so its "last changed" comes from git, which a shallow checkout cannot answer; the
  builder writes null there and the row reads *Could not be read*.
- **A cohort's stamp is the reviewer's `@bot` suffix, never the day:** 2026-07-07 holds 258 person stamps beside the
  158 preseed ones. Splitting by day would have misread the Exhibit pair.
- **"No words on the cards" is the prose, not the labels.** Sam waved the definitions and the where-it-stands
  narrative; a known issue still needs its words and its owner to mean anything, and the test behind a count stays as
  a chip. The lane keeps the definitions for the cards each Progress view will carry.
- **A screenshot of the served monolith waits for the load event.** The container's proxy fails every outbound
  request, so `domcontentloaded` plus a selector wait timed out while `load` plus a function wait rendered the tab in
  two seconds; the a11y sweep's own server does the same.

## S423 SkyLaurel (2026-10-19): the four run logs

- **The tab was already wired for them.** `kb/_build_commons_status.py` sets each row's `status_file` when the file
  exists and `commons.js` reads it, so step 2 was content and a checkpoint line, no code. Each log's next step is its
  lane's NEXT, written in plain words because the validator refuses markdown and glyphs.
- **Stamp only what moved.** A run log that a checkpoint restamps without work behind it reads fresh and says nothing;
  step 12 refreshes the logs this run touched and leaves the others to age into *stale*, which is the true state.


## S425 SkyMadrone (2026-10-19): the first per-reference Progress view, Subjects (#2260)

- **The host contract held for a second host in sixty lines.** `canonical_subj4.js` lends a `section()` on a
  `<details>` with its own classes (`cs-sec`, remembered in `localStorage`), a `goControl()` whose targets are the
  table's filters, the SUBJ check or a section of the view, and call helpers that answer nothing (a call is answered
  on its sheet). The module needed one addition, an optional `more(x)` word per part for the card's procedure; the
  first host's 417 checks stayed as they were, and a shared CSS rule split into two so the first host's regex still
  matched its own line.
- **A check must know every sharing by design or it over-reports.** The tab's SUBJ check listed six ruled sharings
  as collisions (the five agriculture family codes both umbrellas declare, the FTVE fan-in) beside the one real one,
  and the dash would have said seven. The scanner's CS2 knew the fan-in; the tab's check knew only the alias file.
  Both exceptions now come from the entries themselves (`umbrella_codes`, `fan_in_with`), as
  `methodology-subj4-consumer-semantics` says every consumer must.
- **The pick's reviewer is the code row's.** The sync and the overlay took the latest row across fields, so a note
  a cohort wrote in July overwrote the person who picked the code in May on eleven entries, and the Commons row read
  "111 by a person, 11 by a session cohort" of 122 picks a person made. A field's provenance stays with the field.
- **A pattern written for the common case silently dropped a third of the file.** The C-ID descriptor regex had no
  room for the " X" suffix (172 of 495 descriptors, 17 of 65 subjects), so the chips never saw ADS, the three
  agriculture families, WELD or FIRE. Count the file's rows against the index's rows before trusting either.
- **`hidden` loses to `display:flex`.** The toolbar stayed on screen under Progress until a `[hidden] { display:none }`
  rule outranked the toolbar's own display; the served page showed it, jsdom could not.
- **The deep link behind a count is the hash's second segment.** `#canonical-subj4/pre_seeded` opens the tab (tabs.js
  routes the first segment) and the tab applies the second as a filter, a view or the check; the Commons builder
  writes the same addresses into its `open` fields, so both dashes point at one list.

## S427 SkyMadrona (2026-10-19): Sheet 99's rulings 1, 2, 3 and 5 applied; the sitting for 4 built

- **A ruling names a record; the store may count another.** Sheet 99 card 3 named AUTB M1006 (Supervision and
  Management in Agriculture) as Agricultural Business's one identity, and the seed's count of one came from AUTB M1071
  (Import Body Customizing), whose record carries that discipline while M1006's record said Auto Body. Both carry Sam's
  own 2026-07-13 discipline row, three seconds apart. The ruling moved the record it named; the other is a card, never a
  silent correction (Rule 8), and the Reference view says one row sits off its code, which is true.
- **The tab's shared-by-design rule had to learn the ruled shape before the re-key.** AGAB is declared by two umbrellas
  and is now Agricultural Business's own; the old rule (every owner an umbrella, none canonical) would have replaced the
  one collision it closed with a false one. Two disciplines canonical on one code stays the collision.
- **A known issue with nothing in it is not an issue.** The Commons row's collisions issue at zero failed the no-bare-zero
  rule; the builder drops it and `facts.shared` keeps the measure. The test finds the issue by its words, never by position.
- **"No finding names" needs its two corroborators spelled out.** The scan names every unconfirmed pick (cs7) and the
  aligned ones (cs4_aligned); read literally, the confirm procedure would have confirmed four of thirteen. The procedure
  says which rules corroborate and which hold.
- **Parallel Bash calls share one shell and one working directory.** A `cd` in one call moved the other mid-command: a
  tracker `checkout -B` ran in the vault and reset its branch to main (recovered from the pushed remote). Use `git -C` and
  absolute paths, and never two `cd`s in one turn.
- **A merged claude/* branch is deleted, and the stale tracking ref makes `--force-with-lease` refuse.** Fetch the ref or
  drop it, then push plain.
- **A ruling that changes a human's own row changes it under his email, with the ruling as its time.** Sam answered
  Sheet 101 at 22:38Z (autobody): AUTB M1071's discipline row is his 2026-07-13 row, so the write is a guarded UPDATE
  pinned to the before-values (value, email, `reviewed_at`), keeps `map@rccd.edu`, sets `reviewed_at` to the reply's
  stamp so the daily sync takes it, and names the sheet's store as its source. The receipt's header carries the
  before-images and the rollback; the session's own JSON receipt carries the identity file and overlay before/after.
  A cohort note that said the identity waits on his card is updated in the same file, so no store keeps the old state.

## S435 SkyToyon (2026-10-20): the 110 strays, sorted by whether the answer can be checked

- **A stray splits two ways.** 9 of the 110 codes (12 identities) already carry a discipline, Foreign Languages. Their
  answer is a code, which the umbrella's 2026-06-09 model gives: one code per language, FL plus two letters where no
  authority code exists. The other 101 carry none and are the curator's (Sam, 2026-09-08).
- **A stray has no prefix-mates, so the blank worklist's signal is empty for it.** `kb/_csr_stray_triage.py` reads the
  colleges' own signal instead: for each member course, the discipline that college's other identities on the same
  local subject carry. 15 codes pass 85% of at least 10 votes. The titles agree on 8 (79 identities) and disagree on
  3 (SGNG's sign-making reads Work Experience, CMPE's drone course Computer Information Systems, RTVF's radio course
  Film); 4 are a single course each. A vote that passes the gate still needs the second signal.
- **The re-key went on a card.** S432's apply of the same shape was held by the session's permission check, and one
  window can carry the forestry stragglers, the twelve FL re-keys and the eight blanks together. Open Asks Sheet 106,
  cards 1 to 3; the FL dry run (`kb/_fl_stray_remint.py`) passes every gate.

## S436 SkyTanbark (2026-10-20): the Exhibit Progress view, the third host

- **One definition, two readers.** The view reads its headline pair from the Exhibit row of `kb/status/commons.json`
  instead of recomputing it in the browser, so the Commons row and the view cannot disagree. The builder carries the
  auditor's tallies the cards need (`map_titles`, `unclassified`, `left_map`, `below_80`, `below_60`); the 2 MB audit
  and the 1.9 MB title map stay out of the browser.
- **A host with its own state lends it through an api.** The Exhibit tab is a closed IIFE of 5,700 lines; the
  definitions live in `exhibit_progress.js`, and the tab hands over its procedures report, its three worklists and its
  lane switch. The worklists load late, so a card that needs them reads *Could not be read (still loading)* until the
  tab re-renders, never a zero.
- **The third host needed no change to the module.** The contract held: a spec, a context, a host lending
  `section()` and `goControl()`.
- **A draft PR runs no CI here.** `get_check_runs` read zero runs on #2285 until it was marked ready; never park in draft.
- **`npm test` does not finish inside a 10-minute sandbox call**, even in four background shards. CI's sharded `test`
  check is the gate; locally, run the changed tests and the ones that pin the view.
- **A gap-fill must not take a slot SkyView still draws.** SkyView's layout is hand-built and keeps points under ids
  an earlier re-mint vacated, so the first Sheet 107 apply drew six ids twice and the lints job failed. The allocator
  in the three Sheet 107 scripts now treats `er.ever_minted_ids()` and `er.skyview_ids()` as taken, and the window
  was re-applied from the pre-apply files: no reused slot, no duplicate.

## S544 SkySombrero (2026-11-02): the List norms' steps 1 and 2 in the engine

**What shipped.** #2673, the engine's `suggest` slot and the visit's changed set. CR's rung proposals read *Suggested groups*, with Confirm the group; Subjects' open picks read *Suggested picks*, with Confirm this pick. #2675, every filter word carries its count, `counts()` for a tab that already counted (Program Requirements, Courses), `uncounted(id)`, and *Selected* on every List. #2674 rebuilds `kb/status/commons.json` in the nightly procedures run, so the Exhibits tile agrees with Review the same night (it had read 351 held against Review's 1). The norms note records both steps; step 3, bands from a spec's `groupOf(r)`, is next.

**A suggestion never proposes a call a person must make.** The Subjects fixture offered Agricultural Business the code AUTB, which another MQ discipline owns. Confirming it would have written a collision through the same path as every other confirm. The open pick in a collision now gets no suggestion. The general rule: before a machine proposes a fold, run the refusal the write itself would apply (one code, one MQ discipline), and leave anything that fails it to the person.

**A count is honest only when its data has arrived.** S343's rule (a failed read is never an empty list) reaches filter counts: *Suggested folds (0)* before the AI sort's file arrives reads as "no suggestions". `uncounted(id)` leaves the word bare until the data is read, and a test boots the Exhibits List with that file unread to pin it.

**A test that finds a control by its exact label breaks when the label gains a number.** Seven suites found filter words with `txt(b) === t`. They now match the label with or without a trailing count. Match the label's stable part, not its whole text.

**Run a long local test loop in its own worktree.** A loop over 33 suites ran in the checkout while the session switched branches under it, so its results could not be trusted and it was stopped. `git worktree add` in the scratchpad, with `node_modules` linked, keeps the loop on one commit.

**Never put an unmeasured number in a PR body, even as an example.** #2675's first body showed *Needs a decision (156)* and *Decided (30)* as examples; neither was measured. It was corrected to *(n)* within minutes. An example figure in a PR reads as a finding.

## S545 SkyWhirlpool (2026-11-02): the List norms' step 3, and Exhibits on the engine's slot

**What shipped.** #2679: step 3 was half done (#2670 had built the engine's read-only `bands` hook for the Courses List
and made `listRows` filter before it sorts), so the engine gained `bands.order(key, members)`, the text bands sort by
when the key is an internal one, and the CR List bands its 2,344 wordings by group: 156 bands of two or more, each named
and ordered by the group's reference, a group of one under *Single wording*, read only. #2680: the Exhibits List's
spelling-twin folds and changed set moved onto the engine's suggestion slot, so all three steps have landed and every
folding List takes suggestions, the changed set, filter counts and bands from the engine.

**Order bands by what the reader sees, not by the key.** The CR group key is a normalized string ("engine performance");
ordered by key, a band named *Engine Performance (3 to 5 units)* sorted before *4 hours in Welding*. The test pins the
reference order with exactly that pair, and fails when `order` is removed.

**Two keys that read alike need two places.** Ranking band keys with the shared text ranker gave keys equal under the
collation one rank, so their rows would interleave and the band header would alternate. Each key now takes its own
place, ties broken by the raw key.

**Read a handoff's next step against the code before building it.** Handoff 545 described step 3 as "so the Courses List
stops hand-rolling its M-ID bands"; the Courses List had used the engine's hook since #2670 (handoff 544 said "half
done"). The remaining work was CR's bands and the norms note's bookkeeping.

**Two PRs that edit adjacent lines of one table wait for each other.** The Exhibits code went on a sibling branch while
#2679 ran CI; its docs waited for the merge, because both edit the norms note's *Where each List stands* rows.

## S552 SkyCentaurus, 2026-11-02: the CPL Commons, named twice in a quarter hour

- **A working name is a working name.** Sam opened with *CCC Commons* and, on seeing it on the mock, moved to *CPL
  Commons* (*"less of a wholesale take over of the system"*). Everything that carried the first name (the mock, the
  lane, the vault README, the memory row, the sheet) was renamed in the same hour; the cost was low because each
  surface named its source. A name on a shared surface (the side menu) waited on his word, which is why it is a card.
- **Play the whole's name through the cards.** The eight cards became *Common Programs, Common Subjects, Common
  Exhibits, Common Credit Recommendations, Common Courses, Common Credentials, Common Outcomes, Common Skills*: the live
  tab's row pattern (Common Exhibit Reference, Common Course Reference, Common CR Reference, Common Subjects Reference)
  with "Reference" dropped because the Commons says it. "Register" was retired. The focus elements (the decisions band,
  the sort note, the skip link, the footer) carry the same words, so the page reads as one vocabulary.
- **A hand edit on the canvas shows up as a stray style.** The Exhibits artboard's root `main` had gained
  `position: absolute; left: 13px; top: 16px` between publishes, the trace of a drag in the editor on a fill page; the
  republish dropped it and said so. Read the canvas again before every publish; the view context's `edits` count says
  when someone touched it.
- **A look is a token layer, even when it is someone else's.** The CPL Commons tab is the one COBI tab in Malone's
  look (Sam, Sheet 158). The palette went in once, as `--cmn` tokens scoped to `#tab-commons`, every rule below it
  reading a token; the dark theme maps each role onto a First Light dark token instead of a second palette. The
  "no raw hex in the injected CSS" test kept its teeth by reading the rule block alone and a new check reads the token
  block, so a hex can live in exactly one place.
- **A card needs a session side and a machine side.** The status file gives a card its pair and stamp; the run log
  gives it *Your decision*, *Recently* and *Next*. A reference with no run log still draws, with its machine stamp as
  Recently and no Next, which is the truth of it. The three building references got `building` rows rather than a
  place in `rows`, because the builder's test holds `rows` to a definition of complete they do not have yet.
- **The sheet builder's test needs a fixture per predicate.** S551's Sheet 157 predicate shipped without one, so the
  coverage test read 29 of 30 before this run touched it; both predicates now have fixtures and the test passes 30 of 30.

## Moved from the lane, 2026-11-02 (S552; the lane passed its 20,000-byte budget)

**Step 1 landed (S419, #2237, merged 19:28Z):** the Progress view the Program Requirements tab drew since S343 is
drawn by `commons_progress.js`, the shared module: the renderer, `readStatus()`, the milestone arithmetic, the shared
status words, the time words and the Progress CSS. A project brings a spec (its words, `MILESTONES`, `PARTS`, `WHOLE`,
a declarative `HEADLINE`, its read names), a context from its own live reads and a host lending its `section()`,
`goControl()` and call-card helpers; a host's classes are substituted into the CSS, one style per host; a spec with no
whole measure draws no band; a failed module load leaves the other views drawing. Nothing changed on screen:
`tests/program_requirements.test.js` passes its 417 checks with the module loaded first; `tests/commons_progress.test.js`
(30 checks) guards what only a shared module can get wrong. The status file is `kb/status/program-requirements.json`,
the first of one per common reference (`scripts/queue_status.py --project`); checkpoint step 12 names it. Lessons:
`docs/commons_lessons.md`.

**Step 2, the run logs (S423):** `kb/status/exhibit.json`, `course.json`, `cr.json` and `subjects.json` carry a session stamp, the lane's NEXT as the next step and no calls (nothing on any of the four waits on Sam); checkpoint step 12 names them, stamped with `scripts/queue_status.py --project <id> --stamp`, and refreshes the ones a run touched. A run log older than a week reads stale on the tab, which is true of a reference no session worked.

### Step 3's three Progress views (moved from the lane, 2026-11-02, S552)

**Step 3's first Progress view, Subjects (S425, cpl-project-tracker#2260).** Sam, 2026-10-19: *"Can you develop a
dash for CSR similar to the one you created for PR? Seems like each of our Commons consolidation projects should
follow the same process"*; his ask moved Subjects ahead of Exhibit, Course and CR in the ruled order. The tab opens on
Progress, drawn by the shared module from its own definitions (a card per step, the procedures under the cards, the
findings), and a count opens the table with its filter through `#canonical-subj4/<filter>`, the deep link behind a
count; the Commons row's counts link the same way. The second host proved the contract: a 60-line host object, its
own section classes, no change to the module but an optional second word per part. Lane:
[common-subjects-reference](common-subjects-reference.md).

**Step 3's second Progress view, Exhibit (S436, 2026-10-20).** The Common Exhibit Reference tab gains a fourth view,
*Progress*, first in its row; the tab still opens on Needs you (S413), so nothing a curator lands on moved. The
definitions live in `exhibit_progress.js`, loaded with `commons_progress.js` the first time the view opens. **One
definition, two readers:** the headline pair and the auditor's tallies come from the Exhibit row of
`kb/status/commons.json` (the builder now writes `map_titles`, `unclassified`, `left_map`, `below_80`, `below_60`), so
the Commons row and the view cannot disagree; the rest is the tab's live state lent through an `api` (last night's
procedures report, the Unclassified, No issuer and Merge confirms queues, the lane switch). Definition of complete,
carried from the Commons row: a title carries a review stamp, a person's or a procedure's cohort's (1,729 of 4,915).
Five milestones (every MAP title classified, the held titles decided, an issuer for every credential, the reference
matches MAP, every title stamped) and eight cards. A count opens the lane that lists it, and
`#credential-reference/<lane>` (progress, held, unc, noiss, merge, procs, all, industry; `needs` and `ref` name a view)
routes from the address; the Commons row's counts now link there. Guard `tests/exhibit_progress.test.js` (30 checks);
`npm run a11y -- cer-progress cer-progress-dark` passes. The third host needed no change to the module.

**RULED (Sam, Open Asks Sheet 107 card 4, 13:09Z 2026-10-20, and again on Sheet 108 card 4, 13:24Z, his own call:
keep).** The Exhibit Progress view stays as S436 built it: complete = a title with a review stamp (the Commons row's
pair), and the tab opens on Needs you.

**Step 3's third Progress view, CR (S437, 2026-10-20).** The Common CR Reference tab gains a view row, *Progress* and
*Worklist*; the tab still opens on the worklist's Needs a decision. The definitions live in `cr_progress.js`, loaded with
`commons_progress.js` the first time the view opens. **Complete changed unit:** a *wording* colleges wrote resolves to a
settled reference when a rung 1 to 4 rule places it or a curator's decision names it (confirmed or not a topic; deferred
and cleared settle nothing), so the Commons row's pair moved from two group counts (156 by rule, 30 decided) to one:
**459 of 2,344 wordings, 5,750 of 9,413 articulations** (408 by a rule, 51 more by Sam's 2026-09-20 sitting). The
builder (`row_cr()`) and the tab (`SETTLES`) apply one rule; the builder reads the committed receipts, and the view's
Curator decisions card says when the live table and the receipts differ. Milestones walk the head-heavy corpus: the
rules applied, the top 50, 100 and 250 wordings settled, every wording settled; You are here is the head (44 of 50; the
six left are the POST community-relations wordings, Criminal Court Process, Elective Course Credits and Engine
Performance I). Two new worklist filters back the counts, *No rule or decision* (1,885) and *Name to check* (37), and
`#cr-reference/<view or filter>` routes from the address. The tab had drawn inside its loading placeholder's inline
style (a dashed box, muted centered text) since it shipped; the module now clears it on first paint. Guards
`tests/cr_progress.test.js` (42) and `tests/commons_status_build_test.py` (77, a fixture for the settling rule);
`npm run a11y -- cr-progress cr-progress-dark` passes. The fourth host needed no change to the module.

**RULED (Sam, Open Asks Sheet 108 card 5, 13:24Z 2026-10-20, his own call: keep; `cpl_memory`
`sam-sheet-108-rulings-2026-10-20`).** The CR Progress view stays as built: complete = a wording a rule places or a
curator decides, and the tab opens on its worklist.

## S559 SkyAndromeda, 2026-11-03: the Common Course Reference takes the opened page, the last of them

- **Read the Commons' row, never recount.** The Course page reads `kb/status/commons.json`'s `course` row and its run
  log, as Exhibits' tiles do, so the S490 to-do (every tab agreeing with the Commons summary) holds by construction
  here. The three questions needed counts the row lacked, so the builder writes the auditor's six tag counts into
  `facts.tags` rather than the page fetching the 10 MB `kb/row_audit/latest.json`.
- **The auditor counts a tag once a card** (checked: the per-card set counter equals `stats.tag_counts`), so *cards free
  of a tag* = total less the tag's count is a sound row over the one denominator.
- **commons_page.js's links fall under 24px** in a row (`a` gets no min-height, its buttons do): a host whose rows link out
  (here SkyView, an external page) adds `a { display:inline-block; min-height:24px }` under its prefix. A host with no
  h2 above the page skips h1 to h3; COCI Lookup's header is a span, so the view adds its own h2.

## Moved from the lane, 2026-11-03 (S562; the lane passed its 20,000-byte budget again)

The per-reference opened-page paragraphs, verbatim as the lane carried them on 2026-11-03:

**The opened page, one renderer (S556, 2026-11-03).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws
the mock's opened page for any reference: the progress line over its one denominator, *Needs attention* with an action
each and the team's next step, and the three question groups with every count over one denominator; an unread count says
*Could not be read*. First Light tokens (the Commons tab alone wears Malone's look). **Exhibits carries it** as its
**Progress** view, first in the views row, at `#exhibits/progress`, and the Common Exhibits card opens there; the tab
still opens on Review (Sheet 147). The headline is the Commons row's pair (Sam's keep, Sheets 107 and 108); the groups
read `credCounts()`, the Credentials tiles' own counts. The CER tab's S436 Progress view stands as kept. Guards
`tests/exhibits_progress_page.test.js` (41), a11y `exhibits-progress` and `exhibits-progress-dark`. **The CR Reference
carries it too (S556):** its Progress view draws the page first and the S437 milestones and parts under *Details*,
closed; the three questions are counted per wording from the worklist the tab holds (grouped, official number, statewide
line; units stated, units agree; two or more colleges, two or more credentials), and the card opens
`#cr-reference/progress` while the tab still opens on the worklist. Guard `tests/cr_progress.test.js` (54). **Subjects
too (S556):** the page over the 147 MQ disciplines with courses, with questions that fit a code (what it is called, whose
code it is, how it reaches the courses); the milestones and steps under *Details*, the procedures and findings below.
Guard `tests/csr_progress.test.js` (78), a11y `canonical-subj4-progress` (320 to 1440) and `-dark`.

**CPL Pathways too (S558, 2026-11-03):** the Program Requirements tab's Progress view draws the page first and the
dash (milestones, parts, the whole harvest, the calls) under *Details*, closed; opening a call opens Details. The
denominator is COCI's active program, the headline's own unit, and the three questions fit a program: where it is read
from (a college with a catalog address, with a reading procedure), what it requires (read, units add up, nothing
added), whether it matches the state's record (every course COCI lists placed, complete). A record on a program COCI
does not list never counts; a failed active read says *Could not be read*. `commons_page.js` loads on the first
Progress render. Guard `tests/program_requirements_page.test.js` (16); a11y `program-requirements-progress` and
`-dark` wait for the page and open Details.

**The Common Course Reference too (S559, 2026-11-03, #2720):** COCI Lookup's **Progress** view, first in its views row
(the tab still opens on the Courses List), at `#coci-lookup/progress`; the Commons card's third word, *Open Progress*.
It reads the Commons' own row (`kb/status/commons.json`, key `course`) and the run log it names, so its headline is the
card's pair: ready (the auditor's 0.85 or better) of the auditor's cards, 3,205 of 27,581. Needs attention: needs
repair, then the row's issues with who fixes each, Open SkyView on each. The three questions (what it is called, where
it sits, whether its courses agree) count the cards free of one auditor tag; the builder writes those six tag counts
into the row's `facts.tags`. **NEEDS SAM (Open Asks Sheet 160, S559, 2026-11-03): complete is the auditor's *ready*,** proceeded on the
recommendation; reply to reverse (*curator* would count only a person's confirmation in SkyView). Sheet: https://claude.ai/artifact/KWSqdMPag3RXkwpvqGZqE9 Guard `tests/coci_progress.test.js` (29); a11y `coci-lookup-progress` (320 to 1440) and `-dark`.
Every reference now carries the opened page.

## Sheet 160 answered (S563 SkyBode, 2026-11-03)

Sam answered card 1 *keep* at 12:44Z with a note, the whole sheet reviewed: *"We should count a common course reference even
when a person has not confirmed it. The personal confirmation is an attribute we can give the reference when it occurs and we
can then count confirmed CCRs, until which time we can use the CCRs to crosswalk local titles as best they can--even knowing
they may need more work, folding with other courses or CCRs, or reminting. We will use them for what we can, and in the
process of using them, reveal opportunities and gaps and misalignments to correct and then confirm when confidence is high
enough. Hopefully, in the process of using imperfect CCRs, we can add lessons, rules, principles that will sharpen and
strengthen our AI routines designed to create and manage the CCRs and all our common references."* The Course page keeps
the auditor's *ready* as complete; the lane's NEXT is a confirmed count beside it.

## The confirmed count (S564 SkyHoag, 2026-11-03)

Built Sheet 160's attribute: *Confirmed by a person in SkyView*, 812 of the auditor's 27,581 cards (#2726). Three things
learned on the way. The auditor's cards are not identities: an M-ID that is also a merge target is scored twice (kinds
`C` and `X`), so the count is taken in cards to share the page's one denominator (542 identities). SkyView's explicit
Verify (`validated_at`, Sam's 2026-06-10 *"it shouldn't change to Verified until I verify it"*) has never been pressed,
so the count reads person-made saves instead (a title, a discipline, a cross-listing, a merge). And
`kb/coci_curation.json` keeps one reviewer a card, the latest, so a cohort save after a person's hides the person: the
count is a floor until the overlay keeps a reviewer a field.

**On all five (S565, 2026-11-03).** Sam: *"yes to both, build them for all four"*, answering whether a course placed into
a card confirms that card too, and whether the other references should count the same attribute. Each row now carries
`confirmed_pair()` as its second pair, over the first pair's denominator, with the share also complete: Programs 32 checked
by a person (28 complete); Exhibits 1,173 titles a person stamped (complete is the stamp, so no share); Courses 957 cards
(a person's save keyed on the card, 812, or placing a course into it, 145 more; 152 ready); CR 97 wordings a curator's
decision names (all settled); Subjects 122 MQ disciplines a person confirmed (all settled). CPL Pathways' Confirm writes
only to `program_requirement_records`, so the committed records undercount (20 against 32 live); `kb/_sync_program_checked.py`
commits the checked list daily, college, number and day, never the address. Each Progress page draws it as one line under
its bar (`progress.confirmed`), the Commons card as one line under its figure. The lesson: S564 and S565 built the first
version at the same hour because a scheduled firing is not in `list_sessions`; read `main`'s commits before starting a
queue item, not only at session start.

## The List norms, steps 1 to 3 (moved from the lane, S564, 2026-11-03)

Step 1 of its three landed in S544: the engine's `suggest` slot and the visit's changed set, with CR's rung proposals (*Suggested groups*, Confirm the group) and the Subjects open picks (*Suggested picks*, Confirm this pick) wired in; step 2 put every filter word's count in the engine (S544), and *Selected* on every List; step 3, bands from the spec (the engine's `bands` hook, with `order` for a band named by something other than its key), landed in S543 for Courses and S545 for CR's groups. The Exhibits List moved onto the engine's suggestion slot and changed set in S545, so all three steps have landed.

## Moved from the lane, 2026-11-04 (S573 SkyNeedle; the lane passed its 20,000-byte budget)

**The Catalog Commons tab (S542, #2662):** full width; each row's calls cell reads **Decision Sheet Library**, its count
bold, a 0 in green; answered calls sit under **Completed Decision Sheets**, one line each that opens (Sam, 2026-11-01).
**The Exhibits tiles carry the Commons' Exhibit row** (Sam, 2026-11-01: *"capture everything from 1st into Exhibits view"*): its pair, tests, known issues, procedures, the Decision Sheet Library and the last run, read from `kb/status/commons.json` and its run log, never copied (`exhibits.js`, *The Commons' row, carried on the Credentials view's tiles*); the row's `facts` feed the Progress view. Done; S562 found it built.

**A to-do closes here (S555, 2026-11-02).** Sam: *"There is one decision in the queue that doesn't give me a way to close it, just links to review."* A run-log call with a `todo_id` is a to-do; the Commons now reads the marks (`queue_todo_done`, for a signed-in reviewer), a standing mark answers its call, and an open to-do offers **Mark done** with a note in the band, through `rpc/queue_todo_done_add`. Guard `tests/commons.test.js` (todo 1-5).

**The List norms (Sam, 2026-11-01: *"consistent views for all the folding and consolidation work"*):** every reference's List follows [`reference-catalog-commons-list-norms`](../../kb-notes/reference-catalog-commons-list-norms.md); a PR names which of the ten norms it carries and why it leaves any out. All three steps have landed (history in the lessons, *The List norms, steps 1 to 3*).

**The CPL Commons, the working name (Sam, S552, 2026-11-02).** *"Let's call the Catalog Common the CCC Commons for now
and you can play off of that for the card titles and focus elements."*, then, on seeing it: *"Let's go with these designs for now. I'm chickening out on the CCC Commons...let's go with CPL Commons for now as less of a wholesale take over of the system:)"* The first-view mock
(https://claude.ai/artifact/TG8LPUBATV8WFfrmvPwKEG, a Design canvas, version 8, locked by Sam; source in
`CPLBrain/04-projects/cpl-initiative/catalog-commons-mock/`) now reads **CPL Commons**, with its lede (*eight common references the
California Community Colleges keep together for credit for prior learning*), and each of its eight cards is a **Common**
reference, this tab's own row pattern with "Reference" dropped: Common Programs, Common Subjects, Common Exhibits,
Common Credit Recommendations, Common Courses, Common Credentials, Common Outcomes, Common Skills. The decisions band,
the sort note, the skip link and the footer carry the same words; the Programs card opens CPL Pathways. "Register"
(S551's advice) is retired. The mock is in Malone's CPL/AI look at Sam's ask (S551), which is the public pages' look,
so the port into this tab waits on his call on the look.

## S573 SkyNeedle, 2026-11-04: the path, the order, the queue and the confidence count (Sam's session)

- **The path mock** (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9, v8; source `CPLBrain/04-projects/cpl-initiative/commons-path-mock/`):
  six steps every reference shares, the CPL Commons view and the Common Subjects view, in Malone's look (Sam: *"Use the
  new UI format rather than first light on this and all commons views"*, now the CLAUDE.md presentation rule).
- **Sam's additions, in order** (verbatim in the vault braindump `braindump-2026-11-04-1415-commons-path-one-look.md`):
  where to start (Subjects then Courses, Exhibits then Credit Recommendations, Programs last); teach the daily check
  (Teach a rule, try it switched off, turn it on, watch what a person changes); who carries the work (the routines carry
  the volume, a person is asked only for one of four reasons); the daily check's wish list of data sources, which became
  the register `docs/reference/data_sources.md` with its four steps and a `CLAUDE.md` line.
- **Built:** the one queue (#2766) and the confidence count (#2767) on the CPL Commons tab; the daily dashboard was
  dispatched at 16:57Z so the status file carries both.
- **The confidence lesson:** a first comparison read 71 of the 94 person-touched exhibit titles as changed; every one was
  a family a person renamed or merged. The count now separates kept, renamed with its family, and moved; the KB note
  `methodology-a-renamed-family-is-not-a-correction` holds the rule.
- **`kb_curation` forgets:** its primary key is (course_id, field), so a person's save replaces a procedure's row. The
  receipts are the only record of what a procedure wrote; a confidence measure for another reference needs receipts in
  the same row shape (only the CER saves and the Subjects confirm have them today).

## Moved from the lane, 2026-11-04 (S574)

**What the tab leaves for the build.** A count opens its reference's tab at the top, since no tab reads a
list from its address (the deep link is a build item). The gaps across the harvest's five parts are a live
read of the records' display facts, so the Program Requirements row carries two known issues, the failing
and the unread. The CR row's curator decisions come from the committed receipt, so a new sitting lands a
receipt under `kb/receipts/` or the figure stays at 30 (the live table is the authority). A call reads from
the run log and stays open until a checkpoint removes it; the decision sheet's store is read only where the
Progress view's `callAnswered` resolves a record. The machine stamps: Program Requirements the last college
read (on dispatch), Exhibit the later of the saving run and the fold, Course the auditor, CR the worklist's
last change from git, Subjects the daily sync; a daily stamp older than 36 hours reads stale, a run log
older than a week reads stale.

## Moved from the lane, 2026-11-04 (SkyJujube; the lane passed its 20,000-byte budget)

The S417 record of the Commons tab's first build, verbatim. The Course row's *SkyView alone* ruling it records was reversed on 2026-11-04 (S574: the Courses List first, SkyView beside it).

**LIVE: the Commons tab, `#commons` (S417, 2026-10-18).** Sam, 20:10Z: *"Build it as a tab now. I can
live without the words on the cards—pretty self explanatory and I am the main user."* The tab is the
mock-up's row without its prose: five rows in his order, each with the complete pair and the test behind
it, the known issues each naming an owner, the settled procedures, the calls in the run log and the two
stamps. Every row collapses on its own word to its count and meter (19:08Z: *"Commons looks good. Just
make sure I can collapse each and we have a collapse all button."*; 20:03Z: *"Keep the count and meter
when collapsed."*), Collapse all folds the page, the words on a row move it, and the order and the fold
stay in the browser. Sam's three rulings of the day carry the `cpl_memory` row
`sam-approves-commons-mockup-collapse-2026-10-18` (verified).

- **The machine side** is `kb/status/commons.json`, written daily by `kb/_build_commons_status.py`
  (daily-dashboard.yml, after the builds it reads) from the committed files alone: Program Requirements
  from `coci_programs_data.js` and the harvest's record files (the mock-up's own method); Exhibit from
  `kb/unified_titles.json`, `kb/credentials.json`, the exhibit audit, the procedures run's `latest.json`,
  the saving receipts and the fold report; Course from the auditor's `kb/row_audit/latest.json`,
  `prototype/ccr_universe.json` and the stand-alone build; CR from `kb/cr_reference_worklist.json` and
  the curator receipts under `kb/receipts/`; Subjects from `kb/discipline_canonical_subj4.json`. A figure
  a source cannot supply is null beside its error and reads *Could not be read* (the S343 rule). Guard:
  `tests/commons_status_build_test.py` (66 checks).
- **The session side** is each project's run log, `kb/status/<project>.json`: today Program Requirements
  alone has one, so four rows read *no run log*. The tab reads a run log's session stamp, next step and
  calls as its last checkpoint left them. A call Sam answered on its sheet carries `answer` {by, at, words}: listed
  with his words, counted answered (Sam, 2026-10-21: *"the open asks on The Commons doesn't seem to record that I
  responded"*; #2329).
- **The tab** is `commons.js` (jsdom guard `tests/commons.test.js`, 77 checks), booted after
  `commons_progress.js` (step 1's shared module, whose date helpers it reuses); `npm run a11y -- cobi:commons`
  passes at both widths; UI pass ledger `cobi:commons`.
- **The Course row is SkyView alone** (Sam, 2026-10-18 20:40Z: *"the CCR should be the same as SkyView now,
  right?"*; 20:46Z: *"SkyView alone, since CCR is included as part of it"*): its one word is *Open SkyView*, the map,
  and every count on the row opens it. The Common Course Reference list left the COBI menu at 20:51Z through
  `supabase-migrate.yml` (`kb/receipts/cobi_nav_unified_courses_hidden_2026-10-18_s417.sql`, the rollback in its
  header; the run's receipt `kb/receipts/migration_cobi_nav_unified_courses_hidden_2026_10_18_s417_39165056506.json`;
  the session's SQL guard holds an UPDATE for that path): `cobi_nav` row `unified-courses` is `hidden`, the `skyview`
  launcher row kept. The tab and its list view stay reachable by deep link (`#unified-courses`,
  `#unified-courses/list`) and the Admin tab can show the entry again.
- The mock-up stays the design record: https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi (version 4;
  source `docs/visuals/2026-10-18-commons-mockup.html`).


## SkyJujube, 2026-11-04: retiring the Common Course Reference tab (a side session)

- **The inventory read what the module does at load.** `unified_courses.js` ran `consumeAuthHash()` as it loaded, for
  every tab: the hidden Common Course Reference landed every COBI magic link, and deleting it would have ended
  signing in. Its pointers (SkyView's three links, Quickstart, Subjects' *Fix on CCR*) were the expected part. The
  landing moved into `cpl_session.js` first (#2775).
- **Measured use sized the carry.** `kb_curation` by field, all time and the last 30 days, before porting anything:
  merges 23,143 / 0, renames 7,787 / 0, discipline 245 / 1, description edits and merge notes never. Three edits carried
  (#2776); the rest wait on Sam's call or retire with the tab.
- **The List's panel is the Courses workspace for a common course,** reached from any of its local courses. The card
  reads `unified_courses_data.js` the first time a panel opens (16,389 common courses in the browser file).
- **A panel's sign-in fold must not be a direct-child `<details>`:** the engine places the Title drawer before the
  first one, so the fold pulled the drawer into the common course. The screenshot showed it; jsdom passed.
- **Every view has an address** (asked in session, 2026-11-04): a sign-in link opens a new browser tab, so only the
  address carries the view back. 27 tabs now open the view their address names and report it (#2775, #2779).

## Moved from the lane (SkyBeacon, 2026-11-06)

Verbatim from `docs/reference/lanes/commons.md`, when the lane passed its 20 KB budget.

**Fable's advice, carried (2026-10-18):** complete differs in kind, so each row names the test behind its
count and no column sorts on a share; the machine stamp and the session stamp stay apart, each against a
declared cadence; a call has one source, which today is the run log, with the sheet's store a build item.

**RULED (Sam, Open Asks Sheet 95 card 1, 14:43Z, his own call, "build"; `cpl_memory`
`sam-sheet-95-rulings-2026-10-18`):** *"Yes, and include Common Subjects in the mix."* Step 1, the shared
Progress module (`commons_progress.js`, S419, #2237), is on main; the Commons tab came next on Sam's
20:10Z word. What remains of the order: a run log per project written at checkpoints, each reference's
Progress view (Exhibit, Course, CR, Subjects) from the module, each with its definition of complete on a
card for Sam.

**Step 3's Progress views, Subjects (S425, #2260), Exhibit (S436) and CR (S437), with Sam's keep rulings (Sheets 107 and 108):** the record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*). Each host brought a 60-line spec to the shared module and needed no change to it.

## S604 SkySculptor (2026-11-08): the first view opens on one batch

- **Reuse the queue a mock redraws.** COBIx's mock drew Keep, Change and Park cards inside the Commons; Another look in
  Exhibits already had the six cards and their saves. *Start* opens a capped batch there (`#exhibits/another-look/batch`)
  instead of a second card screen.
- **A capped headline must open a capped batch.** The first version capped the count at six and opened the whole queue;
  COBIx caught it. The batch is fixed for the visit, has no bulk acceptance, and ends on a stop screen.
- **A nightly file is stale after the first save.** Exhibits now reconciles the sweep with `kb_curation` saves written
  since its `generated_at`; a fold onto another title does not count as a decision.
- **Keep the house rules over a mock's look.** Underlined-word controls, no arrows, and figures from files: the mock's
  filled buttons, arrows and example times were illustration (COBIx agreed on #2921).
- **A palette lives in two places.** `commons_look.js` mirrors `commons.js`'s tokens and `commons_look.test.js` pins them;
  a new token goes in both.

## 2026-11-06 — the first view, from Sam's recording (moved from the lane, S611)

Moved verbatim from `docs/reference/lanes/commons.md` at the S611 checkpoint (the lane was over its 20 KB budget; it states current truth).

**FIXED: the first view, from Sam's recording (SkyBeacon, 2026-11-06, #2857).** Sam: *"I don't think the various items
and procedures are updating and wired properly."* (1) Details: a completed decision sheet's line widened its cell over
*Last run* and past the card (3,414px in a 1,920px window) because each Details list is a grid with an auto column; one
`minmax(0, 1fr)` column cuts it with its ellipsis. (2) Subjects: the card's 30 scan findings were 9 weak mnemonics Sam had
noted on Nov 5 and 21 anchor entries keyed off a Common SUBJ that changed; a recorded note now settles a weak mnemonic
(`cs6_mnemonic_noted`, `kb/_csr_trail.py`), and the anchor findings are their own re-key item beside the identity codes,
on the card and the Subjects page (one skip list). (3) Mark done and the done marks: the card read a lapsed reviewer token
as signed out, so Sam's Monterey mark (saved on CPL Pathways, 19:29Z) never left the band; it now renews first and re-reads
on the keeper's announcement ([`reviewer-session-lifetime`](reviewer-session-lifetime.md)). The write stays reviewer-only.
**COCI Lookup is named Courses and Programs** (Sam, 2026-11-06, #2858); the tab key and every `#coci-lookup/...` address
stay.

## 2026-11-08 — S611 SkyTadpole: the Exhibits Queue and the panel trail

- **A lens is a set of entry points, counted from the set it opens.** The Queue (#2933) holds no list of its own. Each
  entry reads the count from the same eligibility set its word opens: Review's `stepCount`, the List engine's own
  `filterCounts` (exposed for this, so the Queue never restates a filter), and the capped batch counted without fixing
  it. A headline that counts a different set than the one it opens is the failure COBIx named on #2921.
- **An unread count shows no number.** The List's `uncounted` filters (the outcomes match, CPL-AI, titles that have left
  MAP) have no count until their file loads; the Queue says so in words rather than print a 0.
- **Lane prose cannot say the lens's name.** The open-asks builder reads `NEEDS SAM` case-insensitively in every lane
  file, so a lane line naming the lens *Needs Sam* broke `check_generated.sh` as an uncovered ask. The lane says *the
  calls for Sam*; the rendered UI keeps the ruled word.
- **`all:unset` wins a tie.** A width rule for the lens words lost to the later `button.exh-w { all:unset }` at equal
  specificity, so the a11y run still measured "All" at 17.8px; `button.exh-w.exh-qw` fixed it. Same in the panel trail:
  an inline link is 16px tall until it is `inline-block` with a 24px minimum.
- **One shared change, every List.** The trail (#2934) is a spec field on the shared engine, so the four Commons Lists
  with a panel got it from one renderer and one test.

## The CCR tab's inventory (moved from the commons lane, S612, 2026-11-08)

The inventory found `unified_courses.js` landing every COBI magic link (moved into `cpl_session.js`, #2775) and writes curators had stopped using (`kb_curation` on 2026-11-04, all time / last 30 days: merges 23,143 / 0, renames 7,787 / 0, discipline 245 / 1; description edits and merge notes never).

## S612 SkySunflower (2026-11-08): the anchor re-key applied; the CCR's seed disciplines get two second signals

**The anchor re-key (Sheet 171 card 4, #2938).** `kb/_anchor_rekey_apply.py` moved 20 curated anchor keys in
`kb/common_courses.json` and 21 crosswalk pointers. 15 kept their number, 5 took the lowest never-used number on DIES or
PARA, and the three HOSP keys stay with the curator. Two lessons:

- **A pending map that names an anchor key may have moved another record.** The S611 dry run read AUTD M10FX and FY as
  re-keys the 2026-11-05 recode had decided. The 2026-09-04 prefix fold had put two HVAC singletons on the ids the
  Z-band retirement gave the diesel anchors the day before; the recode moved the singletons. Following the map would
  have merged Diesel Engines with an HVAC course. The apply's gate (no new key may be a live record) caught it; the dry
  run now calls a re-key onto a live id a collision.
- **An era stamp cannot sit inside a flat id-to-record file.** `excel_to_dashboard.py` walks every entry of the
  anchor, so `_rekeyed_through` lives in `kb/common_courses_era.json` and the dry run reads it from there.

**The CCR's seed disciplines (Commons ruling 4; Sheets 173 and 174; #2940).** The auditor's largest person item is
14,523 cards whose discipline is the Phase B seed. Two candidate checks fail as second signals: the subject map (the
seed was itself a subject-code heuristic) and the CSR's local subject variants (tallied from these same cards). TOP
corroborates under its standing rule: of 12,504 uncurated cards, it agrees on 4,100. Sam asked, on Sheet 173, for
course descriptions, SLOs and objectives instead or alongside. Descriptions cover 8,286 cards against TOP's 5,768; SLOs
reach thirteen colleges. `kb/_ccr_desc_signal.py` (stdlib TF-IDF, trained only on curator and subject-map placements)
is right 88% of the time held out at a clear margin and confuses a discipline with its parent (Business, Accounting).
With TOP outvoting a lone differing description: 1,964 confirmed by both, 1,823 for a curator; Kinesiology 627 and 8.
The curator-ruled seed cards are a poor accuracy test: curators set a discipline mostly to change one, so that sample
is nearly all changes. Sheet 174 asks whether to confirm Kinesiology's 627.

**CI (COBIx #2927 item 2, #2939).** Loading `cpl_funding.js` costs 13ms; a funding render cost 5.7s, a third of it
jsdom's `window` getter hit from `base()`. One cached reference halves every funding test. The remaining cost is the
model recomputing `priorities()` per college.

## S614 SkyMilkomeda (2026-11-09): Discipline in doubt, a ruling that teaches the procedure

- **Read the verdict function before naming a set.** I first listed Kinesiology's eight TOP-disagree cards as the
  re-check's "8 for a curator". `combine()` sends a card to a curator only when the description differs; the TOP-only
  cards are `unsettled`. Sam ruled on the wrong list for a minute. Recompute a named count from the code that made it.
- **A ruling and its reason are two writes, reason first.** The reason row carries the signals the person saw, so a
  session writing the rule later reads what the ruling answered, not today's file. The discipline goes through the
  List's one write (`ccSave`), so no second discipline path exists.
- **A standing ruling shapes the queue even when a person asks to see more.** The job shows the TOP-only cards Sam asked
  for; the Commons queue counts only the description's, because TOP waits on no one (2026-11-04). The guard
  `commons_jobs_filtered` (5) caught the first draft.
- **A loader's own throw must reach its catch.** `.then(ok, fail)` does not catch a throw inside `ok`; the jobs test
  failed on an unhandled rejection until the doubt read used `.then(ok).catch(fail)`.

## Moved from the lane, 2026-11-09, SkyCigar

**To do, later (Sam, 2026-10-26 ~15:00Z, S490):** *"The Commons program numbers don't match the PR tabs numbers. Need
to make sure the numbers on all tabs on the commons match the commons summaries."* His two screenshots, the same morning:
the Commons' Program Requirements card read **13,194 of 20,282 complete at 114 colleges** (3,731 failing a check, 3,357
with no record; figures read 6:16 AM PT), while the Program Requirements tab's Progress read **17,529 records read at 114
colleges** and **3,274 fail a machine check** (7:38 AM PT). The two count different things (complete active programs
against records read) and from different reads, but neither page says so. Make every tab's figures and the Commons
summary agree, or name the difference on both. **The Program Requirements pair is done (S560, #2721):** both pages
headline complete active programs of COCI's active (S558); *Needs attention* now counts active programs whose record
fails, the card's unit, where it had counted every failing record; and each page names the one difference left, timing
(the card counts the records committed at the last checkpoint, the tab reads live: 13,553 committed against 13,542
live on 2026-11-03). **The other four pairs, checked (S561):** Course reads the Commons row itself and CR reads the
same committed worklist build, so both agree by construction. **Subjects disagreed:** the page counted 17 scan findings
to confirm or note and the card 16, since the card counted two rules and left out the dead-format anchor; both now
count one set, the findings needing judgment less the ones another item counts (`ASK_SKIP` in `canonical_subj4.js`,
`CSR_ASK_SKIP` in the builder; the page also lists a missed alignment, as the card does), and each names its timing
(the card counts the daily sync, the page reads the picks live). **Exhibits would have counted held titles twice** on
a night the procedures run held any (live from the review file, and again from the Commons row); the page now drops
the row's held and conflict copies once the review file is read, and both pages say why the card's list is shorter
(the page adds the tab's own queues). Guards: `tests/csr_progress.test.js` (79), `tests/exhibits_progress_page.test.js`
(43), `tests/commons_status_build_test.py` (85). The same screenshot shows both Progress cards reading *Could not be read*
(`coci_college_programs` answered 500): check that read first, since an empty denominator can move every figure.

## The Docket, steps 1 to 3, and the morning's security asks (SkyCigar, 2026-11-09)

- **A committed status file cannot close a loop a person just finished.** `next_batch` was rebuilt three times a day, so Sam's six decided cards still read open. The fix counts from the saves themselves (the keys a decision writes, read since the sweep was built) and from the visit's own marks; the file supplies only the keys (#2966).
- **Reuse a write surface before adding one.** Docket rulings are `kb_curation` rows under a prefixed key, like `ccr_procedure_request`; the daily fold keeps only a fixed list of fields, so a new field cannot leak into the reference. The "Process my rulings now" security already existed twice (`workplan-rebuild`, the Worker's `/trigger`); the Edge Function copy took a reviewer-only check and the existing dispatch token (#2968, #2969).
- **An automated applier's safety lives in what it refuses.** The processor runs only commands the reviewed cases file names, only allowed scripts, only with `--expect`; a failed step stops the rest and marks the case `partial`, never re-run. Tested in a temporary git repo with a stand-in script.
- **A public file never carries an address.** Cases name an addressee handle; the processor's `done.by` names the ruling key, not the reviewer.
- **A relayed ruling and a direct one can disagree in time.** COBIx relayed Sam lifting call 9 at 13:10Z; Sam asked at ~14:25Z to put it on a sheet. One plain question settled it (lifted). Ask; do not pick the relay.
- **Measure grants before revoking them, and roll back to the measurement.** The TRUNCATE rollback restores the exact per-table grants read just before (91 anon, 92 authenticated), not a blanket re-grant.
- **A UI that logs on return logs refusals.** The CSM workspace logged "Accepted" before the save read back; the funding tab's own email waited correctly. The action now answers with the re-read (#2973).

## Moved from the lane (S624, 2026-11-10; the lane stood at 1.43 times its budget)

Five settled paragraphs, verbatim; the lane keeps one line for each.

**LIVE: the Docket, steps 1 to 3 (#2963, SkyCigar, 2026-11-09, each on Sam's go in session).** *Batches* (#2966): `kb/status/commons.json` `batches` runs Another look, the open cases, run-log calls on sheets no case carries, then Sam's queue jobs; `next_batch` is the first. The page counts Another look from the saves since the sweep, so the last card decided reads *Done* and the next batch comes up without a reload. *Cases* (#2968): `kb/docket/cases.json` (served on Pages: an `addressee` handle, never an email; `dr` names the owning register row; `plans` give each choice's commands with `--expect`). The Commons rules one in place at `#commons/case/<id>`; the ruling upserts to `kb_curation` as `_DOCKET::<id>`, field `docket_ruling`, under the reviewer's own name. Sessions read rulings beside the sheet stores (`kb/_docket_rulings.py --sql`, then `--rows`); Sheet 175 is the first case, and a reply on the sheet or the case counts. *Processor* (step 3): `kb/_docket_process.py` runs nightly at 05:33 UTC (`docket-process.yml`, behind the daily build) or from *Process my rulings now* (Edge Function `docket-process`, reviewer only; deploy via `cpl-chat-deploy.yml`). It runs only the cases file's commands for the choice, only `ALLOWED` scripts, only with `--apply` and `--expect`; writes `kb/docket/receipts/` with the undo; marks the case `done`, or `partial` for a session to finish; a choice whose plan is words stays for a session. Every case shows to any signed-in reviewer until step 4's reviewer-only table. **RULED (Sam, in session 2026-11-09 ~14:55Z, on Open Asks Sheet 176 card 2: *"Lifted: build step 4"*; COBIx relayed the same at 13:10Z on #2963):** call 9 is lifted for the Docket. NEXT, step 4: one Supabase table for cases that are not public (Open Asks cards), SELECT only to `authenticated` passing `is_allowed_reviewer()` in the RLS policy itself (signup is open), `anon` no grants, no TRUNCATE/REFERENCES/TRIGGER, writes only by the processor's service role or a check-then-insert RPC; Governance surface map and the privacy ADRs first (Rule 10 a3); sources stay in the vault; the claude.ai sheets run until the table carries two cleanly; hold-list cards never reach the processor. Open question from COBIx (#2963, 13:10Z): the processor opens a PR per run instead of pushing to `main`; a `GITHUB_TOKEN` PR triggers no CI, so it needs a dispatch token or a merge path decided first. Guards: `tests/commons.test.js` (*docket*, *case*, *process*), `tests/docket_rulings_test.py`.

**LIVE: the CPL Commons first view (S552, 2026-11-02, #2697).** `commons.js` draws the locked mock as the tab's first
view: the decisions waiting on Sam lead (every open call from the run logs, each naming its card), then one card per
common reference, your decisions first, then by how far along, then the builds; a card carries its Common name, one
line of what, the headline pair with its meter, *Your decision* (the first open call, linked to its sheet), *Recently*
(the run log's latest change, first sentence; a row with no run log shows its machine stamp), *Next* (the run log's
next step), its opening words and *Decision record*. Three filter words (*All eight*, *Needs you*, *Building*) last the
visit. The rows of 2026-10-18 (known issues, settled procedures, the Decision Sheet Library, the last run, Sam's order
and fold) stay under **Details**, one word away; a card's *Decision record* opens them at its row. **The three building
references** (Common Credentials, Common Outcomes, Common Skills) are `building` rows in `kb/status/commons.json`, written
by `kb/_build_commons_status.py` from `kb/it_ai_credential_catalog.json` (`_stats`) and the committed
`kb/course_outcomes/*/read_*.json`: a count with no universe, no meter, the file's stamp. **Malone's look** (Sheet 158
card 2): the palette lives once as `--cmn` tokens on `#tab-commons`; the dark theme maps every role onto a First Light
dark token (`:root[data-theme="dark"] #tab-commons` and the OS-dark media query), so no color is invented there. Inter
loads once from Google Fonts. Guards: `tests/commons.test.js` (108), `tests/commons_status_build_test.py` (83).

**The opened page, one renderer (S556 to S559).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws
the mock's opened page for any reference: the progress line over one denominator, *Needs attention* with an action each,
and three question groups over that denominator; an unread count says *Could not be read*. First Light tokens. **Every
reference carries it** as a **Progress** view, one word from the List the card opens (Sam, 2026-11-03: *"open the List view as the default for all the commons actions"*; held exhibit titles keep Review, Courses keeps SkyView):
Exhibits `#exhibits/progress` (questions read `credCounts()`, the tiles' own counts), CR Reference
`#cr-reference/progress`, Subjects (`canonical-subj4`), CPL Pathways (`#program-requirements`, denominator COCI's active
program) and the Common Course Reference in COCI Lookup (`#coci-lookup/progress`, the row's pair: ready of the auditor's
cards). Guards `tests/exhibits_progress_page.test.js`, `cr_progress`, `csr_progress`, `program_requirements_page`,
`coci_progress`; a11y targets `<view>-progress` and `-dark`. Per-view detail: `docs/commons_lessons.md` (*Moved from the
lane, 2026-11-03*). **Complete is the auditor's *ready*** (Sam, Open Asks Sheet 160, *keep*, 12:44Z 2026-11-03): a common course counts
before a person confirms it; a confirmation is an attribute the reference gains, counted beside it. His words are in
`docs/commons_lessons.md` (*Sheet 160 answered*). **Confirmed by a person, on all five** (Sam, S565: *"yes to both, build them for all four"*): each row's second `pair`,
a line on the card and under each Progress bar. 2026-11-03: Programs 32 (synced daily, `kb/_sync_program_checked.py`),
Exhibits 1,173, Courses 957 (a save on the card or placing a course into it), CR 97, Subjects 122. Detail in the lessons (*The confirmed count*).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List view from a spec the tab
hands it (Sam, 2026-11-01: *"This new list view is so helpful that I want one now for each of our Catalog Commons
groups"*). Exhibits (#2656), the Common CR Reference (#2657, with your flag #2659), Subjects (#2658) and Program
Requirements (#2660) run on it. **The Courses List is the COCI Lookup tab's Courses view** (#2670, live): 141,738
local courses banded by today's M-ID (from `unified_courses_members.js`, never the extract's older column), Open in
SkyView on each band; an M-ID move is a re-mint, done in SkyView. A course's panel carries its common course's card and, for a signed-in reviewer, Rename, Set the discipline and Confirm, carried from the Common Course Reference tab before it retires (SkyJujube, 2026-11-04, `tests/coci_list_cc_card.test.js`). Sam, 2026-11-01 ~23:02Z: *"WE have the
COCI lookup tab in COBI...maybe courses in that?"*; SkyView stays the map alone. The engine filters before it sorts and
sorts on per-column ranks (a settled finder keystroke 228 ms at 141,738 rows). A change to the engine reaches every List: a List spans the window and its table scrolls in its own box
only when the window is narrower than its columns (#2661, Sam: *"full screen width and allow for a horizontal scroll
bar when needed"*). **All five Lists carry the line, the fold and the side panel** (2026-11-04). **All five carry Check alignment** (Sam, 2026-11-04: *"We could use that feature on all our commons list views"*; S578
added the last three): one audit and one recommendation beside the edit, reading what the page holds and writing nothing.
Subjects audits a typed code, Exhibits a title and issuer, CR a reference (its applied official name, a cited course its
wordings never reach, another group's name, a wording's unit count up front), Courses a name (its local courses' titles,
its discipline's other common courses) and a discipline (where colleges file the same subject codes; a TOP-sourced one
corroborates only), Programs a record in *Your reading* (its machine checks, COCI's title and units, the same award under
the same CIP elsewhere). The shared text tests are `CPL_COMMONS_LIST.alignNorm` and `alignClose`. Guards
`tests/cr_list.test.js` (12), `tests/coci_list_cc_card.test.js` (7), `tests/program_requirements_list_record_port.test.js` (16).

**LIVE: Discipline in doubt, a ruling that teaches the procedure (S614, 2026-11-09).** Sam, in session: *"Can you put these in the appropriate part of the commons process and make a built in way for me to rule on them so our procedures can be adjusted to handle similar edge cases? ... I suspect other edge cases will emerge as we begin to use the subjects more intensly."* It lives in the Courses reference (a common course's discipline is the Courses List's one discipline write; Subjects maps a discipline to its code and is complete). `kb/_ccr_seed_recheck_dryrun.py --doubt`, daily in `daily-dashboard.yml` after the curation sync, writes `kb/ccr_doubt.json`: the active discipline's (`kb/ccr_procedures.json` `active_discipline`) cards whose description reads elsewhere, then those TOP alone doubts, labeled as TOP's word. `#coci-lookup/list/doubt` lists them; the panel shows both signals and takes a ruling (keep, move, keep and also list as a second discipline, not sure), its reason in plain words and *Use this reason for similar cards*. The reason saves first as a `kb_curation` `ccr_procedure_request` row (`_CCR_PROCEDURE_REQUEST::<iso>-<mid>`, DR-25), then the discipline through `ccSave`. **Also list as (S624, issue #2981; Sam, 2026-11-09: a student can take the course as Kinesiology or as Psychology, depending on their major):** the ruling keeps the home discipline and writes one `cross_listed_disciplines` row (comma-separated, added to any the course already lists; one choice clears them); the home and the M-ID never change, an unconfirmed home is confirmed in the same write, and the reason row reads `ruling: "crosslist"` with `also` and `also_was`. *Rule again* adds one to a heading already kept, so the 2026-11-09 keeps need no redoing. Two MQ names carry commas of their own (*Sign Language, American*; *Air Conditioning, Refrigeration, Heating*): the value stays comma-separated and `kb/discipline_list.py` splits it against the MQ names, in the generator's `xdisc_of` too (COBIx on #3025; the plain split had read three phantom disciplines on the one umbrella record that lists them). Guards `tests/coci_list_doubt.test.js` block 10, `tests/discipline_list.test.js`. The Commons queue counts the description's cards under *unsure* (Kinesiology: 8; TOP is no person's item, Sam 2026-11-04). NEXT: when a ruling marked for similar cards arrives, a session reads the rows (MCP), writes the rule into `kb/ccr_procedures.json` switched off, measures the waiting cards it would settle with the dry run, and switches it on with Sam's word; the bulk settle then needs a `--try`, a receipt with before-values and an `--undo` (Rule 10 a2; COBIx on #2948), none built yet; then the next discipline. COBIx's review of #2948, worked in its follow-up: a ruling names who made it only to a signed-in reviewer (read with their token; signed out, "by a reviewer"); *Use this reason for similar cards* starts unticked; the Courses List's panel carries the trail (CPL Commons / Courses / the job / the course). The ruling stays a select (a choice among 150 disciplines is an input, like the discipline select beside it). Open, table-wide: `kb_curation`'s read policy is PUBLIC with `true`, so the anon key reads every row's `reviewer_email`, the older panel reads included; asked of Sam in session 2026-11-09. Guards `tests/coci_list_doubt.test.js` (23), `tests/ccr_doubt_test.py` (9).

## Moved from the lane (S639, 2026-11-11)

**LIVE: a stalled routine becomes a queue item (S624, the path mock's build).** `kb/status/commons.json` `queue.stalled` names a reference whose machine stamp is older than 1.5 of its cadence (`stopped`) and a routine-carried issue that counts as many items as its latest reading at least seven days old (`not_shrinking`). Each build records the day's routine counts in `kb/status/commons_history.json` (one entry a UTC day, 60 kept; both workflows commit it); the file was seeded from main's own commits back to 2026-11-04, the day issues first named a carry. The Commons tab draws *A routine has stalled* as a fifth box in *Waiting on a person* only when the list holds an item. Seven days and the 1.5 are constants in the builder (`STALL_DAYS`, `STALL_SLACK`); a backlog that grows because its source grew also reads as stalled, which is the team's call to look at. Tests: `tests/commons_status_build_test.py`, `tests/commons.test.js` (stalled 1 to 5).

## S641 (SkyOtter, the conductor, 2026-11-12): the ASE slice, read-only first

- **The first slice of the Commons plan's v2 Agreed final shipped read-only** (#3152, Sam's go on Sheet 181 card 10):
  52 ASE certifications by 120 colleges, 6,240 pairs, 18% with an answer. The parts that need a write (Request CPL
  Review) or a public surface waited, so the slice could ship on the go it had; a write surface goes through Rule 10 a3
  first.
- **It conflicted on `kb/dependency_map.json`** after two other map-touching PRs merged cleanly in sequence. Merge
  map-touching PRs one at a time and expect a `main` merge on the rest.

## Moved from the lane (S642, 2026-11-12)

Moved verbatim from `docs/reference/lanes/commons.md` to make room for re-clustering Step 1.

**The Courses List keeps the row you are ruling on (S623, issue #2995; Sam, 2026-11-09: *"the list view shifts focus to the top row every time you take action in the sidebar and the listview is not obviously highlighted as to which row you're acting on. the save ruling and other buttons are a bit jumbled together."*).** In the list engine (`commons_list.js`, so every List gets it): a redraw asked for by a panel (`api.redraw`, now `redrawKeep`) puts the table's scroll back and brings the current row into sight; the row whose panel is open carries `aria-current` and a bar (`<prefix>cur`), and its band carries one too (`<prefix>bandcur`). In the Discipline in doubt panel (`coci_lookup.js`): the ruling is one box with *Save the ruling* on its own line, the edits sit under *Or edit the common course*, and *Open … in SkyView* has its own line. Guards `tests/coci_list_doubt.test.js` (9).

**The Courses List's filter words sit in two groups (S622, #2998, issue #2997; Sam, 2026-11-09: *"put them in order of priority for me to act on ... categorize the ones that need action and the others that are just convenient filters"*).** `commons_list.js` takes an optional `filterGroups: [{ label, ids }]`: each group on its own line, its label first, its words in the group's order; a List that sets none draws as before. The Courses List: **To do** (Discipline in doubt, On a stray identity code, No catalog description, A unit anomaly, Discipline no seed has touched), then **Browse** (the ten census words). The rule holds for every List that gains job filters. Open beside it: #2995, keep the current row in view after a ruling.

## Moved from the lane (S644)

Verbatim from the lane's *The CCR, next (ruling 4)* paragraph, the three applies it recorded:

**Applied (S615, 2026-11-09), on Sam's *confirm* (Open Asks Sheet 174 card 1, 02:25Z):** `kb/_ccr_seed_confirm_apply.py --discipline Kinesiology --expect 627 --apply` stamped the 627 cards `discipline_source` `description_and_top` (confidence 0.8, `_seed_confirm_from` names the ruling and both signals); the discipline never changes. The auditor scores the source inferred-high, so they leave `seed_untouched_discipline` at the next daily audit. Receipt `kb/ccr_seed_confirm_out/2026-11-09/kinesiology.json` (before-values; `--undo` restores the file byte for byte). Guard `tests/ccr_seed_confirm_test.py`. The 8 are the *Discipline in doubt* job. **Applied (S621, 2026-11-09), on Sam's *five* (Open Asks Sheet 175 card 1, 15:14Z; also the Docket's first case, now `done`):** the same apply per discipline, `--ruling` naming the reply: Music 250, Fire Technology 169, Mathematics 128, Child Development/Early Childhood Education 107, English 99 (753 cards). Receipts `kb/ccr_seed_confirm_out/2026-11-09/<slug>.json`, each reverses alone with `--undo`. Their 108 curator cards stay in the *Discipline in doubt* job. **Applied (S634, 2026-11-10), on Sam's *all* (Open Asks Sheet 180 card 1, 19:34Z):** the same apply for every remaining discipline, 26 disciplines and 584 cards as the dry run named them, each with its receipt under `kb/ccr_seed_confirm_out/2026-11-10/<slug>.json`; each reverses alone with `--undo`. **DECIDED (S634, 2026-11-10, under decide-and-record):** Kinesiology's 10 cards that came to qualify after S615's 627 took the same stamp on Sheet 174's ruling (receipt `2026-11-10/kinesiology.json`). The recount after the apply finds no confirmed card left in any discipline; the cards where the two signals disagree stay in the *Discipline in doubt* job.

And the confidence count's paragraph, verbatim:

**LIVE: the confidence count (S573, 2026-11-04, Sam: "start on the confidence count next").** `kb/status/commons.json`'s `confidence` says what a person did with each procedure's work afterward: the Exhibit procedures' receipts (`kb/cer_procedures_out/saved/`) against `kb/unified_titles.json`, the nightly Subjects confirm's (`kb/csr_out/confirm/`) against the seed. A result a person looked at is kept, renamed with its family (its old name is gone and its siblings moved together), or moved (a correction). 2026-11-04: of 1,178 titles placed, a person looked at 94, kept 23, renamed 71, moved 0; none of the 13 confirmed picks looked at yet. The tab shows it as *How far to trust the procedures*. **The CR rule rungs joined it (S624, #3027):** the groups a rung 1 to 4 rule folded (`kb/cr_reference_worklist.json`) against the curator's decisions (`kb/receipts/cr_reference_decisions_*.json`, which matched the live table's 30 rows on 2026-11-10), one line a rung. Confirmed with the rule's own wordings is kept; confirmed with wordings a person added from another group is *widened*, its own state (COBIx's finding: the rule set none wrong and missed some); a wording set aside or *not a topic* is moved. 2026-11-10: of 226 groups a person looked at 20 (rung 1: 9 of 113, rung 2: 11 of 26, rungs 3 and 4: none of 87), kept 0 as the rule left them and widened all 20. The 20 are Sam's 2026-09-20 sheet verdicts on fold proposals, matched to today's groups by key; no person has yet been asked to review a rung's output as such, so the count says the rungs under-fold and says nothing yet of whether they over-fold.

## Moved from the lane (S647)

The re-clustering paragraph as it stood in the lane before S647's checkpoint, verbatim:

**IN PROGRESS: M-ID re-clustering by outcomes, Step 1 (S642, issue #2962; #3165; revised #3182 `3189c403`).** Sam, relayed by COBIx (#3111 comment 6825682304): *"yes! make sure this work is in our moonshot plan and properly prioritized in it. ... let's get sky in the game on this"* (`sam-outcomes-first-mid-clustering-in-plan-2026-11-12`); on #2962 (comment 6825683021): *"yes, let's roll!"* (`sam-mid-reclustering-step-1-go-2026-11-12`). Step 1 writes nothing: `kb/_mid_outcomes_compare.py` reads the committed SLO and objective reads (17,349 rows, 13 hosts; no PLOs harvested) against each M-ID's members and classes the 1,857 M-IDs with two or more members holding text, each at Sam's three match levels; an SLO never overrides alone, TOP and units are shown and read by nothing. **Revised in S643 on COBIx's four findings (#2962 comment 6829696579):** one district is one voice for confirmations, splits and merges (districts from the committed identity crosswalk), which re-rates the classes to 678 confirmed (33 strong), 760 split (6 strong), 71 merge candidates (17 strong), 348 not enough text; ITIS 140 falls to a partial split and BIOL M1094/M1095 to a limited merge, both one RCCD outline. Each M-ID carries two exhibit-reach columns from `unified_courses_aligned.js` (#3111 comment 6827702046): credit by exam titled from the M-ID, which is a split's reach, and certifications, shown and not counted. No committed per-M-ID potential-CPL (student) measure exists, so none is shown. The cases for Sam are picked from the strong and partial splits and merges by that reach first: AJ 160, FIRE 130 X with FIRE M1274, REAL M1038 with M1040, MATH M1036 with M1044, MUS 130, BUSI M1228. MATH 130, PH 101, AGAS M1136/M1140 and BSOT M1209 stay as examples of the two candidate rules; BSOT M1209 is likely a rename plus splitting out BSOT 150, and the Honors rule asks Sam: one M-ID, or two with a declared equivalence. A structural check on subject codes alone (`kb/reference/subject_discipline_map.json`, never TOP) flags 921 members in 321 M-IDs. A live read that returns zero rows stops the run. Report `kb/status/mid_outcomes_compare_2026-11-12.md`, rewritten in place. **DECIDED (the S642 conductor with COBIx; `d-reclustering-placement-s642`):** the work sits under the plan's priorities 2, 3 and 7; a second pass with a model is priced before it runs. **DECIDED (the S643 conductor with COBIx; `d-reclustering-district-guard-s643`):** one district is one voice on splits and merges, and the cases for Sam are chosen by credit-by-exam reach. **NEXT:** (1) Sam's rulings on the six above and the Honors question ([Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) card 6; Sheet 185 card 9's six are superseded); (2) price the model pass: a statewide read is outside the $40 limits, so the price goes to Sam first; (3) a potential-CPL column, from an aggregate the runner can read; (4) the Leadership outlines: Merced (for AGAB M1002) and Canyons inside the SLO $40, and a read-only committed export of the ACE Leadership and Supervision rows of `map_college_cr_unit`.

**The harvest's throughput (S644; Sam: *"we need to increase our throughput"*).** Program Requirements gained a gap census (one cause and one lever for each of the 6,758 active programs without a passing record, #3189) and a wave runner (up to eight colleges in one dispatch, $40 a college with a hard stop on actual cost, #3191); detail in [program-requirements-harvest](program-requirements-harvest.md), *Throughput*. **DECIDED (`d-cobix-offers-specialist-bots-s644`, Sam's go relayed by COBIx):** COBIx scouts sources, spot-checks five records after each wave and ranks work by blast radius, and two read-only bots (a source scout and a wave checker) will work to the contract on #3111 comment 6840743191; not built yet.


## Moved from the lane (S647 afternoon)

Moved verbatim by the documents worker at the second S647 checkpoint, to keep the lane under its budget. Each still stands.

**RULED (Sam, Open Asks Sheet 158 cards 2 and 3, 15:01Z 2026-11-02, his own call: "malone", "rename").** The CPL
Commons first view ports into this tab in **Malone's CPL/AI look**, the first COBI tab to carry it (First Light stays the
rule for the other tabs; this is the one departure inside COBI, beside the public pages' departure of 2026-10-24). The
side menu reads **CPL Commons** (`cobi_nav` row `commons`, one guarded UPDATE, receipt
`kb/receipts/cobi_nav_commons_label_cpl_commons_2026-11-02_s552.sql`, the rollback in its header).

**LIVE: the one queue (S573, 2026-11-04, Sam: "yes, start building the one queue").** Every issue in `kb/status/commons.json` names its `carry` (`routine`, or a person's reason: `no_procedure`, `unsure`, `reaches`, `keep_call`); the file's `queue` groups the person items, and an issue naming none lands under `unsorted`. The tab draws it as *Waiting on a person*, under the decisions band. Guards: `tests/commons_status_build_test.py`, `tests/commons.test.js` (queue 1 to 10).

**RULED: a count opens its job, filtered; the queue in process order; TOP waits on no one (Sam, S574, 2026-11-04).** *"the links on all surfaces should open to the filtered view of the job needed"*; *"put the procedural things to act in a process order within their cards"* (subjects, courses, exhibits, CR, programs); TOP disagreements *"are input unchecked by colleges. CIP from the COCI programs records should be more dependable"*, so they left the queue. Guards `tests/commons_jobs_filtered.test.js`, `tests/coci_list_jobs.test.js` (the Courses jobs and the strays). **The Courses List first, SkyView beside it** (Sam, same day: *"I want to be able to use list or skyview. Skyview is still too buggy to make the main workspace"*), reversing 2026-11-03's SkyView first. Exhibits' 622 open `#exhibits/list/left`. **The look on every Commons view** (S574): `commons_look.js` gives the five references' tabs commons.js's palette and, in light mode, maps First Light's roles onto it (dark keeps First Light's); `tests/commons_look.test.js`, `npm run a11y` passes on all 13 Commons routes.

## S647 afternoon (SkyPipit, the conductor, 2026-11-13): the Commons data dashboard complete

- Sam's go, about 14:30Z: *"looks like we have more room in t his session, can we complete the college data collection dash?"* Slice 2 (#3231), the data (#3232) and slice 3 (#3236) merged, each after COBIx's read and a review of three or four agents.
- Every review found real faults after COBIx had cleared the PR: an inert leak on Back, two false TBA reasons, a session renewal replaying a stale college (slice 2); exception text that could carry the key into a committed file, a short read that could replace a good block, a false privacy sentence in the dictionary (the data). A claim about the data gets checked against a file: program outcomes ARE in committed records (`record.program.outcomes`, for example norco 40135), and both a worker's TBA reason and COBIx's note said otherwise until a reader opened one.
- Three PRs that each regenerate the dependency map cost two extra sync rounds. Merge the first, then have the others merge `main` before their last test run.
- The first live read (run 43456843640) matched the 12:37Z headline exactly on Active (20,282) and passing (14,525) by another route. Two figures do not reconcile yet: 88,736 courses on Active programs against 89,192 in the harvest row, and 13,293 SLO courses against 12,815. Neither is quoted outward until they do.
- A feature with no source is a line under "Coming next" naming the source it waits on, never an empty panel (`d-commons-data-coming-next-s647`).

## Moved from the lane (S648)

Moved verbatim from the data dashboard's LIVE paragraph when #3229 renamed the view College Data Collection, to keep the lane under its budget:

Sam's 2:53 AM PT words covered slice 1 (**DECIDED** `d-commons-data-slice1-on-relayed-go-s647`); his go for the rest, in session about 14:30Z: *"looks like we have more room in t his session, can we complete the college data collection dash?"* (`sam-complete-data-dash-2026-11-13`).

**#3219** (Sam, 1:52 AM PT, verbatim: "coci does not have reliable course descriptions, especially for noncredit so we will need to add a procedure in our cor queue where we grab the slos and objectives to complete the description field when needed--this will really help with all those thousands of nc standalone courses we have in the system") is still open: a COR-queue step, not a go; Sam approves the PR.

**DECIDED** `d-student-boundary-wording-s647`: the dictionary's first privacy sentence was false; it now reads "Student records stay in MAP; COBI keeps counts." and names the boundary (pseudonymous rows pass through the runner and sit in reviewer-gated `map_student_credit` until the summarize-then-delete plan retires it; both ADRs).

## Moved from the lane (S648 checkpoint)

Verbatim from the lane, 2026-11-13.

**The first view opens on one batch (Sam's Commons rulings relayed on #2921, 2026-11-08, *"yes to all"*; S604).** *Your next batch* leads the page: Another look's open cards in Exhibits, six at most (`next_batch` in `kb/status/commons.json`, from `kb/exhibits_sweep.json`), with what the answers teach and when to stop; *Start* opens `#exhibits/another-look`, so the cards and their saves stay in Exhibits. Under it one line counts what people did with the procedures' work (placed, checked, moved elsewhere; *the rest are unchecked, not proven*), its word opening the trust table. The pools and the trust table start folded. A reference whose headline pair is all done reads *Complete* (Subjects, 147 of 147); its repair jobs stay in its issues. Kept from the house rules where COBIx's mock departs: controls are underlined words, no arrows, live data only.

**The batch is capped (#2923, S604, COBIx's finding).** *Start* opens `#exhibits/another-look/batch`: the first six open cards, fixed for the visit, no bulk acceptance, a trail back to the Commons, and a stop screen after the last. Exhibits reconciles the nightly sweep with `kb_curation` saves written since it was built. **Exhibits queue-first (S611, #2933).** A Queue view leads the Exhibits views at `#exhibits/queue/<lens>`: six lenses in the ruled order, each a set of entry points into a list the tab already holds, counted from the set that list opens. A failed read or the classifier's errors show as Blocked on Sky. Review stays the default view; Park is named visit-only. **The panel's trail (S611, #2934):** the shared List's side panel opens on `CPL Commons / <List> / <filter> / <row>` (spec `trail` in `commons_list.js`), set on Exhibits, the CR Reference, Program Requirements and Subjects; the List's word, or the filter's when one is on, is the underlined return and keeps the filter and the row's place. **NEXT (#2921):** the CCR (below); Subjects' 93 stray codes stay with the curator. Sam's path still waits on his reaction to the mock.

**DECIDED: every credential gets a Common SUBJ (SkyTamarind, S638, 2026-11-11, on Sam's in-session ask: *"add a check into that in our common plan and procedure so we can get those fill as automatically as possible"*).** Exhibits' List reads the subject as the Catalog does (M-ID and C-ID articulations, then a stored `subj_override`); its *No Common SUBJ* filter is where the Exhibit card's routine count opens. `kb/_exhibit_subject_fill.py`, a step in the nightly `cer-procedures.yml` (preview until a dispatch sets `subject_fill=on`), fills a blank from the credited courses (several colleges, then one, majority over half), else the issuer family (`kb/reference/issuer_family_subject.json`; ASE is automotive, Sam's MIL7 ruling), through the Common Subjects Reference; title words, TOP and CIP never decide; a family or cert link that disagrees with the courses holds the title. It writes `subj_override` and `subj_source` under `exhibit-subject-s638@bot`, insert-only, receipt first, `--undo` by cohort; a stored subject always wins. Governance DR-07 (the credential record's subject). The rest go to `kb/exhibit_subject_out/worklist.json` with a title-word suggestion for a later accept-all batch. Guards `tests/exhibit_subject_fill_test.py`, `tests/exhibits_list_subject.test.js`. First live run 21:41Z (run 43104720166): 747 filled, 362 left.

## S648 (SkyTanager, the conductor, 2026-11-13): College Data Collection on Sam's words, the course key, the re-clustering plan

Issue #3229 was missing from handoff 648 and Sam pointed at it; #3243 and #3247 carried his #3229 words (confidence and completeness up, review down). One live read reconciled the two figures: the course key, uppercased with spaces and hyphens removed (#3242). The re-clustering plan (#3245) measured Honors and held four cases whose official placements or license rules an outcome score cannot set aside; MATH M1044 would have carried a mis-filed lab articulation into College Algebra (eligible credits 19 to 4,866).

## Moved from the lane (S649 checkpoint)

Verbatim from `docs/reference/lanes/commons.md`; the lane keeps a summary and the DECIDED lines.

**The live read (#3232).** Job `live-counts` in `harvest-gap-census.yml` (`kb/_commons_data_live.py`) runs in Sam's `live-counts` environment, on `main` only, read-only (no table, grant, function or migration), and writes the `live`, `overall`, `dictionary` and `apis` keys; the `census` job stays the one writer and one push. First run 43456843640, committed `6e4b4c0d` at 15:58Z: 118 colleges, none unmatched; Active 20,282, passing 14,525 (both equal to the 12:37Z headline); overall mean 0.6293. **DECIDED** `d-live-counts-controls-s647`: an error class only, never exception text; the key stripped, refused if it holds whitespace; no output may hold a 20-character run of the key's signature; floors (at least 90% of the crosswalk's colleges, Active within 85-125% of the last good block, 15,000 with none); dispatch input `accept_active_shift`, one logged override that never waives a floor; the guard refuses a query naming `checked_by` or `corrected_by`; person tables read by HEAD count only. **DECIDED** `d-student-boundary-wording-s647`: the dictionary's privacy sentence; `docs/commons_lessons.md`, *Moved from the lane (S648)*.

**S649 (#3229, COBIx's item 1):** each cause opens its programs. The builder writes one file per college with programs still to pass, `kb/status/commons_data_programs/<slug>.json` (control number, title, award, cause, lever, the page the capture matched: the filed record's `source_url`, else the capture's page, else none). **DECIDED (review of #3261):** the causes, the lists and the asks come from the gap census's live read (`kb/status/harvest_gap_census.json` `programs_by_college`, the builder's `--census`; the census workflow passes the file it just wrote) where it holds the college, the row's `census_causes` and `census_basis` say so, and the committed-files census is the labeled fallback; the row's `causes`, `levers` and `gap` stay the committed files' own. **DECIDED (review of #3261, round 2; `d-data-collection-two-bases-s648`):** where the live census holds a college, the opened card's Active programs, Passing now and Still to pass, the list's Program requirements and Still to pass columns and the statewide Programs still to pass card read from it (`census_programs` from the live read's Active count, `census_gap` the causes' sum, `census_passing` the difference; `census_live` statewide equals the census's gap), so the causes sum to the figure above them; the capture's own figures (listed, pages found, extracted) keep the capture as their base under their own label, and a college without the census's figures names the committed captures as its base. The lists refresh only when the census workflow runs (dispatch only, no schedule), and no CI step checks them; the builder's own `--check` compares them, and the census workflow commits the folder. The page reads a college's file only when its row or panel opens. A cause in the row opens the panel at `#commons/data/college/<slug>/cause/<key>`; each program opens what we hold about it in the panel, and one with no page is plain text. Guards `tests/commons_data_status_build_test.py` (14, 16), `tests/commons_data_controls.test.js` (causes 1-10).

**DECIDED (Sam, in session 2026-11-13, his six asks; built S649, #3261):** every link on the page opens its content in the side panel, at an address of its own (`.../college/<slug>/<catalog|scout|capture|run|pathways|slos|plos>`, `program/<cn>`, `source/<key>`; a view's own source at `<view>/source/<key>` or `dictionary/entry/<slug>`), and the panel's one link out is *Open in a new tab* to the same place (an outside site, never framed: what we hold about it; a COBI place: its own address). This reverses #3257's new-tab links. The capture's GitHub folder link is gone: *What the capture holds* shows its counts and causes. Each college's sources include CPL Pathways (`#cpl-pathways/college/<name>`). The view uses the window's full width (`.cmn-wrap.cdd`); the list's second column is *SLOs and objectives*, two bars from the live read (courses on Active programs). The Overall card's SLO and PLO lines, and the SLO, objective and PLO cards, open what is collected: the builder's `<slug>.outcomes.json` beside the cause file (each record's PLO text; SLO and objective courses by subject from the committed outline reads, counts only), read when the pane opens. *Colleges with collected SLOs* (`#commons/data/slos`, a figure card) lists the colleges the live read holds SLOs or objectives for and says how many are not read. A college whose committed reads are all on an outline system that prints no objectives (eLumen: Cabrillo, Modesto, Mission, Columbia, Lake Tahoe) reads *its course outlines print none*, never a missing figure (`NO_OBJECTIVES_SYSTEMS` in the builder, until `OBJECTIVES_BY_SYSTEM` from #3263 is on `main`). Ask 6 (objectives collected with SLOs) is the SLO reader's lane (#3263); the dictionary's objectives entry carries its wording. Guards (15) and the controls walk (panes 1, slos 1-5).

**Four catalog links COBIx found dead (Copper Mountain, Cosumnes River, El Camino, Citrus) are unchanged:** the displayed link is the capture's own `catalog_url` in `capture.json`, the same field as the capture root, so it moves only with a fresh capture.

**IN PROGRESS: M-ID re-clustering by outcomes, Step 1 (S642, issue #2962; #3165; revised #3182 `3189c403`).** Sam's go, the S643 re-rating (678 confirmed, 760 split, 71 merge candidates, 348 not enough text), the six cases and the two DECIDED lines: `docs/commons_lessons.md`, *Moved from the lane (S647)*. Report `kb/status/mid_outcomes_compare_2026-11-12.md`. **RULED (Sam, 13:16Z 2026-11-13, [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) card 6):** all six re-clustering cases as recommended. **DECIDED (Sam, 14:08Z 2026-11-13, [Sheet 191](https://claude.ai/artifact/NeR8fkQoj9GVd53NhT29b9) card 1, reply `two`; `sam-honors-own-mid-2026-11-13`):** an Honors course gets its own M-ID, with a declared equivalence to its base course. **DECIDED and APPLIED (S648 conductor, 2026-11-13, #3245):** case 2 alone, one `kb_curation` row (FIRE M1274, merge_into, FIRE 130 X) under `reclustering-s648@bot`, through `supabase-migrate.yml` run 43493272194 after the five pre-apply reads matched; receipt `kb/receipts/migration_s648_reclustering_cohort_43493272194.json` (status and ledger 201, one row returned); rollback `kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql`. The plan, its reads and the simulated post-apply state: `kb/reclustering_s648_out/2026-11-13/`. **DECIDED (`d-reclustering-three-held-s648`):** AJ 160 (Golden West CJ G137 by ASCCC approval; Modesto ADJU 205 by COCI C-ID entry) and MUS 130 (San Diego Mesa MUSI 148B, ASCCC approval) are held, since an outcome score does not set aside an official placement; REAL M1038 with M1040 held (both are required for the salesperson license); MATH M1044 into M1036 held: it would carry a likely mis-filed *Basic Refrigeration & AC Lab* articulation into College Algebra (eligible credits 19 to 4,866); the BUSI M1228 split held: its clean route removes one row the title-matching bot saved (BUSI M10XW, merge_into, BUSI M1228, 2026-06-13), which needs Sam's word, and the insert-only route leaves residue. **Honors, measured:** 1,967 rows; 680 share an identity with their base, 676 under official C-ID or CCN ids and 4 under M-IDs (136 new M-IDs if the ruling covers official ids, 3 if M-IDs only); 508 pairs already apart need only the declared equivalence; 519 identities hold only Honors courses; 145 Honors courses have no base. **NEEDS SAM (Sheet 195 cards 2 and 3, carried from Sheet 194):** card 2, whether Honors leaves official ids (recommended: M-IDs only), and AJ 160, MUS 130, REAL and MATH M1044 (recommended: keep each; MATH after its articulation is settled, and who settles it); card 3, removing the title-matching bot's row (BUSI M10XW, merge_into, BUSI M1228, `automerge-titlelane-v1@bot`; plan.md, question 6; recommended: remove it, its before-value in the receipt). **DECIDED (`d-busi-split-held-for-delete-s648`):** the BUSI split waits for that word rather than going insert-only: the insert-only route leaves M1228 carrying BUS 115's title variant, count and aggregates, and mints BUSI M11TU beside a live BUSI M10XW. The applied FIRE row's undo: one guarded delete (cohort `reclustering-s648@bot`, field `merge_into`, course_id FIRE M1274). **NEXT:** (1) FIRE 130 X on `main` read as expected (conductor, about 22:30Z 2026-11-13: 51 members, units 3-4, eligible credits 1,022.4, students 58; FIRE M1274 gone); its row-audit card is not checked. Then rebuild the identities map so FIRE 130 X's adopter and potential lists take FIRE M1274's (it has no `identities` entry; the side session SkyOriole-B holds a dry-run plan that waits on Sam for a refused commit); (2) price the model pass: a statewide read is outside the $40 limits, so the price goes to Sam first; (3) a potential-CPL column, from an aggregate the runner can read; (4) the Leadership outlines: Merced (for AGAB M1002) and Canyons inside the SLO $40, and a read-only committed export of the ACE Leadership and Supervision rows of `map_college_cr_unit`.

**BUILT: the ASE slice (S641, #3152, merged `ed886d36`; plan #3111 comment 6808952144; Sam's go, Sheet 181 card 10, "Go when built").** `commons_ase.js`, read-only, inside COBI: `#commons/ase` (52 ASE certifications by 120 colleges, 6,240 pairs, 18% with an answer) and `#commons/ase/<title>` (each college: *Lists credit*, *Likely match* or *No answer yet*, with sources). Titles resolve through `CPL_MAP_LINKS.nowTitle`. The page lists its gaps: Request CPL Review (no table holds the state; a new table goes through Rule 10 a3), CPL-AI coverage, the identity-signal list. Guard `tests/commons_ase.test.js`.

**RULED: every Commons view in Malone's look, and the path (Sam, S573, 2026-11-04, in chat).** *"Use the new UI format rather than first light on this and all commons views."* This widens Sheet 158 card 2 from the first view to every Commons view (the Lists, the Progress pages, the side panels); First Light stays the rule for the rest of COBI. The same morning he asked for a visual of the curator's steps and decision points, *"available on every commons surface"*, plain words, with *"a generic term"* for him. The mock is **the path** (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9, source in `CPLBrain/04-projects/cpl-initiative/commons-path-mock/`): six steps every reference shares (know what belongs, let the daily check run, work the list, get the lead's call, check the connections, clean), the CPL Commons view and the Common Subjects view. NEXT: his reaction, then the other references' paths, then the port (`commons_page.js` and `commons_list.js` onto the `--cmn` tokens, the path as a fold above each List).

## S649 (SkyOriole, the conductor, 2026-11-13 to 14): College Data Collection on Sam's six asks

- **One base per card.** Round two of #3261's review found a card whose causes, read from the live census, did not sum
  to the passing and still-to-pass figures above them, read from the committed captures. Where the live census holds a
  college, every figure on that card now reads it (`d-data-collection-one-base-per-card-s649`); a capture's own figures
  carry the label *the capture*. A card that mixes two bases reads as an arithmetic error to anyone who adds it up.
- **Every link opens in the panel** (Sam's ask 2, `d-data-collection-links-open-in-panel-s649`), reversing the
  new-tab links #3257 had shipped a few hours earlier on his earlier words. The panel's one link out is *Open in a new
  tab*, for whoever needs the bigger view. A link to a GitHub folder is a link the reader cannot use; *What the capture
  holds* shows its counts instead.
- **Per-row sidecars keep the page light.** 229 files (about 10 MB) load only when a row or panel opens.
- **The four dead catalog links stay** until COBIx names the URLs: the displayed link is the capture's own field,
  and the sandbox cannot reach the hosts to check a replacement.
- **Not done:** the builder's own eLumen constant against `OBJECTIVES_BY_SYSTEM`; MIS course matches and COE regional
  demand; `#commons/data` in `a11y.config.js`.

## Moved from the lane (S649 final refresh)

Verbatim from `docs/reference/lanes/commons.md`, replaced by the S649 final state (the BUSI delete applied and merged; Honors stopped for design; COBIx's catalog-link correction).

- **Four catalog links COBIx found dead (Copper Mountain, Cosumnes River, El Camino, Citrus) are unchanged:** the displayed link is the capture's own `catalog_url`, and the sandbox cannot reach the hosts; the conductor asked COBIx for the right URLs on #3229 (comment 6866973526).
- **NEXT (the data dashboard):** (1) the four dead catalog links, once COBIx names the URLs or at each college's next capture; (1a) the page builder's own eLumen no-objectives constant gives way to `OBJECTIVES_BY_SYSTEM` (#3263, on `main`) as the one source; (1b) MIS course matches and COE regional demand (COBIx's items 2 and 3); (1c) `#commons/data` joins `a11y.config.js`; (2) the Coming next items, each when its source exists (staff directions through a signed-in Sierra among them, Sam's 7:13 AM PT words); the College view on Sam's word.
- **S649 (#3261 `58d46cc4`): each cause opens its programs, and Sam's asks 1 to 5.** Sam, in session about 22:28Z 2026-11-13, six asks (verbatim in the vault braindump; `sam-data-collection-six-asks-2026-11-13`), first: *"on college data collection: 1. use the full width of the window and add an slo/objective progress bar to the top row"*. Built: the full window width; an *SLOs and objectives* column (two bars, live read); every link opens a side-panel pane at its own address, whose one link out is *Open in a new tab*; *What the capture holds* replaces the GitHub folder link; a CPL Pathways link per college (`#cpl-pathways/college/<name>`); the Overall card's SLO and PLO lines open what is collected; *Colleges with collected SLOs* (`#commons/data/slos`, 19 colleges); a cause opens its programs at `#commons/data/college/<slug>/cause/<key>`, from the live gap census. Sidecars `kb/status/commons_data_programs/` (229 files, about 10 MB) load per opened row; the census workflow passes `--census`, and the lists refresh only when it is dispatched. Ask 6 (objectives with SLOs) is the harvest lane's (#3263). The build record: `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*. Guards `tests/commons_data_status_build_test.py`, `tests/commons_data_controls.test.js`.
- **IN PROGRESS: M-ID re-clustering by outcomes, Step 1 (S642, issue #2962; #3165; revised #3182; applied case 2, #3245 `c09ef2b3`).** The paragraph as it stood at S649, with the S643 re-rating, the Honors measures and every hold's reason: `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*. Report `kb/status/mid_outcomes_compare_2026-11-12.md`; plan and reads `kb/reclustering_s648_out/2026-11-13/`. **RULED (Sam, Sheet 186 card 6):** all six cases as recommended. **DECIDED (Sam, Sheet 191 card 1; `sam-honors-own-mid-2026-11-13`):** an Honors course gets its own M-ID, with a declared equivalence to its base. **APPLIED (S648):** case 2 alone, FIRE M1274 merge_into FIRE 130 X, one `kb_curation` row under `reclustering-s648@bot` (run 43493272194); undo: one guarded delete, `kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql`. **Held** (`d-reclustering-three-held-s648`, `d-busi-split-held-for-delete-s648`): AJ 160, MUS 130, REAL M1038 with M1040, MATH M1044, the BUSI M1228 split. **RULED (Sam, Open Asks Sheet 195, Complete pressed 01:18Z 2026-11-14, his own call, no notes; `sam-sheet-195-answers-2026-11-14`):** card 3 *"Remove the row"*: the title-matching bot's row (BUSI M10XW, merge_into, BUSI M1228, `automerge-titlelane-v1@bot`, 2026-06-13) is deleted so Santa Ana BUS 115 returns to its own record BUSI M10XW; card 2 *"Take every recommendation"*: Honors reaches M-IDs only (3 new M-IDs), AJ 160, MUS 130 and REAL M1038 with M1040 stay as they are, and MATH M1044 into M1036 waits until the MAP team settles the refrigeration lab articulation. **DECIDED (S649 worker, on card 3; `d-busi-split-delete-only-s649`):** the split is the delete alone, nothing inserted: BUSI M10XW is BUS 115's own stand-alone record and nothing else points into it. One guarded DELETE, `kb/migrations/2026-11-14_s649_busi_split_delete.sql` (exact key, value, reviewer and stamp, no person's validation, no person's merge, confirm or Keep as-is naming either id; the whole row returned to the receipt), and a rollback that re-inserts it as saved; plan `kb/reclustering_s649_out/2026-11-14/`, simulated: BUSI M1228 members 24 to 23, BUSI M10XW a stand-alone row of 1, identities 49,560 to 49,561, member rows unchanged. **DECIDED (S649 worker, on card 2; `d-honors-mint-stopped-s649`):** the Honors step is laid out and stopped for the conductor: HUMA M1110's and LIBR M1040's Honors courses already have their own records (HUMA M10ME, LIBR M10CJ) that `automerge-v1@bot` folded in on 2026-06-12, so their clean route is a bot-row delete card 2 does not authorize; IDST M1120's two Glendale courses need a true mint; the numbering form, the equivalence direction and the `honors_of` field (not yet folded by `kb/_apply_curation.py`) are open. **NEXT:** (0) the BUSI delete is APPLIED after the conductor's live reads matched (01:42Z 2026-11-14): `supabase-migrate.yml` run 43542044321, receipt `kb/receipts/migration_s649_busi_split_delete_43542044321.json` (status and ledger 201; `response` holds the deleted row whole, `automerge-titlelane-v1@bot`, 2026-06-13T17:47:56.243497+00:00, unvalidated); undo: the rollback file, which re-inserts it as saved. Left: the conductor's live count, the merge, one dispatch, then the members file read against `kb/reclustering_s649_out/2026-11-14/post_apply_simulated.json`; then the Honors step, NOT done (laid out in that plan's section C), on six open design points: (a) the numbering of a new Honors M-ID (its base's number plus H, or the next free number in its bucket); (b) a one-way or two-way equivalence; (c) the `honors_of` field, which `kb/_apply_curation.py` does not fold yet; (d) equivalence rows for the 508 pairs already apart; (e) HUMA M1110 and LIBR M1040, whose separation needs two `automerge-v1@bot` rows deleted (HUMA M10ME, LIBR M10CJ), which Sam's answer did not cover; (f) who is asked about MATH M1044 (San Diego City College's credit-by-exam exhibit MAPCBES-CBES-1-001, unified as *Basic Refrigeration & AC Lab*), which waits on the MAP team; (1) FIRE 130 X on `main` read as expected (conductor, about 22:30Z 2026-11-13: 51 members, units 3-4, eligible credits 1,022.4, students 58; FIRE M1274 gone); its row-audit card is not checked. Then rebuild the identities map so FIRE 130 X's adopter and potential lists take FIRE M1274's (it has no `identities` entry; the side session SkyOriole-B holds a dry-run plan that waits on Sam for a refused commit); (2) price the model pass: a statewide read is outside the $40 limits, so the price goes to Sam first; (3) a potential-CPL column, from an aggregate the runner can read; (4) the Leadership outlines: Merced (for AGAB M1002) and Canyons inside the SLO $40, and a read-only committed export of the ACE Leadership and Supervision rows of `map_college_cr_unit`.
- **LIVE: College Data Collection (the Commons data dashboard) at `#commons/data`, four views (S647, #3215; slice 1 #3222, slice 2 #3231 `3c161841`, the data #3232 `d87d21db`, slice 3 #3236 `1b630eeb`).** Sam's words for each slice: `docs/commons_lessons.md`, *Moved from the lane (S648)*. `commons_data.js` draws `kb/status/commons_data.json` (`kb/_build_commons_data_status.py`, rebuilt by the census workflow, fail-soft). The four views: the dashboard (figures that open their colleges, the overall bar's statewide tile opening the list lowest first, the API tile: 1 of 15 connected, 2 unverified and not counted); the list with a platform filter and the overall column, each college's row expanding, and its side panel (a dialog: everything outside it inert while open, released whenever the address leaves `#commons/data`) at `#commons/data[/<filter>]/college/<slug>`, carrying the overall bar's four parts and the live counts per college (Active, Teachout and Approved apart; records and passing; SLO, objective and PLO counts; the registry as held or not held), each labeled "live read, <date>"; the dictionary `#commons/data/dictionary` (the `dictionary` key, 19 datasets; #3220 landed as `docs/reference/data_dictionary.md`); the API checklist `#commons/data/apis`. Confidence comes from COBIx's receipts under `kb/spot_checks/`, with his two `confidence()` edge cases. Guard `tests/commons_data.test.js`.
- The daily run (dispatched 02:33Z, `bb25d373` at 02:40Z): BUSI M10XW is in `unified_courses_standalone.js` and the index, gone from `unified_courses_data.js`; BUSI M1228's `members` there went 10 to 9 (the export's member rows 24 to 23; both one member leaving).
- Suggested merges (about 7,300 written daily, none acted on since Sep 27): carry or retire, asked in chat 2026-11-04 (recommended: retire).

## Moved from the lane (S650 checkpoint)

Verbatim from `docs/reference/lanes/commons.md`, replaced by a short line when Open Asks Sheet 196 carried the Honors and identities cards (S650). The one marker word is lowercased so the sheet builder does not read history as an open ask.

- **APPLIED and merged, card 3 (DECIDED `d-busi-split-delete-only-s649`, `d-busi-split-delete-applied-s649`):** one guarded DELETE of the bot row BUSI M10XW merge_into BUSI M1228 (`automerge-titlelane-v1@bot`, 2026-06-13T17:47:56.243497+00), `kb/migrations/2026-11-14_s649_busi_split_delete.sql`, `supabase-migrate.yml` run 43542044321; the receipt `kb/receipts/migration_s649_busi_split_delete_43542044321.json` holds the row whole and the rollback file re-inserts it; nothing inserted. The conductor's live reads: before, the row present and unvalidated, no person's row naming either id, no pointer into BUSI M10XW; after, 0 rows. The daily run `bb25d373` (02:40Z) moved BUSI M10XW to `unified_courses_standalone.js`; BUSI M1228 lost one member.
- **S648 (#3229; #3257 `f2883f87`):** figures no longer break one digit a line; cards in columns; *Colleges by district* (`#commons/data/districts`, a district at `district/<slug>`). The list is a table when its box is 760px or wider. Guards `tests/commons_data_controls.test.js`; `scripts/commons_data_values_check.js` by hand.
- **S649 (#3261 `58d46cc4`): each cause opens its programs, and Sam's asks 1 to 5** (`sam-data-collection-six-asks-2026-11-13`): full width, an *SLOs and objectives* column, links open in the side panel, CPL Pathways per college, `#commons/data/slos`, each cause opens its programs from the live gap census. The paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 final refresh)*. Guards `tests/commons_data_status_build_test.py`, `tests/commons_data_controls.test.js`.
- **DECIDED (`d-data-collection-two-bases-s648`):** every College Data Collection card names its base; the captures count Active, Teachout and Approved (22,335 = 20,282 + 630 + 1,423), passing and completeness count Active. Sam's 9:18 AM PT note (*"college collection changes don't seem to have hit cobi yet"*, relayed by COBIx) came before #3243 merged at 17:55Z.
- **DECIDED (`d-course-key-normalized-s648`):** a course is one college and code key (uppercased, spaces and hyphens removed), and an SLO matches on that key, in the harvest row and the data dashboard alike. Read live 17:33Z 2026-11-13: the raw code gave 89,192 courses and 12,815 with SLOs, the key 88,736 and 13,293.

## Moved from the lane (S651 checkpoint)

Verbatim from `docs/reference/lanes/commons.md`, moved to make room for S651's strategic-plan decision.

**LIVE: the CPL Commons first view (S552, #2697).** `commons.js` draws the locked mock as the tab's first view. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**The opened page, one renderer (S556 to S559).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws the opened page for every reference. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.
