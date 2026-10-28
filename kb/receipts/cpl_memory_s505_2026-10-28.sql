-- S505 (SkyBoysenberry), 2026-10-28: Rule 8 ingest for the four orphaned PRs and the two credential-watch runs.
-- INSERT-only under author/actor memory-s505-2026-10-28. ROLLBACK:
--   delete from public.cpl_memory_log where actor = 'memory-s505-2026-10-28';
--   delete from public.cpl_memory where author = 'memory-s505-2026-10-28';
-- related is coalesced to '{}' and every summary is <= 400.
insert into public.cpl_memory (slug, kind, title, summary, detail, plain, tags, status, source, verified_by, verified_at, event_date, author, related)
select x.slug, x.kind, x.title, x.summary, x.detail, x.plain, x.tags, x.status, x.source, x.verified_by,
       case when x.verified_by is null then null else now() end, x.event_date::date, 'memory-s505-2026-10-28', coalesce(x.related, '{}'::text[])
from jsonb_to_recordset($json$[
 {
  "slug": "credential-watch-nvidia-nca-amad-2026-10-19",
  "kind": "fact",
  "title": "Credential watch 10-19: NVIDIA lists a new Associate exam, NCA-AMAD (AI Models and Application Development)",
  "summary": "The 2026-10-19 watch run read nvidia.com directly: NVIDIA-Certified Associate: AI Models and Application Development (NCA-AMAD), marked new, $125, 1 hour. Added to kb/reference/industry_credential_watch.json as emerging and verified. No articulated credential renamed or retired that week. Landed S505 (the run's PR #2257 sat unmerged).",
  "detail": "The watch routine opens a draft PR and cannot merge or file this row (no Supabase connector); step 8 of docs/reference/credential_watch_agent.md leaves both to the next interactive session.",
  "plain": null,
  "tags": ["credential-registry"],
  "status": "proposed",
  "source": "https://www.nvidia.com/en-us/learn/certification/ (fetched 2026-10-19 by the credential watch run)",
  "verified_by": null,
  "event_date": "2026-10-19",
  "related": null
 },
 {
  "slug": "credential-watch-anthropic-four-certifications-2026-10-26",
  "kind": "fact",
  "title": "Credential watch 10-26: Anthropic's own page lists four Claude certifications; MS-102 retires 2026-11-30",
  "summary": "claude.com/blog/four-role-based-claude-certifications (dated 2026-07-23) lists Associate Foundations, Developer Foundations, Architect Foundations and Architect Professional, Pearson-delivered and proctored. The two Architect rows are now verified; the other two added. Microsoft 365 Administrator Expert (MS-102) retires 2026-11-30. Landed S505 (#2468 sat unmerged).",
  "detail": "Anthropic states no prices or launch dates; third-party figures stay unconfirmed in row notes. The umbrella row 'Claude Certified Architect (CCA)' stays unverified as Sam named it in his watchlist. Catalog after S505's rebuild: 1,177 credentials, 57 in MAP, 48 articulated.",
  "plain": null,
  "tags": ["credential-registry"],
  "status": "proposed",
  "source": "https://claude.com/blog/four-role-based-claude-certifications; https://learn.microsoft.com/en-us/credentials/support/credential-retirement (fetched 2026-10-26 by the credential watch run)",
  "verified_by": null,
  "event_date": "2026-10-26",
  "related": null
 },
 {
  "slug": "orphaned-prs-four-ported-s505-2026-10-28",
  "kind": "pitfall",
  "title": "Four PRs sat open as drafts for 2 to 9 days; S505 ported or landed all four",
  "summary": "#2379 (S450's Scenario 4 words; the data write ran, the code never merged), #2257 and #2468 (credential watch runs: the routine opens a PR and cannot merge it) and #2469 (Credential Engine top 50; its side session stopped before checks). Handoffs 462 to 476 listed them as open but none acted. S505: #2527 ports #2379, one credential PR lands the other three.",
  "detail": "Git fetch of another session's branch stalls in this environment; the PR's diff through the GitHub tools and raw.githubusercontent.com at the head sha, with git merge-file against the base sha, ported them cleanly. A handoff that names an open PR names what to do with it.",
  "plain": null,
  "tags": ["scheduled-sessions", "pitfall", "credential-registry", "implementation-funding"],
  "status": "proposed",
  "source": "S505 session, 2026-10-28",
  "verified_by": null,
  "event_date": "2026-10-28",
  "related": ["side-session-pr-2323-never-merged-2026-10-28"]
 }
]$json$::jsonb) as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], status text, source text, verified_by text, event_date text, related text[])
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'memory-s505-2026-10-28', 'create', 'S505: ' || m.slug, to_jsonb(m)
from public.cpl_memory m
where m.author = 'memory-s505-2026-10-28'
  and not exists (select 1 from public.cpl_memory_log g where g.memory_id = m.id and g.actor = 'memory-s505-2026-10-28');
select slug, status from public.cpl_memory where author = 'memory-s505-2026-10-28';
