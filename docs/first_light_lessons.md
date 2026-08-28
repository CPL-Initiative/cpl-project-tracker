---
title: First Light — daily plein air art, the theme spec, and the design sprint
created: 2026-06-12
updated: 2026-06-23 (selection-quality pass — the Gamble House swap + the mono reveal-skip)
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

## Session 49 (2026-06-12, Bruh Orbitron) — the retheme SHIPS: 3 PRs, prod repainted same-afternoon

### What shipped

- **#407 — the palette flip.** `:root` in both HTMLs swapped to the spec
  values; legacy navy/gold token NAMES kept as remapped aliases so the
  generator + older CSS converge without a rename (`--gold-accent` → the
  bright `--mustard-on-dark`; `--navy-primary` → ink). Contextual legacy-hex
  sweep (~250 sites): gold-as-text-on-light → `--mustard-text`; gold on dark
  / banner fills → bright mustard with ink text (8.77:1); interactive
  navies/blues → cobalt (+`#003B8E` hover); canvas `fillStyle` + SVG
  presentation attributes get **literal** hexes (var() doesn't resolve
  there). The generator moved in Rule-1 lockstep; the activity progress
  **bar color split from its label color** (a bright bar must never produce
  an unreadable label). `check_contrast.py` grew `--live` (Rule-4 identity +
  spec drift-pins + recomputed AA on worst-case backdrops) wired into
  js-tests; `tests/retheme_tokens.test.js` pins the flip.
- **#408 — glass chrome + the ghosted painting.** `.glass` base +
  `@supports` fallback + `prefers-reduced-transparency`/`contrast` honored;
  masthead/rail/KPI-hero/filter-bar go glass; the KPI band goes transparent
  so the painting shows between floating cards; the dark trend +
  College Activity cards **deliberately stay ink** (data surfaces) — the
  `algo-details` CSS gained a light variant scoped under `.kpi-card` while
  class-less dark cards keep the white-alpha base. `first_light.js` grew
  `.cplfl-bg` (today's pick, grayscale, 10%, fallback gradient, opt-out
  lifts it live) and pinned the dialog to `--surface-opaque`.
- **#410 — glass-quiet chips.** CCR `.uc-badge` + CSR `.cs-badge` (the
  sweep chips) + CER `.cr-chip` family + To-Do FAB. Severity reads in TEXT
  grades on translucent fills; CER's "Generated" moved from pre-spec amber
  to the **violet machine lane**; the FAB became the cobalt primary action.

### Lessons worth remembering

1. **`var()` has hard no-go zones**: canvas `fillStyle`/`strokeStyle`, SVG
   presentation attributes (`stroke=`, `fill=`, `stop-color=`), and mermaid
   classDefs need resolved literals. The scratch-regen diff CAUGHT my
   blanket sed putting `var()` into SVG attrs — regen-diff is a verifier.
2. **One token can't serve two surfaces.** Old gold was text-on-dark AND
   text-on-light; old `--surface` was chrome AND data. The fix is a
   bright/text grade PAIR (`--mustard-fill`/`--mustard-text`) and a
   glass/opaque pair (`--surface`/`--surface-opaque`) — then sweep consumers
   to the right side. Same shape as the bar/label split.
3. **Rebase inverts ours/theirs.** During `git rebase`, `--theirs` = YOUR
   commit. My conflict script assumed merge semantics; the assertion tripped
   and the right outcome happened anyway (my side carried the work). Assert
   loudly in resolution scripts — silent wrong-side picks are the danger.
4. **Mid-flight cron conflicts self-heal via converge-by-regen**: when the
   dispatched daily run races a styleblock PR, take the side carrying the
   CSS work, let the post-merge dispatch republish data freshness. Never
   hand-merge a generated 14.5k-line HTML.
5. **Sibling sessions interleave on main now** (the fold #409 landed
   between my rebases and even fixed a data-fixture test under me).
   `git fetch` + rebase before every push; expect `mergeable_state` to
   wobble (`unknown` → `unstable`); merge on `unstable` per policy.
6. **The !important uniform-header block earned its keep** — the masthead
   flipped dark→glass with ZERO generator edits because the Session-34
   override layer already owned every generator-emitted header item.

### Current state / next steps (the design lane — docs/session_52_handoff.md)

- **Sam's screenshot verdicts** drive the polish pass: chip width (uniform
  6.5rem deliberately NOT applied to dense table cells), the ink data-cards
  (lighten to opaque-light?), ghost-art opacity, glass intensity.
- **kpi_reorder keyboard path** — the conformance gap Sam wants closed
  (drag-drop kept).
- Deferred surfaces: `Dashboard_Element_Map.html`, Word-docx + xlsx export
  branding (different medium — Sam decision), EACR dark-card family,
  per-tab neutral-gray sweeps (CCR/CER slate drift).
- First Light carryover: manifest growth 3 → 60–90, reflections mining,
  the Almanac.

## Session 62 (2026-06-18, SkyLion) — the painting rotation + the reflections digest

Two durable First Light follow-ons (one code-only PR, **#460**), plus the
cross-repo wiring of the long-promised **reflections mining**.

### What shipped (#460)

- **Local-day painting rotation.** The greeting advances the painting by the
  viewer's **local calendar day** with **no day-to-day repeats** — the date seed
  walks the manifest so consecutive days never show the same canvas (a pure
  date-hash could repeat back-to-back as the pool grew). Still one painting per
  day shared across viewers; opt-out + once-per-day guards intact.
- **The weekly reflections digest builder** (`reflections/build_reflections_digest.py`
  + `reflections/README.md`). First Light's anonymous reflections land in
  write-only `cpl_reflections` (no SELECT). This stdlib-only script reads them with
  the **service role**, groups by ISO week, and renders gentle Obsidian-friendly
  "musings" markdown (one `YYYY-Www.md` per week + a rolling `index.md`).

### The privacy spine (don't break it)

- The read side is **server-only** (service role in CI) — never a public SELECT.
  The write-only contract on `cpl_reflections` is preserved.
- The digest carries only **painting + reflection + the calendar day** — never an
  id, IP, or precise timestamp.
- Output is **gitignored in this public repo** (`reflections_out/` default) and is
  bound for the **private `cpl-knowledge-base` vault** only. The words never touch
  the public tracker.
- **Fail-soft:** no `SUPABASE_SERVICE_KEY` / HTTP error / blocked network → prints
  a notice, exits 0. It pre-stages cleanly before the secret exists and never
  reddens a workflow.

### Wiring (delegated)

The end-to-end automation lives in **`cpl-knowledge-base`** (a weekly GitHub Action
that runs the script + commits `musings/`), so reflection text only ever lands in
the private vault. SkyLion wrote a paste-able prompt for a sibling
`cpl-knowledge-base` session to stand it up; the one human step is Sam adding
`SUPABASE_SERVICE_KEY` (the service-role key for `hvuwhnbuahrtptokpqfh`) to that
repo's Actions secrets. Pattern distilled in the new KB note
`docs/kb-notes/playbook-write-only-table-private-vault-digest.md`.

### Next steps

- ~~Manifest growth 3 → 60–90 paintings~~ — **DONE Session 65 (3 → 89).**
- The reflections **themes card** (the original "uplifting themes" idea) once a few
  weeks of musings exist — a service-role read → aggregate themes, same spine.
- ~~The Almanac (past-paintings gallery).~~ **Parked — maybe never** (Sam, 2026-06-19:
  "keep them hungry"). The once-a-day scarcity *is* the feature; a browse-all view
  would dilute the daily surprise. Revisit only if asked.

## Session 65 (2026-06-19, Skyloft) — the gallery 3 → 89 + the sourcing pipeline

Sam noticed *The Rendezvous* repeating every 3 days and asked if the rotation was
wired right. **It was** — `localDayNumber()` + `day % N` is correct and never
repeats back-to-back; the pool was just **3 deep**, so the cycle was 3 days.
"Go big" → grew it to **89 verified public-domain works** (PR #474), spanning
California plein air, Sierra/Western landscape, PD photography (Ansel Adams's NARA
set, Watkins, photochromes, the missions, the Gamble House), French & American
Impressionism, Renaissance/Baroque incl. **Caravaggio**, Romantic landscape, and
the iconic **woodblock prints** (Hokusai's Great Wave + Red Fuji, Hiroshige,
Friedrich's Wanderer, Constable's Hay Wain, Cole's Oxbow). Round-robin interleaved
so consecutive days alternate California ↔ world. Ghost background nudged .10 → .14.

### What shipped (PR #474)

- **A runner-as-Commons-proxy sourcing pipeline** — the durable win, distilled in
  the new KB note [[docs/kb-notes/playbook-runner-as-external-api-proxy]]. The agent
  sandbox can't reach Wikimedia (egress allowlist + WebFetch 403), so a
  push-triggered workflow (`.github/workflows/first-light-art.yml`) runs
  `tools/source_first_light_art.mjs` on a runner to pull **exact** PD/CC0 filenames
  from the Commons API (hard license filter; depth-1 subcategory recursion so
  container categories like *Paintings by Claude Monet* resolve; bounded
  concurrency) and **verifies every manifest image URL exists**, committing the
  reports back for the agent to `git`-pull.
- **`tools/build_first_light_manifest.mjs`** — assembles the `PAINTINGS` array from
  a curated `tools/first_light_selection.json`, copying each `img` URL **straight
  from the verified pool** so no filename is ever hand-typed (build fails loud on
  an unknown file).
- **Six parallel curation subagents** — one per theme, each read the candidate
  pool, picked the gorgeous full works (skipping the noise — crops/"Ausschnitt",
  stamps, scan-date `year`), wrote our-own-words prose + alt text. 83 picks, 0
  validation problems. (Then +6 icons via the additive `extras` path → 89.)

### Lessons worth remembering

1. **"Wired right" ≠ "behaving right."** The rotation logic was perfect; the
   *content pool* was the bug. Check the data depth before the algorithm.
2. **Verify existence via the API, not the CDN.** Looping image GETs tripped
   Commons' rate limit (HTTP 429 — a false "broken"); one batched `imageinfo`
   call is gentle + authoritative. (KB note.)
3. **Append, don't regenerate, to protect curated selections.** The `extras` path
   adds specific files to the existing pool; a full re-source with
   non-deterministic per-category capping could drop an already-picked file.
4. **Subagents are great for fan-out curation + prose** when you hand them the
   authoritative key (the exact `file`) and a strict style spec + anti-noise
   rules; a builder that validates filenames is the safety net.
5. **The PD filter is the firewall.** Sourcing by *category* pulls mixed
   licensing; the hard "Commons declares it PD/CC0" gate is what makes
   broad categories (even "Craftsman architecture") safe — and kept Ansel Adams
   strictly to the public-domain NARA set.

### Next steps (First Light)

- Reflections themes card (unchanged; needs a few weeks of musings).
- Manifest is now easy to grow: add a category to `tools/art_categories.json`
  (or a file to `tools/art_extra_files.json`) + bump the trigger → curate the new
  candidates → rebuild. Turner/Raphael/Bruegel/Metcalf came back empty this pass
  (deeper nesting) — easy adds if wanted.

## 2026-06-23 — Selection-quality pass: the Gamble House swap, the mono reveal-skip, + a private reviewer almanac

Sam flagged a daily greeting: a murky B&W photo of the Gamble House **garden /
water terrace** whose blurb described the **house** — image and prose didn't
match, and it wasn't lovely. His bar, stated plainly: *"B&W is fine as long as
it's lovely"* + *"would love a pic of the actual Gamble House."*

### Two root causes

1. **The signature grayscale→color reveal is a no-op on a B&W image** — it fades
   from B&W to B&W. Seven entries are `mono:true` (the Adams NARA set, Watkins ×2,
   two missions, the Gamble House), and the **`mono` flag was DEAD**: authored in
   the selection file, copied into the manifest, **never read** by `first_light.js`.
   A quality flag that nothing consumes *looks* like a guardrail but isn't — worse
   than no flag, because it lulls you. The Gamble House was exactly the failure it
   should have caught.
2. **Blurb/image drift** — the title said "Garden Front," the image was the garden,
   the blurb led with the house. The blurb must describe the image actually shown.

### What shipped (code-only PR; gallery stays 89 — a swap, not a cut)

- **Swapped the Gamble image → the actual house**: Frances Benjamin Johnston's
  *"View to sleeping porch"* (LoC, LCCN00651250, 1917) — same photographer/credit,
  the house's iconic cantilevered sleeping porches; rewrote the blurb's middle
  sentence + the alt to match. **Alternate on file** (one-line swap if a *color*
  full-house view is preferred): the modern NARA *"Arroyo Seco — Gamble House"*
  (7717021), captioned the "internationally famed icon" of the Craftsman style.
- **Made `mono` load-bearing**: `.cplfl-overlay.open .cplfl-art img.cplfl-mono
  {filter:none;transition:none}` + a class toggle in `fill()`. The 7 B&W prints now
  show at full fidelity with **no dead fade** instead of animating nothing.
- **Build guard** (`build_first_light_manifest.mjs`): an entry whose **alt** reads
  black-and-white but lacks `mono:true` fails the build. Scans the *alt* (a literal
  image description), NOT the blurb — Remington's "near-monochrome palette" nocturne
  is a color painting and must not trip it (verified: alt-only ⇒ 0 mismatches over
  all 89). Loveliness stays a human call; the guard only enforces the mechanical
  reveal-skip contract.
- Kept the **Mission San Juan Capistrano** B&W — my "murky" was a blind guess (the
  sandbox can't reach Wikimedia to view it), and loveliness is the bar. Easy to swap
  to the iconic campanario/belfry shot (CHS-719) or front view (CHS-1292) if wanted.
- Tests (`tests/first_light.test.js`): no un-flagged B&W ships, lovely B&W is
  retained, the reveal-skip wiring exists, + the almanac open/step/keys/no-consume.

### A private reviewer almanac (the "hidden button only I know about")

Sam wanted to flip through the whole catalog to QA it without turning First Light
into a public browse-all (which would dilute the daily surprise — "keep them
hungry," parked since Session 62). The answer: a **hidden** review mode.

- **Hidden entry: type `almanac`** anywhere on the dashboard (outside a text
  field — the listener ignores INPUT/TEXTAREA/SELECT/contentEditable and any
  modifier chord). No visible affordance, works regardless of how the painting is
  normally opened (Session 68 moved that to the masthead ℹ-About `#cobiPaintingLink`,
  so a chip-based trigger would've been fragile). `window.CPL_FIRST_LIGHT.openReview()`
  is the programmatic entry.
- In review mode the dialog grows **‹ Prev / Next ›** buttons + an **"N / 89"
  counter**, **← / →** flip, and the daily-greeting bits (reflection box, opt-out,
  "Begin the day") are hidden — it's a QA view, not the morning greeting.
- **A review pass does NOT stamp `seen`** (`close()` only stamps when
  `!reviewMode`), so QA-ing the catalog never robs you of that day's real greeting.

Because the trigger is hidden, it's documented here + in `CLAUDE.md` (a hidden
feature nobody can rediscover is a feature you've lost).

### Lesson

A curation **flag nobody reads is a latent bug**, not a safeguard — wire it or
delete it. And "lovely" is the real bar (not color-vs-B&W): the fix is a *quality
gate + a better image*, not a blanket "drop the photos."
