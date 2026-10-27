---
title: "Session 492 handoff: Sierra's wording help live, the naming rule built in, the funding attestation form drafted"
date: 2026-10-26
session: 491 (SkySalmonberry)
tags: [handoff, sierra, sierra-training, implementation-funding, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_494_handoff.md
---

# You are Session 492

Your moniker is **SkyCloudberry**. Session 491 (**SkySalmonberry**) was Sam's own session on 2026-10-26, about 16:58Z
to 19:30Z. Its checkpoint was **full** (data receipts, lane state changed), written under the context warning
(109,000 left). Skipped: `kb/README.md` (no KB structure change), `README.md` (no new surface), the Pipeline tab (no
roadmap or auditor move), and step 12 (`kb/status/program-requirements.json`, not stamped: the Supabase tool's
approval question went unanswered, so the headline reads could not run; stamp it first). Read, in order: this file, the
sierra-false-absences lane (*Wording help*), `docs/cpl_assistant_lessons.md` S491, then the implementation-funding lane's
S491 NEXT.

## What shipped

- **Check wording** (#2474): `sierra_wording_check.js` in the Sierra Training tab, by rule, no model. It names the
  instruction that would stop reaching Sierra, counted as `guidanceBlock()` counts.
- **Four live instructions corrected** on the recommendation (receipt `sierra_guidance_wording_fixes_2026-10-26_s491.sql`).
- **Open Asks Sheet 132** (https://claude.ai/artifact/84gYwWMaFVYKGo461YLLnT), answered 18:13Z: 1 build, 2 move, 3 keep.
- **Suggest wording and `NAMING_RULE`** (#2475, merged 715788ca), **deployed** 19:08Z (cpl-chat-deploy run 40383727809).
  The `guidance-wording` surface constraint applied (run 40377443433). Mock: https://claude.ai/artifact/KTxz6o8byt2oioPZof73HZ.
- Library series record at Sheet 132; three `cpl_memory` rows (receipt `cpl_library_open_asks_sheet132_2026-10-26_s491.sql`).

## Decisions Sam made this run

- Sheet 132 (each his own call): build, move, keep.
- Funding tab (~19:00Z, two screenshots): the attestation form's college name in regular type; intro *"Complete the
  items below to qualify for noncredit CPL funding."*; drop the optional count, course and exhibits; add the Lead's
  employee type (Staff, FT Faculty, PT Faculty, Administrator), *"Tell us briefly about the assignment"* (e.g. OT 10
  hours per week, or 20% release fall and spring) and *"How often does the NC Lead meet with credit CPL colleagues?"*;
  note *"The CPL Coordinator and Noncredit CPL Lead may be the same person"*; align the conditions' labels and boxes;
  credit rows labeled like the NC ones (*"Priority 1 (CR) Total Applied (articulated) credit"*).
- Both in `cpl_memory` (`sam-sheet-132-rulings-2026-10-26`, `sam-funding-nc-attestation-form-asks-2026-10-26`) through
  receipt `cpl_memory_s491_rulings_2026-10-26.sql` on the checkpoint branch's `.apply`; read them back.

## Open work, in order

0. **Merge what S491 left open, on its checks:** this checkpoint (CPL-Initiative/cpl-project-tracker#2477; its
   memory receipt applies through `.apply`, so read `migration_cpl_memory_s491_rulings_*.json`) and the vault's
   samueltlee/CPLBrain#503 (Sheet 132 answered, the S491 session note). The post-deploy smoke is run 40384144100.
1. **Finish the naming-rule move.** Read the smoke run S491 dispatched after the deploy (cpl-chat-smoke, main, ~19:10Z;
   modes 7y and 7z). On green, set `kb/migrations/.apply` to `kb/receipts/sierra_guidance_naming_rule_builtin_2026-10-26_s491.sql`
   on a branch, push, read row cb226a48 back as inactive, then push one real change (a runner's receipt commit starts no
   `test`). On red, fix before the switch-off; the row stays on until the built-in rule is proven.
2. **The funding form** (draft #2476, branch `claude/funding-nc-attest-form`): update `tests/cpl_funding_nc_attestation.test.js`
   (B2, B4, the field list, the submit flow) for the new fields, apply `kb/supabase_cpl_funding_nc_attestation_lead.sql`
   through supabase-migrate, run every `cpl_funding*` test, then merge on `test`. Show Sam the form; tell him each credit
   card's brief is its title, which he types.
3. **Hartnell CalGETC 45096** (branch `claude/hartnell-calgetc-area-totals`): read page read run 40375734212's log for
   the area words, finish the WIP `pool_areas` step (46636eba), add Hartnell's step, test, reconcile (free), reread.
4. The handoff-491 items still open: the daytime Library run (Sam creates it on claude.ai); the UI pass, Privacy; Music
   43887 and RN 03570; the Commons figures to-do; Sierra's healthcare ethics check on the public page.

## Lessons to honor

- **Read a list for faults when you touch it:** the first wording check found four live faults.
- **A runner's receipt commit starts no CI**; a `cpl_memory` summary is capped at 400 characters (a long one rolled a
  whole receipt back).
- **The reconcile artifacts' host is blocked from the sandbox;** a page read's job log is the way to a tab's words.

## Let go

S491 drops its subscriptions on #2477 and samueltlee/CPLBrain#503 at sign-off and holds no check-in. Sheet 132's and
the mock's artifact watches lapse with the session.
