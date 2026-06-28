---
title: Separate affordance visibility from action eligibility
created: 2026-06-28
updated: 2026-06-28
tags: [methodology, raci, ui, notifications]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
artifacts:
  - raci.js
  - excel_to_dashboard.py
  - tests/raci_nudge_optout.test.js
---

# Separate affordance visibility from action eligibility

> **One-sentence summary** — Show a low-privilege action affordance consistently on every row/card, enforce the no-eligible-target case in the data/recipient layer (return `null` + alert gracefully), and test the *eligibility* in the recipient/href layer rather than asserting on button presence.

## Context

The COBI Team & RACI tab's per-item 📣 nudge button originally appeared **only** on matrix rows that already had eligible Responsible/Accountable people — it was gated on `itemNudgeRecipients(item).length`. That coupled two unrelated questions: "should the reviewer *see* the nudge control?" and "is there anyone to nudge *right now*?" The result was a control that vanished exactly when a reviewer most wanted to act (an unstaffed item the reviewer wants to chase), and a confusing, non-uniform matrix.

## The claim

**Separate affordance VISIBILITY from action ELIGIBILITY.** They are two different layers:

- **Visibility** is a privilege/UI question — show the affordance consistently (every row, every card) whenever the *actor* is allowed to perform the action at all (here: `if (canEdit)`).
- **Eligibility** is a *data* question — whether this specific action has a valid target *right now*. Enforce it where the recipient set is computed (`itemNudgeRecipients` → `buildItemNudgeHref` returns `null`), and let the action degrade gracefully (`openItemNudge` alerts "no one eligible to nudge yet") rather than hiding the control.
- **Test the eligibility in the recipient/href layer, not the button.** Assert that the nudge `href` is `null` for an all-opted-out row and a real `mailto:` for an opted-in target — never assert on button presence/absence.

## How we got here

Session 81 (StarFarout, PR #574) dropped the `length` gate to `if (canEdit)`: the 📣 now shows on **every** Activity / sub-activity / project matrix row, plus a matching 📣 on every card (the generator in `excel_to_dashboard.py` emits 61 — 4 Activity + 57 project — deep-link buttons next to 📝 Update / 👥 RACI, setting `sessionStorage['cpl_nudge_focus']` then routing `#raci`). The Team Directory **opt-out is still honored**: `itemNudgeRecipients` drops members with `nudge===false`, so a row whose only R/A is opted out yields a `null` href. The rewritten `tests/raci_nudge_optout.test.js` asserts exactly that — button shows on every row, but the *href is null* when the only target is opted out, and a real `mailto:` when an opted-in member exists. This builds directly on Session 79's lesson: *filter a notification's AUDIENCE by the consent layer, not the role layer.*

## When this applies (and when it doesn't)

- **Applies** to **low-privilege actions** anyone in the actor's role may perform — drafting a `mailto:`, opening a composer, starting a request. The cost of "shown but no-op" is a graceful alert; the benefit is a uniform, discoverable, less-surprising UI.
- **Does NOT apply** to genuinely **privileged or destructive** actions (delete, irreversible writes, anything gated by elevated permission). Those should still be **gated** — hidden or disabled — not "shown then alert." Showing a destructive affordance you can't actually authorize is a footgun, not a convenience.
- The boundary test: if the worst case of clicking is a benign no-op + a friendly message, prefer consistent visibility + data-layer eligibility. If the worst case is data loss or an unauthorized action, gate the affordance itself.

## See also

- [[docs/cobi_raci_nudge_lessons]] — full StarFarout (Session 81) narrative + the Session 79 audience-consent lesson it extends.
- `raci.js` (`itemNudgeRecipients`, `openItemNudge`, `consumePendingFocus`), `excel_to_dashboard.py` (per-card 📣 emission), `tests/raci_nudge_optout.test.js` (null-href eligibility assertions).
