---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-11-14
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Governance & team enablement

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam.

**Conductor mode (Sam, 2026-11-11, S638):** a session Sam names the conductor plans with COBIx, hands each concern to its own worker, checks, reviews and merges; it runs from [`docs/reference/conductor_mode.md`](../conductor_mode.md), whose Settings block every handoff copies under `## Conductor settings` (lint `handoff_missing_conductor_settings`).

**DECIDED (the S642 conductor, 2026-11-12; `p-check-ledger-floor-fails-new-tests-s642`):** every worker brief that adds a test file says the file needs its check-count floor in `tests/check_floor.json`. Three S642 PRs failed `suite (6)` for that one reason: `tests/check_ledger.test.js` fails a new unfloored file while `main` sits at the 60% floored line. Briefs also say: run the tests that touch your files plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest (a full local `npm test` ran past 30 minutes).

**Landed (#3266, S649):** four guard fixes; [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*.

**DECIDED (Sam, in session S639, 2026-11-11; `sam-cobix-relay-confirms-2026-11-11`):** a ruling COBIx relays is confirmed and recorded as Sam's, with his verbatim words and "relayed by COBIx" as where they reached the session; the conductor takes COBIx's findings and information as given and pushes back only where it disagrees. Sam's words: "confirmation can count in this session or relayed from cobix--remember, ask forgiveness, not permission:)" and "trust what cobix says and only push back if you disagree with his recommendation, action, information. Forward motion is good motion." The two-rounds rule and the hold list in `CLAUDE.md` stand.

**DECIDED (Sam, S639, 2026-11-11; `sam-sheet-carries-conductor-decisions-2026-11-11`):** the decision sheet carries the conductor's decisions (Decided, Evidence, Carried out with how to reverse it); a card that needs him carries steps and links (Sam, 2026-11-13). The paragraph as it stood: `docs/governance_lessons.md`, *Moved from the lane (S648 checkpoint)*; mechanics: [`conductor_mode`](../conductor_mode.md).

**The Pierce question is closed (Sam, 2026-11-11, `sam-pierce-drop-was-its-own-cleanup-2026-11-11`):** moved verbatim to `docs/governance_lessons.md`, *Moved from the lane (S648 checkpoint)*. Nothing goes to MAP or ITPI.


**LIVE: the `live-counts` environment (Sam, in session S647, 2026-11-13; `sam-live-counts-environment-2026-11-13`).** Sam's words: "environment done...see cobix comments"; "new environment is live-counts"; and "that's the name I gave it. if you want me to change it, let me know. it's still a repo secret too". The environment (deployment branch `main` only) holds `SUPABASE_SERVICE_KEY`. **Group 1 moved (S653b, #3334 `ed94bc1e`, 20:18Z 2026-11-14):** nine jobs in eight workflows declare `environment: live-counts`: `first-light-apply.yml` (look, apply), `library-publish.yml`, `map-custom-report-load.yml`, `cer-procedures.yml`, `csr-confirm.yml`, `map-users-sync.yml`, `college-briefing-publish.yml`, `weekly-reflections-summary.yml`, beside #3232's `live-counts` job in `harvest-gap-census.yml` ([commons](commons.md), *The live read*). Census guard `tests/service_key_environment_test.py`: 38 workflow files read the key, 10 jobs in the environment, 32 on its PENDING list (group 2: 14; branch: 10; daily: 1; other-session: 7); `workflow_run` is exempt from its off-main rule. Each job in an environment records a deployment in the repository's Deployments list (`first-light-apply` runs hourly). **Proof:** the first is `csr-confirm.yml`, dispatched on `main` with `save=preview` (a live read with the key, no row written): run 43638689797 succeeded at 20:43Z 2026-11-14 in `live-counts`. The other moved jobs prove on their next scheduled runs on `main` (`first-light-apply.yml`'s schedule lands late: its last run before the merge was 19:25Z); read them before group 2.

⚠️ **RISK (COBIx on #3334; `key-rotation-two-copies-until-pending-empty-s653b`):** until PENDING is empty, rotating the Supabase service key means updating both copies, the environment's and the repository's; one alone fails half the workflows.

**DECIDED (the S653b conductor; `d-key-readers-environment-groups-s653b`):** one environment, `live-counts` as it stands; a workflow moves only when every run of it is on `main` (its triggers, its last 30 runs, no playbook dispatching it on a branch). **NEXT:** (1) group 2 (14 jobs, dispatch-only applies plus `docket-process`; `credential-catalog-sync` needs its checkout comment changed); (2) `daily-dashboard.yml` in its own PR, after group 1 has run on its schedules; (3) the branch-run files (12), once they dispatch on `main` with a data-branch input or split a keyed job gated on `refs/heads/main` (#3232's shape). **Yours to do (Sam), only when PENDING is empty:** remove the repository copy of `SUPABASE_SERVICE_KEY` (a card then, never before). Sam, in session S653b, 2026-11-14 (`sam-fact-sheet-no-header-logo-2026-11-14`): "Guide me when the service key needs to go". So when `tests/service_key_environment_test.py`'s PENDING list is empty, the session gives him a *Yours to do* card with numbered steps and the link https://github.com/CPL-Initiative/cpl-project-tracker/settings/secrets/actions (Repository secrets, `SUPABASE_SERVICE_KEY`, Delete), then reads one scheduled run of a moved workflow. (4) From #3227's review (S648), outside that PR: the post-deploy `{}` calls to `program-requirements-extract` wait on a key the session does not hold (COBIx asked on #3227).

**DECIDED (the S653b conductor; `d-test-counts-only-on-pull-request-s653b`; #3332 `3edf55f0`, #3337 `fe1c4f0e`):** a test counts as run only when a workflow with a `pull_request` trigger names it in a step that can fail. A step or job with `continue-on-error`, an `if: false`, a line ending `|| true`, `|| :` or `|| exit 0`, a test on the left of `&&`, or `set +e` without the collector does not count; grouped steps go through `scripts/test_group.sh`, which names every failed test and exits 1. Guard `tests/every_test_runs_test.py` (31 self-checks). The census found 33 Python files under `tests/` that ran in no workflow; four were red on `main` and were repaired, none retired (`standards_2_ruled_renames_test.py`, `ccc_metric_test.py`, `custom_report_duplicate_view_test.py`, `powershell_ascii_test.py`); `custom_report_payload_test.py` joined `js-tests.yml`. Three stay on the exception list: `lattc_worklist_page_test.py` (Chromium), `kb_curation_guarded_sql_proof.py` (Postgres), `statewide_catalog_build_test.py` (runs from `tests/sierra_statewide_catalog.test.js`). The record: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*.

**RULED (Sam, [Open Asks Sheet 198](https://claude.ai/artifact/4C48Gufarc7L11b34Gu6Hy) card 10, 20:34Z 2026-11-14; `sam-sheet-198-answers-2026-11-14`): "forty"**, so $40 a run for the three model callers that had no per-run dollar limit (found by #3330's worker): `cer-classify` (`cer-procedures.yml`), `cpl-news-harvest` (`cpl-news.yml`, an HTTP timeout only) and `cpl-chat` (`sierra-ask.yml` and `cpl-chat-preview-ab.yml`, about 66 billed answers a run). **NEXT:** build the gate on #3327's pattern, after COBIx's blocking finding on #3330 (usage priced at zero, so the hard stop never trips) is fixed, since the same fault would defeat it.

**District profiles landed (S648, #3246; #3198):** COBIx's schema 1, README and LACCD example in `kb/district_profiles/`; no staff or student detail found. Next: the builder, a Rule 10(a3) question before it writes ([harvest](program-requirements-harvest.md) NEXT 7).

## Owned rows — DR-24, DR-25, DR-26 (2026-09-08)

**The register had ONE owned row for months.** Every `owner` was null except
DR-24 (Sam, 2026-09-07). Two more landed on 2026-09-08, both Sam's, both from
work that could not ship without them.

⭐ **DR-25 — the subject–discipline edge.** Four stores wrote this relationship
in two directions and none had an owner, which is how the same course could be
Psychology in one file and blank in another. Sam's ruling: **subject → discipline
is the primary edge** and `kb/reference/subject_discipline_map.json` is its
authority; the CSR (`discipline_canonical_subj4.json`) answers the different
question of which of a discipline's codes is canonical; the C-ID/CCN seeder's
prefix table and `discipline_inference.json`'s `subject_map` are INPUTS, not
parallel authorities. ⚠️ **The gap was never disagreement** — measured, the two
overlapping stores agreed on **143 of 143** rows. It was unowned duplication.

⭐ **DR-26 — the live-session banner.** SkyView's first outward write surface,
and a disclosure decision rather than a display setting: the link points at a
Claude Code session, which is private by default and may carry code and
credentials from private repos. ⚠️ **THE AUDIENCE TOOK THREE PASSES**, and the
register records all three because each was wrong differently:
`is_allowed_reviewer()` (10 people; **34 of the 42 team members are not in it**),
`is_map_team()` alone (exact, but demanded a sign-in Sam did not want), and
`is_map_team() OR team_pass_ok()` (the phrase as the trade — a shared secret,
wider than the roster, far narrower than the public). **Writing stays
`is_map_team()`**: a phrase holder may see the banner and never point it.

⚠️ **"Not signed in" and "only the team table" cannot BOTH hold.** Identity comes
from a credential. With none, the server sees an anonymous visitor and cannot
tell a team member from anyone else. Any surface asked for both gets the same
answer: name the trade, do not pretend it is absent.

**The banner's two switches (2026-09-09)** moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*; the notice that fixed it is the next line.

✅ **BUILT 2026-09-10 (#1537): the expired-banner notice to its author**, and its lesson (failing closed and failing silently are separable): moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*.

⚠️ **DR-26 REVERSED TO OPTION B (Sam, 2026-09-10) — a session DOES set the row
now.** *"It's a hassle to do it that way; I'd prefer it be automatic ... perhaps
add an opt out."* The opt-out is `cobi_live_session.auto_announce`, on by
default, in Admin. ⚠️ **What he asked for could not be built:** "automatic as
long as I set the CC session public" needs a visibility signal, and nothing
exposes one — so the banner may now point at a Private session and the team
sees a link that will not open. Option A's fail-closed property is gone; the
failure is a dead link, and the banner copy names it. Procedure, the two things
a session cannot know, and why the hook is only a hint:
[`docs/reference/live_session_banner.md`](../live_session_banner.md).

⚠️ **Rule 10 a3 worked as designed.** Both rows were written BEFORE the code, and
five write surfaces are mapped in `kb/governance_surface_map.json`. The gate is
not paperwork: DR-26's first cut read under `using (true)`, and mapping it is
what made "who can see this" a question someone asked out loud.

## Status

✅ **Two Claude Team accounts, one seat per person (S576, 2026-11-05).** The MAP team has its own account, so teammates
stop sharing `map@rccd.edu` and every session knows who is driving. RCCD also set up a pilot account for the Chancellor's
Office Division of Academic Affairs, which the CO may later offer to its other divisions. Sam's rulings: **Malone is an
Owner** of the MAP team's account and runs it; the CO's repo is **CO-owned, with Sam and Malone as owners**; **CPLBrain
is open to both the MAP team and the CO pilot** (*"The only PII is still public info, just not info we necessarily want
published to the public without careful eyes on it--either from the MAP team or CO"*); `cpl_memory` and
`cpl-program-records` stay closed to the pilot. Recommended, Sam to run: **transfer CPLBrain to `CPL-Initiative`** so
Malone can manage its access (a collaborator on a personal repo cannot). The steps live in COBI's **Our Process** tab,
*Getting set up* (Start here for Sam and Malone, a card per account, each person's first day; #2784, #2786); the runbooks
and the files to copy in `CPLBrain/04-projects/map-team-claude-accounts/` and `04-projects/co-academic-affairs-pilot/`
(CLAUDE.md draft, shared Project instructions, the `aa_memory` schema). **NEXT:** Malone confirms the managed-settings
editor accepts a CLAUDE.md (if not, the per-machine `install-three-repo-check.ps1` stays); the managed three-repo check
then replaces that script; the CO's repo gets its CLAUDE.md once its GitHub organization exists. Lessons:
[`governance_lessons`](../../governance_lessons.md), *S576*.

**The CLAUDE.md pass (Open Asks Sheet 109, 2026-10-21; applied S442)** moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S647)*; it stands.

✅ **Vision 2030 goal figures: one set for both views** (Sam, Open Asks Sheet 66 card 1, 2026-10-11; `vision_2030_goals()`): moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*; it stands.

✅ **RULED (Sam, open-asks sheet 8 card 1, 2026-09-30): curate a public draft of the CO style guide note** (CPL-Initiative/cpl-knowledge-base#24): moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*.

**Cadence CA-08 (the ESL monthly pass) and the doctrine hygiene of S295** moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S647)*; both stand.

✅ **LIVE — the team-gated Governance tab** (23 decision rights, 8 acceptance standards, 7 cadences, 8 open questions; `tests/governance.test.js`). Every `owner` is unset on purpose, since filling them is the review (OQ-01); owners live in the gated `governance_owners` table, overlaid by row id. The drift detector proposes and never adds, projecting from `kb/dependency_map.json`; Rule 10 (a3) routes every new write surface through the register. The 15 tables and 2 tab candidates are ruled (Sam, 2026-08-30). The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S641)*. **Next:** ① the 9 cadence candidates as their own sheet; ② fill the owner column, DR-13 first, then DR-19 to DR-23 and CA-07 (which also needs a frequency); ③ run that cadence once end to end with a named owner; ④ decide CIP's promotion criteria before the fall-2026 cutover (OQ-03); ⑤ cut the load-bearing list (8 of 10 is too many). Team guide: `docs/working_with_claude_code.md`.

**Scheduled sessions (Sam, 2026-10-04, S329):** Sam's routine `CPL queue — scheduled session` runs at twelve past each hour from 10:12 PM to 6:12 AM Pacific (`CRON_TZ=America/Los_Angeles 12 22,23,0,1,2,3,4,5,6 * * *`, set by Sam 2026-10-16, Open Asks Sheet 85 card 1); its settings stay his. What its sessions do: [`scheduled_sessions`](../scheduled_sessions.md). The record: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*.

**DECIDED: the suite runs on `main` on push (Sky and COBIx, 2026-11-11, #3111),** and after each `Daily CPL Dashboard` run and once a day, because a push made with the built-in token starts no workflow; a head that already passed skips the suite (`js-tests.yml`, pinned by `tests/js_suite_gate_test.py`). **DECIDED (the S641 first firing, #3147 review):** a lost push is rebuilt inside the job, never by a dispatch: a dispatched rebuild would let the conflicted run end green with nothing published, the gate would stand the later rungs down, and a canceled rebuild would leave a day with no dashboard and a gap in `kpi_history.json`. **DECIDED (the S641 conductor, #3150 review):** the rebuild runs one build script, never an imitation of GitHub's runner: a first design that parsed the workflow and replayed its steps differed in shell flags, neither copied nor refused workflow-level env and defaults, and gave every rebuilt step both secrets. **Built (#3150, merged `d02a3f86`, COBIx #3110 finding 8):** the daily's 40 build commands are `scripts/daily_build.sh`, one step, each block in `bash -e` with only the secrets its former step declared. On a rebase that stops with conflicted files the commit step aborts, resets to the new `origin/main`, reinstalls `requirements.txt`, runs the new main's script once and pushes, even after a conflict on the last attempt; a second conflict or a failed conflict rebuild exits 1 with nothing pushed; a rebase failure with no conflict keeps the retry. The SkyView shard upload runs after the push. **DECIDED and built (the S643 conductor; `d-daily-rebuild-on-changed-input-s643`; #3180 `f2864716`, two readers; COBIx #3110 point 4):** a clean rebase that changes any path the build may read rebuilds the same way, by the same `daily_rebuild`, and logs `Daily push rebased over a changed input` with the paths. The rules, the fallbacks and the cost: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S646)*. Guard `tests/apply_concurrency_test.py` (107 checks). **DECIDED (the S641 first firing):** `cer-procedures.yml` keeps its own group, its 07:47 cron clear of the daily ladder; GitHub cancels an older pending run in a group without an alert, so a wider group costs more than the overlap it removes (COBIx #3110 finding 7's other option). **State (#3147):** the daily's group sits on `update-dashboard`; `cer-decision-apply.yml` and `cred-rename-apply.yml` check their plan name outside the group (finding 9); `lints` rebuilds `kb/status/commons.json`, runs its 22 reader tests and `tests/partner_crosswalk_test.py`; `tests/apply_concurrency_test.py` pins the group's eleven members. **Proof (S641):** the `daily-dashboard.yml` run dispatched on `main` after the merge committed `f01d4055` at 11:54Z, eight minutes later: the one-script build ran on a real run and published. The conflict path and the changed-input path have run only in the test's scratch repo. **The first real daily run after #3180** (run 43377336314, dispatched on `main` 06:14Z 2026-11-13) went green at 06:23Z and published (`94908047`, as reported). **NEXT:** (1) read the first daily log that carries `Daily push conflicted` or `Daily push rebased over a changed input`: the rebuild's minutes, and whether its push landed. (2) Twenty-one workflows push to `main` from groups of their own (a grep for `git push`, S641; the list: lessons, *Moved from the lane (S641)*); which should share a group is open, and a second run queued in a group still cancels the first without an alert. (3) Lessons 2 and 4 (a run-health file) wait on a scheduled writer that commits to `main`, its own PR with a governance-surface entry.
