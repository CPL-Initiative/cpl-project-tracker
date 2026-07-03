---
title: Sierra integration guide — suggested implementation plan for vendor developers
created: 2026-07-02
updated: 2026-07-02
tags: [playbook, sierra, cpl-assistant, integration, vendor-facing]
kb-status: published
obsidian-folder: cpl-project-tracker
related:
  - "[[sierra_technical_reference]]"
  - "[[sierra_integration_analysis]]"
  - "[[kb-notes/playbook-deploy-shared-supabase-edge-function]]"
artifacts:
  - sierra/index.html
  - sierra/sierra.js
  - cpl_chat.js
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Sierra Integration Guide — Implementation Plan

> **Audience:** the vendor's developers, plus the CPL/MAP team members
> coordinating with them. Read
> [`sierra_technical_reference.md`](sierra_technical_reference.md) first for
> the full API contract and architecture; this guide is the *how-to*.
> Decision context lives in
> [`sierra_integration_analysis.md`](sierra_integration_analysis.md).
> Accurate as of 2026-07-02, `cpl-chat` v26.

---

## 0. Choosing an integration path

| Path | Choose when… | Backend change | Vendor effort |
|---|---|---|---|
| **A. Link out** | You just need Sierra reachable from your page | none | ~1 hour |
| **B. Iframe embed** | You want Sierra *on* your page, standard look is fine | none | ~1 day |
| **C. Native embed (call the API)** | You need Sierra inside your own UI/design system | CORS origin add + redeploy (done by CPL team) | ~1–3 weeks incl. coordination |
| **D. Server-side proxy** | You need vendor-side throttling/logging, or can't wait for a CORS change | none | ~1 week |

**Recommended plan: start with B, graduate to C** if/when deeper UX
integration is needed. B delivers the full feature set (multi-turn, audience
selector, feedback, streaming, branding) with zero coupling to the API
contract; C gives you pixel-level control at the cost of owning the client.

Whichever path you pick, coordinate launch timing with the CPL team — see §6.

---

## 1. Path A — Link out (same-day)

Point a button/banner at the standalone Sierra page:

```
https://cpl-initiative.github.io/cpl-project-tracker/sierra/
```

Open in a new tab (`target="_blank" rel="noopener"`). Suggested label:
**"Ask Sierra — your CPL guide ↗"**. That's the whole integration. The page
is fully self-contained (no login, no cookies required, mobile-friendly).

---

## 2. Path B — Iframe embed (recommended first step)

### 2.1 Markup

```html
<iframe
  src="https://cpl-initiative.github.io/cpl-project-tracker/sierra/?ctx=external"
  title="Sierra — Credit for Prior Learning assistant"
  style="width:100%; max-width:860px; height:680px; border:0; border-radius:12px;
         box-shadow:0 2px 12px rgba(11,61,97,.15);"
  loading="lazy"
  referrerpolicy="no-referrer"
  sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
```

- `allow-popups` is required — Sierra's answer links open in a new tab.
- `allow-same-origin` is required — the page uses `sessionStorage`/`localStorage`
  for the session id and the audience pick.
- If your site sends a Content-Security-Policy, allow
  `frame-src https://cpl-initiative.github.io`.
- **`?ctx=external` is the external-embed variant** (v27): it suppresses
  college staff contact names/emails from answers (Sierra instead routes
  visitors to the college's CPL landing page / MAP@rccd.edu). External embeds
  should use it; omit it only if the CPL team has agreed contacts belong on
  your surface.

### 2.2 Sizing guidance

The page is a chat column; it needs vertical room. Recommended: 620–720 px
tall on desktop; on mobile give it `height: min(78vh, 640px)` or link out
instead (Path A) below a small viewport. There is **no auto-resize
postMessage hook today** — if you need one, ask the CPL team (small, additive
change to `sierra/`).

### 2.3 Known iframe caveats

- Some browsers partition third-party-frame storage, so a returning
  visitor's audience pick may not persist across visits. Harmless — Sierra
  just re-asks.
- Analytics inside the frame are ours (the `chat_interactions` log), not
  your page analytics. If you need attribution, tell us — we can serve a
  variant URL (e.g. `sierra/?src=vendor`) and pass it through.
- The iframe inherits our branding (Sierra mark, CCC navy). If that clashes
  with your design system, that's the signal to move to Path C.

### 2.4 Acceptance checklist (B)

- ☐ Chat streams token-by-token (not one big paste after a wait) — if you
  see the latter, something in your stack is buffering; check CSP/proxy.
- ☐ Audience chips appear and are required before the first send.
- ☐ Links in answers open in a new tab.
- ☐ 👍/👎 bar appears after each answer.
- ☐ Mobile layout acceptable at 375 px wide.

---

## 3. Path C — Native embed (your UI, our API)

### 3.1 What the CPL team does first (blocking prerequisite)

1. Add your production **and staging** origins to `ALLOWED_ORIGINS` in the
   `cpl-chat` Edge Function.
2. Redeploy per the shared-function playbook (capture the running version,
   pass `verify_jwt:false` explicitly, byte-verify, run the 13-mode smoke
   battery). Turnaround is same-day once origins are confirmed.
3. Optionally add your top user scenario as a smoke mode so your use case is
   regression-guarded on every future deploy. **Strongly recommended.**

Send the CPL team (MAP@rccd.edu): your exact origins (scheme + host, e.g.
`https://portal.vendor.com`), expected traffic (questions/day), and launch
date.

### 3.2 The API in one screen

```
POST https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat
Headers: Content-Type: application/json
         apikey: <anon key>            ← public key; get it from the CPL team
         Authorization: Bearer <anon key>
Body:    { "query":      "<user question, ≤1000 chars>",
           "session_id": "vendorname-<uuid>",          ← prefix please (attribution)
           "history":    [ {"role":"user","content":"…"},
                           {"role":"assistant","content":"…"} ],   ← prior turns; send [] on turn 1
           "audience":   "student",                     ← optional; see 3.5
           "ctx":        "external" }                   ← REQUIRED for external embeds (v27):
                                                          suppresses college staff contact
                                                          names/emails from answers; fail-open

Success → 200 text/event-stream:
    event: sources   data: [{id,heading,similarity},…]     (once, first)
    event: text      data: {"text":"<delta>"}              (repeated — concatenate)
    event: done      data: {}                              (once, last)

Errors → plain JSON before any stream: 400 (no query), 405, 429 (rate
limit), 500, 502 (upstream model). No SSE error event exists.
```

Full contract details (validation, caps, CORS, rate limits):
[`sierra_technical_reference.md §3`](sierra_technical_reference.md).

### 3.3 Minimal working client (reference)

```js
const CHAT_URL = 'https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat';
const ANON = '<anon key from CPL team>';
const convo = [];                       // [{role, content}…], keep last 8
const sessionId = 'vendorname-' + crypto.randomUUID();

async function ask(query, onDelta, onDone, onError) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                 'apikey': ANON, 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify({ query, session_id: sessionId,
                             history: convo.slice(), audience: 'student',
                             ctx: 'external' })   // external embeds: suppress staff contacts (v27)
    });
    if (!resp.ok) {                     // error JSON, not SSE
      if (resp.status === 429) return onError('Lots of questions right now — try again in a minute.');
      return onError('Something went wrong (error ' + resp.status + ').');
    }
    const reader = resp.body.getReader(), dec = new TextDecoder();
    let buf = '', full = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const frames = buf.split('\n\n'); buf = frames.pop();
      for (const frame of frames) {
        let ev = 'message', data = '';
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) ev = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (ev === 'text') {
          try { full += JSON.parse(data).text; onDelta(full); } catch (_) {}
        }
      }
    }
    if (!full) return onError('No answer this time — try rephrasing.');
    convo.push({ role: 'user', content: query },
               { role: 'assistant', content: full });
    while (convo.length > 8) convo.shift();
    onDone(full);
  } catch (e) { onError('Could not reach the assistant — check your connection.'); }
}
```

Or skip writing it: `sierra/sierra.js` in this repo is a complete,
dependency-free, test-covered implementation of everything above plus the
audience selector and feedback bar — fork it and restyle.

### 3.4 Non-negotiable client requirements

These protect your users and match what every first-party surface does:

1. **Escape-first rendering.** HTML-escape the *entire* model output
   **before** applying any markdown formatting. Never `innerHTML` raw model
   text. Sierra's answers use markdown (headings, tables, lists, links) —
   the reference renderer (`renderMarkdown` in `sierra/sierra.js`, exported
   for tests as `window.CPL_SIERRA_PAGE.renderMarkdown`) is the easiest safe
   choice: escape-first, http(s)-only links, `target="_blank"
   rel="noopener noreferrer"`.
2. **PII notice.** Show the same warning our surfaces show: questions are
   logged — *"Please don't enter personal information."*
3. **Graceful degradation.** Handle 429 with a friendly retry-later message;
   treat an empty stream as a soft failure; one in-flight request at a time
   (disable the send button while streaming).
4. **Input cap** at 1,000 characters (the server truncates silently beyond
   that).
5. **No credit promises in your surrounding copy.** Sierra deliberately never
   guarantees credit — it routes students to their college for actual review.
   Your page copy must not undo that ("Get guaranteed credit!" ❌).

### 3.5 Strongly recommended (quality wins, one line each)

- **Send `history`** (even `[]` on turn 1) — this opts you into multi-turn
  mode: follow-up questions work, and Sierra asks a focusing question before
  dumping long lists.
- **Send `audience`.** If your platform serves a known population, pin it
  (e.g. `'student'` — strips system jargon and gives plain-language answers
  with concrete next steps). Otherwise offer the same 5-chip picker we use:
  `student / faculty / administrator / employer / civic`.
- **Prefix `session_id`** with your platform name — it's how we attribute
  and monitor your traffic in the logs (there are no per-partner API keys).
- **Wire the feedback bar** (👍/👎 + note) via the `sierra_feedback_upsert`
  RPC (contract in the technical reference §3.6, working code in
  `sierra/sierra.js`). Your users' feedback lands directly in our triage
  queue — it is the fastest path to fixes; pass a distinctive `p_page` value
  (e.g. `'vendor-portal'`).

### 3.6 Branding

If the surface presents as Sierra: the avatar is the `SIERRA_MARK` inline
SVG (Mt Whitney ridge on a navy roundel — copy it from any first-party
client), name **Sierra**, tagline *"Your CPL Sherpa"*, CCC seal navy
`#0b3d61` / cobalt `#0047ab` accents. Confirm branding scope with the CPL
team before launch (white-labeling is a decision for them, not a default).

### 3.7 Suggested build plan (C)

| Week | Milestone |
|---|---|
| 1 | Origins sent to CPL team; CORS deploy done; spike: minimal client (3.3) streaming against staging origin; render plain text |
| 1–2 | Markdown rendering (reuse reference renderer) + error states + PII notice; multi-turn `history`; audience wiring |
| 2 | Feedback RPC; session-id convention; styling to your design system; a11y pass (WCAG 2.1 AA) |
| 2–3 | Joint testing: your scenarios + our smoke battery run; load estimate vs rate limit sanity check; launch checklist (§5) |

---

## 4. Path D — Server-side proxy (special cases)

Your backend relays requests to `cpl-chat` and re-streams the SSE response.
Works today with no CORS change (CORS doesn't apply server-to-server).

- **Do not buffer.** Your proxy must pass SSE through unbuffered
  (`X-Accel-Buffering: no` on nginx, `flushHeaders()` on Node, etc.), or the
  user stares at a blank bubble for the full generation time.
- **Rate-limit caveat:** all your users share your proxy's egress IP — one
  20-requests/minute bucket for your whole platform. For anything beyond
  light traffic, coordinate with the CPL team first (this is a reason to
  prefer Path C).
- You gain: your own throttling, logging, abuse filtering, and the option to
  inject `audience`/`session_id` conventions server-side.
- Everything in §3.4 still applies to your front end.

---

## 5. Launch checklist (all paths)

- ☐ CPL team has your origins (C), traffic estimate, and launch date.
- ☐ Preconditions from the [analysis doc §5](sierra_integration_analysis.md)
  agreed — for C at scale, that includes the cost breaker + durable rate
  limit on our side.
- ☐ PII notice visible near the input.
- ☐ Streaming verified end-to-end from *your* page on *your* infra (no
  buffering).
- ☐ 429 + network-failure + empty-answer states exercised deliberately.
- ☐ XSS spot-check: ask Sierra to "show `<script>alert(1)</script>` in a
  table" — must render as escaped text.
- ☐ Links open in new tabs with `rel="noopener noreferrer"`.
- ☐ Mobile + keyboard-only + screen-reader pass on your surface.
- ☐ Feedback path tested (if wired): a 👎 with a note appears in our
  Training queue.
- ☐ Incident contacts exchanged (ours: MAP@rccd.edu).

---

## 6. Ongoing operations — what to expect after launch

- **Sierra changes without vendor releases.** Data refreshes (weekly
  landing pages, offerings, exhibits), team-guidance rules, and function
  redeploys all take effect immediately on your surface. That's mostly a
  feature (fixes arrive instantly); the flip side is behavior can shift
  without you shipping anything. We'll notify you ahead of deploys expected
  to change behavior; tell us before launches that change your traffic
  profile.
- **Answer-quality issues:** route through the feedback bar (fastest — it
  lands in our triage queue with the full Q/A snapshot) or email
  MAP@rccd.edu with the question text and rough timestamp (we can find the
  turn in the logs via your session-id prefix).
- **Outages:** if every question fails fast with a 502, that's an upstream
  model issue on our side — email us; your client should already be showing
  its friendly error state.
- **The contract we'll keep:** new API fields will remain opt-in (omitting
  them keeps today's behavior — this is how the production widget has
  survived 13 function versions untouched). We will not rename or remove the
  existing body fields or SSE events without coordinating with you.

---

## Appendix — quick facts

| Item | Value |
|---|---|
| Endpoint | `POST https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat` |
| Auth | Public anon key in `apikey` + `Authorization: Bearer` (from CPL team) |
| Rate limit | 20 requests/min/IP |
| Query cap | 1,000 chars (silent truncation) |
| History | opt-in; last 6 turns used; 2,000 chars/turn |
| Audiences | `student` · `faculty` · `administrator` · `employer` · `civic` |
| Context variant | `ctx:"external"` (or `sierra/?ctx=external`) — suppresses college staff contacts from answers; use it on external embeds |
| SSE events | `sources` → `text`* → `done` (no error event; errors are pre-stream JSON) |
| Model (server-side) | `claude-sonnet-4-6`, max 2,048 output tokens, streaming |
| Standalone page | `https://cpl-initiative.github.io/cpl-project-tracker/sierra/` |
| Reference client | `sierra/sierra.js` (dependency-free, test-covered) |
| Contact | MAP@rccd.edu |
