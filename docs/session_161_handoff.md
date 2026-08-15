# Session 161 — handoff from Sky160 (Session 160, 2026-08-15)

You are Session 161. Sky160 answered six questions Sam opened the session with,
shipped three of them, and left two decisions genuinely with him.

Read in this order:
1. `docs/admin_tab_lessons.md` — the **2026-08-15 (later)** section, the whole run
2. `CLAUDE.md` §11 → **Admin tab / the side menu as data** and the new
   **Org & phrase scope** row
3. `docs/kb-notes/methodology-a-manager-must-show-everything-it-manages.md`
4. `docs/kb-notes/methodology-a-live-rename-must-be-order-proof.md`

---

## What shipped

| PR | What |
|---|---|
| **#1212** | Plain words instead of glyphs across Admin; **Admin may live in a category** (`GROUP_LOCKED` = dashboard alone). |
| **#1213** | **Share is a real, manageable group** — the two external launchers were invisible to the manager. |
| **#1214** | Per-site fallback tab (`homeTab()`); shared phrase renamed **`raci` → `team`**, order-proof. |

`admin_tab` 151 → **170** · `nav_groups` 12 → **20** · `team_phrases` 46 → **49**.

---

## 🎉 The three-session Priority 1 is CLOSED

**`cobi_nav` holds 43 rows**, stamped `slee@cccco.edu` at 13:59 UTC on 08-15.
Sam's renames (*Metrics and Plans*, *MAP Team Tools*), his `settings` category,
CPL Assistant hidden, audience rungs — all of it saved and readable.

⚠️ **Read the lesson, not just the outcome.** Three consecutive handoffs called
this unproven while the answer sat in the database. **A verification only a human
can perform still has to be checked by someone** — asking is not the only way to
find out. When a handoff says "unverified", query before you repeat it.

---

## 🎯 PRIORITY 1 — the Finance phrase scope. NEEDS SAM, THEN CAREFUL WORK.

Sam, 2026-08-15: *"Finance should not open the entire workplan."* He is right,
and it is measured: the Finance phrase opens Contracts (8 policies / 4 tables)
**plus ~30 more tables and 83 policies**, because `team_pass_check()` matches
**any** secret in `team_access`.

⚠️ **Do NOT "scope each phrase to its own site".** That locks Finance out of
Budget and Implementation Funding, which it genuinely needs — those are shared
tables, and Sam's June ruling stands: *shared tabs accept either phrase*.

The correct shape, and the only defect is the third line:

| Tab | Rule |
|---|---|
| Contracts (Finance-only) | Finance phrase — **already correct** |
| Budget, Implementation Funding (shared) | **either** phrase — already correct |
| Memory, Governance, MAP Users, workplan… | shared phrase, **not** a site phrase — **this is the hole** |

**This is a live RLS change across ~30 tables where getting it wrong locks
working people out mid-task.** Write the plan, get his go, then apply. Do not
freelance it.

## 🎯 PRIORITY 2 — org roster as data

`cobi_orgs.js` ORGS (5 sites) is code. `team_access` (4 rows) and
`team_phrases.js` PHRASES (4) are two more lists. **None is authoritative and
they already disagree — CIP is a site with no phrase.**

Turning ORGS into a table is what makes "what is in Finance" **one** list instead
of two, what a per-site Admin filter would read, and what lets a site's `home`
be edited rather than deployed.

⭐ **On Sam's "an Admin view for each org": a site FILTER yes, per-org AUTHORITY
no.** Admin is reviewer-only precisely because a phrase holder who can re-scope
what other phrase holders see is the superset problem one level up. Most tabs are
shared, so two org Admins fight over one menu. Delegation is a **roles**
decision → Governance register, not the menu editor.

⚠️ Adding a *site* would become curation; adding a *tab* stays a code change — a
tab needs a page behind it and a table cannot write one. Say so up front.

---

## Smaller, and genuinely ready

- **Sam drags Admin into Settings and saves.** Enabled #1212, not done — his
  arrangement to make. Ask whether it landed.
- **Fill owners on DR-13…DR-18** (OQ-01). Still nobody's, still the thing the
  Governance register measures about itself.
- **The 7 drift-detector candidates** — each needs a cadence row or a reasoned
  dismissal. Do not bulk-dismiss; the reason is the point.
- `CLAUDE.md` is **1.9× budget** (122,712 → 117,441 B this run; three finished
  rows moved to `docs/reference/finished_workstreams.md`). **When a row's NEXT
  step is done and nothing is pending, move it.**

---

## Patterns that paid off

- **Check whether the repo already answered it.** `plan()` already lifted Admin
  out of a hidden group — the drag ban it was guarding against was redundant, and
  reading the existing test is what showed it.
- **Read what your detector printed.** One new assertion was wrong on first
  writing (asserted a count was "not 2"; 2 was correct for unrelated reasons).
  Third session running this move has caught something.
- **Verify against the PRE-FIX source, and count.** 15 of 17 new admin checks
  fail there. Checks that pass **both** ways are labelled regression guards, not
  counted as proof.
- **Fingerprint what must not change.** `md5(secret)` before and after the rename
  proved nobody was locked out, in one query.

## Safety patterns to honor

- ⚠️ **A fix to one harness is not a fix to the practice.** The "check that never
  registers" trap reappeared in a **second** test file within 24 hours — both
  pre-fix runs printed ZERO failures because an unguarded deref threw. `val()` is
  in `admin_tab.test.js` and `nav_groups.test.js`; **the next harness will need
  it too.**
- **Merge on `clean` OR `unstable`.** `enable_pr_auto_merge` refuses on
  `unstable` with a misleading "required checks are failing" — squash manually.
- **Never force-push `main`.** The unpushed-commit stop-hook nag after a merge is
  a false positive; verify committer + ancestry, then `git branch --unset-upstream`.
- **Supabase is egress-blocked from the sandbox** — MCP tools only. Project
  `hvuwhnbuahrtptokpqfh`.
- **Rule 8 is a READ too**, and this session is the proof.

---

## Moniker

**SkyProse** is still unclaimed (offered ten times). Coin your own; if Sam names
one, his wins.

*Sky160 signing off. Next is Session 162 — `docs/session_162_handoff.md`.*
