---
title: Methodology — XSS audit when a previously-trusted field becomes curator-editable
created: 2026-05-28
updated: 2026-05-28
tags: [methodology, security, xss, curator-editable, rendering]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[excel_to_supabase_lessons]]"
artifacts:
  - excel_to_dashboard.py
  - workplan_goals.js
---

# Methodology — XSS audit when a previously-trusted field becomes curator-editable

> **One-sentence summary** — When you introduce a write path that lets curators
> edit a field that's been historically Excel-sourced (i.e. trusted), audit
> EVERY renderer that consumes the field — not just the obvious attribute
> injection sites — because the same data now flows through code paths that
> were safe under the prior assumption.

## Context

Phase 1 of the Excel→Supabase migration moved the Workplan Goals tab to
Supabase-as-source-of-truth. Phase 1 PR-5 added an inline editor for ladder
cells (numeric only — safe). Phase 1 PR-A added a `kind` discriminator + 5
Activity rows. Phase 1 PR-C added an **add-flow modal** that lets curators
create new Activity / Project rows with arbitrary **name** strings. That's
the moment the rendering safety assumption flipped: names used to come from
Excel (which the dashboard's authoring team controls) and now come from
Supabase (curator-editable via auth + RLS).

A bug-hunt over the merged work surfaced **six rendering sites** in two
Python renderers where the name lands in HTML without escaping. The first
agent only flagged one (a `title=""` attribute — the highest-impact one);
the other five were equivalent-class but tag-injection rather than
attribute-injection.

## The claim

**When a write path introduces curator-editable strings into a field that
the existing renderer assumed was author-controlled, the audit is renderer-
wide, not site-specific.** The audit has four steps:

1. **Identify the renamed risk surface.** What field used to come from
   a trusted source and now comes from an untrusted-or-less-trusted
   source? Name it.

2. **Grep every renderer for that field.** Not just the one the bug-hunt
   flagged. Use `grep -n "field_name" *.py *.js` against the whole code
   surface, not just the function the agent focused on.

3. **Classify each site by injection class.** Each match falls into one
   of: (a) attribute value in HTML, (b) tag body / text content, (c) URL
   parameter, (d) JS string in a `<script>` block, (e) attribute name
   itself (rare; usually impossible). Each class has its escape function
   — `html.escape(..., quote=True)` covers (a)+(b) in Python.

4. **Apply the escape at the boundary**, not at the data layer. Data
   layer escaping is brittle (one un-escaped use leaks); boundary
   escaping is robust (renderer is the single chokepoint).

## How we got here

Session 14 / 2026-05-28. PR-A/B/C of the Activity↔Project model landed,
making Activity + Project `name` curator-editable. The post-merge
bug-hunt (general-purpose agent, 3.5min) flagged the `title=""`
attribute. Re-reading the same renderer manually surfaced five more
sites. PR #174 applied `from html import escape as html_escape` at all
six sites (renderer boundary), plus a smoke test injecting
`<script>alert(1)</script>` and `"><img src=x onerror=…>` payloads
into Activity + Project names — both rendered harmless after the
escape pass.

The naming-collision gotcha is worth knowing: the function under audit
builds its rendered output in a local variable named `html`, which
shadows `import html`. `html.escape(...)` raises `'str' object has no
attribute 'escape'` at runtime. The fix is `from html import escape as
html_escape`.

## When this applies (and when it doesn't)

**Applies:**
- Any time a curator-write feature is added that wasn't there before
  (new editor, new modal, new admin action)
- Any time a data source changes from authored content (Excel, code,
  config files) to user-managed content (Supabase, form input, API)
- Cross-source merges where one half is trusted and one isn't —
  the entire output is now untrusted

**Doesn't apply:**
- Numeric / boolean / enum fields where the schema constrains the
  value to safe characters (the editor for GOAL/STRETCH values in
  PR-5 doesn't need escape; numbers can't contain `<`)
- Fields rendered into non-HTML formats (JSON APIs, plain text,
  CSV exports) — different escaping rules apply, but the audit
  methodology is the same
- Read-only renderings of curator-edited fields that were ALREADY
  curator-editable elsewhere and have an existing escape contract
  (e.g. a second view of the unified_titles tab — that path was
  already designed with escape; new views don't re-introduce the
  risk if they use the same escape contract)

The realistic threat at the Workplan Goals tab is **low** because the
RLS gates writers to `is_allowed_reviewer()` (today: one user). So
the practical XSS risk is self-attack — Sam injecting a payload he'd
see on his own dashboard. But the hygiene is cheap (one import +
six `html_escape(...)` calls) and "low threat today" is one
allowed-reviewer addition away from "low threat" no longer.

## See also

- `[[docs/excel_to_supabase_lessons]]` — Session 14 lesson #23
  (audit-the-whole-renderer pattern) and #24 (the `html` shadow
  gotcha)
- PR `#174` — the implementation
- PR `#172` — PR-C add-flow modal (the change that introduced the
  risk)
- [OWASP XSS prevention cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
  (external)

---

*Authoring check: durable (XSS taxonomy is stable), reusable (Phase
2-5 will each introduce a new editor for a previously-trusted field;
each needs this audit), distilled (one concept — "audit the renderer,
not the site"), self-contained (frontmatter + opener tell a stranger
the claim).*
