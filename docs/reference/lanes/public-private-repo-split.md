---
title: "Public/private repo split — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Public/private repo split

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Partition the truly public views (Sierra, Fact Sheet, veteran map, landing pages) from COBI + the methodology, so the approach is not trivially cloneable.

## Status

🔨 **SCOPED, NOT BUILT** (SkyRegister). Read [`docs/public_private_repo_split_scope.md`](docs/public_private_repo_split_scope.md) — it is the authority. ⭐ **The concern is IP PROLIFERATION, not privacy** (Sam, 2026-08-19); he explicitly ruled the 67 published college-staff emails fine as public data, comms presentation aside. **The legal half is already done** — `LICENSE` is All Rights Reserved with an explicit no-copy clause, so public never meant permitted. ⭐ **MOVE COBI, NOT THE PUBLIC STUFF** — the URL path IS the repo name, so whatever moves gets a new address; moving COBI keeps Sierra + Fact Sheet on the links already sent to colleges and breaks only ~10 team bookmarks. ⭐ **Cloudflare needs ZERO changes** — `ALLOWED_ORIGINS` exact-matches the ORIGIN (`https://cpl-initiative.github.io`), never a path, so a second repo in the same org passes untouched. ⚠️ **`fact-sheet/` is NOT self-contained** — an earlier read called it portable off its nine `./` tags; `factsheet.js` fetches `../fact_sheet_metrics.json` + `../live_metrics.json` at RUNTIME. **A tag scan cannot see a `fetch()`.** ⚠️ **The cron commits INTO the public surfaces** (`fact-sheet/statewide_recs.js`, `college_activity_template.html`; `cpl-stories.yml` writes `cpl_stories.js`), so a split needs cross-repo publishing: **B (deploy-key push) now, C (public pages read Supabase live, as Sierra already does) as the destination.** ⚠️ **Phase 3 needs the Team plan** — GitHub Free publishes Pages only from public repos, so flipping on Free takes the site dark. **Phase 1 is zero-risk and unbundled:** `sierra/` + `veteran-sprint-map/` are fully static with no root deps. ⚠️ **Secrecy is the WEAKEST moat** — a vendor with a full copy still cannot write to MAP, lacks the 116 college relationships and has no ESS 25-82; this trade is cheap only because what private hides (engineering docs) is not what drives adoption. **BLOCKED ON SAM:** ① should `cpl-knowledge-base` stay **CC BY 4.0** (it permits commercial remix of the methodology — the highest-leverage question); ② Free or Team; ③ option B or C; ④ private-repo name; ⑤ does the Alpha notice stay on the public surfaces.
