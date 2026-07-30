-- budget_funding.model_field — the single-source join to the Implementation
-- Funding model (Sam, 2026-07-30: "Budget and Implementation Funding are wired
-- together"). Applied live via the Supabase MCP; committed here as the receipt.
--
-- WHY a column and not a name match: the Budget ledger editor lets a curator
-- rename any row freely, so joining on `name` would silently break the wiring
-- the first time someone reworded a line. `model_field` is an explicit,
-- rename-proof contract, and it is visible IN THE DATA rather than buried in a
-- regex in cpl_funding.js.
--
-- Consumer: cpl_funding.js `loadLedger()` reads the non-archived rows with a
-- model_field and uses them as the BASE layer of poolField() — scenario
-- what-ifs still win, and a disagreeing override is surfaced as drift.

alter table budget_funding add column if not exists model_field text;

comment on column budget_funding.model_field is
 'Optional join key to the Implementation Funding model''s pool fields (cpl_funding.js poolField). Set on the rows that ARE the authoritative source for a model figure, so the model reads the ledger instead of holding its own copy. Rename-proof: the join is this column, never the row name.';

update budget_funding set model_field = 'one_time_2026_27'
 where id = 6 and section = 'source_one_time' and total = 35000000;
update budget_funding set model_field = 'scaling_projects_tech'
 where id = 7 and section = 'use_35m' and total = 8959692;
update budget_funding set model_field = 'remaining_2025_26'
 where id = 11 and section = 'use_15m' and total = 9040308;

-- Verification: exactly 3 rows, matching the amendment's figures.
-- select id, name, section, model_field, total
--   from budget_funding where model_field is not null order by id;
