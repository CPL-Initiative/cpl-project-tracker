---
title: Methodology — Server-enforced shared-password edit gate (no per-user accounts)
date: 2026-06-29
updated: 2026-06-29 (empty-Bearer 401 pitfall · validate-via-gate-RPC · reviewer-manage admin)
tags: [methodology, auth, supabase, rls, security, raci, session-83]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/mission_control_lessons]]"
  - "[[docs/kb-notes/methodology-refresh-token-before-write]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
---

# Methodology — Server-enforced shared-password edit gate (no per-user accounts)

**Problem.** A small internal team wants to edit a Supabase-backed surface (the
RACI matrix, members, updates, nudges) **without each person doing a magic-link
sign-in**. The bar is "one shared phrase the team knows," not real identity. But
the surface is on a public Pages site using the **public anon key** — so you
cannot just loosen RLS to `using (true)`, or *anyone* with the key (i.e. anyone
who views source) can write.

**Wrong fix.** A client-side phrase check (`if (typed === SECRET) allowEdit()`)
is theater: the writes still go straight to PostgREST with the anon key, so a
attacker skips the JS entirely. The phrase must be checked **inside Postgres**.

## The pattern — header-checked RLS function

1. **Hold the secret in a table the client can't read.** RLS on, **no anon
   policies at all** → only `SECURITY DEFINER` functions (running as the owner)
   can see it.
   ```sql
   create table public.team_access (id text primary key, secret text not null, updated_at timestamptz default now());
   alter table public.team_access enable row level security;   -- no policies on purpose
   insert into public.team_access values ('raci','your phrase') on conflict do nothing;
   ```
2. **A comparator, revoked from public** so it can't be used as a brute-force
   oracle from the client:
   ```sql
   create function public.team_pass_check(p text) returns boolean
     language sql security definer stable set search_path = public as $$
     select exists (select 1 from public.team_access where id='raci' and secret = p);
   $$;
   revoke all on function public.team_pass_check(text) from public;
   ```
3. **A header reader** the RLS policies call. PostgREST exposes the request
   headers as a GUC; read the one your client sends:
   ```sql
   create function public.team_pass_ok() returns boolean
     language plpgsql security definer stable set search_path = public as $$
     declare hdr text;
     begin
       hdr := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
       if hdr is null then return false; end if;
       return public.team_pass_check(hdr);
     end;
   $$;
   grant execute on function public.team_pass_ok() to anon, authenticated;
   ```
4. **Widen the write policies to `OR`** so the existing per-user reviewers keep
   working — never *replace* the identity path, add to it:
   ```sql
   create policy ir_write on public.item_raci for all
     using (is_allowed_reviewer() or team_pass_ok())
     with check (is_allowed_reviewer() or team_pass_ok());
   ```
5. **Client: send the phrase as the header** on every write (and nowhere else):
   ```js
   if (sess.teamPass) headers["x-team-pass"] = sess.teamPass;   // POST/PATCH/DELETE only
   ```

## Why this is safe enough (and its limits)

- The anon key **alone** can't write — the policy needs the phrase, which lives
  only server-side. Reading source doesn't leak it.
- The phrase travels over **TLS** in a header, never in a row the client can
  `SELECT`. `team_pass_check` is revoked so the client can't probe it directly.
- **It's still a shared secret** — anyone who knows the phrase (or sniffs a
  signed-in browser's request) can write, and there's **no per-actor audit**
  (every write is "the team"). That's the deliberate trade for "lower stakes, no
  login." Keep real identity (magic-link) as the parallel path for anything that
  needs attribution, and rotate the phrase by updating one row:
  `update public.team_access set secret='new phrase' where id='raci';`
- Scope the gate to **low-stakes tables only**. Don't widen a policy that guards
  PII or destructive ops to `team_pass_ok()`.

## Client-side companion: the pseudo-session

To avoid editing every `canEdit`/`state.sess` guard, make the unlocked phrase
**look like a session**: `state.sess = { teamPass, email: "(team)" }`. Every
existing `if (state.sess)` check passes unchanged; only two spots change —
the write-header builder (attach `x-team-pass`) and the session loader
(`getSession() || teamSession()`). See `raci.js` (Session 83) for the reference
implementation; the test (`tests/raci_team_pass.test.js`) asserts the header is
attached for a phrase session and a real Bearer token for a magic-link session
(no regression).

## Pitfall: never send an empty `Bearer ` (it 401s before RLS)

A phrase/anon session has no user JWT. If the client sends `Authorization:
"Bearer "` (empty token), **PostgREST rejects the malformed JWT at the auth layer
with `401` — before your RLS policy (and `team_pass_ok()`) ever runs.** So the
phrase gate "doesn't work" even though it's correct. Fall back to the **anon key**
as the bearer when there's no user token (the Supabase-idiomatic anon write):

```js
var token = (s && s.access_token) || SUPABASE_ANON;   // NEVER "" → "Bearer "
var h = { apikey: SUPABASE_ANON, Authorization: "Bearer " + token };
if (s && s.teamPass) h["x-team-pass"] = s.teamPass;
```

**Diagnostic tell:** a *wrong-credential RLS rejection* returns **403**; an
**401** means the request never reached the policy → look at the auth header, not
the policy. (This bug cost a real "I entered the phrase and it still 401s" report.)

## Validate the phrase on entry — call the gate function as an RPC

The client can't read the secret (that's the point), so it can't check a typed
phrase locally — a wrong phrase would get stored and only fail (401) on the first
*write*, with no obvious recovery. Fix: the gate function (`team_pass_ok()`) is
already granted to `anon`, so **call it as an RPC** with the candidate phrase and
store the phrase only if it returns `true`:

```js
fetch(URL + "/rest/v1/rpc/team_pass_ok", { method:"POST",
  headers:{ apikey:ANON, Authorization:"Bearer "+ANON, "x-team-pass":phrase },
  body:"{}" }).then(r => r.json())   // → true | false
```

No new exposure — it's the **same right/wrong signal a write already gives**
(the function was anon-callable as the gate). A write that 401/403s later means
the phrase was *rotated*; drop the stale phrase client-side and re-prompt.

## A reviewer can manage the secret (RLS asymmetry)

Give trusted *identity* users (magic-link reviewers) a UI to view/rotate the
phrase by adding **reviewer-only** policies to the secret table — without ever
giving `anon` a read path:

```sql
create policy ta_select on public.team_access for select using (is_allowed_reviewer());
create policy ta_update on public.team_access for update
  using (is_allowed_reviewer()) with check (is_allowed_reviewer());
```

`is_allowed_reviewer()` is false for anon, and there's no `using (true)` policy,
so the public still can't read the secret — only signed-in reviewers can. The
SECURITY DEFINER `team_pass_ok`/`team_pass_check` bypass RLS regardless, so the
phrase gate keeps working for everyone.

## Verify after deploy

`request.headers`/`current_setting` can't be exercised from a sandbox that can't
reach Supabase — **confirm a real save works in the browser after the deploy**
(unlock with the phrase, edit a cell, reload, see it persist). A green jsdom
suite proves the client attaches the header; only a live write proves the policy
accepts it.
