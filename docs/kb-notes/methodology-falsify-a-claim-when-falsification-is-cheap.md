---
title: Falsify a claim when falsification is cheap
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, pii, privacy, verification, vendor, trust]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/map_dataset_sql_for_malone]]"
artifacts:
  - fetch_custom_report.py
  - tests/custom_report_payload_test.py
---

# Falsify a claim when falsification is cheap

> **One-sentence summary** — when a claim you are about to rely on can be tested
> in seconds, test it; a claim that survives is corroboration, and saying so is
> not distrust.

## Context

A student-grain MAP view arrived with `StudentMAPID` rendered as 64 hex
characters. The vendor confirmed the ids were hashed, and later that they were
**salt**-hashed. Both statements were true and both came from the person who
would know.

The column was still tested before being loaded — because our own specification
(`docs/map_dataset_sql_for_malone.md`) names this exact failure mode in its own
words:

> *"A bare SHA2_256 of a student ID is not anonymous: the ID space is small
> enough to enumerate, so anyone with the hashes can recover every ID by hashing
> all candidates."*

That is not an abstract caution — it is a **runnable experiment**, and the
document had already specified the attack. `StudentMAPID` is a small integer
over 42,346 distinct students, so SHA-256 across 5,000,000 plain decimals plus
eight formatting variants (zero-padded, prefixed, float-cast, whitespace) was
compared against a sampled hash.

No match. Not a bare hash of the id. The vendor's claim and an independent
measurement now agree, which is a stronger position than either alone.

## The rule

**Cost of falsification, not degree of trust, decides whether to test.** If a
claim can be falsified in seconds and you are about to build on it, run the
test. Report a survival as *corroboration*, never as proof — and name what the
test could not reach.

This is the cheap-to-verify half of the fan-out heuristic in `CLAUDE.md`, applied
to a claim rather than a search: a hit is instantly recognizable (a hash either
matches or does not), so the check is worth running and its result is worth
trusting.

## Turn the warning you already wrote into the test

The most reusable part is that **the experiment was already written down**. A
specification that says "X would be unsafe because Y" has described a test; the
work is running it rather than re-deriving the concern. Before designing a
check, look for the caveat that already names the failure.

## Name the residual, and prefer a detector to a repeat question

A survived test rarely closes everything. Here, "salted" does not mean "salted
with the **same** salt every run" — which is what the spec actually asked for, and
which no amount of hashing arithmetic can reveal from one sample.

That residual is a different *kind* of failure and must be labeled as such: a
rotating salt **leaks nothing**. It silently makes distinct-student counts
incomparable across refreshes, so a headcount wanders with no error raised
anywhere.

The response is not to ask again. It is to make it **detectable**: compare the
incoming key set against the previous pull — a stable salt gives a large
overlap, a rotated one essentially zero. An assurance describes today's
behavior; a detector keeps it true. `cpl_memory: statewide-is-138-not-84` is the
standing precedent — *a settled ruling does not enforce itself, the consumer has
to change.*

## Record the human, not just the conclusion

The confirmation is written at the call site with the person named and dated,
and in `cpl_memory` with them in `verified_by`. A fact whose provenance is a
person keeps that provenance (`CLAUDE.md`, Rule 8); laundering it into a bare
assertion is how a future session ends up re-litigating a settled question — or
silently overturning a human's statement with an inference.
