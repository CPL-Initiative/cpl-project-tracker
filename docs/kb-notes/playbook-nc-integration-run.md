---
title: "Playbook — running an NC integration (notes and artifacts → the curated register)"
type: playbook
kb-status: published
created: 2026-08-06
updated: 2026-08-06
session: 123 (SkyLoop)
tags: [noncredit, learning-partners, curation, refresh, artifacts, integration, provenance]
related:
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
  - "[[docs/kb-notes/methodology-provenance-is-a-field]]"
  - "[[docs/kb-notes/adr-notes-alongside-the-curated-register]]"
  - "[[docs/noncredit_cpl_lessons]]"
---

# Running an NC integration

## What this is

The Noncredit & Learning Partners tab takes two kinds of input from the team:
**notes** (someone types what they know) and **artifacts** (someone links a Drive
document or a web page). Both land in Supabase alongside the curated register at
`kb/nc_learning_partners.json`; neither changes it.

An **integration run** is the step that closes that gap: a Claude session reads
what has come in, decides what it means, and revises the register so the page
reflects it. Then it marks the inputs integrated and records the run.

Anyone on the team starts one by saying, in these words:

> run the NC integration

## Why a person has to ask

Refresh happens at two speeds, and only one of them is automatic.

| | Mechanical | Analytical |
|---|---|---|
| What | re-fetch register, notes, artifacts, backlog | read them, weigh them, revise the register |
| Who | the ↻ Refresh button, and every tab re-activation | a Claude session |
| How long | ~1 second | minutes |

The analytical half cannot be a button, and it cannot be a cron either: this repo
has **no LLM key in its Actions secrets**, so no workflow can run judgment. Rather
than hide that, the tab counts the pending inputs in a backlog strip and renders
**"never integrated"** until a run happens. A loop that quietly stops running says
so on screen. (Same rule as the Governance tab, which caught a contact cadence
decided in June that had never once fired.)

## The standing ruling: apply routine, propose interpretive

Sam, 2026-08-06. A run changes the register **on its own authority** only where the
change is mechanical and checkable. Anything that moves the team's thinking comes
back as a proposal.

**Apply directly (routine):**
- flipping a question's `status` when a note plainly answers it
- correcting a figure that a cited source contradicts
- attaching a source, link or `_derived_at` stamp to an existing item
- fixing a name, a date, a count, a typo
- recording an exemplar or a target the note supplies

**Bring back as a proposal (interpretive):**
- adding a new opportunity, use case, mode or question
- changing an item's `value` / `effort` / `priority`
- changing a recommendation, or what the narrative argues
- anything where the note raises a doubt rather than settling one
- anything that would read, to a college, as a position the team has taken

When in doubt it is interpretive. The cost of proposing something routine is one
sentence in the reply; the cost of applying something interpretive is that the
team's stated position changed without the team.

## Procedure

**1. Read the backlog.** What is actually waiting:

```sql
select * from public.nc_integration_backlog;

select id, item_id, author, created_at, body
  from public.nc_partner_notes
 where superseded_by is null and integrated_at is null
 order by created_at;

select id, item_id, url, title, source, why, added_by, created_at
  from public.nc_artifacts
 where superseded_by is null and integrated_at is null
 order by created_at;
```

Live rows only — a superseded note is history, not a task.

**2. Read the artifacts.** `source` tells you which reader to use:
- `drive` → `mcp__Google_Drive__read_file_content` with the file id from the URL
  (`/document/d/<id>/`, `/file/d/<id>/`). Never guess an id; `search_files` first
  if the link is unusual.
- `web` → `WebFetch`.

The attacher's `why` field is the steer. Read for **that** — a targeted read beats
a summary, and the person who attached it knew something you don't.

If an artifact cannot be read (permissions, dead link, unsupported type), say so in
the note you write back and leave `integrated_at` **null** so it stays in the
backlog. Never mark something analyzed that you could not open.

**3. Decide, using the split above.** For each input: routine → apply it to
`kb/nc_learning_partners.json`; interpretive → write it down for the reply.

**4. Write the analysis back as a note.** An artifact's findings become an
`nc_partner_notes` row citing it — one rendering path, one revision semantic, one
promotion path for every insight on the page:

```sql
insert into public.nc_partner_notes (item_id, body, author, artifact_id, integrated_at, integrated_by)
values ('OPP-3', '<what the artifact says about this item>', 'Claude · <moniker> (S<N>)',
        '<artifact uuid>', now(), '<moniker> (S<N>)');
```

**5. Mark the inputs integrated.**

```sql
update public.nc_partner_notes
   set integrated_at = now(), integrated_by = '<moniker> (S<N>)'
 where id = any($1) and integrated_at is null;

update public.nc_artifacts
   set integrated_at = now(), integrated_by = '<moniker> (S<N>)'
 where id = any($1) and integrated_at is null;
```

Guard on `integrated_at is null` so a concurrent run cannot re-stamp.

**6. Record the run** — both halves, so the split stays auditable:

```sql
insert into public.nc_integration_runs
  (ran_by, notes_integrated, artifacts_analyzed, applied, proposed, pr_url)
values ('<moniker> (S<N>)', <n>, <m>, '<what was applied>', '<what was raised>', '<pr>');
```

**7. Commit the register change** on a `claude/*` branch, PR, merge on green. The
git diff is the real review surface — that is what makes "apply routine" safe.

**8. Reply with the interpretive proposals.** Short, specific, decidable. This is
the actual product of the run for the person who asked.

## Rules that do not bend

- **Never delete.** No table here has a DELETE policy. A wrong note is superseded;
  a wrong link is replaced and the old one stays.
- **Never write to the public `cpl-knowledge-base`.** "Integrated into the KB"
  means `kb/nc_learning_partners.json` and `docs/kb-notes/` — both internal, both
  vault-synced. The public KB changes only through its own `CURATION.md`
  human-reviewed draft PR.
- **Supabase only through the MCP** (Rule 9c) — the sandbox cannot reach
  `*.supabase.co`.
- **Attribute the human.** A note's `author` and an artifact's `added_by` travel
  into whatever the run produces. A curator's knowledge is a first-class input, not
  raw material to launder into an anonymous fact.
- **Say what you did not do.** If you skipped an input, the reply says which and
  why. Silent partial coverage reads as full coverage.

## Why artifacts are links, not uploads

Measured 2026-08-06, not assumed. A file uploaded to Supabase Storage is one a
session **cannot read back**: the sandbox cannot reach `*.supabase.co`, the
Supabase MCP exposes no storage tool, and the public object URL returned 403
through the agent proxy. The artifact would sit one inch beyond the reach of the
thing meant to analyze it.

Corroborating evidence: the `factsheet-images` bucket shipped 2026-06-28 with a
full RLS posture and holds **0 objects**. It has never been used.

A link inverts every one of those properties — readable today (Drive via the Drive
MCP, web via fetch), no duplicate copy, no size cap, no bucket to secure, and the
artifact stays where the team already keeps it. The generalizable rule:

> **Put shared input where the thing that must read it can already reach — and
> verify that reach before building the affordance, not after.**
