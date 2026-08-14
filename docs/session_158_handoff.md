---
title: Session 158 handoff (Sky157 → next) — the credential doors are fixed; go test one in a browser
created: 2026-08-14
updated: 2026-08-14
tags: [handoff, auth, team-phrase, cip, noncredit, governance]
related:
  - "[[docs/team_phrase_lessons]]"
  - "[[docs/cip_crosswalk_lessons]]"
  - "[[docs/noncredit_cip_category_scope]]"
  - "[[docs/kb-notes/methodology-an-instruction-naming-another-surface-is-an-unenforced-dependency]]"
---

# You are Session 158

Session 157 was **Sky157** (#1200, #1201). **SkyCode** ran a second workstream the
same day on the CIP tab (#1191 · #1192→**#1194** · #1198 · #1199); both are folded
into §11 and the memory table by this checkpoint.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['auth','team-phrase','cip','noncredit','governance','ui-copy']
       or summary ilike '%phrase%' or summary ilike '%sign-in%')
order by event_date desc nulls last limit 40;
```

**Do not re-derive:** `reviewer-signin-lives-in-about`,
`an-instruction-naming-another-surface-is-unenforced`,
`phrase-affordance-coverage-2026-08-14`,
`a-copy-detector-must-read-the-rendered-string`,
`noncredit-32-0111-is-short-term-vocational-only`,
`the-existing-cip-outranks-the-top-for-noncredit-category`,
`cte-noncredit-is-funding-bearing`.

## ✅ What closed

1. **The reviewer sign-in exists again, in ℹ About.** `raci.js` had kept a
   complete `signIn()` **whose button was removed** — no caller anywhere — while
   `admin.js` told people to use it there. Admin is reviewer-only, so the phrase
   could never have opened it either. Admin now mounts the *same* control inline.
   RACI keeps its phrase box (Sam's call).
2. **Every phrase-gated tab now offers a way in.** One shared
   `CPL_TEAM_PHRASE.lockedBanner()` with a working input, plus
   `tests/team_phrase_affordance.test.js` as the guard. 13 stale "go to Team &
   RACI" strings across 5 files are gone.
3. **SkyCode: the noncredit CIP categories are scoped**, and the blanket
   `32.0111` rule is reverted. **The TOP is not load-bearing.**

## 🎯 PRIORITY 1 — one browser round trip (5 minutes, and nobody has done it)

Everything in #1200/#1201 is **jsdom-verified only**; the sandbox cannot reach the
site. Ask Sam, or watch him do it:

**ℹ About → enter address → "Email me a link" → follow it → you land back on the
tab you started from, signed in.** Then open **Admin** — it should render, not
bounce. And on any gated tab while locked, the banner's input should unlock the
page you are looking at without a reload.

If the link lands you on the wrong tab, the suspect is `cpl_sb_return_tab` — it is
stashed by `reviewer_signin.js` and consumed by `unified_courses.js`
`consumeAuthHash()`.

## 🎯 PRIORITY 2 — Sam's open header asks (he raised these mid-session, unbuilt)

1. **Make the COBI header accessible and mobile-friendly.** Not started.
2. **The superscript CPL in the logo.** ⭐ **Already diagnosed, do not re-derive:**
   the title uses `ᶜᴾᴸ` — `ᴾ` and `ᴸ` are *modifier letter capital* P and L, but
   `ᶜ` is **U+1D9C MODIFIER LETTER SMALL C**. **Unicode has no superscript capital
   C**, so it renders "cPL" and no font will fix it. **Sam's ruling: drop the
   superscript and show the org name in normal, unbolded font.**
   ⚠️ **Second constraint:** a pasted link unfurls from `<title>`/`og:title`, and
   Teams/Outlook **never run JS** — so `?org=ci` **cannot** change an unfurl. Per-org
   unfurl titles need per-org entry pages; GitHub Pages serves one static file.
3. **The Project Description in ℹ About is stale and Sam wants to edit it.**
   ⚠️ It lives between the `<!-- PROJ-INFO-START/END -->` markers, which
   `excel_to_dashboard.py` **regenerates from `proj_desc`** (Rule 1) — so this is a
   *generator/source* change, not an HTML edit. Find where `proj_desc` is read
   before designing an editor.

## 🎯 PRIORITY 3 — SkyCode's CIP work is blocked on people, not code

**Blocked on Jenni** (§6 of [`noncredit_cip_category_scope.md`](noncredit_cip_category_scope.md)):
the Basic Skills pairing — **that one alone unblocks build phases 1–3** ·
`32.0199` (60 programs) and `35.0101` (16) are in use but off her list · is the
2026-07-15 crosswalk cut the locked one · is the secondary CIP becoming a COCI
field · **can non-CDCP categories be CTE at all** (~1,300 programs).
**Blocked on Sam:** where a confirmed category persists. `localStorage` is wrong
for a funding-relevant determination — recommend a gated Supabase table with
who/when, as `cr_reference_decisions` does.

## ⚠️ Things that will mislead you

1. **`npm install` before trusting a green local sweep.** The sandbox ships no
   `node_modules` and the crash MASKS the real error.
2. **`node tests/run.js` cannot finish here** (and `cpl_funding*` times out at
   rc=124 on clean `main` too). Run the suites you touched; CI runs all 220.
3. **A guard over UI copy must read the RENDERED string** — strip comments, then
   join concatenated literals. Mine reported clean while five live instances sat
   in one file. See the KB note.
4. **Judge a detector by what it prints.** Mine flagged 5 tabs and **3 were
   false**; acting on the list would have shipped three wrong banners, one an
   input that could never succeed.
5. **`kb/phrase_gated_tables.json` is a tripwire, not an authority** — a snapshot
   that can only under-report. `admin.js` still reads gates live. Refresh SQL is
   in the file.
6. **5 tabs have an unmapped data surface** (`activities-projects`,
   `military-partnerships`, `exhibit-adoption`, `letters`, `knowledge-base`) and
   cannot be checked by the affordance guard at all. It prints them; it never
   counts them clean.

## 🧹 Carryover

- **`docs/INDEX.md` is 215 KB against a 40 KB budget** — the KB-notes table alone
  is 116 KB. Needs its own re-cut (probably a generated table). I trimmed the
  history and collapsed three accreting `## Added` sections this run; that
  orphaned three older notes from the index, which the lint caught — **re-run
  `kb/_docs_audit.py` after any INDEX surgery.**
- **`docs/roadmap_archive.md` is 394 KB** (2.6× over) and grew again this run.
- 4 other `oversized_doc`s: `CLAUDE.md` (122 KB), `cpl_funding_lessons.md`,
  `exhibit_canonicalization_lessons.md`. `kb_note_dialect` 58 · `vault_heavy_path` 44.
- 🔴 **Sierra named 1 of 9 D1.1 credentials** — still not diagnosed. Whether
  retrieval never returned them or the answer rendered only the strongest match
  decides the fix. **Measure before building.**
- The governance drift queue is **7**, all scheduled workflows nobody has listed
  as cadences. Each needs a row or a reasoned dismissal — **do not bulk-dismiss**.
- **DR-13…DR-18 still have `owner: null`.** DR-13 (the workplan itself) first.
- Older: 12 adoption-file statewide titles absent from `chatbox_credentials` ·
  corpus covers 59 of 123 colleges · the 7 `via:"search"` contacts · the
  site-phrase superset decision · the identity crosswalk write to Supabase.

## Patterns that worked

- **Measure before recommending.** Sam asked what I'd recommend for phrase inputs;
  counting first (43 tables / 26 read-gated / 8 bare tabs) changed the answer from
  "add boxes" to "one component plus a guard".
- **Read the detector's output against the files by hand.** Both of its errors
  survived writing and re-reading the regex and were obvious in seconds of
  printing the list.
- **Check whether the repo already answered it.** `team_phrase_header.js`'s
  docstring described the exact bug I was chasing, one credential along.
- **A test that fails only after the fix is not a test.** Verified 6/6 failing
  against the pre-fix source before trusting it.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical (`cmp -s`).
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` and the MAP hosts — Supabase via
  MCP only.
- `cpl_memory` CHECK constraints: `summary` ≤400, `detail` ≤4000, `kind` ∈
  fact/pitfall/opportunity/risk/wishlist/question/decision/milestone/procedure,
  `org` ∈ cpl/ci/cip/gr/shared. `cpl_memory_log` keys on **`memory_id`**, not
  `slug`, and `action` ∈ create/update/verify/stale/supersede/delete.
- A public-bot deploy is outward-facing. Say so before dispatching it.
- The stop hook's "unpushed commits" nag after a squash-merge is a false positive.

## Moniker

**SkyProse** is still unclaimed (offered seven times now). Coin your own if you
prefer; if Sam names one, his wins.

*Sky157 signing off. Next is Session 159 — `docs/session_159_handoff.md`.*
