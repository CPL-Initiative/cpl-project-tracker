---
title: "Reviewer session lifetime & scope — lane state"
created: 2026-08-28
updated: 2026-08-28
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

✅ **KEEPER LIVE (SkyKey, #1205); CROSS-TAB OPEN (#1207).** ⭐ **ONE DEAD TOKEN EXPLAINED THREE REPORTS IN ONE EVENING** — Admin *"save 400"*, Sierra *"says I'm not signed in"*, CR Reference *"could not read"*, all "fixed" by re-signing in, which is what hid the cause. A Supabase access token lives **~1h** and **13 of 26 modules check only the token's SHAPE**; all three of those tabs are in that half. `raci.js` has said so in a comment since June — **a lesson in one file is not a lesson in the repo**. Fixed with a **KEEPER, not a 14th copy** (`cpl_session.js` renews `cpl_sb` underneath every reader, so the 13 benefit **untouched**). ⚠️ **SHIPPING IT ALONE WOULD HAVE BEEN WORSE THAN THE BUG** — refresh tokens ROTATE, six modules renew from a **cached** session, and three of those **drop the session on any failure** = silent sign-out mid-edit; all six now re-read, with a static guard. ⚠️ **Only a definitive 400/401 may end a session** (raci dropped on ANY rejection, so offline cost you your work), and **reading must not delete**. ⭐ **`sessionStorage` IS PER BROWSER TAB** — Sam diagnosed it: the magic link opens a NEW tab, the one you were working in stays signed out, and `cpl_sb_return_tab` is powerless. #1207 makes `localStorage` canonical + mirrors it per tab; **a per-tab MARK distinguishes "fresh tab" from "signed out"**, else the sign-out button does nothing. Cap **12h** (`MAX_SHARED_AGE_MS`). ⭐ **AND THE MAGIC LINK CAME BACK TO THE WRONG SCREEN, FOR EVERYONE** (SkyFixer, #1331). **Nine modules** stashed the return tab in `sessionStorage.cpl_sb_return_tab` — per browser tab — and the link opens a NEW tab, so the note was invisible where it is read and every sign-in from anywhere landed on the CCR. This file's own header already cited `cpl_sb_return_tab` as what "restores the right IN-APP tab" **while it could not, for exactly the reason the keeper exists**. The keeper owns it now: `localStorage` canonical, `sessionStorage` for the same-tab flow, **expires after 30 min** so an overnight note cannot hijack an unrelated sign-in, and **TAKEN not read** so one sign-in means one redirect. All nine callers route through it. ⚠️ **A single-window test fixture cannot see this defect** — the guard runs two windows sharing one `localStorage` with separate `sessionStorage`s. **NEXT: one real-browser round trip proves the lot** — sign in → the OTHER open tab signs in → drag+Save on Admin → sign out → both stay out. Story + Sam's rulings: [`docs/session_credentials_lessons.md`](docs/session_credentials_lessons.md); durable [`methodology-a-rotating-credential-cannot-be-cached`](docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached.md).

**The magic link lands in the keeper (SkyJujube, 2026-11-04).** `cpl_session.js` `consumeAuthHash()` reads the link's fragment as the file loads, ahead of `tabs.js`, writes the session to both stores and puts the return address in the bar. It lived in `unified_courses.js`, the hidden Common Course Reference tab due to retire into COCI Lookup's Courses List, so every COBI sign-in depended on that tab. With nothing stashed the link lands home. **Back to the view, not just the tab** (asked in session, 2026-11-04: *"make sure that the sign in link from the emails takes the user back to the view they logged in from"*): the stash keeps the whole address when it sits inside the tab, and the six Commons tabs (Exhibits, CR Reference, Subjects, CPL Pathways' Program Requirements, Credential Reference, COCI Lookup) tell the keeper their view through `CPL_SESSION.viewAddress`, as the address their own `routeFromHash` opens. A typed search or an open side panel is not in an address and starts fresh. `workplan_goals.js` and `cpl_news.js` now stash through the keeper too. Guards: `tests/cpl_session_magic_link.test.js`, `tests/signin_returns_to_view.test.js`.
