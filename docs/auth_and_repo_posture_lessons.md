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


## 2026-09-11 — SkyPulse (S256): a scanner's notice about a host we only link to

**What happened.** KYND (for the California Schools JPA) flagged `map.rccd.edu`
for wp2shell — CVE-2026-63030 + CVE-2026-60137 in WordPress core, fixed
2026-07-17 in 6.9.5 / 7.0.2, exploited in the wild since 2026-07-20 — and Sam
asked whether the links we give out for the Fact Sheet or Sierra could be
involved. They cannot: the host is a SiteGround WordPress site outside our
stack, and a server-side flaw is indifferent to who links to it. The whole
finding, the four touchpoints and the recommendation are in
[`playbook-answering-a-vulnerability-notice-about-a-host-we-link-to`](kb-notes/playbook-answering-a-vulnerability-notice-about-a-host-we-link-to.md);
the memo Sam forwards is in the vault
(`04-projects/cpl-initiative/20260911_Memo_map_rccd_edu_WordPress_wp2shell_Notice.docx`).

**Lessons.**

- ⭐ **The repo already knew what the host was.** Two workflow comments said
  "SiteGround-bot-protected" and the platform strategy doc said "map.rccd.edu
  (WordPress)" — but no one place said it, so Rule 8's query found nothing and
  the answer was re-derived from four files. The KB note and the `cpl_memory`
  row exist so the next notice costs one query.
- **Grep for fetches, not for the hostname.** 167 files mention map.rccd.edu;
  exactly one code path pulls content from it (`cpl-stories.yml` →
  `fact-sheet/cpl_stories.js`, committed to `main` weekly, renderer escapes).
  That is the whole ingest surface, and it was found in one grep for
  `urlopen|fetch\(|goto\(`.
- **A scanner names one FQDN; the host may have siblings.** `staging2.map.rccd.edu`
  is a second public WordPress install (all 36 story images hot-link to it) and
  KYND did not list it. Always look for the staging copy.
- ⚠️ **LibreOffice in the remote container cannot load ANY file** — `soffice
  24.2` answers "source file could not be loaded" for a plain `.txt`, by absolute
  path, `file://` URL or a private `-env:UserInstallation` profile. The docx
  skill's render-to-PDF step never runs here. What works: the skill's
  `validate.py` after `pip install defusedxml lxml`, then `mammoth` → HTML → a
  headless-Chromium screenshot (`/opt/pw-browsers/chromium-*/chrome-linux/chrome
  --headless=new --screenshot`). Three soffice variants were tried after the
  `.txt` had already failed — a tool that fails on a trivial input is the
  environment, and the next move is a different instrument, not a fourth flag.
  Sam noticed the delay (*"grinding?"*).
- **The sandbox cannot reach `map.rccd.edu` either** (egress proxy 403, same as
  `*.supabase.co` and `api.github.com`), so the live WordPress version was never
  read. The memo says so in its second paragraph; a memo that implied a check
  it did not make would be the wrong kind of reassurance.

---

## 2026-09-19 (SkyWarden, S278) — the settings never loaded, and the diagnosis was wrong twice

Sam, after #1623 shipped the `execute_sql` guard: *"Still getting the Allow SQL
run requests--wish we could set these to auto. Do I need to change Rule 8 to do
this?"* His session was new and all three repos were attached, so the usual
"hooks bind at session start, yours predates the fix" did not apply.

### ⛔ The three-repo rule is what stops repo hooks loading

Claude Code reads `.claude/settings.json` from the session's **project root**.
CLAUDE.md requires all three repos attached; that requirement puts the root
*above* the clones. Measured on a fresh session — `~/.claude/projects/` held one
entry, `-home-user`, while the settings file sat at
`/home/user/cpl-project-tracker/.claude/settings.json`. The docs say the same
thing outright: a multi-repo session loads *"only the plugins and marketplaces
the file declares, not permission rules, hooks, `env`, or other keys"*, and
`~/.claude/settings.json` is *"not read"* in cloud sessions at all.

⚠️ **A dead hook fails silently in BOTH directions** — no prompt relief and no
Rule 10 enforcement — while the file sits in the repo looking correct. That is
why this shipped a detector (`scripts/check_hooks_live.py`) rather than a note,
and why the detector cannot depend on a hook to answer.

⚠️ **The rule and the mechanism are mutually exclusive.** Any fix accepts one or
changes the other. Confirmed twice before the docs were found: an
`insert into cpl_memory` the guard denies ran anyway, and the harness stop hook
carried no trace of `patch_stop_hook.py`.

### ⛔ `permissions.allow` works in auto mode — the handoff said it did not

The inherited claim was that an allow rule cannot reach the classifier. The
classifier's documented decision order opens: *"Actions matching your allow,
ask, or deny rules resolve immediately."* **The allowlist never failed; it never
loaded.** One cause, not two — and three guards were built where a list of rules
plus one hook would do.

What auto mode *does* drop on entry decides the real design: blanket `Bash(*)`,
wildcarded interpreters, package-manager runs, `Agent` and `Monitor` rules.
Narrow Bash rules and **MCP tool rules survive**. So MCP reads need only a rule;
arbitrary-argument Bash needs a hook; and `execute_sql` stays on its hook
*deliberately*, because an allow rule resolves immediately and would
auto-approve writes — exactly what #1617 did.

### ⭐ Auto mode caused the storm it was turned on to stop

Sam: *"I turned on auto yesterday, I believe, to try and abate the storm."* Auto
mode is the classifier. It suppresses routine prompts by judging content, and
escalates what it judges risky into prompts no allow rule shadows. His dominant
call that week was production SQL — the hardest-escalated category. The mode
meant to reduce prompts routed his most common operation into the one bucket it
would not stop asking about.

⚠️ **Do not switch modes to fix this.** Auto is the lowest-prompt mode there is;
`acceptEdits` auto-approves only reads, edits and basic filesystem commands, so
every Bash and MCP call would prompt — more, not fewer.

### ⚠️ The guard blocked the doctrine it serves

`supabase_sql_guard.py` denied every write verb with no exception, so Rule 8's
`cpl_memory` writes were denied and **no checkpoint could complete wherever it
fired**. The carve-out added here fails closed by COUNTING: only `insert`/
`update`, and every one must target `cpl_memory`.

### ⭐ Two unverified premises in one session

The other was a stale `origin/main` (`d89ddec`, force-updated on fetch) that
predated the curation ladder and made a working gate look broken. Both were
inherited claims acted on before checking, and both cost real work. **Verify the
premise before building on it** — a handoff written under context pressure is
exactly where a confident wrong claim gets passed forward.

### PRs

[#1633](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1633) — the
guards, the installer, the detector, and the simplification that removed a third
of them.

## 2026-09-20 (SkyForge, S280) — the guards load, and the hook's allow is advisory

Sam, mid-session: *"Still getting the swarm of allow sql that we've been
trying to solve for the last 5 sessions."* This time the answer came from the
session's own transcript rather than from the docs or a hunch. Every Bash and
`execute_sql` call carried a `hook_success` entry from
`/home/user/.claude/settings.json`, the file Sam's setup script writes at
container start, so the guards load. The allow-listed GitHub and Supabase reads
returned in under a second, so allow rules work in auto mode. The `execute_sql`
guard returned `allow` in under 0.1 s on all seven SQL calls, and every call
still waited on Sam, from 43 seconds to 21 minutes. The docs say why: a
PreToolUse hook can tighten and never loosen.

Three premises from five sessions fell in one table. The settings do load.
The rule is the lever. And `check_hooks_live.py` had said INERT while the
guards were live, because it read the repo's file and never the root's.

The fix is one line, the tool on `permissions.allow` beside the hook whose
deny still fires first. The auto-mode classifier refused a session-initiated
commit of that line twice as `[Self-Modification]`, once with Sam's "commit" in
the message. That refusal is the right shape: a session does not grant itself
a permission, a person does. Sam's screenshot of the prompt carries no
organization-approval text and the published Supabase MCP server carries no
always-approve annotation, so once the line lands the prompts should stop; if
one survives, its wording names the next lever. He asked whether Accept Edits
would help: no, it would prompt on every write instead. TruffleHog stays; it
never gated a merge.

### ⭐ The setup script runs once — the root settings are a snapshot artifact

Sam's line landed at 19:50 UTC; a session he started at 20:05 still read one
`execute_sql` line in the root settings. That container and this one carry
the same three timestamps to the second (clone 15:03:17, checkout 15:03:27,
settings 15:03:31): one filesystem snapshot, built before the commit. The
cloud-environments docs say so under "Environment caching": the setup script
runs the first time a session starts in an environment, Anthropic snapshots
the filesystem, later sessions start from the snapshot and skip the script,
and it runs again only when the script or the allowed hosts change or after
about seven days. So a change to `ALLOW_TOOLS` reaches new sessions after
one edit of the setup script at claude.ai/code, and reaches the running
session at once with `--apply`, because Claude Code reloads permissions and
hooks from a changed settings file. The reference doc and the installer said
"at every container start"; both are corrected.

Two smaller corrections from the same measurement. A guard writes a
`hook_success` entry only when it emits a decision, so "every call" was the
allowed calls: 10 of 10 `execute_sql`, 11 of 111 Bash. And the dependency map
records line numbers, so Sam's one added line moved a mapped reference from
180 to 181 and turned `main` red on two runs before #1641 carried the
regenerated map.

### PRs

[#1639](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1639) — the
measurement; [#1641](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1641)
— the test that pins the rule to its hook, the checker reading the root, the
installer's corrected comments, the regenerated map.
