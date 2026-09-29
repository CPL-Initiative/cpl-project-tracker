---
title: CPL Fact Sheet — lessons
created: 2026-06-25
updated: 2026-08-21
tags: [lessons, fact-sheet, public-page, live-data, print-to-pdf, accessibility, mobile, sky-blaster, sky-veil, sky-curate]
obsidian-folder: cpl-project-tracker
artifacts:
  - fact-sheet/index.html
  - fact-sheet/factsheet.css
  - fact-sheet/factsheet.js
  - fact-sheet/factsheet_edit.js
  - fact-sheet/factsheet_word.js
  - fact-sheet/img/
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-standalone-public-page]]"
  - "[[docs/kb-notes/methodology-hide-must-suppress-the-export]]"
  - "[[docs/kb-notes/methodology-hiding-a-control-also-hides-the-way-in]]"
  - "[[docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect]]"
---

# CPL Fact Sheet — lessons

Workstream scratchpad for the **public CPL Fact Sheet** — a self-contained,
shareable web page that recreates the February-2026 "Journalist Fact Sheet" PDF,
pulls live data from COBI, and prints to a clean PDF. Built Session 74
(SkyBlaster), 2026-06-25, PRs **#537 / #540**.

## Session 74 — SkyBlaster (2026-06-25)

### What was built

Sam needed an updated CPL Fact Sheet for consultants **today**, and wanted a
**public, standalone web view** he could link people to without exposing the
rest of COBI's internal tabs.

Deliverable = **`fact-sheet/`** — a sibling-of-`kb-portal/` standalone page:

- **`index.html`** — the full fact-sheet content (CPL definition / types / modes;
  "The CPL Bump" equity data w/ the CAEL-WICHE *PLA Boost* citation; Vision 2030
  goals + Beacon economic impact; funding history + the 5-year funding table; MAP
  strategy & commitments; Veteran & Apprenticeship sprints; Noncredit Landing
  Pages; the Rocio Garcia student story; partnerships; legislation; the technology
  landscape; the resource directory; the team roster). Plus a full **KPI section**
  mirroring COBI's headline grid (all 11 cards in COBI order) and a **Statewide
  Exhibits** section (132 CCC-Collaborative exhibits across 12 program areas, a
  per-sector table + an expandable `<details>` per sector listing every exhibit).
- **`factsheet.js`** — binds the 6 headline KPIs (+ Military/Workforce/Apprentice
  breakdowns and the Veteran-Sprint figures) from `../live_metrics.json` on load,
  with the baked HTML values as a graceful fallback; wires the Print button; and
  opens all `<details>` for print/PDF.
- **`factsheet.css`** — brand tokens mirror COBI's `:root`; **Cambria** for prose,
  **Calibri** for data + KPIs (Caladea/Carlito metric clones as Linux fallbacks);
  print CSS at **0.4in** margins so "Save as PDF" yields a clean letter sheet.
- **`img/`** — the 3 screenshots preserved from the PDF (Calbright landing page,
  Rocio story, the "One Knowledge Layer" technology-landscape diagram) + the CCC
  wordmark.
- **COBI launch link** — a `📄 CPL Fact Sheet ↗` entry in the nav rail of BOTH
  HTMLs (Rule 4), an `<a class="cpl-tab cpl-tab-external">` with **no `data-tab`**
  so `tabs.js` ignores it and it opens the standalone page in a new tab.

### What was learned

- **"Sits alone" = a subdir page, not a tab.** A real COBI tab carries the full
  nav rail. To give consultants a public view *without* the other tabs, the page
  lives at `fact-sheet/` (its own HTML/CSS/JS, no COBI chrome), served publicly by
  GitHub Pages — exactly the `kb-portal/` pattern, minus the auth gate. The
  "launch from COBI" link is a non-tab anchor in the rail. Full reusable recipe →
  [`docs/kb-notes/playbook-standalone-public-page.md`](kb-notes/playbook-standalone-public-page.md).
- **Live data with zero plumbing.** The page `fetch`es `../live_metrics.json`
  (same Pages origin, the daily-cron artifact) and overwrites `[data-bind]` spans.
  Baked-in current values double as the no-JS / feed-down fallback. The page IS
  the "routine": open it (fresh data) → Print → PDF. No server, not a cron
  artifact.
- **Two data tiers.** Only the **6 headline KPIs** are in `live_metrics.json` and
  auto-update. The **5 exhibit/recommendation KPI cards** + the **Statewide
  Exhibits** counts come from the MAP **Custom Reporting Module** (transient, not
  committed), so they're a **labeled snapshot**. Semi-static narrative figures
  (Vision 2030 goals, workplan SCRs, funding table) are baked for Sam to edit.
  Follow-up: wire a committed CustomReport snapshot so those go live too.
- **The KPI-count reconciliation (the teaching case).** COBI's "Credit
  Recommendations" card shows **CCC Collaborative = 1,304** while the "Statewide
  Exhibits" card shows **Credit Recommendations = 1,101** — they look
  contradictory but measure different grains: **1,101** = *distinct* statewide
  recommendations (unique course×credit); **1,298** = *adoptions* (CCC rows with
  an articulating college); **1,304** = all CCC articulation rows = 1,298 + 6 rows
  with no college. Verified by summing the per-sector footnote (→ exactly
  132/1,101/1,298). Fix = relabel ("Articulations" vs "Credit Recs (distinct)") +
  a reconciliation note. **Lesson: when two cards disagree, the answer is usually
  "different denominators," and the per-category breakdown is the proof.**
- **Statewide exhibit detail already lived in the repo.**
  `kb/statewide_exhibit_categories.json` (the curated statewide title →
  program-area map) carries all 132 exhibit titles by sector — no need to scrape
  `map.rccd.edu/statewidecpl` (which is egress-blocked from the sandbox anyway).
  Generated the section from that JSON + COBI's per-sector counts.
- **PDF text/image extraction in the sandbox.** `poppler-utils` and `apt` are
  unavailable, and `cryptography`'s Rust binding was broken (`_cffi_backend`
  missing). Fix: `pip install --force-reinstall cffi`, then **`pdfminer.six`** for
  text and **`pypdf` + `pillow`** for embedded images. Headless render/verify via
  the pre-installed Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  (launch with `executable_path=` + `--no-sandbox`), served over a local
  `http.server` so `../live_metrics.json` resolves.
- **Publishing ≠ distributing.** Merging to `main` makes the Pages URL live but
  doesn't broadcast it — Sam shares the link himself. So "merge to publish" is
  low-risk; the only gate honored was the **required TruffleHog** secret-scan
  before each merge (waited for it to conclude `success`, then squash-merged).

### Current state

- **LIVE on `main`** at `https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/`
  + the COBI nav-rail launch link. PRs #537 (page + link) and #540 (Statewide
  Exhibits section + KPI reconciliation) both merged.

### Roadmap / next

1. **Live-wire the snapshot tier** — build a committed CustomReport snapshot the
   daily cron writes, so the 5 exhibit/recommendation KPI cards + the Statewide
   Exhibits per-sector counts auto-update instead of being a manual snapshot.
2. **Reproduce the technology-landscape diagram as live HTML/SVG** (regen-proof,
   sharper than the preserved screenshot).
3. **Semi-static figures** — Sam to confirm/refresh the Vision 2030 workplan SCRs
   (332/889/37.35%/274) and the funding table when they move.

---

## 2026-06-28 — "Curate" editable overlay (sign-in to edit any box)

Sam asked to make the Fact Sheet **editable with a login to Curate** (motivated by
two concrete edits: retire the JST upload resource card, and update the AB 123 box
for the just-passed 2026 bills AB 111 & SB 111). A **second session was concurrently
editing the Statewide CRs region of the same page**, so the edit had to land with a
near-zero footprint in the shared HTML.

**What shipped:**

- **`fact-sheet/factsheet_edit.js`** (new, standalone) — a content-agnostic
  Supabase **overlay**. On load it walks the DOM, assigns each editable "box" a
  **stable key** (`sectionId|slug(baked text)`, stamped `data-fsk`), reads
  `public.factsheet_overrides` (anon), and overlays `{ html, hidden }` for every
  visitor. A signed-in reviewer (shared `cpl_sb` magic-link + `is_allowed_reviewer()`
  RLS, the CCR/RACI/TMC gate) gets a **✎ Curate** mode: click a box → a docked
  raw-HTML editor → **Save / Hide / Reset-to-original**. Reuses the
  refresh-token-before-write guard; sanitizes reviewer HTML on the public render
  path (strips scripts/handlers/dangerous URLs — keeps links/bold/lists).
- **`public.factsheet_overrides`** (new table, applied via MCP) — `block_key` PK,
  `page` (forward-compat), `html`, `hidden`, `edited_by/at`. Public SELECT,
  reviewer-gated write. Schema committed at `fact-sheet/supabase_factsheet_overrides.sql`.
- **`fact-sheet/index.html`** — only **three** surgical, collision-safe changes: a
  `#btn-curate` button in the action bar, the `factsheet_edit.js` script tag, and
  **removed the JST upload resource card** (Sam's ask).
- **Excluded from editing** (in JS, so no HTML touched): `#statewide-exhibits` (the
  other session's lane), `#progress` (live data-bound KPIs), `#contents`, and any
  `[data-bind]` box.
- **Tests:** `tests/factsheet_edit.test.js` (26 checks — keys/stability/exclusions/
  overlay/sanitizer + static wiring). Full suite green.

**Why DOM-walked keys (not hand-stamped `data-edit-key`):** editability is entirely
JS-driven, so `index.html` carries no per-box markup → tiny diff → **no overlap with
the concurrent Statewide-CRs PR**. Pattern write-up:
[`docs/kb-notes/playbook-curate-editable-standalone-page.md`](kb-notes/playbook-curate-editable-standalone-page.md).

**Carryover:**

1. **One-time Supabase toggle (Sam):** add the Fact Sheet URL (or a
   `…/cpl-project-tracker/**` wildcard) to **Auth → URL Configuration → Redirect
   URLs** so *direct* magic-link sign-in from the Fact Sheet completes on the page.
   Until then the link falls back to the dashboard (Site URL) in a separate tab,
   where the Fact Sheet can't read the session.
2. **AB 123 box:** Sam edits it live (AB 111 & SB 111) once Curate is on — that's
   the feature's first real use.
3. **Statewide CRs editability:** after the sibling PR merges, a quick follow-up can
   drop `#statewide-exhibits`/`#progress` from the exclusion list.
4. **CLAUDE.md memory refresh** (the `fact-sheet/` §2 row + §8 table list) — held to
   the next checkpoint to avoid racing the sibling session on the shared file.

### 2026-06-28 (StarBender, Session 79) — statewide credit recs from our own data

Sam: under each Statewide CPL exhibit on the Fact Sheet, show its credit
recommendations (C-ID / title / units) in a default-collapsed wedge — eye-catching
for sector audiences. First instinct was to scrape the PDFs on `map@rccd.edu/statewide`;
Sam redirected: **"You should have the CRs in our COBI dataset so you don't have to
scrape them."** That changed everything.

**The hard part was identifying the ONE authoritative exhibit.** Our EACR groups by
unified credential `(unified_title, issuing_agency, cpl_type)`, which **inflated** the
rec list — POST Basic Academy showed 42 recs vs the canonical ~10. Sam's hypothesis,
confirmed: *"In MAP we make a statewide exhibit that other colleges adopt or adapt
from… but perhaps they also tag their adapted exhibit with CCC Collab, which leads to
the confusion."* So the unified grouping folds the published exhibit **and** every
college's CCC-tagged adaptation together.

**The signal (durable):** the authoritative statewide exhibit is the raw MAP row whose
**`Collaborative Type == "CCC"`** — a lead college hosts it (Lassen for POST,
Saddleback for Real Estate). Adopting colleges tag adaptations differently. Filtering
to raw `CCC` rows isolates the canonical exhibit → POST's exact 10 AJ recs
(AJ 110/120/122/124/140/160/200/220 + the two GE rows). Found via a **runner probe**
(`statewide/_probe_exhibit_authority.py`) since the agent sandbox can't reach the MAP
API — the runner-as-proxy pattern again. Captured as a KB note:
`docs/kb-notes/reference-authoritative-statewide-exhibit-signal.md`.

**The pipeline (PR #571, merged):**
- **Producer** (`excel_to_dashboard.py` / `_build_statewide_adoption`): additive
  `authoritative_recs` per exhibit = recs from `collab == "CCC"` rows ONLY, deduped by
  recommendation text, C-ID carried/backfilled. The existing `credit_recs` (all collab
  rows, EACR's source) is **untouched** — no EACR regression.
- **Builder** (`fact-sheet/_build_statewide_recs.py`): reads `statewide_data.js`, emits
  `window.CPL_STATEWIDE_RECS = {exhibit_title → [{t,u,cid}]}` from `authoritative_recs`,
  normalizing phrasing variants (intro→introduction, admin→administration) so dup
  phrasings collapse. Logs the **no-CCC list** — statewide credentials with no
  CCC-tagged exhibit show nothing (caveat (a), Sam-approved: "fix in MAP"). Live today
  it's 3 (DLPT-Russian, HRCM 001, NCCER CORE); EMT now has a CCC exhibit so it dropped off.
- **Workflow:** builder runs after the generator; `fact-sheet/statewide_recs.js` joins
  the daily `git add` list → refreshes with the cron. Verified after dispatch: 129
  exhibits / 329 recs; POST = the canonical 10.
- **Tests:** `tests/statewide_recs_test.py` (12) — CCC-only, dedup, units split,
  C-ID backfill, no-CCC fallback.

**Lessons:**
- **Don't choose between C-ID and non-C-ID recs.** Sam: "many CRs don't have C-IDs, but
  when they do, they show up as the CR on the PDF." So show **all** recs; badge the
  C-ID when present. The PDF is the spec — match its behavior.
- **Many sources of one truth → find the discriminating column, don't dedup by
  similarity.** The over-merge wasn't a fuzzy-matching problem; it was a *provenance*
  problem solvable with one exact filter (`collab == "CCC"`). Probe the raw columns
  before reaching for normalization.
- **Code-only PR + the consumer held.** This PR ships the data pipeline only; the
  live Fact Sheet is unchanged. The **consumer wedge** (the `<details>` under each
  exhibit `<li>` in `fact-sheet/index.html`) was held until a concurrent
  editable-Fact-Sheet session's PR landed — which it did (#570) — so it's now
  unblocked for the next session: rebase + add it as a minimal additive overlay
  (the `card_raci.js` pattern).

## 2026-06-28 — Session 81 (StarFarout): Curate boxes — add / ✕ delete / drag-reorder

Sam wanted the Curate overlay to do more than edit/hide existing boxes: **add** new boxes
(e.g. more Resources cards, pre-filled with sample text in the section's format), **✕ delete**,
and **drag to reorder**. Built as **Phase 1 (boxes)**; images (paste/delete/resize) are the
agreed Phase 2 via a Supabase Storage bucket.

### What shipped (`fact-sheet/factsheet_edit.js`, single file + tests)
- **Add** (`addBox`) — a ＋ Add box button per editable grid section (curate mode). It **clones the
  section's representative box** (first `.res`/`.card`/…) and swaps its visible text for placeholders,
  so a new box **always matches the section's exact format** with zero hardcoded per-section HTML.
- **✕ delete** — one affordance, honest semantics: an **added** box is truly deleted (its override
  row removed); a **baked** box (lives in `index.html`, can't be removed) is **hidden** (`hidden:true`).
- **Drag-reorder** — within a section's box container; the order is saved + replayed for every visitor.

### How it rides the existing table (no schema migration)
Reserved `block_key` namespaces in `factsheet_overrides`: an added box is `"<sectionId>|add|<kind>|<token>"`
(`html` = its inner HTML; **materialized** into the DOM on load, then adopted as a normal block),
and a section's order is `"<sectionId>|__order"` (`html` = a JSON array of keys, **parsed not injected**).
`applyBlock` skips both (they match no baked element).

### Gotchas worth keeping
- **Keep the sync baked-collect.** The existing tests read `blocks()` immediately after `boot()`, so
  `collectBlocks()` must stay synchronous. Added-box materialization happens in the post-fetch `.then`,
  then a **re-collect** adopts them (an `isAddedKey` branch in `collectBlocks` preserves their stable key
  instead of re-slugging by text).
- **Cloning a LIVE template copies the curate chrome.** In curate mode every box (incl. the clone source)
  carries a ✕ button — so `sampleInner` must strip `.fs-del`/`.fs-add` from the clone, or the ✕ lands in
  the *persisted* HTML. (Caught by a test asserting the saved html has no `fs-del`.)
- **Scope the order to the box CONTAINER, not the whole section.** A section-level intro `<p>` is a keyed
  block too; if it's pulled into the order array, `applyOrder`'s `appendChild` shoves it *below* the grid
  on reload. `persistOrder` gathers `boxContainer(sec).querySelectorAll('[data-fsk]')` only. (Guarded.)
- The ✕ is appended *inside* the box, so it's re-applied after any innerHTML write (edit/hide/reset) and
  excluded from saves (saves read the editor textarea / override map, never live innerHTML).

Tests: `tests/factsheet_edit_boxes.test.js` (28) — add/materialize/delete/reorder/curate-chrome/exclusions;
the original `tests/factsheet_edit.test.js` (31) still green. Code-only; `index.html` untouched (the overlay
injects all chrome). Next: **Phase 2 images** (paste → Supabase Storage bucket → URL; `<img>` allowlist with
a host check; resize via width presets first, drag-handle later).

## 2026-06-28 — Session 81 (StarFarout): the "My CPL Stories" section (4 random, headless-sourced)

Sam: add a section highlighting **4 random** "My CPL Story" windows from
https://map.rccd.edu/cplstories/ + a link to the MAP site. Built into the existing
`#stories` section (keeps the Rocio feature): a `.cpl-stories-grid` that picks 4 at
random from `window.CPL_STORIES` + a "See all CPL Success Stories ↗" link.

### Sourcing — the runner-as-proxy, escalated to a headless browser
- `map.rccd.edu` is **SiteGround-bot-protected**: a plain runner `curl` gets `HTTP 202
  sg-captcha: challenge` (a 183-byte stub), not the page. The WP REST API is gated too.
- **Real Chromium (Playwright) on a runner passes the JS challenge.** `tools/source_cpl_stories.mjs`
  loads the page headless and extracts the `.card` story windows → `fact-sheet/cpl_stories.js`.
  Workflow `.github/workflows/cpl-stories.yml`: **push = dry-run** (extract + print, verify in the
  Actions log), **weekly cron + dispatch = `--apply`** (regenerate + commit). The client picks 4 random.
- **The challenge is INTERMITTENT** — it passed cleanly once, then served a harder "Robot Challenge
  Screen" (33 KB) on the next run. Fix: **retry + `waitForFunction(() => …querySelectorAll('.card').length > 5)`**
  — reload until the real story cards render (the challenge auto-resolves on a reload). On total failure
  the apply path **exits 0 without writing**, so the cron keeps the last-good committed dataset rather
  than clobbering it with a challenge stub.

### Extraction gotchas
- **Name from the `<h2>` only** — `card.querySelector('h2,h3,.card-header')` returns the **`.card-header`
  parent first** (document order), which includes the badge ("Brody✓ Industry Certification"). Query the
  `<h2>` directly for the clean name.
- **Quote = the smart-quoted “…” testimonial**, with a description-blurb fallback; strip the leading
  name + badge + credits + the "career → outcome" pathway from the body first. A `pathway` field feeds a
  small italic line on the card.
- Photos are `https://staging2.map.rccd.edu/…` (the live page references staging image URLs); kept as-is
  with `referrerpolicy="no-referrer"`. These are already-public, Sam-owned student stories, re-surfaced on
  the (also public, same-org) Fact Sheet — no new PII exposure.

### Renderer / Curate interaction
- `fact-sheet/cpl_stories_render.js` — read-only, **escapes** all external text, **https-only** photos
  (`safeImg`), hides the whole block if there's no data (graceful — intro + featured story + link remain).
- The dynamic cards use a **non-`.card` class** (`.cpl-story-card`) and live inside a nested `<div>`, so the
  Phase-1 Curate overlay (which collects `.card`/`.res`/… + direct section `<p>/<ul>/<ol>`) **never touches
  them** — no `EXCLUDE_SECTIONS` change needed. Verified: the `factsheet_edit` suites stay green.
- **jsdom test note:** the renderer (like `factsheet_edit`) auto-boots on `DOMContentLoaded`, which has
  already fired under `runScripts:"outside-only"` — the test calls `CPL_STORIES_RENDER.render()` directly.
  Test `tests/cpl_stories_render.test.js` (18): 4-of-N random, escaping, https-only, pathway, empty-hides.

## 2026-06-28 — Session 81 (StarFarout): Curate Phase 2 — images (add / delete / resize)

The agreed follow-up to Phase-1 boxes: a reviewer can **add** an image (upload), **✕ delete** it, and
**resize the frame** — via a **Supabase Storage** bucket (Sam's call). All in `factsheet_edit.js`.

### Storage
- New **public** bucket `factsheet-images` (5 MB cap, raster MIME only); writes gated by
  `is_allowed_reviewer()` — same reviewer boundary as `factsheet_overrides`. Schema-of-record:
  `fact-sheet/supabase_factsheet_images.sql` (applied live via the Supabase MCP). Uploads `POST` to
  `/storage/v1/object/factsheet-images/<file>` with the reviewer JWT; the override stores the **public URL**.

### The image layer (parallel to boxes, same override table)
- Each `<figure>` is its own **image block**: baked figures get a stable `"<sid>|fig|<img-basename>"` key;
  reviewer-added figures get `"<sid>|img|<token>"` (materialized like added boxes). Resize = the `<img width>`
  attribute (the frame follows); replace = re-upload + swap `src`; ✕ = hide (baked) / delete (added).
- **Inline control bar** (`.fs-imgbar`: S/M/L/Full · ⤢ Replace · ✕) on hover — not a dock. The bar is
  appended INSIDE the figure, so `figureInner()` strips `.fs-imgbar`/`.fs-del` before persisting (the
  Phase-1 sampleInner lesson again). `onDocClick` ignores image blocks (controls are inline, no text dock).

### Gotchas
- **In-figure `<figcaption>` must NOT also be a separate text box.** Phase 1 made figcaption editable
  (it's in `BOX_SEL`); if the figure ALSO becomes a block, you get two overlapping overrides on nested
  elements — a figure-innerHTML override clobbers the caption's separate override. Fix: `collectBlocks`
  **skips a `<figcaption>` inside a `<figure>`** and manages the whole figure as one image block.
- **`<img>` on a public innerHTML path = expand the allowlist carefully.** Added `IMG`/`FIGURE` to
  `ALLOW_TAGS` + `src/alt/width` to `ALLOW_ATTR`, but `src` is **host-allowlisted** (`safeImgSrc`: our
  Storage bucket / `*.supabase.co/storage/.../public/` / `map.rccd.edu` / `./img/`) — **no `data:`**, no
  foreign host — and `width` is coerced to a number ≤ 900. An out-of-allowlist `<img>` is dropped whole.
- **`isAddedKey` ≠ `isImgKey`.** Added images use `|img|` keys, not `|add|`; `deleteBox` had to treat
  `isImgKey` as "added" (true delete) too, or it would only hide them.

Code-only; `index.html` untouched (figures are baked; the overlay injects all chrome). Tests:
`tests/factsheet_edit_images.test.js` (25) — sanitizer allowlist, figure-as-image-block, caption-not-a-box,
curate bar, resize-persists-without-chrome, hide-vs-delete, `|img|` materialize. Full suite 99/99.

## 2026-06-28 — Session 82 (StarFarout cont.): the statewide-exhibits "consumer wedge"

The producer half (StarBender, Session 79) built `statewide_recs.js` = `window.CPL_STATEWIDE_RECS`,
keyed by exhibit title → `[{t:course title, u:units, cid:C-ID}]` (recs collected from raw
`Collaborative Type == "CCC"` rows only — the authoritative statewide signal). This is the **consumer**:
`fact-sheet/statewide_recs_render.js` surfaces each exhibit's recs under its `<li>` in
`#statewide-exhibits` as a small collapsible "N statewide credit recs" toggle (course title — units, with
a C-ID badge when known).

### What made it clean
- **Exact-title join, verified against real data first.** The data keys ARE the authored `<li>` texts, so
  the match is a normalized (trim/collapse-ws/lowercase) title lookup — no fuzzy matching. Before writing
  the test I checked the real `statewide_recs.js` against the real `index.html`: **129/129 keys matched an
  `<li>` (100%); 129 of 132 exhibits get a wedge** (the 3 without have no statewide rec). Always confirm a
  title-join's real hit-rate before shipping a join-based feature — a silent 0% is the failure mode.
- **No overlap with Curate.** `#statewide-exhibits` is on `factsheet_edit.js`'s exclusion list, so the
  wedge (read-only DOM mutation) never collides with an edit override. Two independent overlays, one section.
- **`statewide_recs.js` wasn't loaded yet** — the producer committed the data file but nothing consumed it.
  Added BOTH `<script>` tags (data before renderer) to `index.html`.
- **Self-contained + idempotent + escaped + print-open.** Mirrors `cpl_stories_render.js`: own CSS via
  `var(--token)` fallbacks, all text escaped, a `data-sw-rec` marker so re-running never double-appends, and
  a `@media print` rule that force-shows every rec list (collapsed-on-screen detail is irrelevant on paper).
- **Capture the `<li>` title BEFORE appending** the wedge span (the li's text node is the key); de-dupe recs
  by `(title, units, cid)` since the source repeats a course across adopting colleges.

Tests: `tests/statewide_recs_render.test.js` (22) — match/no-match, de-dupe count, C-ID badge, unit
pluralization, toggle, idempotency, escaping. Full suite 100/100. Code-only (`index.html` gains 2 script tags).

## 2026-06-28 — Session 82 (SkyFlyer): editable everywhere + WCAG 2.1 AA + Word export

Sam's "a few more fact sheet changes" — one PR (#584). Two asks: (1) make the *remaining* boxes
Curate-able with the right capability per section, and (2) a spin-through for completeness / links /
accessibility / PDF + Word. I kicked off a 6-agent **audit workflow** (completeness, link opportunities,
WCAG 2.1 AA, print/Word, and an editor section/grid map) that ran in the background while I built the
editor changes — then applied its verified findings. That pattern (fan-out audit → build in parallel →
apply verified results) was the right shape for a "spin through everything" ask.

### The editor: capability lanes per section (`factsheet_edit.js`)
The old overlay had ONE rule — a box is editable unless it's in an excluded section or contains
`[data-bind]`. Sam's asks needed **three** lanes, so the block model grew per-block flags
(`live`, `noEdit`, `isTable`, `movable`, `gridSig`) and a derived `canEditHtml(bl)`:

- **`MOVE_ONLY_SECTIONS = {progress:1}`** — the KPI grid. Collected now (removed from
  `EXCLUDE_SECTIONS`), but boxes are **move + delete only**: draggable + ✕, never the text editor.
  Un-hide is "click the ghosted (hidden) box" since there's no dock to toggle from. Sam was explicit:
  KPIs "don't need to be editable--just moveable and deleteable."
- **Veteran-Sprint stats are EDITABLE even though they're live.** Sam asked for it explicitly (distinct
  from the KPI carve-out). The danger — an overlay clobbering a live binding — is handled in
  **`applyBlock`**: for an editable LIVE box with **no** html override, *leave `innerHTML` alone* (the
  data binding wins); only an explicit html override replaces it (box goes static). So an un-edited
  Vet-Sprint box still shows the daily number; an edited one shows the reviewer's text.
- **Budget table = hide-only.** Collected `table.data`'s `.tbl-wrap` as an `isTable` block: a single ✕,
  no drag, no editor. (Sam assumed it's Budget-tab-sourced — it's actually baked, but hide-only is the
  right affordance either way.) `overflow:visible` during curate so the ✕ escapes the scroll frame.

### Per-GRID Add box — the real structural fix
`#what-is-cpl` has TWO grids (the `.cols-2` CPL-Types/Modes cards AND the CPL-Bump `.stat-grid`);
`#vision-goals` has two `.stat-grid`s, `#teams` three `.team-grid`s. The old `addBox(sid)` modeled the
new box on the *first* grid box and appended to the *first* container — so the CPL Bump grid could never
get its own Add box. Fix: enumerate grid containers (`GRID_CONTAINER_SEL`), render **one ＋Add box per
grid**, and encode the target grid in the add-key: **`<sid>|add|<kind>|gN|<token>`** (`gN` = index among
the section's grids). `materializeAdded` parses `gN` and re-inserts into the right container; an older
4-segment key (no `gN`) falls back to grid 0 (back-compat). **Order stays ONE key per section**
(`<sid>|__order`) — `applyOrder` appends each box to *its own parent*, so a section with several grids
keeps each grid's boxes within that grid without per-grid order keys (a box never jumps grids).

### Stable keys must exclude live (`[data-bind]`) text
The big trap: KPI/Vet-Sprint box text contains the daily metric value. Keying off full text would make
the `data-fsk` key **churn every day** when the number changes → saved hides/orders/edits orphaned.
Fix: `blockSig` now uses `stableText(el)` = the box's text with `[data-bind]` subtrees removed, so a KPI
keys off its label ("Cumulative CPL Students…"), not "48,029…". Boxes with no data-bind are unchanged
(stableText == textContent) so no existing key migrated. New KB note:
`methodology-stable-dom-keys-exclude-live-text.md`.

### Spin-through
- **~15 embedded links** (colleges, JST, GI Bill, Title 5 §55050, Master Plan, WestEd, Credential Engine,
  Futuro Health, ACE, Calbright, West LA, MCAGCC) — a verify-the-URL agent ran before I applied them
  (kept/fixed/dropped), so no guessed deep links shipped.
- **WCAG 2.1 AA**: `--faint` #87877F→#69695F and `--mustard-text` #8B6800→#7A5B00 (small-text contrast
  1.4.3); `:focus-visible` rings on buttons/`<summary>`/TOC (2.4.7); `role=status aria-live=polite` on the
  live chip (4.1.3); a `labelSectors()` pass in `factsheet.js` that gives each statewide `<summary>` a
  full-sentence `aria-label` built from its cell values — and re-runs after the live update so it never
  goes stale (1.3.1 on a CSS pseudo-table that a screen reader otherwise hears as bare numbers); funding
  table `th scope`+`<caption>`; link-purpose `aria-label`s; larger TOC targets; `prefers-reduced-motion`;
  a `.sr-only` utility. (The page advertises "WCAG 2.1 AA" in its own workplan-metrics card, so it should
  meet it.)
- **Print**: forced `print-color-adjust:exact` on the load-bearing fills — the **navy `thead th` was
  printing white-on-white** (invisible header) without it; revealed link URLs in reference contexts
  (legislation/resources/lede/footer) not just `.res-title`; `break-inside:auto` on sections so long ones
  flow; single-column statewide lists; a CSS belt that opens `<details>` on paper even if the JS didn't run.
- **`factsheet_word.js`** — new `⬇ Word` export. Chose the audit's recommended **DOM-to-`.doc`** (mso-HTML
  Blob) over docx@8: the content already lives in the rendered DOM (incl. live data + Curate overrides),
  so cloning `<main>` captures exactly what the visitor sees, with zero dependencies — true to the
  standalone ethos. Statewide grid → real `<table>` (Word renders tables well, CSS grid poorly). New KB
  note: `playbook-standalone-dom-to-word-export.md`.

### Surfaced, not auto-changed
The completeness agent flagged internal-consistency items I deliberately did **NOT** hardcode-edit on a
public doc (they're live/snapshot data or Sam's domain facts): Statewide KPI "12 program areas" vs 13
listed rows (incl. an "Other Statewide" catch-all); the deduped could-adopt total (116) reading oddly
next to per-area rows summing to 454 (the footnote explains it); "30,000" Phase-1 JST goal vs "34,000+"
veterans-in-system phrasing; baked KPI fallback breakdowns not all summing. All Curate-editable now if
Sam wants to reword. **Lesson: on a public doc with a live data layer, surface number inconsistencies to
the owner — don't silently "fix" figures you didn't author.**

Tests: `tests/factsheet_edit.test.js` (35, updated for the new policy — #progress now collected,
data-bind boxes now keyed), `tests/factsheet_edit_sections.test.js` (19, new — the three lanes +
per-grid add), `tests/factsheet_word.test.js` (19, new). Full suite **102 files green**.

---

## 2026-07-23 — SkyVeil: the per-section "Hide section" toggle (+ Funding hide/un-hide)

**Context.** Sam is modeling Implementation Funding scenarios that change the
Fact Sheet's current-allocations figures + budget table, so he wanted the
**Funding** section hidden "for now," then asked for a **general** hide control:
*"add a hide button to each section in the curation view. If hidden, it should be
suppressed in reporting functions for the tab."* Then, once the toggle was live,
*"unhide the budget section now and I'll test the new function by hiding it
myself."*

**What shipped (3 PRs, all merged + deployed):**
- **#874 — Funding hide (stopgap).** Marked the `#funding` section + its TOC link
  with a new `.fs-withheld` class (display:none) and added it to the Word export's
  strip list. **Key gotcha:** `factsheet_word.js` *un-hides* every `[hidden]`
  element on its DOM clone (to flatten collapsibles for the flat doc), so a plain
  `hidden` attribute would have made the funding table **reappear in the Word
  export** — had to use a *stripped class*, not `[hidden]`.
- **#875 — the general toggle.** A **🙈 Hide section** button on every reorderable
  section in Curate mode (top-right, beside the ⠿ Move handle). Reuses the existing
  box-hide plumbing: a reserved `<sid>|__hidden` override key (parallel to
  `<sid>|__order`, inert to all the add/order/img machinery), and marks the section
  **+ its TOC link** with `.fs-ov-hidden` — the *same class the box-hide uses*. That
  class is already `display:none` publicly, ghosted+un-hideable in Curate mode, and
  **already stripped by the Word export + hidden under `@media print`** — so
  reporting suppression came for **free**, no new report code. `applySectionHidden()`
  applies saved hides for every visitor on load; the button is reviewer-only.
- **#876 — un-hide Funding.** Removed `.fs-withheld` from the section + TOC link
  (section blob restored byte-identical to pre-hide); flipped the Word test's
  Funding check from "excluded" to "included." Kept the `.fs-withheld` utility (CSS
  + strip + a *generic* mechanism test) so it stays available + honest.

**Design calls.**
- **Reuse, don't parallel.** The whole feature is ~1 class + 1 reserved key
  because the report generators already respected `.fs-ov-hidden`. Distilled into
  KB note `methodology-hide-must-suppress-the-export.md`.
- **Two coexisting hide triggers, one outcome.** `.fs-withheld` = source-level
  always-hidden (dev/one-off); the toggle = curator DB-driven per-section hide via
  `.fs-ov-hidden`. Both resolve to display:none + report suppression; they don't
  fight in code.
- **Funding stays independent.** After #876 Funding is visible; Sam now hides it
  himself via the toggle (he confirmed: *"Hide function works great"*).

**Tests.** New `tests/factsheet_edit_section_hide.test.js` (24 checks: public-load
apply on section **+** TOC link, one Hide button per reorderable section, label/
`aria-pressed`/`.is-hidden` state, toggle POSTs the reserved key + hides, un-hide,
reserved-key inertness). `factsheet_word.test.js` also guards that an
`.fs-ov-hidden` **section** (not just a box) is excluded from the export. Full
suite **168 files green** across the run.

**State / next.** Feature is live and Sam-verified. No carryover. Open door: if
Sam wants, migrate the (now-removed) Funding stopgap onto the toggle so there's a
single mechanism — but there's nothing pending since Funding is visible again.
Side-lane — left `kb/cpl_todos.json` + the numbered handoff to the CCR mainline.


## 2026-08-20 — SkyCurate (Session 173): hiding Curate, and what the accessibility check found

Two asks in one run. Sam: *"On our public CPL Fact Sheet on COBI, I'd like to hide
the Curate button so the public doesn't see it…but I would like it to be available
somehow for the MAP team to curate. Please consider and recommend."* Then, mid-run:
*"After publishing can you run a check on the Fact Sheet to make sure everything is
accessible and mobile friendly?"* Shipped as **#1269**, merged `d14d2f2`.

### The Curate button — the second door is what makes the first one safe

**Say the security part out loud, in the code.** The button was never the gate:
every write to `factsheet_overrides` is RLS'd to `is_allowed_reviewer()`, the anon
key can read and never write, and `factsheet_edit.js` is **served publicly** — so
anyone who opens it learns whatever reveal switch we pick. Hiding it buys exactly
one thing: a visitor stops being offered a control they cannot use, and stops being
asked for a *"reviewer email"* they do not have. That is worth doing and it is not
hardening, and the module header now says so, because the next person to touch this
file must not start treating it as a second line of defense.

⭐ **HIDING AN AFFORDANCE ALSO HIDES THE WAY TO GET ACCESS.** This is the whole
design problem and it is easy to miss: the Curate button was *itself* the sign-in
entry point (`signIn()` fires when a non-reviewer clicks it). Hide it on "not a
reviewer" and a curator on a new laptop — or one past the session keeper's 12h cap —
has no way to *start* signing in. So the reveal is two paths, and the second exists
solely to keep the first recoverable:

1. **A live reviewer session** — the normal path. The page now loads
   `cpl_session.js` (the keeper from #1205/#1207), which makes `localStorage` the
   canonical session and mirrors it into each tab's `sessionStorage` — which is
   exactly where `factsheet_edit`'s `getSession()` already looked. Sign in on COBI
   (About → reviewer sign-in), open the Fact Sheet from the Share menu, and the
   button is there. ⭐ **This also closed a latent gap nobody had filed:** the Fact
   Sheet previously saw a session ONLY if the magic link had been opened in that
   same browser tab, because it read `sessionStorage` directly and nothing kept it
   fed. The fix for the new requirement repaired an old defect for free.
2. **`?curate=1`** — the escape hatch. Stripped from the address bar the moment it
   is read (the same treatment `captureHash()` gives an access token, and for the
   same reason: a URL copied out of a curator's own bar should be the public one),
   remembered per browser, forgotten by `?curate=0`. **The bookmark to keep.**

⚠️ **`hidden` in the markup is not enough when a class sets `display`.** `.btn` is
`display:inline-flex`, which outranks the UA sheet's `[hidden]{display:none}` — so
the attribute alone was decorative and the button painted for everyone. It ships
hidden in the MARKUP (not merely hidden by script, which flashes) *and* with a
`.btn[hidden]` rule in the stylesheet. Both halves are load-bearing.

**Considered and skipped:** a separate "Curate Fact Sheet ↗" side-menu entry (works
— `link`-kind rows are first-class since #1213 — but with the session path landing,
the existing Share launcher plus a live session already gets you there, and a second
menu row is a second thing to keep in sync); and a team-phrase gate (wrong
credential shape — the phrase is site-scoped and shared, curating is a personal
identity, and the RLS behind it is already `is_allowed_reviewer()`).

### The accessibility check — four defects, none of them visible to a test

Sam apologised for asking late. He should not have: the audit found more than the
feature did, and **every one of the four was invisible to static analysis.** They
were found by measuring the page in Chromium.

⭐ **① THE STATEWIDE GRID WAS UNUSABLE ON A PHONE, AND LOOKED FINE.** Its five-column
track carries **322px of FIXED numeric columns**; with gaps and padding no row can
render below **368px**. Measured at a 360px viewport: the page scrolled sideways by
**31px** (71px at 320px), the program-area column (`minmax(0,1fr)`) collapsed to
nothing so **"Construction Technology" printed ON TOP of its own Exhibits figure**,
and **"Could adopt" sat entirely off-screen** inside `.sw-grid details{overflow:hidden}`
— clipped, so it could not even be scrolled to. ⚠️ **The clipped column is the worst
of the three, and it is the one a screenshot review would pass:** a page that
silently drops a column looks complete. Below 560px the row now stacks — program
area on its own line, then the four figures 4-up, each carrying its own label.

⚠️ **The labels have to TRAVEL WITH THE NUMBERS.** The `.sw-head` label strip is
hidden in the stacked layout, so a bare column of digits would be meaningless. They
are `::before` content keyed off the `data-col` attributes already in the markup —
which keeps them **out of `textContent`**, so `factsheet_word.js` still reads bare
figures and the Word export is unchanged. A label rendered as real DOM would have
leaked into the .docx.

**② No skip link** (WCAG 2.4.1) — the page opens with a sticky action bar and a
20-entry Contents list, so a keyboard user tabbed through ~25 controls before
reaching any content.

⭐ **③ THE SCROLLING TABLE WAS KEYBOARD-UNREACHABLE, AND ITS CONTAINMENT IS WHY.**
The funding table is 674px wide inside `.tbl-wrap{overflow-x:auto}`. That container
is why it never pushed the page sideways — the good behavior — and **also** why a
keyboard user could never see its right-hand columns (WCAG 2.1.1: a scroll container
is mouse-draggable but not focusable). Now a labeled region, focusable **only while
it actually overflows** (verified `tabindex=0` at 360px, absent at 1024px), so it
never becomes a dead tab stop on a wide screen. Its accessible name comes from the
table's own `<caption>` rather than being invented here.

**④ Skipped heading levels** (WCAG 1.3.1 / technique G141): `h1→h3` and three
`h2→h4`. Fixed by correcting the **level** and carrying the old **look** on a
utility class, so the semantics changed and the page did not.

⚠️ **AND THAT IS WHERE I BROKE IT.** I classed the Contents heading `h-sub` while
the rule read `h3.h-sub` — an `h2` matches nothing, so it dropped to the browser's
default 2em. **No assertion caught it. A before/after screenshot did.** A change
whose entire claim is *"the semantics moved and the appearance did not"* can only be
verified by comparing appearance; the test now pins that no BARE `.h-sub`/`.h-card`
rule exists, and the harness takes the screenshots. Final desktop pixel diff: **0 px
changed** at 1024px; mobile differs only inside the statewide block.

### Contrast: the palette was already sound — the failures were structural

Every fg/bg pair the page actually paints was **computed**, including the composites
(the sticky bar's `white@.92` over paper, and the chip fills over *that*). All 31
pass AA. ⚠️ `--mustard-fill` as a decorative rule is **1.95:1** on white — the same
documented class as `--border-strong` at 1.92:1 (CLAUDE.md): decorative, never the
only signal, and explicitly not to be "fixed" by deviating from the brand. The test
now pins that **no TEXT uses it**, so a future change cannot quietly start leaning
on it.

### Verification, split by what each instrument can actually see

- `tests/factsheet_a11y.test.js` — **69 checks, runs in CI.** Structure + the
  contrast maths. jsdom has no layout engine, so **no geometry here**.
- `fact-sheet/check_mobile_layout.js` — **Chromium, on demand, deliberately NOT in
  `npm test`.** CI has jsdom only, and adding playwright to `package.json` would
  make CI download browsers for a check it never runs (I did that by accident via
  `npm install` and reverted it). 9 viewports + keyboard + reduced motion. **This is
  the script that found ① and ③.**
- `tests/factsheet_edit_curate_visibility.test.js` — 25 checks on the Curate change.
- Full suite **232/232 files**; the nine sibling Fact Sheet suites, `college_briefing`
  (236) and `sierra_surfaces_aligned` (42) all green.

⚠️ **Two of my own checks were wrong before the code was.** The overlap detector
compared only the x-axis, which is a false positive the moment the row stacks (name
on row 1, figures on row 2 — they share x and never y); and the "no text uses
`--mustard-fill`" regex was unanchored, so it matched `outline-color`. Both cost a
debugging round. **When a new check fails, suspect the check.**

### Rule 8's *query* half earned its keep — the repo already knew one of these

⭐ **`cpl_memory` already held the `[hidden]` defect, written six days earlier by a
different session about a different file.** `an-author-display-rule-defeats-the-hidden-attribute`
(Sky155, 2026-08-14, from Sierra's note composer) says it exactly: *"Any element
toggled with `hidden` needs an explicit `[hidden]{display:none}` companion beside
its display rule."* I rediscovered it from scratch on `.btn`.

That row was `proposed`; an independent second instance is corroboration, so it is
now **`verified`** and carries this case. It is the **third** in the family —
Sierra's composer (#1185), the EACR `.sw-interactive` overflow clipping dropdowns
into a sliver (#1174), and this. Three instances is a house rule, not a run of bad
luck: **a class that sets `display` must carry its own `[hidden]` companion**, and
when the element ships hidden that companion belongs in the **stylesheet**, not a
JS-injected block, or it flashes before boot.

⚠️ The cost of not querying is small and recurring — twenty minutes here — which is
exactly why it keeps happening. Rule 8 gives the table *ingest*; the query is the
part a session has to choose to do.

### Small ones worth keeping

- ⚠️ `*/` **inside a block comment ends the comment.** Documenting the browser path
  as `chromium-*/chrome-linux` silently terminated the file's header docstring and
  produced a syntax error 20 lines later.
- The sandbox is **egress-blocked from `cpl-initiative.github.io`**, so no session
  can verify the live page. Pages deployed green and `fact-sheet/` is served straight
  from the repo with no build step, but the live check is Sam's to make.

### Next

Nothing is blocked. Open items, in value order: ① **Sam opens the Fact Sheet on his
phone** — the mobile rework is the part no session can confirm; ② confirm Curate
appears after signing in on COBI (the cross-tab session path is the piece that was
reasoned rather than clicked); ③ the same measurement harness pointed at
**`sierra/`** and the **veteran-sprint-map**, which are the other public standalone
pages and have never had a layout audit; ④ if the mobile stack reads well, consider
the same treatment for the other fixed-track grids in COBI.

---

## 2026-08-21 — SkyGlass (Session 176): confirmed on glass, and the reveal that looks like a regression

**(a) What happened.** Sam reported mid-session that **the Curate button was still
visible on the public Fact Sheet**, and asked whether the `cpl_funding.test.js`
memory problem could be the cause. It could not — nothing under `tests/` is
served, and no page loads it. The code was verified correct on `main` (both
halves: `btn.hidden = !isRevealed()` **and** `.btn[hidden]{display:none
!important}`, which is load-bearing because `.btn` sets `display:inline-flex`),
and Pages had deployed #1269 successfully at 20:40 UTC.

Three candidate explanations were put to him in order, and the first was right:

1. **his own browser remembered the reveal** — `?curate=1` deliberately writes
   `localStorage.cpl_fs_curate = "1"` so the bookmark keeps working, which means
   any browser that has opened that link once shows the button **forever**
   (`fact-sheet/?curate=0` forgets it);
2. a live COBI reviewer session, which reveals it by design and, since #1207, does
   so across browser tabs;
3. a cached `factsheet_edit.js` / `factsheet.css` — the tags carry no version
   query, so a hard refresh is the check.

✅ **Sam then opened a private window and confirmed the button is gone.** The
mechanism is now proven **on the deployed page**, not only in Chromium — which
closes the last verification item SkyCurate opened and Sky175 could only exercise
locally.

**(b) The durable bit.** ⭐ **A deliberately sticky reveal will be reported as a
regression by the person it was built for.** The curator is precisely the user
whose browser holds the flag, so the feature's success case and its bug report
look identical from the outside. The only question that distinguishes them is
**"private window, plain URL, no session?"** — and that question now leads the
carryover list rather than sitting in a session's head. Worth remembering the
next time a per-browser convenience gets added to a public page: decide up front
how someone will *disprove* it, and write that down beside the switch.

**(c) State.** No code change. `CLAUDE.md`'s Fact Sheet row records the
confirmation and the rule-out order; the phone pass is the one item still open.

**(d) Next.** ① **Sam opens the three public pages on a phone** (Fact Sheet ·
Sierra · Veteran map) — still the only thing no session can do.
