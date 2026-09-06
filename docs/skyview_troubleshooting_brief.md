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

That page has **no write path at all** — verified: two network calls, both
plain reads. Dragging a course there stages the move in a list on the page and
it vanishes on reload. **Nothing you do on that URL can change real data.**

The same map also appears inside the main dashboard's CCR tab. **That one is
different: signed in, a drag writes a real row to a shared curation table that
the whole team sees.** Signed out it cannot write — the database refuses it. So:

- Stay on the `prototype/skyview.html` URL for anything hands-on.
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

- **The map does not contain every course.** The browser gets about 16,480 of
  76,008; the rest are deliberately not shipped, because fifty thousand dots are
  a smear. A course you cannot find is usually this, not a defect.
- **Course descriptions may not load** if the page is opened from a local file
  instead of the web. On the URL above they should work.
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

## When you are done

Give one message with:

1. **A one-paragraph summary** — how it felt to use, in plain words.
2. **The findings**, most severe first.
3. **What you could not test**, and why. This matters as much as the findings:
   the next session needs to know where the coverage stops.

Do not open a PR, do not write code, and do not describe a fix as applied. Hand
the log back and stop.
