---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 91 handoff — you are Session 91

You are **Session 91** of the CPL Project Tracker (COBI) build. Session 90
(**SkySherpa**) rebranded the standalone Sierra page header. Pick your own
moniker (Sky/Star streak).

## What SkySherpa shipped (3 PRs, all merged + live on `main`)

A focused visual pass on the **standalone Sierra page** (`sierra/`, the
shareable chat surface added in Session 89, PR #633). Sierra's header now reads
as a clean co-brand lockup on its navy gradient:

- **#635 — CPL Initiative logo replaces the 🏔️ emoji.** Sam uploaded the
  official CPL Initiative logo (white lettering / transparent PNG); cropped to
  content → `sierra/cpl-initiative-logo.png`, placed left of the wordmark with a
  thin white divider. (The upload arrived embedded in the chat transcript, not on
  disk — recovered by parsing the session `.jsonl` for the base64 image block.)
- **#636 — Mt Whitney ridge ghosted behind "Sierra" + tagline.** A hand-traced
  east-face skyline (`sierra/whitney-mark.svg`, single white stroke + a snowcap
  patch) ghosted at 34% behind the wordmark — flat base on the text baseline,
  nudged right so the right slope clears the final "a". Tagline "Your Credit for
  Prior Learning guide" → **"Your CPL Sherpa"** (Whitney is the highest peak in
  the Sierra Nevada; a Sherpa guides you up it). `og:title` matched; SEO `<title>`
  kept "Credit for Prior Learning" spelled out.
- **#637 — tagline trimmed to just "Your CPL Sherpa"** (dropped
  "· California Community Colleges" — already in the logo).

All merged on `unstable` (required Secret-scan/TruffleHog green; js-tests
non-required). `sierra_page.test.js` (18) + `factsheet_sierra.test.js` (29) +
full suite (115 files) all green. Served by the lean Pages deploy (`pages.yml`).

## Read these first (in order)
- `docs/cpl_assistant_lessons.md` (Session 90 section) — the Sierra header
  rebrand + the "recover an upload from the transcript" trick.
- `CLAUDE.md` §7b (the `🏔️ Ask Sierra ↗` rail-launcher bullet now notes the
  header lockup + `sierra/whitney-mark.svg`) · §7c (Sierra / `cpl-chat` v21).
- `docs/session_90_handoff.md` — the Sierra offerings-catalog context you're
  inheriting (still the substantive workstream).

## Priority workstream — finish the CCR/CER recommender (M1)
Unchanged from Session 90: Sierra now has the **offerings** gate ("does the
college even teach it", Session 89's COCI catalog, `cpl-chat` v20/v21). Next:
fold in the **CER credential layer** + **CCR course-identity crosswalk** +
**adoption-leverage / `statewide_prescriptive`** so a request resolves
end-to-end: credential → articulated-where → local course → adoption path.
Scope: `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md` (the
offerings slice is marked SHIPPED; CER/adoption-leverage are the next wire).
Pattern that worked: slim recommendation-shaped dataset → shared Supabase table
(periodic ETL) → parallel lookup + context builder + prompt rule → careful
redeploy of the SHARED `cpl-chat` (capture the live version, keep
`verify_jwt:false`, smoke ALL modes on a runner via `cpl-chat-smoke.yml`).

## Carryover (waiting on Sam, then you)
- **Optional Sierra follow-through:** carry the Whitney mark into the **favicon**
  (currently `../cccco_seal.png`) and/or the **in-chat avatar** (still `🏔️` at
  `sierra/sierra.js:118`) — Sam was offered this and hasn't decided. The mark is
  a reusable ~0.5 KB SVG, so it's a drop-in.
- **Try Sierra** on a detailed trades question (To-Do top item) — tune routing.
- **MAP login URL** for the refresh-nudge link (`map_users.js`).
- **Reference-tab header bands** (CCR/CSR/CER dark-navy sticky headers) — flip light?
- **Public KB PR #15** (Veterans plans) — Sam's sign-off.
- Standing lanes: unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`);
  TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`).

## Patterns that worked (reuse them)
- **Prototype the look, screenshot, iterate with Sam.** Rendered the header
  headless (Chromium via the global playwright at `/opt/node22/lib/node_modules`,
  `require()`d by absolute path from a `.cjs`) at desktop + mobile after each
  tweak — tight feedback loop on a purely visual change.
- **An uploaded image may not hit disk.** A pasted image is visible to the model
  but isn't written to the filesystem; the raw bytes live as a base64 `image`
  block in the session transcript (`/root/.claude/projects/.../<id>.jsonl`).
  Parse it out with python + `base64.b64decode` when you need the file.
- **SVG line-art > raster for a UI mark** — scalable, recolorable, ~0.5 KB, no
  sourcing pipeline. Hand-authored a `<path>` from the photo.
- **A tiny copy change is still a full round-trip** — restart the branch from a
  fresh `origin/main`, CI, merge on green (Secret scan is the only required gate).

## Safety patterns to honor
- **`cpl-chat` is SHARED + LIVE** (map.rccd.edu widget). Any redeploy: capture the
  running version, keep `verify_jwt:false`, smoke all modes on a runner.
- **Rule 4** (`CPL_Dashboard.html` === `index.html` — N/A for the standalone
  `sierra/` files, but never forget it for COBI itself) · **Rule 5** (never
  force-push main) · **Rule 8** (checkpoint). Merge on `unstable` once TruffleHog
  is green.
- **Restart the branch from a freshly-fetched `origin/main` for each new change**
  — the merged-PR branch can't be reused (see the S88 stale-ref gotcha).

## Moniker
Session 90 was **SkySherpa**. Claim your own (Sky/Star streak continues).
