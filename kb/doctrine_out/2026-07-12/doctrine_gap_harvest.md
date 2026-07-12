---
title: "CCR Doctrine-gap harvest — what waves 1–3 keep hitting that the doctrine doesn't settle"
date: 2026-07-12
tags: [ccr, doctrine, mind-meld, gap-harvest, calibration]
kb-status: internal
related:
  - "[[kb/merge_doctrine]]"
  - "[[docs/ccr_convergence_lessons]]"
---

# Doctrine-gap harvest (waves 1–3, 3,985 verdicts)

**The good news first:** every one of the 3,985 wave verdicts cites a real
Doctrine-v0.2 code — **0 uncited, 0 invented codes.** The adjudicators aren't
freelancing; they're applying your rulebook. So the gap isn't discipline — it's
**coverage**: a few high-frequency patterns where the doctrine is either an
*open question* (Q-, never ratified) or *silent*, and the machine defaults to
"stage it as evidence / hold" instead of deciding. These are the questions that,
if you answer them, convert thousands of "split_candidate" holds into confident
calls.

Ranked by how often the waves hit them. Each is a **new mind-meld question** —
react in your next sitting (dictate a rule, or "leave open") and I fold it into
v0.3.

---

## 1. ✅ Credit ⋃ Noncredit twins — RESOLVED 2026-07-12 (was 374 verdicts, 313 forced to "split")

> **Sam's ruling (Q-CREDITNC resolved).** A mirrored CR/NC pair is the *same
> course* — the free noncredit section, taught by a vocationally-qualified
> instructor, bridged to credit via **Credit-by-Exam**. It's a **CPL
> mechanism**, not a band-purity defect. Codified as the **D-3 mirror
> carve-out** (Doctrine v0.3). Catalog-wide impact (via `kb/_detect_crnc_mirrors.py`):
> **968 identities are pure CR/NC mirrors** (D-3 suppressed → CPL Credit-by-Exam
> pairings; the naive first count of 1,337 was inflated by same-subject/different-
> number false pairs — the detector was hardened to be number-aware). 143 partial,
> 1,725 genuine band-mix. The 296 hard cross-college split_candidates were
> re-adjudicated per-item: **230 genuine over-merges** (229/230 skeptic-confirmed),
> **54 distributed mirrors kept**, 12 curator. Receipt: `kb/crnc_out/2026-07-12/`.


**The pattern.** A college offers the *same course* in both a **Credit** band and
a **Noncredit-Enhanced (0.0u)** band (e.g. Cabrillo `ACCT 151A` Credit 4u +
`ACCT 451A` NC-Enhanced 0u; the AUTO/BUSI/HMDT/PHMT `M1xxx` families). Today
**D-3 forbids the credit/noncredit band-mix inside one identity**, so the waves
flag them `split_candidate` **313 times** — but **Q-CREDITNC** (whether these
twins should instead *package* into one CPL-facing row) has never been ratified.
So the single most common thing on the mountain is stuck in "evidence" limbo.

**Why it matters for 25k→2,500.** These twins are duplicate *representations* of
one real course. If they package (one identity + a band note), the count drops
hard and honestly. If they must split, D-3 stands and we stop re-flagging them.
Either way, **313 decisions unlock the moment you rule.**

**Your question (Q-CREDITNC).** When one college teaches the same course in a
credit band and a noncredit-enhanced band, is that (a) **one** CPL identity with
a credit/noncredit note, (b) **two** identities (D-3 stands — a real credit-outcome
difference), or (c) a **package** (like the P-3 level ladder, but on the
credit/noncredit axis)? Does the answer change when the noncredit twin is 0.0u
vs. carries its own units?

---

## 2. ✅ Faculty-qualification / MQ gate — RESOLVED 2026-07-12 (was 228 verdicts, no rule)

> **Sam's ruling → D-9 MQ-tightening gate (Doctrine v0.4).** Only the
> *tightening* direction gates: a re-discipline that moves a course TO the
> master's list (`not_masters → masters/both_lists`) can disqualify current
> instructors → **hold for faculty** (`needs_curator`). Loosening/lateral moves
> auto-apply. Applied to the wave-3 lane: **6 of 143** discipline corrections
> are tighteners (4× CIS→Computer Science, Industrial Tech→Engineering, Public
> Safety→Political Science) → held; 137 fire-OK. Receipt: `kb/ccr_out/2026-07-12/d9_gate_wave3.json`.


**The pattern.** 228 verdicts reason about the discipline's *faculty-qualification
pool* (masters-list vs. experience-list), mostly on `discipline_correct` (120).
The doctrine's **D-8** requires explicit re-disciplining on a merge but says
**nothing** about the consequence the whole MQ wire-up exposed: re-labeling a
course's discipline **changes who is legally qualified to teach it**.

**Your question.** Should a re-discipline that moves a course between MQ lists
(e.g. a master's-list → experience-list discipline, or vice-versa) be **gated**
— held for faculty rather than auto-applied — because it shifts the faculty-qual
pool? Or is the discipline call independent of the MQ consequence (faculty sort
that out downstream)? (This is the D-8 amendment I flagged; 228 verdicts want it
settled.)

---

## 3. ✅ Homonym splits — RESOLVED 2026-07-12 (was 155 verdicts, 100 "split")

> **Sam's ruling → P-12 homonym test (evidence over TOP).** TOP code is a WEAK
> signal (colleges mis-enter it) — it SURFACES a homonym but doesn't decide one.
> Reliable evidence in order: **title · course/catalog description · aligned
> exhibit/credential**; TOP is used **only to tip the scales when those are
> inconclusive**. Never split on TOP divergence alone; hard credential/exhibit
> evidence that ties members OVERRIDES a TOP split. **Implication:** the ~100
> wave splits driven mainly by `member_top_divergence` must be re-checked
> against title/description/exhibit before they fire (a re-adjudication, like
> the CR/NC one).


**The pattern.** "Electrical Fundamentals" (construction vs. automotive),
"Blueprint Reading" (13 subjects), paralegal-vs-criminal-law `1402.00` — a
string-identical title spanning genuinely different fields. The waves catch these
as `split_candidate` (100×) via TOP-division divergence, but there's **no named
doctrine rule** for the homonym split; it leans on `member_top_divergence` and
`Q-GENERIC` indirectly.

**Your question.** Promote a homonym rule: when members of one title split across
≥2 TOP **divisions** (broad fields), is that an automatic split (never merge a
homonym), or does credential/articulation evidence override the title collision?

---

## 4. 🟢 Venue / academy marks — mostly handled, one edge (101 verdicts)

**The pattern.** "POST Certified Regional Academy", campus/venue names in titles.
**P-10**'s modality/venue-agnostic naming already covers the 77 `bless` + 13
`title_fix` cleanly. The only unsettled edge: when a *regional academy* is its
own credential (not just a venue mark), does it fold to the generic academy row
or stay distinct? Low volume — **likely just a P-10 clarifying sentence**, not a
new question.

---

## 5. 🔵 Discipline proposals must have a canonical SUBJ4 (the Aeronautics lesson, 8 verdicts)

**The pattern.** Small count but a clean, safe rule the wave-2 re-verify already
proved: 4 findings proposed **"Aeronautics"** — a real MQ discipline, but one with
**no canonical SUBJ4 and no rows** — which would fan-in-break a field already
registered as **"Aviation"** (D-8 break). The skeptic's canonical-registry check
caught it.

**Proposed rule (no question needed — this is safe to codify).** A
`discipline_correct` proposal must (a) be an exact MQ-vocabulary name **and**
(b) have an existing canonical SUBJ4 in `discipline_canonical_subj4.json`, else
route to `needs_curator`. Prevents minting a second label for a converged field.

---

## What I recommend you do with this

- **Answer #1 (Q-CREDITNC) and #2 (MQ gate) in your next sitting** — those two
  alone touch **602 verdicts** and are the difference between "staged evidence"
  and "confident batch-apply."
- **#3 homonym** is a quick yes/no.
- **#4 and #5 I can just codify** (P-10 sentence + the SUBJ4 gate) without a
  sitting — say the word.
- Then I re-run the 52-group calibration (`calibration_review.md`) under the
  amended v0.3 and re-measure the ≥90% gate.
