---
title: GR Priorities — on-demand re-analysis of a regulation priority
created: 2026-08-25
updated: 2026-08-25
tags: [gr, regulation, scope, cpl-chat, drafting-surface]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/gr_register_lessons]]"
  - "[[docs/kb-notes/methodology-a-word-in-a-request-may-have-no-referent-yet]]"
  - "[[docs/kb-notes/methodology-a-silent-input-cap-is-a-content-swap]]"
artifacts:
  - gr_priorities.js
  - chatbox/supabase/functions/cpl-chat/index.ts
  - .github/workflows/cpl-chat-deploy.yml
---

# GR Priorities — on-demand re-analysis

> **Scope, not a build.** Nothing here is implemented. It needs Sam's go because
> it touches the Edge Function shared with the public Sierra.

## What Sam asked for

> *"a routine I can run on demand that looks at the edit I made and reanalyzes
> everything for related Title 5 and Ed Code citations and an analysis of whether
> it can be accomplished by a clarifying memo, regulation revision, Ed Code
> revision, or some combination of the 3."*

And, decisively:

> *"It's the same routine used to create the tab in the first place."*

## ⭐ That is the whole finding

The 16 CPL revisions were **analyzed by a session** during the Sky168 rebuild and
the results written into the table. Nothing computed them — `blast_rank` appears
in no Python, no SQL and no workflow in this repo, which is why "reanalysis" had
no referent when I first went looking for one.

So this is not "invent an analyzer". It is **make a session's work product
repeatable and put a button on it** — and the output shape already exists,
because `gr_revisions` IS the analysis template:

| column | what the analysis produces |
|---|---|
| `citations[]` | the Title 5 / Ed Code / Gov. Code sections in play |
| `pathway[]` | `g` memo · `y` Title 5 · `r` Ed Code — **the combination question** |
| `ed_first` | Yes / No / Split — does statute have to move first |
| `instrument` | the human-readable section label (`§55050`, `§58003.2 + §58050 → TBL`) |
| `blast_why` | why it matters |
| `blast_rank` | rank by systemic blast radius, 1 = widest |
| `consideration` | tailwinds, obstacles, prior art |

## ⭐ The doctrine is already legible — measured, not invented

The instrument choice is not arbitrary. Grouping the 16 rows by what their own
**Approach** text says, against the pathway that was actually assigned:

| the row's own tell | instrument assigned | rows | consistency |
|---|---|---|---|
| the regulation **already permits** it; nobody says so plainly | includes memo `{g}` | #12 (memo only), #1, #14, #15 | — |
| the regulation **must change** — strike a mandate, add a duty | Title 5 only `{y}` | #3, #9, #10 | **3 of 3** |
| a **statute blocks it** — authority vested elsewhere, or the premise is statutory | Ed Code `{r}` + `ed_first = Yes` | #5, #7 | **2 of 2** |

Stated as one test:

> **Does the change contradict a _statute_ (→ Ed Code), a _regulation_ (→ Title
> 5), or merely a _practice_ (→ clarifying memo)?**
> Memo **+** Title 5 is the "act now, make it durable" combination, and it is the
> most common answer in the register (8 of 16).

Worked examples the routine should reproduce:

- **#12** — *"This is already the law — §55002 does not require it — it just
  isn't stated plainly"* → memo alone.
- **#9** — *"Strike the §55050 mandate that the record be annotated"* → Title 5.
  You cannot memo away an express regulatory mandate.
- **#7** — *"A bare Title 5 tweak collides with the statutory attendance premise
  (Gov. Code §11342.2)"* → Ed Code, `ed_first = Yes`. A regulation cannot exceed
  its enabling statute.
- **#5** — *"Credit-granting is vested in district governing boards (§70902)"* →
  Ed Code. The authority sits somewhere the CO cannot reach by regulation.

⚠️ **The doctrine must be carried in the prompt, explicitly.** Without it a
re-analyzed row comes back in a different voice and with a different instrument
logic than #1–#16, and the tab becomes a patchwork of two analysts. A CO reader
will feel the seam.

## Two lanes, and they compose

**Lane A — deterministic. Already shipped (#1331.)** Re-analyze checks the row
against **itself**: sections its text cites that are missing from the list,
listed sections the text no longer cites, numbers no code band claims,
cross-area clashes, and a verification stamp standing over changed citations.
Fast, free, defensible, no deploy.

**Lane B — this scope.** Everything Lane A structurally cannot do, because it
requires knowledge of law the repo does not hold:

1. **Related** Title 5 / Ed Code sections not already cited anywhere in the register.
2. The **instrument determination** (memo / T5 / Ed Code / combination) with its reasoning.
3. Refreshed `blast_why` and a `blast_rank` proposal in the register's voice.

Lane A runs on save. Lane B runs when asked. **Lane A's findings should be fed
into Lane B's prompt** so the model sees what the deterministic pass already knows.

## The surface contract

Add a fourth drafting surface. Everything below already exists as a pattern in
`cpl_memory.js`'s Autogenerate — this reuses it rather than inventing a path.

**Server** — `chatbox/supabase/functions/cpl-chat/index.ts`:

```ts
KNOWN_SURFACES     += "gr-analysis"
DRAFTING_SURFACES  += "gr-analysis"          // replaces the conversational doctrine
SURFACE_QUERY_CAPS += { "gr-analysis": QUERY_CAP_DRAFTING }   // 6,000
```

⚠️ **The surface vocabulary lives in THREE places and two is the classic miss.**
`KNOWN_SURFACES`, `DRAFTING_SURFACES` and `SURFACE_QUERY_CAPS` must all gain it —
a surface declared drafting with no cap silently falls back to the 1,000-char
chat cap and truncates, which is the original Autogenerate defect arriving
through the table instead of the ternary. `tests/cpl_memory_briefing.test.js`
already asserts the two sets agree in **both** directions; extend that assertion,
do not restate the number.

**Client** — `gr_priorities.js`:

```js
POST /functions/v1/cpl-chat
{ query:            <envelope, TOPIC FIRST>,
  retrieval_query:  <the row's title + approach — search text ≠ sent text>,
  session_id:       "cobi-gr-analysis",
  surface:          "gr-analysis" }
```

⚠️ **The row leads the envelope.** Anything a cap eats must be instruction text,
so a truncation fails loudly instead of producing a confident analysis of the
wrong subject. That is exactly how an 870-character note reached the model as
`"When responding "`.

## The prompt

Three blocks, in this order:

1. **THE ROW** — title, group, approach, consideration, current citations,
   current pathway/`ed_first`, plus **Lane A's findings**.
2. **THE DOCTRINE** — the statute/regulation/practice test above, with the four
   worked examples, so the answer matches the register it is joining.
3. **THE OUTPUT CONTRACT** — one JSON object, no prose, keyed to the columns:

```json
{ "citations": ["T5 §55050", "EC §66025.71"],
  "citations_related": [{ "cite": "T5 §55063", "why": "…" }],
  "pathway": ["g", "y"],
  "ed_first": "No",
  "instrument": "§55050",
  "blast_why": "…",
  "blast_rank_suggested": 4,
  "reasoning": "§55050 already contemplates this 'if possible', so a CO memo can confirm it now; Title 5 can lock it in." }
```

## ⚠️ Four things it must not do

1. **It proposes into the editor; it never writes.** Same posture as Lane A and
   as the drift detector. Field-by-field accept, nothing applied on arrival.
2. **The instrument call is a legal conclusion, so it must show its reasoning.**
   A wrong answer in the *permissive* direction — "a memo will do" when the thing
   needs statute — is advice the Chancellor's Office would act on. `reasoning` is
   not decoration; it is the field that makes the answer reviewable.
3. **Related sections arrive UNVERIFIED and must be marked so.** The sandbox is
   egress-blocked from leginfo and Cornell, so the model supplies them from its
   own knowledge. They carry exactly the status the register already flags —
   *verify against the primary source before this goes external* — and they must
   land as `citations_derived = true` until a curator confirms them.
4. **It must not touch `verified_at` / `verified_by`.** Accepting a proposed
   citation changes the list, which already clears the stamp by the rule shipped
   in #1331. The model never sets a verification.

## Deploying it — the half that catches people

⚠️ **This is a two-half feature and one half deploys itself.** `gr_priorities.js`
is a repo-root static file that ships with Pages on merge. The Edge Function does
**not** — it needs `cpl-chat-deploy.yml` dispatched. And `cpl-chat-smoke.yml`
tests the **deployed** function, so a merged-but-undeployed change looks fine to
CI while the button 400s. The Briefing ran against a server that did not know its
surface for a day for exactly this reason.

Order: merge the client → dispatch `cpl-chat-deploy.yml` → confirm with
`cpl-chat-smoke.yml` → only then tell anyone it works.
`cpl-chat-preview-ab.yml` exists to compare prompt versions and has never been
used; this is the change to use it on.

## Verification

- Extend the surface-vocabulary assertion (both directions, three lists).
- A jsdom test that the button **proposes** and writes nothing until accepted.
- **The doctrine regression:** run the routine against rows #12, #9, #7 and #5
  with their stored pathway blanked, and assert it returns memo-only, Title 5,
  and Ed Code + `ed_first=Yes` respectively. ⭐ **Those four rows are a labeled
  test set the register already contains** — the cheapest real evaluation
  available, and it is what tells you a prompt edit made the analysis worse.
- Perturb each guard on its own and confirm red **by exit code**, with safe
  accessors so a missing control reports rather than throws.

## Open questions for Sam

1. **Re-analyze one row, or the whole area?** One row is cheaper and matches
   "the edit I made". A whole-area pass is what would catch *new* cross-area
   clashes and re-rank the set coherently — the ranks are currently tied (3,3 and
   5,5,5), which a per-row pass will never fix.
2. **Should it propose `blast_rank`?** Ranking is comparative, so a per-row call
   cannot really do it — it would need the other 15 in context.
3. **Does it write `citations_related` anywhere**, or only display them? There is
   no column for "related but not cited" today.
4. **Same routine for the dual-enrollment area?** Those rows are a marked SAMPLE
   with neutral prompts and no positions; the doctrine block would have to be
   suppressed for them or it will start writing advocacy.

## What this does NOT need

No new tables. No RLS change. No schema migration — every output maps to a column
that already exists, except `citations_related` (question 3).
