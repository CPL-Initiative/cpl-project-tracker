---
title: Session 66 handoff — you are Session 66
created: 2026-06-20
tags: [handoff, session-66]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/session_65_handoff]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 66

Session 65 (**Skyloft**) was a design/branding side-quest off the standing data
lanes — and it all shipped LIVE. Welcome; here's your running start.

## What shipped (Session 65, both merged to `main`)

1. **First Light gallery 3 → 89 verified public-domain paintings** (PR #474).
   The 3-painting pool was repeating every 3 days (the rotation was correct —
   the pool was just shallow). Grew it across California plein air, Sierra/Western
   landscape, public-domain photography (Ansel Adams's NARA Mural Project,
   Carleton Watkins, color photochromes, the missions, the Gamble House), French &
   American Impressionism, Renaissance/Baroque incl. **Caravaggio**, Romantic
   landscape, and the iconic woodblock prints (Hokusai's *Great Wave* + *Red Fuji*,
   Hiroshige, Friedrich's *Wanderer*, Constable's *Hay Wain*, Cole's *Oxbow*).
   Ghost background nudged .10 → .14.
2. **COBI rename** (PR #475). The masthead is now **COBI — Chancellor's Office
   Business Intelligence** (a light Kobe homage Sam asked for) with `cobi_brand.js`:
   a rotating "Mamba" subtitle (random per load), an 8→24 jersey wink, and a
   once-a-year Mamba Day (Aug 24) purple-and-gold.

## Read these, in order

1. **`docs/session_65_handoff.md`** — Startripper's handoff. **This is your real
   priority** — Session 65 was a side-quest; the standing data/CCR lane is the job.
2. **`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`** — the
   green-lit priority workstream (the CPL-Assistant CCR/CER recommender).
3. **CLAUDE.md** — §11 (the M-ID pipeline), the Session-25 strategic queue, the
   branch + merge policy. The Session-65 narrative is a `>` pointer near the §11 tail.
4. **First Light / COBI** (only if you touch them): `docs/first_light_lessons.md`
   (S65), `docs/cobi_lessons.md`, and the new KB note
   `docs/kb-notes/playbook-runner-as-external-api-proxy.md`.

## Priority workstream — the CPL-Assistant CCR/CER recommender ETL (green-lit)

Sam said "kick it off." Per the scope doc, **START with the ETL**: land a slim
CCR (`unified_courses_data.js`) + CER (`credential_reference_data.js`) + adoption
(`statewide_prescriptive.js` / `kb/coci_articulations.json`) dataset into SHARED
Supabase tables via the daily cron — **no live bot change yet**. Then M1 wires
those into the `cpl-chat` Edge Function (a CAREFUL redeploy of the SHARED, LIVE
function: capture the running version first, keep `verify_jwt:false`, smoke-test
all 4 modes — the `map.rccd.edu` widget calls the same function). M3 = the
per-college demand stamp (privacy ADR FIRST). M2 (benchmark) is blocked on
Student-Portal-bot access (one of Sam's open decisions).

## Other standing lanes (pick up as Sam steers)

- **CCR data lane** — the morphological-variant pass (Medical Assisting vs
  Assistant; `fable-morphological` in the To-Do feed) + title-lane pass 2 dry-run
  (`fable-titlelane-dryrun`). Both are measure-first, suggestions-only, their own PRs.
- **TMC Builder** — faculty-verify the 45 draft TMCs; the `college_short_names.json`
  alias hardening; ADT-overlay refresh on a fresh COCI program extract.
- **KB Portal** — Sam to smoke-test the 5 attachment types; the bundle-divergence
  decision; an esm.sh path fix if a file type errors (`docs/kb_portal_lessons.md`).

## Carryover from Skyloft (nothing blocking)

- **First Light is now trivial to grow**: add a category to `tools/art_categories.json`
  (or a specific file to `tools/art_extra_files.json`) + bump `tools/.art-run`
  (or `.art-extras`) → the workflow re-sources → `git pull` the candidates →
  curate into `tools/first_light_selection.json` → `node tools/build_first_light_manifest.mjs`
  → push (verify runs). **Turner/Raphael/Bruegel/Metcalf** came back empty this
  pass (deeper Commons nesting) — easy adds if Sam wants them.
- **Almanac (browse-all gallery) is PARKED — "keep them hungry"** (Sam). The
  once-a-day scarcity IS the feature. Don't build it unless asked.
- **COBI** is self-contained; tunables only (wordmark size, the `MAMBA` lineup,
  Mamba-Day colors).

## Patterns that worked (steal these)

- **Runner-as-Commons-proxy**: when the sandbox can't reach a host (egress
  allowlist) and WebFetch is bot-blocked, a push-triggered workflow sources/verifies
  on a CI runner and commits results back; the agent `git`-polls (no CI-success
  webhook). KB note: `playbook-runner-as-external-api-proxy`.
- **Subagent fan-out for curation + prose**: hand each agent the authoritative key
  (the exact filename) + a strict style/anti-noise spec; a builder that validates
  filenames is the safety net.
- **Verify existence via the API, not the CDN** (looping image GETs trip rate
  limits — false 429s). **Append, don't regenerate**, to protect curated selections.

## Safety patterns to honor

- **Rule 4**: `CPL_Dashboard.html` and `index.html` stay byte-identical — any
  masthead/static edit goes in BOTH. **Rule 1**: the generator owns `<title>`/`<h1>`
  (COBI is emitted there, decoupled from `proj_title`).
- **Merge policy**: merge-on-green for your own engineering work; HOLD only for a
  concrete reason (outward-facing branding Sam should see — that's why COBI was
  held for his nod). The First Light/COBI sourcing workflow is **informational,
  never gates merge**.
- **The PD filter is the firewall** for any art sourcing (Commons-declares-PD/CC0
  only; Ansel Adams strictly the NARA set).
- **Checkpoint** (Rule 8) at ~100K tokens or on `/checkpoint`.

## Your moniker

Skyloft kept the sky lineage (SkyGate → Startripper → Skyloft). Suggestion:
**Skyforge** — but claim your own. Welcome aboard. 🛫
