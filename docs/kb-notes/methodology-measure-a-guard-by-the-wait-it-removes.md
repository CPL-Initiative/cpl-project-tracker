---
title: Measure a permission guard by the wait it removes, never by the decision it prints
created: 2026-09-20
updated: 2026-09-20
tags: [methodology, permissions, hooks, tooling, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/approval_prompt_hooks]]"
  - "[[docs/kb-notes/methodology-verify-the-premise-before-you-build-on-it]]"
artifacts:
  - scripts/check_hooks_live.py
  - scripts/supabase_sql_guard.py
---

# Measure a permission guard by the wait it removes, never by the decision it prints

> **One-sentence summary** — a guard that prints `allow` has done nothing
> until the prompt it was built to remove stops appearing, and the only
> instrument that shows that is the wait between a tool call and its result.

## Context

Five sessions worked the Allow-SQL storm. Each one reasoned from what the
guard printed, what the docs said, or what the previous handoff claimed: the
settings never load; auto mode ignores allow rules; the hook is the answer.
Sam kept seeing the prompt. On 2026-09-20 the session read its own transcript
instead. Every SQL call carried a `hook_success` entry with `allow` in under a
tenth of a second, and every SQL call still waited on Sam, from 43 seconds to
21 minutes. The allow-listed GitHub and Supabase reads returned in under a
second. The guard was working exactly as written and changing nothing.

The checker made it worse. It read the repository's own settings file, found
that no session was rooted there, and said INERT, while the guards were live
from the session-root file the setup script writes. A check that inspects
configuration reports configuration. Only the transcript reports effect.

## The method

1. **Find the record the harness keeps.** Claude Code writes every hook run
   and every tool call to the session transcript under
   `~/.claude/projects/<root>/<session>.jsonl`. `hook_success` entries carry
   the hook name, its stdout and exit code; `tool_use` and `tool_result`
   entries carry timestamps.
2. **Measure the wait, per tool.** The gap from a tool call to its result is
   the prompt, plus the call itself. A read that takes a second did not
   prompt. A read that took five minutes did.
3. **Use a control.** A tool covered by a plain allow rule sits beside the
   hooked tool in the same session. If the rule's tool returns at once and
   the hook's tool waits, the hook's decision is advisory and the rule is
   authoritative, whatever either one prints.
4. **Read the prompt's own text before blaming the code.** An organization's
   connector control says "Your organization requires approval for this
   tool". A tool the server marks as always requiring approval offers no
   "don't ask again". Absent both, the remaining actor is the mode's own
   classifier, and the documented lever is a rule.
5. **Write the checker to read what loads, and the fix as the smallest grant
   beside its guard.** The `execute_sql` rule is safe only next to the hook
   whose deny still fires first, and a test pins the pairing.

## The rule

A guard is verified by the absence of the prompt in the transcript, with a
control tool in the same session, and never by its own output or by a file
that looks correctly configured. And a session does not grant itself a
permission: when the auto-mode classifier refuses the commit that adds the
rule as self-modification, that refusal is the human gate working, and the
line waits for a person.

## See also

`docs/reference/approval_prompt_hooks.md`, 2026-09-20 section, holds the
measurement table and the doc quotations.
