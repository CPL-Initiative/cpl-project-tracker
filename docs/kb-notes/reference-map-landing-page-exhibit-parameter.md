---
title: MAP's landing page takes an exhibit code in its address
created: 2026-11-27
updated: 2026-11-27
tags: [reference, map-platform, landing-pages, exhibits, deep-link]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[library]]"
  - "[[library_lessons]]"
  - "[[cpl_pathways_lessons]]"
artifacts:
  - chatbox/supabase/functions/library-revise-draft/reference_data.mjs
  - chatbox/supabase/functions/library-revise-draft/cobi_data.mjs
  - cpl_pathways.js
---

# MAP's landing page takes an exhibit code in its address

> **A college's MAP landing page opened with `?Exhibit=<MAP exhibit code>` puts the code in the page's search box and
> lists that exhibit's courses, but only when every value matches MAP's own pattern; one bad value drops them all.**

## Context

A button that says *Request CPL* and opens a bare landing page leaves a student to search for the credential again.
Pedro of the MAP team said the landing page accepts the exhibit in the address (2026-11-27, relayed by COBIx). S744
checked it live and read MAP's front-end bundle before building on it: the Library's drafted buttons (#3909) and CPL
Pathways' *CPL here* links (#3910) both use it.

## The claim

- **What it does.** `https://<MAP host>/<college slug>?Exhibit=<code>` fills the landing page's search box with the code
  and lists that exhibit's courses. The *Possible Qualifications* picker stays unpicked.
- **The parameter.** `Exhibit` or `exhibit`. Several codes go comma-separated, at most 10.
- **The pattern.** MAP keeps the parameter only if every value matches `^[A-Za-z0-9]+(?:-[A-Za-z0-9]+){2,}$`
  (letters and digits in three or more hyphen-joined parts, such as `MAPICA-SM-1-001`). If any value fails, or there
  are more than 10, the page drops the whole parameter and opens bare.
- **What does nothing.** A numeric `map_id`, a course code, a credential title, or a course parameter.
- **Codes MAP itself refuses.** Some exhibit codes MAP issued break its own pattern: `&` (Chaffey MAPICI-BP&C-1-001,
  Laney MAPICI-E&ET-1-001, Cerritos MAPCXA-E&R-1-001), a doubled hyphen (Modesto Junior MAPICI-E3S--1-001), or a
  parenthesis. Such a code cannot be linked; renamed in MAP, it would work.
- **Framing.** The landing page sends no X-Frame-Options or Content-Security-Policy header, so a COBI view can show it
  in a bottom bar's iframe.

## How we got here

Live checks at Lassen, Cabrillo and Foothill; the pattern and the 10-value limit read from MAP's own JavaScript bundle;
the refused codes found among the codes the drafted buttons and CPL Pathways carry. `exhibitParam` in
`chatbox/supabase/functions/library-revise-draft/reference_data.mjs` applies the same test, so a button never carries a value that would blank the rest.

## When this applies (and when it doesn't)

It is MAP's behavior on 2026-11-27, not a published API; a MAP release can change it, so a consumer filters by the
pattern and opens the page bare when nothing passes. It selects an exhibit, never a course. A college's slug comes from
`map_college_contacts_pub` and is not always tidy (Cerritos's is `/www.cerritos.edu`).

## See also

- [`library_lessons`](../library_lessons.md), *S744 SkyCurlew*; [`cpl_pathways_lessons`](../cpl_pathways_lessons.md), *S744*
- PRs #3909 (Library buttons) and #3910 (CPL Pathways Get credit)
- `cpl_memory` `f-map-landing-exhibit-param-pattern-s744`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
