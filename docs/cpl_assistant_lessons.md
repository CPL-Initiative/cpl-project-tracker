---
title: CPL Assistant (in-dashboard RAG chatbot) — lessons
date: 2026-06-01
tags: [lessons, cpl-assistant, chatbox, rag, supabase-edge-function, sse, session-26]
artifacts:
  - cpl_chat.js (front-end chat panel — static asset)
  - chatbox/supabase/functions/cpl-chat/index.ts (captured live Edge Function source)
  - chatbox/README.md (deploy mechanics + request/response contract)
  - "Supabase Edge Function cpl-chat (project hvuwhnbuahrtptokpqfh) — v15 ACTIVE, verify_jwt:false (model claude-sonnet-4-6)"
  - docs/kb-notes/cpl-chatbox-integration-scope.md (the Phase-0 scope/plan)
  - docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md (the durable redeploy procedure)
related:
  - CLAUDE.md §7c (CPL Assistant tab) + §8 (Supabase) + §3 (Cloudflare proxy precedent)
  - docs/quickstart_chat_lessons.md (the OTHER chat feature — the 1-of-N tab router; distinct workstream)
---

# CPL Assistant — lessons

Workstream scratchpad for the **CPL Assistant** dashboard tab — the in-dashboard
RAG chatbot that brings the live map.rccd.edu CPL chatbox into the project
tracker. Distinct from `quickstart_chat_lessons.md` (that's the lightweight
1-of-N **tab router**; this is a full streaming RAG chatbot). Append a dated
section every checkpoint.

---

> **History before 2026-08-23 moved to
> [`docs/cpl_assistant_lessons_archive.md`](cpl_assistant_lessons_archive.md)**
> (2026-09-11, `oversized_doc` at 1.02×). Fourteen sections, verbatim, nothing
> summarized. This doc keeps the recent ones and is still the one to append to.
>
> **2026-08-23 through 2026-09-18 (S185 to S274) moved to
> [`docs/cpl_assistant_lessons_archive_2.md`](cpl_assistant_lessons_archive_2.md)**
> (2026-10-16, S399, at 123,055 B of 120,000). Ten sections, verbatim.

---

## 2026-09-18 — SkyCompass (S275): "nearest" got a distance, Sam read v69 in a browser, and v70 answers the direct question first

**The ask (Sam's greeting, then his 05:55Z message, verbatim):** the greeting
handed over the queue: confirm v69 held, give "nearest" a distance, a time
limit on every retrieval RPC. Then, after reading v69's Orange County answer
in a browser (`chat_interactions` `f49a11c2`): *"Sierra is still answering
this test question wrong on a few accounts: 1. She says no OC colleges have
LVN, which is flat wrong. 2. She doesn't answer the question directly and
immediately looks for an exhibit when that wasn't the question asked. 3. She
starts by breaking one of our Sierra training rules by saying, 'Great
question.' Instead of giving the most direct answer to the direct question.
Please see if you can fold solutions in as you work on the queue."*

### v69 held overnight

All four tables whole (offerings 16,097 / 120; programs 22,335 / 118;
courses 141,696; geo 120); the 7c retrieval check by SQL (Orange leads with 6
contiguous rows, 44 Licensed Vocational Nursing rows); `list_edge_functions`
v69; the health cron green at 04:34Z; `function_logs` 03:52–05:33Z: 251
lines, 0 unavailable, 0 EMPTY ANSWER, 0 errors. No human turn until Sam's at
05:33Z.

### "Nearest" has a distance (commit 2242aefe)

Inside a proximity band the picks and the lists ordered by volume, which
says nothing about distance: Pasadena and Southwestern led the Orange County
LVN lists ahead of Long Beach City and Rio Hondo. No coordinate existed
anywhere in the repo or the database, and the sandbox cannot reach IPEDS or
the Census (both blocked by the egress proxy), so `COLLEGE_POINTS` is 119
campus points to three decimals entered from public campus locations,
approximate to about a mile, and the code says so. The anchor is the named
college's campus or the mean of the campuses inside the named place
(`placePoint`); `cmpKm` orders inside a band in all four lists, volume after;
an anchor with no point falls back to volume byte for byte, which is why
every existing fixture and assertion passed unchanged. Each heading carries
"about N miles from the center of Orange County". Measured on the live
Orange-anchored rows: Long Beach City 24 km, Rio Hondo 29, Mt. San Antonio 32.
`lift_ts.js` strips `Array<number>` and not a tuple type, so the table is
typed that way.

### Sam's three readings (commit 2188a23f)

1. **"No OC colleges have LVN, which is flat wrong."** Measured: the export
   holds no Vocational Nursing entry program at an Orange County college —
   Cypress, Golden West and Saddleback list LVN-to-RN bridges, no course sits
   under TOP 1230.20 in the county — so v69's sentence was what the catalog
   shows, phrased as a fact about the county, and every "NO college in the
   place" line told the model to "say so plainly". Every such line now states
   what the catalog shows and names the related programs there; smoke 7c
   fails the flat form. Which Orange County college runs an LVN entry program
   is his to name (`s271-sam-lvn-oc`, open since S271).
2. **The exhibit table led.** The prompt's own precedence line — *if a
   directive conflicts with the general instructions, the team guidance wins*
   — let directive 674923db ("answer with the colleges that have ALREADY
   articulated it, first and plainly") outrank PROSPECTIVE_RULE. The header
   now scopes each directive to the question shape it names, with the
   PROSPECTIVE CREDIT section as the signal; the LEAD bullet puts the
   courses first and articulations after, only for the credential held.
3. **"Great question."** Guidance row cafb92af says not to; the model wrote
   "Great question to be asking". The cached preamble now says the first
   sentence is the answer, never a remark about the question, and the smoke
   fails every mode that opens with one.

### The first A/B, and what the grid could not see (commit 01103aec)

Run 35314469546: no regressions, the candidate fixed 7c's absence check, and
its answer (`00b7168f`) opened with the ask, named the bridges and led with
Long Beach City (about 15 miles), Rio Hondo and Mt. San Antonio. Read
directly it showed two more things: no course code in its first 700
characters (the ask in general terms, then the catalog, then the bridges,
then the courses) and no Chaffey precedent ("only for the credential the
visitor holds" read as excluding a same-kind credential). And the grid said
"0 failing" over a preview log that ended SMOKE TEST FAILED: the compare
counts four error shapes and the two new checks printed a fifth and a sixth.
The LEAD bullet now names a course in the first sentence with the catalog
sentence following in the same paragraph; a same-kind credential counts and
CITE THE PRECEDENT names Chaffey's NURVN 414; every prose assertion prints a
counted shape (the pre-existing name-count helper had the same gap) and block
9 pins it; smoke 7c asserts the precedent; every curl carries a time limit
(mode 12's four had none). Run 35316558438 on the fix: **candidate ALL MODES
OK, no regressions**, both new 7c checks fixed; the answer (`ac2f4905`) opens
*"Ask the CPL coordinator at Long Beach City College to review your CNA
certificate against VN 220 — Transition to Vocational Nursing (4 units)"*,
states the absence as the catalog's with the three bridges, leads with Long
Beach (~15 miles), Rio Hondo and Mt. San Antonio, and cites Chaffey.

### v70, and the route time limit

#1611 squash-merged as `415b8e45` on green `test`; **v70 deployed 07:11Z**
(run 35318209938) under Sam's standing "apply and deploy, hone as we go" and
his "fold solutions in"; health and smoke dispatched after. The push-triggered
smoke runs the branch's assertions against production and is red by
construction until the deploy — one comment on the PR says so. The route time
limit (`s273-fable-route-time-limits`) is built on PR #1612: one fetch wrapper
on both supabase-js clients, every GET and rpc POST, 5,000 ms default,
`CPL_ROUTE_TIMEOUT_MS` overrides with no deploy, table writes exempt, one log
line per cut; `tests/sierra_route_time_limit.test.js` (22) proves the cut with
a fetch that never answers — Node keeps no event loop alive for an
`AbortSignal.timeout` timer, so the test holds a keep-alive or exits 0 with no
report. A/B on that branch before its deploy.

### Sam's decisions this run

- The three readings, verbatim above (`cpl_memory`
  `sam-v69-orange-county-answer-three-misses-2026-09-18`, a vault braindump).
- Deploy v70: on the standing authorization, no fresh go asked
  (`s275-deployed-v70-under-standing-authorization-2026-09-18`) — his to narrow.
- Still his: which Orange County college runs an LVN entry program; the 381
  garbled rows; auto-deploy on merge; whether guidance row 674923db should be
  re-scoped in the Training tab.

### After the checkpoint: v71, the time limit shipped, the compare's exit code

v70's post-deploy smoke failed the 7c head check, and the next push-smoke
against production failed it the same way: the answers opened with a CNA
course (Golden West NURS G060N, then Santa Ana VHLTH 101) and reached Long
Beach's VN 220 at character 854. Two causes, both in the context the model
read: the CNA section rendered first (the offerings RPC leads with the
county's rows, and Orange County teaches CNA, not LVN), and the block's intro
named the LVN license as the credential held — `search_credentials_any('lvn')`
returns it at tier 3 with three adopters and the adopted-first sort ranks it
first of six. The record matches every credential the question names; only
the visitor's words say which one they hold. v71 (#1614, `7d23be6f`) reads
the first-person holding phrase (`heldCredentialPhrases`), keeps the held
titles and their kind (`pickHeldTitles`, `sameKind` — Acute Care Nursing
Assistant stays, the LVN license goes), marks the held program BACKGROUND and
renders target sections first, with a fail-safe that marks nothing when no
target would remain. Block 10 of `sierra_prospective_credit` (131) pins it;
smoke 7c fails on a CNA course code in the first 300 characters and reads the
head at 400. KB note: `methodology-the-record-cannot-say-which-credential-is-held`.

A/B run 35322736555: no regressions, both 7c head checks fixed by the
candidate, the Chaffey precedent dropped on BOTH sides — three of the last
four Orange County answers dropped it, on v70 and the candidate alike, so the
precedent moves from the rule into the block next
(`s275-fable-precedent-in-the-block`). **v71 deployed 08:26Z** (run
35324360975; `list_edge_functions` v71), carrying #1612's route time limit.
The first measured cut: `search_college_programs` at 5,002 ms on mode 9 of the
preview smoke, failed safe, the answer passed every assertion.

Two instruments were wrong this run. The A/B compare's regression verdict
never reached the job — `python3 … | tee compare.txt` without `pipefail`
made the step's status tee's, so run 35320175425 printed one REGRESSION and
concluded success (#1615 sets pipefail). And `tests/check_floor.json` keeps
its floors under `files`; a top-level key is ignored by the runner, and one
had sat there at 60 since an earlier session while the files entry said 103.

### The lesson under the lessons

A reader who knows the ground is the test the grid cannot run. The smoke's
bar (a course code and the word "review") was met, and the answer still read
wrong to Sam three ways a regex did not see; his readings became fixtures the
same hour. And an instrument that counts what it knows how to count reads
"0 failing" over a failed run — a new check must fail in the shape the grid
counts, or it was never measured. And a prompt rule cannot outrun a context
that contradicts it: v69's rule already called the held program background,
and the model opened with it twice because the block's own intro said the
visitor held an LVN license. Fix what retrieval builds; pin what it builds.

## 2026-09-18 — SkyGauge (S276): the quick list, the flyer, "catalog data", and the precedent inside the block

**The ask (Sam's opening message, verbatim):** *"I tested Sierra with the same
question and it's returning expected results now. Sky Compass did great work!
Goal now would be for her to be able to add near the start of her detailed
answer a quick list view of the typical CNA course next to typical LVN
courses. The user did not say where they did their CNA, so being able to
generalize is an added skill level for Sierra. Response could be thought of as
a flyer—Have a CNA Cert? Ask for your credit toward LVN, Rad Tech, ADN, Med
Asst, Surgical Tech, Sterilization Tech, Phlebotomy…oops! got a little carried
away…but if Sierra were a counselor, she would have this at her fingertips for
the student."* And: *"Also, Sierra shouldn't use the inside term COCI. Instead
say something like catalog data."* Mid-session: *"Can we prevent the need for
me to approve all these sql queries?"*

### What the evidence said

- **v71's answer to his own test** (`chat_interactions` `a0f4a6ec`, 13:40Z)
  opened with Long Beach City's VN 220 and then wrote *"the COCI catalog
  doesn't list a full LVN entry program at any Orange County community
  college"*. The student-audience rule had banned the word since v22. It came
  from the CONTEXT: the three catalog builders headed their sections "COCI
  offerings", "COCI programs", "COCI catalog", and two catalog rules said
  "COCI program export". A prompt rule cannot outrun a context that
  contradicts it (the v71 lesson, again).
- **No route carried a statewide picture.** The prospective block reads the
  full course list of the three colleges nearest the visitor, per program.
  The visitor's own CNA college is unknown, so "what a CNA typically covers"
  needs the whole catalog. `chatbox_college_courses` holds it; PostgREST caps
  a read at 1,000 rows and says nothing when it cuts (Registered Nursing alone
  is 1,544 rows over 80 colleges), so the aggregation has to run in the
  database.
- **Measured, live, 2026-09-18.** TOP 1230.30 Certified Nurse Assistant: 65
  colleges, 195 rows; normalized and counted in colleges, 48 of 65 list a
  Nurse Assistant course, 10 an Acute Care Nurse Assistant, 7 Home Health
  Aide — unfolded, "nurse assistant" had been seven titles (11 + 10 + 9 + 7 +
  4 + 4 + 3). TOP 1230.20 Licensed Vocational Nursing: 44 colleges, 528 rows;
  Fundamentals of Nursing 13, Fundamentals of Vocational Nursing 10,
  Intravenous Therapy and Blood Withdrawal 8, Pharmacology 8, Vocational
  Nursing I 8. Level words (fundamentals, introduction, advanced) stay in the
  key; delivery and level suffixes (theory, lab, clinical, I/II, A/B) fold.
- **Sam's flyer maps to catalog codes.** LVN 1230.20 (44 colleges), RN/ADN
  1230.10 (80), Medical Assisting 1208.00 (57), Phlebotomy 1205.10 (26),
  Radiologic Technology 1225.00 (28), Surgical Technician 1217.00 (5), and
  the Sterile Processing programs are coded Hospital Central Service
  Technician 1209.00 (5).
- **The precedent** (S275's open item): three of the last four Orange County
  answers dropped Chaffey's NURVN 414 while the credential record carried it —
  the rule said "cite the precedent" and the record sat in another section.
  And v71 once attached Mt. San Antonio's VOC VN1 to Golden West
  (`39a328be`): a course under a college heading with no college on its line.

### The fix (cpl-chat v72, branch `claude/sierra-cna-credential-pathways-ptzlzw`)

1. **`program_typical_courses(top_codes, min_colleges, per_top)`** and its
   normalizer `cpl_course_title_norm(text)`
   (`chatbox/supabase_program_typical_courses.sql`, verify file beside it,
   applied live 2026-09-18 ~15:05Z, the nine verify checks clean). One row per
   program × normalized title: `count(distinct college)`, the colleges array,
   the modal title and unit value, one example course, the credit/noncredit
   split, and the program's college count as the denominator. Eight health
   programs aggregate in well under a second; there is no index on
   `top_code` and the table does not need one at this size.
2. **The QUICK LIST in the block.** `foldTypicalRows` folds the rows on a stem
   key and unions the college arrays; `buildQuickList` renders the held
   program first (what the credential covers) then the target (what to ask
   about), each course as *Title — at N of M colleges (e.g. College · CODE;
   usually U units | usually noncredit | credit at some colleges, noncredit at
   others)*. `PROSPECTIVE_RULE` gains THEN THE QUICK LIST: a two-column
   markdown table right after the first paragraph, held left, target right,
   five to eight rows, course names only.
3. **PRECEDENT ON RECORD inside the block.** `buildPrecedentLines` renders the
   held credentials' recommendation lines from the record already fetched,
   pairs a college with a course only when the record names one adopter, says
   "none" only when the record was read and holds none, and only when a
   holding phrase names the credential (with none, an LVN award would read as
   the CNA holder's precedent). The CITE bullet now points at these lines.
4. **The FLYER.** `RELATED_PROGRAMS` (Sam's list, keyed by 1230.30, attributed
   in the block), `heldProgramTops` (the BACKGROUND mark's program, with the
   block's own fail-safe, else an alias the visitor's words name exactly),
   `fetchProgramTeachers` (the offerings rollup by TOP), and
   `buildRelatedPrograms`: per program, the statewide college count, the
   in-place colleges nearest first or *the catalog data lists none in
   <place>* with the nearest two and their distance, and the typical first
   courses; programs the block already renders are skipped; a program with
   nothing in the catalog data is left out. Rule: CLOSE WITH THE FLYER, one
   line per program, at the end.
5. **The college on every course line** (`Pasadena City College · NURS 102 —
   …`), the intro says a course belongs to the college on its own line, the
   rule says it (THE COLLEGE IS ON EVERY COURSE LINE), and smoke 7c fails an
   Orange County college attached to an LVN course in the head; `VN1` and
   `Vocational Nursing 1` join the course alternation.
6. **COCI is gone from every rendered string** — "the college catalog data" /
   "the catalog data" / "the program catalog data" in the three builders and
   two rules; the always-on catalog rule carries the ban once; the smoke fails
   any mode whose answer says COCI, in the counted error shape.
7. **Fewer approvals.** `.claude/settings.json` allows the Supabase read tools
   (`execute_sql`, `list_edge_functions`, `query_logs`, `list_tables`,
   `get_edge_function`) without a prompt; `apply_migration` and the deploy
   still prompt. A permission rule is by tool name, so the allow covers SQL
   writes too — Rule 10 governs those; it takes effect at the next session
   start.

### How it was proven

`tests/sierra_prospective_credit.test.js` block 11 (163 checks, floor raised
from 131): the fold, the quick list, the precedent lines (Chaffey paired; two
adopters never paired; none/null/no-title shapes), the held-program lookup and
its fail-safe, the flyer for a place and for a named college, the whole block
with and without extras, the wiring, the rule bullets, the smoke assertions,
and that no rendered catalog text says COCI. `sierra_place_anchor` repinned
(77). `npm test` 346 of 346 files; 46 of the workflow's python/shell steps
green locally (the JS-suite gate step runs only in CI); `deno check` 15
errors, the identical set as `main`; `sierra_rule_defaults.js` regenerated;
the dependency map rebuilt (the new RPC and the offerings read appear as
edges). The A/B on the preview slug and the deploy follow this commit.

### Sam's decisions this run

- The quick list and the flyer, verbatim above (`cpl_memory`
  `sam-quick-list-and-flyer-a-counselor-at-her-fingertips-2026-09-18`; vault
  braindump 2026-09-18 14:45).
- Never "COCI"; say "catalog data" (`sam-never-say-coci-say-catalog-data-2026-09-18`).
- Fewer SQL approvals: the project settings allow the Supabase read tools.
- Still his: which Orange County college runs an LVN entry program; the 381
  garbled rows; auto-deploy on merge; guidance row 674923db's scope.

### Deployed: v72 live at 16:43Z

PR #1617 squash-merged as `fc3ebe3` on green `test` after main's #1618 was
merged in (the only conflicts were the three generated docs-audit artifacts,
regenerated on the merged tree). Deploy run 35370070548 byte-verified;
`list_edge_functions` reported version 72 at 16:43:19Z. Health run
35370311547 green at 16:45Z. The merge-triggered smoke (run 35370054033,
started 16:42:27Z, before the function swapped) passed every mode, the new 7c
checks included. The dispatched clean run, 35371403392 (16:56Z), failed one
mode — 9, the multi-college NCCER question — at curl's 90 s ceiling with
11,463 bytes received. The function finished that answer anyway:
`chat_interactions` `6547d030` at 17:02:17Z, 1,117 tokens, El Camino named
and not dismissed, so both mode-9 assertions hold on the completed text; the
runtime logged "connection closed before message completed" at 17:02:23Z,
which is the client having left. Mode 8 before it streamed 1,123 tokens in
~27 s and mode 10 after it 1,067 in ~11 s; mode 9's 1,117 took ~92 s. One slow
generation, then. Mode 9 had passed on this commit at 16:42Z, so the one
sanctioned re-run went out: 35373228305 (17:15Z). It failed mode 7c alone,
and the cause was measured outside the function. The scheduled
`map-custom-report-load.yml` (run 35372830989, cron 17:11Z) posted 629,232
rows to `stg_map_student_credit` in 126 batches from 17:13:41 to 17:16:37Z;
single requests ran up to 125 s at the gateway; Postgres canceled 20
statements on its timeout (15 of them at 17:19); and the function logged some
thirty route cuts between 17:16 and 17:21Z — `search_college_programs` on
nearly every request, `program_typical_courses` three times,
`chatbox_college_courses` twice, and once each for the offerings, exhibits,
credential and goal reads. 7c's answer (`e2a6aba3`, 17:20:19Z) came without
its block, as the route limits are designed to fail, and its five checks
failed as designed. Mode 9 passed in 25 s; every mode after 17:21Z passed.
The loader's job got HTTP 504 on its promotion call at 17:18:58Z and printed
"rolled back, live unchanged" — its first red after 38 green runs — and
`map_data_loads` row 35 shows the promotion committed at 17:16:52Z with
today's 629,232 student rows, reconciled. A gateway timeout ends the HTTP
call and leaves the Postgres transaction running to its commit; the client's
inference was wrong, and a loader that can be told 504 must read the table
back before it declares a rollback. The first clean run had shown the same shape in miniature: three 5 s
cuts during mode 8 at 17:00:08–14Z that failed safe. **The lesson:** a
scheduled bulk load saturates the database for about five minutes, the
function's route limits fail safe and the answer silently loses its block,
and a smoke inside that window fails 7c for the loader's reasons — the
function logs say `typical courses unavailable: TimeoutError`, which is the
tell. The loaders own the 17:06–17:20Z window (credential-catalog-sync 17:06,
custom-report load and college-briefing-publish 17:11); dispatch smokes clear
of it. A third clean run in a quiet window, 35374928638 (17:32Z), passed
every answer assertion — 7c's eleven included — and failed only the smoke's
own anon probe of `program_typical_courses` (rows=0 at 17:35:31Z: the anon
key's 3 s statement timeout, while a one-row `map_colleges` read took 3.1 s
at 17:38Z and the database showed no vacuum, no long transaction and no
loader — the function's fan-out of some thirty reads per request and the
probe share one PostgREST pool). v72's answers stand verified three times;
the pool is the open item, queued with the programs-route latency.
`function_logs`
16:43–16:50Z: 0 route time-limit cuts, 0 EMPTY ANSWER, 0 unavailable, 0
errors; `program_typical_courses` answered 5 of 5 calls with 200.

**Production v72's answer to Sam's question** (`chat_interactions`
`43fa4d62`, 16:45:44Z): the first paragraph asks about the fundamentals
courses and names Long Beach City's VN 220, Rio Hondo's VN 61 and Mt. San
Antonio's VOC VN101, with the absence stated as the catalog data's and the
three bridges named; then the two-column table, "What a CNA typically covers"
beside "LVN courses to ask about", each row with its college count (Nurse
Assistant 48; Fundamentals of Nursing 15); then the precedent (Chaffey's
NURVN 414, and Lemoore's HS 061 award); the request framing; and "Also worth
asking about with a CNA" — Registered Nursing at Santa Ana and Golden West,
Medical Assisting, and the rest. No COCI. One imprecision to watch: the model
called Chaffey's precedent "not an LVN-course match specifically", although
NURVN 414 sits in Chaffey's LVN program.

**A note for the SkyView lane, measured, not inferred.** PR #1619's commit
message attributes the loss of the read-only band in `prototype/skyview.html`
to #1617's merge. `git log -- prototype/skyview.html` on main shows the band
left in `7aabe52`, the daily dashboard cron commit between #1618 and #1617,
which rebuilt the page from sources that did not carry it (36 deletions);
#1617 did not touch the file. The cron rebuilds the served page, so a change
written into the built artifact lasts until the next run — #1619's fix (the
band in the sources) is the right one. It merged at 17:01Z (`1d65115`).
Between the cron commit and that merge, `test` on main was red on
`ccr_skyview_read_only.test.js` (run 35370054088 at `fc3ebe3`), and this
session's docs-only checkpoint PR inherited the red on its first push. The
remedy was the recovered base itself: merge main into the branch, which
carries #1619's fix, and the test passes on the merged tree (21 checks, with
`skyview_built_from_source_test.py` 8 of 8). A red `test` on a docs diff is
the base's state, and the first question is whether main is red too.

### The lesson under the lessons

A counselor's answer has a shape before it has facts: what you hold, what you
want, what to ask about, what else is open to you. Retrieval can render that
shape only from the whole catalog, because the visitor's own college is
unknown — "typical" is a count of colleges, never a list from the three
nearest. And a route that measures fast on two programs and slow on forty-seven
fails silently under the time limit, so the cost check belongs in the verify
file at the shape that fails. An inside term reaches the answer through the
context the model reads; rename it where retrieval renders it, keep the ban,
and guard the answer in the shape the grid counts.

---

## v73 — a sub-region is a place too, and one CNA course is not six (S277, SkyCaliper, 2026-09-18)

Sam: *"Sierra is still not answering correctly. The request was to compare
typical CNA courses to Typical LVN and other related jobs."* His visitor wrote
*"I have a cna cert and live in the San Gabriel Valley"*, and v72 answered by
recommending **Los Medanos College — Contra Costa County, 346 miles away** — as
*"one of the nearer matches I can confirm"*, while stating that the catalog data
showed no San Gabriel Valley college teaching an LVN entry program.

Five do, and the catalog held 87 course rows for them: Pasadena City
NURS 102/125 (28 rows), Citrus VNRS 150 (20), Glendale NS 110 (19), Mt. San
Antonio VOC VN101 (12), Rio Hondo VN 61 (8). Sam confirmed Citrus independently
from the college's own program page while the fix was in flight; the data had
been there the whole time.

### The place never resolved, and the answer argued with itself

`resolveAskedPlace` matched a county only with the literal word "county", three
aliases, and bare multi-word REGION names — and it deliberately skips
"Los Angeles" as a region because nine colleges carry it in their name. "San
Gabriel Valley" matched nothing, so `askedGeo` was null and both catalog RPCs
fell back to volume order, which is how northern California surfaced.

⭐ **The tell was in the answer.** It named Pasadena City College and Rio Hondo
itself — from the model's own knowledge of southern California — and then said
*"my data doesn't confirm their course lists here"* while the catalog held 28
rows and 8. When an answer names a thing and disclaims knowing it, retrieval
missed something the model did not.

`SUBREGIONS` gives thirteen sub-regional names their own anchor campuses. ⚠️ **A
county is not a fine enough anchor**: Los Angeles County runs from Lancaster to
Long Beach, and its centroid puts the San Gabriel Valley's colleges no closer
than anyone else's — so the county sets the proximity BAND and the centroid of
the named campuses orders WITHIN it. Re-ranked: Pasadena 6 mi, Rio Hondo 7,
Citrus 9, Mt. SAC 12, Glendale 12; Los Medanos falls to 34th of 43.
⚠️ **An ambiguous name is left out** — *South Bay* is Torrance to a Los Angeles
student and San Jose to a Bay Area one, and a confidently wrong anchor is worse
than none.

### One course, said six ways, read as six things a CNA studied

The table's left column listed *Nurse Assistant · Acute Care Nurse Assistant ·
Certified Home Health Aide · Acute Care CNA · Acute Certified Nursing Assistant
· Restorative Nurse Assistant*. Three of those six are the same course.
`cpl_course_title_norm` folded nurse/nursing and dropped "certified", but never
expanded **CNA** — the word colleges actually type for the program this function
groups. 22 colleges teaching one acute-care course arrived as seven rows
(10 + 4 + 2 + 2 + 2 + 1 + 1), and not one of them beat Home Health Aide at 7.

⚠️ **The prompt was the other half.** The rule demanded "five to eight rows". A
training program is often ONE course plus a few add-ons, so a row quota on a
two-column comparison makes the model reach for variants whenever one side is
genuinely short. The quota is gone; the columns are now stated as two
independent lists, because a markdown table invites a row-wise reading that
*Restorative Nurse Assistant ↔ Pediatric Nursing* never earned.

### Two corrections this session made to itself

⚠️ **"Nothing renders `norm`, so an unreadable key costs nothing" was false, and
it was written into the file as justification.** The first fix sorted the words
to make the key order-independent. The smoke's anon probe reads
`norm == "nurse assistant"` as a string, so it found no row and reported **0
colleges against a threshold of 30** — a red check on a function that had just
improved. Four files call that RPC; grepping them would have taken a second.

⚠️ **The sort was redundant besides.** `foldTypicalRows()` already groups rows by
`typicalFoldKey()`, which sorts the CONTENT STEMS and unions the college arrays
— word order has been folded downstream since v72. The load-bearing half was
always the expansion. The normalizer now dedupes in first-occurrence order and
leaves `norm` readable; the probe compares it as a word SET, so the next
revision cannot break it by reordering.

⚠️ **A guard pinned to a quotation is not a guard.** Mode 7s PASSED against
unfixed production. Its disclaimer ban listed v72's three exact phrasings, and
production said the same thing in new words — *"I don't have the specific San
Gabriel Valley college course lists in front of me right now"*. Worse, 7s asked
only for a college NAME, which the model supplies from its own knowledge while
naming no course at all. It now bans the family and requires a San Gabriel
Valley course **by number**, which only the anchor can supply. The A/B then
showed all five 7s assertions moving from fail to pass.

### The third correction: a canonical key is not free

The post-deploy smoke failed twice, and the second failure is what made it real
rather than flake. Every ANSWER assertion passed — 7c's quick list and Chaffey
precedent, 7s naming a San Gabriel Valley course by number — and the only red
was the smoke's own anon probe of `program_typical_courses`, reporting **rows=0
against a threshold of 30**. `postgres_logs` for that window held three
*"canceling statement due to statement timeout"* lines: the anon role carries
`statement_timeout=3s`.

Measured over all 141,696 titles:

| normalizer | ms |
|---|---:|
| pre-S277, no expansion | 3,463 |
| flat + expansion (shipped) | 3,987 |
| flat + dedupe | 5,203 |
| CTE chain + dedupe | 5,426 |

⚠️ **I had made it 57% slower to canonicalize a key that was already
canonicalized downstream.** The dedupe costs 1,216 ms and the CNA family is
**50 colleges either way**, because `typicalFoldKey()` sorts the content stems
and unions the college arrays before anything renders. The sort was the same
mistake in the earlier round; the dedupe was that mistake repeated one revision
later, in a different clause, for the same wrong reason.

⭐ **The expansion — the part that actually fixes the answer — costs 15%.**
Everything above that was work to make `norm` look canonical to a reader, and
`norm` is a grouping key nobody renders. The shipped function is one flat
expression: no CTE chain, no dedupe, no sort. The anon path went from 251 ms to
**62 ms**, well inside its 3 s budget.

The shape of the failure is worth keeping: the answers were right the whole
time. A cost regression on this route does not show up as a wrong answer, it
shows up as a *missing section* — the quick list silently absent — because every
retrieval read fails safe. The probe that caught it is the only thing that
looks at the RPC directly.

### What the deploy left open

v73 shipped at 23:01Z. Its answer opens where it should — *"Ask the CPL
coordinator at Pasadena City College to review your CNA training against
NURS 102 … or at Citrus College against VNRS 150 … All three colleges are in the
San Gabriel Valley"* — and its table carries six distinct CNA courses beside
eight LVN ones, with the lead-in saying the rows do not pair up.

But it also writes *"no exhibit in our data shows a college that has already
articulated CNA credit specifically into an LVN course"*, and **Chaffey NURVN 414
is exactly that** — Acute Care Nursing Assistant, 6 units, into an LVN-program
course. The precedent block surfaced Lemoore's CNA-into-a-CNA-course instead.
That was a weak precedent in v72; in v73 it has become a false negative, which
makes `s276-fable-precedent-names-its-program` the next fix rather than a
nicety.

### The lesson under the lessons

A false zero is the worst answer Sierra gives, and the two that produced this
one were both failures of vocabulary rather than of data: the place had no name
she knew, and the course had an abbreviation she did not expand. Neither showed
up as an error — both rendered a confident, well-formed answer. And the guards
written against them both passed at first, because each was pinned to the exact
words of the failure it had just watched instead of to the thing that must be
true.

The session's own three corrections rhyme, too. Twice I made a grouping key more
canonical in SQL — first by sorting it, then by deduping it — and both times the
work was already done downstream, both times it cost real milliseconds, and both
times a consumer I had not looked for paid for it. Before making a value
canonical, find out who reads it and whether something else already has.

### Postscript, 2026-09-19: the probe that could not tell a timeout from a wrong answer

Three post-deploy smokes on v73 failed, and all three failed on the same single
assertion: the anon probe of `program_typical_courses` reading **rows=0 against a
threshold of 30**. Every answer assertion passed in the third run. The logs
settle it:

```
00:22:24  POST | 200 | .../rpc/program_typical_courses | Deno/2.1.4   ← the function
00:23:43  POST | 200 | .../rpc/program_typical_courses | Deno/2.1.4
00:24:14  POST | 500 | .../rpc/program_typical_courses | curl/8.5.0   ← the probe
00:24:17  {"code":"57014", ... "canceling statement due to statement timeout"}
00:24:22  POST | 200 | .../rpc/program_typical_courses | Deno/2.1.4
```

The function's own calls to the same RPC return 200 on either side of the
probe's 500. The RPC executes in **115 ms** with every buffer a shared hit. What
the probe hit was the anon role's `statement_timeout=3s` under momentary
contention — the shared-pool item the S277 handoff already had open as sequence
9, now reproducible rather than occasional.

⚠️ **The probe's defect is that it reports a timeout and a wrong answer
identically.** Its Python reads `rows = rows if isinstance(rows, list) else []`,
so a 500 with a `57014` body becomes `rows=0`, which reads as *"the normalizer
stopped folding"* — and that is exactly how it was read, twice, sending this
session chasing a cost regression that had already been fixed. A check that
cannot distinguish "the thing is broken" from "I could not ask" will eventually
spend somebody's afternoon.

⭐ **And the first instrument reached for lied.** `EXPLAIN (ANALYZE, TIMING ON)`
put the statement at 4,809 ms, with the sequential scan at 4,794 ms and 141,366
rows discarded by filter — an open-and-shut argument for indexing `top_code`.
`TIMING OFF` on the same statement in the same session: **115 ms**. The clock
calls were the cost. Acting on the inflated figure would have added an index to a
141,696-row table whose loader replaces every row, which this repo has already
been burned by. Filed as
[`methodology-explain-analyze-timing-is-not-free`](kb-notes/methodology-explain-analyze-timing-is-not-free.md).

## 2026-09-30 — S309 SkyCensus (joined with S308 SkyBracket): the catalog timeout, and two checks that failed right answers

**The timeout (#1789, Sam: "Go ahead with the stored column").** Smoke 7c's direct call to `program_typical_courses()` failed on the anon key's 3 s. The function called `cpl_course_title_norm()` once per matching row, every call. The same 723 rows (TOP 1230.30 and 1230.20) measured 4,178, 79 and 503 ms on three calls; `pg_stat_statements` read 153 PostgREST calls at a 2,552 ms mean (max 7,944), while the direct query took 83 ms. So the cost was variance under load, not size: a per-row SQL-function call is the part that swings. `chatbox_college_courses.title_norm` (generated, stored) now holds the normal form; the call reads the column and measured 88 ms through the PostgREST query shape, with identical md5 over 47, 2 and 66 programs. ⚠️ **A stored value does not follow its function:** Postgres lets the normalizer be replaced while the column depends on it and keeps the old values, so the schema of record recomputes (`set title_norm = default where title_norm is distinct from ...`) right after the normalizer, and verify A0 counts stale rows. Writers checked first: the loader upserts built columns only (500 a call, inside PostgREST's 8 s), and the clean-up rollback copies only its `COLS`.

**The next run's two failures were the checks, not Sierra (#1791).** 7c banned "no Orange County college teaches LVN", and Sierra wrote *"The catalog data lists no Orange County community college currently teaching a full LVN entry program — Golden West, Cypress, and Saddleback do offer LVN-to-RN bridge programs"*: the exact form `methodology-an-absence-in-the-data-is-a-statement-about-the-data` prescribes. 7s banned a San Gabriel Valley false zero and caught *"No San Gabriel Valley college has yet articulated CNA-to-LVN"*, a true statement about articulation in an answer that named Rio Hondo VN 61, Pasadena NURS 102 and Citrus VNRS 150. `answer_must_not_claim_absence` sets both shapes aside first; a bare claim still fails. The guard runs the helper from the script, in bash, with the smoke's own patterns. **A ban on a false sentence must not ban the true sentence the doctrine recommends; test the guard against the recommended wording, not only against the failure.**

**Later the same evening: a word inside a word, and the program search (#1794, #1796).** The smoke after #1791 failed 7s again on a right answer: *"A few notes on the colleges in the San Gabriel Valley: Pasadena City College, Rio Hondo, and Citrus College all teach full LVN programs"*. The pattern's `(does ?n.t|do ?n.t|no|none)` had no word boundary, so *no* matched inside *notes*; `\b(...)\b` fixed it (#1794). The same run's 7p call to `search_college_programs` timed out: it built four tsvectors over 22,335 programs per call (1,391 PostgREST calls, mean 2,353 ms, max 7,951). Sam: *"Go ahead with the stored vectors"*. The four are generated columns now, `cx_search_norm`'s own file recomputes them after defining it, and verify A9 counts stale rows (#1796): a 4-term call 1,473 → 415 ms, the LVN question 896 → 355-749 ms, 30 terms 2,724 → 1,943 ms. What remains is the per-term frequency count, about 60 ms a term, which is the design. **Equivalence needs a baseline the function determines:** the full ordered hash changed between two identical calls, because rows sharing a college and title swap; the (college, title) sequence and the sorted row set held, and a limit that cuts a tie has two valid sets.

**Still open:** the CCSF check waits on Sam (sheet 11 card 6); `pg_stat_statements` for the program search after a day.

## 2026-10-01 — S313 SkyReel: a possessive hid the college (v77)

Sam ruled v76's City College of San Francisco answer wrong (sheet 14 card 1): she gave the statewide split. The rows were there. `detectAndFetchCollegeProfile` stripped punctuation only at a word's ends, so "Francisco's" searched `%francisco's%` and matched nothing; "city" then tied across a dozen City colleges, nothing resolved, and the credit context carried only the statewide block. It strips `'s` and `’s` now; `sierra_geo_ranking` 3b runs his question against twelve City colleges, red before and green after (#1808, v77). The same deploy keeps 7c's first sentence to the course, its title and its college; the dispatched smoke on v77 passed every mode. **Lesson:** when a named college gets a statewide answer, test detection on the exact sentence first; the data was never the problem.

## 2026-10-02 — S314 SkyVerdict: v77 checked on his question, then three versions to keep the place without losing the lead (v78–v80)

**The "wrong" was about v76.** Sam's sheet 16 card 1 said "Sierra said she didn't have the split for SF". `chat_interactions` held one CCSF ask, at 21:14Z on 1 October, two hours before v77 shipped; nobody had asked v77. Smoke mode 15e now asks his exact question (run 36947828031): 13,914 units, military 13,844, non-military 71, led by Default Credit, each matching the day's rows. **Lesson:** before fixing a verdict, find the answer it judged and the version that wrote it.

**Three rounds on one paragraph.**
- v77's LEAD rule kept the county out of the first sentence, and the place rule asked for the full name only "the first time you mention it", so 7s dropped "San Gabriel Valley" one run in three.
- v78 (#1811) put the place in the first paragraph. 7c then led with Santa Ana's VHLTH 101, a nurse assistant course, because a course *in* Orange County was the easy way to name it. That shipped without a preview A/B; the A/B is the instrument for prompt changes, and this round is why.
- #1812's first A/B led 7c right (Long Beach City College, VN 220) and closed with the absence rule's own quoted counterexample, word for word. The quote left the prompt (KB note: [`methodology-a-prompt-that-quotes-the-wrong-sentence-teaches-it`](kb-notes/methodology-a-prompt-that-quotes-the-wrong-sentence-teaches-it.md)); the second A/B passed; v79 deployed.
- v79's smoke led 7c with Golden West's NURS G060N. The root: "Treat the place as home: lead with its colleges" in the rule, and "Lead with what the colleges in <place> teach and award" in the place block, both pull against LEAD WITH THE ANSWER whenever the place lacks the program. #1813 lets the place lead only when its colleges teach the program asked; a place college teaching only the held credential never leads. Third A/B clean; v80 deployed 03:05Z.

**Lesson:** a half-holding behavior with two instructions in play is a conflict to find, not a sentence to strengthen. Each patch to the first-paragraph wording moved the failure; removing the competing instruction fixed it.

**7c's timeout (run 36943057866) was the database, not the wording.** Three catalog reads hit the 8 s limit together; `program_typical_courses` ran 48 ms quiet and 3,800 ms while a smoke ran; `chatbox_college_courses` has no `top_code` index. Recorded as a measured candidate (`cpl_memory` `sierra-catalog-reads-timeout-under-load-2026-10-02`); the SQL guard refuses a session's index DDL, so it goes by migration.

**The 7s guard read markdown emphasis as text.** "none of the three San Gabriel Valley colleges above currently has an *articulated* CPL exhibit" failed the absence check; the helper now strips `*` and reads the adjective form (`sierra_smoke_absence_claims`, red before).

## 2026-10-02 — S315 SkyLedger: v80's clean smoke, and the top_code index

**v80 holds.** The first smoke after the #1813 deploy that ran alone (run 36961860002, 03:50Z) passed every 7c and 7s check: 7c opens on Long Beach City College's VN 220 with Orange County in the same sentence, 7s on Rio Hondo's VN 61 with the San Gabriel Valley named. No CNA course leads.

**The catalog index, measured first.** `program_typical_courses` filters `chatbox_college_courses` by `top_code` alone, and the table had no index on it: a sequential scan of 4,215 buffers keeping 723 of 141,696 rows took 3.4 s, then 1.9 s, on a quiet database (`explain (analyze, buffers, timing off)`); the whole function took 1,521 ms. The same table's `college` btree answered a lookup of similar selectivity in 28 ms. The loader upserts 500-row batches, so the write side carries per-batch maintenance only. Migration `chatbox_college_courses_top_code_idx` (#1817, receipt `kb/receipts/chatbox_college_courses_top_code_idx_2026-10-02.sql`): 15.5 ms, 419 buffers, the same 21 rows. The methodology note gained the counter-case.

**Lesson:** "48 ms quiet" from an earlier session was a different instance state; the same scan read 1.9-3.4 s today with nothing else running. Time both sides in one sitting, minutes apart, before deciding.

## 2026-10-02 — S318 SkyKeel: a program's own course list, joined at last

Sam: *"Goal is to be able to list the courses in particular programs at a given college."* The data had sat
in the repo since 2026-07-16 (`kb/reference/coci_program_course_file.csv.gz`, the Data Mart Program Course
File, 401,163 rows); Sierra never read it. She listed a program's courses as every course at the college
sharing its TOP code. Measured over 19,883 active programs: a median 33% of a program's courses found, a
median 44% of what she returned in the program; Mt. San Antonio's LVN-to-RN A.S. lists 27 and the proxy found
the 7 NURS courses. The anatomy, physiology, microbiology, English and psychology a program lists sit outside
its TOP by construction.

- **#1826** `coci_program_courses` (313,710 rows, 20,451 of 22,335 programs) and `coci_college_programs.control_number`.
  The MIS college code resolves through two signals that must agree (programs and courses); MIS
  `CB_COLLEGE_ID` decides which college owns a course, because the course list files College of the Desert's
  AUTO 10 under Citrus College.
- **#1827, #1829** the loader: upsert under a load id, prune earlier loads only after an exact count. The
  count timed out right after each 313,710-row write (8 s+ for two minutes, 93 ms once autovacuum finished),
  and the write itself was needless: the payload had not changed. The load id is now a content hash and an
  unchanged payload writes nothing. KB note: `methodology-a-load-id-should-be-the-content`.
- **#1828** the route: `college_program_courses()` calls `search_college_programs` narrowed to one college
  (one matcher), returns 8 candidates, and Sierra re-ranks them by the visitor's own words, because inside one
  college the matcher's order is loose ("nurs" matches Nursery Management, so Vocational Nursing ranked 5th
  for "LVN"). A program LISTS a course; she never says "required" or totals units.
- **The connector's confirm.** `apply_migration` timed out at 60 s, applying nothing, on every statement
  carrying drop, revoke or delete. Sam ran that SQL himself (the first paste was the file's name: hand over the
  SQL, never a path). The same SQL closed three catalog loaders that `authenticated` could run.
- **A smoke during a catalog reload fails on load.** 7r/7p timed out while `coci-offerings-sync` truncated and
  reloaded the offerings and programs tables; nothing in the answers failed.

**Next:** the reload that fills `control_number`, Mt. San Antonio 08086 joining 27 rows, the A/B preview, then
Sam's deploy go. The prospective-credit block (`fetchProgramCourses`) still reads the TOP proxy.

## 2026-10-03 — S319 SkyRudder: the course lists deployed, a rule Sierra repeated, and the timing log

The reload filled `control_number` on all 22,335 programs and Mt. San Antonio 08086 joined 27 rows. Smoke mode
**7l** (#1832) asks for the LVN-to-RN courses at Mt. San Antonio and asserts a course outside nursing by number,
which only the new route can supply; retrieval first (27 listed, 7 subjects outside NURS, 0.33 s), then the
prose. `tests/sierra_program_courses.test.js` block 9 re-derives the smoke's terms from `index.ts`.

- **The A/B read the answer, and the answer carried the rule.** Run 37126608238 passed every mode and listed all
  27 courses, then wrote that honors versions "appear side by side rather than as substitutes you'd choose
  between". The block's rule said "honors versions and alternatives appear side by side". A student reading the
  answer takes ENGL C1000 and C1000H both. The rule now states the claim a student needs: a student takes one
  course of each honors pair. The second A/B said "a student takes one from each pair, not both". KB note:
  `methodology-write-the-rule-as-the-sentence-you-want-said`.
- **Deployed 2026-10-03 14:15Z** (run 37128917426, Sam: "go ahead and deploy once the A/B is clean"). The smoke
  after it failed 7c (the quick-list table at character 1,891 of an 1,800 window) and 7s (a true articulation
  absence the helper missed: "has an exhibit specifically articulating"). Neither question reaches the new block.
  #1833 sets "exhibit" and "-ing" aside as articulation; its push smoke against production passed every mode.
- **The timing log** (#1834, deployed 14:57Z, Sam's ask after his Jev question): `chat_interactions.timings`
  per turn, five phases plus every PostgREST read. First 23 turns (the preview's smoke): median 15.2 s, first
  word 6.1 s, writing 8.8 s, prep 2.2 s, retrieval 1.4 s, model wait 0.9 s, embed 0.15 s. The model's writing is
  the largest share, so faster reads alone cannot halve the wait. The insert's returned error is now logged:
  supabase-js returns it, never throws it, so a row the table refused vanished with clean logs.
- **One suite at a time, by cancelling.** Every push touching `index.ts` or the smoke starts a smoke against
  production. Four times this run a second suite was due while one ran; cancelling the redundant run (and
  saying why once on the PR) kept every grid readable.

**Next:** read `timings` over real traffic; switch the prospective-credit block from TOP to the real lists.

## Moved from the lane (S372)

From `docs/reference/lanes/sierra-retrieval-corpus.md`, verbatim, to keep the lane under its budget:

**S308/S309 (the two chains joined, 2026-09-30).** ⚠️ **The two-view gap is mostly a double count:** on 253 college × exhibit × catalog year × recommendation keys at 24 colleges, `View_CollegeExhibitCRByCatalogYear` reads exactly twice the student view for the same students, 6,782 of the 8,474 units; `cpl_memory` `map-catalog-year-view-doubles-applied-2026-09-30`. **WRONG (Sam, sheets 14 and 16 card 1): v76 gave CCSF's split statewide.** ✅ **v77 (#1808) answers it:** the matcher strips a possessive (`sierra_geo_ranking` 3b); smoke 15e asks his question (run 36947828031: 13,914 units, led by Default Credit, matching the rows). ✅ **The place (S314, v80, #1813):** it leads only when its colleges teach the program asked (v78/v79 led 7c with Orange County CNA courses); the absence is said once; the prompt quotes no wrong sentence. First clean smoke (run 36961860002): 7c leads LBCC VN 220, 7s Rio Hondo VN 61, all pass. ⚠️ **7c's catalog reads still time out under load:** run 36943057866 (23:55Z) lost `program_typical_courses`, `search_college_programs` and a `chatbox_college_courses` read to the 8 s limit together; 48 ms quiet, 3,800 ms during a smoke. ✅ Migration `chatbox_college_courses_top_code_idx` (S315): `program_typical_courses` 1,521 → 15.5 ms (quiet database), 4,215 → 419 buffers. ✅ **7p (#1796):** `coci_college_programs` stores its four search vectors (`cx_search_norm`'s file recomputes them); identical on 13 term sets, a 4-term call 1,473 → 415 ms.

## S372 SkyRedwood (2026-10-12): 7c's precedent line names the course's program (v91)

- **The miss was a misreading the line invited.** Production's side of A/B 38281837466 wrote: Chaffey's Acute Care Nursing Assistant articulation is "against CNA-level courses, not LVN ones ... would be a first". NURVN 414's title begins "Acute Care Nursing Assistant", so the model read the course as CNA level. S371 had shown the context was the same on passing and failing turns; this run shows what the model did with it.
- **The fix names the course's field from the catalog data** (`fetchPrecedentCourses`, one read of `chatbox_college_courses`): "NURVN 414 is a Licensed Vocational Nursing course at Chaffey College (6 units), the program the visitor wants to enter: this is the precedent for this request". The mark needs a title word to agree with the TOP, so TOP never decides alone. NURVN 414 is not on Chaffey's Vocational Nursing program list, so the line names the course's field, not a program list.
- **Read the A/B's answers, not only its grid.** The grid read clean both ways; the candidate's 7s turn had 11.5k fewer context characters, which looked like a regression until `timings.slowest_read` showed `search_college_programs` cut at the 5,000 ms route limit, a read the change does not touch.
- **The push smoke can straddle a deploy.** Smoke 341 started at 17:26:41Z, a minute before v91 went live; its 7c turn (17:29:50Z) was on v91. Judge a smoke turn by its own timestamp.

## S399 SkyRowan (2026-10-16): the statewide catalog, A/B to deploy in one sitting

**Sam's words this run.** Open Asks Sheet 85 card 7, *Deploy Sierra*, 17:51Z, his own call (`cpl_memory` `sam-sheet-85-rulings-2026-10-16`).

- **#2164 merged after a merge of `main`** (the dependency map conflicted with #2163; regenerated, never picked). The A/B on `main` (`cpl-chat-preview-ab`, run 38936738312, `cleanup: true`) read production 5 failing assertions, all smoke mode 7w, and the candidate all modes OK, no regressions. Its grid sits in the 190-line tail of the job log, before the upload step; a 110-line tail stops short of it.
- **The deploy went to Sam as a card, the card went to a fresh sheet** (Sheet 85, `5q9urLR8X9y6vokcppgDFk`), he answered within the hour, and `cpl-chat-deploy` (run 38943025631) then `cpl-chat-smoke` (38943211844) ran green with 7w. The answer came first through the sheet's Complete comment; the store is the authority and held the same seven verdicts.
- **`fact-sheet/statewide_catalog.json` read stale on `main` for one afternoon:** the 16:52 daily run refreshed `statewide_data.js` before #2164 wired the catalog's rebuild into it, so `check_generated.sh` failed every branch cut from `main` until #2166 regenerated it (only `source_generated_at` moved).
- **`docs/cpl_assistant_lessons.md` was compacted first** (#2165): ten sections to `docs/cpl_assistant_lessons_archive_2.md`, verbatim, 123,055 B to 54,424 B.

## Moved from the lane (S399 compaction)

**7c's precedent line names the course's program (v91, S372, #2040; Sam, Open Asks Sheet 69 item 3, *Tune it*).** The miss was the model reading NURVN 414's title and calling it a CNA-level course (the production side of A/B 38281837466: "against CNA-level courses, not LVN ones ... would be a first"). `fetchPrecedentCourses` reads the paired course's catalog line; the line now says it is a Licensed Vocational Nursing course and, in the program asked about, the precedent for this request (a title word must agree with the TOP). A/B clean; v91 live 17:27Z; smoke 341 green, its 7c cites NURVN 414. The smoke's 7c check still passes on any mention of Chaffey.

## S400 SkyBirch (2026-10-16): My College's Sierra in Sierra AI's format; the program search's no-match path

**Sam's words this run.** In chat, about 19:24Z: *"pick back up on the Sierra AI consolidation and make sure it's integrated in the My College tab, which still has the old format"* (`cpl_memory` `sam-my-college-sierra-ai-format-2026-10-16`, verified).

- **The old format was visible, not in the code's shape.** S398 built one Sierra, `CPL_CHAT.open()` over any tab, and both boxes already shared `build()`. What differed was the docked state: My College painted three nested cards (`.cb-assist`, the `<details>` drawn as a `.cb-sec`, the log's 240px frame), the description and the Note above the role row, and *Full screen* on its own row. Screenshots of both, side by side, made the ask concrete before any edit (`npm install`, then Playwright through `a11y.config.js`'s own seeds).
- **#2171:** the intro carries the heading alone; Sam's 2026-08-21 Note, verbatim, moves under the box (`.cplchat-foot`) in both boxes and both states, which also gives Sierra AI over a tab the caution it had lost (full screen hides the intro, so it showed only the privacy half); the description sentence is gone; the log has no frame and no floor, with a rule above and below once it holds a conversation; My College's `<details>` draws no card inside the heavier `.cb-assist` frame (Sam, 2026-08-12), its summary is the ruled bar, and CSS places *Full screen* at the bar's right end (the control stays a child of her wrap so it travels to full screen). Guard `tests/my_college_sierra_ai_format.test.js` (12 of 15 fail on the prior commit); `npm run a11y` passes all six Sierra views.
- **The smoke's 7l negative control timed out (57014) on a data-only PR.** It tests production, and ran on #2170 only because the branch's push carried earlier `chatbox/` commits. The cause was `search_college_programs`'s fuzzy fallback: `(college_filter is null or p.college = college_filter)` cannot be served from `coci_programs_college` by a generic plan. #2173 splits the fallback per scope (rows unchanged; the canonical file had matched live by normalized md5 first) and `supabase-migrate.yml` applied it. The 7l call went from 2,742 ms to 204 ms; production smoke 38968410799 passed every mode.
- **Two wrong turns, both corrected in place.** The first PR comment blamed harvest growth; `college_program_courses` never reads the harvest (it reads the COCI tables), and the comment was edited. The first timing after the apply read 2.80 s; the same call read 354 ms a minute later, a cold read after the function was replaced. Re-measure before reporting a regression.
- **The repo's Supabase guard blocks `create`, `do` and `replace` through `execute_sql`, temporary functions included.** Equivalence came from the predicate's logic and the generic-plan timing came from `prepare` with `plan_cache_mode = force_generic_plan`, which the guard allows.
- **Still costly:** the materialized `tv` CTE builds every program's tsvectors on each call (about 0.9 s). The lane names it as the next cut if `timings` show it.

## Moved from the lane (S400 compaction)

From `docs/reference/lanes/sierra-retrieval-corpus.md`, verbatim, to keep the lane under its budget:

- (v73, `program_typical_courses()`) (50 of 65 CNA colleges list a Nurse Assistant course, 16 an acute-care one; Fundamentals of Nursing 15, Fundamentals of Vocational Nursing 12, Vocational Nursing I 10, Pharmacology 8, IV Therapy 8 of 44 LVN colleges)
- ✅ **397 garbled course titles removed** (2026-09-27; `--rollback` restores).
- ✅ **Timing log (#1834):** `chat_interactions.timings` per turn (first read: `cpl_memory` sierra-timing-first-read-2026-10-03).

## S418 SkyMadrone (2026-10-18): the complete-records read deployed; a regressed mode must reach the changed code

- **Three A/Bs, three different regressions.** Run 1 (39142613772) lost 7l to a real gate bug (Active-only; COCI marks most credit programs Approved; fixed in 57b25bb4). Run 2 (39145439350) regressed 7c and 9; run 3 (39147745774) regressed 7s alone, with 7c and 7l green and production ALL MODES OK each time.
- **Trace the regressed mode's route to the diff before calling it systematic.** 7c (Orange County) and 7s (the San Gabriel Valley) name a place. `resolveAskedPlace` strips the place from `routeText` before `detectAndFetchCollegeProfile(routeText)` runs (index.ts 6404; "san gabriel valley" sits in the place table at 2697), so `singleProfile` is null for both, and the one block #2230 changes in the function, the complete-records read behind the program course lists (6552 to 6557), runs only when a single college is asked. A mode that cannot reach the changed code cannot regress from it. The A/B runs its two smokes one after the other, so contention is not a cause either. The candidate's 7s answer never used the regional course lists production's did, from the same context: model variance on a prose smoke, as the smoke's own header warns.
- **Where the prose is.** The run artifact (prod.log, preview.log) sits on an Azure blob host the sandbox proxy refuses (403). The `ab` job log holds both runs' answers: `get_job_logs` with `tail_lines` 6000 (380K characters, saved to a file) and a slice per `MODE:` heading reads them side by side.
- **Deployed from main at 17:52Z (run 39151585102) after the merge; the production smoke (run 39151861384) followed.** The lane records its result.

## Moved from the lane (S465, 2026-10-24)

Verbatim from `docs/reference/lanes/sierra-retrieval-corpus.md`, moved to bring the lane under its size budget.

✅ **The no-match fallback reads one college by equality (S400, #2173, applied by `supabase-migrate.yml` run 38967045972):** `search_college_programs`'s fuzzy fallback filtered `(college_filter is null or p.college = college_filter)`, which a cached generic plan cannot serve from `coci_programs_college`, so the smoke's 7l negative control (a nonsense phrase at Mt. San Antonio) timed out at anon's 3 s (57014, run 38957574640). One branch per scope now; rows unchanged. The 7l call measured 2,742 ms before and 204 ms after (354 ms with generic plans forced). The materialized `tv` CTE still builds every program's tsvectors per call (about 0.9 s), the next cost to cut if timings show it.

**Sierra quotes complete records (S416 to S418), the A/Bs before the deploy.** Three A/Bs preceded it: run 1 (39142613772) lost 7l to the Active-only gate (COCI marks most credit programs Approved; fixed in 57b25bb4, the gate now mirrors the harvest's STATUS_FILTER); run 2 (39145439350) regressed 7c and 9 and run 3 (39147745774) 7s, place questions that `resolveAskedPlace` strips before the college matcher runs, so neither reaches this block: model variance, not the candidate (`docs/kb-notes/methodology-a-regressed-mode-must-reach-the-changed-code.md`).

## Moved from the lane (S469, 2026-10-25)

Verbatim from `docs/reference/lanes/sierra-retrieval-corpus.md`; the page has since taken the library look.

### The standalone page on a phone — the About Sierra control (2026-09-11)

Sam: *"the current mobile view is mostly consumed by the header text."* The intro and beta paragraphs became an **About Sierra** control in the header (an accessible `<button aria-expanded>` panel; the footer keeps the beta and privacy lines); the map.rccd.edu pill hides ≤560px and the tagline ≤400px (`mayHideBelow` in `a11y.config.js`). **Measured at 390×844: the conversation starts 163px down (19%) against 540px (64%) before**; `npm run a11y -- sierra` clean at all nine widths. Guard: `tests/sierra_header_about.test.js` (23). **Open (Sam's ask, flag built, bubble UI not):** a floating Sierra bubble on every COBI tab — `kb/cpl_todos.json` `s255-sam-sierra-bubble-on-every-tab`.
