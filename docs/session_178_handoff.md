---
title: Session 178 handoff — My College asks before it answers, and Sierra's instruction list is a zero-sum budget
created: 2026-08-21
updated: 2026-08-21
tags: [handoff, session-178, my-college, sierra, sierra-guidance, ui, css]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-a-capped-instruction-list-is-a-zero-sum-budget]]"
  - "[[docs/session_177_handoff]]"
---

# Session 178 handoff

You are **Session 178**. Session 177 was **SkyAsk** — I coined it; Sam opened with
"Hey Sky" and did not name the session. **PR #1274 is MERGED** (`8349bd1`) and
Pages deployed it green, so everything below is live. A second, docs-only PR
carries this checkpoint.

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8 — sessions *query*, not only write). Tags
   `my-college` / `sierra` / `sierra-guidance` / `ui`. Four rows written this run.
2. [`docs/kb-notes/methodology-a-capped-instruction-list-is-a-zero-sum-budget`](kb-notes/methodology-a-capped-instruction-list-is-a-zero-sum-budget.md)
   — read this **before you add anything to `sierra_guidance`**. It is the one
   finding here that will bite someone silently.
3. [`docs/kb-notes/methodology-an-inline-placeholder-style-outranks-the-css-you-inject`](kb-notes/methodology-an-inline-placeholder-style-outranks-the-css-you-inject.md)
   — read this before debugging *any* COBI tab whose prose looks wrongly aligned.
   Every lazy tab ships the same placeholder; My College is just the one that
   renders enough prose to show it.
4. [`docs/college_action_page_lessons.md`](college_action_page_lessons.md), the
   2026-08-21 section — the measurements and the reasoning.

---

## What Sam asked for

Six points against the My College tab, in one message with two screenshots:

> 1. It opens on Cabrillo College now and should rather prompt for a location
>    before populating. 1. use the full screen width … narrow paragraphs together
>    with full width content looks awkward. 1. Strike "Ask Sierra anything
>    about…" — redundant. 1. revise the explanatory text to [his wording] … You
>    can delete the yellow Beta box. 1. Help me add the most effective and
>    succinct Sierra Training Fact to adjust Sierra's *Where Cabrillo is Today*
>    table … the simplest and most focused finger on the pulse of their college.
>    1. We need a solution for our pre-seeded questions … users select a
>    pre-seeded question and are not prompted for their role — confusing.

---

## Decisions Sam made this run

- **Retire the two 2026-08-12 guidance rules now handled in retrieval** (`23a5cd2a`
  "list all ten PST credit recommendations"; `346612d9` "recommend the closest
  local course") to make room for the snapshot rule. Chosen from three options
  when told the list was at its 10-row cap. They are **deactivated, not deleted**.
- **Sierra's intro wording is his, verbatim**, including lower-case "credit for
  prior learning" and the "Note:" caution. Do not house-style it.
- **Delete the yellow Beta box** — but its two duties (she is unfinished; do not
  type personal information) had to survive, which is why they are in the Note
  sentence.

---

## What shipped

**① The tab always asks first.** `restoreScope()` no longer seeds
`state.scope`/`state.college`. It fills `state.remembered`, which **only** the
picker reads, and the scope question carries a named shortcut — *"Open Cabrillo
College again"*. A remembered scope with no entity is not offered.

**② `shedPlaceholder()`.** ⭐ The pane's **inline** `text-align:center` (the
"Loading…" placeholder, in both HTMLs) out-ranks the `text-align:left` the module
injects, so every measure-capped paragraph rendered *centred inside a
left-anchored box*. That was the "narrow paragraphs" complaint. The caps were
innocent.

**③ The header sentence is struck** — it was #1231's duplicate description of
Sierra growing back for the **third** time, one level higher each time. There is a
comment where it was; please do not let it grow back a fourth.

**④ Sierra's intro + `.cplchat-note`.** No yellow box. The Note is distinguished
by a neutral left rule and inherits the description's colour exactly, so there is
no new contrast pair to verify — Sky175 found the least legible text on the public
Sierra page was its caution, rendered in a third fainter grey. **This changes both
COBI surfaces** (My College + CPL Assistant); the public standalone page and the
Fact Sheet drawer deliberately still carry the old wording.

**⑤ One question cluster, below the role chips.** New `CPL_CHAT.setSuggestions()`.
The tab hands over its derived questions after `mountInto()`; the widget renders
them in its own slot, which is under the "I'm a…" chips, which makes
`needAudience()`'s *"tap who you are above"* true again. A group scope passes
`null` and the generic starters return. The fallback is gated on the questions
**landing**, not on the mount — a chat module predating the API still gets them.

**⑥ The Sierra Training Fact is LIVE** (`7d8641be`, 1,358 chars). Three rows, no
statewide column, both military and Not-Applicable caveats below the table.

---

## The two traps worth carrying forward

⚠️ **`sierra_guidance` sends the newest 10 and DISPLACES the eleventh, oldest
first.** It was at exactly 10 and the oldest was the **naming rule**. The Training
tab's headline reads *"3,588 of 9,000 characters (40%)"* — the wrong dimension.
**Count before you add; write drafts `active=false`; read the neighbours.** My
first draft said *"never rank colleges"*, which contradicted Sam's own 2026-08-18
row saying naming high performers is fine.

⚠️ **`getElementById` in a two-pane widget finds the EARLIER pane.** `submit()`
cleared the *other* tab's starter chips. `cpl_chat.js` has documented this trap for
`inputEl` since August; the comment did not protect the next variable. If you add
module-level DOM state to that file, it belongs beside `inputEl`/`logEl`/`chipsEl`
and is re-pointed by `build()`.

---

## Carryover

| # | Item | Status |
|---|---|---|
| 1 | **Sam opens My College in a browser** and asks Sierra the Cabrillo snapshot question | New. The guidance row is live, so his next answer is the test of it. |
| 2 | Does the public Sierra page + Fact Sheet drawer take the new intro wording? | New. Different audience — deliberately unchanged. |
| 3 | Is the centred 760px scope card right for a landing screen? | New, minor. One line either way. |
| 4 | **Sam opens the three public pages on a phone** | Carried since handoff 174. Still the one thing no session can do. |
| 5 | Sam reads the funding-model explainer before sending it out | Carried from 177. |
| 6 | The two region lists (SWP, ASCCC) | Unchanged since Sky167 — on the MAP Dashboard, in no export we hold. |
| 7 | Everything in handoffs 173–177 | Untouched by this run. |

---

## Patterns that worked

- **Read the neighbours before writing the tenth.** Pulling all nine active
  guidance rows caught a contradiction with Sam's own instruction that no amount
  of care about my own wording would have found.
- **Write the risky artefact switched off.** The guidance draft existed, was
  reviewable, and cost nothing until a human chose. That turned a blocking
  question into a one-click decision.
- **Check the guard fails first.** 11 of 19 new checks go red against the pre-fix
  source — stash the modules, re-run, `git stash pop`, then diff the restored
  files against copies to prove the pop was clean.
- **Build the fixture from the real markup.** The centring check is unfailable
  against a bare `<div>`; it needs the pane's actual inline `style`, plus a
  precondition assertion so a future fixture edit cannot disarm it.
- **One of my own checks was wrong before the code was** (a source scan matched
  the comment quoting the call it replaced). Sky175's lesson, on schedule.

## Safety patterns to honour

- **Never force-push `main`** (Rule 5). Feature branches may `--force-with-lease`.
- **Rule 4** — `CPL_Dashboard.html` and `index.html` stay byte-identical. Both
  were touched this run; `cmp` them after any HTML edit.
- ⚠️ **`CLAUDE.md` is 2.25x its docs-audit budget.** §11 holds **two** inline
  narratives; Sky175's was rotated to `docs/roadmap_archive.md` to make room for
  this one. Rotate SkyGlass's before you add yours.
- ⚠️ **Prefer injecting tab CSS from the tab's JS** — one file covers both HTMLs
  with no Rule-4 mirror. Only `:root` tokens need the mirror.
- ⚠️ `sierra_guidance` steers the **production `map.rccd.edu`** widget, not just
  COBI. Flag the blast radius before writing, every time.

## Running the checks

```bash
npm test                                   # 243 files, all green on 8349bd1
node tests/my_college_sierra_box.test.js   # 19 checks — this run's guards
node tests/my_college_scope.test.js        # 63 — the scope-first flow
node tests/college_briefing.test.js        # 239 — the engine
```

## Your moniker

SkyAsk suggests **SkyMeter** — this run was about budgets that bind invisibly and
meters that measure the wrong dimension. Take it or coin your own; Sam sometimes
names the session in his greeting, and that always wins.

**Sign off with your moniker AND the next handoff number** (Sam, 2026-08-13) —
e.g. *"SkyMeter signing off. Next is Session 179 — `docs/session_179_handoff.md`."*
