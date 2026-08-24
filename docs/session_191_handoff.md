---
title: Session 191 handoff — the deploy is the whole job, then the first live briefing
date: 2026-08-24
tags: [handoff, session-191, memory, cpl-chat, deploy]
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_memory_tab_lessons]]"
---

# You are Session 191

Session 190 was **SkyRead**. Pick your own moniker — `SkyDeploy` fits what is
waiting, but it is yours to choose.

## Read in this order

1. `CLAUDE.md` — Rules 8, 9 and 10, then the **Memory tab / Autogenerate + the
   Briefing** row in §11 and the SkyRead S190 narrative.
2. `docs/cobi_memory_tab_lessons.md` — the 2026-08-24 section. The whole story.
3. `docs/kb-notes/methodology-a-silent-input-cap-is-a-content-swap.md` — the
   durable half, written once.
4. **Query `cpl_memory` before you touch anything** (Rule 8's read step):
   ```sql
   select slug, title, summary, status, event_date from cpl_memory
   where status <> 'superseded'
     and (tags && array['memory-tab','cpl-chat','prompting'] or summary ilike '%cap%')
   order by event_date desc nulls last limit 40;
   ```

## What shipped (#1320, #1321 — both merged, NEITHER LIVE)

**The bug.** ✨ Autogenerate drafted a confident memory entry about the two-band
answer structure when Sam pasted a note about which kind of credit to award. The
instruction envelope measured **984 of `cpl-chat`'s 1,000-character `query`
cap** and led the prompt, so the topic arrived as `When responding `. With no
subject and ~9 KB of answer doctrine in context, the model wrote about the
doctrine — in `STATEWIDE_RULE`'s own words. Retrieval keyed on the envelope too:
99 keywords, one of them the curator's, at a healthy-looking 0.86 similarity.

**The fix.** A per-surface cap (`queryCapFor`: 1,000 chat / 6,000 drafting /
20,000 briefing; an unknown surface normalizes to `null` and gets the chat cap).
An optional `retrieval_query` so what we SEARCH on can differ from what we SEND.
A `DRAFTING_BLOCK` appended to the **volatile** system block that replaces the
conversational doctrine — never `stable`, which is the prompt-cache breakpoint.
Client-side, the topic leads the prompt so anything a cap eats is instruction
text and fails loudly.

**The Briefing.** A read-back of the memory entries on screen, at the top of the
📄 Report view. Superscript-numbered citations with a hover/focus card and a
numbered source list; clicking one opens that row's edit form. It briefs exactly
`reportFiltered()` and says what it read.

## ⚠️ THE ONE THING BLOCKING EVERYTHING

**Neither feature works until `cpl-chat` is deployed.** Sam had not given the go
as of the end of Session 190 — it reaches every Sierra surface at once (the
public page, map.rccd.edu, the Fact Sheet drawer, the vendor iframe), and the
repo's deploy workflow has a deliberate `DEPLOY` confirmation gate.

When he says go, it is three steps:

1. `mcp__github__actions_run_trigger` → `cpl-chat-deploy.yml`, ref `main`,
   input `confirm: DEPLOY`.
2. Widen the live constraint (additive, one statement):
   ```sql
   alter table public.sierra_guidance drop constraint sierra_guidance_surface_ck;
   alter table public.sierra_guidance add constraint sierra_guidance_surface_ck
     check (surface is null or surface in ('my-college','cobi-assistant','public',
                                           'fact-sheet','memory-autogen','memory-briefing'));
   ```
3. Dispatch `cpl-chat-smoke.yml` and read mode 7 (§7c of the pipeline reference).

**Free rider on the same deploy, if Sam wants it:** 8 British spellings in
Sierra's own prompt text (the British forms of catalog ×3, judgment ×2, labeled ×2 and
summarize) — including inside the two-band rule. Comments aside, these seed her
wording and reach the public page. Sam's standing rule is American spelling.

## Then: the first live briefing

No session has ever seen the knowledge-base half of a briefing, because the
sandbox is egress-blocked from `*.supabase.co`. Ask Sam to press the button once
and paste what comes back. The KB paragraph is the part that cannot be verified
any other way.

## Carryover

- **`cpl_memory` cleanup, scoped but not started.** 26 of 177 `verified` rows
  carry no `verified_by`; 358 proposed against 177 verified; three sessions wrote
  under two author strings each. Sam was offered a pass and had not answered.
- **Two rows the first briefing flagged.**
  `smoke-mode-7-red-is-emphasis-not-capability` looks stale (its failing test was
  since fixed a different way, and it is still `verified`). And two contacts rows
  are each right but misleading apart — *"Sierra must never use curator-suggested
  contacts"* vs *"Sierra reads contacts live"*.

## Patterns that worked

- **Measure the prompt, don't reason about it.** Rebuilding the client's prompt
  in Node and slicing it at the server's cap printed the exact 16 characters the
  model received. That turned "the AI got it wrong" into arithmetic in one step.
- **`liftBlock`** pulls pure functions out of the Deno edge function so a Node
  script can run them for real — that is how the 99 boilerplate keywords were
  counted rather than guessed.
- **Perturb every new assertion.** Stash the fix, run the test, watch it go red.
  Three budget checks passed *vacuously* until this was done — their fixture came
  from a value the old client did not declare, so it built an empty topic and
  `indexOf("")` returned 0.
- **Render it before believing the design.** Inline slug citations looked fine in
  code and were unreadable on screen, because this table's slugs are sentences.

## Safety patterns to honor

- **Never restate a cap, a constraint or a vocabulary — read it from the file
  that owns it.** The surface vocabulary lives in THREE places (`KNOWN_SURFACES`,
  the SQL `CHECK`, and `sierra_training.js`'s curator picker); two were updated
  and CI caught the third.
- **An exemption is a claim — assert it.** The inline citations are under the
  24px target minimum by an SC 2.5.8 exemption whose justification (a full-size
  source list) was itself 15px. `scripts/check_memory_briefing_layout.js` now
  checks the justification.
- **A `check_suite.completed` wake is not a green light** — it routinely names a
  superseded head. Re-read `get_check_runs` on the current head. A `test` failure
  arrived ~24 minutes stale on this PR and named an already-fixed defect.
- **Sam runs several sessions at once.** S189 (SkyCal) was live throughout S190;
  the only shared file was `tests/check_floor.json`. Stay out of `CLAUDE.md`
  until your own checkpoint, and land it quickly when you do.
- Supabase only through the MCP; the sandbox cannot reach `*.supabase.co`.

## Verification you can trust

`npm test` — **all 264 files passed** on a clean run (it needs ~15 minutes and
will be killed if anything else heavy runs alongside it; two earlier concurrent
runs died and one falsely flagged `cip_crosswalk`, which passes 354/354 alone).
Plus `PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node
scripts/check_memory_briefing_layout.js` → 18/18 for the geometry jsdom cannot
see.
