---
title: Engineering Practices — Decisions & Lessons (dev infra, testing, design system)
date: 2026-06-04
last_updated: 2026-06-04
session: 32 (Busy Feynman) — established from the Session-32 retrospective
status: ACTIVE — committed test harness + CI + stop-hook fix shipped; design-system tokens established; CLAUDE.md trim + bulk CSS migration STAGED
tags: [engineering, dev-infra, testing, jsdom, ci, design-system, process]
artifacts:
  - package.json
  - tests/run.js
  - tests/cer.test.js
  - .github/workflows/js-tests.yml
  - scripts/stop-hook-git-check.sh
  - docs/kb-notes/reference-ui-design-system.md
  - docs/kb-notes/methodology-commit-the-test-harness.md
related:
  - "[[CLAUDE]]"
  - "[[docs/INDEX]]"
---

# Engineering Practices — Decisions & Lessons

Cross-workstream lane for how we *build* (dev infra, testing, the design
system), as distinct from what we build (the CER/EACR/Excel workstreams). Born
from a Session-32 retrospective Sam asked for: "looking back across the session
artifacts, what would improve efficiency / continuity / UI aesthetics?"

## Session 32 — retrospective → shipped process improvements (2026-06-04)

The retrospective pulled real numbers from the repo rather than guessing:
- **CLAUDE.md 1,874 lines** loaded in full every session (growing token tax).
- **148 distinct hex colors** in the dashboard; brand navy `#0A2240` hardcoded
  **568×** vs **92 total `var()`** uses — a token system that existed but was
  barely used → aesthetic drift on the newer tabs.
- **`force-push` in 22 docs, `Rule 4`/mirror in 51** — recurring rituals/taxes.
- The stop-hook "Unverified" false-positive fired **4× in one session**.
- "jsdom N/N" cited across handoffs, but the tests lived in `/tmp` and evaporated.

### Shipped this session (PR #288 + token PR)
1. **Committed jsdom test harness + CI** — `package.json` + `tests/` (`run.js`
   runner + `cer.test.js`) + `npm test` + `.github/workflows/js-tests.yml`
   (non-required check). The CER test renders the **real baked payload** and
   guards the Session-32 behaviors, including a **synthetic `raw_variants:null`
   row** that fails the build if the search/expand `|| []` guard regresses.
   18/18. Distilled: `docs/kb-notes/methodology-commit-the-test-harness.md`.
2. **Stop-hook false-positive fix** — `scripts/stop-hook-git-check.sh` (durable
   repo copy of `~/.claude/stop-hook-git-check.sh`) with a one-line `awk` change:
   skip commits committed by `noreply@github.com` (GitHub's own squash-merge
   commit, left at HEAD by the session-branch-reuse flow, un-amendable without
   force-pushing main / Rule 5). Applied live + committed for install.
3. **Design-system tokens** — added surface/border/text-scale/link tokens to the
   `:root` block (both HTMLs, Rule 4) so the newer tabs' ad-hoc slate scale has
   canonical names to converge on. Rule codified: **new CSS uses `var(--token)`,
   never a raw hex.** Reference + component cheatsheet:
   `docs/kb-notes/reference-ui-design-system.md`.

### Learnings
- **Ground a retrospective in measurements.** `grep`/`wc` over the repo turned
  vague "things feel heavy" into specific, prioritized, actionable levers.
- **Throwaway verification is a smell** — if a test is worth running once, commit
  it. And make it guard the *failure mode* (the synthetic null row), not a happy
  path.
- **A false-positive that fires every cycle erodes signal.** The hook nagged on a
  commit no one can fix; the fix is to teach the check what it legitimately can't
  control (GitHub's own merge commits).
- **A token system only helps if it's used.** Defining `:root` vars wasn't
  enough; the drift came from not *referencing* them — hence the explicit rule +
  the reference note + (staged) migration.

### Staged for a focused next session (Sam's call — see session_33_handoff.md)
- **CLAUDE.md history→archive trim**: move the completed roadmap-table rows +
  the per-session narrative blocks (≤ Session 31) to `docs/roadmap_archive.md`;
  keep Critical Rules, the Pipeline Reference, live/open roadmap rows, and the
  current session inline. High-stakes (project memory) → its own verified pass.
- **Bulk CSS literal→`var(--token)` migration**: replace the 568 brand-hex
  literals (+ the worst slate-scale offenders) with tokens, parity-verified
  (var resolves to the same hex → visually byte-identical), excluding
  generator-emitted + JS-string regions. Its own parity-checked pass.

### Next concrete step
Either pick up the two staged items (CLAUDE.md trim first — biggest per-session
win), or fold these practices into normal feature work (tests committed under
`tests/`, CSS via `var()` + the reference note, prototype-first for new tabs).
