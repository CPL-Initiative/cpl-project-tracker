---
title: A copy with no refresh path is a fossil
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, data-quality, staleness, sierra, map-users]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-normalise-both-sides-of-a-join]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - map/sync_map_users.py
  - tests/sierra_college_contacts.test.js
---

# A copy with no refresh path is a fossil

> **One-sentence summary** — when a consumer reads a denormalised copy of an
> authoritative table, find the job that refreshes that copy; if no such job
> exists, the copy is a snapshot of the day it was seeded and the consumer is
> already wrong.

## Context

Sam filed one line of Sierra feedback: *"Wrong contact information for RCC."*

Sierra took her CPL-contact line from `chatbox_college_profiles.contacts`, a
JSONB blob. MAP's real contacts live in `map_college_contacts`, refreshed by
`map/sync_map_users.py`. The profile blob was written **2026-06-25** and had not
changed since — because **nothing writes it**. `sync_map_users.py` *writes*
`map_college_contacts` and only *reads* the profiles table (for dashboard URLs),
and no builder for that JSONB exists anywhere in the repo. It was seeded once and
left.

## Measure the divergence before you argue about it

One report about one college. The right first move is not to fix RCC, it is to
ask **how many colleges disagree** — a single query against the two tables,
applying the consumer's own preference logic to both sides:

```sql
with p as (  -- what the consumer prints
  select trim(college) as college,
         coalesce(nullif(trim(contacts->>'cpl_coordinator_email'),''),
                  nullif(trim(contacts->>'primary_contact_email'),'')) as s_email
  from chatbox_college_profiles
), m as (    -- what the authority holds
  select trim(college) as college,
         coalesce(nullif(trim(cpl_coordinator_email),''),
                  nullif(trim(primary_contact_email),'')) as m_email
  from map_college_contacts
)
select count(*) filter (where lower(s_email) = lower(m_email))  as agree,
       count(*) filter (where lower(s_email) <> lower(m_email)) as prints_wrong,
       count(*) filter (where s_email is null and m_email is not null) as silent
from p join m on lower(p.college) = lower(m.college);
```

Result over 122 colleges: **41 printed a different address than MAP held, 13
printed nothing while MAP had someone, 50 agreed.** One report, a third of the
system wrong. RCC was ordinary: Sierra said *Rene Felix*, MAP held *Jeanine
Gardner* as primary contact and *Lisa Martin* as CPL coordinator — the slot
Sierra's own code **preferred**, blank in the fossil.

## Why re-seeding the copy is the wrong fix

The tempting repair is a one-shot `UPDATE … FROM map_college_contacts`. It works
today and re-creates the defect: a fresher fossil is still a fossil, and the next
person to hit it will be a curator who cannot tell that the number they are
reading is seven weeks old.

**Change the consumer to read the authority.** The staleness class ends; there is
no refresh job to write, forget, or break. This repo already carries the same
lesson from the day before, when Sierra's `statewide` flag synced from the wrong
file: *a settled ruling does not enforce itself — the consumer has to change.*

Check the access path before assuming this is expensive: `cpl-chat` runs on the
service-role key, so nothing was permission-blocked, and the authoritative table
is ~123 rows — small enough to fetch whole per request.

## Reading an authority is not the same as reading a copy

The copy had been flattened; the source has not. Four things the live read had to
handle that the fossil had already smoothed away, each now a committed test:

1. **Normalise both sides of the join.** MAP's college names are hand-typed and
   two real colleges carry a trailing space — `"Cypress College "`, `"San Jose
   City College "`. Exact matching drops them *silently back to the fossil*,
   which is precisely the bug being fixed. (Third occurrence in this repo; see
   `methodology-normalise-both-sides-of-a-join`.)
2. **Validate, do not merely split.** 22 of 115 routable colleges hold several
   people in one field, separated by semicolons, commas *or embedded newlines*.
   Cypress's coordinator field is
   `jgarcia@…, jrangel@cypresscollege,\njgrande@…` — the middle address has **no
   TLD**. Sending someone to an address that cannot receive mail is a false
   route, the same class of harm as a false zero.
3. **Take the name and the email from the same tier.** The old code picked them
   with two independent `||` fallbacks, so a tier holding a name but no email
   would pair that name with a *different person's* address. Zero colleges hit it
   that day — a latent hazard, closed rather than left to drift into.
4. **Decide what the fallback tiers may include.** Leadership roles (VPAA, VPSS,
   CEO, senate president, certifying official) are deliberately excluded:
   routing a student's CPL question to a college president is worse than saying
   we do not know who to ask. 115 of 122 route without them; 7 genuinely cannot.

## Fail safe, and say so

The live read falls back to the fossil on any error, or for a college with no row
in the authority. That guarantee — *never worse than what it replaces* — is what
makes the change safe to ship without a staged rollout, and it is worth stating
explicitly in the code so a later reader does not "simplify" it away.

## The detection heuristic

For any consumer reading a `*_profiles`, `*_summary`, `*_cache` or JSONB-blob
copy of something with an authoritative table behind it, ask two questions:

1. **What job writes this copy, and when did it last run?** `grep` the repo for
   writes to that table. No writer found = fossil.
2. **How many rows disagree with the authority right now?** One query. If the
   answer is not zero, that count is the size of the bug, not the number of
   reports you have received.

## See also

- `methodology-normalise-both-sides-of-a-join`
- CLAUDE.md §11 *MAP Users / student contact* and *Sierra retrieval + corpus*.
