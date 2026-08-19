---
title: Phrase scope — the measurement, and why GR is a one-line fix
date: 2026-08-19
tags: [scope, security, rls, phrases, gr, finance, blocked-on-sam]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - team_phrases.js
  - cobi_orgs.js
  - cobi_admin_surface.js
related:
  - "[[CLAUDE]]"
  - "[[docs/gr_register_lessons]]"
  - "[[docs/session_169_handoff]]"
---

# Phrase scope — the measurement, and why GR is a one-line fix

**Status: BLOCKED ON SAM. Nothing in this document has been applied.**

Sam, 2026-08-15: *"Finance should not open the entire workplan… Seems like we
should have an Admin view for each org."* §11 has carried this since as a live
RLS change across ~30 tables, too risky to attempt because getting it wrong locks
working people out mid-task.

That framing is right about Finance and **wrong about GR**, and the difference
matters because inviting CO General Counsel is blocked behind it.

## The measurement

Four cohorts hold a phrase: `ci`, `fin`, `gr`, `team`. The gate they all pass
through is one line:

```sql
-- public.team_pass_check(p)
select exists (select 1 from public.team_access where secret = p);
```

No cohort filter. So **any** secret opens **every** table whose policy calls
`team_pass_ok()`.

| Measure | Count |
|---|---|
| Policies calling `team_pass_ok()` ("any phrase opens it") | **83** |
| Distinct tables behind those policies | **42** |
| Policies calling `gr_pass_ok()` (GR-cohort only) | 5 |
| Policies calling `fin_pass_ok()` (Finance-cohort only) | 12 |
| Policies calling `is_allowed_reviewer()` | 132 |
| All policies / all tables | 177 / 74 |

Now cross those 42 tables against what each site's own tabs actually touch
(`cobi_admin_surface.js` × `cobi_orgs.js`):

| Site | Its tabs | Tables its tabs touch | Of the 42 shared tables, how many it needs |
|---|---|---|---|
| **GR** | `gr-priorities` | `gr_content` (+ the four new `gr_*`) | **0 of 42** |
| **FIN** | `contracts`, `budget`, `implementation-funding` | 6 | **6 of 42** |

## The decomposition

**GR needs none of the shared tables.** Every table the GR tab reads is a `gr_*`
table already gated by `gr_pass_ok()`, which is cohort-specific. The GR phrase's
reach into the other 42 is pure accident — it buys GR nothing and costs it the
entire workplan.

So GR does not need the 30-table refactor. It needs the shared gate to stop
accepting the GR secret:

```sql
create or replace function public.team_pass_check(p text) returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.team_access where id <> 'gr' and secret = p);
$$;
```

One line. What it does:

- the GR phrase stops opening the Workplan, Budget, Memory, MAP Users,
  Governance, Sierra Training and the rest — **42 tables, 83 policies**
- the GR phrase keeps opening the GR tab, which never used this gate
- **`team`, `ci` and `fin` are completely unaffected** — no regression, and none
  of the Finance lockout §11 warns a naive fix would cause

**Finance stays hard and stays parked.** Finance genuinely needs 6 of the 42
(budget and funding), so its fix requires splitting the shared set — Sam's June
ruling that shared tabs accept either phrase still stands. That is the ~30-table
job. It does not have to happen first, and it is not on the GC critical path.

## The one thing that could go wrong

Anyone holding **only** the GR phrase loses the shared team tabs they can reach
today. That is the intended effect — they were never meant to have them — but if
a GR holder has been using the Workplan through that phrase, they need the `team`
phrase before this lands, not after.

**Sam: who holds the GR phrase, and do they each also hold the shared team
phrase?** That is the whole question. If the answer is "the same few people, and
yes", this is a one-line change with no user-visible loss.

## Recommended sequence

1. Sam answers the question above.
2. Apply the one-line change; verify with a phrase-by-phrase read of one shared
   table and one GR table.
3. Only then issue a GC phrase — or better, skip the phrase for GC entirely and
   use reviewer sign-in (`docs/session_169_handoff.md`), which is the durable
   answer: a shared phrase carries no identity, cannot be revoked per person, and
   is guessable through an anon-callable verify RPC.
4. Finance scope stays parked until someone wants it.

## Why this was worth measuring rather than assuming

The blocker was carried for four days as "a live RLS change across ~30 tables".
It is that — **for Finance**. For GR it is one predicate, because GR's own tab
was already gated correctly and nobody had checked what the shared gate was
actually buying it. A blast radius is not a property of the problem; it is a
property of the problem *you happen to be solving*, and the two cases had been
filed as one.
