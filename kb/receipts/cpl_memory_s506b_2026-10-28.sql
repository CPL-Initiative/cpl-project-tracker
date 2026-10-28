-- S506 (SkyCloudberry), 2026-10-28, second round: Sam's two answers after #2531 merged.
-- INSERT-only under author/actor memory-s506b-2026-10-28. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s506b-2026-10-28';
--   delete from public.cpl_memory where author = 'memory-s506b-2026-10-28';
-- related is coalesced to '{}' and every summary is <= 400.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s506b-2026-10-28', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-funding-noce-district-domain-2026-10-28",
  "kind": "decision",
  "title": "Sam: NOCE staff may confirm and attest from the district's nocccd.edu",
  "summary": "Sam, 2026-10-28 (S506): \"Yes on NOCE\", answering whether North Orange Continuing Education staff writing from nocccd.edu may use the public funding forms. MAP holds no nocccd.edu address for any North Orange college, so the two-colleges district rule could not pass it; cpl_funding_district_domains now names it, and it counts for NOCE, Cypress and Fullerton.",
  "detail": "Migration kb/migrations/2026-10-28_s506_funding_district_domains.sql (applied as s506_funding_district_domains; rollback in its header). Read live after: NOCE and Cypress accept nocccd.edu, Alameda refuses it, gmail stays refused, anon cannot read the table.",
  "plain": null,
  "tags": ["implementation-funding", "funding-public"],
  "status": "verified",
  "source": "Sam, in session S506, 2026-10-28",
  "verified_by": "Sam",
  "event_date": "2026-10-28",
  "related": ["funding-domain-gate-measured-s506-2026-10-28"]
 },
 {
  "slug": "sam-funding-awaiting-cpl-initiative-confirmation-2026-10-28",
  "kind": "decision",
  "title": "Sam: a waiting funding request reads Awaiting CPL Initiative Confirmation",
  "summary": "Sam, 2026-10-28 (S506): \"The awaiting MAP team review should be 'Awaiting CPL Initiative Confirmation'\". The participation line now reads Awaiting CPL Initiative Confirmation, the noncredit line Noncredit CPL Lead: Awaiting CPL Initiative Confirmation, matching the forms' CPL Initiative staff.",
  "detail": "eligReqWords in cpl_funding.js; the attestation's waiting note reads is awaiting CPL Initiative confirmation. Guards cpl_funding_optin F5b, cpl_funding_nc_attestation C5.",
  "plain": null,
  "tags": ["implementation-funding", "funding-public"],
  "status": "verified",
  "source": "Sam, in session S506, 2026-10-28",
  "verified_by": "Sam",
  "event_date": "2026-10-28",
  "related": ["sam-funding-email-first-2026-10-28"]
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s506b-2026-10-28', 'create', 'S506: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s506b-2026-10-28'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s506b-2026-10-28');
select slug, status from public.cpl_memory where author = 'memory-s506b-2026-10-28';
