---
title: "Session 586 handoff: COBIx's first audit answered; the proxy and the refresh button take a credential"
date: 2026-11-05
session: 585 (SkyMessier, Sam's side session for COBIx's recommendations, 2026-11-05 ~18:45Z to ~20:00Z)
tags: [handoff, security, cobix, org-phrase-scope-auth]
status: current
---

# You are Session 586

Your moniker is **SkyWhirlpool** (galaxy names; Messier 51 in Canes Venatici). S585 was Sam's side session for COBIx,
his new quality, governance, security and privacy checker, and it ran beside the Library side session. The checkpoint
was **light**: no §11 row changed state and no re-mint or Rule 10 data receipt was written. Skipped: `kb/README.md`,
`README.md`, KB notes, the pipeline view, the four other status files, the decision sheet rebuild (the step gos below
go on the next Open Asks sheet, not a new one tonight).

## What S585 did

1. **COBIx round 1 answered** (#2816): `docs/security/cobix_round1_reply_2026-11-05.md`, twelve items, each confirmed,
   intentional or already fixed, with what each fix would break and who carries it. COBIx accepted the three
   corrections (the oracle is `team_pass_ok()`; leave `verify_jwt`; the matviews apply k=10 inside the view) and the
   six-step order on the thread. Owner split: CC carries code, migrations and workflow edits; COBIx the console
   settings; Sam the two rotations.
2. **COBIx on PRs** (#2817): `docs/reference/cobix_pr_loop.md` and the `cobix-review.yml` stub, off until the repo
   variable `COBIX_REVIEW_ENABLED` and the endpoint secrets exist. COBIx's comments arrive on the PR thread under Sam's
   account with a `## COBIx` heading; the session that opened the PR answers there.
3. **Security step 1** (#2818): the worker's `/trigger` and drafting path answer only `x-team-pass` (via
   `rpc/team_pass_ok`) or a reviewer bearer (via `rpc/is_allowed_reviewer`); the click lives in `cobi_refresh.js`;
   `cpl_writer.draft()` sends the credential (the KB portal passes its own phrase); the published trigger secret is
   gone from the generator and both HTMLs. Tests: `worker_credential`, `cobi_refresh`, the stdlib
   `refresh_button_no_secret` guard (in the lints job and the pre-push check).
4. `CLAUDE.md` trimmed back under its 60,000-byte cap (the figure-card rule had pushed it over).

## Decisions Sam made this run

- COBIx does higher-level quality, governance, functionality, security and privacy work beside CC (2026-11-05).
- "Go on your recommendations": the COBIx loop (identity plus the workflow stub) and security step 1, with CC as the
  writer of code and COBIx the independent re-auditor; rotation guidance asked for and written.

## Open work, in order

1. **Sam's console steps after #2818** (`docs/security/rotation_guide.md`): paste `cloudflare-worker-proxy.js` from
   `main` into the `cpl-proxy` Worker; press Manually Refresh COBI signed in; rotate `SCRAPE_SECRET` (GitHub secret
   `CPL_SCRAPE_SECRET` first, then the Worker, one sitting, away from 06:17/09:17/12:17 UTC); rotate `GITHUB_TOKEN` to
   a fine-grained token (this repo, Actions read-write); tell COBIx on #2816. Until the paste, the new button answers
   "Invalid or missing secret"; the daily scrape is unaffected.
2. **Security steps 2 to 6, each on Sam's go** (the order in the reply note): (2) one migration: the three
   `public`-writable orphan tables (`kpi_snapshots_*`, `update_log`) to `service_role`, a failed-attempt lockout inside
   `team_pass_check`, revoke anon on the `*_check` functions and `rls_auto_enable`, `cobi_nav_audit`,
   `sierra_rules_audit`, `is_map_team`, `team_members` SELECT to reviewer-or-phrase; (3) funding `_pub` views and the
   base SELECT gates, the k=10 guard test, the TMC `owner_token`; (4) the logos UPDATE policy on the budget project and
   the atomic `kpi_history.json` write with a sanity floor; (5) read `cpl-chat-preview`, `generate-letter`,
   `letter-curator`, move the chat quota to a durable store; (6) the two GitHub environments (console first), then the
   `environment:` lines in the 29 service-key workflows, then delete the repo secret. Put the gos on the next Open
   Asks sheet.
3. **COBIx's answer on identity** lands on #2816 (merged, no session watching): can it hold a GitHub token and poll a
   thread, or is the workflow route the only one? Read the thread at start.
4. **The harvest queue, unchanged from 585:** Monterey Peninsula's six unequal records (#2809's page read),
   Mission's full read on #2800 from 2026-11-06 UTC, objectives for the ten loaded colleges, Glendale's display build
   ([`program-requirements-harvest`](reference/lanes/program-requirements-harvest.md)).
5. **Commons:** the lane's NEXT (a rule on every reference; a stalled routine as a queue item; the confidence count;
   the other references' paths; the `--cmn` tokens) and the Common Course Reference's retirement into the Courses List.
6. Tonight's routine steps from 2026-11-06 UTC: step 0's dashboard run on the 06:12Z firing, steps 5 to 9, the
   credential slice, the SLO step, the UI pass. The contacts harvest runs Sunday, 2026-11-08.
7. Carried: ELL IET Version 5 and the overview publish (the Library side session holds them), Sam's own CPLBrain steps
   (Malone as a collaborator, the transfer, about 60 references), ECONMT and Electricity's adult-education codes, the
   Subjects card's second count, `CLAUDE.md`'s checkpoint note still saying 58 KB.

**Lanes worked this week that wait on someone else:** `org-phrase-scope-auth` (Sam's go on the role column; the lockout
migration); `cer-procedures` (its NEXT (0) acts after each of Sam's runs through *Another look*);
`governance-team-enablement` (Malone's managed-settings answer); `reviewer-session-lifetime` (one real-browser round
trip); `common-subjects-reference` (item 8); `library` (the side session).

## Patterns that worked

- Verify an audit finding against the live catalog before accepting its fix: three of twelve were design, and one
  proposed fix (revoke anon on `*_pass_check`) would have closed nothing while breaking sign-in.
- A credential already held by the page is the smallest gate: the worker asks Postgres with the same two RPCs the
  edge functions use, so no new secret and no new identity provider.

## Lessons

- `docs/auth_and_repo_posture_lessons.md`, the 2026-11-05 section: the proxy's gate, the oracle, the three
  design-not-gap items, the COBIx loop.

## Let go

S585 holds no PR subscription, check-in or artifact watch. Open PRs of its own: none (#2816, #2817, #2818 merged). The
Library side session (`claude/amazing-cerf-4n2658`) was told about the handoff number and takes 587.
