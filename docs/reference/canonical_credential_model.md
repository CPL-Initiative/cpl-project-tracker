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
7. **A family is a field on a title, never a fold** (Sam, 2026-11-11, in session; `cpl_memory`
   `sam-bundle-family-is-a-field-2026-11-11`). Each ASE bundle stays its own canonical title, with its own adoption, and
   carries `family: ASE Certificate Bundles`; each test it names is a search alias, so a student who holds A4 finds every
   bundle with A4. `kb/reference/credential_families.json` declares the families, `kb_curation` `credential_family`
   tags a title (carried into `kb/credentials.json` by the nightly sync), and `kb/_family_tag_plan.py` turns his 31
   saved bundle folds into tags with a receipt and a rollback. A fold put unlike bundles on one card, and nine surfaces
   then read an A4+A5 college as holding T2+T8. The ASE Master titles stay their own titles.

## What is built, and what is not

- **Built:** the format (`kb/cert_naming.py`); the path and assessor read from the MAP id (`kb/exhibit_paths.py`),
  carried per title in `kb/exhibits_related.json` and drawn in the related-titles panel and the rename batch; a title
  in the format fills its issuer with ASE.
- **Read-only so far.** No field stores a path or an assessor: both are derived at build time. MAP's id agrees with its
  own type code on all but 22 of about 7,000 civilian ids (COBIx, #3110).
- **Not built, each its own PR through Governance:** an issuer registry (official name, one short tag, aliases); the
  trainer move (ruling 5); the credential's kind, codes and versions as fields; Sierra reading aliases and paths;
  retiring `issuing_agency_additional_override` (109 titles carry a second issuer that this model reads as a
  local-exhibit fact).
- **Known limits:** the panel shows a title's exhibits by path as counts, one line a path. *Mirrored or not* and
  *apprenticeship* cannot be shown until MAP carries them. A title's tally reads the exhibits the adoption file and
  the reference's stamps list for it.
