---
title: Search the awarding body, not just the credential's name
created: 2026-08-13
updated: 2026-08-13
tags: [methodology, retrieval, sierra, credentials, false-absence]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/kb-notes/methodology-a-false-positive-costs-more-than-a-miss]]"
artifacts:
  - search_college_credentials (Supabase RPC)
  - cx_credential_match_tier, cx_needles (Supabase)
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Search the awarding body, not just the credential's name

> **One-sentence summary** — 90% of credentials in the catalogue have an issuer
> carrying a word that appears in neither the credential's title nor any of its
> raw variants, so a name-only search cannot find them by the term people
> actually use.

## Context

Sam asked Sierra, twice, as a student would:

> *"I have a journey worker license as Iron and Steel worker. What CPL can I get
> here?"*

She said there was nothing. Cerritos College has **thirteen** ironworker
credentials. He reported it the second time *after* three deploys had shipped
that day, none of which touched this path.

## The claim

**A credential is identified by its name, its variants, AND the body that
issues it — and the issuer is often the only field carrying the word a person
would search for.**

Three of Cerritos's thirteen are named `FIW Orientation`, `Foreman Training`
and `Post Tensioning 3`. Nothing in those titles says "iron". The only
ironworker signal is the issuer: **Field Ironworkers Local 416**. Before the
issuer rung existed, *no query could reach them* — not by title, not by
variant, not by topic.

This is not an edge case. Measured across the catalogue:

| | |
|---|---|
| credentials whose **issuer** carries a word absent from title *and* all variants | **1,795 of 1,987 (90%)** |
| credentials carrying a **curated title word** absent from every raw variant | **597 of 1,987 (30%)**, 465 adopted somewhere |

The second row is the mirror image and matters just as much: the curated layer
and the college's freehand entry frequently share no searchable word, so a
search over one can never find the other. Cerritos's ironworker exhibits are
recorded in the raw corpus as `FIW Orientation` and `IW- Mixed Base`.

## The rungs, and why order matters

Issuer search must sit **below** the title rungs, never merged into them:

1. exact title · 2. exact variant · 3. title substring · 4. variant substring
5. **issuer / trainer substring** · 6. concatenated search text

An issuer match is weaker evidence — many credentials share an issuer — so it
should surface only when nothing better does. And when it *is* the reason for a
hit, **say so**: the renderer emits *"(matched through the awarding body, not
the credential's own title)"*. Without that, the model reports `FIW
Orientation` as though the college named it for ironwork, putting words in the
college's mouth.

Ranking still scores the **best single name**, never the concatenation —
length-normalised similarity over a concatenated field ranks the best-curated
record worst.

## Two smaller traps in the same family

- **A whole-string matcher fails on the plural.** `ironworkers` returned 0 while
  `ironworker` returned 25. Fixed by folding singular/plural into a small set of
  candidate needles (`cx_needles`), mirroring what `synonymKeys()` already did
  for the synonym table.
- **A probe budget can drop the subject of the sentence.** The only route
  reaching *local* credentials had the narrowest budget of the three — 3 pairs
  and 3 singles. Sam's sentence extracts to `[journey, worker, license, iron,
  steel, worker]`, so the probes were `[journey worker, worker license, license
  iron, journey, worker, license]` and **"iron" was never asked**, while
  `search_credentials_any('iron')` returns 25 rows. Widened to 4/4/8.

## Why this class of bug deserves priority

A false zero is the worst answer a retrieval system can give. A wrong answer
invites correction; **"there is nothing" closes the conversation.** The student
goes away believing no credit exists, and nobody files feedback about a door
they were told was not there. Sam only caught it because he already knew the
answer.

Accordingly the rendered section carries an explicit instruction — *never say a
college has none of something when this section lists it* — and it is appended
**outside** the enrichment `try/catch`, so a downstream failure cannot silently
restore the false zero.

## See also

- [[docs/kb-notes/methodology-a-false-positive-costs-more-than-a-miss]] — the
  opposite guard; the two are in tension and both are load-bearing
- [[docs/sierra_credit_recs_lessons]]
