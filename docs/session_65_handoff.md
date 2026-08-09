---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 65 handoff — you are Session 65

You are **Session 65** of the CPL Project Tracker. Session 64 (**Bruh Startripper**)
fixed the CPL Assistant outage and kicked off a strategic workstream with Sam. This
is your paste-able cold-start capsule.

## What shipped in Session 64 (2026-06-19)

1. **Fixed the CPL Assistant 502 (PR #471, MERGED + LIVE).** The shared `cpl-chat`
   Edge Function called **`claude-sonnet-4-20250514`**, which Anthropic **retired
   2026-06-15** — so the Anthropic API 404'd and the function's `!anthropicRes.ok`
   guard returned 502 on *every* turn (the CPL Assistant tab **and** the production
   `map.rccd.edu` widget). Swapped to **`claude-sonnet-4-6`** (active Sonnet, the
   documented drop-in), **deployed live as `cpl-chat` v15** via the Supabase MCP
   (`verify_jwt` stays `false`). Verified no other feature is on a retired model
   (the report/portal gens use `claude-sonnet-4-5-20250929` = active; quickstart
   uses Haiku 4.5 = active).
2. **Kicked off the CPL-Assistant CCR/CER workstream (PR #472, MERGED — scope doc).**
   `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`. Sam and I locked
   the decisions; nothing built yet beyond the scope.

## Read these first, in order

1. `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md` — **the new
   workstream's scope + locked decisions + the build ladder.** Read this fully.
2. `docs/cpl_assistant_lessons.md` — Session 64 section (the 502 root-cause + the
   strategic kickoff narrative).
3. `docs/kb-notes/playbook-edge-function-502-retired-model.md` — the durable lesson
   (a shared-function 502 → suspect a retired model id first).
4. `docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md` — the redeploy
   invariants you MUST honor before touching `cpl-chat`.
5. `CLAUDE.md` §7c (CPL Assistant — now reads **v15 ACTIVE**) + §11 Session 64.

## The priority workstream — CPL Assistant as the CCR/CER recommender + benchmark

**The vision (from Sam):** the imminent **MAP Student CPL Portal** (its own bot) is
the student destination. *This* assistant becomes (a) a **real-time-data benchmark**
the portal's bot is measured against, and (b) the **CCR/CER-grounded recommendation
reference** so adoptions across the system get simpler — plus a per-college **demand
signal** surfaced on each college's **CPL Landing Site**.

**Locked decisions (D1–D5 in the scope doc):** benchmark/reference role · demand view
lives on the college CPL Landing Sites · one **shared Supabase source of truth** for
CCR/CER/adoption data · aggregate-only / PII-free coordinator surfaces · RAG-corpus
cleanup folded into M1 (the 41 `cpl_documents` are private-vault-sourced; ~half are
internal — already reachable via the public `map.rccd.edu` widget).

**The build ladder (scope doc):**
1. **ETL** — land a slim, recommendation-shaped CCR/CER/adoption dataset into **shared
   Supabase tables** (extend the daily cron; precedent: `_apply_curation.py`,
   `supabase-rekey.yml`). *No live bot change — start here; it's unblocked.*
2. **M1** — wire CCR (`unified_courses_data.js`) + CER (`credential_reference_data.js`)
   + adoption (`statewide_prescriptive.js` / `kb/coci_articulations.json`) into
   `cpl-chat`'s retrieval + recommendation synthesis; re-point the RAG corpus.
   **Careful redeploy of the shared function.**
3. **M3 capture** — stamp (college, credential, `unmet`, adoption_target) onto a
   demand table (the empty `chat_analysis` table, or a new `cpl_demand_signals`).
   **Privacy ADR first** (reuse `adr-funding-priority-metrics-privacy.md`).
4. **M3 view** — the per-college demand panel on the CPL Landing Site (aggregate,
   suppressed).
5. **M2 benchmark** — battery of inquiries through both bots, scored on a rubric.
   **BLOCKED on portal-bot access.**

**Opportunity captured:** the tracker pulls **both** the dashboard KPIs (already in
the bot) **and** the richer **MAP Custom Reports** (`fetch_custom_report.py`, 9
categories / 151 fields — *not* in the bot). The **College Contacts** category
(fetched-but-unused) is the coordinator-routing source ("who's Diane at FCC"). Wire it
behind a public/coordinator-only/off-limits field classification.

**Open decisions Sam still owes (none block the ETL):** (1) portal-bot stack + access
for M2; (2) landing-site integration mechanics; (3) Custom Reports field
classification. Sam's last word: *"Yes, kick it off."* → the ETL is the green-lit
first build; confirm before the M1 redeploy.

## Carryover lanes (untouched by Session 64 — still open)

Session 64 was a focused bug-fix + strategy session; it did **not** touch the standing
lanes. They carry forward from `docs/session_64_handoff.md` + the To-Do feed:
- **Data/CCR lane:** the morphological-variant pass (Med Assisting/Assistant), the
  🏷 title-lane pass-2 dry-run (on Sam's go), the member-join Jaccard 0.5→0.4 measure.
- **TMC lane:** faculty-verify the 45 draft TMCs, the `college_short_names.json`
  taxonomy follow-up, the ADT-overlay refresh, the C-ID-discrepancy export.
- **KB Portal (Session 63):** Sam to smoke-test the 5 attachment types; the
  bundle-divergence decision; verify the in-browser extractors in the wild.
- **Reflections digest (Session 62):** Sam to add `SUPABASE_SERVICE_KEY` to the
  `cpl-knowledge-base` repo.

## Patterns that worked this session

- **A shared-function 502 = suspect a retired model id FIRST.** The fastest tell:
  `get_logs` shows fast (~1–1.5 s) POST→502 + healthy OPTIONS, and the function emits
  502 only at the Anthropic `!ok` branch. Check the `claude-api` skill's retired-models
  table. (New KB note: `playbook-edge-function-502-retired-model.md`.)
- **Invoke the `claude-api` skill before touching any model id** — it's the source of
  truth for which ids are active/retired; don't trust memory.
- **The egress policy blocks the Supabase host** from the agent's `curl`, but the
  Supabase MCP (`deploy_edge_function`, `get_logs`, `execute_sql`) works — diagnose +
  fix + verify through the MCP, and have Sam browser-smoke-test the live result.
- **Aggregate-only when querying `chat_interactions`** — it's write-only-to-public by
  design; pull counts, never dump raw question text.

## Safety patterns to honor

- `cpl-chat` is **SHARED + LIVE** (the `map.rccd.edu` widget). Per §7c: capture the
  running version first, **`verify_jwt` stays `false`**, smoke-test all 4 modes after
  any redeploy. Deploy is a one-shot via the Supabase MCP — NOT the daily cron.
- Coordinator/landing-site surfaces are **aggregate + PII-free + small-cell-suppressed**.
- Merge-on-green per the branch policy (both PRs this session merged clean). Code-only
  PRs + dispatch the cron for artifacts; don't commit ~100 MB of generated JS.

## Your moniker

Session 64 was **Bruh Startripper** (soaring through the heavens with directional
abandon). Pick your own callsign — the Sky*/Star* lineage is strong lately
(SkyGate, SkyLion, Skymarker, Star Treader, Startripper). Maybe **Bruh Skyforge** or
**Star Cartographer** (you're mapping CCR/CER into the recommender). Make it yours.

— Bruh Startripper, signing off. 🚀
