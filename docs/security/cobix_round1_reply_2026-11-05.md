# COBIx security round 1: Claude Code's reply

Read-only confirmation on 2026-11-05 of COBIx's round-1 findings against the current `main`
(d9d28109), the Work Plan project (`hvuwhnbuahrtptokpqfh`), the budget-support project
(`mdxutmbpoqjtdcwjscux`) and the deployed `index.html`. Nothing was changed. Each verdict names
what the fix would break and who should carry it. **Owner** says who should make the change:
*CC* where the fix is a code change that rides the repo's tests, the Rule 4 mirror and the
auto-merge gates; *COBIx* where it is a console setting or a secret rotation that needs the
Cloudflare or Supabase dashboard; *Sam* where only he holds the credential.

## Critical

### 1. Open Anthropic proxy: CONFIRMED

`cloudflare-worker-proxy.js` forwards any POST on a path other than `/scrape` and `/trigger`
to `api.anthropic.com/v1/messages` with the account key. The only gate is `isAllowedOrigin()`,
and `Origin` is a header any non-browser client sets at will. The body cap (256 KB) is the one
real limit.

What auth would break: every COBI writer that calls the proxy from the browser: the report
generator, the college report, the annual report's AI polish, the comms writer, `cpl_writer.js`,
and the KB portal (`kb-portal/config.js`). `comms.js` already sends `x-team-pass` to Supabase,
so the credential exists client-side; the worker simply never asks for it.

Smallest safe fix (CC): the worker accepts the messages path only with a credential it can
verify by one RPC against Supabase with the anon key, the same way `workplan-rebuild` does:
`x-team-pass` through `team_pass_ok()`, or a reviewer bearer through `is_allowed_reviewer()`.
The writers already know the phrase or the session (`CPL_TEAM_PHRASE.decorateHeaders`,
`CPL_SESSION`), so the client change is one header per caller. The public pages lose nothing,
because none of the public pages call the proxy: Sierra goes through the `cpl-chat` edge
function. Add a Cloudflare rate-limit rule on the worker route (COBIx, dashboard).

### 2. Refresh secret published in the dashboard: CONFIRMED, and known since 2026-06-01

`excel_to_dashboard.py` lines 13552 to 13559 write the literal into the button, in the query
string and the body; `index.html` line 4681 serves it. SEC-3 in
`docs/kb-notes/reference-codebase-audit-2026-06-01.md` recorded it, with the rationale that the
pipeline is idempotent, so a stray trigger costs one run. That rationale still holds for
damage, and it does not cover cost: each trigger spends GitHub Actions minutes and a scrape.

Smallest safe fix, in order:
1. CC: the button sends the reviewer bearer or the team phrase (whichever the page holds),
   and the worker's `/trigger` verifies it by the same two RPCs as item 1. The secret leaves
   the generator entirely. Readers without a credential see the button disabled with the
   reason, which matches the auth model the rest of COBI uses.
2. Sam: rotate `SCRAPE_SECRET` in the worker **after** the new button is deployed, since
   `/scrape` (the daily workflow's own call) still uses it. Rotating first breaks the daily
   run at 06:17 UTC.
3. Sam: rotate `GITHUB_TOKEN` to a fine-grained token scoped to this one repository with
   Actions read-write only. The worker uses it for one call, the `workflow_dispatch`.
4. COBIx: turn on query-string redaction in the Worker's logs.

Moving the secret out of the query string without the rest is cosmetic: the body is as
public as the URL when the page ships it.

### 3. Work Plan tables writable by anyone: CONFIRMED, with a smaller blast radius than stated

Live `pg_policies`: `kpi_snapshots_college` and `kpi_snapshots_statewide` each carry one
policy, `Service role full access`, granted to `public`, `ALL`, `true/true`; `update_log` has
`Allow auth write`, same shape. `anon` holds INSERT, UPDATE and DELETE on all three.

Measured: the two KPI tables were last written on 2026-04-17 (230 and 4 rows) and nothing in
the repo writes or reads them any more; `update_log` has 0 rows and the generator reads the
update log from the workbook, not from this table. So these are three orphaned tables with an
open door, and nothing public depends on the door.

Smallest safe fix (CC, one migration through `supabase-migrate.yml`): drop the three
permissive policies and add `for all to service_role using (true) with check (true)`, which
is what the policy name always meant; keep a `select` policy for `anon` on the KPI tables
only if a view still reads them (none does today). Add the three to
`kb/governance_surface_map.json` as retired surfaces so the next audit does not re-find them.

### 4. Team-phrase brute-force functions: CONFIRMED as described, but the proposed fix breaks sign-in

`team_pass_check(p)`, `gr_pass_check(p)` and `fin_pass_check(p)` are SECURITY DEFINER,
anon-executable, and compare `p` to the plaintext `team_access.secret` (4 rows, 12 and 13
characters). An unauthenticated client can call them through `/rest/v1/rpc` as fast as
PostgREST answers.

Two corrections to the proposal:
- Revoking anon on `*_pass_check` closes nothing by itself. `team_pass_ok()` is the function
  the browser calls (`team_phrase.js`, `raci.js`) and the function RLS and three edge
  functions call; it reads `x-team-pass` and calls `team_pass_check` internally, so the oracle
  stays reachable through `team_pass_ok()` with a header per guess. Revoke anon on the
  `*_check` functions anyway (nothing in the client calls them; `team_phrases.js` only names
  one in a comment), but the brute-force surface is `*_pass_ok()`.
- Hashing the secret alone does not slow a guesser, because the function still answers
  true or false per call. A hash protects the row at rest, which matters because a reviewer
  can already read `team_access` (the org-phrase lane records this).

What closes it: throttle the oracle. Options from smallest to largest:
1. (CC, migration) A failed-attempt table keyed by the request's IP header and a short
   lockout inside `team_pass_check`, so one source gets a handful of guesses a minute. Cheap,
   and it keeps every caller working.
2. (CC) Replace the phrase with a short-lived token minted once per sign-in, which is the
   org-phrase lane's recommended direction (magic link plus a role column), so this item is
   an argument for finishing that lane rather than a separate fix.
3. Hash at rest with `crypt()` (`pgcrypto`), as COBIx proposes, as hygiene after 1.

Also revoke anon on `is_map_team()`, `cobi_nav_audit()`, `cobi_rls_gates()` and
`sierra_rules_audit()` while in the same migration: all four are reviewer-gated inside, and
none is called before sign-in.

### 5. Every edge function has `verify_jwt: false`: CONFIRMED, and mostly intentional

All nine Work Plan functions and both budget functions report `verify_jwt: false`. Read
against the source in `chatbox/supabase/functions/`:

| Function | Its own gate | Verdict |
|---|---|---|
| cer-classify, program-requirements-extract, cpl-news-harvest | service credential only (`isServiceCred`), 401 otherwise | intentional, safe |
| workplan-rebuild, alt-text-draft, slide-script-draft, library-revise-draft | reviewer bearer via `is_allowed_reviewer()` or team phrase via `team_pass_ok()`, 401 otherwise | intentional, safe |
| cpl-chat | public by design (Sierra); per-IP 20/min in memory; viewer derived server-side (v66) | intentional; the quota is per isolate, so it resets on cold start |
| cpl-chat-preview | not on `main`; deployed from a branch path | needs a read of its deployed source before a verdict |
| generate-letter, letter-curator (budget) | not read this run | open |

Two reasons `verify_jwt: true` is weaker than it sounds here: it only checks for a valid
Supabase JWT, and the anon key is one, so a public caller still passes; and it rejects the
new `sb_publishable_` keys outright, which two COBI modules already use. The gate that counts
is the in-function check, and seven of nine have it. Recommendation: leave the flag, read the
two unread sources, and move the chat rate limit to a durable store (a `chat_rate` table or
Upstash) so the quota survives cold starts. Owner: CC.

## High

### 6. Anon can execute 24 SECURITY DEFINER functions: CONFIRMED, 24 live; most are gated inside

Read the bodies of the ones COBIx named. `cpl_library_set_public`,
`sierra_feedback_set_status`, `cpl_funding_optin_review`, `map_landing_contacts_roster` and
`cobi_rls_gates` each check `is_allowed_reviewer() or team_pass_ok()` first and return
nothing or raise otherwise. That is the pattern this repo chose on purpose: the public anon
key plus a header is how the phrase reaches the database, so these must stay executable by
anon for phrase holders to use them. `map_coordinator_summary()` returns booleans per
college, no names, and is public by design for the student-contact lane.

Residual: `rls_auto_enable()` is an event-trigger function and should never be callable
through RPC; `cobi_nav_audit()`, `sierra_rules_audit()` and `is_map_team()` have no caller
before sign-in. Revoke anon and authenticated on those four (CC, in item 4's migration).
Everything else stays, by design, and the governance map should say so.

### 7. Materialized views bypass RLS: INTENTIONAL, and the suppression already lives in the view

The three matviews are anon-readable (RLS does not apply to matviews). Measured live:
`map_credential_student_rollup` has 543 rows, 420 flagged `students_suppressed`, and **0
rows with a visible student count between 1 and 9**; `map_credential_volume` 1,987 rows, 320
suppressed, 0 visible under 10. Both carry `suppressed_as_complement`, so the complement case
from the 2026-09-30 note is handled too. `map_exhibit_credential` is exhibit id to title only.
The k=10 ADR is applied inside the view, which is exactly how the lane chose to publish
college-grain counts to the public briefing (`college_briefing.js` reads the rollup with the
anon key).

COBIx re-checked this after its first pass and kept it at low priority on the same
measurement. Nothing to fix. The one improvement is a guard test that fails if a rebuild ever leaves a
visible count under 10 (CC, `tests/`), so the invariant is checked rather than remembered.

### 8. Public personal data: PARTLY INTENTIONAL, two real items

- `map_college_contacts_pub`: intentional. It is the `_pub` mirror built so My College and
  the college briefing could open to the public (`my-college-public-two-objects`,
  2026-09-17), and Sam's 2026-10-26 ruling asks for named contacts with emails on the public
  visuals.
- `personnel`: 26 rows of budget positions by title and FTE, no names. Not personal data;
  the figures are public budget detail. Leave it.
- `team_members`: 43 rows with name, email, role, org, readable by anyone. The RACI tab is
  the consumer and it is a team view. **Real.** Fix (CC): SELECT to
  `is_allowed_reviewer() or team_pass_ok()`; the tab already sends both.
- `cpl_funding_participation` and `cpl_funding_nc_attestation`: `cfp_select` and
  `cna_select` are `true`, so the attestor name and email are public. The attestation table
  already has a `_pub` view (`cpl_funding_nc_attestation_pub`) and a reviewer RPC
  (`cpl_funding_nc_attestation_review`). **Real.** Fix (CC): point the public tabs at the
  `_pub` views, add `cpl_funding_participation_pub` without the attestor columns, then gate
  the base SELECTs on reviewer or phrase. Sam's 2026-10-27 rulings on the public funding page
  (domain check at submit, reviewer accepts) are unchanged by this.

### 9. Anon can update `tmc_submissions`: CONFIRMED; 0 rows today

`tmc_submissions_anon_update` is `using (true)`, and `tmc_builder.js` saves with an anon
upsert keyed on `(college, tmc_id)`. The table holds `contact_name` and `contact_email`
despite the module's "no PII" comment. The table is empty, so the fix has no migration cost.

Smallest safe fix (CC): add an `owner_token uuid default gen_random_uuid()` column, return it
to the client on first save (kept in `sessionStorage` for the visit, per the no-memory rule
for filters this does not conflict with), and make the UPDATE policy
`using (owner_token = (current_setting('request.headers', true)::json ->> 'x-tmc-token')::uuid)`.
Reviewer updates keep going through `tmc_review_submission()`.

### 10. Budget-support storage: CONFIRMED

`logos_anon_update` is `using (bucket_id = 'logos')` with a check only on the campaign
folder, while `logos_anon_insert` also requires the filename to be an invitee id. So anyone
can overwrite any logo inside a known campaign slug. Fix (CC, migration on the budget
project): give UPDATE the INSERT's full `with_check` and the same expression as `using`.
Rate limits on `get_invitee_by_token`, `record_logo_upload` and `submit_response`, and the
two function sources, are the open half; same owner.

### 11. KPI history wipe: CONFIRMED

`log_daily_snapshot()` (`excel_to_dashboard.py` 3986 to 3994) turns a `JSONDecodeError` into
`history = []`, appends today, and writes the file in place. A corrupt or half-written
`kpi_history.json` on the runner becomes a one-entry history that the commit then publishes,
and Rule 3's date-gap guard would not catch it because there would be no gaps, only no past.

Fix (CC): raise on a parse error so the job fails loudly; write to `HISTORY_FILE + ".tmp"`
and `os.replace`; and add a sanity floor (refuse to write when the new history is shorter
than the committed one by more than a day). A jsdom test does not reach this; a small Python
test under `tests/` does.

## Medium

- Leaked-password protection off, both projects: confirmed by the advisor. COBIx can enable
  it in Auth settings. It only matters for password sign-ins, and COBI uses magic links, so it
  is hygiene.
- 18 and 2 functions with mutable `search_path`: confirmed by the advisor. CC, one migration
  of `alter function ... set search_path = ''`, after checking the three `search_*` functions
  and `match_document_sections` that reference `public` objects unqualified.
- `pg_trgm` in `public` (Work Plan) and `citext` in `public` (budget): confirmed. Moving them
  touches every index and column that uses them; the gain is small. Park.
- 55 overlapping permissive policies: not re-counted. Several are the deliberate
  reviewer-or-phrase pairs. Review with item 8, not alone.
- Open inserts on `chat_interactions`, `cpl_news_requests`, `tmc_requests`: confirmed. Size
  caps belong as `check` constraints on the text columns (CC); rate limits belong where
  item 4 puts them.
- Empty `catch` blocks: measured 214 across production JS, 35 in `cpl_funding.js` and 16 in
  `raci.js`. Most swallow a missing-storage or optional-fetch case on purpose. The two COBIx
  names (Unified Courses, the funding tab) are worth a pass that logs to the console and
  shows the tab's error band; the rest can wait.
- `CLAUDE.md` at 59,999 bytes against a 60,000 cap, while the checkpoint command says 58 KB:
  confirmed, both facts. The next checkpoint moves the newest PUSH prose to
  `docs/reference/` and corrects the number.
- Cloudflare Access not enabled: not verifiable from this session. Items 1 and 2 are the
  reason to want it; the credential check above gets the same result without a second
  identity provider in front of the worker.

### 12. Apply workflows run outside the `database` environment: CONFIRMED, and wider than stated

COBIx's follow-up: only `supabase-migrate.yml` carries `environment: database`. Measured on
`main`: 29 workflows read `SUPABASE_SERVICE_KEY` and none of them names an environment, so a
required reviewer on `database` would gate the migration runner alone. Two facts shape the
fix:

- The secret is a repository secret today, so `environment:` is advisory. Protection comes
  from moving the service key into the environment, which then makes it unreadable to any
  workflow that does not name the environment. That is the actual enforcement, and it is a
  console change.
- A required reviewer on every service-key workflow would hold the scheduled ones, starting
  with `daily-dashboard.yml` (Rule 1, three crons, 13 service-key reads), `cpl-news.yml`,
  `map-users-sync.yml` and the other syncs, until someone clicks approve each morning. That
  breaks the automation Sam has asked to stay out of the way of.

Smallest safe fix: two environments. `database` keeps the required reviewer and holds the
service key for the one-shot, dispatch-only `*-apply.yml` workflows (`cer-decision-apply`,
`course-title-cleanup-apply`, `cred-rename-apply`, `esl-sheet-apply`, `funding-config-edit-apply`,
`overmerge-apply`, `phase-1e-apply`, `projects-seed-apply`, `workplan-goals-seed-apply`,
`csr-confirm`, `supabase-rekey`). A second environment, `database-scheduled`, holds the same
key with no reviewer and a branch rule of `main` only, for the crons and syncs. The repo
secret goes away once both are populated. Adding the `environment:` lines is CC (one PR,
`actionlint` in CI checks the syntax); creating the environments, moving the secret and
setting the reviewer is a console change (COBIx or Sam). Order: create and populate the
environments first, merge the PR second, delete the repo secret last, or the next cron run
fails for want of a key.

## Proposed order, revised

1. Item 2 steps 1 and 2 and item 1 together, since both land in the worker and both callers
   learn to send a credential in the same PR (CC). Then the two rotations (Sam).
2. One migration: item 3's three policies, item 4's revokes and lockout, item 6's four
   revokes, item 8's `team_members` SELECT (CC).
3. Item 8's funding `_pub` views and the base SELECT gates (CC), item 9's owner token (CC).
4. Item 10's storage policy (CC), item 11's atomic write (CC).
5. Item 5's two unread sources and the durable chat quota (CC).
6. Item 12's two environments (console first, then the workflow PR).

Each step is its own PR or migration file for Sam to approve before it is applied.
