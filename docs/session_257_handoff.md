---
title: Session 257 handoff — a sidebar on a security notice, and SkySignal's queue carried forward untouched
date: 2026-09-11
session: 257 (SkyBeat)
tags: [handoff, sierra, cpl-chat, security, map-website, observability]
status: current
---

# You are Session 257

Your moniker is **SkyBeat**. The job is the one SkySignal handed to Session 256
and Session 256 did not get to: reading Sierra's pulse after the v64 and v65
deploys. Session 256 (SkyPulse) spent its whole run on a sidebar Sam asked for —
a KYND security notice about the MAP website — and Sam ruled the session limited
to that topic, so every Sierra item below is exactly where SkySignal left it.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md)
(SkyProof, dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md)
(SkyStar, SkyView / the CPL universe) are still live for their lanes; this file
supersedes only [`docs/session_256_handoff.md`](session_256_handoff.md) and
carries its Sierra content forward verbatim where it still holds.

Read in order:
[`docs/reference/lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
("The endpoint itself") ·
[`docs/cpl_assistant_lessons.md`](cpl_assistant_lessons.md) (the two 2026-09-11 sections) ·
[`methodology-a-model-switch-carries-its-defaults-not-just-its-price`](kb-notes/methodology-a-model-switch-carries-its-defaults-not-just-its-price.md) ·
[PR #1551](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1551).

## What Session 256 did (the sidebar)

- **The KYND notice.** KYND, scanning rccd.edu for the California Schools JPA,
  flagged map.rccd.edu (35.212.17.242, port 443) for wp2shell — CVE-2026-63030
  and CVE-2026-60137 in WordPress core, fixed 2026-07-17 in 6.9.5 / 7.0.2,
  exploited in the wild since 2026-07-20. Sam asked whether the links we give
  out for the Fact Sheet or Sierra could be involved. **They cannot**:
  map.rccd.edu is a SiteGround-hosted WordPress site outside our stack (our own
  workflows already said so); COBI, Sierra and the Fact Sheet are GitHub Pages
  plus one Supabase function. Links in either direction are inert for a
  server-side flaw. The sandbox cannot reach the host, so the live version was
  NOT read — the memo says so first.
- **What does touch us** (none of it ours to patch): the cpl-chat CORS origin;
  the Monday `cpl-stories.yml` scrape that commits the site's story text to
  `main` (the renderer escapes; the current dataset checked clean — 36 stories,
  hosts only map.rccd.edu and staging2); three PDFs the Fact Sheet links; and
  all 36 story images hot-linked from **staging2.map.rccd.edu, a second public
  WordPress install KYND did not list.**
- **Delivered:** a house-voice memo for Sam to forward to the site's
  administrator —
  `CPLBrain/04-projects/cpl-initiative/20260911_Memo_map_rccd_edu_WordPress_wp2shell_Notice.{docx,md}`
  (three checks: confirm the version from inside WordPress on BOTH installs;
  hunt for batch-route hits, unknown plugins or admins and recent PHP under
  uploads before trusting the patch; block only the batch route, and take any
  plugin from wordpress.org or the host). Durable record: the KB note
  [`playbook-answering-a-vulnerability-notice-about-a-host-we-link-to`](kb-notes/playbook-answering-a-vulnerability-notice-about-a-host-we-link-to.md)
  and `cpl_memory` slug
  `map-rccd-edu-is-wordpress-on-siteground-outside-our-stack-2026-09-11`.
- **No code changed, nothing deployed.** The Rule 9 count was 0 at start and
  the context meter read 12% at the sidebar's end.

## Sam's decisions this run

1. **The memo** — *"Yes, please turn it into a memo"* — delivered as above.
2. ***"Glad it's not our problem"*** — his acceptance of the finding; the memory
   row is `verified` with that line as the verifier.
3. **Session scope** — *"checkpoint and we'll keep this session limited to this
   topic"*, and the handoff *"to pick up where we left off with SkySignal 256"*.
   This file is that.

## NEEDS SAM

1. **Forward the memo** and get the version confirmed on BOTH installs
   (production and staging2); answer KYND after. Until then the Monday stories
   scrape keeps pulling text from the site — pausing it is his call.
2. Carried from 256: run the sixteen-row register sweep once on Sonnet 5, and an
   A/B of reasoning on the preview slug only if a gap appears.
3. Carried from 255: the `sierra_guidance` CHECK constraint lacks `skyview-ask`;
   eleven decision-sheet items settled and waiting to be built (4, 5, 8, 9, 10,
   11, 13, 15, 16, 17, 18, 19 — ruling 3 shipped in #1550).

## Queue (SkySignal's, verbatim — none of it moved)

- **Read the cap-hit count** in `chat_interactions` a day after the deploy with
  thinking off. v64 deployed 2026-09-11 02:03Z and v65 (`MAX_TOKENS` 8,192) at
  16:41Z, so the read is due now. The tokenizer counts ~30% more tokens for the
  same text; if real answers were cut short on v64, v65's ceiling is the fix —
  measure it, don't guess.
- ✅ Smoke modes 15a and 15c matched Sierra's own correct negations — fixed in
  #1555. **16a's roster-lookup rewrite is still the open one.**
- **The health probe cannot see this outage class.** It asks one simple question
  and passed straight through two hours of blanks on broad questions. Decide
  whether a second, broader question is worth one more model call per run.
- **Raise the probe to hourly** — `cpl-chat-health.yml`'s own header says to
  once billing moved to the corporate account, which it did on 09-10.
- Carried: `Counselor_Verified` back into the daily fetch; 51 guessed column
  offsets in `excel_to_dashboard.py`; the SkyView ⑩/⑪ queues (S254).

## Patterns that worked (256)

- **Read the notice against the repo's own record of the host first.** The
  stories workflow's comment already said "SiteGround-bot-protected"; the
  platform strategy doc already said "map.rccd.edu (WordPress)". The answer was
  on disk before any web search.
- **Measure the ingest paths; don't assert "links are inert".** The one path
  that carries the site's content INTO a public surface (the stories scrape) was
  found by grepping for fetches, and its renderer's escaping checked, before
  saying nothing reaches us.
- **Write the finding to memory before answering**, so the next scanner notice
  costs a query, not a re-derivation. Rule 8's query half found nothing on the
  host; the row exists now.
- **When the environment's tool fails on a plain file, switch instruments.**
  LibreOffice here cannot load ANY file ("source file could not be loaded" on a
  .txt). The docx check was the schema validator plus mammoth → HTML → a
  headless-Chromium screenshot. Three retry variants were wasted first, and Sam
  noticed (*"grinding?"*).

## Safety patterns to honor

Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through
MCP; the sandbox cannot reach `*.supabase.co`, `api.github.com` or
`map.rccd.edu`) · the `test` check green on the current head before every
merge · `cpl-chat deploy` is a production dispatch (confirm `DEPLOY`) and the
shared function serves every Sierra surface at once · MAP read-only · the
public KB untouched · DON'T LOCK IN: end the turn when the next step waits on
anything external.

## KB notes added this run

- `playbook-answering-a-vulnerability-notice-about-a-host-we-link-to`

---

*Greetings, you are Sky**Beat** (Session 257), see Sky**Pulse**'s handoff —
`docs/session_257_handoff.md` — let's keep rolling with our queue.*
