-- S642 SkyKestrel, 2026-11-12. The First Light tab (#first-light, first_light_tab.js; #3153) is reviewer-only:
-- Sam, relayed by COBIx: "add a cobi tab so I can edit it". The menu shows an item to everyone until a cobi_nav
-- row narrows it, so this row sets the tab's audience to magic_link (a personal sign-in), the rung the tab's own
-- pane checks. label, parent and sort_order stay NULL, so the item keeps its place from code (nav_groups.js puts
-- it in Sierra & Team Tools, after Letters) and its label from the nav button. Display only: the tab reads public
-- files, and the deep link still opens the pane's sign-in box. Insert only, a new key, so nothing of Sam's moves.
-- Idempotent (ON CONFLICT DO NOTHING). Through supabase-migrate.yml or the conductor's MCP, as earlier menu rows.
-- Rollback: delete from public.cobi_nav where kind = 'tab' and key = 'first-light' and updated_by = 'menu-s642@bot';
insert into public.cobi_nav (kind, key, label, parent, sort_order, hidden, orgs, pinned, audience, updated_by, updated_at)
values ('tab', 'first-light', null, null, null, false, null, false, 'magic_link', 'menu-s642@bot', now())
on conflict (kind, key) do nothing;
