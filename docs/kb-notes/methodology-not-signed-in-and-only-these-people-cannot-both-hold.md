---
title: "\"Not signed in\" and \"only these people\" cannot both hold"
created: 2026-09-08
updated: 2026-09-08
tags: [methodology, auth, access-control, governance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/reference/lanes/governance-team-enablement]]"
---

# "Not signed in" and "only these people" cannot both hold

A request to show something to a named group *without* asking anyone to sign in
is a request for two things that exclude each other. Identity comes from a
credential. With no credential the server sees an anonymous visitor and cannot
tell one person from another, so anything it renders for one anonymous visitor
it renders for all of them.

This is not a limitation of a particular stack. It is what "anonymous" means.

## The case

The COBI header banner, 2026-09-08. Sam asked for a link to his working session,
visible to the MAP team and not to college users, and then: *"they wouldn't need
to be signed in to see the header, just ensure that they are on the team table."*

Both halves were reasonable. Together they were not satisfiable.

## What to do instead

**Name the trade rather than pretending it is absent.** Lay out the actual
options with who each one admits:

| Credential | Admits | Cost |
|---|---|---|
| None | everyone who opens the page | no gate at all |
| A shared secret | whoever holds it | no sign-in; the secret spreads |
| Per-person sign-in | exactly the named group | a sign-in |

The middle row is usually what the person actually wants, and it is worth
saying plainly that it is *not* the named group — it is holders of a secret,
which is wider than the roster and far narrower than the public.

For this case the shared secret already existed: COBI's team phrase, entered
once and kept in the browser. Using it meant no new mechanism and no sign-in per
visit, and the honest description went into the code, the register row, and the
reply.

## The asymmetry worth keeping

**Read and write do not need the same gate, and usually should not have one.**
The banner reads on `is_map_team() OR team_pass_ok()` and writes on
`is_map_team()` alone. A phrase holder may see the banner and can never point it
somewhere. Splitting the two recovers most of the precision the phrase gives up,
at the only place where precision matters.

## Getting the group wrong is a separate failure

Before the gate can be right, the roster has to be. Three passes here, each
wrong differently:

- an admin allowlist that held **10** people when the audience was **42**, of
  whom **34** were not in it;
- a shared secret, which is not an audience at all;
- and, underneath both, **the wrong roster entirely** — a "MAP Users" tab
  holding 2,801 *college* staff, beside a "Team & RACI" tab holding the 42-person
  team. Two plausible names, two different populations.

⚠️ **Count the group before you gate on it.** A gate that admits the wrong
number of people fails silently in whichever direction it is wrong: too narrow
and the feature looks broken, too wide and nobody finds out until the thing you
were protecting is already out.
