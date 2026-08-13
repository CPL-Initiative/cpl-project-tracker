---
title: A proposal standing in for expert judgment needs two signals of different kinds
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, alignment, matching, recommendation, faculty, articulation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/local_course_alignment_lessons]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - kb/coci_articulations.json
  - kb/reference/coci_course_list.xlsx
---

# A proposal standing in for expert judgment needs two signals of different kinds

> **One-sentence summary** — when a system proposes what an expert would otherwise
> decide, one similarity score is not a weak version of the answer, it is a
> systematically biased one; pair it with a record of what experts actually did.

## Context

Sierra was asked to tell a college which of *its own* courses to articulate
against a statewide credit recommendation, "so the faculty don't have to guess."
The obvious implementation is text similarity between the recommendation's name
and the college's course titles.

Tested on `ASME BPVC Section IX — FCAW Welder Qualification` at Cerritos College,
that works, and works well: `WELD 214L — Flux Cored Arc Welding (FCAW)
Certification Laboratory` tops both credit recommendations with a 2–3× margin over
the runner-up.

Then look at what other colleges **actually did** for the same certificate:

| College | Course used | For the rec |
|---|---|---|
| Barstow | `WELD 54B — Flux Cored Arc Welding (FCAW)` | Introduction to FCAW |
| Santa Ana | `WELD 240 — Structural Welding SMAW` | Introduction to FCAW |
| Santa Ana | `WELD 244 — Welding Certification D1.1 Code Clinic` | Advanced FCAW |

**Two of the three contain no "FCAW" at all.** Title similarity would never have
proposed them, at any threshold, because the signal is absent — colleges routinely
map a *broader* course to a *specific* recommendation, and that is a legitimate
faculty judgment about scope, not a lexical property.

## The failure shape

A single-signal matcher here is not merely *incomplete*. It is **biased toward one
articulation style** and blind to another, while looking confident. Lowering the
threshold does not help: it adds noise without adding the missing evidence, because
the missing evidence is not in the text.

## The rule

When proposing something an expert would otherwise decide, use **two signals that
fail differently**, and label each for what it is:

| Signal | Answers | Fails when |
|---|---|---|
| **Computed similarity** | "which of your things obviously matches?" | the real answer is a broader/differently-named item |
| **Peer precedent** | "what did others in your position actually accept?" | nobody has done it yet |

Neither is a fallback for the other — they answer different questions, and each
covers the other's blind spot. Where they agree, the proposal is *corroborated*
(Barstow's near-identical course is what made the Cerritos recommendation
defensible rather than asserted). Where they disagree, that is information for the
expert, not a tie to be broken by code.

## Presentation rules

- **Ship it as a proposal with its evidence attached**, never a determination. Name
  the peer college and its course number so the expert can check the precedent.
- **Scores are rankings, not probabilities.** Never render a similarity score as a
  percentage or a confidence. Present the ordered list.
- **"Nothing lexically similar" is a real answer**, not a retrieval failure — peer
  precedent may still show a broad course that works.
- **Do not gate the candidate set on a weak classifier.** Scoping candidates by TOP
  code would use TOP as a gate, which this repo forbids
  (`methodology-top-is-a-last-in-line-signal`); it may corroborate, not restrict.

## Generalises to

Any "suggest what a human would pick" surface: mapping a credential to a course,
a course to a C-ID, an occupation to a credential, a contact to a role. The
question to ask is always: *what does my signal structurally fail to see, and what
independent record would show it?*
