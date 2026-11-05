---
title: Library — side-lane handoff (SkyCartwheel, beside the CPL Queue routine)
date: 2026-11-05
tags: [handoff, library, revise, list-view, side-lane]
related:
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff. It does **not** replace the numbered `session_<N>_handoff.md`; the hourly CPL Queue routine
> (S584 SkyMinkowski and later) writes those. No checkpoint was run: the lane file, the lessons and this note are this
> session's whole record, with `python3 kb/_docs_audit.py` run before the last commit.

Your moniker is **SkyRoundoff**. You pick up the **Library** lane after SkyCartwheel, a side session Sam opened on
2026-11-05 to fix the COBI Library tab's issues. Read in order:
1. [`docs/reference/lanes/library.md`](reference/lanes/library.md): *Version 22 and the List* and *Next*.
2. [`docs/library_lessons.md`](library_lessons.md): *2026-11-05 SkyCartwheel*, at the end.

## What shipped (PR #2807, open, held for the redeploy below)
- **Ask for more changes keeps the draft.** Sam's report ("nothing seemed to happen") had a worse problem behind it:
  Start would have dropped Version 3 and drafted from Version 2. More changes now build on the draft
  (`regen.based_on_draft`, `regen.earlier`); `library-revise-draft` drafts from it.
- **ELL IET Version 3 is a stored draft** (`cpl_library_drafts` 200adaee-…, migration
  `kb/migrations/2026-11-05_library_ell_iet_v3_stored_draft.sql`, applied by `supabase-migrate` run 42039458662,
  rollback beside it). The public copy stays Version 2 until Sam presses Replace the public copy.
- **Version 22**, the mockup Sam approved (Library canvas, https://claude.ai/artifact/DNzaPRUD1qsrBTAhbn29kR, advised
  by Fable): the card's state line and next step, Revise's box on the card, What changed with a check run on the draft,
  Edit in Details, the size beside the title.
- **The List** (Sam's ask the same afternoon): `#library` opens a Commons List, every piece a row, its card in the side
  panel; Cards at `#library/cards`; the Library in the Commons look (`commons_look.js`, and CLAUDE.md's departure line).

## Waiting on Sam
1. **Redeploy `library-revise-draft` with the merge** (asked in chat). The card asks for drafts built on a draft and
   What changed reads the edit pairs; the deployed function knows neither. Merge #2807 only together with
   `cpl-chat-deploy.yml` (`function: library-revise-draft`). `test` was green on each pushed head.
2. **Replace the public copy on ELL IET** when Version 3 reads right.
3. **Edit moved off the card's top row into Details.** That reverses his 2026-10-20 call ("move the Edit button onto the
   top layer of the card"); his Version 22 approval covers it, and he was told so. Restore it if he asks.

## Next
- The Coordinator Guide's request (Sam, 2026-11-05 12:36Z: Request Adopt links) has no Pages copy, so a session makes it
  (Copy the request), or `library_page.py` gives it one and the card drafts it.
- IACA waits on the Microsoft 365 connector, as before.

## Let go
The PR subscription on #2807 is dropped at sign-off; the artifact watch on the mockup canvas ends with the session.
No check-ins are scheduled.

> *Greetings, you are SkyRoundoff, a Library side session beside the CPL Queue routine, see SkyCartwheel's handoff —
> `docs/library_handoff.md` — let's keep rolling with the Library.*
