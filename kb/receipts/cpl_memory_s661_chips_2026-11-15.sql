-- S661 SkyKnot: Sam's chips ruling, superseding the session's own d-eta-chips-as-words-s661 (not human-sourced). RUN about 18:10Z.
-- ROLLBACK: delete from cpl_memory where slug='d-eta-date-controls-are-chips-sam-s661'; update cpl_memory set status='proposed' where slug='d-eta-chips-as-words-s661';
insert into cpl_memory (slug,kind,title,summary,tags,status,source,author,event_date) values
('d-eta-date-controls-are-chips-sam-s661','decision','The ETA clock''s date-moving controls are chips (Sam)','Sam, in session 2026-11-15: "I know it breaks with format norms but can you make the items Cobix designed as chips be chips instead of link buttons. The aren''t intended to open views but to change projected eta". Controls that move the projected date are bordered chips; ones that open or reset stay underlined words.',array['commons','eta-clock','ui'],'verified','Sam, in session (S661)','SkyKnot (S661)',date '2026-11-15')
on conflict (slug) do nothing;
update cpl_memory set status='superseded' where slug='d-eta-chips-as-words-s661';
