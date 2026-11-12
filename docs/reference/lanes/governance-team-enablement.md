---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-11-12
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

**Known local false alarm (S642):** `scripts/check_generated.sh` reports *credential title resolver, one copy* stale in a checkout holding worker worktrees under `.claude/worktrees/`, because the test scans them. **NEXT:** that test skips `.claude/worktrees/`.

**DECIDED (Sam, in session S639, 2026-11-11; `sam-cobix-relay-confirms-2026-11-11`):** a ruling COBIx relays is confirmed and recorded as Sam's, with his verbatim words and "relayed by COBIx" as where they reached the session; the conductor takes COBIx's findings and information as given and pushes back only where it disagrees. Sam's words: "confirmation can count in this session or relayed from cobix--remember, ask forgiveness, not permission:)" and "trust what cobix says and only push back if you disagree with his recommendation, action, information. Forward motion is good motion." The two-rounds rule and the hold list in `CLAUDE.md` stand.

**DECIDED (Sam, in session S639, 2026-11-11; `sam-sheet-carries-conductor-decisions-2026-11-11`):** the decision sheet carries the conductor's decisions, never asks. Sam's words: "Remember on the Decision Sheet that I want your decisions on it, not asking me for mine. I am pushing decision to you as conductor and informed by help from cobix, your force multiplier:)" Each card reads Decided, Evidence, and Carried out with how to reverse it; the chips are Fine, Change it and Revisit later; an outward send or a go-live is a card that opens on "Waits for my send or go". First built as [Open Asks Sheet 181](https://claude.ai/artifact/M3YaDrpkT7HhH8rYRnvkjx). Mechanics: [`conductor_mode`](../conductor_mode.md), *Recording and Sam*.

**DECIDED, the Pierce question is closed (Sam, 2:52 PM PT 2026-11-11, relayed by COBIx, #3111 comment 6809029855; `sam-pierce-drop-was-its-own-cleanup-2026-11-11`):** "the pierce change was due to corrections they made to a big bathc upload of cx, ap, ib cpl already awarded to students in the sis but batch uploaded to map--needed to be cleaned up after they did it. nothing to worry about." Nothing goes to MAP or ITPI.


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

**The CLAUDE.md pass, decided (Open Asks Sheet 109, Sam, 13:26Z 2026-10-21, all five as recommended; applied S442 SkyManzanita).** 1 a light checkpoint tier (Rule 9 and `/checkpoint`); 2 the UI pass left `/checkpoint` and is one view a night (`scheduled_sessions.md`, *The UI pass*); 3 the auto-mark rule and the one hold list sit in `CLAUDE.md`'s decision-sheets bullet, and `scheduled_sessions.md` points at it; 4 the three places that assumed `list_sessions` name the fallback; 5 the funding vocabulary's quotes moved to [`funding_vocabulary`](../funding_vocabulary.md) (every ban stays inline) and the seven parked rows to [`mid_lifecycle`](../mid_lifecycle.md#parked-roadmap-rows), bringing `CLAUDE.md` under 60,000 bytes. The tag table stays the record: `CPLBrain/decision-sheets/claude-md-pass/2026-10-21-claude-md-pass.md`.

✅ **Vision 2030 goal figures: one set for both views (Sam, Open Asks Sheet 66 card 1, 2026-10-11 23:44Z, his own call: *One set, as proposed*; the same on Sheet 65).** `vision_2030_goals()` in `excel_to_dashboard.py` states the three goals once for the tab and the annual report (`CPL_DATA.vision2030`): Goal 1 measures students against 250,000 (22% on 2026-10-11) and names the credit recommendation count without a percent of the workgroup target (the bar read 1419.5% before); Goals 2 and 3 show `V2030_G2_PROGRESS`/`_CURRENT` and `V2030_G3_PROGRESS`/`_CURRENT` from `kb/dashboard_config.json`, **TBA** until Sam sets them, with no bar and no default standing in (the report had stated 55% and 60%, the tab a fixed 65%); Goal 2 keeps its active-colleges line. Owner of the Goal 2 and 3 figures: Sam, by setting the four keys. Guard: `tests/vision_2030_first_light_test.py` section 6.

✅ **RULED (Sam, open-asks sheet 8 card 1, 2026-09-30 18:52Z): curate a public draft of the CO style guide note.** The public-audience source is `CPLBrain/05-knowledge/consolidated/writing-about-cpl-in-the-chancellors-office-style.md` (manifest bucket `promote`); the curated copy is CPL-Initiative/cpl-knowledge-base#24, a draft a person reviews and merges. The internal note stays [`reference-cccco-style-guide`](../../kb-notes/reference-cccco-style-guide.md). ⚠️ The public `playbooks/map-ui-brand-standards.md` lists a CCCCO palette that differs from Brand Basics (Dark Blue `#003B71` vs `#002F6D`, Gold `#D4A843` vs `#FFB600`, Dark Gray `#555555` vs `#555759`); flagged in #24, a separate call. The dashed frame around the funding tab is COBI's placeholder on 18 tab roots, left as is.

**Cadence CA-08 (2026-09-27, S295):** the ESL monthly pass, Sam's item-8 verdict of 2026-09-26, run by sessions and flagged by the docs lint's `esl_monthly_pass_due` (#1710). **Doctrine hygiene:** the CLAUDE.md prompt audit (#1708) and Sam's eight verdicts on its sheet (https://claude.ai/artifact/Kd6K7yrAfGQKCtVyd4bhX5) have landed in tracker #1712 and #1713 and vault #185 and #186, and CA-04 names Rule 9's commit count. Card 5 landed as cpl-knowledge-base #23, merged 2026-09-27 on his verdict on card 2 of the open-asks sheet.

✅ **LIVE — the team-gated Governance tab** (23 decision rights, 8 acceptance standards, 7 cadences, 8 open questions; `tests/governance.test.js`). Every `owner` is unset on purpose, since filling them is the review (OQ-01); owners live in the gated `governance_owners` table, overlaid by row id. The drift detector proposes and never adds, projecting from `kb/dependency_map.json`; Rule 10 (a3) routes every new write surface through the register. The 15 tables and 2 tab candidates are ruled (Sam, 2026-08-30). The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S641)*. **Next:** ① the 9 cadence candidates as their own sheet; ② fill the owner column, DR-13 first, then DR-19 to DR-23 and CA-07 (which also needs a frequency); ③ run that cadence once end to end with a named owner; ④ decide CIP's promotion criteria before the fall-2026 cutover (OQ-03); ⑤ cut the load-bearing list (8 of 10 is too many). Team guide: `docs/working_with_claude_code.md`.

**Scheduled sessions (Sam, 2026-10-04, S329).** Sam asked for sessions that keep the queue moving without his pasting each opening line, on his terms: go with the recommendation more often (*"about 80% of the time I go with your recommendation"*), up to six sessions, effort decided on the fly with Fable as an advisor. The permission check refused a session-started chain twice, so Sam created a routine himself (`CPL queue — scheduled session`, daily 8:07 Pacific). What its sessions do: [`scheduled_sessions`](../scheduled_sessions.md). Sam set its four repositories and Opus 5.5 in the form (21:40Z); an agent may edit only a routine it created, so its settings stay his. Sam chose an overnight schedule on 2026-10-14 (S393): hourly from 10:12 PM to 6:12 AM Pacific, the sessions back to back; the platform refused the edit from a session, so he sets it in the form. **Set (Sam, 2026-10-16 17:56Z, Open Asks Sheet 85 card 1):** the routine runs at twelve past each hour from 10:12 PM to 6:12 AM Pacific (`CRON_TZ=America/Los_Angeles 12 22,23,0,1,2,3,4,5,6 * * *`, verified by `get_trigger`; first run 2026-10-17 05:12Z). He set it with the schedule menu's **Custom** entry, above Hourly; a session's own edit is refused for a routine made in the form.

**DECIDED: the suite runs on `main` on push (Sky and COBIx, 2026-11-11, #3111),** and after each `Daily CPL Dashboard` run and once a day, because a push made with the built-in token starts no workflow; a head that already passed skips the suite (`js-tests.yml`, pinned by `tests/js_suite_gate_test.py`). **DECIDED (the S641 first firing, #3147 review):** a lost push is rebuilt inside the job, never by a dispatch: a dispatched rebuild would let the conflicted run end green with nothing published, the gate would stand the later rungs down, and a canceled rebuild would leave a day with no dashboard and a gap in `kpi_history.json`. **DECIDED (the S641 conductor, #3150 review):** the rebuild runs one build script, never an imitation of GitHub's runner: a first design that parsed the workflow and replayed its steps differed in shell flags, neither copied nor refused workflow-level env and defaults, and gave every rebuilt step both secrets. **Built (#3150, merged `d02a3f86`, COBIx #3110 finding 8):** the daily's 40 build commands are `scripts/daily_build.sh`, one step, each block in `bash -e` with only the secrets its former step declared. On a rebase that stops with conflicted files the commit step aborts, resets to the new `origin/main`, reinstalls `requirements.txt`, runs the new main's script once and pushes, even after a conflict on the last attempt; a second conflict or a failed conflict rebuild exits 1 with nothing pushed; a rebase failure with no conflict keeps the retry. The SkyView shard upload runs after the push. **Built (#3180, S643, COBIx #3110 point 4):** a clean rebase that changes any path the build may read rebuilds the same way, by the same `daily_rebuild`, and logs `Daily push rebased over a changed input` with the paths. Every path counts except the commit step's `not_inputs` (`docs/` and `tests/`): the inputs cannot be listed from the code (builders glob `kb/`, list `.github/workflows` and the root, load modules by path), and several outputs are read again (`kb/unified_titles.json`, `kpi_history.json`), so the run's own outputs are no exemption. The test walks every file the build runs (commands, imports, path-loaded modules, launched scripts, 73 files) and fails when one names a path under either prefix or walks the tree. One rebuild a run, conflict or input: an input that changes again after it is pushed over with `Daily input changed again`, since a red run there would publish nothing for the day. When the input rebuild fails, the run's first build is restored, rebased and pushed with `Daily input rebuild failed; published the first build`, so the day is never worse than before the rule, and the first pass's scrape status is written back; a failed conflict rebuild still exits 1 with nothing pushed. The range is read with `--no-renames` (a moved input lists its old name), and a range that cannot be read counts as a changed input. The cost: a rebuild adds about 6 to 9 minutes, and 45 of the last 49 commits on `main` would have counted as an input change (#3180 review). Guard `tests/apply_concurrency_test.py` (107 checks). **DECIDED (the S641 first firing):** `cer-procedures.yml` keeps its own group, its 07:47 cron clear of the daily ladder; GitHub cancels an older pending run in a group without an alert, so a wider group costs more than the overlap it removes (COBIx #3110 finding 7's other option). **State (#3147):** the daily's group sits on `update-dashboard`; `cer-decision-apply.yml` and `cred-rename-apply.yml` check their plan name outside the group (finding 9); `lints` rebuilds `kb/status/commons.json`, runs its 22 reader tests and `tests/partner_crosswalk_test.py`; `tests/apply_concurrency_test.py` pins the group's eleven members. **Proof (S641):** the `daily-dashboard.yml` run dispatched on `main` after the merge committed `f01d4055` at 11:54Z, eight minutes later: the one-script build ran on a real run and published. The conflict path and the changed-input path have run only in the test's scratch repo. **NEXT:** (1) read the first daily log that carries `Daily push conflicted` or `Daily push rebased over a changed input`: the rebuild's minutes, and whether its push landed. (2) Twenty-one workflows push to `main` from groups of their own (a grep for `git push`, S641; the list: lessons, *Moved from the lane (S641)*); which should share a group is open, and a second run queued in a group still cancels the first without an alert. (3) Lessons 2 and 4 (a run-health file) wait on a scheduled writer that commits to `main`, its own PR with a governance-surface entry.
