# Rotating the worker's two secrets

Companion to COBIx round 1 items 1 and 2 ([the reply](cobix_round1_reply_2026-11-05.md)).
Both secrets live only on the Cloudflare Worker `cpl-proxy`
(`https://cpl-proxy.slee-548.workers.dev`). Sam holds both consoles. Each step says what
breaks if it runs out of order.

## Order

1. **Merge the step-1 PR and let it deploy.** It makes the worker accept a reader's credential
   on `/trigger` and on the drafting path, and it removes the published secret from the
   refresh button. Until the new worker is pasted, the new button answers
   "Invalid or missing secret" to everyone; the daily scrape is unaffected.
2. **Paste the new worker.** Cloudflare dashboard, Workers & Pages, `cpl-proxy`, Edit code,
   replace the whole file with the repository's `cloudflare-worker-proxy.js` at `main`, Deploy.
   Then press Manually Refresh COBI once while signed in or holding the phrase: the button
   should read "Pipeline running" and a `daily-dashboard.yml` run should appear in Actions
   within a minute.
3. **Rotate `SCRAPE_SECRET`** (the one the old page published).
   - Make a new value: 32 or more random characters (`openssl rand -base64 32` or a password
     manager).
   - GitHub first: repository Settings, Secrets and variables, Actions, update
     `CPL_SCRAPE_SECRET` to the new value. This is the value `daily-dashboard.yml` sends to
     `/scrape`.
   - Worker second: Cloudflare, `cpl-proxy`, Settings, Variables and Secrets, edit
     `SCRAPE_SECRET` to the same value, Deploy.
   - The window between the two is the only risk: a cron run inside it fails at the scrape
     step and the next ladder rung (06:17, 09:17, 12:17 UTC) retries. Do both edits in one
     sitting, away from those times.
   - Check: dispatch `daily-dashboard.yml` by hand and watch the "Scrape live metrics" step
     pass.
4. **Rotate `GITHUB_TOKEN`** (the worker's token for `workflow_dispatch`).
   - GitHub, your profile Settings, Developer settings, Personal access tokens,
     Fine-grained tokens, Generate new token. Resource owner `CPL-Initiative`; Repository
     access: Only select repositories, `cpl-project-tracker`; Permissions: Actions
     Read and write, Metadata Read (added automatically). Expiration: one year, and put the
     date in the Open Asks sheet so the renewal is a card, not a surprise.
   - Cloudflare, `cpl-proxy`, Settings, Variables and Secrets, edit `GITHUB_TOKEN` to the new
     value, Deploy.
   - Check: press Manually Refresh COBI once more; a run appears in Actions.
   - Then revoke the old classic token (Developer settings, Tokens (classic)) so the
     repo-scope one stops existing.
5. **Tell COBIx on the PR thread** that both rotations are done, so its next pass re-checks
   the deployed page for the old value.

## What does not need rotating

- The Work Plan anon key and the `sb_publishable_` keys: public by design, gated by RLS.
- `ANTHROPIC_API_KEY`: never left the worker; the proxy was open, so a rotation is cheap
  insurance if the Console's usage graph shows spend the writers do not explain. Cloudflare,
  `cpl-proxy`, Variables and Secrets, after making a new key in the Anthropic Console.

## After rotating

The old `SCRAPE_SECRET` value remains in git history on `main` (`index.html`, the generator).
That is acceptable once it no longer opens anything; Rule 5 forbids rewriting `main` for it.
