---
title: "Methodology — Reworking a generator-managed dashboard section without touching the generator"
created: 2026-06-22
updated: 2026-06-22
tags: [methodology, generator, idempotency, regen-safe, header, css-injection, rule-1, rule-4]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_lessons]]"
  - "[[docs/kb-notes/methodology-self-contained-injected-component-styling]]"
  - "[[docs/kb-notes/methodology-ship-generator-changes-live-on-merge]]"
artifacts:
  - cobi_brand.js
  - quickstart.js
  - excel_to_dashboard.py
  - tests/cobi_brand.test.js
---

# Reworking a generator-managed dashboard section without touching the generator

> **One-liner** — When you must restructure a region the daily generator rewrites
> (Rule 1) and mirror across two HTMLs (Rule 4), the cheapest *and* safest path is:
> change the **static template** + inject the new layout **CSS from a static JS
> file**, and **leave the generator's anchors intact by parking them inside the new
> structure** — then prove idempotency by running the generator twice.

## Context

Session 68 consolidated the COBI masthead into a single-row app bar (seal + wordmark
| centered search | ℹ About popover + Refresh). The `.header` is hostile to edit:
`excel_to_dashboard.py` regex-replaces `<h1>`, removes+re-injects the Project
Description / Attachments / Cheat Sheet block (the `PROJ-INFO` markers), updates
`.last-updated`, and injects the Refresh button — every run. A naive rewrite risks a
broken daily publish, and the CSS would need a Rule-4 mirror in both HTMLs.

## The technique (five moves)

1. **Park the generator's anchor inside the new structure, don't delete it.** The
   generator inserted `PROJ-INFO` *after the `class="subtitle"` div* (the old Mamba
   line). The redesign drops the Mamba subtitle — but deleting the element would make
   `html.find('class="subtitle"')` return −1 and the inject vanish. Instead keep a
   **hidden** `<div class="subtitle" id="cobi-mamba" style="display:none">` *inside the
   new About panel*. The generator's existing inject now lands exactly where you want
   it, with **zero generator restructure**.
2. **Keep the regex target byte-identical.** `<h1>COBI</h1>` stays plain text
   (`<h1>[^<]*</h1>` matches it); the gold `CPL` superscript is injected at **runtime**
   by the static JS (regen-proof), never persisted into the `<h1>`.
3. **Inject the new layout CSS from a static JS file, not the HTML `<style>`.** One
   file (`cobi_brand.js` `ensureCss()`) covers both HTMLs → **no Rule-4 `<style>`
   mirror**. Appended to `<head>` after the inline sheet, so same-specificity rules
   win the cascade and override the old `.header` flex with the new grid. Only the
   `:root` token (`--seal-blue`) needs the two-file mirror.
4. **Touch the generator only where the content itself changes.** Here that was just
   the Refresh button: new label + a class instead of inline styles, and — critically
   — **change the strip regex to match by `id`** (`<button id="refreshBtn".*?</button>`)
   so a label change can't orphan the old button into a duplicate on the next regen.
5. **Graceful-degrade a pending asset.** The seal `<img onerror="this.style.display='none'">`
   hides itself until the file is uploaded — so the rework merges *now* without a
   broken-image icon, decoupling the code from the asset hand-off.

## The proof: run the generator twice

Idempotency is the whole ballgame (Rule 1 / the blank-line-accretion class of bug).
**Run `python excel_to_dashboard.py` twice and `diff` the regenerated region** — the
only delta may be the timestamp. This catches: accreting whitespace, duplicated
injects, anchors that drift. (Bonus: the rework *removed* 159 blank lines the old
header had silently accreted.) Then a jsdom test guards the consumer wiring.

## Ship it code-only

The HTML mixes static template (your structural change) with generated data. Commit
**only the structural change** (reset the HTMLs to the cron's latest `main`, re-apply
*just* the structure + token, leave the `PROJ-INFO` markers empty + no Refresh seed)
and let the post-merge `workflow_dispatch` repopulate — don't commit the regenerated
data artifacts (the ~100 MB `unified_courses_*.js` etc.; see the artifact policy).
The test then asserts **code-only** state (markers *positioned* in the panel; the
Refresh label checked against the **generator source**, not the not-yet-injected HTML).

## When this applies / when it doesn't

- **Applies** to any generator-owned + Rule-4-mirrored region (header, footer, a
  regenerated card grid) where the structure changes but the generator's content
  contract can be preserved by anchor-parking.
- **Doesn't** when the content contract itself must change (new fields, different
  inject points) — then edit the generator deliberately and re-prove idempotency.

## See also

- `docs/cobi_lessons.md` (Session 68) — the masthead arc, prototypes v1–v5.
- `methodology-self-contained-injected-component-styling.md` — inject-from-JS pattern.
- `methodology-ship-generator-changes-live-on-merge.md` — the code-only + dispatch flow.
