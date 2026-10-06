---
title: The Library and its filer — lessons
date: 2026-10-06
tags: [lessons, library, drive, filer, oauth]
artifacts:
  - scripts/library_file.py
  - docs/reference/library_filer.md
  - privacy.html
  - kb/receipts/library_filed/
related:
  - "[[docs/reference/lanes/library]]"
  - "[[docs/reference/library_filer]]"
---

# The Library and its filer — lessons

## 2026-10-06 — S338: the first real Google sign-in, and the first filing by hand

Sam set up the filer's sign-in with this session walking him through it. The guide was wrong or silent at
five points; #1888 fixed it. What each cost:

- **Publish stays grey until Branding is complete.** Saving app name, support email and developer contact
  is not enough: Google wants the home page, a privacy policy link and the authorized domain. The tracker
  had no privacy page, so #1887 added `privacy.html`. Publish before minting the token: a token from
  *Testing* dies in 7 days.
- **Environment variables, not *Add credential*.** The cloud environment's *Add credential* form attaches a
  header to web requests; the filer reads three variables and exchanges the refresh token itself.
- **The first save held the template's placeholders.** `invalid_client` from `--check`. The session found it
  without printing a value: lengths 11, 15 and 15 are the lengths of `<Client ID>`, `<Client secret>` and
  `<refresh token>`. Check shape (lengths, `.apps.googleusercontent.com`, `GOCSPX-`, `1//`), never value.
- **The Playground hides its own success.** A good exchange jumps to Step 3; the token waits in Step 2. A
  second press on the same code, or a code issued before *Use your own OAuth credentials* was ticked,
  returns `invalid_grant`. The unverified-app warning comes as a full page (Advanced) or as a yellow box on
  the consent screen (Continue).
- **A session's environment is read once.** This session restarted at 18:31Z with the placeholders and
  never saw the corrected values. Say so early, and run the first `--check` in a new session.

**The Summit deck was filed by hand.** Sam dropped it in; the Drive connector found it by title and
confirmed the size (2,039,321) matched the build. Two traps: Sam's "moved it to Drafts" first meant the
*film*, not the deck (`parentId` told the truth; ask before calling it lag), and **`apply_migration` timed
out four times without writing** while the `execute_sql` guard refused the `UPDATE`. The guard is right to;
the fallback was Sam running the receipt in the Supabase SQL editor, then a read-back. Keep the receipt out
of the repo until it is applied, so a committed receipt always means a write that happened.

## S339 SkyReel, 2026-10-06

- **The filer's sign-in values were saved truncated.** `--check` answers `invalid_client`; the three values measure
  43 / 19 / 14 characters where real ones run about 72 / 35 / 100+, though each passes its shape check (suffix,
  `GOCSPX-`, `1//`). A shape check is not a length check: measure both, print neither.
- **Both Summit v2 cuts went to Sam in chat for Drafts** (10,048,927 and 17,230,551 bytes), the documented fallback
  while the filer cannot sign in. Their Library record waits on Sam confirming the files are in Drafts.

