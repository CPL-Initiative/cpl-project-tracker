---
title: Keep build artifacts out of the Obsidian vault (sparse-checkout the vault clone)
created: 2026-08-09
updated: 2026-08-09
tags: [playbook, obsidian, vault, git, performance, docs]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-vault-sync-setup]]"
  - "[[docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass]]"
artifacts:
  - scripts/sparse-vault-clone.ps1
  - scripts/sync-vault-clones.ps1
  - kb/_docs_audit.py
---

# Keep build artifacts out of the Obsidian vault

> **One-sentence summary** — the vault clone of this repo carries ~1.07 GB of
> generated files it will never use; a docs-only sparse checkout drops it to
> ~11 MB without changing the sync workflow, and unlike an exclusion list it
> actually removes the files from disk.

## Context

`cpl-project-tracker` is cloned **into** the Obsidian vault so the vault indexes
every `.md` a session writes. That is the right design — but a clone brings the
whole working tree, and the tree is mostly not documentation:

| | Files | Size |
|---|---:|---:|
| Working tree (excl. `.git`) | 1,766 | **1,072 MB** |
| …the doc lanes Obsidian reads | ~440 | **~11 MB** |
| `kb/row_audit/` receipts | 155 | **418 MB** |
| Other generated `.js`/`.json`/`.xlsx` | ~1,165 | 649 MB |

## The two traps

**1. The exclusion list does not do what it looks like it does.** Obsidian's
**Files & Links → Excluded files** (`userIgnoreFilters` in `.obsidian/app.json`)
is a **relevance** filter. It removes paths from search results, graph view and
link autocomplete. It does **not** stop the file watcher, the metadata cache, or
Obsidian Sync. Excluding 1.2 GB makes the vault tidier to *browse* and does
approximately nothing for how long it takes to *open*. Only taking the files off
disk does that.

**2. "Just check out the markdown" is wrong here, and the reason is
counter-intuitive.** `kb/row_audit/` is **418 MB of markdown** — 80 daily
auditor receipts at ~7.2 MB each. A rule phrased as *"materialise `**/*.md`"*
would keep 423 MB of the 1,072 MB and feel like it had solved the problem.
**Scope by LANE, not by file extension.** The size lives where you do not expect
it, so measure before choosing the predicate.

## Procedure

The vault clone is a **read-only mirror** — `sync-vault-clones.ps1` only
fast-forward pulls into it, and all real work happens in the separate working
clone at `Documents\GitHub\cpl-project-tracker`. So it has no use for the build
outputs at all.

```powershell
# from the WORKING clone (Documents\GitHub\cpl-project-tracker)
powershell -ExecutionPolicy Bypass -File .\scripts\sparse-vault-clone.ps1 -DryRun   # look first
powershell -ExecutionPolicy Bypass -File .\scripts\sparse-vault-clone.ps1           # apply
# then restart Obsidian so it drops the removed files from its cache
```

Reverse at any time — nothing is deleted from git, only from the working
directory:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sparse-vault-clone.ps1 -Revert
```

The patterns kept (non-cone sparse-checkout; a match means *include*):

```
/*.md            CLAUDE.md, README.md, the root notes
/docs/           kb-notes, lessons, handoffs, reference — the whole lane
/kb/README.md    the KB lane readme; NOT kb/row_audit (418 MB)
```

## What the script guards

- **Refuses to run outside the vault root** unless `-Force`. Stripping the
  *working* clone would remove the tree you build from. This is the guard that
  matters; everything else is politeness.
- Refuses on a dirty tree or unpushed commits — sparse-checkout would hide them.
- Idempotent; re-running is a no-op.
- **Verifies afterwards** that `docs/kb-notes/` is non-empty and `docs/INDEX.md`
  exists, and fails loudly if not. A sparse checkout that silently dropped the
  docs would be worse than no sparse checkout.

## Verified behaviour

Measured on the real repo before shipping, not assumed:

- 1,766 files / 1,072 MB → **447 files / 11 MB** (−99.0%).
- Doc lanes complete after the switch: **207/207** kb-notes, **49/49** lessons
  docs, **117/117** session handoffs, `INDEX.md` present.
- **Sparseness survives `git pull`** and `git checkout` across commits — checked
  out a commit that carried the artifacts and they did not materialise. This
  matters because `sync-vault-clones.ps1` pulls every 5–15 minutes.
- The revert round-trips exactly: 11 MB → 1.07 GB → 11 MB.

`sync-vault-clones.ps1` now logs a `NOTE` when the tracker's vault clone is
*not* sparse. It never re-applies sparseness by itself — a human may have
restored the full tree on purpose, and silently re-deleting their files is the
kind of helpfulness nobody asks for twice.

## What this does not solve

`.git` stays ~171 MB. Obsidian ignores dot-directories, so it costs disk but not
index time. If disk matters, a **fresh blobless clone** shrinks that too —
`git clone --filter=blob:none --sparse <url>` — at the cost of needing the
network to materialise a blob it has not fetched. Not worth it for a mirror that
is already working; worth it if the vault clone is ever rebuilt from scratch.

## Where else this bites

Any repo cloned into a vault, and any "just exclude it" instinct. The general
shape: **an exclusion list is a statement about relevance, not about cost.** If
the goal is cost, the file has to actually go. Related failure from the same
week: `CLAUDE.md` *claimed* `unified_courses_*.js` and `cip_fitcheck/` were
excluded while the live `app.json` excluded neither — 164 MB of
documented-but-not-applied hygiene. Generated lists beat prose;
`kb/_docs_audit.py` now emits the exclusion block from what is actually on disk.
