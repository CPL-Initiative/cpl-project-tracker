-- S506 (SkyCloudberry), 2026-10-28: Rule 8 ingest for Sam's funding-tab asks of the day and what the session measured.
-- INSERT-only under author/actor memory-s506-2026-10-28. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s506-2026-10-28';
--   delete from public.cpl_memory where author = 'memory-s506-2026-10-28';
-- related is coalesced to '{}' and every summary is <= 400.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s506-2026-10-28', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "sam-funding-email-first-2026-10-28",
  "kind": "decision",
  "title": "Sam: the public funding forms start with the email field, acknowledge an allowed address, and name map@rccd.edu for support",
  "summary": "Sam, 2026-10-28 (S506): \"Rather than starting with the name field, start with the email field and give an acknowledgement once an allowed email is entered that the user may complete the action and, once approved by CPL Initiative staff will show as complete on the dashboard. Provide an email contact (map@rccd.edu) for technical support.\" Both forms.",
  "detail": "Built in S506: emailStepHtml in cpl_funding.js; Continue runs domainCheck and only a pass opens the rest of the form. The forms say CPL Initiative staff, his words; the Minimum Conditions status lines keep awaiting MAP team review.",
  "plain": null,
  "tags": ["implementation-funding", "funding-public"],
  "status": "verified",
  "source": "Sam, in session S506, 2026-10-28",
  "verified_by": "Sam",
  "event_date": "2026-10-28",
  "related": ["sam-funding-public-domain-check-csm-accept-2026-10-27"]
 },
 {
  "slug": "sam-funding-tab-asks-s506-2026-10-28",
  "kind": "decision",
  "title": "Sam's funding-tab asks of 2026-10-28: attest word placement, gray boxes, Confirm size, memo TBA, the version's place, one text section",
  "summary": "Sam, 2026-10-28 (S506): \"Move the NC attest link up next to the NC checkbox to the right of the label text and aligned vertically under the confirmation check box\"; \"Gray all unchecked qualifying boxes\"; Confirm by in the row's font size; \"Delete the TOC link to Guidance memo in Word and gray the Guidance memo link and add (TBA)\"; \"As of\" left of Resource Links; consolidate the two text sections.",
  "detail": "Also on his screenshot he struck the drill-in's closing line, \"The noncredit share releases on the noncredit outcomes: ...\"; S506 removed it under the outcomes lane. On the memo: \"we will link to the CO memo once it is officially published.\" On the text sections: \"Can we consolidate these into one\" and \"I need a way to indent (tab) bullets\".",
  "plain": null,
  "tags": ["implementation-funding", "funding-public"],
  "status": "verified",
  "source": "Sam, in session S506, 2026-10-28",
  "verified_by": "Sam",
  "event_date": "2026-10-28",
  "related": null
 },
 {
  "slug": "pitfall-funding-emptied-text-returns-2026-10-28",
  "kind": "pitfall",
  "title": "Two causes made a deleted funding passage reappear on save",
  "summary": "Sam, 2026-10-28: \"I try to delete the text and it reappears on save\". (1) setText treated an empty save as Restore (deleted the override) and textOverride read a blank value as none, so house words returned. (2) Signed in, a save went to the shared config while the tab read this browser's what-if copy first. S506: TEXT_BLANK keeps an emptied passage empty; a signed-in save drops that what-if copy.",
  "detail": "The public page's painter also skipped an empty passage (if (html)) and showed its typed default; it now paints a blank one empty. Restore the default text passes reset. Guard tests/cpl_funding_s506_asks.test.js (7c, 7d, 7e).",
  "plain": null,
  "tags": ["implementation-funding"],
  "status": "proposed",
  "source": "S506 code read of cpl_funding.js setText/textOverride and funding-model/index.html paintPassages",
  "verified_by": null,
  "event_date": "2026-10-28",
  "related": ["pitfall-funding-edit-saves-to-browser-whatif-2026-10-26"]
 },
 {
  "slug": "funding-domain-gate-measured-s506-2026-10-28",
  "kind": "fact",
  "title": "The public funding forms' domain gate, measured live 2026-10-28",
  "summary": "S506, read-only: cpl_funding_email_domain_ok passes the institution's domain in any case and refuses gmail, a sister college's domain (laney.edu for Alameda), a look-alike (peralta.edu.evil.com) and a subdomain; anon holds EXECUTE; all 115 credit institutions and the 4 noncredit-only ones have domains on file. NOCE's nocccd.edu is refused; the reviewer and map@rccd.edu cover that case.",
  "detail": "A rolled-back anon insert was not run: the repo's Supabase guard refuses a do block, so the policy's own function was called directly. Report and notes stay reviewer-only in RLS (cfr_insert, cfn_insert: is_allowed_reviewer()).",
  "plain": null,
  "tags": ["implementation-funding", "funding-public"],
  "status": "proposed",
  "source": "S506 queries against cpl_funding_email_domain_ok, cpl_funding_email_domains, pg_policies",
  "verified_by": null,
  "event_date": "2026-10-28",
  "related": ["funding-review-gate-db-live-2026-10-27"]
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s506-2026-10-28', 'create', 'S506: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s506-2026-10-28'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s506-2026-10-28');
select slug, status from public.cpl_memory where author = 'memory-s506-2026-10-28';
