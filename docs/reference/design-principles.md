---
title: Design principles — every COBI screen (v3)
date: 2026-11-11
updated: 2026-11-14
tags: [reference, design, ui, presentation-rules, first-light]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
---

# Design principles: every COBI screen (v3)

Landed from issue #3107 (COBIx, Sam and Malone). Every UI build reads this page before it builds or mocks a view.

**Sam's direction (2026-11-11, 6:00 AM PT, verbatim, relayed by COBIx on #3107):** "Yes, make a new mash up of mine
and malone's rules, preserving my ruling on keeping badges generally out and my strategy to always build tools that can
scale--steering away from one-off tabs like "Funding Follow-up Dashboard" in preference for something like
"Communications Hub"...but balancing the long term with short term clarity and allowing for flexibility...can you make
sense of all that and recraft?"

**Sam's ruling on v3 (2026-11-11, 6:07 AM PT, verbatim, relayed by COBIx on #3107):** "looks good. no need for malone's
preview of rename. on the badges, ive had specific previous rules on not using cheesy emojis or loud chips or glyphs
and a preference for 1 or 2 tone muted colors on any glyphs and a preference for links instead of buttons--is that
preserved or modified? what the whole picture of our style? do we need a tab to display it and make adjustments from
one location we can all see and get used to?"

Rule 7 below answers his question: the look rules are preserved unchanged.

These rules apply to every COBI tab, public page, mock and artifact. They cover what a screen is for, what it shows
first, and what it asks the reader to do. Look and accessibility rules stay in CLAUDE.md "Presentation rules" and
`docs/kb-notes/reference-ui-design-system.md`.

Sources: Malone's walkthrough and changes to the funding dashboard (Nov 9–10, 2026), Sam's rulings on that work and
before it, and Sam's direction of Nov 11, 2026: build tools that scale, keep badges out, and balance the long term
against short-term clarity. Rule 7 restates Sam's standing look rules. v3 changes none of them.

## The rules

1. **Build tools that scale, and give today's job a view inside them.** Name a tool for what it can do (*Communications
   Hub*), not for one task (*Funding Follow-up Dashboard*). Today's job is a view or preset inside the tool, with a
   plain label: *Communications Hub · Funding follow-up*. The view label names the job and the people who do it. A new
   one-off starts as a view. It becomes its own tool only when it has its own users and its own jobs.
   *Source: Sam (Nov 2: "extend this to other activities, like onboarding colleges to MAP"; Nov 11). Malone's
   point about naming for who does the work lives in the view label (PR #3053).*

   **New tool or new view? Make it a view unless all three are true:**
   - Different people use it, not the same team doing another task.
   - Its records are different (not colleges, contacts and messages with a new filter or template).
   - It needs its own access rules or its own main action.

   If any answer is no, add a view or preset to an existing tool. Every view keeps its own address, so its link works
   on its own.

2. **Start with the job.** Before you build or mock a view, write one sentence: *"In one look, [who] can tell [what],
   and do [the one thing]."* Put it in the PR. Everything on the first screen serves that sentence or goes behind a
   fold. *Source: Malone's walkthrough found the screen unclear (#3010).*

3. **Show what needs the reader first.** Split lists by who acts next: *Needs you* above *Waiting on [them]*, with the
   most pressing first. A group with nothing in it shows no heading. Keep one short summary: a few figures, each number
   above its label and each opening its own list, with the deadline set apart. Don't show the same counts twice.
   Filters are visible words with counts. *Source: Malone's changes 1 and 2 (PR #3049); Sam: a figure opens what it
   counts (Nov 5); the duplicate cards removed (#3010).*

4. **Every row says its next step.** Name the email or the date: *"Send the request for the participation
   confirmation."* or *"Nothing to send today. Follow up Nov 16."* Never point the reader to another list. *Source:
   Malone's change 2 (PR #3049).*

5. **Give one lead action and at most 3 visible controls.** Each state gets a reason, one sentence of why, and one lead
   action. At most 3 controls show, counting the lead. Everything else goes under one quiet *More*. Every control is an
   underlined word, the lead included. The lead goes first and may be a step larger (`.word.lead`), but it is never a
   filled button. *Source: Malone's change 4 (PR #3050); Sam: controls are underlined words (Oct 9; see rule 7); one
   lead action at sign-in (PR #3092); #3098 rule 1.*

6. **Use plain words and remove steps.** Use the words a college person would use: no *This visit*, *Action center*,
   *File it* or *Edit the record*. If a label needs a tooltip to make sense, rename it. Remove a step rather than
   explain it. *Source: Sam's plain-words rule (Aug 29) and "save the step" (#3010); Malone renamed *This visit* to
   *Recommended action* (PR #3050); #3098 rule 3.*

7. **Keep it calm: no emoji, no loud chips, few badges, muted color, words for controls.** These are Sam's standing
   look rules, kept as they are. The detail is in `docs/kb-notes/reference-ui-design-system.md` and CLAUDE.md
   "Presentation rules."
   - **No emoji. A glyph only when it earns its place, and then muted.** Sam, 2026-08-14: *"I'm not a fan of cheesy
     glyphs. If we use them they should be muted, simple, a bit ghosted based on CO blue and white."* Sam, 2026-08-29:
     *"I think they are mostly noise… I prefer to eliminate every visual that doesn't prove its worth."* Sam,
     2026-09-09: *"it would be good to remove all emoji glyphs and if any are crucial replace with a muted glyph using
     white and CO blue as default. If color is needed to clarify, keep it muted and aligned with the CO palette."* The
     26 typographic marks he kept stay (2026-09-09: *"Keep all 26 glyphs as is for now."*).
   - **One or two muted tones. Nothing loud.** Green and red only for a state the reader must act on, and muted even
     then (CLAUDE.md, the plain-words rule). Chips stay glass-quiet (First Light v1.6; Sam: *"Love the glass view.
     Let's run with that!"*). Sam, 2026-09-02: *"eliminating any visual noise possible. I want folks to feel calm when
     they open this model."*
   - **Links, not buttons.** Sam, 2026-10-09: *"our buttons could be simpler and less obtrusive. What if we show them
     without boxes and just underlined text link a link?"*, then *"Yes, make it a First Light rule."* Every control is
     an underlined word, with no box and no fill.
   - **Badges stay out unless they change what the reader does next.** The row's next-step line usually says enough.
     When a badge stays, it sits on one line (the name wraps instead) and explains itself on hover and keyboard focus,
     in text taken from the rule that sets it. *Sam's ruling (2026-08-29, restated 2026-11-11) supersedes Malone's
     "keep every badge." The one-line badge is Malone's (vault PR #742); the hover text is Sam's ask (#3075).*

8. **Open the work and show results first.** If the reader came to review, the review is already open: no click to
   start it and no scroll gate. Show the result before the editor, such as an email preview (To, Subject, Message)
   with *Edit email*. A decision button says what it does: *"Accept marks it met and opens the acceptance email;
   nothing is sent until you send it."* *Source: Sam: "why do we click on Review when that's what we're there to do?"
   (PRs #3061, #3063); Malone's change 4 (PR #3050); PR #3052.*

9. **Keep context beside the work.** People, pages and related records open in a side panel under the record, or in a
   drawer with *Open the full page*. Don't use new tabs or pop-ups. If a site refuses to show in the panel, say so and
   keep one fallback link. A redraw keeps whatever the reader had open. *Source: Sam (#2978, PRs #3066, #3067; drawer:
   "love the simple side bar with link to go full monty"); kb-note
   `methodology-a-repaint-must-keep-what-the-reader-opened`.*

10. **Make one change per PR and check the mock against the job.** Each UI change is its own PR, so it can be reverted
    alone. Check a mock against rule 2 instead of copying it line for line. *Source: Malone (handoff 624); the
    funding mock's Review button carried into the live tab (session note, Nov 10).*

## Checks before you ship (put the results in the PR)

The #3098 simplification scorecard is the standard for every UI PR.

- **Tool or view:** answer the test in rule 1 in one line. A new tab needs all three answers to be yes.
- **Job sentence:** it's written in the PR, and the first screen matches it.
- **Control count:** a test for each state checks that at most 3 controls show, with 1 lead. Post the counts for each
  state before and after the change.
- **Nothing lost:** every earlier ability is still reachable in 2 clicks or fewer, and the existing tests pass (#3098
  rule 5).
- **Badges and look:** list each badge kind and the next step it changes. Each one has hover and focus text from its
  rule, and a badge with no next step comes out. `python3 kb/_glyph_sweep.py --check` passes, there are no filled or
  boxed buttons, and color is muted tokens only (`npm run a11y` for contrast).
- **Plain words:** the shown labels pass `kb/ui_plain_words.json`. Starter list: This visit, Action center, File it,
  Edit the record, Start something new from it, Submit, Process, Manage, Item, Entity, Click here, any acronym that
  isn't spelled out, and role names the users don't hold.
- **First screen:** at 1280 and 390 wide, with no scrolling and no clicks, the heading, the top *Needs you* row (or
  its count) and the lead action are all in view. Use the a11y harness's seeded first screen.
- **Stays on the page:** no `target="_blank"` except a labeled fallback, and no `<dialog>` used for context.

## Proposal, not yet done: the funding dashboard as a hub view

Sam has given the direction, and Sky stages it and records it under decide-and-record (a `cpl_memory` decision row
and a DECIDED line in the `csm-workspace` lane):

- Shown name: *Communications Hub*. The current page becomes its first view: *Communications Hub · Funding follow-up*.
- Keep *Funding Follow-up Dashboard* and *CSM Workspace* as aliases and search terms in the side menu and site search.
  The address `#csm-workspace` and its views stay the same, so saved links keep working.
- The activity log, templates and follow-up dates already belong to an activity (Sam, Nov 2), so the next activity
  (MAP onboarding, activity cards) is a new view, not a new tab.
- Nothing is renamed until Sky stages the change in its own revertible PR.
