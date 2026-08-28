---
title: Session 203 handoff — from SkyLens (Session 202)
created: 2026-08-28
updated: 2026-08-28
tags: [handoff, session-203, cpl-funding, noncredit, auth, ed-code-78093, obsidian, knowledge-base]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 203

SkyLens here. The noncredit lane shipped (#1369). Then Sam tried to rename three
priorities and could not, and chasing that produced everything below.

## ✅ SETTLED TODAY — the round trip is proven

**Sam clicked Publish and his three relabels reached Supabase.** The config md5
moved `9cf58b99efa3…` → `c95e78aada19…` at 18:44 UTC, and `yearPriorities` year 1
now holds `Access: Outreach` (src 0) / `Completion` (src 1) / `Access: Statewide`
(src 2), which with `priorityOrder [2,0,1]` displays exactly as he typed. His
factor 0.5, shares .34/.33/.33 and the noncredit strategies are all in there.

That closes the item three handoffs called unproven. **Do not re-derive it.**

Two things it exposed, both since fixed in #1372:
- The row stamped **`(team)`**, not his email — `applyWriteAuth()` preferred the
  phrase when both credentials were present.
- **"It didn't appear to respond at first but then the button disappeared."** The
  publish re-renders, so the only feedback was the button vanishing.

## ⛔ START HERE — #1372 is open, verified locally, and CI HAS NOT RUN

**PR #1372** — curating funding requires a magic-link reviewer, not the team
phrase. Sam's ask, built, and **NOT merged.**

⛔ **NO WORKFLOW HAS RUN REPO-WIDE SINCE 18:28 UTC.** Not the PR-open event, not
three separate pushes (`93f9a99`, `88dbabe`, `c44b108`). The newest `js-tests`
run anywhere in the repo is `29fb6c0` on main at 18:28. The 12 runs GitHub lists
against #1372 are **stale pre-merge heads**, attributed by branch name because
the branch was deleted on #1371's merge and recreated.

**Do NOT merge this on an absence of checks.** Verify first:
1. `get_check_runs` on the CURRENT head.
2. If still zero, `actions_list` **repo-wide** (not branch-filtered) — if nothing
   has run anywhere, it is not this PR.
3. Neither workflow has `workflow_dispatch`, so there is nothing to dispatch.
   Closing/reopening the PR and empty commits to kick CI are **forbidden**.
4. Unknowns Sam may need to settle: whether Actions is **disabled or out of
   quota** on the repo, or whether this was a **GitHub incident**. Both look
   identical from the API.

**Local verification stands in for CI, and it earned its keep** — see below.

⚠️ **AN HOURLY CHECK-IN IS ARMED (`trig_012ZkroZei3LSSHGqnC5bT5H`) BUT MAY BE
UNABLE TO ACT.** It was created with a warning that the sessions it fires store
no MCP connectors, and `mcp__github__*` is the ONLY way to reach GitHub from this
sandbox (`curl`/`GH_TOKEN` against api.github.com returns "GitHub access is not
enabled"). **Do not assume #1372 landed itself — check.** If the routine has been
waking without effect, delete it and drive the PR from your own session.

⚠️ **`cfp_insert_self` must stay public.** It is the college self-attestation door
(a VPAA/VPSS/CEO attests participation, field-validated), not a phrase gate. A
blunt "narrow the auth" kills it and nobody notices until a college tries.

### ⚠️ The local suite caught a regression CI never would have

Narrowing `unlocked()` broke **three** blocks that simulated a reviewer with a
TEAM PHRASE. All re-pointed at the reviewer session, none deleted — every one
guards behavior that is still real:

| Block | Was | Now |
|---|---|---|
| `cpl_funding_optin` B/F | phrase = "the private, UNLOCKED reviewer view" (its own comment) | reviewer session — 34/34 |
| `cpl_funding_render` C7 | phrase unlocks; Lock returns to scenario | session; losing the SESSION returns to scenario, banner must NAME the curator |
| `cpl_funding_render` C7b | promotion via the phrase's `unlockRow` | promotion via **Publish** — the only path left; a regression there is the #1371 bug |

⭐ **COUNT CRASHED SUITES, NOT JUST `FAIL` LINES.** `cpl_funding_render` did not
fail — it **threw**, and a crash prints no `FAIL` line. `grep -c '^FAIL'` said 7
and would have read as "only optin is broken". Grep `✗ FAILED` too.

## What happened, in order — the diagnosis took three attempts

1. **Wrong.** I concluded he had not been signed in. He sent a screenshot: the
   masthead read **"● Signed in."**
2. **Right, but half.** `unlocked()` tested only `tp().session()` — the team
   **phrase** — while all three funding tables carry
   `is_allowed_reviewer() OR team_pass_ok()`. **The database would have accepted
   his write; the client never attempted it.** Seven write paths had it; fixed as
   one `applyWriteAuth()` (#1370, merged `995be5a`).
3. **The actual cause.** That fix let a reviewer *write* and did nothing about
   work done *before* signing in. Edits made while locked live in the `SCENARIO`
   overlay, which **wins the render** — so his labels painted back, looked
   published, and re-typing them fired no `change` event because the value never
   differed. ⭐ **The promotion step already existed and exactly one path reached
   it:** the team-phrase unlock row. A magic-link reviewer never passes through
   it. Fixed in #1371.

## PRs

**#1371 — MERGED** (`29fb6c0`), Pages deploy for it succeeded. That is what let
Sam publish.
**#1372 — OPEN, head `c44b108`**, the auth narrowing + the handoff + the three
fixture re-points. See START HERE. **Not merged; CI never ran.**

## Sam's rulings across this session

| Ruling | |
|---|---|
| One lane switch above the cards, all three, every year | *"otherwise I'll be a confuseled Pooh"* |
| Same FTES rate in both lanes | no noncredit rate |
| `Annual funding` / `Combined funding` | replacing Disbursement / Even tranches / Front-load |
| Remove most explanatory language from the cards | **keep the derivations** |
| No feed keys in reader-facing text | *"what does this mean? Metric · pinned to ppa_u"* |
| Noncredit needs its own strategies | *"NC programs do not generally award credit"* |
| Career attainment sits with the **project pool**, reported qualitatively | **no invented metric** |
| Wire the **ABCD §78093.2 outcomes** in and make them visible | **superscript links from whatever serves each** |
| *"Unearned reallocated after 2028"* | **he withdrew it himself as invented** |
| *"I want the tab to save it"* | don't hand-apply his data |

## Your build: the ABCD spine (his ask, designed, not built)

Ed. Code **§78093.2(d)(1)**, verbatim — the statutory basis for the allocation:

- **(A)** Increasing access to CPL opportunities equitably for all eligible students
- **(B)** Increasing completion through CPL awards
- **(C)** Advancing career attainment through CPL
- **(D)** Supporting CPL through the chancellor's office's pilot projects, *such as
  the California Mapping Articulated Pathways Initiative*

**(d)(2) makes demonstrating these a precondition of a campus allocation.**

1. **Goal-tagged project line items.** `scaling_projects_tech` is one ~$8.96M box.
   Split into named projects (WestEd, Credential Engine, apprenticeship partners,
   CA Credential Registry, MAP), each tagged to the goal it serves. The pool card
   system already supports custom labelled boxes — **math unchanged if the sum is
   preserved.** Most of the (d)(2) reporting artifact, nearly free.
2. **A four-goal spine**: goal → what funds it → how it is evidenced → *"no
   measure yet"* where true, with superscript **ᴬᴮᶜᴰ** markers linking back.

⭐ **The project pool answers (C) AND (D)** — (D) is the pool in the statute's own
words, and the best-evidenced of the four.
⚠️ **Do NOT invent a career-attainment metric.** The model distinguishes a `gap`
(nobody can measure this) from `undelivered` (declared, feed missing).
⚠️ **The CPL story corpus evidences the wrong goal**: of 36 in
`fact-sheet/cpl_stories.js`, **5** destinations name a job, ~4 are genuine
progression, 8 quotes mention employment at all. It documents *educational*
attainment — goal (B). **Fixable at intake** (ask what changed at work), never in
analysis.

## 🧵 A SEPARATE LANE — Obsidian discovery (Sam: open its own session)

Sam, 2026-08-28: *"Just write step 1 into the handoff so I can open a new session
for it and keep it separate from funding."* So:

⚠️ **Own `claude/*` branch, own PR. Do not touch `cpl_funding.js`.** Sibling
branches are authorized (CLAUDE.md branch policy); this is deliberately not
stacked on the funding work.

**His framing:** *"using what we have in obsidian to support or discover new
connections in the handoff files to enable richer and better searches and access
to important context… exploring what I don't know is important in CPL as we are
building procedures almost out of whole cloth."*

### What was already measured — do NOT re-derive this

| | |
|---|---|
| Markdown files (tracker) | **909** — plus **209** in CPLBrain |
| Wikilink occurrences | **1,817**, **97% resolve** |
| Genuinely broken | **~16**, all written `[[docs/foo.md]]` where Obsidian wants `[[docs/foo]]` |
| kb-notes with full frontmatter | **342 / 342** |
| Curated `related:` edges | **936** (mean 2.74/note) — nothing surfaces these |
| Handoffs | **179**, all with frontmatter; 157 tagged; 95 with outgoing wikilinks |

⭐ **THE SUBSTRATE IS ALREADY THERE. The bottleneck is the tag vocabulary:**

| Lane | Distinct tags | Used **exactly once** |
|---|---|---|
| kb-notes | 640 | **56%** |
| handoffs | 402 | **65%** |
| lessons | 321 | **78%** |

A tag used once cannot cluster anything — it is a label, not a facet. That is why
a graph this dense does not reward browsing.

⭐ **This is the freehand-string problem again**, the same disease as the credential
titles behind the Common CR Reference and the ACE scope. Expect the same shape:
automation reaches ~10%, the rest is curator judgment, and you **rank by collapse
value, never by breadth**.

⚠️ **An earlier measurement of mine said 87% of wikilinks were broken. It was
wrong** — I globbed only `docs/` and matched basenames, so `[[CLAUDE]]` and every
path-qualified link counted as broken. Obsidian resolves by path suffix too. If
you re-measure, resolve against the WHOLE repo and accept suffix matches.

### ⭐ CPLBrain IS THE VAULT ROOT — Sam flagged this, and it changes the shape

*"I forgot about CPLBrain in the mix, so consider that for the handoff."*

`cpl-project-tracker` is cloned **inside** `COG-second-brain/`, so **Obsidian
indexes BOTH repos as one vault.** Any discovery work spans two corpora, not one.

| | CPLBrain | tracker |
|---|---|---|
| markdown files | **209** | 909 |
| wikilinks | **381** | 1,817 |
| with frontmatter | 176 / 209 | 342/342 kb-notes · 179/179 handoffs |

⚠️ **THERE ARE TWO SESSION-MEMORY LANES AND THEY DO NOT LINK TO EACH OTHER.**
CPLBrain's `07-session-notes/` (**30** notes, mandatory per its own `CLAUDE.md`)
runs in parallel with the tracker's **179** handoffs. 35 CPLBrain files mention
the tracker and 37 tracker files mention CPLBrain, but as **paths in prose**, not
as wikilinks — so the graph has two components where a reader expects one. That
is probably the single richest seam for "connections I did not know about", and
it is invisible today.

⚠️ **The vault clone is SPARSE, so vault-side resolution ≠ working-clone
resolution.** `sparse-vault-clone.ps1` keeps `/*.md`, `/docs/` and `/kb/README.md`
= **683 of 909** tracker files. Measured: exactly **one** target
(`[[kb/merge_doctrine]]`, 9 occurrences) resolves in the working clone but breaks
in the vault. So the sparse scoping is sound — **but any future link into `kb/`,
`funding/` or `prototype/` will be invisible in Obsidian while looking fine
locally.** Re-measure against the sparse pattern set, not against the repo.

⚠️ **Where the `.base` lives is a real decision, not a detail.** One scoped to
`docs/kb-notes/` belongs in the tracker (it version-controls with the corpus it
queries and reaches the vault via `sync-vault-clones.ps1`). One spanning BOTH
corpora has to live in **CPLBrain**, because the tracker repo cannot see outside
itself. Decide which question you are answering first.

⚠️ CPLBrain's live Obsidian config is `CPLBrain/.obsidian/app.json`, and its
`userIgnoreFilters` is **generated** by `kb/_docs_audit.py`, not hand-written.
Do not hand-edit it.

### Step 1 — the whole assignment, ~1 hour, reversible

1. **Fix the ~16 malformed wikilinks** (`[[docs/foo.md]]` → `[[docs/foo]]`).
   Ignore `[[:space:]]`, `[[\s\S]]`, `[[ITEM-ID]]`, `[[OPP-4]]` — regex classes
   inside code fences and template placeholders, not links.
2. **Write ONE `.base` file** over `docs/kb-notes/`, faceted on the tags that
   actually recur (not the singleton tail). The `obsidian-bases` skill is already
   in the vault at `CPLBrain/.claude/skills/obsidian-bases/SKILL.md`.
3. **Report whether it returns anything useful.** That is the deliverable — a
   yes/no on whether Bases earns a place *before* anyone commits to a vocabulary
   cleanup. Do not start the cleanup in this session.

### Rules for that lane

- ⛔ **Do NOT wire handoffs into Sierra.** Her corpus is audience-facing; handoffs
  are internal post-mortems full of defect narrative. That is how she ends up
  quoting session lore to a college. The guidance audit already found a rule
  referencing a fact the request does not carry.
- ⛔ **Do NOT build a fourth store.** Vault, tracker docs, public KB and
  `cpl_memory` is already four; a fifth is
  [[methodology-a-second-copy-of-a-fact-is-a-stale-copy-waiting]].
- **Checkpoint never writes to the public KB** — promotion is human-gated through
  `CURATION.md`. Obsidian discovery is an INPUT to that decision, never a path.
- The graph view mostly visualizes links someone already wrote. **Bases is the
  instrument**, not the graph.
- Single-threaded. This is a vocabulary judgment; a fan-out would regress to the
  most obvious tags, which is exactly the failure.

## Patterns this session earned

- ⚠️ **Fixing who may write does not rescue what was already written.** Any
  transition granting write access must decide the fate of work done before it —
  promote, offer to promote, or discard loudly. Silence strands it.
- ⚠️ **A client gate stricter than its RLS policy fails silently, toward lost
  work.** Read the client predicate and the `with check (…)` clause side by side.
- ⚠️ **When the workaround is "use the keyboard", suspect an event-model
  mismatch, not focus.** A document click handler closed the sign-in pane; tab
  worked because a tab is not a click.
- ⚠️ **Three things I cut as "gloss" were data** and three suites caught all
  three. **Of assertions you are ready to call stale, most are protecting
  something.**
- ⚠️ **A bound is tested by VALUE, not the clamp count** — Santa Ana receives
  exactly $100,000 without being *held* there.
- ⚠️ **A python patch script that writes only at the end loses every edit when a
  later assertion raises.** One did; the `unlocked()` fix silently never landed
  and the file still parsed.
- ⚠️ **Assert structure, not prose.** New copy ("sign in again to save for
  everyone") collided with an existing `/save for everyone/` assertion. Key on a
  class the branch alone emits.
- ⚠️ **A second run of the same check is not verification, it is delay.** Sam:
  *"grinding?"* — I was waiting on a local suite CI was already running.

## Safety patterns to honor

- **Never read the config — call `_effective()` / `_alloc()` / `_nc()` / `_prios()`.**
- Live config writes: fresh read, **guard the UPDATE on the before-md5**, commit a
  receipt (`kb/funding_strategies_out/2026-08-28/`).
- Never force-push `main`. Merge on `clean` OR `unstable`.
- ⚠️ A `check_suite`/`check_run` wake names a **routinely superseded** `head_sha` —
  wrong five times today. Always re-read `get_check_runs` on the current head.

## Carryover

- The threshold/floor coupling, unruled since SkyLane: 400 FTES is the last
  feasible step at the $50k floor.
- The optional Combined award row (Mt. SAC $400,000 + $100,000 = $500,000).
- NC share/factor editors — `ncPrioOverride()` accepts both; only strategies have
  one.
- `npm run test:floor` has never recorded a floor for
  `tests/cpl_funding_lane_switch.test.js`.
- Lint debt, pre-existing: `american_spelling` 173 · `oversized_doc` 5 ·
  `CLAUDE.md` at ~2.4× its always-loaded budget.

## Moniker

I took **SkyLens**. The lane switch is a lens on one card set — and the session's
real finding was a "Signed in" indicator focused on the wrong credential. Yours
is open.

**Next is Session 204 — `docs/session_204_handoff.md`.**
