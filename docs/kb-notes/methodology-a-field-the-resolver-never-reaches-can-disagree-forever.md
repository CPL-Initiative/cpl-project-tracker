---
title: A field the resolver never reaches can disagree with the record forever
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, data-quality, invariants, silent-failure, pitfall, obsidian, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - kb/_normalize_kb_note_frontmatter.py
  - kb/_docs_audit.py (kb_type_of, rule_kb_note_dialect)
related:
  - "[[methodology-a-guard-that-fails-on-truth-gets-muted]]"
  - "[[methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting]]"
  - "[[methodology-derive-a-listing-from-the-things-it-lists]]"
---

# A field the resolver never reaches can disagree with the record forever

> **One-sentence summary** — when a resolver reads several sources in
> precedence order and returns the first hit, every lower-precedence source
> becomes **unfalsifiable**: it can hold a contradicting value indefinitely,
> because nothing ever compares it to the answer.

## The shape

A tolerant resolver is normal and good. This corpus declares a KB note's type
three ways, and `kb_type_of()` accepts all three:

```python
hits = [t for t in tags if t in KB_TYPE_TAGS]
if hits:
    return hits[0], "tags:"          # ← first match wins
for k in ("type", "kb-type"):
    ...
```

The lint built on it reports *dialect drift* — a note whose type is carried
outside `tags:`. That rule is correct and it fired on 60 notes.

What it **cannot** report is a note carrying a type tag *and* a `type:` key that
disagree. The resolver returns the tag and stops. The `type:` key is never read,
so it is never checked, so it never becomes a finding.

## What it cost

41 notes carried a redundant type key beside a type tag. 35 agreed. **Six
disagreed**, and had disagreed for months:

| Note | Key says | Tag says |
|---|---|---|
| 5 × `*-scope.md` | `kb-type: playbook` | `scope` |
| `methodology-apply-equals-spec-…` | `type: methodology` | `playbook` |

Neither the lint nor any reader would ever have surfaced these. The five scope
notes were written before `scope` entered the type vocabulary; the sixth is more
interesting — `playbook` was sitting mid-list among *topical* tags
(`[kb, remint, apply, dry-run, alias-map, subj4, playbook, supabase]`) and the
resolver grabbed it as the TYPE. **A type vocabulary that overlaps the topic
vocabulary will mis-resolve, and the mis-resolution is silent.**

## The move

**Audit agreement across every source, not the resolved value.** The resolved
value is by construction self-consistent; that is exactly why reading it proves
nothing. The check has to look at what the resolver *skipped*.

Then resolve a conflict with an independent third signal rather than by
preferring a source. Here the filename was that signal — this corpus names notes
`<type>-…`/`…-<type>` — which is the same **two-signals-agree** gate `CLAUDE.md`
Rule 7 applies to TOP codes and discipline. Where the third signal corroborates
neither side, the row is reported and left alone; a tie-break invented to avoid
reporting is just a quieter version of the original bug.

## Where else this lives

Any first-match-wins resolution over multiple sources:

- config precedence (`env` → file → baked default) — the file can contradict the
  env var for ever and nothing says so;
- a contact cascade (coordinator → assistant → counselor) where a stale address
  further down is never compared to the one in use;
- a display fallback chain, where the fallback is only exercised in the rare
  case that also nobody looks at.

The test is one question: **if this lower-priority field were wrong, what would
tell me?** If the answer is "nothing", it is not data — it is a rumor the system
keeps.
