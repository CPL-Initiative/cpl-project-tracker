---
title: Session 149 handoff (SkyBridge → next) — the alignment layer is live; now test it
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

Session 148 was **SkyBridge** — Sam's greeting named it. Six PRs (**#1150–#1155**),
four migrations, two edge-function deploys, **cpl-chat v41 live**.

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

## 🎯 PRIORITY 1 — the alignment layer is LIVE. Watch it, don't rebuild it.

Sam, on handover: *"We'll do lots of testing on this and feedback using Sierra
Trainer."* **That is your priority: the feedback loop, not more building.**

Sierra now answers, for a college + a certificate, with BOTH halves per credit
recommendation — the college's own closest-matching courses (a **proposal**) and
how other colleges articulated the same recommendation (a **fact**). Live as
**cpl-chat v41**, verified against Sam's acceptance case.

**What to do:**
1. **Ask her the Cerritos welding question yourself.** Nobody has read her actual
   prose — the sandbox is egress-blocked from `*.supabase.co`, so the RPC was
   verified directly and the renderer against live fixtures, but not the answer.
   Use the Sierra AI box on My College, or the CPL Assistant tab.
2. **Triage the Sierra Training backlog — it is now load-bearing.** 25 rows,
   oldest 1 July. That tab is the channel this feature gets corrected through:
   a bad suggestion becomes a logged question, which becomes an instruction.
3. **Expect the scorer to need tuning on a less literal discipline.** It was
   tuned on welding, where titles are almost self-describing and the acronym
   (FCAW) does real work. Nursing, business and the arts will not behave that way.

⚠️ **Do NOT loosen the content-token gate to catch more.** It exists because the
first cut ranked `ART 100 — Introduction To World Art` third for a **welding**
recommendation. On this surface a plausible false positive costs more than a
miss: an expert who sees one absurd row stops trusting the correct row above it.
`docs/kb-notes/methodology-a-false-positive-costs-more-than-a-miss.md`.

⚠️ **Do NOT merge the two signals into one ranked list.** Santa Ana articulated
`WELD 240 Structural Welding SMAW` and `WELD 244 D1.1 Code Clinic` against
**FCAW** recommendations — neither title contains "FCAW". Title similarity is
structurally blind to the broader-course pattern; peer precedent is the only
signal that surfaces it. Merging lets a guess borrow a precedent's authority.

⚠️ **Never pair a college to a course on a `group_wide` row.** 604 of the 9,413
peer rows come from articulations where the source repeated ONE college list
across every course, so we know which colleges and which courses but not which
used which. Sending a welding instructor to a college that never taught that
course is the same failure as inventing the articulation.

## 📌 Decisions Sam made this run

- **Alignment must serve faculty directly**: recommend the college's own aligned
  courses AND give access to peer articulations for the same certificate — *"so the
  faculty don't have to guess."*
- **Sequencing**: checkpoint first, then build the alignment feature. He deferred
  the cluster-adoption surface until alignment lands. **Alignment has now landed**,
  so the cluster surface is unblocked — but he asked to TEST alignment first.
- **Testing route**: *"We'll do lots of testing on this and feedback using Sierra
  Trainer."* Feedback arrives through the Sierra Training tab, not chat.

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
- 25-row Sierra feedback backlog, still never triaged — **now the correction
  channel for alignment**, so it is no longer just hygiene.
- Exhibit corpus covers **59 of 123**; `chatbox_college_profiles` stale since 2026-06-25.
- 12 adoption-file statewide titles absent from `chatbox_credentials`.
- The **cluster-adoption surface** (32 courses unlock the whole 36-credential shelf;
  *Introduction to Construction Safety* alone unlocks 12) — Sam called it "amazing",
  deferred until alignment lands — **now unblocked**, but test alignment first.
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
