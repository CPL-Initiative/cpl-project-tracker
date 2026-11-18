---
title: Governance & team enablement — lessons
date: 2026-08-05
tags: [governance, decision-rights, ways-of-working, ai-team, onboarding]
artifacts:
  - governance.js
  - kb/governance_register.json
  - docs/working_with_claude_code.md
  - tests/governance.test.js
related:
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
  - "[[docs/kb-notes/methodology-route-to-a-determination-they-already-made]]"
  - "[[docs/map_users_lessons]]"
---

# Governance & team enablement — lessons

Workstream scratchpad. Append a dated section per checkpoint.

---

## 2026-08-05 — Session 120 (SkyMail): the governance starter + the team guide

### How this started

Sam asked, mid-session: *"What do you suggest to establish or improve our
governance?"* — after the MAP Users work, not before it. That ordering is the
whole reason the answer had any substance. I'd just spent a session hitting
concrete problems, and the diagnosis wrote itself:

| Looked like | Actually was |
|---|---|
| 25 colleges with no student contact | Nobody owned that field |
| Contacts view had 24 fields, we read 11 | Nobody owned knowing the source |
| Test colleges in the public headline | Nobody owned the definition of "a college" |
| Disciplines rendering as one 1,364-char cell | Nobody owned the format contract |
| Jessica knowing things no system held | Nobody owned capturing curator knowledge |

**Every one of them was a governance gap wearing a data-quality costume.** None
was a bug in the ordinary sense; each was *"no one had a decision right or an
obligation here."* Advice grounded in five things that actually happened that day
landed very differently from a generic maturity model — Sam's reply was
*"Excellent, if uncomfortable, guidance."* The discomfort was the signal that it
was specific enough to be useful.

**Lesson: don't answer a governance question in the abstract when you have just
finished collecting evidence.** The evidence *is* the answer.

### The design decision that matters

A governance page is, by default, the most useless kind of document: a
description of intentions that drifts silently from reality and that nobody
re-reads. Two choices made it an instrument instead.

**1. Store the reasoning; measure everything else at render time.** The register
holds allocations and rules. Any *fact* the page could be wrong about is computed
live from the gated tables. The sharpest instance: the register says the
semester contact-refresh cadence was **decided** (Session 87). The page reads
`map_college_nudges`, finds **zero rows**, and prints **"never run."**

That single line is the most actionable thing on the page — and it exists *only*
because the number is measured rather than asserted. Had "state" been a stored
string, it would have said "semester" forever and the page would have been a
polite lie.

**2. Render the absence.** Every `owner` field ships as `null` and displays as
**"needs an owner"** in red, counted in the headline stat. Who is accountable on
*our* side is the one thing a session cannot infer from data. Leaving those blank
would have made the page look finished; showing them as gaps makes it a meeting
agenda. The Copy-as-Markdown export preserves both markers, so it stays honest
when it leaves the tab.

### The uncomfortable finding

The cadence had been **decided in June and never run once**. The nudge
instrument, the recipient picker, the last-nudged log — all built, all working,
zero rows.

That reframed my whole recommendation. The constraint was never tooling. **A
cadence nobody runs is a document, not governance**, and the fix is to run one
loop end-to-end with a named owner before designing any more. I'd have missed
this entirely by reading the code, because the code was fine. It only showed up
because I queried the *state*.

**Lesson: to audit governance, don't read the process — measure whether it ran.**

### Team enablement — and why the guide is the weaker half

Sam asked for onboarding material as the team grows (Ashley, Jessica, Malone;
an enterprise account coming). He supplied the best content himself, in a Teams
message to Ashley: ask for an HTML visual and iterate live; think of it as *a
tool you come back to, not a one-time Excel sheet*; ask for a COBI tab when you
like what you see.

I wrote the guide — and then wrote the more important half, which is that **the
same material belongs in `CLAUDE.md` as session obligations.** The reasoning:

> A habit that depends on a new user remembering it will fail on their first day.

Ashley shouldn't have to read a document to get attribution on her contributions
or a warning before a cross-impact write. The session should just do it. The
guide is for people who want to get *better*; the standing rules are what protect
people who haven't read anything.

### On agents — recommended NOT yet

Sam floated *"maybe need some established agents who are mindful of these
things."* I pushed back, and the reasoning generalizes:

**An agent must be invoked, so it fails precisely when someone forgets — which
is the failure mode being designed against.** Standing instructions load
automatically, every session, including the first one a new person runs.

The allocation I recommended:

| Need | Tool | Why |
|---|---|---|
| Always-on habits | Standing instructions | Can't be forgotten |
| A deliberate ritual | Slash command | One keystroke, repeatable |
| A procedure for one kind of work | Skill | Loads only when relevant |
| Parallel or adversarial work | Agent | A genuine second opinion |

The one agent worth building later: a **cross-impact reviewer** — *what else
reads this, who is mid-flight, does this touch restricted data or the public
site.* That's the thing a single session is structurally worst at being honest
about, because the session is the one that wants to ship. Adversarial review is
what agents are actually for; habit enforcement is not.

### Current state

- **Governance tab** live under Sierra & Team Tools, team-gated (#997). 10
  decision rights, 8 acceptance standards, 5 cadences, 6 open questions — every
  owner deliberately unset.
- **`docs/working_with_claude_code.md`** + a `CLAUDE.md` "Working with the MAP
  team" section (#998).
- `tests/governance.test.js` (34); full suite 185 files green.

### Next concrete step

1. **Fill the owner column.** Six open questions are in the tab; OQ-01 (who owns
   each row) is the one everything else waits on. It's a review, not a writing
   task — that was deliberate.
2. **Run the contact-refresh cadence once**, end to end, with a named owner. It
   is the only loop on the page that has never fired, and the worklist it needs
   now exists.
3. **Decide CIP's promotion criteria before the fall 2026 cutover** (OQ-03).
   TOP is the cautionary tale of an input trusted by default.
4. **Cut the load-bearing list** (OQ-05) — I marked 8 of 10 as load-bearing,
   which is almost certainly too many. Governing everything is how governance
   dies.

---

## 2026-08-05 (later) — the defect Sam caught in an hour

Sam, on opening the tab: *"How do I curate by adding an owner? Doesn't appear to
be editable."*

He was right. I shipped a page whose **entire premise** was that the empty owner
cells *are* the review — and gave nobody a way to fill them in. A review artifact
without a pen is a poster.

Worth recording because the failure is a specific, repeatable kind: I designed the
*honesty* property carefully (render the absence, count it, keep it red) and never
asked the next question, **"and then what does the reader DO?"** The gap was
invisible to me precisely because I was admiring the diagnostic.

**Fixed in #1000** — click any owner cell to assign a name and note. The design
decision underneath it is the reusable part:

> The register is **committed** and rebuilt by sessions; owners are **curated**
> live by the team. Different lifecycles, so different homes.

Owners live in a separate gated `governance_owners` table that overlays the
register by row id, so a future session regenerating `kb/governance_register.json`
can never wipe an assignment. Same split that keeps `map_college_nudges` out of
`map_college_contacts`, where the monthly full refresh would eat the curator's
work. No delete policy — clearing an owner writes null, so who-assigned-what
survives.

**Generalization: any read-only artifact that names a gap should be checked for
"can the reader close it here?"** If the answer is no, either add the affordance
or say plainly where the work happens instead. Naming a gap and providing no
handle is a small betrayal of the reader's attention.

## 2026-11-05 — Session 576: two Claude Team accounts, and what setup really is

- **Setup is access.** A session reads a repo only when the person's GitHub account reaches it and the Claude GitHub
  App is installed on it. Seats, GitHub teams and the managed CLAUDE.md are the whole job; the instructions ride along.
- **A rule a person must remember to install fails on day one.** The three-repo check lived in a per-machine script.
  An Owner can push it to every member as a managed CLAUDE.md (Organization settings, Claude Code, Managed settings), so
  even a session with no repo carries it. The docs imply the editor takes a CLAUDE.md and do not state it; confirm there.
- **A personal repo cannot be delegated.** Collaborators on a personal-account repo can push but cannot manage access,
  so Malone can run CPLBrain's access only after it moves to an organization.
- **Claude chat has no org-wide instruction.** A shared Project (instructions plus uploaded knowledge, visible to the
  account) is the documented route; connectors work only in private projects. Cowork takes org skills, not CLAUDE.md.
- **Partner accounts get their own memory, not ours.** The CO pilot gets an `aa_memory` table in its own Supabase,
  trimmed from `cpl_memory`; opening our private stores to another organization is a Rule 10 (a3) read surface.
- **Sam asked for his and Malone's steps before the team's** (*"make sure there are separate instructions for me an
  Malone to get set up before the team members get set up"*): an admin's own access is the first dependency, and the
  page should say so in order.


## Moved from the lane (S641)

The Governance tab paragraph and the CI and concurrency paragraph, verbatim as they stood at about 11:50Z 2026-11-12, before #3150 merged into the lane's text.

✅ **LIVE — team-gated ⚖️ Governance tab: 23 decision rights · 8 acceptance standards · 7 cadences · 8 open questions** (SkyMail #997/#998; Sierra added SkyMiner #1031/#1034/#1036; expanded 12→18 SkyGate). **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** The register **measures itself**: the contact-refresh cadence was decided in June and has never run (0 rows in `map_college_nudges`), and CA-06 measured Sierra feedback at *21 of 25 untriaged* until **Sam cleared the whole queue 2026-08-26 — 0 still to do, 51 of 51 handled**. Owners live in a separate gated `governance_owners` table overlaying by row id, so regenerating the JSON can never wipe an assignment; no delete policy (so `Clear owner` is a no-op on the 3 cadences carrying a register-file owner — the likeliest thing to be mistaken for a regression; 7 more reported defects unfixed). **DR-11** records what Sierra tells the public — honestly noting the decider has been Sam personally. **DR-13…DR-18** (SkyGate) cover the six surfaces nobody had recorded: **the workplan itself** (the most public artifact the project has, four tables editable in-page, no named owner), phrase rotation, contracts, CPL News, the Common CR Reference, TMC submissions. **Drift detector live + wired to the cron** (step 4a0): **proposes, never auto-adds**, and since 2026-08-30 (#1397, Sam's go) its table/tab scans **project from `kb/dependency_map.json`** instead of a local regex — the old scan could not see trailing-slash REST, verb-first helper wrappers, URL consts fetched far from their definition, served pages, or write-shaped RPCs, and **eight human-write surfaces were invisible to the whole governance layer at once**. **The 15 tables are RULED (Sam, 2026-08-30 — the Fifteen Tables judgment sheet, `docs/visuals/2026-08-30-governance-fifteen-tables.html`):** DR-19 `cpl_memory` (with Sam's edit-rules clarification — sessions propose, humans decide, everything logged; the row doubles as the spec for the S211 cross-store checker) · DR-20 `item_raci`/`item_updates`/`team_members` · DR-21 `factsheet_overrides` · DR-22 `gr_areas`/`gr_revisions`/`gr_artifacts` · DR-23 `cpl_adoption_interest` · CA-07 `map_data_quality` triage · folds: `liftoff_state`→DR-13, `cpl_funding_config`/`_notes`/`_participation`→DR-09 · `cpl_reflections` dismissed with the reason in the surface map. **The 2 tab candidates are RULED (Sam, 2026-08-30, Open Verdicts items 14–15): `chatbot` folds into CA-06** (its `sierra_feedback_upsert` write is the triage cadence's intake) **and `college-briefing` into DR-09** (the money decision's college-facing doorway) — mapped with reasons on the register rows. Queue now **9 cadences only**, arriving as their own future sheet. Readability guard tightened back to <25 in `tests/governance.test.js`. A tab whose only writes are tables is no longer proposed (each table is its own row); a tab earns a row only for RPC writes a table row cannot represent. `governance.test.js` **91/91**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human). **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. **Routing is standing doctrine since 2026-08-30** (#1402, remediation D): CLAUDE.md Rule 10 (a3) now requires every NEW write surface through this register + the privacy ADRs before it ships — the detector proposes, the rule obliges. **Onboarding gained its first machine-checked practice 2026-08-30 (#1412):** the three-repo attach rule (Sam: all three, enforced) is session-side — CLAUDE.md's Working-with-the-MAP-team bullet verifies the set at start and names what's missing — with `scripts/install-three-repo-check.ps1` as the one-time per-machine backstop for the zero-repo case (no CLAUDE.md loads there), guide §12 as the human-facing half, and the vault's Cowork section now naming all three repos. **Next:** ① the 9 cadence candidates as their own sheet; ② fill the owner column — DR-13 first, and the six new rows (DR-19..DR-23, CA-07) all ship owner-unset, CA-07 also needing a frequency; ③ run that cadence once end-to-end with a named owner; ④ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ⑤ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md`.

**DECIDED: the suite runs on `main` on push (Sky and COBIx, 2026-11-11, #3111),** and after each `Daily CPL Dashboard` run and once a day, because a push made with the built-in token starts no workflow; a head that already passed skips the suite (`js-tests.yml`, pinned by `tests/js_suite_gate_test.py`). **DECIDED (the S641 conductor, 2026-11-12, #3147 review):** a lost push is rebuilt inside the job, never by a dispatch: the conflicted run would end green having published nothing, the gate would stand the later rungs down, and a canceled rebuild would leave the day with no dashboard and a gap in `kpi_history.json`. Built (#3150, finding 8): the daily's 40 build commands are one script, `scripts/daily_build.sh`, run as one step; each block runs in `bash -e` (GitHub's shell for a `run:` with no `shell:`) with only the secrets its former step declared. On a rebase conflict the commit step aborts the rebase, resets to the new `origin/main`, reinstalls `requirements.txt` and runs the new main's `scripts/daily_build.sh` once, then stages, commits and pushes; the rebuilt commit gets a push even after a conflict on the last attempt. A second conflict or a failed rebuild exits 1 with nothing pushed. The CustomReport fetch, the scrape and the MIL/JST fetch are reused; the last two run again only when main's `live_metrics.json` or `veteran_jst.json` changed meanwhile. The SkyView shard upload runs after the push, cut from the pushed tree. `tests/apply_concurrency_test.py` runs the commit step's shell in a scratch repo with a stand-in build script. **DECIDED (the S641 conductor):** `cer-procedures.yml` keeps its own group, its 07:47 cron clear of the daily ladder; GitHub cancels an older pending run in a group without an alert, so a wider group costs more than the overlap of four committed files it would remove (COBIx #3110 finding 7's other option). **State (#3147, merged 2026-11-12):** the daily's group sits on `update-dashboard`, so a scheduled rung that stands down never queues in it; `cer-decision-apply.yml` and `cred-rename-apply.yml` check their plan name in a job outside the group (finding 9); `lints` rebuilds `kb/status/commons.json` and runs its 22 reader tests on the output (lesson 1), and runs `tests/partner_crosswalk_test.py` as its last step; `tests/apply_concurrency_test.py` pins the group's eleven members (the daily, cer-decision, cred-rename, credential-family, docket-process, esl-sheet, library-publish, overmerge, phase-1e, projects-seed, workplan-goals-seed). **NEXT:** merge #3150, then read the first daily run whose log carries `Daily push conflicted`: the rebuild's minutes, and whether its push landed. **Open:** a clean rebase that brings in a changed build input (say `kb/unified_titles.json`) with no conflict still pushes outputs built from the old input and ends green; it predates #3150 and needs its own rule for which inputs force a rebuild. A second run queued in the group still cancels the first queued one, and a canceled run does not alert. Twenty-one workflows push to `main` from groups of their own (a grep for `git push`, S641): cer-procedures, college-contacts-harvest, cos-authority-sync, course-outcomes-load, course-outcomes-read, course-outline-census, course-outline-index, course-title-cleanup-apply, cpl-landing-pages, cpl-stories, csr-confirm, first-light-art, first-light-gallery-thumbs, funding-config-edit-apply, moc-crosswalk-sync, phase-1e-sync, program-course-fetch, program-requirements-college, sierra-art-fetch, supabase-migrate, weekly-reflections-summary; which of them should share a group is open. Lessons 2 and 4 (a run-health file: failures first seen on `main`, minutes red to green, dispatch-to-start) are not built: the builder needs a scheduled writer that commits to `main`, which is its own PR with a governance-surface entry.

## 2026-11-12 — Session 641: a rebuild runs the build, and a session that stopped

- **A workflow's build steps live in one script, so a rebuild runs the same code.** #3150's first design parsed the
  workflow and replayed its steps in Python. Three readers found it imitated GitHub's runner badly: shell flags
  differed, workflow-level env and defaults were neither copied nor refused, and every rebuilt step inherited both
  secrets. Moving the 40 commands into `scripts/daily_build.sh` made the scheduled run and the rebuild the same code;
  a reader checked the commands byte for byte against `main`'s former steps. Replacing the design after round one
  cost less than patching an imitation.
- **A proof dispatch right after a workflow change merges,** while the session is there to revert it.
- **Merge the PRs that regenerate `kb/dependency_map.json` one at a time.** Two merged in sequence with no textual
  conflict; the third (#3152) conflicted and needed a `main` merge and a rebuild.
- **A session can stop with no handoff** (the 06:12Z firing). The next firing had no `list_sessions`; it read every
  channel, watched `git ls-remote` for 23 minutes, then opened a draft PR before any other write
  (`docs/reference/scheduled_sessions.md`, *A session that stopped without a handoff*).

## 2026-11-12 (S642 SkyKestrel, the conductor): a PR's own thread, and a ledger at its line

- The conductor merged and ran #3158 without reading COBIx's 13:13Z note on that PR's thread; it had read #3110,
  #3153 and its reviewers. COBIx's two findings became #3166 after the 230 rows were already deleted. Neither touched
  them, by luck. Read each PR's own comments, to the last page, before merging it.
- Sam had to point at #3111 and #2962: the conductor read #3153 at the start and not the standing threads. Read #3110,
  #3111 and every issue COBIx touched today, at the start and at each wake.
- Three PRs failed `suite (6)` for one reason: a new test file with no floor in `tests/check_floor.json` while `main`
  sat at the ledger's 60% line. A ledger kept at its threshold fails every PR that adds a test, so the brief has to say
  it.
- `scripts/check_generated.sh` reported a stale resolver copy that was a worker's worktree under `.claude/worktrees/`.
- Worked: one worker per concern, each opening its own PR; readers by dimension, then one second reader on the delete;
  COBIx reviewing each push within minutes; one scheduled check-in per wait; worktrees removed at merge.


## 2026-11-12 (S643 SkyLark, the conductor): live data in a test, and a migration that applies on push

- `main` went red from a person's work: `tests/exhibits_related_actions.test.js` read held cards from
  `kb/exhibits_review.json`, a reviewer ruled on one, and the daily commit failed `suite (6)` on `main` and every open
  PR (#3178; KB note `methodology-a-test-that-pins-a-generated-figure-fails-on-a-data-refresh`, third instance). The
  Funding Follow-up Dashboard session, live beside this one, reported it.
- `supabase-migrate.yml` applies on the push of a `kb/migrations/.apply` change to a `claude/**` branch, not on merge:
  `s643_first_light_marks` was live at 21:31Z and #3181 merged at 22:01Z. The receipt commit that run pushes back to
  the branch gets no `test` run. The worker stopped and asked, which was right; brief the next one with both facts.
- A stacked PR conflicts after its base squash-merges: merge `main` and take `main`'s copy of the base's files.
- Six first-round PRs each conflicted with `main` once, all on `tests/check_floor.json` and the dependency map.
  Merge them one at a time and expect a `main` merge on each after the first.
- `grep` on `tests/check_floor.json` prints its `_note` of about 10,000 tokens; pipe through `cut -c1-200`.
- A completed worker's notification repeats its whole report; read it once.
- Deleting a scheduled check-in that covered two PRs dropped the wait on the second; re-arm one for what is left.
- The Agent tool's worktree isolation fails when the shell has reset to `/home/user`; `cd` into the tracker first.
- Disk: each worktree is 4.4 GB, and 252 GB showed 6.2 GB free with four; cap at four and remove each at merge.
- The container restarted at about 22:20Z and stopped the documents worker mid-checkpoint. Its unpushed commit and
  staged files survived in its worktree, and its vault commit had already been pushed. Push each repo as soon as it
  has a coherent commit.
- Worked: one combined finding list per PR after all readers report; a second reader briefed to refute the fixes
  (it found three more on First Light). COBIx had not commented on any S643 PR by 22:05Z; the conductor posted on
  #3110, #2962 and #3153.

## Moved from the lane (S646)

Verbatim from the lane's #3180 paragraph (*DECIDED and built (the S643 conductor; `d-daily-rebuild-on-changed-input-s643`)*), moved at the S646 checkpoint to bring the lane under its size budget:

Every path counts except the commit step's `not_inputs` (`docs/` and `tests/`): the inputs cannot be listed from the code (builders glob `kb/`, list `.github/workflows` and the root, load modules by path), and several outputs are read again (`kb/unified_titles.json`, `kpi_history.json`), so the run's own outputs are no exemption. The test walks every file the build runs (commands, imports, path-loaded modules, launched scripts, 73 files) and fails when one names a path under either prefix or walks the tree. One rebuild a run, conflict or input: an input that changes again after it is pushed over with `Daily input changed again`, since a red run there would publish nothing for the day. When the input rebuild fails, the run's first build is restored, rebased and pushed with `Daily input rebuild failed; published the first build`, so the day is never worse than before the rule, and the first pass's scrape status is written back; a failed conflict rebuild still exits 1 with nothing pushed. The range is read with `--no-renames` (a moved input lists its old name), and a range that cannot be read counts as a changed input. The cost: a rebuild adds about 6 to 9 minutes, and 45 of the last 49 commits on `main` would have counted as an input change (#3180 review).

Removed from the lane's NEXT (1) at the same checkpoint: "(the first real run after #3180 is 06:17 UTC 2026-11-13)". That run went green: run 43377336314, dispatched on `main` 06:14Z, success 06:23Z.


## Moved from the lane (S647)

Moved verbatim from `docs/reference/lanes/governance-team-enablement.md` by the documents worker at the second S647 checkpoint, to keep the lane under its budget. Both stand.

**The CLAUDE.md pass, decided (Open Asks Sheet 109, Sam, 13:26Z 2026-10-21, all five as recommended; applied S442 SkyManzanita).** 1 a light checkpoint tier (Rule 9 and `/checkpoint`); 2 the UI pass left `/checkpoint` and is one view a night (`scheduled_sessions.md`, *The UI pass*); 3 the auto-mark rule and the one hold list sit in `CLAUDE.md`'s decision-sheets bullet, and `scheduled_sessions.md` points at it; 4 the three places that assumed `list_sessions` name the fallback; 5 the funding vocabulary's quotes moved to [`funding_vocabulary`](../funding_vocabulary.md) (every ban stays inline) and the seven parked rows to [`mid_lifecycle`](../mid_lifecycle.md#parked-roadmap-rows), bringing `CLAUDE.md` under 60,000 bytes. The tag table stays the record: `CPLBrain/decision-sheets/claude-md-pass/2026-10-21-claude-md-pass.md`.

**Cadence CA-08 (2026-09-27, S295):** the ESL monthly pass, Sam's item-8 verdict of 2026-09-26, run by sessions and flagged by the docs lint's `esl_monthly_pass_due` (#1710). **Doctrine hygiene:** the CLAUDE.md prompt audit (#1708) and Sam's eight verdicts on its sheet (https://claude.ai/artifact/Kd6K7yrAfGQKCtVyd4bhX5) have landed in tracker #1712 and #1713 and vault #185 and #186, and CA-04 names Rule 9's commit count. Card 5 landed as cpl-knowledge-base #23, merged 2026-09-27 on his verdict on card 2 of the open-asks sheet.

## S647 (SkyPipit, 2026-11-13): a secret in an environment

- Sam created the `live-counts` environment, limited to `main`, for the first job that reads the service key for a dashboard. A job in an environment reads the environment's copy; every other job still reads the repository copy, so the environment protects the key only once the repository copy is gone. Move the keyed workflows first, then remove the repository copy, never the reverse.

## Moved from the lane (S648 checkpoint)

Verbatim from the lane, 2026-11-13.

**DECIDED, the Pierce question is closed (Sam, 2:52 PM PT 2026-11-11, relayed by COBIx, #3111 comment 6809029855; `sam-pierce-drop-was-its-own-cleanup-2026-11-11`):** "the pierce change was due to corrections they made to a big bathc upload of cx, ap, ib cpl already awarded to students in the sis but batch uploaded to map--needed to be cleaned up after they did it. nothing to worry about." Nothing goes to MAP or ITPI.

**DECIDED (Sam, in session S639, 2026-11-11; `sam-sheet-carries-conductor-decisions-2026-11-11`):** the decision sheet carries the conductor's decisions, never asks. Sam's words: "Remember on the Decision Sheet that I want your decisions on it, not asking me for mine. I am pushing decision to you as conductor and informed by help from cobix, your force multiplier:)" Each card reads Decided, Evidence, and Carried out with how to reverse it; the chips are Fine, Change it and Revisit later; an outward send or a go-live is a card that opens on "Waits for my send or go". First built as [Open Asks Sheet 181](https://claude.ai/artifact/M3YaDrpkT7HhH8rYRnvkjx). Mechanics: [`conductor_mode`](../conductor_mode.md), *Recording and Sam*.

## Moved from the lane (S653b)

Group 1 of the key readers moved into `live-counts` (#3334) and the tests no workflow ran were counted and repaired (#3332, #3337), 2026-11-14; the lane's text as it stood moved here verbatim.

**LIVE: the `live-counts` environment (Sam, in session S647, 2026-11-13; `sam-live-counts-environment-2026-11-13`).** Sam's words: "environment done...see cobix comments"; "new environment is live-counts"; and "that's the name I gave it. if you want me to change it, let me know. it's still a repo secret too". The environment (deployment branch `main` only) holds `SUPABASE_SERVICE_KEY`; the Commons data dashboard's `live-counts` job in `harvest-gap-census.yml` reads it there (#3232; [commons](commons.md), *The live read*). The repository copy still exists: 38 workflow files name the key (grep, 2026-11-13), and only that one job runs in an environment. **NEXT:** (1) move the other workflows that read the key into environments, one PR per group, listed by `grep -l SUPABASE_SERVICE_KEY .github/workflows/*.yml`; (2) then Sam removes the repository copy, his setting (a *Yours to do* card when the workflows are ready, never before); (3) `tests/standards_2_ruled_renames_test.py` fails 6 of 27 on `main` and no workflow runs it (as reported by the S647 worker on #3233): fix it or retire it, and have CI run what stays. (4) From #3227's review (S648), outside that PR: the post-deploy `{}` calls to `program-requirements-extract` wait on a key the session does not hold (COBIx asked on #3227).

✅ **Vision 2030 goal figures: one set for both views (Sam, Open Asks Sheet 66 card 1, 2026-10-11 23:44Z, his own call: *One set, as proposed*; the same on Sheet 65).** `vision_2030_goals()` in `excel_to_dashboard.py` states the three goals once for the tab and the annual report (`CPL_DATA.vision2030`): Goal 1 measures students against 250,000 (22% on 2026-10-11) and names the credit recommendation count without a percent of the workgroup target (the bar read 1419.5% before); Goals 2 and 3 show `V2030_G2_PROGRESS`/`_CURRENT` and `V2030_G3_PROGRESS`/`_CURRENT` from `kb/dashboard_config.json`, **TBA** until Sam sets them, with no bar and no default standing in (the report had stated 55% and 60%, the tab a fixed 65%); Goal 2 keeps its active-colleges line. Owner of the Goal 2 and 3 figures: Sam, by setting the four keys. Guard: `tests/vision_2030_first_light_test.py` section 6.

✅ **RULED (Sam, open-asks sheet 8 card 1, 2026-09-30 18:52Z): curate a public draft of the CO style guide note.** The public-audience source is `CPLBrain/05-knowledge/consolidated/writing-about-cpl-in-the-chancellors-office-style.md` (manifest bucket `promote`); the curated copy is CPL-Initiative/cpl-knowledge-base#24, a draft a person reviews and merges. The internal note stays [`reference-cccco-style-guide`](../../kb-notes/reference-cccco-style-guide.md). ⚠️ The public `playbooks/map-ui-brand-standards.md` lists a CCCCO palette that differs from Brand Basics (Dark Blue `#003B71` vs `#002F6D`, Gold `#D4A843` vs `#FFB600`, Dark Gray `#555555` vs `#555759`); flagged in #24, a separate call. The dashed frame around the funding tab is COBI's placeholder on 18 tab roots, left as is.

✅ **BUILT 2026-09-10 (#1537), because Sam hit it a second time** and reported
the banner as never built: *"I still don't see the banner saying I'm active in a
CC session with a link in the header."* An active row past its expiry now renders
a curator-only line where the banner would have been — *"Your live-session banner
expired 2 days ago"* — naming `expires_at` on `cobi_live_session` and what to
set. ⚠️ **It carries NO link**: the link is what expired, and offering it invites
the team into the dead session the expiry exists to prevent. ⚠️ **Its own dismiss
key**, so hiding the notice can never hide the real banner a fresh row produces.
⚠️ **Safe by construction, not by a second gate** — reaching that code means the
reader already read the row, and RLS gates the table by `is_map_team() OR
team_pass_ok()`, so a plain visitor never enters the function. An expiry this
engine cannot read gets its own sentence rather than "expired NaN days ago".

⭐ **THE LESSON IS BIGGER THAN THE BANNER: failing closed and failing silently
are separable, and only the first was ever the requirement.** Every check in
`tests/cobi_live_banner.test.js` asked whether the banner was ABSENT, and absent
was the correct answer each time — the suite was green for the whole day Sam
spent believing the feature did not exist.

**Scheduled sessions (Sam, 2026-10-04, S329).** Sam asked for sessions that keep the queue moving without his pasting each opening line, on his terms: go with the recommendation more often (*"about 80% of the time I go with your recommendation"*), up to six sessions, effort decided on the fly with Fable as an advisor. The permission check refused a session-started chain twice, so Sam created a routine himself (`CPL queue — scheduled session`, daily 8:07 Pacific). What its sessions do: [`scheduled_sessions`](../scheduled_sessions.md). Sam set its four repositories and Opus 5.5 in the form (21:40Z); an agent may edit only a routine it created, so its settings stay his. Sam chose an overnight schedule on 2026-10-14 (S393): hourly from 10:12 PM to 6:12 AM Pacific, the sessions back to back; the platform refused the edit from a session, so he sets it in the form. **Set (Sam, 2026-10-16 17:56Z, Open Asks Sheet 85 card 1):** the routine runs at twelve past each hour from 10:12 PM to 6:12 AM Pacific (`CRON_TZ=America/Los_Angeles 12 22,23,0,1,2,3,4,5,6 * * *`, verified by `get_trigger`; first run 2026-10-17 05:12Z). He set it with the schedule menu's **Custom** entry, above Hourly; a session's own edit is refused for a routine made in the form.

**Landed (#3266, S649):** the resolver one-copy test skips `.claude/worktrees/` alone; `kb/_second_reader.py` exits 1 when every call errors (database or function down, or "XAI_API_KEY not set") and its workflow still uploads the file; `tests/shared_imports_named.test.js` holds the SHARED CODE comment; the Pages guard reads the Pages allowlist.

The DR-26 banner's two switches, the 2026-09-09 record, moved here verbatim on 2026-11-14 to make room in the lane; its fix (#1537) is the lane's next line.

⚠️ **THE BANNER HAS TWO SWITCHES AND FLIPPING ONE LOOKS LIKE ENOUGH (2026-09-09).**
Sam: *"I already forgot to set this session to public when opening it! I just set
it to public but I don't see the banner on COBI."* Nothing was broken. The
claude.ai **visibility** toggle decides whether the link WORKS; the
`cobi_live_session` row decides whether the banner SHOWS, and they know nothing
about each other. Measured at the time: the row was `active: true` but pointing
at `session_01PmWf…` — a **previous** session — with `expires_at` six hours in
the past, so the banner correctly rendered nothing. It had never been switched
off; it aged out. ⭐ **The Admin control already says exactly this** ("Now: not
showing *(the link expired)*"), so the gap was never the UI but that an author
who does not open Admin was never told their banner stopped. The 2/4/8-hour
expiry is the right default for a disclosure — a session link should not outlive
the session — so the fix was a notice to its author, never a longer life.


## S654 (SkyWhimbrel, the conductor, 2026-11-15): one spend meter for every model caller

- **Card 10's gate waits on one module.** Sam's $40 for `cer-classify`, `cpl-news-harvest` and `cpl-chat` would have repeated the fault COBIx found on #3330 (xAI usage priced at zero), which three separate pricing loops each carried. `kb/_spend_meter.py` (`d-one-spend-meter-s654`) reserves before a call and settles after it under one lock, so each caller imports it instead of pricing usage itself. Two of the three callers return no usage, so their stop is a worst-case bound until a function deploy returns usage.
- **Group 2 of the key readers waits on proof.** At S654's read-in, six of the nine group-1 jobs had not yet run in `live-counts`; scheduled runs land late, so group 2 waits for them.

## S655 (SkyCurlew, the conductor, 2026-11-15): card 10 done, every paid caller gated at $40

- **The meter was not on `main`.** The card 10 worker could not find `kb/_spend_meter.py` on `main` at 06:21Z: #3330 had merged into its stacked base (`claude/extraction-gate-always-s653`) at 05:04Z and #3327 then closed unmerged. #3351 (`c0cf44b9`, 07:48Z) carries the reland with card 10; #3350 (the reland alone) closed with a pointer (`p-3330-merged-into-stack-base-s655`; the rule: `d-stack-top-retarget-s655` in `conductor_mode`).
- **The classifier asks what fits** (`d-classifier-asks-what-fits-s655`). Refusing the whole batch past 390 titles would have stalled the queue. `cer-classify` now asks the longest front run of titles that fits $40, leaves the rest for the next night and ends green with a warning; it is red only when no chunk fits. The fit simulates the meter post by post at three attempts a post (COBIx's finding at 07:08Z, comment 6890858064, verified fixed at 07:31Z). At tonight's 173,548-character rules a post is $5.74: 6 of 27 chunks, 90 of 400 titles, $34.46 a night. It loosens when the function returns usage.
- **Sierra is priced at the dearest model that accepts her request** (`d-chat-priced-at-dearest-accepting-model-s655`): Opus 5, 4.8 and 4.7 accept her request shape, so $5/$25, $0.7048 an answer. The A/B is capped at 56 answers ($39.47) and the 70-answer every-mode run is refused; smoke $23.96, preflight $7.05, health $1.41, ask $0.70. The news harvest is bound at 9 calls, $27.27 (it was $36.36 at the first pricing). `CALL_MAX_USD` is $1.55 (overshoots $1.45, $5.80, $8.70).
- **COBIx's two notes on #3330 are in:** `_second_reader.run()` refuses a refused rate before any call; a test computes `M.worst_case` over the committed requests.
- **Reviews:** a second reader on #3351 (2 majors: the classifier's queue stall and the chat rate), a second reader on the fix delta (merge, 4 minors), COBIx one finding: 3 agents. Merging fired health and preflight once (about $0.75).
- **Next function deploy:** the functions return usage; `maxRetries: 0` on `new Anthropic()` in the extraction function and `cer-classify` (the gate reserves three attempts until then).


**DECIDED (the S653b conductor; `d-test-counts-only-on-pull-request-s653b`; #3332 `3edf55f0`, #3337 `fe1c4f0e`):** a test counts as run only when a workflow with a `pull_request` trigger names it in a step that can fail. A step or job with `continue-on-error`, an `if: false`, a line ending `|| true`, `|| :` or `|| exit 0`, a test on the left of `&&`, or `set +e` without the collector does not count; grouped steps go through `scripts/test_group.sh`, which names every failed test and exits 1. Guard `tests/every_test_runs_test.py` (31 self-checks). The census found 33 Python files under `tests/` that ran in no workflow; four were red on `main` and were repaired, none retired (`standards_2_ruled_renames_test.py`, `ccc_metric_test.py`, `custom_report_duplicate_view_test.py`, `powershell_ascii_test.py`); `custom_report_payload_test.py` joined `js-tests.yml`. Three stay on the exception list: `lattc_worklist_page_test.py` (Chromium), `kb_curation_guarded_sql_proof.py` (Postgres), `statewide_catalog_build_test.py` (runs from `tests/sierra_statewide_catalog.test.js`). The record: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*.

## Moved from the lane (S666 checkpoint)

Verbatim from `docs/reference/lanes/governance-team-enablement.md`; conductor mode retired 2026-11-15, and the suite paragraph compacted under the lane budget.

**Conductor mode (Sam, 2026-11-11, S638):** a session Sam names the conductor plans with COBIx, hands each concern to its own worker, checks, reviews and merges; it runs from [`docs/reference/conductor_mode.md`](../conductor_mode.md), whose Settings block every handoff copies under `## Conductor settings` (lint `handoff_missing_conductor_settings`).

**DECIDED: the suite runs on `main` on push (Sky and COBIx, 2026-11-11, #3111),** and after each `Daily CPL Dashboard` run and once a day, because a push made with the built-in token starts no workflow; a head that already passed skips the suite (`js-tests.yml`, pinned by `tests/js_suite_gate_test.py`). **DECIDED (the S641 first firing, #3147 review):** a lost push is rebuilt inside the job, never by a dispatch: a dispatched rebuild would let the conflicted run end green with nothing published, the gate would stand the later rungs down, and a canceled rebuild would leave a day with no dashboard and a gap in `kpi_history.json`. **DECIDED (the S641 conductor, #3150 review):** the rebuild runs one build script, never an imitation of GitHub's runner: a first design that parsed the workflow and replayed its steps differed in shell flags, neither copied nor refused workflow-level env and defaults, and gave every rebuilt step both secrets. **Built (#3150, merged `d02a3f86`, COBIx #3110 finding 8):** the daily's 40 build commands are `scripts/daily_build.sh`, one step, each block in `bash -e` with only the secrets its former step declared. On a rebase that stops with conflicted files the commit step aborts, resets to the new `origin/main`, reinstalls `requirements.txt`, runs the new main's script once and pushes, even after a conflict on the last attempt; a second conflict or a failed conflict rebuild exits 1 with nothing pushed; a rebase failure with no conflict keeps the retry. The SkyView shard upload runs after the push. **DECIDED and built (the S643 conductor; `d-daily-rebuild-on-changed-input-s643`; #3180 `f2864716`, two readers; COBIx #3110 point 4):** a clean rebase that changes any path the build may read rebuilds the same way, by the same `daily_rebuild`, and logs `Daily push rebased over a changed input` with the paths. The rules, the fallbacks and the cost: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S646)*. Guard `tests/apply_concurrency_test.py` (107 checks). **DECIDED (the S641 first firing):** `cer-procedures.yml` keeps its own group, its 07:47 cron clear of the daily ladder; GitHub cancels an older pending run in a group without an alert, so a wider group costs more than the overlap it removes (COBIx #3110 finding 7's other option). **State (#3147):** the daily's group sits on `update-dashboard`; `cer-decision-apply.yml` and `cred-rename-apply.yml` check their plan name outside the group (finding 9); `lints` rebuilds `kb/status/commons.json`, runs its 22 reader tests and `tests/partner_crosswalk_test.py`; `tests/apply_concurrency_test.py` pins the group's eleven members. **Proof (S641):** the `daily-dashboard.yml` run dispatched on `main` after the merge committed `f01d4055` at 11:54Z, eight minutes later: the one-script build ran on a real run and published. The conflict path and the changed-input path have run only in the test's scratch repo. **The first real daily run after #3180** (run 43377336314, dispatched on `main` 06:14Z 2026-11-13) went green at 06:23Z and published (`94908047`, as reported). **NEXT:** (1) read the first daily log that carries `Daily push conflicted` or `Daily push rebased over a changed input`: the rebuild's minutes, and whether its push landed. (2) Twenty-one workflows push to `main` from groups of their own (a grep for `git push`, S641; the list: lessons, *Moved from the lane (S641)*); which should share a group is open, and a second run queued in a group still cancels the first without an alert. (3) Lessons 2 and 4 (a run-health file) wait on a scheduled writer that commits to `main`, its own PR with a governance-surface entry.

## S666 (SkyDipper, Sam's session, 2026-11-16): the ask test, and a prompt no repo setting clears

- **Four of COBIx's "decisions wait on you" were already answered** (Sheets 191, 187, 188, 195). Before filing or chasing an ask, read the sheets and `cpl_memory`; the ask test's *no re-asking* is the doctrine form of that check.
- **A prompt can come from above the repo.** Sam's Supabase connector has been on Always allow for months, the session root settings allow, and the guard hook returns allow, yet each Execute SQL call still prompted. The app asks per call; nothing in `.claude/settings.json` reaches it. Work around it: check a write by the committed receipt of the runner that made it, batch the remaining reads, and take other work while a prompt waits.
- **The safety check refused widening the committed allow-list** (`apply_migration` in `.claude/settings.json`). That refusal is never routed around; COBIx withdrew the ask, and migrations keep their rollback receipts on `supabase-migrate.yml`.

## Moved from the lane (S678 checkpoint, 2026-11-17)

**DECIDED (the S642 conductor, 2026-11-12; `p-check-ledger-floor-fails-new-tests-s642`):** every worker brief that adds a test file says the file needs its check-count floor in `tests/check_floor.json`. Three S642 PRs failed `suite (6)` for that one reason: `tests/check_ledger.test.js` fails a new unfloored file while `main` sits at the 60% floored line. Briefs also say: run the tests that touch your files plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest (a full local `npm test` ran past 30 minutes).
