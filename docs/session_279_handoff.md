---
title: Session 279 handoff — SkyView is a public read-only surface; the prompt guards are built but NOT installed
date: 2026-09-19
session: 278 (SkyWarden)
tags: [handoff, skyview, auth, permissions, hooks, settings]
status: current
superseded: true
superseded_by: session_280_handoff.md
---

# You are Session 279

Your moniker is **SkyKeeper** — S278 made SkyView safe to hand to strangers and
found why the prompt guards never fired. What is left is keeping them alive
past a container.

## ✅ WHAT SHIPPED (both merged to main)

| PR | Merge | What |
|---|---|---|
| [#1632](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1632) | `e8f88a5` | SkyView read-only gating — live on Pages |
| [#1633](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1633) | `56f84e3` | Approval-prompt diagnosis, two guards, installer, detector |

### SkyView is now a deliberate public surface

Sam: *"allow public read only SkyView access but prevent any actions to be
taken that would edit or access views where edits could be done."* Asked to
gray the menu items or hide them, he chose **hide**. A rung-0 menu is SkyView ·
How SkyView works · one note. Four views moved behind STAGE, three holes closed:
the **hash routes** (`GATED_ROUTES` on `__ccrRoute()`), a **second curation
surface in another file** (`__ccrDecision`), and the **pre-JS banner's COBI
link**. The band now names the credential (**Read only** · **Team phrase** ·
**Magic link**) and says *"here and in COBI"*, because it is one credential on
one origin.

## ⛔ YOUR FIRST JOB: the guards are built and CANNOT LOAD

**This repo's `.claude/settings.json` has never loaded in any three-repo
session, and that is documented behavior.** Claude Code reads settings from the
session's PROJECT ROOT; with three repos attached the root is their common
parent. Measured: `~/.claude/projects/` held one entry, `-home-user`. The docs
confirm a multi-repo session loads *"only the plugins and marketplaces … not
permission rules, hooks, `env`, or other keys"*, and `~/.claude/settings.json`
is *"not read"* in cloud sessions at all.

Run **`python3 scripts/check_hooks_live.py`** at session start. It reports
which world you are in and cannot depend on a hook to answer.

**What Sam must do (a session cannot — the classifier refuses settings writes
as `[Self-Modification]`, correctly):**

    python3 scripts/install_prompt_guards.py --user --apply   # LOCAL, persists
    python3 scripts/install_prompt_guards.py --apply          # cloud, one session

⚠️ **The open question he asked for and has not got: PERSISTENCE on the cloud
runner.** The session root is outside all three repos and dies with the
container. Documented routes, confidence stated:

| Route | Persistent | Confidence |
|---|---|---|
| Cloud environment **setup script** | yes, runs every container start | documented — **recommended** |
| **Server-managed settings** (claude.ai admin console) | yes, org-wide | documented to reach cloud sessions |
| Package the guards as a **plugin** | yes, git-tracked | ⚠️ **unverified** — plugins ARE loaded from a repo in multi-repo sessions, but a plugin from an "external source" needs a manual install and it is unclear whether a local path counts. **Test before relying on it.** |

## ⚠️ TWO PREMISES THIS SESSION GOT WRONG — do not re-inherit them

1. **`permissions.allow` DOES work in auto mode.** Handoff 278 said it cannot.
   The classifier's decision order opens: *"Actions matching your allow, ask,
   or deny rules resolve immediately."* The allowlist never failed, it never
   loaded. Three guards were built where rules plus one hook would do; the
   third was removed on Sam's *"simplify it"*.
2. **#1625's COBI gate works on main.** A baseline run against a stale
   `origin/main` made it look broken. `git fetch` before trusting a ref.

**Auto mode is the classifier**, and Sam turned it on 2026-09-18 to stop the
storm — it caused it. ⚠️ **Do not switch modes**: auto is the lowest-prompt
mode; `acceptEdits` would prompt on every Bash and MCP call.

## Read in order

`docs/reference/approval_prompt_hooks.md` (the whole diagnosis) ·
`docs/auth_and_repo_posture_lessons.md` (2026-09-19) ·
`docs/reference/lanes/skyview-ccr-interface.md` ·
`docs/reference/lanes/org-phrase-scope-auth.md` · `docs/ccr_atlas_lessons.md`.

New KB notes: `methodology-a-single-decider-guard-is-only-as-wide-as-the-files-it-reads`
· `methodology-verify-the-premise-before-you-build-on-it`.

## Carryover

| Item | State |
|---|---|
| Install the guards | **NEEDS SAM** — one command, then a NEW session |
| Cloud persistence | open — setup script recommended, plugin route unverified |
| SkyView pinch failure | inherited, filed `s278-fable-skyview-pinch-registry`; the sweep is not in `js-tests.yml`, so CI never reddens for it |
| Sierra: four defects | untouched this session — the `%tech%` → LA Trade Tech word-filter fix is still the smallest high-value change |
| Sierra: Chaffey false negative | untouched (`s276-fable-precedent-names-its-program`) |
| `roadmap_lane` budget | raised 12,000 → 20,000 on Sam's call; measured 28/32 fit, the 4 over were current truth, and `stacked_roadmap_cell` is the real guard |

## Safety patterns to honor

- `prototype/skyview.html` is GENERATED — edit `ccr_universe.js` /
  `ccr_atlas_v1.html`, run `build_ccr_atlas.py`, then `check_generated.sh`
  **read WHOLE, never through `tail`**.
- The sweep needs gitignored shards: `python3 kb/_build_ccr_universe.py --shards-only`.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP).
- ⚠️ A `check_suite.completed` wake **routinely names a superseded head** — it
  did four times this session. Always re-read `get_check_runs` on the current
  head before merging.
- Don't run two full test suites at once; they crawl.

---

*Greetings, you are Sky**Keeper** (Session 279), see Sky**Warden**'s handoff —
`docs/session_279_handoff.md` — let's keep rolling with our queue.*
