---
title: "Session 698 handoff (from the page-only session of 2026-11-21: the Exhibits Review card and the Commons page clarity PRs)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_701_handoff.md
---

**Routing.** A CPL Queue routine firing follows `docs/session_697_handoff.md`, never this file. This handoff is for
Sam's next plain session. Its build queue is still the one in `docs/session_696_handoff.md` (slimming items 1 to 3,
the M-ID work, Library part 4); this file adds the follow-ups to the two page PRs it merged.

# You are SkyAuklet (Session 698)

From Sam's page-only session of 2026-11-21, about 14:25Z to 15:45Z, on Fable 5.2, beside the live CPL Queue run
(S697, #3639). It carried no moniker. A **light checkpoint**: two lanes took a LIVE paragraph inside their own PRs,
no re-mint and no data receipt. Skipped: step 0's lint artifacts and step 12 (both write under `kb/`, which Sam
reserved for the Queue session), 2 and 3 (no KB or README surface), 5 (no new KB note), 7 (the pipeline did not
move), 9 (its own queue item). The memory rows are applied; the vault note is written.

## Sam's rules for that session (2026-11-21, in session)

- *"never push to main or merge; open PRs ready for COBIx review"*; no touch of `kb/`, `kb/migrations/.apply`,
  workers, data files or #3639 (`r-page-session-prs-ready-for-cobix-sam-2026-11-21`). The rule held until Sam wrote "Merge them all" at about 18:00Z; the session then merged its three PRs.
- *"Plain noun labels only; no labels starting with What/When/How/Why; no coder words ("fold", "queue", "Z" times).
  Everything passes the accessibility checks (WCAG 2.1 AA)."* (`r-plain-noun-labels-no-coder-words-sam-2026-11-21`)

## What shipped (Sam, in session, about 18:00Z: "Merge them all")

| PR | What | State |
|---|---|---|
| #3643 (`a52c34e5`) | The Exhibits Review card: chips, Course details and Exhibits together, a title's details in place, full width, the wrapping title box, Side by side open, Possible duplicate | merged |
| #3646 `claude/serene-cerf-17qjsj-commons` | The Commons front page and College Data Collection: Sam's eleven asks | merging once `test` passes on `2a163a64` (the merge with `main` and one label fix) |
| #3648 | this checkpoint, docs only | merges last |

Rulings: `r-exhibits-review-card-sam-2026-11-21`, `r-commons-page-clarity-sam-2026-11-21`,
`r-commons-cdc-card-sam-2026-11-21`, `r-back-to-commons-cdc-collapse-sam-2026-11-21`. Decisions:
`d-possible-duplicate-flag-only-2026-11-21`, `d-exhibits-review-card-build-2026-11-21`. Finding:
`f-commons-finished-items-stayed-listed-2026-11-21`.

**COBIx reviews no longer gate a merge (Sam, 2026-11-21, 8:19 AM PT, relayed by COBIx on #3648; Sam then merged on
it in session; `r-cobix-review-never-gates-merge-sam-2026-11-21`).** They happen only when Sam asks for one. Once a
PR's checks pass, do not wait on one; a COBIx comment that does come in is a follow-up for the next session.

## COBIx's follow-ups (16:21Z, none blocking), for one small PR

- **Exhibits (#3643):** a failed read of the details' files is never retried (`cd.ready` is set either way);
  the duplicate flag pairs any CDF title with any CAL FIRE title; the chips are focusable spans with no role (give
  them `role="note"`); about 40 strings elsewhere on the tab still say *fold*.
- **Commons (#3646):** label the count "of 118 colleges and campuses" (Sam's 73 is districts, 72 plus Calbright);
  "Stuck: waiting on a person" also counts colleges waiting on a reader fix; Term Reports Needed clears on any three
  hand-overs, without matching terms; a catalog link opens without checking its address. The Plan card's "What COBI
  collects itself" is fixed (now "COBI's own collection").

## What Sam has not yet answered (told in chat, no sheet card filed)

1. **118 or 73: answered by COBIx.** 118 is colleges and campuses; 73 is districts. The label fix is in the follow-ups.
2. **TBA figures on that card:** the Credentials line and the course-outline ETA. No committed file holds a
   per-college credential count or a dated outline pace.
3. **The Plan card** takes its phases from `library/college-collections-plan/` (v2, Nov 11), which does not split
   curated and connected work by phase.

## Next, in order

1. The follow-up PR above. This session's no-merge rule ended with Sam's "Merge them all"; the standing auto-merge rule applies again.
2. **Not rerun:** #3646's whole suite after its last fix and merge with `main` (CI covers it), and the whole
   `npm run a11y` sweep for #3643 (axe ran on the card at five width and theme pairs, no violations).
3. **Follow-ups named in the lanes:** about 40 strings elsewhere on the Exhibits tab still say *fold*, and its Queue
   view keeps its name; `KNOWN_ALIASES` in `exhibits.js` holds one agency (CDF, CAL FIRE).
4. Then `docs/session_696_handoff.md`'s queue.

## Pitfalls from this run

- **Opening a fold by default can loop a redraw.** Side by side opened on every draw asked for its file again each
  time the read failed. A default-open section needs its failed read remembered (#3643).
- **The Supabase project is `hvuwhnbuahrtptokpqfh`.** A guessed project id answers "You do not have permission",
  which reads like a denial and is a wrong address.
- **`python3 kb/_docs_audit.py` writes under `kb/docs_audit/`**; in a session barred from `kb/`, restore those files.
- **A new test prints `N/M checks passed`** or the floor ledger cannot count it.

The session drops its PR watches and its check-in once the three PRs are merged; it holds no artifact watch.


Spend: left off this handoff. A `Spend:` line makes the daily spend file stale, and rebuilding that file writes under `kb/`, which this session may not touch; the next checkpoint with `kb/` in reach adds it (not available; 14:25Z to 15:45Z).

The work was page building (two surfaces) by one conductor and one worker.

Opening line: *Greetings, you are SkyAuklet (Session 698), see the page session's handoff — `docs/session_698_handoff.md` — let's keep rolling with our queue.*
