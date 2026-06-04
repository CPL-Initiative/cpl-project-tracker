---
title: Recovering screen/computer-use reach on Claude Code (web) — what this environment can and can't do
created: 2026-06-04
updated: 2026-06-04
tags: [reference, environment, claude-code-web, mcp, computer-use, workflow, tooling]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline.md]]"
artifacts:
  - (no code — operating-model reference)
---

# Recovering screen/computer-use reach on Claude Code (web)

> **One-sentence summary** — Claude Code on the web runs in an ephemeral cloud
> container that *by design* can't see your screen or touch your machine, but you
> recover most of a "see-my-screen / use-my-computer" (Cowork-style) workflow
> three ways: it can **render artifacts and send them back** (screenshots of the
> built dashboard), it can **act directly on external systems via MCP**
> (Supabase / GitHub / Google Drive — no screen needed), and for true local /
> browser reach you add **Claude for Chrome** (browser) or the **Claude Code
> desktop app** (local dev) on whatever machine you're on.

## Context

Sam ran this project in a screen-vision/computer-control tool ("Cowork") earlier,
then moved to **Claude Code on the web** because he needed to work from a laptop
on the road and juggling multiple local repo clones was confusing. The web env
solved portability but gave up local-machine reach — he asked how to get the
"see my screen + use my computer" feeling back without re-introducing the local
mess (2026-06-04).

## The claim — why the web env can't, and what recovers it

**Why it can't, structurally:** Claude Code on the web is an **isolated,
ephemeral cloud container** (fresh `git clone` at start, reclaimed after
inactivity; outbound network gated by the environment's policy — see
https://code.claude.com/docs/en/claude-code-on-the-web). It is *not on your
machine*, so it cannot see your screen or drive your mouse/keyboard. That same
property is exactly what made it portable and killed the multi-clone confusion.
**You traded local reach for portability** — but the reach is largely
recoverable.

**The reframe that matters for THIS project:** almost all the "screen work" here
is **web dashboards + external systems** (MAP/CCCCO Azure, Supabase, Cloudflare,
GitHub, the deployed Pages site), and those have two better-than-screen-driving
recoveries plus one in-environment trick:

| Need | Best surface | Notes |
|---|---|---|
| "Show me how the dashboard looks" | **This env, today** | Build in the container (`python3 excel_to_dashboard.py` / `/run` / `/verify`) and **send a screenshot** with `SendUserFile`. The "look at it and tell me" loop survives — for *this* project specifically. |
| Act on Supabase / GitHub / Google Drive | **MCP, already wired here** | The session has those as MCP servers — run SQL, browse the DB, manage PRs, read Drive files **directly**. Safer + faster than screen-driving a *live* system, and it's portable. |
| Hands-on "see + drive my browser dashboards" (MAP/CCCCO have no API) | **Claude for Chrome** | Closest to Cowork's feel; the extension runs locally on whatever machine you're on (incl. the road laptop). Research preview — verify availability; be careful pointing it at **live/shared production** dashboards. |
| Local file/app manipulation, local dev convenience | **Claude Code desktop app / CLI** | Same Claude Code, real filesystem + commands. Beat the multi-clone trap with **one clone per machine, git as the sync layer** (already how everything here flows). Keep the web env for travel. |

**Headline recommendation:** keep Claude Code on the web as the portable repo
brain + add Claude for Chrome for dashboard reach + lean on MCP here for
Supabase/GitHub. That trio recovers ~90% of the Cowork feel, stays
laptop-portable, and keeps *live* systems on safer direct-API rails instead of
screen-clicking.

## How we got here

Sam's question after Session 35. The non-obvious wins he didn't know he had: (1)
this environment can **render + screenshot** the dashboard back to him (he
replied "Great to know you can render views in this environment"); (2) MCP
already gives **direct programmatic reach** into the systems he'd otherwise
screen-drive. The safety angle is real: his MAP / Supabase / Cloudflare are
**live + shared**, so a deterministic MCP/API call is preferable to a
screen-control agent clicking through a production UI.

## When this applies

- **Applies** whenever a session (or Sam) wants "computer-use" reach but is on
  the **web** env: reach for screenshots-back + MCP first; escalate to
  Chrome/desktop only for what genuinely needs a local screen.
- **Doesn't replace** a true local screen for non-browser desktop apps — that's
  the desktop app / a computer-use product, tied to one machine.
- **Safety:** never point a screen-control agent at a live/shared production
  dashboard casually; prefer the direct API/MCP path for anything that writes.

---

*Authoring check: durable (the env model + the three recoveries outlive this
workstream), reusable (any future session fielding the same question, or Sam on a
new machine), distilled (one operating-model idea), self-contained (a stranger
can act on it).*
