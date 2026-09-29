---
title: Session 179 handoff — the rule was already written down, one line above
created: 2026-08-21
updated: 2026-08-21
tags: [handoff, session-179, doctrine, sierra, my-college, college-identity]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied]]"
  - "[[docs/college_identity_lessons]]"
superseded: true
superseded_by: session_183_handoff.md
---

# Session 179 handoff

You are **Session 179**. Session 178 was **SkyVouch**. Three PRs merged and live:
**#1276** (My College), **#1277** (Sierra, **cpl-chat v52 deployed**), **#1278**
(college identity + a new tab). `main` is at `86e433f`, Pages green.

⚠️ Sam frequently runs several sessions at once. Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## ⭐ READ THIS BEFORE ANYTHING ELSE

**Sam asked for this to be front and center, in these words: *"cure our need to
internalize."***

Every defect Session 178 fixed was covered by a rule **this repository had
already written down.** Not one was a new lesson.

| Defect | The rule that already existed | Where it was |
|---|---|---|
| `.slice(0, 3)` cut 9 colleges to 3 | *`"angeles" alone matches 9; a limit of 3 truncated the answer`* | **A comment 34 lines above it** — same bug, same nine colleges |
| A capped list rendered as complete | *"a capped list must never read as a census"* | `CLAUDE.md` §11 |
| A gated tab named an obstacle, no way in | `hiding-a-control-also-hides-the-way-in` | A published KB note |
| A new tab missing from the Admin inventory | `a-manager-must-show-everything-it-manages` | A published KB note |

**The pattern that matters:** the two rules that existed as **tests** were caught
by CI before merge. The two that existed only as **prose** reached production.
That difference is the whole finding.

So, concretely, in this order:

1. **Search the repo before you generate.** The best catches of the last several
   sessions came from re-reading a committed note, not writing a new one. This
   session still hand-rolled a TypeScript extractor while `tests/lib/lift_ts.js`
   sat in `tests/` doing exactly that job.
2. **When you fix an instance, grep for its twins in the same file.** The cheapest
   possible check, and it alone would have caught the cap.
3. **When you author a rule, ask what would fail if it were violated.** If the
   answer is "nothing", it will be violated. Turn it into a test, a lint rule, or
   a shared helper — a helper is a rule with a call site.
4. Read [`methodology-a-rule-you-wrote-is-not-a-rule-you-applied`](kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied.md).

**And verify fail-first, every single time.** Five of my own checks could not
fail: a regex that could not span `(s) => s.college`; a lift naming a constant
absent pre-fix, so the demonstration was skipped rather than failing; a `|| []`
precedence guard that let the throw run; a bare `check(..., true)`; and a new
lint rule reading `entry["text"]` when no such key existed, so it reported a
clean corpus. **Stash the source, re-run, confirm red, `git stash pop`, diff.**

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8 — sessions *query*, not only write). Tags
   `doctrine` / `my-college` / `sierra` / `college-identity`.
2. The KB note above.
3. [`docs/college_identity_lessons.md`](college_identity_lessons.md), the
   2026-08-21 section — the write, the lint, and Sam's ruling.
4. §11 rows: **College & district identity**, **My College**, **Sierra: false
   absences**.

---

## Decisions Sam made this run

- **Include noncredit campuses and landing-page agencies in the crosswalk** — not
  just credit colleges.
- **Entity ruling:** *"Calbright and LAUNCH get 2 entities—one credit, one
  noncredit. San Diego and North Orange are one entity."* Recorded as attributed
  data in `kb/reference/college_identity_rulings.json`, not code.
- **American spelling, always** — *"As a Yank, I prefer American, of course."*
  Now enforced by `american_spelling` in `kb/_docs_audit.py`, because a
  convention nobody executes is not a convention. **219 docs still carry British
  forms** — clean them as you touch them, don't do a mass rewrite.

---

## Carryover

| # | Item | Status |
|---|---|---|
| 1 | **MAP supplies `college_id` for `Calbright College Credit` + `Launch Apprenticeship Non-Credit`** | Blocked on MAP. In neither `map_colleges` nor `map_college_users`. Reported `awaiting_map_id`; the crosswalk folds them with no code change once supplied. |
| 2 | **Sam opens the College Identity tab in a browser** | New. No session can — egress-blocked. |
| 3 | Sam re-asks the LACCD question and reads the prose | New. If she asserts district facts we don't hold, that's `sierra_guidance` — at **9 of 10**, so it costs the last slot. |
| 4 | **Smoke mode 7 greps model PROSE** | Known-weak; reds intermittently on correct answers. Real work, nobody's done it. |
| 5 | 12 adoption-file statewide titles absent from `chatbox_credentials` | Carried. |
| 6 | Sam opens the three public pages on a phone | Carried since handoff 174. |
| 7 | Everything in handoffs 173–178 | Untouched. |

---

## Patterns that worked

- **Measure before concluding.** "All 9 are in both tables" turned a suspected
  data gap into a one-line retrieval bug in about four minutes of SQL.
- **Reproduce the user's exact sentence in a test.** Pre-fix it returned the same
  three colleges from Sam's screenshot — that is what made the fix provable.
- **Lift the real function, don't re-implement it** (`tests/lib/lift_ts.js`).
- **Let the lint retire your own text.** This checkpoint pushed two §11 cells over
  budget; `stacked_roadmap_cell` caught it and they were compacted, not appended.

## Safety patterns to honour

- **Never force-push `main`** (Rule 5). **Rule 4** — `cmp` the two HTMLs after any edit.
- ⚠️ **Never deploy `cpl-chat` through the Supabase MCP.** Use
  `.github/workflows/cpl-chat-deploy.yml` (`workflow_dispatch`, `confirm: DEPLOY`,
  checks out `main`) — it exists because inline deploys risked size and
  transcription failure. Then dispatch `cpl-chat-smoke.yml` and read mode 7.
- ⚠️ **Wait for the full suite on anything touching tabs.** CI found two real
  defects this run that targeted runs missed.
- ⚠️ **`CLAUDE.md` is 2.2× its lint budget.** Rotate the older §11 narrative to
  `docs/roadmap_archive.md` before adding yours.

## Running the checks

```bash
npm test                                      # 246 files
node tests/sierra_candidate_census.test.js    # 30 — the census defect
node tests/college_identity_tab.test.js       # 36 — the lint surface
node tests/college_identity_variants.test.js  # 12 — variant shadowing
python3 kb/_docs_audit.py                     # the docs lint
```

## Your moniker

SkyVouch suggests **SkyApply** — this run was entirely about the gap between a
rule recorded and a rule enforced. Take it or coin your own; Sam sometimes names
the session in his greeting, and that always wins.

**Sign off with your moniker AND the next handoff number** — e.g. *"SkyApply
signing off. Next is Session 180 — `docs/session_180_handoff.md`."*
