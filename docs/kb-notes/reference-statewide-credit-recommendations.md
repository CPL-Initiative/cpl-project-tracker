---
title: Statewide Collaborative (CCC) credit recommendations are not housed at one college
created: 2026-06-25
updated: 2026-06-25
tags: [reference, cpl, statewide-collaborative, credit-recommendations, cpl-assistant]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Statewide Collaborative (CCC) credit recommendations are not housed at one college

> **Summary** — A statewide CPL credit recommendation is a system-wide standard, not a
> credential you obtain *from* a particular college. A college may *initiate* or *lead*
> its development, but students adopt/adapt and **access it through their own college's
> CPL landing page** — never one specific college's page.

## Context

When the CPL Assistant surfaced a statewide credit recommendation, it told a visitor to
go to **Saddleback's** page to "access the statewide RE credits." That framing is wrong,
and Sam asked to fix the wording *and* commit the underlying fact to memory so we never
re-make the mistake in any surface (assistant, reports, docs, the future Student Portal).

## The claim

**Statewide credit recommendations are not owned by, or housed at, any single college.**

- They are developed through **statewide faculty workgroups** as system-wide standards
  (in the MAP data these are the **Statewide Collaborative**, `collaborative_type = "CCC"`
  exhibits).
- **One college may be the initiator or the lead** that signs off on a standard. That
  role does **not** make it "the place" a student goes to get the credit.
- **Local colleges adopt or adapt** each statewide standard into their own catalog.
- **A student earns/accesses it through THEIR OWN college's CPL landing page** — the same
  place they'd pursue any local CPL. So the correct pointer is always *the student's own
  (or a chosen) college's landing page*, not the lead college's.

Practical consequence for any answer that mentions a statewide standard: describe it as
**available system-wide**, and route the person to **their own college's** CPL landing
page — do not attribute it to, or link, one specific college as the source.

## How we got here

Sam's correction during a live CPL Assistant review (Session 73, 2026-06-25). Implemented
in `cpl-chat` v17 as `STATEWIDE_RULE` (appended to every system prompt) plus a
`buildTopicContext` change that **dedupes statewide exhibits by title** (the same standard
appears in the data under every adopting college) and **drops the single-college
attribution + that college's landing-page URL**. Full story:
`docs/cpl_assistant_lessons.md` (Session 73 pass 1).

## When this applies (and when it doesn't)

- **Applies** to Statewide Collaborative (`collaborative_type = "CCC"`) standards in MAP,
  and to any wording about how a student "gets" a statewide CPL credit.
- **Does NOT apply** to genuinely **local** exhibits — those *are* a specific college's,
  and pointing the student at that college's landing page is correct. The distinction is
  exactly the `CCC` vs local split the data already carries.
- This is about *where you access it*, not about who *developed* it — it's fine and useful
  to note that a college **led** a statewide standard's development; just don't conflate
  "led" with "is where you get it."

## See also

- `[[docs/cpl_assistant_lessons]]` — the tuning pass that implemented this (Session 73)
- `chatbox/supabase/functions/cpl-chat/index.ts` — `STATEWIDE_RULE`, `buildTopicContext`
- CLAUDE.md §9 / §7c — EACR statewide (CCC) grouping; the CPL Assistant tab

---

*Authoring check: durable (the governance fact won't change), reusable (every CPL surface
needs it), distilled (one concept), self-contained.*
