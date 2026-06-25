---
title: CPL Fact Sheet — lessons
created: 2026-06-25
updated: 2026-06-25
tags: [lessons, fact-sheet, public-page, live-data, print-to-pdf, sky-blaster]
obsidian-folder: cpl-project-tracker
artifacts:
  - fact-sheet/index.html
  - fact-sheet/factsheet.css
  - fact-sheet/factsheet.js
  - fact-sheet/img/
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-standalone-public-page]]"
---

# CPL Fact Sheet — lessons

Workstream scratchpad for the **public CPL Fact Sheet** — a self-contained,
shareable web page that recreates the February-2026 "Journalist Fact Sheet" PDF,
pulls live data from COBI, and prints to a clean PDF. Built Session 74
(SkyBlaster), 2026-06-25, PRs **#537 / #540**.

## Session 74 — SkyBlaster (2026-06-25)

### What was built

Sam needed an updated CPL Fact Sheet for consultants **today**, and wanted a
**public, standalone web view** he could link people to without exposing the
rest of COBI's internal tabs.

Deliverable = **`fact-sheet/`** — a sibling-of-`kb-portal/` standalone page:

- **`index.html`** — the full fact-sheet content (CPL definition / types / modes;
  "The CPL Bump" equity data w/ the CAEL-WICHE *PLA Boost* citation; Vision 2030
  goals + Beacon economic impact; funding history + the 5-year funding table; MAP
  strategy & commitments; Veteran & Apprenticeship sprints; Noncredit Landing
  Pages; the Rocio Garcia student story; partnerships; legislation; the technology
  landscape; the resource directory; the team roster). Plus a full **KPI section**
  mirroring COBI's headline grid (all 11 cards in COBI order) and a **Statewide
  Exhibits** section (132 CCC-Collaborative exhibits across 12 program areas, a
  per-sector table + an expandable `<details>` per sector listing every exhibit).
- **`factsheet.js`** — binds the 6 headline KPIs (+ Military/Workforce/Apprentice
  breakdowns and the Veteran-Sprint figures) from `../live_metrics.json` on load,
  with the baked HTML values as a graceful fallback; wires the Print button; and
  opens all `<details>` for print/PDF.
- **`factsheet.css`** — brand tokens mirror COBI's `:root`; **Cambria** for prose,
  **Calibri** for data + KPIs (Caladea/Carlito metric clones as Linux fallbacks);
  print CSS at **0.4in** margins so "Save as PDF" yields a clean letter sheet.
- **`img/`** — the 3 screenshots preserved from the PDF (Calbright landing page,
  Rocio story, the "One Knowledge Layer" technology-landscape diagram) + the CCC
  wordmark.
- **COBI launch link** — a `📄 CPL Fact Sheet ↗` entry in the nav rail of BOTH
  HTMLs (Rule 4), an `<a class="cpl-tab cpl-tab-external">` with **no `data-tab`**
  so `tabs.js` ignores it and it opens the standalone page in a new tab.

### What was learned

- **"Sits alone" = a subdir page, not a tab.** A real COBI tab carries the full
  nav rail. To give consultants a public view *without* the other tabs, the page
  lives at `fact-sheet/` (its own HTML/CSS/JS, no COBI chrome), served publicly by
  GitHub Pages — exactly the `kb-portal/` pattern, minus the auth gate. The
  "launch from COBI" link is a non-tab anchor in the rail. Full reusable recipe →
  [`docs/kb-notes/playbook-standalone-public-page.md`](kb-notes/playbook-standalone-public-page.md).
- **Live data with zero plumbing.** The page `fetch`es `../live_metrics.json`
  (same Pages origin, the daily-cron artifact) and overwrites `[data-bind]` spans.
  Baked-in current values double as the no-JS / feed-down fallback. The page IS
  the "routine": open it (fresh data) → Print → PDF. No server, not a cron
  artifact.
- **Two data tiers.** Only the **6 headline KPIs** are in `live_metrics.json` and
  auto-update. The **5 exhibit/recommendation KPI cards** + the **Statewide
  Exhibits** counts come from the MAP **Custom Reporting Module** (transient, not
  committed), so they're a **labeled snapshot**. Semi-static narrative figures
  (Vision 2030 goals, workplan SCRs, funding table) are baked for Sam to edit.
  Follow-up: wire a committed CustomReport snapshot so those go live too.
- **The KPI-count reconciliation (the teaching case).** COBI's "Credit
  Recommendations" card shows **CCC Collaborative = 1,304** while the "Statewide
  Exhibits" card shows **Credit Recommendations = 1,101** — they look
  contradictory but measure different grains: **1,101** = *distinct* statewide
  recommendations (unique course×credit); **1,298** = *adoptions* (CCC rows with
  an articulating college); **1,304** = all CCC articulation rows = 1,298 + 6 rows
  with no college. Verified by summing the per-sector footnote (→ exactly
  132/1,101/1,298). Fix = relabel ("Articulations" vs "Credit Recs (distinct)") +
  a reconciliation note. **Lesson: when two cards disagree, the answer is usually
  "different denominators," and the per-category breakdown is the proof.**
- **Statewide exhibit detail already lived in the repo.**
  `kb/statewide_exhibit_categories.json` (the curated statewide title →
  program-area map) carries all 132 exhibit titles by sector — no need to scrape
  `map.rccd.edu/statewidecpl` (which is egress-blocked from the sandbox anyway).
  Generated the section from that JSON + COBI's per-sector counts.
- **PDF text/image extraction in the sandbox.** `poppler-utils` and `apt` are
  unavailable, and `cryptography`'s Rust binding was broken (`_cffi_backend`
  missing). Fix: `pip install --force-reinstall cffi`, then **`pdfminer.six`** for
  text and **`pypdf` + `pillow`** for embedded images. Headless render/verify via
  the pre-installed Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  (launch with `executable_path=` + `--no-sandbox`), served over a local
  `http.server` so `../live_metrics.json` resolves.
- **Publishing ≠ distributing.** Merging to `main` makes the Pages URL live but
  doesn't broadcast it — Sam shares the link himself. So "merge to publish" is
  low-risk; the only gate honored was the **required TruffleHog** secret-scan
  before each merge (waited for it to conclude `success`, then squash-merged).

### Current state

- **LIVE on `main`** at `https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/`
  + the COBI nav-rail launch link. PRs #537 (page + link) and #540 (Statewide
  Exhibits section + KPI reconciliation) both merged.

### Roadmap / next

1. **Live-wire the snapshot tier** — build a committed CustomReport snapshot the
   daily cron writes, so the 5 exhibit/recommendation KPI cards + the Statewide
   Exhibits per-sector counts auto-update instead of being a manual snapshot.
2. **Reproduce the technology-landscape diagram as live HTML/SVG** (regen-proof,
   sharper than the preserved screenshot).
3. **Semi-static figures** — Sam to confirm/refresh the Vision 2030 workplan SCRs
   (332/889/37.35%/274) and the funding table when they move.
