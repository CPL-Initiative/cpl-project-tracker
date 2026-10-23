---
title: A letter holds roles, never addresses
created: 2026-10-23
updated: 2026-10-23
tags: [methodology, communications, contacts, privacy, roster]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - comms.js
  - kb/supabase_cpl_comms.sql
---

# A letter holds roles, never addresses

> **One-sentence summary** — A stored communication names its recipients by the role they
> hold in a roster that something else keeps current, and resolves the people at the moment
> it is read, so no letter freezes a stale name and no second table copies anyone's address.

## Context

Sam, 2026-10-23, asked for the Letters tab to carry *"any type of communication I need to
craft that needs to incorporate current data and contacts for various roles in the system
that we may already store (e.g., CEO name and email and current CPL metrics)."* The first
instinct is to store the recipients with the letter: a `to` column of names and emails,
filled when the letter is written. The register built that day stores `to_roles` and
`cc_roles` instead, each a column name of `map_college_contacts`, and joins the roster when
the record is opened.

## The claim

A communication is a template over a roster, not a snapshot of one.

- **The roster changes under the letter.** MAP syncs `map_college_contacts` daily and a
  CEO changes between the draft and the send. A letter that copied the name on the day of
  the draft greets the predecessor. A letter that names the role greets whoever holds it
  when the mail link is opened.
- **A second copy is a second privacy surface.** `map_college_contacts` is gated on the
  team phrase or a reviewer sign-in, and the governance register maps it (DR-01/DR-02). A
  letter table that copied addresses would need the same gate, the same register row and
  the same retention answer, and would drift from the source the day after it was filled.
  Roles carry none of that: a role name is not personal data.
- **The gap is visible, not silent.** When the roster holds no address for a role, the
  recipients table names the gap on that college's row (*CEO (president) is not in MAP*)
  and the CSV carries it in its own column. Measured 2026-10-23: 70 of 124 roster rows hold
  a CEO address, 95 a CIO, 58 a CSSO, 33 all three. A snapshot would have hidden those as
  empty cells.
- **The model never sees an address.** The drafting prompt lists each merge field with an
  example value from one college, and skips every field ending in `_email`. The words come
  back with `{salutation}` and `{college}` in braces; the tab fills them per recipient.

## When this applies (and when it doesn't)

**Applies** to any stored message, template or mail merge whose recipients come from a
directory something else maintains: the MAP roster, `team_members`, a partner list.

**Does not apply** to a record of what was actually sent. A send log is a snapshot by
definition and should carry the address as it was on the day. The register does not keep
one yet; the first real send will show whether the CSV's file suffices.

## See also

- `docs/reference/lanes/communications.md` — the lane
- `docs/reference/lanes/map-users-student-contact.md` — why a provenance label must say why,
  not what, and why MAP is read-only for us
- `kb/governance_surface_map.json` — `table:cpl_comms`, the dismissal and its reason

---

*Authoring check: durable (still true a year out), reusable (any roster-driven message),
distilled (one concept), self-contained (frontmatter + opener tell a stranger the claim).*
