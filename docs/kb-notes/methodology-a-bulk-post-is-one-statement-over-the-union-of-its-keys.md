---
title: A bulk POST is one statement over the union of its keys
created: 2026-08-15
updated: 2026-08-15
tags: [methodology, supabase, postgrest, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[adr-the-side-menu-as-an-overlay-over-code-defaults]]"
artifacts:
  - admin.js
  - tests/admin_tab.test.js
---

# A bulk POST is one statement over the union of its keys

> **One-sentence summary** — PostgREST turns an array of objects into a single
> INSERT whose column list is the union of every object's keys, so a key present
> on some rows and absent from others arrives as NULL on the rest — and a
> NOT NULL column then rejects the whole batch with a 400.

## Context

The Admin tab writes the whole side-menu arrangement to `cobi_nav` in one
`POST` with `Prefer: resolution=merge-duplicates`. Every save returned **400**,
and the table held **zero rows** — no save had ever succeeded since the tab
shipped. The error surfaced to the curator as *"Could not save — save 400"*
with advice to renew a sign-in that was never the problem.

## The claim

`draftRows()` built two shapes:

```js
// group row — 10 keys
{ kind, key, label, parent, sort_order, hidden, orgs, pinned, updated_by, updated_at }
// tab row — 11 keys
{ kind, key, label, parent, sort_order, hidden, orgs, pinned, audience, updated_by, updated_at }
```

`audience` is `NOT NULL`. Because the insert's column list is the **union**, it
included `audience`, and every group row supplied NULL for it → `23502` →
HTTP 400 for the entire batch. Every save contains at least one group, so every
save failed.

**The defect does not exist in any single row.** Each row is individually valid
and would insert on its own. It exists only *across the array* — which is why
row-level assertions and a jsdom fetch mock that accepts any body all passed
while the feature was completely non-functional.

### Two rules follow

1. **Emit one uniform shape for every row in a bulk write.** Build both kinds
   through a single constructor so a column added for one kind cannot silently
   omit itself from the other.
2. **Assert the uniformity, not the column.** `rows.every(r => 'audience' in r)`
   passes the day someone adds the next kind-specific column. What holds is:

   ```js
   const shapes = [...new Set(rows.map(r => Object.keys(r).sort().join(",")))];
   check("every row carries the identical key set", shapes.length === 1);
   ```

## How we got here

Reproduced without touching production data by cloning the table's constraints
into a temp table (`create temp table … (like public.cobi_nav including all)`)
and inserting both shapes: the group row as sent was rejected `23502`, the same
row with `audience` supplied was accepted.

The client also discarded the response body, so the actual reason —
`null value in column "audience" violates not-null constraint` — never reached
anyone. A status code is not a diagnosis.

## Consequences

- **Bulk-write payloads need a shape test**, because per-row validity does not
  imply batch validity and mocks rarely model the server's statement building.
- **Always surface the error body** on a failed write. PostgREST names the
  column and the constraint; hiding that turned a one-line payload defect into
  two days of a feature that looked finished.
- **Never attribute a 400 to authentication.** 400 is malformed-request; 401/403
  is credentials. Telling a user to sign in again on a 400 sends them round a
  loop no valid session can escape.
- Silent-zero corollary: an overlay table that is *supposed* to start empty
  gives no signal that writes are failing. `cobi_nav` reading 0 rows looked
  exactly like "seeded empty, as designed".
