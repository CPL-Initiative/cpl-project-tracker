---
title: Session 134 handoff (Sky → next) — the docs lint exists now; the vault is 10 MB; five diagnoses needed correcting
created: 2026-08-09
updated: 2026-08-09
tags: [handoff, docs-lint, vault, obsidian, skills, powershell, diagnosis]
related:
  - "[[docs/vault_sync_lessons]]"
  - "[[docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass]]"
  - "[[docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault]]"
  - "[[docs/kb-notes/methodology-the-plausible-cause-is-not-the-measured-one]]"
superseded: true
superseded_by: session_135_handoff.md
---

# You are Session 134

Session 133 was **Sky**. It started as *"analyse this X post about Claude+Obsidian
memory repos"* and became a vault-hygiene run. Nine PRs merged (#1071–#1083 plus
CPLBrain#30/#31). ⚠️ **A second session (SkyHigh, #1078/#1079) ran concurrently
the whole time** — check `main` before assuming anything below is the latest.

## Read in this order

1. `docs/vault_sync_lessons.md` § 2026-08-09 — the full story, including what was
   diagnosed wrong.
2. `docs/kb-notes/methodology-the-plausible-cause-is-not-the-measured-one.md` —
   the durable lesson, and the one most likely to save you time.
3. `kb/docs_audit/2026-08-09.md` — the current lint report. Run
   `python3 kb/_docs_audit.py` first thing; it is step 0 of `/checkpoint` now.
4. `docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault.md` — if
   anything vault-shaped comes up.

## What shipped

- **`kb/_docs_audit.py`** — the docs **lint** pass. Rule 8 gave us *ingest*,
  sessions give *query*; this is the missing third operation. Seven rules, one
  mutation behind `--apply`, zero dependencies, 56 tests. Wired as **step 0** of
  `/checkpoint` so findings shape what the checkpoint writes.
  `superseded_handoff`, `frontmatter_log_chain`, `kb_note_frontmatter` → **0**.
- **Vault clone 1,037 MB → 10.2 MB** (`scripts/sparse-vault-clone.ps1`).
- **Sync hourly, no console window** — an S4U principal; `-WindowStyle Hidden`
  was never the fix. Smoke-tested green on Sam's machine.
- **COG skills 22 → 16** (CPLBrain#31) and **Obsidian skills committed to both
  repos** (#1082) — a `~/.claude/skills` install reaches neither remote sessions
  nor the team.
- **`tests/powershell_ascii_test.py`** — guards a defect that broke all three
  `.ps1` files.

## Carryover — start here

| # | Item | State |
|---|---|---|
| 1 | **`linkDistance: 250` in `CPLBrain/.obsidian/graph.json`** (default 30) | **live**; 5-second UI fix, not yet done |
| 2 | CPLBrain → Settings → **auto-delete head branches** | Sam's toggle; until then the stop-hook cries wolf |
| 3 | `oversized_doc` × 6 — `roadmap_archive.md` 2.3×, `INDEX.md` 4.3× | real compaction work, untouched |
| 4 | `unindexed_kb_note` × 10 | ten notes unreachable from the index |
| 5 | `kb_note_dialect` × 54 | **informational, not a defect** — normalising is Sam's call |
| 6 | `defuddle` skill | not installed; unread Snyk Med Risk (skills.sh is egress-blocked here) |

**Item 1 is the cheapest and the only known-bad setting still in place.** At ~700
nodes it spreads the graph ~70× and will blank the viewport again as the vault
grows. Do not commit a value to `graph.json` without checking Sam's local copy
first — Obsidian rewrites that file, and a mismatch blocks his next pull.

## Patterns that worked

- **Measure before prescribing.** Every recommendation that survived came from
  counting something. The X post's ranking put a 2-star repo above the 44.5k-star
  one written by Obsidian's creator; star counts settled it in one fetch.
- **Positive controls.** `powershell_ascii_test.py` was verified by *injecting*
  an em dash and confirming the guard fails. A test that has never failed has
  not been tested.
- **Archive to stay inside budget.** This checkpoint added a §11 narrative and
  `CLAUDE.md` still got *smaller* (94,498 → 92,891 B) by moving the oldest
  narrative to `docs/roadmap_archive.md`. Do the same.

## Safety patterns to honour

- **Broken ≠ unused.** 8 skills were deleted for being unable to run; 3 that
  merely produce nothing were kept. Different decisions, different evidence.
- **A tool that prunes must be asked what the SYSTEM depends on**, not only what
  the user reads. The sparse checkout would have deleted the Task Scheduler's
  own target and silently killed vault sync.
- **A guard that fires on correct input gets muted.** v1 of the lint flagged 52
  valid notes; three separate rules had this defect before shipping.
- **Concurrent sessions are real.** `main` moved under this branch four times.
  Fetch and rebase before every push; verify squash-merged content by diffing
  trees, not by ancestry.
- ⚠️ **No PowerShell in the sandbox.** Anything `.ps1` is statically checked
  only — say so, and treat Sam's first run as the real test. Three defects
  surfaced exactly there.

## Moniker

Sam didn't name this one; it ran as **Sky** (the lineage is SkyMind, SkyDesk/
SkyTime, SkyHigh). Claim your own — **SkyLint** or **SkyVault** both fit what
you are inheriting, but take whatever Sam offers at greeting.
