---
title: "The canonical credential model: issuer on the title, assessor on the local exhibit"
created: 2026-11-11
updated: 2026-11-11
tags: [reference, cer, exhibit-canonicalization, governance]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
---

# The canonical credential model

**Sam's rulings, 2026-11-11, relayed by COBIx on issue #3110** (his words: *"1. yes 2. yes"*, then *"3. yes 4. use the
majority exhibits that have them in the title to determine who should get the tags 5. yes 6. will do"*), on COBIx's
analysis *Canonical exhibits: credential issuer vs. local assessor*. Governance: DR-34. Lane:
[`cer-procedures`](lanes/cer-procedures.md).

His question, verbatim: *"the local exhibits that are for the cert would also be under this canonical exhibit title and
the issuer for those would be ASE...so maybe I need a heuristic analysis of how we MAP exhibits are titled and coded now
and how the cononical strategy should best serve the big picture needs to students searching based on their
experience/cert names/ issuers/programs/trainers--all the places learning takes place and credentials that identify the
learning...as well as the needs of the colleges and system to adopt or adapt each others decisions..."*

## The model: three parts, kept apart

1. **The credential (the canonical title): what the learning is.** One per credential, statewide. It carries the
   **credential's issuer**, the body that awards what the student holds. *Medium/Heavy Truck Parts Specialist (ASE P1)* is
   issued by ASE. A title with no outside award is course-based, and its issuer is the colleges.
2. **The local exhibit: how one college gives credit for it.** Its college, its MAP exhibit id, its **CPL path** and
   **who assessed the student**. The path is read from the MAP id, never typed (`kb/exhibit_paths.py`).
3. **The adoption link: how colleges reuse each other's work.** Adopt is the same MAP exhibit at another college. Adapt
   is a new local exhibit under the same credential. MAP records neither today (ruling 6).

| Path (MAP id after `MAP`) | Assessed by |
|---|---|
| Industry certification (`IC`) | The credential's issuer (ASE, CompTIA) |
| Credit by exam (`CX`, `Cx`, `CBE`) | The college |
| Portfolio (`PR`) | The college |
| Exam score (`SA`) | The exam body, the title's issuer |
| Other (`MM`, `O`) | Not derived |

P1 under the model: the credential is issued by ASE. The college's noncredit exhibit is credit by exam, assessed by the
college. A later exhibit where students show the ASE certificate is an industry certification, assessed by ASE. His
rulings of 2026-10-31 and 2026-11-07 hold on the local exhibit: the college for its own exam, the vendor for the
certificate.

## The rulings

1. **The canonical title carries the credential's issuer; each local exhibit carries its path and assessor.** This
   replaced his note of 06:20 PT the same day, *"Keep the college as issuer on the P1 title"*.
2. **The #3108 renames go ahead; the 16 merges held** until local exhibits show their path and assessor. The Exhibits
   tab shows them (the related-titles panel and each rename-batch row, `kb/exhibit_paths.py`), which is the condition he set.
3. **A college's set of ASE tests is a local requirement, never a canonical title.** ASE Master stays canonical: ASE
   awards it.
4. **A short tag goes to the body most titles already use it for.** Recounted 2026-11-11 on `kb/credentials.json`:
   *AWS* is the American Welding Society (20 titles; Amazon Web Services 4), *ACE* the American Council on Education
   (29; the American Council on Exercise 3). The other body is spelled out. Settle both before the AWS batch.
5. **A trainer is never the issuer.** High schools, districts, ROPs and JATCs move from the issuer field to the trainer
   field (130 titles), in one data PR with receipts, with the 10 duplicate issuer spellings and the
   *alifornia Veterinary Medical Association* typo.
6. **The ITPI ask** (a mirrored or not flag for credit by exam, an apprenticeship path, an adapted-from link) is Sam's.

## What is built, and what is not

- **Built:** the format (`kb/cert_naming.py`); the path and assessor read from the MAP id (`kb/exhibit_paths.py`),
  carried per title in `kb/exhibits_related.json` and drawn in the related-titles panel and the rename batch; a title
  in the format fills its issuer with ASE.
- **Built: the fold keeps one issuer** (#3110 build step 1, `kb/fold_issuer.py`), by four rules in order. First, an
  issuer a person set as part of the fold decision wins: its own save is at or after the group's earliest fold save,
  and the newest wins when two people disagree. An older issuer a person set is an ordinary record. Second, a target
  in the certification format, *Brakes (ASE A5)*, keeps its issuer and drops the folded college record. Third, a
  course taught to the standard, *Brakes (ASE A5 standards)*, keeps the college and drops the certifying body's
  record. Otherwise every issuer is kept. The receipt names the rule for each title, any record a person set that a
  rule dropped (who and when, its before-value kept), and an exception for a person wherever the college stays
  issuer on a title holding industry-certification exhibits; an exception does not block. A lead and its confirmed
  siblings apply in one run, and `kb/_cred_rename_undo.py` reverses an apply from its receipt.
- **Built: the decision is stored, never written over a person's row** (#3116). The apply writes one
  `issuer_resolution` row per folded target in `kb_curation`, under the bot cohort `cred-fold-s638@bot`: the rule, the
  winner, the issuers the fold dropped, the additional issuers it kept, and `decided_at`, when the apply read the rows it
  decided on. It updates and deletes no issuer row a person wrote. Every reader resolves a title's issuer rows through
  one resolver, `effective_issuer` in `kb/fold_issuer.py`, ported once to the browser as `issuer_resolution.js`: an
  issuer row saved after `decided_at` wins; otherwise the winner stands, the dropped issuers are struck and the kept
  additional issuers stay, in the reference spelling. The nightly sync applies it while it builds the overlay and
  enforces it on `kb/credentials.json`, so a partial state repairs itself the next night. The Exhibits editor shows
  the winner with the line *Set by the fold on <date>* and names any stored row it superseded; saving there writes a
  person's row, which wins by its stamp.
- **Read-only so far.** No field stores a path or an assessor: both are derived at build time. MAP's id agrees with its
  own type code on all but 22 of about 7,000 civilian ids (COBIx, #3110).
- **Not built, each its own PR through Governance:** an issuer registry (official name, one short tag, aliases); the
  trainer move (ruling 5); the credential's kind, codes and versions as fields; Sierra reading aliases and paths;
  retiring `issuing_agency_additional_override` (109 titles carry a second issuer that this model reads as a
  local-exhibit fact).
- **Known limits:** the panel shows a title's exhibits by path as counts, one line a path. *Mirrored or not* and
  *apprenticeship* cannot be shown until MAP carries them. A title's tally reads the exhibits the adoption file and
  the reference's stamps list for it.
