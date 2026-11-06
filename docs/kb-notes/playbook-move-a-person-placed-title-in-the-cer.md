---
title: "Playbook — moving a local title a person placed in the CER"
created: 2026-11-06
kb-status: published
tags: [playbook, cer, curation, kb-curation, rule-10, revise-lane]
artifacts:
  - kb/_cer_decision_apply.py
  - kb/_fold_unclassified.py
  - .github/workflows/cer-decision-apply.yml
  - .github/workflows/cred-rename-apply.yml
  - kb/cer_decisions_out/2026-11-06/
related:
  - "[[library_lessons]]"
  - "[[methodology-cer-fold-articulation-ripple-sync]]"
---

# Moving a local title a person placed in the CER

**When:** a local (college-entered) title sits under the wrong credential, and a person put it there, so its
`kb/unified_titles.json` entry carries a reviewer. The nightly fold never re-points a person's classification on a plain
assignment: it holds it as a conflict.

**The shape that moves it** (the Exhibits tab's *Change to Proposed Title*, and the fold's revise lane):

1. Under `_UNCLASSIFIED::<local title>`, a **guarded replace** of `unified_title_assignment`: the plan row names the live
   value and its reviewer in `replaces`, and changes only while the row still holds exactly that.
2. Beside it, an insert of `unified_title_supersedes` naming the title it replaces. The fold re-points the local title
   only while every human-reviewed spelling still carries that title and the assignment is newer.
3. Leave the issuer row alone when it is already right.

**Steps.** Read the live rows first (the Supabase MCP, read-only). Preview: copy the synced
`kb/unclassified_assignments.json`, set each entry's `unified_title`, `supersedes`, reviewer and time as the sync would,
run `python3 kb/_fold_unclassified.py` (a dry run), and restore the file; the report's `revise`, `held` and V-gates say
what tonight's fold will do. Write the plan under `kb/cer_decisions_out/<date>/plan.json` with the ruling in the
person's words. `kb/_cer_decision_apply.py` accepts a title assignment only in this shape. Merge it, then dispatch
`cer-decision-apply.yml` as a dry run, read it, then commit; the receipt lands on `main` and `--rollback` restores the
person's values.

**A whole credential renamed or merged** is a different path: `unified_title_override` (with
`unified_title_merge_confirm` for a merge) under `_CREDENTIAL_REVIEW::`, carried by `cred-rename-apply.yml`. That
workflow applies **every** queued override at once, so one stale row holds every merge: read the nightly
`kb/cred_rename_dryrun/alias_map.json` summary (`apply_safe`) before dispatching.

**Superseding a person's row is their call** (CLAUDE.md Rule 8): do it on their explicit word, and name it in the plan.
