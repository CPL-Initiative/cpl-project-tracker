---
title: Digest an anonymous write-only table into a private vault (service-role read in CI, output never touches the public repo)
created: 2026-06-18
updated: 2026-06-18
tags: [playbook, privacy, supabase, rls, obsidian, reflections, first-light]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/first_light_lessons]]"
  - "[[docs/kb-notes/playbook-prestage-optional-external-auth]]"
artifacts:
  - reflections/build_reflections_digest.py
  - reflections/README.md
  - first_light.js
---

# Digest an anonymous write-only table into a private vault

> **One-sentence summary** — when a public surface collects anonymous input into a
> write-only Supabase table, do the read + analysis with the **service role in CI**
> and commit the output **only to a private repo**, so the public repo keeps the
> write-only contract and never holds the raw words.

## Context

First Light (the dashboard's daily painting greeting) invites an anonymous
"thought for the day". It POSTs `{painting, reflection}` to `public.cpl_reflections`
— anon **INSERT-only**, **no SELECT** (the `chat_interactions` pattern). We wanted a
gentle weekly "musings" digest for the team's Obsidian vault **without** weakening
that contract. The result is `reflections/build_reflections_digest.py`. This note is
the reusable shape behind it.

## The claim

A privacy-preserving digest of anonymous public input has four load-bearing rules:

1. **The read side is server-only.** The table has no public SELECT; the digest
   reads with the **service role**, and that key only ever lives in CI secrets —
   never in the browser, never in a committed file. The public anon key can write,
   nothing more. *Never add a public read path to "make the digest easier."*
2. **The output lives in a private repo, not the public one.** Commit the rendered
   digest only to the private vault repo (here, `cpl-knowledge-base`). In the public
   repo the default output dir is **gitignored**, so a stray local run can't leak
   text. Same rule as raw PII files.
3. **Carry only the non-identifying columns.** Select exactly the fields you need
   (`day, painting, reflection`) — never an id, IP, or precise timestamp. The
   calendar day is the coarsest time grain that still lets you group by week.
4. **Fail soft.** No key / HTTP error / blocked network → print a notice and
   `exit 0`. The job pre-stages cleanly before the secret exists (so you can land
   the code first and wire the secret later) and never reddens a workflow over a
   transient hiccup or an empty table.

The wiring that follows from this: a **weekly GitHub Action in the private repo**
runs the (stdlib-only) script and commits the digest. The script can be copied into
the private repo or fetched at run time; the secret (`SUPABASE_SERVICE_KEY`) is
added once, by a human, to that private repo.

## How we got here

Built in Session 62 (PR #460) as the payoff for First Light's reflection box. The
table + RLS shape was already proven (Session 48 — anon write-only, verified live as
the anon role: insert works, select returns zero rows). The new piece was the
read-and-render half, deliberately kept stdlib-only and fail-soft so it could be
pre-staged before the private repo held the service key.

## When this applies (and when it doesn't)

- **Applies** to any "anonymous public input → periodic private analysis" pipeline:
  feedback boxes, reflections, suggestion forms — anywhere the public should only
  ever *write* and a small trusted audience reads an aggregate.
- **Doesn't apply** when the analysis must be shown back to the public (then you
  need a curated, aggregated, small-cell-suppressed *published* artifact — see the
  CER student-impact ADR — not a raw digest), or when the input is not anonymous
  (different consent + retention story entirely).

## See also

- `[[docs/first_light_lessons]]` — Session 62 section (the digest + the rotation)
- `[[docs/kb-notes/playbook-prestage-optional-external-auth]]` — the no-op-until-secret pattern this builds on
- `[[docs/kb-notes/adr-cer-student-impact-counts-privacy]]` — the contrast: when output IS public, aggregate + suppress
- PR `#460` — the implementation (`reflections/build_reflections_digest.py` + README)

---

*Authoring check: durable (the privacy shape outlives this feature), reusable (any
anonymous-input → private-analysis pipeline), distilled (keep read + output private;
public only writes), self-contained (frontmatter + opener carry the claim).*
