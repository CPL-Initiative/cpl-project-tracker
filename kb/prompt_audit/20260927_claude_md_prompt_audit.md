---
title: "CLAUDE.md prompt audit — 2026-09-27"
created: 2026-09-27
tags: [audit, doctrine]
---

# CLAUDE.md prompt audit — 2026-09-27 (S295, SkyHarbor)

Sam, 2026-09-27: *"Thinking we should clean up claude.md"*, taken as queue item 0 and
run as `/claude-api prompt-audit`. The audit looks for instructions that no longer fit the
model, the repository, or each other. Length alone is not a finding.

## Assumptions (Step 0)

- **Scope.** The three `CLAUDE.md` files every three-repo session loads:
  `cpl-project-tracker/CLAUDE.md` (838 lines, 61,867 B before this audit),
  `CPLBrain/CLAUDE.md` (167 lines, 10,319 B) and `cpl-knowledge-base/CLAUDE.md` (70 lines,
  3,434 B). Together they are about 75 KB of every session's context.
- **Skipped** (not named in the request): `.claude/commands/*`, every `SKILL.md`,
  `CPLBrain/AGENTS.md`, `.claude/roles/`, and `cpl-knowledge-base/claude/CLAUDE.md`, the
  canonical user-level copy that `claude/install.sh` writes into `~/.claude` (an edit there
  reaches every project on a machine). Settings files were not read. Two cross-file conflicts
  that reach into skipped files are reported as flags (F15, F16).
- **Target model.** The current Claude generation that runs these sessions. Nearly every line
  of the tracker file dates from August and September 2026 (40 commits touched it between
  2026-09-05 and 2026-09-27), so the file was written for current models and little of it is
  written for an older one. Its dated patterns are patch accretion, not model fossils.
- **Provenance.** The local clones are shallow (50 commits), so `git blame` reaches four days
  back. Provenance comes from the dates the file writes beside its own rules, and from the
  GitHub commit list for `CLAUDE.md`.
- **Applying edits.** The request asks for a cleanup, so the audit applied its medium- and
  high-confidence Group 1 and history-narrative findings to the tracker file. Stale facts and
  conflicts between instructions (Group 2) are proposed only, for Sam to confirm, as the audit
  procedure requires. They are cards on the decision sheet. The vault and knowledge-base files
  carry only proposed findings, so neither changed. The proposed items are the eight cards of
  [CLAUDE.md Cleanup](https://claude.ai/artifact/Kd6K7yrAfGQKCtVyd4bhX5)
  (`kb/_build_claude_md_audit_decision_sheet.py`).

## Summary

Three findings matter most. **The context-pressure meter Rule 9a promises does not run in the
standard session** (F1): the file says it fires from the repo's settings, and
`scripts/check_hooks_live.py` shows those settings never load when three repos are attached.
So nothing warns a session before a compaction unless it runs the meter by hand. **The file
gives two incompatible instructions about the standing open-asks sheet** (F2): rebuild it and
hand over the link at every checkpoint, and do not republish it. **Warning marks no longer
single anything out** (F11): 42 ⚠️ and about 240 all-capital words across 838 lines, so the
file cannot mark the few rules that failed again after being stated plainly.

| Group | Findings | Applied | Proposed | Flag |
|---|---|---|---|---|
| 1 — dated prompt text | 1a pressure language; 1d migration-relative phrasing (4 sites); 1b thinking-depth prose | 4 sites | 1 (F11) | 1 (F17) |
| 2 — configuration files | history narratives (11 sites), stale facts (8), conflicts (4), volatile numbers (2) | 11 sites | 11 (F1–F10, F12) | 3 (F13, F15, F16) |
| 3 — tool descriptions | not applicable (none in scope) | | | |
| 4 — request config | not applicable (no request-building code or subagent definitions in scope) | | | |

F14 sits outside the groups: it concerns the vault's updater script, not prompt text.

## What the audit applied (tracker `CLAUDE.md`, this PR)

Fifteen hunks, each moved **verbatim** into
[`docs/reference/doctrine_provenance.md`](../../docs/reference/doctrine_provenance.md) under
the rule it belongs to. The rules stay; their stories move one hop away, behind a pointer in the
deep-reference list. The file drops from 61,867 B to 59,436 B, under its 60,000 B budget.

| Site (pre-audit lines) | Pattern | What moved or changed |
|---|---|---|
| 11–12, 23–24 | 2 · history narrative | "the reason this file went from 151 KB to under budget…" (now false as well: the file stood at 1.03× its budget); "That was 62% of this file." |
| 112–118 | 2 · history narrative | The alias-chain copy-paste story; the rule and one measurement stay. |
| 139–140 | 1d · migration-relative | "— Rule 8 had no query step until 2026-08-10" left the rule's name. |
| 150–156 | 2 · history narrative | The 2026-08-10 incident; one line of reason and Sam's ingest/query framing stay. |
| 173–187 | 2 · history narrative, 1d · patch accretion | The trigger post-mortem ("unreachable without a checkpoint", "the ORIGINAL trigger", "twice the trigger has been the broken part"); the commands and Sam's run-never-offer ruling stay. |
| 189–192 | 2 · history narrative | The first-person anecdote; the reason stays as a clause. |
| 268–274 | 2 · history narrative | The 2026-08-19 grants incident and "(Promoted 2026-07-10 … not session lore)". |
| 292–293 | 2 · history narrative | "(this list read `while (not while)` for weeks)". |
| 323–325 | 1d · migration-relative | "this line said *no data yet* until 2026-09-13…"; the rule now says *awaiting measurement, never "no data yet"*. |
| 362–365 | 1d · migration-relative | "This NARROWS the older rule that survives beside it … the house tic" became the current rule. |
| 453–455 | 2 · history narrative | The eleven-lane-files story, already told in `decision_sheets.md`. |
| 590–591 | 2 · history narrative | "Recording a rule and having it fire are two events — these kept scattering…"; the guard sentence stays. |
| 614–615 | 2 · history narrative | "299 green suites … 240px"; also told in `/a11y-pass`. |
| 649–658 | 1d · migration-relative, 2 · history | "REMOVED, NOT RECOLORED … all six rendered sites deleted, because…" and the `⇄` story; both prohibitions stay. |
| 403, 470, 662, 691 | 2 · history narrative | "(added Session N, date)" left four headings. |

Housekeeping under Sam's American-spelling rule, not an audit pattern: *maths* → *math* at two
sites. The `american_spelling` lint's `BRITISH_FORMS` list does not carry *maths*; adding it is a
follow-up, since it would flag the word across the docs corpus.

**Verified:** `kb/_docs_audit.py` reports no finding on `CLAUDE.md` or the new file, and the
`oversized_doc` finding on `CLAUDE.md` is gone; `critical_rule_doctrine` and
`presentation_doctrine` pass on the live file (`tests/docs_audit_test.py` 140/140);
`tests/kpi_history_no_gaps_test.py` 8/8; `tests/js_suite_gate_test.py` 36/36; and
`kb/_consolidation_loss_audit.py --baseline HEAD:CLAUDE.md` finds 98.45% of the old file's
shingles present, 24 join seams, the ten Critical Rules and the section order unchanged, and one
candidate loss: the *maths* span above.

## Findings, highest confidence first

**High** — contradicted by the repository itself. Proposed; not applied.

**F1 · tracker `CLAUDE.md`:204 · Group 2, stale fact.** *"✅ It fires from the repo's own
`.claude/settings.json` (PostToolUse; tested)"*. `scripts/check_hooks_live.py` says of the
three-repo layout this file requires: *"Nothing in that file loads. Not the PreToolUse guards, not
the SessionStart hooks, not the PostToolUse context-budget probe."* Its `--fix` installs only the
PreToolUse guards at the root (`scripts/install_prompt_guards.py` carries no PostToolUse), and
`scripts/install-context-hook.ps1` registers the meter at user level on a Windows machine. In a
cloud session nothing runs the meter. Action: rewrite (hunk F1).

**F2 · tracker `CLAUDE.md`:434 against 744–748 · Group 2, conflict.** *"Rebuild it at every
checkpoint and hand over the link."* against *"Do not republish it as-is: its store is keyed to
the 21 cards Sam answered and the builder now holds 10."* `docs/reference/decision_sheets.md`
(lines 303–313) holds the procedure that reconciles them: a sheet whose cards changed gets a
fresh `SHEET_ID` and artifact. Action: rewrite 434 (hunk F2).

**F3 · tracker `CLAUDE.md`:718–719 · Group 2, stale fact.** *"The live Roadmap table + the two
most recent session narratives stay here (Rule 8 budget)."* §11 holds the table alone, and the
narrative budget is Rule 9's. Action: rewrite (hunk F3).

**F4 · tracker `CLAUDE.md`:182 · Group 2, stale fact.** *"all 30 lane files"*: 32 exist.
Action: drop the count (hunk F4).

**F5 · tracker `CLAUDE.md`:265 · Group 2, stale fact.** *"deactivatable in the 🧭 pane"*. The
🧭 mark left every rendered site on 2026-09-09 (this file's Presentation rules), and guidance rows
toggle in the Sierra training tab (`sierra_training.js`, `toggleGuidance`). Action: rewrite
(hunk F5).

**F6 · `CPLBrain/CLAUDE.md`:155 · Group 2, stale fact.** *"Claude Code skills (17 skills)"*:
16 skill folders exist. Action: drop the count (hunk F6).

**F7 · `cpl-knowledge-base/CLAUDE.md`:1 · Group 2, stale fact.** The knowledge base's file is
titled *"CPL Project Tracker — Claude Code instructions"*. Action: rewrite (hunk F7).

**F8 · `cpl-knowledge-base/CLAUDE.md`:66 · Group 2, stale fact.** *"The `cpl-project-tracker`
`/checkpoint` (Rule 8)"*: the checkpoint rule is Rule 9; Rule 8 is the memory read. Action:
rewrite (hunk F8).

**F9 · `cpl-knowledge-base/CLAUDE.md`:19–22 · Group 2, conflict.** *"Use WebFetch against the
raw base URL…"*. The file names `claude/CLAUDE.md` as its canonical version, and that copy reads
the local clone first (its lines 29–31); a session attached to this repo has every file on disk.
Action: rewrite (hunk F9).

**Medium**

**F10 · `CPLBrain/CLAUDE.md`:47–52 · Group 2, stale content.** *"Before starting any task, also
check these for in-progress migrations and pending TODOs"*, pointing at
`.claude/IMPLEMENTATION-TODO.md` and `.claude/SKILLS-MIGRATION-PLAN.md`. Both are dated
2025-10-31 and plan the upstream COG framework's own migration, whose skill list no longer
matches the vault. Every session is told to read them first. Action: remove the pointer; keep the
line about reading a referenced file from disk (hunk F10).

**F11 · tracker `CLAUDE.md`, whole file; `CPLBrain/CLAUDE.md`:3, 18, 30, 43, 102 · Group 1a,
pressure language.** 42 ⚠️ before this audit (35 after the history moves), about 220 all-capital
words beyond acronyms after the moves, and headings marked *(do not violate)* and *(non-negotiable)*; the vault
file marks four headings *(MANDATORY)* and one rule *"MANDATORY — DO THIS BEFORE CITING ANY
NUMBER"*. When most rules carry a warning mark the mark stops separating any of them. Every
marker here is recent and most follow a real failure, and Sam asked for prominence on the
checkpoint rule (*"the rule has been demoted or is now buried"*, 2026-09-09), so the dial is his.
Action: rewrite, proposed (sample hunk F11): keep ⚠️ on the rules whose failure recurred after
they were stated plainly (Rule 8's read step, Rule 9's run-never-offer trigger, Rule 7's
alias-chain resolve, decision-sheet replies read first, the 26 kept glyphs) and set the rest in
sentence case with bold.

**F12 · tracker `CLAUDE.md`:586 · Group 2, volatile number.** *"COBI's 38 tabs discovered from
its own nav"*. `a11y.config.js` discovers routes at run time because, in its own words, a
hand-maintained count silently goes stale. Action: drop the number (hunk F12).

**Flags** — no edit proposed; a decision or a re-measurement comes first.

**F13 · tracker `CLAUDE.md`:24–27 · volatile numbers.** *"Its briefing budget is 17,951 chars
against ~85,500 of verified rows — about 21% fits"*. No constant in code carries 17,951, and the
row total moves daily. The reason stands; the numbers need a re-measure or a date.

**F14 · `CPLBrain/cog-update.sh`:62 · outside the prompt text.** The vault's updater lists
`CLAUDE.md` among upstream framework files. `--force` replaces it (with a backup) and
interactive mode updates on Enter. Every vault rule Sam wrote lives in that file: the naming
convention, session memory, on-the-fly capture, the three-repo check, the live-data rule and the
curation boundary. The `update-cog` skill checks for local customizations first. Proposed on the
sheet: one line in the vault `CLAUDE.md` telling `/update-cog` to merge upstream changes into it
by hand, since the session that runs the update loads that line.

**F15 · `CPLBrain/CLAUDE.md`:43–45 against `cpl-project-tracker/.claude/commands/checkpoint.md`
step 11 · conflict with a prohibition.** *"update the skill's SKILL.md before ending the
session"* against *"Do NOT touch … anything under `.claude/skills/` … those are upstream COG
FRAMEWORK files"*. Nine of the vault's 16 skills are upstream (listed in `cog-update.sh`) and
seven are the vault's own, and the upstream `braindump` skill already carries a local edit, Sam's
on-the-fly mode of 2026-08-30, which an upstream update would overwrite. Proposed on the sheet:
self-improvement covers the seven vault skills; a gap in an upstream skill goes into the session
note.

**F16 · `cpl-knowledge-base/CLAUDE.md` against `claude/CLAUDE.md` · drift.** The root file
calls the other canonical and has drifted from it (F9 is one symptom). Which copy the
knowledge-base repo keeps is a decision, not a fix.

**F17 · tracker `CLAUDE.md`:455 · Group 1b.** *"stay single-threaded and think harder"* is prose
that steers thinking depth, which effort controls on current models. It works here as the
contrast with fan-out, so no edit.

## Proposed diff (not applied)

One hunk per finding. Line numbers are the tracker file after this PR.

```diff
# F1 — cpl-project-tracker/CLAUDE.md:204-206
-   ✅ **It fires from the repo's own `.claude/settings.json` (PostToolUse; tested)** —
-   mechanics:
-   [`docs/reference/context_pressure_hook.md`](docs/reference/context_pressure_hook.md).
+   It fires only where a session loads it: the repo's `.claude/settings.json` in a
+   session rooted here, or user-level settings where `scripts/install-context-hook.ps1`
+   registered it. **A three-repo session loads neither, so run the meter yourself
+   beside Rule 9's commit count** — at session start, after a long stretch, and before
+   any sign-off. Mechanics:
+   [`docs/reference/context_pressure_hook.md`](docs/reference/context_pressure_hook.md).

# F2 — cpl-project-tracker/CLAUDE.md:434
-  Rebuild it at every checkpoint and hand over the link.
+  Rebuild it at every checkpoint and hand over the link. A sheet whose cards
+  changed is published under a fresh `SHEET_ID` and artifact, because its replies
+  are keyed to card position ([`decision_sheets`](docs/reference/decision_sheets.md)).

# F3 — cpl-project-tracker/CLAUDE.md:718-719
-Trust-Card auditor work, or CID/CIDx pathway decisions. The live Roadmap table
-+ the two most recent session narratives stay here (Rule 8 budget).
+Trust-Card auditor work, or CID/CIDx pathway decisions. The live Roadmap table
+stays here.

# F4 — cpl-project-tracker/CLAUDE.md:182
-   updates only the row leaves all 30 lane files to go stale — that is the
+   updates only the row leaves the lane files to go stale — that is the

# F5 — cpl-project-tracker/CLAUDE.md:265
-  a live `sierra_guidance` row (id `cb226a48`, deactivatable in the 🧭 pane),
+  a live `sierra_guidance` row (id `cb226a48`, deactivatable in the Sierra training tab),

# F12 — cpl-project-tracker/CLAUDE.md:586
-  ~100s, every view we ship — COBI's 38 tabs discovered from its own nav, plus
+  ~100s, every view we ship — every COBI tab, discovered from its own nav, plus

# F6 — CPLBrain/CLAUDE.md:155
-- `.claude/skills/` — Claude Code skills (17 skills)
+- `.claude/skills/` — Claude Code skills

# F10 — CPLBrain/CLAUDE.md:47-54
 ## Ongoing Work
 
-Before starting any task, also check these for in-progress migrations and pending TODOs:
-
-- `.claude/IMPLEMENTATION-TODO.md` — active implementation work
-- `.claude/SKILLS-MIGRATION-PLAN.md` — skills migration status
-
 If the user references a project file or migration that is not in your current context, read it from disk before saying it does not exist. Files visible in the user's sidebar are real even if not yet loaded into the session.

# F7 — cpl-knowledge-base/CLAUDE.md:1
-# CPL Project Tracker — Claude Code instructions
+# CPL Knowledge Base — Claude Code instructions

# F9 — cpl-knowledge-base/CLAUDE.md:19-22
-Use WebFetch against the raw base URL to pull only the specific file(s)
-needed — do not mirror the whole repo into context. The four files under
+Read from the local clone when one is on disk (a session attached to this
+repo has it); otherwise use WebFetch against the raw base URL to pull only the
+specific file(s) needed — do not mirror the whole repo into context. The four files under

# F8 — cpl-knowledge-base/CLAUDE.md:66
-sensitivity audit. The `cpl-project-tracker` `/checkpoint` (Rule 8) does **not**
+sensitivity audit. The `cpl-project-tracker` `/checkpoint` (Rule 9) does **not**

# F11 (sample of the sweep) — cpl-project-tracker/CLAUDE.md:557, 568
-## Presentation rules — EVERY view we ship (non-negotiable)
+## Presentation rules — every view we ship
-- **FIRST LIGHT, ALWAYS — INCLUDING ARTIFACTS AND PROTOTYPES (Sam, 2026-08-19).**
+- **First Light, always, including artifacts and prototypes (Sam, 2026-08-19).**
```

The F14 and F15 lines are drafted on the decision sheet, beside Sam's choice.
