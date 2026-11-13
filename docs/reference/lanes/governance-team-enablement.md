---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-11-13
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

**DECIDED (Sam, S639, 2026-11-11; `sam-sheet-carries-conductor-decisions-2026-11-11`):** the decision sheet carries the conductor's decisions (Decided, Evidence, Carried out with how to reverse it); a card that needs him carries steps and links (Sam, 2026-11-13). The paragraph as it stood: `docs/governance_lessons.md`, *Moved from the lane (S648 checkpoint)*; mechanics: [`conductor_mode`](../conductor_mode.md).

**The Pierce question is closed (Sam, 2026-11-11, `sam-pierce-drop-was-its-own-cleanup-2026-11-11`):** moved verbatim to `docs/governance_lessons.md`, *Moved from the lane (S648 checkpoint)*. Nothing goes to MAP or ITPI.


**LIVE: the `live-counts` environment (Sam, in session S647, 2026-11-13; `sam-live-counts-environment-2026-11-13`).** Sam's words: "environment done...see cobix comments"; "new environment is live-counts"; and "that's the name I gave it. if you want me to change it, let me know. it's still a repo secret too". The environment (deployment branch `main` only) holds `SUPABASE_SERVICE_KEY`; the Commons data dashboard's `live-counts` job in `harvest-gap-census.yml` reads it there (#3232; [commons](commons.md), *The live read*). The repository copy still exists: 38 workflow files name the key (grep, 2026-11-13), and only that one job runs in an environment. **NEXT:** (1) move the other workflows that read the key into environments, one PR per group, listed by `grep -l SUPABASE_SERVICE_KEY .github/workflows/*.yml`; (2) then Sam removes the repository copy, his setting (a *Yours to do* card when the workflows are ready, never before); (3) `tests/standards_2_ruled_renames_test.py` fails 6 of 27 on `main` and no workflow runs it (as reported by the S647 worker on #3233): fix it or retire it, and have CI run what stays. (4) From #3227's review (S648), outside that PR: `kb/_second_reader.py` exits 0 when the database is down, and a comment in `cpl-chat-deploy.yml` names only `group_queue.mjs`; the post-deploy `{}` calls to `program-requirements-extract` wait on a key the session does not hold (COBIx asked on #3227).

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

**The CLAUDE.md pass (Open Asks Sheet 109, 2026-10-21; applied S442)** moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S647)*; it stands.

✅ **Vision 2030 goal figures: one set for both views (Sam, Open Asks Sheet 66 card 1, 2026-10-11 23:44Z, his own call: *One set, as proposed*; the same on Sheet 65).** `vision_2030_goals()` in `excel_to_dashboard.py` states the three goals once for the tab and the annual report (`CPL_DATA.vision2030`): Goal 1 measures students against 250,000 (22% on 2026-10-11) and names the credit recommendation count without a percent of the workgroup target (the bar read 1419.5% before); Goals 2 and 3 show `V2030_G2_PROGRESS`/`_CURRENT` and `V2030_G3_PROGRESS`/`_CURRENT` from `kb/dashboard_config.json`, **TBA** until Sam sets them, with no bar and no default standing in (the report had stated 55% and 60%, the tab a fixed 65%); Goal 2 keeps its active-colleges line. Owner of the Goal 2 and 3 figures: Sam, by setting the four keys. Guard: `tests/vision_2030_first_light_test.py` section 6.

✅ **RULED (Sam, open-asks sheet 8 card 1, 2026-09-30 18:52Z): curate a public draft of the CO style guide note.** The public-audience source is `CPLBrain/05-knowledge/consolidated/writing-about-cpl-in-the-chancellors-office-style.md` (manifest bucket `promote`); the curated copy is CPL-Initiative/cpl-knowledge-base#24, a draft a person reviews and merges. The internal note stays [`reference-cccco-style-guide`](../../kb-notes/reference-cccco-style-guide.md). ⚠️ The public `playbooks/map-ui-brand-standards.md` lists a CCCCO palette that differs from Brand Basics (Dark Blue `#003B71` vs `#002F6D`, Gold `#D4A843` vs `#FFB600`, Dark Gray `#555555` vs `#555759`); flagged in #24, a separate call. The dashed frame around the funding tab is COBI's placeholder on 18 tab roots, left as is.

**Cadence CA-08 (the ESL monthly pass) and the doctrine hygiene of S295** moved verbatim to [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S647)*; both stand.

✅ **LIVE — the team-gated Governance tab** (23 decision rights, 8 acceptance standards, 7 cadences, 8 open questions; `tests/governance.test.js`). Every `owner` is unset on purpose, since filling them is the review (OQ-01); owners live in the gated `governance_owners` table, overlaid by row id. The drift detector proposes and never adds, projecting from `kb/dependency_map.json`; Rule 10 (a3) routes every new write surface through the register. The 15 tables and 2 tab candidates are ruled (Sam, 2026-08-30). The paragraph as it stood: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S641)*. **Next:** ① the 9 cadence candidates as their own sheet; ② fill the owner column, DR-13 first, then DR-19 to DR-23 and CA-07 (which also needs a frequency); ③ run that cadence once end to end with a named owner; ④ decide CIP's promotion criteria before the fall-2026 cutover (OQ-03); ⑤ cut the load-bearing list (8 of 10 is too many). Team guide: `docs/working_with_claude_code.md`.

**Scheduled sessions (Sam, 2026-10-04, S329).** Sam asked for sessions that keep the queue moving without his pasting each opening line, on his terms: go with the recommendation more often (*"about 80% of the time I go with your recommendation"*), up to six sessions, effort decided on the fly with Fable as an advisor. The permission check refused a session-started chain twice, so Sam created a routine himself (`CPL queue — scheduled session`, daily 8:07 Pacific). What its sessions do: [`scheduled_sessions`](../scheduled_sessions.md). Sam set its four repositories and Opus 5.5 in the form (21:40Z); an agent may edit only a routine it created, so its settings stay his. Sam chose an overnight schedule on 2026-10-14 (S393): hourly from 10:12 PM to 6:12 AM Pacific, the sessions back to back; the platform refused the edit from a session, so he sets it in the form. **Set (Sam, 2026-10-16 17:56Z, Open Asks Sheet 85 card 1):** the routine runs at twelve past each hour from 10:12 PM to 6:12 AM Pacific (`CRON_TZ=America/Los_Angeles 12 22,23,0,1,2,3,4,5,6 * * *`, verified by `get_trigger`; first run 2026-10-17 05:12Z). He set it with the schedule menu's **Custom** entry, above Hourly; a session's own edit is refused for a routine made in the form.

**DECIDED: the suite runs on `main` on push (Sky and COBIx, 2026-11-11, #3111),** and after each `Daily CPL Dashboard` run and once a day, because a push made with the built-in token starts no workflow; a head that already passed skips the suite (`js-tests.yml`, pinned by `tests/js_suite_gate_test.py`). **DECIDED (the S641 first firing, #3147 review):** a lost push is rebuilt inside the job, never by a dispatch: a dispatched rebuild would let the conflicted run end green with nothing published, the gate would stand the later rungs down, and a canceled rebuild would leave a day with no dashboard and a gap in `kpi_history.json`. **DECIDED (the S641 conductor, #3150 review):** the rebuild runs one build script, never an imitation of GitHub's runner: a first design that parsed the workflow and replayed its steps differed in shell flags, neither copied nor refused workflow-level env and defaults, and gave every rebuilt step both secrets. **Built (#3150, merged `d02a3f86`, COBIx #3110 finding 8):** the daily's 40 build commands are `scripts/daily_build.sh`, one step, each block in `bash -e` with only the secrets its former step declared. On a rebase that stops with conflicted files the commit step aborts, resets to the new `origin/main`, reinstalls `requirements.txt`, runs the new main's script once and pushes, even after a conflict on the last attempt; a second conflict or a failed conflict rebuild exits 1 with nothing pushed; a rebase failure with no conflict keeps the retry. The SkyView shard upload runs after the push. **DECIDED and built (the S643 conductor; `d-daily-rebuild-on-changed-input-s643`; #3180 `f2864716`, two readers; COBIx #3110 point 4):** a clean rebase that changes any path the build may read rebuilds the same way, by the same `daily_rebuild`, and logs `Daily push rebased over a changed input` with the paths. The rules, the fallbacks and the cost: [`governance_lessons`](../../governance_lessons.md), *Moved from the lane (S646)*. Guard `tests/apply_concurrency_test.py` (107 checks). **DECIDED (the S641 first firing):** `cer-procedures.yml` keeps its own group, its 07:47 cron clear of the daily ladder; GitHub cancels an older pending run in a group without an alert, so a wider group costs more than the overlap it removes (COBIx #3110 finding 7's other option). **State (#3147):** the daily's group sits on `update-dashboard`; `cer-decision-apply.yml` and `cred-rename-apply.yml` check their plan name outside the group (finding 9); `lints` rebuilds `kb/status/commons.json`, runs its 22 reader tests and `tests/partner_crosswalk_test.py`; `tests/apply_concurrency_test.py` pins the group's eleven members. **Proof (S641):** the `daily-dashboard.yml` run dispatched on `main` after the merge committed `f01d4055` at 11:54Z, eight minutes later: the one-script build ran on a real run and published. The conflict path and the changed-input path have run only in the test's scratch repo. **The first real daily run after #3180** (run 43377336314, dispatched on `main` 06:14Z 2026-11-13) went green at 06:23Z and published (`94908047`, as reported). **NEXT:** (1) read the first daily log that carries `Daily push conflicted` or `Daily push rebased over a changed input`: the rebuild's minutes, and whether its push landed. (2) Twenty-one workflows push to `main` from groups of their own (a grep for `git push`, S641; the list: lessons, *Moved from the lane (S641)*); which should share a group is open, and a second run queued in a group still cancels the first without an alert. (3) Lessons 2 and 4 (a run-health file) wait on a scheduled writer that commits to `main`, its own PR with a governance-surface entry.
