# Session 159 — handoff from SkyKey (Session 158, 2026-08-14/15)

You are Session 159. Sam ran a long live-testing evening and reported six things;
four were real defects and **three of them turned out to be the same one**.

Read in this order:
1. `docs/session_credentials_lessons.md` — the whole run, including Sam's rulings
2. `CLAUDE.md` §11 → the **Reviewer session lifetime & scope** row (new) and the
   **Admin tab** row (rewritten — the save had never worked)
3. `docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached.md`
4. `docs/kb-notes/methodology-an-assertion-pinned-to-a-mutable-value-stops-being-a-guard.md`

---

## 🎯 PRIORITY 1 — one real-browser round trip (nobody has done it, and it proves the lot)

**Everything this session shipped is jsdom-verified only.** The sandbox cannot
reach the site. Ask Sam, or watch him:

1. Sign in by magic link from **ℹ About**. It will open a **new browser tab**.
2. Go back to the **original** tab. It should now be signed in too (#1207). This
   is the exact thing that failed for him last night.
3. On **Admin**, drag a menu item and press **Save** → *"✓ Saved."* not a 400.
   `cobi_nav` should go from 0 rows to a full arrangement.
4. Leave it an hour, come back, use a gated tab. No *"not signed in"*.
5. **Sign out.** Both tabs must go signed-out **and stay that way** — a naive
   mirror would sign you back in, and that is the one failure mode of #1207 that
   matters more than any other.

If step 5 misbehaves, the suspect is the per-tab mark (`cpl_sb_tab`) in
`cpl_session.js` `sync()`.

---

## 🎯 PRIORITY 2 — decide #1204, and Sam's open asks

- **#1204 is built, green and HELD.** It makes the Memory tab read a magic-link
  reviewer (its RLS already allows it; the page only ever sent the anon key) and
  labels which credential you hold. Sam said *"that's fine to leave"* once the
  team phrase opened it — so this is his call, not a bug to re-litigate. Take it
  or close it; do not silently leave it open forever.
- **Not built, offered and un-answered** (all small, all from his reports):
  1. **Merge hide + audience into one control.** They are one ladder — Everyone
     → phrase/magic-link → magic-link only → nobody. He expected the hide
     affordance to *ask* which; merging makes that the obvious behaviour.
  2. **Chip every menu item with its measured RLS gate.** The Admin tab already
     computes it but only chips the **weak** gates, so a properly protected tab
     shows nothing — the same "only the alarming case is labelled" asymmetry as
     the audience copy. This is what he wanted when he asked to "note which
     method they use to curate" — and measured beats hand-typed.
  3. **Curator-created menu categories.** Not possible today: `plan()` builds
     groups only from `nav_groups.js`, and a tab parented to an unknown group
     silently degrades to top level. Needs `plan()` to union in overlay-only
     groups + an "+ Add category" affordance.

---

## 🎯 PRIORITY 3 — CLAUDE.md is 2× its size limit

`kb/_docs_audit.py` flags `CLAUDE.md` at **118 KB against a 60 KB limit**
(`always_loaded` lane), plus `docs/INDEX.md` at **5.4×**. This session moved one
session narrative to `docs/roadmap_archive.md` and rewrote rather than appended,
but that is holding, not fixing. **A real pare-down — more §11 rows into
`docs/reference/` — is overdue and is context-tax on every future session.**

---

## Sam's decisions this run — do not re-derive these

- **"Keep things stupid simple but not always possible."** The frame for the
  auth advice.
- **On user-level auth:** he already *has* user identity (the magic link is real
  Supabase auth). What is missing is **roles**. Recommendation given and not yet
  acted on: keep the team phrase as the team's front door, add roles only where
  **attribution** is needed (who decided), and use **roles (flat, ~5), not
  groups** — he spotted himself that groups are where it gets deep.
- **The audience picker is a filter, not an annotation.** *"I wasn't trying to
  hide it… just noting that they need a team phrase to curate."*
- **Memory:** *"that's fine to leave."*
- He chose the cross-tab session fix over the other open options.

---

## Safety patterns to honor

- **Merge on `clean` OR `unstable`** — TruffleHog is the required check.
- **Never force-push `main`.** Feature branches force-with-lease freely.
- **A local `main` in this sandbox can be badly stale.** Mine was 28 commits
  behind and a sibling branch cut from it silently reverted files. `git fetch
  origin main` and branch from `origin/main`, and check `git diff --stat
  origin/main` shows *only* your files before opening a PR.
- **Supabase: the sandbox is egress-blocked from `*.supabase.co`.** Use the MCP
  tools. To test a write safely, clone the table's constraints into a **temp
  table** (`like public.x including all`) — no triggers, no RLS, nothing touched.
- **Print what a detector found; never trust its count.** Three detectors this
  run were wrong on first writing and all three were caught this way.

---

## Moniker

**SkyProse** is still unclaimed (offered eight times). Coin your own if you
prefer; if Sam names one, his wins.

*SkyKey signing off. Next is Session 160 — `docs/session_160_handoff.md`.*
