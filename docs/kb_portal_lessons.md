---
title: KB Portal — transplant, login-gated tab, and the in-portal authoring composer
date: 2026-06-19
tags: [kb-portal, knowledge-base, supabase-auth, iframe, claude-proxy, lessons]
artifacts:
  - kb-portal/index.html
  - kb-portal/app.js
  - kb-portal/composer_util.js
  - kb-portal/config.js
  - kb-portal/styles.css
  - CPL_Dashboard.html
  - index.html
  - tests/kb_portal_tab.test.js
  - tests/kb_portal_composer.test.js
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-embed-auth-gated-bundle-as-dashboard-tab]]"
  - "[[docs/kb-notes/methodology-browser-doc-capture-to-claude-and-github]]"
---

# KB Portal — transplant, login-gated tab, and the authoring composer

> The `kb-portal/` bundle (a Supabase-magic-link-gated reader over the public
> `cpl-knowledge-base`) was transplanted into the tracker, wired in as its own
> login-gated dashboard **Knowledge Base** tab (iframe), and grown into a
> **document-authoring** surface — draft (or upload files) → Claude polish →
> commit to the public KB via a tokenless GitHub deep-link.

## Session 63 — SkyGate (2026-06-19)

Sam-interactive, fast iterative loop. Five PRs, all squash-merged on green:

| PR | What |
|---|---|
| **#464** | Copied the self-contained `kb-portal/` bundle (5 files) from `cpl-knowledge-base` into the tracker, verbatim. The bundle's own README documented this transplant. No code edits — its auth redirect uses `location.origin + location.pathname`, so it adapts to the new host; `config.js` keeps content sourcing from the public KB repo + auth on the existing `cpl-budget-support` Supabase project. |
| **#465** | Wired it in as a top-level **Knowledge Base** tab (`#tab-knowledge-base`, hash `knowledge-base`) — an `<iframe src="kb-portal/">` in BOTH HTMLs (Rule 4), mirroring the existing Letters-tab pattern. `tabs.js` auto-derives the tab from the nav button, so no router change. `tests/kb_portal_tab.test.js`. |
| **#466** | The **✍️ New doc composer** — a sign-in-gated modal: title + section + Markdown body → optional **✨ Polish with Claude** → **Open in GitHub →** deep-link. Pure helpers in `composer_util.js`; `tests/kb_portal_composer.test.js`. |
| **#467** | A persistent **← Dashboard** back button in the portal header. |
| **#468** | **Attachment upload** — text/MD/CSV/JSON, PDF, Word, Excel, images → Claude reads them into a KB doc. In-browser extraction; multimodal polish. |

### What's true now (current state)

- **The Knowledge Base tab is live** at `…/cpl-project-tracker/#knowledge-base`
  and standalone at `…/cpl-project-tracker/kb-portal/`. Both serve the SAME
  files (the tab iframes the directory).
- **Login gate is the bundle's own** Supabase magic-link auth (allowlist:
  `slee@cccco.edu`, `malone.dunlavy@rccd.edu`), enforced server-side
  (open-signups disabled + only those two provisioned). Sam added the tracker
  host URL `…/cpl-project-tracker/kb-portal/` to the Supabase **Redirect URLs**,
  so sign-in completes from here. **`map@rccd.edu` is deliberately NOT on the
  allowlist** (that inbox can reach private CPLBrain content).
- **The composer writes to the PUBLIC `cpl-knowledge-base` repo** via a GitHub
  *create-new-file* deep-link — the author commits as themselves (commit-direct
  or PR). **No GitHub write token lives in the app** (the Tier-1 posture).
- **Attachments are extracted in-browser** (pdf.js / mammoth / SheetJS, lazy
  from esm.sh) and folded into the Polish prompt as text; images downscaled →
  Claude vision blocks. A size guard keeps the request under the proxy's
  ~256 KB cap.

### Lessons (what we learned)

1. **A self-contained auth-gated bundle drops into the dashboard as an iframe
   tab with almost zero glue** — because the dashboard's `tabs.js` auto-derives
   `VALID_TABS` from the rendered nav, and the bundle carries its own auth +
   styling. The only non-obvious bits are two one-liners (next).
2. **`target="_top"` on the back link** — the portal runs in an iframe; a plain
   link would navigate the *iframe* to the dashboard (nesting it inside itself).
   `_top` navigates the whole tab and also works standalone.
3. **iframe `src="kb-portal/"` (directory, NOT `index.html`)** — the bundle's
   magic-link redirect is `location.origin + location.pathname`. The directory
   form resolves to exactly `…/kb-portal/`, matching the Supabase Redirect URL
   Sam registered; `kb-portal/index.html` would NOT match and sign-in would
   never complete. A test pins this.
4. **The proxy body cap (262144 bytes) is the real attachment constraint.** A
   base64 PDF document-block would blow it. Extracting the *text layer*
   client-side and sending text sidesteps the cap entirely for the common case;
   images are downscaled client-side to fit. Scanned/image-only PDFs (no text
   layer) and big images degrade to a clear error chip — never a hard failure.
5. **Reuse the existing Cloudflare Worker proxy + model** — the composer's Polish
   step rides the same `cpl-proxy` + `claude-sonnet-4-5-20250929` the Custom
   Report generator uses (CORS already allows `cpl-initiative.github.io`). No new
   secret, no new infra, consistent model across the composer's text + attachment
   paths.
6. **Stale-shell caching bites twice.** After each deploy Sam saw the *old*
   `index.html`/`app.js` (the reader content is fetched live, so it looked
   current). Hard-refresh (Ctrl+Shift+R) on the portal — and on the whole
   dashboard for the iframed copy — is the fix; it's a cache issue, not a bug.

### Strategic roadmap (what's next / parked)

- **Verify the attachment extractor libs live** — pdf.js/mammoth/SheetJS +
  canvas downscaling are browser-only (CI covers only the pure logic). Smoke-test
  each type; if an esm.sh path needs a nudge it's a one-line fix. (Carried in the
  To-Do feed for Sam + the handoff.)
- **Bundle divergence** — only the LIVE tracker copy got the tab + composer +
  attachments. The `cpl-knowledge-base/kb-portal/` copy is now several features
  behind. **Decision pending (Sam):** backport to keep both identical, or treat
  the tracker copy as canonical. (The reader-only bundle in the KB repo still
  works; only the authoring features diverge.)
- **Possible follow-ons** (not requested): an in-portal sanitized *preview* of
  the rendered doc; a one-click commit path (Tier 2 — a Worker/Edge Function
  holding a GitHub App token) if in-portal writing becomes a daily habit; wiring
  the tab into the dashboard nav grouping.

### Next concrete step

Sam smoke-tests the 5 attachment types in the live composer; the next session
fixes any esm.sh lib path that misbehaves and resolves the bundle-divergence
decision (backport vs canonical). Everything else here is shipped + live.
