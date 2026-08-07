---
title: An unordered LIMIT is a correctness bug, not a style nit — and it reads as model flake
created: 2026-08-07
updated: 2026-08-07
tags: [methodology, sql, postgres, retrieval, testing, sierra, determinism]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/kb-notes/reference-postgres-fts-pitfalls-for-credential-titles]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_geo_ranking.test.js
---

# An unordered LIMIT is a correctness bug, not a style nit

> **One-sentence summary** — `SELECT … LIMIT n` with no `ORDER BY` may return *any* n of the matching rows and a
> different n on the next identical call, so a lookup built on one is non-deterministic; downstream of an LLM
> that non-determinism is indistinguishable from model flake, and gets blamed on the model for weeks.

## The claim

**If a query's result feeds a decision, an unordered `LIMIT` makes that decision random.** SQL guarantees no row
order without `ORDER BY`. Postgres is free to return rows in whatever order the plan produces — and that can
change between two identical calls as the plan, cache state, or physical layout shifts.

This is widely known as a *style* rule ("always order your limits"). It is really a *correctness* rule, and the
reason it survives review is that the symptom is intermittent and lands somewhere else.

## The worked example

Sierra (a CPL assistant) resolves which college a visitor is asking about by matching query words against college
names:

```js
for (const word of words) {
  const { data } = await sb.from("chatbox_college_profiles")
    .select("*").ilike("college", `%${word}%`).limit(3);
  if (data && data.length === 1) return data[0];
  if (data && data.length > 1) { /* …rescue check… */ return data; }
}
```

Asked *"Does Los Angeles Harbor College give credit for NCCER carpentry?"*, the candidate words are
`["angeles", "harbor", …]`. `"angeles"` matches **9** colleges; `"harbor"` matches exactly **1**.

Two identical live calls, minutes apart:

```
ilike '%angeles%' limit 3  →  {East Los Angeles, Los Angeles City, Los Angeles Harbor}
ilike '%angeles%' limit 3  →  {Los Angeles Mission, Los Angeles Southwest, West Los Angeles}
```

So the question resolved its home college **only when LA Harbor happened to fall inside an arbitrary window** —
and when it didn't, the function returned an ambiguous set and never reached the word that would have resolved it
uniquely.

## Why it hid for so long

Two compounding effects, both worth recognising in other systems:

1. **The consequence surfaced one layer away.** With no home college resolved, a *geography* variable was null,
   so a *ranking* function silently degraded to volume ordering. The visible complaint was "it recommends a
   college 50 miles away" — a ranking bug, in a ranking function that was innocent and, as it turned out,
   unreachable.
2. **An LLM sits downstream, and models are already expected to be flaky.** Intermittent wrong answers from a RAG
   system get attributed to generation. A prior session's handoff documented the symptom as inherent prose flake
   and even warned that the assertion "carries inherent flake." It did — but a real share of it was the database
   returning different rows.

## The rules

- **Every `LIMIT` gets an `ORDER BY`**, even when you believe you only need "any n". If you truly need any n, say
  so in a comment — the next reader cannot tell the difference between deliberate and forgotten.
- **A `LIMIT` narrower than the match set is a silent filter with no predicate.** Here, `limit(3)` against 9
  matches discarded two-thirds of the candidates before any scoring logic ran. Either widen it past the realistic
  match count or score the whole set.
- **Never `return` out of a candidate loop on a partial answer.** The loop above returned on the *first*
  ambiguous word and never evaluated the more specific one behind it. Gather all candidates, then decide.
- **When a symptom is intermittent, suspect the data path before the model.** Cheap test: run the same query
  twice and diff. If retrieval is stable, *then* argue about generation.

## The tell that found it

The handoff's facts were all true, but the code it pointed at could not produce the symptom: the rank function
was `core(200) + county(100) + region(40) + min(courses, 39)`, and `39 < 40` means volume **cannot** outrank
region. Having to explain why the reported bug was arithmetically impossible is what forced the search one layer
up.

**Generalised: when the code you were pointed at cannot produce the symptom, stop fixing it and go up a layer.**
Re-deriving a small function by hand costs minutes and is the cheapest way to discover you are in the wrong file.

## Testing it

Determinism is directly assertable without a database — call the resolver several times with a fake client and
compare, plus a source-level guard that the ordering exists:

```js
const repeats = [];
for (let i = 0; i < 5; i++) repeats.push(await detect(QUERY, fakeSb(COLLEGES)));
check("detection is deterministic across identical calls", new Set(repeats).size === 1);
check("the ilike lookup is ORDERED", /\.order\("college"\)/.test(detectSrc));
check("the limit is wider than the known match set", limits.every((n) => n > 9));
```

⚠️ Strip comments before source-level regex assertions. The first version of that limit check matched
`.limit(3)` **inside the comment describing the old bug** and went red against correct code.
