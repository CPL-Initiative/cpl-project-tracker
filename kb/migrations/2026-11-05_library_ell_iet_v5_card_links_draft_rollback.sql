-- Rollback for 2026-11-05_library_ell_iet_v5_card_links_draft.sql (SkyFlipFlop): the card's draft goes back to the first
-- Version 5 draft (1cc83f99-0e5b-40fd-8e30-6b8c11092d8f); the card-links draft is deleted while unpublished. Guarded on no Replace since.
update public.cpl_library l
set regen = (l.regen || jsonb_build_object('draft_id', '1cc83f99-0e5b-40fd-8e30-6b8c11092d8f', 'ready_at', '2026-11-05T18:43:01Z',
              'earlier', (select coalesce(jsonb_agg(e), '[]'::jsonb) from jsonb_array_elements(l.regen->'earlier') e where e->>'draft_id' <> '1cc83f99-0e5b-40fd-8e30-6b8c11092d8f'))),
    versions = (select jsonb_agg(case when v->>'label' = 'Version 5'
                  then jsonb_set(v, '{status}', to_jsonb(replace(v->>'status', 'Then, at Sam''s ask in session, the top cards open what they count: the funding opens the note naming EDD''s award notice, the 7 projects open the fit bands, the 15 credential families open the statewide table; the participants card stays plain, since its figure sums one line on each of six project tabs. ', '')))
                  else v end order by o) from jsonb_array_elements(l.versions) with ordinality as t(v, o))
where l.slug = 'ell-iet-cpl-starting-points' and l.regen->>'approved_at' is null
  and l.regen->'earlier' @> '[{"draft_id": "1cc83f99-0e5b-40fd-8e30-6b8c11092d8f"}]'::jsonb;
delete from public.cpl_library_drafts
where slug = 'ell-iet-cpl-starting-points' and made_by = 'SkyFlipFlop (session), stored by library-skyflipflop@bot'
  and published_at is null and id <> '1cc83f99-0e5b-40fd-8e30-6b8c11092d8f' and made_at > '2026-11-05 18:50:00+00';
