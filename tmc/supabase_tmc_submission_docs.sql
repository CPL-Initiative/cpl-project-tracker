-- Schema of record for the TMC Builder's per-submission SUPPORTING-DOCUMENT layer
-- (the COR upload that closes the contact-hours gap). PROPOSED — not yet applied;
-- apply via the Supabase MCP the same way tmc_submissions / tmc_curator were
-- (one create-table migration + a harden-search-path pass), plus the Storage
-- bucket below. Committed first for review per the "scope before build" discipline
-- (see docs/kb-notes/tmc-adt-document-upload-scope.md).
--
-- WHY: an ADT review compares title / number / units / **hours** course-by-course,
-- but contact hours live on the course outline of record (COR), which is absent
-- from COCI / the PCF / C-ID descriptors (docs/kb-notes/reference-adt-acceptance-rules.md §4).
-- The fix: the SUBMITTING COLLEGE attaches the COR for each course as it completes
-- its in-tool ADT application — so every born-in-tool submission carries the hours
-- evidence the CO currently has to chase by hand. Backfilled CO-queue PDFs land in
-- the SAME table (doc_type='proposal'/'cor'), so one model serves both feeds.
--
-- INSTITUTIONAL CURRICULUM DOCUMENTS ONLY — CORs are course-level public records,
-- no student PII. The index row (this table) is metadata only; the FILE lives in
-- the PRIVATE Storage bucket below and is reached via short-lived signed URLs.

-- 1) The document INDEX. One row per uploaded file, tied to a submission
--    (college, tmc_id) and — when the doc is a COR — to the specific slot/course
--    it documents. Mirrors the tmc_submissions anon-write model (public, no-login
--    tool); the authoritative submission remains the exported form. slot_key is the
--    same "<sectionIdx>:<slotIdx>" used by tmc_curator_notes (null for an
--    application-level doc like a cover narrative).
create table if not exists public.tmc_submission_docs (
  id            bigint generated always as identity primary key,
  college       text not null,
  tmc_id        text not null,
  slot_key      text,                              -- "<sectionIdx>:<slotIdx>" (null = whole-application doc)
  course_code   text,                              -- the local course the COR is for, e.g. "PSYC 5" (display aid)
  doc_type      text not null default 'cor',       -- cor | proposal | narrative | other
  storage_path  text not null,                     -- path within the 'tmc-adt-docs' bucket (see §2)
  filename      text not null,                     -- original upload filename (display)
  content_type  text,                              -- MIME; expect 'application/pdf'
  size_bytes    integer,
  uploaded_by_email text,                          -- optional submitter contact (no auth required)
  created_at    timestamptz not null default now(),
  -- a doc must belong to an existing submission; saving the builder upserts that
  -- row first, then uploads attach. Cascade clears the INDEX on delete (Storage
  -- objects are swept separately — see Honest limits in the scope doc).
  constraint tmc_submission_docs_fk
    foreign key (college, tmc_id) references public.tmc_submissions (college, tmc_id) on delete cascade,
  constraint tmc_submission_docs_path_uniq unique (storage_path),
  constraint tmc_submission_docs_type_chk  check (doc_type in ('cor','proposal','narrative','other')),
  constraint tmc_submission_docs_slot_len  check (slot_key is null or char_length(slot_key) <= 60),
  constraint tmc_submission_docs_course_len check (course_code is null or char_length(course_code) <= 60),
  constraint tmc_submission_docs_file_len  check (char_length(filename) between 1 and 300),
  constraint tmc_submission_docs_path_len  check (char_length(storage_path) between 1 and 500),
  constraint tmc_submission_docs_email_len check (uploaded_by_email is null or char_length(uploaded_by_email) <= 200),
  -- 20 MB cap — CORs are small PDFs; the ceiling guards scanned/image-heavy ones.
  constraint tmc_submission_docs_size_chk  check (size_bytes is null or size_bytes <= 20971520)
);

alter table public.tmc_submission_docs enable row level security;

-- The submitting college (anon) inserts as it completes its application, and reads
-- back its own uploads — the index metadata is no more sensitive than the alignment
-- itself, which tmc_submissions already exposes anon-SELECT. DELETE is reviewer-only
-- (anon has no identity to scope "delete my own"); a college "replaces" a file by
-- re-uploading, and the app shows the newest by created_at. If abuse appears, move
-- INSERT behind is_allowed_reviewer() like kb_curation.
create policy tmc_submission_docs_read   on public.tmc_submission_docs
  for select to anon, authenticated using (true);
create policy tmc_submission_docs_insert on public.tmc_submission_docs
  for insert to anon, authenticated with check (true);
create policy tmc_submission_docs_delete on public.tmc_submission_docs
  for delete to authenticated using (public.is_allowed_reviewer());

-- 2) The Storage bucket (illustrative DDL — buckets/policies are created via the
--    Supabase Storage API/MCP at apply-time; shown here as the schema of record).
--    PRIVATE bucket: the COR file is never public; the app mints a short-lived
--    signed URL (createSignedUrl) for the submitter in-session and for signed-in
--    reviewers. Path convention keeps uploads collision-safe + prefix-scopable:
--      tmc-adt-docs/<college-slug>/<tmc_id>/<slot_key|misc>/<epoch>-<filename>.pdf
--
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   values ('tmc-adt-docs','tmc-adt-docs', false, 20971520, array['application/pdf'])
--   on conflict (id) do nothing;
--
-- -- anon may UPLOAD into the bucket (mirrors the anon-write submission model)…
-- create policy tmc_docs_upload on storage.objects
--   for insert to anon, authenticated with check (bucket_id = 'tmc-adt-docs');
-- -- …and READ (needed to mint a signed URL for the just-uploaded file / downloads).
-- create policy tmc_docs_read on storage.objects
--   for select to anon, authenticated using (bucket_id = 'tmc-adt-docs');
-- -- pruning is reviewer-only, matching the index DELETE policy above.
-- create policy tmc_docs_delete on storage.objects
--   for delete to authenticated using (bucket_id = 'tmc-adt-docs' and public.is_allowed_reviewer());
