# The CTDL mapping

Each kind of record the exchange carries has a CTDL class. Terms were read from Credential Engine's own schema dump,
`CredentialEngine/Schema-Development` at commit `d140111`, file `src/SHACL/TestFiles/ctdl_20260626.jsonld`. A term
marked unstable there is used here only where no stable term carries the meaning, and the row says so.

## Records and classes

| Record | CTDL | Term status | Who owns the record |
| --- | --- | --- | --- |
| A COCI course | `ceterms:Course`; the printed code as `ceterms:codedNotation`, the control number as `ceterms:identifier` | stable | the college |
| A COCI program and its award | `ceterms:AssociateDegree`, `ceterms:Certificate` and kin, beside `ceterms:LearningProgram` | stable; `LearningProgram`, `AssociateOfArtsDegree` and `AssociateOfScienceDegree` unstable | the college |
| A program's requirements | `ceterms:Pathway`; a `ceterms:CourseComponent` per course, a `ceterms:ComponentCondition` per block | stable; `proxyFor`, `Constraint` and `hasConstraint` unstable | the college, read by the CO |
| A course's outcomes | `ceasn:Competency` in a `ceasn:CompetencyFramework`, tied by `ceterms:teaches` | stable | college faculty |
| A state number (COCI control number, C-ID) | `ceterms:identifier` holding a `ceterms:IdentifierValue` (`identifierTypeName`, `identifierValueCode`) | stable | the scheme's owner |
| A common course across colleges | `ceterms:TransferIntermediary`, tied to its profiles by `intermediaryFor` | unstable | the CPL Initiative; held out of the exchange (`identifiers.md`) |
| Credit for prior learning | `ceterms:TransferValueProfile`: `transferValueFrom`, `transferValueFor`, `transferValue` | stable | the articulating college; after the pilot |
| A college's CPL policy | `ceterms:PriorLearningPolicy` | unstable | the college; after the pilot |

Two names that sound right are not CTDL terms: `ceterms:SelectionComponent` and `ceterms:hasTransferIntermediary`.

## A state number on a resource

```json
"ceterms:identifier": [{
  "@type": "ceterms:IdentifierValue",
  "ceterms:identifierTypeName": {"en-US": "COCI Course Control Number"},
  "ceterms:identifierValueCode": "CCC000425258"
}]
```

The program form uses `COCI Program Control Number` and the five-digit number.

## A program's requirements as a Pathway

COBI keeps each program's requirements as blocks, each with a rule. Measured on 2026-10-20 over 15,964 program
records at 114 colleges:

| Block rule | Blocks | CTDL |
| --- | --- | --- |
| `all` | 19,374 | a `ComponentCondition` whose `requiredNumber` equals its count of `targetComponent` |
| `choose_courses` | 8,482 | a `ComponentCondition` with `requiredNumber` set to the number the catalog prints |
| `choose_units` | 7,603 | `hasConstraint` with a `Constraint` on the summed credit, `requiredConstraints` 1 (both unstable) |
| `recommended` | 631 | a `componentDesignation` on each course, and no condition |

A course with alternatives (ENGL C1000 or ENGL C1000H) is a nested condition with `requiredNumber` 1. An option group
is a parent condition with `requiredNumber` 1 over its blocks, through `hasCondition`. Each course is a
`CourseComponent` whose `proxyFor` (unstable) names the published `Course`, with `creditValue` for its units and
`programTerm` for its place in a sequence. The award is the `CredentialComponent` the pathway names in
`hasDestinationComponent`.

Credential Engine models its own examples this way: `PathwaysConditionsAndConstraints/Pathway-Examples/Kansas/
HutchinsonWeldingAAS.json` gives a welding A.A.S. core `requiredNumber` 7 and its option block `requiredNumber` 1.

**Open for version 1.** The unit minimum, about a fifth of all blocks, depends on the `Constraint` terms in Credential
Engine's conditions-and-constraints proposal. Version 0 writes them as above and marks the Pathway file's notes
accordingly; version 1 follows whatever the Registry accepts.

## JSON-LD conventions

- A Pathway file is one JSON-LD document with `@context` `https://credreg.net/ctdl/schema/context/json` and a
  `@graph` holding the `ceterms:Pathway` node and every component it names.
- Before a CTID exists, a node's `@id` is a blank-node label scoped to the file (`_:p02964`, `_:c-CCC000425258`).
- Language maps use `en-US`.
