---
title: A C-ID claim in COCI is a college's word, not ASCCC's
created: 2026-11-06
updated: 2026-11-06
tags: [methodology, c-id, identity, cpl-recommendations]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - kb/reference/cid_claim_holds.json
  - kb/_apply_cid_claim_holds.py
  - kb/_audit_cid_claims.py
---

# A C-ID claim in COCI is a college's word, not ASCCC's

> A college types its course's C-ID into COCI with no gatekeeper; treat that entry as a claim to corroborate, and set it
> aside only when independent signals agree it is wrong.

## Context

Moreno Valley College's COCI row for HES 1 Health Science names C-ID HIST 150 (World History to 1500). The ASCCC
approval table holds no such approval. The identity layer trusted the claim, so Moreno Valley's Basic Military Training
articulation to HES 1 read as a peer articulation to every world history course: 106 colleges' CPL Pathways visuals, the
aligned view, and Sierra's alignment tool, which took a recommendation's C-ID from the first peer row that had one. Sam
saw it on Sierra College's visual (2026-11-06): *"the HIST course should not be recommend for Basic Training."*

## The rule

1. A COCI CIDNumber is the same kind of input as a TOP code: entered by the college, unchecked. The ASCCC approval table
   is the authority; a COCI claim it does not hold is unconfirmed, not wrong.
2. Set a claim aside only when four signals agree: no ASCCC approval; the course's subject shared by no other member; its
   TOP family apart from the group's; its title sharing no content word with any other member. Each alone flags real
   cross-listings (Medical Terminology taught under business; networking under electronics). Measured statewide
   2026-11-06: two signals, 214 members; four, 2.
3. Fix the claim at the source (a hold the member export honors, and an apply that moves the record, with a receipt), and
   leave each consumer's display rule alone. Sierra still flags a divergent C-ID rather than dropping it.
4. Give the held course the home its sister colleges give the same course, and ask the college to correct COCI.

## Where it lives

`kb/reference/cid_claim_holds.json` (the holds, each with its signals and home), `kb/_apply_cid_claim_holds.py` (moves
records, receipt, `--rollback`), `kb/_audit_cid_claims.py` (run daily; new findings land in `kb/cid_claim_audit.json`).
