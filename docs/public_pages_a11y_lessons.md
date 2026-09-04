---
title: Public standalone pages — accessibility and mobile lessons
created: 2026-08-20
updated: 2026-09-04
tags: [lessons, accessibility, mobile, sierra, veteran-sprint-map, fact-sheet, public-surface, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb-notes/methodology-the-measuring-browser-can-hide-the-defect]]"
artifacts:
  - scripts/a11y.js
  - a11y.config.js
  - cobi_a11y.js
  - tests/cobi_a11y_baseline.test.js
  - tests/public_pages_a11y.test.js
  - sierra/sierra.css
  - veteran-sprint-map/build_selfcontained.py
---

# Public standalone pages — accessibility and mobile lessons

The project has three public standalone pages outside COBI: the **Fact Sheet**
(audited Session 173), **Sierra**, and the **Veteran Sprint map**. All three are
shared with colleges. This doc covers the second and third.

---

## 2026-08-20 — Session 175 (Sky175)

Sam: *"let's make sure everything is fully wired in from that session and do a
similar accessibility and mobile friendly check on Sierra AI and the Veteran
Sprint MAP."* Handoff 174 had named this the highest-value next engineering step:
**neither page had ever had a layout audit.**

### First: Session 174 was verified, not assumed

Both of handoff 174's open verification items were closed by exercising them,
not by reading the code:

- `fact-sheet/check_mobile_layout.js` — **9 viewports + keyboard + motion, all
  pass** on current `main`.
- The Curate reveal was **clicked end to end in Chromium over http://** (a
  `file://` origin cannot hold `localStorage`), covering both doors: public
  visitor hidden · `?curate=1` reveals and strips the param · the flag is
  remembered · `?curate=0` forgets · **a session left by a COBI sign-in in
  another tab reveals it with no param at all.** 10 of 10 pass. That was carried
  as *"reasoned, never clicked"* — it is now clicked.

### What the audit found

**Sierra** — four real defects, all invisible to the existing suites:

| Defect | Measurement |
|---|---|
| Beta disclaimer and footer below AA | **2.80:1** and **3.12:1** on `--sierra-faint: #8394a3` |
| Two animations, no motion preference honoured | typing indicator pulses **infinitely** while an answer streams |
| `role="radiogroup"` over `aria-pressed` toggle **buttons** | screen reader announced a radio group; its arrow keys did nothing |
| Conversation log unreachable by keyboard | see below — the interesting one |
| 320px sideways scroll | **19px**, from `min-width:auto` on the flex input |

⭐ **The contrast defect was on the most consequential sentence on the page.**
The beta box is what tells a student to confirm anything important with their
CPL coordinator. It was the least legible text there. At 12–13px there is no
large-text exemption (that needs 24px, or 18.66px bold), so a genuinely faint
third grey **cannot exist** at that size — `--sierra-faint` is now close to
`--sierra-muted` on purpose. Every use of the token is text, so nothing
decorative regressed.

⚠️ **The log's reachability was inversely correlated with its content.** It is
reachable only because the starter chips inside it are focusable, and
`submit()` **removes the chips after the first question**. Empty log, nothing to
scroll, reachable. Full log, plenty to scroll, unreachable. An audit that
measures the pristine page sees none of this — the harness seed now removes the
chips, because that is the steady state of the page.

**Veteran Sprint map** — the worst finding in the run:

⭐ **`@media (max-width:760px){ #side{display:none} }` removed the entire side
panel on any phone.** That is the Details pane a marker click writes into, both
directories, both searches, and every CPL landing-page link. Tapping a college
still selected it and still rendered its detail — **into a panel that was not on
the page.** The map remained, so nothing looked broken. This is the same shape as
the Fact Sheet's clipped "Could adopt" column: *a page that silently drops a
feature looks complete.* Below 760px the panes now stack (52/48) and selection
scrolls the panel into view.

⚠️ **The map's entire content was keyboard-unreachable.** An SVG `<g>` is not
focusable and the only handler was `click`, so no college and no installation
could be selected without a mouse; the directory rows were `li.onclick`, same
story. Markers and rows are now focusable, named, and driven by Enter/Space, and
focus shows the tooltip that hover shows.

Also: `height:100vh` → `100dvh` (the footer sat under a phone's address bar);
the three layer toggles were a **19px** tap target (the label is the hit area,
not the 13px checkbox) against the WCAG 2.2 AA 24px floor; zoom buttons named
`+` and `−`; tab buttons whose state lived only in a CSS class.

⚠️ **The map's HTML is GENERATED** by `build_selfcontained.py`. Every fix is in
the generator; the committed artifact is a rebuild, and a test asserts the
artifact still looks like a build of the current generator.

### Three of my own checks were wrong before the code was

Session 173 recorded *"when a new check fails, suspect the check."* This run is
the other half — **when a new check PASSES, suspect it too.**

1. **The motion check read nothing and printed "ok".** Under `file://`, Chromium
   treats a linked stylesheet as an opaque origin and `sheet.cssRules` throws. It
   was vacuous on the first page it was pointed at. Fixed at the root — the
   harness now serves the repo over http:// — with an unreadable sheet reported
   as a failure rather than skipped.
2. **"Escaping the viewport" flagged a clipped decoration.**
   `getBoundingClientRect()` returns the layout box and knows nothing about
   ancestor clipping. Now asks the ancestors.
3. **A 13×13 checkbox is not a 13×13 target** — it is wrapped in its own label,
   so the label is what you press. A harness that cries wolf gets ignored on the
   day it is right.

⭐ **And one that could not fail at all — see
[`methodology-the-measuring-browser-can-hide-the-defect`](kb-notes/methodology-the-measuring-browser-can-hide-the-defect.md).**
Chromium 127+ makes an **overflowing** scroll container focusable with **no
tabindex**, so both behavioral checks for Sierra's log passed against the
unfixed page. The attribute is the check; the behavior is a regression guard,
and it is labeled as one in the code.

### The target-size exemption is guarded, not silent

159 map markers are 7×7 on a phone. That is WCAG 2.2 SC 2.5.8's **Essential**
exception — a pin's size and position encode geography, and growing them to 24px
would make the Los Angeles basin one blob and *misstate where the colleges are*.
Rather than skip them, the harness requires the exemption to **name an equivalent
route and verify it**: the directory lists, measured at **115 rows and 44 rows,
362×28 on a phone**, reached by a declared tab click. Delete the directories and
the pins stop being exempt and the run fails.

⚠️ This also re-ran a lesson the repo already had (#1213): **the marker count
"appeared" only because the fix gave them `role="button"`.** A count going up
because you started showing something is a false finding.

### Residual / next

- **Nobody has opened either page on a phone.** The sandbox is egress-blocked
  from `cpl-initiative.github.io`; everything here is headless Chromium.
- Map markers stay **7px at 390px**. Enlarging the hit radius trades against
  neighbour overlap in dense metros and needs a human eye — not changed.
- The map's stacked phone layout (52/48) is a judgment call Sam should see.
- Sierra's `--sierra-faint` is now nearly `--sierra-muted`; if that reads flat,
  the answer is a larger disclaimer, not a lighter one.

---

## 2026-09-04 — SkyMint S227: the scope widens to COBI's own views, and the first sweep across all 38

⚠️ **This doc was about the standalone public pages. It now also covers COBI's
tabs**, because the masthead audit (PR #1469) showed the same defect classes
live there, and a second doc would drift from this one.

### The masthead: seven real AA failures, three of them written that day

Sam: *"can you ensure that the masthead is accessible and mobile friendly?"* —
so it was measured on the painted page rather than asserted:

| element | measured | what it is |
|---|---|---|
| `.cobi-util-link` | 3.53:1 | the About control |
| `.cobi-ident-btn` | 3.53:1 · 60×19 | who you are signed in as |
| `.last-updated` | 3.53:1 | how fresh the figures are |
| `.cobi-ident-lbl` | 3.62:1 | "Magic link" / "Team phrase" |
| `.cobi-ident-note` | 3.62:1 | the line keeping the pane honest |
| `.cobi-tph-lock` | 65×22 | "Lock again" |

Six were `--text-faint` (`#87877F`) against a 4.5:1 floor — the token the
palette itself marks *"decorative only — never essential text"* — and every one
is essential: a control label, or data a reader acts on. All six moved to
`--text-muted` (6.58:1 composited); the two undersized targets took
`min-height:24px` (WCAG 2.2 SC 2.5.8).

⭐ **Three were written earlier the same session, one of them minutes after a
comment saying not to do it.** Recorded in
[`methodology-a-rule-you-wrote-is-not-a-rule-you-applied`](kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied.md).

### Two harness lessons that cost real time

- **Composite the glass.** The masthead is `rgba(255,255,255,.78)` over the page
  ground. Treating a declared background as opaque overstates contrast; the
  honest figure came from compositing the whole ancestor stack (6.74 → 6.58).
- **Open the panes first.** Most of this header's text and *every* one of its
  forms lives inside a popover. The first audit pass reported "no failures"
  because it measured a closed pane — a check that passes by not looking. Four
  more failures appeared once the panes were opened and a credential held.

### The sweep across all 38 views — the shape is right, the totals were not

Derived the view list from the tab registry (never a hardcoded array) and walked
every tab in one page load. Clustered by text color:

| color | rendered | worst | source sites |
|---|---|---|---|
| `#94a3b8` | 4,827 | 2.34:1 | **32 occurrences, 4 files** |
| `#87877F` (`--text-faint`) | 571 | 2.99:1 | 22 occurrences, 17 files |
| `#64748b` | 486 | 4.23:1 | 44, 4 files |
| `#6b7280` | 207 | 4.32:1 | 82, 11 files |
| `#cbd5e1` | 194 | 1.33:1 | 73, 5 files |

⭐ **The prediction was half wrong, and the wrongness is the finding.**
`--text-faint` was expected to dominate; it is second. The top offenders are a
**Tailwind-family slate/grey palette in raw hex** — not First Light tokens at
all — living in `credential_reference.js` and `unified_courses.js`. That is an
*unreconciled second palette*, and `CLAUDE.md` already forbids raw hex in new
CSS. So the fix is palette reconciliation, not thousands of edits:
[`methodology-audit-by-rendered-value-not-by-file`](kb-notes/methodology-audit-by-rendered-value-not-by-file.md).

⚠️ **The sweep's totals are NOT quotable and were retracted the same day.** Two
harness defects: the pane selector fell back too broadly, so the shared nav rail
and masthead were re-measured on each of 38 tabs; and of 4,057 undersized
controls on `credential-reference`, **3,975 are `display:inline`**, where SC
2.5.8's inline-target exception likely applies. The *ranking* is sound (its
source-site counts come from grep, not the DOM walk); the absolute numbers are
inflated. Fix both before the sweep becomes an instrument. The one control
number that survived triage: **338 controls with no accessible name.**

### `#94a3b8` is four roles, not one — awaiting Sam's ruling

1. **"No value here"** — `.cr-null` *"— no articulations"*, `.uc-member-empty`,
   `.cr-chip-none`, "No matches", "Loading…". ~4,000+ renders, the bulk.
2. **Disabled controls** — `.uc-merge-disabled`, `.cr-wl-input:disabled`.
   **Leave**: WCAG 1.4.3 exempts inactive controls.
3. **Supplementary text** — `.cr-served-sup`, `.cr-wl-band`, sort indicator, the
   ⓘ hint. → `--text-muted`.
4. **Borders** — dashed/dotted underlines. **Leave**: non-text, decorative.

Role 1 is the judgment: absence markers at full `--text-muted` would make
**absence the loudest thing on a dense grid**, which is backwards. Proposed a
new `--text-quiet` at the AA floor. ⚠️ Measured across the three grounds
actually used (white rows, `#F1F5F9` chips/zebra, page ground) the lightest
neutral clearing 4.5:1 is **`#6B6B66`** (4.89:1 worst-case) — an earlier
`#75756D` figure was computed against a single ground and only reaches 4.24:1 on
the zebra. **Measure against the worst ground in use, never one sample.**

### Enforcement: Sam ruled it down to one command

A three-mechanism shape was proposed here — detection, a Stop hook to fire it, a
skill holding the remediation playbook. Sam, 2026-09-04: *"For accessibility, use
the simplest approach that sets us up for continued long term use on all
projects."* What shipped is the first third and nothing else: **`npm run a11y`**.

The hook and the skill were the parts that would have to be installed per
machine, kept in step with the checker, and remembered by a teammate on their
first day — three ways to be half-installed, guarding a check that already runs
in 100 seconds. A command anyone can type, that a session can run unprompted
before it ships a view, is the whole mechanism. ⚠️ **Never auto-remediate to
`main`** still stands, and now has nothing to attach to: Rule 6 (two schedulers
racing, 2026-04-19), and because picking a replacement color is a design decision
— the masthead fix turned on whether each element was essential text or
decoration. A run reports; a session fixes with context.

## 2026-09-04 — SkyMint S227 (continued): one command, and the harness gets audited first

Sam: *"For accessibility, use the simplest approach that sets us up for continued
long term use on all projects."* That ruling is what shipped, and it is smaller
than what was proposed the same morning.

### `npm run a11y` — 42 views, ~100 seconds

`scripts/check_public_page_layout.js` became **`scripts/a11y.js`**. The rename is
not tidiness: "public page layout" would have told every future session that
COBI's own views were somebody else's problem, which is exactly the belief the
sweep exists to end. Its page list moved out to **`a11y.config.js`** — the only
file another project rewrites — so the engine is now project-agnostic and the
command is the same everywhere.

The part that keeps it honest as the app grows is **`discover`**: COBI's entry
names no routes at all. The engine loads `index.html`, reads
`nav.cpl-tabs .cpl-tab[data-tab]` out of the running page (the same query
`tabs.js` uses to derive its own `VALID_TABS`), and measures every one. ⚠️ **A
hand-maintained list of 37 tabs is a list that silently stops being 37, and the
tab it stops at is the new one nobody has audited.** A discovery that returns
nothing is a hard FAIL, not a quiet zero-route sweep — the repo has recorded "a
check that never registers can never fail" three times now.

Cost, measured: 42 routes in 1m41s. COBI's 38 run at two widths (390 and 1440)
rather than nine; nine widths on a 38-route target is a ten-minute run nobody
starts, and a breakpoint that breaks, breaks on a phone. Contrast, headings and
the focus ring are properties of what is painted rather than of the width, so
they are measured once per route inside the widest pass instead of in a second
page load.

### Six of the first run's loudest findings were the instrument

This is the finding worth carrying forward, and it has its own note:
[`methodology-the-first-run-of-a-new-instrument-measures-the-instrument`](kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument.md).
In short: text under an `opacity:0` scroll-reveal scored 1:1 (30 phantom findings
on `our-process` alone); a `<textarea>` was reported as an unreachable scroll
region (29 more); `23.95px` printed as `24` against a 24px floor; the two halves
of the reduced-motion check disagreed at `> 0` vs `> 0.01`, so the *correct*
stand-down read as "still animating"; and a Google Fonts sheet failed forever on
a CORS rule nothing in this repo can change (now declared in the config, with its
reason — anything undeclared still fails).

⚠️ **The sixth would have caused a regression.** The target-size check
substituted an associated `<label>`'s box for its control's. That is right for a
label that WRAPS the control — a 13px checkbox is pressed by the whole label —
and wrong for a `label[for]` sitting beside it: the harness reported the masthead
search box as 91×21 **after** it had been fixed to 32px tall, because the "Where
To?" label next to it is 21.7px. The obvious next move was to enlarge a control
that was already passing. Either box clearing the floor is now enough.

### The chrome-wide fixes: five source lines, about 200 findings

Every one of these appeared on all 38 COBI routes, because they live in the
chrome every route paints — so each was one defect wearing 38 hats:

| What | Was | Now |
|---|---|---|
| `.cpl-nav-group-head` ("Workplan", "Funding") | `#8a8a86` — 3.38:1, and 23.9px tall | `var(--text-muted)` + `min-height:24px` |
| `.cpl-nav-caret` ▼ | inherited the same 3.38:1 | inherits the fix |
| `.cpl-rail-auth-off` ("— not unlocked") | `#888` — 3.33:1 | `var(--text-muted)` |
| `.cpl-sidebar-brand a` | 21.7px tall | `min-height:24px` |
| `.qs-input` (Where To?) | 21.7px tall | `min-height:24px` |
| `.cplfl-imgfallback` | white-on-gradient, 3.08:1 | gradient darkened; text full white |
| five animations | `prefers-reduced-motion` honored in **none** | stood down app-wide |

Two of those deserve a note of their own. `#8a8a86` was a raw hex sitting on
`--text-faint`, whose own token comment reserves it for *"decorative only — never
essential text"* — and a group heading is the word that says what the tabs under
it are. And the First Light fallback could not be fixed by removing the text's
`.88` alpha: **pure white over `#a8842f` is 3.50:1**, so the gradient itself had
to come down. That panel paints exactly when the network is poor.

`prefers-reduced-motion` now lives in **`cobi_a11y.js`**, a runtime-injected
sheet rather than an edit to both HTMLs. Two reasons, and the second is
load-bearing: Rule 4 makes every CSS edit two edits, and a runtime sheet lands
after every static one, so it wins on cascade order without an `!important` arms
race and without sitting downstream of a generator that rewrites whole sections
(Rule 1). ⚠️ It sweeps `*` rather than naming today's five animations — a named
list goes stale the first time someone adds a sixth, and nobody adding one thinks
about that file — and it uses `0.001ms`, never `animation: none`, so handlers
waiting on `animationend` still fire.

### What the sweep still reports, named rather than hidden

38 of COBI's 38 routes still have findings. Sierra and the veteran map pass
clean. The backlog, clustered:

- **5 routes scroll sideways on a 390px phone** — `dashboard` by 887px, `raci`
  392, `budget` 218, `memory` 203, `activities-projects` 179. This is the
  presentation rule ("the body never scrolls sideways") failing outright, and it
  is the highest-value lane of the three.
- **18 routes carry 86 sub-AA text pairs** — worst `dashboard` (15), `raci` (11),
  `pipeline` (10), `canonical-subj4` (9), `implementation-funding` (8). Several
  sit in sections the daily generator owns, so the fix is in
  `excel_to_dashboard.py`, not the HTML (Rule 1).
- **4,042 sub-24px targets — which are 54 selectors.** `button.cr-title-toggle`
  alone accounts for 2,200 renders. The remediation list is 54 lines long.
- **21 scroll regions with no keyboard route**, across 5 routes; most are
  `div.exhibit-card-body`.

⚠️ **Shipping a red sweep is the correct state, not a failure to finish.** The
alternative — quietly narrowing what it measures until it prints green — is the
one outcome that would make it useless.
