# Session 90 handoff — you are Session 90

You are **Session 90** of the CPL Project Tracker (COBI) build. Session 89
(**SkyMiles**) taught Sierra (the CPL Assistant) to see what each college
*teaches*. Pick your own moniker (Sky/Star streak).

## What SkyMiles shipped (PR #631, merged + live)

**Sierra now reasons about the COCI course/program catalog, not just earned exhibits.**
The shared `cpl-chat` function could search only `chatbox_exhibits` (what colleges
have *already articulated*), so it couldn't answer the Boys & Girls Club / NCCER
case — "LA Harbor hasn't articulated NCCER; does it TEACH construction? if not,
which nearby college does?" (LA Harbor: **0** construction-crafts courses; El
Camino **25**; Long Beach City **14**).

- **New public Supabase catalog** (§8): `coci_college_offerings` (16,097
  `college × TOP-program` rollups), `coci_college_programs` (22,335 awards),
  `college_geo` (120 colleges → region/county). Built by
  `chatbox/build_coci_offerings.py` from `kb/reference/coci_course_list.xlsx` + the
  COCI program export; loaded by runner sync `chatbox/sync_coci_offerings.py` +
  `.github/workflows/coci-offerings-sync.yml` (push + dispatch; chunkable
  service-key `*_replace` RPCs). Schema + `search_college_offerings` RPC applied via
  the Supabase MCP.
- **`cpl-chat` v20 ACTIVE** (`verify_jwt` still false): 5th parallel lookup
  `searchCollegeOfferings()` → relevance-ranked RPC (TOP-title weighted A over the
  course-title blob D); `buildOfferingsContext()` (core-vs-tangential match +
  nearest-college ranking via `fetchCollegeGeo`/`college_geo`); `OFFERINGS_RULE`
  adoption prompt. Construction-trade synonyms added, kept tight for precision.
- Smoke modes 7 (LA Harbor NCCER → route to El Camino/Trade-Tech/Rio Hondo) + 8
  (who teaches construction) — green on v20.

## Read these first (in order)
- `docs/cpl_assistant_lessons.md` (Session 89 section) — the full story + the
  relevance-ranking / core-gating lessons.
- `CLAUDE.md` §7c (the offerings-catalog bullet + v20) · §8 (the 3 new tables) ·
  §11 (Session 89).
- `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md` — the offerings
  slice is now marked SHIPPED; the CER/adoption-leverage layers are the next wire.

## Priority workstream — finish the CCR/CER recommender (M1)
Sierra now has the **offerings** gate ("does the college even teach it"). Next:
fold in the **CER credential layer** + **CCR course-identity crosswalk** +
**adoption-leverage / `statewide_prescriptive`** so a request resolves end-to-end:
credential → articulated-where → local course → adoption path. Same pattern that
worked here: land a slim recommendation-shaped dataset into a shared Supabase table
(daily/periodic ETL), add a parallel lookup + context builder + prompt rule, careful
redeploy of the SHARED function (capture the live version, keep `verify_jwt:false`,
smoke all modes on a runner).

## Carryover (waiting on Sam, then you)
- **Try Sierra** on a detailed trades question (the To-Do feed's top item) — tune
  wording/routing from what he sees.
- **MAP login URL** for the refresh-nudge link (`map_users.js` / the sync).
- **Reference-tab header bands** (CCR/CSR/CER dark-navy sticky headers) — flip light?
- **Public KB PR #15** (Veterans plans) — Sam's sign-off.
- Standing lanes: unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`);
  TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`).

## Patterns that worked (reuse them)
- **Two data layers, two questions.** Exhibits = already articulated; offerings =
  what's taught. Adoption reasoning needs both (teaches + no exhibit = the opening).
- **Rank a full-text catalog by relevance, not size.** `ts_rank` with the clean
  discipline label (TOP-program title) weighted A over the course-title blob D —
  else big departments that merely mention a keyword win. Keep the WHERE on the
  indexed unweighted expression for a fast GIN prefilter.
- **Core-vs-tangential gating + tight synonyms** beat broad recall for precision.
- **Runner-as-proxy for bulk load (public data → push trigger OK), MCP for schema
  + verification.** Chunkable `*_replace(jsonb, p_truncate)` — truncate on chunk 1
  only. Verify the search RPC with `execute_sql` BEFORE deploying the function.
- **A committed smoke test earns its keep immediately** — it caught that a
  multi-turn (`history:[]`) query correctly ASKS a follow-up instead of dumping the
  list (test the single-turn production path for deterministic routing assertions).

## Safety patterns to honor
- **`cpl-chat` is SHARED + LIVE** (map.rccd.edu widget). Any redeploy: capture the
  running version (rollback = `origin/main` index.ts), keep `verify_jwt:false`,
  smoke all modes on a runner (`chatbox/smoke_test.sh` via `cpl-chat-smoke.yml`).
- **Rule 4** (`CPL_Dashboard.html` === `index.html`) · **Rule 5** (never force-push
  main) · **Rule 8** (checkpoint). Merge on `unstable` once the required check
  (TruffleHog) is green — the smoke + js-tests are non-required.
- Branch hygiene: restart from a fresh `origin/main` for each new change.

## Moniker
Session 89 was **SkyMiles**. Claim your own (Sky/Star streak continues).
