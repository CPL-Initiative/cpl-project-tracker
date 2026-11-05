-- SkyRoundoff (Library side session), 2026-11-05 16:28:33Z: Sam's "Replace the public copy with Version 4" (in session),
-- applied as the card's Replace does: regen.approved_at and approved_by on ELL IET CPL Starting Points (915ff7d5-…),
-- then a library-publish.yml dispatch, which publishes draft a0ac81de-… to library/ell-iet-cpl-starting-points/.
-- Guarded on regen.draft_id = a0ac81de-…, approved_at null, updated_at 2026-11-05 16:00:35.940116+00.
-- Before-values: regen without approved_at/approved_by; updated_by 'library-skyroundoff@bot'.
update cpl_library set regen = regen || jsonb_build_object('approved_at', to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'approved_by', 'Sam'), updated_by = 'library-skyroundoff@bot'
where slug='ell-iet-cpl-starting-points' and regen->>'draft_id'='a0ac81de-caf6-43b4-9e0e-fb0589f6b309' and regen->>'approved_at' is null and updated_at='2026-11-05 16:00:35.940116+00';
-- Result: approved_at 2026-11-05T16:28:33Z, updated_at 2026-11-05 16:28:33.909841+00.
-- ROLLBACK (only before library-publish.yml runs): update cpl_library set regen = regen - 'approved_at' - 'approved_by'
--   where slug='ell-iet-cpl-starting-points' and regen->>'draft_id'='a0ac81de-caf6-43b4-9e0e-fb0589f6b309';
-- After it runs, the public copy reverts with git revert of its commit and the record by the receipt it writes.
