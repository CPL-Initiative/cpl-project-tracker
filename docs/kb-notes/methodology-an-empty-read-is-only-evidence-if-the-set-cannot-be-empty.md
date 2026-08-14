---
title: An empty read is only evidence if the set cannot legitimately be empty
created: 2026-08-14
updated: 2026-08-14
tags: [methodology, rls, supabase, error-handling, ui, admin, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what]]"
  - "[[docs/admin_tab_lessons]]"
artifacts:
  - sierra_training.js
  - admin.js
  - team_phrases.js
---

# An empty read is only evidence if the set cannot legitimately be empty

## The rule

PostgREST answers an RLS-filtered read with **`200` and `[]`** — byte-identical
to "the table really is empty". Nothing in the response distinguishes them. The
*only* thing that can is prior knowledge about the table:

> **`[]` proves "not authorised" if and only if the set is known to be non-empty.**
> Otherwise it proves nothing, and treating it as proof inverts the message.

## How this repo learned both halves

**`team_phrases.js` (2026-08-12) got it right.** `team_access` holds the site
phrases and is known non-empty (4 rows), so an empty read is unambiguous:

```js
// The roster is known to be non-empty, so [] here means NOT AUTHORISED, and
// saying "no phrases configured" would tell a locked-out person the exact opposite.
if (!Array.isArray(rows) || rows.length === 0) { state.loadState = "unauthorized"; }
```

**`sierra_rules` (2026-08-14) is the mirror case, and copying that inference
would have been a defect.** The table is **seeded empty on purpose** — zero rows
means every rule is running its code default. So `[]` is the *healthy* state,
and the same three lines would have told a reviewer they were locked out **and**
told a genuinely locked-out person that Sierra has no rules governing her.

The fix is not cleverer error handling. It is a **second read whose set cannot
be empty**:

```js
// team_access is reviewer-only for SELECT and known non-empty. select=id keeps
// the phrases themselves off the wire — we need the COUNT, not the secrets.
fetch(REST + "/team_access?select=id&limit=1", { headers: authHeaders() })
```

## Four states, not two

Once you need a probe you have four outcomes, and collapsing any pair produces a
lie somewhere:

| State | What the user must be told |
|---|---|
| Not signed in | how to sign in |
| Signed in, probe says not authorised | **a closed door** — "the rules are all present and working" |
| Probe FAILED | "could not check" — never an accusation |
| Authorised, genuinely empty | "nothing has been changed yet" |

The third row is the one most often skipped. A failed probe is *not* evidence of
non-membership, and rendering it as "you are not a reviewer" is a false
accusation produced by a network blip.

## The corollary that saves the probe entirely

Sometimes the surface you are already reading is known non-empty, and then no
second call is needed. The Admin tab's `cobi_rls_gates()` RPC returns one row per
table in the database — a set that is never empty — so `[]` there is unambiguous
on its own. **Ask whether the set can be empty before adding machinery.**

## Test it as four renders

A test that only covers "authorised" and "not authorised" will pass while the
other two states render as one of the first two. Assert on the *copy*, not just
the state name — the whole failure is what the human is told:

```js
check("the closed door says the rules ARE working, not that there are none",
  /closed door, not an empty list/.test(h) && /magic link/i.test(h));
check("a failed probe does NOT claim 'not a reviewer'", state.rulesState !== "notreviewer");
```
