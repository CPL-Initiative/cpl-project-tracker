---
title: The plausible cause is not the measured one, and the check is usually cheaper than the guess
created: 2026-08-09
updated: 2026-08-09
tags: [methodology, debugging, diagnosis, verification, provenance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted]]"
  - "[[docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass]]"
  - "[[docs/vault_sync_lessons]]"
artifacts:
  - scripts/sparse-vault-clone.ps1
  - tests/powershell_ascii_test.py
---

# The plausible cause is not the measured one

> **One-sentence summary** — in one session, five confident diagnoses were each
> plausible, specific, and wrong; every one was refuted by a check that cost
> less than the explanation did.

## Context

A single vault-hygiene run produced an unusually clean natural experiment: five
separate moments where a cause was named with confidence, and five moments where
the actual cause turned out to be different. None of the guesses were lazy —
each fit the symptom, cited a mechanism, and would have satisfied a reviewer.

That is the point. **Plausibility is not weak evidence for the wrong answer; it
is exactly what the wrong answer looks like.**

## The five

| Claimed cause | Actual cause | What refuted it |
|---|---|---|
| 52 KB notes are malformed | 3 are; 52 use a valid sibling dialect (`type:`/`kb-type:`, `date:`) | counting the dialects |
| exclude `docs/` — it's heavy | that would hide the corpus the tool exists to protect | reading the generated list |
| receipts churn because of a timestamp | *also* self-reference: the scan counted its own output directory | two runs, diffed |
| the script is still running | it could not parse at all | reading the error's line number |
| `linkDistance: 250` blanked the graph | 418 MB of markdown in the metadata cache | the user never changed the setting |

The last one is the sharpest. `linkDistance: 250` against a default of 30, at
~700 nodes, genuinely does spread a graph ~70x and genuinely would put the
viewport in empty space. The mechanism was real. It just wasn't what happened —
the graph recovered after a sparse checkout removed 418 MB of markdown, with the
setting untouched.

## The claim

**1. A named line number beats a good story.** The parser said
`sparse-vault-clone.ps1:173 char:46`. The guess was "it's probably still
running — the script does expensive work before its first output," which was
*true about the script* and irrelevant to the failure. Opening line 173 would
have taken ten seconds. The correct first move on any error that carries a
location is to go to that location, before forming a theory about it.

**2. Prefer the check that can return "no".** "It's still running" cannot be
disconfirmed by waiting — every wait is consistent with it. Compare: *is
`linkDistance` still 250?* returns a value either way. When two hypotheses fit
equally, pick the one whose test has a losing outcome.

**3. Ask what the user actually reported.** Two weeks of blank **graph view**
was investigated as a slow **vault**. The file explorer had always worked. A
long stretch of correct engineering — sparse checkout, exclusion audit, cadence
— was aimed at a symptom nobody had. *Restate the symptom in the user's words
before choosing what to measure.*

**4. Real hardware finds what a sandbox cannot.** Three defects surfaced only
when a human ran the scripts: a missing `/scripts/` sparse pattern that would
have deleted the Task Scheduler's own target and silently killed vault sync; a
60-second silent hang; and em dashes that made every `.ps1` unparseable under
Windows PowerShell 5.1. All three passed static review. **When the execution
environment differs from the target environment, say so out loud and treat the
first real run as the actual test.**

**5. When corrected, record the correction where the claim lives.** The graph
finding was written into the lessons doc as *"the size fixed it, my diagnosis
was wrong, and `linkDistance: 250` is still live"* — not quietly dropped. A
superseded diagnosis that is merely deleted leaves the next reader to rediscover
it; one that is recorded as refuted is a fact they can use.

## How we got here

Five corrections in one session, four of them self-inflicted and one supplied by
the user (*"I didn't change the distance; it just opened OK the second time"*).
The pattern was invisible in the moment and obvious in aggregate, which is the
argument for writing the aggregate down.

Related and complementary:
[`methodology-a-guard-that-fails-on-truth-gets-muted`](methodology-a-guard-that-fails-on-truth-gets-muted.md)
covers the inverse failure — a check so eager it fires on correct input and
trains everyone to ignore it. Together: **make the check able to fail, then
believe it when it does.**
