-- S662 SkyQuill: the ETA cost feed's decision (branch claude/s662-eta-cost-feed). INSERT-only.
-- ROLLBACK: delete from cpl_memory where slug = 'd-eta-cost-feed-two-files-s662';
insert into cpl_memory (slug,kind,title,summary,tags,status,source,author,event_date) values
('d-eta-cost-feed-two-files-s662','decision','The ETA clock''s costs read two committed files, kept apart','Show costs reads kb/reference/model_spend_daily.json (billing pasted by hand, moved out of commons_eta_clock.js) and kb/status/session_spend.json (kb/_build_session_spend.py, from each handoff''s Spend: line: $ total, models, UTC start to end; credited to session N-1, day = end). The two meters differ, so a day shows both, never summed. No billing credentials.',array['commons','eta-clock','model-spend'],'proposed','SkyQuill (S662), on COBIx''s cost-feed ask and Sam''s Spend: line rule (#3358)','SkyQuill (S662)',date '2026-11-16')
on conflict (slug) do nothing;
