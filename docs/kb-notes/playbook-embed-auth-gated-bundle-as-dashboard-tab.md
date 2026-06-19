---
title: Embed a self-contained auth-gated bundle as a dashboard tab (iframe)
created: 2026-06-19
updated: 2026-06-19
tags: [playbook, iframe, dashboard-tabs, supabase-auth, kb-portal]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb_portal_lessons]]"
artifacts:
  - kb-portal/index.html
  - CPL_Dashboard.html
  - index.html
  - tabs.js
  - tests/kb_portal_tab.test.js
---

# Embed a self-contained auth-gated bundle as a dashboard tab (iframe)

> A standalone, sign-in-gated web bundle (its own auth + styling) becomes a
> dashboard tab with almost no glue: drop a nav button + a pane that iframes the
> bundle. Two one-liners are load-bearing — `target="_top"` on any link out, and
> a **directory** iframe `src` so the bundle's auth redirect matches.

## Context

The KB portal (`kb-portal/`) is a self-contained Supabase-magic-link reader. We
wanted it inside the dashboard as a login-gated **Knowledge Base** tab without
re-implementing its auth in the dashboard (which already has a *different*
Supabase project + allowlist for curator tabs). Session 63 — see
`[[docs/kb_portal_lessons]]`, PRs #464/#465/#467.

## The claim

To embed a self-contained bundle as a tab:

1. **Nav button + pane, in BOTH HTMLs** (Rule 4). `tabs.js` auto-derives
   `VALID_TABS` from the rendered nav, so no router/whitelist edit — just
   `<button class="cpl-tab" data-tab="X">` + `<div class="cpl-tab-pane"
   data-tab="X"><iframe …></div>`. Mirror the existing iframe-tab (Letters).
2. **The bundle's own auth IS the tab's gate.** No auth duplication. The iframe
   shows the bundle's sign-in; only its allowlist can enter. (Isolation is a
   *feature* — a separate auth domain/project stays separate.)
3. **`src` must be the DIRECTORY** (`src="bundle/"`, not `src="bundle/index.html"`)
   when the bundle does magic-link auth with `redirect = location.origin +
   location.pathname`. The directory form resolves to `…/bundle/`, which must
   equal the URL registered in the auth provider's Redirect URLs. The explicit
   `index.html` form produces a non-matching redirect and **sign-in silently
   never completes**.
4. **Any link OUT of the iframe needs `target="_top"`** — otherwise it navigates
   the *iframe*, not the tab (e.g. a "back to dashboard" link would nest the
   dashboard inside itself). `_top` works standalone too.
5. **No `sandbox` attribute** — the bundle is same-origin, trusted, and needs JS
   + localStorage + popups for its auth. Sandboxing breaks it; the precedent
   iframe tab sets none.

Pin the two subtle invariants (directory `src`, `target="_top"`) with a test, and
keep the two HTMLs byte-identical (enforced by an existing identity assertion).

## How we got here

Shipped in #465 (tab) + #467 (back button). The directory-`src` requirement
surfaced from the auth-redirect math; the `target="_top"` requirement from the
iframe-nesting trap. `tests/kb_portal_tab.test.js` /
`tests/kb_portal_composer.test.js` assert both, plus Rule-4 byte-identity.

## When this applies (and when it doesn't)

- Applies to **any** self-contained, same-origin bundle with its own auth/UI
  that you want surfaced as a tab (readers, curators, mini-apps).
- Does NOT apply if you need the dashboard's own auth state shared with the
  bundle (then port the bundle's logic in natively instead — but you lose the
  isolation, and two Supabase clients in one document can collide on session
  storage). Iframe isolation is the win precisely when the auth domains differ.
- The directory-`src` rule is specific to bundles whose redirect derives from
  `location.pathname`; bundles that hardcode their redirect don't care.

## See also

- `[[docs/kb_portal_lessons]]` — the workstream
- `[[docs/kb-notes/methodology-browser-doc-capture-to-claude-and-github]]` — the
  composer that grew on top of this tab
- PRs `#464` (transplant) · `#465` (tab) · `#467` (back button)

---

*Authoring check: durable, reusable (any embedded-bundle tab), distilled (one
pattern), self-contained.*
