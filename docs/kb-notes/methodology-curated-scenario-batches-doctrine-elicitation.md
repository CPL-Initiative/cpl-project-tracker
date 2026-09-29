---
title: "Methodology — elicit curation doctrine with small, grounded, curated scenario batches (not the firehose)"
kb-status: published
created: 2026-07-14
updated: 2026-07-14
tags: [methodology, ccr, doctrine, mind-meld, curation, human-in-the-loop, calibration]
related:
  - "[[docs/ccr_convergence_lessons]]"
  - "[[kb/merge_doctrine]]"
  - "[[docs/kb-notes/playbook-trail-crew-method-magic-audit]]"
---

# Elicit doctrine with small, grounded, curated scenario batches

**The problem this solves.** A curator (faculty/dean/VPAA) has judgment we need to
capture as written policy, at scale. The naive path — surface the whole
suggested-merge worklist (thousands of groups) in an in-app panel and ask them to
react — **fails to decision fatigue.** Sam's own words (2026-07-14): *"I dropped
off using it because there were thousands of suggested merges and I got
overwhelmed."* The 🧠 mind-meld panel was wired and correct; the volume killed it.

**The pattern that works: a few high-leverage forks at a time.** In one sitting,
Sam took the merge/mint doctrine from v0.6 → v0.11 — nine rulings, 7 of 11 open
questions closed, ~6,600 identities (ESL/Music/Dance/KINE) given a packaging
policy — via **AskUserQuestion batches of 3 forks**, each a distinct open
question, each grounded in real data. What made it work:

1. **Stratify, don't stream.** Draw a small stratified sample (or the top open-
   question hits) — a batch is ≤3–4 forks. Each fork settles a *class*, not a
   row: "Topics in X shells" (→ one umbrella per subject) cleared hundreds at
   once. One good policy question is worth thousands of per-row clicks.
2. **Profile the discipline BEFORE bringing the edges.** For ESL, we counted
   first (2,364 identities; 702 no-level; strand histogram) and only THEN asked
   the three real edges (Citizenship 33, VESL 67, content-not-language). The
   distribution is what makes the scenario sharp — don't ask abstract policy;
   show the piles at the margins and ask about *those*.
3. **Frame against the nearest settled precedent.** Music/Dance were framed
   against KINE's already-ratified P-11 ("KINE keeps sports separate, consolidates
   fitness — do dance styles behave like sports?"). The curator answers fast by
   agreeing or diverging, and the *divergence* carries the real signal (Dance
   consolidates — for permutation volume, not skill-equivalence).
4. **One concrete example per option.** Real course titles ("Beginning Spanish 2",
   "Custodial Report Writing 1/2"), real counts. Recommendations allowed, marked
   "(Rec.)", first — but every option is a real, mutually-exclusive path.
5. **Capture the REASONING, not just the verdict.** Sam's follow-ups ("since
   Custodial is only .5u, merging is best"; "the only reason I'm merging dance is
   permutation volume") became named doctrine levers (the P-5 unit signal; the
   permutation-pressure lever), each reusable far beyond the row that surfaced it.
   Fold each ruling back into the doctrine text with the curator quote + a rule id.

**The gate-as-interview corollary.** When you run a blind calibration gate (re-
decide a sample the curator already ratified, score agreement), the *divergences
are the interview questions*. The v0.6 gate read 87% fine-agreement; every miss
was an unsettled fork (same-college level pairs, an audience homonym). Surfacing
those 3 misses as example prompts turned a measurement into two ratified rules in
one exchange — and the gate jumped to ~95%. Don't conclude "the doctrine failed"
from a sub-threshold score; read WHERE it disagrees first.

**Guardrails.**
- Keep batches finite and say so ("three forks, one each"); the curator needs to
  see the end of the queue. Diminishing returns arrive — pivot to *showing the
  payoff* (a dry-run preview of what the rules do to real data) once the big
  morasses are settled.
- A profile-driven consolidation the curator makes for *volume* reasons
  (permutation pressure) is an explicit call, not a skill-equivalence claim —
  record it in `merge_note` so faculty validation reads it correctly.
- Every ruling is reversible + receipted (D-6): the doctrine cites the rule id,
  so a later reversal identifies exactly the cohort to revisit.

**Reuse.** Any human-in-the-loop policy elicitation over a large item set —
credential canonicalization, discipline cleanup, CIP designation, peer-college
curation. Curate hard, present few, ground each in the real distribution, frame
against precedent, and bank the reasoning as named rules.
