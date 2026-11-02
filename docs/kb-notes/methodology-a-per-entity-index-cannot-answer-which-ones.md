---
title: A per-entity index cannot answer "which ones"
created: 2026-11-02
updated: 2026-11-02
tags: [methodology, sierra, retrieval, funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_assistant_lessons]]"
artifacts:
  - scripts/funding_sierra_note.js
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# A per-entity index cannot answer "which ones"

> **When a corpus files one section per entity and routes a question to a section by the entity it names, a question that names none (which colleges, how many, list them) reaches no section; it needs an aggregate section of its own and a route to it.**

## Context

Sierra's funding note gives each of the 118 institutions its own section, and cpl-chat reads a section by heading when a question names that college. Asked which colleges had not met the 75 percent JST condition, she answered that she had no per-college figures, while every figure sat in the index. Story: `docs/cpl_assistant_lessons.md`, S543.

## The claim

**A section per entity answers about one entity.** Routing by name is precise for "has Cabrillo met it" and silent for "which colleges have not": the question names no entity, the router reads nothing, and the similarity search returns whatever reads alike, often an older document with a stale figure.

**The aggregate needs its own section and its own route.** Write one section that lists every entity against the condition, built from the same source and the same verdicts as the per-entity sections, and read it by its heading when a question asks across entities. A test should pin that each entity the aggregate lists agrees with that entity's own section.

**An instruction cannot supply data.** A directive telling the model to answer "from the figures loaded for you" changes nothing when the figures are not in the prompt.

**Name a live figure by the word people ask with.** A count labeled "military students" was not read as the JST count people asked about; the label is what both retrieval and the model match on.

## How we got here

Sam asked the question on 2026-11-01. The per-entity route (S529) worked as built; the aggregate had no section. #2666 added the section and the route; the note half went live at the next index run, the route at the deploy Sam approved on Open Asks Sheet 154.

## When this applies (and when it doesn't)

It applies wherever a retrieval layer keys sections by entity: colleges, credentials, programs, districts. It does not replace the similarity search for open questions, and an aggregate section should stay small enough to send whole (here about 5,000 characters for 106 institutions; the met list carries names only).

## See also

- `docs/cpl_assistant_lessons.md` (S543)
- `docs/reference/lanes/sierra-retrieval-corpus.md`
