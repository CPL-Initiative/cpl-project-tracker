---
title: What might qualify is a different question from who already grants it — answer it from the target program's course list
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, sierra, retrieval, alignment, prospective-cpl, geography, smoke-test]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-place-is-an-anchor-not-a-college]]"
  - "[[methodology-a-prefix-match-on-a-stem-is-not-a-match-on-the-word]]"
  - "[[methodology-assert-what-retrieval-returns]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/smoke_test.sh
  - tests/sierra_prospective_credit.test.js
---

# What might qualify is a different question from who already grants it — answer it from the target program's course list

> **One-sentence summary** — A visitor who holds a credential and asks which courses in a program it might count toward is asking a PROSPECTIVE question, answered from the target program's own course list at the nearest colleges with the existing articulations as precedent, and a correct answer to "who already grants credit for it" reads as a miss.

## Context

Sam read cpl-chat v67's answer to his Orange County question and the v68
candidate's, and corrected how both sessions had read the ask (2026-09-18,
verbatim):

> I was asking her to compare CNA courses to LVN courses so the user could ask
> for credit. Both she and the last session seemed to confuse this ask with the
> typical ask for which existing exhibits offer CPL for CNA, which is not the
> question. I know that few, perhaps just one, college has articulated CNA for
> CPL, but that's not the concern. The question is what might qualify so the
> user could ask for it at a college that has not yet granted it.

Every fact in v68's answer was true. It named the Orange County colleges, said
none had articulated CNA-to-LVN credit, and cited two LVN-credit precedents. It
answered the exhibit question, and the exhibit question was not asked.

## What was measured

- **No route carried the target program's course list.** `coci_college_offerings`
  holds a sample of courses per (college × TOP); the full lists sit in
  `chatbox_college_courses` (141,696 rows over 120 colleges), and only the
  alignment route read them, for a NAMED college only. The Vocational Nursing
  programs nearest Orange County each carry the course the question is about:
  Pasadena NURS 102 *Fundamentals of Vocational Nursing*, Southwestern VN 10
  *Fundamentals of Nursing* and VN 8 *Fundamentals of Nursing (CNA)*, Chaffey
  NURVN 403 *Fundamentals of Nursing* beside its NURVN 414, Citrus VNRS 150,
  Long Beach City VN 215 and VN 220 *Transition to Vocational Nursing*, Rio
  Hondo VN 61 *Basic Fundamentals of Nursing*. None of them reached the model.
- **The alignment route is the wrong instrument for the target program.**
  Pointed at Saddleback for *Acute Care Nursing Assistant*, it proposed
  Saddleback's own noncredit CNA courses (CNA 425NC, 426NC, 427NC) at scores of
  0.61 to 0.62: the courses a CNA holder already has. It scores a college's
  courses against the precedent's course TITLE, and Chaffey named its course
  unusually. At Long Beach City the same scoring ranked *Math Prep for
  Vocational Nursing Program* above *Fundamentals of Nursing*.
- **Orange County has no Vocational Nursing entry program in COCI, and the
  ranking had no notion of "nearest".** The anchored offerings query returns 0
  rows for TOP 1230.20 in Orange County (the county's "LVN" programs are RN-coded
  bridges), and `college_geo` puts Orange County in a region of one county. So
  once the county was exhausted every remaining college tied at proximity band
  0 and volume decided: Sacramento City (30 courses) and Butte (25) ahead of
  Pasadena (24), Southwestern (23), Chaffey (22), Citrus (20), Long Beach City
  (16) and Rio Hondo (8).
- **A false friend switched the precedents off.** `search_statewide_recommendations`
  matches tier 3 by `title LIKE '%needle%'`, so the probe `cna` returned Cisco
  Certified Network Associate (CCNA), the "cna" inside "ccna". One statewide hit
  meant `fetchAnyCredentials` never ran, and the CNA credentials, the LVN
  license credentials (3 adopters) and the only CNA-to-LVN precedent in MAP
  (Chaffey, 6 units in NURVN 414) never reached the model. Same family as
  `practical:*` becoming `'practic':*`.

## The rule

1. **Read the question's shape before its nouns.** "Who already grants credit
   for X" and "which courses could my X count toward, where nobody has granted
   it yet" share every keyword and want different instruments. The second is
   answered by the TARGET program's course list; exhibits and precedents are its
   evidence, never its answer.
2. **Carry the course list, and let the model compare.** For every TOP program
   the question matched as a core discipline, the nearest colleges that teach
   it (three per program) and their full course list for that program (twelve
   courses per college, the remainder counted). The rule tells the model to
   read for the entry-level courses, to say why each is a candidate, to treat
   the program that trains the held credential as background, and to present
   every match as a request to the college's CPL coordinator, never a
   determination.
3. **"Nearest" needs a neighbor.** A static map of which regions border which
   (`REGION_NEIGHBORS`, asserted symmetric) gives proximity a fourth band:
   county 3, region 2, neighboring region 1, elsewhere 0. Volume decides only
   within a band. The catalog builders' in-place thresholds moved with the bands.
4. **A substring inside a word is not a match on the word.** A tier-3 or tier-4
   credential hit is kept only when the probe appears as a whole word in the text
   that matched. Exact hits and fuzzy tiers are untouched, and a tier-4 row that
   cannot say which variant matched is kept, because dropping it would re-create
   the false zero the local route exists to end.
5. **Both credential routes run, always, concurrently.** A statewide hit no
   longer switches the local route off; the context builder already labels the
   two lists, and Sam's statewide-only rule governs the recommendation lines
   within one credential, not which credentials are named.

## How it is guarded

- `tests/sierra_prospective_credit.test.js` (60): the neighbor map's symmetry,
  the four bands, the (college × program) picks on the real Orange County rows
  (in the county first, then neighbors, never volume over proximity, the RN
  bridge program excluded), the block's "NO college in Orange County teaches
  this program" line, the cap and its remainder, the noncredit mark, the
  cross-product filter, the false-friend cases, and the wiring.
- Smoke mode 7c reads for Sam's bar: the answer names a Vocational Nursing
  course from the prospective lists and frames the match as a request.
- `deno check` stays at the 15 pre-existing strict-mode errors.

## What it does not do yet

- The picks within a band order by how much of the program a college teaches,
  which is a proxy for nothing. A distance table (college to college, or county
  centroid to county centroid) would let "nearest" mean nearest.
- The block fires whenever a credential matched, a place or college anchored the
  question, and the catalog matched a core program. It does not read the
  question for "I hold X". A "which colleges teach welding" question from a named
  place with a welding credential in play carries the course lists too; the rule
  tells the model when they are the answer.
- The alignment route still answers only for a named college. The prospective
  block is the student's side of that lane; the faculty side ("which of MY
  courses should I articulate") is unchanged.
- 381 of the 141,696 course titles carry double-encoded UTF-8 (`Ã¢â‚¬â€œ` for an
  en dash, 84 colleges; 186 of 16,097 offerings rows too; 0 program titles).
  Pasadena's NURS 102 renders that way to students today. The loader's fix is
  queued.
