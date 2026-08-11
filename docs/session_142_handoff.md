---
title: Session 142 handoff (SkyLink → next) — My College is built; two blockers are decisions, not code
created: 2026-08-11
updated: 2026-08-11
tags: [handoff, my-college, waiting-credit, rls, disclosure, funding, tiers]
related:
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-a-materialized-view-cannot-carry-rls]]"
  - "[[docs/kb-notes/methodology-a-percentage-must-not-round-up-into-a-claim]]"
  - "[[docs/kb-notes/reference-the-waiting-credit-backlog-is-basic-military-service]]"
---

# You are Session 142

Session 141 ran as **SkyLink** and shipped **#1121** (the last four unbuilt
pieces of My College) and then **#1123**, after Sam read the live tab. The tab
is now feature-complete except for two things, **and neither of them is a
coding problem.** Read that carefully before you go looking for something to
implement.

⚠️ **A concurrent session landed #1124 during this run.** Sam frequently runs
several at once. Fetch before assuming your branch base is current, and expect
`CLAUDE.md` to have moved under you.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date, verified_by from cpl_memory
where status <> 'superseded'
  and (tags && array['my-college','waiting-credit','rls','disclosure','funding','tiers']
       or summary ilike '%military%' or summary ilike '%matview%' or summary ilike '%college%')
order by event_date desc nulls last limit 40;
```

## 🎯 PRIORITY 1 — MAP deep links (Sam is sourcing them)

Sam, 2026-08-11: *"Will get you those links soon. Let me check with **Malone and
Pedro** to see what they recommend. Go ahead and move forward without them."*

Three links, each with a section already built and waiting:

| Action | Section it belongs on |
|---|---|
| **Adopt an exhibit** | "By CPL type" → the top-candidate list |
| **Work student records** | "What that waiting credit actually is" |
| **Update contacts** | "Who MAP has on file" |

The repo holds **no** authenticated MAP URL shapes — only `/insights/dashboard`,
`/insights/exhibit-courses` and the `/api/*` endpoints — and sessions are
egress-blocked from probing. **Do not ship a link to the MAP homepage as a
stand-in**: it looks like a deep link and dumps a coordinator on a dashboard,
which is worse than no link. Wait for the real URLs.

## 🎯 PRIORITY 2 — put the RLS decision in front of Sam

**Carryover #4 (the `?college=` access shape) is not a UI change**, whatever the
Session-141 handoff said. Four of the tab's reads are gated at the *database*:
`map_college_credit_summary`, `map_college_cr_unit`, `map_college_goal2`,
`map_college_contacts` — all `is_allowed_reviewer() OR team_pass_ok()`. An
unauthenticated college hitting `?college=X` does not get a picker-free page; it
gets nothing, because the reads fail. Serving colleges their own view means
deciding to publish student-derived aggregates and staff contact details.
Outward-facing, hard to reverse once URLs exist. **Not a session's call.**

Bundle it with the structural finding below and give him one written option set.

## ⚠️ The one structural gap found this run

`map_credential_student_rollup` is a **materialized view** — `relkind='m'`, RLS
disabled, **zero policies** — and `anon` holds the SELECT grant. Postgres does
not implement RLS for matviews at all; `security_invoker` does not apply.

**Nothing is currently exposed.** 543 rows, 123 published, **0 below k=10**,
minimum published exactly 10, and all 420 suppressed rows null out *every*
measure (`potential_units`, `applied_units`, `transcribed_units`,
`rows_needs_action`) so nothing leaks by magnitude either. It is safe by
construction, same posture as the deliberately-public `chatbox_credentials`.

The gap is that its suppression is enforced **only by the build script**. Every
sibling table has RLS as a second line; this one structurally cannot. Three ways
out: revoke the `anon` grant and read through a gated view/RPC · keep the grant
but **assert the invariant in CI against the built object** · declare it public
by design and say so beside the builder. Pick one deliberately.

## ✅ What shipped — #1121, #1123

**#1121** — four sections: the **waiting-credit breakdown**, the **funding-pool
split** (real tab names, each priority's cap + the college's own target, a *Do
this next* per pool), **15-entry Resources**, and the **tier block**.

**#1123** — Sam's two asks after using it. Suggested questions now **fill AND
send in one click** (`cpl_chat.js` gained a sibling **`ask()`**), and the tier
block is **prose** rather than five rows: the three tiers named in the header,
unmet criteria **nearest-threshold first**, and **Inactive given its own
sentence instead of "0 of 5"**.

Tests **104 → 183**; full suite green.

### Three rules that came out of #1123 — honour them

1. **`prefill()` must stay send-free.** The Sierra Training tab's "Test in
   Sierra" replay depends on a reviewer being able to edit a logged question
   first. The one-click fix added a **sibling** (`ask()`) rather than retuning
   the shared helper. When two callers need different behaviour from one
   helper, add the sibling — the existing caller's requirement is invisible
   from the call site that wants the change.
2. **A classification label must ship with its scheme.** "Advancing" alone is a
   verdict from a scheme the reader was never shown; the header now states all
   three tiers before the label lands.
3. **In prose, the ORDER is the advice.** Rows are equal-weight by
   construction; a paragraph is not. Unmet criteria sort by
   `actual ÷ threshold`, so a college at 20.6% against a 25% bar reads that
   first. `met` stays the sole authority on satisfaction; `ratio` is display
   ordering only.

## ⭐ The finding that should change how you talk about the backlog

**98.8% of all 64,074 articulated-and-waiting units is Credit for Basic Military
Service** — 87.7% to a GE/graduation area, 10.5% elective, 0.6% a named course.
**65 of the 73** colleges with any are at **100%**; the whole backlog is **592
rows**. It is not 300 judgment calls, it is close to **one decision applied
repeatedly**, against an exhibit already articulated, for students who already
have a DD-214 or JST on file.

And **33 of 106 colleges have none waiting at all** — Moreno Valley (2,404 CPL
students), CCSF, De Anza, Coastline, Riverside City. A zero there is a *finished
queue*. Never render it as an absence of data.

## Four things that will mislead you

**1. `map_college_cr_unit` has no k-anonymity of its own.** Only
`map_college_credit_summary` applies k=10. Any new breakdown of it must carry its
own suppression check, or it publishes the parts of a withheld whole.

**2. `_alloc()`'s per-priority caps key off the *Implementation Funding tab's*
`state.viewSlot`,** and front-load zeroes every year after the first. Call
**`_prios(name, slot)`** with an explicit slot. A Year-2 view renders **$0 against
all three priorities** — plausible, unqueryable, and read as a finding about the
college.

**3. A percentage must never round UP into a claim it cannot support.** "100%" is
a claim of *totality*, not a rounded number. Use `safePct()`. This shipped as a
live bug: "100% military" printed with a non-military row visibly three lines
above (true 99.76%), and **every assertion passed** — it was caught by rendering
the page and reading it. The same PR already guarded the inbound form (a
published 25.0% that is really 24.96%).

**3b. ⭐ A source-text assertion is unsound in BOTH directions.** Four tier
checks grepped `briefingSrc` and went **red on a correct page**, because the
copy is built from concatenated literals and reflowing split the phrase — one
hour after 163 assertions went **green on the self-contradicting "100%"**.
Assert `root.textContent` after a real render; reserve source-greps for genuine
source invariants ("this function body must never reference `state.viewSlot`").
And **read the render once for every branch** — empty, all-of-it, singular,
withheld. Thirty seconds of that found "you meet 0 of the 5 criteria", which is
arithmetic rather than a sentence, and which nothing was going to grep for.
`docs/kb-notes/methodology-assert-what-the-reader-sees.md`.

**4. Still true from Session 140:** never re-derive an allocation (floor
waterfall — call `_alloc()`); join college names through `cplCollegeShort()`;
"transcribed" in MAP is a **mark**, not a posting.

## Patterns that worked

- **Measure before writing copy.** One `group by course_type` reframed the tab's
  lead figure. The build was easy; knowing what to say was the work.
- **Render it and read it.** The only bug that escaped 163 assertions died in one
  glance at the output.
- **Assert the behaviour, not the comment.** The `_prios` test greps the function
  body for `state.viewSlot` rather than trusting a comment that says it doesn't.
- **Reconcile against the authority.** The tier list is display-only; the count
  stays the worker's `criteriaMetCount`, and the list is *withheld* if the two
  ever disagree rather than shown summing to a different number.

## Safety patterns to honour

- Aggregates only; **`StudentMAPID` must never reach Supabase.**
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; **never force-push `main`**.
- ⚠️ The stop hook fires *"N unpushed commits"* after every squash-merge. **False
  positive** — verify committer = `noreply@github.com`, `origin/main..HEAD` = 0,
  HEAD is an ancestor of main, remote branch gone. **Do not push.**
  `git branch --unset-upstream` quiets it.
- ⚠️ `tests/cpl_funding.test.js` alone takes **>4 minutes**; the full suite ~20.
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.

## Carryover

| # | Item | State |
|---|---|---|
| 1 | **MAP deep links** | Sam sourcing from Malone + Pedro |
| 2 | **RLS decision** — access shape + the matview grant | needs Sam; write him the option set |
| 3 | ~~Tier block: say how far~~ | ✅ done in #1123 — delivered by **ordering** nearest-first rather than by adding a number |
| 4 | Student-request feed | blocked on MAP |
| 5 | EACR `statewide_prescriptive.js` → Supabase | Sam's catch, **5 sessions** — the biggest unblocked item |
| 6 | 25 untriaged Sierra feedback rows | unchanged |
| 7 | `pp` flag cannot separate new reach from routed students | capture before field comms |
| 8 | `docs/INDEX.md` 4.6× budget, `roadmap_archive.md` 2.4× | lint, untouched |

## Moniker

**SkyLink** was meant to carry the page to MAP itself and got as far as the
doorstep — the links are the last hop. Yours opens the door: suggest **SkyDoor**,
or coin your own.
