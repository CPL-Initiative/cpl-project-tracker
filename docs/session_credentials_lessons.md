---
title: Session credentials — what "signed in" means across 26 modules
date: 2026-08-15
tags: [lessons, auth, supabase, admin, sierra]
artifacts:
  - cpl_session.js
  - tests/cpl_session.test.js
  - admin.js
  - cpl_memory.js
  - chatbox/smoke_test.sh
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-rotating-credential-cannot-be-cached]]"
  - "[[methodology-a-bulk-post-is-one-statement-over-the-union-of-its-keys]]"
  - "[[methodology-an-assertion-pinned-to-a-mutable-value-stops-being-a-guard]]"
---

# Session credentials — what "signed in" means across 26 modules

Workstream scratchpad. Append a dated section per checkpoint.

---

## 2026-08-15 — Sky158 (Session 158): one dead token wearing four costumes

### What happened

Sam spent an evening reporting what looked like four separate defects:

| Report | Tab |
|---|---|
| *"Could not save — save 400"* | Admin |
| *"it says I'm not signed in, but I should be"* | Sierra Training |
| *"Could not read the decisions table"* | Common CR Reference |
| *"Memory tab now has 0 entries when there were many previously"* | Memory |

Plus, later, his own diagnosis: *"when I logged in, it opened a new tab and I was
trying to work on Sierra from the original tab."*

**Three of the four were the same defect.** One was genuinely separate.

### (a) What was learned

**1. The Admin save had never worked once.** Not a regression — `cobi_nav` held
zero rows since the tab shipped. A bulk POST is a single INSERT over the *union*
of the array's keys; group rows omitted `audience` (NOT NULL) while tab rows
carried it, so every batch died `23502` → 400. The defect exists only *across*
the array, so every row-level test passed.
→ [[methodology-a-bulk-post-is-one-statement-over-the-union-of-its-keys]]

**2. "Signed in" had two definitions, and one of them was wrong.** A Supabase
access token lives ~1h. Thirteen of twenty-six modules checked only the token's
**shape** — three dot-separated parts, over 40 chars — with no `exp` check and
no refresh. `admin.js`, `sierra_training.js` and `cr_reference.js` are all in
that half. An hour after signing in they still said "signed in" while every
request 401'd, rendered as *"not signed in"* or *"could not read"*. Re-signing in
"fixes" it, which is exactly what hides the cause from the next person.

`raci.js` has known since June and says so in its own comment. **The lesson
never left the file.**

**3. Fixing that naively would have caused a worse bug.** Refresh tokens rotate.
Six modules renew from a *cached* session; once anything renews on a timer, all
six hold a consumed token, and three of them drop the session on any failure —
a silent sign-out mid-edit. `credential_reference.js` already carried the fix
*and the reason*; nine files did not.
→ [[methodology-a-rotating-credential-cannot-be-cached]]

**4. Memory was a different defect.** `cpl_memory`'s RLS is
`is_allowed_reviewer() OR team_pass_ok()`, but the tab took its whole notion of
"signed in" from `team_phrase.js` — whose `session()` is a *phrase* pseudo-session
that knows nothing about the magic link — and hardcoded the anon bearer. A
magic-link reviewer matched neither arm and saw *"No entries visible"* over 330
intact rows. A permission that exists in the database and cannot be reached from
the page.

**5. `sessionStorage` is per browser tab, by definition.** Sam found this
himself. The magic link opens in a new browser tab; every tab already open stays
signed out. `cpl_sb_return_tab` restores the right *in-app* tab and is powerless
here. No routing fix exists — the storage has to be shared.

**6. A privacy guard had silently stopped guarding.** The smoke test's
external-context assertion checked that Sierra's answer did not contain
"romero". Mesa's coordinator changed, so that assertion could no longer fail —
while still printing `[assert ok]`.
→ [[methodology-an-assertion-pinned-to-a-mutable-value-stops-being-a-guard]]

### Sam's decisions this run

- **"That's fine to leave"** on the Memory tab once the team phrase opened it
  (#1204 built and held on his word, not merged).
- **"I want to keep things stupid simple but not always possible"** — the frame
  for the auth advice: keep the team phrase as the front door, add *roles* only
  where attribution is needed, and do not build a permissions matrix on spec.
- **"If I had user auths, I'd need to be able to assign them to groups"** — his
  own read that groups are where it gets deep. Recommendation given: roles
  (flat, ~5) not groups (arbitrary sets).
- **"Let's fix the session storage per browser issue"** — chose the cross-tab
  fix over the other open options.
- On the audience picker: **"I wasn't trying to hide it… just noting that they
  need a team phrase to curate"** — the control is a filter, not an annotation,
  and the copy now says so unconditionally.

### (b) Current state

| PR | What | State |
|---|---|---|
| #1203 | Admin save: uniform row shape + real error text | merged |
| #1205 | `cpl_session.js` keeper + six cached refreshers fixed | merged |
| #1206 | Smoke privacy guard re-anchored so it can fail again | merged |
| #1207 | Session shared across browser tabs, sign-out propagates | open |
| #1204 | Memory reads the reviewer sign-in + names the credential | open, held by Sam |

### (c) Strategic roadmap

- The keeper is now the single place session policy lives. Anything further
  (shorter cap, idle timeout, a real sign-out button, roles) changes one file.
- The thirteen shape-only readers were deliberately **not** rewritten. They do
  not need to be: the key they read is now kept fresh underneath them. Rewriting
  them is optional cleanup, not a fix.
- User-level auth is **not** the next step. The magic link already *is* user
  identity; what is missing is roles, and the forcing function is attribution
  (who decided), not access.

### (d) Next concrete step

**Nobody has exercised any of this in a real browser** — the sandbox cannot
reach the site. One round trip proves the whole run: sign in by magic link,
confirm the *other* already-open tab becomes signed in, drag something on Admin
and Save, then sign out and confirm both tabs go signed-out and stay that way.

### Things that worked

- **Reproducing against real constraints without touching production**: a temp
  table cloned from `cobi_nav` (`including all`) proved the 400 in one query.
- **Reading detector output instead of trusting counts.** Every detector written
  this run was wrong on first writing — the module classifier (`s.exp` matched
  "row**s exp**and"), the cached-session guard twice (its own author's `read()`,
  then a comment longer than the scan window). All three were caught by printing
  what they found.
- **Auditing what a new component makes *frequent*,** not just whether it is
  correct. The keeper is correct; the collision it would have promoted from rare
  to routine is what nearly shipped a sign-out bug.

---

## 2026-08-25 — SkyFixer S193: the return tab was per-browser-tab too

Sam: *"when log in to curate is done and magic link is clicked from email, it
takes me to the CCR screen and should take me to the screen I was on."*

⭐ **The same root cause as this whole file, one key over.** Nine modules stashed
the destination in `sessionStorage.cpl_sb_return_tab`. `sessionStorage` is scoped
to one **browser tab**; the magic link opens a **new** one. So the note written
where you clicked "sign in" was invisible where it is read, `consumeAuthHash`
fell back to its default, and **every sign-in from anywhere landed on the Common
Course Reference**.

⚠️ **`cpl_session.js`'s own header cited `cpl_sb_return_tab` as the thing that
"restores the right IN-APP tab"** — while it could not, for precisely the reason
that file exists. A file can document a mechanism it has already disproved.

The keeper owns it now: `localStorage` canonical, `sessionStorage` kept for the
same-tab flow, and two properties the session itself does not have —

- **it expires** (30 min). A session should outlive a trip to an inbox; a
  "come back to Memory" note should not still be lying around tomorrow, quietly
  steering an unrelated sign-in.
- **it is taken, not read.** One sign-in, one redirect.

⚠️ **All nine callers route through it.** Fixing one and leaving eight is the
failure this repo already paid for once (`raci.js` carried the rotating-token
lesson in a comment for months while thirteen modules kept the bug).

⚠️ **A single-window test fixture cannot see this defect at all.** The guard runs
**two** JSDOM windows sharing one `localStorage` and holding separate
`sessionStorage`s — which is what "the link opened a new browser tab" means.
Verify with the instrument that can see the defect.
