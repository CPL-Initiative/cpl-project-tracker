---
title: Reference — The P1 completion-data gap (why completions aren't in MAP, and the strategy to close it)
created: 2026-06-11
updated: 2026-06-11
tags: [reference, funding, implementation-funding, completions, mis, datamart, cccapply, identity, incentive-design]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/funding_priority_metrics_scope]]"
  - "[[adr-funding-priority-metrics-privacy]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - funding/CPL_Funding_Model_2026.xlsx (P1 metric definition, rev2)
  - docs/funding_priority_metrics_scope.md (the build this gates)
---

# The P1 completion-data gap

> **One-sentence summary** — Priority 1 ("documented completion with ≥6
> transcribed CPL units in MAP") is deliberately kept as a funding metric
> even though it cannot currently be measured: the gap is an **incentive**
> to build the identity + completion data infrastructure, and the real
> blocker is the student-identity join key, not completions themselves.

## Why the gap exists (Sam, 2026-06-11)

- **Colleges do not record completions in MAP** — and asking them to would
  be duplicative: completions already live in their SIS (the three
  platforms across CCC: **Banner, Colleague/Datatel, PeopleSoft**).
- **Completion aggregates exist on the CCCCO DataMart** (the MIS award
  data), but there is **no way yet to tie them to MAP student records**.
- **MAP's Student ID field is spotty** — it *could* key back to MIS if
  consistently populated, but it is far from consistent.
- **CCCApply integration (future)** will fix identity at the authoritative
  source — but only *going forward*, at application time; historical
  records stay spotty.
- **Probable next operational fix**: a business process to periodically
  pull college SIS completion data into MAP via a routine.

## The deliberate decision

Sam considered changing the P1 outcome and **kept it as an incentive to
close this critical gap**. Strategic goal behind it: CAEL-WICHE studies
show CPL recipients retain and complete at higher rates than
non-recipients — California wants to **demonstrate that effect with CA
data**.

## Strategy (recommended 2026-06-11, session review)

1. **Aim the incentive at the join key, not at completions.** Every
   closure path (SIS pull, MIS match, CCCApply) converges on "MAP records
   need a resolvable CCCID." P3's metric already pays for
   *documentability/interoperability* — so make **identity hygiene an
   explicit P3 sub-indicator** ("% of MAP student records with a valid
   CCCID / SIS-resolvable ID"). Colleges get something actionable this
   year; P1 becomes measurable as a by-product; P1 itself stays the north
   star.
2. **Publish a P1 maturity ladder** in the funding guidance rather than a
   silent gap: Y1 — P1 unmeasured, identity-coverage counts instead; Y2 —
   completions via the periodic ingestion routine; Y3 — CCCID-keyed
   automated match post-CCCApply. The incentive survives; no college is
   penalized by the state's own data gap; nobody disputes dollars against
   an unmeasurable metric.
3. **Try the CO-level match-back before a 116-college SIS routine.**
   Colleges already report completions upward (the MIS SP/award
   referential files behind the DataMart). A Chancellor's-Office-level
   match-back — MAP sends its student list with whatever IDs it holds; CO
   matches against MIS, where authoritative identifiers live, and returns
   flags/aggregates under a data-sharing agreement — is ONE integration at
   the layer where identity is already solved, vs ~116 integrations across
   three SIS platforms.
4. **Decouple the CAEL-WICHE replication from the operational pipeline —
   run it now** as a one-time matched-cohort research pull (MAP CPL
   recipients ≥6 units vs matched non-recipients; completion/retention
   from MIS; MOU + aggregate publication). Even 30-40% ID coverage on
   ~47k students is a 15-19k matchable sample — credible, with the
   selection-bias caveat handled by matching on observables. **Evidence
   first, plumbing second**: the study's headline becomes the advocacy
   engine that funds the integration.
5. **Don't oversell CCCApply for the retrospective question** — it is
   forward-only; the historical effect study still needs the match-back.

## Procedures (when each path activates)

- **First step regardless of path**: get an **ID-coverage report** out of
  MAP (vendor query — NOT the public pipeline; our daily fetch
  deliberately excludes identity columns per the standing PII guard).
- **If the SIS routine proceeds**: pilot with three colleges (one per
  platform); ONE lean canonical extract spec — (student ID/CCCID, award
  type, program/TOP code, award date, term); quarterly cadence; reconcile
  counts against DataMart aggregates as the QA gate.
- **Provenance stamps from day one** of any P1 ingestion: source system +
  extract date per record ("SIS extract 2027-01" vs "manual entry"), so
  the dashboard can tier confidence — the discipline-provenance `⚙` badge
  pattern, reused. Money attached to a newly-openable reporting channel
  predictably attracts optimistic self-reporting; provenance is the
  mitigation.
- **Dashboard interim state**: render P1 as a labeled state — "awaiting
  completion data (incentive metric)" — never a blank cell. A visible,
  named gap on a public dashboard IS the incentive working.

## See also

- `[[docs/funding_priority_metrics_scope]]` — the v2 build this gates (P2/P3 ship first)
- `[[adr-funding-priority-metrics-privacy]]` — the privacy rules any P1 data will inherit
- CAEL / WICHE CPL outcome studies — the effect CA aims to replicate

---

*Authoring check: durable (the gap + strategy outlive the build), reusable
(any state CPL system hits the same SIS/identity wall), distilled (one
problem, its anatomy, the ladder out), self-contained.*
