---
title: "A pipeline's exit status is its last command's, so `| tail` reports success for a failing suite"
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, testing, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
---

# A pipeline's exit status is its last command's

## The failure

Running a test suite as `npm test 2>&1 | tail -14` and reading the reported exit
code tells you whether **`tail`** succeeded. It essentially always does. The
suite's own status is discarded the moment it is piped.

On 2026-09-09 this produced a confident, wrong report twice in one session: "the
full suite exited clean" — from a run whose summary line, printed in the very
text being tailed, said `1 of 318 test file(s) FAILED`. The number was on screen.
The exit code was consulted instead, because an exit code feels like the
authoritative answer and a summary line feels like prose.

## Why it survives review

The command looks careful. Piping to `tail` is the normal way to keep a long
suite's output from flooding a transcript, and the failure is silent in both
directions: a passing suite and a failing suite both report `0`. Nothing about
the output shape changes when the suite goes red — only a line further up that
the truncation may or may not have kept.

It also degrades gracefully in the wrong way. The first run *was* clean, so the
technique appeared to work, and the habit was established before the run that
needed it to be right.

## The fix

Capture the status before anything can mask it, then look at the output
separately:

```bash
npm test > /tmp/full.log 2>&1; echo "REAL_EXIT=$?"
grep -E "test file\(s\) (FAILED|passed)" /tmp/full.log
```

The next run after adopting this caught a genuine `exit 1`.

Shell alternatives when a pipe is genuinely wanted: `set -o pipefail`, or read
`${PIPESTATUS[0]}` in bash. Both are easy to forget under time pressure; writing
to a file and echoing `$?` has no such trap because there is no pipeline.

## The generalizable rule

**Any transformation between a command and your eyes can drop the signal you are
reading for.** A pipe drops exit status. `head` truncates the summary that a test
runner prints last. A `grep` filter shows only matches, so it is silent on a
crash whose output does not match the pattern — the same shape as a monitor that
greps for a success marker and stays quiet through a crashloop.

Ask of any verification command: *if the thing I am checking for had failed,
would this command's output actually differ?* If the answer is "only in a line
that might be cut", the command is not a check.
