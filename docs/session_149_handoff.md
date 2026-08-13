---
title: Session 149 handoff (SkyBridge → next) — Sierra reads the recs; now align local courses
created: 2026-08-13
updated: 2026-08-13
tags: [handoff, sierra, alignment, coci, adoption, credit-recommendations]
related:
  - "[[docs/local_course_alignment_lessons]]"
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/map_users_lessons]]"
  - "[[docs/session_148_handoff]]"
---

# You are Session 149

Session 148 was **SkyBridge** — Sam's greeting named it. Two PRs (**#1150**,
**#1151**), one migration, **cpl-chat v40 live**.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['sierra','alignment','adoption','retrieval','coci']
       or summary ilike '%align%')
order by event_date desc nulls last limit 40;
```

Then read, in order: `docs/local_course_alignment_lessons.md` → CLAUDE.md §11
(the "Local course ↔ CR alignment" row) → `docs/sierra_credit_recs_lessons.md`.

## 🎯 PRIORITY 1 — Sam asked for this explicitly, and it is proven but not built

> *"If Sierra is answering for Cerritos College, I would want her to recommend the
> most aligned Cerritos welding courses to be articulated so the faculty don't have
> to guess, and have a link or access to the other college articulations for this
> same welding certificate."*

I proved it works offline. **Build it.** Full design in
`docs/local_course_alignment_lessons.md` §(c). Order:

1. **`chatbox_credential_peer_articulations`** — credential × rec × (college,
   subject, number, title), straight from `kb/coci_articulations.json`. **Do this
   first**: exact data, no matching, small table, and alone it delivers half the ask
   with zero risk of proposing a wrong course.
2. **`chatbox_college_courses`** — per college × course from the 141k-row
   `kb/reference/coci_course_list.xlsx` (college, subject, number, title, units,
   credit type, TOP, C-ID).
3. **One RPC** `credential_alignment_for_college(credential, college)` returning
   both signals per rec, each labelled for what it is.
4. **cpl-chat wiring** + a rule: propose with evidence, never determine.

⭐ **THE DESIGN CONSTRAINT — do not skip this.** Title similarity ALONE is
systematically biased. Santa Ana articulated `WELD 240 Structural Welding SMAW`
and `WELD 244 D1.1 Code Clinic` against **FCAW** recs — neither title contains
"FCAW". Colleges map a *broader* course to a *specific* rec, and that is a faculty
judgment, not a lexical fact. Two signals, labelled separately:
`methodology-two-signals-for-a-judgment-proposal`.

⚠️ **Do NOT scope candidates by TOP code** — that gates on TOP (Rule 7). The
offline demo did, for speed. The build must not.

## What shipped

- **#1150** — `cpl-chat` **v40**: `credential_recs_for_titles(titles)` batches the
  full rec set; `renderRecLines()` lists courses/C-IDs/units; `AJ 110` flagged with
  both counts, never auto-resolved. Credential + volume route groups now run
  concurrently. `tests/sierra_credential_recs.test.js` — 23 **behavioural** checks.
- ⭐ **`ccc_rec` was a RETRIEVAL GATE.** Derived from adoptions, so **38 statewide
  credentials with zero adopters (36 carrying 75 published rec lines)** were
  excluded from *every* credential route. Gate widened; `college_adoption_opportunities`
  now returns **two labelled bands** (`peer_leverage`, `ready_to_adopt`) with
  reserved slots.
- **#1151** — MAP Users audit. **Wiring sound** (78 + 16 + 1 keys, zero misses).
  Mission College's proposal is `boothmelanie@gmail.com` — **flagged, never
  filtered**. Trailing-space join fragility normalised.

## 📌 Decisions Sam made this run

- **Alignment must serve faculty directly**: recommend the college's own aligned
  courses AND give access to peer articulations for the same certificate — *"so the
  faculty don't have to guess."*
- **Sequencing**: checkpoint first, then build the alignment feature. He deferred
  the cluster-adoption surface until alignment lands.

## ⚠️ Things that will mislead you

1. **The M-ID leverage layer answers a NARROWER question.**
   `statewide_prescriptive.js` returns only El Camino + Riverside for FCAW —
   **Cerritos is absent** despite teaching 121 welding courses, because its courses
   sit in different M-ID clusters. `adoption_leverage` = "teaches the same course
   IDENTITY". Do not mistake it for alignment.
2. **`coci_college_offerings` has TWO silent caps** — `titles_text` at **900 chars**
   (801 rows exactly there) and `sample_courses` at **8** (5,077 rows have more).
   `search_college_offerings` searches `titles_text`, so on those 801 rows — the
   largest programs — **it is blind to every title past the cap.** Worth fixing on
   its own; `chatbox/build_coci_offerings.py`.
3. **`tests/cpl_funding.test.js` hangs** (4+ min, pre-existing) so `node tests/run.js`
   cannot finish here. `npm install` first — jsdom is not vendored, and without it
   half the suite errors in a way that looks like your break.
4. **`college_briefing` is 227/228 on a clean tree** — pre-existing.

## Carryover

- **Cerritos false absence still unfixed** — and it is a false absence *twice over*:
  the corpus abbreviates its titles (`FIW Orientation`), and the leverage layer omits
  it from welding adoption.
- 25-row Sierra feedback backlog, still never triaged.
- Exhibit corpus covers **59 of 123**; `chatbox_college_profiles` stale since 2026-06-25.
- 12 adoption-file statewide titles absent from `chatbox_credentials`.
- The **cluster-adoption surface** (32 courses unlock the whole 36-credential shelf;
  *Introduction to Construction Safety* alone unlocks 12) — Sam called it "amazing",
  deferred until alignment lands.
- From 146: the site-phrase **superset decision** still needs Sam; the identity
  crosswalk write to Supabase is still queued.

## Patterns that worked

- **Run the thing before designing it.** The two-signal requirement was invisible
  until real peer articulations were printed next to the ranked matches.
- **Report a clean audit as a result.** MAP Users had no join bug; saying so beat
  manufacturing a fix.
- **Follow the derivation chain of any field you filter on.** That is the whole
  `ccc_rec` finding.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical.
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co`, college domains and
  `cpl-initiative.github.io` — Supabase via MCP only.
- Sam curates live; fresh-read before any bulk write.
- The stop hook's "unpushed commits" nag after a squash-merge is a **false
  positive** — verify per CLAUDE.md Troubleshooting, then `git branch --unset-upstream`.

## Moniker

**SkyWeld** is offered — the run that finally tells a welding instructor which of
their own courses to articulate. Take it or coin your own; if Sam names one, his wins.
