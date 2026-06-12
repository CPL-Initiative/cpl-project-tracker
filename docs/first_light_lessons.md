---
title: First Light — daily plein air art, the theme spec, and the design sprint
created: 2026-06-12
updated: 2026-06-12
tags: [lessons, first-light, design-system, plein-air, accessibility, public-domain, ui]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-derived-aa-token-palette]]"
  - "[[docs/kb-notes/reference-public-domain-art-sourcing]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
artifacts:
  - first_light.js
  - prototype/first_light_theme_v1.html
  - prototype/check_contrast.py
  - tests/first_light.test.js
  - tests/first_light_prototype.test.js
---

# First Light — lessons (the design sprint)

Workstream scratchpad for the dashboard "personality" arc: Sam's brief
("make people want to open it in the morning to see what surprise awaits")
became a daily public-domain plein air greeting LIVE on the dashboard, plus a
locked visual spec for the coming full retheme. Distilled, durable outputs:
[[docs/kb-notes/methodology-derived-aa-token-palette]] and
[[docs/kb-notes/reference-public-domain-art-sourcing]].

## Session 48 (2026-06-12) — the whole arc, 9 PRs (#391–#399), all merged same-day

### What shipped

**Live on the production dashboard** (`first_light.js`, static asset on the
`kpi_reorder.js` pattern — runtime CSS + DOM injection, only a `<script>` tag
in the two HTMLs, regen-proof, no Rule-4 style mirror):

- **The greeting** (#394): once per day per browser, date-seeded so everyone
  shares the same painting; grayscale → full-color reveal (reduced-motion
  users get instant color); artist story + setting + PD credit line; opt-out
  honored forever; "Today's painting" chip appended to `.header` **at
  runtime** so the daily regen can't strand it.
- **Gallery-size + reflections** (#396): dialog to `min(1180px, 94vw)`,
  painting to `66vh` ("so the painting gets all the glory it deserves" —
  Sam). "A thought for the day (optional)": 2000-char box posting
  `{painting, reflection}` — nothing identifying — to NEW Supabase
  **`public.cpl_reflections`** (anon INSERT-only RLS with a length CHECK, no
  SELECT — the `chat_interactions` pattern; verified live AS the anon role:
  insert works, read returns zero rows). Once/day gate; payload **shape** is
  test-pinned so identifying fields can't creep in.
- **Read-aloud**: browser `speechSynthesis` only. Sam wished for Huell
  Howser; declined on CA post-mortem publicity-rights + ethics grounds (same
  care as the Ansel Adams *name*) — the warmth moved into the blurb prose;
  Chapman University holds the Huell archive if licensing is ever wanted.

**The spec** (`prototype/first_light_theme_v1.html`, **v1.4.2 — BLESSED by Sam
2026-06-12 16:41, "Looks great!"** + 
`prototype/check_contrast.py`): warm monochrome base, glass chrome over a
ghosted grayscale painting, **glass = chrome / opaque = data**, five semantic
accents (cobalt interactive · crimson negative · hunter positive · mustard
caution · violet = the machine's hand), solid uniform chips. **The mock IS the
spec**: every token is derived + measured by the script (29/29 AA), the page
embeds the ratios, tests pin the hexes.

### The chip evolution (4 visual rounds with Sam — the loop worked)

v1 tinted pills → v1.1 white-filled outlines (+ derived `--mustard-text`) →
v1.2 bright-label + dark 8-way halo (the halo-as-adjacent-color treatment,
derived `#5E4700`) → **v1.3/v1.4 solid fills with white labels** (the
"Primary-action look" Sam pointed at): button-matched 8px corners, no
borders, uniform 7.25rem × 26px, left-justified; **`chip-fit`** modifier keeps
glyph-only badges compact (v1.4.1 — the uniform rule over-applied to a lone
✓ stretched it into a slab; *uniform rules need scope*). v1.4.2 (#400)
narrowed 8.5 → 7.25rem by fixing the **vocabulary**, not the geometry —
"Suggested merge" → "Suggested"; the standing rule: chip labels stay one
short word + glyph. Final accents:
**crimson `#920000` · cobalt `#0047AB` · hunter `#2C601A` · violet `#6D28D9`**,
chip fills `--violet-chip #6324C5` / `--mustard-chip #946F00` (the "dijon"
trade — white on true mustard is ~2:1, physically unfixable; the bright hue
keeps dots/banners). Push-backs Sam invited and accepted: 600 weight (the
button's real weight), chips-are-not-buttons (smaller type, no hover), quiet
neutral chips.

### Lessons worth remembering

1. **Derive colors, don't pick them** (full claim in the KB note): the
   contrast script turned every "make it pop" request into a measurable
   yes — including two genuine traps (mustard text, the halo) and two
   rounding/binding-background subtleties (evaluate the ROUNDED hex; paper
   binds dark text, not the glass composite).
2. **Color is the reward**: monochrome ghost all day + full-color reveal
   once = the goosebumps moment. The discipline (grayscale page art) is what
   makes the daily color *feel* like a gift.
3. **PD art has a clean path** (KB note): NARA's Adams Mural Project (79-AA)
   is US-gov PD; California Impressionists via museum-tagged CC0/PD; museum
   *prose* stays copyrighted even when the image is CC0 — write our own
   blurbs; never contemporary plein air.
4. **The privacy pattern generalizes**: anonymous write-only table + RLS +
   payload-shape test + live verification as the anon role. Third use of the
   pattern (chat_interactions, kpi_snapshots, now reflections).
5. **Versioned banner = cache truth**: Sam couldn't tell if he had the new
   version; the `Prototype vX.Y` banner + `?v=N` cache-busts ended that.
6. **Fast loop hygiene**: 9 same-day PRs worked because each round was
   test-pinned before push (41–43 prototype checks, 27 production checks),
   merged on `unstable` per policy, and the branch was pruned/rebased over
   each squash (`git fetch --prune` + rebase; `--force-with-lease` chokes on
   auto-deleted remote branches — prune first).

### Current state / next steps

- **NEXT — GO (spec blessed): the live-dashboard token retheme** —
  swap `:root` values in BOTH HTMLs (token names already mirror), generator
  CSS (`EXHIBIT_ANALYSIS_CSS` etc.) follows tokens, ghosted painting behind
  the real page, glass chrome tab-by-tab, CI contrast lint
  (check_contrast.py grows a mode that lints the live `:root`), chip rules
  onto live badges (CCR/CER/audit chips), **KPI drag-reorder must survive**
  (label-identity re-match — add a regression check) + its keyboard path.
- **Manifest growth**: 3 → 60–90 paintings (per-image PD diligence, own
  prose, alt text). Candidates: more Redmond/Payne/Wendt/Rose/Bischoff/Hills
  via Commons + LACMA/Met/AIC/SAAM/NGA/Cleveland open access.
- **Reflections mining**: a periodic service-role job → "what our community
  is reflecting on" themes card (uplifting themes / growth opportunities, per
  Sam's notice text). Not yet scoped.
- **Almanac**: the past-paintings gallery view (stub link exists in the
  dialog).

## Coda — session close (17:20): the Chip Studio verdict + the callsign

One more A/B at Sam's request (v1.5, #403): the blessed solid chips beside a
**"glass & quiet"** family — subtle translucent fill (deliberately NO
per-chip backdrop blur: faked glass, GPU-free on long tables), gray outline,
darker accent text, .72rem → 6.5rem. Sam: *"Love the glass view. Let's run
with that!"* → **v1.6 GRADUATED glass-quiet as THE chip spec** (the `.chip`
base class wears it everywhere; the solid v1.4.2 family is archived as
`.chipa` in the Studio's reference row; option on file: re-solid crimson for
findings if triage scanning ever needs the shout). The retheme paints with
glass-quiet chips. Session 48's moniker, Sam-christened: **Bruh
Glasstronaut**. 🚀
