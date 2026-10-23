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

## S458 SkyLarkspur (2026-10-23): the team phrase lists publicly; a piece records who it is made for

- **The gate moved in one re-runnable file.** `cpl_library_set_public()` reads `team_pass_ok()` or
  `is_allowed_reviewer()`; anon holds EXECUTE because the gate is inside the function; `listed_by` falls back to
  *team phrase*. `supabase-migrate.yml` applied `kb/supabase_cpl_library_public.sql` from the branch push (run
  40011678930) and the read-back checked the grants, the function body, the trigger's message and the ledger row.
  The tab's side (`library.js` sends the phrase when there is no token) reaches COBI only with the merge, so the
  database accepted the phrase forty minutes before the page stopped asking for a sign-in: say which half is live.
- **A visual made for an entity is a Library concern.** The Report tabs write Word documents; the Letters register
  holds sends; the Library holds the record, the brief, the listing and the filing. Sam's ask (2026-10-23) became six
  cards on Open Asks Sheet 120 and a mock-up (https://claude.ai/artifact/LRFiSDUY4bGTokJdaKgHUJ): `for_kind` and
  `for_name` on the record, filters on both libraries, *Make a visual* beside *Start a piece*. Measured first: 40 live
  records, 24 college pieces (12 colleges, 11 listed), 2 agency pieces, none for a vendor; the name lived in the title.
- **The agency precedent has no builder.** The DSP page was hand-written; its shape (the meeting, the training facts,
  colleges tiered by fit, what to confirm, next steps, sources) is the template an agency page needs. The sandbox
  reaches neither edd.ca.gov nor Canvas Commons: an agency's source text comes from Sam's upload.
- **A compound command that pushes a branch carrying a data delete is refused whole** by the session's permission
  check; the same push alone, or a push whose `.apply` points at an additive schema file, went through. One step per
  command when a push carries a write.
