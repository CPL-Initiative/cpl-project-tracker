-- The sender's own title when the form's title is "Other senior administrator" (S623, 2026-11-10).
-- Sam, in session: "it would make great sense for the sender to be prompted (required) to add their title in that
-- procedure ... would save us this whole step". The CSM review's "Sent by a senior administrator" check had only the
-- word Other to go on, so a reviewer looked the person up before every such acceptance.
--
-- ADDITIVE ONLY. Two nullable columns, each with a length check, and one new function. No existing column, policy,
-- function or grant changes, so a page loaded before this lands keeps working, and the page that sends the new
-- field falls back to sending without it when the column is absent.
--
-- WHO READS IT. The column joins the columns anon cannot SELECT: SELECT on both tables is granted by column, and
-- this migration grants none on the new one. Reviewers read it through cpl_funding_sender_titles(), which answers
-- only is_funding_reviewer() (the reviewer list or a live funding door grant), as cpl_funding_optin_review() does
-- for the name and email beside it.
--
-- WHO WRITES IT. The public confirmation and attestation forms (anon INSERT under cfp_insert_self and
-- cna_insert_self, unchanged). The form requires the field when the title is Other; the database only bounds it.
--
-- Rollback: 2026-11-10_sender_title_text_rollback.sql.

alter table public.cpl_funding_participation add column if not exists attestor_title_text text;
alter table public.cpl_funding_nc_attestation add column if not exists attestor_title_text text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cfp_title_text_len_chk') then
    alter table public.cpl_funding_participation add constraint cfp_title_text_len_chk
      check (attestor_title_text is null or char_length(attestor_title_text) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cna_title_text_len_chk') then
    alter table public.cpl_funding_nc_attestation add constraint cna_title_text_len_chk
      check (attestor_title_text is null or char_length(attestor_title_text) <= 120);
  end if;
end $$;

-- INSERT on both tables is already granted to anon and authenticated; stated by column so the intent is on record.
grant insert (attestor_title_text) on public.cpl_funding_participation to anon, authenticated;
grant insert (attestor_title_text) on public.cpl_funding_nc_attestation to anon, authenticated;

create or replace function public.cpl_funding_sender_titles()
returns table (kind text, college text, fiscal_year text, title_text text)
language sql stable security definer set search_path = public as $$
  select 'part'::text, p.college, null::text, p.attestor_title_text
    from public.cpl_funding_participation p
   where public.is_funding_reviewer() and p.attestor_title_text is not null
  union all
  select 'nc'::text, a.college, a.fiscal_year, a.attestor_title_text
    from public.cpl_funding_nc_attestation a
   where public.is_funding_reviewer() and a.attestor_title_text is not null;
$$;

-- PUBLIC holds EXECUTE from creation and default privileges grant anon by name: close all three, then open two.
revoke all on function public.cpl_funding_sender_titles() from public, anon, authenticated;
grant execute on function public.cpl_funding_sender_titles() to authenticated, service_role;
