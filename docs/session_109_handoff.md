---
title: Session 109 handoff — after SkyPhilo's code-title resolution day (Session 108)
date: 2026-07-08
tags: [handoff, session-109, cer, preseed, title-lookup, coci]
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/session_108_handoff]]"
---

# You are Session 109

Session 108 (SkyPhilo) worked Sam's live-triage ask of the night: exhibits
titled by a bare course code ("CD-005", "Cinema 24") that he was hand-searching
in COCI. Both halves of the ask shipped in one merged PR (#707) while he kept
saving. Note: Session 107 (SkyKey) ran LONG in parallel — its evening arc (the
fan-in fixes #704–#706, "continued 13") landed AFTER the 108 handoff was
written, so read both.

Read in order: CLAUDE.md §11 (Sessions 107–108 blocks),
`docs/exhibit_canonicalization_lessons.md` (2026-07-08 "continued 13" — the
fan-in night — then "continued 14"), then this.

## What shipped (Session 108 — SkyPhilo, PR #707, merged)

1. **Rule 5c mech now resolves code-shaped titles against COCI** in
   `kb/_preseed_null_issuers.py`: tight-hyphen parse ("CD-005" — shared
   `parse_course_refs`, so the 💡 worklist suggestions inherit it via cron),
   decoration-immune title-sanity guard (mech trails, "(FA25-SU27)" term
   parens, pathway/college/school noise filtered from the remainder), a
   college-scoped subject-PREFIX hop ("Cinema 24" → CCSF's CINE 24; unique
   (code, college) only, receipted), and the code-shaped OVERRIDE — a staged
   title that is still a bare code (the 5f "CD-005" residue) is upgraded to
   the resolved CCN > C-ID > COCI title.
2. **Plan regen** (same post-fold bake as #702): +6 titles, 1 upgrade, 0
   regressions. CD-005 → "Child Growth and Development" (C-ID CDEV 100 — one
   authority tier above Sam's manual COCI find); Cinema 24 → "Basic Film
   Production"; Hanford West HS-005/HS-061 → Medical Terminology / Nurse
   Assistant Training; MUS-3 → the C-ID MUS 110 descriptor title.
3. **🔎/✨ on the TITLE column** of the missing-issuer lane (the #701 issuer
   pattern): 🔎 "what is this?" opens the code-plus-college search from the
   CURRENT title input; ✨ suggest → report proxy → click-to-fill chip
   (re-arms Save, never auto-saved). Distinct `cr-ni-tsearch`/`cr-ni-tsuggest`
   /`cr-ni-tsuggest-out` hooks — a shared out-class SHADOWED the issuer
   test's row-scoped query on the first cut (lesson: two instances of one
   affordance pattern in a row need disjoint hooks; share style via the CSS
   selector list).
4. Verifier +5 → **61 checks** (spot checks presence-CONDITIONAL so post-fold
   regens stay green); `tests/cer_title_lookup.test.js` (12); suite 145 green.

## Priority queue

1. **Sam's twin merges** — the Merge-confirmations strip still holds the
   Session-107-evening twins (C++ Programming, Choreography, Child
   Development, Critical Thinking and the Nursing Process). After his ✓s,
   dispatch `cred-rename-apply.yml` — the fan-in fixes (#704–#706: twin
   pruning, per-target V4, live Supabase claims) are in; converging batches
   land clean now.
2. **After his next pass + daily fold:** re-run `kb/_preseed_null_issuers.py`
   (`pip install openpyxl` FIRST) + `kb/_verify_issuer_preseed.py` (now 61
   checks — CD-005/Cinema-24 spot checks are conditional and stay green once
   those rows fold out). Saved rows drop from the plan.
3. **Spelling calls still pending (Sam):** ASE long-vs-short form · AWS
   "(AWS)" suffix · OSHA "U.S." prefix · the IBEW → Riverside JAC re-point.
4. Carryover: CLEP "Complete both" spans · DIR-pending apprenticeship
   residuals · fire-family twins · 3 mojibake families · MOC→COS bridge ·
   auditor re-run for originating-college chips (needs the runner's
   PII-purged CustomReport) · the receipt-dir same-day-overwrite hardening
   (`kb/cred_rename_out/<date>-runN/`) · CCR Convergence voice pass (still
   the active CCR lane).

## Safety patterns to honor

- Merges are NEVER inferred; the ✓ is Sam's. Staged pre-seeds stay
  UI-prefill-only (Rule 5e); Modes A2/A3 fill-or-append, never overwrite.
- The code-shaped override in `enrich_titles` replaces ONLY a title that is
  still a bare course code, receipted in the note — never widen it to
  descriptive titles.
- The subject-prefix hop must stay college-scoped + unique-resolution-only;
  never let it guess across colleges or fan out from short subjects.
- Regenerate `kb/issuer_preseed.json` only off a fresh post-fold bake — a
  same-bake regen (what #707 did) is fine; a STALE-bake regen re-stages rows
  Sam already resolved.
- Concurrent sessions are real (107 ran into 108's window): rebase-restart
  the branch from origin/main before a checkpoint commit, and check the
  lessons doc's latest "continued N" before claiming the next number.
- Poll CI via the MCP github tools, never curl; merge on `unstable` per the
  branch policy. `git reset --hard` eats riding edits — stash first.

Session 108 claimed **SkyPhilo** (Sam's greeting named it). Moniker
suggestion for you: **SkyFold** — the session that lands Sam's confirmed
twin merges — or claim your own.
