---
title: A copy detector must read the rendered string, not the lines the author typed
created: 2026-08-14
updated: 2026-08-14
tags: [methodology, testing, static-analysis, ui-copy]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/team_phrase_lessons]]"
  - "[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]"
artifacts:
  - tests/team_phrase_affordance.test.js
---

# A copy detector must read the rendered string, not the lines the author typed

**Claim.** A grep-style guard over user-facing copy will report **clean** while
the copy is live, because the string a user reads is assembled at runtime from
fragments the author split across source lines. Before matching, reconstruct the
rendered text: strip comments, then join concatenated string literals. Otherwise
the guard's silence means nothing.

## The instance

A CI guard was added to stop a specific instruction from reappearing — telling
people to *"sign in on the Team & RACI tab"*, a tab that no longer offered the
credential being described. Two rounds of false readings, opposite in direction:

**Round 1 — false positives.** It flagged eleven files, four of which mention the
phrase **only inside comments explaining that the copy was removed**. The
detector could not tell rendered text from prose *about* rendered text, so it
reported the fix as the defect.

**Round 2 — false negatives, worse.** After stripping comments it reported clean
— while **five live instances sat in a single file**. They looked like this:

```js
alert("Could not save the change — renew your session on the "
  + "Team & RACI tab (or enter the team phrase in the header) and press Save again.");
```

Any pattern of the form `verb …{0,90} Team & RACI` has to cross `" + "` — a
quote, a plus, a newline, indentation, another quote — to see it. A character
class like `[^."]{0,90}` **cannot** cross a quote, by construction. The string is
obvious to a reader and invisible to the regex.

## The fix

```js
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}
function joinConcats(s) {
  var prev;
  do { prev = s; s = s.replace(/"\s*\+\s*"/g, "").replace(/'\s*\+\s*'/g, ""); } while (s !== prev);
  return s;
}
function renderedText(src) { return joinConcats(stripComments(src)); }
```

Order matters: strip comments **first**, or a commented-out example gets joined
and matched. The loop matters: fragments chain, so one pass leaves seams.

## The generalization

This is the string-literal case of a broader rule: **a static check must operate
on the artifact it is making a claim about.** A guard about what a *user sees*
cannot analyze what an *author wrote* unless it first performs the assembly the
runtime performs. The same applies to template literals, `join()`ed arrays,
i18n keys resolved at render, and HTML built by fragment.

Its companion is [`methodology-judge-a-detector-by-what-it-prints`](methodology-judge-a-detector-by-what-it-prints.md):
both of these survived writing and re-reading the regex, and both were obvious
within seconds of printing the list and reading it against the files by hand.

**A clean result from a copy guard is a claim, not an absence.** Before trusting
one, plant a known instance — including one split across a concatenation — and
confirm the guard fails. If it cannot catch the case that motivated it, its
silence is worthless.

## Related trap, same run

The same guard's *first* output listed five tabs as having no unlock affordance.
**Three were wrong** — one validated with a differently-named RPC, one gated on a
magic link rather than the phrase, one only wrote anonymously to a public intake
form. Acting on the list would have shipped three incorrect UI banners, one of
them an input that could never succeed. The exemptions are now recorded **with
their reasons** in an allow-list, so a future reader sees a claim they can
challenge rather than a regex quietly tuned until it went quiet.

## See also

- `[[docs/team_phrase_lessons]]` — the workstream
- `[[docs/kb-notes/methodology-judge-a-detector-by-what-it-prints]]` — the sibling rule
- PR `#1201` — the guard and both corrections

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
