-- Rollback of 2026-11-19_library_relist_on_new_version.sql. The migration changed no existing function, so the
-- rollback drops what it added: after it, the functions and triggers are exactly as 2026-11-19_library_publishing_model.sql
-- left them, and a listed piece whose page changes stays listed until someone removes it. Pieces it already unlisted
-- stay unlisted with publish_target 'public'; list them again from the Library tab once their page passes.
drop trigger if exists cpl_library_unlist_new_page_trg on public.cpl_library;
drop function if exists public.cpl_library_unlist_on_new_page();
