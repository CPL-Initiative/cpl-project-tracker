# CPL CTDL Exchange

This repository holds the files that pass between the CPL Initiative of the California Community Colleges
Chancellor's Office, Credential Engine and WestEd, and the contract those files follow. Each organization writes
only its own folder. The CPL Initiative keeps its records in COBI, its own system; this repository is where a partner
files what it gives and picks up what COBI returns.

The aim is course and program data coded in the Credential Transparency Description Language (CTDL), so that what
California's community colleges offer can be read by other systems and published to the Credential Registry.

## Who owns what

| Lane | Owner | Writes |
| --- | --- | --- |
| Catalog extraction and Registry upload | Credential Engine | `inbound/credential-engine/` |
| The COCI feed | WestEd | `inbound/wested/` |
| The exchange and its contract | Malone, the CPL Initiative's technical lead | `contract/`, `decisions/`, `tools/`, `.github/` |
| The identifier crosswalk, sample Pathways and findings | COBI, for the CPL Initiative | `outbound/cobi/` |

Sam decides for the CPL Initiative, Malone runs this repository, and Credential Engine and WestEd each name one
technical contact. The four meet every two weeks while the pilot runs.

## Layout

```
contract/                                     the contract: field lists, identifier rules, the CTDL mapping, schemas
inbound/credential-engine/<college>/<date>/   xTRA exports, and CTIDs once published
inbound/wested/coci/<date>/                   COCI extracts
outbound/cobi/<date>/                         the identifier crosswalk, sample Pathways, findings
decisions/NNNN-<slug>.md                      one file per decision
tools/check_drop.py                           the check CI runs on every pull request
CLAUDE.md                                     the rules any Claude session reads first, in any organization
```

## Filing a drop

1. Branch from `main` with your prefix: `ce/`, `wested/` or `cobi/`.
2. Add one new dated folder under your path, for example `inbound/credential-engine/antelope-valley/2026-10-27/`.
3. Put the files in it with a `manifest.json` that lists each one (see `contract/README.md`).
4. Run `python3 tools/check_drop.py` and open a pull request. CI runs the same check.

A drop is never edited after it merges. A correction is a new dated folder whose manifest names the drop it replaces
in `supersedes`.

## Changing the contract

A change to `contract/` is a pull request that Malone approves. A change to an identifier rule
(`contract/identifiers.md`) also goes to Sam for a decision before it merges, and is recorded in `decisions/`. Each
contract version is tagged `contract-vN`.

## What never enters this repository

- A student record, or anything that identifies a student.
- A secret of any kind. The Credential Registry API key stays a secret of the CPL Initiative's own repository.
- COBI's common course identifiers (M-IDs) and its other staging keys, until the CPL Initiative declares them
  faculty-published (decision 0001).

## Decisions

A decision exists once it is written in `decisions/` and merged. Chat, email and meeting notes inform a decision; the
file records it.
