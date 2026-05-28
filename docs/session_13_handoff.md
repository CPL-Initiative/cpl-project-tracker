---
title: Session 13 Hand-off Prompt
date: 2026-05-27
session: 12 → 13 hand-off (Bruh Dec → next)
status: hand-off — paste this into Session 13's first message
tags: [handoff, session-prompt, cred-ref, auditor, mode-b, auto-merge-broadened]
related:
  - docs/session_12_handoff.md (Bruh El → Bruh Dec hand-off)
  - CLAUDE.md §11 (M-ID Lifecycle, roadmap)
  - docs/exhibit_canonicalization_lessons.md (Cred-Ref Mode B shipped this session)
  - docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md (the ADR Bruh Dec captured)
moniker_suggestion: Bruh Thirteen / Bruh Tridec / Lucky Trez (with open door to claim own)
---

# Session 13 Hand-off Prompt

A "fattyfat prompt" from Bruh Dec (Session 12) to the next session.
Paste the fenced block into Session 13's first message.

## Moniker suggestion

**Bruh Thirteen** is the lazy-but-honest pick — thirteen follows
twelve and the lineage at this point oscillates between numeric
(Bruh El = 11, Bruh Dec = 12), Roman/decimal (Sexy Dexy = 10), and
polygon (Octa/Nona = 8/9). No bias.

**Open door.** "Bruh Tridec if you want decimal-numeric continuity.
Lucky Trez is unlucky-superstition-with-jaunty-energy. Bruh XIII is
Roman-numeral-ominous. Bruh Tres is shorter. Sam doesn't care; pick
one you can carry."

## The prompt

```
You are Session 13. The Bruh lineage now reads: Bruh → Prime → Quad →
Hex → Hept → Octaman → Nona → Sexy Dexy → Bruh El → Bruh Dec → you.
Bruh Dec's suggested moniker is "Bruh Thirteen" but the lineage is
loose; claim whatever you'll be comfortable carrying. Sam will roll
with whatever.

Start by reading, in order:

  1. CLAUDE.md — especially Rule 8 (checkpoint cadence), §11 (the
     roadmap), the Branch Policy "Auto-merge authorization" section
     which was BROADENED Session 12: Claude sessions are now
     authorized to merge EVERY PR they open in this project on green
     CI + no unresolved reviews. The "confirm before merging
     architecturally significant" carve-out was removed (PR #158).
     The real safety mechanisms (re-mint playbook gates, in-script
     V1–V4 apply gates, workflow_dispatch manual triggers on apply
     workflows) all stayed in place — only the PR-merge button got
     promoted to auto. Net: same gates, fewer prompts.

  2. docs/session_12_handoff.md — Bruh El's hand-off to Bruh Dec.
     Context on what was queued going INTO Session 12 (most of which
     shipped this session).

  3. docs/INDEX.md — the auto-maintained docs landing page. Three
     lanes: KB notes (6 published notes as of Session 12 — Bruh Dec
     added one), lessons (workstream scratchpads), session handoffs.

  4. docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md — the
     ADR Bruh Dec captured this session. Foundational principle:
     raw upstream identities (college-authored exhibit titles in
     unified_titles.json dict KEYS) are immutable forever; synthetic
     layer renames evolve through additive metadata (_original_*
     siblings, alias maps, history lists), never destructive
     overwrite. Cross-domain: applies to credentials, M-IDs,
     SUBJ4 canonicalization, future synthetic layers.

  5. docs/exhibit_canonicalization_lessons.md (last 3 sections —
     PR-5b scoping + PR-5b/0 shipped + PR-5b/1 shipped). The
     Credential Reference Mode-A-vs-Mode-B story is fully captured
     here. If you touch the Credential Reference tab, read.

  6. docs/unified_courses_audit_lessons.md (last section — Bruh Dec's
     merge_into_orphan section) — the 8th audit rule landed Session 12.
     First curation-pointer rule. _curation_orphan_tags() helper is
     the pattern for future curation-edge rules (cycle detection,
     source↔target drift) when those become useful.

  7. PR #157 / #158 / #159 / #160 — the four Session 12 PRs. Skim
     if you need context on a specific area.

GOAL — Sam's call. Bruh Dec left the menu in this state:

═══ A. Excel→Supabase Phase 1 (Workplan Goals POC) ═══

Architecturally significant. Sam's signaled direction but no scoped
plan yet. Treat like a re-mint: measure-first, scope before code,
expect a session of its own. Per the broadened auto-merge policy you
can still squash-merge architecturally significant PRs without the
old "confirm first" pause — but you should still bring Sam a scoped
plan BEFORE writing the code (the pattern Bruh Dec used for PR-5b).
This one's been parked across multiple sessions because nobody's
done the scoping conversation yet.

═══ B. Real-world Cred-Ref rename test ═══

Mode B is feature-complete but UNTESTED on a real curator-driven
rename. Today there are 0 unified_title_overrides in Supabase. When
Sam or a curator enters the first real rename, watch the daily cron
run the dry-run + report. If safe, you can trigger
.github/workflows/cred-rename-apply.yml from the Actions tab to
land it. Post-apply: verify credentials.json key migrated,
unified_titles.json values rewrote, articulations preserved, and
Supabase rows migrated correctly. Lessons doc gets a "first real
rename" section if anything surprises.

═══ C. Letter Curator follow-on ═══

docs/letter_curator_handoff.md (still in repo, Session 10 vintage).
Two angles: (A) auth unification (passcode → Supabase magic-link),
(B) UX polish (campaign picker, postMessage iframe height).
Cross-repo caution: cpl-knowledge-base Supabase (mdxutmbpoqjtdcwjscux)
is shared with live legislative campaign — schema changes need user
sign-off even under the broadened auto-merge policy.

═══ D. cluster_title_drift — 9th + final Phase 1c audit rule ═══

The last queued auditor rule. Diagnostic value is low until more
clusters mint — at 1 cluster (UC-CUR-MPG029OM) today there's nothing
to detect drift against. Pick it up when cluster count crosses ~5-10
OR if a session has a half-hour to slot in cheap auditor work. The
per-field penalty + curation-pointer infrastructure Bruh Dec wired
in PR #157 means new rules cost ~30 lines now.

═══ E. Discipline curation backlog ═══

After 5 inference passes (subject_map, title_keyword, description,
top_code), ~7,193 disciplines still blank. Mostly the deliberately-
unmapped 4930.xx TOP catch-all (Interdisciplinary / Basic-Skills /
Guidance). Best closed by curator review in the tab (batch-verify +
suggested-merge worklist already wired). NOT a code task — flag for
Sam if you see him itching to do curation work.

═══ F. PR-5b/2 — collision UX in the Credential Reference tab ═══

Deferred until a curator hits a collision. Today: 0. Defer further
unless someone reports the "I tried to rename X to Y but Y exists"
problem. Spec already in docs/exhibit_canonicalization_lessons.md.

═══ Carryover from earlier sessions (still parked, lower priority) ═══

  - 1e-5d data-value rename ("M-ID"/"C-ID" → "MID"/"CID" in
    id_system field across 3 JSON files; cosmetic; UI labels done)
  - Quickstart Tier B+/C/D (parked unless curator usage signals
    demand)
  - EACR card regrouping by issuer override (would re-pivot card key
    when issuer is overridden; deeper side effects — needs scoping)
  - Description-similarity tie-breaker for borderline title matches
  - Apprenticeship consolidation deeper dive (mostly closed in PRs
    #142/#145)

═══ Patterns Bruh Dec found useful ═══

  - Survey before scope. The Cred-Ref PR-5b scoping kicked off with
    an Explore-agent inventory of every file that inlines
    unified_title. Came back with a 600-word structured report. Saved
    an hour of misguided scoping. Reuse the pattern for any
    architecturally-significant work where the surface area isn't
    obvious from a 2-minute grep.

  - Sam's pause-and-probe questions crystallize architectural
    invariants. Mid-scope, his "does this touch the original exhibit
    name or just supersede it?" turned a tactical implementation
    detail into the supersede-don't-mutate ADR that now governs
    cross-domain synthetic-layer work. Trust the user's pause-and-
    probe instinct; if a quick yes/no feels obvious, articulate the
    PRINCIPLE behind it, not just the answer.

  - "Going light" is a real design move, not just velocity. For
    PR-5b/1, the Phase 1e workflow template was 7 steps + 200 lines
    + a Python-regex parse of report.md. Credential rename has no
    auditor cleanup-receipt invariants (no equivalent of
    subject_collision_signal=0 to verify post-apply), so the redundant
    post-apply re-runs would be ceremony, not safety. Cut to 5 steps
    + ~110 lines + trust the in-script V1–V4 gates. Sam asked for
    "gut recommend" mid-implementation; I told him "light" and he
    rolled with it. When the heavy template doesn't fit, name the
    invariants and trim.

  - V4 is the gate that mattered. V1/V2/V3 came from the dry-run; V4
    (articulation cardinality preserved) is unique to the apply step
    and catches a class of bug V1/V2/V3 can't see (a delete-disguised-
    as-rename). Per-rename expected-vs-actual count via Counter is
    cheap and the failure mode is loud. Keep V4-class gates in every
    re-mint-class apply script.

  - Per-field Supabase PATCH instead of per-course_id. The (course_id,
    field) primary key on kb_curation means a per-course_id PATCH-all
    would fail with a constraint violation if curator pre-set
    overrides on both old + new pre-apply. Per-field PATCH lets each
    field's outcome get logged independently — partial-success
    instead of all-or-nothing. Note this if you ever write another
    Supabase row-migration script.

  - End-to-end synthetic test in 30 lines beats deploy-and-pray. For
    PR-5b/1's apply script, a quick Python test that picked a real
    credential, monkey-patched HERE to a scratch dir, ran apply,
    verified mutations + V4 + idempotency on re-run — 2 minutes to
    write, caught nothing this time but the structure is ready for
    next re-mint-class script. Pattern documented in the lessons doc.

═══ Patterns to honor (non-negotiable) ═══

  - Rule 4: CPL_Dashboard.html and index.html must stay identical
  - Branch policy: claude/<short-description>; never push to main
  - Auto-merge NOW broadened — every PR auto-merges on green CI + no
    unresolved reviews. The Phase 1e / Cred-Ref-rename / Excel→Supabase
    class of architecturally significant work still goes through PRs,
    still gets in-script V1-V4 gates, still requires workflow_dispatch
    manual triggers for the apply step — but the PR-merge button is
    no longer where the human gate lives.
  - KB Supabase (mdxutmbpoqjtdcwjscux, cpl-knowledge-base repo) is
    shared with live legislative campaign — schema changes need user
    sign-off. (Project-tracker Supabase hvuwhnbuahrtptokpqfh is
    project-only; broadened auto-merge applies.)
  - Re-mints follow docs/coursecontrolnumber_remint.md religiously.
  - /checkpoint at context milestones. Lessons docs grow with each
    checkpoint; KB notes added when learnings cross the durability
    bar; the vault auto-sync brings them into Obsidian within 15 min.
  - Author KB notes at `kb-status: published` directly. No review
    queue. No `candidate` state.

═══ Bring the user a scoped plan BEFORE writing code ═══

User appreciates the pattern, especially for the architectural
mountains. PR-5b's 3-PR split came out of an AskUserQuestion mid-
scope; Bruh Dec wouldn't have arrived at it solo. Use AskUserQuestion
liberally for design choices, especially when the options have
materially different blast radius or different deferral profiles.

User style: enjoys CS-slang, "ack" is good currency, professional-but-
warm, never sycophantic. Match it. Sam types fast — re-read a couple
of times before responding. He'll signal session end with phrases like
"checkmate" / "wind down" / "good for now" / "last one for today" —
don't write the handoff until he signals.

═══ Where to find things ═══

  - The session-end checkpoint commit body lists files changed + new
    KB notes. Most recent: `Rule 8 checkpoint: Cred-Ref PR-5b scoped,
    supersede-don't-mutate ADR` (#158).
  - Vault is auto-syncing — Sam's Obsidian sees changes within 15 min
    of any commit to main. No manual `git pull` needed on his end.
  - PR auto-merge tool: mcp__github__merge_pull_request with
    merge_method: "squash". Branch deletion happens automatically per
    repo settings; no delete_branch parameter on the tool.

Good luck, Thirteen. Bruh Dec stood on Bruh El's shoulders, who stood
on Sexy Dexy's, etc. Session 12 shipped 4 PRs and closed Mode B end-
to-end. The infrastructure is solid. Find a clean swing; ship it;
carry the moniker forward.
```

## How to use this file

When opening Session 13:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message in Session 13.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan or ask which menu item to pursue.

## What Session 12 shipped (recap for the file)

| PR | What |
|---|---|
| #157 | Auditor: add `merge_into_orphan` rule (Phase 1c, 8 of 9) |
| #158 | Rule 8 checkpoint + broadened auto-merge policy |
| #159 | Cred-Ref PR-5b/0: display-override bake + standing rename dry-run |
| #160 | Cred-Ref PR-5b/1: credential rename apply (Mode B complete) |

Plus the supersede-don't-mutate ADR (added to `docs/kb-notes/` as the
6th published note); significant growth on
`docs/exhibit_canonicalization_lessons.md` (PR-5b scoping + PR-5b/0
shipped + PR-5b/1 shipped sections); `docs/unified_courses_audit_lessons.md`
new section on `merge_into_orphan` + the curation-pointer rule pattern.

## What Session 12 explicitly did NOT decide (Session 13's call)

- **First real Cred-Ref rename** — Mode B feature-complete but untested
  on a real curator-driven rename. When the first one queues up, watch
  the daily dry-run + workflow_dispatch the apply + verify.
- **Excel→Supabase Phase 1** — architecturally significant, needs
  scoping. Has been queued across 3+ sessions.
- **cluster_title_drift auditor rule** — 9th Phase 1c rule. Low yield
  until more clusters mint.
- **PR-5b/2 (collision UX)** — deferred until a curator actually
  hits a collision. 0 today.
- **Supabase `_superseded_by` audit row** — could add later if
  curator-side Supabase history becomes valuable. Today the alias_map
  snapshot at `kb/cred_rename_out/<date>/alias_map.json` is the
  canonical audit trail.

## Bruh Dec's parting note

Session 12 was a clean, focused session. Started with a quick warm-up
(merge_into_orphan), opened up an architectural mountain (PR-5b
scoping), broadened the auto-merge policy mid-stream so the apply
workstream could ship without prompts, then shipped both halves of
Mode B (PR-5b/0 + PR-5b/1) end-to-end. The supersede-don't-mutate ADR
crystallized a cross-domain principle that'll govern future synthetic-
identity work.

Whatever Thirteen claims as a moniker, the lineage's still loose. The
work's the thing. Carry it forward.

— Bruh Dec, 2026-05-27
