---
title: "A threshold belongs to the question that measured it"
created: 2026-09-21
tags: [methodology, kb-note, calibration, gate, model-fit, jev]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
---

# A threshold belongs to the question that measured it

A confidence gate looks like a property of the model. It is a property of **the
model, the question, and the population** that produced it, and it travels to
none of them on its own.

## The measurement that earned one

Against Sam's 51 Common CR Reference verdicts, a probability of **0.85** was the
highest-recall threshold that folded nothing wrongly — precision 1.00, recall
0.61, 25 of 25 correct, 346 articulation rows. Precision degrades the moment it
drops: 0.94 at 0.80, 0.87 at 0.70. That number is real, and it is the answer to
exactly one question: *do these two credit recommendations describe the same
course content?*

## What it cost to assume it travels

The same model, asked a different question about the same corpus, ran
**backwards**. A pre-registered battery put six reasons-to-hold-apart to it over
the band the gate leaves to a curator. The primary came back at **AUC 0.378**,
below chance. The single most interpretable variable, `units`, scored **0.281**
— and the lane had already ruled that **units are not identity** (one Spanish
course is written at 4, 4.5 and 5 units by different colleges).

**That is the mechanism.** A general-purpose model brings general priors. Where
a domain has deliberately overruled one, the model's confidence points the wrong
way, and it points that way *confidently*. A borrowed threshold does not degrade
gracefully into noise; it inverts.

## The near miss

Wiring a second reference onto the same routine, `act_bucket` read one
module-level `GATE`. Every row of the new reference would have been labeled
`suggest` at 0.85 — a threshold measured on a different question, applied to
courses instead of recommendations. The adapter's own test suite was passing
fully at the time, because the bug was in what the number *meant*, not in what
the code did.

**No test of the new reference could have caught it.** The failing assertion
would have had to be about provenance, which is why the fix is a registry rather
than a constant.

## The rule

1. **A gate lives in a map keyed by what measured it**, beside the receipt. A
   constant invites reuse; a lookup makes the absence visible.
2. **Absent means absent.** A population with no measured threshold produces a
   ranked worklist and proposes nothing, however high the probability. The
   probability is still recorded — that is what the calibration run collects.
3. **Calibrate on verdicts a person actually made.** Under an opt-out sheet an
   untouched item commits the recommendation; scoring against those measures the
   model against its own proposal and reports the agreement as accuracy.
4. **Skip the skeptic during calibration.** An adversarial second look refutes a
   proposal. A calibration run makes no proposal, so the second call doubles the
   cost to refute nothing.
5. **Re-measure per question, not per model.** Changing the question is changing
   the instrument, even when the model and the corpus hold still.

## Where this is enforced

`GATES` in `kb/_jev_adjudicate.py` maps reference → measured gate, with the
receipt named beside each. `tests/jev_adjudicate_test.py` fails a `suggest`
emitted without one. The battery's own result lives in
`kb/receipts/jev_battery_2026-09-21_s281.json`.
