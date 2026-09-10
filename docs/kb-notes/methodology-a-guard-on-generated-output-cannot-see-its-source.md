---
title: A guard on generated output cannot see a regression staged in its source
created: 2026-09-10
updated: 2026-09-10
tags: [methodology, generators, testing, ci, design-system]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-generator-that-lags-its-output-is-a-trap]]"
  - "[[methodology-a-check-that-cannot-fail-reads-as-a-clean-result]]"
  - "[[methodology-token-retheme-on-generated-html]]"
  - "[[CLAUDE]]"
artifacts:
  - college_activity_template.html
  - tests/cpl_theme.test.js
  - excel_to_dashboard.py
---

# A guard on generated output cannot see a regression staged in its source

> **One-sentence summary** — a check that reads a generated artifact reports the
> state of the last run, not the state of the generator, so a regression sitting
> in the generator's input stays invisible until the generator next runs — and
> while the generator is broken, that check is green for the wrong reason.

## Context

Rule 1 of this repo says to change the generator, not the generated HTML. The
corollary for tests went unstated until 2026-09-10: **a test must read what the
generator reads, not only what it writes.**

Session 245 (`bb1fc560`, PR #1527) swept COBI for dark mode. Among the fixes it
replaced `background:#fff` with `background:var(--surface-opaque)` on the four
College Activity filter controls in `CPL_Dashboard.html` and `index.html`, and
added a check to `tests/cpl_theme.test.js` to keep the literal out:

```js
check("⭐ no literal white background survives in the HTML markup either",
  !/style="[^"]*background(-color)?:\s*(#fff(fff)?|white)\b/i.test(cpl));
```

That markup is not hand-written. `excel_to_dashboard.py` emits it verbatim from
`college_activity_template.html`, and the sweep changed two `color:#fff` sites in
that template while leaving all four `background:#fff` sites standing. The check
still passed, because it reads `CPL_Dashboard.html`.

## The claim

**Two distinct failures, one root.**

- **The guard was pointed at the output.** Measured at `bb1fc560`:
  `CPL_Dashboard.html` held 0 `background:#fff`, `college_activity_template.html`
  held 4. The artifact was clean and the source was not, and no check could tell
  the difference. Everything a generator emits needs its guard on the *input*;
  a guard on the output only re-states what the last run happened to produce.

- **A broken generator makes its output's guards look green.** The daily cron had
  died on 2026-09-08 and failed nine consecutive runs, so nothing regenerated that
  section for two days. The check was not passing because the source was clean —
  it was passing because the generator could not run. The first successful run
  after the cron fix (`5545e018`, via PR #1540) re-emitted the card and took
  `background:#fff` in `CPL_Dashboard.html` from 0 to 4, turning the suite red on
  the next PR.

**The practical consequence: fixing a broken generator surfaces every regression
its silence was hiding.** A red artifact check immediately after a generator
repair is evidence of latent source drift, not of the repair being wrong. Read it
that way before reaching for a revert — the reds are a backlog coming due, and
each one names a source file the last sweep missed.

## How we got here

`git log -S 'background:#fff;border:1px solid var(--border)' -- CPL_Dashboard.html`
named the cron's own commit, which ruled out the PR under test. Grepping
`excel_to_dashboard.py` for the element ids found nothing and read like a dead
end; the generator does not contain the markup, it *reads* it. `grep -rn
collegeSearchBox --include=*.html` found `college_activity_template.html` in one
step. The whole template is emitted verbatim (a line-by-line diff of the template
against the emitted region of the HTML shows no drift beyond the date
substitution), so a literal anywhere in it reaches the page on the next run.

Verification of the fix is the falsification: reintroducing one `background:#fff`
into the template alone takes the suite from 53/53 to 52/53. Before this run,
that same edit changed nothing.

## When this applies (and when it doesn't)

- **Applies** to every file a generator reads and re-emits — here
  `college_activity_template.html` is the only such template, but the rule is the
  file class, not the file.
- **Applies** to any CI check on a committed build artifact. If the artifact is
  regenerated on a schedule, the check's freshness is bounded by the last run.
- **Does not apply** where the artifact IS the source (hand-maintained sections
  such as the Pipeline tab). Guarding those files directly is correct.
- **Distinct from** [[methodology-a-generator-that-lags-its-output-is-a-trap]]:
  there the committed generator *could not reproduce* the committed output. Here
  it reproduces it exactly — which is precisely why the source's drift arrives
  intact.

## See also

- `docs/kb-notes/methodology-a-check-that-cannot-fail-reads-as-a-clean-result.md`
  — the sibling failure, where the check's own logic is inert.
- PR `#1527` — the sweep that fixed the artifact and left the source.
- PR `#1540` — the cron repair whose first successful run surfaced this.
- Critical Rule 1 in `CLAUDE.md` — change the generator, not the HTML.
