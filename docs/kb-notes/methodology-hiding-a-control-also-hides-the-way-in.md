---
title: Hiding a control also hides the way to get access
created: 2026-08-20
updated: 2026-08-20
tags: [methodology, access-control, ui, public-surface, sky-curate]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached]]"
artifacts:
  - fact-sheet/factsheet_edit.js
  - fact-sheet/index.html
  - tests/factsheet_edit_curate_visibility.test.js
---

# Hiding a control also hides the way to get access

> **One-sentence summary** — when you hide a privileged affordance from people who
> lack the credential, check whether that same affordance was the only way to
> *obtain* the credential; if it was, hiding it strands the very people it was
> hidden for.

## Context

Sam asked for the ✎ Curate button to be hidden from the public on the CPL Fact
Sheet while staying available to the MAP team. The obvious implementation —
render it only when `isReviewer()` — is wrong in a way that is easy to ship and
hard to notice, because the person who tests it is already signed in.

## The claim

### A gated affordance is often its own enrolment path

On the Fact Sheet the button did two jobs depending on who clicked it: for a
reviewer it toggled curate mode, and **for everyone else it started the magic-link
sign-in** (`if (!isReviewer()) { signIn(); return; }`). Gating it on
`isReviewer()` therefore removes the sign-in path from anyone who is not already
signed in — which is precisely the population that needs it. The failure is
invisible to whoever builds it, because a developer with a live session sees the
button appear and concludes it works.

**Before hiding a privileged control, ask what it does for an UNPRIVILEGED
visitor.** If the answer is "offers them a way in", the hide needs a second door.

### The second door should be a deliberate, revocable signal

Two paths, in priority order:

1. **The credential itself, made ambient.** Prefer this. On the Fact Sheet it
   meant loading the shared session keeper so a reviewer signed in anywhere on
   the origin is signed in here too — no new concept for the user to learn, and
   it repaired a pre-existing gap (the page had only ever seen a session minted
   in that same browser tab).
2. **An explicit reveal switch** for the case where the credential is absent —
   a new device, or an expired session. Strip it from the address bar as soon as
   it is read so a copied URL does not carry it, remember it per browser, and
   provide the inverse to forget it.

### Say plainly that this is presentation, not security

The reveal switch is discoverable by anyone who reads the client source, and on a
public page that is everyone. Write that in the module, next to the switch. The
real boundary was, and remains, the server-side one — here row-level security on
the write. A hidden control that later gets *treated* as a control is how a
cosmetic change quietly becomes load-bearing.

## How we got here

Shipped in `cpl-project-tracker` #1269 (2026-08-20). The recommendation was written
before any code: hiding on session alone was rejected in review specifically
because it would strand a curator on a new laptop or one past the session keeper's
12-hour cap. `tests/factsheet_edit_curate_visibility.test.js` pins both doors, that
the switch is stripped from the URL, and — separately — that the reveal flag is
never consulted by the auth helpers, so the presentation layer cannot drift into
the trust decision.

## Applies to

Any privileged affordance on a surface that unprivileged people also visit: an
edit button, an admin launcher, a "request access" link, a curator toggle. It is
most dangerous where the affordance is the *only* enrolment path, and it is
hardest to notice where the builder is already enrolled.

## See also

- `docs/fact_sheet_lessons.md` — the 2026-08-20 SkyCurate section.
- [[docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached]] — why a
  session can be absent even for someone who "is" a reviewer.
