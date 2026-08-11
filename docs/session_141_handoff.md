---
title: Session 141 handoff (SkyBridge → next) — My College works; next it needs to hand off to MAP
created: 2026-08-11
updated: 2026-08-11
tags: [handoff, my-college, sierra, funding, contacts, map-links]
related:
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-reuse-the-model-not-its-formula]]"
  - "[[docs/kb-notes/methodology-a-safe-fallback-is-caller-specific]]"
---

# You are Session 141

Session 140 ran as **SkyBridge**. Sam drove the design live for most of it —
**eleven steers**, each sharpening the last. Read his rulings below as
decisions, not suggestions.

⚠️ **There is no `session_140_handoff.md`.** Session 139 shipped #1115/#1116
without checkpointing, so the numbering skips. Nothing is lost.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['my-college','funding','cpl-lifecycle','portal','mis']
       or summary ilike '%transcrib%' or summary ilike '%college%')
order by event_date desc nulls last limit 40;
```

Six rows were written today, **all `verified` and attributed to Sam.** They
carry decisions you must not re-litigate.

## 🎯 PRIORITY 1 — MAP deep links (Sam's own next step)

His words, end of session: *"we'll work on embedding MAP links for those who
have auth to sign in to **adopt exhibits, work on student records, update
contacts**."*

The page now tells a college what to do; it cannot yet take them to where they
do it. Three links, and each has a section already waiting for it:

| Action | Section it belongs on |
|---|---|
| **Adopt an exhibit** | "By type of credit" → the top-candidate list |
| **Work student records** | the waiting-credit list (once ported — see P2) |
| **Update contacts** | **"Who MAP has on file"** — shipped today, #1119 |

MAP is auth-gated; the link just lands them at the sign-in and through. Nothing
here needs data we don't have — it needs the right URL shapes from MAP.

## 🎯 PRIORITY 2 — finish porting the mock

Mock: <https://claude.ai/code/artifact/aa252c19-bdd3-485b-980c-1fed3a3edc7f>
(every figure in it is real). Three sections are designed, Sam has reacted to
them, and they are **not yet in COBI**:

1. **Funding-pool breakdown** — real tab names (**2025–2026 $50K Seed Funding**,
   **2026–2028 College Implementation Funding** — never "$35M", that is Sam's
   shorthand with you), the per-goal split with each college's target, and a
   plain-language *How you are doing* + *Do this next* per pool.
2. **The waiting-credit list** — what the "already set up and waiting" units
   actually consist of, grouped by credit recommendation.
3. **Resources section** — Sam wants it *"very similar to the CPL Fact sheet"*.
   The 12 entries are in `fact-sheet/index.html` §resources. ⚠️ Its first entry
   is titled "MAP Initiative Website", which the naming convention retired —
   fix, don't copy forward.

## ✅ What shipped — #1118, #1119

**Sierra AI is embedded at the top of My College.** `cpl_chat.js` gained
`mountInto(host)` + `prefill(q)`; the briefing mounts **that** instance. One
assistant, two mounts — audience rules, feedback path and history stay in one
file. Pickers sit inside the box. **Suggested questions are computed from each
college's own figures** (its waiting figure, its best adoption candidate by peer
count). Named **Sierra AI** so it is not read as Sierra College. Tag line:
*"Answers come from the CPL Initiative records and knowledge base."*

**"Who MAP has on file"** — 8 roles, blanks named, landing page, and every value
de-duplicated (Moreno Valley's primary contact is one address **11 times**).

**The transcribed correction** (#1118) — see below.

Tests **87 → 104**.

## Sam's rulings — do not re-litigate

1. **"Transcribed" in MAP is a MARK, not a posting.** The college checks the
   step, then **forwards the plan to Admissions & Records, who enter it in the
   SIS by hand. There is no SIS integration with MAP** (hard to close: SIS
   setups and CPL coding differ markedly). Never write "on transcripts".
2. **Why it matters:** MAP is the only real-time view of the lifecycle. MIS lags
   a semester to a year and is under-reported and mis-coded — hence the
   long-term MAP↔MIS reconciliation goal.
3. **Priority 3 routing is standard practice, not gaming.** Colleges may bring
   students they already work with through the public pages. Say so plainly,
   **not** as a shortcut. Do not try to close it.
4. **Use the funding tab names, never "$35M".**
5. **Show contacts on a college's own view.** `ctx=external` is for vendor
   embeds only.
6. **"Sierra AI"**, not "Sierra".
7. **Never rank colleges publicly.** Name a *count* of peer colleges, never a
   college.

## ⚠️ Five things that will mislead you

**1. Never re-derive an allocation.** Call `CPL_FUNDING_TAB._alloc(shortName)`.
It is an iterative **floor waterfall**: 50 of 115 colleges pinned at $150K, and
the floor's **$1,999,687** comes out of the same pool — so a flat share is wrong
for the floored colleges *and* for those the floor never touches (Bakersfield is
not floored and is still off by $11,340). Cross-check Mt. SAC = **$522,239**.

**2. Load the funding model through `ensureLoaded()`/`boot()`**, never by
pulling `cpl_funding_data.js` alone — the Budget ledger overrides the baked
pool figures and lands async (`onModelChange`). And the live priority shares are
**50/30/20**, not the baked 30/42/28.

**3. Join college names through `cplCollegeShort()`** — funding keys on short
names, MAP on full. 115 of 116, 0 collisions, 0 orphans; the residue is
Calbright, a noncredit feeder.

**4. A percentile bar would hand a top-5% badge to a 21-student college.**
Compton 96th on 21 students vs Chaffey 97th on 1,495; 26 colleges under 30
students; median 4.5%, p25 0.3%, **16 tied at exactly zero**. Recognition at the
top is real; a band below it is noise. **The tier system already exists** —
Leading 14 / Advancing 89 / Inactive 12, ≥3 of 5 criteria from the CCCCO
Dashboard API. **77% sit in one bucket**, three criteria are size and two are
transcribed. Fix = show *"Advancing — 2 of 5"* with the missing three named.

**5. A MAP↔MIS side-by-side will mostly show MIS ABOVE MAP** — 87 of 111
colleges have marked zero transcribed. That is the *stronger* anti-"double work"
argument, but the gap runs both ways and each direction needs the opposite fix.
Align the reporting period or you manufacture a gap that is only timing.

## The two assistants are already the same

Checked function by function: same endpoint, same payload, same 5 audiences,
same 8-turn history, identical `renderMarkdown`/`parseSse`/`mdCells`. Of 28
shared functions **17 are byte-identical** and the rest differ only in CSS class
names. `feedbackPayload` differs only in `p_page` (`sierra` vs `cobi-tab`) —
**correct provenance, keep it.** The one real gap is the **starter questions**
(5 vs 4). `ctx=external` is a deliberate suppression, not a feature gap.
**The duplication itself is the risk** — a fix to one file never reaches the
other. `mountInto` is the pattern to extend.

## Access shape (designed, not built)

Per-college URL **`?college=<slug>` with NO picker** — `applyCollegeDeepLink()`
already exists. Signed-in team members keep the picker. Removing the picker is
the whole point: a dropdown of 116 colleges invites comparison; a page about
your college does not. Add **`noindex`**. Skip tokens — theater over public
data, and they break the "easy button". ⚠️ **The district composite I proposed
is a mini league table** — team-gated or scoped to the viewer's own district.

## Safety patterns to honour

- Aggregates only; **`StudentMAPID` must never reach Supabase.**
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; **never force-push `main`**.
- Deploy `cpl-chat` only via `cpl-chat-deploy.yml`.
- ⚠️ The stop hook fires *"N unpushed commits"* after every squash-merge. It is
  a **false positive** — the harness replaces the repo hook with its own copy.
  Verify committer = `noreply@github.com`, `origin/main..HEAD` = 0, HEAD is an
  ancestor of main. **Do not push.**
- ⚠️ Clone is **shallow (`--depth 50`)** — `git fetch` can report a "forced
  update" on main. Confirm with `git branch -a --contains <sha>`.
- ⚠️ `tests/cpl_funding.test.js` alone takes **>4 minutes**; the full suite ~20.
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.

## Carryover

| # | Item | State |
|---|---|---|
| 1 | **MAP deep links** — adopt exhibits · student records · update contacts | Sam's stated next step |
| 2 | Port funding breakdown · waiting list · resources from the mock | designed, reacted to |
| 3 | Tier block: *"Advancing — 2 of 5"* with missing criteria named | recommended, not built |
| 4 | Access shape: `?college=` + no picker + `noindex` | designed |
| 5 | `pp` flag cannot separate new community reach from routed students | **capture before the field comms go out** |
| 6 | EACR `statewide_prescriptive.js` → Supabase | Sam's catch, 4 sessions |
| 7 | Student-request feed | blocked on MAP |
| 8 | 25 untriaged Sierra feedback rows | measured today |
| 9 | `docs/INDEX.md` 4.6× budget, `roadmap_archive.md` 2.4× | lint, untouched |

## Moniker

**SkyBridge** built the bridge from the page to the data. Yours carries it to
MAP itself — suggest **SkyLink**.
