---
title: "Reviewer session lifetime & scope — lane state"
created: 2026-08-28
updated: 2026-11-10
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Reviewer session lifetime & scope

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** What "signed in" means, how long it lasts, and which browser tab has it.

## Status

**A sign-in lasts 30 days in the browser (SkyCartwheel, S622, 2026-11-09).** Sam, in session, on the funding door:
*"how long with the reviewers access persist? hopefully for some time"*; then *"30 days sounds good"* and *"everyone if
cobix is OK with it"*. `MAX_SHARED_AGE_MS` in `cpl_session.js` is 30 days for every sign-in, emailed link or door. The cap
is the browser's: it bounds how long a closed browser comes back signed in, counted from the first sign-in
(`shared_since`, carried across renewals). A tab left open renews itself and is not bounded by it; the auth server
time-boxes no session (measured that day: 0 of 132 time-boxed, 54 past 12 hours, the longest 20 days 20 hours). What a
sign-in opens is decided in the database at each call: `allowed_reviewers`, and for a door sign-in its `funding_access`
grant (30 days, revocable). Removing an address from the list closes its sign-in at once, whatever the browser holds.
Guards `tests/cpl_session.test.js` (the cap is 30 days; the next morning; day 29; day 31). 

**A sign-in whose funding access has ended says so (S623, 2026-11-09).** A door grant lasts 30 days and can be revoked;
the browser's sign-in outlives it on a tab left open, and the workspace read as signed in with nothing opening. The CSM
Workspace asks `is_funding_reviewer()` for the session as it stands, when it loads and every ten minutes. On `false` it
draws *Your funding access has ended* in place of Access requests, names the address signed in, and offers *Ask an
approver*, which sends the door's own request for that address (`CPL_REVIEWER_SIGNIN._askAccess`); while the note
shows, the check runs every half minute, so an approval clears it. The door's later words (declined, lapsed, no
approval yet) reach the note through the `cpl-funding-door-said` event `reviewer_signin.js` sends, and the button stays. A check that fails or does not answer leaves the
screen as it was. No database change. Guards `tests/csm_workspace.test.js` 13x-a to 13x-g. The earliest real lapse is
2026-12-09; a revoked grant shows it sooner. **The funding tab says it too (S624, 2026-11-10).** For a door sign-in (a closed model), `cpl_funding.js` asks
`rpc/is_funding_reviewer` when the reviewer list answers no, every ten minutes after, and every half minute while the
note shows; a sign-in on the list is never asked, since the function is true for it by definition. On a no, the bar
reads *Your funding access has ended* with *Ask an approver* (the door's own request, `_askAccess`), and Accept, Deny,
the CO Monitor's note, Nudge and every model control leave (`stripEndedAffordances`); what only reads stays. The door's
later words reach the note, and an approval brings the review back without a reload. Guards
`tests/cpl_funding_access_ended.test.js` (21).

**A surface that draws a sign-in once must follow the keeper's renewal (SkyBeacon, 2026-11-06, #2857).** Sam: *"we tried
to fix the lapsed token thing yesterday must not have worked for all surfaces"*. The keeper (`cpl_session.js`) renews a
token every minute's tick and on focus or a return to the tab, then announces `cpl-session-changed`. A tab that decides
"signed in?" with a strict `isFresh` at draw time, in the seconds before a renewal lands, stays signed out until a reload
unless it redraws on that event. CPL Pathways, Program Requirements and Subjects listened; the Commons, COCI Lookup
(Courses and Programs) and Funding did not, and now do. Draw gates take a renewable session (an email and either a fresh
token or a refresh token); a save still renews first and asks for a fresh one. The 2026-11-04 fix
(`tab-session-copy-goes-stale`) covered the Subjects List's writes only. A new tab that gates on a sign-in listens for
`cpl-session-changed`.


✅ **KEEPER LIVE (SkyKey, #1205); CROSS-TAB OPEN (#1207).** ⭐ **ONE DEAD TOKEN EXPLAINED THREE REPORTS IN ONE EVENING** — Admin *"save 400"*, Sierra *"says I'm not signed in"*, CR Reference *"could not read"*, all "fixed" by re-signing in, which is what hid the cause. A Supabase access token lives **~1h** and **13 of 26 modules check only the token's SHAPE**; all three of those tabs are in that half. `raci.js` has said so in a comment since June — **a lesson in one file is not a lesson in the repo**. Fixed with a **KEEPER, not a 14th copy** (`cpl_session.js` renews `cpl_sb` underneath every reader, so the 13 benefit **untouched**). ⚠️ **SHIPPING IT ALONE WOULD HAVE BEEN WORSE THAN THE BUG** — refresh tokens ROTATE, six modules renew from a **cached** session, and three of those **drop the session on any failure** = silent sign-out mid-edit; all six now re-read, with a static guard. ⚠️ **Only a definitive 400/401 may end a session** (raci dropped on ANY rejection, so offline cost you your work), and **reading must not delete**. ⭐ **`sessionStorage` IS PER BROWSER TAB** — Sam diagnosed it: the magic link opens a NEW tab, the one you were working in stays signed out, and `cpl_sb_return_tab` is powerless. #1207 makes `localStorage` canonical + mirrors it per tab; **a per-tab MARK distinguishes "fresh tab" from "signed out"**, else the sign-out button does nothing. Cap **30 days** (`MAX_SHARED_AGE_MS`). ⭐ **AND THE MAGIC LINK CAME BACK TO THE WRONG SCREEN, FOR EVERYONE** (SkyFixer, #1331). **Nine modules** stashed the return tab in `sessionStorage.cpl_sb_return_tab` — per browser tab — and the link opens a NEW tab, so the note was invisible where it is read and every sign-in from anywhere landed on the CCR. This file's own header already cited `cpl_sb_return_tab` as what "restores the right IN-APP tab" **while it could not, for exactly the reason the keeper exists**. The keeper owns it now: `localStorage` canonical, `sessionStorage` for the same-tab flow, **expires after 30 min** so an overnight note cannot hijack an unrelated sign-in, and **TAKEN not read** so one sign-in means one redirect. All nine callers route through it. ⚠️ **A single-window test fixture cannot see this defect** — the guard runs two windows sharing one `localStorage` with separate `sessionStorage`s. **NEXT: one real-browser round trip proves the lot** — sign in → the OTHER open tab signs in → drag+Save on Admin → sign out → both stay out. Story + Sam's rulings: [`docs/session_credentials_lessons.md`](docs/session_credentials_lessons.md); durable [`methodology-a-rotating-credential-cannot-be-cached`](docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached.md).

**The magic link lands in the keeper (SkyJujube, 2026-11-04).** `cpl_session.js` `consumeAuthHash()` reads the link's fragment as the file loads, ahead of `tabs.js`, writes the session to both stores and puts the return address in the bar. It lived in `unified_courses.js`, the hidden Common Course Reference tab due to retire into COCI Lookup's Courses List, so every COBI sign-in depended on that tab. With nothing stashed the link lands home. **Back to the view, not just the tab** (asked in session, 2026-11-04: *"make sure that the sign in link from the emails takes the user back to the view they logged in from"*): the stash keeps the whole address when it sits inside the tab, and the six Commons tabs (Exhibits, CR Reference, Subjects, CPL Pathways' Program Requirements, Credential Reference, COCI Lookup) tell the keeper their view through `CPL_SESSION.viewAddress`, as the address their own `routeFromHash` opens. A typed search or an open side panel is not in an address and starts fresh. `workplan_goals.js` and `cpl_news.js` now stash through the keeper too. Guards: `tests/cpl_session_magic_link.test.js`, `tests/signin_returns_to_view.test.js`.
