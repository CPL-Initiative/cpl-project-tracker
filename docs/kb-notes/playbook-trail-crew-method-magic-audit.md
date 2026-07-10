---
title: "Playbook — Trail Crew 🥾: the method + magic audit (deterministic scanner → AI adjudication → adversarial verify → fire-able staged plan)"
date: 2026-07-10
kb-status: published
type: playbook
tags: [trail-crew, audit, cer, ccr, canon, workflow, adjudication]
artifacts:
  - kb/_trail_crew.py
  - kb/_trail_crew_magic.workflow.js
  - kb/_trail_crew_assemble.py
  - kb/trail_crew_out/
related:
  - "[[methodology-live-curation-concurrency]]"
  - "[[cer_v2_redesign_lessons]]"
---

# Trail Crew 🥾 — the method + magic audit

Named by Sam's ask for "a happy name so it sounds like a hopeful process": the
crew walks the established trails (the canon), clears deadfall (anomalies),
and repaints the trail markers (titles + issuing agencies) so every hiker —
and every future MAP enterer prompted from this canon — finds the way.

## Why it exists

The CER is a hand-built canonical vocabulary being created "out of whole
cloth" (Sam). Hand curation drifts: level indicators half-converted
(I/II/III vs 1/2/3), issuer strings in two spellings, twins that should merge,
bare titles that lost a level they needed. Sam's product framing makes
consistency the point: **the canon becomes the MAP entry-prompt vocabulary**
— users will be prompted with these names at data entry, so every
inconsistency we tolerate becomes a fork in tomorrow's incoming data. (His
horizon: "a national registry of CER with a self-curating list of training
agencies, issuing agencies, partners, linked careers, and educational
institutions.")

## The three stages

1. **METHOD — `kb/_trail_crew.py`** (deterministic, re-runnable, read-only).
   Scans the fresh bake ⊕ a live kb_curation overlay dump and emits tagged
   findings under an explicit CANON (C1–C5 in the docstring: numeric levels
   except 1A/2B compounds and non-level romans; one credential per content;
   bare-vs-leveled suspicion; one canonical issuer string; style hygiene).
   Rules: `roman_level`, `level_notation_twins`, `norm_dup_titles`,
   `bare_vs_leveled`, `issuer_variant_cluster`, `issuer_family_mixed`,
   `style_nits`. Every finding is a CANDIDATE — the scanner never writes.

2. **MAGIC — `kb/_trail_crew_magic.workflow.js`** (a Claude-session Workflow).
   One canon-guided adjudicator per findings batch (batches keep groups
   intact), each returning schema-forced verdicts
   `{id, verdict, action, proposed, reason, confidence}` — with per-rule
   guidance that encodes the judgment half of the canon (e.g. "IV Therapy"
   stays roman; "OSHA 30" is a credential name, not a course code; titles the
   curator has deliberately parked are untouchable). Then an **adversarial
   skeptic on EVERY merge proposal** — wrong merges lose real distinctions,
   so a refuted merge falls back to the judgment queue instead of the plan.

3. **ASSEMBLY — `kb/_trail_crew_assemble.py`** (deterministic post-pass).
   Collision-classifies confirmed renames against current keys and sorts
   everything into the fire-able `staged_fixes.json`: `clean_renames`
   (INSERT-only overrides, fire-ready) · `merge_candidates` (fire via the
   PR-5b merge-confirm lane) · `issuer_canon` (these UPDATE existing —
   often curator-authored — override rows, so per-cluster approval) ·
   `judgment_queue` (curator's eyes) · `rejected` (with reasons). Plus
   `adjudicated.json` (full audit trail) and `trail_report.md` (human
   report). **Firing stays a deliberate curator-authorized step** — the
   plan uses the standing bulk-write safety pattern (fresh live read,
   INSERT-only ON CONFLICT DO NOTHING, cohort reviewer_email, committed
   receipt; guarded UPDATEs only where the plan explicitly says so).

## Run procedure

```bash
# 1. dump the live overlay (MCP execute_sql -> JSON file), then:
python3 kb/_trail_crew.py --overlay <overlay_dump.json>
# 2. batch findings (~25/agent, groups intact) -> fire the Workflow with
#    {batches, held}; save its output JSON; then:
python3 kb/_trail_crew_assemble.py --verdicts <workflow_out.json>
# 3. review trail_report.md with the curator; fire lanes on their word.
```

## Scaling it to the CCR M-ID mountain (the next lane — Sam, 2026-07-10)

The CCR **already owns a mature method half**: `kb/_row_audit.py` Trust Cards
(8 rules, per-row scores, ~15.5k minted parents) + the Suggested-merges
evidence lanes. What it has never had is the **magic half at scale** — the
backlog is adjudication, not detection: 10,599 `seed_untouched_discipline`
drafts, 4,179 `unit_anomaly` flags, 1,253 `member_top_divergence` over-merge
candidates. Strategy:

1. **Triage by leverage, not row order.** Adjudicate first the ~2,355
   ARTICULATED identities (they carry the adoption-leverage payoff and feed
   the CER/EACR), then corroborated multi-college M-IDs, and leave the dark
   single-college tail for last (or for a coarser pass).
2. **Feed adjudicators the Trust Card + member evidence** (titles, units,
   TOP codes, descriptions per member) — the same enriched-batch pattern;
   verdicts = discipline confirm/correct, over-merge split candidates,
   unit-variant explanations.
3. **Adversarial verify anything that SPLITS or MERGES identities** (the
   re-mint playbook governs actual re-keys — Rule 7; Trail Crew stages
   evidence, never re-mints).
4. **Write pattern = the auto-merge cohort precedent** (Session 53:
   `automerge-v1@bot` — receipted, reviewable, chip-surfaced): verdicts land
   as kb_curation writes in receipted `trailcrew-*@bot` cohorts with the ⚙
   chip so curators can review/undo per row.
5. **Fire in cron-window-sized waves** so the daily fold + auditor re-run
   between waves keeps the receipts honest (audit-the-live-overlay lesson).

## Pitfalls learned on the first run (2026-07-10)

- Workflow `args` can arrive as a JSON **string** — parse defensively
  (`typeof args === 'string' ? JSON.parse(args) : args`).
- Batches over ~85 KB don't belong inline in args — write per-batch files
  and let each adjudicator Read its own.
- The method scanner's false positives are a feature, not a bug ("OSHA 30"
  flagged as a course code; "CAL-OSHA 30-Hour" ALL-CAPS-ish) — they're
  exactly what the magic half is for; don't over-tune the regexes.
- Findings must know about **held curator decisions** (parked merge
  confirms) or the adjudicators will re-propose what the curator
  deliberately deferred.

## Pitfalls learned on the first FIRING (2026-07-10, Session 111 — 103/105 clean renames, cohort `trailcrew-clean-s111@bot`)

- **Collision-classify against BOTH key registries.** `_trail_crew_assemble.py`
  checked rename targets against `credentials.json` only; `CLEP Spanish with
  Writing Level II → Level 2` collided with an existing **`unified_titles.json`**
  key and had to be pulled to the merge lane at fire time. Fix the assemble
  check to use `credentials.json ∪ unified_titles.json`.
- **Fresh-read must cross-check pending `unified_title_merge_confirm` TARGETS,
  not just existing override rows.** The bare `Medical Core → … Canyon High
  School` rename passed every static check but fought Sam's live 23:40
  merge-confirms folding four HS variants INTO `Medical Core` — opposite
  doctrines (differentiate-per-school vs consolidate). Pulled to the judgment
  queue; the curator's live rows always win. Any future fire: lane keys ∩
  pending merge-confirm values ⇒ hold.
- Receipt: `kb/trail_crew_out/2026-07-10/fired_clean_renames_s111.json`.
