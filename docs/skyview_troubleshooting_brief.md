---
title: "SkyView troubleshooting brief — for a Claude Desktop computer-use session (observe and log only)"
created: 2026-09-06
updated: 2026-09-06
tags: [skyview, ccr, troubleshooting, computer-use, brief]
obsidian-folder: cpl-project-tracker/briefs
related:
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - prototype/skyview.html
---

# SkyView troubleshooting — orientation and boundaries

*Paste this whole file as the opening message of the Claude Desktop session.*

---

You are troubleshooting **SkyView**, an interactive map of California community
college course identities. Your job is to **drive it like a curious user, find
what is broken or confusing, and write it down.**

## Your boundaries — read these first

**You observe, log and recommend. You do not act, fix or build.**

- ❌ **No code.** Do not edit, write or generate a patch. Not even a one-liner,
  not even in a message.
- ❌ **No commits, branches, PRs or pushes.**
- ❌ **No writes to any database**, and see the sign-in rule below — that is how
  a write happens here without you meaning to.
- ❌ **Do not report a fix as if it were done.** Every finding is a
  recommendation for a later session to weigh.
- ✅ **Do** click, drag, zoom, search, resize, toggle, and try to break it.
- ✅ **Do** write findings in the format at the bottom.
- ✅ **Do** say plainly when you are unsure whether something is a bug or the
  intended design. That distinction is genuinely hard here, and a wrong guess
  stated confidently costs more than an honest "I could not tell."

### ⚠️ The one rule that keeps this safe

**Use the prototype, and do not sign in anywhere.**

```
https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html
```

That page has **no write path at all** — verified: every network call is a
plain GET. Dragging a course there stages the move in a list on the page and it
vanishes on reload. **Nothing you do on that URL can change real data.**

Load issues **three** fetches — `prototype/ccr_universe.json`,
`prototype/ccr_universe_members.json` and `kb/discipline_canonical_subj4.json`
(the third sits outside `prototype/`) — and opening a discipline adds one more
for its description shard. Counting them is how you check the claim above, so
the number has to be right.

The same map also appears inside the main dashboard's CCR tab. **That one is
different: signed in, a drag writes a real row to a shared curation table that
the whole team sees.** Signed out it cannot write — the database refuses it. So:

- Stay on the `prototype/skyview.html` URL for anything hands-on.
- ⚠️ **The prototype hands you the door out.** Its `⋮` menu holds a link
  **"CCR table view ↗"** pointing at COBI's `index.html` — the writable surface,
  on the **same origin**, so following it raises no prompt and changes only the
  path. **Do not follow it.** A rule that says "use the prototype URL" does not
  cover a link the prototype offers you two clicks from anywhere, and this is
  the likeliest way to cross the boundary by accident.
- If you look at the dashboard version for comparison, **do not sign in**, and
  do not enter any phrase, code or password you are offered.
- If you find yourself signed in somehow, **stop dragging courses** and say so
  in your log.

## What SkyView is

Every California community college teaches its own version of "Introduction to
Welding." SkyView tries to show which of those are *the same course*.

- Each **point** is a course identity. Its **size** is how many colleges teach
  it. A point that colleges have joined **glows**; a stand-alone only reflects
  light — that is deliberate, and it answers "has anyone agreed this is the same
  course?" without a word.
- Each **island** is a discipline (Welding, Mathematics, Music…).
- It opens **zoomed out**, where individual courses are not drawn yet — that is
  intended, not a blank screen. Zoom in and they appear.
- The **search box** takes multiple picks; each becomes a chip beside it.
- The **Show menu** filters what is drawn, by credit status, identity system,
  kind, and articulations.

## Shipped hours ago — do not report these as new

A session finished this work on 2026-09-05; it is live but barely used, so it is
worth **testing hard** — just do not file it as an undiscovered bug.

1. The suggestion list **keeps its scroll position** when you tick a result. It
   used to jump to the top on every pick.
2. Filter chips show the **full title on hover** (they truncate on screen).
3. With **one** pick the button beside the search reads **Recenter**; with
   several it reads **Fit all**. The `↺` control resets to the whole map — that
   is what `↺` is for, deliberately.
4. **Articulation counts** appear on a course ("7 articulations"), with two new
   Show switches: *Has articulations* / *No articulation recorded*.

## Known and expected — not bugs

- **The map does not contain every course.** SkyView draws **49,896 points —
  16,478 course identities and 33,418 stand-alone courses — out of 71,959
  identities** in the reference. The rest are deliberately not shipped, because
  fifty thousand dots are a smear. A course you cannot find is usually this, not
  a defect.
- ⚠️ **THREE PAYLOADS CARRY IDENTITY COUNTS, AND A FIGURE IS ONLY WRONG
  RELATIVE TO THE ONE IT NAMES.** `CPL_CCR_UNIVERSE.counts` (16,478 identities)
  is what the map draws; `CPL_ATLAS_DATA.totals` (16,484 in browser, 71,959
  total) feeds the discipline tables; and COBI's `unified_courses_data.js`
  carries `count_inbrowser: 16480` / `count_total: 76008` — a fourth surface
  **SkyView never loads**. Read the payload's name before calling its number
  wrong. An earlier draft of this brief quoted the COBI pair here, and a session
  that measured the universe payload against it reported the brief as off by
  ~4,000 when both figures were correct for their own file.
- **The two payloads disagree per discipline, and that is expected.** Universe
  against atlas: **117 of 158 disciplines differ**, total gap 1,904, net −6,
  with `(no discipline yet)` 955 *lower* in the universe. They are not two views
  of one build — they are **two builds twelve days apart** (`_generated_from`
  says `2026-08-24 15:34` and `2026-09-05 15:22`), spanning the authority
  recode, the Z-band retirement and the prefix fold. Nothing rebuilds the atlas
  payload on a schedule. Do not file the 117 as a defect; the staleness itself
  is the finding, and it is already logged.
- **Course descriptions may not load** if the page is opened from a local file
  instead of the web. The mechanism is not a server flag: the shards are fetched
  **cross-origin from Supabase Storage**, which a `file://` page cannot do
  because its origin is opaque. If they fail on a served page, check bucket
  reachability and CORS, not your web server.
- **Some courses have no articulation count** — absent means "none recorded",
  which is not the same as zero, and the page shows nothing rather than a `0`.

## What is worth your attention

Rough priority, but follow what you actually find:

1. **Anything that silently does nothing.** A control that changes a label or a
   count but nothing on the canvas is the failure mode this map has had twice
   before, and it reads exactly like a broken control.
2. **Search**: does the thing you meant appear? Do arrow keys work? Does the
   list stay put when you pick? Try a common word ("art", "welding") and an
   obscure one.
3. **Multi-select**: pick three, remove one, remove all. Do the chips, the map
   and the hint agree with each other at every step?
4. **Getting lost**: after zooming deep or picking something far away, can you
   get back? That was a real complaint — "I was suddenly in mathland."
5. **Small screens** and a resized window. It is supposed to work on a phone.
6. **Keyboard and readability**: can you reach the controls by tab? Is any text
   too faint to read?
7. **The panels** — the discipline card, a course's detail. Do the numbers there
   match what the map shows?

## How to log a finding

One block per issue. Keep them separate even when they seem related.

```
### <short title — what a reader needs to know in one line>

Severity:    blocking | confusing | cosmetic | unsure
Where:       the exact screen/control, and the zoom level if it matters
Steps:       1. …  2. …  3. …
Expected:    what you thought would happen, and why
Actual:      what happened
Reproducible: yes / no / intermittent (say how many tries)
Screenshot:  <attach or describe>

Recommendation: what you would suggest — as a suggestion, not a change.
Confidence:  high | medium | low — and say what would raise it
```

⚠️ **Separate what you saw from what you concluded.** "The count showed 7 while
the panel showed 12" is an observation. "The count is wrong" is a conclusion,
and it might be that the two are counting different things. Write both, marked.

⚠️ **If you cannot reproduce something, still log it** — with `Reproducible: no`
and how many times you tried. A one-off is worth knowing about; a one-off
reported as reliable is not.

⚠️ **REPRODUCE AN INHERITED NUMBER BEFORE YOU CORRECT IT.** If a figure in this
brief disagrees with what you measure, find the source the brief was quoting and
read it, then say which surface each number describes. Two figures that
disagree are usually two different things counted correctly — that has now
happened twice on this page, which carries three separate identity counts.
Correcting a correct number sends the next session chasing a shortfall that
does not exist.

## Two traps in the harness, not in SkyView

Both cost a previous session real time, and both look exactly like defects.

- **Coordinate clicks can land offset.** Clicks aimed at one control have landed
  on a neighbour ~45px away while `elementFromPoint` confirmed the intended
  button was topmost at that coordinate. A programmatic `.click()` on the
  element worked immediately. Prefer DOM-dispatched events; treat anything
  driven by pixel coordinates as suspect.
- **Screenshots can return the top-left quadrant magnified** when
  `devicePixelRatio` is 2. It reads exactly like the map zoomed itself in.
  **Check the in-page magnification readout before filing a zoom or layout
  defect** — that readout is what caught it last time.

## When you are done

Give one message with:

1. **A one-paragraph summary** — how it felt to use, in plain words.
2. **The findings**, most severe first.
3. **What you could not test**, and why. This matters as much as the findings:
   the next session needs to know where the coverage stops.

Do not open a PR, do not write code, and do not describe a fix as applied. Hand
the log back and stop.
