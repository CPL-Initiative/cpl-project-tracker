---
title: A harness must verify its own healthy fixture, or growth repaints the scoreboard
created: 2026-08-30
tags: [methodology, testing, doctrine, false-green, fixtures]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/doctrine_enforcement_lessons]]"
  - "[[docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass]]"
artifacts:
  - kb/_doctrine_scenarios.py
  - kb/_docs_audit.py
---

# A harness must verify its own healthy fixture, or growth repaints the scoreboard

> **One-sentence summary** — a test harness whose "healthy" fixture is only
> assumed healthy converts every future GROWTH of the thing it tests into a
> false green, so the harness must check its own fixture before scoring and
> refuse to run when it drifts.

## The failure, three times in two days

The scenario harness (`kb/_doctrine_scenarios.py`) scores whether our guards
would catch twelve real doctrine failures. Its honest score was 10 of 12 —
two cross-store gaps nothing catches. On 2026-08-30, three new claims were
added to the guard registry (`CRITICAL_RULE_DOCTRINE`), and the very next run
reported **12 of 12**.

Nothing had been built for the two gaps. The synthetic "healthy" fixture
(`BASE_CRITICAL`) had been written to satisfy the registry *as it stood in
S208*; the new claims were absent from it, so `critical_rule_doctrine` fired
on **every** fixture — including the two scenarios it has nothing to do with
— and the harness counted them "caught."

This is the same shape as S208's "11 of 11" (stub fixtures with no Critical
Rules section at all) and, in miniature, the wrapped-line false positive: the
instrument's inputs drifted from reality, and the score *improved*, which
reads as progress precisely when it is decay.

## The mechanism, stated generally

A fixture encodes a claim: *this is what healthy looks like.* When the system
under test grows — a new registry entry, a new required field, a new lint —
that claim silently expires. Every guard keyed to the new material now fires
on the old fixture **for a reason unrelated to any scenario**, and any
harness that scores "did anything fire?" marks everything caught. The score
can only move in the flattering direction, which is why "distrust a score
that improves" (S208) is necessary but not sufficient: a human has to notice
the improvement. The fixture check removes the human from that loop.

## The remedy

Before scoring, the harness runs its own pristine fixture through every
fixture-sensitive guard and **raises instead of scoring** if any fires:

```python
def _assert_fixtures_current():
    root = sandbox({"CLAUDE.md": BASE_RULES + BASE_CRITICAL})
    for fn in (rule_critical_rule_doctrine, rule_presentation_doctrine, ...):
        if fn(entry_for(root)):
            raise SystemExit("FIXTURE DRIFT — extend the fixture for: ...")
```

Registry growth now produces a loud, named failure at the harness's front
door — "extend `BASE_CRITICAL` for claim X" — instead of a quietly perfect
scoreboard. The fix costs one function; the alternative costs a false green
per registry addition, forever.

## A worked instance of the adjacent trap

While extending the fixture, a 4-space continuation indent made
`prose_only()` read the stub as an **indented code block** — masking it *and
the unindented lines after it* — which blinded `self_corrected_word_pair` to
its own scenario. A fixture must match the live artifact's *formatting*
conventions, not just its content: the guards read formatting too.

## When to apply

Any harness that scores guards against synthetic fixtures: the doctrine
scenarios, spelling/lint fixtures, contract tests with golden files. The
test is one question — *if the registry this fixture satisfies grew tomorrow,
would this harness fail loudly or score better?* If the answer is "score
better," add the fixture check before the next growth, because the next
growth is when you will not notice.
