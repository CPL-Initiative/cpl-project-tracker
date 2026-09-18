---
title: Session 278 handoff — the SkyView curation ladder is live, the re-mint blast radius has its data layer, and the execute_sql prompt storm is fixed
date: 2026-09-18
session: 277 (SkyLedger)
tags: [handoff, skyview, auth, remint, blast-radius, execute-sql, emergency-checkpoint]
status: current
---

# You are Session 278

Your moniker is **SkyWarden** — this session built the gate (who may stage, who
may save, who may leave the page) and the instrument that says what a re-mint
would cost. What is left is the surface that shows it.

⚠️ **THIS IS AN EMERGENCY CHECKPOINT (Rule 9a).** `kb/_context_budget.py` read
**31,860 tokens left (95.9% used)** — below the 50,000 EMERGENCY line — right
after #1627 merged. Per 9a only the handoff, the moved lane files and the
`cpl_memory` rows were written.

**Of Rule 9's 13 artifacts, these were NOT refreshed — they are your first job:**

- `kb/_docs_audit.py` was **never run this session** (step 0 of `/checkpoint`)
- `docs/ccr_atlas_lessons.md` — no entry for the ladder or the blast radius
- `docs/admin_tab_lessons.md` — no entry for the auth measurements
- `CLAUDE.md` §11 — no S277 narrative subsection
- the To-Do feed (`kb/cpl_todos.json`) — the `s277-*` items are untouched
- `docs/reference/lanes/org-phrase-scope-auth.md` and
  `docs/reference/lanes/admin-tab-side-menu.md` — both still describe the
  pre-ladder world and **both are now inaccurate** (see below)
- `docs/reference/lanes/public-private-repo-split.md` — does not carry Sam's
  2026-09-18 decision or the inbound raw-URL gap

`docs/reference/lanes/skyview-ccr-interface.md` **was** refreshed (#1626).

## ✅ WHAT LANDED (all merged to main)

| Commit | What |
|---|---|
| `f72381b` (#1623) | `execute_sql` PreToolUse guard |
| `b0f3aeb` (#1625) | SkyView curation ladder — sign-in on the map, merge execution, gated navigation |
| `5873dad` (#1626) | Lane file corrected; KB note for the generator-comment trap |
| `0a36d4c` (#1627) | Re-mint blast radius — data layer + CLI |

### The curation ladder (Sam specified it across three messages)

> *"To position courses to merge needs at least team code auth to do"* ·
> *"magic link can do any of the three"* ·
> *"Team code or magic should be able to navigate to all links"* ·
> *"Login link on the graphical SkyView, not this view"*

| Rung | Credential | Opens |
|---|---|---|
| 0 VIEW | the link alone | map, search, details, Ask |
| 1 STAGE | the team phrase | positioning a course; the COBI + CCR-table links |
| 2 EXECUTE | magic-link reviewer | Save, writing `kb_curation` |

`curationRung()` in `prototype/ccr_universe.js` is the ONLY place any of it is
decided. Sign-in lives in the band inside `#u-full` — the only chrome surviving
both `body.u-solo` and full screen. ⚠️ The staged list `#u-writes` is in
`#u-below`, which solo HIDES.

### The re-mint blast radius

`kb/_build_remint_blast_radius.py` → `prototype/ccr_remint_blast.json` (162 KB,
sparse) + `kb/remint_blast_worklist.json` (536 KB, operator copy).

    python3 kb/_build_remint_blast_radius.py --id "REAL M1032"
    → 60 members · 14 articulations · 1 curation row · 75 TOTAL

**Measured:** 7,843 of 15,515 minted identities carry a footprint beyond their
own members. Median 3, top 1% ≥31, `WEXP M1001` holds 2,190.

## YOUR SEQUENCE

1. **Finish the checkpoint** — the artifacts listed above. Start with
   `python3 kb/_docs_audit.py`.
2. **THE SKYVIEW RENDER — the one thing Sam asked for that is not built.**
   Load `prototype/ccr_remint_blast.json` lazily on first identity selection,
   cache it, render one line in `renderNode()`'s details panel: *"A re-mint
   would move: N members · A articulations · C curation rows."* Members come
   from the roster the browser already holds — that is why the payload omits
   them. Needs a jsdom test, **plus `npm run sweep` and `npm run a11y skyview`
   in the same PR** (standing rule for any SkyView change).
3. **Fix the two inaccurate lane files** (`org-phrase-scope-auth`,
   `admin-tab-side-menu`) — a lane file states current truth.
4. **The public/private split** — Sam ruled 2026-09-18: *"I won't flip COBI
   private yet, but will wait until we move to team account"* (next week).
   ⚠️ **Organizations cannot be on GitHub Pro**, so `CPL-Initiative` is likely
   on **Free** today and flipping before the move takes the site dark. On Team
   the site stays **fully public** — access-controlled Pages is Enterprise
   Cloud only, so the flip buys anti-cloning and restricts nobody.
   ⚠️ **§10 of `docs/public_private_repo_split_scope.md` is WRONG**: it says
   "the split breaks neither" from two outbound fetches. The **inbound**
   direction was never measured — **15+ references** to
   `raw.githubusercontent.com/.../live_metrics.json` across the public KB and
   the vault (including `cpl-knowledge-base/budget-support/web/app.js`, a live
   app, and both `CLAUDE.md` files) break on ANY plan once the repo is private.
   Also `budget-support/scripts/send_invites.py` mails partners a Pages link.

## ⚠️ Sam's open calls

- **Re-mint execution** — deliberately not built. He said *"I don't plan to
  remint until I do significant merge work later."* His 2026-09-05 ruling makes
  a re-mint view a queue he approves, never a fire button; Rule 7 re-locks at
  faculty publication.
- Carried from S277: the Orange County LVN program · guidance row `674923db` ·
  the 381 garbled course rows · the next `RELATED_PROGRAMS` list · auto-deploy
  on merge.

## What this session learned

- **`_build_dependency_map.py` enumerates with `git ls-files`, so an UNTRACKED
  file is invisible to it.** `git add` BEFORE rebuilding, or the rebuild looks
  clean and CI fails a round later. Cost two CI rounds; the rule now sits in
  `scripts/check_generated.sh` above the line it governs.
- **Read `check_generated.sh` output WHOLE, never through `tail`.** Its second
  step is the dependency-map `--check` CI runs; tailing hid a red step three
  times.
- **A build placeholder named in a COMMENT is still substituted** —
  `str.replace` has no syntax. Naming `__UNIVJS__` in an HTML comment inlined
  485 KB of `ccr_universe.js` twice. KB note:
  `methodology-a-generator-does-not-know-what-a-comment-is`.
- **`coci_articulations.json` is already current-era** — five applied markers
  through `_identities_rekeyed` (2026-09-05). Resolving its keys again
  double-applies: 1,662 live keys moved and homeless ROSE by 4. The direction
  test works. `assert_current_era()` refuses rather than guessing.
- **`course_id` IS the identity id** in the articulation store. Joining through
  member control numbers matched 2 records of 4,592.
- **`permissions.allow` and the auto-mode classifier are two gates.** The
  missing "Always Allow" button was the tell: the rule already existed.

## Carryover

| Item | State |
|---|---|
| SkyView render of the blast radius | **NOT BUILT** — sequence item 2, the data layer is ready |
| Rule 9 artifacts | emergency checkpoint — see the list at the top |
| `execute_sql` prompts | fixed; **takes effect at the next session start** (hooks load at startup) |
| Three Sierra check-floors | left unrecorded on purpose (`sierra_program_search` 20→37, `sierra_prompt_cache` 31→32, `sierra_geo_ranking` 50→51) — that session's to record |
| Parallel Sierra session | live all evening on CNA→LVN; collisions were `kb/dependency_map.json`, `tests/check_floor.json`, `docs/` catalogs |
| `cpl_memory` rows written | `sam-skyview-curation-ladder-three-rungs-2026-09-18` · `sam-navigation-to-non-public-pages-needs-a-rung-2026-09-18` · `a-build-placeholder-in-a-comment-is-still-substituted-2026-09-18` |

## ⚠️ Safety patterns to honor

- `prototype/skyview.html` is GENERATED — edit `ccr_universe.js` /
  `ccr_atlas_v1.html`, run `build_ccr_atlas.py`, then `check_generated.sh` LAST.
- The sweep needs gitignored shards: `python3 kb/_build_ccr_universe.py --shards-only`.
- Never pipe a long background command through `tail` — it buffers and leaves
  an empty output file.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP).
- The stop-hook "Unverified" nag is a false positive — **do not amend**.
  Proven again today: `f72381b` was committed as `MAP@rccd.edu` and reads
  `slee@collegeanalytics.org` on main; GitHub reattributes at squash-merge.

---

*Greetings, you are Sky**Warden** (Session 278), see Sky**Ledger**'s handoff —
`docs/session_278_handoff.md` — let's keep rolling with our queue.*
