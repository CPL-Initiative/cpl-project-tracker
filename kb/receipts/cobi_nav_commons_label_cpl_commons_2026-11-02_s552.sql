-- S552 (SkyCentaurus), 2026-11-02 15:03Z, Sam's ruling on Open Asks Sheet 158 card 3 ("rename", his own call, 15:01Z):
-- the COBI side menu's Catalog Commons entry reads CPL Commons. Sam named the whole the CPL Commons the same
-- hour ("let's go with CPL Commons for now as less of a wholesale take over of the system").
--
-- Applied through the Supabase MCP from the session (one guarded UPDATE, Rule 10(a)); this file is the receipt.
-- Before-value, read 2026-11-02 14:50Z: key 'commons', kind 'tab', label 'Catalog Commons', parent 'reference',
-- sort_order 8, hidden false, pinned false, audience 'everyone', orgs {cpl,ci}, updated_by 'slee@cccco.edu',
-- updated_at 2026-11-01 22:20:41Z.
--
-- Rollback:
--   update cobi_nav set label = 'Catalog Commons', updated_by = 'slee@cccco.edu'
--    where key = 'commons' and kind = 'tab' and label = 'CPL Commons';

update cobi_nav
   set label = 'CPL Commons', updated_at = now(), updated_by = 'commons-s552@bot'
 where key = 'commons' and kind = 'tab' and label = 'Catalog Commons';
-- returned: key commons, label CPL Commons, updated_at 2026-11-02 15:03:21Z
