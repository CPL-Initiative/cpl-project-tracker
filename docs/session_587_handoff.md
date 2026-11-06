---
title: "Session 587 handoff: step 1 verified end to end; step 2's migration drafted, not applied"
date: 2026-11-05
session: 586 (SkyMessier continued, Sam's side session for COBIx, 2026-11-05 ~20:30Z to ~22:40Z; checkpointed at the context WARN)
tags: [handoff, security, cobix, org-phrase-scope-auth]
status: current
superseded: true
superseded_by: session_590_handoff.md
---

# You are Session 587

Your moniker is **SkyWhirlpool** (galaxy names; Messier 51). Handoff 586 named it for the next session and
S586 ran on in the same window, so it passes to you. This checkpoint was **light** and written at the context
WARN (about 100,000 tokens left): no §11 row changed state, no re-mint or Rule 10 data receipt. Skipped:
`kb/README.md`, `README.md`, KB notes, the pipeline view, the four other status files, the decision sheet
rebuild. Read handoff 586 for the fuller picture of the day; this one carries what moved after it.

## What moved after handoff 586

1. **Step 1 verified end to end (2026-11-05 21:12Z to 22:02Z, Sam at the consoles).** Worker `b539b2a7`
   pasted; `SCRAPE_SECRET` rotated on the GitHub secret and the Worker (proof run 686 green); `GITHUB_TOKEN`
   rotated to a fine-grained token (run 688 dispatched from the button); the expired "CPL Dashboard Trigger"
   PAT and the old token deleted. `SUPABASE_SERVICE_KEY` was overwritten by mistake mid-rotation and restored
   from the project's API Keys page before any cron; run 686 proves it. Secrets now live in Bitwarden Free
   (Sam chose it over 1Password; a shared two-person organization).
2. **COBIx's identity:** the `cobi-cto` account (Triage, event-driven, no token to poll with); first comment
   under its own name on #2816 at 20:46Z. Loop page updated (#2820). Sam's org base-permission change from
   Admin to Read was checked and answered "safe" (only the two owners and `cobi-cto` hold access; every
   workflow and the Pages deploy run on `GITHUB_TOKEN`).
3. **Step 2 drafted, NOT applied:** [#2822](https://github.com/CPL-Initiative/cpl-project-tracker/pull/2822),
   `kb/migrations/2026-11-05_security_step2_phrase_lockout_orphans_team_members.sql` and its rollback, both
   SQL lints green. Sam's go was given in session (~22:15Z).

## Open work, in order

1. **Finish step 2** (one PR, then apply, then read back):
   - Switch the explicit unlock to `POST /rest/v1/rpc/team_pass_verify` with the phrase in `x-team-pass` and
     `{"p_site": "team" | "gr" | "fin"}` in the body: `team_phrase.js` `verify()` (the `SITES` map's `rpc`
     field and `rpcFor` become the `p_site` value), `raci.js` `verifyPhrase()`, `gr_priorities.js` `verify()`
     (`p_site: "gr"`), `kb-portal/composer_util.js` `teamPassRequest()`. Holders' checks (RLS, the worker,
     the edge functions) keep `team_pass_ok`.
   - `nudges/build_nudges.py` `_team_members_supabase()` reads with `SUPABASE_SERVICE_KEY` from the
     environment when present, else the anon key (after the gate the anon read returns `[]` and the nudge
     opt-out silently stops applying).
   - Tests to update: `tests/gr_priorities.test.js` line 32 (expects `rpc/gr_pass_ok`),
     `tests/kb_portal_composer.test.js` line 132 (pins the `team_pass_ok` URL), and read
     `tests/raci_team_pass.test.js`, `tests/team_phrase_p1.test.js`, `tests/kb_portal_teampass.test.js`,
     `tests/team_phrase_affordance.test.js` for the route they mock. Add a jsdom test that the unlock
     sends `p_site` and the header and never the phrase in the body or URL.
   - `kb/_build_dependency_map.py`: the `team_phrase.js` seed names `rpc:team_pass_ok/gr/fin`; add
     `rpc:team_pass_verify`. `kb/governance_surface_map.json`: `table:team_pass_attempts` (definer-only write
     surface, the reason).
   - Apply the migration through the Supabase MCP (`apply_migration`), then read back:
     `has_function_privilege('anon', 'public.team_pass_check(text)', 'execute')` false, the three orphan
     tables' policies `service_role` only, `tm_select` gated, and one simulated verify:
     `with s as (select set_config('request.headers', '{"x-team-pass":"wrong","x-forwarded-for":"203.0.113.9"}', true)) select public.team_pass_verify() from s;`
     then a row in `team_pass_attempts`. Whether the gateway forwards an IP header is unmeasured: if the
     read-back shows no row, the IP is null and the lock skips itself by design; say so to COBIx.
   - Tell COBIx on #2816; merge #2822 with the client PR.
2. **COBIx's console items** can run in parallel: the Cloudflare rate-limit rule on `/`, `/scrape`,
   `/trigger`; query-string log redaction; leaked-password protection; the two GitHub environments.
3. **Steps 3 to 6** on Sam's go, as handoff 586 lists them.
4. The harvest queue, the Commons, tonight's routine steps and the carried items: unchanged from handoff 586.

## Decisions Sam made this run

- Go on security step 2 (2026-11-05 ~22:15Z).
- Bitwarden Free as the team's secret store for the Worker and GitHub secrets.

## Lessons

- Mid-rotation, a secret with a similar name got the random value meant for another. One entry per secret
  in the password manager, named for where it lives, and a proof run before the cron, caught it in time.
- `is_map_team()` looked unused from the JS side; two RLS policies call it. Check `pg_policies` before
  revoking a function from `authenticated`.

## Let go

S586 holds no PR subscription, check-in or artifact watch. Open PR of its own: #2822 (draft, SQL only).
