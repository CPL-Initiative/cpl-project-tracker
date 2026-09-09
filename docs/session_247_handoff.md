---
title: "Session 247 handoff — the funding text surfaces, and the parallel-session numbering"
created: 2026-09-09
updated: 2026-09-09
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 247

Your moniker is **SkyLedger**.

⚠️ **READ `docs/session_246_handoff.md` TOO — it is not superseded.** Two sessions
ran in parallel on 2026-09-09. **SkyPlain (S245)** swept COBI for dark mode / AA /
mobile and wrote handoff 246, naming its successor **SkyProof**. This session ran
beside it on the Implementation Funding tab — Sam told SkyPlain to leave that tab
alone because he had me in another window — and never claimed a number. So 247 is
the higher file but 246 is a **live brief you have not seen**, on a different lane.
Read both; neither cancels the other. If Sam pastes SkyPlain's opening line you are
SkyProof on dark mode, and this file is your other half.

## What this run did

One PR, [#1528](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1528),
merged as `1570fa6`. Sam was editing the funding introduction live, getting the tab
ready for debut, and asked for language revised against the new draft Title 5
§55050. It became a decision sheet, nine verdicts, and three features he asked for
mid-stream.

## ⭐ THE RULINGS — carry these, they are now in `CLAUDE.md`

- **The banking sense of "draw" is out.** *"'draws' is a business term tied to
  banking and I don't want that connotation."* Say **earn**; say **receive** where
  funding already earned is being released. **unspent** → *unearned*, **the
  dollars** → *the funding*.
- ⚠️ **But *expended* STAYS where a COLLEGE is the subject.** *"expended should be
  kept if I am referring to the colleges spending the funds. Allocated should be
  used if I am referring to the CO awarding or dispensing the funds to colleges."*
  Check the subject before sweeping either word. This narrowed a sweep I had
  proposed too widely — his correction was the most useful thing on the sheet.
- **Active voice, and name the actor.** No adjective phrases, no asides, plain or
  regulation-consistent terminology. On funding prose the recurring fault is a
  passive hiding the model (*is measured*, *are then applied*). Say **model**, not
  *engine*. Applies to **all** suggested revisions, not only outward prose.
- **The outcomes are Ed. Code's, not the model's** — *"they are drawn from Ed
  Code."* The tab says *"the priority outcomes required by Ed. Code
  §78093.2(d)(1)"*.

## What shipped

- **A `>` blockquote in every prose block.** All-or-nothing, so *3 > 2* mid-sentence
  stays literal. ⭐ Its reverse mapping (`htmlToPlain` → `> ` lines) looked like
  future-proofing until Sam's introduction became `ABOUT_DEFAULT_HTML`: `setText()`
  compares typed text against `htmlToPlain(default)`, so a lossy round trip means
  Edit-then-Save-unchanged silently stores an override. The test pinning that
  guards a failure with no visible symptom.
- **Rename, and Hide on the public page**, per section, riding `sectionShell()` —
  the one function every section on every subview passes through, which is why one
  change reached the model page, the $50K view, the Report and the public page.
  Stored as `titles.<id>` / `secHidden.<id>` in the usual SCENARIO ?? SHARED layers.
- **`cpl_funding_public.html` is now a redirect** to `funding-model/`. ⚠️ This
  stopped being tidiness the moment Hide landed: hiding rode only that page, so a
  section the CO held back stayed visible on the explainer.
- **The explainer's seven sections** (not nine — `noncredit` is inside
  `allocation`; the footer stays out because it carries the draft disclaimer) read
  `T.sectionCuration()`, the tab's own resolver, never a second lookup.

## ⚠️ WHAT I GOT WRONG — the useful part

- **`npm test 2>&1 | tail -N` reports TAIL's exit status.** I told Sam the full
  suite was clean twice off that, once over a run whose failure was printed in the
  text I was tailing. Use `npm test > log 2>&1; echo "REAL_EXIT=$?"`. It caught a
  genuine `exit 1` on the very next run.
  [KB note](kb-notes/methodology-a-pipelines-exit-status-is-its-last-commands.md).
- **A count-based guard passes when its subject disappears.** `detail_trim`'s T1d
  asserted *at most one* occurrence of a phrase the sweep deleted — zero satisfies
  it. ⚠️ **The obvious fix (require it present) is wrong**: that fixture's college
  is not always gated, so zero is a legitimate state. Assert the phrase against the
  module source instead.
  [KB note](kb-notes/methodology-a-count-based-guard-passes-when-its-subject-disappears.md).
- **I predicted `cobi_prose_measure` would pass the redirect and it did not.**
  Its list asserts every named file still has a prose measure; gutting the page's
  stylesheet left none.
- **A decision sheet's own counts go stale between writing and executing.** Mine
  said 15 *draw* sites (14 by then — an earlier item had absorbed one) and nine
  explainer sections (seven). Re-measure at execution.

## Open — what to pick up

1. **The explainer's footer.** Sam has not ruled whether the *sources* paragraph
   should split from the *"working model for discussion, not adopted policy"*
   disclaimer so the first becomes hideable. Today the whole footer is out of
   curation, deliberately.
2. **Sweep the rest of the memo/report builder** against the expended/allocated
   rule — only the one site found this run was checked.
3. Everything else in
   [`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md) —
   NEEDS SAM ⓪–⑤ and NEXT ⓪–⑨ are unchanged by this run except ④/⑤, which it closed.

## Read in this order

1. `docs/session_246_handoff.md` — SkyPlain's parallel brief (dark mode / a11y).
2. [`reference/lanes/implementation-funding.md`](reference/lanes/implementation-funding.md) — lane state, now under budget.
3. [`cpl_funding_lessons.md`](cpl_funding_lessons.md) — this run's section at the end.
4. `CLAUDE.md` Naming & terminology — the two rulings above are in it now.

## Safety patterns honored

Rule 4 untouched (CSS injected from the tab's JS, no `:root` edit — the dark-mode
session was live in parallel). No raw hex. No Supabase writes beyond `cpl_memory`.
Dependency map rebuilt. Merged only after `test` succeeded on the **current** head
— ⚠️ every `check_suite.completed` wake this run named a **superseded** SHA.
