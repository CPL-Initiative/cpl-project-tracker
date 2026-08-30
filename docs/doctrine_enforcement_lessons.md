---
title: Doctrine enforcement — lessons
date: 2026-08-21
tags: [lessons, doctrine, governance, testing, tooling, sky-apply]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - kb/doctrine.py
  - tests/doctrine_lookup_test.py
  - tests/lib/check_ledger.js
  - tests/check_ledger.test.js
  - tests/check_floor.json
  - tests/run.js
  - scripts/js_suite_gate.sh
  - tests/js_suite_gate_test.py
related:
  - "[[docs/kb-notes/methodology-index-the-doctrine-to-the-file]]"
  - "[[docs/kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied]]"
  - "[[docs/kb-notes/methodology-a-check-that-never-registers-can-never-fail]]"
---

# Doctrine enforcement — lessons

The workstream Sam opened with *"let's cure our need to internalize."*

---

## 2026-08-21 — SkyApply (Session 179)

### What prompted it

Session 178 shipped four defects, every one covered by a rule this repo had
already written. The handoff made that the headline. The obvious next move was
to write *another* note about it, which would have been the fifth time.

### What was measured first

Before building anything:

| | |
|---|---:|
| KB notes | 299 |
| Prescriptive (rules) | 236 |
| Rules naming a test/lint in `artifacts:` | 20 |
| Notes named anywhere in an executable file | 8 |
| **Doctrine with no consumer** | **92–97%** |

And the number that decided the design: `chatbox/supabase/functions/cpl-chat/
index.ts` — where the capped-list defect shipped — is named by **22 notes, four
about caps**, one titled *"A capped list must never read as a census."*

⭐ **So the corpus was not badly written, badly titled, or badly filed. It was
un-queryable.** Recall costs scale with the corpus; lookup scales with the diff.

### What shipped

**Two mechanisms, deliberately at different tiers** (the tiering is the note:
[`methodology-index-the-doctrine-to-the-file`](kb-notes/methodology-index-the-doctrine-to-the-file.md)).

**1. The check-count floor — tier 1, needs no invocation.**
`tests/run.js` judged a file by exit status alone. Demonstrated on real code:

```
college_identity_variants.test.js: 10/10 checks passed      exit 0
```

after silently skipping one block of a 12-check file. Now `tests/check_floor.json`
records what each file reports about itself and the runner fails a **drop**.
Baseline **241 of 247 files floored, ~7,500 checks under guard**.

This is the consumer that
[`a-check-that-never-registers-can-never-fail`](kb-notes/methodology-a-check-that-never-registers-can-never-fail.md)
has been asking for since 2026-08-15 — it already said *"watch the total, not
just the ratio"*, and nothing watched it, so the trap recurred in two more
harnesses.

**2. `kb/doctrine.py` — tier 3, replaces recall.**
`python3 kb/doctrine.py --changed` prints, per changed file, the committed rules
naming it. Titles, not a reading list — in this corpus the title *is* the rule.

### What went wrong while building it (the useful part)

- ⚠️ **The lookup's first two bugs were both silent omissions**, the repo's
  signature failure. **235 declared artifact entries** were invisible because the
  frontmatter regex dropped each note's *last* item; and `--changed` omitted
  **untracked files**, so the three files the session had just written were
  missing from its own answer.
- ⚠️ **I nearly wrote a duplicate note.** `methodology-a-check-that-never-registers-can-never-fail`
  already existed. Caught only by listing `docs/kb-notes/` before writing —
  which is the practice the whole session is about.
- ⚠️ **My own code comment broke a test.** The comment explaining the lift
  boundaries *quoted the marker strings*; `liftBlock()` resolves them with
  `indexOf()`, so the start marker matched inside the comment and the lift began
  mid-sentence. **A marker is load-bearing text, not prose.**
- ⚠️ **`lift_ts.js` constrains the code shape, and it says so.** Three separate
  edits broke the lift: a `type X = {…}` declaration inside the range, a `!`
  non-null assertion, and an object-literal annotation left half-eaten. Its own
  header says *fix the block boundaries, do not widen these regexes* — followed,
  each time.
- ⚠️ **Baselined against a moving tree TWICE.** Both ledgers recorded broken
  states as floors; `sierra_geo_ranking.test.js` was floored at **1** against a
  true count of 50. Freeze the tree, then generate. A floor set too low is safe
  and useless, which is what makes it easy to miss.
- ⚠️ **Two of my own checks could not fail.** A `>=` comparison stayed true while
  235 entries went missing; and the first district test named the new function in
  its lift, so pre-change the lift threw and the run reported **0/5 "skipped"** —
  proving only that a new function was absent. Both fixed; the second by
  splitting the two lifts so `buildCollegeContext`, which exists on both sides,
  genuinely fails. Pre-change now **2/16 with 14 substantive failures**.

⭐ **That last one is verbatim the warning already sitting in
`sierra_candidate_census.test.js`** — *"a fail-first check that proved only that
the constant was missing"*. Written by the previous session, about this exact
trap, and re-learned anyway. It is the strongest single argument for tier 1: the
prose was right there and did nothing.

### Design decisions worth keeping

- **Count drift; do not condemn it.** A rule flagging all 216 unenforced notes
  would fail on truth and be muted
  ([`a-guard-that-fails-on-truth-gets-muted`](kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md)).
  The floor fails **only on a drop** — never on more checks, a new file, or an
  unparseable count.
- **Re-baselining is a reviewable act.** A lower floor appears in the PR diff,
  which is when a human should see that checks were removed.
- **Six files print no readable count** and are recorded as `null` rather than
  omitted, so the unprotected set stays countable and can shrink.

### Current state

Both mechanisms live, tested, and in CI. `npm run test:floor` re-baselines.
`python3 kb/doctrine.py --changed` is the lookup.

### Next concrete step

1. **Bring the 6 unfloored files under the floor** — each needs only a final
   `N/M checks passed` line.
2. **Wire `doctrine.py --changed` into `/checkpoint`** so the rules for the
   session's own diff are printed before the docs are written.
3. **The open question is tier 1 coverage.** 236 rules, ~20 enforced. The right
   next move is not to enforce all of them — most are judgment — but to identify
   which *could* be tests and are not. That list does not exist yet.

## 2026-08-29 — Session 208: threading the rules, and a void experiment

### What we learned since the last checkpoint

**The consolidation's remaining budget was duplication, not doctrine.** Rule 9
(10,696 chars) and `.claude/commands/checkpoint.md` named the **same 34
artifacts** — the rule was a second copy of the command it tells you to run, and
the copies had already drifted: Rule 9 still said KB notes land `kb-status:
candidate`, retired in Session 11. `CLAUDE.md` 62,124 → 49,098 B, nothing lost.

**`unreferenced_offload` is file-level, and that is the whole gap handoff 207
named.** Moving Rule 7's invariants into `docs/reference/mid_lifecycle.md` keeps
the pointer correct *whether or not the TOP caveat rides along*. Scored before
building: two new scenarios both reported — NOTHING —. `critical_rule_doctrine`
now guards nine PUSH claims no other guard covers.

**Three false greens, each caught only by trying to break the thing.**

1. The scenario harness **hand-listed** the rules it ran, so a newly installed,
   passing guard scored — NOTHING — on the scenarios written for it. Replaced
   with discovery. Then discovery keyed on **arity**, which made every
   tree-level rule look like an entry rule — so it happened a *second time*, to
   `probe_instrument_leak`. It dispatches on the parameter **name** now.
2. The score jumped to **"11 of 11"** — false. Every fixture was a stub with no
   `## Critical Rules` section, so one guard fired indiscriminately and
   **concealed the two failures nothing catches**. A harness that scores 11/11
   because one rule fires everywhere is strictly worse than an honest 9/11.
3. A doctrine claim that **wraps across lines** was reported missing on a file
   that states it (`fresh live read at write-time` wraps after "read").
   `presentation_doctrine` had the same latent bug.

**Hand-grepping the lane-retirement test is wrong every time it is tried.** This
run got it wrong three more ways — line-start anchor (0 hits across 30),
`NEXT` missing `Next:`, trailing-colon missing bare `BLOCKED` — each producing a
confident, plausible, wrong list. Then `lane_retirement_signal`'s own first cut
flagged `excel-to-supabase`, also wrong, and re-reading *that* file is what
added `Remaining:` and lowercase `blocked`. **The answer is 0 of 30 retirable**,
established by reading all 30.

⭐ **The probe protocol was void on first run.** The rubric and all five prompts
were committed to the repo the probes clone. P5's topic phrase matched exactly
one file in the repository — its own prompt. It found the test and void-flagged
itself. Handoff 207 warned about *prompt* leakage; the leak was the
**repository**, which the design treated as neutral background rather than as an
input. Instruments moved to the vault; `probe_instrument_leak` guards the return.

### Current state

`CLAUDE.md` 49,098 B (0.82× budget). Docs-audit rules +3
(`critical_rule_doctrine`, `lane_retirement_signal`, `probe_instrument_leak`);
`tests/docs_audit_test.py` 103 → 118 assertions, every new guard proven to FAIL
under perturbation. Scenario harness 9 → 12 scenarios, honest score **10 of 12**.

### Strategic roadmap

The two uncaught scenarios are the real backlog: **a `cpl_memory` row that
contradicts doctrine** (the memory table has no lint at all) and **a conditional
checkpoint item nobody can audit** (the auditor cannot see the vault). Both need
a checker that spans two stores, which is the next architectural step rather
than another rule in this file.

### Next concrete step

**Re-run the probes against the cleaned repo.** P2 and P5 were run while the
answer key was still committed, so neither result stands. The instruments are in
the vault; P6 additionally needs `checkpoint_overdue` to fire, which needs more
than 6 commits on `main` after the newest handoff — it is 0 today, so P6 is
**unmeasured**, not passed.

## 2026-08-29 (later) — the matched pair, and what the probes were measuring

### The design error upstream of everything

Sam's six scenarios are **questions** — *what do you do · what will you ensure ·
what are the criteria · what do you miss out on*. Session 206 converted all six
into disguised **build tasks** under its "disguise the scenario" rule.
Defensible, and it cost most of a day: **$43.70**, the repo leak (topic-specific
phrasing is what a probe greps for), two unrecoverable runs, a control arm
dangerous enough to be blocked by the permission classifier, the dropped second
halves of scenarios 4 and 6, and scenario 1 excluded on a misreading — his
wording asks what a session WOULD do and already handles cueing itself.

**Ask form costs ~$1.25 a matched pair against $13.70 for one build-form probe**,
writes nothing, and cannot leak.

### ⭐ The answer, with a control

S1 8/8 vs 3/8 · S2 8.5/9 vs 1.5/9 · S6 6/7 vs 2/7. **Every point of difference is
specific mechanical action, never judgment.** Both arms wanted to save the work
and close cleanly; only doctrine supplied measure-then-say-the-number, lint
first, `/checkpoint` not improvisation, lane file not §11 row, moniker + next
number. The PUSH/PULL rule, validated: generic judgment is free, repo mechanics
are not.

### ⭐ The second job nobody had named

Doctrine also **suppresses plausible-but-wrong defaults**. S2's control offered
*"including dark mode if the app supports it"* against `CLAUDE.md:414`, *"a light
identity with no dark PAGE palette"* — a capable session building the wrong thing
while believing it was best practice. **A miss is visible as absence; a wrong
default arrives looking like competence.** Nothing catches it —
`presentation_doctrine` checks our rules are still *stated*, not that a session
did not import a different design system wholesale.

⚠️ So the pruning test needs a second clause: *"the control produces it free"* is
necessary but **not sufficient** to cut a rule. A near-miss or an opposite means
the rule is doing suppression work and stays.

### ⚠️ Three ablation and instrument failures, all mine

1. **The ablation failed.** Removing `CLAUDE.md` does not remove the doctrine —
   the S4 control rebuilt Rules 1–10 from ~400 citations across `docs/`. Its
   comparison is void. **Third instance of defeat-by-diligence in one day.**
2. **Criterion 6.5 contradicted 6.2** — it required naming `cpl_todos.json` while
   6.2 rewarded refusing to recite the artifact list. Any session correct on 6.2
   must fail 6.5.
3. **Spawned sessions can tell the prompt is an automated event** and say so.
   Harmless for ask-form; may explain why P2 and P4 both stopped before pushing.

### Current state

Four of six scenarios have matched-pair data; S3/S5 have committed criteria and
have not run. Six changes (A–F) are proposed for Sam, none implemented.

### Next concrete step

Repair the ablation (use a scenario the corpus does not document, or strip
citations), run S3 and S5, then re-test against whatever Sam rules on A–F.

## 2026-08-30 — Session 209 (SkyGov): remediation A, then both tabs learned to read it

The dependency map went from "both probe arms named THE miss" to built, verified,
merged and consumed by two tabs in one session (#1396, #1397, #1398).

### What the build taught

- **The code has more idioms than any one scanner.** A seven-agent sweep before
  writing a line found what a straight regex never would: THREE coexisting
  PostgREST base conventions (one with a trailing slash that makes table names
  concatenate bare), helpers whose FIRST argument is the HTTP verb, f-string
  `{TABLE}` module constants, tables bound to URL consts fetched hundreds of
  lines away, write-shaped RPCs standing in for PATCH, shell `$REST_BASE/$t`
  loops, and Python reading generated `window.*` JS back by blind brace-slice
  with no global literal at all. The fact-sheet trap (script tags look
  self-contained, `factsheet.js` fetches `../live_metrics.json` at runtime) is
  a CLASS, not a case.
- **Adversarial sampling earns its cost.** Three refuters on three datasets:
  one CONFIRMED, two returned real defects — the rekey script's bulk PATCH of
  `kb_curation` recorded read-only (the worst direction error the Rule-10 table
  can carry), a tempdir self-bake counted as a consumer, a `path.join("..")`
  read minted a bogus `file:.` dataset. Two-of-three finding defects is the
  verification WORKING; it ran before the merge, not after.
- **Direction lives at the fetch site, not the const line.** Both integration
  rounds re-taught it: `ADOPT_INTAKE = …/rest/v1/cpl_adoption_interest` scored
  read-only while line 93 POSTs through it. Fixed by following the identifier;
  pinned in `tests/dependency_map_test.py` (23 checks, each perturbation-tested
  against the live artifact — every mutation fails exactly its own check).
- **An absent measurement must be visible.** The map carries an UNMEASURED tail
  and anchor-verified seeds: a dynamic read no literal scan resolves is either
  seeded (and the seed's anchor is re-verified every build, dropping its edges
  WITH a warning when the anchor rots) or listed as unresolved — never silently
  absent. The admin surface's false-zero discipline, generalized.

### The integrations (Sam picked all three, 2026-08-30)

- **One derivation, not three scanners that drift.** Governance's `scan_tables`
  required a slash after the REST base and `method:` adjacency; the Admin
  surface could not follow helper wrappers. Result: EIGHT human-write surfaces
  invisible to the entire governance layer at once, and raci reporting
  `reads: [] writes: []` while touching four tables. Both now project from
  `kb/dependency_map.json`; the boot-dispatch parsing stays in the admin
  builder and the map imports it, so the direction of reuse is a LOOP, not a
  fork.
- **A tab whose only writes are tables needs no candidate row** — each table is
  its own row; a tab earns one only for what a table row cannot represent
  (write-shaped RPCs: `nc-learning-partners` writes ONLY through
  `nc_partner_note_revise`/`nc_artifact_revise` and read as a pure view under
  a tables-only projection).
- **A noise guard breached by a better detector is raised with the reason on
  the record, not satisfied by hiding finds.** 25→30 in `governance.test.js`,
  comment says why and when to tighten instead (after Sam clears the backlog).

### Derived findings now pinned

- `cpl_pathways_ccr_data.js` rebuilt daily, absent from the daily commit list.
- `kb/credentials.json` rebuilt by `kb/_match_cos_authority.py` under
  `cos-authority-sync.yml`, absent from ITS commit list (found by the map's
  stale-copy rule on regeneration — the rule generalizes).

## 2026-08-30 — Session 210 (SkyLedger): the E gate, and the suite's inputs moved the design again

Remediation E built ([#1400](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1400)):
`js-tests` is now flippable to a required check — one always-run job, with
`npm test` alone (the only expensive step, ~8.5 min) skipped when every changed
file is docs-shaped. The flip itself is Sam's, in branch protection.

### What the build taught

- **S208's lesson recursed: reading the artifact changes the design.** S208
  read the *workflow* and moved the conditional from the job to one step. This
  session read the *suite* and inverted the key: the jsdom tests read
  `.js`/`.html`/`.json`/`.css`/`.sql`/`.ts` — 120 `readFileSync` sites on HTML
  alone — so the planned "run when JS/`tests/`/generators change" whitelist
  under-triggers silently, the worst failure a required check can have (a
  Rule-4 `:root` token mirror would skip the suite that reads both HTMLs).
  The shipped rule is a fail-safe **skip-list** (`scripts/js_suite_gate.sh`):
  skip only when every changed file is provably inert; anything unrecognized
  runs the suite.
- **The one measured hole got its own branch, not a wider hot set.**
  `docs/catalog/**` regenerates on most docs PRs and is read by exactly one
  test file — putting it in the run set would defeat E for the commonest PR
  shape. Instead the skip branch runs `tests/governance_docs_panel.test.js`
  directly (~2s), and the guard re-derives the set of inert-path readers every
  run, so a future docs-reading test cannot be skipped silently.
- **The ban tripped on its own warning — again.** The check forbidding
  `paths-ignore` failed on the comment that *warns against* `paths-ignore`,
  the exact `self_corrected_word_pair` class from the American-spelling rule.
  Comments are stripped before the check runs; the class now has two worked
  instances in this corpus.
- **The verification rode on real work.** The gate's `run` path was proven
  live by #1400's own CI (the decision step chose `run` for a
  workflow-touching diff and the suite executed); the `skip` path is proven by
  the PR carrying this very section — docs-only by design, catalog
  regeneration included, so the carve-out branch executes too.
