---
title: "M-ID Lifecycle, Model Curriculum (MC), and the CID/CIDx Pathway (CLAUDE.md offload)"
date: 2026-07-10
tags: [reference, claude-md-offload]
kb-status: internal
obsidian-folder: cpl-project-tracker/docs/reference
related:
  - "[[CLAUDE]]"
---

> **Moved verbatim from `CLAUDE.md` on 2026-07-10 (Session 111 — SkyMighty,
> the pare-down).** This is ALWAYS-CURRENT project memory, not an archive:
> Rule 8 checkpoints update THIS file now. `CLAUDE.md` keeps a stub pointing here.

### The pipeline

```
seed-untouched M-ID (Phase B draft from _seed_coci_minted_mids.py)
  → curator-Verified M-ID (faculty trust signal — UCL Verify in Supabase)
  → MC-ready M-ID (MC slots populated: SLOs, content outline, methods, …)
  → submitted to ASCCC for C-ID / CIDx approval
  → APPROVED → M-ID substituted out for new CID in the Unified Course catalog
              (alias-tracked via the same Rule 7 / re-mint playbook)
```

The auditor identifies M-IDs at each stage and what gates them from the next;
it never drives the substitution itself. Approval is a re-key — the M-ID
disappears from the catalog, the new CID anchor takes its place, and the
old→new alias is preserved in the same manner as the 2026-05-22 re-mint.

### CID vs CIDx — pick your pathway

| Pathway | Approval body | Speed | Notes |
|---|---|---|---|
| **CID** (general C-ID)  | CIAC (CCC + CSU + UC intersegmental) | Slow, hard | UC defaults often dominate and kill candidates |
| **CIDx** (CTE C-ID)     | ASCCC C-ID team only | Fast, easy | Intersegmental agreement not required |

Eventual automation target = **CIDx submission flow** (CTE only). Every M-ID is
*theoretically* eligible to submit (faculty discretion is the gate, not a CTE
flag); the CID-vs-CIDx lane is decided at submission time. The COCI extract
carries a CTE field that will be wired in when the CIDx workflow lands —
deferred for now.

### MC, NOT TMC — the terminology landmine

For M-IDs we say **MC** (Model Curriculum). NOT **TMC** (Transfer Model
Curriculum). The distinction is strategic:

- **TMC** implies **transferability** — which requires intersegmental
  agreement (CIAC), which is the hard/slow lane M-IDs were designed to avoid.
- **MC** is the curriculum package without the transferability claim — the
  bar is lower; faculty + AOs review CPL articulation adoption without the
  angst of UC defaults killing the course.

M-IDs are CPL articulation-adoption signals, full stop. They are NOT a
transferability claim. **Do not reintroduce TMC framing for M-IDs.**

`transferability` and `degree_applicability` are deliberately EXCLUDED from
the `MC_NOT_YET_CAPTURED` slot list in `kb/_row_audit.py`. Adding them back
would reintroduce the UC-defaults trap and undo the angst-removal benefit.

### The Trust-Card auditor — `kb/_row_audit.py`

Read-only auditor over every M-ID + Cluster. Per row, produces a Trust Card:

- **`faculty_trust_score`** ∈ [0,1] — is the row trustworthy enough that a
  discipline faculty member should rely on it to ratify a cross-college
  articulation? Weighted across faculty_fields: discipline (0.30),
  credit_status (0.20), typical_units (0.20), description (0.15),
  top_code (0.10), confidence (0.05).
- **`mc_ready_score`** ∈ [0,1] — is the row a viable MC submission? Sums
  faculty_fields (70% share) + MC slots (30% share, currently all
  `not_yet_captured`). Every row sits well below mc_ready until SLOs land —
  that's the strategic message: MC-readiness is the destination, not the
  current state.
- **Field states:** real / aggregated-unanimous / aggregated-modal /
  aggregated-varied / inferred / curated / seed-untouched / off-scheme /
  missing / conflicting / not_yet_captured.
- **Readiness tiers:** ready (≥0.85) / needs_review (≥0.65) /
  needs_repair (≥0.40) / not_ready.
- **Rule tags + counts (refreshed 2026-06-12 night, Session 51 — after KIN/PE pass 2 + the merge curation; 15,515 parents):**
  - `seed_untouched_discipline` (**10,599**) — Phase B subject_map draft never reviewed (Phase 1a)
  - `subject_collision_signal` (**3**, was 1,206 — **the fold's receipt**: every disciplined M-ID re-keyed to its curator-confirmed canonical SUBJ4 on 2026-06-12, Session 50. The 3 residuals are the cross-discipline curated re-keys — `ARTH M1022` ex-`ARTS M1159`, `BUSI M9038/M9039` ex-`CISC M9029/M9030` — whose BASELINE file discipline (Art / Computer Science) disagrees with the curated one the fold honored; the rule reads baseline, so these are honest, bounded flags. History: 0 → 1,076 (2026-06-09 coarse TOP-division fill) → 1,210 (Session-45 homonym repair) → 1,206 (twins) → **3** (the fold)) — Phase 1e CLOSED
  - `unit_anomaly` (**4,179**, was 4,189) — typical_units represents <50% of member colleges (member-unit variance is high, possible over-merge across different unit-load variants); ~71% of flags are 2-member splits like `[3.0, 0.0]` (credit vs noncredit drift in the same M-ID) (Phase 1c)
  - `member_top_divergence` (**1,253**, was 1,255) — an M-ID's member colleges carry TOP codes spanning ≥2 broad (2-digit) divisions with ≥30% minority share: the **cross-discipline over-merge** detector (a generic title — "Ethics and Leadership", "Undergraduate Research Experience" — minted courses from different program areas under one identity). It closes a real gap: `top_discipline_disagreement` only checks the M-ID's single *representative* TOP, so it missed the case where the *members* diverge but the representative matches (the motivating case lives in the CRIM family). 2-digit division grouping inherently suppresses sister-discipline noise — no SISTER_PAIRS needed. Surfaces for review, not a verdict (TOP codes vary by college). (Phase 1c)
  - `top_discipline_disagreement` (**901** — pass 2; Session 45's homonym repair brought it 960 → 926; was 2,201 before SISTER_PAIRS) — TOP code → different discipline than assigned (Phase 1c)
  - `blank_description` (**1,701**, was 1,704) — Phase 1a
  - `blank_discipline` (**82** — a few Session-45 retractions had no honest re-fill; 1,266 pre-2026-06-09) — Phase 1a; the coarse TOP-division fill cleared the minted-parent blank tail; residual = the no-honest-umbrella divisions
  - `discipline_title_mismatch` (**757** — grew with pass 2: sports-roster titles vs Kinesiology are honest umbrella noise; Session 45 repair brought it 773 → 712) — title shares 0 tokens with assigned discipline AND ≥2 with some other (Phase 1c)
  - `description_discipline_disagreement` (**73**, was 75) — description's safe-phrase set points elsewhere with ≥2 mentions (Phase 1c)
  - `generic_title_concrete_discipline` (44) — title is course-format generic; can't justify a specific discipline (Phase 1c)
  - `mid_id_off_scheme` (**1** — `F M1002`, blank-discipline; unfoldable until disciplined. `N M9001` gained an honest Social Science discipline and folded to `SOCS M9003` in the 2026-06-12 fold) — was 27 pre-2026-05-23
  - `merge_into_orphan` (**0** — preventive infrastructure; fires when a curation `merge_into` points to a target not in courses ∪ singletons ∪ `UC-CUR-*`) (Phase 1c, 2026-05-27)
  - `cluster_blanks_when_aggregatable` (**14** — grew with the smog/worklist merges; each carries an `aggregate_from_members` suggested fix for the parked Phase 1b — at 14 the "build when ≥5 clusters exist" bar is met if curator demand appears), `cluster_id_off_scheme` (0), `uc_cur_ripe_for_promotion` (0) — Phase 1a

- **Score now incorporates per-tag penalties (`TAG_PENALTY_ON_DISCIPLINE` + `TAG_PENALTY_ON_UNITS`).** Each cross-validation tag deducts from its target field's per-field score before the weighted mean (floored at 0). Tags compound: a row firing 3 discipline rules drops materially below a row firing 1, even with the same field states. Penalties: `discipline_title_mismatch` −0.20, `top_discipline_disagreement` −0.15, `description_discipline_disagreement` −0.15, `generic_title_concrete_discipline` −0.20, `member_top_divergence` −0.15 (all dock the `discipline` field); `unit_anomaly` −0.20 (docks the `typical_units` field). Mirrored client-side in `unified_courses.js` for the breakdown tooltip — keep the two in sync.

- **UCL chip + filter wiring (Phase 1b + 1c UX):**
  - Per-row chip: `⚠ N · 0.XX` (tag count + faculty_trust_score), color-graded by score severity — `warn`/red <0.40, `mix`/amber 0.40-0.65, `muted`/gray ≥0.65 (matches `READINESS_TIERS`).
  - Hover tooltip: tag-derived score breakdown (e.g. *"discipline penalized −0.35 (2 signals)"* + per-tag labels). Computed client-side from the summary — no per-field state inlined into `latest.json`.
  - Toolbar `Triage:` dropdown with 8 modes: *Any audit flag*, *3+ findings* (high-confidence misassignment subset — ~246 rows), *Title mismatch*, *TOP mismatch*, *Description mismatch*, *Generic title*, *Seed untouched*, *Cluster issues*.
  - Toolbar `⚠ N rows flagged (audit YYYY-MM-DD)` indicator — live confirmation that the audit overlay is loaded.

**Outputs:**
- `kb/row_audit/latest.json` — slim per-row summaries + full Cluster cards (~2 MB, committed)
- `kb/row_audit/<date>.md` — human report with top-50 cleanup queue (~7 KB, committed)
- `kb/row_audit/<date>.full.json` — full per-row breakdown (~12 MB, gitignored)

Re-runnable, never mutates. Suggested-fix payloads on aggregable Cluster
fields are shaped for `_apply_curation.py` to consume in Phase 1b. Run from
repo root: `python3 kb/_row_audit.py`.

> **The live `### Roadmap` table stays inline in `CLAUDE.md` §11** (refreshed every checkpoint there).

### Session 25 strategic roadmap (approved by Sam, 2026-06-01)

A strategy session locked a forward roadmap beyond Excel retirement. Full specs +
the locked decisions live in [`docs/session_26_handoff.md`](docs/session_26_handoff.md)
("SESSION 26 STRATEGIC QUEUE"); the compact version:

1. **Codebase audit via the built-in `/workflow`** (Sam OK'd using it) — fan
   subagents across the monolith + kb/ + JS + pipeline; one read-only findings
   report (dead code, the **~7-blank-lines/run idempotency bug** in the
   refresh-button injection, perf hotspots, simplification, security). Sam
   green-lights fixes; **no blind refactor**, and **don't** move the daily cron to
   a `/schedule` routine. This is the **Session 26 kickoff**.
2. **KPI card reorder** — ✅ **DONE Session 44 (#377)** on the **headline KPI
   grid** (Sam re-targeted it there for presentation screenshots):
   `kpi_reorder.js`, login-free drag, `localStorage` per-viewer, label-identity
   re-match across regens, ↺ reset. Curated default order (auth-gated, via
   `kpi_order`) stays the later add; Activity-grid extension needs a product
   call (grouped under Goal sub-headers).
3. **Student eligibility counts on the EACR** — data's already in the daily pull;
   **both per-college + deduped-statewide** (Sam's call). **Privacy ADR FIRST** —
   aggregate counts only, **never a StudentID/PII** in any committed/public artifact.
4. **Contacts panel** — Sam chose **WIRE** `View_CollegeContacts` into a per-college
   surface (not drop). Users & Roles stays fetched.
5. **EACR↔CER convergence** — EACR already groups by CE/unified title (Session 8);
   close the gap: apply the CER curator overrides in `_build_statewide_adoption()` +
   add per-local-title college counts to the "Also entered as N variants" disclosure.
6. **Project→Activity consolidation** — Sam chose **fold the project's rich fields
   into the activity card + ARCHIVE the project row** (reversible, never hard-delete).
   Write `docs/kb-notes/playbook-project-activity-consolidation.md` first. ✅ **Substantially
   DONE Session 95 (#652 + follow-up):** the grid no longer duplicates activity-layer rows (the
   Activity card is the single surface and already carried the rich fields); project lifecycle is
   scoped to real work items; no project rows needed archiving. The playbook was superseded by the
   immunity invariant (`docs/project_lifecycle_lessons.md`, 2026-07-02).
7. **EACR card + credit-rec consolidation** (added 2026-06-01, Session 27) — Sam's
   3 asks from the EACR screenshot review: (a) **merge a credential's Local + CCC
   cards into one** (CCC top billing) by dropping `Collaborative Type` from the
   EACR group key; (b) **consolidate the per-college credit-rec list** by
   `(course title, units)` with local course codes inline; (c) a **"Typical award:
   N units (range a–b)" headline** so the list reads as alternatives, not a
   stackable "bucket of CPL". **Generator change, NOT a re-mint** — cards recompute
   from raw MAP rows each run, 0 `_EACR_FLAG` rows to migrate (verified), and
   `_parse_exhibits()` (the "MAP Exhibits" KPI) must move in lockstep on the same
   key. The vision then grew in-session into a **seeker + adoption-engine view**:
   a **CCC-anchored master-detail** card (CCC Collaborative version as the header
   when one exists — *validated "set"*; else a **synthesized "suggested standard"**
   from the modal local award, which doubles as an MC/CIDx candidate per §11 —
   **94% of articulated credentials are local-only**), per-pattern local cards
   (grouped by `(title,units)`, NOT raw college — 21 colleges → ~5 patterns), and
   a **prescriptive layer** giving each college a status (✅ articulated /
   🎯 potential-aligned-course / ○ potential-aligned-program) with a recommended
   local course — `adoption_leverage` already supplies ~**48k** "should-articulate"
   opportunities (413 `over_merged` correctly withheld). Caveat: the M-ID layer is
   fragmented for single-college articulations (CompTIA A+ → 24 M-IDs), so group by
   `(title,units)` now + let EACR fragmentation feed the Suggested-merges worklist.
   **Rebuilds the per-college grid in the project dash as a playground** (Sam: MAP
   Dash changes are heavyweight + must be prioritized far ahead → prototype here,
   promote proven views — and ultimately the CCR/CSR/CER reference data + curation
   procedures — to MAP later) — adds the consolidation MAP's grid lacks via
   **CER** (exhibit-title unification = card grain) + **CCR** (course-title = credit
   recs), both preserving local titles; the CCR crosswalk is the Quick-Adopt
   enabler; wiring CER overrides into the producer = strategic item 5.
   Decisions locked + **4-phase ladder** (PR-1 consolidation → PR-2 Local+CCC merge
   → PR-3 master-detail seeker view → PR-4 prescriptive recommendations) in
   [`docs/kb-notes/eacr-consolidation-scope.md`](docs/kb-notes/eacr-consolidation-scope.md).
   Delivery = a **versioned prototype gallery** (v1 = current table made
   collapsible; stack v2/v3 below — same data, many renderers; graduate the winner)
   hosting **3 audience views: Student** (find/request credit + likely local
   matches), **College** (my articulations + adoption options), **System**
   (inequitable-access map from `adoption_leverage` × eligible-students,
   privacy-ADR-gated). **Session 27 SHIPPED PR-1 → PR-3 + the sort + the gallery
   v2** (see the Session 27 subsection below); **Session 28 SHIPPED PR-4 (the
   prescriptive layer) + the v2-toggle fix** (see the Session 28 subsection).
   **Next = the 3 audience views** (Student/College/System), plus the captured
   backlog (CPL-Type full-merge, CCR/CSR inverse views, curate-the-unclassified).
- **Sidebar levels** (interleave) — add `data-sections` to CCR/CER/CSR/Exhibit-Adoption;
  optional 2nd nesting level where deep. **Excel retirement** (P5 budget factors →
  JSON, then drop the `.xlsx`) continues underneath.

> **Session narratives 26–40 archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md) (sections
> "Archived session narratives"). Only the Session-25 strategic queue (above)
> and the most-recent session (below) stay inline — **Rule 8 keeps it that
> way** (≤2 narratives inline; older ones move to the archive at checkpoint).
> **Consult the archive when** a carryover item, artifact, decision, PR
> number, or "why is it built this way" question traces to an earlier
> session — each archived narrative carries its PR numbers, doc links, and
> locked decisions verbatim. Searching the archive for an id (e.g. "FLSP
> M1379", "#310") is usually faster than re-deriving from code.

> **Session 41 + 42 + 43 + 44 + 45 + 46 + 48 + 49 narratives archived** → `docs/roadmap_archive.md`
> (witness-kinship gate + R4 singletons; the slot-fix + C-ID authority +
> Phase-1 router; Starlord's cron-verify + off-pane-columns fix; Statewide
> Exhibits KPI + program-area categories + KPI reorder; CCR rules day —
> statewide C-ID router #379 + the CADM homonym repair #381 + the
> description-evidence lane #382; the AUTO/smog case — the 🏷 title lane
> #385 + the STATEWIDE twin merge #386; Supernova's SUBJ ⇄ CCR checking +
> To-Do feed + the fold dry-run #388/#389/#402/#405; Glasstronaut's First
> Light design sprint #391–#404 — the daily plein air greeting LIVE + the
> v1.6 glass-quiet theme spec BLESSED).

> **Session 50 + 51 narratives archived** → `docs/roadmap_archive.md` (the SUBJ4
> canonical fold APPLIED — 71,037-alias permutation, receipts
> `kb/subj4_fold_out/2026-06-12/`; KIN/PE pass 2 — PEDU dissolved + TOP-aware
> ATHL carve-out, 1,057 re-keys, `kb/kin_pe_pass2_out/2026-06-12/`).


> **Session 53 narrative archived** → `docs/roadmap_archive.md` (Bruh Infinitus —
> auto-merge pass 1 APPLIED: 2,272 groups / 5,838 rows, cohort
> `reviewer_email='automerge-v1@bot'`, receipts `kb/automerge_out/2026-06-12/`).


> **Session 54 narrative archived** → `docs/roadmap_archive.md` (Bruh Spaceranger —
> the auto-merge cohort made reviewable: `auto_n` stamp + the ⚙ auto-merged chip +
> the "Auto-merged" Triage lane, PR #428; `tests/uc_auto_merged_chip.test.js`).


> **Session 55 narrative archived** → `docs/roadmap_archive.md` (Bruh Nebula —
> Suggested-merges clarity: ★ merge-target badge #434, self-merge ghost fix +
> discipline-picker disable #435, "⌕ merge into a different course" picker #436;
> + the UC-CUR→Z SCOPE decision #437).


> **Session 56 narrative archived** → `docs/roadmap_archive.md` (Star Treader —
> the UC-CUR → Z-scheme re-mint APPLIED: 4,053 synthetic `UC-CUR-AUTO*` →
> `SUBJ Z<band><seq>`, surface entirely inside `kb_curation`, re-keyed via the
> reusable `kb/_rekey_kb_curation_supabase.py` + `supabase-rekey.yml`; suite 48).


> **Session 57 narrative archived** → `docs/roadmap_archive.md` (Bruh Skydriver —
> worklist popup + CCR polish #441; the consolidation loosening #442:
> `_sug_sig` level-SAFE → level-COLLAPSING; "(NC)" cleanup; Jaccard 0.5→0.4
> deferred).


> **Session 58 narrative archived** → `docs/roadmap_archive.md` (Bruh Skyleader —
> Suggested-merges deep refinement: override-rename + segment-fold + `merge_note`
> #445; synonym map + keyword-gather #446; the looseness slider — title-lane
> `COSINE_MIN` 0.62→0.50).

> Sessions 59 (Bruh Star Navicus) + 60 (Bruh Momentus) built the **TMC Builder**
> tab end-to-end (§7d) — no inline §11 narrative; see `docs/tmc_builder_lessons.md`
> + `docs/session_60_handoff.md`.

> **Session 61 narrative archived** → `docs/roadmap_archive.md` (Bruh Skymarker —
> the per-college approved-ADT overlay from the COCI program export #458:
> `tmc_college_adts.js`, 3,238 pairs/115 colleges/99.9% by TOP code, UCTP as its
> own instance, the reference-data-home ADR).

> **Session 62 narrative archived** → `docs/roadmap_archive.md` (SkyLion — First Light
> local-day painting rotation + the weekly reflections digest #460; CCR synonym-map
> growth ECE/EMT/CNA/HVAC/LVN + the ambiguity validator #461). Full story:
> `docs/first_light_lessons.md` + `docs/ccr_cluster_cleanup_lessons.md`.

> **Sessions 63 (SkyGate — the KB Portal end-to-end #464–#468) + 64 (Startripper —
> the retired-model `cpl-chat` 502 fix #471 + the CCR/CER recommender kickoff #472)
> narratives archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 65 narrative (Skyloft) — a design side-quest, both LIVE on `main`:**
> **First Light gallery 3 → 89** verified-PD paintings (PR #474) via a new
> **runner-as-Commons-proxy** sourcing pipeline (the sandbox can't reach
> Wikimedia — a CI runner sources exact PD filenames + verifies image liveness;
> six parallel curation subagents wrote the prose) + the iconic woodblock prints
> (Hokusai's Great Wave, Hiroshige, Friedrich, Constable, Cole); ghost bg
> .10→.14. **COBI rename** (PR #475) — masthead → *COBI: Chancellor's Office
> Business Intelligence* + `cobi_brand.js` (rotating Mamba subtitle, 8→24 wink,
> Mamba Day purple-and-gold). Almanac (browse-all) **parked — "keep them
> hungry."** Full story: `docs/first_light_lessons.md` (S65) +
> `docs/cobi_lessons.md`; pipeline KB note
> `docs/kb-notes/playbook-runner-as-external-api-proxy.md`. **NEXT:
> `docs/session_66_handoff.md`** — the standing data/CCR + TMC + KB-portal lanes resume.

> **Session 66 narrative (Skylander) — TMC → a CO-staff ADT review tool** → archived in
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md) (the Active/Approved COCI status
> split #477; the CO-review scope + ASCCC acceptance ruleset #478; the template
> acceptance metadata #479 — 119 flexible slots + per-TMC flexibility + 15 recovered
> C-IDs, AfAm 0→3). Full story: [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md).

> **Session 67 narrative (Skywatch) — the CPL News lane** → archived in
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md) (the unattended
> `cpl-news-harvest` Edge Function + `#cpl-news` tab #481; CA-first; full story
> [`docs/cpl_news_lessons.md`](docs/cpl_news_lessons.md)).

> **Session 68 narrative (SkyAlizarin) archived** → `docs/roadmap_archive.md`
> (spotty-cron fixes — the 06:17/09:17/12:17 UTC cron ladder #485 + the
> curation-sync transient-TLS resilience guard #486; the COBI masthead → a
> single-row app bar #487, ported regen-safe).

> **Session 69 narrative (Stargaze — TMC title-fill #489/#490 + the CCR polish
> sweep #492/#493/#495/#496 + the unverified-M-ID renumber scope #494) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 70 narrative (PaintSky — the CCR merge-workspace level-up, 9 PRs incl. the
> pending-merges panel #500, re-discipline-on-merge + forward-looking Common SUBJ #503, band
> filters #505, the global Cons↔Aggr slider #506, opt-in checkboxes #507, the morphological fold
> #508/#509) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 71 narrative (the CCR merge-workspace epic — one shared
> `buildMergeEditor`, two feeders; the right-hand docked worklist #511–#518)
> archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 72 narrative (StarLander — the post-consolidation merge-workspace polish pass, 13 PRs
> #520–#534) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/ccr_merge_workspace_lessons.md`](docs/ccr_merge_workspace_lessons.md).

> **Session 74 narrative (SkyBlaster — the public CPL Fact Sheet, PRs #537/#540) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md).

> **Session 77 narrative (StarPort — the RACI update loop end-to-end, 8 PRs #556–#562)
> archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md).

> **Session 78 narrative (SkyMap — posted `item_updates` surface on the card face via the read-only
> `card_updates.js` overlay, PR #564) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md) (Session 78).

> **Session 79 narrative (StarBender — RACI becomes the card's source of truth + statewide Fact Sheet
> recs, PRs #567–#571) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md) + [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md).

> **Session 80 narrative (StarMan — the public Fact Sheet becomes Curate-editable, PR #570) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md) (Session 80).

> **Session 81 narrative (StarFarout — per-row + per-card nudges + "Nudge All" #574; then the Fact Sheet
> Curate arc: add/delete/reorder boxes #576, "My CPL Stories" headless-sourced #577, image add/resize/replace/delete
> via the `factsheet-images` bucket #578 — all on the unchanged `factsheet_overrides` table via reserved key
> namespaces) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md) + [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md).

> **Session 82 narrative (SkyFlyer — Fact Sheet editable-everywhere + a11y + ⬇ Word export, PR #584) archived**
> → full story in [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md) (2026-06-28 sections); KB notes
> `methodology-stable-dom-keys-exclude-live-text.md` + `playbook-standalone-dom-to-word-export.md`.

> **Session 83 narrative (StarNova — CO-platform strategy `docs/co_platform_strategy.md` #586/#588;
> the "Lift Off" plan `kb/liftoff_plan.json` #588/#592; Mission Control `mission_control.js` #590/#592;
> the server-enforced RACI **team-phrase gate** #593 + hardening #595–#598) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/mission_control_lessons.md`](docs/mission_control_lessons.md) +
> [`docs/cobi_raci_nudge_lessons.md`](docs/cobi_raci_nudge_lessons.md).

> **Session 84 narrative (SkyScribe — project soft-delete `project_lifecycle` #600/#605; lean Pages deploy
> `.nojekyll`/`pages.yml` #601/#602; computed Goal+Stretch progress bars #604) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md).

> **Session 85 narrative (SkyLight — Annual Workplan tab = authoritative source: the
> "Current" live/manual hybrid + `projects.name` titles, PR-level code-only) archived** →
> full story `docs/annual_workplan_authoritative_lessons.md` + the reusable
> `docs/kb-notes/methodology-live-vs-manual-hybrid-column.md`.

> **Session 86 narrative (SkyGuy — `kpi_cards.js` shelf #610; live activity-card big numbers; RACI
> update popup; KB team-phrase; the light/glass theme #611; the MAP-Users PII-safe probe #612) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S86).

> **Session 87 narrative (StarMax — card↔KPI breakdown sync #617 + the MAP Users tab
> end-to-end #618–#621 + the nudge follow-up #623–#626) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S87) + [`docs/map_users_tab_scope.md`](docs/map_users_tab_scope.md).

> **Session 88 narrative (SkyThru — CCC-metric match · MIL/JST + Veteran Star · About-box
> z-index · MAP-Users 3 fields, PRs #628/#629) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S88).

> **Session 89 narrative (SkyMiles — Sierra sees what colleges TEACH: the COCI
> offerings catalog `coci_college_offerings`/`coci_college_programs`/`college_geo` +
> `cpl-chat` v20, PR #631) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (Session 89).

> **Session 90 narrative (SkySherpa — the standalone Sierra page brand: CPL logo
> lockup + the Whitney mark + "Your CPL Sherpa", PRs #635–#637) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (Session 90).

> **Session 91 narrative (SkyGOAT — both C-ID authorities unioned into the TMC right side #639 +
> the visual-PDF-read "OR" alternatives #640) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md).

> **Session 92 narratives (StarFab — the c-id.net join ladder #642 + the CONFIDENCE ENGINE +
> `docs/kb-notes/reference-tmc-confidence-data-requirements.md`; StarLab — audience selector +
> 👍/👎 feedback, cpl-chat v22/v23 #644 + `docs/sierra_training_tab_scope.md`) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full stories:
> [`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) + [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md).

> **Session 93 narrative (SkyReach — the CPR retrieval miss fixed, cpl-chat v24 #646 +
> the Sierra Training tab #647) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (S93).

> **Session 94 narrative (SkySierra — Sierra mark + chat markdown + Training P1
> #649/#650 + the GUIDANCE layer, cpl-chat v26 #651) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> [`docs/cpl_assistant_lessons.md`](docs/cpl_assistant_lessons.md) (S94).

> **Session 95 narrative (the Activity ⇄ Project separation + the Archive-radio fix) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: `docs/project_lifecycle_lessons.md`.

> **Session 96 narrative (SkyPress — report generators go live-data + the attach handoff) archived**
> → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S96).

> **CCR Convergence kickoff narrative (MindMeld — doctrine + voice mind-meld + 78-group calibration,
> 2026-07-03) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md). **STILL THE ACTIVE
> CCR LANE:** Sam's voice pass → distill Doctrine v1 → batch pass 2 + ESL packaging per
> [`docs/ccr_convergence_handoff.md`](docs/ccr_convergence_handoff.md); full story
> `docs/ccr_convergence_lessons.md`.

> **Session 97 narrative (BigSky — Activities tab optimization + reports consolidation,
> the Elevation slider + Master-Report absorb + nav groups) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story: `docs/cobi_lessons.md` (S97).

> **Session 98 narrative (the Implementation Funding rework — Chancellor-facing
> scenario tool, PR #663) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/cpl_funding_lessons.md` (Session 2).

> **Session 100 narrative (SkyVault — the CER triage loop unstuck: token-refresh trio, SUPERSEDE/STALE
> fold lanes, queue → 0, cron fold+audit) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07).

> **Session 101 narrative (SkyAnchor — COS authority LIVE + triage QA + the AP fold) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 3").

> **Session 102 narrative (SkySeed — the brand-family pre-seed, 158 of 451 applied) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 5").


> **Session 103 narrative (Bruh SkyWay — the STAGED pre-seed + triage toggle + issuer
> authority sources) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 6").

> **Session 104 narrative (Bruh SkyTime — the statewide-catalog pass: 97 of the last 100
> staged + college chips + multi-issuer) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 7").

> **Session 105 narrative (SkyClose — the truncated-read fix + the missing-issuer
> lane + the seal-blue pass) archived** → [`docs/roadmap_archive.md`](docs/roadmap_archive.md).
> Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-08 "continued 8").

> **Session 106 narrative (SkySeal — the Triage rules day: 5f / 5c-mech / 5g + four
> new issuer lanes + multi-issuer, PRs #690–#695) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> `docs/exhibit_canonicalization_lessons.md` (2026-07-08 "continued 9"–"continued 11 addendum").

> **Session 107 narrative (SkyKey — the PR-5b re-key LIVE: 49 renames applied, the
> confirm-merge lane #698, unlimited ＋ agencies #699, hs-generic/ase-align #702,
> 🔎/✨ issuer lookup #701, the push-race fix #700) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> `docs/exhibit_canonicalization_lessons.md` ("continued 12").

> **Session 108 narrative (SkyPhilo — COCI code-titles #707 · the HS rule #710 ·
> the bulk-CCC close-out #711; queue 1,036 → 233) archived** →
> [`docs/roadmap_archive.md`](docs/roadmap_archive.md). Full story:
> `docs/exhibit_canonicalization_lessons.md` ("continued 14"–"15 + addendum").


## M-ID structural invariants and the re-mint record

> **Relocated verbatim from `CLAUDE.md` Rule 7 on 2026-08-29** (Session 208).
> Rule 7 keeps the PUSH half — the staging-phase posture, "never re-mint
> casually", and the TOP caveat. Everything below is **PULL**: you read it when
> you are re-minting, which you already know you are doing. Only the three-space
> rule-body indent was removed; no other byte changed.
>
> ⚠️ These are **enforced at every re-mint; deviations become audit findings.**

**M-ID structural invariants** (enforced at every re-mint; deviations
become audit findings):
- SUBJ portion is exactly **4 letters**. The single-letter SUBJ
  artifacts (`A M1001`, `F M1001`, …) were folded by the 2026-06-12
  canonical fold; residue = **1** (`F M1002`, blank-discipline —
  unfoldable until disciplined; `mid_id_off_scheme` tracks it).
- Within `id_system == "M-ID"`, **all rows sharing a *corroborated*
  `discipline` share a SUBJ4** (TOP-only-disciplined rows wait for
  corroboration before folding/voting — see the TOP caveat above) —
  **ENFORCED 2026-06-12 (Session 50): the canonical
  fold re-keyed every disciplined M-ID to its curator-confirmed
  canonical** (e.g. the 10 "Sign Language, American" variants → `SLNA`).
  `subject_collision_signal` is the steady-state watchdog (3 documented
  residuals = cross-discipline curated re-keys whose BASELINE file
  discipline disagrees with the curated one — honest flags, not defects).
- **Umbrella-discipline exception (2026-06-09, Session 37).** One MQ
  discipline that is genuinely a *parent over many distinct subjects*
  splits its SUBJ4 per subject — the invariant becomes *one **SUBJECT**
  → one SUBJ4*. Two umbrellas today: **"Foreign Languages"** —
  its 1,452 identities re-keyed `FLNG` → per-language `FL**` (FLSP
  Spanish · FLFR French · FLCH Chinese · …) while the **MQ discipline
  stays "Foreign Languages"** (authoritative MQ has no per-language
  discipline) — and **"Kinesiology"** (2026-06-10, the KIN/PE
  convergence): spans `KINE` (instruction) + `ATHL` (intercollegiate
  athletics). Umbrella disciplines are listed in `UMBRELLA_DISCIPLINES`
  (`kb/_row_audit.py`) and are **exempt from `subject_collision_signal`**
  (they're *supposed* to span many SUBJ4s). Scopes:
  [`docs/fl_subj4_remint_scope.md`](docs/fl_subj4_remint_scope.md) ·
  [`docs/kin_pe_convergence_scope.md`](docs/kin_pe_convergence_scope.md);
  map: `kb/foreign_language_subj4.json`; applies: `kb/_apply_fl_subj4_remint.py`,
  `kb/_apply_kin_pe_convergence.py`.
- **Fan-in convergence (2026-06-10).** The inverse of the umbrella: two MQ
  discipline *names* for one converging field fold to a canonical name, the
  other recorded as an **alternate name** in `kb/discipline_aliases.json`
  (never deleted from the MQ vocab). Applied: **Kinesiology ⟵ Physical
  Education** (+ carve-outs `ATHL`/`PEDS` — "Physical Education Disabled
  Students" is its own MQ + SUBJ4) and **Drama/Theater Arts ⟵ Theater
  Arts** (SUBJ4 `THEA`). Both parent + singleton layers converged; alias
  receipts under `kb/kin_pe_out/`, `kb/drama_theater_out/`,
  `kb/convergence_singletons_out/`.
- **C-IDs and CCN-IDs preserve their official format** — they're
  external authorities with variable lengths (`ANTH 100`, `AG-PS 104`,
  `ANTH C1000`). Never re-key.
- New M-IDs minted by `_seed_coci_minted_mids.py` (or curator
  consolidation via the Suggested-merges worklist) consult
  `kb/discipline_canonical_subj4.json` (live — 146 disciplines, all
  curator-reviewed; synced from Supabase `_CANON_SUBJ4::` picks) for
  the canonical SUBJ4 per discipline. (The MQ vocabulary
  `kb/reference/mq_disciplines.json` is the broader 248-title superset —
  re-discipline proposals must be exact-MQ-name; Session 112, #746.)

Authoritative old→new aliases for every re-mint live at
`kb/remint_out/<date>/alias_map.json`. Rollback notes per the playbook.

The 2026-05-22 `CourseControlNumber` re-mint (PR #84) was the first
instance of this playbook in production. Old `M-ID SUBJ NNN` keys are
dead — those aliases preserved in `kb/remint_out/alias_map.json`. Full
decisions + validation methodology:
[`docs/coursecontrolnumber_remint.md`](docs/coursecontrolnumber_remint.md).
Latest instance: the **UC-CUR → Z-scheme re-mint** (Session 56, 2026-06-15 —
the 4,053 synthetic `UC-CUR-AUTO*` unified-course ids → `SUBJ Z<band><seq:03d>`,
e.g. `BIOL Z9001`; dry-run `kb/_uc_cur_zscheme_dryrun.py` + apply
`kb/_uc_cur_zscheme_apply.py` share `compute_plan()`, receipts
`kb/uc_cur_zscheme_out/2026-06-15/`, scope
[`docs/uc_cur_zscheme_remint_scope.md`](docs/uc_cur_zscheme_remint_scope.md)).
Surface was **entirely inside `kb_curation`** (0 articulations/promotions), so
it added a **reusable** Supabase re-key path: `kb/_rekey_kb_curation_supabase.py`
+ `.github/workflows/supabase-rekey.yml` (service-key, reads the committed
alias map — the only sane way to re-key thousands of rows when the alias map
is too large to hand-pass as SQL;
[`docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md`](docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md)).
Prior: **KIN/PE pass 2** (Session 51, `kb/_kin_pe_pass2.py`, 1,057 re-keys,
`kb/kin_pe_pass2_out/2026-06-12/`; alias-guard `kb/_alias_canon.py`) and the
**2026-06-12 canonical-SUBJ4 fold** (Session 50) — 71,037-alias permutation,
`kb/subj4_fold_out/2026-06-12/`, downstream chain `kb/_post_apply_chain.py`.
