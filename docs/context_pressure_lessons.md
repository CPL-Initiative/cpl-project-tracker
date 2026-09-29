---
title: Context pressure and doctrine probes — lessons
date: 2026-08-29
tags: [lessons, context, checkpoint, doctrine, testing, tooling]
artifacts:
  - kb/_context_budget.py
  - scripts/context-pressure-hook.sh
  - scripts/install-context-hook.ps1
  - tests/context_budget_test.py
  - docs/scenarios/
  - kb/_doctrine_scenarios.py
related:
  - docs/kb-notes/methodology-context-pressure-is-measurable.md
  - docs/kb-notes/methodology-testing-a-rule-without-cueing-the-answer.md
  - docs/obsidian_vault_hygiene_lessons.md
---

# Context pressure and doctrine probes — lessons

## 2026-08-29 · Session 206 (SkyCrush) — the compact we did not see coming

### (a) What was learned

**The session auto-compacted at 786,077 tokens with the checkpoint 150K stale.**
`compactMetadata` recorded `preTokens: 786077`, `postTokens: 7678`,
`cumulativeDroppedTokens: 778399`. The only warning was the compaction itself.

⭐ **Rule 9's stated reason was false, not merely unobservable.** It read *"Claude
Code doesn't expose an exact counter; use proxies."* It does — `message.usage`
carries the live context size on every assistant turn of the session transcript,
and every compaction writes its own `compact_boundary` receipt. We had already
flagged that trigger as a condition nothing could act on; what nobody had done
was **check whether the premise was true**. A false impossibility is more
expensive than a hard problem, because nobody re-opens it.

**Thresholds derived from a round multiple look principled and are not.** The
first draft set WARN at 2× the measured checkpoint cost (100,000). Its own test
failed it by **336 tokens**: the worst measured turn was 50,425 and a full
checkpoint 49,723, so one heavy turn plus one checkpoint is 100,148. The
threshold did not fit the two things it existed to make room for. WARN is now
their **sum** (110,000); EMERGENCY is one checkpoint (50,000).

**Sam's challenge reframed the whole lane.** Asked whether my scoring of the
scenarios was measurement or my own reading, the answer was: my own reading. That
is unfixable from inside the session — encoding the scenarios does not help,
because I would write those checks from the same contaminated head. Only a cold
session is independent evidence.

**And his second question dissolved a tension I had accepted.** *"Can your
handoff set up the next session to check our scenarios against rules only rather
than cueing up the next session with cheater context?"* The fix is not a thinner
handoff — degrading the thing that works to measure the thing that might not is a
bad trade. It is **two roles**: the next numbered session is the *experimenter*
with full context; disposable spawned sessions are the *subjects*, getting only
the auto-loaded `CLAUDE.md` plus one disguised prompt.

### (b) Current state

- `kb/_context_budget.py` — reads the counter, self-calibrates its ceiling from
  compactions the transcript has actually seen, and carries the hook logic
  (announce-once, escalation, fail-soft). Cross-platform, stdlib only.
- `scripts/context-pressure-hook.sh` — thin macOS/Linux wrapper.
  `scripts/install-context-hook.ps1` — Windows installer.
- `tests/context_budget_test.py` — 22 checks, wired into CI, replaying the real
  2026-08-29 values in **both** directions: it must warn 10 turns early AND stay
  quiet at 633,409 where a checkpoint had just been requested.
- `docs/scenarios/` — probe protocol, pre-committed rubric, five disguised prompts.
- Scenario ledger **7 of 9**, with a runtime dimension so guards leaving no
  committed trace can be scored at all.

⚠️ **The meter is inert until the hook is registered.** It is PULL until then —
the exact failure mode it exists to fix.

### (c) Strategic roadmap

The probes are the open question, and they are the only thing that answers Sam's
original challenge. Everything scored so far is a contaminated reading.

Parked deliberately: the two uncaught scenarios (a `cpl_memory` row contradicting
doctrine; a conditional checkpoint item nobody can audit) stay visible rather
than being papered over.

### (d) Next concrete step

Spawn one cold session per probe in `docs/scenarios/probes/`, score against
`rubric.md` **without editing it**, and report **holes, not a coverage score** —
a pass is weak evidence, a fail is strong.

### Three failures worth remembering, all the same shape

Each is two things that read correctly alone and are wrong together:

1. **The hook pointed at a settings block that did not exist** — it said *"see
   Rule 9a for the exact block"*; Rule 9a named `PostToolUse` and stopped.
2. **`self_corrected_word_pair` ignored its own advice** — its message said to
   use a code span "which `prose_only()` masks", and the rule matched raw text
   and never called it. The documented remedy did not work, so the guard flagged
   `CLAUDE.md`'s own post-mortem *quoting* the corruption; the only way to clear
   it would have been to delete the explanation.
3. **The settings JSON was presented as if it were a command.** Sam pasted it
   into PowerShell and got *"Unexpected token ':'"*. A correct JSON snippet under
   a heading of correct shell commands, and the reader has no way to tell which
   kind of block it is unless the block says so.

### Two process notes

- **Windows is the target, and it is PowerShell 5.1.** Three bugs in the
  installer would have hit only there: `ConvertFrom-Json -AsHashtable` is 6+,
  `ConvertTo-Json` defaults to `-Depth 2` (silently writing `System.Object[]`),
  and `Set-Content -Encoding UTF8` emits a BOM. ⚠️ **PowerShell cannot be
  executed in the sandbox** — the script is reviewed, not run.
- **A stale check-in prompt is a stale pointer.** The self-scheduled CI check-in
  named a `jq` failure mode that had been deleted an hour earlier, and would have
  sent the next wake chasing something that could not happen.
