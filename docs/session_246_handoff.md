---
title: "Session 246 handoff — a triage keyed on the wrong thing, and three checks that could not fail"
created: 2026-09-09
updated: 2026-09-09
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_251_handoff.md
---

# You are Session 246

Your moniker is **SkyProof**. The name is the job: this run found **three
separate checks that could not fail**, each reading exactly like a clean result,
and the next one is already named below. Predecessors: SkyGate S243 → SkyExit
S244 → **SkyPlain S245** (this run).

## What this run did

One PR, [#1527](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1527),
seven commits, on `claude/cobi-dark-mode-a11y-xu4xsx`. Sam's four asks: the CC
session banner he could not see, keep sweeping COBI for dark mode, fix AA /
mobile / glyphs as I go, and **leave the Implementation Funding tab alone** — he
was working it in a parallel session.

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **A CHECK THAT CANNOT FAIL READS EXACTLY LIKE A CLEAN RESULT — THREE THIS
   RUN.** `prose_only()` in `kb/_docs_audit.py` looped its mask patterns with a
   hardcoded `re.S | re.M`, so the line-anchored indented-code rule
   `^\s{4,}\S.*$` ran its `.*` past the newline and masked **to end of file**.
   Measured on the dark-mode lane: last unmasked byte **1,996 of 11,749**, and
   everything below line 44's indented block was exempt from `american_spelling`,
   `house_voice` and `self_corrected_word_pair`. The loop already computed a
   per-pattern `flags` on the line above and ignored it. Caught only because I
   wrote "colour" twelve times and the lint said nothing. The file's own comment
   records the SAME shape in 2026-08-21. **The absence of a finding is not
   evidence.**
2. ⭐ **THE TRIAGE WAS KEYED ON THE SELECTOR; THE CAUSE IS THE COLOR PAIR.**
   `a11y_triage.js` ranked by selector × routes, so the largest dark fault — 25
   findings, 11 routes, **12 different selectors at one route each** — printed as
   twelve `one route — that tab's own CSS` lines at the BOTTOM, below faults a
   tenth its size. Its own header already said *"a ratio repeated exactly is ONE
   color, not many"*; it applied that on the route axis only. And `a11y.js`
   **computed** the composited background and threw it away, so a report named a
   ratio and left you to grep for the color. Both fixed: 193 "causes" collapsed
   to a handful.
3. ⭐ **A FILL THAT DOES NOT FLIP CANNOT TAKE INK THAT DOES.** Three ink roles,
   not two. `--on-accent` (#FFFFFF light / #141413 dark) is right for cobalt,
   crimson, hunter, violet. But `--gold-accent` is `#E3B341` in BOTH themes, so
   reaching for `--on-accent` there — the obvious move — paints white on gold at
   **1.95:1 and regresses LIGHT**. Hence `--on-mustard`, never redefined, the
   `--seal-blue` family. The table is in the lane.
4. ⚠️ **EVERY SWEEP THIS RUN HAD A SITE THAT MUST NOT MOVE.** A match count
   larger than the fault you set out to fix is a signal, never a windfall:
   course-description **data** in `coci_lookup_desc_*.js` (white backgrounds
   inside a college's own pasted HTML), `project_lifecycle`'s archived-state
   badge (`background:#6b7280;color:#fff`), one `#4b5563` on `#f3f4f6`, and **64
   of 69 `#555` uses inside the regenerated section** — the generator's, per
   Rule 1, and a hand-edit there is undone by the next cron.
5. ⚠️ **A GLYPH THE TESTS GUARD IS SOMEBODY'S DECISION.** I cleared
   `cip_crosswalk`'s `✓`/`⇄` and CI went red. The guarding comment reads *"a calm
   '⇄' glyph (distinct from the review '?', **Sam 2026-07-18**)"* — his own call,
   a typographic mark rather than an emoji, and exactly the muted glyph his
   2026-09-09 rule keeps. **Reverted the code, left the test.** The other failure
   (`Common subjects ✓` on a dropdown optgroup) had no such history, so the
   assertion moved instead.
6. ⚠️ **A STALE INSTRUCTION IS WORSE THAN A GLYPH.** Chasing a 1.38:1 contrast
   finding on *"You are not signed in."* I read the rest of the sentence:
   *"Unlock with the team phrase — the 🔒 button in the header."* That button
   moved into the About pane months ago (`cobi_identity.js` says so in the past
   tense). **Thirteen occurrences across six files** sent locked-out readers to a
   control that does not exist. They were invisible to the glyph sweep because
   they are written `"\u{1F512}"` — a padlock on screen, seven ASCII characters
   to a scanner. The sweep now decodes JS escapes and surrogate pairs.
7. ⚠️ **A COUNT THAT MIXES OWNERS OVERSTATES THE WORK.** The glyph sweep reported
   401 control-class findings; **348 belong to `excel_to_dashboard.py`** (already
   plain words there, cleared by the next cron, correctly refused by `--apply`)
   and 8 were arrows inside COURSE TITLES in one-line JSON payloads. Findings
   carry `generator_owned` now and `--check` gates only on what a session can fix.

8. ⚠️ **AND THE CHECKPOINT RULE ITSELF HAD AN UNREACHABLE TRIGGER.** Sam,
   2026-09-09: *"you have not prompted me for a checkpoint per our rules… the
   rule has been demoted or is now buried."* It was neither. `checkpoint_overdue`
   is computed ONLY by `kb/_docs_audit.py`, and the only instruction to run that
   lint is **step 0 of `/checkpoint`** — so the signal that you are overdue fired
   only once you were already checkpointing. Rule 9 now carries two git commands
   any session can run unprompted, and says to run them **at session start,
   after a long stretch, and before any sign-off**. ⭐ **Twice now the trigger
   has been the broken part, not the rule** — its predecessor was *"roughly every
   ~100K tokens… no exact counter"*, unactionable and false besides. **Run it.**

## Measured

| Sweep | S244 | S245 |
|---|---|---|
| `npm run a11y cobi-dark` — contrast findings | 184 | **120** (−35%) |
| `npm run a11y cobi` (light) | 18 | **18** — eight passes, no regression |
| glyph control-class, **ours** | "401" | **26** |
| `npm test` | — | **316/316**, exit 0 |

⚠️ **The ROUTE count (26 dark / 18 light) barely moved and is too coarse to steer
by** — a route fails on any one finding. Steer by the finding count and the
color-pair ranking.

**Implementation Funding was excluded from every measurement and untouched by
every edit**, including two findings of its own (a `--text-faint` site and
`modelling`/`labelled` in `docs/cpl_funding_handoff.md`), left for Sam's session.

## YOUR PRIORITY

1. ✅ **RULED — THE 26 REMAINING GLYPHS STAY. Sam, 2026-09-09: *"Keep all 26
   glyphs as is for now."*** The ⭐/★ **MAP Star** and **Veteran Star**
   designations (12 sites), `✕` close, `✎` edit, `⛔` gates, `⚠` flagged rows,
   the copy control, and the arrows carrying sequence meaning. ⚠️ **DO NOT SWEEP
   THESE.** His *"remove all emoji glyphs"* is satisfied — what is left is
   typographic marks and designations, not emoji — and item 5 above is what
   happens when a session decides otherwise on its own. The glyph lane's
   mechanical work is DONE at 26; reopen it only if he says so.
2. **The dark remainder, through the triage tool.** `npm run a11y cobi-dark >
   /tmp/d.txt && node scripts/a11y_triage.js /tmp/d.txt`. Top causes are all
   light fills that are not white: `#FDF8EC` under the signed-out gate (6), a
   literal `#ECE9E2` under RACI's buttons (6), the akpi cards (5).
   [lane](reference/lanes/cobi-dark-mode.md)
3. ⚠️ **SEVEN TEST FILES PRINT NO READABLE CHECK COUNT**, so their checks are not
   protected against silently disappearing — CI says so on every run. That is the
   same shape as item 1 and nobody has claimed it.
4. **`docs/reference/lanes/skyview-ccr-interface.md` is 2.75× its budget** and
   the lint says so every run. Still untouched; it is a read-and-rule pass.
5. ✅ **`CLAUDE.md` is UNDER budget** — 59,772 of 60,000, first time in weeks,
   paid for by compressing §11's maintenance blockquote while ADDING the
   reachable checkpoint trigger. Keep it there.
6. Carryover, untouched: the **Title 5 rename** (ruled, not built — 1,183
   occurrences across 33 files), **ENVS's retire half**, the **curator pass on
   the 86 blanks**, **PHTO's twelve mis-filed courses**.

## THE BANNER — NOTHING IS BROKEN, AND SAM HAS TO SET IT

Sam could not see the CC session banner. The `cobi_live_session` row was `active`
but **expired 2026-09-08 20:29 UTC**, still pointing at S242's session.
`liveBannerRender` refused it correctly. ⚠️ **Session visibility in claude.ai
governs whether a teammate can OPEN the link, never whether the bar RENDERS** —
that is the natural thing to blame and it is wrong.

To show it: **Admin → Live-session banner**, paste the session URL, *Show*.
✅ **The 8-hour maximum is RULED SUFFICIENT** (Sam, 2026-09-09: *"8 hours is
enough."*). A longer session outlives its own banner, and that is deliberate: a
banner pointing at a dead session is worse than none. **Do not add a longer
option.**

Fixed alongside: the expiry read `getTime() <= Date.now()`, and `NaN <= anything`
is **false**, so a timestamp the browser cannot parse skipped the check entirely
and would have announced a dead session forever — the opposite of the "fails
closed at every step" the block claims. Latent only because PostgREST sends
`+00:00`, which parses.

## Read these, in this order

1. This file.
2. [`/a11y-pass`](../.claude/commands/a11y-pass.md) — before any accessibility work.
3. `docs/reference/lanes/cobi-dark-mode.md` — the three token roles and the
   measured remainder.

## Safety patterns to honor

- ⚠️ **`./scripts/check_generated.sh` LAST, after your final edit.** The
  dependency map went stale three times this run; each time it was a real
  consequence of the previous edit, never a flake.
- ⚠️ **Never edit a file while a sweep or suite is reading it.** I did once, and
  had to throw the run away and restart it.
- ⚠️ **A `check_suite.completed` wake names a SUPERSEDED head_sha.** Every one
  this run did. Re-read `get_check_runs` on the current head.
- ⚠️ **`npm test` proves nothing about layout** — jsdom returns zeroes for every
  rectangle. Run `npm run a11y <target>`.
- ⚠️ **Verify a guard by REVERTING its fix.** All eight new guards this run were,
  one at a time; each fails exactly its own check and nothing else.
- ⚠️ **Grep case-insensitively for hexes.** `#6B7280` found nothing; `#6b7280`
  found the largest remaining cause.
- Never force-push `main` (Rule 5). Squash-merge on a green `test` whose
  `head_sha` matches the PR head.

---

Greetings, you are SkyProof (Session 246), see SkyPlain's handoff —
`docs/session_246_handoff.md` — let's keep rolling with our queue.
