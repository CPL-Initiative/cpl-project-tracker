-- Reverses 2026-11-17_s676b_reread_rollback.sql: puts back this session's readings. The four reread receipts are filed beside it
-- (kb/receipts/program_requirement_records_college_reread_*_441*.json); re-run step=reread force=<run> on claude/yield-<college>-s676. Guarded the same way.

-- Cabrillo College: dispatch program-requirements-college.yml step=reread force=44112287720 on claude/yield-cabrillo-s676
-- Gavilan College: dispatch program-requirements-college.yml step=reread force=44112314553 on claude/yield-gavilan-s676
-- Lemoore College: dispatch program-requirements-college.yml step=reread force=44112323039 on claude/yield-lemoore-s676
-- College of San Mateo: dispatch program-requirements-college.yml step=reread force=44118956553 on claude/yield-college-of-san-mateo-s676
