---
title: Sierra iframe embed — day-one implementation guide (vendor-facing)
created: 2026-07-03
updated: 2026-07-03
tags: [playbook, sierra, integration, iframe, vendor-facing]
kb-status: published
obsidian-folder: cpl-project-tracker
related:
  - "[[sierra_integration_guide]]"
  - "[[sierra_technical_reference]]"
  - "[[sierra_maturity_roadmap]]"
artifacts:
  - sierra/index.html
  - sierra/sierra.js
---

# Sierra Iframe Embed — Day-One Implementation Guide

> **Audience:** the vendor's developers. This is the complete, self-sufficient
> recipe for putting Sierra on your page **today** — no backend changes on
> either side, no API integration, no keys. Estimated effort: **2–4 hours
> including QA.** The deeper background (architecture, API contract, other
> integration paths) lives in
> [`sierra_technical_reference.md`](sierra_technical_reference.md) and
> [`sierra_integration_guide.md`](sierra_integration_guide.md); you do not
> need either to complete this guide.
>
> The iframe is the deliberate **interim** step — the graduation path (native
> embed, direct data access) is sequenced in
> [`sierra_maturity_roadmap.md`](sierra_maturity_roadmap.md).

---

## 1. The one decision already made for you

Embed **this exact URL** (note the query parameter):

```
https://cpl-initiative.github.io/cpl-project-tracker/sierra/?ctx=external
```

`?ctx=external` activates the **external-embed privacy variant** (live as of
2026-07-02, `cpl-chat` v27): Sierra will not quote college staff contact
names/emails on your surface — it routes visitors to the college's official
CPL landing page or MAP@rccd.edu instead. This is a policy requirement for
external embeds, not an option; it is verified by an automated live test on
every backend deploy. Everything else about Sierra behaves identically.

## 2. The markup

```html
<iframe
  src="https://cpl-initiative.github.io/cpl-project-tracker/sierra/?ctx=external"
  title="Sierra — Credit for Prior Learning assistant"
  style="width:100%; max-width:860px; height:680px; border:0; border-radius:12px;
         box-shadow:0 2px 12px rgba(11,61,97,.15); background:#fff;"
  loading="lazy"
  referrerpolicy="no-referrer"
  sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
```

Attribute-by-attribute, so nothing is cargo-culted:

| Attribute | Why |
|---|---|
| `sandbox="allow-scripts allow-same-origin allow-popups"` | The page is pure JS (`allow-scripts`); it uses its own origin's session/localStorage for the per-tab session id and the audience pick (`allow-same-origin`); answer links open in a new tab (`allow-popups`). **All three are required.** Do not add `allow-top-navigation` — the page never navigates your top window and shouldn't be able to. |
| `title` | Accessibility — screen readers announce the frame. |
| `loading="lazy"` | Don't fetch the assistant until it's near the viewport. |
| `referrerpolicy="no-referrer"` | Your page URLs aren't sent to our origin. |
| `height` | Fixed — see §3. |

**If your site sends a Content-Security-Policy**, add:

```
frame-src https://cpl-initiative.github.io;
```

Nothing else is needed — the embedded page loads zero third-party resources
(no CDNs, no fonts, no analytics), so no other CSP allowances are involved.

## 3. Sizing and responsive behavior

The page is a chat column that manages its own internal scrolling.

- **Desktop:** 620–720 px tall works well; `max-width` around 860 px keeps
  line lengths readable. The snippet above is a good default.
- **Tablet/mobile:** `height: min(78vh, 640px)` keeps the input on-screen
  above the keyboard on most devices. Below ~360 px viewport width, consider
  swapping the iframe for a plain link ("Ask Sierra ↗", same URL, new tab) —
  the page works at small widths, but a full-page experience is nicer than a
  cramped frame.
- **There is no auto-resize hook today** (the frame will not grow with
  content; the chat scrolls internally, which is the intended UX). If your
  layout needs a postMessage resize protocol, request it — it's a small
  additive change on our side.

## 4. What your users get inside the frame

All of this ships with the URL — you build none of it:

- **Streaming answers** (token-by-token) about CPL: statewide standards,
  which colleges give credit for a given license/certification, eligible
  courses with units, live statewide impact numbers, college CPL landing-page
  links, and "which colleges teach this" adoption guidance.
- **Multi-turn conversation** — follow-ups like "how about near Long Beach?"
  work; Sierra asks a focusing question before dumping long lists.
- **Audience selector** — first-time users pick who they are (student /
  faculty / administrator / employer / civic); students get plain language
  with zero system jargon. Required before the first question.
- **👍/👎 feedback with optional note** on every answer — this flows directly
  into the CPL team's triage queue, so your users' feedback improves Sierra
  for everyone (typical fix turnaround for a confirmed retrieval gap has been
  same-day to next-day).
- **Suggested starter questions**, typing indicator, friendly error states
  (network failure, rate limit, empty answer), and a "please don't enter
  personal information" notice (questions are logged anonymously for quality
  improvement).
- **Branding:** Sierra name, the Mt Whitney mark, "Your CPL Sherpa" tagline,
  CCC navy palette. The frame is visibly Sierra — by design for this phase.

## 5. Known behaviors to set expectations on

- **Storage partitioning:** some browsers partition third-party-iframe
  storage, so a returning visitor may be asked to re-pick their audience.
  Harmless.
- **No credit guarantees:** Sierra deliberately never promises credit — it
  routes students to their college for the actual review. Please keep your
  surrounding page copy consistent with that ("see what your experience may
  be worth", not "get guaranteed credit").
- **Availability:** the page is served by GitHub Pages and the brain runs on
  Supabase + Anthropic. There is no formal SLA; the frame degrades to
  friendly error messages if the backend is unreachable. Incidents: email
  MAP@rccd.edu.
- **Behavior evolves without your releases:** the CPL team tunes Sierra
  continuously (data refreshes, guidance rules, backend deploys). Fixes reach
  your page instantly; we notify you ahead of changes expected to be visible.
- **Analytics:** interactions inside the frame land in our logs, not your
  page analytics. If you need attribution, ask us for a tagged variant URL
  (e.g. `&src=<yourname>`) — small additive change.

## 6. QA checklist (run before launch)

On your staging page, with the iframe in place:

1. ☐ Frame loads; Sierra intro + audience chips visible.
2. ☐ Sending is blocked until an audience chip is picked (brief flash prompt).
3. ☐ Ask **"What is Credit for Prior Learning?"** — answer streams in
   token-by-token (if it appears all-at-once after a long wait, something in
   your stack is buffering; check CSP/proxies).
4. ☐ Ask **"Which colleges give credit for a real estate license?"** —
   colleges + course titles with units appear; links open in a **new tab**.
5. ☐ **The privacy gate check** — ask
   **"Who is the CPL contact at San Diego Mesa College?"**
   The answer must **NOT** contain a staff name or email; it should point to
   the college's CPL landing page and MAP@rccd.edu. (If you ever see a staff
   name/email on your embed, the `?ctx=external` parameter is missing from
   your `src` — fix the URL.)
6. ☐ Follow-up turn works: after #4, ask "how about near Long Beach?" — the
   answer stays on the real-estate topic.
7. ☐ Click 👍 on an answer, add a note — "✓ Thanks — logged." appears.
8. ☐ Mobile viewport (375 px): input reachable, keyboard doesn't hide it.
9. ☐ Keyboard-only: tab into the frame, pick audience, type, submit.
10. ☐ The "don't enter personal information" notice is visible.

## 7. Launch-day coordination

Email MAP@rccd.edu with: the page URL where Sierra is embedded, your launch
date, and a rough traffic expectation (visitors/day). That's it — no keys, no
origin registration needed for the iframe path. We'll add your top user
scenario to our automated regression battery so future backend changes are
tested against your use case.

## 8. Rollback

Remove the iframe. There is no state on your side; nothing else to undo.

## 9. What comes after the iframe

This embed is Phase 1 of a sequenced plan — native in-page embed (your design
system, our API) and direct data access for your own bot are Phases 3–4,
gated on guardrails and content work on our side. The full sequence, with
what's required from whom:
[`sierra_maturity_roadmap.md`](sierra_maturity_roadmap.md).

**Contact:** MAP@rccd.edu · answer-quality issues: use the 👎 + note (fastest
path — lands in the team's triage queue with the full Q/A snapshot).
