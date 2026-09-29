---
title: A new assertion must fail in the shape the grid counts — or the grid reads "0 failing" over a failed run
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, sierra, smoke-test, a-b, instrumentation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-assert-what-retrieval-returns]]"
  - "[[methodology-what-might-qualify-is-a-different-question-from-who-already-grants-it]]"
artifacts:
  - .github/workflows/cpl-chat-preview-ab.yml
  - chatbox/smoke_test.sh
  - tests/sierra_prospective_credit.test.js
---

# A new assertion must fail in the shape the grid counts — or the grid reads "0 failing" over a failed run

> **One-sentence summary** — An instrument that summarizes a log by matching error lines is blind to any error line it was not written to match, so a new assertion has to print its failure in a shape the summarizer already counts, and a test has to pin that every assertion does.

## Context

The cpl-chat preview A/B (`cpl-chat-preview-ab.yml`) runs the smoke suite
against production and against the candidate, then compares the two logs. Its
compare step counts a failure only when a line matches one of four shapes:
`<label>: expected answer to match`, `<label>: answer should NOT match`,
`empty answer for <label>`, `curl failed for <label>`. Two assertions added on
2026-09-18 — every mode fails when the answer opens with a remark about the
question, and 7c's course-level answer must appear in the head of the answer —
printed two new shapes. Run 35314469546 reported the candidate at **0 failing
assertions, no regressions** while the candidate's own log ended `SMOKE TEST
FAILED`. The only tell was the header: it read "0 failing assertion(s)"
rather than "ALL MODES OK", because the literal string was absent.

## The claim

A summarizer's pattern list is the whole of what it can see. Adding a check
to the thing it summarizes does not add it to the summary. So:

1. A new assertion prints its failure in a shape the summarizer counts. Here
   that is `<label>: expected answer to match …` or `<label>: answer should
   NOT match …`, whatever the assertion actually measured — the head of the
   answer, a count of names, a first-sentence opener.
2. A test pins it: every `::error::$label: …` line in the smoke script must
   begin with one of the counted shapes (`sierra_prospective_credit.test.js`
   block 9). A helper added later without the shape fails that test on the
   day it lands, not on the day its grid lies.
3. Read the summary's tell, never only its verdict. "0 failing" is not "ALL
   MODES OK"; when the two differ, something failed outside the pattern list.

## How we got here

The candidate's answer in `chat_interactions` (`00b7168f`) was read directly
and showed the head check must have failed (no course code in the first 700
characters), which the grid had not reported. The pre-existing
`answer_must_name_at_least` helper turned out to have the same gap — its
error line ("named only N of M") had never been counted either, so a
regression in 16a's district roster would have been invisible to the A/B
for as long as it existed. All three lines now take a counted shape
(PR #1611, commit `01103aec`).

## When this applies (and when it doesn't)

It applies to any instrument that reduces free text to a verdict by pattern:
the A/B compare, a CI log scraper, a lint that greps for markers, a dashboard
that counts `::error::` lines by prefix. It does not apply where the check
itself sets an exit code the caller reads — a failing exit is shape-free.
The fix is never to widen the summarizer's pattern list on demand; it is to
give every producer the same shape and pin it, so the list can stay short.

## See also

- `[[docs/cpl_assistant_lessons]]` — 2026-09-18 (S275) entry
- PR #1611 — the parseable error lines and the block-9 guard
- `[[methodology-assert-what-retrieval-returns]]` — the assertion side of the same instrument

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
