---
title: A live rename must be order-proof, because the database and the deploy cannot be simultaneous
created: 2026-08-15
updated: 2026-08-15
tags: [methodology, supabase, migration, deployment, team-phrase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[playbook-rekey-shared-db-from-alias-map]]"
  - "[[methodology-alias-map-resolution-semantics]]"
  - "[[methodology-a-rotating-credential-cannot-be-cached]]"
artifacts:
  - team_phrases.js
  - raci/supabase_raci.sql
  - tests/team_phrases.test.js
---

# A live rename must be order-proof, because the database and the deploy cannot be simultaneous

## The claim

Renaming a key that lives in **both** a live database and deployed code creates a
window where the two disagree. The window cannot be closed — a SQL statement and
a Pages deploy do not commit together — so **the code must accept both names**,
and then the order stops mattering.

The question to ask is never "which do I do first?" It is **"what does the
mismatch state look like, and what will a user do when they see it?"**

## What happened

`team_access.id` was `raci`, named after the Team & RACI tab the shared phrase
used to live on. That tab was renamed to *Team*, leaving the phrase named after
something that no longer existed.

The rename itself was trivial and safe:

```sql
update public.team_access set id = 'team' where id = 'raci';
```

The **secret was untouched** — fingerprinted with `md5(secret)` before and after
to prove it — so no holder was locked out and nothing needed redistributing.
That is the easy half, and it is the half people check.

## The dangerous half is the window

The Team Phrases page renders from a hardcoded roster and looks each entry's row
up by id. During the mismatch window:

- Code says `team`, database says `raci` → the card **renders blank**.
- A blank card does not look broken. It looks like a phrase that was never set.
- The obvious response to a blank field is to **type into it and press Save**.
- That write creates a **second row**.
- And the gate is `select exists (select 1 from team_access where secret = p)` —
  it matches **any** secret in the table.

So the end state is **two live shared phrases, one of them invisible to whoever
rotated the other.** Rotating away from someone would appear to work and would
not. A credential surface fails in exactly the direction that is hardest to
notice: quietly, in favor of more access.

⚠️ **Note how much worse the consequence is than the change.** The rename was
cosmetic. The window was a security defect. These are not proportional, and
reasoning about the size of a change tells you nothing about the size of its
failure mode.

## The fix: make the order irrelevant

Give the code a **legacy alias** and have it resolve the id a row *actually*
has before writing:

```js
{ id: "team", legacy: "raci", label: "Shared team phrase", … }

function rowIdOf(def) {
  if (state.rows) {
    if (state.rows[def.id]) return def.id;              // renamed already
    if (def.legacy && state.rows[def.legacy]) return def.legacy;  // not yet
  }
  return def.id;    // no evidence — the new id is the right guess
}
```

Read under either name; **PATCH the name that exists.** Deploy first or rename
first — both work, and a rollback of either half is also safe.

## Test both databases, not both code paths

The temptation is to test the alias resolution directly. That is weaker than it
looks, because it tests the helper rather than the situation.

Instead, **keep the existing fixture on the OLD id** — the whole existing suite
then becomes the pre-rename proof, running the real code against the real
pre-rename shape — and **add one block with the NEW id** for the post-rename
shape. Both states, same code, no branching in the test.

If the suite passes against both, the deploy order is genuinely free, and you
have demonstrated it rather than argued it.

## How to apply it

1. **Fingerprint what must not change** (`md5()` on the value, counts before and
   after). Prove the blast radius is what you claim.
2. **Write down what the mismatch window looks like on screen** before touching
   anything. If the answer is "a blank field a user might fill in", stop.
3. **Ship tolerance first**, or ship it in the same change — never rename a live
   key while the only code that reads it knows one name.
4. **Resolve the identifier from live data, not from a constant**, at the point
   of the write.
5. **Test the two database states**, not the two code branches.
6. Leave the alias in place with a comment explaining the era. It costs four
   lines and it makes the rollback safe too.

## Where this generalizes

Any identifier crossing the code/data boundary: enum values, storage keys,
column names read by string, RPC names, cache keys, and the alias-map re-mints
this project already runs under
[[methodology-alias-map-resolution-semantics]]. The re-mint playbook solves the
same problem at scale with an explicit alias map; this is the one-row version of
it, and the reasoning is identical — **the map is what makes the order safe.**
