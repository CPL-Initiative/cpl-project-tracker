---
title: COBI Memory tab + MAP Data Quality register — lessons
date: 2026-07-26
tags: [lessons, memory, data-quality, rls, license, sky10men]
artifacts:
  - cpl_memory.js
  - map_data_quality.js
  - kb/supabase_cpl_memory.sql
  - kb/supabase_map_data_quality.sql
  - kb/cpl_memory_plain_seed.json
  - kb/cpl_memory_title_seed.json
related:
  - "[[docs/kb-notes/adr-unified-memory-table]]"
  - "[[docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint]]"
  - "[[docs/kb-notes/methodology-team-curated-table-needs-update-rls]]"
  - "[[docs/memory/cpl_memory]]"
---

# COBI Memory tab + MAP Data Quality register — lessons

Workstream scratchpad for the 🧠 Memory tab polish, the 🩺 MAP Data Quality
register, and the license correction. Continues SkyKnow's memory-loop build.

## 2026-07-26 — Sky10Men

Picked up from SkyKnow's handoff (the memory loop: table + curate pane +
checkpoint auto-write + Report view, all live). Shipped, in order:

### (a) 🧠 Memory Report → non-techie prose + reader fields (#894, #895)
- **What:** the 📄 Report ("Everything We Know") read like a technical index —
  bold fragment summaries + `touches:` filename dumps + `source:` citations, and
  fragments like *"eligible flag = `has_ccc`"* a lay reader can't parse. Reworked
  it to plain-English **prose**: per-section plain-language lead-ins, each entry a
  flowing paragraph, milestone dates in prose ("Reached July 20, 2026"), and the
  curator jargon dropped from the reader view.
- **Two reader columns** on `cpl_memory`: **`plain`** (the full-sentence,
  jargon-free version, with an example where the summary is obtuse) and
  **`title`** (a 3-6 word bold label above each item). Report **prefers** them,
  **falls back** to `summary`(+`detail`) so no row is required to have them.
  `summary`/`detail` stay the terse curator + AI surface. All 48/49 rows populated
  (receipts `kb/cpl_memory_plain_seed.json`, `kb/cpl_memory_title_seed.json`).
- **✨ Autogenerate** on the Add **and** Edit forms: type a topic → it researches
  the KB via the shared **cpl-chat RAG edge function** and drafts every field
  (prefill-only, parsed defensively). Putting it on Edit too, not just Add, is the
  sibling-surface sweep → recorded as `pr7`.
- **Real bug caught:** reading a form control named `title` via `form.title`
  returns `HTMLFormElement.title` (the attribute), not the input → the Short-title
  silently never saved. Fix: all form field access via `querySelector('[name=…]')`.

### (b) 🧠 Memory curate lockout — RLS fix (#896)
- **Symptom (Sam):** clicking a status chip snapped it back to *proposed* and
  locked the curator out ("team phrase may have expired"); re-unlocking → same.
- **Root cause:** an RLS asymmetry. `cpl_memory` SELECT + INSERT both allowed
  `is_allowed_reviewer() OR team_pass_ok()`, but **UPDATE was reviewer-only**. A
  team-phrase UPDATE matched 0 rows → PostgREST `200 []` → `team_phrase.js`
  `checkWrite` reads the empty representation as a 403 (the RLS zero-row trap) →
  `handleWriteFailure` clears the phrase → lockout.
- **Fix:** widen UPDATE to `reviewer OR team` (the pane says "view + curate", and
  INSERT already trusted team). Server-side, live immediately. Durable lesson →
  KB note + pitfall `p8`.

### (c) 🩺 MAP Data Quality register (#897)
- **Why:** Sam is finding data-quality problems in the Custom Report Generator's
  `View_StudentAggregatedValues` and wants to track them + follow up with the MAP
  dev team. Built a team-gated register (Supabase `map_data_quality` +
  `map_data_quality.js`, Reference & Curation group) — issue cards, status/
  category/college/search filters, an Advance-status cycle, and a **"Copy for MAP
  devs"** evidence export. **RLS applied the `p8` lesson from the start** (team can
  UPDATE). Seeded with Sam's four issues.
- **Domain fact captured (`f8`/`o3`):** Marine Corps JSTs list ACE credit
  recommendations under **every skill level**, and higher levels **repeat** the
  lower ones → summing over-counts eligibility (4× one 3-unit course). Fix =
  **dedupe by the CR itself within an exhibit**, not by skill-level order (sidesteps
  the non-canonical ordering). Moving Priority 1 to **Applied** credits also
  neutralizes it (a counselor N/A's the dupes).

### (d) License correction (#898)
- The tracker's `LICENSE` was an **unmodified MIT template (© 2019 Zachary Rice)** —
  it explicitly granted anyone the right to copy/modify/redistribute/sell, the
  opposite of intent. Replaced with a **proprietary all-rights-reserved** notice
  owned by **CCCCO** (carve-outs for public data + the CC BY 4.0 KB). Caveats: MIT
  is irrevocable for already-published snapshots (forward-only); a license is a
  legal, not technical, control (cloning of a public repo is unaffected).

## Advice given (not yet built) — data quality + repo privacy

- **Priority 1: Eligible → Applied.** `TotalAppliedCreditsForCR` is already in the
  MAP dataset, so re-basing is feasible without a MAP change. Applied = a counselor
  made a conscious keep/N-A decision → the better incentive-to-act metric + it
  cleans up the USMC inflation. Cautions: phase-in (backlogs drop measured perf at
  first), keep Eligible as the *ceiling* KPI, and there's a further outcome metric
  (`TotalTranscribedCreditsForCR`).
- **Repo privacy / appropriation:** private repo ≠ private data if Pages stays
  public (Pages serves the artifacts regardless). Levers: (1) license (done, #898),
  (2) privatize the tracker (needs Pro/Team to keep the public site), (3) split
  repo (public rendered site + private engine). KB stays CC BY 4.0 by design.
  Recommended starting move whenever Sam wants: a **public-exposure audit**.

## Roadmap / next

- **Register enhancements (queued, memory `w3`/`w4`):** (1) auto-generate findings
  from `View_StudentAggregatedValues` into the register on each daily run
  (counts + example IDs, idempotent upsert); (2) a follow-up-nudge on issues whose
  `followup_on` date has passed. Recommended for a fresh session (context).
- **On Sam's word:** the public-exposure audit; a Priority-1-on-Applied prototype
  behind a basis toggle.

## Patterns that worked

- Model a new team-gated curate tab directly on `cpl_memory.js` (unlock + RLS-safe
  `doWrite`/`checkWrite` + scoped CSS from JS) — a proven template.
- Apply `p8` to **every** new team-curated table's RLS up front (team on
  SELECT/INSERT/UPDATE; reviewer-only DELETE).
- `querySelector('[name=…]')` for form controls, never `form.<name>` (the `title`
  collision).

---

## 2026-08-24 — SkyRead (Session 190): the bug, the feature, and four defects the verification found

### The reported bug

Sam pasted an 870-character note about which kind of credit a college should
award — course credit first for the clearest transfer signal, then GE area
credit, then elective credit, which is not throwaway because it satisfies the
local 60-unit associate degree requirement. Autogenerate returned a polished
entry titled *"Answer Structure for CPL Responses"*, about separating colleges
that have articulated a credential from colleges that merely teach the subject.
Right schema, good English, entirely the wrong subject, and no error anywhere.

**Root cause, in three layers, all measured rather than reasoned:**

1. **`cpl-chat` capped `query` at 1,000 characters, server-side and silently.**
   The Autogenerate envelope — the JSON key list, the kind vocabulary, *"reply
   with ONLY a single JSON object"* — measured **984** of those 1,000, and it led
   the prompt. The topic reached the model as the sixteen characters
   `When responding `.

2. **The doctrine filled the vacuum.** Given no subject and ~9 KB of
   answer-shaping rules, the model wrote about the loudest thing in its context.
   The draft's own `detail` field — *"Blending the two bands sends students to
   counters where nobody is expecting them"* — is `STATEWIDE_RULE`'s phrase,
   verbatim.

3. **Retrieval keyed on the boilerplate.** `searchText` is the whole `query`, so
   the embedding, college detection, exhibit search and offerings search all ran
   over the instructions: **99 extracted keywords, exactly one** of which
   belonged to the curator's note — at a healthy-looking **0.86** similarity,
   because the envelope is itself full of CPL words.

Diagnosis took one Node script (rebuild the client's prompt, slice at 1,000,
print what survives) and one `liftBlock` of `extractTopicKeywords`. Neither
needed the live service, which the sandbox cannot reach anyway.

### The fix (#1320)

Server: a **per-surface cap** (`queryCapFor`) — 1,000 for every conversational
caller, unchanged; 6,000 for a declared drafting surface, with an unknown surface
normalizing to `null` and getting the chat cap, so the wider cap is not a lever
from outside. A new optional **`retrieval_query`** separates what we SEARCH on
from what we SEND. A **`DRAFTING_BLOCK`** appended to the *volatile* system block
replaces the conversational doctrine rather than arguing with it — and goes in
`volatile` because `stable` is the prompt-cache breakpoint and must stay
byte-identical for every other caller.

Client: **the topic leads the prompt**, so anything a cap ever eats is
instruction text — and a lost JSON contract fails loudly (`parseDraft` → null →
*"Couldn't draft that"*) instead of quietly changing subject.

A drafting call is also no longer filed in `chat_interactions`, which the Sierra
Training Gap Miner reads unfiltered as *questions people asked Sierra*.

### The Briefing (#1321), and Sam's correction to my correction

Sam asked for a button that shows how the memories are understood, *"as if you
used them to construct a Sierra response"*.

⚠️ **`cpl-chat` contains no reference to `cpl_memory` anywhere.** Sierra reads
`sierra_guidance`, the vector KB and the credential tables; she has never read
this table. A briefing dressed as a Sierra answer would have looked clean and
proved nothing about her. The pathway that *is* real is the Rule 8 one — a
session reading these rows at the start of a workstream — and that is what the
panel exercises. Sam took the correction.

**His three refinements, each from looking at a render:**

- *"Use plain language"* → the prompt now demands short sentences, everyday
  words, a term explained the first time it appears, and something readable in
  two minutes. Stated as the requirement, and asserted by test, because a style
  note is exactly the line that gets edited away later.
- *"Superscript numbers with hover over to see the memory"* → citations became
  numbers with a real hover/focus card. This solved a problem the first render
  had exposed on its own: **this table's slugs are whole sentences**
  (`sierra-credit-outages-recurred-twice-and-are-now-monitored`), so inline slugs
  put more citation on the page than prose and destroyed the plain reading.
- *"Take me to the memory row to edit if clicked"* → the click opens the edit
  form, via a flag honored by `renderEntry` rather than a call from the click
  handler, because the form is built during the render the click triggers.

### Four defects the verification found — three of them my own reasoning

1. **The envelope was outside the corpus budget.** I budgeted the corpus against
   the cap and forgot the instruction block wrapped around it: the built query
   overshot by **1,392 characters**. Exactly #1320's shape, one level down.
   `briefCorpusMax()` now *measures* the envelope and subtracts it.

2. **The surface vocabulary lives in THREE places and I updated two.** CI caught
   it: `KNOWN_SURFACES` and the SQL `CHECK` were done, the curator-facing picker
   in `sierra_training.js` was not — and a surface the function accepts but the
   picker never offers is a rule nobody can write. The comment above `SURFACES`
   already named all three lists. **Naming them is not checking them.**

3. **The tap-target exemption was unearned.** The inline superscripts are under
   the WCAG 24px minimum on purpose (SC 2.5.8 exempts a target positioned by the
   flow of its sentence), and I justified that by saying the numbered source list
   repeats every citation at full size. **The source-list links measured 15px.**
   So both were undersized and the exemption was an argument, not a fact. The
   Chromium harness now asserts the exemption itself: the inline targets are
   allowed to be small only while the list underneath carries them at full size.

4. **Three budget assertions passed vacuously.** The first cut derived its
   fixture from the client's declared budget; against a client that declares
   none, the budget was `undefined`, the fixture built an **empty** topic, and
   `indexOf("")` returned 0 — so three checks went green against exactly the code
   they existed to catch.

### What the first real briefing found

Run over 12 live `sierra`-tagged rows, it surfaced two things worth acting on:

- **`smoke-mode-7-red-is-emphasis-not-capability` is probably stale** — it
  describes a test failure since fixed a different way, and is still `verified`,
  so it reads as current truth.
- **Two contacts entries are each right and misleading apart** —
  *"Sierra must never use curator-suggested contacts"* and *"Sierra reads
  contacts live"*. Both true (live from MAP's own table, never the suggestions
  column), but only the pair says so.

### Memory-table audit (asked for after the bad draft)

Autogenerate's blast radius is **nil**: three calls have ever been made, and no
row carries the doctrine text — the review step worked. The corpus is healthier
than expected: **0 near-duplicate pairs** at 0.55 trigram similarity across 536
active rows, 1 row with no source, 0 untitled, 0 untagged.

What is worth attention is different:

- **26 of 177 `verified` rows have no `verified_by`.** Verified is the only
  status shown by default and the corroboration rule leans entirely on that
  field.
- **358 proposed against 177 verified** (351 of the proposed are under 30 days
  old) — ingest is outrunning corroboration.
- **Three sessions wrote under two author strings each**
  (`session-187-skyview` *and* `SkyView (Session 187)`), which weakens
  "a second session corroborates".

### Current state

Both PRs are merged. **Neither is live**: the server half needs a `cpl-chat`
deploy, and the briefing additionally needs the `sierra_guidance` surface
constraint widened by one additive statement. Until then Autogenerate still
truncates and the Briefing button returns the honest *"Couldn't build the
briefing"*.

> ⚠️ **CORRECTED SAME DAY — the last sentence is wrong, and the constraint is now
> widened.** `briefFetch` throws only on a non-OK response or empty text, so a 200
> carrying prose renders instead of reaching that error path. Measured: the Briefing
> renders a Sierra-style answer over ~3.5 of 48 entries, because this envelope puts
> the corpus FIRST and truncation eats the *instructions*, not the corpus. See the
> section below. The `sierra_guidance` constraint was widened on Sam's go
> (migration `sierra_guidance_surface_allow_memory_briefing`), so that half of
> "neither is live" is closed; the `cpl-chat` deploy is still outstanding.

### Next concrete step

1. Sam's go on the `cpl-chat` deploy → dispatch `cpl-chat-deploy.yml` (confirm
   `DEPLOY`), widen the constraint, run `cpl-chat-smoke.yml`.
2. Then the first live briefing, which is the only way to see the
   knowledge-base half — no session has, the sandbox is egress-blocked from
   `*.supabase.co`.
3. Optional free rider on the same deploy: **8 British spellings in Sierra's
   prompt text** (the British forms of catalog ×3, judgment ×2, labeled ×2, summarize),
   including inside the two-band rule. Comments aside, these seed her own
   wording, so they reach the public page.

## 2026-08-24 — Session 190 (Sky190): the memory work shipped and never went live

Sam, picking this thread up alongside SkyView: *"two sessions ran in parallel, SkyRead on
memory and SkyCal on the new SkyView graph view… Let's pick up the memory thread to close
out anything needed."* Then, on the deploy question: *"Just don't want wonky things from
memory to show up in Sierra and Fact Sheet. If the results look appropriate and balanced
against training, that would be great."*

### ⭐ THE HEADLINE — HALF OF A TWO-HALF FEATURE DEPLOYS ITSELF, AND THE HALF THAT DOES IS THE CLIENT

SkyRead's #1320 and #1321 both changed **two** things: `cpl_memory.js` (a static file at the
repo root) and `chatbox/supabase/functions/cpl-chat/index.ts` (a Supabase Edge Function).
Merging to `main` published the first automatically via Pages. The second requires a manual
`workflow_dispatch` of `cpl-chat-deploy.yml` with a typed `DEPLOY`. Nobody dispatched it.

Measured, not inferred: `list_edge_functions` reports `cpl-chat` **version 57, updated
2026-08-23 01:18 UTC**. `git log` on `index.ts` shows the only commits after that timestamp
are **#1320 (14:48) and #1321 (15:16) on 2026-08-24** — 134 insertions, 8 deletions.

⚠️ **THE FEATURE IS NOT MERELY INERT — IT IS LIVE AND WRONG.** The deployed v57 does not
have `memory-briefing` in `KNOWN_SURFACES`, so it normalizes to `null` and takes the
conversational path: a hard `slice(0, 1000)`.

### ⚠️ ORDER MATTERS, AND TWO SESSIONS GOT THIS WRONG IN OPPOSITE DIRECTIONS

Both readings above this line were wrong, mine included, and the code settles it. Measured
by booting `cpl_memory.js` and calling `_briefQuery` on a realistic 48-entry view:

| | |
|---|---|
| Full query | **14,872 characters** |
| Instruction envelope | **1,934** |
| Corpus (digest) | **12,938**, all 48 entries |
| What v57 keeps | **1,000** |

⭐ **THE BRIEFING PUTS THE CORPUS FIRST AND THE INSTRUCTIONS LAST**, which is the *opposite*
of Autogenerate's envelope. So truncation does not eat the corpus — **it eats the
instructions.** `"Brief me on them"` is not in the surviving 1,000 characters; roughly
**three and a half of the 48 entries** are, cut mid-entry.

The model therefore receives a bare list of memory entries with **no instruction at all**,
under the full Sierra answer doctrine (v57 is not a drafting surface, so no
`DRAFTING_BLOCK`). It returns 200 with prose, and the panel renders it.

- **I first wrote that "the model receives roughly sixteen characters of corpus."** That is
  the *Autogenerate* shape, transposed onto a differently-ordered envelope without checking.
  Wrong.
- **The checkpoint above says the Briefing "returns the honest *Couldn't build the
  briefing*."** Also wrong: `briefFetch` throws only on a non-OK response or empty text, and
  a 200 with prose goes to `.then` and renders.

**What actually happens:** a Sierra-style answer over ~3.5 of 48 entries, with a status line
reading *"Read 48 of 48 entries · **0 citations**"*. The corpus count overclaims — the server
truncated below what the client budgeted — but the **`0 citations` is a real tell**, because
the citation instruction was in the part that got cut and nothing came back in `[slug]` form.
So the panel is not silently confident; it is quietly wrong, which is better than either of
us said and still not good.

⚠️ **THE LESSON IS NOT "SESSIONS MAKE MISTAKES", IT IS THAT NEITHER OF US COULD CALL THE
ENDPOINT.** The sandbox is egress-blocked from `*.supabase.co`, so both readings were
inferences presented as observations. The fix is not more care; it is an instrument — which
is what `cpl-chat-preview-ab.yml` now is.

That is still `a-silent-input-cap-is-a-content-swap`, one level up from where SkyRead found
it — but the *content* it swaps depends on which end of the envelope the cap bites.

⚠️ **A DEPLOY GATE IS NOT A RELEASE PLAN.** `cpl-chat-deploy.yml` requires a typed
confirmation *because* it reaches production with no staging tier — the gate is correct. What
is missing is anything that notices a merged `index.ts` change sitting undeployed. The
smoke workflow runs on push, but it tests the **deployed** function, so on this diff it
was exercising v57 and passing.

### ⭐ THE RIGHT ANSWER TO "WILL THIS CHANGE SIERRA" IS A GUARD, NOT A READING

Sam's worry is contamination: one shared Edge Function serves the public Sierra page, the
Fact Sheet drawer, the COBI tab, My College, the map.rccd.edu widget — and the Memory tab.
Four channels could carry memory text into a Sierra answer, and all four were checked:

| Channel | Verdict |
|---|---|
| **Input cap** | `queryCapFor()` returns 1,000 for every conversational surface, named/absent/unknown. Unchanged. |
| **Guidance rules** | Filter is `surface IS NULL OR surface = <this one>`, so a memory-scoped rule cannot reach Sierra. |
| **System prompt** | `DRAFTING_BLOCK` appends to `volatile` (rebuilt per request), never to `stable` (the shared cached prefix). |
| **Interactions log** | v58 *stops* filing drafting calls into `chat_interactions`. |

⭐ **THE DEPLOY REDUCES CONTAMINATION ON THE ONE CHANNEL WHERE IT IS ALREADY HAPPENING.**
`chat_interactions` holds **3 rows** from `cobi-memory-autogen`, first 2026-08-15, **last
2026-08-24** — written by the deployed v57. The Sierra Training Gap Miner reads that table
unfiltered and presents rows as questions people asked Sierra, so today it shows an entry
beginning *"You are drafting ONE internal team memory entry…"*, carrying a similarity score
earned by its own boilerplate, pushing a real question off the list. v58 is what stops it.

### ⚠️ THE ASSERTION THAT WAS SUPPOSED TO CATCH THIS COULD NOT FAIL

`tests/sierra_surface.test.js` (6) reads *"the surface reaches ONLY the guidance layer so
far"* and tests it with `/fetchTeamGuidance\(sb, hostSurface\)/` — a **presence** check
wearing an **exclusivity** label. v58 gave the surface three more consumers and the
assertion still passed, because **an assertion pinned to one member of a set cannot notice
the set growing.** Its `why` string even described the widening as "a later decision" — a
decision that had since been made, in the diff it was failing to notice.

Replaced by `tests/sierra_memory_isolation.test.js` (25 checks), which pins the **set**:
four consumers, counted, so a fifth fails the run. Every assertion was perturbation-proved
— fork the cache to `stable`, drop either guard, add a fifth consumer, give `public` a
drafting cap, make `sierra.js` send `retrieval_query`: each fails, and the baseline is
clean.

⚠️ **AND THE COUNT HAD TO SEE CODE, NOT PROSE.** The first cut counted 10 where the code
says 7, because three *comments* in the handler use the word "drafting". A guard that cries
wolf on a sentence teaches its reader to bump the number until it goes green — the opposite
of what it is for. ⚠️ Its self-check was then anchored on one of the guards it protects, so
a perturbation that legitimately moved that line reported a broken stripper **as well as**
the real defect: a second failure saying nothing. Anchor a sanity check on something the
thing under test does not touch.

### ⚠️ A CONSTRAINT IN THE SCHEMA FILE IS NOT A CONSTRAINT IN THE DATABASE

`chatbox/supabase_sierra_guidance.sql` lists `memory-briefing` in
`sierra_guidance_surface_ck`. The **live** constraint does not:

```
CHECK ((surface IS NULL) OR (surface = ANY (ARRAY['my-college','cobi-assistant',
       'public','fact-sheet','memory-autogen'])))
```

`sierra_surface.test.js` (4) asserts "every surface the function accepts is allowed by the
constraint" — and passes, because it reads the **file**. The live database is a system no
jsdom test can see.

⭐ **THIS IS THE ONE REMAINING PATH BY WHICH A MEMORY-INTENDED RULE COULD REACH SIERRA AND
THE FACT SHEET.** The Sierra Training picker offers *"Only when briefing on the memory
entries"* (shipped live in #1321). A curator choosing it gets a constraint violation, and
the way out of a failed save is to leave the scope blank — and blank means **every surface**.
The contamination path is not the code; it is the curator being unable to express the
scope the UI offers them. One additive `ALTER` closes it.

⚠️ Note the memory row `the-sierra-surface-vocabulary-lives-in-three-places` already says
the constraint lives in "the SQL file **AND the live DB**". The row is right and the second
half was not done — recording a rule and applying it are two events, again.

### The `plain` regression

#1308 made plain language mandatory on every row, after Sam mis-governed two entries he
could not read. On 2026-08-24 both sessions wrote rows and **neither wrote `plain`**: 19 of
the 26 rows missing it were written that day. Backfilled here. The remaining 7 are all
`superseded` — out of the default view, historical — and are deliberately left, because
rewriting retired rows is churn, not hygiene. **Live rows are at zero.**

### Where this leaves the thread

- **`cpl-chat` v58 is not deployed, and that is now Sam's call to make deliberately** —
  he asked to test the surfaces first, particularly Sierra. The isolation guard is the
  mechanical half of that answer; the smoke suite against the deployed function is the
  other half and can only run *after* a deploy.
- **The live CHECK constraint needs one additive `ALTER`** — independent of the deploy, and
  safe in either order (`fetchGuidanceKind` retries unscoped on any error, by design).
- **The 3 polluted `chat_interactions` rows** are still in the Gap Miner's feed.

---

## 2026-08-25 — SkyFixer S193: the chip that could not write, then wrote too much

Sam, live on the tab: *"The memory I'm on is not needed and I want to set it as
inactive or delete it but I don't seem to have that option"*, *"The proposed chip
doesn't seem to be working"*, and *"the team unlock doesn't seem to respond… but
not the confusing message about team phrase expired"*.

Three reports, one root cause and two missing affordances.

### ⭐ The write key named nothing

Every `cpl_memory` write was addressed `?slug=eq.<display handle>`. But `slug` is
UNIQUE and **NULLABLE**, and `normalizeRow` falls back to the row's uuid for
DISPLAY when it is null. So on the **6 of 572 rows with no slug** — all six
visible, all `proposed`, and the row in Sam's screenshot among them — the PATCH
went out as `slug=eq.<uuid>`, matched **zero** rows, and PostgREST answered
`200 + []`, which `checkWrite` reports as 403-shaped.

This is `a-write-key-must-name-exactly-one-thing` one level down: #1329's `CN:`
key named *two* things; this one named *none*.

### ⭐ The message named the wrong credential and pointed at a control that was not rendered

`doWrite` hardcoded *"your team phrase may have expired — re-unlock"* for every
401/403, including for a magic-link curator, for whom the phrase is irrelevant
and whose phrase `handleWriteFailure` correctly never touches. And `renderAuth`
rendered the unlock row only when there was **no** session — so the instruction
named a control nowhere on the page.

It also could not tell a **refusal** from a **miss**: `checkWrite` reports an
ok-but-empty representation as 403-shaped but hands back an **array** there and
`null` on a real HTTP rejection. That is the only thing separating "you are not
allowed" from "nothing matched", and they need different words and different
remedies.

### ⭐ Then the fixed chip wrote states it was only passing through

With writes working, Sam clicked again: *"just sets to verified without any other
options."* Worse than a UX complaint — the cycle ran verified → stale → proposed,
so reaching `stale` from `proposed` **transited `verified`**, and every step was
a real PATCH plus a real audit row.

**His two clicks are in `cpl_memory_log` 15 seconds apart** — a `verify` at
19:22:08 and a `stale` at 19:22:23 — and the row sits at `stale` still carrying
`verified_at` and `verified_by='curator'`: **a verification stamp for a row
nobody verified**, on the one table whose purpose is corroboration.

A menu replaced the cycle (one click, one write, each status carrying what it
means), and `setStatus` now clears the stamp whenever the status is not
`verified`. A verified write names the signed-in person rather than `"curator"`.

⚠️ **The 11 `proposed` rows carrying `verified_by='Sam Lee'` / `'Jenni'` are NOT
this.** That is real attribution awaiting promotion and must never be swept with
the pass-through residue. Only `verified_at` + `verified_by='curator'` on a
non-verified row is the signature.

### Inactive and delete were missing affordances, not missing permissions

The database already carried `reviewer deletes cpl_memory`, `cpl_memory_log.action`
already accepted `'delete'`, and the log's FK is `ON DELETE SET NULL` so the
audit trail outlives the row. Only the UI never offered either.

⚠️ **Delete is reachable from the list and does not delete from the list.** It is
the only one of the five that cannot be undone, and one mis-click from "Stale" in
a list you click through quickly is the wrong home for that — so it opens the
entry's confirm, which is where the count of entries pointing at the row and the
reviewer-only warning fit. The ellipsis is the promise that it asks first.

⚠️ **Marking a row inactive drops it out of every list** (`matchesEntry` hides
superseded unconditionally), so the entry pane keeps its tools for a superseded
row — the undo lives on the only surface that can still reach it.

### ⚠️ The method lesson: five crashes that read as passes

Five separate times a perturbation reported **0 FAIL** while the suite had
actually *crashed* on an absent element and stopped, leaving every later check
unreported. The exit code said only "something failed". That is the S190
`exit=0 was my trailing grep` shape one layer in, and it is the most useful thing
this session learned: **a test must report a missing thing, never dereference
it.** All three suites now use safe accessors.
