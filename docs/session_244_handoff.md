---
title: "Session 244 handoff — the nine were ruled, four remain, and 19 COBI tabs are still red"
created: 2026-09-08
updated: 2026-09-08
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 244

Your moniker is **SkyExit**. The name is the job: this run's central finding was
a message that rode one exit out of four, so it was computed correctly and never
reached a reader. Predecessors: SkyClear S241 → SkyTrue S242 → **SkyGate S243**
(this run).

## What this run did

Two PRs. [#1520](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1520)
— the note that never printed, and the COBI a11y fix. Then Sam came back with
**"Decisions done!"** and ruled all nine calls `yes`, which became a second PR.

**Two defects of one family: a value computed correctly that never reached the
reader** — and then a curator's one-line note that found a hazard no measurement
had surfaced.

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **A MESSAGE MUST RIDE EVERY EXIT.** `standingHtml()` built the
   edge-overrules-the-vote note and appended it to **one of four returns** — the
   branch for a subject that IS its home's Common SUBJ. A disagreeing subject is
   by construction usually not that, so it left by the umbrella or not-its-code
   exit, both of which dropped it; the two largest cases returned earlier still,
   at the no-seed-entry guard. **Nine disagreements, zero printed.** The question
   is never "does the message read correctly" — it is **"which exits carry it,
   and which cases take those exits?"**
   [`methodology-a-message-must-ride-every-exit`](kb-notes/methodology-a-message-must-ride-every-exit.md)
2. ⚠️ **IT IS NINE, NOT FOUR — AND WRONG IN THE SAFE DIRECTION IS WHY IT
   SURVIVED.** Four does not look like a bug; it looks like a small problem. The
   lane file, the code comment and the handoff all carried it. **Count the cases
   a message is FOR, then count the ones that print it** — that is one script,
   and no amount of reading finds it.
3. ⚠️ **A UNANIMOUS VOTE OF ONE IS NOT A VOTE.** HUMN's single voting identity
   is *Music for Video Games and Film* (→ Music); its three blanks are
   popular-culture titles. Filling from that reading files three humanities
   courses under Music. After Sam's ruling the blanks are **86 across 45 codes,
   and 37 of those codes still have no other identity carrying the prefix at
   all** — nothing to corroborate against, and a discipline invented from one
   title is indistinguishable on every surface from one a curator chose. That is
   why they are a named list (`kb/discipline_blanks_worklist.json`) and not a
   fill.
4. ⚠️ **A FAULT IN SHARED CHROME IS A FAULT ON EVERY ROUTE.** `input#cplfl-optout`
   at 182.1 × 19.9 was the SOLE fault on 17 of COBI's 38 tabs and one fault line
   on all 38, because `first_light.js` paints on every one. Two declarations took
   the sweep **38/38 failing → 19**. ⚠️ **The 24px floor belongs on the LABEL**:
   the engine measures the hit area, and a wrapping label replaces its control's
   box, so growing the 15px checkbox would have moved a number nothing reads.
5. ⚠️ **A BACKGROUND MEASUREMENT AND A FOREGROUND EDIT OF THE SAME FILE CANNOT
   BOTH BE TRUSTED.** My first "after" sweep still showed the fault at 390px and
   I started theorizing a narrow-width override. There was none: my
   revert-verification `sed` had run *while the sweep was in flight*. One direct
   Playwright probe settled it. Same shape as S242's revert harness overwriting
   its own backup.
6. ⚠️ **A BOT PUSHES `[skip ci]` COMMITS ONTO YOUR BRANCH.**
   `first-light-art.yml` pushed `chore(first-light): art candidates …
   [skip ci]` onto this PR's head seconds after it opened, so the `test` run
   that DID pass is on a superseded sha and the current head has no run. Check
   `head_sha` against the PR head before you trust a green check — and note the
   fix is your next real commit, never an empty one.

## Sam ruled all nine — what landed, and what is left

All `yes`. **Blanks 93 → 86** (five codes into the map: BSOT · HUMA · GRAF ·
BCST · BARB; HOSP kept out, recorded in `_deliberately_unmapped`).
**Disagreements 9 → 4** (ATHL→Kinesiology · THTR→Drama/Theater Arts ·
ESCI→Environmental Technologies · ELEC→Electricity · MUSC→Commercial Music).
⭐ All five moved the map INTO agreement with the CSR, and three had named a
discipline the CSR does not carry at all — a second signal, not just the vote.

**Still open:** ETHN (34 under Chicano Studies) · PHTO (a thin 3-of-12 plurality,
where the row's wording overstates what the courses say) · ENVS (1 of 1) ·
ESLN (the Title 5 name below).

⭐ **HIS NOTE ON ATHL WAS THE MOST VALUABLE THING ON THE SHEET.** *"ATHL … is in
Kinesiology but is differentiated from KINE which doesn't have the restrictions
athletic PE or KIN course."* The CSR lists ATHL as a Kinesiology **variant** with
1,468 M-IDs, and the CSR is consumed by the Phase 1e re-mint **to fold variants
to the canonical**. Session 47 caught that fold doing exactly this. ATHL was
safe — but only because of a **literal** in `_subj4_dryrun.py`, the one umbrella
of four not declared as data. Now declared in the CSR
(`is_umbrella`, `umbrella_codes ["ATHL","KINE"]`).

⚠️ **AND MY OWN SHEET'S ITEM 8 HAD ITS PREMISE WRONG.** ESLN's discipline name is
not malformed by us: **eight MQ names carry a Title 5 section number** (53412 /
53414) because the 19th-edition index prints it beside the title. The tell is
`Speech Language Pathology: Disabled Student Programs and 53414 Services`, where
the number splits the phrase. 45 live rows, but **1,183 occurrences across 33
files** including `coci_minted_courses.json` and four alias maps — an id-keyed
rename needing a dry-run and a receipt. Held for its own PR. Sam ruled the item
correctly anyway: **a sheet item can be ruled right and still have described the
wrong size.**

## YOUR PRIORITY

⚠️ **BOTH DECISION SHEETS ARE ANSWERED AND EXECUTED.** Sam ruled the nine, then
the eight. Nothing is waiting on him in this lane. What is left is work.

1. **The Title 5 rename — RULED, NOT BUILT** (hard-ones item 3, `yes`). Eight MQ
   discipline names carry a Title 5 section number the 19th-edition index prints
   beside the title: `53412` (noncredit basic skills / ESL) and `53414` (the DSPS
   disciplines). The tell is `Speech Language Pathology: Disabled Student Programs
   and 53414 Services`, where the number splits the phrase. 45 live rows (ESLN 5,
   BSKL 40) but **1,183 occurrences across 33 files**, `kb/coci_minted_courses.json`
   and four alias maps among them. ⭐ **Sam's shape: strip the number from the
   title and KEEP it in a field of its own** — it says which regulation sets the
   minimum qualifications — then land it the way a re-mint lands: dry run, alias
   map, `kb/promotions.json` re-keyed, one cron window, a receipt (Rule 7
   mechanics: `docs/reference/mid_lifecycle.md`). This also closes ESLN, one of
   the two remaining disagreements.
2. **`ENVS` — the retire half** (hard-ones item 1: *"Let's put envs in biol and
   retire it"*). The map now says Biological Sciences, which is where its one
   course already sat. The retire is id-keyed and **its home is not
   `common_courses.json`**: `ENVS 100` is a legacy anchor that the 2026-09-03
   Z-band retirement did NOT cover (checked its applied alias map — no ENVS), and
   it lives in `kb/coci_articulations.json`, `kb/cid_articulation_joins.json`,
   `kb/cr_reference_worklist.json` and three prototype payloads. Find its
   authoritative home first, then use or extend `kb/_zband_retire_*` rather than
   hand-rolling a re-key. ⚠️ 22 legacy-anchor-shaped ids remain in
   `common_courses.json` (`HOSP 100`, `ACCT 110`, …) — the same class.
3. **The curator pass — Sam: "Go ahead and be more aggressive on the changes."**
   He rejected my conservative first bite. `kb/discipline_blanks_worklist.json`
   names **86 identities across 45 codes**, rebuilt nightly, with what
   corroboration each has. Work more than the 8 codes carrying 3+ identities.
   ⚠️ Still never invent a discipline from a single title — that is what the
   corroboration column is for, and HUMN is why.
4. **PHTO's twelve courses** (hard-ones item 8, `yes`): the map is right, the
   courses are mis-filed. All twelve titles are photography; two are plainly
   wrong (*Individual Projects B* under Machine Tool Technology, *Materials and
   Processes Lab* under Engineering Technology). A per-course fix in the same
   curator pass.
5. **The 19 COBI tabs still failing `npm run a11y cobi`** — 71 distinct failing
   selectors, 5,332 sub-24px target instances, 22 keyboard-unreachable scrollers.
   `our-process` is six faults from two tokens (`--op-ink-faint` #6C8188 at 3.49:1
   → #4F646B; `--op-amber` #B9772A at 3.13:1 → #925003 for its TEXT uses, keeping
   the accent for decoration — the `--mustard` / `--mustard-text` pattern the
   design system already has); `pipeline` is ten. ⚠️ **This is the fan-out shape**
   — many surfaces, every hit verified by re-running one command.
6. **DR-24's write surface** — the curate phrase and the propose/second gate. The
   register row exists with Sam as owner; the phrase's SCOPE is open.
7. `docs/skyview_backlog.md`.

⭐ **THE ONE QUESTION THAT SORTS THIS LANE, now in DR-25** (hard-ones item 5,
`yes`): **does the MQ list already carry the distinction?** No → an **umbrella**,
and we mint codes (Foreign Languages' 21 synthetic per-language SUBJ4s;
Kinesiology's ATHL; the two Agriculture disciplines). Yes and the courses genuinely
split → a **fan-in**, one Common SUBJ with both names kept (`fan_in_with`; FTVE
across Film and Media Studies 360 and Media Production 146). Yes and they do not
split → a plain **correction**. ⚠️ Asking it re-sorted two cases that had been
called hard. A real MQ discipline carrying NO courses folds into its parent
through `kb/discipline_aliases.json` instead — African American Studies and Asian
American Studies into Ethnic Studies, which records where such a course is FILED
and never that the names are synonyms.

⚠️ **NEITHER ARTIFACT CAN WAKE A SESSION** — the service refused a subscription for
S243. If a sheet is live, read its replies with `read_db`, collection `replies`.
Sheets: the nine — https://claude.ai/code/artifact/14c480c9-53e1-41eb-b530-60a1f53d479b ·
the hard ones — https://claude.ai/code/artifact/c165535f-3776-4f93-b2d6-6d1a0ad6e27d

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree.
② Which disciplines are grab bags besides Vocational and the no-discipline pile.
③ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).
④ Whether 60 is the right search depth; whether an emptied discipline ghosts.
⑤ The right-edge glyph rail from his Obsidian screenshot.
⑥ His eye on the CPL face (`#skyview/cpl`).
⑦ His eye on the Sky at the new frame rate (~21.7 fps headless).
⑧ His eye on the live-session banner now Pages has deployed.
⑨ ~~ETHN, PHTO and ENVS~~ — **ANSWERED** on the hard-ones sheet.

## Read these, in this order

1. This file.
2. `docs/reference/lanes/skyview-ccr-interface.md` — items ② and ③ under NEXT
   carry the measured state of the 93 and the nine.
3. `docs/ccr_atlas_lessons.md`, the 2026-09-08 S243 section.
4. `docs/kb-notes/methodology-a-message-must-ride-every-exit.md`.

## Safety patterns to honor

- **`./scripts/check_generated.sh` LAST before every push.** It caught a stale
  dependency map on this run after `npm test` passed 313/313.
- ⚠️ **Never edit a file while a background sweep or suite is reading it.**
- ⚠️ **`npm test` proves nothing about layout** — run `npm run a11y <target>`.
  It takes ~100 s for COBI's 38 routes × 2 widths.
- ⚠️ **Verify a guard by REVERTING its fix**, check by check. This run's new
  suite fails exactly four of nine reverted, which is the shape to want.
- ⚠️ **A figure is only wrong relative to the payload it names.** The nine were
  measured on `prototype/ccr_universe.json` against the map file `EDGE_URLS`
  fetches — the same rule the page applies, against the same file.
- ⚠️ **A ruling can arrive on a premise the sheet got wrong.** Item 8 is the
  worked case. Check the premise before executing the verdict, and say so when
  it does not hold rather than doing the thing the words describe.
- ⚠️ **`kb/discipline_blanks_worklist.json` is REBUILT BY THE DAILY RUN**
  (Step 4d5) and `--check`ed by `scripts/check_generated.sh`; a subject-map edit
  stales it in the same commit that makes it.
- ⚠️ **The sandbox cannot reach `*.supabase.co`** (Rule 10c). Use the MCP tools.
- Never force-push `main` (Rule 5). Squash-merge on a green `test` whose
  `head_sha` matches the PR head.

---

Greetings, you are SkyExit (Session 244), see SkyGate's handoff —
`docs/session_244_handoff.md` — let's keep rolling with our queue.
