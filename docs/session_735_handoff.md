---
title: "Session 735 handoff (from SkyAlvord, S735, a side session of 2026-11-25: Adult Education CPL Starting Points)"
created: 2026-11-25
updated: 2026-11-25
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** SkyAlvord (S735) was a side session beside the main queue. **The main queue is handoff 734's, unchanged**
(`docs/session_734_handoff.md`, SkyGodwit's, for SkyWhimbrel); handoff 732 stays the CPL Queue routine's. A plain
session follows this file: it carries handoff 734's queue by reference and adds this side session's open items. Take the
next free session number when you start (736 or above) and say so in your handoff; the moniker stays yours.

# You are SkyBrant, Sam's next plain session

From SkyAlvord (S735), Sam in session, 2026-11-25, ahead of his meeting with the CDE Adult Education Office and LWDA.
A **checkpoint with two lanes moved** (`nc-learning-partners`, `library`); Rule 10 data writes were the Library
record's url update and the `cpl_memory` rows, each with a receipt. Skipped: step 2 (no KB structure change), step 3 (no
COBI tab changed; the page is a Library piece), step 5 (no note crossed the bar), step 7 (the pipeline did not move),
step 12 (this run touched none of the five common references, and the runway was short; the main queue's next
checkpoint refreshes `kb/status/*.json`). Step 10: four rows (`kb/receipts/cpl_memory_s735_rows_2026-11-25.sql`) plus
six from #3861. Step 11: CPLBrain `07-session-notes/2026-11-25-adult-ed-cpl-starting-points.md` (on CPLBrain#870).

## Open with the standing block

1. **COBIx:** Sam said no COBIx check-ins for now. Start `bash scripts/cobix_watch.sh [state dir]` only if he asks.
1a. **Clone light:** `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from `main`
   right before its merge, `test` green on the head (suite 1-6 and lints 1-4); no dependency-map rebuild inside a PR;
   no full rerun when the input fingerprints match. Never open a PR on a branch that holds another open PR's commits.
2a. **Sam's work order (2026-11-20):** collection first, data waves before fixes (`r-collection-first-sam-2026-11-20`);
   collection's fixes rank by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
2b. **Before a push, `bash scripts/check_generated.sh` must read all ok.**
3. **Merge order:** #3864 (oldest, `claude/elegant-mayer-xkernh`), then #3865 (`claude/library-pubtop-fix`), then this
   checkpoint's PR. Dependabot's #3383 stays.

## The main queue (handoff 734, by reference)

Work handoff 734's *Open work, in order* as written there: item 0 (the statewide-codes 0-100 branch; #3863 landed it),
1 (the 35 held and the 50 under 90), 1a (the S653 honors plan redraw), 1b (COBIx's CSV format), 2 (the rest of the
common-subjects NEXT), 3 (the Commons lane NEXT). Read its *Read in order* list before item 1. Its lanes by slug:
`common-subjects-reference` (items 1 to 2, from that lane's NEXT), `commons` (item 3); `program-requirements-harvest` is
the CPL Queue routine's (handoff 732); `implementation-funding` waits on the team (its NEXT: the public funding page's
phone layout for the institution table).

## This side session's open items (from the lane files' NEXT lines)

1. **#3864:** merge it (filter, search, 25 more credentials; the Library record's url on the Pages copy), then
   dispatch `library-publish.yml` so the piece gets its check row. **The public summary is NOT in place:**
   `cpl_library_guard_public` refused the summary migration (run 45719960204), it was withdrawn from #3864, and
   `public_summary` stays NULL. A session cannot write a public field; only the card's Publish to Public Library form
   (`cpl_library_set_public()`, team phrase or reviewer sign-in) can, and #3865 prefills it.
2. **#3865:** review and merge (the top Publish button's form in sight for an uncertified piece; a prefilled public
   summary; the sidebar at the list's height and type). Library lane NEXT.
3. **List Adult Education CPL Starting Points** on the Public Library once its check passes: a person signed in adds the public summary on the card (nc-learning-partners NEXT 1).
4. **Join the CAEP inventory into the Commons** as a learning partner offerings collection (NEXT 2).
5. **The thin credentials:** CNA, pharmacy technician and CDL have 1 to 3 colleges that could adopt (NEXT 3).
6. **CPLBrain#870** (draft, the page's source and the session note): merge it.
7. **MAP's sandbox org** CA MAP INITIATIVE COLLEGE (`CAMAP`) on MAPICI-CRES1-1-001 and MAPICI-DRES-1-001: Sam is telling
   Pedro; drop it from the page once MAP removes it.
8. The Library lane's standing NEXT (#3560 part 4, then part 3) and nc-learning-partners' item ① stand behind these.

## Sam's words and the decisions this run

- *"Get Credit instead of Give credit ... because you might send your alvord student to Pierce to get credit"*.
- *"format like the credential catalog style, which is the style we use for most public tools like this"*.
- `r-library-publish-prefills-public-summary-sam-2026-11-25`: *"can you have library auto add a summary I can edit so if
  I forget and click publish, we'll still have a summary?"*
- `r-library-sidebar-matches-list-sam-2026-11-25`: *"the libraries sidebar should be same height as the listview and
  use same font type and size. height should be optimized to window hight"*.
- `p-library-check-needs-pages-url-2026-11-25`: the check run plans only a record whose url is its own Pages copy.
- `f-library-publish-now-scope-2026-11-25`: Publish now shows only with an approved card-drafted revision.
- DECIDED: a program joins a credential by its own name or stated credential, never the CIP title; a Quick Adopt exhibit
  credits the credential itself (22 dropped); could adopt reads `statewide_prescriptive.js` (478 pairs to 261); college
  names through `kb/college_short_names.json`.

## What shipped

- **#3861** (merged): the Library record `adult-ed-cpl-starting-points`, six memory rows, the Pages copy at
  `library/adult-ed-cpl-starting-points/`. Private original https://claude.ai/artifact/8WrsvrvViQtxJWPfeVzdfP.
- **#3864** (open), **#3865** (draft), **CPLBrain#870** (draft): above.

## Read in order

1. `docs/reference/lanes/nc-learning-partners.md` and `docs/reference/lanes/library.md` (their S735 paragraphs).
2. `docs/noncredit_cpl_lessons.md` and `docs/library_lessons.md`, the S735 sections.
3. Then handoff 734's list for the main queue.

## Patterns that worked

- Join on the program's own words, and check every exhibit credits the credential it is offered for.
- Move a Library record's url to its Pages copy in the same PR that writes the copy.

## Safety

- Rule 10: a guarded update carries its rollback beside the receipt; memory rows are insert-only.
- A page under `library/` takes the vault's canonical header (`public-header/apply.py --tracker-logos ../../sierra/`).
- `CLAUDE.md` is over its budget (65 KB of 60 KB): do not add to it.

## Let go

At sign-off the conductor drops every PR subscription it holds (#3861, #3864, #3865), its check-ins and its artifact
watch on https://claude.ai/artifact/8WrsvrvViQtxJWPfeVzdfP; no COBIx watcher runs.

Spend: not available; 2026-11-25T21:13Z to 2026-11-25T23:19Z.

Opening line: *Greetings, you are SkyBrant (Session 736), see SkyAlvord's handoff — `docs/session_735_handoff.md` — let's keep rolling with our queue.*
