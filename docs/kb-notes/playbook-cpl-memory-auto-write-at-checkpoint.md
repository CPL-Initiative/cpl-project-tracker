---
title: Playbook — auto-write cpl_memory at every checkpoint (Phase 3 of the memory loop)
created: 2026-07-24
updated: 2026-07-24
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
   (Rule 9c).
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
5. **Write `title` + `plain` for the 📄 Report (2026-07-25).** The Report
   ("Everything We Know") is a shareable, non-techie briefing. It renders an optional
   short **`title`** (a 3-6 word label, bold above each item) and the optional
   **`plain`** prose (falling back to `summary`(+`detail`) when null). So on each new
   row give it a short `title`, and — when the `summary` is jargon-heavy (a filename,
   a flag like `has_ccc`, an id scheme) — a `plain` sentence a layperson can follow,
   **with a concrete example where the summary is obtuse**. Skip `plain` when the
   summary already reads plainly. (Both are reader aids; they never change the
   curator/AI meaning in `summary`/`detail`.) In the dashboard, the **✨ Autogenerate**
   button on the Add/Edit form drafts all of these from a typed topic via the cpl-chat
   RAG function — a curator convenience, still session-reviewed before save.
6. **Log every write** to `cpl_memory_log` (actor = your session moniker).
7. **Keep it lean (`d-mem-retrieval-first`).** If the table grows past
   browsability, that's the signal to supersede/archive aggressively — not to pile
   on. It's a retrieval surface (query by scope), not an infinite feed.

### SQL patterns (via `mcp__Supabase__execute_sql`, project `hvuwhnbuahrtptokpqfh`)

Insert new rows (JSON handles escaping; `status` per the gate):

```sql
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, author)
select x.slug, x.kind, coalesce(x.org,'cpl'), x.title, x.summary, x.detail, x.plain,
       x.tags, x.source, coalesce(x.related,'{}'::text[]), x.status, '<MonikerSNN>'
from jsonb_to_recordset($json$[ {"slug":"…","kind":"…","title":"… (3-6 word label)","summary":"…","detail":"…",
       "plain":"… (a non-techie sentence; omit/null if the summary is already plain)",
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
