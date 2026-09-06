---
title: Playbook — auto-write cpl_memory at every checkpoint (Phase 3 of the memory loop)
created: 2026-07-24
updated: 2026-09-06
tags: [playbook, memory, supabase, checkpoint, governance, obsidian-target]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-unified-memory-table]]"
  - "[[docs/memory/cpl_memory]]"
artifacts:
  - kb/supabase_cpl_memory.sql
  - cpl_memory.js
---

# Playbook — auto-write cpl_memory at every checkpoint (Phase 3 of the memory loop)

> **One-sentence summary** — At each Rule-8 checkpoint a session writes this
> run's *durable, uncaptured* learnings into the live `cpl_memory` table via the
> Supabase MCP — **auto-write, no approval gate** — with own-writes landing
> `proposed` until corroborated, the truth table kept **lean**, and every change
> logged to `cpl_memory_log`.

## Context

Phase 3 of the memory loop (Phase 1 = the table + audit log + seed, #890; Phase 2
= the 🧠 pane, #891). Auto-write closes the loop: sessions keep the table current
so it stays a faithful orientation layer beside `CLAUDE.md` (rules) and the
handoffs (state). The operating model is Sam's ratified **auto-write by default,
curate by exception** — the gate is on *trust* (what's shown as true), not on
*writing*. See [[docs/kb-notes/adr-unified-memory-table]] §"Ratified design
principles" (`d-mem-*`/`r-mem-*` in the table itself).

## The procedure (run it as part of the checkpoint)

1. **Fresh read (MCP).** `select slug,kind,summary,status from cpl_memory order by
   updated_at desc` — know what's already there (dedupe; it's also the
   corroboration check). The sandbox can't reach `*.supabase.co` — **MCP only**
   (Rule 10c).
2. **Decide what to write — a handful, not dozens.** Only learnings that cross the
   KB-note bar: **durable · reusable · distilled · genuinely uncaptured.** A
   `fact`/`pitfall`/`decision`/`procedure`/`risk`/`question`/`opportunity`/`milestone`
   this run actually established. **Do NOT** dump a running session log — the
   handoff + lessons docs do that, and `cpl_memory_log` carries volume. If it's
   already a row, update it; don't duplicate.
3. **Status = the corroboration gate (`d-mem-corroboration-gate`).** A session's
   own new write lands **`status='proposed'`**. Promote to **`verified`** only when
   corroborated: (a) a 2nd session independently asserts it, (b) `source` points to
   a **committed KB-note or merged PR** (that citation *is* the corroboration), or
   (c) Sam's ✓ in the pane. So a checkpoint learning you *also* wrote as a
   committed KB note → `verified` (source = that note); a bare observation with no
   anchor → `proposed`. **Only `verified` is trusted-on-read / shown by default.**
4. **Supersede, don't delete.** A learning that makes an old row false → the
   Revise pattern: PATCH the old row `status='superseded', superseded_by=<new
   slug>` and write the corrected row. Never hard-delete (history matters +
   "which rule led to this action").
5. **Write `title` + `plain` on EVERY row — `plain` is not optional (hardened
   2026-08-23).** The Report ("Everything We Know") is a shareable, non-techie
   briefing. It renders a short **`title`** (a 3-6 word label, bold above each item)
   and the **`plain`** prose (falling back to `summary`(+`detail`) when null). Give
   every new row both.

   ⚠️ **The "skip `plain` when the summary already reads plainly" escape hatch is
   RETIRED, because it is the thing that emptied the field.** Measured 2026-08-23:
   **281 rows carried no `plain`, and 279 of them were written in August** — this was
   not a legacy backlog, it was a habit that decayed the moment volume rose. Every one
   of those sessions had this rule available and judged its own summary plain enough.
   **The author is the worst possible judge of that**: a summary reads plainly to the
   person who just did the work and holds all the context that makes it legible.

   Sam, 2026-08-23, on rows he could not audit: *"maybe some of the other memory is
   needed — not sure because it's written in language you understand but I don't
   altogether."* That is the cost. His ✓ is the corroboration mechanism that promotes
   a row to `verified`, and **a row he cannot read is a row he cannot govern** — he
   set two rows to `stale` that day and only one of them should have been. So the
   field is load-bearing, not a courtesy.

   **What `plain` must be:** what you would tell a colleague who does not work on
   this — no filenames, no column names, no flags, no identifiers, and a concrete
   example wherever the summary is abstract. Name the consequence, not the mechanism.
   (Both fields are reader aids; they never change the curator/AI meaning in
   `summary`/`detail`.) In the dashboard, the **✨ Autogenerate** button on the
   Add/Edit form drafts all of these from a typed topic via the cpl-chat RAG
   function — a curator convenience, still session-reviewed before save.
6. **Log every write** to `cpl_memory_log` (actor = your session moniker), then
   **VERIFY the log actually landed before you say the rows were written.**
   ⚠️ This step failed silently on 2026-09-06: the checkpoint wrote 8 rows, its
   commit body said so, and **not one had a `cpl_memory_log` entry** — the log
   `insert ... select` is a separate statement, so skipping it is invisible from
   the `cpl_memory` side, and nothing in the suite can see it (the sandbox cannot
   reach `*.supabase.co`). The check is one query and it belongs in the same call:

   ```sql
   select m.slug, count(l.id) filter (where l.action='create') as creates
   from public.cpl_memory m
   left join public.cpl_memory_log l on l.memory_id = m.id
   where m.author = '<MonikerSNN>' group by m.slug order by m.slug;
   ```

   Every row this run wrote must show `creates = 1`. Backfill with the same
   `insert ... select`, guarded by `not exists (... action='create')`, and say in
   the note that the entry is late.
7. **Keep it lean (`d-mem-retrieval-first`).** If the table grows past
   browsability, that's the signal to supersede/archive aggressively — not to pile
   on. It's a retrieval surface (query by scope), not an infinite feed.
8. **`scope` is a TWO-VALUE vocabulary (Sam's ruling, 2026-08-30, Open Verdicts
   item 13): `general` | `workstream-specific`** — tags keep the topic. Never
   write any other value; leave it blank when unsure (blanks are legitimate and
   stay blank until touched). The 68 legacy free-form values were migrated that
   day with per-row before/after receipts in `cpl_memory_log`.

### SQL patterns (via `mcp__Supabase__execute_sql`, project `hvuwhnbuahrtptokpqfh`)

Insert new rows (JSON handles escaping; `status` per the gate):

```sql
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, author)
select x.slug, x.kind, coalesce(x.org,'cpl'), x.title, x.summary, x.detail, x.plain,
       x.tags, x.source, coalesce(x.related,'{}'::text[]), x.status, '<MonikerSNN>'
from jsonb_to_recordset($json$[ {"slug":"…","kind":"…","title":"… (3-6 word label)","summary":"…","detail":"…",
       "plain":"… (REQUIRED — what you would tell a colleague who does not work on this: no filenames, no column names, no identifiers, and a concrete example where the summary is abstract. Never omit: see rule 5.)",
       "tags":["…"],"source":"…","status":"proposed"} ]$json$::jsonb)
  as x(slug text, kind text, org text, title text, summary text, detail text, plain text,
       tags text[], source text, related text[], status text);
```

Promote / stale / supersede (curator or corroboration):

```sql
update public.cpl_memory set status='verified', verified_at=now(), verified_by='<who>'
  where slug='<slug>';
-- supersede: update old set status='superseded', superseded_by='<newslug>' where slug='<oldslug>';
```

Log (do it in the same call, referencing the touched rows):

```sql
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, '<MonikerSNN>', 'create', 'checkpoint auto-write', to_jsonb(m)
from public.cpl_memory m where m.slug in ('<slug1>','<slug2>');
```

## When this applies (and when it doesn't)

- **Applies:** every Rule-8 checkpoint (and session end). It's checkpoint step 10
  and a `cpl_memory` bullet in Rule 8.
- **Does NOT mean bulk-import the corpus.** That's the *deferred* Phase-4 audit —
  and even then it's **incremental + contradiction-focused**, never a full-corpus
  sweep (`r-mem-corpus-not-truth`, `r-mem-audit-small-n`). Auto-write is only the
  *trickle* of what this run genuinely learned.
- **Never** write secrets/PII; sessions only ever set `visibility='internal'`
  (public promotion is curation-gated, `r1`).
- **Lint it when the hopper is worked (added 2026-09-05).** `kb/_memory_audit.py`
  is the table's structural lint — dead paths, dangling `related` pointers, a
  stale row still wearing a stamp, PRs not on `main`, null slugs, near-duplicates
  — READ-ONLY, over an export (`--from-json`; the query is in its docstring).
  Run it before a hopper sweep and after one; its `snapshot_claim` list is the
  set of rows whose numbers will drift. The semantic test — is the claim still
  true against `docs/reference/lanes/`? — stays a session's read, applied under
  a committed receipt with one `cpl_memory_log` row per write
  (`kb/memory_audit/2026-09-05-receipt.json`, Session 229).
- **Optionally** regenerate the Obsidian mirror `docs/memory/cpl_memory.md` from
  the live table at checkpoint (keeps the vault copy fresh) — nice-to-have, not
  required.

## See also

- `[[docs/kb-notes/adr-unified-memory-table]]` — the design + ratified principles
- `[[docs/memory/cpl_memory]]` — the Obsidian mirror
- `kb/supabase_cpl_memory.sql` — schema-of-record · `cpl_memory.js` — the pane
- `CLAUDE.md` Rule 8 (checkpoint artifact) + `.claude/commands/checkpoint.md` step 10

---

*Authoring check: durable (the loop is standing), reusable (every checkpoint),
distilled (one procedure), self-contained.*

## ⚠️ The missing half: READ it (added 2026-08-10)

This playbook is named *auto-write-at-checkpoint*, and until now that was the
whole contract. **There was no read step, and it cost a full session.**

On 2026-08-10 a session re-derived three settled facts — that `TblSOURCE.Student`
is a grouping counter, that the MAP internal student id must never reach Supabase,
and that 537k rows had already been assessed for Sierra — while all three sat in
this table. It wrote 8 rows that day and queried the table **zero** times. The
corpus had 182 rows, 174 of them predating that session, 85 verified.

**Query before you work:**

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['<workstream-tag>'] or summary ilike '%<keyword>%')
order by event_date desc nulls last limit 40;
```

### A human-sourced row may not be silently superseded

`two-sierras-internal-and-public` carried Sam's own words — *"Sierra only lives in
COBY for now"* — and a later session marked it `superseded` after reading the code
(three callers, one shared function). **Both claims were true.** His was about
where the widget is *deployed*; the code finding was about what it *calls*. But
only `verified` shows by default, so the fact left the working set and he had to
restate it two days later.

Rule: if `source` or `verified_by` names a human, either supersede it **explicitly
and say why**, or file a NEW row and flag the conflict for them. A measured
topology and a stated deployment are different kinds of claim, and one does not
retire the other.
