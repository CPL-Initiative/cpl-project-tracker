---
title: "Decision sheets — how to build one, and how to read the replies"
created: 2026-09-09
updated: 2026-09-21
tags: [reference, governance]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
---

# Decision sheets

*Relocated from `CLAUDE.md` at the 2026-09-09 checkpoint. The RULE — that
decisions arrive as one numbered sheet — is PUSH and stays in `CLAUDE.md`.
These are the MECHANICS, which you read once you already know you are
building one.*

When judgments only
  Sam can make accumulate — in one lane or across many — build ONE numbered
  sheet (a First Light artifact, committed to `docs/visuals/` with a dated
  slug, handed over as a Claude artifact LINK — Pages prunes `docs/`, so a
  github.io URL to it 404s): per item, what it is in plain words, the measured context (from the
  maps and feeds, never guessed), a PROPOSED disposition with its draft
  reason, and reply-by-number verdicts (`yes · edit: … · fold: … ·
  dismiss: …`). **Every sheet carries reply chips** (S230:
  `python3 kb/_decision_sheet_replies.py --inject <sheet.html>`) — a verdict,
  a *Follow up* toggle and a note per item, saved to the artifact's own store
  (publish with `capabilities: {db: {}}`) which the session reads FIRST with the
  Artifact tool's `read_db` (collection `replies`); off the artifact, *Copy
  replies* builds the line. The session executes the verdicts and commits the reasons.
  This replaces asks scattered through chat and feed items parked for weeks;
  the To-Do feed POINTS at the live sheet, never substitutes for it. Worked
  example: `docs/visuals/2026-08-30-governance-fifteen-tables.html` —
  fifteen rulings in one sitting. Human-facing version:
  `docs/working_with_claude_code.md` §11.

## Reading the replies (added 2026-09-09)

The session reads the verdicts FIRST, with the Artifact tool's `read_db` on
collection `replies` — one document per item, carrying `v` (the verdict chip),
`note` (free text), `fu` (the Follow up flag) and a timestamp.

⚠️ **An item with no reply document has NO verdict.** It is not a silent yes.
On 2026-09-09 a nine-item sheet came back with seven documents; items 1 and 2 —
the two largest sweeps on the sheet — had simply not been answered, and reading
"decisions done" as covering all nine would have swept 21 sites unauthorized.
Ask about the gaps in one line and execute the rest.

⚠️ **A verdict of `edit` carries the wording in `note` — use it verbatim.**
Two of that sheet's items came back as `edit` with Sam's own replacement
sentences; his words go in as written, not paraphrased into the proposal they
replaced.

⚠️ **Re-measure at execution; do not trust the sheet's own counts.** The same
sheet said 15 sites carried a banned word (14 by the time the item ran, because
an earlier item had absorbed one) and nine sections on a page that has seven.
Both numbers were right when written and stale when executed.

## Sam's rulings of 2026-09-20 (S280, from the Jev CR Reference sheet)

- **The recommendation line is the visual focal point.** *"I found myself
  saying yes to things that I later had to flip keep because I didn't pay
  attention to your rec."* The proposed disposition is a highlighted callout
  above the chips, never a `dd` in the same gray as the facts.
- **Chips name the outcome.** The 51-item sheet defined Yes as "take the
  proposal" and its review band proposed hold-separate, so a Yes there meant
  keep by the sheet and fold to Sam; items 26–41 all carried a Yes and then a
  flip to Keep. The first chip confirms the proposal and its label names the
  action (*Keep the fold* / *Pull out*); *Edit* sits behind *Other*.
- **Over-merge by default; faculty pull out.** *"It is better to over merge
  and give faculty the chance to pull them out rather than the other way
  around. It's easier to respond to a decision than to make one."* Every item
  proposes the fold with a one-line reason it might be wrong, in the
  variables' vocabulary (level, scope, units, lab against lecture,
  vendor-specific, a different course).
- **The framing sits in the header, in his words:** no student repeats a
  course they have already mastered, and credit mobility and articulation
  adoptability across the system.
- **Decision fatigue is the design constraint.** *"Making decisions is taxing
  and only so many can be made before people bail out."* The mechanics that
  operate as a game without reading as one: a running total in outcome terms
  (rows settled, colleges reached), the biggest win first, a stopping point
  every twenty items, sittings as plain text, completion states per
  discipline, the curator of record named in the reference, shared challenges
  rather than college rankings. Quality goes in the score: undo and reversal
  rates, never clicks. He agreed: *"Good pushback--agree!"*
- **The flow runs for every reference** (CER, CSR, CCRR, CCR), and a reference
  needs a decisions store with a reason column before its first sheet.

## The template, rebuilt to those rulings (2026-09-21, S281)

`kb/_decision_sheet_replies.py` now carries the shapes the rulings describe, so
a builder gets them by construction rather than by remembering. What to call:

- **`replies_block(..., rec=, other=, rows=, reach=)`.** `rec` is the proposed
  disposition and renders as a tinted callout with its own rule and label word,
  directly above the chips. ⚠️ **Nothing may sit between the proposal and the
  chips** — on the 51-item sheet *Why* sat in between and sixteen verdicts came
  back reversed. `other` holds the rarer verdicts behind an **Other** toggle.
  `rows` and `reach` are what settling the item is worth.
- **`CHIPS_FOLD`** — `Keep the fold` / `Pull out` / `Later`, with
  **`CHIPS_OTHER`** (`Edit`, `Dismiss`) behind Other. ⚠️ **The chip's stored
  VALUE names the outcome, never agreement**: `fold` means fold whatever was
  proposed, so a reply cannot be read one way by the sheet and another by Sam.
  A bare `Yes` is what produced the sixteen flips; `other_for(chips)` keeps a
  set from offering one twice.
- **`framing_block(text=, curator=, counts=)`** — the framing at the top of the
  sheet in Sam's words (`FRAMING` is the default), the sitting's worth in
  outcome terms, and the **curator of record**, so the judgment is attributed
  rather than laundered into an anonymous value.
- **`rest_stop(through)`** — a stopping point, inserted every `REST_EVERY` (20)
  item cards by the inject pass. ⚠️ It names the POSITION, never a total: what
  is settled changes as the reader works. The live total is the bar's.
- **`promote_rec(body)`** — for a sheet that already exists: moves its
  `dd.ask` to the foot of its `<dl>` and paints it as the callout. Idempotent
  by construction, because the promoted pair no longer carries `class="ask"`.

## Opt-out: the recommendation arrives selected (2026-09-21)

Sam, 2026-09-21: *"set the decision button for each item to your recommended
and I will change only if needed — opt-out approach"*. Every item renders with
its recommended chip already pressed, **in the markup**, so it holds before any
script runs. The reader touches only what they disagree with.

⚠️ **A PRE-SELECTED CHIP LOOKS EXACTLY LIKE AN ANSWERED ONE, AND THE PAGE MUST
NEVER LET THE TWO COLLAPSE.** Opt-out means a sheet abandoned at item 30 carries
verdicts for 31–51 that nobody read. Those verdicts are still handed over — that
is the whole point — but never as the curator's:

- An item with **no stored reply** is carrying the proposal. An item with a
  stored reply was ruled on by a person; every one is stamped `by: "sam"`.
- **Complete commits the untouched items** with their proposal and
  `by: "default"`, so the session gets a verdict for every item *and* knows
  which were individually reviewed.
- The message, the `replies/done` record and the **paste line** all carry the
  split — the paste line matters most, because it is the fallback when the send
  is refused, which is exactly where provenance would otherwise be lost.
- **Undo removes the reply** rather than storing an empty verdict: a stored
  blank claims "I deliberately left this open", which differs from "I did not
  touch it". The item returns to carrying the proposal.
- The bar reads *"12 of 51 your call · 39 as proposed"*, so progress through the
  sheet stays visible under opt-out.

⚠️ **Only a card that STATES a proposal arrives selected.** A card with nothing
proposed has nothing to opt out of, and pre-selecting there would invent a
recommendation the sheet never made. `preselect` is `None` for those.

⚠️ **The calibration measurement now needs the provenance.** "Jev was right 25
of 25 above p 0.85" is only meaningful over items a person actually judged. Score
against `by: "sam"` rows; an `as_proposed` row measures the default, never the
model.

## Complete — the button that tells the session (2026-09-21)

Sam: *"Add a Complete or Submit button at the end that alerts you in the chat
that it's done."* It sits after the last item and uses the `comments`
capability's `sendToClaude()`, which posts a comment AND notifies the Claude
sessions watching the artifact. That is the page's **only** route to Claude —
writing "@Claude" in page text does nothing — and it needs the full `comments`
declaration (`composer_only` makes `canSendToClaude()` read `"off"`), which
makes the artifact organization-internal. Publish a sheet with
`capabilities: {db: {}, comments: {}}`.

⚠️ **The db write is the record; the send is the doorbell.** A send can be
refused for reasons that say nothing about whether the sheet is finished —
consent, a viewer who is not an editor, no session listening. So the completion
lands in `replies/done` first and the page says which of the two happened rather
than claiming it was sent. Reading `replies/done` is how a session knows a sheet
was declared finished; it is the counterpart to "an item with no reply has no
verdict."

⚠️ **MEASURED 2026-09-21: `sendToClaude()` DOES NOT REACH A CLAUDE CODE SESSION.**
It reports `no_session` from a remote-container session **even with a live,
confirmed artifact watch** — re-registered at 13:42:11Z, pressed at 13:43:24Z,
same answer, `replies/done` carrying `sent: false`. Do not spend another session
diagnosing consent or permissions: the send is not the path.

**THE RELIABLE PATH IS THE SESSION READING THE SHEET.** `replies/done` is a
durable record that needs nothing alive at the moment of the press, so a sheet
finished at midnight is still readable by whatever session runs next. When you
hand over a sheet:

1. Arm a `send_later` check that reads `replies/done` with `ArtifactData` and
   compares its `at` against the last one you saw. A new `at` means a sitting
   ended; read the `replies` collection and act.
2. Tell Sam that saying **"decisions done"** gets it read immediately — that is
   the expedite, not the mechanism.

The button still offers the send (it costs nothing and would work from a
claude.ai chat session), and the page states which of the two happened. What it
must never do is imply the press alone reached anyone.

⚠️ **A REFUSED SEND MUST NOT READ LIKE A DELIVERED ONE.** Sam, 2026-09-21,
after pressing Complete: *"I hit complete on the new decision sheet but I don't
know if it alerted you in context."* It had not — `replies/done` carried
`sent: false` — and the page said so too quietly to notice. Three signals
separate the outcomes now: the button relabels itself (*Completed — sent* /
*Completed — tell Claude*), the state line names the reason, and a failed send
gets its own panel. The words carry it without the color.

**The fact worth saying on the page:** a refused send costs a sentence in chat,
never the work. The replies are ON the sheet and a session reads them straight
off it with `read_db`, so the failure message tells the reader to say
"decisions done" rather than to re-do anything.

**What the bar reports, and the one number it refuses.** The running total is
in outcome terms — articulation rows settled and colleges reached — plus how
many verdicts were changed. ⚠️ **`reach` takes college IDS, never a count.**
Colleges repeat across items, so a sum of per-item counts reports a reach the
sitting did not have, and that is the number a reader takes at face value;
`replies_block` raises a `TypeError` on an int rather than letting it through.
Reversals are counted (`flips`, with `was`), **undo is not** — clearing a chip
is not a change of mind. Quality goes in the score; clicks never do.

⚠️ **Two defects rode the 2026-09-20 sheet and are fixed here.** The injector
looked for `</div>` to close the how-to box and that sheet's box is a `<ul>`,
so the paragraph explaining the chips shipped **inside item 1's chip row**;
`_howto_end()` reads the box's own tag now. The nested markers that left behind
then made `_strip()` match the INNER pair, orphaning the outer reply block on
every re-run; the strip counts depth and cuts the outermost region.
Guarded by `tests/decision_sheet_template.test.js` (24 checks, `npm test`).
