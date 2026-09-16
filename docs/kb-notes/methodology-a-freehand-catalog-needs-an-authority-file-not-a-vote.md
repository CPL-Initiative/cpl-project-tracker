---
title: A freehand catalog needs an authority file, not a vote
created: 2026-09-16
updated: 2026-09-16
tags: [methodology, cer, credential-registry, canonicalization, credential-engine]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[reference-cccco-house-voice]]"
artifacts:
  - kb/reference/california_occupational_licenses.json
  - kb/reference/credential_registry_national_sample.json
  - .claude/skills/exhibit-canonicalization/SKILL.md
---

# A freehand catalog needs an authority file, not a vote

> **One-sentence summary** — Canonicalizing freehand titles by clustering variants and electing a representative produces the most common typo as often as the right name; an external registry of active credentials supplies the issuer's own name, which turns the canonical form from a vote into a citation.

## Context

MAP's credential titles are freehand. Whoever entered an exhibit typed what they
had in front of them, and the same credential arrives as a dozen strings. The
Common Exhibit Reference collapses those strings into unified credential names.

Until 2026-09-16 that collapse had nothing external to work against. The CER
inferred each canonical form from the variants themselves: cluster the strings,
elect a representative, move on. Sam named the limit while the session was
capturing Credential Registry pages:

> "This could really help our exhibit cataloging, where we need to know the cert
> name the issuer uses (rather than whatever someone entering an exhibits
> enters) and the name of the issuing agency and other metadata...Our CER could
> really use this"

## The problem with electing a representative

A vote among variants optimizes for frequency, and frequency in a freehand field
tracks who entered the most rows rather than who was right. Three failure modes
follow, and none of them is visible from inside the cluster:

1. **The most common form wins even when it is wrong.** If six colleges
   abbreviated a credential the same way and two spelled it out, the
   abbreviation wins.
2. **The issuer is unrecoverable.** Nothing in a cluster of typed strings says
   who grants the credential, and the issuer is what makes two similarly-named
   credentials distinguishable.
3. **Absence is invisible.** A credential nobody typed produces no cluster, so
   the catalog cannot tell the difference between a credential that does not
   exist and one no college has written down.

## What an authority file changes

An authority file is an external list of the real things, maintained by someone
who is not you. For credentials, the Credential Registry is one: each entry
carries the issuer's own name, the issuing organization, and a description.

Canonicalizing against it is a different operation:

- **A cluster that matches a registry entry adopts the issuer's name**, with the
  issuer recorded beside it. The canonical form becomes a citation rather than a
  plurality.
- **A registry entry with no cluster is a catalog gap** — a currently-active
  credential no college has written an exhibit for. That is the same finding the
  occupation crosswalk reports as "build new," arrived at from the credential
  side instead of the occupation side.
- **A cluster with no registry entry is a question**, not an error. It may be a
  local or legacy credential, and it may be a title so mangled that no match
  could reach it.

The third case is the one worth designing for. An authority file makes a
catalog's own coverage measurable, and a measurable gap is what turns
canonicalization from tidying into curation.

## The general rule

**Whenever a field is freehand and the real-world things it names are enumerable
by someone else, find that enumeration before building a clusterer.** The
clusterer is still needed — it is what reaches the authority file from the
variants — but it stops being the thing that decides what is true.

This applies past credentials. The same shape governs college and district
names (MAP's `college_id` and the CCCCO MIS district code are the authority
file), subjects (`subject_map`), and the TOP-to-CIP crosswalk. In each case the
repo already learned to prefer the external enumeration; the CER is the surface
where that lesson had not yet been applied.

## Caveats

- **An authority file is not automatically authoritative for your purpose.** The
  Credential Registry names credentials; it does not say what credit one carries,
  and it carries no occupation code at any level (measured 2026-09-16 across the
  collection list, the collection print and a credential detail print). Match to
  it for *identity*, and keep credit and occupation as separate determinations.
- **Coverage is partial and stays partial by hand.** 369 California licenses are
  complete; 974 of 6,738 national certifications are not. A cluster with no match
  may simply be outside what has been captured, so absence is only evidence once
  coverage is known.
- **The issuer's name is a string too.** It arrives well-formed, which is the
  point, but it still needs the same American-spelling and naming conventions
  applied to anything rendered.
