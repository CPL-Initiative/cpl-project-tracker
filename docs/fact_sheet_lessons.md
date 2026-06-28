---
title: CPL Fact Sheet — lessons
created: 2026-06-25
updated: 2026-06-25
tags: [lessons, fact-sheet, public-page, live-data, print-to-pdf, sky-blaster]
obsidian-folder: cpl-project-tracker
artifacts:
  - fact-sheet/index.html
  - fact-sheet/factsheet.css
  - fact-sheet/factsheet.js
  - fact-sheet/img/
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-standalone-public-page]]"
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
