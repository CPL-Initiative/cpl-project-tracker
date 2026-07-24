---
title: CPL unified memory — the cross-repo memory table (Obsidian mirror)
created: 2026-07-24
updated: 2026-07-24
tags: [memory, obsidian-target, index]
kb-status: internal
obsidian-folder: cpl-project-tracker/memory
related:
  - "[[docs/kb-notes/adr-unified-memory-table]]"
  - "[[CLAUDE]]"
artifacts:
  - kb/supabase_cpl_memory.sql
---

# CPL unified memory — the cross-repo memory table

> **What this is** — the Obsidian-visible **mirror** of the `cpl_memory` Supabase
> table: a single cumulative store of notable **facts · pitfalls · procedures ·
> opportunities · risks · wishlist · decisions · milestones** across the three
> repos, each with a "still true?" **status** and a link to its full source. The
> Supabase table is the live-curate surface; this markdown is the digest that
> vault-sync carries into the graph. Design + rationale:
> [[docs/kb-notes/adr-unified-memory-table]].
>
> **This is a PROTOTYPE SEED** (33 real entries pulled from the corpus) so the
> shape can be felt before the schema + loop are committed. The `#id`s are
> placeholders until the table is seeded (they become uuids). The table is **NOT
> yet applied to the live DB** — pending Sam's review.

## The 8 kinds (concise + comprehensive)

**Nature** stays a small closed set; **domain** (security / privacy / org-access /
integration / auditor / supabase / …) lives in **tags**, orthogonally — that split
is what keeps the type list from sprawling.

| Family | Kind | What it captures |
|---|---|---|
| **Knowledge** | `fact` | a durable, verified truth (a provisional one = `fact` + status `proposed`) |
| | `pitfall` | a trap / failure-mode / gotcha to avoid |
| **Operational** | `procedure` | a **ripple checklist** — change X → also update Y, Z, W (the `affects[]` set) |
| **Direction** | `opportunity` | an opening worth pursuing (upside, has a path) |
| | `risk` | an open concern to watch (downside — often security / privacy / access) |
| | `wishlist` | a wanted-but-unscheduled item (feeds the 📋 To-Do) |
| **Timeline** | `decision` | a choice / policy / direction set (the "change" family) |
| | `milestone` | a notable achievement or event reached (dated) |

Verification loop: `proposed` → `verified` → (`stale` | `superseded`), re-checked at
each Rule-8 checkpoint.

---

## 🔁 Procedures — the ripple checklists (the COBI change-impact layer)

*Change one thing → these are the related fields / tabs / report engines that must
move with it. Reverse-queryable by `affects` ("what touches `annual_report.js`?").*

| # | When you… | …also update (the ripple set) | Status | Source |
|---|---|---|---|---|
| `pr1` | edit a **regenerated dashboard section** | change the **generator** (`excel_to_dashboard.py`), never the HTML (overwritten next cron); keep `CPL_Dashboard.html` ≡ `index.html`. **affects:** excel_to_dashboard.py · CPL_Dashboard.html · index.html | verified | `CLAUDE.md` Rules 1 & 4 |
| `pr2` | add a **global CSS token** or a **hand-maintained tab** | mirror in **both** `CPL_Dashboard.html` **and** `index.html` (`:root` tokens, Pipeline tab). Prefer injecting tab CSS from the tab's JS (one file, no mirror). **affects:** CPL_Dashboard.html · index.html | verified | Engineering practices |
| `pr3` | **rename a report-facing field/term** | `report_generator.js` `NAMING_RULE` · `college_report_generator.js` · `annual_report.js` · docx footers · the `sierra_guidance` row · public KB `claude/CLAUDE.md`. **affects:** those 6. **related:** `d1` | verified | `CLAUDE.md` Naming |
| `pr4` | **re-mint / permute ids** | re-key **every** id-keyed map: `promotions.json` (`_rekey_promotions.py`) · `coci_articulations` identities · `kb_curation` (`supabase-rekey.yml`) · FL/SUBJ4 maps. Dry-run + committed alias map, atomic in one cron window. **affects:** promotions.json · coci_articulations · kb_curation | verified | Rule 7 · [[docs/kb-notes/methodology-rekey-every-id-keyed-artifact]] |
| `pr5` | **rename/renumber a workplan Activity or Project** | the generator render · `workplan_activity_associations` (the N-to-N table **missed** in #872 → stale "Activity 5") · ◆ sprint tabling · report `ACTIVITY_DESC` titles. **affects:** those | verified | [[docs/activity_reorg_handoff]] |
| `pr6` | **run a checkpoint** (Rule 8) | `CLAUDE.md` §11 · `docs/reference/*` · `kb/README.md` · `README.md` · the lessons doc · a kb-note if durable · `docs/INDEX.md` · Pipeline tab · `session_<N+1>_handoff.md` · `kb/cpl_todos.json` · **`cpl_memory`** | verified | Rule 8 |

---

## 📌 Facts

| # | Summary | Detail & trigger | Tags | Status | Source |
|---|---|---|---|---|---|
| `f1` | The authoritative statewide MAP exhibit is the **raw row with `Collaborative Type == "CCC"`** | adopt/adapt copies also tag CCC → unified grouping over-counts; **filter the raw column, don't dedup**. Read before any statewide-exhibit count. | ccr, cer | verified | [[docs/kb-notes/reference-authoritative-statewide-exhibit-signal]] |
| `f2` | **Official C-ID/CCN ids are the common course reference**; mint an M-ID only where none exists | C-IDs/CCN-IDs keep their official format — never re-key. Read before merge/mint decisions. | ccr, m-id | verified | [[docs/kb-notes/adr-official-ids-as-common-course-reference]] |
| `f3` | The CPL merge test = **"would you make the student repeat it?"** | anchored to Title 5 §55050's "similar" standard — learning-equivalence over subject codes. The one lens every merge/mint rule serves. | ccr, doctrine | verified | [[docs/kb-notes/glossary-cpl-merge-lens-student-repeat-test]] |
| `f4` | The statewide "eligible students/credits" flag = **`has_ccc`**, which is **not** "on the statewide CPL page" | `has_ccc` = has a CCC-Collaborative *articulation*; e.g. Paramedic License reads *local*. Read before quoting statewide-vs-local eligibility splits. | cer, metrics | verified | [[docs/kb-notes/methodology-area-eligibility-rollup-from-cer]] |
| `f5` | **Small curated scenario batches beat the thousands-strong panel** for eliciting curation doctrine | ≤3 forks/batch, profile-before-edges; Sam bounced off the firehose. | ccr, method | verified | [[docs/kb-notes/methodology-curated-scenario-batches-doctrine-elicitation]] |
| `f6` | CPL **units double-count competencies** (4 courses → 1 ASE area) — course counts read as coverage | Sam flagged units as "sus"; the Pathways metric is course counts, not units. | pathways | verified | [[docs/cpl_pathways_lessons]] |
| `f7` | **All Supabase access goes through the MCP tools** — the sandbox can't reach `*.supabase.co` | a direct curl/psql from a session fails; MCP is the only path. Read before any Supabase work. | integration, supabase, security | verified | `CLAUDE.md` Rule 9c |

---

## ⚠️ Pitfalls

| # | Summary | Detail & trigger | Tags | Status | Source |
|---|---|---|---|---|---|
| `p1` | **`kpi_history.json` must have no date gaps** | the trend card's 1d delta silently falls back to an earlier date; backfill a missed day `"_interpolated": true`. | dashboard | verified | `CLAUDE.md` Rule 3 |
| `p2` | **Never force-push `main`** | Pages serves from it; cron + sessions race. Feature branches may `--force-with-lease`. | git, ops | verified | `CLAUDE.md` Rule 5 |
| `p3` | **Never gatekeep identity/discipline on TOP** | faculty-entered, no data-entry gatekeeper (~52% of M-IDs TOP-mixed); require a 2nd agreeing signal (two-signals-agree). | ccr, discipline | verified | [[docs/kb-notes/methodology-top-is-a-last-in-line-signal]] |
| `p4` | **Paginate every PostgREST read that can outgrow 1,000 rows** | the arbitrary-order 1,000-row cap made saved work render as unsaved. | supabase | verified | [[docs/kb-notes/methodology-paginate-postgrest-reads]] |
| `p5` | A **DOM-cloning Word export un-hides `[hidden]`** → a hidden section reappears | mark hidden things with a **stripped class** (`.fs-ov-hidden`), never the `hidden` attribute. | reports, ui | verified | [[docs/kb-notes/methodology-hide-must-suppress-the-export]] |
| `p6` | **A format-valid JWT can be silently expired** → phantom 401 "saved" with no persistence | refresh the access token before every write. | security, supabase | verified | [[docs/kb-notes/methodology-refresh-token-before-write]] |
| `p7` | A **re-mint that skips a derived id-map severs evidence silently** | 4 re-mints skipped `promotions.json` → 53% of fold evidence cut. See `pr4`. | re-mint | verified | [[docs/kb-notes/methodology-rekey-every-id-keyed-artifact]] |

---

## 🎯 Opportunities

| # | Summary | Detail & trigger | Tags | Status | Source |
|---|---|---|---|---|---|
| `o1` | **Systemwide stale-articulation signal** in the CER/CCR generator | flag any articulation whose `(college, subj, num)` is absent from the current MAP catalog — tightens *every* count; reuses `CPL_COCI_COURSE_KEYS`. | ccr, cer | proposed | [[docs/kb-notes/methodology-filter-live-counts-against-current-catalog]] |
| `o2` | **CIP is the systemic exit from TOP** (CO's TOP→CIP cutover, fall 2026) | apply "corroborate, don't gate" to CIP until it earns trust. | ccr, cip | proposed | [[docs/kb-notes/methodology-top-is-a-last-in-line-signal]] |

---

## 🕵️ Risks — open concerns (security · privacy · org-access)

| # | Summary | Detail & trigger | Tags | Status | Source |
|---|---|---|---|---|---|
| `r1` | Memory + checkpoint docs sync to the vault/CPLBrain with **no review gate** and must **never** reach the public KB except via the human-gated pipeline | keep secrets/PII out of `cpl_memory`; promotion to `cpl-knowledge-base` is a deliberate curation step only. | privacy, governance, security | verified | `CLAUDE.md` checkpoint scope |
| `r2` | The **COBI org layer has no per-area data isolation yet** — CPL and C&I team phrases unlock the **same** tables | revisit gating before true multi-org rollout; today "site" is a cosmetic view dimension. | org-access, integration | verified | [[docs/kb-notes/adr-cobi-org-layer]] |
| `r3` | Public **CER student-impact counts need aggregate + `<2` small-cell suppression + the standing PII guard** | don't regress the guard when the export changes. | privacy | verified | [[docs/kb-notes/adr-cer-student-impact-counts-privacy]] |

---

## 💡 Wishlist

| # | Summary | Detail & trigger | Tags | Status | Source |
|---|---|---|---|---|---|
| `w1` | Run the **ESL packaging apply** from the committed dry-run on Sam's green-light | 2,364 ESL → Beginning/Intermediate/Advanced + Citizenship/VESL/Transfer carve-outs; Rule 9 apply. | ccr | proposed | `kb/esl_package_out/2026-07-15/` |
| `w2` | Run the **wave-4 adjudication fan-out** | 2,000 multi-college IDs staged (ranks 2,001–4,000, 50 batches). | ccr | proposed | `kb/ccr_out/2026-07-14/wave4_manifest.json` |

---

## 🧭 Decisions

| # | Summary | Detail & trigger | Tags | Status | When |
|---|---|---|---|---|---|
| `d1` | **Naming phase**: "CPL Initiative" (never "MAP Initiative" in new writing); "Military Articulation Platform" is history-only | enforced in 4 report engines + docx + a `sierra_guidance` row + public KB. See `pr3`. | naming, governance | verified | 2026-07-03 |
| `d2` | **TOP dethroned** from gatekeeper → last-in-line signal (#799/#800) | 24% blast radius (17,059 rows); the identity gate changed **0 of 146** canonical values. | ccr, discipline | verified | 2026-07-16 |
| `d3` | **Activities tab realigned to 4 Activities** (#872); phantom "Activity 5" dissolved | live Supabase re-key; one follow-up: `workplan_activity_associations` (see `pr5`). | activities | verified | 2026-07-22 |
| `d4` | **Repo toggles set**: auto-merge · auto-delete branches · Claude App Actions R/W | sessions self-dispatch workflows + merge-on-green. | ops, integration, governance | verified | 2026-06-11 |

---

## 🏁 Milestones

| # | Summary | Detail & trigger | Tags | Status | When |
|---|---|---|---|---|---|
| `m1` | **Merge/mint doctrine GRADUATED** at the v0.6 calibration gate | 92% fundamental / 94.7% fine after Sam's rulings, Session 115. | ccr, doctrine | verified | 2026-07-14 |
| `m2` | **Master `.xlsx` no longer written on any daily run** (Excel writer retired, #221) | the Excel→Supabase migration's keystone. | excel, supabase | verified | 2026-06-01 |
| `m3` | **2026–27 CPL funding secured: $7M ongoing + $35M one-time** | supports Vision 2030; BOG deck headline. | funding | verified | 2026-07-20 |

---

*Prototype seed authored 2026-07-24 (SkyKnow). Once the table is applied, this file
becomes the periodic export; edits happen live in Supabase (dashboard 🧠 pane), and
the checkpoint (`pr6`) re-verifies a slice each run.*
