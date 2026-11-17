---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-11-16
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

**Conductor mode is retired (Sam, 2026-11-15):** one Opus 5.5 session works the queue, and a handoff carries no `## Conductor settings` block (checkpoint step 8; [`scheduled_sessions`](../scheduled_sessions.md)). The S638 paragraph: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S666 checkpoint)*.

**The ask test (Sam, 2026-11-16, relayed by COBIx on issue #3358 and #3395; CLAUDE.md *Decide, carry out, record*, merged #3395 `d35d8d53`):** *"it's better for sky with your collaboration to pick a side when ambiguity is the current state, run with it, and I will see how it looks when I can see it in action."* An ask is filed only for an irreversible act, an external send, a go-live, a touch of student or staff data, or a delete of college- or person-entered data, beside the standing list (a public KB merge, funding figures to colleges, the program's name, who does what, a cost above a limit, reversing a dated ruling, a call a lane marks as his). Everything else is decided, recorded in `cpl_memory` and the lane, and reversed if he reacts; an ask never blocks the queue, nothing settled is asked again, and a person's save wins (`d-person-saved-never-returns-s666`). First carried out the same day: Honors step 2 applied as not a hold (`d-honors-step2-applied-not-a-hold-s666`, [commons](commons.md)). The safety check refused adding `apply_migration` to `.claude/settings.json`; COBIx dropped that ask, and migrations stay on `supabase-migrate.yml`.

**The Execute SQL prompt is the app's (Sam, in session, 2026-11-16):** *"it is set that way and has been for some time"* (the claude.ai Supabase connector is on Always allow). The per-call prompt still appears, and no repo setting clears it: the session root settings, the guard hook (it returns allow) and the connector all allow already. So a write is checked by its runner's committed receipt, not a live read; the reads that remain go in one batched call; and while a prompt waits the session takes work that does not need it (`sam-sql-prompt-is-app-level-2026-11-16`).

**DECIDED (the S642 conductor, 2026-11-12; `p-check-ledger-floor-fails-new-tests-s642`):** every worker brief that adds a test file says the file needs its check-count floor in `tests/check_floor.json`. Three S642 PRs failed `suite (6)` for that one reason: `tests/check_ledger.test.js` fails a new unfloored file while `main` sits at the 60% floored line. Briefs also say: run the tests that touch your files plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest (a full local `npm test` ran past 30 minutes).

**Landed (#3266, S649):** four guard fixes; [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S653b)*.

**DECIDED (Sam, in session S639, 2026-11-11; `sam-cobix-relay-confirms-2026-11-11`):** a ruling COBIx relays is confirmed and recorded as Sam's, with his verbatim words and "relayed by COBIx" as where they reached the session; the conductor takes COBIx's findings and information as given and pushes back only where it disagrees. Sam's words: "confirmation can count in this session or relayed from cobix--remember, ask forgiveness, not permission:)" and "trust what cobix says and only push back if you disagree with his recommendation, action, information. Forward motion is good motion." The two-rounds rule and the hold list in `CLAUDE.md` stand.

**DECIDED (Sam, S639, 2026-11-11; `sam-sheet-carries-conductor-decisions-2026-11-11`):** the decision sheet carries the conductor's decisions (Decided, Evidence, Carried out with how to reverse it); a card that needs him carries steps and links (Sam, 2026-11-13). The paragraph as it stood: `docs/governance_lessons.md`, *Moved from the lane (S648 checkpoint)*; mechanics: [`conductor_mode`](../conductor_mode.md).

**The Pierce question is closed (Sam, 2026-11-11, `sam-pierce-drop-was-its-own-cleanup-2026-11-11`):** moved verbatim to `docs/governance_lessons.md`, *Moved from the lane (S648 checkpoint)*. Nothing goes to MAP or ITPI.


**LIVE: the `live-counts` environment (Sam, in session S647, 2026-11-13; `sam-live-counts-environment-2026-11-13`).** Sam's words: "environment done...see cobix comments"; "new environment is live-counts"; and "that's the name I gave it. if you want me to change it, let me know. it's still a repo secret too". The environment (deployment branch `main` only) holds `SUPABASE_SERVICE_KEY`. **Group 1 moved (S653b, #3334 `ed94bc1e`, 20:18Z 2026-11-14):** nine jobs in eight workflows declare `environment: live-counts`: `first-light-apply.yml` (look, apply), `library-publish.yml`, `map-custom-report-load.yml`, `cer-procedures.yml`, `csr-confirm.yml`, `map-users-sync.yml`, `college-briefing-publish.yml`, `weekly-reflections-summary.yml`, beside #3232's `live-counts` job in `harvest-gap-census.yml` ([commons](commons.md), *The live read*). **Group 2 moved (S668, #3425):** fourteen jobs in fourteen workflows: `chatbox-ghost-delete.yml`, `course-title-cleanup-apply.yml`, `cred-rename-apply.yml` (apply; its check job reads no key), `credential-catalog-sync.yml` (its checkout comment now says every run checks out `main`), `credential-family-apply.yml`, `docket-process.yml`, `esl-sheet-apply.yml`, `funding-config-edit-apply.yml`, `overmerge-apply.yml`, `phase-1e-sync.yml`, `projects-seed-apply.yml`, `skyview-desc-shards.yml`, `supabase-rekey.yml`, `workplan-goals-seed-apply.yml`. Read at S668 (00:00Z 2026-11-17): every one of their last 30 runs (98 runs; `overmerge-apply` has none) was on `main`, by `workflow_dispatch` or `schedule`, and no playbook dispatches one on a branch; recorded as `environment:live-counts` in `kb/governance_surface_map.json`. Census guard `tests/service_key_environment_test.py`: 38 workflow files read the key, 24 jobs in the environment, 18 on its PENDING list (branch: 10; daily: 1; other-session: 7); group `2` left its groups; `workflow_run` is exempt from its off-main rule. Each job in an environment records a deployment in the repository's Deployments list (`first-light-apply` runs hourly). **Proof, group 1:** `csr-confirm.yml` first (run 43638689797, 20:43Z 2026-11-14); eight of the nine workflows have run green on `main` in `live-counts` with no failure, the eighth `weekly-reflections-summary` on its schedule (run 43980226973, 23:32Z 2026-11-16); `harvest-gap-census` is dispatch-only and proves on its next dispatch. **Proof, group 2:** `docket-process` (nightly) and `credential-catalog-sync` (13:20Z daily) prove on their schedules; the twelve dispatch-only applies prove on their next dispatch on `main`.

⚠️ **RISK (COBIx on #3334; `key-rotation-two-copies-until-pending-empty-s653b`):** until PENDING is empty, rotating the Supabase service key means updating both copies, the environment's and the repository's; one alone fails half the workflows.

**DECIDED (the S653b conductor; `d-key-readers-environment-groups-s653b`):** one environment, `live-counts` as it stands; a workflow moves only when every run of it is on `main` (its triggers, its last 30 runs, no playbook dispatching it on a branch). **NEXT:** (1) group 2: done (#3425, above); read `docket-process`'s and `credential-catalog-sync`'s first scheduled runs in `live-counts` before (2); (2) `daily-dashboard.yml` in its own PR, after group 1 has run on its schedules; (3) the branch-run files (12), once they dispatch on `main` with a data-branch input or split a keyed job gated on `refs/heads/main` (#3232's shape). **Yours to do (Sam), only when PENDING is empty:** remove the repository copy of `SUPABASE_SERVICE_KEY` (a card then, never before). Sam, in session S653b, 2026-11-14 (`sam-fact-sheet-no-header-logo-2026-11-14`): "Guide me when the service key needs to go". So when `tests/service_key_environment_test.py`'s PENDING list is empty, the session gives him a *Yours to do* card with numbered steps and the link https://github.com/CPL-Initiative/cpl-project-tracker/settings/secrets/actions (Repository secrets, `SUPABASE_SERVICE_KEY`, Delete), then reads one scheduled run of a moved workflow. (4) From #3227's review (S648), outside that PR: the post-deploy `{}` calls to `program-requirements-extract` wait on a key the session does not hold (COBIx asked on #3227).

**DECIDED (the S653b conductor; `d-test-counts-only-on-pull-request-s653b`; #3332, #3337):** a test counts as run only when a workflow with a `pull_request` trigger names it in a step that can fail; grouped steps go through `scripts/test_group.sh`; guard `tests/every_test_runs_test.py`. The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S655 checkpoint)*.

**DONE: card 10 (Sam, [Open Asks Sheet 198](https://claude.ai/artifact/4C48Gufarc7L11b34Gu6Hy) card 10, 20:34Z 2026-11-14; `sam-sheet-198-answers-2026-11-14`): "forty"; #3351 `c0cf44b9`, S655.** Every paid model caller is gated at $40 a run through the one spend meter, `kb/_spend_meter.py` (`STANDING_LIMIT_USD`; **DECIDED** `d-one-spend-meter-s654`, [harvest lane](program-requirements-harvest.md)), now on `main`: #3351 carries the reland of #3330 and #3327, which had merged into a stacked base, never `main` (`p-3330-merged-into-stack-base-s655`). **DECIDED** `d-classifier-asks-what-fits-s655`: `cer-classify` asks the longest front run of titles that fits $40, simulated post by post at three attempts a post, leaves the rest for the next night and ends green with a warning; red (`classifier_held`) only when no chunk fits. At 173,548 characters of rules a post is $5.74: 6 of 27 chunks, 90 of 400 titles, $34.46 a night. **DECIDED** `d-chat-priced-at-dearest-accepting-model-s655`: `cpl-chat` is priced at $5/$25 (Opus 5, 4.8 and 4.7 accept Sierra's request), $0.7048 an answer: smoke $23.96, preflight $7.05, health $1.41, ask $0.70, the A/B at most 56 answers ($39.47; the 70-answer run is refused). `cpl-news-harvest`: 9 calls, $27.27. `CALL_MAX_USD` $1.55. `_second_reader.run()` refuses a refused rate before any call; a test computes `M.worst_case` over the committed requests. **NEXT, at the next function deploy:** the functions return usage (the callers then move to the meter's hard stop and the classifier's fit loosens), and `maxRetries: 0` on `new Anthropic()` in the extraction function and `cer-classify` (the gate reserves three attempts until then). The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S655 checkpoint)*.

**District profiles landed (S648, #3246; #3198):** COBIx's schema 1, README and LACCD example in `kb/district_profiles/`; no staff or student detail found. Next: the builder, a Rule 10(a3) question before it writes ([harvest](program-requirements-harvest.md) NEXT 7).

## Owned rows — DR-24, DR-25, DR-26 (2026-09-08)

**The register had ONE owned row for months.** Every `owner` was null except
DR-24 (Sam, 2026-09-07). Two more landed on 2026-09-08, both Sam's, both from
work that could not ship without them.

⭐ **DR-25 — the subject–discipline edge** (Sam, 2026-09-08): subject → discipline is the primary edge and `kb/reference/subject_discipline_map.json` its authority. The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S655 checkpoint)*.

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

⚠️ **Rule 10 a3 worked as designed** (DR-25 and DR-26): The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S655 checkpoint)*.

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

**DECIDED: the suite runs on `main` on push (#3111), a lost push is rebuilt inside the job by one build script (`scripts/daily_build.sh`, #3150), and a clean rebase over a changed input rebuilds the same way (`d-daily-rebuild-on-changed-input-s643`, #3180); guard `tests/apply_concurrency_test.py`.** The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S666 checkpoint)*. **NEXT:** (1) read the first daily log that carries `Daily push conflicted` or `Daily push rebased over a changed input`: the rebuild's minutes, and whether its push landed. (2) Twenty-one workflows push to `main` from groups of their own (lessons, *Moved from the lane (S641)*); which should share a group is open. (3) Lessons 2 and 4 (a run-health file) wait on a scheduled writer that commits to `main`, its own PR with a governance-surface entry.
