---
name: conductor-brief
description: Write the brief a conductor session gives a worker, second reader, checkpoint-docs worker or pr-gate in this repo. Use when a conductor is about to spawn or task an agent (Agent tool, SendMessage with a next task), split a job into worker tasks, or ask for a review before a merge or dispatch. Covers the brief's shape, what the agent definitions in .claude/agents/ already carry so the brief need not repeat it, and the S652 review rules (self-recall test for a new matcher, rewiring check on an M-ID change, second reader before a dispatch on changed shared reader code, one finding list per PR, replace a design on a third round of one finding class).
---

# Brief a worker or reviewer

A worker knows only its brief and its agent definition. The brief carries the task; the definition carries the
standing limits. `docs/reference/conductor_mode.md` is the conductor's page; this skill is its brief-writing step.

## Pick the agent

| Agent (`.claude/agents/`) | For | Model |
|---|---|---|
| `worker` | one concern on one `claude/*` branch: build, fix, plan, receipt | Opus |
| `second-reader` | read-only review that tries to refute by running code; ends with a verdict | Opus |
| `checkpoint-docs` | Rule 9's documents; drafts the `cpl_memory` receipt | Opus |
| `pr-gate` | five lines on one PR: `test` on the head, newest comment, mergeable, advice | Haiku |

A worker that writes shared data or changes an apply runs at high effort (pass `effort: "high"` on the Agent call).

## What the definitions already carry (do not repeat it)

`worker`: never merges and holds no Supabase tools (SQL comes back as one SELECT returning one JSON value); no
dispatch, paid run, subscription, empty commit, force-push or comment unless the brief says so; fetch by name; no repository copies and
scratch in a scratchpad subfolder with `python3 -I`; `git add` then `check_generated.sh` and its last line; merge
`main` with a merge commit and regenerate; a new test's workflow and floor; the Pages allowlist line; `date -u` before
a time; never print a receipt whole; American spelling and plain active prose; the trailer lines and PR footer; a
default report cap. `second-reader`: read-only, refute by running code, the severity tags, the verdict line, the
M-ID rewiring check and the self-recall test. `checkpoint-docs`: `checkpoint.md` as authority, the handoff's shape,
lanes under 20,000 bytes, the lane tests, summaries at most 400 characters.

## The brief's shape

1. **Goal and why.** One paragraph: what to build and the failure or ask behind it, with the issue or PR number.
2. **What is ruled.** Each ruling with its `cpl_memory` slug and the person's words verbatim, with who and when.
3. **Design decisions made.** What the conductor already chose, so the worker does not reopen it; name the files it
   may not touch (one writer per file).
4. **Where to start.** Branch name and base; the files and docs to read first.
5. **Tests that guard the failure mode.** The input that would have caught the mistake, committed as a test.
6. **The report wanted**, with a word cap: the PR and head sha, the specific numbers or verdict needed.
7. **What the definition does not know:** the session link for the trailer and footer, any limit lifted in words
   ("you may comment on #N"), and the worktree to serve from for a reader.

## Review rules (S652, 2026-11-14)

- **A new matcher is gated by a self-recall test.** Before a regex, classifier rule or title match ships, it runs
  against records whose answer is already held, and the brief asks for the right and wrong counts.
- **A reader on an M-ID change checks the rewiring** of everything that depends on the ids, not the choice of id.
- **A second reader before any dispatch that uses changed shared reader code**, even when the PR merged clean.
- **One finding list per PR.** Wait for every reader to report, merge their findings into one list, then brief one
  fix. A fix per reader starts rounds that undo each other.
- **A third round of the same finding class means replace the design.** Residue of a replaced design may merge
  when nothing consumes its output yet; say so on the PR.

## Before sending

- Run `date -u` if the brief states a time.
- Check the brief names the branch, the base, the report cap and the session link.
- Read the PR's comments to the last page before briefing a fix or a merge: the merge-read guard refuses a merge
  without a read in the last 10 minutes.
