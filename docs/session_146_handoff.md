---
title: Session 146 handoff (SkyLink → next) — Sierra Training needs to be usable by a human, and the identity write is queued
created: 2026-08-12
updated: 2026-08-12
tags: [handoff, sierra-training, triage, identity, taxonomy, districts]
related:
  - "[[docs/college_identity_lessons]]"
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-validate-a-code-column-by-its-structural-invariant]]"
  - "[[docs/session_144_handoff]]"
superseded: true
superseded_by: session_148_handoff.md
---

# You are Session 146

**Three** sessions ran in parallel on 2026-08-12: **SkyPro** (My College
fold-down, handoff 144), **SkyTouch** (Ashley's Futuro Health HTH → CCC CNA
crosswalk, handoff 145) and **SkyLink** (the college/district identity
crosswalk, this one). All merged. **Read 145 as well** — it is Ashley's
workstream and its carryover is separate from this one.

⚠️ **Sam runs three or four sessions at once, and it is not theoretical.**
SkyTouch and SkyLink both wrote a file called `session_145_handoff.md` within
the same hour; the merge conflict is why this one is 146. `kb/cpl_todos.json`
collided too — that one produces **no** conflict marker when a session
overwrites it wholesale, so it silently loses items. Fetch before assuming your
base is current, re-read `cpl_todos.json` immediately before writing it, and
when you merge someone else's checkpoint, **do not resurrect items their later
checkpoint deliberately dropped**.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date, verified_by from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','triage','identity','taxonomy','my-college']
       or summary ilike '%feedback%' or summary ilike '%college_id%')
order by event_date desc nulls last limit 40;
```

## 🎯 PRIORITY 1 — make Sierra Training triageable by a human

**This is Sam's stated next job.** In his words, 2026-08-12:

> *"I'll want some help on the Sierra Training tab to be sure I can triage and
> respond easily — currently it's not very clear how I should do that and there
> is too much reliance on techie, opaque language."*

Two distinct complaints in that sentence, and they need different fixes:

1. **The workflow is unclear** — a reviewer opening the tab cannot tell what
   they are supposed to *do*, in what order, or what "done" looks like for one
   row.
2. **The language is opaque** — it is written in the vocabulary of the people
   who built it, not of the person triaging.

⚠️ **Do not start by writing code.** Start by opening the tab, taking one real
feedback row, and trying to triage it end to end as Sam would. Write down where
you stall. That list *is* the spec. The tab was built by people who already knew
the model; the failure is invisible from the inside.

Context you will need:
- **25 feedback rows are untriaged**, 11 thumbs-down, the oldest sitting for
  weeks. That backlog is the thing the tab exists to clear, and it has never
  been cleared — the tab measuring itself (`live:"feedback"` on the Governance
  register) says *21 of 25 untriaged*.
- **CI rows are excluded** from the counts already — a smoke test writes one
  feedback row per run through the real anon RPC and cannot clean up after
  itself. 28 of 53 rows were CI, every one rated down. See
  `methodology-a-test-that-writes-to-the-queue-it-monitors`.
- **`prefill()` must stay send-free.** The "Test in Sierra" replay depends on a
  reviewer editing a logged question before replaying it. If you need one-click
  send, add a sibling — `cpl_chat.js` already has `ask()` for exactly this.

Prior art worth copying: **the tier block on My College** (#1123). Sam asked for
the same thing there — *"make this more prose than rows"* and *"add a very brief
note in the title… so users are grounded."* Three rules came out of it and all
three apply here: **a classification label must ship with its scheme**; **in
prose the ORDER is the advice**; and **a state assigned by absence must not be
rendered as a score of zero**.

## 🎯 PRIORITY 2 — write the identity crosswalk to Supabase

Built and merged as a **dry run only** (#1131–#1133). The write is the step that
actually ends the problem Sam keeps hitting.

**What exists:** `kb/college_identity/2026-08-12/crosswalk.json` —
**116 colleges · 116 with a district code · 73 districts · 0 unresolved · 262
name variants, none empty.** Rebuild any time:

```bash
python3 kb/_build_college_identity_crosswalk.py --map-json <map_colleges export>
```

**What the write does:** populate `map_colleges.variants` (empty on all 128 rows
today) and add the district columns. That makes all **16 name-keyed tables**
resolvable through one authority — `coci_college_programs` alone is 22,335 rows.

**Two questions for Sam first:**
1. Do districts get their own `districts` table (73 rows, keyed on
   `district_code`) or ride along as columns on `map_colleges`?
2. Should **North Orange Continuing Education** and **San Diego College of
   Continuing Education** become `entity_kind='college'` rows? Both have their
   own CEO in the 2026 list; neither has a college row; both are among the
   standalone NC institutions the Learning-Partners workstream found at **ZERO**.

## ⚠️ Four things that will mislead you

**1. `map_colleges.variants` is EMPTY on all 128 rows.** Any measurement showing
names "resolve fine" is flattering — Supabase sources agree with each other, not
with the repo. 24 of 116 colleges are spelled differently between the two.

**2. Validate a supplied code column by its STRUCTURAL INVARIANT.** A roster's
`LocationID` had plausible codes and a first row matching the authority exactly;
**3 of 106 agreed**. MIS codes are district-prefixed — that one-line test caught
it. Spot-checking cannot. `methodology-validate-a-code-column-by-its-structural-invariant`.

**3. `cplCollegeShort()` returns its input unchanged on a miss.** A lookup that
fails *looks* like it worked. **Futuro Health is `college_id` 133 with
`entity_kind='partner'`** (Launch Apprenticeship 132) and is deliberately absent
from the crosswalk — key partners on `college_id`, never on the name. Ashley had
a Futuro crosswalk session live on 2026-08-12.

**4. Contacts and staff are NOT PII** (Sam, 2026-08-12) — directory information
for a public program. **Don't invent caution he hasn't asked for.** I withheld
CEO emails on a "public repo" argument and had to withdraw it; they are in
`kb/reference/ccc_colleges_ceo_2026.json` now.

## Still open from handoffs 144 and 145

| # | Item | State |
|---|---|---|
| 1 | MAP deep links · RLS · MIS · student counts | **all held by Sam** |
| 2 | **EACR `statewide_prescriptive.js` → Supabase** | **7 sessions** — still the biggest unblocked item |
| 3 | Two My College design questions | do closed-row summaries earn their place? should *Start here* default open? |
| 4 | `pp` flag cannot separate new reach from routed students | capture before field comms |
| 5 | **`CLAUDE.md` is ~1.5× its lint budget** | concrete fix: move the ⚠️ lists out of the largest §11 cells into `docs/reference/`, leaving pointers |
| 6 | `docs/INDEX.md` 4.7×, `roadmap_archive.md` 2.4× | lint, untouched |
| 7 | **Ashley's HTH → CNA crosswalk needs its MAP-side step** | see handoff 145 — Futuro Health is MAP entity **133 with ZERO exhibits**, which is what unlocks all 61 CNA colleges |

## Safety patterns to honour

- Aggregates only; **`StudentMAPID` must never reach Supabase.**
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; **never force-push `main`**.
- ⚠️ `kb/cpl_todos.json` is rewritten wholesale each checkpoint — **last write
  wins with no merge conflict**. With three or four sessions live it is the file
  most likely to lose someone's work. Re-read it immediately before writing.
- ⚠️ The stop hook fires *"N unpushed commits"* after every squash-merge. **False
  positive** — verify committer = `noreply@github.com`, `origin/main..HEAD` = 0.
- ⚠️ `tests/cpl_funding.test.js` alone takes **>4 minutes**; the full suite ~20.
- ⚠️ The sandbox cannot reach `*.supabase.co`, college domains, or
  `cpl-initiative.github.io`. Supabase goes through the MCP tools only.
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.

## Moniker

**SkyLink** joined the systems that name things. Yours makes one of them
speakable by a human — suggest **SkyPlain**, or coin your own.
