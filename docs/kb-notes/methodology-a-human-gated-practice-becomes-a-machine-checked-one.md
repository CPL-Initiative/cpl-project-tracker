---
title: A human-gated practice becomes a machine-checked one
created: 2026-08-30
tags: [methodology, doctrine, onboarding, session-hygiene]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/doctrine_enforcement_lessons]]"
  - "[[docs/working_with_claude_code]]"
artifacts:
  - CLAUDE.md
  - scripts/install-three-repo-check.ps1
  - docs/working_with_claude_code.md
---

# A human-gated practice becomes a machine-checked one

## The one-sentence rule

When a practice is enforced only by people remembering it, convert it into a
session-side check in the always-loaded file, add a one-time per-machine
install for the case where nothing loads, and write the human-facing half
with the reason attached — then the practice survives its owner's attention.

## The worked case (2026-08-30, #1412)

Sam's standing practice: every CPL session starts with all three repos
attached — *"so they can stay informed and syncd."* He taught the team the
same, and diagnosed the weakness himself: *"it's a human gated practice."*
Until that sentence, the reason lived nowhere (the vault's setup section
named only two of the three repos), and the enforcement lived in each
person's memory at each session start.

The conversion has exactly three layers, because the failure has three
surfaces:

1. **Detection where it always loads.** A bullet in `CLAUDE.md` (the one
   file guaranteed present when any of the repos is attached): verify the
   full set at session start; if anything is missing, say which in one line
   and ask before working. The session does the remembering.
2. **A per-machine backstop for the zero-context case.** With no repo
   attached, no project instructions load at all — no rule in any repo can
   fire. The only channel that exists is the machine itself: a one-time
   installer appends a marker-guarded check block to the user-level memory
   file, so even a bare session asks about the repos before doing project
   work. One install per teammate machine, like the hooks.
3. **The human half, with the reason.** A guide section that states the
   practice, quotes why, says what the session will do about a partial set,
   and is honest about the limit: a session with nothing attached is generic
   Claude and does not know the rules exist.

## Why the pattern generalizes

The failure class recurs — this repo's own doctrine states it as "a habit
that depends on a new user remembering it will fail on their first day."
Prior instances all converted the same direction: the checkpoint became a
command instead of a memory; context pressure became a hook instead of a
feeling; the sibling check now makes the attach set a stated fact instead of
an assumption. The test for candidates: if the practice failed silently
tomorrow, who would notice, and when? If the answer is "a human, later," the
practice is human-gated and eligible.

## The limit to state honestly

A check can only run where some instruction loads. Layer 2 narrows the
uncovered case from "any session someone starts wrong" to "a machine where
the one-time install never ran" — smaller, enumerable, and visible (the
installer is idempotent and safe to re-run). Name the residual rather than
claiming coverage.
