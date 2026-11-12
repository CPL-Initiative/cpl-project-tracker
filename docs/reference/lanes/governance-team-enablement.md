---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-11-11
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

✅ **LIVE — team-gated ⚖️ Governance tab: 23 decision rights · 8 acceptance standards · 7 cadences · 8 open questions** (SkyMail #997/#998; Sierra added SkyMiner #1031/#1034/#1036; expanded 12→18 SkyGate). **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** The register **measures itself**: the contact-refresh cadence was decided in June and has never run (0 rows in `map_college_nudges`), and CA-06 measured Sierra feedback at *21 of 25 untriaged* until **Sam cleared the whole queue 2026-08-26 — 0 still to do, 51 of 51 handled**. Owners live in a separate gated `governance_owners` table overlaying by row id, so regenerating the JSON can never wipe an assignment; no delete policy (so `Clear owner` is a no-op on the 3 cadences carrying a register-file owner — the likeliest thing to be mistaken for a regression; 7 more reported defects unfixed). **DR-11** records what Sierra tells the public — honestly noting the decider has been Sam personally. **DR-13…DR-18** (SkyGate) cover the six surfaces nobody had recorded: **the workplan itself** (the most public artifact the project has, four tables editable in-page, no named owner), phrase rotation, contracts, CPL News, the Common CR Reference, TMC submissions. **Drift detector live + wired to the cron** (step 4a0): **proposes, never auto-adds**, and since 2026-08-30 (#1397, Sam's go) its table/tab scans **project from `kb/dependency_map.json`** instead of a local regex — the old scan could not see trailing-slash REST, verb-first helper wrappers, URL consts fetched far from their definition, served pages, or write-shaped RPCs, and **eight human-write surfaces were invisible to the whole governance layer at once**. **The 15 tables are RULED (Sam, 2026-08-30 — the Fifteen Tables judgment sheet, `docs/visuals/2026-08-30-governance-fifteen-tables.html`):** DR-19 `cpl_memory` (with Sam's edit-rules clarification — sessions propose, humans decide, everything logged; the row doubles as the spec for the S211 cross-store checker) · DR-20 `item_raci`/`item_updates`/`team_members` · DR-21 `factsheet_overrides` · DR-22 `gr_areas`/`gr_revisions`/`gr_artifacts` · DR-23 `cpl_adoption_interest` · CA-07 `map_data_quality` triage · folds: `liftoff_state`→DR-13, `cpl_funding_config`/`_notes`/`_participation`→DR-09 · `cpl_reflections` dismissed with the reason in the surface map. **The 2 tab candidates are RULED (Sam, 2026-08-30, Open Verdicts items 14–15): `chatbot` folds into CA-06** (its `sierra_feedback_upsert` write is the triage cadence's intake) **and `college-briefing` into DR-09** (the money decision's college-facing doorway) — mapped with reasons on the register rows. Queue now **9 cadences only**, arriving as their own future sheet. Readability guard tightened back to <25 in `tests/governance.test.js`. A tab whose only writes are tables is no longer proposed (each table is its own row); a tab earns a row only for RPC writes a table row cannot represent. `governance.test.js` **91/91**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human). **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. **Routing is standing doctrine since 2026-08-30** (#1402, remediation D): CLAUDE.md Rule 10 (a3) now requires every NEW write surface through this register + the privacy ADRs before it ships — the detector proposes, the rule obliges. **Onboarding gained its first machine-checked practice 2026-08-30 (#1412):** the three-repo attach rule (Sam: all three, enforced) is session-side — CLAUDE.md's Working-with-the-MAP-team bullet verifies the set at start and names what's missing — with `scripts/install-three-repo-check.ps1` as the one-time per-machine backstop for the zero-repo case (no CLAUDE.md loads there), guide §12 as the human-facing half, and the vault's Cowork section now naming all three repos. **Next:** ① the 9 cadence candidates as their own sheet; ② fill the owner column — DR-13 first, and the six new rows (DR-19..DR-23, CA-07) all ship owner-unset, CA-07 also needing a frequency; ③ run that cadence once end-to-end with a named owner; ④ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ⑤ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md`.

**Scheduled sessions (Sam, 2026-10-04, S329).** Sam asked for sessions that keep the queue moving without his pasting each opening line, on his terms: go with the recommendation more often (*"about 80% of the time I go with your recommendation"*), up to six sessions, effort decided on the fly with Fable as an advisor. The permission check refused a session-started chain twice, so Sam created a routine himself (`CPL queue — scheduled session`, daily 8:07 Pacific). What its sessions do: [`scheduled_sessions`](../scheduled_sessions.md). Sam set its four repositories and Opus 5.5 in the form (21:40Z); an agent may edit only a routine it created, so its settings stay his. Sam chose an overnight schedule on 2026-10-14 (S393): hourly from 10:12 PM to 6:12 AM Pacific, the sessions back to back; the platform refused the edit from a session, so he sets it in the form. **Set (Sam, 2026-10-16 17:56Z, Open Asks Sheet 85 card 1):** the routine runs at twelve past each hour from 10:12 PM to 6:12 AM Pacific (`CRON_TZ=America/Los_Angeles 12 22,23,0,1,2,3,4,5,6 * * *`, verified by `get_trigger`; first run 2026-10-17 05:12Z). He set it with the schedule menu's **Custom** entry, above Hourly; a session's own edit is refused for a routine made in the form.

**DECIDED: the suite runs on `main` on push (Sky and COBIx, 2026-11-11, #3111),** and after each `Daily CPL Dashboard` run and once a day, because a push made with the built-in token starts no workflow; a head that already passed skips the suite (`js-tests.yml`, pinned by `tests/js_suite_gate_test.py`). **DECIDED (the S641 conductor, 2026-11-12, #3147 review):** a lost push is rebuilt inside the job, never by a dispatch: the conflicted run would end green having published nothing, the gate would stand the later rungs down, and a canceled rebuild would leave the day with no dashboard and a gap in `kpi_history.json`. Built (#3150, finding 8): the daily's 40 build commands are one script, `scripts/daily_build.sh`, run as one step; each block runs in `bash -e` (GitHub's shell for a `run:` with no `shell:`) with only the secrets its former step declared. On a rebase conflict the commit step aborts the rebase, resets to the new `origin/main`, reinstalls `requirements.txt` and runs the new main's `scripts/daily_build.sh` once, then stages, commits and pushes; the rebuilt commit gets a push even after a conflict on the last attempt. A second conflict or a failed rebuild exits 1 with nothing pushed. The CustomReport fetch, the scrape and the MIL/JST fetch are reused; the last two run again only when main's `live_metrics.json` or `veteran_jst.json` changed meanwhile. The SkyView shard upload runs after the push, cut from the pushed tree. `tests/apply_concurrency_test.py` runs the commit step's shell in a scratch repo with a stand-in build script. **DECIDED (the S641 conductor):** `cer-procedures.yml` keeps its own group, its 07:47 cron clear of the daily ladder; GitHub cancels an older pending run in a group without an alert, so a wider group costs more than the overlap of four committed files it would remove (COBIx #3110 finding 7's other option). **State (#3147, merged 2026-11-12):** the daily's group sits on `update-dashboard`, so a scheduled rung that stands down never queues in it; `cer-decision-apply.yml` and `cred-rename-apply.yml` check their plan name in a job outside the group (finding 9); `lints` rebuilds `kb/status/commons.json` and runs its 22 reader tests on the output (lesson 1), and runs `tests/partner_crosswalk_test.py` as its last step; `tests/apply_concurrency_test.py` pins the group's eleven members (the daily, cer-decision, cred-rename, credential-family, docket-process, esl-sheet, library-publish, overmerge, phase-1e, projects-seed, workplan-goals-seed). **NEXT:** merge #3150, then read the first daily run whose log carries `Daily push conflicted`: the rebuild's minutes, and whether its push landed. **Open:** a clean rebase that brings in a changed build input (say `kb/unified_titles.json`) with no conflict still pushes outputs built from the old input and ends green; it predates #3150 and needs its own rule for which inputs force a rebuild. A second run queued in the group still cancels the first queued one, and a canceled run does not alert. Twenty-one workflows push to `main` from groups of their own (a grep for `git push`, S641): cer-procedures, college-contacts-harvest, cos-authority-sync, course-outcomes-load, course-outcomes-read, course-outline-census, course-outline-index, course-title-cleanup-apply, cpl-landing-pages, cpl-stories, csr-confirm, first-light-art, first-light-gallery-thumbs, funding-config-edit-apply, moc-crosswalk-sync, phase-1e-sync, program-course-fetch, program-requirements-college, sierra-art-fetch, supabase-migrate, weekly-reflections-summary; which of them should share a group is open. Lessons 2 and 4 (a run-health file: failures first seen on `main`, minutes red to green, dispatch-to-start) are not built: the builder needs a scheduled writer that commits to `main`, which is its own PR with a governance-surface entry.
