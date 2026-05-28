---
title: cpl-project-tracker docs — Index
created: 2026-05-27
updated: 2026-05-28 (session-end — Session 13, Bruh Baker)
tags: [meta, index, obsidian-target]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/README]]"
---

# cpl-project-tracker — Docs Index

Auto-maintained landing page for the project's documentation surface, intended
as the **Obsidian vault entry-point** when browsing this repo from the
vault-side clone at `CPLBrain/COG-second-brain/cpl-project-tracker/`.

Refreshed at every checkpoint (per `CLAUDE.md` Rule 8).

## The three lanes

| Lane | What | Where |
|---|---|---|
| **KB notes** | Durable, distilled, reusable knowledge | [`docs/kb-notes/`](kb-notes/) |
| **Lessons (WIP)** | Workstream scratchpads, append-only | `docs/<workstream>_lessons.md` |
| **Session handoffs** | "Fattyfat" capsules for the next session | `docs/session_<N>_handoff.md` |

See [`docs/kb-notes/README.md`](kb-notes/README.md) for the lane contract.

---

## KB notes (`docs/kb-notes/`)

Lane established 2026-05-27, Session 11 (Bruh El). See
[`kb-notes/README.md`](kb-notes/README.md) for the contract.

| Title | Type | Status | Created | Updated |
|---|---|---|---|---|
| [ADR — Obsidian sync via vault-side clone (not edge function)](kb-notes/adr-obsidian-vault-via-clone.md) | adr | published | 2026-05-27 | 2026-05-27 |
| [ADR — Supersede, don't mutate, at the synthetic identity layer](kb-notes/adr-supersede-dont-mutate-synthetic-layer.md) | adr | published | 2026-05-27 | 2026-05-27 |
| [Methodology — Two-mode sync (safe Mode A vs identity-touching Mode B)](kb-notes/methodology-two-mode-sync.md) | methodology | published | 2026-05-27 | 2026-05-27 |
| [Methodology — Derive whitelists from rendered DOM, not hardcoded lists](kb-notes/methodology-derive-from-dom.md) | methodology | published | 2026-05-27 | 2026-05-27 |
| [Methodology — Snapshot-with-stamp fallback for live-data dependencies](kb-notes/methodology-snapshot-with-stamp-fallback.md) | methodology | published | 2026-05-28 | 2026-05-28 |
| [Methodology — XSS audit when a previously-trusted field becomes curator-editable](kb-notes/methodology-xss-audit-on-curator-editable-fields.md) | methodology | published | 2026-05-28 | 2026-05-28 |
| [Playbook — Auto-sync vault-side repo clones via Windows Task Scheduler](kb-notes/playbook-vault-sync-setup.md) | playbook | published | 2026-05-27 | 2026-05-27 |
| [Playbook — Measure-first Supabase migration (snapshot → validate → dry-run → workflow_dispatch apply → cutover)](kb-notes/playbook-measure-first-supabase-migration.md) | playbook | published | 2026-05-28 | 2026-05-28 |
| [Playbook — Phase 2 projects migration scope (column map, KPI ladder contract, 6 forks for Sam)](kb-notes/phase-2-projects-migration-scope.md) | playbook | published | 2026-05-28 | 2026-05-28 |
| [Reference — Windows PowerShell scripting gotchas (PS 5.1 + Task Scheduler)](kb-notes/reference-windows-powershell-gotchas.md) | reference | published | 2026-05-27 | 2026-05-27 |

---

## Lessons docs (`docs/*_lessons.md`)

Workstream-anchored scratchpads. Append a dated section every checkpoint.

| File | Workstream | Last touched |
|---|---|---|
| [`common_subject_code_tab_lessons.md`](common_subject_code_tab_lessons.md) | CSC tab / canonical SUBJ4 / CSC-G | Session 11 |
| [`coursecontrolnumber_remint.md`](coursecontrolnumber_remint.md) | Re-mint playbook (THE reference) | Session 5 |
| [`excel_to_supabase_lessons.md`](excel_to_supabase_lessons.md) | Excel → Supabase migration (Phase 1 + Activity↔Project model + Phase 2 scoped) | Session 14 (Bruh Sonnet, 2026-05-28) |
| [`exhibit_canonicalization_lessons.md`](exhibit_canonicalization_lessons.md) | Credential identity / EACR / Cred-Ref sync | Session 12 (Mode B complete) |
| [`exhibit_unification_vision.md`](exhibit_unification_vision.md) | Credential design doc | retrospective |
| [`letter_curator_handoff.md`](letter_curator_handoff.md) | Letter Curator workstream | Session 10 |
| [`quickstart_chat_lessons.md`](quickstart_chat_lessons.md) | Quick-start chat | Session 10 |
| [`sidebar_lessons.md`](sidebar_lessons.md) | Sidebar / tabs.js router | Session 11 |
| [`subj4_canonicalization_remint_lessons.md`](subj4_canonicalization_remint_lessons.md) | Phase 1e re-mint | Session 5 |
| [`unified_courses_audit_lessons.md`](unified_courses_audit_lessons.md) | Trust-Card auditor | Session 12 (`merge_into_orphan`) |
| [`vault_sync_lessons.md`](vault_sync_lessons.md) | Vault auto-sync (Windows Task Scheduler) | Session 11 (NEW) |

---

## Session handoffs (`docs/session_<N>_handoff.md`)

| Session | Moniker | Handoff doc |
|---|---|---|
| 5 → 6 | Bruh Hex | [`session_6_handoff.md`](session_6_handoff.md) |
| 6 → 7 | Bruh Hept | [`session_7_handoff.md`](session_7_handoff.md) |
| 7 → 8 | Octaman | [`session_8_handoff.md`](session_8_handoff.md) |
| 9 → 10 | Sexy Dexy | [`session_10_handoff.md`](session_10_handoff.md) |
| 10 → 11 | Bruh El | [`session_11_handoff.md`](session_11_handoff.md) |
| 11 → 12 | Bruh El (handoff) | [`session_12_handoff.md`](session_12_handoff.md) |
| 12 → 13 | Bruh Dec (handoff) | [`session_13_handoff.md`](session_13_handoff.md) |
| 13 → 14 | Bruh Baker (handoff) | [`session_14_handoff.md`](session_14_handoff.md) |

---

## Top-level orientation docs

- [`../CLAUDE.md`](../CLAUDE.md) — project memory, Critical Rules, M-ID lifecycle (§11)
- [`../README.md`](../README.md) — first-time visitor entry
- [`../kb/README.md`](../kb/README.md) — knowledge-base schemas + generators

## Reference materials

Authoritative external sources we've cached:
- [`reference/`](reference/) — ASCCC / COCI / CCN-CID source documents

---

*This file is auto-maintained at every checkpoint. If you find a stale entry,
the checkpoint command will refresh on the next run; no need to hand-edit.*
