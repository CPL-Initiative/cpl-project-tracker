---
title: "Doctrine provenance — the incidents behind CLAUDE.md's rules"
created: 2026-09-27
updated: 2026-09-27
tags: [reference, doctrine]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
  - "[[decision_sheets]]"
---

# Doctrine provenance

`CLAUDE.md` states each rule with its reason. This file holds the incidents,
measurements and superseded wordings behind those rules, moved here verbatim by
the 2026-09-27 prompt audit (`kb/prompt_audit/20260927_claude_md_prompt_audit.md`).
Read it when a rule looks wrong, before you reword one, or when you want the
failure a rule prevents. Each entry names the rule and quotes the lines exactly
as `CLAUDE.md` carried them on 2026-09-27, with that version's line numbers.

When you move more text out of `CLAUDE.md`, add it here the same way: under the
rule's name, verbatim, dated. The rule itself stays in `CLAUDE.md`.

## What belongs in this file

*`CLAUDE.md` lines 11–12, as of 2026-09-27:*

> That single test decides where anything goes, and it is the reason this file
> went from 151 KB to under budget on 2026-08-28 without losing a byte:

*`CLAUDE.md` lines 23–24, as of 2026-09-27:*

> [`docs/reference/lanes/`](docs/reference/lanes/). That was **62% of this
> file**.

## Rule 7 — resolve a stored id through kb/alias_chain.py

*`CLAUDE.md` lines 112–118, as of 2026-09-27:*

> alive. Measured 2026-09-05 — welding CR ids read 44% dead directly and **27%**
> through the chain; articulation identities 36% vs **22%**. `kb/alias_chain.py`
> holds the one `ALIAS_MAPS`, the one `resolve` (a map is a *simultaneous
> permutation*: one lookup per map, in order, never iterated within a map) and
> the one era guard; import them, never copy them. The chain was copy-pasted
> once and the copy drifted to 7 maps against 15 under a comment promising
> lockstep — `tests/alias_chain_single_source_test.py` fails that now.

## Rule 8 — read the memory table before you work

*`CLAUDE.md` lines 139–141, as of 2026-09-27:*

> 8. **READ the memory table BEFORE you work — Rule 8 had no query step until
> 2026-08-10.** The very first thing a session does on a workstream, before
> reading the handoff and before touching code:

*`CLAUDE.md` lines 150–156, as of 2026-09-27:*

> ⚠️ **This exists because a session re-derived THREE settled facts in one run
> (2026-08-10) while the answers sat in `cpl_memory` unread** — the `Student`
> grouping counter, the MAP-student-id privacy constraint, and that 537k rows had
> already been assessed. It wrote 8 rows that day and queried the table **zero**
> times. The playbook is literally named *auto-write-at-checkpoint*; nothing ever
> said read. Sam's own framing applies: Rule 8 is **ingest**, sessions are
> **query** — and the memory table only ever got the ingest half.

## Rule 9 — the checkpoint trigger

*`CLAUDE.md` lines 173–187, as of 2026-09-27:*

> ⚠️ **THE TRIGGER WAS UNREACHABLE WITHOUT A CHECKPOINT — Sam, 2026-09-09:
> *"you have not prompted me for a checkpoint per our rules… the rule has been
> demoted or is now buried."*** `checkpoint_overdue` is computed ONLY by the
> lint, and the only instruction to run the lint is step 0 of `/checkpoint`, so
> the signal that you are overdue fired only once you were already
> checkpointing. It is two git commands — run them at session start, after a
> long stretch, and before any sign-off, and **RUN `/checkpoint` above 6** —
> run it, never offer it (his later ruling, same day):
>
> H=$(ls docs/session_*_handoff.md | sort -V | tail -1)
> git rev-list --count $(git log -1 --format=%H -- "$H")..HEAD
>
> ⚠️ Rule 9's ORIGINAL trigger (*"roughly every ~100K tokens… use proxies"*)
> was unactionable and false (9a: it is on disk). **Twice the trigger has been
> the broken part, not the rule.**

## Rule 9 — run /checkpoint, do not improvise one

*`CLAUDE.md` lines 189–194, as of 2026-09-27:*

> ⚠️ **Run `/checkpoint`; do not improvise one from memory.** Asked to describe
> one under pressure on 2026-08-29 I named 2 of its 13 artifacts and hand-waved
> the rest, and it looked competent. **The artifact list is the checkpoint
> command, not this file** — all 13, none optional:
> [`.claude/commands/checkpoint.md`](.claude/commands/checkpoint.md) is the
> authority.

## Rule 10 — Supabase live-curation safety

*`CLAUDE.md` lines 268–274, as of 2026-09-27:*

> breaks the cron. Six definer functions that truncate live tables were
> internet-reachable this way (2026-08-19); `tests/supabase_function_grants_test.py`
> lints it now. (c) The sandbox cannot reach
> `*.supabase.co` — all Supabase access goes through the MCP tools.
> (Promoted 2026-07-10 from the rotating handoff "Safety patterns" blocks —
> these are standing production-safety orders, not session lore. Worked
> examples: `docs/kb-notes/playbook-trail-crew-method-magic-audit.md`.)

## American spelling

*`CLAUDE.md` lines 292–294, as of 2026-09-27:*

> span** — bare, the sweeper rewrites it (this list read `while (not while)`
> for weeks). **Rendered UI text
> first**, then docs, then comments. Enforced by `american_spelling` in `kb/_docs_audit.py`.

## Funding vocabulary — awaiting measurement

*`CLAUDE.md` lines 323–325, as of 2026-09-27:*

> metric reads **awaiting measurement** — ⚠️ this line said *"no data yet"* until
> 2026-09-13, when his positive-first ruling BANNED that exact phrase, so the
> doctrine file was instructing the words its own guard rejects. "Advancing the

## House voice — state it positively

*`CLAUDE.md` lines 362–365, as of 2026-09-27:*

> are not saying. Declare the thing. ⚠️ **This NARROWS the older rule that
> survives beside it** — a genuine misreading may still be closed off, once,
> where the reader would otherwise land on it; the ban is on the reflex, which
> had become the house tic. Scope matches the mannerly-language rule: outward

## Section headings

*`CLAUDE.md` line 403, as of 2026-09-27:*

> ## Working with the MAP team (added Session 120, 2026-08-05)

*`CLAUDE.md` line 470, as of 2026-09-27:*

> - **Call the effort level (added Session 128, 2026-08-08).** At the top of a

*`CLAUDE.md` line 662, as of 2026-09-27:*

> ## Engineering & UI practices (added Session 32, 2026-06-04)

*`CLAUDE.md` line 691, as of 2026-09-27:*

> ## Obsidian vault wiring (added Session 11, 2026-05-27)

## Decision sheets — always

*`CLAUDE.md` lines 453–455, as of 2026-09-27:*

> waiting on him, never held back for a quorum. ⚠️ **An "always" a session has
> to remember is not one**: the asks had scattered into eleven lane files'
> NEEDS-SAM blocks and only ONE reached §11, so

The same history is told at length in `CPLBrain/decision-sheets/decision_sheets.md`, *Why it audits itself*.

## Presentation rules — the guard

*`CLAUDE.md` lines 590–592, as of 2026-09-27:*

> ⚠️ **Recording a rule and having it fire are two events** — these kept scattering,
> and one was carried out of this file entirely by a relocation.
> `presentation_doctrine` in `kb/_docs_audit.py` fails if any of them leaves.

## Accessibility — verify with npm run a11y

*`CLAUDE.md` lines 614–616, as of 2026-09-27:*

> NOTHING here**: jsdom returns zeroes for every rectangle, so 299 green suites
> sat beside a masthead painting 240px of one cluster over another. Run it
> before you ship a view; add a view in `a11y.config.js`, not a new script.

The same incident is told in [`/a11y-pass`](../../.claude/commands/a11y-pass.md).

## Plain words, not glyphs — the removed marks and the 26 kept

*`CLAUDE.md` lines 649–658, as of 2026-09-27:*

> - ⚠️ **THE THREE APPROVED EXCEPTIONS ARE GONE — REMOVED, NOT RECOLORED** (Sam,
> 2026-09-09). 📋 To-Do · 🧭 guidance · ⚖️ Governance: all six rendered sites
> deleted, because *if any are crucial* is a CONDITION and none was — each
> already had its word beside it. **Do not restore a mark here.** Sweep:
> [`/a11y-pass`](.claude/commands/a11y-pass.md).
> - ✅ **THE SWEEP IS CLOSED AT 26 (Sam, 2026-09-09: *"Keep all 26 glyphs as is
> for now."*)** — Star designations, `✕`, `✎`, `⛔`, `⚠`, copy, and arrows that
> carry sequence. ⚠️ **RULED, not pending — do not sweep them**; none is an
> emoji. Clearing one repeats the `⇄` error: a mark Sam chose in July, removed
> on a plain-words reading, caught only by its own test.
