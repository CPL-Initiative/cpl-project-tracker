---
title: A shared credential can only scope to a surface that is exclusive to its group
created: 2026-08-12
updated: 2026-08-12
tags: [methodology, auth, rls, team-phrase, org-layer, supabase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/team_phrase_expansion_plan]]"
  - "[[docs/kb-notes/methodology-server-enforced-shared-password-gate]]"
artifacts:
  - team_phrase.js
  - team_phrase_header.js
  - cobi_orgs.js
  - kb/supabase_site_phrase_fin.sql
---

# A shared credential can only scope to a surface that is exclusive to its group

> **One-sentence summary** — Before building per-group credentials, ask which
> surfaces belong to exactly one group; every surface belonging to two groups
> must accept *either* credential, so the set you can actually scope is the set
> of exclusive surfaces — usually far smaller than the org chart suggests.

## Context

COBI presents several "sites" (CPL, C&I, CIP, GR, Finance) chosen from a
dropdown, each with its own tab list, and holds several team phrases. The
natural request follows: *select a site, and it asks for that site's phrase.*

That reads as a routing problem — map site → phrase — and it is not. It is a
question about **which tabs belong to only one site**, and the answer was
already encoded in the app.

## The rule

A surface can require a group-specific credential **if and only if it appears
under that group alone**. If it also appears under another group, requiring one
group's credential locks the other group out of a surface it legitimately uses —
so the only correct policy there is *accept either*.

Which means: **the scopable set is the exclusive set.** Everything else stays on
the shared credential, and "allow either" costs nothing to implement because a
shared-credential check already matches every secret.

## What it looked like when measured

COBI's `cobi_orgs.js` already carried an `EXCLUSIVE` list — tabs deliberately
kept out of the default view. Measured against the tabs each site claims:

| Site | Tabs claimed | Own gated tables | Exclusive? |
|---|---|---|---|
| GR | `gr-priorities` | `gr_content` | ✅ (already had its own phrase) |
| Finance | `contracts` | `cpl_contracts` + 3 | ✅ |
| Finance | `budget`, `implementation-funding` | shared budget tables | ❌ also CPL tabs |
| C&I | `tmc-builder` | `tmc_curator_notes` | ❌ also a CPL tab |
| C&I / CIP | `our-process`, `cip-crosswalk`, `coci-lookup` | **none** | static tabs |

Two tabs qualified. One already worked that way. So the "site-aware auth"
project was **one function, one table row, twelve policies, and one unlock box**
— not the ~45-table partition the framing implied.

Two things the measurement corrected that no amount of design discussion would
have:

1. **C&I and CIP have zero gated tables of their own.** Their phrase has nothing
   to protect. That is an empty set, not an oversight — and it explains why the
   `ci` secret had no server-side gate.
2. **The shared check matched *any* secret**, so every phrase already opened
   every shared surface. The "isolation" the dropdown implied did not exist, and
   building UI that implied it harder would have been the actual defect.

## The consequence to state out loud

Under *allow either*, a group credential is a **superset**, not a narrower key:
it opens its own surface *plus* everything shared. That is safe exactly while
every credential holder is trusted with all shared data — and it stops being
safe the day one goes to someone outside that circle.

So write down the trigger, because it is a decision about **who you hand a
credential to**, not about code: when a group phrase reaches someone outside the
core team, split the scopes (a `scope` column; the shared check matches only
`scope='shared'` rows). Until then, splitting them only costs the people who
span groups a second phrase to carry.

## Practical corollaries

- **Give each credential its own storage slot.** One slot per group means
  holding Finance never costs you the shared phrase. Do not make a person swap.
- **Drop the slot the failure came from.** Clearing the shared credential
  because a group-scoped write was refused logs someone out of every other
  surface for an unrelated failure.
- **Anything you mint must be rotatable.** The rotation UI here was hardcoded to
  one row id, so a new group phrase would have had no rotation path at all — and
  a credential you cannot change is one you cannot un-share when someone leaves.
- **Say which credential a control will use, and what it opens.** Naming the
  scope is the difference between describing a gate and implying an isolation
  the database does not enforce.
