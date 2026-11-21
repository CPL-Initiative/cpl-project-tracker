---
title: "Session 698 handoff (from the page-only session of 2026-11-21: the Exhibits Review card and the Commons page clarity PRs)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** A CPL Queue routine firing follows `docs/session_697_handoff.md`, never this file. This handoff is for
Sam's next plain session. Its build queue is still the one in `docs/session_696_handoff.md` (slimming items 1 to 3,
the M-ID work, Library part 4); this file adds the two page PRs that wait on COBIx.

# You are SkyAuklet (Session 698)

From Sam's page-only session of 2026-11-21, about 14:25Z to 15:45Z, on Fable 5.2, beside the live CPL Queue run
(S697, #3639). It carried no moniker. A **light checkpoint**: two lanes took a LIVE paragraph inside their own PRs,
no re-mint and no data receipt. Skipped: step 0's lint artifacts and step 12 (both write under `kb/`, which Sam
reserved for the Queue session), 2 and 3 (no KB or README surface), 5 (no new KB note), 7 (the pipeline did not
move), 9 (its own queue item). The memory rows are applied; the vault note is written.

## Sam's rules for that session (2026-11-21, in session)

- *"never push to main or merge; open PRs ready for COBIx review"*; no touch of `kb/`, `kb/migrations/.apply`,
  workers, data files or #3639 (`r-page-session-prs-ready-for-cobix-sam-2026-11-21`). **The session merged nothing.**
- *"Plain noun labels only; no labels starting with What/When/How/Why; no coder words ("fold", "queue", "Z" times).
  Everything passes the accessibility checks (WCAG 2.1 AA)."* (`r-plain-noun-labels-no-coder-words-sam-2026-11-21`)

## What is open, both ready for COBIx review, neither merged

| PR | What | State at 15:40Z |
|---|---|---|
| #3643 `claude/serene-cerf-17qjsj` | The Exhibits Review card: chips, Course details and Exhibits together, a title's details in place, full width, the wrapping title box, Side by side open, Possible duplicate | `test` green on `1bc52784`, no conflict, no review yet |
| #3646 `claude/serene-cerf-17qjsj-commons` | The Commons front page: ranked Needs you, Handed over chips, two Phase 1 ETAs, the Plan card, "...(more)", the line chart, the College Data Collection card, Back to CPL Commons, the collapse control and three update fixes on College Data Collection | six suites green on `60439ba6`; `lints` still running |
| this checkpoint's PR | docs only | ready for review |

Rulings: `r-exhibits-review-card-sam-2026-11-21`, `r-commons-page-clarity-sam-2026-11-21`,
`r-commons-cdc-card-sam-2026-11-21`, `r-back-to-commons-cdc-collapse-sam-2026-11-21`. Decisions:
`d-possible-duplicate-flag-only-2026-11-21`, `d-exhibits-review-card-build-2026-11-21`. Finding:
`f-commons-finished-items-stayed-listed-2026-11-21`.

## What Sam has not yet answered (told in chat, no sheet card filed)

1. **118 or 73.** The College Data Collection card says "out of 118", the collected-catalog file's own count. Sam
   wrote 73. If 73 is another set, name its source and change the card's denominator.
2. **TBA figures on that card:** the Credentials line and the course-outline ETA. No committed file holds a
   per-college credential count or a dated outline pace.
3. **The Plan card** takes its phases from `library/college-collections-plan/` (v2, Nov 11), which does not split
   curated and connected work by phase.

## Next, in order

1. Read both PRs' threads to the last page and act on COBIx's review. Whether this session's no-merge rule carries
   to the next session is Sam's to say; ask once at the start.
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

The session keeps its watches on #3643 and #3646 and one check-in (15:46Z) until Sam ends it; it holds no artifact watch.


Spend: left off this handoff. A `Spend:` line makes the daily spend file stale, and rebuilding that file writes under `kb/`, which this session may not touch; the next checkpoint with `kb/` in reach adds it (not available; 14:25Z to 15:45Z).

The work was page building (two surfaces) by one conductor and one worker.

Opening line: *Greetings, you are SkyAuklet (Session 698), see the page session's handoff — `docs/session_698_handoff.md` — let's keep rolling with our queue.*
