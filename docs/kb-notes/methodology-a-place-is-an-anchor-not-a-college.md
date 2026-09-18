---
title: A place is an anchor, not a college — and the words that describe the ask are not the topic
created: 2026-09-18
updated: 2026-09-18
tags: [methodology, sierra, retrieval, geography, synonyms, smoke-test, supabase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-retrieval-route-costs-what-the-synonym-table-decides]]"
  - "[[methodology-assert-what-retrieval-returns]]"
  - "[[methodology-a-code-cannot-say-who-a-program-is-for]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/supabase_search_college_programs.sql
  - chatbox/supabase_search_college_offerings.sql
  - chatbox/smoke_test.sh
  - tests/sierra_place_anchor.test.js
---

# A place is an anchor, not a college — and the words that describe the ask are not the topic

> **One-sentence summary** — When a question names a county or a region, that name is the geography every list should rank against and never a token to match a college name on; and a ranking applied after a database limit cannot rescue a local college the limit already cut, so the anchor belongs inside the query.

## Context

Sam read cpl-chat v67's answer to a student question and said *"Still not able
to analyze course and program data."* The question, verbatim from
`chat_interactions` (`051d37b6`, 2026-09-18 01:31Z): *"I have a cna cert and I
want to go to a college in orange county. What CNA courses at the colleges
match LVN courses so I can ask for credit?"* Sierra profiled Orange Coast
College and North Orange Continuing Education, listed LVN programs in
Sacramento, Butte, Humboldt, Madera and Siskiyou counties, and guessed at
Santa Ana "based on typical OC nursing offerings". Every retrieval route had
fired (`rules_fired` carried `offerings` and `programs`; the function logs
carried no timeout). The data reached the model. The anchor and the terms were
wrong.

## What was measured

- `extractTopicKeywords` gave `[cna, want, orange, county, cna, courses, match,
  lvn, courses, ask]`. Three of ten named the topic.
- `askedGeo` came only from a RESOLVED college. "Orange County" is a place,
  so it anchored nothing, and both catalog builders fell back to volume order
  with a ten-college cap. The Orange County programs sat at positions 46,
  55–57, 114 and 119–120 of 139 in the RPC's own order.
- "orange" ilike-matched Orange Coast College and North Orange Continuing
  Education, so the answer was about two colleges nobody had asked for.
- `cna` had no synonym key (it was a VALUE in the `nursing` and `nurse`
  families), so only titles that spell "CNA" matched. Golden West's and
  Saddleback's "Certified Nurse Assistant" and Santa Ana's "Nursing
  Assistant" did not.
- The offerings builder dropped every phrase (`singleTokenTerms`), so an LVN
  question reached the Vocational Nursing TOP (44 colleges) only where a
  course title happened to spell "LVN": the RN bridges. No LVN course list
  ever reached the model.
- The credential probes are built from the first four keywords. They were
  spent on "cna want", "want orange", "orange county" and "county cna"; "lvn"
  was never asked, and the one CNA-to-LVN precedent in MAP (Chaffey, 6 units
  in NURVN 414 *Acute Care Nursing Assistant: Vocational Nursing Foundations*)
  never reached the model.
- The fact the student needed: no Orange County college confers a Vocational
  Nursing award in the current COCI export. The county's "LVN" programs are
  LVN-to-RN bridges (Saddleback, Golden West, Cypress). The nearest Vocational
  Nursing programs are in Los Angeles County (Long Beach City, Rio Hondo,
  Citrus, Pasadena, LA Mission, West LA, Antelope Valley) and the Inland
  Empire (Chaffey, Crafton Hills, Riverside City, Mt. San Jacinto). Nothing
  in the context said so, and the rules told the model the list was not
  exhaustive, so it hedged instead.

## The rule

1. **A place named in the question is an anchor.** `college_geo` already holds
   a county and a region for every college. Recognize the name
   (`resolveAskedPlace`), anchor `askedGeo` on it, and STRIP it from the text
   the college matcher and the keyword routes see. A named college still wins:
   its own geography is the anchor. A county needs the word "county" beside
   it ("Riverside" alone is a college); a region matches as a bare phrase of
   two or more words and never one that is part of a college name ("Los
   Angeles" is in nine). A place named in an earlier turn still counts.
2. **The anchor goes inside the query.** A proximity sort applied after
   `result_limit` cannot restore a row the limit cut. `anchor_county` and
   `anchor_region` are the leading ORDER BY keys in both catalog RPCs, never a
   filter, so a county with no matching college still returns the nearest.
   Measured: the same row SET with and without the anchor; Orange County's
   rows move from positions 46–120 to 1–16.
3. **Tell the model the fact, in words.** When no college in the place
   matches, the catalog builders say so (`NO college in Orange County has a
   matching program in the current COCI program export`). Without that line
   the "not exhaustive" rule does its job and the model hedges.
4. **The words that describe the ASK are stop words.** *want, ask, request,
   match, course, program* and the contraction stems name the shape of the
   question, never its subject, and every one of them was a live search term
   and a spent probe.
5. **A synonym family for the acronym the student writes.** `cna` expands to
   phrases only (`nurse assistant`, `certified nurse assistant`) for the same
   reason `lvn` does: "assistant" alone is Medical Assisting, Dental Assistant
   and Administrative Assistant. The offerings builder can express a phrase as
   `nurse:* <-> assistant:*` (verified: `to_tsquery` parses it, and it matches
   "Nursing Assistant" and "Certified Nursing Assistant (CNA)" under the
   english stemmer).
6. **Phrase synonyms ride along as credential probes.** The curated names use
   the long form; a phrase probe is precise where a single-token synonym
   ("health", "clinical") would drag in neighbors. `search_credentials_any
   ('nursing assistant')` is what finds the Chaffey precedent.

## How it is guarded

- `tests/sierra_place_anchor.test.js` (77): the resolver, the block, both
  builders' ordering and their "none in the place" lines, the phrase builder,
  the family, the stop words, the smoke transcriptions, and the wiring.
- Smoke mode 7c: the programs RPC leads with contiguous Orange County rows,
  the offerings phrase query reaches the Vocational Nursing TOP and leads with
  Orange County, and the county question's answer names the place and a
  college from the anchored sets.
- `verify_search_college_programs.sql` Part E and
  `verify_search_college_offerings.sql`: order changes, set does not; one
  signature each (the overload trap).

## What it does not do yet

- A college-derived anchor is still applied client-side, after the limit. The
  place anchor is known before the retrieval batch; a college is resolved
  inside it. Chaining detection ahead of the catalog routes would close this
  for the college case too, at the cost of detection's round trips on the
  catalog path.
- A bare city or a county without the word "county" ("I live in San Diego")
  anchors nothing. Ambiguous with the college names by design; a city table
  would be the next instrument.
- The alignment route (which of MY courses match) still needs a named
  college; for a place it is the credential precedents and the course lines
  in the catalog sections that carry the course-level answer.
