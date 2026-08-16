# Session 163 — handoff from Sky162 (Session 162, 2026-08-16)

You are Session 163. Sky162 answered Sam's four EACR questions, shipped all four,
found a fifth defect on the way out, and left `main` **fully green for the first
time since 2026-08-15 (224/224 test files)**.

Read in this order:
1. `docs/eacr_scope_lessons.md` — the whole run, written fresh this session
2. `CLAUDE.md` §11 → the new **EACR — Exhibit & CR Adoption** row
3. `docs/kb-notes/methodology-a-filter-and-what-justifies-it-must-share-one-source.md`
4. `docs/kb-notes/methodology-a-partial-aria-pattern-is-worse-than-none.md`
5. `docs/kb-notes/methodology-a-check-that-never-registers-can-never-fail.md`
   — **read the 2026-08-16 update at the bottom**, it is about you

---

## What shipped

| PR | What |
|---|---|
| **#1221** | Three college scopes, the CER fold, aligned MAP exhibits, two sub-tabs |
| **#1222** | Exports re-keyed to the active scope |
| **#1223** | Accessibility + mobile |
| **#1224** | The one red check on `main` — a stale test bound, sibling branch |

`eacr_scope.test.js` **49** · `eacr_a11y.test.js` **44** · `eacr_student.test.js`
retired (folded into the other two).

---

## ⚠️ The EACR default CHANGED — Sam has not used it yet

A College filter now returns what a college has **articulated**, not what it
might. Anyone used to the old counts will see far fewer rows — that is the fix,
but it is a visible behaviour change and **nobody has driven it in a browser.**

**Ask him directly whether `Adopted` is the right thing to open on.** The other
two scopes are one click away (`Adopted + likely` · `Adopted + any could-adopt`).
This is the only item on the list that needs his eyes rather than yours.

---

## Sam's decisions this run — carry these, they are inputs

- **"Two sub-tabs, fold v3 in"** — he chose consolidation over keeping the
  Student view standalone. Do not re-add a third view; the seeker framing is a
  **mode** of the Credentials view now.
- **"Adopted"** as the opening scope, over the wider options.
- **"Make sure everything is accessible and mobile friendly"** — stated as a
  standing expectation of the redesign, not a one-off request. Treat it as
  binding on the next UI change too.

---

## 🎯 PRIORITY 1 — the curation items, which are NOT code

The tab is done; what is left is data, and it is small and tractable:

1. **4 titles exist ONLY as unclassified cards** while `credential_reference_data.js`
   knows the credential. Folding them in `kb/unified_titles.json` removes 4 orphan
   cards. (The other 8 of the 12 were the blank-issuer twins — already folded in code.)
2. **2 statewide cards match no college at all** — zero adopters *and* zero
   potential, no credit recs. Probably empty records; worth one question to Sam
   rather than a code change.

## 🎯 PRIORITY 2 — sweep the stale test bounds

#1224 was a `/PHRASES = \[[\s\S]{0,900}id: "fin"/` window that went red when
Sky160's own rename added a comment inside the array. **The property was never
violated.** `cpl_memory` recorded this exact class on 2026-08-14
(`a-test-bound-rots-when-the-code-legitimately-changes`) and nobody re-swept.

Grep `tests/` for `{0,` and check each window. A bound that measures **how much
prose sits above a thing** is not testing anything, and it goes red on the commit
that documented itself best.

---

## Patterns that paid off

- **Measure before recommending.** Sam said the filter was too broad; the *ratio*
  (93.6%, median 1 adopter vs 41 potentials) is what turned "add a toggle" into
  "three scopes, and here is why a binary is wrong."
- **Check whether the repo already answered it.** The strong could-adopt signal
  had existed in `statewide_prescriptive.js` the whole time, rendering inside a
  `<details>` and driving nothing. Third session running that the best catch was
  a thing already committed.
- **Re-read the work against the USER'S GOAL, not your diff.** #1222 exists only
  because walking Sam's "one stop shopping" sentence reached the Export button.
- **Audit new work, not just inherited work.** Four of five a11y defects were
  hours old.
- **Verify the harness against the PRE-FIX source and COUNT.** 36 of 49 fail
  pre-fix on the scope suite, 40 of 44 on the a11y suite. Checks that pass both
  ways are regression guards, not proof.

## Safety patterns to honour

- ⚠️ **`val()` guards the CHECK; the DRIVER is the other half.** This trap has now
  hit **three** harnesses. Null-guard every `click()` / `key()` / `focus()` helper
  and wrap `run()` in a try that reports a failed check — a throw *between* checks
  is invisible. The next harness will need this; recording it as "use `val()`" is
  what let it recur.
- **Merge on `clean` OR `unstable`.** Do not wait for `clean`.
- **After a squash-merge the branch is auto-deleted**, so `--force-with-lease`
  fails with "stale info" — `git remote prune origin`, then push plainly.
- **Never force-push `main`.** The stop-hook nag about unpushed commits after a
  merge is a false positive.
- **Supabase is egress-blocked from the sandbox** — MCP tools only. Project
  `hvuwhnbuahrtptokpqfh`.
- **`CLAUDE.md` is ~2× its lint budget.** It is flagged `always_loaded` every
  checkpoint. Trim your own additions and move a narrative out; do not just append.

---

## Moniker

**SkyProse** is still unclaimed (offered eleven times now). Coin your own; if Sam
names one, his wins.

*Sky162 signing off. Next is Session 164 — `docs/session_164_handoff.md`.*
