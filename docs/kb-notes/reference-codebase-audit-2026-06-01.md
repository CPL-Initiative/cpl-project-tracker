---
title: Session 26 codebase audit — findings catalog
created: 2026-06-01
updated: 2026-06-01
tags: [reference, audit, codebase-health, security, idempotency, performance, dead-code, refactor, correctness]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline]]"
  - "[[docs/kb-notes/excel-dependency-audit]]"
  - "[[docs/kb-notes/methodology-xss-audit-on-curator-editable-fields]]"
artifacts:
  - excel_to_dashboard.py
  - fetch_custom_report.py
  - cloudflare-worker-proxy.js
  - quickstart.js
  - workplan_goals.js
---

# Session 26 codebase audit — findings catalog

> **One-sentence summary** — a read-only fan-out audit (6 parallel subagents, one per issue class, plus parent verification) over the generator monolith + `kb/` + the JS layer + the daily pipeline; **51 findings**, headlined by an **active student-PII exposure on the public repo** (SEC-10, forward-stop landed in PR #227) and a **Cloudflare-worker open proxy** (SEC-1). This is the green-light menu, not a change log — fixes are gated on Sam's pick.

## How this was run

Session 26's kickoff was the strategy-queue item-1 codebase audit. `/workflow` isn't available in this environment, so the same mechanism was run directly: **6 background `Agent` subagents**, each hunting ONE class across the codebase, then the parent (Opus) independently re-verified the headline claims of the two Sonnet agents (dead-code, perf) + the PII counts + the worker logic. **Read-only — no blind refactor.** Large files (`CustomReport_latest.json` 85 MB, `coci_*.json`, `coci_course_list.xlsx`, generated `*_data.js`) were inspected via counts/greps, never read into context.

| Class | Agent model | Findings |
|---|---|---|
| Idempotency / regen-safety | Opus | 6 |
| Dead code | Sonnet (verified) | 7 |
| Performance | Sonnet (verified) | 8 |
| Simplification / duplication | Opus | 10 |
| Security | Opus | 11 |
| Frontend correctness | Opus | 9 |

---

## 🔴 CRITICAL — student PII committed to the public repo (SEC-10)

`CustomReport_latest.json` (85 MB) was **git-tracked on `main`** (the public GitHub-Pages source), with no `.gitignore` entry, **re-committed every daily run**. Verified populated-cell counts (no values read out):

- `View_StudentAggregatedValues`: **48,419 rows — FirstName+LastName on all of them**, StudentID on 30,058, MAP Internal StudentID on 46,126, **BirthDate on 22,791**.
- `View_CollegeContacts`: 36,735 rows **×2 (duplicated)** — staff names, CEO/primary emails, 31,643 phones.
- `View_CollegeUsersRoles`: 2,710 rows — system users' names + emails.

**Status: forward-stop landed in PR #227** (gitignore + `git rm --cached` + drop the workflow's `git add` + trim the 4 unused student-identity columns from the fetch; parity-proven). **History purge is a separate, Sam-driven op** (needs `git filter-repo` + a force-push to `main`, which overrides Rule 5).

---

## Recommended fix queue (ranked — for green-light)

Grouped by my recommended order. Effort: XS (<30 min) / S / M / L. All are gated on Sam's pick; nothing below is done except where noted.

### Tier A — Security (do next)
| ID | Sev | Effort | Fix |
|---|---|---|---|
| SEC-10 | 🔴 | done / pending | PII: forward-stop **DONE (#227)**; **history purge pending** (Sam-driven force-push) |
| SEC-1 | High | M | Worker `POST /` open Anthropic proxy → add origin gate + secret + body/`max_tokens` cap + Cloudflare rate-limit. *(Edit `cloudflare-worker-proxy.js`; Sam re-pastes to Cloudflare.)* |
| SEC-2 | Med | XS | CORS `startsWith` → exact-match the origin allowlist *(same worker file)* |
| SEC-3 | Med | S/M | `CPL_SCRAPE_2026` ships in the public refresh button → rate-limit `/trigger`+`/scrape`, or gate `/trigger` behind the dashboard's Supabase auth |
| SEC-4, SEC-5 | Low | XS | Two inline `<script>` blobs use raw `json.dumps` → route through the existing `_js_safe_json` (`</script>`-breakout parity with `window.CPL_DATA`) |

### Tier B — Idempotency cleanup (one generator PR; collapses ~6 KB of accreted cruft, makes the daily "no-diff → no-commit" guard reachable)
| ID | Sev | Effort | Fix |
|---|---|---|---|
| IDEM-1 | High | XS | Refresh button (`:8536`): strip must consume leading `\n\s*` — ~116 blank lines accreted |
| IDEM-2 | High | XS | PROJ-INFO block (`:8050`/`:8092`): strip orphaned trailing whitespace |
| IDEM-3 | High | S | Vision 2030 (`:8579`/`:8659`): drop trailing `\n        ` — ~51 lines accreted |
| IDEM-4 | High | S | Annual Workplan Goals (`:8388`): `.lstrip('\n')` leaves 8 spaces → 446-char mega-line at HTML:9436 |
| IDEM-5 | Med | S | `ALGO_DETAILS_CSS` strip (`:8305`): give it a start/end marker like the Rule-2 EXHIBIT guard (latent trap) |
| IDEM-6 | Low | XS | Delete dormant legacy MAP-Exhibit stripper (`:8297`) |

### Tier C — Frontend correctness (user-facing)
| ID | Sev | Effort | Fix |
|---|---|---|---|
| BUG-1 | High | M | Quickstart project-jump + project/Activity routing point at `#tab-dashboard`, but the grid moved to `#tab-activities-projects` in PR #206 → typeahead picks land on KPIs, never the project. Repoint `quickstart.js:33/297` + `dashboard_filters.js:266`. |
| BUG-2 | Med | XS | Quickstart `unified-courses` vocab still advertises retired `Cluster` enum → CCR hints silently dropped; add `Unified` + the member-TOP triage (`quickstart.js:88`) |
| BUG-3 | Med | XS | Pipeline tab renders blank via a `#pipeline/<section>` hash/deep-link (`pipeline.js:326` exact-match → prefix-match) |
| BUG-7 | Low | XS | Workplan inline edit double-fires save (Enter→blur); add a `done` guard like the sibling editors (`workplan_goals.js:278`) |
| BUG-4 | Med | S | Workplan save-failure rollback reverts the year cell but not the row **Total** (`workplan_goals.js:342`) |
| BUG-5 | Med | S | CER bulk "Mark N initiated" acts on rows selected outside the current filter (`credential_reference.js:595`) |
| BUG-6 | Med | S | `generate_reports.js:582` strips K/M suffixes before summing budgets → wrong Activity total if any budget uses K/M notation (latent; today's data dodges it) |
| BUG-8, BUG-9 | Low | XS | Unguarded `getElementById().value` reads (`dashboard_filters.js:67`); fragile `fetch_custom_report.py` arg parser (`:156`) |

### Tier D — Dead code (one cleanup PR, all low-risk)
| ID | Sev | Effort | Fix |
|---|---|---|---|
| DEAD-3 | Med | XS | `worker-to-paste.js` — 417-line orphan, diverged from the live worker (0 refs). **Confirm it isn't your manual Cloudflare-paste source**, then delete. *(Correction: it DOES contain `/trigger`; the agent's "missing trigger" claim was wrong — it's ~99/86-line diverged.)* |
| DEAD-1 | Med | XS | `sync_goals_to_project_list` (`:7699`, 53 lines) — never called; an Excel writer that muddies the "one remaining writer" claim |
| DEAD-5 | Low | S | `funding_subtotals` block (`:7109` + 3 sites) — computed, self-annotated "unused by the renderer" |
| DEAD-2/4/6/7 | Low | XS | `COL_SOURCE_LOGIC` const (`:208`); `load_workplan_goals()` wrapper (`_load_workplan_goals.py:130`, no callers); `excel_row: r` (`:1040`, always discarded); stale "column W"→"AE" label (`:7869`) |

### Tier E — Performance (measured; quick wins first)
| ID | Sev | Effort | Fix |
|---|---|---|---|
| PERF-1 | High | XS | 85 MB CustomReport `json.load`ed **twice** (`:3652` + `:4297`, ~1.9 s each) → pass the already-parsed data into `build_exhibit_analysis_tables` |
| PERF-5 | Med | XS | `_build_statewide_adoption:4630` rebuilds a set from a list every row → use a set accumulator |
| PERF-7 | Low | XS | `statewide_data.js` `indent=2` (`:8006`) + `unified_courses_data.js` (`:5808`) → compact `separators` (saves ~2.6 MB/run) |
| PERF-3/4 | High/Med | S | `coci_course_list.xlsx` ~14 s read holds ~90 MB of description-bearing dicts; split into a lean join index + a `ctrl→desc` dict (also speeds the 56k singleton `_detail_for` lookups) |
| PERF-6 | Med | S | Auditor `_classify_title_mismatch` is O(courses×disciplines) ≈2.3 M ops → invert `disc_bag` into a token→disciplines index (`kb/_row_audit.py:1113`) |
| PERF-2 | High | XS | Contacts + Users&Roles (~73k rows) fetched/parsed/discarded unused, **Contacts duplicated** (~20 MB). (Forward-stop #227 keeps them *fetched* for the planned panel; revisit the duplicate + trim when scoping the Contacts panel.) |
| PERF-8 | Low | XS | `_build_statewide_adoption` double linear-scans `all_data` (`:4515`/`:4533`) — naturally resolved by PERF-1 |

### Tier F — Duplication (larger refactors; do deliberately, not blindly)
| ID | Sev | Effort | Fix |
|---|---|---|---|
| DUP-1 | High | L | Supabase magic-link auth reimplemented **8×** (~300 lines, already drifted — see PR #120) → a shared `cpl_auth.js` (per-tab return-tab becomes a param) |
| DUP-2 | High | M | Sign-in 429/400/422/5xx error-mapping copied **6×** → a `describeSignInResult()` helper. **Surfaced a real bug:** `budget_editor.js:132` has an empty `<strong></strong>` (email not interpolated — fix standalone, XS) |
| DUP-3 | High | M | `kb/_load_*.py` fetch→snapshot→fallback skeleton **3×** → `kb/_supabase_load.py` |
| DUP-7 | Med | S-M | `el()` DOM-builder copied **9×**, drifted into 3 behaviors (`el(x,{title})` differs per tab) → `cpl_dom.js` |
| DUP-4/5/6 | Med | S–M | `kb/_apply_*.py` boilerplate 3×; `render_assoc_chip_line` re-inlined (`:2240` vs the `:6777` helper); two `activity_labels` dicts (`:1497` + `:6874`) |
| DUP-8/9/10 | Low | XS–S | `saveField` PATCH; duplicate `_load(name)` closures (`:4863`/`:5110`); `_num`/`fnum`/`_fmt_int` numeric helpers |

---

## Findings detail by class

Full per-finding write-ups (location, data path, repro, fix, risk) live in the Session 26 transcript. The tables above carry the actionable essence; this section records the non-obvious specifics worth keeping.

### Idempotency (6) — `excel_to_dashboard.py`
The generator rebuilds `CPL_Dashboard.html` by **section-replacement on every run** (Rule 1), so each inject site must be idempotent. **Confirmed live state: 517 whitespace-only lines + one 446-char all-spaces line (~6 KB), mirrored identically in `index.html`** (Rule 4 holds — the cruft is symmetric, not corrupt). Mechanism for all four live bugs (IDEM-1..4): the strip removes the injected `<div>`/block but **not the leading/trailing `\n        ` whitespace** the insert added, so one indented blank accretes per run. The agent traced + repro'd each and gave a coverage list of **~20 inject sites confirmed safely idempotent** (KPI cards, CPL Analytics, the Rule-2 EXHIBIT_ANALYSIS_CSS guard, Budget, teaser cards, lead-filter dropdown, etc.). The daily workflow's commit/push (concurrency group + rebase-retry + no-diff guard) is **race-safe**; the only "accretion via workflow" is these generator bugs. **Caveat:** because IDEM-1..4 add bytes every run, the "no-diff → no-commit" guard never short-circuits on the HTML — fixing them makes genuinely-unchanged days correctly no-op.

### Dead code (7)
All 7 **confirmed** (zero call sites), 0 verify-indirect, imports clean, all source JS referenced except `worker-to-paste.js`. Parent-verified DEAD-1/2/4/6 + the DEAD-3 divergence (and corrected the agent's wrong "missing /trigger" detail).

### Performance (8)
Measured on real data: 85 MB JSON `json.load` ≈1.9 s (×2 = PERF-1); `coci_course_list.xlsx` 141,738-row read ≈14 s holding ≈90 MB (PERF-3); seven output JS files ≈3.8 s to serialize. The xlsx is correctly read **once** (CLAUDE.md intent holds) — the cost is intrinsic to the row count + the description payload. PERF-1/PERF-8 parent-verified (two `open(EXHIBIT_FILE)` at `:3652`/`:4297`; Contacts genuinely duplicated in the file).

### Security (11)
One genuinely material issue (SEC-1, parent-verified by reading the worker). Everything else Low/Info: the public "secret" only lets anons nuisance-trigger an **idempotent** pipeline (SEC-3); a loose CORS check (SEC-2); and unescaped-`innerHTML` / inline-`<script>` sinks fed mostly by trusted-ish MAP/KB data or insider-only curator fields (SEC-4..SEC-9) — the same XSS class prior sessions fixed, in files the earlier sweeps **missed**: `report_generator.js`, `college_report_generator.js`, `college_activity.js`, `canonical_subj4.js`, and two raw-`json.dumps` inline blobs in the generator. **Prior fixes confirmed still intact:** `_js_safe_json` (all 5 escapes) on both `window.CPL_DATA` emissions; akpi + `data-folder` + `data-assoc` escaping; `credential_reference.js`/`assoc_editor.js`/`projects_editor.js`/`budget_editor.js` build DOM via `textContent`; no `eval`/`Function`/`document.write`/`javascript:` sinks; RLS is `is_allowed_reviewer()`-gated on every write-bearing table; no `service_role`/`ANTHROPIC_API_KEY` committed (only the public anon JWT).

### Frontend correctness (9)
BUG-1 is the standout — a real **regression since PR #206** (the page move) that silently broke quickstart project navigation. The agent also confirmed-clean a long list (listener teardown across the editors, `renderExpandedRow` PR-#204 fix intact, no toolbar-rebuild focus bug, `r.flags` safe on all rows, the Python loaders' fallback chain is fail-loud).

---

## See also

- `[[docs/kb-notes/reference-daily-dashboard-data-pipeline]]` — the data-source map that framed the PII surface
- `[[docs/kb-notes/methodology-xss-audit-on-curator-editable-fields]]` — the recurring XSS class (SEC-4..9 are new instances)
- PR `#227` — the PII forward-stop
- CLAUDE.md Rule 1 (generator-not-HTML), Rule 2 (idempotency guard), Rule 4 (HTML mirror), Rule 5 (never force-push main — gates the SEC-10 history purge)
