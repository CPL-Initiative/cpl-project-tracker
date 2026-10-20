---
title: CTDL classes for COBI's records, verified against Credential Engine's schema
created: 2026-10-20
updated: 2026-10-20
tags: [reference, ctdl, credential-engine, program-requirements, ccr, cpl, m-id]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/reference/lanes/ctdl-partner-exchange]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/reference/lanes/commons]]"
  - "[[reference-authority-anchored-credential-naming]]"
---

# CTDL classes for COBI's records, verified against Credential Engine's schema

> **One-sentence summary.** CTDL has a class for every layer COBI keeps: a `Pathway` whose
> `ComponentCondition.requiredNumber` carries a harvested program's blocks, a `TransferIntermediary` for a CCR
> common course, a `TransferValueProfile` for CPL credit, a `PriorLearningPolicy` for a college's CPL policy and an
> `IdentifierValue` for a COCI control number; the CTID is a version identifier, so only a stable record gets one.

## How to check a term

`credreg.net` is refused at this environment's proxy (403 on CONNECT, measured 2026-10-20), so the term pages cannot
be read from a session. Credential Engine's public repository `CredentialEngine/Schema-Development` carries the whole
vocabulary as JSON-LD: `src/SHACL/TestFiles/ctdl_20260626.jsonld` (1,032 terms) and `ctdlasn_20260626.jsonld`. Attach
it read-only (`add_repo`, then the anonymous clone it names) and read each term's `rdfs:comment`, `vann:usageNote`,
`vs:term_status` and `schema:domainIncludes`. Every quotation below comes from that dump, read at commit `d140111`.

Two names that sound right do not exist: `ceterms:SelectionComponent` and `ceterms:hasTransferIntermediary`. A choice
from a list is a `ComponentCondition` with `requiredNumber`.

## The mapping

| COBI record | CTDL | Term status | Who owns the record |
| --- | --- | --- | --- |
| A COCI course | `ceterms:Course`, the printed code as `codedNotation`, the control number as `identifier` | stable | the college |
| A COCI program and its award | `ceterms:AssociateDegree`, `ceterms:Certificate` and kin, beside `ceterms:LearningProgram` | stable; `LearningProgram`, `AssociateOfArtsDegree` and `AssociateOfScienceDegree` unstable | the college |
| A harvested program record | `ceterms:Pathway`; a `CourseComponent` per course, a `ComponentCondition` per block | stable; `proxyFor`, `Constraint` and `hasConstraint` unstable | the college, read by the CO |
| A course's outcomes | `ceasn:Competency` in a `ceasn:CompetencyFramework`, tied by `ceterms:teaches` | stable | college faculty (DR-24) |
| A CCR common course (an M-ID) | `ceterms:TransferIntermediary`, tied to its profiles by `intermediaryFor` | unstable | the CPL Initiative (DR-04) |
| A CPL credit recommendation or articulation | `ceterms:TransferValueProfile`: `transferValueFrom`, `transferValueFor`, `transferValue` | stable | the articulating college (DR-06) |
| A college's CPL policy | `ceterms:PriorLearningPolicy` | unstable | the college |
| A state number (COCI control number, C-ID) | `ceterms:identifier` → `ceterms:IdentifierValue` (`identifierTypeName`, `identifierValueCode`) | stable | the scheme's owner |

`TransferIntermediary`: *"Surrogate resource to which other resources are mapped in order to indicate their common
transferability."* Its usage note: *"Used when multiple resources such as courses are grouped together to indicate
they have mutually agreed upon transfer value."* That is the CCR's job, and C-ID's.

`TransferValueProfile`: *"Transfer Value Profile is used to describe learning value in contexts such as recognition of
prior learning or transfer. It does not describe the inherent credit value of a resource within the organization that
owns or offers it; use ceterms:creditValue with a Value Profile for that purpose."* A course's own units go in
`creditValue`; the units a student's prior learning earns toward it go in a profile.

## A program record as a Pathway

The harvest's record shape (`program_requirement_records.record.blocks`) maps one block at a time. Measured live on
2026-10-20 over 15,964 records at 114 colleges:

| Block rule | Blocks | CTDL |
| --- | --- | --- |
| `all` | 19,374 | a `ComponentCondition` whose `requiredNumber` equals its count of `targetComponent` |
| `choose_courses` | 8,482 | `requiredNumber` set to the N the catalog prints |
| `choose_units` | 7,603 | `hasConstraint` with a `Constraint` on the summed credit, `requiredConstraints` 1 (both unstable) |
| `recommended` | 631 | a `componentDesignation` on each course, no condition |

A course's alternatives (ENGL C1000 or ENGL C1000H) are a nested condition with `requiredNumber` 1, and an option
group is a parent condition with `requiredNumber` 1 over its blocks through `hasCondition`. Each course is a
`CourseComponent` whose `proxyFor` (unstable) names the published `Course`, with `creditValue` for its units and
`programTerm` for its place in a sequence. The award is the `CredentialComponent` the pathway names in `hasDestinationComponent`.

Credential Engine models its own examples this way. `PathwaysConditionsAndConstraints/Pathway-Examples/Kansas/
HutchinsonWeldingAAS.json` gives the welding A.A.S. core a condition with `requiredNumber` 7 and its option block
`requiredNumber` 1. `Archive/Bakersfield_AS_CS_pathway-CSU_transfer-v2.json` is a hand-built California pathway (30
`CourseComponent`s with terms, no conditions). The open modeling question is the unit minimum: 7,603 blocks, about a
fifth, wait on the `Constraint` terms, which sit in CE's conditions-and-constraints proposal.

## The CTID rule

The dump's description of `ceterms:ctid`: *"The CTID is the equivalent of a version identifier for the resource.
Different versions of a resource are considered distinct expressions and each must be assigned its own CTID. Each
version of a resource can have only one CTID assigned."* A published CTID stays attached to the version it named.

The M-ID layer is AI-assisted staging with re-mints permitted (CLAUDE.md Rule 7). Publishing it would leave each
re-mint behind as a superseded record in a national registry, so a common course gets a CTID only after the layer is
declared faculty-published. A crosswalk that stores an M-ID resolves it through `kb/alias_chain.py` before comparing
it with anything.

## What Credential Engine's extractor writes

`CredentialEngine/ctdl-xtra`, branch `xtra-backup`, read at `03a9a1b` (2026-10-14): xTRA crawls a catalog, and a model
extracts four separate lists (courses, learning programs, credentials, competencies) into Credential Registry
bulk-upload CSVs (`server/src/csv.ts`). The keys matter for any join:

- A course's External Identifier is the printed code, and a repeat in one export becomes `ACCT 101-2`.
- A credential's External Identifier is a new `randomUUID()` on every export.
- A program's identifier defaults to its name unless the page prints a code (`common/catalogueTypes.ts`).
- Competencies and frameworks get random UUIDs; a framework is named after its course or program.
- No list links to another. The program prompt tells the model to drop the requirements section, and the repo's own
  `doc/future-direction.md` names the missing hierarchy as the next step.

CE's review step, in Google Sheets, adds the CTIDs. Read 2026-10-20 across the 33 datasets its tracker links for the ten
colleges it marks Ready to Publish: course CTIDs at Antelope Valley, Berkeley City, Coastline and El Camino; credential
CTIDs at Antelope Valley, Berkeley City, Coastline and Taft, where all 237 equal the `@id`s Taft's own competency file
gives its frameworks and competencies. Only Berkeley City's credentials name their courses: 9 credentials, 17 course
CTIDs, in `Condition Profile: Target Learning Opportunity`. No file carries a COCI control number or a CIP code; C-ID
numbers appear only inside descriptions.

So an extract joins COCI only through a college and a normalized course code, and a second export of a college does not
share credential keys with the first. The COCI control numbers are the stable keys COBI can offer. The harvest's own
readings of course codes (slashed subjects, renumbered courses: `listed_key()`, `course_renumbers`) apply to xTRA's
codes unchanged, and they meet new shapes there: Norco's and Moreno Valley's catalog pages mask codes (`ARE-****825`; 112
of 1,028 and 75 of 1,001 course rows).
