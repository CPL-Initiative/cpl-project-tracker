---
title: "Obsidian vault wiring (CLAUDE.md offload)"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, obsidian, vault, claude-md-offload]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
---

> **Moved verbatim from `CLAUDE.md` on 2026-08-28** (Session 206, the
> consolidation). This is **always-current wiring, not an archive** — it is
> PULL-side reference: read it when you are working on the vault, the sync
> script, or Obsidian exclusion. The two PUSH-side halves stayed in
> `CLAUDE.md`: the three doc lanes, and the "checkpoint scope — vault, never
> the public KB" rule.

# Obsidian vault wiring

Sam's Obsidian vault is rooted at
`C:\Users\samuel.lee\Documents\GitHub\COG-second-brain\` (**repointed
2026-05-28, PR #178** — it previously pointed at
`Documents\Claude\Projects\CPLBrain\COG-second-brain\`, but the sync script
pulled there while Obsidian read the `GitHub\` path, so checkpoint commits +
KB notes never appeared in the vault; root cause + Windows cutover steps in
[`docs/kb-notes/playbook-vault-sync-setup.md`](docs/kb-notes/playbook-vault-sync-setup.md)).
This repo is cloned **into the vault** at
`COG-second-brain\cpl-project-tracker\` so Obsidian indexes every `.md` file
the session writes.

**Vault auto-sync (added Session 11, 2026-05-27):** `scripts/sync-vault-clones.ps1`
runs on Sam's Windows Task Scheduler every 60 minutes (default lowered from 15
on 2026-08-09 — work lands a few times a day, so 24 pulls/day is plenty; run the
script by hand when you want the vault current immediately), fast-forward-pulling
`cpl-project-tracker` + `cpl-knowledge-base` from origin into the canonical
`Documents\GitHub\COG-second-brain` vault root (`$vaultRoot` repointed
2026-05-28, PR #178). KB notes (and every other repo doc) appear in Obsidian
automatically. The script is strictly
safe: never auto-merges, skips repos with uncommitted work, logs to
`.vault-sync.log`. Setup walkthrough:
[`docs/kb-notes/playbook-vault-sync-setup.md`](docs/kb-notes/playbook-vault-sync-setup.md).

Vault-side hygiene: heavy non-markdown paths are excluded in Obsidian's
**Files & Links → Excluded files** so the graph stays clean. **The authoritative
list is generated, not prose** — `python3 kb/_docs_audit.py` emits a paste-able
`userIgnoreFilters` block in `kb/docs_audit/<date>.md`; the live copy is
`CPLBrain/.obsidian/app.json`. (Corrected 2026-08-09: this paragraph used to
*claim* `unified_courses_*.js` and `cip_fitcheck/` were excluded and the live
`app.json` excluded neither — 164 MB. A documented exclusion is not an applied
one, which is why the list is now generated from what is actually on disk.)

⚠️ **Exclusion is a relevance filter, not a performance one.** It drops paths
from search, graph and link autocomplete; it does **not** stop Obsidian's file
watcher, metadata cache, or Sync. If the vault is slow to OPEN, excluding more
paths will not fix it — the files have to leave the disk.

**The fix is a docs-only sparse checkout of the vault clone
(`scripts/sparse-vault-clone.ps1`): 1,766 files / 1,072 MB → 447 files / 11 MB,
verified, reversible with `-Revert`.** The vault clone is a read-only mirror
(`sync-vault-clones.ps1` only fast-forward pulls it; real work happens in the
working clone at `Documents\GitHub\cpl-project-tracker`), so it has no use for
build outputs. Sparseness survives `git pull`; the sync script logs a NOTE if it
ever regresses. ⚠️ Do **not** re-scope this by file extension —
**`kb/row_audit/` is 418 MB of MARKDOWN**, so a "materialise `**/*.md`" rule
would keep 423 MB and look like it worked. Scope by LANE. Procedure + the
measurements:
[`docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault.md`](docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault.md);
corpus finding:
[`docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md`](docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md).
