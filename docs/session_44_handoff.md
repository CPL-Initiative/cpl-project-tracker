---
title: Session 44 Hand-off Prompt
date: 2026-06-11
session: 43 → 44 hand-off (written at the Session-43 checkpoint — the troubleshooting day)
status: hand-off — paste the fenced block into Session 44's first message
tags: [handoff, session-prompt, ccr, layout, perf, cron-verify, era-guard, seam]
related:
  - docs/kb-notes/methodology-fixed-table-layout-off-pane-columns.md (the durable lesson)
  - docs/ccr_cluster_cleanup_lessons.md (Session 43 section)
  - CLAUDE.md §11 "Session 43" subsection
moniker_suggestion: Session 43 ran as "Bruh Starlord" (Sam's coinage on arrival); claim your own
---

<!-- Lineage: … slot-fix (42) → Session 43: verification + front-end
     troubleshooting. The handoff's smallest items checked out clean for
     once — the day's real bug came from Sam's screenshots again, and it
     lived in the one layer (CSS layout) our whole jsdom harness can't
     see. The columns were never missing; they were parked off-pane.
     Trust the inspector rung. 🛰🔭 -->

# Session 44 Hand-off Prompt

Session 43 verified the slot-fix cron no-op (byte-stable, churn gone),
fixed the handoff's seam papercuts, and then spent the day on Sam's "AJ
blank columns" report — which turned out to be table-layout:auto parking
columns past the scroll wrap's right edge. Four PRs, all merged. One open
watch item: CCR perf. Paste the block below.

```
You are Session 44 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5/7; Branch-Policy
     auto-merge gates (merge on green = clean OR unstable; never park a PR
     in draft); §11 + the "Session 42" and "Session 43" subsections at the
     end (41 and earlier → docs/roadmap_archive.md).
  2. docs/kb-notes/methodology-fixed-table-layout-off-pane-columns.md —
     the durable lesson: auto-layout tables silently park columns off-pane;
     jsdom repros can't see layout; the diagnostic ladder ends at the
     user's Elements inspector; defend with fixed layout + colgroup.
  3. docs/ccr_cluster_cleanup_lessons.md — the Session 43 section.

WHAT SHIPPED IN SESSION 43 (4 PRs, all squash-merged on green):
  - #370 — audit overlay fetch era-busted (kb/row_audit/latest.json was
    the ONE lazy fetch without ?v=; Sam's tab held a stale copy — 14,228
    vs 14,232 flagged). Deliberately NOT wired into the _eraGuard banner
    (audit re-runs only on cron regens; a code-only artifact commit would
    false-trip it). + two UC_OUT_DIR seam papercuts: the eu/st impact
    join read the CER (an INPUT — yesterday's committed file at the repo
    root) from the OUT dir, so /tmp regens silently lost the columns
    (falls back to the repo copy now); _write_cpl_by_discipline_json
    makedirs its kb/ subdir. Full /tmp seam run completes clean and
    reproduces HEAD exactly (15,652 rows; eu 673 / st 452).
  - #371 — .claude/settings.json pins sessions to claude-fable-5[1m].
    Web /model picks are session-scoped and the picker strips [1m]
    (upstream anthropics/claude-code#41078, #57342). A typed /model
    command still overrides per-session.
  - #372 — THE DAY'S BUG. Sam: AoJ rows "blank" right of Discipline,
    headers too; later "most disciplines, not Ag"; survived incognito;
    console clean. Data was complete (payload scanned), DOM repro was
    clean (real renderer + real rows + real dropdown in jsdom) — Sam's
    Elements screenshot resolved it: all 15 <th>s present WITH text,
    scroll badge on #uc-table-wrap. table-layout:auto had inflated a
    column and parked the rest past the wrap's right edge; the h-scrollbar
    sits at the BOTTOM of the 70vh wrap (undiscoverable); per-discipline
    because each filtered set lays out its own widths. Fix: table-layout:
    fixed + explicit colgroups (15-col main, 5-col member) injected via
    ensureUcFixCss + render(); min-width:900px keeps h-scroll as the
    narrow-screen safety net. tests/uc_fixed_layout.test.js pins the
    DEFENSE (rules + colgroups), since jsdom cannot assert layout.
  - #373 — perf follow-up ("noticeably slower"): blanket td{overflow:
    hidden} = ~7,500 paint-clip contexts; scoped to the 5 text-bearing
    columns (3/4/5/8/15). Sam at session end: "Still a bit slow, but
    let's roll with it for now and see if it persists."
  - Cron no-op VERIFIED for the slot-fix: timestamp-normalized payload
    hashes byte-stable across #357's commit + all 3 of the day's daily
    runs; the family_groups tiebreak ended the suggestions churn;
    CER/statewide move stamp-only. Two traps for future verifiers:
    stat-level "2 +-" proves nothing on one-line-payload artifacts, and
    there are TWO generated_at formats (spaced + compact) — normalize
    both before hashing.

PRIORITY / NEXT (in order):
  1. CCR PERF WATCH (the open thread): if Sam still feels lag, get the
     SPECIFIC action (scroll / search typing / filter change / first
     open). Levers, cheapest first: skip the loadAudit().then(render)
     second render when the audit overlay changes nothing visible;
     retune the colgroup so fewer cells wrap; row virtualization as the
     heavyweight. Don't guess — profile the named action.
  2. VERIFY THE NEXT CRON no-ops on the #365/#366 artifacts (the C-ID
     router landed AFTER 06-11's last run; the /tmp determinism check
     says timestamp-only, but confirm the first real run). Also confirms
     #370's seam fixes are production-invisible (they must be — odir ==
     SCRIPT_DIR there).
  3. SAM'S CURATOR QUEUE (standing): 158 kin-backed evidence-lane groups,
     every Confirm trustworthy post-slotfix. FLSP M1379 stays the marquee
     SPLIT candidate (bare "Intermediate Spanish" IS two courses — never
     fold it whole). The 12 contested stand-alone entries ride the lane.
  4. COMM M1006 (probably closed): the era guard + audit buster + the
     off-pane-columns fix between them cover every mechanism proposed for
     Sam's original report. If he ever reproduces it again post-#373,
     start at the inspector rung, not at the data.
  5. The 404 in Sam's console (2026-06-12 screenshot): every CCR resource
     exists at HEAD, so it's likely page noise (favicon-class). If it
     recurs, have him expand the URL — one click — before chasing.
  6. STANDING: CIS↔CS scope §5 sign-off (docs/cis_cs_convergence_scope.md,
     GATED); ACE skill-level child-exhibit scope; College + System EACR
     views (System needs the privacy ADR finished); EACR v2; 5 DSPS
     "53414" strays; PEDS M10AE; Sam-only Cloudflare worker re-paste.

PATTERNS THAT WORKED (Session 43):
  - Climb the diagnostic ladder and let each rung kill a hypothesis CLASS:
    payload scan → DOM repro (real assets, real controls) → incognito →
    console → Elements inspector. The inspector was decisive; ask for it
    EARLY when a DOM repro passes but the user sees breakage — that gap
    IS the layout layer.
  - Hash artifact payloads with stamps normalized; never trust --stat on
    one-line files; know both generated_at formats.
  - Verify the seam by USING the seam: the /tmp regen that validated the
    eu/st fix also (a) found a second papercut and (b) independently
    proved generator determinism. One run, three results.
  - Perf-check your own defense at table scale (the overflow clip).
  - The stop-hook "Unverified noreply@github.com" nag after squash-merge +
    reset --hard is the DOCUMENTED false positive: refresh ~/.claude/
    stop-hook-git-check.sh from scripts/, NEVER amend main's squash
    commits (Rule 5).
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs (prefer JS-injected CSS — ensureUcFixCss
    pattern — so there's no mirror to break); Rule 5 never force-push
    main; C-IDs/CCNs verbatim; official targets get NO curation writes;
    merge ≠ verify; folds are display-level.
  - Era discipline: every lazy fetch carries ?v=<era> (audit included as
    of #370); promotions re-keys stay single-step chronological,
    era-stamped, stamp-gated (Session 42's rules).
  - Post-squash: git fetch + reset --hard origin/main, then push -u
    recreates the branch (auto-delete is on).
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into
    context; parse with scripts that print counts/samples.

Pipeline viz: unchanged this session (no identity work — the fixes were
front-end + seam + verification; the re-mint card still shows the
promotions re-key). A moniker is yours to claim.
```
