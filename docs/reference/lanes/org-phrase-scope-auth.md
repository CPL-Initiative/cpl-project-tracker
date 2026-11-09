---
title: "Org & phrase scope / auth model — lane state"
created: 2026-08-28
updated: 2026-11-07
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Org & phrase scope / auth model

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Which sites exist, which phrase opens which, and whether shared phrases survive at all.

## SkyView is the lane's first PUBLIC surface (2026-09-19)

⭐ **A fourth answer to "which credential opens what" now exists, and it is
`none`.** Every other surface in this lane assumes a holder — a phrase or a
reviewer session — and asks which one. `prototype/skyview.html` is the first
page deliberately shipped to people with **no credential at all**. Sam:
*"My goal is to allow public read only SkyView access but prevent any actions
to be taken that would edit or access views where edits could be done."*

That inverts the usual question. Elsewhere the work is deciding what a holder
may reach; here it is enumerating everything a NON-holder can reach and
subtracting whatever edits. Three doors were open and none was in a menu:

1. **The hash.** `#comprehensive`, `#disciplines`, `#subjects`, `#esl`,
   `#work/<discipline>` routed with no check. A gated menu item with a live URL
   behind it looks correct in a screenshot and is not a gate.
2. **A second file.** `ccr_atlas_graph.js`'s `__ccrDecision` is a complete
   drag-to-move curation surface that `curationRung()` had never seen, because
   the single-decider guard only ever read `ccr_universe.js`. ⚠️ **A
   single-decider guard is only as wide as the files it reads** — worth
   carrying into the role-column work below, where the same claim will be made
   about policies rather than modules.
3. **Markup that paints before its own gate runs.** The static `u-ro-line`
   banner hardcoded a COBI link, so the first frame of the page Sam shares
   outside the team offered a door underneath the sentence saying the reader
   was read only.

⚠️ **THE SKYVIEW RUNG IS A CONVENIENCE GATE AND CHANGES NOTHING ABOUT RLS.**
Withholding a view removes the OFFER. `pages.yml` serves `prototype/` and COBI
alike, so an address still walks in, and the **12 of 29 Everyone-rung tabs that
render live internal data to a signed-out reader** are untouched by any of it —
that remains RLS or the [public/private split](public-private-repo-split.md).

⚠️ **ONE CREDENTIAL COVERS BOTH PAGES, AND READERS DID NOT KNOW.** `cpl_sb` and
`cpl_team_pass` are `localStorage` keys and SkyView and COBI are the **same
origin**, so a phrase entered on either is held on both. Sam asked directly —
*"I'm not sure if I'm also signed in on COBI main page"* — which is a sign the
model is right and was simply never stated on screen. SkyView's band says it
now. Any future surface in this lane should assume the same question gets asked
again and answer it in place.

Ladder detail, the rung table and the gating mechanics:
[`skyview-ccr-interface`](skyview-ccr-interface.md).

## Status

🔨 **MEASURED + RECOMMENDED, NOT BUILT** (Sky160, Sky168, Sky169). ⭐ **RECOMMENDATION: magic link + ONE `role` column on `allowed_reviewers` — explicitly NOT groups.** Sam re-opened his own 2026-08-14 ruling (*"I want to keep things stupid simple"*, `cpl_memory` `sam-roles-not-groups-keep-the-phrase`, verified). Measured: magic-link ALREADY covers more of COBI than phrases — **132 policies** call `is_allowed_reviewer()` vs **83** calling `team_pass_ok()`, and **31 modules** read a reviewer session vs **22** sending `x-team-pass`. So the question is only whether the phrase half survives. One role per person (admin/team/gr/fin); **the 132 reviewer policies do not change**; transition accepts EITHER a session OR a phrase so nothing goes dark; retire `ci` first (it protects nothing), then `gr`, `fin`, `team`. ⭐ **The scaling proof is our own KB note** `exclusive-surface-scopes-a-shared-credential`: a shared credential can only scope to a surface exclusive to ONE group, and exactly **2 of 34** COBI tabs qualify — so every phrase is structurally a **superset**. ⚠️ **Phrase STRENGTH is not the weakness** (measured by shape: all four are 12–13 chars, mixed case, digits + symbols); the weaknesses are **no identity on writes, no per-person revocation, silent spread**. ✅ **Reviewer roster 5 → 10 (2026-08-19)** — Ashley, Jessica, Malone, Kristen (rccd.edu) + **Pedro Campos (ITPI CEO), the first EXTERNAL-domain reviewer**, added on Sam's explicit confirmation. This closed the gap where team members named in this file were working through shared phrases because nobody had added them. ⚠️ **Reviewer is ALL-OR-NOTHING and that now has teeth** — beyond any phrase it reaches `map_student_credit` (**537,908 rows, STUDENT GRAIN**), `map_student_credit_prev` (220,588), `kb_curation` (32,441), the `gr_*` register, and **`team_access` itself — so a reviewer can read and rotate every team phrase**. A partner who needs `kb_curation` also gets student-grain data; that is the concrete case for the role column. Revocation is one DELETE per row. ✅ **GR phrase scoped** (`team_pass_check()` excludes `gr`, #1239) — residual: a GR-only holder needs the `team` phrase. **Finance stays parked** (genuinely shares 6 of 42 tables). **2026-11-05 (S586):** the drafting proxy and the refresh trigger now take the phrase or a reviewer bearer, verified by `team_pass_ok()` / `is_allowed_reviewer()` from the Cloudflare worker (#2818); COBIx's audit names `team_pass_ok()` as the brute-force oracle, so a failed-attempt lockout inside `team_pass_check` is step 2 of the security order (`docs/security/cobix_round1_reply_2026-11-05.md`). Step 2 is live (2026-11-06): the migration applied by `supabase-migrate.yml` run 42174586762 at 06:30Z and the client switch merged as #2822 (bdf8f811) at 08:15Z. The explicit unlocks call `rpc/team_pass_verify` with `p_site`; holders' checks keep `team_pass_ok`; the 250 ms sleep sits in `team_pass_verify` and a direct POST to `rpc/{team,gr,fin}_pass_ok`, never in the per-row path (89 policies call `team_pass_ok()` unwrapped). Read back at 08:16Z: anon cannot execute `team_pass_check(text)`, the three orphan tables hold `service_role` policies only, `tm_select` is gated, and a simulated wrong phrase wrote one `team_pass_attempts` row (test IP 203.0.113.9). Unmeasured: whether the gateway forwards a client IP on real requests; with none the lock skips itself. **NEXT: read `team_pass_attempts` after the first real failed unlock to settle the IP question; COBIx's console items; steps 5 and 6 (3 and 4 applied, S603); Sam's go on the role column.** Measurement: [`docs/phrase_scope_analysis.md`](docs/phrase_scope_analysis.md); story [`docs/auth_and_repo_posture_lessons.md`](docs/auth_and_repo_posture_lessons.md).

## Repository security & CI (COBIx audits, S601)

What protects the repositories and their automation: the Worker's secrets, which workflows can read
the Supabase service key, whether a failing workflow is seen, and `main`'s protection. COBIx audits
it (`cobix_pr_loop`); a session writes the code; Sam holds every console step. Added by S601 from
COBIx's audits of 2026-11-07 (#2890, #2891).

**Why this section exists.** S586 asked for security steps 3 to 6 to go on the next Open Asks sheet. They
went into handoffs only. A handoff is not scanned by the sheet builder, so the asks never reached Sam.
The lane's marker is what makes the builder carry them.

### State

- **The live-metrics scrape works again (2026-11-07 16:09Z, run 700).** It failed from 2026-11-05 ~21:20Z: the
  workflow put the secret in the query string unencoded, and a base64 secret's `+` reads back as a space
  (`URLSearchParams`), so the Worker answered 403 to identical values. #2898 sends it URL-encoded and in the
  `x-scrape-secret` header; #2892 turns a failed scrape red and #2897 prints the Worker's reply in the last step.
- **Security steps 1 to 4 are done** (S587, S590, S603; steps 3 and 4 under the rulings below). Steps 5 and 6 are
  open, written in [`cobix_round1_reply_2026-11-05`](../../security/cobix_round1_reply_2026-11-05.md) ("Proposed
  order, revised"): step 5 is item 5's two unread sources and the durable chat quota, with item 10's rate limits
  and the TMC contact fields (item 8's TMC half); step 6 is the two environments.
- **Environments.** The service key is a repository secret, so any workflow can read it; only
  `supabase-migrate.yml` names an environment. The proposal (same file): `database` with a required
  reviewer for the dispatch-only `*-apply` workflows, `database-scheduled` with no reviewer and a `main`
  branch rule for the crons and syncs.
- **Failure alerts.** `workflow-failure-watch.yml` keeps one issue per failing unattended workflow and closes it on the next success (#2905, #2891 item 3); its guard test fails when a new cron is neither watched nor excused.
- **Branch protection on `main`** is unverified: COBIx's Triage role cannot read it (#2891 item 10).

### Sam's rulings ([Open Asks Sheet 167](https://claude.ai/artifact/8LGSDcPhS5m2YnUdL66nES), 15:03-15:06Z 2026-11-07)

- **Card 3, done:** both secrets match; the scrape lands since #2898 (run 700, 16:09Z).
- **Card 4, go:** security steps 3 to 5, each its own PR or migration, each applied only on his word.
- **Card 5, create:** with a correction in the sheet's thread, so no apply waits on a click (his words on card 6:
  *"I don't want this to force me to approve every merge or sql query--finally got out of that horrible loop"*):
  both environments carry **no required reviewer**; `database-scheduled` keeps the `main`-only branch rule.
  He creates them in the console; the `environment:` lines follow in one PR.
- **Card 6, advise:** answered in the thread: a ruleset with only *Restrict deletions* and *Block force pushes*
  adds no approval; *Require a pull request*, *Require status checks* and *Require review from Code Owners* stay
  off. Sam answered Sheet 168 card 1 (15:12Z): *"those were already ticked--leaving as is."* The rulesets stand as
  he set them; nothing waits.
- **Security step 3 is applied (S603, 2026-11-07).** Sam answered [Open Asks Sheet 169](https://claude.ai/artifact/42Wrb1UqxNE6tX3okfu1Re) card 1 *apply* (20:57Z). `supabase-migrate.yml` run 42413667979 applied `kb/migrations/2026-11-07_tmc_submissions_owner_token.sql` (receipt `kb/receipts/migration_tmc_submissions_owner_token_42413667979.json`), and #2901's client landed in the same window. Read back live: the UPDATE policy and the INSERT check both require `owner_token = tmc_request_token()`; `has_column_privilege('anon','public.tmc_submissions','owner_token','select')` is false while every other column stays readable; TRUNCATE is off `anon` and `authenticated`; 0 rows. NEXT: one real save and resume in the TMC Builder after Pages deploys (this sandbox cannot reach `*.supabase.co`, so a browser round trip is the check). The funding half was already closed by column grants (S602). Still readable by anon on `tmc_submissions`: `contact_name` and `contact_email` (0 rows today), item 8's personal-data question for the TMC half; NEXT with step 5. The k=10 check (item 7) runs daily since #2903 (`k10-disclosure-check.yml`; 0 on all four assertions, first runner read 2026-11-07).
- **Reviewer emails closed to the anon key (S614, 2026-11-09; Sam, in session: *"go ahead and close the email exposure"*).** COBIx on #2948 found the new rulings read `reviewer_email` with the anon key; the policy `kb_curation_read` is PUBLIC with `true`, so every row's `reviewer_email` and `validated_by` were readable (38,106 rows, 41 people). Part 1 (applied by MCP, 03:40Z): `kb_curation.reviewer_label`, a generated column keeping a procedure's `…@bot` id and reading *a reviewer* for a person. The ten readers in `canonical_subj4.js`, `exhibits.js`, `unified_courses.js`, `statewide_interactive.js`, `credential_reference.js` and `coci_lookup.js` take `curationWho()` (the label signed out, the email beside it with a fresh reviewer token) and `curationRows()`. Part 2 (`kb/migrations/2026-11-09_kb_curation_hide_reviewer_email.sql`) revokes anon's table SELECT and grants every column but the two emails: **applied** (`schema_migrations` 20261109040653 and again 20261109091655, both through the MCP; neither run left a commit naming it). S618 read it back at 10:35Z: `reviewer_email` and `validated_by` false for anon, the other six columns true. Pages serves the readers: the five live files carry `curationWho`/`curationRows` as many times as `main`; every browser write sends the reviewer's own token (authenticated keeps SELECT); no anon-executable invoker function or view over `kb_curation`, and no `kb/` or `scripts/` read with the anon key names either column or omits `select=`. Guard `tests/kb_curation_no_anon_email.test.js`. **Not closed:** the committed data files (`kb/credentials.json` about 1,600, `kb/unified_titles.json`, `kb/coci_curation.json` and kin) still publish reviewer emails through Pages, and the public repo's history keeps them; the generators' label (step 2) waits on Sam's *go on 2*, a history scrub on his explicit word (Rule 5). Residual: any signed-in account reads the emails (`authenticated` keeps SELECT).
- **Security step 4 is applied (S603, 2026-11-08).** Item 11 (#2907): `kpi_history.json` cannot be wiped by a bad read; a parse error stops the run, the write is atomic, and a history more than a day shorter than the committed one is refused (`tests/kpi_history_write_test.py`). Item 10 (Sam: *"Yes"*): the budget project's logo policies bind the invitee to its campaign and pin the path to `<slug>/<invitee id>.<ext>`, for UPDATE as for INSERT; applied by `supabase-migrate.yml` run 42434254557 after the MCP prompt timed out twice, which needed `project=budget-support` in the trigger (#2909; allowlist of two). Read back live: both policies carry the new check; 0 logos, 0 invitees. Rollback `kb/migrations/2026-11-07_budget_logos_update_policy_rollback.sql`. The open half of item 10 (rate limits on the three invitee functions and their sources) stays with step 5. NEXT: step 5, item 5's unread sources and the durable chat quota.
- **Student-grain grants, held (S604, 2026-11-08; COBIx #2919, PR 1 of its summarize-then-delete plan).** anon and authenticated held TRUNCATE, INSERT, UPDATE, DELETE, REFERENCES and TRIGGER on `map_student_credit`, `map_student_credit_prev` and `stg_student_credit` (read live); RLS gates the writes but never TRUNCATE. `kb/migrations/2026-11-08_student_grain_revoke_writes.sql` revokes them and keeps the reviewer-gated SELECT; rollback beside it; guard `tests/student_grain_revoke.test.js`. Sam, in session 2026-11-08 ~16:00Z: *"yes the ruling is mine, apply the revoke and yes to the rest"*; applied by the runner (run 42497305017, receipt `kb/receipts/migration_student_grain_revoke_writes_42497305017.json`); read back live: anon and authenticated hold SELECT only on all three, service_role unchanged. **RULED (Sam, 2026-11-08):** COBI pulls student-level MAP data only to analyze and summarize it and never acts on an individual record, so it keeps none: summarize, then delete. The two unread copies are dropped next (PR 2, after a backup and hand-entered-data check). The measured plan is https://github.com/CPL-Initiative/cpl-project-tracker/issues/2919#issuecomment-6723544749.
- **Two unread student-grain copies dropped (S604, 2026-11-08; Sam: *"yes to the rest"*; PR 2 of #2919's plan).** `map_student_credit_prev` (220,588 rows) and `stg_student_credit` (543,579): no hand-entered column, no dependent object, no reader in the repo. Run 42498803570, receipt `kb/receipts/migration_student_grain_drop_orphans_42498803570.json`; read back: both gone. Sam confirmed the backup (Pro, daily physical; 2026-11-08 09:29Z holds both). Left: `map_student_credit` and `stg_map_student_credit` (PR 4), the 74-pull key sketch (PR 3), and the stale credential-volume matviews, which no job refreshes (PR 4 must refresh before it deletes).

### Next (session work)

1. When Sam confirms the Worker in Cloudflare runs #2893's code (it reads `x-scrape-secret`): the workflow drops the
   query string and the Worker stops reading `?secret=`.
2. The shared failure step is built (#2905, `workflow-failure-watch.yml`, one issue per failing workflow, closed by the next success); COBIx's fork-PR finding is fixed (46955f4b: only this repository's scheduled, push or dispatch runs alert); confirm it merged with no open finding, and that the first scheduled failure raises an issue.
3. After the environments exist: the `environment:` lines in the service-key workflows, one PR.
