---
title: Common SUBJ vs Local SUBJ, and the real discipline↔subject invariant
created: 2026-06-23
updated: 2026-06-23
tags: [reference, m-id, subj4, discipline, c-id, ccn, curation, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/unverified_mid_renumber_scope]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
artifacts:
  - kb/reference/cid_descriptors.json
  - kb/reference/ccn_courses.json
  - kb/reference/subject_discipline_map.json
  - kb/discipline_canonical_subj4.json
  - kb/coci_minted_courses.json
  - unified_courses.js
---

# Common SUBJ vs Local SUBJ, and the real discipline↔subject invariant

> **One-sentence summary** — an M-ID carries two distinct "subjects" (the
> canonical **Common SUBJ** derived from its discipline, and the per-college
> **Local SUBJ** codes its members use); the only hard rule worth enforcing is
> the one the official authorities actually hold to — *each Common SUBJ belongs
> to exactly one discipline (collision-free)* — NOT "one discipline → one
> subject."

## Context

Recurring curator confusion (Sam, 2026-06-23): "we have so much variation in the
subject in the M-IDs," and "when I say subj I mean SUBJ4, not the local codes —
are we crossed?" We were: the CCR labeled both notions "Subject(s)." This note
fixes the vocabulary and records the audit that settled whether to force a strict
one-discipline→one-subject rule.

## The claim

### 1. Two different subjects live on every M-ID

| Term (new label) | Field | What it is | Variation |
|---|---|---|---|
| **Common SUBJ** | `subject_4letter` (the M-ID prefix, `subj4Of` in the CCR) | the canonical *shared* subject the course lives under | already ~1:1 with discipline |
| **Local SUBJ** | `subject` / the `r.subj` array (`subject_spread`) | each college's own code for the same course (ART/GRAF/MULT/PHOT for one Digital Imaging course) | **58% of M-IDs span >1** — honest per-college provenance |

The "variation" a curator feels on the merge screen is the **Local SUBJ** — it
is display-only provenance and does **not** affect identity. The **Common SUBJ**
layer is already canonical (the 2026-06-12 fold did this): of 144 disciplines,
142 use exactly one Common SUBJ; the only two that span more are the documented
umbrellas (**Foreign Languages** 25 · **Kinesiology** 2). **Zero** Common SUBJ
collisions.

### 2. The authorities do NOT hold to "one discipline → one subject"

Audit of the official references (`cid_descriptors.json` 495 descriptors,
`ccn_courses.json` 58 courses) mapped to MQ disciplines via
`subject_discipline_map.json`:

- **One MQ discipline routinely spans several official subjects** (the subject
  code is a sub-disciplinary grain *finer* than the MQ discipline): Ethnic
  Studies → `AFS`·`AINA`·`ASAM`·`CHS`; Agriculture → `AG-AB`·`AG-AS`·`AG-EH`·
  `AG-MA`·`AG-PS`; Music → `MUS`·`CMUS`·`MIS`; Business → `ACCT`·`BUS`·`BSOT`;
  CCN Mathematics → `MATH`·`STAT`.
- **Zero subject collisions** in both C-ID and CCN — every subject belongs to
  exactly one discipline.

So the authoritative invariant is **subject → discipline is many-to-one and
collision-free**, *not* one-to-one.

### 3. Recommendation — what to enforce, what to relax

- **HARD rule (enforce):** one Common SUBJ → one discipline (collision-free).
  This is the authorities' real rule, it's our `subject_collision_signal`
  watchdog, and we already pass it (~0). 
- **SOFT default (don't make it law):** one discipline → one Common SUBJ. We've
  already achieved it and it's a fine simplifying default, but a discipline
  carrying a few *meaningful* sub-subjects is authority-blessed — that's exactly
  what the Foreign Languages / Kinesiology umbrella exceptions are. Don't fight a
  genuine sub-disciplinary split; do collapse noise.
- **The lever for Common SUBJ is the discipline**, via
  `discipline_canonical_subj4.json` — there is no independent "set the subject"
  field, and adding one would create a second source of truth that fights the
  collision-free rule. "Change the subject on the fly" = set/fix the discipline
  (live), then materialize via the canonical-SUBJ4 fold (batched, Rule-7-clean).
- **Leave Local SUBJ variation alone** — it's provenance, not a defect.

### 4. Minting maps to Common SUBJ via discipline (with a timing caveat)

A minted unified course is intended to live under the **Common SUBJ derived from
its discipline**, with a system-assigned banded **number** (band = credit status
`1`/`9`; sequence = sorted normalized title, collision-managed) — e.g.
`PHOT Z9001`. The **title (name)** is curator-entered. Mechanically, the live
tab stamps a placeholder `UC-CUR-<ts>` at Confirm; the visible `SUBJ Z####` id is
assigned by the **batch re-mint** (the UC-CUR→Z pattern), not live, because the
sequence must be assigned globally to stay collision-free. So: the discipline
picked at mint *decides* the Common SUBJ; the id catches up at the batch run.
A merge **into an existing identity** adopts that survivor's Common SUBJ + number
immediately (no mint).

## How we got here

Audit scripts run 2026-06-23 against the committed references + minted-courses
file (counts only — never cat the large `coci_*.json`). The label cross-wiring
was found in `unified_courses.js`: the column header `Subject(s)` and the
`All subjects` filter showed the **Common SUBJ** (`subj4Of`), while the
disciplines legend and row tooltip showed **Local SUBJ** (`r.subj`) — same word,
two meanings. Renamed: column → **Common SUBJ**, filter → **All Common SUBJ**,
legend/tooltip/details → **Local SUBJ** (the `SUBJ4` label was an earlier-work
artifact, retired per Sam).

## When this applies (and when it doesn't)

- The MQ-discipline rollup of C-ID/CCN subjects is interpretive (their subject
  taxonomy ≠ the MQ discipline taxonomy), and `subject_discipline_map.json`
  coverage is partial (41/65 C-ID subjects) — the raw subject structure is the
  stronger evidence, not the mapped counts.
- The CSR tab (`canonical_subj4.js`) still uses "SUBJ4" in its own labels; this
  note's relabel was scoped to the CCR (`unified_courses.js`). Harmonize if the
  CSR is reworked.
- "One discipline → one Common SUBJ" being a soft default may change if more
  genuine umbrellas are recognized.

## See also

- `[[docs/unverified_mid_renumber_scope]]` — the batch re-mint that materializes
  Common SUBJ / numbers (SUBJ4 frozen there; a Common SUBJ change is a heavier
  separate re-mint).
- `[[docs/ccr_cluster_cleanup_lessons]]` — the CCR curation workstream.
- CLAUDE.md §11 — M-ID structural invariants (umbrella exceptions, subject
  collision signal).

---

*Authoring check: durable, reusable, distilled, self-contained.*
