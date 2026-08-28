---
title: "Sierra retrieval + corpus — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Sierra retrieval + corpus

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Sierra answers credential questions off the CURATED layer, not the raw freehand titles colleges typed into MAP.

## Status

✅ **`chatbox_credentials` LIVE (1,987 rows)** — public-read/no-write, loaded by `kb/_sync_credential_catalog.py` from the PUBLISHED artifact so suppression is inherited by construction. Routes CRED·STD, CRED·VOLUME, COLLEGE·ADOPT, ALIGN live. ✅ **`chatbox_credential_recs` — 2,205 rows LIVE** (134 statewide/351 lines · 2,071 local/3,357) on the nightly `credential-catalog-sync`. ⭐ **Sam's rule:** statewide exists → quote the **statewide set ONLY**; no statewide → the **most common** local recs with their college counts. Never both. ⭐ **The builder REUSES `fact-sheet/_build_statewide_recs.py`** — Sierra quoting different credit from the Fact Sheet is a credibility failure. ⚠️ **Lead with the LIST, never a count:** POST measures **10 lines · 9 carrying a C-ID · 8 DISTINCT · 1 with none**, and the `AJ 110` repeat is **flagged, never auto-resolved** (Sam: *"AJ 110 may be C-ID and it is Elective"*). **Standing retrieval rules, each earned by a failing probe:** search is **TRIGRAM, never `tsquery`** (`to_tsquery('english','aed:*')` → `'a':*` took the CPR corpus out); score the **best single name**, never the concatenation (length-normalized similarity ranks the BEST-CURATED record WORST); **`statewide` is a FILTER, not a tie-break**; **no pure-fuzzy** (tier-4 floor 0.25 + `matched_via`); **zero rows is a RESULT**, not a license to offer a neighbour. ⚠️ **Every student count is a FLOOR and the denominator ships as a COLUMN** — only 4.2% of student rows are nameable; `students_suppressed=true` must never render like `colleges_with_student_data=0`. ⚠️ **The statewide-rec gate is `ccc_rec` OR a published statewide set** — `ccc_rec` is derived from ADOPTIONS, so gating on it alone hid **38 statewide credentials with zero adopters, 36 of them carrying 75 published rec lines** (Carpenters ladder, NCCER, CSLB, ICC, OSHA 10/30) from *every* credential route. ⚠️ **Rec lines are ENRICHMENT, never a filter** — the map is declared OUTSIDE the try and a credential with no line is **still named**; dropping it re-creates the false zero. Every credential route renders through the **shared** `renderRecLines` off **one** batched `credential_recs_for_titles()` — a second lookup is a second matcher that can drift. ⚠️ **GUIDANCE AUDIT (SkyScope, on Sam's go): 1 of 7 active rules referenced a fact the request does not carry** — `15ec666b` named neither the tab nor the institution, so it was an instruction to GUESS. Budget is **not** binding (4,095/9,000 chars, 7/20 rows, 0 `display`). ⚠️ **All 7 ship to all 6 surfaces**, so that rule's opening condition is UNEVALUABLE everywhere, the public page included. **RECOMMENDED, NOT BUILT: a `surface` field** on the request + a nullable `surface` column on `sierra_guidance` — NOT a forked Sierra and NOT a `mode` enum (the differences are already separate fields: `audience`, `ctx`, `history`, `scope`). ⚠️ It will NOT deliver behavior contradicting a BUILT-IN rule (built-ins win in practice); that needs the rule registry to become surface-aware. **Blocked on Sam's go.** **Open:** corpus covers **59 of 123** colleges; `chatbox_college_profiles` stale since 2026-06-25 **except contacts** (live — see the MAP Users row); ⚠️ its **`credit_distribution` column is no longer read by anyone** — it was Sierra's per-college credit source until 2026-08-24 and had drifted two months (#1325, see the My College row); 12 adoption-file statewide titles absent from `chatbox_credentials`; ✅ **Sierra Training queue CLEARED by Sam 2026-08-26 — 0 still to do, 51 of 51 handled, 7 instructions in use** (screenshot; supersedes the 25-untriaged backlog and unblocks the alignment feedback loop, which `alignment-tested-via-sierra-training` called load-bearing). **NEXT:** Sam reads the actual prose — no session has, the sandbox is egress-blocked from `*.supabase.co`. Story: `docs/sierra_credit_recs_lessons.md` · `docs/sierra_credential_naming_lessons.md` · `docs/cpl_assistant_lessons.md`.
