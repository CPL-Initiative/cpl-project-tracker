---
title: Public/private repo split — scope
date: 2026-08-19
tags: [scope, repo, github, ip, security, pages, blocked-on-sam]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - .github/workflows/daily-dashboard.yml
  - .github/workflows/pages.yml
  - cloudflare-worker-proxy.js
  - LICENSE
related:
  - "[[CLAUDE]]"
  - "[[docs/phrase_scope_analysis]]"
  - "[[docs/session_169_handoff]]"
---

# Public/private repo split — scope

**Status: SCOPED, NOT BUILT. Nothing has been changed.**

Sam, 2026-08-19: *"Perhaps with the public/private we partition off truly public
views like Sierra AI and the CPL Fact Sheet so anyone with an url can access,
while the others we want to protect from being branched or cloned go private."*

The instinct is right and the repo is closer to it than expected. This document
measures how close, names the one thing that is genuinely hard, and phases the
work so the cheap half can land without waiting on the expensive half.

## 1. Why we are doing this

Sam's concern is **IP proliferation, not privacy** (`cpl_memory`
`the-repo-concern-is-ip-proliferation-not-privacy`, verified 2026-08-19):

> *"I don't want someone to copy our repos and build competing systems. Not that
> we are proprietary about the IP; I just don't want to sow confusion in the
> field by having other players emerge and offer alternatives."*

He explicitly ruled OUT the privacy framing — the 67 published college-staff
emails are public information and their availability in data form is fine
(`sixty-seven-contact-emails-are-served-by-the-public-site`, verified). Only
their *presentation in comms* warrants care.

**The legal half is already done.** `LICENSE` is All Rights Reserved with an
explicit no-copy clause — *"made viewable for transparency and collaboration
only… No permission is granted to any person or entity to copy, reproduce,
modify, adapt."* Public visibility has never meant permission here. What is open
is only the practical half.

⚠️ **Secrecy is the weakest moat available and should not be over-bought.** A
vendor holding a complete copy still cannot write to MAP, has none of the 116
college relationships, and has no ESS 25-82 behind them. Being the system of
record is the moat. This split is worth doing because what it hides (internal
engineering docs) is *not* what drives field adoption — not because secrecy is
itself a strategy.

## 2. What is actually separable — measured

| Surface | Size | Written by cron? | Reaches outside its folder? | Portability |
|---|---|---|---|---|
| `sierra/` | 4 KB + assets | **No — fully static** | **No.** Talks only to `hvuwhnbuahrtptokpqfh.supabase.co` | ⭐ **Trivial** |
| `veteran-sprint-map/` | 52 KB | No | **No** — 0 asset refs, self-contained by name | ⭐ **Trivial** |
| `college_activity_template.html` | 24 KB | **Yes** (`excel_to_dashboard.py`) | No | Easy |
| `cpl_funding_public.html` | 12 KB | Page static; its 2 JS are cron-built | `cpl_funding.js`, `cpl_funding_data.js` (root) | Medium |
| `fact-sheet/` | 76 KB | **Yes** — `statewide_recs.js` (daily cron), `cpl_stories.js` (`cpl-stories.yml`) | **Yes** — fetches `../fact_sheet_metrics.json` and `../live_metrics.json` at runtime | ⚠️ **Hardest** |

Against COBI: `index.html` + `CPL_Dashboard.html` at **1.4 MB each**, plus 119
root `.js` totalling **215 MB**.

### ⚠️ Correction — the Fact Sheet is NOT self-contained

An earlier read of this called `fact-sheet/` self-contained because all nine of
its `src=`/`href=` refs are `./`-relative. That was true of the **tags** and
wrong about **runtime**: `factsheet.js` fetches `../fact_sheet_metrics.json` and
`../live_metrics.json`, both root-level and both cron-written.

**A tag scan cannot see a `fetch()`.** Any future "is this folder portable?"
check must grep for runtime fetches and `../` traversal, not just markup.

## 3. What private would hide

| Hidden by going private | Volume |
|---|---|
| `docs/` — methodology, lessons, ADRs, session handoffs | **555 files / 13 MB** |
| `kb/*.py` generators | **149 files** |
| Root generators (`excel_to_dashboard.py` et al) | 3 |
| `chatbox/` — Sierra's edge function: prompt design, trigram rules, tier ladder, false-zero doctrine | 392 KB |
| `tests/` | 230 files |
| Full git history and commit narrative | — |

**Not hidden:** the 119 root `.js` Pages serves — the running app. That split is
favorable: the reasoning and the machinery hide; only the UI stays visible, and
a UI is the cheapest thing to copy.

## 4. Which half keeps the URL

The URL path **is** the repo name, so whatever moves gets a new address. Move the
half whose address matters least.

- **`cpl-project-tracker` stays public**, holding only the public surfaces.
  Sierra and the Fact Sheet **keep their exact current URLs** — every link
  already sent to colleges keeps working.
- **COBI moves to a new private repo.** Its URL breaks for ~10 team members who
  can be told once.

This is the inverse of the obvious move and it is the whole reason the split is
cheap.

## 5. What does NOT need to change

⭐ **Cloudflare needs zero changes.** `cloudflare-worker-proxy.js` matches
`ALLOWED_ORIGINS` on the **origin** — `https://cpl-initiative.github.io`,
exact-match, no path (`isAllowedOrigin()`, hardened SEC-2). A second repo in the
same org serves from the **same origin**, so both workers keep working untouched.
The same holds for `worker-to-paste.js`.

⚠️ One exception: `worker-to-paste.js` hardcodes the Actions dispatch path
`api.github.com/repos/cpl-initiative/cpl-project-tracker/actions/workflows/daily-dashboard.yml/dispatches`.
If the daily workflow moves to the private repo, that path moves with it.

**Obsidian:** unaffected on a transfer — GitHub redirects permanently. Only the
`$vaultRoot` lane in `scripts/sync-vault-clones.ps1` needs to follow whichever
repo carries `docs/`.

**Supabase:** one new redirect URL for COBI's new address. RLS, policies and the
reviewer allowlist are untouched — they key on identity, never on origin.

## 6. The hard part — cross-repo publishing

The daily cron commits into the public surfaces. From `daily-dashboard.yml`'s
commit step: `fact-sheet/statewide_recs.js`, `college_activity_template.html`,
plus the root `fact_sheet_metrics.json` and `live_metrics.json` the Fact Sheet
fetches. `cpl-stories.yml` writes `fact-sheet/cpl_stories.js`.

So after a split, a generator in the **private** repo must publish into the
**public** one. Three routes, costed:

| Option | How | Cost | Risk |
|---|---|---|---|
| **A — Keep the generators public** | `fact-sheet/_build_statewide_recs.py` and the metrics writers stay in the public repo; the cron runs there | Lowest build cost | Leaks the generators, which is part of what we are protecting. Undercuts the point |
| **B — Cross-repo push** | Private cron pushes artifacts to the public repo with a deploy key / fine-grained PAT | One secret, one extra push step per workflow | A second credential to rotate; a failed push is silent unless asserted |
| **C — Public pages read Supabase live** ⭐ | Fact Sheet reads its figures from Supabase the way Sierra already does; the committed JS artifacts go away | Highest build cost, lowest running cost | Changes the Fact Sheet's data path — needs its own testing. But it ends the artifact-commit coupling permanently |

**Recommendation: B now, C as the destination.** B unblocks the split this week;
C is where this should end up, because Sierra already proves the pattern and it
removes the cross-repo dependency rather than automating it.

## 7. Phasing

Phase 1 is genuinely zero-risk and proves the pattern. Do not bundle it with
Phase 2.

**Phase 1 — move what is already portable.** `sierra/` and
`veteran-sprint-map/`. Both fully static, zero root dependencies, nothing writes
them. Nothing to decide, nothing to break.

**Phase 2 — resolve the Fact Sheet's data path.** Pick option B or C above. Until
this lands, `fact-sheet/` cannot move.

**Phase 3 — split the repo.** COBI + `docs/` + `kb/` + `chatbox/` + `tests/` to
the new private repo. Requires GitHub **Team** plan first, or its Pages will not
publish at all.

**Phase 4 — decommission.** Retire the dispatch path in `worker-to-paste.js`,
repoint `sync-vault-clones.ps1`, re-grant Claude repo access.

## 8. Rollback

Each phase is independently reversible. Phase 3 is the only one with a window:
the private repo's Pages must be confirmed live **before** the old COBI path is
retired, and the old path should be left serving for at least one cron cycle.
Repo visibility itself is a toggle and reverts instantly.

## 9. Open questions for Sam

1. **Should `cpl-knowledge-base` stay CC BY 4.0?** It is the store that most
   directly holds the methodology, and its licence permits remix and adaptation
   *"for any purpose, even commercially"* — the one thing actively inviting what
   this whole exercise aims to minimize. The curation pipeline is already
   human-gated, so the control point exists; nobody has been applying this lens
   at it. **This is the highest-leverage question on the page.**
2. **Is the org on Free or Team?** Phase 3 cannot start on Free.
3. **Option B or C for the Fact Sheet's data?**
4. **Name for the private repo.** `cpl-cobi` is the obvious candidate.
5. **Does the Alpha notice stay on the public surfaces?** It currently blankets
   Sierra and the Fact Sheet — both polished public products — because they share
   a repo with an alpha internal suite. A split lets them shed it.

## 10. Measurements of record

Taken 2026-08-19 against the live repo and GitHub API.

- `cpl-project-tracker` — CPL-Initiative org, **public**, 795 MB, Pages on, no CNAME
- `cpl-knowledge-base` — CPL-Initiative org, **public** (CC BY 4.0, by design)
- `CPLBrain` — samueltlee personal, **already private**
- Org: **1 owner**, 2 collaborators, **0 teams**
- Both `raw.githubusercontent` fetches (`excel_to_dashboard.py:119`,
  `kb-portal/config.js:23`) target **`cpl-knowledge-base`**, which stays public —
  so the split breaks neither
- 8 Action secrets; 29 workflows
- `ALLOWED_ORIGINS` matches origin only, exact-match — confirmed in
  `cloudflare-worker-proxy.js:40`
