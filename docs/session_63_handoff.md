---
title: Session 63 Hand-off Prompt — (claim your moniker)
date: 2026-06-18
session: 62 (SkyLion) → 63 hand-off
status: hand-off — paste the fenced block into Session 63's first message
tags: [handoff, session-prompt, first-light, reflections, ccr, synonyms, cpl]
related:
  - docs/first_light_lessons.md (Session 62 — the rotation + the reflections digest)
  - docs/ccr_cluster_cleanup_lessons.md (Session 62 — synonym-map growth + the validator)
  - docs/kb-notes/playbook-write-only-table-private-vault-digest.md (the digest privacy shape)
  - docs/kb-notes/methodology-synonym-map-vs-similarity-threshold.md (the CCR synonym lane)
  - docs/session_59_handoff.md (the DATA lane — Jaccard + Suggested-merges, still paused)
moniker_suggestion: "Skyforge / Skywright / Skyhawk — the Sky* line is open (Skydriver, Skyleader, Skymarker, SkyLion)"
---

# Session 63 Hand-off Prompt

Session 62 (SkyLion) shipped two small code-only PRs and delegated the reflections
digest wiring to a sibling repo. Paste the block below.

```
You are Session 63 on the CPL Project Tracker. Read first:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR unstable;
     §11 (the M-ID lifecycle + the roadmap) + the Session 62 narrative; the §2
     file inventory (first_light.js now notes the local-day rotation + the digest).
  2. docs/first_light_lessons.md — the Session 62 section (rotation + digest).
  3. docs/ccr_cluster_cleanup_lessons.md — the Session 62 section (synonym growth).
  4. docs/kb-notes/playbook-write-only-table-private-vault-digest.md +
     methodology-synonym-map-vs-similarity-threshold.md (the two durable notes).

WHAT SHIPPED (Session 62, both merged + on main; code-only — the daily cron /
a workflow_dispatch republishes any regenerated artifacts):
  - #460 — First Light LOCAL-DAY PAINTING ROTATION (a fresh painting per local
    calendar day, no day-to-day repeats) + the WEEKLY REFLECTIONS DIGEST BUILDER
    (reflections/build_reflections_digest.py + reflections/README.md). The
    builder reads the anonymous write-only cpl_reflections with the SERVICE ROLE
    and renders per-ISO-week Obsidian "musings" markdown. Output is gitignored
    HERE (reflections_out/) and bound for the PRIVATE cpl-knowledge-base vault —
    the words never touch this public repo. Fail-soft (no key/HTTP error/blocked
    net -> notice + exit 0).
  - #461 — CCR Suggested-merges SYNONYM-MAP GROWTH (ECE/EMT/CNA/HVAC/LVN added to
    kb/synonym_map.json; +13 identities into multi-member groups, no over-merge)
    + a new validator kb/_synonym_candidate_dryrun.py that greps the title corpus
    for a candidate's bare token before adding it (rejected cis/cd/ma as
    ambiguous). Suggestions-only / curator-confirmed.
  - Re-installed the canonical stop-hook over a stale container copy (it was
    firing a squash-merge noreply@github.com false-positive; the canonical copy
    in scripts/ has the ancestor-bail + github-exclude fixes — never amend a
    squash-merge commit on main, Rule 5).

THE ONE OPEN HANDOFF (cross-repo, needs a HUMAN):
  The reflections digest is wired end-to-end in a SEPARATE cpl-knowledge-base
  session (a weekly GitHub Action that runs the builder + commits musings/). It
  goes live the moment Sam adds the Actions secret SUPABASE_SERVICE_KEY (the
  Supabase service-role key for project hvuwhnbuahrtptokpqfh) to the
  cpl-knowledge-base repo. You can't set secrets — if Sam asks, point him there.
  Confirm cpl-knowledge-base is PRIVATE before any reflection text is committed.

PRIORITY WORKSTREAMS (Sam drives interactively — surface options, then build):
  1. CCR morphological-variant pass (SkyLion's rec): Medical Assisting vs
     Medical ASSISTANT, and the -ing/-ant/-ology family. The whole-PHRASE synonym
     map can't express a shared STEM, so this is a distinct lever: stem/lemmatize
     the title token before _sug_sig, OR a small curated stem-pair map. MEASURE
     regroup yield + over-merge with a dry-run (mirror kb/_sug_segment_dryrun.py)
     BEFORE committing. Suggestions-only; its own PR + dispatch.
  2. First Light: manifest growth 3 -> 60–90 paintings (the rotation's value
     scales with the pool; per-image PD diligence, own prose, alt text — sourcing
     rules in docs/kb-notes/reference-public-domain-art-sourcing.md). Then the
     reflections THEMES card (service-role read -> aggregate uplifting themes,
     same privacy spine) once a few weeks of musings exist; and the Almanac.
  3. TMC Builder follow-ups (carryover from S61): faculty-verify the 45 draft
     TMCs; the college_short_names.json TAXONOMY follow-up (fold the COCI-program
     aliases in tmc/_build_college_adts.py's PROGRAM_COLLEGE_ALIASES + regen);
     the C-ID-discrepancy export report; sparse-C-ID 'suggested (verify)' fill.
  4. DATA lane (still PAUSED, docs/session_59_handoff.md): member-join Jaccard
     0.5->0.4 (kb/README MANDATES measuring member-row flips FIRST); title-lane
     pass 2 (kb/_auto_merge_worklist.py --pass2-title, on Sam's go); the Z
     future-mint half (kb/uc_cur_zseq.json); per-row auto-merge revert.

PATTERNS THAT WORKED (S62):
  - Ground a "write me a prompt / wire X" ask in the REAL artifacts first — the
    digest builder + README already existed, so the cross-repo prompt just pointed
    at them (raw URLs) instead of restating 200 lines.
  - Reject-on-evidence: the synonym validator made "feels ambiguous" a counted
    decision (cis/cd/ma OUT). Grow curated maps one MEASURED pair at a time.
  - For a stop-hook nag, DIAGNOSE before acting: a noreply@github.com committer
    that is an ancestor of origin/main is a GitHub squash-merge — never amend it
    (Rule 5). The fix is re-installing the canonical hook, not rewriting history.

SAFETY: merge-on-green = clean OR unstable; never force-push main (Rule 5);
  cpl_reflections stays WRITE-ONLY — never add a SELECT policy; reflection text /
  digests live ONLY in the private vault, never this public repo; no PII in
  committed artifacts (pii_guard pins it); Supabase additive/reviewer-gated only.
  Model id stays out of commits/PRs/docs. To-Do feed kb/cpl_todos.json: bump
  _as_of, DELETE done items, <=12.

Good hunting. First Light now changes every morning AND quietly gathers a private
weekly reflection digest; the CCR worklist groups more abbreviation pairs. The next
crisp CCR lever is the morphological-stem family — measure first, then merge.
```

Claim your own moniker (the Sky* line is open — Skyforge, Skywright, Skyhawk,
Skywarden…). 🌅🦁
