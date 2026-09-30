---
title: "The industry-credential watch agent"
created: 2026-09-30
updated: 2026-09-30
tags: [reference, credential-registry, partner-crosswalks, watch-agent, routine]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[docs/reference/lanes/partner-crosswalks]]"
  - "[[docs/kb-notes/methodology-a-freehand-catalog-needs-an-authority-file-not-a-vote]]"
---

# The industry-credential watch agent

Sam, 2026-09-30, over one working session: *"I am interested in all certs, but
particularly emerging ones from the tech giants."* *"Not just certs, but courses
that result in badges or certs as well. I'm thinking it might be useful to design
an agent who runs on a cron to go scrape and update what appears in the
industry."* *"It would be helpful to assign a CIP sector to each credential and
harvest any skills or competencies that are assigned to the credential by the
issuer."*

Later the same day he named where it goes: *"I'm most interested in having this
integrated into our CER ... by adding known other credentials that could be
articulated for CPL, we add a whole new dimension--especially if we can assign
attributes to the credentials much like CareerOneStop and ONet. We will ask
faculty to revise and verify the skills that align certs with course outcomes as
they articulate for CPL purposes. These verified skills will later be listed on
each persons CA Career Passport. The CER will function like a phase 0 alpha CA
Credential Registry."* So the agent gathers what the issuers publish, attributes
and skills included; faculty verification of those skills is a human step and
never the agent's (a new write surface, CLAUDE.md Rule 10 a3).

This page is the agent's standing instruction. A scheduled run reads it and
follows it; a session changing the agent changes this page.

**State: designed, NOT armed.** Arming waits on Sam's go (section *Arming*).

## What it keeps current

| File | Holds | Written by |
|---|---|---|
| `kb/reference/industry_credential_watch.json` | What the issuers publish now: certifications, course certificates, badges; status, launch, retirement, `formerly` for renames; evidence URL per row | this agent, weekly |
| `kb/reference/industry_credential_skills.json` | The skills each issuer publishes for a credential: exam domains with weights, "skills measured", the courses inside a certificate | this agent, a batch per run |
| `kb/reference/cos_certifications.json` | CareerOneStop's national list | `cos-authority-sync.yml`, monthly on a runner (unchanged) |
| `kb/reference/credential_registry_national_sample.json` | Credential Engine sample, 974 of 6,738 | Sam's 2026-09-16 capture, until the Registry API replaces it |
| `kb/it_ai_credential_catalog.json` | The joined catalog, with CIP sector and MAP status per row | `kb/_build_it_ai_credential_catalog.py` (derived; never hand-edited) |

The catalog is a dated snapshot: the CER it joins to (`credential_reference_data.js`)
is rebuilt every morning, so a committed catalog trails MAP by the days since
its `_inputs.cer_generated_at`. Rerun the builder before citing a count.

## Why an agent and not a scraper

The registries lag the issuers. On 2026-09-30 CareerOneStop carried no AWS AI
Practitioner (launched 2024), and the issuers had changed underneath MAP in ways
no registry recorded: Microsoft retired the AI-900 exam and AI-102 in June 2026,
Cisco renamed CyberOps Associate to CCNA Cybersecurity in February 2026, AWS
renamed SysOps Administrator to CloudOps Engineer in September 2025. Each issuer
publishes this on differently shaped pages that change without notice, so a
fixed scraper breaks on the first redesign. A reading agent with a written
standard does not. The deterministic sources keep their runner jobs; the agent
covers what only reading can.

## One run, in order

1. Read this page, then `industry_credential_watch.json` and
   `industry_credential_skills.json`. Note `_verified_on`.
2. **Issuers.** Re-read Sam's watchlist (`CPLBrain/03-professional/COMPETITIVE-WATCHLIST.md`,
   "AI Certification Providers") and add any provider it names to
   `_issuers_watched`. For each issuer in `_issuers_watched`, read its certification
   catalog and its retirement and what's-new pages for changes since
   `_verified_on`. Add each new credential as a row with `evidence` (the URL
   seen). Mark a retirement `status: "retired"` with the date in `notes`. For a
   rename, give the new name its own row and list every old name in `formerly`;
   the builder routes the registry row and the MAP exhibit filed under the old
   name to it.
3. **Unverified rows.** Re-check up to 15 rows with `verified: false`. Confirm or
   leave them; never promote on a third-party page alone.
4. **Skills.** Harvest issuer-published skills for up to 25 credentials that
   have none, in this order: (a) credentials MAP has articulated, (b) emerging
   tech-giant credentials, (c) entry-level credentials. Record the top-level
   domains with the issuer's weights, up to five of the issuer's own
   sub-skill phrases each, `exam_version`, and `source_url`.
5. Run `python3 kb/_build_it_ai_credential_catalog.py` and
   `python3 kb/_diff_credential_watch.py --out kb/credential_watch_out/<date>.md`.
6. **No change** (the report says so and no skills were added): commit nothing,
   open nothing, end the run.
7. **Change:** branch `claude/credential-watch-<date>`, commit the two reference
   files, the catalog and the report, open a PR whose body is the report, and
   follow the repo's branch policy (merge on a green `test`).
8. File a `cpl_memory` row (tag `credential-registry`) only for a material
   event: a tech giant launched or retired an AI credential, or a credential
   MAP has articulated was renamed or retired.

## Guardrails

- **Evidence on every row.** The URL actually seen; the issuer's own domain
  wins. A row whose only support is a third-party page stays `verified: false`,
  and the builder holds unverified rows out of the catalog.
- **Never delete a row.** A retired credential is still evidence a student
  holds; the AI-102 holders are the worked example. Mark it retired.
- **A row whose `source` names a person is never overwritten** (CLAUDE.md
  Rule 8's spirit). Add a note and flag the conflict in the PR.
- **Never write to the CER or Supabase.** A renamed credential that MAP has
  articulated is a finding for the exhibit-canonicalization lane, reported in
  the PR body; curation stays human (CLAUDE.md Rule 10).
- **Budget per run:** 150 web searches, 25 skills harvests. A session holds 200
  web searches (`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`); the first build
  spent all 200 in one session.
- **CIP stays rule-assigned** (`CIP_RULES` in the builder, Sam's 2026-09-25
  "CIP sector is best" ruling). The agent does not vote a CIP. When the
  Credential Engine Registry API is live, its `instructionalProgramType` is the
  better source for a credential that carries one.

## The network

On 2026-09-30 the environment's network policy blocked the issuers' own pages,
so the first build confirmed most rows from search results quoting them. Sam
asked for the host list the same day. An allowlist that lets a run read the
issuers directly:

```
credentialengineregistry.org  credentialfinder.org  credentialengine.org
apps.credentialengine.org     www.careeronestop.org api.careeronestop.org
aws.amazon.com  docs.aws.amazon.com  d1.awsstatic.com
learn.microsoft.com  www.microsoft.com
grow.google  www.cloudskillsboost.google  www.coursera.org  coursera.org  www.credly.com
www.comptia.org  partners.comptia.org  www.nvidia.com
www.cisco.com  learningnetwork.cisco.com  www.netacad.com
www.isc2.org  www.isaca.org  www.giac.org  www.sans.org  www.eccouncil.org
education.oracle.com  mylearn.oracle.com  www.ibm.com  skillsbuild.org
trailhead.salesforce.com  www.databricks.com  www.snowflake.com  iapp.org
www.acenet.edu  credits.acenet.edu
```

Cloud.google.com and cccco.edu were already reachable.

## The Credential Engine Registry API

The upgrade path, owned by Sam and Malone (2026-09-16). CTDL carries what this
agent reconstructs by reading: competencies (`ceasn:Competency` via
`ceterms:requires`), the CIP (`ceterms:instructionalProgramType`) and the
occupation (`ceterms:occupationType`). With a key stored as a repository secret,
a runner step in the `cos-authority-sync` pattern
([`playbook-runner-as-external-api-proxy`](../kb-notes/playbook-runner-as-external-api-proxy.md))
pulls it on a schedule, and the agent's job narrows to what the Registry has not
caught up with.

## Arming

A Claude Routine that starts a fresh session each run, in this environment:

- **Name:** Industry credential watch
- **Schedule:** Mondays at 05:51 Pacific (`CRON_TZ=America/Los_Angeles 51 5 * * 1`)
- **Prompt:** *"Run the industry credential watch. Read
  docs/reference/credential_watch_agent.md in cpl-project-tracker and follow it
  exactly. End the run when it says to."*
- **Before arming:** confirm the environment attaches `cpl-project-tracker`,
  and apply the network allowlist above or accept search-snippet evidence.

Each run costs one session. A quiet week ends at step 6 with no commit.
