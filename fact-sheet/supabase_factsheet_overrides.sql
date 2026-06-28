-- ─────────────────────────────────────────────────────────────────────────
-- factsheet_overrides — the Curate-editable overlay for the standalone public
-- CPL Fact Sheet (fact-sheet/factsheet_edit.js). Session: cpl-fact-sheet-editable.
--
-- One row per editable "box" on the Fact Sheet, keyed by the stable `block_key`
-- that factsheet_edit.js assigns at load (section id + a slug of the box's baked
-- text). The baked HTML in fact-sheet/index.html is ALWAYS the fallback, so an
-- empty table = the page exactly as authored. html null + hidden false = no
-- override for that box.
--
-- RLS mirrors item_raci / item_updates / projects: public SELECT (the overlay is
-- applied for every visitor), writes gated by is_allowed_reviewer() (the shared
-- magic-link reviewer list). Reviewer-authored `html` is injected as innerHTML
-- for all visitors — the trust boundary is the reviewer allow-list, the same one
-- already trusted for curator notes / item_updates. The anon key can read, never
-- write.
--
-- `page` is forward-compat: more standalone Curate-able pages can share the table.
--
-- Phase 1 (add/delete/reorder boxes) rides this SAME table via reserved block_key
-- namespaces — no schema change:
--   "<sectionId>|add|<kind>|<token>"  a reviewer-ADDED box (html = its inner HTML;
--                                     materialized into the DOM on load; ✕ deletes it)
--   "<sectionId>|__order"             a section's drag order (html = JSON array of keys)
-- Both are still public-read / reviewer-write under the policies below; the html
-- of an added box is sanitized (allowlist) before render, the __order html is
-- parsed as JSON (never injected). A baked box's ✕ just sets hidden=true (it lives
-- in index.html and can't be truly removed).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.factsheet_overrides (
  block_key   text primary key,                       -- stable per-box key (page-scoped)
  page        text not null default 'fact-sheet',     -- which standalone page this row belongs to
  html        text,                                   -- replacement inner HTML (null = keep baked text)
  hidden      boolean not null default false,         -- hide the whole box (e.g. retire a resource card)
  edited_by   text,                                   -- reviewer email who last edited
  edited_at   timestamptz not null default now()
);

alter table public.factsheet_overrides enable row level security;

-- Public read — the overlay is applied for every visitor.
drop policy if exists fso_select on public.factsheet_overrides;
create policy fso_select on public.factsheet_overrides for select using (true);

-- Reviewer-gated write (insert/update/delete). is_allowed_reviewer() already
-- exists (used by projects / tmc / raci / item_updates).
drop policy if exists fso_write on public.factsheet_overrides;
create policy fso_write on public.factsheet_overrides for all
  using (is_allowed_reviewer()) with check (is_allowed_reviewer());
