-- PROJECT: cpl-budget-support (mdxutmbpoqjtdcwjscux). Rollback of
-- 2026-11-07_budget_logos_update_policy.sql: both policies as read live from pg_policies
-- on 2026-11-07 before the change.

drop policy if exists logos_anon_insert on storage.objects;
drop policy if exists logos_anon_update on storage.objects;

create policy logos_anon_insert on storage.objects for insert to public
with check (
  (bucket_id = 'logos'::text)
  and ((storage.foldername(name))[1] in (select campaigns.slug from campaigns))
  and (exists (select 1 from invitees i
               where ((i.id)::text = split_part(regexp_replace(storage.filename(objects.name), '\.[^.]+$'::text, ''::text), '/'::text, 1))))
);

create policy logos_anon_update on storage.objects for update to public
using (bucket_id = 'logos'::text)
with check (
  (bucket_id = 'logos'::text)
  and ((storage.foldername(name))[1] in (select campaigns.slug from campaigns))
);
