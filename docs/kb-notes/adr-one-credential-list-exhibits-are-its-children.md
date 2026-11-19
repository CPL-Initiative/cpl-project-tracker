---
title: One credential list, with exhibits as its children
created: 2026-11-19
updated: 2026-11-19
tags: [adr, credentials, exhibits, ctdl, commons, identity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/ctdl-partner-exchange]]"
  - "[[docs/reference/lanes/commons]]"
  - "[[docs/reference/lanes/eacr-exhibit-cr-adoption]]"
artifacts:
  - kb/credentials.json
  - kb/unified_titles.json
  - kb/exhibit_cert_links.json
---

# One credential list, with exhibits as its children

> **One-sentence summary**: COBI keeps one list of credentials under its own stable id; a MAP exhibit is one
> evaluation of a credential at a point in time, so the chain runs credential, exhibits, credit recommendations,
> articulations, and each credential's status is derived from that chain.

## Context

Sam and COBIx worked this out on 2026-11-19, 1 to 2:45 AM Pacific. COBIx relayed it on issue #3533 (comment
7006905282, posted 10:48Z) and asked that it be filed. The text is filed verbatim in the vault as
`CPLBrain/raw/2026-11-19-braindump-credentials-exhibits-ctdl-commons.md`, with its wiki page
`wiki/concepts/credential-list.md`. Sam's calls are final. The build waits on a green `main` and on #3528, #3544 and
#3229 landing (#3544 and #3528 merged in S684; #3229 had not).

## Decisions (Sam's, 2026-11-19)

1. **One credential list.** Exhibits and the credential catalog are one thing at different stages. Each credential
   carries a derived status, never hand-typed: *No credit recommendation yet*, *Has a credit recommendation*, or
   *Colleges give credit for it (N colleges)*.
2. **Exhibits are child records of a credential.** A MAP exhibit is one evaluation (ACE, a workgroup, a college) of a
   credential at a point in time. It carries one or more credit recommendations and the local titles.
3. **COBI owns a stable credential id, and it is the primary key.** A credential-to-MAP-exhibit link table replaces the
   title-text joins (today `credential_reference.js`, `kb/_build_exhibit_cert_links.py` and `kb/_build_credential_recs.py`
   join on titles).
4. **A CTDL id field on each credential, filled where one exists.** CTDL never replaces the COBI id. Sam's update at
   2:45 AM: keep the field, but **do not bulk-pull more Credential Engine CTIDs yet**.
5. **Design for porting to MAP by API**, lined up with Malone's new MAP exhibit module.
6. **CPL Commons and CDC merge into one page named CPL Commons**, with one ETA widget showing two dates (collections
   done, curation done) and six cards in Collect, Curate and Connect groups. The 72% card, the false *stalled* alert
   and the First Light pop-up go.
7. **Order of work:** the stable id for every canonical; the link table; the `ctdl_id` field; the id and schema design
   for MAP; then the status field, then the page.

**Pending:** reversing S661's one-ETA-per-page rule for the merged page waits on Sam's OK. **Open question for
Malone:** does COBI get CTIDs minted under its own organization when it publishes to Credential Engine?

## What must hold through the build

- Count once per credential everywhere. *Exhibits* is a filter, never a second total.
- CPL Pathways' `exhibitCount` and `openExhibits` (`program_requirements.js`, `kb/_build_roep_display.py`) count what
  is articulated at that college only; the recommendations and `credentials_n` fallback goes.
- Potential rows stay out of the missing-M-ID and missing-subject metrics, the SLO neighbors and the AI sort.
- The 511 issuers Sam reviewed carry over settled; the `kb_curation` rows (`saveRow`, `postRows`, `saveCredRow`)
  migrate to the id (Rule 10 applies to that migration).
- Trainer-as-issuer entries move to `training_agency` (the 2026-11-11 ruling); blank issuers are filled; the ASE S5,
  A4 and H8 duplicate ids, G1, and three exhibit ids under two canonicals are resolved.
- College-issued graded exhibits (credit by exam, portfolio) join as local credentials with the college as issuer.
- The rename and old-title queues keep pointing at the right rows.
- `_sync_credential_catalog.py` keeps its small-cell suppression (below 10).

## Findings (COBIx's measurements of 2026-11-19, on `main` fa5a5c10)

These figures are COBIx's, taken that day; re-measure before citing any of them.

- **Credential Engine has no cross-organization canon** (Sam's observation). A CTID is unique within its publisher,
  so one credential published by two organizations gets two CTIDs. COBI's list fills that gap.
- **CTDL coverage:** 51 of 7,728 catalog rows carry a CTID (50 unique; 19 articulated, 3 a MAP exhibit not yet
  articulated, 29 marked not in MAP, though the catalog's MAP join is known to miss some). `kb/credentials.json`
  (2,872 exhibit canonicals) carries none. The broader Credential Engine capture matched 974 of 6,738 members (14.5%),
  and those ids were not kept.
- **Fan-outs:** 477 canonicals carry more than one MAP exhibit id (3,527 ids behind 6,057 local titles); 4,229 of
  6,936 exhibits with credit recommendation lines carry more than one (median 2, maximum 98).
- **About half of exhibits are college-issued** (credit by exam or portfolio on a local course: 1,492 canonicals).
- **The bridge is thin:** `kb/exhibit_cert_links.json` links 238 catalog certificates to 286 of 2,872 canonicals.
- **Issuers:** 163 canonicals name a trainer (high school, USD, ROP, JATC) as issuer; 81 issuers are blank.
- **Two credit recommendation counts measure different things:** 17,466 (MAP's Custom Reporting Module) and 29,665
  unique exhibit-and-wording pairs. Any card that shows one names which.

## When this applies (and when it doesn't)

It governs every surface that counts or lists credentials, exhibits or credit recommendations: the Commons, EACR,
CPL Pathways, Sierra's corpus and the CTDL exchange. It does not settle what an exhibit's credit recommendation says;
that stays with the Common CR Reference and the Military CR Reference lanes. A high school named as issuer follows
Sam's high school articulation rule of 2026-11-18 (*"Don't add the high school as a second issuer"*).

## See also

- [`lanes/ctdl-partner-exchange`](../reference/lanes/ctdl-partner-exchange.md): the Credential Engine and WestEd
  exchange, waiting on Malone.
- [`lanes/commons`](../reference/lanes/commons.md): the CPL Commons page.
- Issue #3533, comment 7006905282: the relay.
