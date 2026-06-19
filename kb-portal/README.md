# CPL Knowledge Base — Team Portal

A branded, sign-in-gated **reader** over the public CPL Knowledge Base. Team
members sign in with a Supabase **magic link** (no passwords); after sign-in the
portal renders the curated KB content (`overview/`, `methodology/`,
`policy-and-funding/`, `research/`, `playbooks/`, `glossary.md`, …) with a
filterable nav.

## ⚠️ What the login does and does not do

This is a **front door, not a lock.** The knowledge base is a **public** GitHub
repo — every file the portal shows is already readable at
`github.com/CPL-Initiative/cpl-knowledge-base` and via the raw URLs (the repo's
`CLAUDE.md` even instructs AI assistants to fetch them). The sign-in gives the
team a clean, branded reading experience; it does **not** make the content
private. Do not put anything non-public behind this portal without re-architecting
it as a real access-controlled app (RLS-backed data, no public raw fetch).

## Auth model

- **Magic link (email OTP)** via Supabase Auth.
- **Allowlist = `slee@cccco.edu` (Sam) + `malone.dunlavy@rccd.edu` (Malone)**,
  enforced **server-side**: open signups are disabled and only these two users
  are provisioned, and the client calls `signInWithOtp({ shouldCreateUser: false })`.
  An un-provisioned address (including **`map@rccd.edu`**, deliberately excluded
  because that inbox can reach private CPLBrain content) cannot complete a sign-in.
- **Sender:** Supabase's own mailer, so `map@rccd.edu` is never in the loop.
- The sign-in form shows the **same neutral message** for any address, so it never
  reveals who is on the allowlist.

## Provisioning (one-time)

**Decision: reusing the existing `cpl-budget-support` Supabase project**
(`mdxutmbpoqjtdcwjscux`) rather than a dedicated one — $0 extra. That project
doesn't use Supabase Auth today, so adding these auth users / settings doesn't
affect it, and KB-portal users get no access to its data (its RLS grants nothing
to the `authenticated` role).

✅ **Done in code:** `config.js` is wired to that project's URL + publishable key.

⬜ **Remaining — do these in Supabase Studio** (can't be set via the MCP tools):

1. **Disable open signups:** Auth → Providers → Email → turn **off** "Allow new
   users to sign up" (or set `GOTRUE_DISABLE_SIGNUP=true`). Magic link / email OTP
   stays enabled. *(Safe here — the project has no auth users today.)*
2. **Provision the two users:** Auth → Users → *Add user* for `slee@cccco.edu` and
   `malone.dunlavy@rccd.edu` (no password needed; they sign in via magic link).
3. **Set URLs:** Auth → URL Configuration → set **Site URL** to where the portal
   is hosted, and add that URL to **Redirect URLs** (e.g.
   `https://cpl-initiative.github.io/cpl-knowledge-base/kb-portal/` and, for local
   testing, `http://localhost:8000/kb-portal/`). The app uses
   `location.origin + location.pathname` as the redirect, so it adapts to whatever
   host you allow here.
4. **(Optional) Custom SMTP:** the built-in mailer is rate-limited (fine for two
   occasional users). For reliability, add a transactional sender later — **not**
   `map@rccd.edu` (a dedicated `noreply@…` or Resend/Postmark/Graph).

To add or remove an authorized person later: add/delete the user in Auth → Users
and update `ALLOWLIST` in `config.js` (display only).

## Hosting

The bundle is static (`index.html` + `app.js` + `styles.css` + `config.js`).

- **GitHub Pages** of this repo → served at `…/kb-portal/`.
- **Transplant into `cpl-project-tracker`** (same path the `budget-support/`
  bundle documents) to live alongside the dashboard. Copy `kb-portal/*` into the
  tracker and update the Supabase **Redirect URLs** to match.
- Any static host (Vercel / Netlify) also works.

## Local test

```bash
cd cpl-knowledge-base
python3 -m http.server 8000
# open http://localhost:8000/kb-portal/  (add this URL to Supabase Redirect URLs)
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Login view + reader shell |
| `app.js` | Supabase magic-link auth, live nav from the repo tree, sanitized markdown render |
| `config.js` | Supabase URL + publishable key, repo source, allowlist (display), nav sections |
| `styles.css` | MAP-branded styling (login + reader) |

Rendering uses `marked` for Markdown and `DOMPurify` to sanitize output (defense
in depth, even though the source is our own public repo), both from `esm.sh`.
