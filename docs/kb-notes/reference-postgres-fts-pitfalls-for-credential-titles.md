---
title: Postgres full-text search pitfalls on freehand credential titles
created: 2026-08-06
updated: 2026-08-06
tags: [reference, postgres, search, sierra, cpl-assistant, exhibits]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase_search_exhibits_by_topic_v2.sql
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Postgres full-text search pitfalls on freehand credential titles

> **One-sentence summary** — four concrete ways `to_tsquery('english', …)`
> silently misfires on CPL exhibit titles, each found in production, each with
> the fix that was actually shipped.

## Context

Sierra searches `chatbox_exhibits` — ~2,400 college-entered exhibit titles full
of acronyms (`AED`, `BLS`, `ASE`, `POST`, `NCCER`), slashes
(`First Aid/CPR/AED`), and typos (`Automotive Service Excellance`). The English
text-search configuration is tuned for prose, and every assumption it makes is
wrong for this data at least once.

## The claim

### 1. The stemmer destroys short acronyms

```sql
select to_tsquery('english', 'aed:*');   -- 'a':*
```

Snowball reads the trailing `-ed` as a past-tense suffix and strips it. With
`:*` that becomes a **prefix match on the letter "a"** — it matched most of a
2,397-row corpus, and OR'd with the other terms it swallowed the entire query.
This is not exotic: any short token ending in a stemmer-recognised suffix is
exposed (`-ed`, `-es`, `-ing`, `-ly`, `-s`).

**Fix:** route short tokens (≤4 chars) and any token whose English parse
collapses below 3 characters to an **unstemmed `simple` vector**. Keep stemming
for longer tokens so `welding` still finds `welder`.

### 2. Slashes make one token, not three

```sql
select to_tsvector('simple', 'Standard First Aid/CPR/AED');
-- 'aid/cpr/aed':3  'first':2  'standard':1
```

The default parser classifies `Aid/CPR/AED` as a **file** token. A search for
`cpr` cannot match a title that is literally about CPR. Modesto's
`HE 100 Standard First Aid/CPR/AED` rows had only ever surfaced by accident —
via the unrelated word "Certificate" in the same title.

**Fix:** normalise `/ \ | ; : , ( ) [ ]` to spaces **before** tokenising, on both
the indexed side and any document-frequency count. Wrap it in an `IMMUTABLE`
helper so it can back an index.

### 3. A generic term OR'd in swallows the result cap

`cert` matched **445 of 2,397 exhibits (18.6%)**. OR'd with the specific terms
and capped at 200 rows, it buried every real hit.

**Fix, two layers.** A hand-maintained stoplist for domain meta-words that
describe the *ask* rather than the *topic* (`cert`, `cpl`, `ccc`,
`articulation`) — cheap and explicit. Plus a **document-frequency filter** as
the self-tuning net: drop any term matching more than ~15% of the corpus. The
DF filter caught `engine` (15.5%, prefix-matches "Engineering") that nobody had
thought to stoplist. Guard it: if *every* term looks generic, keep them all
rather than return nothing.

### 4. Fuzzy matching cannot bridge a vocabulary gap

Tempting to answer misspellings with `pg_trgm` over the titles. It does not work
when the corpus uses a different word:

```sql
select word_similarity('cardiopulminary', 'Adult CPR and Standard First Aid');
-- 0.069
```

The titles say "CPR". No string distance connects them to "cardiopulmonary",
correctly spelled or not.

**Fix:** fuzzy-match the **synonym key**, not the corpus — correct
`cardiopulminary` → `cardiopulmonary` first, then expand through the table.
Reserve corpus-side trigram matching for genuine corpus typos (`Excellance` vs
`excellence` scores 0.636; unrelated pairs sit near 0.25, so ~0.6 is a workable
floor), and reach it **only when full-text finds nothing** so normal queries
never pay for the scan.

## The overload trap (not FTS, but it bites in the same file)

Postgres keys functions by argument signature, so adding a parameter with
`CREATE OR REPLACE FUNCTION` creates a **second** function rather than replacing
the first:

```
ERROR 42725: function search_exhibits_by_topic_v2(text[], unknown, integer)
             is not unique
```

A PostgREST RPC call with the original argument count then fails outright. Any
parameter addition must `DROP FUNCTION` the superseded signature explicitly.

## Consequences

- Prefer `simple` for anything acronym-shaped; prefer `english` for prose.
- Never trust `:*` on a short token without checking what it parses to —
  `select to_tsquery('english', t || ':*')` is a one-line sanity check.
- Sanitise query terms **next to the corpus** whose statistics decide them, not
  in the client. Taking `text[]` instead of a prebuilt tsquery also stops a
  caller injecting an over-broad query.

## See also

- [`methodology-assert-what-retrieval-returns`](methodology-assert-what-retrieval-returns.md) — why none of this was caught for five weeks.
