---
title: Quick-start Chat — Workstream Lessons
date: 2026-05-26
prs: [129, 130, 135]
tags: [quickstart, router, claude-api, haiku, ux, session-storage, custom-event, filter-state]
artifacts:
  - quickstart.js
  - credential_reference.js
  - unified_courses.js
  - canonical_subj4.js
related:
  - CLAUDE.md §11 (roadmap table — Quickstart-A/B/C rows)
  - docs/exhibit_canonicalization_lessons.md (Session 8 "Octaman" appended Quickstart-A/B as side-dish)
  - docs/session_8_handoff.md (Bruh Octa's hand-off — Quickstart-C was queued as Session 9's lead-off lane)
---

# Quick-start Chat — Workstream Lessons

A lessons doc for the Dashboard's Quick-start natural-language chat. The
chat is a single text input at the top of every tab — type a sentence,
Claude (Haiku 4.5) classifies the intent to one of the 8 tabs and (as
of Quickstart-C) optionally pre-applies filters on the destination tab.

The first two PRs (Quickstart-A/B) were captured in
[`docs/exhibit_canonicalization_lessons.md`](exhibit_canonicalization_lessons.md)
as a side dish under the Octaman section. This doc gives the workstream
its own home starting with the Quickstart-C tier-B landing.

## Why this exists (vision)

CPL's dashboard now has 8 top-level tabs and dozens of filters within
each curator tab. New visitors (and even regular curators returning to
the site) shouldn't have to learn the tab taxonomy + filter conventions
before they can do anything. The Quick-start chat is a typing-fast
entry: describe what you want to do, the AI lands you in the right tab
with the right filter already applied. Tier B (Quickstart-C) is the
"with the right filter already applied" half.

## Architecture (current — post Quickstart-C)

```
User input → Cloudflare Worker proxy (POST /) → Claude Haiku 4.5
                                                      ↓
                          {tab, message, filter_hint?} JSON
                                                      ↓
                                   quickstart.js validates parsed shape
                                                      ↓
              sessionStorage['cpl_qs_hint_<tab>'] = JSON.stringify(hint)
                                  +
              window.dispatchEvent('cpl-qs-hint', {detail: {tab, hint}})
                                  ↓
                          navigateTo(tab) — location.hash = '#<tab>'
                                  ↓
            ┌── Different tab? ──→ hashchange fires; existing tab-router
            │                       (CPL_Dashboard.html ~13290) toggles
            │                       .active on .cpl-tab-pane elements.
            │                       Destination tab's window listener
            │                       reads e.detail.hint, calls its
            │                       applyHint(hint), and renders.
            │
            └── Same tab?      ──→ no hashchange. Quickstart-B's pulse
                                    animation fires + window scrolls to
                                    top. The window event still fires, so
                                    the tab still applies the hint.
```

**Why both sessionStorage AND a window event?** The sessionStorage entry
is one-shot (consumed + cleared on read) and survives a refresh — so a
curator who deep-links to `#credential-reference` after a refresh still
gets their hint applied, even though the in-memory event would have been
missed. The event handles the typical "already-mounted, route across
tabs" case where sessionStorage would have a race (write happens just
before the event but tabs init at page load — they listen for the event
forever and don't re-read sessionStorage). Belt + suspenders.

**Why enumerate the vocab in the system prompt?** Haiku 4.5 is excellent
at copy-pasting exact strings when told what they are; it's prone to
"close-but-not-equal" strings when told to be creative. Each tab's filter
state uses precise enums ("0.60-0.79" not "low-medium"; "by title-keyword"
not "title-keywords"). Listing the strings verbatim in the prompt
collapses mismatch risk to ~zero. Cost is ~250 extra tokens per request;
worth it.

## What's wired now (per-tab)

| Tab | applyHint keys | Notes |
|---|---|---|
| `credential-reference` | `audit_tag` (11 enum values), `confidence_band` (5), `issuer` (free-form), `quality_flag_only` (bool), `search` (free-form) | renderToolbar() rebuilds each render → reading state.X reflects the hint |
| `unified-courses` | `kind`, `source`, `status`, `disc`, `credit`, `conf`, `artic`, `official`, `prov`, `triage`, `flagged_only`, `blanks_only`, `search` (13 keys) | Toolbar built ONCE at init for focus stability → applyHint syncs both state AND the DOM `<select>.value` / `<input>.checked` |
| `canonical-subj4` | `status` (5 enum), `top_2digit`, `search` | Toolbar built once, but renderToolbar() is cheap to re-call here → applyHint mutates state, then renderToolbar() rebuilds chrome |

The other 5 tabs (dashboard / workplan-goals / budget / vision-2030 /
pipeline) accept no `filter_hint` — they have no filter state worth
pre-popping. The system prompt explicitly tells the model NOT to emit a
hint for those tabs.

## Lessons (2026-05-26, Bruh Nona)

### 1. The "tabs init once at page load" reality

A natural first instinct is "the destination tab's init function reads
the hint." That works for the cold-load case (refresh on a deep link)
but FAILS for the common case: all 8 tab JS files run their init at page
load and never re-init. By the time the user types into the quickstart,
every tab is already alive — including the destination.

The fix is the runtime `cpl-qs-hint` window event. Each tab module
attaches a listener inside its init() that filters on `e.detail.tab ===
MY_TAB` and applies. This pattern is generally applicable to any
"X arrives after init" use case.

### 2. Two consumer paths is OK — they're idempotent

Both the window event and the sessionStorage consume() can apply the
same hint. Because `consume()` clears sessionStorage on read, double-
application doesn't happen in practice (whichever path runs first wipes
the storage). And applying the same hint twice in a row is a no-op
(state writes are deterministic). So the pattern is safe — no need to
add a dedup token.

### 3. Toolbar-built-once vs toolbar-built-each-render

`canonical_subj4.js` and `credential_reference.js` rebuild the toolbar
each render (or have a separate `renderToolbar()` they can call after
state mutates). `unified_courses.js` builds the toolbar ONCE at init —
the filter `<select>` elements are kept as closure-local variables
(`fKind`, `fSource`, …) and their `.value` is mutated by the onchange
handlers; render() never touches them.

The reason for the difference is focus stability — `unified_courses.js`
has a debounced search input where each keystroke triggers render(), and
rebuilding the search input would steal focus mid-typing. So for that
tab, `applyHint` syncs both `state.X` AND the DOM `<select>.value`
directly. For the other two tabs, just calling `renderToolbar()` after
the state mutation is enough.

If we ever extract a `tabs.js` module (queued for PR-Sidebar-A), the
toolbar-state-vs-DOM coupling is the kind of inconsistency it could
normalize.

### 4. Hint validation: silently drop, never block nav

Validation philosophy in `applyHint`: accept any object, walk known keys,
silently drop unknown keys and out-of-vocab values. NEVER throw, NEVER
prevent the navigation. If the LLM hallucinates `{tab:
'credential-reference', filter_hint: {audit_tag: 'sketchy'}}`, the user
still lands on Credential Reference — they just don't get a pre-applied
filter. They re-route or filter manually. This is better UX than a
"hint validation failed" error message.

The router-level validator (`askClaude` in `quickstart.js`) does the same
thing: if `filter_hint` isn't a plain object, it's set to null. Routing
continues.

### 5. Refresh-on-deep-link is rare but real

sessionStorage is the right store: it survives refresh (unlike a
JavaScript variable), but doesn't persist forever (unlike localStorage).
A curator who routes via quickstart to a tab + refreshes the page should
see the filter still applied — they just refreshed, they didn't say
"reset my filters." The one-shot semantics (consume() removes the entry)
mean a SECOND refresh clears the hint, which is the right tradeoff: the
filter is now "user-applied" effectively, and they can clear it
themselves.

### 6. The 350ms confirmation pause matters

`navigateTo` is wrapped in `setTimeout(…, 350)` so the user sees the
router's reply ("Opening Credential Reference with the unclassified-
in-MAP queue.") before the tab swaps and the message disappears with
the tab pane. This is Quickstart-A's pattern; Quickstart-C inherits it.
If you collapse the pause, the chat output flashes too fast and the
user doesn't realize WHY they got routed where they did.

## Strategic roadmap

Three follow-ons that would extend this workstream — all parked:

### Tier B+ — multi-turn refinement

Right now the chat is one-shot: type a sentence, get routed. A natural
extension is a conversation: "show me unclassified credentials → … now
narrow to ones with confidence under 0.60." The router would need to
carry forward conversation context + the current tab state. ~1-2 day
build; worth it ONLY after Tier B sees real curator usage.

### Tier C — action hints (not just navigation)

"Mark all unclassified credentials as initiated" → router emits
`{tab: 'credential-reference', filter_hint: {audit_tag: ...}, action:
'bulk_mark_initiated'}`. The tab's hint consumer recognizes the action
and triggers the bulk workflow (which already exists per Cred-Ref PR-2).
Significantly more risk surface — actions write data. Would need a
confirmation step inside the chat and probably a per-action allowlist.
Park unless explicitly requested.

### Tier D — proactive prompts on tab landing

Empty-state UX: "You're on Credential Reference. Looking for a specific
audit queue? Try 'review unclassified credentials' or 'low-confidence
issuers'." A tiny per-tab tip carousel inside the chat widget. ~1-2 hr
build; pure UX polish. Park until the curator base is bigger and we
have user-research signal on which examples actually help.

## Next concrete step

**Bruh Nona's done — Quickstart-C is on `main` via PR #135 merged
2026-05-26.** The workstream is in a clean parked state. Re-open with
Tier B+/C/D ONLY if curator usage signals demand for it; otherwise the
next session's lead-off lane is one of the queued items at the bottom
of CLAUDE.md §11 (PR-Sidebar-A, the `_apply_credential_review.py` sync
script, Excel→Supabase Phase 1 scoping, or CSC-G column-centering
sweep — all of which have higher priority than further chat polish at
this time).
