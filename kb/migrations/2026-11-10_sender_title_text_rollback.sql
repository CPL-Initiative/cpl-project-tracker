-- Rollback of 2026-11-10_sender_title_text.sql (S623). Drops the reader, then the two columns with what they hold.
-- Before running it, read how many titles would go: select count(*) from cpl_funding_participation where
-- attestor_title_text is not null; the same on cpl_funding_nc_attestation. The page falls back to sending without
-- the field once the column is gone, so the forms keep working.
drop function if exists public.cpl_funding_sender_titles();
alter table public.cpl_funding_participation drop constraint if exists cfp_title_text_len_chk;
alter table public.cpl_funding_nc_attestation drop constraint if exists cna_title_text_len_chk;
alter table public.cpl_funding_participation drop column if exists attestor_title_text;
alter table public.cpl_funding_nc_attestation drop column if exists attestor_title_text;
