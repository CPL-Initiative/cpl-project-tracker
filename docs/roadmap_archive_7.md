---
title: CPL Project Tracker — Roadmap Archive, part 7
date: 2026-11-03
tags: [archive, roadmap, project-memory, session-history]
related:
  - docs/roadmap_archive.md (part 1, where new rotations land)
status: archive
---

# Roadmap Archive, part 7

The INDEX history rotated out on 2026-08-16, the archived session narratives (S62, S113, S146, S147) and the INDEX
history moved 2026-09-17 to 2026-10-31, moved verbatim and in their original order from
[`roadmap_archive.md`](roadmap_archive.md) on 2026-11-03 (S563 SkyBode) so part 1 fits the 150 KB archive budget.

## INDEX update-history entries rotated out (2026-08-16)

- **2026-08-13 (evening)** — SkyBridge: the **alignment layer is LIVE**, cpl-chat **v41** (#1153/#1154/#1155). Sierra now tells a college which of its OWN courses to articulate against each credit recommendation, with how other colleges did it alongside as evidence. Sam's acceptance case verified live: Cerritos `WELD 214L` tops both FCAW recs; peers Barstow `WELD 54B`, Bakersfield `WELD B74A`, Santa Ana `WELD 240`/`244`. Three surfaces: `chatbox_peer_articulations` (9,413), `chatbox_college_courses` (141,696), and one RPC returning both. ⭐ **Two signals, neither sufficient** — Santa Ana mapped courses whose titles contain no "FCAW", so title similarity can never propose them. ⚠️ **The first scorer ranked `ART 100 Introduction To World Art` third for a WELDING rec** — a plausible false positive costs more than a miss on a trust-building surface; content-token gate added, and it *raised* the right answer to 0.761. 1 new KB note.
- **2026-08-13 (later)** — SkyBridge: Sierra wired to the credit-rec set, **cpl-chat v40** (#1150), and the MAP Users contact audit (#1151). ⭐ **`ccc_rec` was a RETRIEVAL GATE, not just a lossy summary** — it is derived from *adoptions*, and the statewide route required it non-null, so **38 never-adopted statewide credentials (36 carrying 75 published rec lines)** were excluded from **every** credential route: the Carpenters ladder, NCCER, the CSLB licences, OSHA 10/30. Not ranked last — absent. ⭐ `college_adoption_opportunities` now returns **two labeled bands** with reserved slots, because "N peers already articulate it" said of a zero-adopter credential is a fabricated route. ⭐ **The shelf collapses to 32 distinct courses**, one of which unlocks 12. ⭐ **MAP Users wiring was SOUND** — the expected join bug was not there; the real findings were a personal Gmail first in Mission College's cascade and a trailing-space fragility caught before it fired. 🔬 **Local-course↔CR alignment PROVEN offline** (Cerritos `WELD 214L` tops both FCAW recs) — and it needs **two signals**, because Santa Ana mapped courses whose titles contain no "FCAW". 3 new KB notes.


### §11 narrative rotated out (2026-09-02)

### SkyMeld S218 — four outcomes fold into three bands (2026-09-01)

**Sam's consolidation shipped, PR #1429 (`724feac`).** The priorities and the
§78093.2(d)(1) goals were two sections describing one allocation; they are now
one — **(A) Access · (B)+(C) Success · (D) Opportunities** — with membership
DERIVED from each metric's milestone and an orphan band so nothing vanishes.
Two measure sources declared (`ppe`/`ppe_u` live, `pac`/`pac_u` awaiting the
attestation column). **The finding that carried it: the model pays 34% of the
credit slice and 84% of that comes from the one measure 97 of 115 colleges
already max out.** Sam ruled the dials (Accepted 25% / factor 1.0) — his to set
via the tab. Corrected mid-run: the counselor step is a policy attestation, NOT
batch-proof. Story: `cpl_funding_lessons`; handoff `session_219_handoff`.

### SkyLedger S210 — remediations, the ruleset verdict, and all nineteen verdicts executed (2026-08-30)

**A–F BUILT** (#1400–#1402 · CPLBrain#46): Rule 10 widened; 16 files renumbered
(`citation_drift` lints it); the harness refuses to score on fixture drift. **E
resolved by measurement**: a required-check ruleset rejected all five cron pushes
(GH013) — the `test` gate is DOCTRINE; the ruleset keeps force-push + deletion
blocks only. **Fifteen Tables ruled** (#1404–#1405). **Decision sheets became
the standing method** (#1406) and Sam ruled the 19-item Open Verdicts sheet LIVE,
all executed same day (#1407–#1409): Combined award column · frozen header +
statewide pair · pool card wired to the Budget table · goal-card policy · scope
68→2 values (receipted) · tab folds · §55050 SENT 2026-08-28 · post-SB 135
register re-analysis ordered · Blast Radius on Admin. ⚠️ `npm test | tail`
reports TAIL's exit — CI caught what local masked. PM: the three-repo attach
practice became session-checked doctrine (#1411/#1412 — verify at start, name
what's missing; per-machine installer for the zero-repo case); the parallel
Session-212 line shipped the register re-analysis sheet (#1413, awaiting Sam's
numbers). Story: `doctrine_enforcement_lessons` + `cpl_funding_lessons`;
handoff `session_213_handoff`.

### SkyCrush S206 — things that stop firing when they move (2026-08-28/29)

**`CLAUDE.md` 151,484 B → ~60 KB, nothing deleted** (#1381–#1384): §11's 29 lane cells →
`docs/reference/lanes/`. ⭐ Sam's assignment rule is the lever, and **split a section,
don't relocate it whole.** ⚠️ **SIX guards stopped firing because content moved and every
diff looked like progress** — `stacked_roadmap_cell` exempted the two largest cells,
`docs/reference/**` had never been indexed (0 → 37), and **"PLAIN WORDS, NO GLYPHS" left
the file entirely** with the row carrying it. Now `## Presentation rules` +
`presentation_doctrine`/`unreferenced_offload`. `npm test` 20.7 → 6.9 min.

⭐ **S208 then answered the question the lane exists for, with a CONTROL.** Four of
Sam's six scenarios ran as matched pairs (doctrine vs `CLAUDE.md` removed): S1 8/8
vs 3/8 · S2 8.5/9 vs **1.5/9** · S6 6/7 vs 2/7. **Every difference is specific
mechanical action, never judgment** — PUSH/PULL validated. ⭐ And doctrine does a
second job: it **suppresses plausible-but-wrong defaults** (S2's control proposed
dark mode against `CLAUDE.md:414`), so *"the control produces it free"* is NOT
sufficient grounds to cut a rule. ⚠️ **The ablation FAILED** — the S4 control
rebuilt Rules 1–10 from ~400 citations, so that pair is void. Strategy + all six
proposed changes: `CPLBrain/04-projects/cpl-initiative/doctrine-probes/`.

**Then the session demonstrated the next failure by having it** (#1387): it
**auto-compacted at 786,077 tokens**, checkpoint 150K stale, ~778,000 dropped. ⭐ **Rule
9's premise was FALSE, not merely unobservable** — the counter is in the transcript every
turn (→ Rule 9a). ⚠️ **Thresholds must be a SUM of measured costs**; "2× checkpoint"
missed by 336 tokens, caught by its own test. `docs/scenarios/` adds probes that get only
the auto-loaded doctrine, with the **rubric committed before any probe runs**, reporting
**holes not a score**. Ledger 7 of 9. Stories: `obsidian_vault_hygiene_lessons` ·
`test_suite_speed_lessons` · `context_pressure_lessons` · handoff `session_207_handoff`.

### SkySwap — the cron would have failed tonight, one step short of the gates (2026-08-19, Session 172)

**Merged #1262.** The queue said *watch the first unattended 13:40 UTC run*; the most recent dispatch had already **failed**.
⚠️ **Not the promotion — the step that FILLS staging**, which no gate is downstream of. Emptying `stg_map_student_credit` by PostgREST `DELETE` writes 591,820 dead tuples: Postgres logged `canceling statement due to statement timeout`, the runner saw a bare `HTTP 500`.
⭐ **The fix already existed a few lines away, written the same day** — `map_promote_custom_reports()` swaps live with TRUNCATE and says why in its own comments. The staging half kept the DELETE. *A lesson recorded inside one function is not a lesson applied to the pipeline.*
⚠️ **It would have failed EVERY night**: runs 1–3 met a small staging table, run 4 met a full one, and staging is full after every success. **A manual run tests a state the schedule never sees again.**
Fixed with `map_clear_custom_report_staging()` — **5.3 s** on the same 802,825 rows — which takes **NO ARGUMENT**, so the pipeline's one destructive call has no table name to get wrong (the `assert table.startswith("stg_")` it replaces left the student-grain table one bad string away). Three mutations caught; applied and run against full staging before merge, live untouched.
🔒 **AND THE ACL, WHICH OUTRANKS THE OUTAGE.** Writing the new function meant writing the same `revoke ... from anon, authenticated` line the workstream already used; **checking it instead of trusting it** showed `proacl {=X/postgres,...}` — the empty grantee is **PUBLIC**, anon inherits through it, and the revoke protects **nothing**. **SIX security-definer functions were callable with the PUBLISHED anon key**, including the promotion that truncates both live tables. ⭐ The correct idiom was **already in this repo twice** (`cpl_funding_optin_review`, `gr_pass_check` name `public`) — two spellings of one intent, one silently inert, so it is a **lint**: `tests/supabase_function_grants_test.py`, wired to js-tests. ⚠️ **`service_role`'s EXPLICIT grant was verified on all six BEFORE revoking PUBLIC** — had its privilege come only from PUBLIC, the same statement would have broken the cron. Now anon `false` / service_role `true` on all six.
Durable: [`methodology-a-gate-cannot-protect-the-step-that-fills-it`](docs/kb-notes/methodology-a-gate-cannot-protect-the-step-that-fills-it.md) · [`methodology-revoking-from-anon-does-not-remove-the-public-grant`](docs/kb-notes/methodology-revoking-from-anon-does-not-remove-the-public-grant.md) · story `docs/map_custom_reports_lessons.md` · handoff `docs/session_173_handoff.md`.

### SkyLoad — the load, and then Sam took the human out of it (2026-08-19, Session 171)

**Merged #1251–#1254.** Sam gave the three field definitions, then: *"This will run in the daily cron so just making sure I don't have to do a staging to live approval every day."*
⭐ **The value is two NEW DIMENSIONS, not freshness** — `Status` (approval stage) and `CPLPlanStatus` (lifecycle checks) were carried by no table we held.
⭐ **Removing the human meant replacing what he was providing, not deleting it** — one transaction, contents-replace so the **RLS trap stops existing as a step**, aggregates rebuilt inside the same transaction, and gates that fail closed. **G5 was tested by breaking it**: it raised, live stayed byte-identical, the junk row rolled back too.
⚠️ **The gate then caught two real contract mismatches in my own loader** — `""` emitted as NULL where live stores `""` (~200k rows), and a NOT NULL violation. **Zero-fill is PER TABLE**: the two live tables genuinely disagree, so filling the student side would be the same defect reversed.
⚠️ **A one-directional TOTAL does not license a swap** — +3.07%, yet 2 of 112 colleges fell. Cause: a **catalog-year roll-forward**, so the axis is **mutable**.
⚠️ **`Status` is 91.2% BLANK and led by `Implementation`** — it cannot facet the backlog. ⚠️ **The Transcribed CHECK is 3.2× the UNITS and strictly contains them** — needs Sam's ruling.
⚠️ **A client timeout mid-promotion proved the atomicity** rather than breaking it; the fix was TRUNCATE over DELETE and a statement timeout on the FUNCTION, since the runner inherits the role setting, not the client's patience.
Story: `docs/map_custom_reports_lessons.md` · runbook `docs/map_custom_report_load.md` · handoff `docs/session_172_handoff.md`.

### Sky159 — one ladder, a chip on every row, a harness dropping checks (2026-08-15, Session 159)

Three merges (**#1204** — SkyKey's held Memory fix — plus **#1209**, **#1210**), all three Admin items
Session 158 recorded from Sam's reports and left unbuilt.
⭐ **HIDE AND AUDIENCE WERE ONE QUESTION WEARING TWO CONTROLS.** He pressed 👁 expecting it to ASK who; it
toggled silently. Now one ladder (Everyone → signed-in → magic-link → nobody) stated in words on the row.
**The merge is at the CONTROL, not the table** — `plan()` treats the two columns differently — and `hidden`
PRESERVES the audience underneath it, or un-hiding silently widens a magic-link item to everyone.
⭐ **ONLY THE ALARMING CASE WAS LABELED**: the protection chip rendered for public-read tabs alone, so a
properly protected tab showed nothing — **1 of 7 rows chipped before, 7 of 7 now**. ⚠️ Chipping every row had
a trap: with no measurement everything classifies unknown, so it would have reported **"Not mapped" ×35** —
one failed request as a site-wide finding. Distinct `unread` state, and the tab's short-circuit is asserted too.
⭐ **THE TEST HARNESS WAS SILENTLY DROPPING CHECKS** — a fixed 1400ms summary timer gave **116, 122 and 123
checks on identical source**. **A check that never registers can never fail**; it caught a vanished block
within the hour. `admin_tab.test.js` **101 → 151**.
⚠️ **THE REPO HAD ALREADY ANSWERED ONE DESIGN QUESTION** — a test comment explained why `plan()` keeps empty
groups (they are the editor's drop targets); my "fix" was redundant and reverted.
Story: `docs/admin_tab_lessons.md` · durable [`methodology-a-check-that-never-registers-can-never-fail`](docs/kb-notes/methodology-a-check-that-never-registers-can-never-fail.md) · handoff `docs/session_160_handoff.md`.


This file is the **museum annex** to [`CLAUDE.md`](../CLAUDE.md). It holds the
**completed** roadmap-table rows and the **per-session narrative subsections for
Sessions 26-31**, relocated out of CLAUDE.md (Session 33, 2026-06-04) so the live
project memory stays focused on steering content.

**Nothing here is live work.** For the current Critical Rules, the full Pipeline
Reference, the still-open roadmap rows (in progress / parked / queued), the
Session-25 strategic queue, and the most-recent session narrative, see
[`CLAUDE.md`](../CLAUDE.md). For per-workstream detail see the lessons docs and
[`docs/INDEX.md`](INDEX.md).

> Verbatim move — these blocks were relocated, not edited. Phase/PR rows
> reference each other and the KB notes; paths are relative to the repo root.

---


### SkyRef — one report, a third of the system (2026-08-13, Session 150)

Four PRs (**#1164**, **#1165**, **#1166**, **#1167**), cpl-chat **v44 → v46**, one migration.
⭐ **A COPY WITH NO REFRESH PATH IS A FOSSIL.** Sam filed *"Wrong contact information for RCC."* The
right move was not to fix RCC but to ask how many disagree: Sierra read a JSONB blob written
**2026-06-25** that **nothing writes** — `sync_map_users.py` writes `map_college_contacts` and only
*reads* the profiles table. **41 of 122 colleges got a wrong email, 13 more got silence, 50 agreed.**
Re-seeding would have made a fresher fossil; the CONSUMER changed. Reading the authority is harder
than reading the flattened copy: trailing spaces in two real college names, 22 fields holding several
people, one address with **no TLD**.
⭐ **THREE IRONWORKER REPORTS WERE THREE COMPLAINTS.** The newest — *"you should have provided a list
of courses I could get credit for"* — is not the false zero; COLLEGE·CRED was the only credential
route never asking for `chatbox_credential_recs`.
⭐ **SILENT FAILURE WAS THE THEME.** The Training hand-off typed into a **hidden pane** (a module-level
`inputEl` re-pointed by a second mount), burned its own retry (`removeItem` before the guard), and ate
text selections. `copyText` passed an **empty rejection handler** to a clipboard API that rejects
routinely. Every one is invisible from the code and obvious from a user's sentence.
⭐ **Sam read the cascade correctly** — `CPL Assistant` DID mean "assistant on file, nobody as Primary
Contact", and it was already promoted. The chip said *what*, not *why*.
Durable: `methodology-a-copy-with-no-refresh-path-is-a-fossil`,
`methodology-a-one-shot-handoff-must-not-consume-what-it-cannot-deliver`,
`methodology-a-provenance-label-must-say-why-not-what`.
Story: `docs/map_users_lessons.md` · `docs/sierra_credit_recs_lessons.md` ·
`docs/sierra_training_tab_scope.md` · handoff `docs/session_151_handoff.md`.

## Archived session narrative — Session 147 (SkyPeak, moved out Session 148)

### SkyPeak — the one course that should have been ten, and the zero that wasn't (2026-08-13, Session 147)

Sam asked to edit a saved Sierra instruction and test it without leaving the tab, then handed over two wrong answers.
Three PRs (**#1146–#1148**), two migrations, 2,205 rows published, 42 live corrections.
⭐ **Every finding was a PUBLISH gap, not a build.** POST's ten credit recs (8 C-IDs + 2 electives) sat in
`statewide_data.js` and on the public Fact Sheet the whole time; Sierra reads only Supabase, so she quoted the
single-string `ccc_rec` and named one course. Same for the statewide flag: the sync used the CER (84) not the
adoption file (137), so **42 credentials read as local** — the EMT/Paramedic mismatch Sam has reported for weeks.
⭐ **`cpl_memory` had already ruled on it** (*"use the adoption file"*) and nothing enforced it. **A settled ruling
does not enforce itself — the consumer has to change.**
⚠️ **Cerritos "has no ironworker CPL" is a FALSE ABSENCE**: the corpus stores `FIW Orientation` / `IW- Mixed Base`
while the curated layer holds 11 `Ironworker Apprenticeship —` rows. Diagnosed, **not fixed**.
⚠️ **A conditional key breaks a bulk upsert** — one `cid_repeats` row in 2,205 (POST's AJ 110) PGRST102'd the load
at batch 9 and left the table **two-thirds full and looking populated**.
⚠️ **Sierra's answers are UNCHANGED until `cpl-chat` is wired to the new table.** Durable:
`methodology-a-summary-field-is-not-the-record`, `methodology-a-conditional-key-breaks-a-bulk-upsert`,
`methodology-a-settled-ruling-does-not-enforce-itself`.
Story: `docs/sierra_credit_recs_lessons.md` · handoff `docs/session_148_handoff.md`.

## Archived session narrative — Session 146 (SkyFund, moved out Session 148)

### SkyFund — a phrase box everywhere, and the limit that was eating Sam's work (2026-08-12, Session 146)

Sam asked for a place to enter the team phrase "wherever curation is needed", and suggested the header. Five PRs
(**#1137–#1141**), one production deploy (**cpl-chat v39**), one additive migration.
⭐ **Site-awareness was a smaller problem than it looked, and the app already held the answer.** A tab can demand a
site phrase ONLY if it is EXCLUSIVE to that site — `cobi_orgs.js` already listed those. Two qualify. **C&I and CIP have
no gated tables at all**, so their phrase protects nothing. Sam's own steer settled it: *"if they show up on two tabs,
allow either"* — which is free, because `team_pass_ok()` already matches any secret.
⭐ **The Sierra composer was silently truncating his instructions at 500 characters**, in the textarea *and* in the edge
function. Two rules landed on exactly 500 and one on 499, cut mid-table. **Identical lengths across independent inputs
are a fingerprint of truncation, not a coincidence.** Raised to 1,500 on both sides and, more importantly, made visible.
⭐ **A queue that tracks attention but not remedy reports itself complete** — Triage recorded that someone *looked*,
never what was *done*, with the composer that would fix it sitting unconnected on the same screen.
⚠️ **A filtered read is not an empty one.** `team_access` returns `200 + []` to a non-reviewer; "no phrases configured"
would be the opposite of the truth. Three distinct renders now.
✅ **Contracts landed on the Finance phrase at the end of the run** — Sam rotated it himself on the new tab first, which
is also what proved the tab works end to end. ⚠️ **Still open and needing Sam:** whether a site phrase should stay a
superset of the shared one — it is live now, so that is no longer hypothetical.
Durable: `methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface`,
`methodology-a-silent-cap-eats-work-and-a-paired-cap-drifts`,
`methodology-a-status-lane-must-link-to-the-remedy-lane`.
Story: `docs/team_phrase_lessons.md` · `docs/sierra_training_tab_scope.md` · handoff `docs/session_147_handoff.md`.

## Archived session narrative — Session 113 (SkyTeleo, moved out Session 117)

### Session 113 — SkyTeleo: the HVAC mis-mint thread → a new auditor rule + blank-discipline cleanup (2026-07-13)

Sam caught `HVAC M10FR` (LA Trade `DIESLTK 122C`) minted **HVAC** but really
**Diesel** — the title word "HVAC" had overridden the field (`title_keyword`
inference), and `top_discipline_disagreement` missed it (it skips singletons).
New **`subject_discipline_outlier`** auditor rule (**#761**): assigned discipline
is a small minority of its LOCAL SUBJECT CODE cohort AND TOP/lexicon corroborate
the SAME correction (two-signals-agree; **covers singletons**). **41 discipline
corrections FIRED** (`mismint-s113@bot`, Rule 9; `kb/mismint_out/2026-07-13/`);
~302 live flags. Wired into the Unified Courses **Triage filter** + blanked
**Common SUBJ** when no discipline (the provisional-mint invariant — 99.99% of
disciplined M-IDs already carry canonical SUBJ4) (**#762**). **Blank-discipline
pre-seed** (**#763**): 5 homonym-checked codes → the live minter lexicon
(~77 blanks fill at the next reseed); the ≥2-agree gate dropped DANCFOLK (titles
= wellness) / MCOM / LIS. Also fixed the Annual Goals association-editor 409
dup-key loop + centered the goal numbers (**#760**). Full story:
`docs/subject_discipline_cleanup_lessons.md`. Handoff: `docs/session_114_handoff.md`.

---

## Archived session narrative — Session 62 (SkyLion, moved out Session 64)

### Session 62 — SkyLion: First Light reflections digest + CCR synonym pairings (2026-06-18)

Two code-only PRs. **#460** — First Light **local-day painting rotation** (no
day-to-day repeats) + the **weekly reflections digest builder**
(`reflections/build_reflections_digest.py` + README): reads the anonymous
write-only `cpl_reflections` via the **service role**, renders per-ISO-week
Obsidian "musings" — output **gitignored here**, bound for the **private
`cpl-knowledge-base` vault** (a sibling session is wiring the weekly GitHub Action
there; needs Sam to add `SUPABASE_SERVICE_KEY` on that repo). **#461** — CCR
Suggested-merges **synonym-map growth** (ECE/EMT/CNA/HVAC/LVN; +13 ids into
multi-member groups, no over-merge) + an ambiguity validator
`kb/_synonym_candidate_dryrun.py` (rejected `cis`/`cd`/`ma`). Also re-installed the
canonical stop-hook over a stale container copy (a squash-merge `noreply@github.com`
false-positive). Full story: `docs/first_light_lessons.md` +
`docs/ccr_cluster_cleanup_lessons.md` (S62); new reflections-digest playbook KB
note + the synonym note extended.

---

## INDEX update-history entries rotated out (2026-09-17, S267)

- **2026-09-13 (SkyKey, S260 — three surfaces swept, 245 a11y faults cleared, and a number that had never been near the engine)** — ⭐ **"Earn" retired** across the funding tab, the CSV export and the public explainer ([#1570](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1570)): 69 sites on Sam's confirmed map (*counts toward · qualifies for · demonstrated · remaining*). The award cells keep the PRESENT PARTICIPLE because his 2026-08-27 tense ruling survives the sweep, and *"students earn credit"* stays — student subject, exempt by name. ⚠️ **One guard was provably not enough**: extending `cpl_funding_calm` looked complete until a mutation left it **57/57 green** on the orphan-band note the fixture never paints, so a source-side twin reads every quoted string — and that is what caught `"Earned <window>"` still in the **CSV column header**, reader-facing text no DOM test can see. ⭐ **A11y target size 245 → 0** on the explainer and **0** `cplfund-*` on the tab, from **six** causes (one selector was 118 of them); every number measured, with **Taft** — the state's shortest college name — setting the horizontal padding by itself on both surfaces. ⚠️ The floor goes on whichever box the engine MEASURES (a wrapping `<label>` replaces its checkbox's), a first `min-height` read *exactly* the same 21.7px because an identical selector was declared later in the same array, and a `:focus-visible` rule naming a token the page does not define **removed** the ring it meant to add (137→139). ⭐ **Ask 2** ([#1571](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1571)): the designate picker rides every card, always visible, and a measureless outcome shows a card even when empty — Sam choosing that after being shown it reverses the reasoning `designateRowHtml()` was built on. ⚠️ **THE CORRECTION THAT MATTERS MOST**: a design prototype quoted funding shares taken from this repo's own lane notes rather than the engine, and Sam caught it in one question — *"Did you read the values and metrics from config or the live funding tab?"* The notes said 40/25/35; live is **33/33/34**, titles **Outreach · Completion · Awards**. The quoted line was a **proposal he never applied**, and prose does not distinguish one from a live dial. Reading the config then corrected two more lane lines: `pac_u` has been back in the bake since 2026-09-10 (24,777.95 across 110 colleges) after being recorded as removed, and goal (C) carries four designated projects, not three. ⭐ **And it located where (C)'s only campus measure lives**: `prioGoals()` resolves the `accepted` milestone to **(B) AND (C)**, but Awards is pinned to `ppa_u` → (A) alone, so the Counselor step is strategy prose there and not the metric — a dial, and Sam's to set. Lane + `CLAUDE.md` brought back from 1.35× and 1.02× to 1.0×; a `CLAUDE.md` line still instructing *"no data yet"* was found contradicting the positive-first ruling that banned it. New note: [`methodology-a-lane-file-is-a-summary-of-a-measurement`](kb-notes/methodology-a-lane-file-is-a-summary-of-a-measurement.md).


## INDEX update-history entries archived 2026-09-17 (S272)

Moved verbatim from `docs/INDEX.md` when its list passed ~8 bullets.

- **2026-09-15 (S263 SkyOrder)** — a column-hide rule reached through the detail row into the nested
  drill-in table and hid one of its columns, on the SHIPPED DEFAULT (#1578); the statewide row now expands
  from the same renderer as a college row and the printed table got its 118 names back (#1577); the
  per-priority target rate was built and reverted as redundant with `factor` (#1579/#1580). Two KB notes.
- **2026-09-14 (SkySave, S262 — the band wrapper retires, and a double claim surfaces)** — Sam's rulings from a marked-up screenshot, built as a mock-up first after S261 went past its brief; he ruled on it five times mid-build. ⭐ **The statutory BAND WRAPPER is retired** ([#1574](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1574)): the card carries what the band head did — key, name, citation, the statute's own sentence — plus a picker. `setPrioGoal()` writes it, the measure-derived goal stays the DEFAULT, and ⚠️ **clearing stores the sentinel `"derived"` rather than deleting the key**, because a deleted key lets a SHARED value resurface and the reset undoes itself. The picker offers *Derived from the metric* FIRST because an `accepted` milestone resolves to (B) AND (C) and no single-choice list can express a pair. ⚠️ **The orphan band went too and the guarantee got STRONGER** — a flat grid filters nothing, so every card renders always and an unresolvable one says so on its own face; the per-outcome total survives as a **totals row naming every statutory goal, served or not**, which is the guard that stops one going quiet now that cards can be re-pointed. ⭐ **THE FINDING THAT MATTERS MOST**: the statewide project allocation was tagged to **(C) AND (D)** and `goalFunding()` pushed its **full** amount into each — **$8,959,692 reported under two statutory goals at once**, $17.9M of reporting against an $8.96M allocation. Every row was correct in isolation, **nothing ever summed the goals**, and it surfaced only because Sam asked for a split; no audit found it. A tag is many-to-many, an amount is not. ⭐ **The bands suite was REWRITTEN, not deleted** — its header stated the invariant (no priority may go missing, because an invisible one still qualifies against a target nobody can see), and one inherited check had become **vacuous while still passing**. Eight suites repointed; two of the reds were my own rendered prose, caught by `cpl_funding_calm` rather than by re-reading. ⚠️ **a11y was MEASURED against `main` in a worktree, not claimed**: the tab reports FAIL on both, and this change removes three findings and adds none. ⚠️ CI red on `dependency map is STALE` while 331 files passed locally — it records LINE NUMBERS, and the rebuild belongs genuinely last. Lane 1.19× → 1.09×, by deleting settled history rather than rewriting it at the same length. New notes: [`methodology-a-figure-tagged-to-two-owners-is-claimed-twice`](kb-notes/methodology-a-figure-tagged-to-two-owners-is-claimed-twice.md), [`methodology-retiring-a-structure-means-rewriting-its-guard`](kb-notes/methodology-retiring-a-structure-means-rewriting-its-guard.md).

## INDEX update-history entries archived 2026-09-17 (S273)

Moved verbatim from `docs/INDEX.md` when its list passed ~8 bullets.

- **2026-09-15 (S264, SkyMantis)** — the counselor step became a measurable rung and `metric_src` got a control: PRs #1582 (counselor measure + measure picker), #1583 (builder's retired causal story + decision sheet), #1584 (Credit FTES locked as the only allocation basis), #1585 (measure options named by route). Two KB notes: a pipe discards a command's verdict; retiring a behavior means inverting its tests.

<!-- INDEX update-history bullet rotated 2026-09-18 (S274) -->
- **2026-09-16 (S265, SkyPublius — `main` went red with nobody's hands on it)** — Sam, closing an unrelated session: *"I told it not to handle this matter but leave it to you."* ⛔ **Three assertions hard-coded figures out of `cpl_funding_performance.js`, which the daily dashboard workflow rewrites**, so `test` went red on a DATA REFRESH with no code change behind it: `cpl_funding_measure_picker` 4c (`826.8 CPL FTES` — `pac_u` moved 24,804.45 → 24,847.45), `cpl_funding_metric_pin` 7b ("at most the **3** `pp_u` carriers" — now **4**) and 7b2 (`25 units` — `pp_u` now 63.5). **Bisected before blaming anything**: green at `d906cf2` AND at the explainer merge `4a00bd9`, red only after the cron commits — the code was never wrong. ⚠️ **The cost landed on another lane**: the SJCOE crosswalk PR #1576 hit it, reproduced it against `origin/main` in a worktree, proved its diff touched no funding file, and stood down — red `main` taxes every PR opened until it is fixed, because the first duty on a red check is proving it is not yours. Every expectation is **derived from the artifact** now, keyed to a specific measure, with the rival asserted absent and `chosen !== rival` asserted outright so a check that cannot fail says so. ⚠️ **A mutation that changes nothing proves nothing**: forcing `earnFraction`'s statewide lookup left 4c green because that figure renders from a different path, which read as a weak guard and was not — the decisive mutations (neuter the picker's write path; point the portal prose rule at the applied lane) fail all three by name. New note: [`methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`](kb-notes/methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh.md).

## INDEX update history (archived from docs/INDEX.md)
- 2026-11-01 (CPL Queue routine, SkySilverberry S539): Sam's Sheet 151 *vpbs* applied (VP Administrative Services is VPBS; four held rows loaded through a new partial load that marks nobody gone); the contacts harvest's third read, 37 people at 10 colleges (#2641).
- 2026-11-01 (CPL Queue routine, SkyWolfberry S538): the contacts harvest's second read, 12 people for 6 colleges applied with a receipt, and the batch ordered by the last read so empty sites stop leading it (#2640).
- 2026-11-01 (Exhibits tab build, SkyTeaberry): Sam answered Open Asks Sheet 150 (IB fold kept; CLEP fold); CLEP on the AP and IB pattern, brand-family's `clep` lane and the reference fold, 48 CLEP names into 35 with 36 live rows moved (#2633); the CER lane trimmed under its budget.
- 2026-10-31 (S534 SkyChokeberry, the CPL Queue routine): Los Angeles Valley 198 to 202 of 215 passing on a new `fill_to` reconcile step (a closing list "for a minimum of N units") and "T otal Minimum Units"; the stopping rule parks the college (`lavc-parked-2026-10-31`); display build d8b6c033cfc6; lessons in `docs/program_requirements_harvest_lessons.md`; handoff `docs/session_535_handoff.md`.
- 2026-10-31 (S533 SkyNannyberry, the CPL Queue routine, finished by the 08:12Z firing): Los Angeles Valley 196 to 198 of 215 passing on the repeat step reading Music's repeatable lists; display build 8603831048ac; lessons in `docs/program_requirements_harvest_lessons.md` (S495-S500 moved to archive 3); handoff `docs/session_534_handoff.md`.
- 2026-10-31 (S532 SkyHackberry, the CPL Queue routine): Los Angeles Valley 186 to 196 of 215 passing on a T & M prefix alias (#2605); the two display applies read back; the UI pass on the Exhibits view; lessons in `docs/program_requirements_harvest_lessons.md`; handoff `docs/session_533_handoff.md`.
- 2026-10-31 (Exhibits tab build, SkyBayberry): Exhibit Adoption's per-credential view folded into the credential panel (`kb/exhibits_adoption.json`), and could-adopt off the TOP and C-ID overlap on the Review card and the panel; KB note `methodology-a-fold-carries-the-folded-tabs-rulings`; lessons in `docs/cer_v2_redesign_lessons.md`; handoff `docs/cer_redesign_handoff.md`.
- 2026-10-31 (Exhibits tab build, SkyBunchberry): Credentials and the credential panel, issuer and training sites editable (#2603); KB note `methodology-widen-a-field-by-saving-its-old-reading-beside-it`; lessons in `docs/cer_v2_redesign_lessons.md`; handoff `docs/cer_redesign_handoff.md`.
- 2026-10-31 (Exhibits tab build, SkyRowanberry): the Exhibits tab's Review queue on the drawn card (`exhibits.js`, `kb/_build_exhibits_review.py`), `exhibit_title_students()` (reviewer-only, k=10), lessons in `docs/cer_v2_redesign_lessons.md`; handoff `docs/cer_redesign_handoff.md`.

Older bullets from the `## Update history` section of `docs/INDEX.md`, moved verbatim when the list passed eight (the checkpoint command's step 6).
- 2026-10-30 (S522 SkyCrowberry, light): a failing shard names its file and `library.test.js` stops racing JSZip (#2572), so #2570's shard 3 passes; #2571 merged; S521's memory rows applied; handoff 523.
- 2026-10-29 (SkyChokeberry, Sam's Library side session beside S520): Revise and remediate from the one box, Edit moved into it, long instructions kept whole (#2564); side-lane handoff `docs/library_handoff.md` (light).
- 2026-10-28 (S507 SkyDewberry, Sam's session): the Summit a11y sweep, 125 of 131 targets passing and the one COBI fault moved on Sam's word (#2534, #2536); the funding FAQ posted as he settled it on Sheets 138 and 139 (#2536); two sessions' Sheet 138s reconciled; handoff 508.
- 2026-10-25 S479 SkyMilkmaids (opened by hand): the Coordinator Guide audit ran from the Drive (#2448, CPLBrain#479); Sam's Sheet 127 *twelve*: twelve NC-1 crosswalk rows confirmed (#2449, CPLBrain#480); light checkpoint, handoff 480.
- 2026-10-25 S478 SkyTidyTips (opened by hand): Sam's funding page asks, two funding columns, the Noncredit CPL Lead, the Report fold, Sierra light, the library look (#2446); light checkpoint, handoff 479.
- 2026-10-25 (S469 SkyLemonadeBerry, continued): the Ask Sierra bar resizes, she asks who you are at the first Ask and reads the public library (#2427, cpl-chat deployed, smoke 7x green); two pieces on GitHub Pages (#2429); the public pages open Light (#2428); the Fact Sheet and the funding page on the bar (#2430); full checkpoint; handoff 470.
- **2026-09-17 (S265, SkyPublius — Rule 9 checkpoint)** — Closes the funding-explainer run and the red-`main` repair. Lint-driven compaction this pass: `lanes/implementation-funding.md` **1.55× → 1.34×** (the vocabulary block deduped against `CLAUDE.md`, which states it in full; the closed decision sheet and three incident narratives cut to their durable rules), and `cpl_funding_lessons.md` **1.13× → under budget** by moving its three oldest sections VERBATIM to the archive. ⚠️ `CLAUDE.md` sits at exactly **1.0×** and the lane's state did not change, so §11 is deliberately untouched — adding a narrative there would have to displace something. Handoff written as **267, not 266**: `session_266_handoff.md` exists on the unmerged crosswalk branch, so the highest number visible on `main` under-reports. Four `cpl_memory` rows written and the crosswalk session's incident row superseded now that its claim is no longer true.
- **2026-09-16 (S266, close-out)** — the matcher gets a score against Delta's 139 rulings (0.907 precision / 0.51 recall) and prints it on every view; the agent-suffix stemming guard lands with a CI test; the To-Do feed trims to 12 with 16 parked; PR #1576 waits on two funding tests red on `main`.
- **2026-09-17 (S267, SkyQuarry — Rule 9 checkpoint)** — The occupation opportunity register ships into the **My College** tab ([#1591](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1591)) for Sigrid's Bay Area Strong Workforce consortium meeting: 28 colleges, 6,903 rows, 1,223 adopt-now, precomputed because the matcher runs ~14 s per college and a room cannot wait on it. ⭐ **The picker already existed** — the tab's `college` scope ships `ready: true`, so live flipping between colleges needed content rather than scope work. ⛔ **`--region` was silently dropping 5 of the 28 consortium colleges**: it resolved against the fire/electrical proximity macro-region while `identity_rows()`'s own docstring forbade exactly that substitution, and the docstring's premise — *the SWP roster exists nowhere in this repo* — had stopped being true later the same day it was written. `--swp-region` reads the resolved roster now. ⚠️ **A 14-minute build wrote nothing** because the one `openpyxl`-dependent output went first; the tip-of-branch "import it inside the function" fix had made the module importable and left the run just as fatal. Also: the doc budget is **UTF-8 bytes, not characters** (⚠️ and ⭐ are 6 and 3), and the dependency map records **line numbers**, so it goes stale on any line shift in a file it maps. `lanes/partner-crosswalks.md` compacted back under budget; the 266 and 267 lineages have converged on `main`. Three KB notes.


## Moved from docs/INDEX.md update history (2026-09-19, S278)

- **2026-09-17 (S272, SkyIndex — Rule 9 checkpoint)** — ⭐ **Sierra gained the THIRD view of a college: what it AWARDS.** `coci_college_programs` held 22,335 rows over 118 colleges that no retrieval path read, which is why she declined a real student LVN question ([#1601](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1601)). The design is a MEASUREMENT: the LVN question finds **53 colleges by program title, 44 by either code, 56 in union** — the 12 title-only ones are LVN-to-RN bridges coded Registered Nursing in BOTH taxonomies, because a code says what a program is ABOUT and cannot say who it is FOR. So the route returns the union, reports `matched_via`, and files a code-only match in its own labeled bucket. CIP is **loaded and never gated** (19,349 of 22,335 rows; blank on 13.4% against TOP's 0%), and generic-term frequency is counted **per surface** — *technology* is 7.8% of titles and 16.3% of the code vocabulary. ⛔ **The migration broke the nightly loader inside the hour**: three GIN indexes on a table whose loader rewrites all 22,335 rows in ONE statement pushed it past the statement timeout (57014), and measured they bought **4 ms** — 561.9 vs 565.8 ms ([#1602](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1602)). ⚠️ **The one-line synonym I proposed was wrong, and measuring it before shipping is what showed that**: *practical* is 9 chars so `practical:*` stems to `'practic':*` and prefix-matched Architectural PRACTICE, Teaching PRACTICES and PRACTICUM — 30 of 36 added title rows were not nursing. Phrases via `phraseto_tsquery` give **56 colleges and 0 noise**, up from 28 ([#1603](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1603)). Also caught: a multi-word term is a hard **42601** in `searchCollegeOfferings`, a PRIMARY path that would have returned null and silently dropped the course-catalog section; and `become` was a live search term returning *BECOMING a Social Media Influencer*. ⚠️ **A feature-branch push wrote the live public catalog** — `coci-offerings-sync.yml` had no `branches:` filter, so run 10 rewrote all three tables from unreviewed code before the PR had a single check finish. ⚠️ **`npm test` is not the suite**: it discovers `tests/*.test.js` only, CI runs **46 separate python3 steps**, and both of the failures that reddened #1601 lived there — three derived artifacts needed regenerating across the run. Two KB notes.
- **2026-09-17 (S271, SkyVeil — Rule 9 checkpoint)** — ⛔ **Sierra was dark for the MAP team for five days while every instrument said UP.** Reported as billing; it was a DEPLOY SKEW. The page ships on merge, the Edge Function only on a `cpl-chat-deploy.yml` dispatch, so a widget sending `x-team-pass` (#1568, 09-12) met a v65 preflight that did not allow it — and a browser answers that by refusing to send the request at all, which is why the function logged OPTIONS and no POST. ⚠️ **The probe passed ~40 times through it because curl makes no preflight** ([#1595](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1595)). Smoke 15b turned out to be the THIRD instance of the negation class #1566 fixed in 15a/15c ([#1597](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1597)). ⭐ **My College opened to colleges and the public without un-gating anything** ([#1598](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1598) + [#1599](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1599)): three of its four gated tables could never be un-gated — `map_college_cr_unit` holds **145,554 rows describing exactly ONE student** at a named college, course and credit recommendation — so four `_pub` mirrors carry only what may be public, suppression moved to BUILD time, and every base kept its RLS. ⚠️ Mutation-testing found a hole in the TEST: deleting the complementary-suppression loop left every privacy assertion passing, because a privacy test cannot see a utility regression. ⚠️ **A table name behind a variable is invisible to the dependency map**, which cost college-briefing four tables in the blast-radius projection until a SEED pinned them. Sam overturned a TOP-gated conclusion of mine with *"check the COCI program data"* — and CIP, measured, does not fix it. Two KB notes.

## INDEX update-history entries archived 2026-09-20 (S280)

- **2026-09-18 (S273, SkyPilot — second round, Rule 9 checkpoint)** — ⭐ **Sam read v67 the evening it shipped: *"Still not able to analyze course and program data."*** The question named Orange County and no college, and the evidence (`chat_interactions` `051d37b6`, the logs, the RPCs re-run) showed why: a county anchored nothing (askedGeo came only from a resolved college, so both catalog lists ranked by volume and Orange County's programs sat at positions 46–120 of 139), "orange" name-matched Orange Coast College and NOCE, `cna` had no synonym family, the offerings query dropped every phrase, and the ask-shape words spent the credential probes. **v68 ([#1607](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1607), open):** a place is an ANCHOR — recognized from `college_geo`, stripped from detection and the routes, carried across turns, and applied INSIDE both catalog RPCs as the leading order keys (migrations applied live, Part E 4/4, offerings 6/6); the builders say *"NO college in Orange County has a matching program"* in words; `cna` → phrases; `nurse:* <-> assistant:*`; stop words; phrase probes. 77-check test, smoke 7c, `npm test` 344/344. **Merge, deploy and the production read hand to S274** — Sam: *"take the rest of this to a new session… been working OT!"* KB note: `methodology-a-place-is-an-anchor-not-a-college`.
- **2026-09-17 (S273, SkyPilot — Rule 9 checkpoint)** — ⭐ **#1603 merged (`0b40f8a`) after a check that added evidence the handoff said was impossible: Deno installs from npm in the sandbox**, so the Edge Function typechecks (15 pre-existing strict-mode errors on `main`, the identical 15 on the branch, none added) and boot-tests locally. Then the first-ever `cpl-chat-preview-ab.yml` run: **ALL MODES OK on both slugs, no regressions — and `search_college_programs` timed out three times underneath it.** `pg_stat_statements`: 15 calls, mean 4,282 ms, max 7,875 ms; the effective timeout through PostgREST is 8 s. The route fails safe, so the answer read fluent without its Program Catalog section and no grid, probe or reader could see it. ⚠️ **The cost was set by the synonym table, not the student**: two full scans per term at ~320 ms, and a question expands to 3, 6, 12 or 30 terms — **4.3 s for 6, 19.8 s for 30**. The one-pass rewrite (vectors once per call) returns **identical rows on nine term sets** — proven on a session-local `pg_temp` copy beside the live function, no shared schema touched — in **1.1–2.5 s**, and is the schema of record on this branch, **not applied until Sam says so**; the deploy waits on it. Verification Part D pins the cost; smoke 7p asserts latency beside reach and cleanliness. Two KB notes. ⭐ **Then Sam said "apply and deploy"**: the rewrite was applied (migration `search_college_programs_one_pass`, A–D 16/16 live), A/B run 2 came back clean in the grid AND the logs, and **cpl-chat v67 went live at 23:31Z** — the program route reaches production. The smoke on that PR also turned up the fourth and fifth shapes of the negation class ([#1605](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1605)).

### INDEX update-history bullets trimmed 2026-09-24 (S285)

- **2026-09-19 (S277, SkyCaliper)** — Sierra v73: a sub-region anchors the catalog routes (the San Gabriel Valley false zero), the CNA quick list folds to four real courses, and the comparison table loses its row quota. New note: EXPLAIN ANALYZE's own clock is a cost.
- 2026-09-18 (S276, SkyGauge) — cpl-chat v72: the quick list of typical courses, the flyer, the precedent in the block, "catalog data" instead of COCI; two KB notes; handoff 277.
- **2026-09-18 (S276 parallel, SkyLevel — Rule 9 checkpoint):** SkyView is safe to share and says so. It always wrote nothing (one POST, the Ask, which inserts no row); the page stated that three times in chrome `body.u-solo` hides, so a band under the control row now says it where the curate controls are and links to the CCR tab where curation is actually saved ([#1618](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1618)). ⭐ **Sam's "stops responding on the second or third merge" was a drop exit that returned in SILENCE** — a carried course released on `drag.fromNode`, which for a course picked up from a member square is the whole clustered identity, so a real drag onto the open identity cleared the carry, printed nothing, and left the hint claiming one was still in hand. Gated on travel now; a merged course also queues on its own arc against the parent, labeled *staged, awaiting a curator* ([#1619](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1619)). ⛔ **The band shipped into `prototype/skyview.html`, which is GENERATED** — it passed a browser check, a jsdom suite, review, merge and deploy, and #1617's rebuild stripped it from `main` within the hour. `skyview_invariants.md` already said *"never hand-patch skyview.html"*, and `scripts/check_generated.sh` listed every other generated file and not this one. Both fixed, plus `tests/skyview_built_from_source_test.py`, which names the source file and line. ⚠️ The hit-test mis-pick was MEASURED and left alone: 23 of 24 loners already resolve correctly, 37 of 37 focused member stars resolve to that member. KB note: `methodology-a-generated-file-accepts-your-edit`.

### INDEX update-history bullets trimmed 2026-09-25 (S288)

- **2026-09-20 (S279, SkyKeeper)** — TypeSafe/Jev wired and verified end to end; CR Reference trial scored 51 anchored pairs in 10s and shipped a decision sheet for Sam's verdicts. Two KB notes: a typed answer is not a boolean; a curation table that cannot store a reason.
- **2026-09-19 (S278, SkyWarden — Rule 9 checkpoint)** — ⭐ **SkyView is a deliberate PUBLIC read-only surface** ([#1632](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1632)): Sam's goal was *"allow public read only SkyView access but prevent any actions to be taken that would edit or access views where edits could be done"*, and asked to gray the menu items or hide them he chose **hide**. Four views moved behind STAGE — each reaches a staging control, and By discipline / By subject / ESL packaging share ONE workspace shell with ONE mode bar, so they travel together. ⚠️ **Gating the menu alone would have LOOKED right in a screenshot**: the views are also plain URLs, so `GATED_ROUTES` puts the same question on `__ccrRoute()`, the one funnel, and the suite asserts the two lists AGREE. ⛔ **A second curation surface lived in another file and the single-decider guard could not see it** — `ccr_atlas_graph.js`'s `__ccrDecision` has its own `moves[]`, and the suite's *"nothing outside curationRung() decides authorization"* passed throughout **because it only read `ccr_universe.js`**. Also: the band now NAMES the credential (rungs 0 and 1 opened on the same words) and answers the COBI half — one origin, one credential; and the pre-JS banner stopped shipping a COBI link it painted before its own gate could reach it. ⛔ **Then the prompt storm** ([#1633](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1633)): **this repo's `.claude/settings.json` has NEVER loaded in a three-repo session** — Claude Code reads the session's project root, which with three repos attached is their parent (`~/.claude/projects/` held one entry, `-home-user`). Documented behavior, and `~/.claude/settings.json` is not read in cloud sessions at all. ⚠️ **Two inherited premises were wrong**: `permissions.allow` DOES work in auto mode (*"allow, ask, or deny rules resolve immediately"*), and a stale `origin/main` made a working gate look broken — so a third of the guards were unnecessary and were removed on Sam's *"simplify it"*. Auto mode is the classifier, and it was turned on to stop the storm it caused. `roadmap_lane` budget 12,000 → 20,000 on Sam's call (measured: 28/32 fit, the 4 over were current truth, and `stacked_roadmap_cell` is the real guard). Two KB notes.

## INDEX update-history entries archived 2026-09-26 (S294)

- **2026-09-21 (S281)** — Decision sheets rebuilt around Sam's sixteen reversals (proposal as focal point, outcome-named chips, no intro, Complete, opt-out with verdict provenance); `sendToClaude()` measured unable to reach a Claude Code session, so the record is the mechanism; one Jev magic half (`kb/_jev_adjudicate.py`) for CSR, CER and CCRR with an independent second look. Two KB notes added.
- **2026-09-20 (S280, SkyForge — Rule 9 checkpoint)** — Sam's 51 verdicts from the Jev sheet landed in `cr_reference_decisions` (41 fold, 10 keep, 30 rows, receipt in `kb/receipts/`); Jev's gate held 25 of 25 and the numbers under it carried no signal. Sam's decision-sheet rulings (the recommendation as focal point, chips that name the outcome, over-merge by default) in `docs/reference/decision_sheets.md`. The Allow-SQL storm diagnosed from the transcript: the guards load, a hook allow is advisory, one allow rule waits on Sam. KB notes: `reference-system-one-model-fit-by-lane`, `methodology-measure-a-guard-by-the-wait-it-removes`, `methodology-propose-the-decision-and-let-people-pull-it-back`. Handoff 281.


## INDEX update history, moved 2026-09-29 (S303)
- 2026-10-31 (side session, SkyCloudberry): the funding requester line (MAP role, landing page, *find title*) and one editable response email signed by the CPL Initiative team (#2619); the Exhibits review card's Back and Accept all (#2620); the landing pages' contacts in the MAP Users tab (#2621); two lane files back under budget, history moved verbatim to their lessons docs.

- **2026-09-26 — S294 (SkyCadence):** narration v3 and `narrate.py` ([#1701](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1701)); the ESL merging procedure sheet, nine items, and four stale open-asks cards retired ([#1702](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1702)); the narrated draft of the funding introduction ([#1703](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1703)); Sam's ESL verdicts, all nine as proposed: the reader fixes, the ladder script's tests, and the data paste with its rollback ([#1704](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1704), `kb/esl_sheet_out/2026-09-26/`); KB note `methodology-hear-a-synthetic-voice-through-a-recognizer`; handoff 295.
- 2026-09-25 (S291 SkyReel): the funding guide video, a KB note on rendering HTML animation to MP4, handoff 291.
- **2026-09-25 — S288 (SkyZ):** `TOP_Code_Lookup.xlsx` column D corrected against the TOP manual (81 of 198 codes disagreed with their titles), the EACR's unsectored rows 890 → 379, guard in CI ([#1692](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1692)); Sam's ruling that TOP is unreliable and program CIPs are almost fully reliable; a program-CIP route for courses measured and not shipped (8 better, 15 worse of 30); on Sam's scoping ruling, exams sectored from their titles (`kb/reference/eacr_cip_title_rules.json`, unsectored cards 449 → 3, live and verified, [#1693](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1693)); `check_hooks_live.py --fix` now applies the stop-hook patch that three-repo sessions never ran. KB note `methodology-a-program-cip-labels-the-program-not-its-courses`. Handoff 290.

- **2026-09-27 (S295 SkyHarbor):** the CLAUDE.md prompt audit (narratives to `docs/reference/doctrine_provenance.md`, eight calls on a sheet), main's lints fixed (#1709), the ESL apply and its monthly pass; handoff 296.

## INDEX update history, moved 2026-09-30 (S305)

- **2026-09-27 (S295 SkyHarbor, second checkpoint):** Sam's eight CLAUDE.md verdicts carried out ([#1712](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1712): the context meter installs at the session root through `check_hooks_live.py --fix`; [#1713](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1713): the emphasis sweep; vault #185, #186; knowledge base #23 waits for his merge), and the standing open-asks sheet reconciled and published fresh ([#1714](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1714)): seven of its cards were answered rulings, two contradicting his August answers. KB note extended: `methodology-a-settled-ruling-does-not-enforce-itself`. Handoff 296.

## INDEX update history, moved 2026-09-30 (S308)

- **2026-09-29 — S300 (SkyLoom):** two ports of the College Dashboard reconciled: what #1731 carried that #1729 lacked, and S299's five follow-ups, landed as [#1732](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1732) (TBA everywhere, the grants table's layout, the printed explainer, the CSV's Demonstrated); Sierra Training round 1 ported ([#1733](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1733)); seven asks on one sheet; the funding lane compacted under its budget. S299's own handoff carried to main as `session_300_handoff.md`.

## INDEX update history, moved 2026-10-01 (S310)

- **2026-09-29 — S302 (SkyWeft):** sheet 3's eighteen rulings recorded in their lanes ([#1750](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1750)); Sierra's one-button Try it in ([#1751](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1751)); the CR Reference names varying groups by range ([#1754](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1754)); College Dashboard mockup round 8, its harness committed on the round's branch. Close-out: the priority cards' Demonstrated and the opt-in words ([#1752](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1752)), the explainer on Sam's premise ([#1753](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1753)), draft 4 of the video ([#1756](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1756)), card 7's workflow ([#1757](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1757)); the funding lessons rebuilt after a scripted write erased them. Handoff `session_303_handoff.md`.

### Moved from docs/INDEX.md update history (S315 checkpoint, 2026-10-02, verbatim)

- **2026-09-30 (S306 SkyRivet checkpoint)** — Sam's four asks on the funding surfaces: the drill-in hovers that say how each figure is reached, the frozen College Dashboard header, Refresh everything and its dialog, My College following the model, My CPL Funding beside the table, and Unit sources (military vs non-military, exhibits, recommendations); open-asks sheet 6; a KB note on sticky headers; S306 in the funding lessons; handoff 307.

<!-- moved from docs/INDEX.md Update history, 2026-10-02 (S316) -->
- **2026-09-30 (S307 SkyGusset checkpoint)** — the Reporting box's reviewer half, `cpl_funding_reports` INSERT-only ([#1782](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1782)); Sam's Public view asks: the published scenario opens, As colleges see it, My CPL Funding at the top by college or district with Save as PDF, the margin audit, the videos' ways back ([#1783](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1783)); the CO style guide as a reference note; open-asks sheets 7 (answered) and 8; KB notes on the style guide and on alignment; handoff 308.

<!-- moved from docs/INDEX.md Update history, 2026-10-02 (S317) -->
- **2026-09-30 (Sierra credit-source checkpoint, beside S305 to S307)** — Sierra reads where credit comes from: each summary figure suppressed on its own students with real statewide totals ([#1777](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1777)), the military/non-military bucket and per-exhibit source tables ([#1779](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1779)), cpl-chat v74 ([#1780](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1780)); a KB note on the floor belonging to each figure; the partition section in the subtraction note; the 2026-09-30 section in the student-detail lessons; handoff 309 (the Sierra lane; the funding chain's 308 landed first).


## docs/INDEX.md update history (archived)

- **2026-10-01 (S312 SkyLantern)** — the funding explainer in the Fact Sheet's layout, with Ask Sierra, the tab's FAQ, one statewide box and the average award; the introductions with the average allocation ([#1806](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1806)); Sam answered sheet 14; the "model" sweep ported ([#1807](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1807)); sheet 15; the S221 funding lessons archived; handoff 313.
- **2026-10-01 (S310 SkyTandem)** — My CPL Funding in Sam's words: the language mockup ([#1797](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1797)) and the port, with each institution's three minimum conditions, the demonstrated funding at the $1,000 rule and the Do this next fix ([#1798](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1798)); Sam ruled "model" out of every public surface (the sweep is next); an emergency checkpoint, then the full one; handoff 311.
- **2026-09-30 (S308 SkyBracket + S309 SkyCensus, one session)** — the funding Public view reads as text ([#1788](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1788)); Sierra's catalog timeout fixed with a stored `title_norm` ([#1789](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1789)); the Reporting box's college half on My College ([#1790](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1790)); smoke 7c/7s accept the honest absence ([#1791](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1791), [#1794](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1794)); Sierra's program search reads stored vectors ([#1796](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1796)); sheet 11; two KB notes (a revoke names every role; a stored value does not follow its function); the funding, Sierra and credential chains joined in `session_310_handoff.md`.

<!-- moved from docs/INDEX.md Update history, 2026-10-03 (S320) -->
- **2026-10-02 (S313 SkyReel)** — Sierra v77 names City College of San Francisco (a possessive hid it) ([#1808](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1808)); Sam's two CER renames applied; the video round and the explainer's progress lines, and the rename workflow rebuilds its derived files ([#1809](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1809)); sheet 16; a KB note (a Postgres md5 proves a transcribed jsonb copy); handoff 314.

<!-- moved from docs/INDEX.md Update history, 2026-10-03 (S321) -->
- 2026-10-02 (S314 SkyVerdict): KB note `methodology-a-prompt-that-quotes-the-wrong-sentence-teaches-it`; handoff 315; Sierra v78-v80 and the Dec 30 deadline in the lessons docs.

<!-- moved from docs/INDEX.md Update history, 2026-10-03 (S322) -->
- 2026-10-02 (S315 SkyLedger): KB note `methodology-a-verdict-that-reports-an-action-is-checked-in-the-store`; handoff 316; cards 23-24 written; the `top_code` index; the 2.3% gap traced to the maximum award; sheets 18-19 (19 answered: write, sum); the CER decision workflow.

<!-- moved from docs/INDEX.md Update history, 2026-10-04 (S324) -->
- 2026-10-02 (S316 SkyTally): KB note `methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5` (+ `scripts/pg_jsonb_md5.py`); handoff 317; sheet 19 executed (the CER fold and Microsoft title; the summed statewide target, film `_v7`, [#1821](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1821)); "FTES reimbursement rate", never price.

### INDEX update history, moved 2026-10-04 (S326)

- 2026-10-02 (S318 SkyKeel): KB note `methodology-a-load-id-should-be-the-content`; handoff 319; Sierra can read each program's own course list (#1826-#1829); sheet 22.
- 2026-10-02 (S317 SkyCompass): KB note `methodology-a-gateway-error-is-not-an-answer`; handoff 318; the MAP Custom Report loader reads back after a 5xx and never re-sends a landed batch or the promotion ([#1824](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1824)); the grants re-check closed.

### INDEX update history, moved 2026-10-04 (S327)

- 2026-10-02 (S317 SkyCompass, the Sierra narration): KB note `methodology-an-input-read-outside-the-repo-carries-its-text-and-its-gaps`; Scenario 2 narrated by Sierra in ElevenLabs ([#1823](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1823) and the follow-up), `_Draft_3` linked from the explainer; sheet 22 answered.

## INDEX update history (moved from docs/INDEX.md)
- 2026-10-03 (S320 SkyCensus): the program-source census and its registry (#1836, Phase 0 of the harvest): `program_source_registry` live with 118 rows, a history table and one write path, weekly apply; the vendor-link hop and four-slice read (#1838; first full read: 109 of 118 catalogs found); new lessons doc `program_requirements_harvest_lessons`; the revoke KB note gained a tables section (TRUNCATE); handoff 321.
- 2026-10-03 (S319 SkyRudder): KB note `methodology-write-the-rule-as-the-sentence-you-want-said`; handoff 320; Sierra's program course lists deployed (#1832, smoke 7l), 7s's articulation set-aside (#1833), the timing log (#1834); new lane `program-requirements-harvest` with its plan doc; sheet 23.
- 2026-10-03 (S321 SkyCatalog): KB note `methodology-a-reader-fix-moves-rows-it-was-not-aimed-at`; handoff 322; the census's reader corrected over four full reads (#1839: 109 → 112 catalog addresses, 67 → 78 years, no college worse off); the registry's first apply on `main`; open-asks sheet 24 (two memory receipts, six catalog addresses).
- 2026-10-03 (S322 SkyPilot): KB note `methodology-a-failed-read-is-not-an-empty-result` gains the census case; handoff 323; the census reads a vendor catalog's own edition banner, puts the newer year first on one host, and keeps a known address after a failed read (#1841: 77 → 95 catalog years, 71 → 91 at 2026-27); open-asks sheet 25; West Los Angeles is the pilot's PDF college.

## `docs/INDEX.md` update history — entries moved 2026-10-05 (S333)

*(Trimmed from INDEX's `## Update history` per `/checkpoint` step 6, which caps it at ~8.)*

- 2026-10-04 (S325 SkyReader): KB note `methodology-probe-the-class-before-calling-a-refusal-local`; handoff 326; the sequence pass meets the Program Mapper's 403 at all 17 hosts it reached (#1847); the census records catalog addenda, 78 at 52 colleges, with a proposed addenda table (#1848); open-asks sheet 29; every sheet named in chat carries its link; the Program Requirements tab mock-up with an Ask Sierra link.
- 2026-10-04 (S324 SkyGrader): KB note `methodology-a-not-applicable-score-must-be-confirmed-by-the-source`; handoff 325; the program requirements pilot's record shape version 2 (hours, option groups, block totals, unit ranges; Edge Function v2) and Miramar read through its curriQunet exports: 20 of 20 programs captured and 20 of 20 records pass the three automatic bars (#1845); the pilot records review sheet for Sam.

<!-- moved from docs/INDEX.md Update history at the S334 checkpoint -->
- 2026-10-04 (S326 SkyAddendum): KB note `playbook-ship-a-table-before-its-privilege-close`; handoff 327; sheet 29 carried out (#1850): six catalog addresses entered, `program_source_addenda` live with the census writing it, sequence access recorded on 25 colleges' registry rows and the reader taught to skip a refused host; Sierra's catalog requirements for checked records (#1851, `program_requirement_records`, 20 checked); open-asks sheets 30 and 31.

<!-- moved from docs/INDEX.md Update history at the S335 checkpoint -->
- 2026-10-04 (S327 SkyAmend): KB note `methodology-one-build-two-readers`; handoff 328; the ROEP display build (`kb/_build_roep_display.py`): CPL in three kinds per course, the up-to figure, gaps and map status, written once to `cpl_pathways_roep_data.js` and `program_requirement_records.display` (20 rows live); Sierra wired to it with smoke 7r (#1854); open-asks sheet 33 (CSU LA, outcomes, the Ironworker proof).

<!-- moved from docs/INDEX.md Update history at the S336 checkpoint -->
- 2026-10-04 (S328 SkyLadder): #1854 deployed; sheets 33-34 answered and in their lanes (#1855); the statement of who CPL serves and `kb/non_ccc_institutions.json` (#1856); the Cerritos Ironworker ladder on CPL Pathways (#1857); handoff 329.

<!-- moved from docs/INDEX.md Update history, S339 -->
- **2026-10-05 (S331 SkyForge):** KB note `methodology-a-search-result-is-a-lead-not-a-source`; handoff 332; the Program Requirements tab in COBI with its Procedures view (#1860); the college page read opens collapsed sections and prints a table's matching rows; Cerritos reads 7-12: CATEMA, CTE Course Connect, the CCAP partner schools, the archive's 2016 list of 57 agreements; procedure record v4; open-asks sheet 37.

### INDEX update history moved 2026-10-07 (S342)

- 2026-10-05 (S334 SkyAnchor): record shape 3 keeps program outcomes as printed (19 of 20 pilot records); a person's verdict is held to the requirements read; CPL Pathways shows each catalog record by requirement or by term; KB note `methodology-a-verdict-covers-the-reading-it-saw`; open-asks sheet 41.

## INDEX update history, moved 2026-10-08 (S345)

- 2026-10-06 (S337 SkyCompass, scheduled): a second capture list beyond Sam's 20 (`--sample maps`); Irvine Valley Art A.A. 10265's record (extraction 37488863819, PASS); Santa Monica's catalog never links its Barbering program, so a procedure record is next; handoff 338 (#1886).
- 2026-10-05 (S336 SkyCourier): sheet 42 carried out (outcomes on the 20 live rows, Sierra redeployed, display build 1cb75672ba6c with Miramar's two drafts, drafts on My College now: #1878); open-asks sheet 44; Irvine Valley's and Santa Monica's program maps read into terms (#1876); a signed-off session lets go of its wakes (#1879); KB note `methodology-an-idle-session-still-holds-wakes`; handoff 337.
- 2026-10-05 (S335 SkyKeel): drafts for the college on the Program Requirements tab (sheet 32 card 2, the harvest-tab half); Miramar's AUTO 156G traced to MAP's 0.3-hour rows, with no credit through it; Sierra names a college gap by its kind; KB note `methodology-trace-a-finding-to-what-students-received`; open-asks sheet 42; handoff 336 (#1874).

### From docs/INDEX.md update history (trimmed S346)

- 2026-10-06 (S338 SkyLantern): the Noncredit Summit deck's draft 2 (vault #247: live count, funding read from the model, Sam's Mt. SAC / NOCE / Calbright calls, Nadia's CompTIA bundle) filed in CPLLibrary/Drafts with its Library record (#1889); the Library filer's Google sign-in set with Sam (#1887 privacy page, #1888 guide); new lessons doc `library_lessons.md`; handoff 339 (SkyReel: the film re-cut first).

### From docs/INDEX.md update history (trimmed S351)

- 2026-10-08 (S344 SkyWaypoint, scheduled): every pilot college has a reading procedure, 7 of 118 (#1906); map searches at West Los Angeles (mapper 403), Riverside City and Mt. San Antonio (no map page yet) took three records to v2; Sierra's smoke passed in full on `main`. Handoff 345.

## INDEX update history, moved 2026-10-09 (S354)

- 2026-10-08 (S347 SkyTrellis): the Chancellor headline, Palo Verde read, the To-Do retired for a UI pass, the Sierra redesign lane; KB note methodology-a-lapsed-name-is-not-a-refusal.
- 2026-10-08 (S346 SkyCairn): KB note `methodology-a-site-search-needs-the-domain-filter`; harvest lane compacted below its limit (two paragraphs to the lessons doc); lessons S346; handoff 347.

### docs/INDEX.md update history, moved 2026-10-10 (S356)

- 2026-10-08 (S347 SkyTrellis, re-checkpoint): Sheet 51 carried out (display build 2360b83e8100 live, #1918; flags and Confirm / Needs a fix on the Records view, #1919), all 32 maps settled; KB note methodology-a-persons-write-must-survive-the-next-reload.

## `docs/INDEX.md` update history — entries moved 2026-10-11 (Session 361)

*(Trimmed from INDEX's `## Update history` per `/checkpoint` step 6, which caps it at ~8.)*

- 2026-10-09 (S350 SkyTide): the veteran map ported to First Light on Sam's Sheet 55 ruling, COBI's frame on `?embed=1` with a marker size floor, `build_selfcontained.py --check` in CI (#1924); the Library record at version 55 (Sam's paste); KB note `methodology-check-a-page-inside-every-frame-that-embeds-it`; the Fact Sheet's first UI pass (#1926; the glyph sweep reads the standalone pages now) and Open Asks Sheet 56; handoff 351.
- 2026-10-09 (S349 SkyHarbor): the docked Sierra full screen when she answers (#1921); the first UI pass on Sierra's public page; the veteran map mock-up and Sheet 55 (#1922); KB note `methodology-a-sweep-sees-only-the-states-its-seed-reaches`; handoff 350.
- 2026-10-08 (S348 SkyMeadow): Sierra's public page ported to the approved mock-up, her logo set in five rounds with Sam; new lessons doc `sierra_page_redesign_lessons.md`; handoff 349.

### INDEX update history, moved 2026-10-11 (S363)

- 2026-10-09 (S351 SkyLark): UI passes on the privacy page (First Light's type and dark, #1929), the funding explainer (the Columns menu opens on the screen, #1930) and SkyView (chip tokens; on-accent ink on three dark fills at 2.65:1, #1932); the picker reaches a view nobody has audited before a re-pass (#1931); new lessons doc `ui_pass_lessons.md`; the fill-and-ink KB note gains its second case; handoff 352.

## INDEX update history moved 2026-10-11 (S364)

- 2026-10-09 (S353 SkyHearth): Phase 2 of the ROEP harvest opens at Cerritos (#1941: sitemap-first read, 283 of 288 programs, a page goes to one program); the funding explainer's typed passages edit on the tab and its masthead follows Sam's marks (#1940); First Light rule, controls are underlined words (#1942); KB note `methodology-anchor-a-marker-a-workflow-reads`; handoff 354.
- 2026-10-09 (S352 SkyMeridian): the Fact Sheet's `--on-accent` (#1934); its First Light mock-up built from its own code (#1935) and, on Sam's "Fact Sheet looks great!", ported with a screen-only dark mode (#1938); the Dashboard's first UI pass, clean light and dark (#1937); `ui_pass_lessons` S352 section; KB note `methodology-an-undefined-css-token-fails-to-an-invisible-state` third case; handoff 353.

## INDEX update history moved 2026-10-11 (S365)

- 2026-10-09 (S354 SkyFurrow): Cerritos loaded unchecked through `program_requirement_records_college_load()` (#1941, 270 records, receipt per load); reads gated on `[read]`/`[extract]`; the Activities UI pass (#1945); Program records gains Find a record and the scorer's course counts (#1946); a Progress call answers its records on its card (#1947), all for Sam reading on his phone.

### INDEX update history, moved 2026-10-12 (S367)

- 2026-10-10 S357 SkyCanopy: curriQunet catalogs read as data (KB note `methodology-a-javascript-catalog-is-data-read-what-it-fetches`); district catalogs scoped; Open Asks Sheets 58 and 59; handoff 358.

- 2026-10-11 (S359 SkyMoss): RCCD's Liberal Arts emphasis read (#1965-#1967), Sheet 60's eight rows removed (#1968), Sam's Mt. San Antonio reading rules; KB note `methodology-a-missing-course-may-be-a-retired-version`; handoff 360.

## INDEX update history, moved 2026-10-12 (S371)

- 2026-10-11 (S364 SkyJuniper): Sam kept hours / 16 on Open Asks Sheet 63 (#1990); the Implementation Funding and Contracts UI passes with seeded sweeps (#1991, #1997); Budget's and Annual Workplan Goals' editors read mid-save in both themes, controls as words (#1992, #1994); a second S364 session ran Long Beach City and the Program Requirements speed fix (#1993); KB notes `methodology-a-sweep-sees-only-the-states-its-seed-reaches` and `methodology-a-fill-that-does-not-flip-needs-ink-that-does-not-either` gained sections; handoff 365.
- 2026-10-11 (S363 SkyCedar): Long Beach City's Requirements tab sits inside `<nav id="tabs">`, found by a runner probe; the reader counts a tab bar's own tabs (#1986); trial 2 read 11 of 12 from the tab and the full read runs; Long Beach City in the display builder's dated reads; Open Asks Sheet 63 (where a half unit starts); the Budget tab's UI pass (#1988); KB note `methodology-test-a-reader-fix-on-the-page-it-failed-on`; handoff 364 (SkyJuniper).
- 2026-10-11 (S361 SkyBirch): rules 4 and 5 merged and deployed with Sierra (#1974), COCI status chips (#1972), Riverside City 39120 removed by Sam's own paste, Long Beach City's read started, the extraction push guard (#1976), the Workplan Goals UI pass (#1977), the two-call extraction built (#1978); S360's lessons section and S327-S333 moved to the archive; KB note `methodology-a-path-filter-compares-pushes-not-branches`; handoff 362 (SkyAlder).

## INDEX update history, moved S373

- 2026-10-11 (S365 SkyRowan): UI passes on Vision 2030 (#2001; the actions now the CPL Workplan's words), Military Partnerships (#2004) and Noncredit & Learning Partners (#2005), and Team & RACI's two leftovers (#2003); Open Asks Sheet 65 (the Vision 2030 goal figures; which records CPL Pathways shows, measured at 18.2 MB and past the checked gate); KB note `methodology-a-published-file-carries-past-the-tables-read-gate`; handoff 366.
- 2026-10-11 (S364, second session): Long Beach City read, loaded and displayed, 305 of 379 (#1999; display build `344441813b01`, 1,515 rows); Program records builds on first open (#1993); Sam's retired-version ruling (#1995); the read job may run 360 minutes; handoff 365 and queue status corrected (#2000).

### INDEX update history moved 2026-10-13 (S377)

- 2026-10-12 S369 SkyLaurel: Long Beach City displayed (05811159eeee), the read policy live, curriQunet reader fixes for Chaffey and San Diego City, smoke 7s; handoff 370 (SkyHolly).

### INDEX update history, moved 2026-10-13 (S380)

- 2026-10-12 S372 SkyRedwood: Miramar displayed (#2041), Mesa's row applied (#2037), Sierra v91 7c precedent (#2040), the painting gallery (#2038), the course outline census (#2042 draft, Sheet 70); KB note methodology-a-course-title-reads-as-its-level.
- 2026-10-12 S370 SkyHolly: Long Beach City 38542 removed (Sheet 68 card 2, #2028); Chaffey read, loaded and displayed (#2027, build 496f2a71470a, 1,745 rows); San Diego City extracting; My College UI pass and the public contact measure (#2030); smoke 7s verb shape (#2031); Sierra 7c opening fix (#2032, A/B then deploy); handoff 371 (SkyMaple).

### INDEX update history, moved 2026-10-14 (S387)

- 2026-10-13 S376 SkyLinden: the Requirements-tab re-reads loaded and displayed (Mesa #2064, San Diego City #2068, Miramar #2070; build `98becf9fafc7`, 2,203 rows); SDCCD's outline index (#2065) and SLOs by college group (#2066, draft, on #2049); the trigger-file gate (#2069); KB note `methodology-a-trigger-file-must-differ-from-main`; handoff 380 (SkyAlder).

<!-- INDEX update history moved at S389 -->
- 2026-10-13 S380 SkyAlder: course_outcomes live (Sam's paste) and loaded at RCCD (#2049) and SDCCD (#2066), 4,894 rows; Chaffey's outcomes not public (#2073); the eLumen reader (#2072, fast publish/content read) and Coastline's CourseLeaf fixes (#2074, index.html pages, no course listings), both colleges extracting; KB note methodology-read-a-catalog-through-its-own-content-call; handoff 381.

## INDEX update history moved at the S392 checkpoint (2026-10-14)

- 2026-10-13 S384 SkyPoplar: #2083-#2086 merged and the build queue deployed; Program Requirements read in pages (#2088), once when signed in (#2089), and by college with a light index (#2090, open); the identity guard race fixed (#2087); Modesto and Palo Verde captures read; Open Asks Sheet 77; the pagination note updated.
- 2026-10-13 (S383 SkySpruce): Cabrillo displayed (#2078), Sheet 75 answered and carried out (#2082, #2083), the whole-harvest measure (#2084), the eLumen hub reader (#2085); handoff 384 (SkyPoplar).
- 2026-10-13 S382 SkyLarch: Coastline read (hidden Requirements tab), loaded and displayed; Cabrillo loaded; #2076 migrate runner and #2080 Annual Goals Under list merged; handoff 383.
- 2026-10-13 S381 SkyRowan: Bakersfield loaded and displayed (eLumen), the Progress view's counts open their lists, Coastline's near misses and Cabrillo's department menu; handoff 382 (SkyLarch).

## INDEX update history moved at the funding checkpoint (2026-10-14, beside S392)

- **2026-10-14 (S385 SkyHazel):** Sheet 77 cards 2, 3 and 5 built and merged (#2092 reviewer-only Table/Archive, #2093 the college's items on one line and in the MAP team queue, #2094 Modesto Junior and Palo Verde displayed); #2090 merged with clean first live reads; the migrate runner's first two applies; CLAUDE.md and the harvest lane back under budget. Handoff 386.

## INDEX update history, moved S395 (verbatim)

- **2026-10-14 (S388 SkyBuckeye):** course SLOs loaded at Cabrillo, Modesto Junior (#2103) and Coastline (#2105), nine colleges and 20,891 SLOs live; the addenda reading agent `program_source_addenda_read()` and the eight reads filed (#2107); Common CR Reference UI pass (#2108); handoff 389 (SkyPersimmon).
- **2026-10-14 (S387 SkyMagnolia):** course SLOs from catalog pages: eLumen (#2103, Cabrillo reading) and the Coast district outlines (#2105, Coastline reading); the seven colleges probed (#2101); the eight addenda read (#2102); Palo Verde's 2026-27 catalog picked by the census (#2104, two dry runs); KB note methodology-a-green-check-you-did-not-scope-is-not-evidence gains the fifth green; handoff 388 (SkyBuckeye).
- **2026-10-14 (S386 SkyElm):** Palo Verde's noncredit and no-total pages read (the catalog names courses under other subjects; pages print the degree total with general education), Modesto and Palo Verde procedure records (#2096); My College reads `program_record_college_items` (#2097); Southwestern and Fresno City captured, Open Asks Sheet 78 (#2098, CPLBrain #338); harvest lane compacted under budget; KB note `methodology-a-green-check-you-did-not-scope-is-not-evidence` gains the stand-in section; handoff 387 (SkyMagnolia).

## INDEX update history, moved 2026-10-16 (S397)

- **2026-10-14 (S390 SkySaguaro):** Southwestern merged with its procedure record (#2115); Fresno City loaded, displayed (build `04872c826890`) and its procedure record (#2120); the SLO links on Program records and COCI Lookup (#2116); the tabled line's email fixed at the generator (#2117); CIP Codes UI pass (#2118); the Acalog reader merged with San Joaquin Delta's capture (#2112); the Records view's District, College, SWP Region and CIP Sector dropdowns, Progress first, no Sierra (#2121); handoff 391 (SkyJuniper).
- **2026-10-14 (S389 SkyPersimmon):** record shape 5, the degree total a page prints (#2110, Sam's Sheet 78 card 2); the re-read path (#2111); Palo Verde's 19 (#2114) and Cabrillo's 55 re-read and replaced, Southwestern loaded and displayed (#2115); an Acalog reader, El Camino captured (#2112); COCI Lookup UI pass (#2113); Open Asks Sheet 79; lessons doc compacted (S353-S359 to the archive); handoff 390 (SkySaguaro).

<!-- moved from docs/INDEX.md Update history, S400 -->
- 2026-10-14 (the funding session beside S392): a noncredit-portion setting, the explainer's three funding boxes on one row with the credit and noncredit split and editable words, Bold and Italic in the passage editor (#2132, live 22:36Z); KB note methodology-a-share-target-inside-a-bounded-allocation-is-a-solved-weight; a section in handoff 393.

## INDEX update history moved at the S401 checkpoint (2026-10-17)
- 2026-10-15 (S393 SkySycamore): Sheet 82 carried out (#2136); extraction v9 (#2138; v8 failed every call); Cerritos's reconcile steps (#2139); the overnight schedule and the $40 go (#2134); Open Asks Sheet 83; handoff 394.

## INDEX update history moved at the S404 checkpoint (2026-10-17)

- 2026-10-16 (S397 SkyCatalpa, the CPL Queue routine): Allan Hancock loaded; Monterey Peninsula's reconcile reread; wave 4's display build `66b50c86891e` (#2157, superseding #2156); Open Asks Sheet 84 published; handoff 398 (SkyLinden).
- 2026-10-16 (S396 SkyJacaranda): wave 4 read, nine colleges, five loaded; Orange Coast and Monterey Peninsula's reconcile steps; #2148 and #2151 merged; handoff 397.
## INDEX update history moved at the S408 checkpoint (2026-10-17)

- 2026-10-16 (S400 SkyBirch, Sam's session): My College's Sierra in Sierra AI's format on Sam's ask (#2171); the program search's no-match path fixed after the smoke's 7l timeout (#2173, applied, 2,742 to 204 ms); wave 5's second half loaded, build `9237d2cbf931` applied (#2170); nine procedure records (#2172, #2174); Butte parked for its reader; handoff 401 names SkyManzanita.

## INDEX update history moved at the S410 checkpoint (2026-10-18)

- 2026-10-17 (S402 SkyToyon, Sam's session): two catalog-sweep waves, Lake Tahoe, Marin, Butte and Las Positas (#2186, build `40d138a9f533` applied), then Los Medanos and Mission (#2187, build `7c13e42917c5`); the eLumen reader takes catalog links written whole with a fragment (Los Medanos 7 to 83 of 97); the college workflow refuses a run naming no college; ten procedure records; Open Asks Sheet 87 asks to correct five registry rows; handoff 403 names SkyYarrow.

### INDEX update history moved 2026-10-18 (S412)

- 2026-10-17 (S403 SkyYarrow, the 08:12Z firing): two firings had both run as S403 and written a PDF reader each; one reader from the two (#2192, build `726bde512dfa`, 11,862 programs, East LA's 120 included); LA City and Pierce rescored free (outcomes failures 145 to 12 and 85 to 15); a reconcile now refuses a moved page, and the 49-row undo waits on Open Asks Sheet 88; harvest lessons S372-S385 moved to archive 2.
- 2026-10-17 (S403 SkyYarrow, the CPL Queue routine): a whole-catalog PDF reader and the PDF wave, fifteen colleges loaded unchecked (1,725 records, #2189, build `7f4744e8e4ae`, 11,742 programs); Cerro Coso's robots.txt refuses its catalog PDF; the outcomes check fails on PDF text (open); handoff 404 (SkyBuckeye).

### INDEX update history, moved verbatim (S413)

- 2026-10-17 (S404 SkyBuckeye, the 10:12Z firing): own-HTML catalogs take the generic sitemap road (#2194); College of San Mateo loaded 55 unchecked (60 of 64 found, $4.98, build `928577b30f0f`); Los Rios's hosts still serve the reader 404; the MAP Data Quality UI pass (#2193); handoff 405 (SkyCholla).
- 2026-10-17 (S405 SkyCholla, the 12:12Z firing): own-HTML reads keep to the catalog's year (`year_scope()`); Coalinga, Skyline, West Valley, Copper Mountain, San Diego Continuing Education and Solano loaded unchecked; the scorer reads stand-in ligature glyphs (Solano, Santa Rosa reread); the hand-filed catalog step; display build `c111c9b05ca0` (12,424 programs, 92 colleges); Open Asks Sheet 89; handoff 406 (SkyIronwood).
- 2026-10-17 (S406 SkyIronwood, hand-opened): a hand-filed catalog is read from the copy a person posted, its hash pinned on the first fetch (#2199); the eight refused colleges loaded unchecked from Sam's copies (1,427 records, $131.00, build `fec9782a4dbc`, 13,851 programs at 100 colleges); Open Asks Sheet 90; MAP Export's UI pass (#2200); harvest lane compacted under its budget.

<!-- INDEX update history, moved by the S419 checkpoint (2026-10-18) -->
- 2026-10-18 (S411 SkySotol, hand-opened): `d6cc1fde7ea3` applied; Hartnell read by its Coursedog code headings (8 loaded, 14 moved to their own heading, 4 wrong-page rows removed under a receipt); a kept record must come from its source's page; SmartCatalog by the generic road and vendor-host page reads; display build `182e810e207d` (15,651 programs at 111 colleges, #2216). Sam asked for the CER on procedures: new lane `cer-procedures`, the v3 mock-up, Open Asks Sheet 93. Handoff 412 (SkyJoshua).
- 2026-10-18 (S410 SkyYucca, hand-opened): `ffd6929a4f90` applied; Cañada filed from Sam's catalog-files copies (Sheet 92 card 1) and Hartnell read through a PDF catalog step that names its file; 62 and 68 loaded unchecked, display build `d6cc1fde7ea3` (15,647 programs at 111 colleges, #2213); TMC Builder's UI pass (#2214); four `cpl_memory` rows; no decision sheet open. Handoff 411 (SkySotol).
- 2026-10-17 (S409 SkyOcotillo, hand-opened): `f949e7c0ea35` applied; Cuesta loaded 181 unchecked and display build `ffd6929a4f90` (15,517 programs at 109 colleges, #2210); Exhibit Adoption's UI pass, its table and matrix measured for the first time (#2211); Cañada's 2026-2027 PDF found behind its robots.txt refusal (Open Asks Sheet 92); the Coursedog and SmartCatalog hosts read; handoff 410 (SkyYucca).
- 2026-10-17 (S408 SkyAgave, hand-opened): the code finder reads a run of numbers after one subject (#2206, Glendale 190 to 258 found); the outcomes check reads a list number at a line's end (#2207, Ohlone 125 failures to 8); East LA's rows carry their year; Desert, Pasadena, Glendale, Grossmont, Ohlone and LA Southwest loaded unchecked; display build `f949e7c0ea35` (15,336 programs at 108 colleges, #2208); handoff 409 (SkyOcotillo).

## INDEX update history, moved out
- 2026-10-18 (S412 SkyJoshua, hand-opened): the CER procedures run (#2217: store, quality gate, `cer-classify`, nightly workflow; first pass $8.30, 1,116 of 1,322 pre-filled, 428 held), the Procedures lane (#2218), #2219 open; `182e810e207d` applied; Crafton Hills loaded (64); Rule 8's read reaches undated rows; exhibit lessons compacted to an archive; handoff 413 (SkyPinyon).
- 2026-10-18 (S413 SkyPinyon, hand-opened): #2219 landed through #2220 with the wave's display build (`3a5ed5d7bcf3`, 15,770 programs at 113 colleges; Taft loaded 55); the classifier's follow-up pass (1,287 of 1,322 pre-filled, 396 held, $2.67); the CER's three views, Needs you, Procedures, Reference (#2221, the UI pass); the harvest reads a slashed course subject (#2222: Crafton Hills 76 of 79, build `3f93779f0115`, 36 misread records at three colleges named for a reread).

- 2026-10-18 (S414 SkyChamise, the routine): the Coursedog reader (Merced: 154 of 172 found, 153 loaded, 125 passing, $9.14); the slash rescoring by free reconcile runs (Glendale 14, De Anza 12, LA Trade Technical 5, Crafton Hills 2 replaced) and the `THART/S` reading; display build `7e4a2a9c5ba7`, 15,946 programs at 114 colleges (#2224); San Joaquin Delta's rescore held.

### INDEX update history, moved verbatim on 2026-10-19

- 2026-10-18 (S418 SkyMadrone, hand-opened): the first CER saving run (926 titles as 1,852 `kb_curation` rows under 7 cohorts) and the fold's first apply since July (1,102 assignments, 12 supersedes, 455 credential records, 18 held; 4,915 titles); Sheet 96 answered *keep* at 17:23Z; #2230 deployed after the third A/B (7s traced to variance: a place question never reaches the changed block); the Our Process UI pass (#2233) and S417's checkpoint (#2234) merged; the Commons mock-up at version 3 with its Exhibit pair re-measured; the stale S338 checkpoint PR closed.
- 2026-10-18 (S417 SkyManzanita): #2231 merged and the CER lane's first saving run staged (preview 926 under 7; #2232 quotes the workflow's save options); the Commons mock-up revised on Fable's review with every figure re-measured; #2230's live-program gate fixed after the A/B lost 7l; the Our Process UI pass (#2233); Open Asks Sheet 96 drafted (CPLBrain#385); handoff 418 (SkyMadrone).
- 2026-10-18 (S416 SkyCeanothus): Sheet 94's three CER rulings built (#2231: the per-item fold hold, the procedure save with its receipt and undo, the sign-off and Curate panel retired); Sierra reads complete records (#2230); the Commons row mock-up; lessons S416 in `cer_v2_redesign_lessons.md`.
- 2026-10-18 (S415 SkyRedbud, the routine): San Joaquin Delta's held rescore settled by a printed degree floor (152 to 154 passing, 71 reread) and Taft's transfer degrees counting Cal-GETC as the statewide 34 (24 to 34, 17 reread), #2226; display build `48cb66f19cff` (15,946 programs at 114 colleges); Open Asks Sheet 94; handoff 416 (SkyCeanothus).

### INDEX update history, moved verbatim on 2026-10-19 (the merge with #2264)

- 2026-10-18 (S419 SkyCottonwood, hand-opened): the Commons' step 1 landed (#2237: the Progress view drawn by the shared `commons_progress.js`, nothing changing on screen, the status file under `kb/status/`) and Sam approved the mock-up (19:08Z, to S417; version 4 collapses per row and all at once); Cañada's PDF picker reads the catalog's three heading shapes (#2241; the capture-only run moved 26 pages, eight of the eleven empty records onto their own headings); `docs/commons_lessons.md` and a KB note on the shared-view pattern added.

### INDEX update history moved 2026-10-20 (S430)

- 2026-10-19 (S421 SkyTupelo): the second reader built (#2246); Cañada's Cal-GETC step and the six-row rollback (#2247); three Jev sittings read, verdicts in `kb/jev_harvest_verdicts/`; lessons S421; handoff 422.
- 2026-10-19 (S424 SkyBuckthorn): the Jev sitting asks only about the gating checks and two certificate scorer rules (#2256); Taft's renumbered BUSN 550/555 and Administrative Services II on its own page, display build e0407fdcb54b (#2258); Open Asks Sheet 98 answered (remove Taft's 38661 row; the second reader on ice); lessons S424, S394-S398 archived.

### INDEX update history moved 2026-10-20 (S434)

- 2026-10-19 (S426 SkyTorreya): the Annual Workplan Goals tab edits every year (a Current per year), shows its stored descriptions, Set targets fixed, the formatting pass; KB note on idempotent controls; handoff 427.

- 2026-10-19 (S427 SkyMadrona): Sheet 99 rulings 1, 2, 3 and 5 applied (the nightly confirm's first run, AGAB, the Validate column), the AGRI sitting built, Open Asks Sheet 101; handoff 428; KB note methodology-a-ruling-names-a-record-the-store-may-count-another.
- 2026-10-19 (the funding side session beside S427): the memo, letter, report and brief as saved passages leading with SB 135 (the opening follows the explainer's Overview passage); CPL Funding in Motion reads the model through a filed, stamped `figures.json` that Refresh everything checks; Step 2 in the Step 1 box; two reset controls retired; the Scenario block beside the Project block (#2265); KB note on the filed stamp; lane and lessons compacted under their caps.

## INDEX update history (moved 2026-10-20, S438)
- 2026-10-20 (S428 SkyPinyon): the CTDL partner exchange scoped on Sam's ask (Credential Engine and WestEd, COBI authoritative): the strategy as a Claude Doc, the lane `ctdl-partner-exchange`, CE's xTRA code and ten Ready to Publish extracts read, Open Asks Sheet 102; handoff 430; KB note reference-ctdl-classes-for-cobi-records.

## INDEX update history, moved S444 (2026-10-22)

- 2026-10-20 (S437 SkySagebrush, opened by Sam): the CR Progress view (#2287), the C-ID site found and baselined (#2289), Open Asks Sheet 108 answered, the auto-mark rule drafted and waiting on Sam's word; handoff 438 (SkySumac); no KB note.
- 2026-10-20 (S436 SkyTanbark): the Exhibit Progress view (#2285), the Fact Sheet's UI pass, Open Asks Sheet 107; handoff 437 (SkySagebrush).
- 2026-10-20 (S434 SkyElderberry, the routine): Sierra's third UI pass, Copy, Helpful, Not helpful and the note's Send as underlined words (#2281); Sheet 105 still open; the strays wait on a curator's discipline calls; handoff 435; no KB note.
- 2026-10-20 (S433 SkyCoffeeberry, the routine): the two ENVR forestry pairs queued for a faculty reviewer as `surfaced` pairs (#2278); the CSR quarterly routine compares the handbook with the accepted 19th edition on a quarterly cron (#2279); the CSR lane compacted under its budget; Sheet 105 still open; handoff 434; no KB note.
- 2026-10-20 (S432 SkyYerbaSanta, the routine): Sheet 104 applied, ten forestry identities to ENVR and four wine to AGPR, each discipline following its code (#2276), re-keyed live and read back; the quarterly probe read a second time; Open Asks Sheet 105 asks about the two forestry stragglers (the permission check held their apply); handoff 433; no KB note.

## INDEX update history, moved S448
- 2026-10-21 (S441 SkyIronbark, the CPL Queue routine): S440's harvest PR #2306 merged; the CLAUDE.md pass sent as Open Asks Sheet 109 (five cards, nothing applied); the two Python tests failing on main fixed.
- 2026-10-20 (S439 SkySaltbush, opened by Sam): the funding page prints JST counts and the 75% need, office hours and the MAP Dashboard chat as help, the landing page and its training video in the Contents, Funding Model Numbers; the introduction is always the published two-priority film, rebuilt from Scenario 3 with a new MP4 (#2296-#2298); S438's memory rows written; handoff 440 (SkyChaparral); no KB note.

## INDEX update history, moved S466 (2026-10-24)

- 2026-10-23 (S456 SkyYarrow): Sheet 115 card 1 carried out (17 older-build program records removed with a receipt); Hartnell's Coursedog code-kind gate and Sierra's noncredit section; KB note on a bulk delete's receipt; Open Asks Sheet 117; handoff 457.
- 2026-10-23 S455 SkyMonkeyflower (the CPL Queue routine): Hartnell's course units from its vendor's own course data (59 of 96 pass), Sierra's IT Cybersecurity read through `with_acronyms`, display build b0a96907bf83 (#2376); lessons S455; handoff 456.
- 2026-10-23 S452 SkyPoppy (the CPL Queue routine): Long Beach City loaded, display build 504ae8333118 (#2370); the UI pass on the Funding model page (#2369); free captures at East LA, Marin and San Mateo; lessons S452; handoff 453.
- 2026-10-23 S451 SkyLupine (opened by Sam): the page reader's `cq_view` (#2365); the S449 queue landed, Palo Verde, Cypress, Berkeley City, Hartnell by its Coursedog site (96 of 112, from 73) and Mt. San Antonio, display build 25fe751ccd0a (#2367); lessons S451; handoff 452.
- 2026-10-22 S449 SkyBuckwheat: the harvest queue after S448 (Mt. San Jacinto settled, Berkeley City's codes read through `cq_view`, Palo Verde's new Acalog catalog, Cypress, Hartnell by its site); lessons S449; handoff 450.
- 2026-10-22 (S448 SkyDeergrass, opened by Sam): CPL Pathways' clear, faster list and the COBI header (#2353); My College folded into CPL Pathways, search box and alphabetical list (#2355); My College off the menu, the search redraws on a college change (#2356); handoff 449.
- 2026-10-22 (S447 SkyBrittlebush, opened by Sam): Sheet 112 answered, later (#2348); an Administration of Justice address and a hyphenated course code (#2349); Mt. San Jacinto and Santa Barbara City reread, build be2635ed5b73 (#2350); the harvest lessons' S399-S403 to archive 3; handoff 448.

## INDEX update history, moved by S468 (2026-10-24)

- 2026-10-23 (S457 SkyColumbine): the S456 wave and Sierra's ESL certificates landed; the scorer's low-end-meets reading built and held on Open Asks Sheet 119; handoff 458.

## INDEX update history, moved by S469 (2026-10-24)

- 2026-10-23 (S459 SkyBuckeye): the Library's Made-for build; the meets reading rebuilt and applied; the six older-build rows removed; KB note `methodology-a-measured-count-verifies-a-rebuild`; handoff 460.
- 2026-10-23 (S458 SkyLarkspur): the team phrase lists a Library piece publicly (#2390, applied live); Open Asks Sheet 120 with six cards on visuals made for an entity and the Made-for mock-up; S457's checkpoint merged (#2388); the Coordinator Guide audit started; handoff 459.

## INDEX update history, moved by S470 (2026-10-25)

- 2026-10-24 (S461 SkyManzanita, scheduled): the writer's fourth and fifth consumers (#2403, #2405), the Sierra UI pass, one seal blue (#2404); light checkpoint; handoff 462.

## INDEX update history, moved by S471 (2026-10-25)

- 2026-10-24 (S464 SkyBuckeye, scheduled): the house_voice lint backlog 23 to 1 (#2414); light checkpoint; handoff 465.

## INDEX update history, moved by S483 (2026-10-26)

- 2026-10-25 (S471 SkyPenstemon, the CPL Queue routine): the noncredit builder emits nc_cdcp, nc_exh and nc_course from a service-role RPC, applied and read back, and How to meet it for the two noncredit conditions (#2437); full checkpoint; handoff 472.
- 2026-10-25 (S470 SkyBlueCurls, opened by hand): the ironworker film's Library link on GitHub Pages and the Veteran map's UI pass (#2432); the noncredit attestation on the funding page, applied after it reached Pages (#2433, #2436); a lessons archive within budget (#2434); full checkpoint; handoff 471.

## INDEX update history, moved by S500 (2026-10-27)

- 2026-10-26 S490 SkyGooseberry: the Library's Regenerate and documents on a record, the MAP team's notes on a college page, the CPL Opportunity page under `library/`, Open Asks Sheet 131 answered (#2472); full checkpoint, handoff 491.
- 2026-10-26 S488 SkyThimbleberry: Hartnell's last eight failing tabs read (light checkpoint); handoff 489.
- 2026-10-26 S487 SkyHuckleberry (the CPL Queue routine): Hartnell's pooled subject lists; a `pool_lists` reconcile step, General Studies 17912 passes, Hartnell 80 of 94 (#2463); full checkpoint, handoff 488.

### docs/INDEX.md update history, moved by S503 (2026-10-27)

- 2026-10-26 (S492 SkyCloudberry): the public funding page's header and WCAG 2.2 AA pass for the CPL Summit; KB note `methodology-geometry-is-half-an-accessibility-audit`; handoff 493.
- 2026-10-26 S491 SkySalmonberry: wording help for Sierra's instructions (Check wording #2474, Suggest wording and the built-in naming rule #2475, deployed), four live instructions corrected, Open Asks Sheet 132 answered; funding attestation form drafted (#2476); full checkpoint, handoff 492.

### docs/INDEX.md update history, moved by S504 (2026-10-28)

- 2026-10-27 (S493 SkyThimbleberry): the MAP link with each exhibit's builder on the CPL Opportunity visual, EACR, CPL Pathways, My College and CER (#2485, #2488); the public funding page's Step 2 fixed for the Summit (#2487); Open Asks Sheet 134 answered; handoff 494.

## INDEX update history (moved)
- 2026-10-31 (S535 SkyGooseberry, the CPL Queue routine): Monterey Peninsula 110 to 176 of 197 passing on three reconcile steps (a new `or_units` kind for CourseLeaf "or" rows, the 2026-27 Cal-GETC words, the 60 a floor on "electives, if needed"); display build 598ff64220dd; lessons in `docs/program_requirements_harvest_lessons.md` (S535); handoff 536 for SkySugarberry.
- 2026-10-27 (S496 SkyLingonberry): Hartnell CalGETC 45096 passes, 82 of 94 (#2504, reread 40460714483, display build 588cfa081bee); the Funding film's UI pass, clean; handoff 497.

Moved from docs/INDEX.md's update history (S507):

- 2026-10-27 (S497 SkyCrowberry): Hartnell Music 43887 passes on the new `repeat` reconcile step, 83 of 94 (#2506, reread 40469123943, display build 8f8a282ca526); handoff 498.

## INDEX update history, moved 2026-10-29 (S509)

- 2026-10-27 (S502 SkyHuckleberry): My Institution hidden (#2513), the PII fix (#2515), the review gate (#2514, in CI), Sierra's deploy held on its A/B; handoff 503.
- 2026-10-27 (S500 SkyBlackberry): Delta Architectural Drafting 22244 passes on the new `unit_line` reconcile step, 200 of 203 (#2510, reread 40527733110, display build 89a4abee9d1c); the CPL Queue routine beside Sam's S500, whose handoff carries it.
- 2026-10-27 (S499 SkyCloudberry): Delta Cal-GETC 45621 passes on a `pool_areas` step, 199 of 203 (#2508, reread 40502212690, display build 5dc18d9ea80a); handoff 500.

## INDEX update history, moved 2026-10-29 (S517, Sam's session)

- 2026-10-28 (S505 SkyBoysenberry, Sam's session): Glendale 45 to 80 passing on its catalog's own words (#2529: prefix aliases and renumbers, the capture reads an aliased prefix, the outcome scorer reads letter-spaced text; display 41c15eee3f75); MAP links open the Non-Military card and read Request Adopt, Sierra deployed (#2530); handoff 507.
- 2026-10-28 (S505 SkyBoysenberry): four orphaned PRs resolved: S450's #2379 ported (#2527: the NC rules fold gone under Scenario 4, his outcome words), the credential watch runs of 10-19 and 10-26 and Credential Engine's top 50 with CTID in one rebuild (#2528); Privacy's UI pass; handoff 506.
- 2026-10-28 (S504 SkyMulberry): the narrated funding film speaks Sam's own script, Draft 7 (#2525: #2323's Draft 6 ported, the period and the Noncredit CPL Lead, the Veteran Star at 64, v13); the Library record at v13 (#2524, two receipts); open side-session PRs in `scheduled_sessions`; handoff 505.
- 2026-10-27 (S503 SkyElderberry): Sierra deployed (run 40573709433; 7v's guard on the negation stripper, #2520); the funding film's recorded piano at 107, v12 and the narrated Draft 5 (#2521, Sheet 137 answered); the funding lane under budget (#2519, #2522); handoff 504.

## INDEX update history moved S518

- 2026-10-28 (S506 SkyCloudberry, Sam's session): the funding forms start with the email and acknowledge an allowed address (#2531; the domain gate measured read-only); the Attest word, gray boxes, memo TBA, one curator text section that keeps a deletion; NOCE's nocccd.edu and *Awaiting CPL Initiative Confirmation* (#2533); the FAQ on Open Asks Sheet 138; no handoff file (S507 writes 508).

## INDEX update history moved S520

- 2026-10-29 (S509 SkyElderberry, Sam's session): #2537 merged after S508's floor fix; the Library built to mockup Version 20: one card per project (#2538, `cpl_library.project` by receipt), the one *Create or Remediate a Document* panel (#2540), and in-browser remediation of a .pptx or .docx with chart drafts from their numbers and *Draft from the picture* through the new `alt-text-draft` function (#2541); handoff 510.
- 2026-10-29 (S508 SkyGooseberry, Sam's session): #2536 and CPLBrain#525 merged; Malone's twelve funding FAQs as he wrote them (#2537); the funding page loses its footer, opens on the published scenario and keeps one link to the public page; the map.rccd.edu privacy edits and security and accessibility scan for Malone; the Library remediation mockup; handoff 509.

## Moved from docs/INDEX.md Update history (S521, 2026-10-30)

- 2026-10-29 (S510 SkyWineberry, the CPL Queue routine): the night's UI pass (Funding model, clean); the Library checks a deck's contrast against the shape its words sit on and offers the nearest passing color (#2543); the funding Refresh comment and splash; handoff 511.

## Moved from docs/INDEX.md Update history (S530, 2026-10-30)

- 2026-10-29 (S519 SkyCloudberry, Sam's session): the CSM team's funding fixes and Sam's eight FAQs (#2560); Sierra answers with what loaded when a read times out, and the MAP Custom Report load moves to 10 PM Pacific (#2561); the College Identity findings link scrolls in place (#2562); Open Asks Sheet 140, ruled; a KB note on cron drift; handoff 520.
- 2026-10-29 (S518 SkyServiceberry, Sam's session): the Library draws each slide beside its item, removes empty boxes, titles every slide and writes Claude's script into the notes (#2556, #2557); the funding page on a phone (#2558); the FAQ in six groups and Sierra reading it (#2559); handoff 519 (light).
- 2026-10-29 (S517 SkyPartridgeberry, Sam's session): the Library's remediation draws each picture with its slide, reads QR codes, drafts every picture before the report opens, counts down to the Chancellor's Office review on one bar, and files a file in the Library as it opens (#2552 to #2554); a KB note on alt text a program wrote; handoff 518 updated.
- 2026-10-29 (S517 SkyPartridgeberry, the CPL Queue routine): the Library measures a chart's contrast in a deck, document or workbook: series against the plot area, Office's own colors as drawn, its words against what they sit on (#2551).
- 2026-10-29 (S514 SkyMarionberry, the CPL Queue routine): the Library remediates a workbook (.xlsx): sheet names renamed everywhere they are referenced, alt text on charts drafted from their numbers, tables with no header row, data with no table and merged cells listed (#2548); handoff 515.
- 2026-10-30 (S530 SkyBuffaloberry): Los Angeles Valley 114 to 167 of 204 passing through its degree steps and a moved-page guard that reads the record's heading; the funding rows show a waiting request with a reviewer's Accept; MAP links from `map_links.js` on two more surfaces (#2588); Sheet 146; handoff 531.
- **2026-10-30 (S531 SkyOlallieberry):** the Chancellor's Summit address public on Pages with the gentle sound Sam picked (#2592); Los Angeles Valley 167 to 186 passing once the page finder reads State Code (#2596); display builds 956fee0d62bc and f8c94ef23142; handoff 532.
- 2026-10-30 (CER redesign side session): the Exhibits mock-up (`docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html`), the CER and college-identity lanes, `docs/cer_v2_redesign_lessons.md` (2026-10-30), the handoff `docs/cer_redesign_handoff.md`.

## INDEX update history moved (Exhibits build, SkyElderberry)

- 2026-10-31 (CER redesign build, SkyGooseberry): Open Asks Sheet 147 answered whole; the high school and ROP rule and the CPL-AI matching in the Program Requirements dialog (#2601); mock-up version 26; KB note `methodology-a-record-level-join-needs-a-word-guard`; handoff `docs/cer_redesign_handoff.md`.

### From docs/INDEX.md update history (moved S543, 2026-11-02)

- 2026-10-31 (Exhibits tab build, SkyElderberry): the Commons' CER row opens Exhibits (#2612); the Credential Catalog's *Worth a faculty review* (#2613); Sam's AP rule in `brand-family`, College Board's official names (#2614); the IT/AI catalog's MAP join needs the issuer (#2615); Open Asks Sheet 149; light checkpoint.

### From docs/INDEX.md update history (moved S545, 2026-11-02)

- 2026-11-01 (Exhibits tab build, SkyInkberry): IB on the AP pattern, brand-family's `ib` lane and the reference fold, 49 IB credentials into 24 with one issuer name (#2632); Open Asks Sheet 150 (the IB fold carried out, CLEP's names held); the CER lane trimmed under its budget.

- 2026-11-01 (Sam's session, SkyBlatusoff S541): the Exhibits List grew live from its preview (find by place, find and replace, AI sort with suggested folds and Re-point, Edit every row, Basis, phone resize, #2649-#2651); the exhibit-to-cert link, ASE first (#2652); the credential harvest moved into the CPL queue as step 10 (#2653); the statewide flag's 84-of-152 finding in the authoritative-signal note
