---
title: A client gate stricter than its RLS policy fails silently, toward lost work
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, auth, rls, supabase, ui, data-loss, cpl-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - cpl_funding.js
  - funding/supabase_cpl_funding_config.sql
  - tests/cpl_funding_lane_switch.test.js
related:
  - "[[methodology-a-rotating-credential-cannot-be-cached]]"
  - "[[cpl_funding_lessons]]"
---

# A client gate stricter than its RLS policy fails silently, toward lost work

> **One-sentence summary** — when the client's "may I write?" test is narrower
> than the database policy it stands in front of, a user holding a perfectly good
> credential is refused by their own browser, and the refusal is invisible
> because the local fallback looks like success.

## What happened

Sam relabelled the three funding priorities on the live tab. Nothing reached
Supabase — the config's md5 was byte-identical to a write made hours earlier.

The first diagnosis was **wrong**, and the way it was wrong is the point: the
obvious read is *"he wasn't signed in."* He sent a screenshot. The masthead read
**"● Signed in."**

The gate:

```js
function unlocked() { var t = tp(); return !!(t && t.session()); }
```

`tp()` is the **team-phrase** module, and its `session()` is non-null only when a
phrase sits in `localStorage`. The policy actually guarding the table:

```sql
with check (is_allowed_reviewer() OR team_pass_ok())
```

**The database would have accepted the write. The client never attempted it.**

## Why it was invisible

Three ordinary, individually-reasonable behaviors compose into silence:

1. `activeOverride()` returns a per-browser scenario layer when locked — a real
   feature (anonymous what-if play), used at the wrong moment.
2. `persistActive()` writes that layer to `localStorage` inside a swallowed
   `try/catch`. No network, no error.
3. The scenario layer **wins the render**. The tab shows the change back.

So the edit was *saved*, *displayed*, and *private*. Every signal a person uses to
judge "did that work?" said yes.

⭐ **Two credentials, one word.** The app's masthead reported the **reviewer**
magic-link session; this one tab gated on the **team phrase**. An indicator that
says "Signed in" is answering a question the gate isn't asking.

## The rule

**A client-side permission check must accept exactly what its server-side policy
accepts — no less.** Stricter is not "safer": the failure it produces is silent
and lands on the side of lost work, whereas a client that is correctly permissive
and hits a real policy denial gets a status code it can show.

Two corollaries worth stating separately:

- ⚠️ **Fix it in ONE place.** The same defect sat in **seven** write paths across
  three tables, every one decorating with the phrase alone. Seven copies of an
  auth decision is seven chances for the next one to drift from the policy —
  which is precisely how it survived. One `applyWriteAuth()` helper; the call
  sites stop deciding.
- ⚠️ **Freshness, not presence.** Accept a session only if it is *fresh*. An
  expired token trades a silent private save for a loud 401 — better, but still
  not the goal.

## How to detect it

Cheap and mechanical: for each gated surface, put the client predicate and the
`with check (…)` clause side by side and read them as one sentence. They should
name the same credentials. Where the policy says `A OR B` and the client says
`B`, holders of `A` are being refused by their own browser.

The guard that works is behavioral, not structural: **construct each credential
in isolation and assert the surface unlocks for each.** A test that only ever
supplies the phrase cannot see that the reviewer path is missing — it passes on
the broken code and on the fixed code alike.

## What it is not

Not a session-expiry bug. `docs/session_credentials_lessons.md` covers that
neighbouring failure (a rotating credential cannot be cached), and the two look
identical from the user's chair — *"my change didn't save"* — while having
opposite fixes. Expiry ends a session that was valid; this refuses one that still
is. Check which before reaching for either.

## See also

- The routing was never at fault. Every consumer read the model through its
  accessors, so a renamed priority propagates on its own — the change simply
  never entered the routing. When a downstream artifact looks stale, **verify the
  change reached the store before auditing the fan-out.**
