---
title: Auth model and repository posture — lessons
date: 2026-08-19
tags: [lessons, auth, security, repo, ip, phrases, magic-link, itpi]
kb-status: internal
obsidian-folder: cpl-project-tracker
artifacts:
  - docs/public_private_repo_split_scope.md
  - docs/phrase_scope_analysis.md
  - fetch_custom_report.py
  - LICENSE
related:
  - "[[CLAUDE]]"
  - "[[docs/session_170_handoff]]"
---

# Auth model and repository posture — lessons

Workstream scratchpad for two questions Sam opened together on 2026-08-19: should
COBI move off shared team phrases onto magic-link sign-in, and should the
repositories go private. They turned out to be one question about **who can do
what**, asked at two layers.

---

## 2026-08-19 — Session 169 (SkyRegister)

### (a) What was learned

**Two premises in the question were wrong, and finding that out was most of the
value.**

`cpl-project-tracker` and `cpl-knowledge-base` are already owned by the
**CPL-Initiative organization**, not by Sam's personal account. Only `CPLBrain`
is personal — and it was already private. "Move them out of my personal account"
was two-thirds done before the session started. The real exposure was that the
org had **one owner**, two collaborators and **zero teams**, so the dashboard,
Pages, 29 workflows and 8 Action secrets had no second key-holder.

**Repository visibility does not do what it looks like it does.** COBI is served
by GitHub Pages straight out of the repo. On GitHub Free, Pages publishes *only*
from public repos — so flipping the switch would have taken the site dark with no
warning dialog. On Pro/Team/Enterprise the repo can be private, but **the
published site stays public**. Only Enterprise Cloud offers access-controlled
Pages. "Make the repo private" therefore hides source and internal docs, and
touches neither the dashboard nor the data it renders.

**The concern was never privacy.** Sam corrected the framing directly: the 67
published college-staff emails are public information and their availability in
data form is fine — only their *presentation in comms* warrants care. What he
wants to protect is the **approach**, against vendors who are already circling
because there is initiative funding. That is a better argument for going private
than the privacy one ever was, because private hides exactly the half worth
protecting: 555 methodology docs, 149 generators, Sierra's whole retrieval
design, and the commit history. It does not hide the running app — and a UI is
the cheapest thing to copy anyway.

**The legal half was already done.** `LICENSE` is All Rights Reserved with an
explicit no-copy clause: *"made viewable for transparency and collaboration
only."* Public visibility here has never meant permission. Worth knowing before
reaching for a bigger hammer.

**On the auth question, the choice was smaller than it looked.** Magic-link
sign-in already covers **more** of COBI than the phrases do — 132 policies call
`is_allowed_reviewer()` against 83 calling `team_pass_ok()`, and 31 modules read
a reviewer session against 22 that send a phrase. Nobody had to decide whether to
*build* magic links. The only live question was whether the phrase half survives.

**The scaling proof was already in our own KB.** The June note
`exclusive-surface-scopes-a-shared-credential` says a shared credential can only
scope to a surface exclusive to one group, and exactly **2 of 34** COBI tabs
qualify. So every phrase is structurally a superset — not a bug to fix once, but
what a shared password *is*. Sam had hit it twice already (Finance, GR) and filed
them as one problem for four days.

**Phrase strength was never the weakness.** Measured by shape, all four are 12–13
characters with mixed case, digits and symbols. Nobody is guessing them. The
weaknesses are that a shared secret carries **no identity on writes**, cannot be
**revoked per person**, and **spreads silently**.

### (b) Current state

- **Reviewer roster 5 → 10.** Ashley, Jessica, Malone, Kristen (rccd.edu) and
  Pedro Campos (ITPI CEO) added on Sam's explicit confirmation — the first
  external-domain reviewer. This closed a gap where people named in `CLAUDE.md`
  as team members were working through shared phrases because nobody had added
  them.
- **Second-owner gap closed on Supabase.** Sam made Pedro an owner on the CPL
  Initiative Supabase org and on MAPInitiativeTech. ⚠️ **Not yet verified on the
  GitHub org** — that is where Pages and the secrets live.
- **Repo split scoped and merged** (#1242) —
  [`docs/public_private_repo_split_scope.md`](public_private_repo_split_scope.md)
  is the authority.
- **Nothing else changed.** No RLS, no policy, no repo setting, no code.

### (c) Strategic roadmap

**Auth.** Magic link + **one `role` column** on `allowed_reviewers` — explicitly
not groups, which is the part Sam correctly identified as where it gets deep. One
role per person; the 132 reviewer policies are untouched; the transition accepts
either a session or a phrase so nothing goes dark; retire `ci` first (it protects
nothing), then `gr`, `fin`, `team`.

The roster doubling gave this teeth. Reviewer is **all-or-nothing**: beyond any
phrase it reaches `map_student_credit` (537,908 rows at student grain),
`kb_curation`, the `gr_*` register, and `team_access` itself — meaning a reviewer
can read and rotate every team phrase. A partner who needs `kb_curation` also
gets student-grain credit data. That is the concrete argument for the role
column, and it is now a live condition rather than a hypothetical.

**Repo.** Phase 1 (`sierra/`, `veteran-sprint-map/`) is zero-risk and unbundled.
Phase 2 is the Fact Sheet's data path. Phase 3 needs the Team plan. Details in
the scope doc.

### (d) Next concrete step

Sam's go on the role column — and separately, confirm a second **owner** on the
GitHub organization, which the Supabase change does not cover.

### Decisions Sam made this run

- *"I'm not worried at all about protecting the named college staff as that is
  public information… no problem with it being available in data form to the
  public."* Presentation in comms still warrants care. **Retires the privacy
  framing.**
- *"What I'm more concerned about is protecting the IP we are developing for the
  CO… I just don't want to sow confusion in the field by having other players
  emerge and offer alternatives."*
- *"Perhaps with the public/private we partition off truly public views like
  Sierra AI and the CPL Fact Sheet… while the others we want to protect from
  being branched or cloned go private."* — the split, and it was the right shape.
- Add all five to `allowed_reviewers`, Pedro included, after being shown what
  reviewer access opens.
- Pedro added as owner on the Supabase org and MAPInitiativeTech.

### Carried into next session

Three new MAP Custom Reports are ready to wire — exhibit credit recommendations,
the same **by Catalog Year**, and student details. Catalog Year is the genuinely
new dimension; the other two overlap tables we already hold, so **the first job
is a reconciliation, not a load**.

ITPI offered a daily push into Supabase. The recommendation is to **decline the
mechanism and accept the help**: `fetch_custom_report.py` already pulls eight
datasets from the MAP API on the cron, so three more is three entries in
`REQUEST_PAYLOAD`. Reasoning in
[`adr-pull-from-the-source-rather-than-accept-a-push`](kb-notes/adr-pull-from-the-source-rather-than-accept-a-push.md).

⚠️ Establish first: Sam pointed at `customreportingmodule.azurewebsites.net` (the
report *builder* UI) while our fetcher consumes `mapwebapinew.azurewebsites.net`
(the API). Whether the three are exposed on the existing endpoint decides whether
this is twenty lines or a real integration.
