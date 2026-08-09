---
title: RLS is not a gate in front of a service-role edge function
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, security, rls, supabase, edge-functions, sierra, disclosure-control]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/methodology-small-cell-suppression-must-survive-subtraction]]"
  - "[[docs/kb-notes/playbook-deploy-an-edge-function-from-the-runner]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/smoke_test.sh (mode 15d)
---

# RLS is not a gate in front of a service-role edge function

## The claim

A Supabase table with a tight RLS policy is **not** protected from an edge
function that reads it with the **service-role key**. Service role bypasses RLS
by design. If that function is also reachable without authentication, then
anything the function is willing to say, the public can obtain — and the RLS
policy on the table had no part in the decision.

This sounds obvious stated plainly. It is easy to miss in practice because the
policy is *right there*, it is genuinely tight, and reading it produces a feeling
of safety that does not correspond to the code path being added.

## How it presented (2026-08-09)

The session-129 handoff scoped a task as low-risk on this reasoning:

> The COBI Sierra is INTERNAL — same audience as the Course Credit tab… Wiring
> *that* one carries **no new disclosure decision**. Start here.
> …The colleges/portal Sierra is PUBLIC. That is a **separate decision**.

To its credit it also said: *"Do not assume the two share a retrieval path —
confirm the deployment topology before touching anything."* Checking took two
greps:

| Caller | Endpoint |
|---|---|
| `cpl_chat.js` (internal COBI tab) | `/functions/v1/cpl-chat` |
| `sierra/sierra.js` (public map.rccd.edu widget) | **the same** |
| `fact-sheet/factsheet_sierra.js` | **the same** |

One function, three front-ends. It reads with `SUPABASE_SERVICE_ROLE_KEY` and is
deployed `--no-verify-jwt` (load-bearing: the widget sends the anon key, not a
user JWT). There was no internal instance to start with, so the "start with the
safe one" plan had no safe one to start with.

Meanwhile the tables involved carried exactly the right policies —
`is_allowed_reviewer() OR team_pass_ok()` on the aggregates, plain
`is_allowed_reviewer()` on the student grain. Those policies were doing real
work: they stop the widget's anon key querying PostgREST directly. They have
**no bearing whatsoever** on what the edge function chooses to put in a prompt.

## The rule

**Identify the principal, not the policy.** Before treating an RLS policy as the
control on a new read path, ask which key performs the read:

- **Anon / user JWT** → RLS is the control. Reason about the policy.
- **Service role** → RLS is irrelevant to this path. **The function's own code is
  the entire access-control surface**, and it must be reasoned about as such.

Then ask who can invoke the function. With `verify_jwt` disabled, the answer is
"anyone with the URL," and no field in the request body changes that.

## Corollary: a client-supplied discriminator is not an authorisation

The obvious patch is to have the caller declare itself — `audience: "team"`,
`ctx: "internal"`, an `Origin` header. None of these is a gate:

- Request-body fields are chosen by the caller. `curl` sets them freely.
- `Origin` is enforced by *browsers*, protecting users from other sites. It does
  not protect a server from a client, and is trivially set outside a browser.
- The pattern is already documented in this very function, honestly, in a comment
  on its own context flag: **"FAIL-OPEN by design."**

These fields are fine for *tailoring* (voice, emphasis, which rules to include).
They cannot carry a *decision about who may see what*.

If a genuine split is needed, the function must **verify** something: validate a
Supabase session JWT presented by the caller and re-check the reviewer predicate
server-side. That is a real build, not a flag.

## What to do instead

1. **Verify the topology before scoping the risk.** Deployment shape is cheap to
   check and expensive to assume. Two greps refuted a premise that had already
   survived into a handoff.
2. **Escalate the question to the person whose call it is**, with the finding in
   hand, rather than inheriting the handoff's framing. What was written down as
   "no new disclosure decision" was in fact *the* disclosure decision.
3. **Test the property at the boundary you actually rely on.** Since RLS is not
   the control on the function's path, assert it where it *is* the control: the
   anon key against PostgREST directly. That check belongs in the smoke suite,
   because it is the thing that would silently change.
4. **Add a positive control to any "returns nothing" assertion.** An expired key
   makes every negative check pass for the wrong reason. Assert that a
   deliberately world-readable table *does* return a row first.

## The trap inside the guard

The first version of that boundary check asserted `response == "[]"` and reported
anything else as a leak. Its first CI run printed:

```
::error::STUDENT GRAIN LEAKED to anon: {"code":"57014",
         "message":"canceling statement due to statement timeout"}
```

Nothing leaked. PostgREST returned an **error body**, and the check had conflated
"not the empty array" with "rows were served." A security assertion that cries
wolf is worse than none: the next real one gets discounted.

Three responses, three meanings — and the middle one is the one people forget:

| Response | Meaning | Verdict |
|---|---|---|
| `[]` | policy filtered everything | **pass** |
| `{"code":…,"message":…}` | error; **no rows served** | **pass**, print the error |
| `[{…}]` | rows reached the caller | **fail** |

The timeout is itself expected rather than a defect: RLS is evaluated per row, so
a 200k-row table exhausts the statement budget before it can return the empty
set. It is weak evidence *for* filtering — an open policy would satisfy `limit=1`
instantly.

## Reusable checklist

- [ ] Which key does this code path use? (service role ⇒ RLS is not the control)
- [ ] Who can invoke this function? (`verify_jwt` disabled ⇒ anyone)
- [ ] Is any "who is asking" signal caller-supplied? (⇒ not an authorisation)
- [ ] Is the disclosure decision *mine* to make, or the owner's? (⇒ escalate)
- [ ] Does a test assert the boundary that is actually load-bearing?
- [ ] Does that test distinguish *no rows* from *an error*?
- [ ] Does it have a positive control?

---

*Authoring check: durable (a property of service-role architecture, not of one
feature), reusable (any edge function reading gated tables), distilled (one
claim plus its corollary), self-contained.*
