---
title: A knowledge base needs a lint pass, not just an ingest and a query
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, docs, checkpoint, obsidian, context-budget, provenance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted]]"
  - "[[docs/kb-notes/playbook-vault-sync-setup]]"
  - "[[docs/INDEX]]"
artifacts:
  - kb/_docs_audit.py
  - tests/docs_audit_test.py
  - .claude/commands/checkpoint.md
---

# A knowledge base needs a lint pass, not just an ingest and a query

> **One-sentence summary** — a documentation corpus with a write path and a read
> path but no compaction path does not decay by losing things; it decays by
> keeping every version of everything and letting a future reader find the wrong
> one.

## Context

Karpathy's LLM-wiki pattern names three operations: **ingest**, **query**,
**lint**. Most knowledge-base designs — ours included, for 130 sessions — build
the first two and skip the third, because the first two are the ones anyone
notices missing. Rule 8 is our ingest. Sessions reading `docs/` are our query.
Nothing has ever compacted.

The prompt for this note was an X post surveying ten "Claude + Obsidian memory"
repos. Eight of the ten address retrieval. None addresses accretion, because
accretion doesn't look like a problem until you measure it.

## The claim

**1. The failure mode of a missing lint pass is a false positive, not a loss.**
Nothing goes missing — that's what makes it invisible. What happens instead is
that a future reader retrieves a superseded document and believes it. This
corpus had already done it once: a session greeted itself citing handoff 105
when the authoritative one was 111, which is why CLAUDE.md Rule 8 now says *"the
authoritative handoff is the HIGHEST-numbered."* That instruction is a
**human-memory patch for a machine-readable fact.** 115 of our 116 handoffs were
superseded and not one of them said so in a way anything could filter on.

**2. Measure lanes, not files.** A corpus has lanes with different economics, and
one budget across all of them is useless. An always-loaded file costs every
session in every repo; a lessons doc is *supposed* to be long; a KB note is
supposed to be one distilled concept. Measured here at 429 docs / 5.07 MB:

| Lane | Files | Bytes | Note |
|---|---:|---:|---|
| lessons | 48 | 1,442,326 | append-only scratchpads, 3 past budget |
| kb-notes | 204 | 1,148,329 | all within budget — the distilled lane works |
| handoffs | 116 | 912,146 | **904,295 B superseded** |
| index | 1 | 165,829 | a landing page you must scroll |
| always-loaded | 1 | 88,546 | 1.5× budget, paid by every session |

The KB-notes lane being the *only* one entirely within budget is the finding
worth keeping: the lane with a **promotion gate and a template** is the lane that
didn't rot. Distillation is not a nice-to-have; it is the only thing here that
held.

**3. A lint that fires on correct input gets muted, so build it against the
corpus you have.** The first version of rule R3 flagged 55 KB notes as
malformed. Only **3** were. The other 52 were well-formed in a *sibling dialect*:
the corpus declares a note's type three ways (`tags:` 135, `type:` 43,
`kb-type:` 21) and its creation date two (`created:` 154, `date:` 48). Shipping
that rule would have produced 52 false alarms in the first report and the tool
would have been ignored by the second. The auditor now accepts every dialect
(R3) and reports the drift separately as **informational** (R3b), leaving
normalisation as a human call. Same species as
[`methodology-a-guard-that-fails-on-truth-gets-muted`](methodology-a-guard-that-fails-on-truth-gets-muted.md).

**4. The same defect recurred one rule later, which is the real lesson.** R6
(vault weight) recommended excluding `cpl-project-tracker/docs` from Obsidian —
because `docs/` carries 11 MB of `.docx`/`.pdf` attachments and tripped a size
threshold. That recommendation would have hidden the entire corpus the auditor
exists to protect. A directory is only safe to roll up if it contains **no
markdown at any depth**. Both defects were caught by *checking the tool's output
against reality* rather than by reading the code — 55-flagged-vs-3-real, and a
path that shouldn't have been in a list. **A new lint's first report is data
about the lint, not about the corpus.** Read it that way before acting on it.

**5. An Obsidian exclusion list is a relevance filter, not a performance
filter.** `userIgnoreFilters` drops paths from search, graph and link
autocomplete. It does **not** stop the file watcher, the metadata cache, or
Obsidian Sync. So excluding heavy paths makes a vault easier to *browse* and
does approximately nothing for load time. Ours: the tracker's working tree is
**1.07 GB across 1,754 files**, of which 429 are markdown — all of it inside the
vault, because the repo is cloned into it. The only real fix for load time is
keeping build artifacts out of the vault (clone outside it, or keep a
markdown-only sparse checkout vault-side). Related: CLAUDE.md's Obsidian
section *claims* `unified_courses_*.js` and `cip_fitcheck/` are excluded; the
live `app.json` excludes neither, and together they are **164 MB** of the tree.
**A documented exclusion is not an applied one.**

## How we got here

Built `kb/_docs_audit.py` as the prose counterpart to `kb/_row_audit.py` — same
shape deliberately, because that's the instrument this project already trusts
for data: read-only by default, dated JSON + markdown receipts under
`kb/docs_audit/`, one narrowly-scoped mutation behind `--apply`.

Six rules: `superseded_handoff` (fixable), `oversized_doc`, `kb_note_frontmatter`,
`kb_note_dialect` (informational), `frontmatter_log_chain`, `unindexed_kb_note`,
plus the `vault_heavy_path` scan. `--apply` does exactly one thing — stamp
`superseded: true` + `superseded_by:` on handoffs below the highest — and is
bounded three ways (rule name, filename regex, never the authoritative one) and
idempotent. Wired as **step 0** of `/checkpoint`, not the last step, because the
findings should change what the checkpoint writes: an `oversized_doc` flag on
the lessons doc you were about to append to means compact it *now*.

`tests/docs_audit_test.py` — 51 checks, guarding both defects above plus the
mutation invariants.

## Worked example — `frontmatter_log_chain`

`docs/INDEX.md`'s `updated:` field, at the time of writing, was a single line of
**1,844 characters** chaining **five** `prior:` entries. A field had
silently become a changelog, in the file that is declared the vault's entry
point. Nobody decided this; each checkpoint appended one clause. That is what
accretion looks like close up, and it is why the lint has to be a *pass*, run on
a schedule, rather than a thing anyone remembers to do.
