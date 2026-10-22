-- The per-college noncredit course, program, mirrored-title and exhibit counts behind nc_courses.json.
-- Run through the Supabase MCP (the sandbox cannot reach *.supabase.co); read 2026-10-22 ~18:20Z.
-- credit_type is COCI's funding category: CDCP (enhanced funding) = 'Other Noncredit Enhanced Funding' (ESL,
-- basic skills, short-term vocational) + 'Workforce Preparation Enhanced Funding'; 'Non-Enhanced Funding' is the rest.
-- A "mirrored" noncredit course is one whose normalized title equals a credit course's at the same college.
with c as (select college, course_title, title_norm, credit_type, subject, course_number from chatbox_college_courses where title_norm is not null and title_norm <> ''),
nc as (select * from c where credit_type in ('Other Noncredit Enhanced Funding','Workforce Preparation Enhanced Funding','Non-Enhanced Funding')),
cr as (select distinct college, title_norm from c where credit_type = 'Credit Course'),
mir as (select nc.college, nc.title_norm, min(nc.course_title) as title, bool_or(nc.credit_type <> 'Non-Enhanced Funding') as cdcp
        from nc join cr on cr.college = nc.college and cr.title_norm = nc.title_norm group by nc.college, nc.title_norm),
cnt as (select college,
  count(*) filter (where credit_type in ('Other Noncredit Enhanced Funding','Workforce Preparation Enhanced Funding','Non-Enhanced Funding')) as nc_all,
  count(*) filter (where credit_type in ('Other Noncredit Enhanced Funding','Workforce Preparation Enhanced Funding')) as nc_cdcp,
  count(*) filter (where credit_type = 'Workforce Preparation Enhanced Funding') as nc_wfp,
  count(*) filter (where credit_type = 'Credit Course') as credit,
  count(*) filter (where credit_type in ('Other Noncredit Enhanced Funding','Workforce Preparation Enhanced Funding') and course_title ~* '(certif|licens|\bexam\b|\bprep\b|preparation|\bCNA\b|nurs(e|ing) assist|\bEMT\b|emergency medical|servsafe|food (handler|safety)|\bOSHA\b|comptia|\bA\+|network\+|security\+|cisco|ccna|microsoft|quickbooks|phlebotom|pharmacy tech|medical assist|home health|caregiver|dental assist|forklift|welding|\bHVAC\b|\bEPA\b|real estate|cosmetolog|esthetic|child development|\bCPR\b|first aid|security guard|\bCDL\b|truck driv|solar|electric|plumb|pesticide|water treatment|bookkeep|tax prep|notary|google|adobe|apprentice)') as cert_like
  from c group by college),
prog as (select college, count(*) as nc_programs from coci_college_programs where award = 'Noncredit program' and status in ('Active','Approved') group by college),
ex as (select college, count(*) as exhibits, count(*) filter (where cpl_type <> 'Military') as non_military, count(*) filter (where cpl_type = 'Industry Certification') as ind_cert, count(*) filter (where cpl_type = 'Credit By Exam') as cbe, count(*) filter (where collaborative_type = 'CCC') as ccc_adopted from chatbox_exhibits group by college)
select json_agg(json_build_object('college', cnt.college, 'nc_all', nc_all, 'nc_cdcp', nc_cdcp, 'nc_wfp', nc_wfp, 'credit', credit, 'cert_like', cert_like,
  'nc_programs', coalesce(prog.nc_programs,0), 'exhibits', coalesce(ex.exhibits,0), 'non_military', coalesce(ex.non_military,0), 'ind_cert', coalesce(ex.ind_cert,0), 'cbe', coalesce(ex.cbe,0), 'ccc_adopted', coalesce(ex.ccc_adopted,0),
  'mirrored', (select count(*) from mir where mir.college = cnt.college), 'mirrored_cdcp', (select count(*) from mir where mir.college = cnt.college and mir.cdcp),
  'mirrored_titles', (select json_agg(title order by title) from (select title from mir where mir.college = cnt.college and mir.cdcp order by title limit 40) t)) order by cnt.college) as data
from cnt left join prog on prog.college = cnt.college left join ex on ex.college = cnt.college;
