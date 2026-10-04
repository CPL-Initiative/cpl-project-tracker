---
title: Probe the class before calling a refusal local
created: 2026-10-04
updated: 2026-10-04
tags: [methodology, web-reading, program-requirements-harvest]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_program_sequence_ppm.py
---

# Probe the class before calling a refusal local

> **One-sentence summary** — when one site refuses a reader, load one page from
> every other site of the same kind before deciding what to ask for, because a
> refusal that belongs to a vendor needs a different remedy than one that
> belongs to a college.

## Context

The program requirements pilot reads one program's term-by-term sequence from
Miramar's Program Pathways Mapper. The reader reached the mapper through the
college's own page, and the mapper answered all seven requests 403 Forbidden
(run 37197332656). Read alone, that is a Miramar problem: ask Miramar.

## The claim

A refusal has an owner, and the owner decides the remedy. Before asking anyone,
take one load from each member of the class (here, the 24 sequence sources the
census had filed). Run 37198225537 did, at the same pace and user agent: **all 17
mapper hosts reached answered 403**, on `.ws`, `.com` and `.org` vendor hosts and
on college-branded hosts alike. The refusal is the service's. The ask moves from
"Miramar, let us in" to "how does the harvest read sequences at all", and one
college page in the set (Irvine Valley's own program maps) shows a path that
answers today.

## How to apply it

- One load per member, robots first, the reader's usual delay: the probe costs
  minutes and reads nothing a person would not.
- Record each answer's status and final host, and which college pages only link
  to a host of the class.
- Never retry the refusing host to "confirm" it; the class probe is the second
  opinion.
- Put the class result on the decision card, so the person deciding sees the
  scope of the problem before choosing a remedy.

## When this applies (and when it doesn't)

Any reader that meets a refusal, timeout or challenge on a site that belongs to a
family: a vendor platform, a district's shared host, a CDN. It does not apply to a
site that is one of a kind; there the local remedy is the only one.
