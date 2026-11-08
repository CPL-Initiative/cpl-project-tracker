-- PROJECT: Work Plan. Rollback of 2026-11-07_nc_cip_category_decisions.sql. Before it ran the
-- table did not exist, so the rollback removes it. Export the rows first if any were written:
--   select * from public.nc_cip_category_decisions; select * from public.nc_cip_category_decisions_history;
drop table if exists public.nc_cip_category_decisions_history;
drop table if exists public.nc_cip_category_decisions;
drop function if exists public.nc_cip_category_file_history();
drop function if exists public.nc_cip_category_stamp();
