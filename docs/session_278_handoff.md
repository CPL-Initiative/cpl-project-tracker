---
title: Session 278 handoff — part one, Sierra v73 (a sub-region is a place, the CNA quick list is four real courses); part two, the SkyView curation ladder and the re-mint blast radius
date: 2026-09-18
session: 277 (SkyLedger) and 277 parallel (SkyCaliper)
tags: [handoff, sierra, prospective-cpl, place-anchor, skyview, auth, remint, execute-sql]
status: current
superseded: true
superseded_by: session_279_handoff.md
---

# You are Session 278

Your moniker is **SkyWarden** — this session built the gate (who may stage, who
may save, who may leave the page) and the instrument that says what a re-mint
would cost. What is left is the surface that shows it.

⚠️ **TWO SESSIONS RAN 2026-09-18 IN PARALLEL, AND BOTH WROTE THIS FILE.** Part
one (immediately below) is the **Sierra** lane, added by **SkyCaliper**; part two,
from "THIS IS AN EMERGENCY CHECKPOINT" onward, is the **SkyView / auth / re-mint**
lane written by SkyLedger. The moniker **SkyWarden** and the sign-off line at the
bottom stand for both. Read part one first if the queue is Sierra, part two first
if it is SkyView; the two touched no common file (verified: the `cpl-chat`
function bytes are identical across SkyLedger's two merges).

---

# PART ONE — SIERRA (SkyCaliper)

## ✅ cpl-chat v73 IS LIVE (2026-09-18 23:01Z, `list_edge_functions` v73)

Sam, reading a v72 answer: *"Sierra is still not answering correctly. The request
was to compare typical CNA courses to Typical LVN and other related jobs."* His
visitor wrote **"I have a cna cert and live in the San Gabriel Valley"**, and v72
sent them to **Los Medanos College — Contra Costa County, 346 miles** — while
stating the catalog showed no San Gabriel Valley college teaching an LVN entry
program. **Five do, 87 course rows between them:** Pasadena City NURS 102/125
(28), Citrus VNRS 150 (20), Glendale NS 110 (19), Mt. San Antonio VOC VN101 (12),
Rio Hondo VN 61 (8). Sam confirmed Citrus independently from the college's own
page while the fix was in flight.

**Three defects, all fixed and shipped ([#1624](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1624), [#1629](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1629)):**

1. **The place never resolved.** `resolveAskedPlace` knew `<county> county`,
   three aliases and bare REGION names, and skips "Los Angeles" because nine
   colleges carry it. `SUBREGIONS` (13 names) now carries its own anchor
   campuses: the county sets the band, their centroid orders within it.
   Re-ranked — Pasadena 6 mi, Rio Hondo 7, Citrus 9; Los Medanos 34th of 43.
2. **The CNA column was one course said six ways.** `cpl_course_title_norm`
   never expanded **CNA**, so 22 colleges teaching one acute-care course arrived
   as seven rows. It expands `cna`/`lvn` and folds `aide`→`assistant` now.
3. **The rule demanded "five to eight rows"**, which forced the padding. Gone;
   the columns are stated as two independent lists.

**A/B run 35402876913: candidate ALL MODES OK, ZERO regressions, five 7s
assertions fixed.** The deployed bytes are identical to the A/B'd commit.

## ⚠️ WHAT THE SIERRA LANE OWES YOU

1. **`s276-fable-precedent-names-its-program` is now a FALSE NEGATIVE, and is the
   next Sierra fix.** v73 writes *"no exhibit in our data shows a college that has
   already articulated CNA credit specifically into an LVN course"* — **Chaffey
   NURVN 414 is exactly that** (Acute Care Nursing Assistant, 6 units, in
   Chaffey's LVN program). The block ranked Lemoore's CNA-into-a-CNA-course
   first. Smoke 7c asserts Chaffey and passes on the Orange County question, so
   the block CAN reach it. Needs its own A/B.
2. **The smoke's anon probe of `program_typical_courses` is red on main and the
   answers are fine.** Three runs failed on that one assertion. `edge_logs` show
   the function's own RPCs at 200 on either side of the probe's 500, and
   `postgrest_logs` logged `57014` for `anon` — the 3 s `statement_timeout` under
   contention. The RPC is **115 ms**. ⚠️ **The probe reports a timeout and a
   wrong answer identically** (`rows = rows if isinstance(rows, list) else []`),
   which is what sent this session chasing a cost regression twice. Fixing the
   probe to distinguish them is the smallest real fix; an index on
   `chatbox_college_courses.top_code` is NOT (see the KB note below).
3. **Sam has not read a v73 answer in a browser.** No session can — the sandbox
   is egress-blocked from `*.supabase.co`.
4. **`CLAUDE.md` is 60,839 bytes against its 60,000 budget** (1.01×, flagged
   `always_loaded`). Not caused by this run; it wants a pare-down.

## What part one learned

- ⭐ **A false zero is the worst answer Sierra gives, and both causes here were
  vocabulary, not data** — the place had no name she knew, the course had an
  abbreviation she did not expand. Neither surfaced as an error; both rendered a
  confident, well-formed answer.
- ⚠️ **The tell was the answer arguing with itself**: it named Pasadena and Rio
  Hondo from the model's own knowledge, then said *"my data doesn't confirm their
  course lists here"* while the catalog held 28 rows and 8. When an answer names
  a thing and disclaims knowing it, retrieval missed what the model did not.
- ⚠️ **A guard pinned to a quotation is not a guard.** Smoke 7s PASSED against
  unfixed production: its ban listed v72's three exact phrasings, and it asked
  only that a college be NAMED, which the model supplies from its own knowledge.
  It bans the family now and requires a course BY NUMBER.
- ⚠️ **Twice I made a grouping key canonical in SQL — first a sort, then a dedupe
  — and both were already done downstream by `typicalFoldKey()`, both cost real
  time, and both broke or nearly broke a consumer.** The sort broke the smoke's
  probe outright. Before making a value canonical, find who reads it and whether
  something else already does it.
- ⭐ **`EXPLAIN (ANALYZE, TIMING ON)` said 4,809 ms for a 115 ms statement** —
  two clock reads per row over 141,696 rows. It pointed straight at an index on a
  table whose loader replaces every row. KB note:
  `methodology-explain-analyze-timing-is-not-free`.

## Read in order (Sierra)

`docs/reference/lanes/sierra-retrieval-corpus.md` ·
`docs/reference/lanes/sierra-false-absences.md` (the sub-region is its FIFTH
false-absence class) · `docs/cpl_assistant_lessons.md` (2026-09-18/19) ·
`docs/kb-notes/methodology-explain-analyze-timing-is-not-free.md`.

`cpl_memory` rows from this run: `a-sub-region-is-a-place-too-2026-09-18` ·
`one-course-said-seven-ways-is-not-seven-courses-2026-09-18` ·
`a-sorted-grouping-key-broke-the-consumer-that-read-it-2026-09-18` ·
`a-guard-pinned-to-a-quotation-is-not-a-guard-2026-09-18` ·
`cpl-chat-v73-subregion-anchor-live-2026-09-18` ·
`v73-precedent-block-now-produces-a-false-negative-2026-09-18` ·
`the-smoke-anon-probe-times-out-where-the-function-succeeds-2026-09-19` ·
`explain-analyze-timing-inflates-a-wide-seq-scan-2026-09-19`.

---

## ⛔ THE APPROVAL-PROMPT STORM — SAM'S ASK, 2026-09-19

Sam: *"the swarm of 'Allow Once' approval requests I am getting yesterday and
today. It's making the work unsustainable."* **This is your first job.**

**What is already known, and must not be re-derived.** `permissions.allow` does
NOT stop these. Auto mode runs a SEPARATE classifier that judges each call on its
CONTENT, and an allow rule gives its prompt nothing to offer — which is why there
is no *Always allow* button. #1617 allowlisted five Supabase tools and the
prompts got WORSE. #1623 then proved the mechanism that DOES work: a **PreToolUse
hook returning `permissionDecision: "allow"`** short-circuits the classifier
entirely. `scripts/supabase_sql_guard.py` does exactly this for
`mcp__Supabase__execute_sql`.

**Why the storm continues anyway: the guard covers ONE tool.** Everything else a
session does all day still reaches the classifier — `Bash` (git status/log/diff,
grep, sed, cat, wc, npm test, python3 read-only scripts), the `mcp__github__`
reads (`pull_request_read`, `get_job_logs`, `actions_list`, `get_check_run`), and
the other Supabase reads. In this session those were the overwhelming majority of
calls.

### ⚠️ FIX THE GUARD'S OWN BUG FIRST — IT BLOCKS RULE 8

`scripts/supabase_sql_guard.py` denies every write verb with no carve-out, so
**Rule 8's own memory writes are blocked**. Measured 2026-09-19:

```
select 1                                  -> allow
insert into cpl_memory (slug) values (..) -> deny   ⛔
update cpl_memory set summary=... .       -> deny   ⛔
```

Every checkpoint must write `cpl_memory`. Wherever that hook fires, the
checkpoint cannot complete. It did NOT fire in this remote session (the writes
went through), which is itself worth knowing: **a hook that works on Sam's
machine may be inert on the web runner, so neither its protection nor its
breakage is uniform.** Give it an explicit, narrow carve-out — an `insert`/
`update` whose only target is `cpl_memory` — and keep `deny` for everything else.

### The proposal

1. **One `Bash` PreToolUse guard, same shape as the SQL one.** This is the bulk
   of the storm. `allow` a read-only command allowlist (`git status|log|diff|show
   |rev-list|ls-remote`, `grep`, `rg`, `sed -n`, `cat`, `head`, `tail`, `wc`,
   `ls`, `find`, `npm test`, `python3 kb/_docs_audit.py`, `_build_*.py --check`,
   `_context_budget.py`); `ask` for EVERYTHING else. ⚠️ **Never `allow` by
   default** — the SQL guard's own rule: an unparsed command falls through to the
   prompt, never past it. Compound commands (`&&`, `|`, `;`, backticks, `$(`)
   fall through unless every segment is on the list.
2. **A matcher for the `mcp__github__` read tools** → `allow`. Reads only; leave
   `create_pull_request`, `merge_pull_request` and `actions_run_trigger` to
   prompt, because those are outward-facing and the prompt is doing real work.
3. **Extend the Supabase matcher** to `query_logs`, `list_tables`,
   `list_edge_functions`, `get_advisors` → `allow`.
4. **Then delete the now-pointless `permissions.allow` block**, or keep it with a
   comment saying it is not what stops the prompts. Leaving it implies a
   mechanism that measurably does not work.

⚠️ **A hook returning `allow` is a REAL grant — it removes the human check.** That
is the whole point and the whole risk, so the allowlist must be genuinely
read-only and the default must stay `ask`. Editing `.claude/settings.json` itself
should keep prompting; the classifier is right to treat that as
self-modification.

Precedent, tests and the payload shape: `scripts/supabase_sql_guard.py` +
`tests/supabase_sql_guard_test.py`. The `update-config` skill covers
settings.json mechanics; `fewer-permission-prompts` scans transcripts for the
frequent calls — ⚠️ but it proposes an ALLOWLIST, which is the thing that does not
work here. Use it to find the calls, then put them behind a hook.

`cpl_memory`: `advice-execute-sql-allowlist-needs-a-pretooluse-hook-2026-09-18`.

---

## ⚠️ SIERRA: FOUR DEFECTS IN THIS MORNING'S ANSWER (2026-09-19)

Sam ran an Orange County CNA-to-LVN/Surgical-Tech question and called the answer
"very good" — the shape IS right. Four things in it are wrong, and **one bug
causes three of them** (`chat_interactions` `c3e8914b`, 13:29:47Z).

⭐ **"Surgical Tech" RESOLVED TO A COLLEGE.** `%tech%` matches exactly one name in
`chatbox_college_profiles` — **Los Angeles Trade Technical College** — and in
`detectAndFetchCollegeProfile` a lone single-word match wins outright. So the home
college became LA Trade Tech and Orange County was ignored. Everything geographic
in the answer follows from that: distances measured "from LA Trade Tech", West LA
(~7 mi) and Glendale (~10 mi) offered as the "nearest" LVN colleges (they are
nearest to DOWNTOWN LA; from Orange County it is Long Beach City, Rio Hondo,
Mt. SAC), the whole flyer pointed at Los Angeles City College, and the line
*"exact Orange County mileage isn't in what I have."*
**Fix:** the word filter already drops topic words for exactly this reason
(`nurse`, `nursing`, `welding`, `firefighter`, `paramedic`, `police`). Add
`tech`, `technical`, `technology`, `surgical`. Same family as "orange" matching
Orange Coast College. **Smallest fix, roots out three defects, easy to test.**

⛔ **A FALSE ZERO IN THE VISITOR'S OWN COUNTY.** The answer says the catalog shows
no Surgical Technology program nearby. **Saddleback College teaches it — 8 course
rows — and Saddleback is in Orange County.** Downstream of the wrong anchor.

⚠️ **THE TABLE'S LEFT COLUMN IS NOT CNA COURSES.** It rendered *Nurse Assistant
Training* and *Lifelong Learning and Self Development* — both lines of the Lemoore
ARTICULATION, and the second is a general-education line, not anything a CNA
studies. The statewide list it should have used: Nurse Assistant (50 colleges),
Acute Care Nurse Assistant (12), Certified Home Health Aide (7). The right column
is one college's curriculum (Adult Health Care I/II, Alterations in Health: Lab),
not the statewide LVN list either. ⚠️ **`program_typical_courses` returned 200 at
13:29:24** — the data arrived and was not used, so this is a PROMPT/rendering
problem, not retrieval.

⚠️ **The Chaffey false negative is still there** (`s276-fable-precedent-names-its-program`).

**Latency:** `postgrest_logs` logged a burst of *"Warp server error: Thread killed
by timeout manager"* at 13:29:58, right after the answer.

## ✅ SAM'S CORRECTION, 2026-09-19 — AND WHY THE DOCTRINE SURVIVED IT

Sam, from his own research: **no Orange County CCC offers an LVN entry program** —
only LVN-to-ADN/RN bridges. So the catalog was right, and v73's scoped sentence
(*"at an Orange County COMMUNITY COLLEGE specifically"*) was correct. His words:
*"I said she was flat wrong but it was me who was wrong."*

⭐ **The framing rule stands, and NOCROP is why.** North Orange County ROP teaches
LVN, so UNSCOPED — *"no college in Orange County teaches LVN"* — the sentence is
false. The one word "community" is the whole difference, which is exactly what
`an-absence-in-the-data-is-a-statement-about-the-data` exists to put there. Both
older rows are amended rather than superseded, so a future session does not read
"flat wrong" as a standing fact.

⭐ **The gap it exposes belongs to `NC / Learning Partners`,** whose scope line
names ROP but which carries no worked instance. NOCROP + LVN is a good first one.
Sam: *"later we hope to bring in data from our adult ed, not-for-credit, ROP, and
community programs that could lead to certifications eligible for CPL at the
CCCs."* Rows: `no-orange-county-ccc-offers-an-lvn-entry-program-2026-09-19` ·
`a-ccc-scoped-absence-still-reads-as-nothing-near-me-2026-09-19` ·
`the-premise-was-wrong-and-the-ruling-was-right-2026-09-19`.

---

# PART TWO — SKYVIEW / AUTH / RE-MINT (SkyLedger)

⚠️ **THIS IS AN EMERGENCY CHECKPOINT (Rule 9a).** `kb/_context_budget.py` read
**31,860 tokens left (95.9% used)** — below the 50,000 EMERGENCY line — right
after #1627 merged. Per 9a only the handoff, the moved lane files and the
`cpl_memory` rows were written.

**Of Rule 9's 13 artifacts, these were NOT refreshed — they are your first job:**

- `kb/_docs_audit.py` was **never run this session** (step 0 of `/checkpoint`)
- `docs/ccr_atlas_lessons.md` — no entry for the ladder or the blast radius
- `docs/admin_tab_lessons.md` — no entry for the auth measurements
- `CLAUDE.md` §11 — no S277 narrative subsection
- the To-Do feed (`kb/cpl_todos.json`) — the `s277-*` items are untouched
- `docs/reference/lanes/org-phrase-scope-auth.md` and
  `docs/reference/lanes/admin-tab-side-menu.md` — both still describe the
  pre-ladder world and **both are now inaccurate** (see below)
- `docs/reference/lanes/public-private-repo-split.md` — does not carry Sam's
  2026-09-18 decision or the inbound raw-URL gap

`docs/reference/lanes/skyview-ccr-interface.md` **was** refreshed (#1626).

## ✅ WHAT LANDED (all merged to main)

| Commit | What |
|---|---|
| `f72381b` (#1623) | `execute_sql` PreToolUse guard |
| `b0f3aeb` (#1625) | SkyView curation ladder — sign-in on the map, merge execution, gated navigation |
| `5873dad` (#1626) | Lane file corrected; KB note for the generator-comment trap |
| `0a36d4c` (#1627) | Re-mint blast radius — data layer + CLI |

### The curation ladder (Sam specified it across three messages)

> *"To position courses to merge needs at least team code auth to do"* ·
> *"magic link can do any of the three"* ·
> *"Team code or magic should be able to navigate to all links"* ·
> *"Login link on the graphical SkyView, not this view"*

| Rung | Credential | Opens |
|---|---|---|
| 0 VIEW | the link alone | map, search, details, Ask |
| 1 STAGE | the team phrase | positioning a course; the COBI + CCR-table links |
| 2 EXECUTE | magic-link reviewer | Save, writing `kb_curation` |

`curationRung()` in `prototype/ccr_universe.js` is the ONLY place any of it is
decided. Sign-in lives in the band inside `#u-full` — the only chrome surviving
both `body.u-solo` and full screen. ⚠️ The staged list `#u-writes` is in
`#u-below`, which solo HIDES.

### The re-mint blast radius

`kb/_build_remint_blast_radius.py` → `prototype/ccr_remint_blast.json` (162 KB,
sparse) + `kb/remint_blast_worklist.json` (536 KB, operator copy).

    python3 kb/_build_remint_blast_radius.py --id "REAL M1032"
    → 60 members · 14 articulations · 1 curation row · 75 TOTAL

**Measured:** 7,843 of 15,515 minted identities carry a footprint beyond their
own members. Median 3, top 1% ≥31, `WEXP M1001` holds 2,190.

## YOUR SEQUENCE

1. **Finish the checkpoint** — the artifacts listed above. Start with
   `python3 kb/_docs_audit.py`.
2. **THE SKYVIEW RENDER — the one thing Sam asked for that is not built.**
   Load `prototype/ccr_remint_blast.json` lazily on first identity selection,
   cache it, render one line in `renderNode()`'s details panel: *"A re-mint
   would move: N members · A articulations · C curation rows."* Members come
   from the roster the browser already holds — that is why the payload omits
   them. Needs a jsdom test, **plus `npm run sweep` and `npm run a11y skyview`
   in the same PR** (standing rule for any SkyView change).
3. **Fix the two inaccurate lane files** (`org-phrase-scope-auth`,
   `admin-tab-side-menu`) — a lane file states current truth.
4. **The public/private split** — Sam ruled 2026-09-18: *"I won't flip COBI
   private yet, but will wait until we move to team account"* (next week).
   ⚠️ **Organizations cannot be on GitHub Pro**, so `CPL-Initiative` is likely
   on **Free** today and flipping before the move takes the site dark. On Team
   the site stays **fully public** — access-controlled Pages is Enterprise
   Cloud only, so the flip buys anti-cloning and restricts nobody.
   ⚠️ **§10 of `docs/public_private_repo_split_scope.md` is WRONG**: it says
   "the split breaks neither" from two outbound fetches. The **inbound**
   direction was never measured — **15+ references** to
   `raw.githubusercontent.com/.../live_metrics.json` across the public KB and
   the vault (including `cpl-knowledge-base/budget-support/web/app.js`, a live
   app, and both `CLAUDE.md` files) break on ANY plan once the repo is private.
   Also `budget-support/scripts/send_invites.py` mails partners a Pages link.

## ⚠️ Sam's open calls

- **Re-mint execution** — deliberately not built. He said *"I don't plan to
  remint until I do significant merge work later."* His 2026-09-05 ruling makes
  a re-mint view a queue he approves, never a fire button; Rule 7 re-locks at
  faculty publication.
- Carried from S277: the Orange County LVN program · guidance row `674923db` ·
  the 381 garbled course rows · the next `RELATED_PROGRAMS` list · auto-deploy
  on merge.

## What this session learned

- **`_build_dependency_map.py` enumerates with `git ls-files`, so an UNTRACKED
  file is invisible to it.** `git add` BEFORE rebuilding, or the rebuild looks
  clean and CI fails a round later. Cost two CI rounds; the rule now sits in
  `scripts/check_generated.sh` above the line it governs.
- **Read `check_generated.sh` output WHOLE, never through `tail`.** Its second
  step is the dependency-map `--check` CI runs; tailing hid a red step three
  times.
- **A build placeholder named in a COMMENT is still substituted** —
  `str.replace` has no syntax. Naming `__UNIVJS__` in an HTML comment inlined
  485 KB of `ccr_universe.js` twice. KB note:
  `methodology-a-generator-does-not-know-what-a-comment-is`.
- **`coci_articulations.json` is already current-era** — five applied markers
  through `_identities_rekeyed` (2026-09-05). Resolving its keys again
  double-applies: 1,662 live keys moved and homeless ROSE by 4. The direction
  test works. `assert_current_era()` refuses rather than guessing.
- **`course_id` IS the identity id** in the articulation store. Joining through
  member control numbers matched 2 records of 4,592.
- **`permissions.allow` and the auto-mode classifier are two gates.** The
  missing "Always Allow" button was the tell: the rule already existed.

## Carryover

| Item | State |
|---|---|
| SkyView render of the blast radius | **NOT BUILT** — sequence item 2, the data layer is ready |
| Rule 9 artifacts | emergency checkpoint — see the list at the top |
| `execute_sql` prompts | fixed; **takes effect at the next session start** (hooks load at startup) |
| Three Sierra check-floors | left unrecorded on purpose (`sierra_program_search` 20→37, `sierra_prompt_cache` 31→32, `sierra_geo_ranking` 50→51) — that session's to record |
| Parallel Sierra session | live all evening on CNA→LVN; collisions were `kb/dependency_map.json`, `tests/check_floor.json`, `docs/` catalogs |
| `cpl_memory` rows written | `sam-skyview-curation-ladder-three-rungs-2026-09-18` · `sam-navigation-to-non-public-pages-needs-a-rung-2026-09-18` · `a-build-placeholder-in-a-comment-is-still-substituted-2026-09-18` |

## ⚠️ Safety patterns to honor

- `prototype/skyview.html` is GENERATED — edit `ccr_universe.js` /
  `ccr_atlas_v1.html`, run `build_ccr_atlas.py`, then `check_generated.sh` LAST.
- The sweep needs gitignored shards: `python3 kb/_build_ccr_universe.py --shards-only`.
- Never pipe a long background command through `tail` — it buffers and leaves
  an empty output file.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP).
- The stop-hook "Unverified" nag is a false positive — **do not amend**.
  Proven again today: `f72381b` was committed as `MAP@rccd.edu` and reads
  `slee@collegeanalytics.org` on main; GitHub reattributes at squash-merge.

---

*Greetings, you are Sky**Warden** (Session 278), see Sky**Ledger**'s handoff —
`docs/session_278_handoff.md` — let's keep rolling with our queue.*
