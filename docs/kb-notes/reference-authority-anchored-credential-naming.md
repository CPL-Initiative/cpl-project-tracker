---
title: Authority-anchored credential naming — CareerOneStop / O*NET / COOL / Credential Engine for the CER
created: 2026-07-07
updated: 2026-07-07
tags: [reference, cer, credential-identity, careeronestop, onet, credential-engine, kb]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[exhibit_canonicalization_lessons]]"
  - "[[CLAUDE]]"
artifacts:
  - kb/unified_titles.json
  - kb/credentials.json
  - .claude/skills/exhibit-canonicalization/SKILL.md
---

# Authority-anchored credential naming — established public datasets for the CER

> **One-sentence summary** — Instead of inventing every unified exhibit title, anchor
> the CER's credential names + issuing agencies to the datasets the U.S. DOL already
> maintains: CareerOneStop's Certification Finder (bulk-downloadable) and License
> Finder (CA licenses + licensing agencies), with O*NET supplying the CC-BY occupation
> spine and Credential Engine as the strategic registry California MAP already partners with.

## What each source offers (researched 2026-07-07)

| Source | What it is | Access | Terms | CER fit |
|---|---|---|---|---|
| **CareerOneStop Certification Finder** | National registry of occupational certifications: name, acronym, **certifying organization** (+ URL), type (Core/Advanced/Specialty/Skill/Product), in-demand flag, related O*NET/NAICS | REST API (`api.careeronestop.org/v1/certificationfinder/…`, free Bearer token, 36-month license) **+ a full bulk flat file** (`…/Developers/Data/certifications.aspx`) | Free, royalty-free; **attribution to US DOLETA + MN DEED required wherever displayed**; re-register every 36 months | The canonical vocabulary for exactly the search Sam demoed ("building inspector" → *Residential Building Inspector (RBI)* / International Code Council) |
| **CareerOneStop License Finder** | State occupational licenses: title, state, **licensing agency (name/address/URL)**, requirement indicators, `LastUpdated` | Same API family (`/v1/license/{userId}/{keyword}/CA/…`); bulk MS-Access DB via ARC (`data.widcenter.org/wfinfodb/License`) | Same COS terms; state-submitted (revise ~annually; some states lag — check `LastUpdated`) | The authority for license-type exhibits (Cosmetology, SMOG, POST-adjacent) |
| **O*NET** | Occupation spine (SOC), alternate titles, tech skills, **military MOC→SOC crosswalk (COOL-integrated)**; does NOT keep its own cert registry — its cert pages ARE CareerOneStop records | Web Services v2 (free `X-API-Key`) + full DB downloads, quarterly | **CC BY 4.0** — safe even in the public KB | Occupation facets on CER rows; the military crosswalk lane for JST/veteran exhibits |
| **DOD COOL** | MOS/rating → credential crosswalks + funding info | No public API/bulk found; reach it via the O*NET military crosswalk files | — | Linkage source, not a naming authority |
| **Credential Engine (CTDL registry)** | Linked-open-data credential registry; **CE's California page names a partnership with the California MAP Initiative around CPL**; CA has 2,500+ published credentials (Chaffey, Foothill–De Anza named) | Read-by-URI free; Search API needs an org account | CTDL is CC BY 4.0 | Reconcile before duplicating — the CER's unified credentials are themselves publishable as CTDL long-term |

## Recommended strategy (ranked)

1. **Bulk-sync the COS certification flat file → `kb/reference/cos_certifications.json`**
   (runner-as-proxy workflow — the sandbox is egress-blocked to every COS/O*NET host;
   probe the download URL from a throwaway `workflow_dispatch` first, API paging as
   fallback). Slim to `{name, acronym, org, org_url, cert_id, type, in_demand, onet}`.
2. **Match-and-badge pass** over `kb/unified_titles.json` + `kb/credentials.json` —
   the proven join-ladder pattern (#642): exact-normalized → acronym → org-constrained
   fuzzy. Stamp `cos_cert_id`, auto-fill the many null `issuing_agency` fields from
   the authority's `Organization`, emit a divergence worklist, render a "✓ COS-anchored"
   provenance badge in the CER. Scope pass 1 to CPL type = Industry Certification.
3. **CA License Finder slice → `kb/reference/ca_licenses.json`** for the license-type
   exhibits (canonical license title + licensing agency).
4. **O*NET SOC codes** carried onto matched credentials (free by-product; CC-BY safe
   everywhere) → occupation-facet search in the CER + Sierra wiring; later the
   military-crosswalk lane.
5. **Curation-time type-ahead** over the synced authority file in the CER triage/curate
   flow (offline, lazy-loaded — never ship the COS token client-side).
6. **Credential Engine reconciliation** — an org question first: confirm the CE ↔ MAP
   Initiative partnership account, consume the CA-published records, and long-term
   publish CER credentials as CTDL.

**Division of labor:** the authority anchors *external* credentials (industry certs,
licenses, AP/IB/CLEP). **Cx / portfolio exhibits stay OURS** — named by the course
content per the skill's Rule 5c, issuer `California Community Colleges`; no external
registry will ever carry "Automotive Lubrication Service (MATH 095)"-class entries,
and that's fine: the two vocabularies partition cleanly along the CPL Type axis.

## Decisions Sam owns

1. Register (or surface an existing) CareerOneStop Web API account — under RCCD or
   CCCCO? (36-month license renewal lives with that owner.)
2. Does the MAP Initiative already hold a Credential Engine org account per CE's
   California partnership page? Who owns it?
3. OK to render the required "Source: CareerOneStop, sponsored by USDOL ETA /
   MN DEED" attribution on the CER (and any public page showing COS-derived names)?
4. Synced authority files stay tracker-internal `kb/reference/` (recommended under
   the DEED click license) vs. asking COS about inclusion in the CC-BY public KB.
5. Priority: certifications first vs CA licenses first vs both; where the military
   (COOL/MOC) lane ranks against the Veteran Sprint timeline.
