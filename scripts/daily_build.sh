#!/usr/bin/env bash
# The daily dashboard's build, written once (COBIx #3110 finding 8, S641). .github/workflows/daily-dashboard.yml
# runs it as one step, "Build the dashboard and its kb files"; when the push meets a rebase conflict, or a clean
# rebase that changes a build input, the commit step resets to the new origin/main and reruns it FROM THAT TREE.
# dependency-map: inline (kb/_build_dependency_map.py reads these commands as the workflow's own)
#
# Each block below was one workflow step, kept in the same order, with its comments. `step NAME [SECRET ...]`
# runs the block the way GitHub ran the step:
#   - in its own `bash -e` (GitHub's shell for a `run:` with no `shell:`), so an `exit 0` ends only that block
#     and a failing command fails the build, as it failed the job;
#   - with only the secrets the step declared. Every name in DAILY_SECRETS the block does not name is unset
#     for it. tests/apply_concurrency_test.py pins each block's list against what the step declared.
#   - between ::group::NAME and ::endgroup::, so the log keeps one fold per former step.
# A value a block writes to $GITHUB_ENV reaches the steps after this one, as before; no block read another
# block's $GITHUB_ENV value in the same run, and none wrote $GITHUB_OUTPUT or $GITHUB_PATH.
#
# The three network fetches whose result does not derive from main can be skipped on the second pass:
# DAILY_REUSE_CUSTOM_REPORT, DAILY_REUSE_SCRAPE and DAILY_REUSE_VETERAN set to 1 (the commit step decides;
# see its comments). Not here: the node docx install (its own step, before this one) and the SkyView shard
# upload (its own step, after the push lands, cut from the tree that was pushed).
set -e
DAILY_SECRETS="MAP_API_KEY MAP_API_AUTH_HEADER MAP_API_AUTH_SCHEME CPL_SCRAPE_SECRET SUPABASE_SERVICE_KEY"

step() {
  local name="$1" body s rc
  shift
  body=$(cat)
  local drop=()
  for s in $DAILY_SECRETS; do
    case " $* " in *" $s "*) ;; *) drop+=(-u "$s") ;; esac
  done
  echo "::group::$name"
  rc=0
  env "${drop[@]}" bash -e -c "$body" || rc=$?
  echo "::endgroup::"
  if [ "$rc" != 0 ]; then
    echo "::error title=Daily build failed::\"$name\" exited $rc."
    exit "$rc"
  fi
}

reused() {
  echo "Reused from this run's first pass, not run again: $1"
}

# tests/apply_concurrency_test.py sources this file for the two functions alone.
if [ "${DAILY_BUILD_FUNCTIONS_ONLY:-}" = 1 ]; then return 0 2>/dev/null || exit 0; fi

# ── Step 1: Fetch CustomReport JSON ─────────────────────────
if [ "${DAILY_REUSE_CUSTOM_REPORT:-}" = 1 ]; then
  reused "Fetch CustomReport from MAP API"
else
step "Fetch CustomReport from MAP API" MAP_API_KEY MAP_API_AUTH_HEADER MAP_API_AUTH_SCHEME <<'STEP'
python fetch_custom_report.py --output CustomReport_latest.json \
  && echo "CUSTOM_REPORT_STATUS=success" >> "$GITHUB_ENV" \
  || echo "CUSTOM_REPORT_STATUS=fallback" >> "$GITHUB_ENV"
STEP
fi

# ── Step 2: Scrape live metrics ──────────────────────────────
if [ "${DAILY_REUSE_SCRAPE:-}" = 1 ]; then
  reused "Scrape live metrics from Cloudflare Worker"
else
step "Scrape live metrics from Cloudflare Worker" CPL_SCRAPE_SECRET <<'STEP'
# The secret goes in the x-scrape-secret header (#2893) and, until the Worker drops it, in the
# query string URL-encoded: a raw "+" in a base64 secret reads back as a space, so the Worker
# answered 403 to an identical value (S601, runs 696-698).
code=$(curl -sS -G -o live_metrics_new.json -w '%{http_code}' \
  -H "x-scrape-secret: ${CPL_SCRAPE_SECRET}" \
  --data-urlencode "secret=${CPL_SCRAPE_SECRET}" \
  "https://cpl-proxy.slee-548.workers.dev/scrape" || true)
export SCRAPE_HTTP="$code"
python3 - <<'EOF'
import json, os, shutil
code = os.environ.get('SCRAPE_HTTP', '')
try:
    raw = open('live_metrics_new.json', encoding='utf-8', errors='replace').read()
except OSError:
    raw = ''
try:
    d = json.loads(raw)
    missing = [k for k in ('scraped_at', 'metrics', 'raw') if k not in d]
    if code != '200' or missing:
        raise ValueError(f"HTTP {code}, missing {missing or 'nothing'}")
    shutil.move('live_metrics_new.json', 'live_metrics.json')
    print(f"Live metrics updated: {d['scraped_at']}")
    open('/tmp/metrics_status', 'w').write('success')
except Exception as e:
    print(f"::error title=Live metrics scrape failed::{e}; worker replied: {raw[:300]!r}. "
          "Keeping the existing live_metrics.json; the run fails at its last step.")
    open('/tmp/metrics_status', 'w').write('fallback')
    # The last step repeats this, so the reason sits at the end of the log, where a short tail reads it.
    detail = ("%s; worker replied: %s" % (e, raw[:200])).replace("\n", " ").replace("\r", " ")
    open('/tmp/scrape_detail', 'w').write(detail)
EOF
echo "LIVE_METRICS_STATUS=$(cat /tmp/metrics_status)" >> "$GITHUB_ENV"
[ -f /tmp/scrape_detail ] && echo "SCRAPE_DETAIL=$(cat /tmp/scrape_detail)" >> "$GITHUB_ENV" || true
STEP
fi

# ── Step 2b: Fetch MIL/JST (reported military vs uploaded JSTs) ──
# Same public potential-savings API the worker scrapes, but carrying the
# EnrolledMilitaryStudents (MIL) / VeteransWithJSTs (JST) counts + the
# Veteran Star (JST >= 75% of MIL) the worker doesn't surface. Runs on the
# runner (the Azure host is egress-blocked from the agent sandbox). Soft-
# fails (keeps the prior veteran_jst.json) — the generator degrades
# gracefully when it's absent (no MIL/JST column / proxy retained).
if [ "${DAILY_REUSE_VETERAN:-}" = 1 ]; then
  reused "Fetch MIL/JST veteran data"
else
step "Fetch MIL/JST veteran data" <<'STEP'
python3 fetch_veteran_jst.py || echo "veteran-jst fetch failed (non-fatal; prior artifact kept)"
STEP
fi

# ── Step 3: Sync curation overlay from Supabase ──────────────
# Folds reviewer discipline edits (public.kb_curation) into the
# git-canonical kb/coci_curation.json so the pipeline below bakes them
# into the dataset + export. Skips gracefully until the secret is set.
step "Sync curation overlay from Supabase" SUPABASE_SERVICE_KEY <<'STEP'
if [ -n "${SUPABASE_SERVICE_KEY:-}" ]; then
  # Non-fatal like its siblings below: the curation sync is an overlay
  # enhancement and the generator falls back to the committed
  # kb/coci_curation.json. _apply_curation.py now retries transient
  # network/TLS blips itself; this guard backstops a persistent Supabase
  # outage so it can't abort the whole daily publish (a transient SSL
  # EOF here failed the 2026-06-22 manual run).
  python kb/_apply_curation.py || echo "::warning title=Curation sync failed::kb/_apply_curation.py exited non-zero — dashboard publishes from the committed kb/coci_curation.json; next run re-syncs. Check the step log."
  # Phase 1e: fold Canonical SUBJ4 curator edits (synthesized
  # _CANON_SUBJ4::<discipline> keys) into kb/discipline_canonical_subj4.json.
  # Skipped gracefully if the seed file doesn't exist yet.
  if [ -f kb/discipline_canonical_subj4.json ]; then
    # ::warning:: makes a silent-for-weeks failure LOUD in the run
    # summary (Session 47 found CIS=CSIS sat unsynced since 05-23
    # behind a bare `|| echo`). Still non-fatal — the dashboard
    # publish must not die on a sync hiccup; the seed is
    # eventually-consistent and appliers fresh-read at write-time.
    python kb/_apply_canonical_subj4.py || echo "::warning title=Canonical SUBJ4 sync failed::kb/_apply_canonical_subj4.py exited non-zero — the committed seed may drift from Supabase picks until this passes. Check the step log."
  fi
  # Cred-Ref PR-5a: fold credential-review curator edits
  # (_CREDENTIAL_REVIEW::<unified_title> rows) into the git-canonical
  # overlay at kb/credential_review_overlay.json. The dashboard reads
  # Supabase live; this script keeps the overlay in git for audit +
  # non-dashboard consumers. unified_title renames are RECORDED but
  # not applied — see Cred-Ref PR-5b for rename promotion.
  python kb/_apply_credential_review.py || echo "Credential review sync failed — non-fatal"
  # CER unclassified-triage PR-2: fold the worklist's raw-title→unified-title
  # assignments (_UNCLASSIFIED::<raw_title> rows) into the git-canonical
  # overlay kb/unclassified_assignments.json. Idempotent.
  python kb/_apply_unclassified_triage.py || echo "Unclassified triage sync failed — non-fatal"
  # CER unclassified-triage PR-3 (auto-fold, added 2026-07-07): fold the
  # overlay's saved assignments into kb/unified_titles.json + credentials.json
  # (clean adds + supersedes of unreviewed machine drafts; the curator's
  # reviewer-gated tab write, or a procedure's cohort save, IS the act).
  # Since 2026-10-18 (Sam, Open Asks Sheet 94 card 1) a hold is per
  # assignment: a conflict with a human-reviewed classification, or a raw
  # whose articulation rows carry another title, holds only itself and is
  # listed in the report's `held`; the CER procedures run brings those to
  # the tab's Needs you. --apply-if-safe never fails the run.
  python kb/_fold_unclassified.py --apply-if-safe || echo "::warning title=Unclassified fold failed::kb/_fold_unclassified.py exited non-zero — curator triage assignments are stuck in the overlay until this passes. Check the step log."
  # College short names (S545): the College Identity tab's edits in public.college_short_names fold into
  # kb/college_short_names.json + college_short_names.js here, before every builder below joins through them.
  # A changed short keeps the old one as an alias; a collision or a missing college is refused and the
  # committed files stay (the script prints its own ::warning::), so the publish never dies on it.
  python kb/_apply_college_short_names.py || echo "::warning title=College short names not folded::kb/_apply_college_short_names.py exited non-zero — the pages keep yesterday's short names. Check the step log."
else
  echo "SUPABASE_SERVICE_KEY not set — skipping curation sync."
fi
STEP

# ── Step 4: Run pipeline ─────────────────────────────────────
# SUPABASE_SERVICE_KEY is needed for the Workplan Goals read path
# (Phase 1 PR-4: source-of-truth = public.workplan_goals). The
# generator falls back to kb/workplan_goals_snapshot.json on Supabase
# outage; if the env var is missing AND the snapshot is missing too,
# the generator fails loudly (no silent rendering of nothing).
# It also folds the newest Supabase item_updates (RACI 📝 composer)
# into projects[].update so cards + reports carry current updates.
step "Run dashboard pipeline" SUPABASE_SERVICE_KEY <<'STEP'
python excel_to_dashboard.py
STEP

# ── COCI C-ID claims that four signals call a mis-entry (SkyHarbor, 2026-11-06) ─
# Moreno Valley's HES 1 Health Science claimed HIST 150, so Basic Military
# Training read as a peer path to every world history course. Writes
# kb/cid_claim_audit.json; a finding not yet held in
# kb/reference/cid_claim_holds.json is an item for the team. Read-only; non-fatal.
step "Audit COCI C-ID claims" <<'STEP'
python3 kb/_audit_cid_claims.py || echo "C-ID claim audit failed (non-fatal)"
STEP

# ── Step 4a0: Governance drift detector (OQ-08) ────────────────
# Regenerates kb/governance_candidates.json — surfaces that look governable
# and have no row in the governance register. PROPOSALS only; nothing is
# ever auto-added to the register itself. Pure static analysis of the repo:
# no Supabase, no secrets, no network, so it cannot fail the run for an
# external reason. `|| true` because a governance NICE-TO-HAVE must never
# be what breaks the daily dashboard.
step "Rebuild governance drift candidates" <<'STEP'
python kb/_build_governance_candidates.py || true
STEP

# ── Step 4a0b: Common CR Reference worklist ────────────────────
# Regenerates kb/cr_reference_worklist.json — the ranked curation queue
# over the ~2,344 distinct credit-recommendation wordings colleges typed.
#
# The chain is three PURE LOCAL transforms over committed inputs
# (kb/coci_articulations.json, credential_reference_data.js,
# statewide_data.js) — no Supabase, no secrets, no network. The first two
# payloads are gitignored intermediates that credential-catalog-sync.yml
# also builds for its own Supabase push; rebuilding them here costs
# seconds and removes a cross-workflow ordering dependency.
#
# ⚠️ The worklist is a PROPOSAL surface. Curator decisions live in the
# gated Supabase table cr_reference_decisions and are keyed on group_key,
# so regenerating this file can never overwrite a judgement — the same
# separation governance_owners uses.
#
# `|| true` for the same reason as 4a0: a curation nice-to-have must never
# be what breaks the daily dashboard.
step "Rebuild Common CR Reference worklist" <<'STEP'
python kb/_build_peer_articulations.py \
  && python kb/_build_credential_recs.py \
  && python kb/_build_cr_reference.py || true
STEP

# ── Step 4a1: CPL Pathways — Common Course Reference enrichment ─
# Rebuilds cpl_pathways_ccr_data.js from the CURRENT minted-identity +
# articulation + catalog sources, so every mint / re-mint / merge in the
# CCR pipeline ripples onto the CPL Pathways cards (student + college
# views) on the next daily run — no separate sync (Sam, 2026-07-15).
# Non-fatal: the pathways cards degrade gracefully (prior artifact kept)
# if the minted sources are momentarily unreadable.
step "Build CPL Pathways CCR enrichment" <<'STEP'
python3 kb/_build_cpl_pathway_ccr.py || echo "CPL Pathways CCR build failed (non-fatal; prior artifact kept)"
STEP

# ── Step 4a1b: CPL Pathways — AUTHORITATIVE membership view ────
# Rebuilds the program→course graph (from the committed Program Course File
# + CB master + course list; ~67 MB, NOT committed — regenerable) and then
# cpl_pathways_membership_data.js: each baccalaureate's OWN course list +
# per-course potential CPL + its qualifying associate credentials (A.S./A.A./
# cert, same college + field) where the dense CPL lives. Supersedes the
# TOP-proxy CCR guess for the ~39 baccalaureates in the join (StarMora
# run-through, docs/cpl_pathways_lessons.md). Non-fatal: the cards fall back
# to the CCR view (prior artifact kept) if a source is momentarily unreadable.
step "Build CPL Pathways membership view" <<'STEP'
python3 kb/_build_program_course_graph.py \
  && python3 kb/_build_cpl_pathway_membership.py \
  || echo "CPL Pathways membership build failed (non-fatal; prior artifact kept)"
STEP

# ── Step 4a2: Funding priority-metric actuals (P2/P3) ─────────
# Aggregates the transient CustomReport student grain into per-college
# suppressed counts (docs/kb-notes/adr-funding-priority-metrics-privacy.md,
# ratified 2026-06-11). Skips gracefully (exit 0, keeps the prior
# artifact) when the fetch fell back; non-fatal otherwise — the
# dashboard publish matters more than one day of actuals. The service key
# reads Scenario 4's noncredit counts (cpl_funding_nc_counts, S471); a
# failed read leaves those keys absent, so the outcomes read TBA.
# Before the actuals: refresh Supabase chatbox_exhibits from this run's pull, so
# the noncredit exhibit count and Sierra both read today's exhibits and their
# mode of learning (2026-11-12; the table had stood unrefreshed since May). The
# promote is one transaction and refuses a short pull; non-fatal, the live
# table stands on any failure.
step "Refresh Sierra's exhibit list" SUPABASE_SERVICE_KEY <<'STEP'
python3 chatbox/sync_chatbox_exhibits.py CustomReport_latest.json --apply || echo "chatbox-exhibits refresh failed (non-fatal; the live table stands)"
STEP

step "Build funding priority-metric actuals" SUPABASE_SERVICE_KEY <<'STEP'
python3 funding/_build_funding_performance.py CustomReport_latest.json || echo "funding-performance build failed (non-fatal; prior artifact kept)"
STEP

# ── Step 4a3: ESS 25-82 outcome-2 rollup ──────────────────────
# Rolls credential_reference_data.js (regenerated in step 3 above) down to a
# compact per-college "adopted >= 1 statewide credit recommendation" sidecar
# for the $15M Distributions sub-view. Non-fatal: absent sidecar → the tab
# shows that outcome as pending rather than a false "not met".
step "Build ESS 25-82 statewide-recommendation rollup" <<'STEP'
python3 funding/_build_funding_ess.py || echo "funding-ess build failed (non-fatal; prior artifact kept)"
STEP

# ── Step 4b: Re-run row Trust-Card auditor ────────────────────
# Read-only over kb/coci_*.json; writes kb/row_audit/{latest.json,
# <date>.md} that the UCL "⚠ hinky" badge consumes. See CLAUDE.md §11.
# Failure is non-fatal (auditor output is a UI enhancement, not load-
# bearing for the dashboard itself).
step "Run row Trust-Card auditor" <<'STEP'
python3 kb/_row_audit.py || echo "Auditor failed — UCL hinky chips will use prior latest.json"
STEP

# ── Step 4b2: Re-run the EXHIBIT auditor (credential layer) ───
# Writes kb/exhibit_audit/{latest.json, <date>.md} — the CER's triage
# worklist reads latest.json LIVE, and it had been frozen at 2026-05-24
# because no workflow ran kb/_audit_exhibits.py (found 2026-07-07: the
# stale snapshot listed already-classified titles as unclassified).
# Runs AFTER the curation sync + unclassified fold so freshly-folded
# titles don't re-flag, and uses the step-1 CustomReport_latest.json for
# MAP drift checks (KB-only mode when it's absent — non-fatal either way).
step "Run exhibit-canonicalization auditor" <<'STEP'
python3 kb/_audit_exhibits.py || echo "Exhibit auditor failed — CER worklist will use prior latest.json"
STEP

# ── Step 4b3: identity-anchored triage suggestions (Rule 5c) ──
# After the auditor refreshes the unclassified queue, regenerate the
# worklist's 💡 fill chips: CCN > C-ID > COS authority > modal local
# course title, per skill Rule 5c. Suggestions only — curator confirms.
step "Build unclassified-triage suggestions" <<'STEP'
python3 kb/_suggest_unclassified.py || echo "Triage suggestions failed — worklist renders without chips"
STEP

# ── Step 4c: Cred-Ref PR-5b/0 — credential rename dry-run ─────
# Read-only over kb/credential_review_overlay.json (synced from Supabase
# at step 3); writes kb/cred_rename_dryrun/{report.md, alias_map.json,
# collisions.json}. Mode B preview — projects unified_title_override
# curator entries onto the post-rename state, surfaces collisions +
# apply-gate status. Does NOT apply renames; apply is Cred-Ref PR-5b/1,
# manual workflow_dispatch only. Failure is non-fatal.
step "Run credential rename dry-run" <<'STEP'
python3 kb/_cred_rename_dryrun.py || echo "Credential rename dry-run failed — non-fatal"
STEP

# Build the public Fact Sheet's statewide credit-rec data from the freshly
# regenerated statewide_data.js (authoritative CCC-tagged recs only). Logs
# any statewide credential lacking a CCC exhibit. Non-fatal.
step "Build statewide credit recs (Fact Sheet)" <<'STEP'
python3 fact-sheet/_build_statewide_recs.py || echo "statewide recs build failed (non-fatal; prior artifact kept)"
STEP

# Every statewide exhibit by program area, with its total units and its lines,
# from the same statewide_data.js and fact_sheet_metrics.json this run just wrote
# (S398). Sierra reads this file from main when a visitor asks for the statewide
# list, so it is current as of this run with no deploy. The builder refuses when
# its program-area counts disagree with fact_sheet_metrics.json; the prior file is
# then kept, and tests/sierra_statewide_catalog.test.js names the mismatch on main.
step "Build statewide catalog (Fact Sheet + Sierra)" <<'STEP'
python3 fact-sheet/_build_statewide_catalog.py || echo "::warning title=Statewide catalog not rebuilt::fact-sheet/_build_statewide_catalog.py failed; Sierra reads the previous catalog until the next run. Check the step log."
STEP

# ── Step 4d2: SkyView's decision payload ──────────────────────
# Sam's ruling, 2026-09-06: rebuild the ATLAS payload nightly, leave the
# universe LAYOUT hand-rebuilt. It had not been rebuilt since 2026-08-24,
# and by 09-06 89 of the 593 identity ids in its five decision packs (15%)
# resolved to nothing through the alias chain — a curator could be offered
# a decision about a course that no longer exists under that id.
#
# ⚠️ prototype/skyview.html is rebuilt with it because the atlas payload is
# INLINE in the served page (only the universe and its members are
# fetched), so regenerating the JSON alone never reaches the deployed page.
# That is NOT a layout rebuild: ccr_universe.json is untouched here and
# stays hand-built, which is the half of the ruling that says no.
step "Rebuild SkyView's decision payload (when the corpus changed)" <<'STEP'
if git diff --quiet HEAD -- unified_courses_data.js \
                           unified_courses_members.js \
                           unified_courses_suggestions.js; then
  echo "Unified-courses artifacts unchanged — atlas payload left as built."; exit 0; fi
( python3 kb/_build_ccr_atlas_extract.py && python3 prototype/build_ccr_atlas.py ) \
  || echo "::warning title=SkyView decision payload not rebuilt::kb/_build_ccr_atlas_extract.py or prototype/build_ccr_atlas.py failed — the Decisions column and the decision packs may lag the corpus until the next run. Check the step log."
STEP

# ── Step 4d3: SkyView's CPL payload (Session 238) ─────────────
# The CPL face and the articulations light read prototype/ccr_cpl.json:
# the articulation crosswalk joined to the curated agencies in
# credential_reference_data.js (step 3) and the articulated-exhibit feed in
# statewide_data.js — both regenerated above, so the payload is rebuilt
# every run (~5 s, local files only). tests/ccr_cpl_payload_test.py fails
# CI when the committed file is not a fresh build, which is why this step
# runs unconditionally rather than on a corpus-changed guard.
step "Rebuild SkyView's CPL payload" <<'STEP'
python3 kb/_build_ccr_cpl.py --quiet \
  || echo "::warning title=SkyView CPL payload not rebuilt::kb/_build_ccr_cpl.py failed — the CPL face and the articulations light read the previous build until the next run. Check the step log."
STEP

# ── Step 4d3b: SkyView's CPL UNIVERSE (Session 252) ──────────
# The second universe Sam ruled on 2026-09-10: the entities are EXHIBITS,
# not courses. Built from credential_reference_data.js's curated unified
# titles (step 3, regenerated above) — the identity, its local exhibits,
# its discipline, its articulated courses and its agencies all come from
# the CER, never from the crosswalk's inlined issuing_agency (a 2026-05-21
# snapshot wrong on 1,743 of 4,592 records). Pure Python over one local
# file, ~2 s. tests/ccr_cpl_universe_test.py fails CI on a stale file, so
# this runs unconditionally like its siblings.
step "Rebuild SkyView's CPL universe" <<'STEP'
python3 kb/_build_ccr_cpl_universe.py --quiet \
  || echo "::warning title=SkyView CPL universe not rebuilt::kb/_build_ccr_cpl_universe.py failed — CPL mode reads the previous build until the next run. Check the step log."
STEP

# Its MEMBERS (the rows behind the counts: per credential, the local MAP
# exhibits folded in and the course identities articulated to it) are a
# second file so the layout stays small — the same split as the course
# universe. Same one input, ~2 s; tests/ccr_cpl_universe_members_test.py
# fails CI on a stale file, and on a members key the universe does not carry.
step "Rebuild SkyView's CPL universe members" <<'STEP'
python3 kb/_build_ccr_cpl_universe_members.py --quiet \
  || echo "::warning title=SkyView CPL universe members not rebuilt::kb/_build_ccr_cpl_universe_members.py failed — the CPL map's cards read the previous build until the next run. Check the step log."
STEP

# ── Step 4d4: SkyView's sky placement (Session 239) ───────────
# The Sky view places the 159 discipline islands on a sphere three ways
# (committed · spread · by kind) from prototype/ccr_universe.json and the
# CTE share per discipline — TOP's one sanctioned use, the manual's CTE
# flag on each identity's TOP code (unified_courses_data.js, regenerated
# above, + kb/reference/top_categories.json). The builder fingerprints its
# inputs and relaxes only when they changed (~90 s of pure Python then,
# ~5 s otherwise, local files only); a discipline's side is held across a
# threshold by a 0.05 margin so no island changes sides on a daily rebuild
# by a hair. tests/ccr_sky_payload_test.py fails CI on a stale file.
step "Rebuild SkyView's sky placement" <<'STEP'
python3 kb/_build_ccr_sky.py --quiet \
  || echo "::warning title=SkyView sky placement not rebuilt::kb/_build_ccr_sky.py failed — the Sky view reads the previous placement until the next run. Check the step log."
STEP

# ── Step 4d5: the discipline-blank worklist (Session 243) ─────
# The identities discipline_edge_fill() cannot reach, named for a curator
# rather than filled by inference (Sam's ruling of 2026-09-08, sheet item
# 9). It reads unified_courses_data.js — regenerated above — and the
# subject map, so it has to be rebuilt HERE or it describes yesterday's
# payload. Read-only, ~2 s, local files only.
# tests/discipline_blanks_worklist_test.py fails CI on a stale file.
step "Rebuild the discipline-blank worklist" <<'STEP'
python3 kb/_build_discipline_blanks_worklist.py \
  || echo "::warning title=Discipline-blank worklist not rebuilt::kb/_build_discipline_blanks_worklist.py failed — the curator list describes the previous payload until the next run. Check the step log."
STEP

# ── Step 4d6: the orphan-parent worklist (Session 282) ─────────
# Identities whose recorded discipline appears NOWHERE among their
# members' mapped disciplines — item 9 of Sam's cross-list sheet,
# 2026-09-22. Same reason as 4d5: it reads unified_courses_data.js and the
# subject map, so it has to be rebuilt HERE or it describes yesterday's
# payload. Read-only, ~2 s, local files only.
# tests/orphan_parent_worklist_test.py fails CI on a stale file.
step "Rebuild the orphan-parent worklist" <<'STEP'
python3 kb/_build_orphan_parent_worklist.py \
  || echo "::warning title=Orphan-parent worklist not rebuilt::kb/_build_orphan_parent_worklist.py failed — the curator list describes the previous payload until the next run. Check the step log."
STEP

# ── Step 4d7: the re-mint blast radius (Session 295) ───────────
# What a re-mint would touch, per identity, for SkyView. It reads
# kb/coci_curation.json — re-synced from Supabase in Step 2 — so it has
# to be rebuilt HERE or it describes yesterday's curation. Measured
# 2026-09-27: the run that carried the ESL sheet writes into
# coci_curation.json left this file stale, and js-tests' lints job
# (`--check`) turned every PR red until a session rebuilt it.
# Read-only, under 1 s, local files only.
step "Rebuild the re-mint blast radius" <<'STEP'
python3 kb/_build_remint_blast_radius.py \
  || echo "::warning title=Re-mint blast radius not rebuilt::kb/_build_remint_blast_radius.py failed — SkyView's re-mint footprint reads the previous curation until the next run, and js-tests' lints job reports it stale. Check the step log."
STEP

# ── Step 5: Prepare GitHub Pages entry point ─────────────────
# The Common Subjects Reference's daily scan (Sam, 2026-10-19: a self-monitoring CSR):
# the canon rules and every minted identity's code, read-only, stdlib, local files only.
# kb/csr_out/latest.json feeds the tab's Progress view and the Commons row's known issues.
step "Scan the Common Subjects Reference" <<'STEP'
python3 kb/_csr_trail.py --latest || echo "::warning title=CSR scan not rebuilt::kb/_csr_trail.py failed; the Common Subjects Reference's Progress view and the Commons row read the previous kb/csr_out/latest.json until the next run. Check the step log."
STEP

# The Exhibits tab's Review queue (Sam, Open Asks Sheet 147 card 1, 2026-10-31): each title
# the CER procedures held, joined to its aligned course (step 4b3's `aligned`), its exhibits
# (statewide_data.js) and the colleges holding a course of the same identity. Writes
# kb/exhibits_review.json and kb/exhibits_review_courses.json, and kb/exhibits_adoption.json
# (the credential panel's Who could adopt it?, Exhibit Adoption's per-credential view, read from
# this run's statewide_data.js and statewide_prescriptive.js); exhibits.js reads them. The
# nightly cer-procedures.yml rebuilds them after its run too. The service key is for one read: the
# builder reads the saved title assignments live, so a card decided since step 3's sync stays decided
# (#3223, S649); it writes no row.
step "Build the Exhibits review queue" SUPABASE_SERVICE_KEY <<'STEP'
# Exit 3 is the builder's own refusal (a stale overlay), already said in its warning; anything else failed.
rc=0; python3 kb/_build_exhibits_review.py --quiet || rc=$?
if [ "$rc" != 0 ] && [ "$rc" != 3 ]; then echo "::warning title=Exhibits review not rebuilt::kb/_build_exhibits_review.py failed; the Exhibits tab reads the previous file until the next run. Check the step log."; fi
STEP

# Another look (Sam, 2026-10-31): titles already in the reference that still differ (an ASE test
# to name, Roman numerals, a language level, a course number left in, a level that disagrees,
# two titles to fold). Runs after the fold and the review build, so a title saved today is read
# as it now stands and a held one is left to Review. kb/exhibits_sweep.json; exhibits.js reads it.
step "Build the Exhibits tab's Another look" <<'STEP'
python3 kb/_sweep_exhibit_titles.py --quiet || echo "::warning title=Another look not rebuilt::kb/_sweep_exhibit_titles.py failed; the Exhibits tab reads the previous file until the next run. Check the step log."
STEP

# The Review card's Related titles panel and the rename batch (Sam, 2026-11-11): every canonical title with
# its issuer and counts, and the ASE titles not yet named "<Official cert name> (ASE <code>)". Renames
# nothing; Sam approves the batch in Review. kb/exhibits_related.json; exhibits.js reads it.
step "Build the Exhibits tab's related titles and rename batch" <<'STEP'
python3 kb/_build_exhibits_related.py --quiet || echo "::warning title=Related titles not rebuilt::kb/_build_exhibits_related.py failed; the Exhibits tab reads the previous file until the next run. Check the step log."
STEP

# The credential title moves table (S641, #3148): its report follows the live set and the retire ledger the fold appends.
step "Rebuild the credential title moves table" <<'STEP'
python3 kb/credential_aliases.py || echo "::warning title=Credential title moves not rebuilt::kb/credential_aliases.py failed; map_links.js reads the previous table. Check the step log."
STEP

# The List view's AI sort (Sam, 2026-11-01: "like with like in an alpha-like order"): every credential
# grouped by the subject words its title shares, the groups A to Z. Reads the credential reference
# this run wrote. kb/exhibits_ai_sort.json; exhibits.js reads it when AI sort is pressed.
step "Build the Exhibits List's AI sort" <<'STEP'
python3 kb/_build_exhibits_ai_sort.py || echo "::warning title=AI sort not rebuilt::kb/_build_exhibits_ai_sort.py failed; the List view reads the previous order until the next run. Check the step log."
STEP

# The exhibit-to-cert link (Sam, 2026-11-01: "a separate canonical list of just our certs, apart from how
# they might be bundled"): which certs each canonical title holds, by the industry credential catalog's
# ids. ASE first. kb/exhibit_cert_links.json; the Exhibits List's finder and title drawer read it.
step "Build the exhibit-to-cert link" <<'STEP'
python3 kb/_build_exhibit_cert_links.py || echo "::warning title=Cert links not rebuilt::kb/_build_exhibit_cert_links.py failed; the List reads the previous links until the next run. Check the step log."
STEP

# The Exhibits List's Outcomes match hints (Sam, 2026-11-01: "yes to SLO hints and the nightly harvest"): credentials
# whose articulated courses' SLOs match at cosine 0.5+ through distinct courses, each with its AI sort group. Reads
# public.course_outcomes (public record) through PostgREST with the service key, and this run's adoption file and AI
# sort. A hint only; nothing moves. kb/exhibit_slo_neighbors.json; exhibits.js reads it in the List.
step "Build the Exhibits List's Outcomes match hints" SUPABASE_SERVICE_KEY <<'STEP'
if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then echo "SUPABASE_SERVICE_KEY not set; the Outcomes match hints keep the previous file."; exit 0; fi
python3 kb/_build_exhibit_slo_neighbors.py || echo "::warning title=Outcomes match not rebuilt::kb/_build_exhibit_slo_neighbors.py failed; the List reads the previous hints until the next run. Check the step log."
STEP

# The public adoption page (Sam, Open Asks Sheet 147, 2026-10-31): settled credentials only,
# from the adoption file the step above wrote. library/adopt/adopt_data.json, adopt_more.json and adopt_ai.json (CPL-AI); library/adopt/.
step "Build the public adoption page's data" <<'STEP'
python3 kb/_build_adopt_page.py --quiet || echo "::warning title=Adoption page not rebuilt::kb/_build_adopt_page.py failed; library/adopt/ reads the previous file until the next run. Check the step log."
STEP

# The catalog's analysis for faculty (Sam, 2026-11-06): issuer skill areas against the harvested course
# outcomes, read from public.course_outcomes. library/adopt/adopt_align.json, read when a panel opens.
step "Build the catalog's skills-to-outcomes analysis" SUPABASE_SERVICE_KEY <<'STEP'
if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then echo "SUPABASE_SERVICE_KEY not set; the catalog's analysis keeps the previous file."; exit 0; fi
python3 kb/_build_adopt_align.py --quiet || echo "::warning title=Catalog analysis not rebuilt::kb/_build_adopt_align.py failed; library/adopt/ reads the previous analysis until the next run. Check the step log."
STEP

# CPL Pathways' person confirmations for the Commons card (Sheet 160; Sam, S565, 2026-11-03): a
# person's Confirm sets checked on program_requirement_records live; this commits which records,
# without the person's address. Read-only. kb/status/program-requirements-checked.json.
step "Sync CPL Pathways' confirmed records" SUPABASE_SERVICE_KEY <<'STEP'
if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then echo "SUPABASE_SERVICE_KEY not set; the Commons card keeps the previous confirmed list."; exit 0; fi
python3 kb/_sync_program_checked.py || echo "::warning title=Pathways confirmations not synced::kb/_sync_program_checked.py failed; the Commons card reads the previous list until the next run. Check the step log."
STEP

# The Commons tab's figures (Sam, 2026-10-18: "Build it as a tab now"): every common
# reference's complete pair, known issues, settled procedures and machine stamp, read
# from the committed files the steps above rebuilt. kb/status/commons.json; commons.js.
# The Courses List's Discipline in doubt job (Sam, 2026-11-09): the active discipline's cards the
# two-signal re-check could not settle, from the curation synced above, so a ruled card leaves.
# The run's dry-run plan and report stay as committed; only kb/ccr_doubt.json is kept.
step "Discipline in doubt (the Courses List's job)" <<'STEP'
python3 kb/_ccr_seed_recheck_dryrun.py --doubt || echo "::warning title=Discipline in doubt not rebuilt::kb/_ccr_seed_recheck_dryrun.py --doubt failed; the Courses List reads the previous kb/ccr_doubt.json. Check the step log."
git checkout -- kb/ccr_seed_recheck_dryrun/ 2>/dev/null || true
STEP

step "Build the Commons status" <<'STEP'
python3 kb/_build_commons_status.py --quiet || echo "::warning title=Commons status not rebuilt::kb/_build_commons_status.py failed; the Commons tab reads the previous file until the next run. Check the step log."
STEP

step "Copy dashboard to index.html" <<'STEP'
cp CPL_Dashboard.html index.html
STEP
