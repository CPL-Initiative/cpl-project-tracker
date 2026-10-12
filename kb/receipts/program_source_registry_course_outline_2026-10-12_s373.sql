-- S373, 2026-10-12: the registry's course outline fields, filled from course outline census run 38305389870.
-- Sam, Open Asks Sheet 70 (2026-10-12 20:40-20:42Z): card 1 "Apply as a migration" (then fill from a
-- pages-only pass over every college); card 2 "Record and move on", note "And look for other
-- repositories for the outcomes data and record the link and data in prog reqs".
-- Written by kb/_course_outline_registry_fill.py from kb/course_outline_census/census_38305389870.json.
-- Counts by cor_access: {"not_found": 59, "public": 49, "refused": 3, "sign_in": 6, "unreached": 1}.
-- Counts by cor_system: {"coursedog": 1, "courseleaf_cim": 3, "curricunet": 3, "curriqunet": 33, "elumen": 19, "none_found": 59}.
-- Printing SLOs: 18.
--
-- The UPDATE applies only where cor_checked_run is null, so a second apply changes nothing.
-- Rollback (Rule 10 a2): the columns were empty before this fill; the statement at the end, uncommented,
-- empties them again, and program_source_registry_history holds every prior row under the run.

update public.program_source_registry r set
  cor_system         = v.system,
  cor_url            = v.url,
  cor_access         = v.access,
  cor_proof_url      = v.proof,
  cor_prints_slos    = case when v.k in ('outline_with_slos', 'slos') then true when v.k = 'outline' then false end,
  cor_slo_source_url = case when v.k in ('outline_with_slos', 'slos') then v.proof end,
  cor_note           = case v.k when 'none' then replace('The course outline census found no course outline system linked from the college''s homepage, catalog or curriculum pages.', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) when 'outline_with_slos' then replace('{name} opens course outlines to the public, and the outline read prints the course''s student learning outcomes.', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) when 'slos' then replace('A public {name} course page prints the course''s student learning outcomes.', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) when 'outline' then replace('{name} opens course outlines to the public; the outline read prints no student learning outcomes heading.', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) when 'list_only' then replace('{name} answers in public, but the census reached no course''s outline from it.', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) when 'sign_in' then replace('{name} asks for a sign-in. Recorded with no request to the college (Open Asks Sheet 70 card 2).', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) when 'refused' then replace('{name} refused the census''s visit (robots or 401/403). Recorded with no request to the college.', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) when 'unreached' then replace('{name} did not answer the census.', '{name}', case v.system when 'coursedog' then 'Coursedog' when 'courseleaf_cim' then 'CourseLeaf''s curriculum module' when 'curricunet' then 'CurricUNET' when 'curriqunet' then 'CurriQunet' when 'elumen' then 'eLumen' when 'kuali' then 'Kuali' when 'webcms' then 'WebCMS' else v.system end) end,
  cor_checked_run    = 'course-outline-census run 38305389870'
from (values
  ('Allan Hancock College', 'curriqunet', 'https://hancockcollege.curriqunet.com/', 'public', 'outline_with_slos', 'https://hancockcollege.curriqunet.com/DynamicReports/AllFieldsReportByEntity/595?entityType=Course&reportId=296'),
  ('American River College', 'none_found', null, 'not_found', 'none', null),
  ('Antelope Valley College', 'elumen', 'https://avc.elumenapp.com/catalog/2026-27/welcome', 'public', 'list_only', null),
  ('Bakersfield College', 'elumen', 'https://bakersfield.elumenapp.com/catalog/2026-2027-Catalog/about-bc', 'public', 'outline', 'https://bakersfield.elumenapp.com/catalog/2026-2027-Catalog/course/aslb3'),
  ('Barstow Community College', 'none_found', null, 'not_found', 'none', null),
  ('Berkeley City College', 'curriqunet', 'https://bcc.curriqunet.com/', 'sign_in', 'sign_in', null),
  ('Butte College', 'curriqunet', 'https://butte.curriqunet.com/', 'sign_in', 'sign_in', null),
  ('Cabrillo College', 'elumen', 'https://cabrillo.elumenapp.com/catalog/2026-2027/welcome', 'public', 'list_only', null),
  ('Calbright College Credit', 'none_found', null, 'not_found', 'none', null),
  ('Cañada College', 'none_found', null, 'not_found', 'none', null),
  ('Cerritos College', 'none_found', null, 'not_found', 'none', null),
  ('Cerro Coso Community College', 'none_found', null, 'not_found', 'none', null),
  ('Chabot College', 'curricunet', 'http://curricunet.com/chabot/search/course/', 'public', 'outline_with_slos', 'https://chabot.curriqunet.com/DynamicReports/AllFieldsReportByEntity/26?entityType=Course&reportId=347'),
  ('Chaffey College', 'curriqunet', 'https://chaffey.curriqunet.com/', 'public', 'outline', 'https://chaffey.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=225'),
  ('Citrus College', 'courseleaf_cim', 'https://nextcatalog.citruscollege.edu/courseadmin/', 'sign_in', 'sign_in', null),
  ('City College of San Francisco', 'none_found', null, 'not_found', 'none', null),
  ('Clovis Community College', 'none_found', null, 'not_found', 'none', null),
  ('Coalinga College', 'none_found', null, 'not_found', 'none', null),
  ('Coastline Community College', 'none_found', null, 'not_found', 'none', null),
  ('College of Alameda', 'curriqunet', 'https://coa.curriqunet.com/', 'public', 'outline', 'https://coa.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=314'),
  ('College of Marin', 'elumen', 'https://marin.elumenapp.com/catalog/current/home', 'public', 'list_only', null),
  ('College of San Mateo', 'none_found', null, 'not_found', 'none', null),
  ('College of the Canyons', 'none_found', null, 'not_found', 'none', null),
  ('College of the Desert', 'none_found', null, 'not_found', 'none', null),
  ('College of the Redwoods', 'elumen', 'https://redwoods.elumenapp.com/catalog/2026-2027/home', 'public', 'outline_with_slos', 'https://redwoods.elumenapp.com/catalog/2026-2027/course/aj1'),
  ('College of the Sequoias', 'none_found', null, 'not_found', 'none', null),
  ('College of the Siskiyous', 'elumen', 'https://siskiyous.elumenapp.com/catalog/cos26-27catalog/2026-27cataloghomepage', 'public', 'list_only', null),
  ('Columbia College', 'elumen', 'https://gocolumbia.elumenapp.com/catalog/2026-2027-Catalog/admissions/getting-started', 'public', 'outline', 'https://gocolumbia.elumenapp.com/catalog/2026-2027-Catalog/course/faq'),
  ('Compton College', 'none_found', null, 'not_found', 'none', null),
  ('Contra Costa College', 'elumen', 'https://ccc.elumenapp.com/catalog/ccc-2026-27/home', 'public', 'list_only', null),
  ('Copper Mountain College', 'curriqunet', 'https://cmccd.curriqunet.com/', 'refused', 'refused', null),
  ('Cosumnes River College', 'none_found', null, 'not_found', 'none', null),
  ('Crafton Hills College', 'curriqunet', 'https://craftonhills.curriqunet.com/', 'public', 'outline_with_slos', 'https://craftonhills.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=343'),
  ('Cuesta College', 'curriqunet', 'https://cuesta.curriqunet.com/', 'public', 'outline_with_slos', 'https://cuesta.curriqunet.com/DynamicReports/AllFieldsReportByEntity/7810?entityType=Course&reportId=441'),
  ('Cuyamaca College', 'none_found', null, 'not_found', 'none', null),
  ('Cypress College', 'none_found', null, 'not_found', 'none', null),
  ('De Anza College', 'elumen', 'https://deanza.elumenapp.com/catalog/2025-2026/', 'public', 'list_only', null),
  ('Diablo Valley College', 'elumen', 'https://dvc.elumenapp.com/catalog/DVC2026-2027Catalog/generalinformation', 'public', 'list_only', null),
  ('East Los Angeles College', 'none_found', null, 'not_found', 'none', null),
  ('El Camino College', 'none_found', null, 'not_found', 'none', null),
  ('Evergreen Valley College', 'curriqunet', 'https://evc.curriqunet.com/', 'public', 'outline', 'https://evc.curriqunet.com/Report/Course/GetReport/4953?reportId=41'),
  ('Feather River College', 'curriqunet', 'https://frc.curriqunet.com/', 'public', 'outline_with_slos', 'https://frc.curriqunet.com/DynamicReports/AllFieldsReportByEntity/6?entityType=Course&reportId=485'),
  ('Folsom Lake College', 'none_found', null, 'not_found', 'none', null),
  ('Foothill College', 'none_found', null, 'not_found', 'none', null),
  ('Fresno City College', 'curriqunet', 'https://fresno.curriqunet.com/', 'public', 'outline', 'https://fresno.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=238'),
  ('Fullerton College', 'none_found', null, 'not_found', 'none', null),
  ('Gavilan College', 'curriqunet', 'https://gavilan.curriqunet.com/', 'sign_in', 'sign_in', null),
  ('Glendale Community College', 'none_found', null, 'not_found', 'none', null),
  ('Golden West College', 'none_found', null, 'not_found', 'none', null),
  ('Grossmont College', 'none_found', null, 'not_found', 'none', null),
  ('Hartnell College', 'coursedog', 'https://hartnell.catalog.prod.coursedog.com/', 'public', 'list_only', null),
  ('Imperial Valley College', 'curriqunet', 'https://imperial.curriqunet.com/', 'public', 'outline', 'https://imperial.curriqunet.com/DynamicReports/AllFieldsReportByEntity/5688?entityType=Course&reportId=369'),
  ('Irvine Valley College', 'curriqunet', 'https://irvine.curriqunet.com/', 'public', 'outline', 'https://irvine.curriqunet.com/Report/Course/GetReport/1?reportId=191'),
  ('Lake Tahoe Community College', 'elumen', 'https://ltcc.elumenapp.com/catalog/2026-2027/about-this-catalog', 'public', 'list_only', null),
  ('Laney College', 'curriqunet', 'https://lan.curriqunet.com/', 'public', 'outline', 'https://lan.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=314'),
  ('Las Positas College', 'curriqunet', 'https://laspositas.curriqunet.com/', 'public', 'outline_with_slos', 'https://laspositas.curriqunet.com/DynamicReports/AllFieldsReportByEntity/4897?entityType=Course&reportId=347'),
  ('Lassen College', 'none_found', null, 'not_found', 'none', null),
  ('Lemoore College', 'elumen', 'https://westhillslemoore.elumenapp.com/catalog/26-27/Welcome', 'public', 'list_only', null),
  ('Long Beach City College', 'none_found', null, 'not_found', 'none', null),
  ('Los Angeles City College', 'none_found', null, 'not_found', 'none', null),
  ('Los Angeles Harbor College', 'none_found', null, 'not_found', 'none', null),
  ('Los Angeles Mission College', 'none_found', null, 'not_found', 'none', null),
  ('Los Angeles Pierce College', 'none_found', null, 'not_found', 'none', null),
  ('Los Angeles Southwest College', 'none_found', null, 'not_found', 'none', null),
  ('Los Angeles Trade Technical College', 'none_found', null, 'not_found', 'none', null),
  ('Los Angeles Valley College', 'none_found', null, 'not_found', 'none', null),
  ('Los Medanos College', 'elumen', 'https://lmc.elumenapp.com/catalog/26-27/art', 'public', 'outline_with_slos', 'https://lmc.elumenapp.com/catalog/26-27/course/art003'),
  ('Madera College', 'curriqunet', 'https://madera.curriqunet.com/', 'public', 'outline', 'https://madera.curriqunet.com/DynamicReports/AllFieldsReportByEntity/59?entityType=Course&reportId=504'),
  ('Mendocino College', 'none_found', null, 'not_found', 'none', null),
  ('Merced College', 'none_found', null, 'not_found', 'none', null),
  ('Merritt College', 'curriqunet', 'https://mc.curriqunet.com/', 'public', 'outline', 'https://mc.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=314'),
  ('MiraCosta College', 'none_found', null, 'not_found', 'none', null),
  ('Mission College', 'elumen', 'https://mission.elumenapp.com/catalog/24-25/cataloghome', 'public', 'list_only', null),
  ('Modesto Junior College', 'elumen', 'https://mjc.elumenapp.com/catalog/2026-2027/mjc-ge', 'public', 'list_only', null),
  ('Monterey Peninsula College', 'none_found', null, 'not_found', 'none', null),
  ('Moorpark College', 'none_found', null, 'not_found', 'none', null),
  ('Moreno Valley College', 'curriqunet', 'https://rccd.curriqunet.com/', 'public', 'outline_with_slos', 'https://rccd.curriqunet.com/Report/Course/GetReport/1?reportId=97'),
  ('Mt. San Antonio College', 'none_found', null, 'not_found', 'none', null),
  ('Mt. San Jacinto College', 'none_found', null, 'not_found', 'none', null),
  ('Napa Valley College', 'courseleaf_cim', 'https://nextcat.napavalley.edu/courseadmin', 'refused', 'refused', null),
  ('Norco College', 'curriqunet', 'https://rccd.curriqunet.com/', 'public', 'outline_with_slos', 'https://rccd.curriqunet.com/Report/Course/GetReport/1?reportId=97'),
  ('North Orange Continuing Education', 'none_found', null, 'not_found', 'none', null),
  ('Ohlone College', 'curricunet', 'http://www.curricunet.com/ohlone/', 'refused', 'refused', null),
  ('Orange Coast College', 'none_found', null, 'not_found', 'none', null),
  ('Oxnard College', 'none_found', null, 'not_found', 'none', null),
  ('Palo Verde College', 'elumen', 'https://pvc.elumenapp.com/catalog/2025-2026/presidents-welcome', 'public', 'outline_with_slos', 'https://pvc.elumenapp.com/catalog/2025-2026/course/acc100'),
  ('Palomar College', 'curriqunet', 'https://palomar.curriqunet.com/', 'public', 'outline_with_slos', 'https://palomar.curriqunet.com/DynamicReports/AllFieldsReportByEntity/1?entityType=Course&reportId=99'),
  ('Pasadena City College', 'courseleaf_cim', 'https://pasadena-next.courseleaf.com/courseadmin/', 'sign_in', 'sign_in', null),
  ('Porterville College', 'elumen', 'https://porterville.elumenapp.com/catalog/firstcatalog/aboutpc', 'public', 'list_only', null),
  ('Reedley College', 'curriqunet', 'https://reedley.curriqunet.com/', 'sign_in', 'sign_in', null),
  ('Rio Hondo College', 'curriqunet', 'https://riohondo.curriqunet.com/', 'public', 'outline', 'https://riohondo.curriqunet.com/DynamicReports/AllFieldsReportByEntity/195?entityType=Course&reportId=338'),
  ('Riverside City College', 'curriqunet', 'https://rccd.curriqunet.com/', 'public', 'outline_with_slos', 'https://rccd.curriqunet.com/Report/Course/GetReport/1?reportId=97'),
  ('Sacramento City College', 'none_found', null, 'not_found', 'none', null),
  ('Saddleback College', 'curriqunet', 'https://saddleback.curriqunet.com/', 'public', 'outline', 'https://saddleback.curriqunet.com/Report/Course/GetReport/1?reportId=191'),
  ('San Bernardino Valley College', 'none_found', null, 'not_found', 'none', null),
  ('San Diego City College', 'curriqunet', 'https://sdccd.curriqunet.com/', 'public', 'outline_with_slos', 'https://sdccd.curriqunet.com/DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=4'),
  ('San Diego College of Continuing Education', 'curriqunet', 'https://sdccd.curriqunet.com/', 'public', 'outline_with_slos', 'https://sdccd.curriqunet.com/DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=4'),
  ('San Diego Mesa College', 'curriqunet', 'https://sdccd.curriqunet.com/', 'public', 'outline_with_slos', 'https://sdccd.curriqunet.com/DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=4'),
  ('San Diego Miramar College', 'curriqunet', 'https://sdccd.curriqunet.com/', 'public', 'outline_with_slos', 'https://sdccd.curriqunet.com/DynamicReports/AllFieldsReportByEntity/18607?entityType=Course&reportId=4'),
  ('San Joaquin Delta College', 'none_found', null, 'not_found', 'none', null),
  ('San Jose City College', 'curricunet', 'https://sjcc.curricunet.com/', 'unreached', 'unreached', null),
  ('Santa Ana College', 'curriqunet', 'https://sac.curriqunet.com/', 'public', 'list_only', null),
  ('Santa Barbara City College', 'none_found', null, 'not_found', 'none', null),
  ('Santa Monica College', 'none_found', null, 'not_found', 'none', null),
  ('Santa Rosa Junior College', 'none_found', null, 'not_found', 'none', null),
  ('Santiago Canyon College', 'curriqunet', 'https://sac.curriqunet.com/', 'public', 'list_only', null),
  ('Shasta College', 'curriqunet', 'https://shasta.curriqunet.com/', 'public', 'outline_with_slos', 'https://shasta.curriqunet.com/DynamicReports/AllFieldsReportByEntity/6?entityType=Course&reportId=1'),
  ('Sierra College', 'none_found', null, 'not_found', 'none', null),
  ('Skyline College', 'none_found', null, 'not_found', 'none', null),
  ('Solano Community College', 'elumen', 'https://solano.elumenapp.com/public/', 'public', 'list_only', null),
  ('Southwestern College', 'none_found', null, 'not_found', 'none', null),
  ('Taft College', 'none_found', null, 'not_found', 'none', null),
  ('Ventura College', 'none_found', null, 'not_found', 'none', null),
  ('Victor Valley College', 'curriqunet', 'https://victorvalley.curriqunet.com/', 'public', 'outline', 'https://victorvalley.curriqunet.com/DynamicReports/AllFieldsReportByEntity/7049?entityType=Course&reportId=270'),
  ('West Los Angeles College', 'none_found', null, 'not_found', 'none', null),
  ('West Valley College', 'elumen', 'https://westvalley.elumenapp.com/public/', 'public', 'list_only', null),
  ('Woodland Community College', 'none_found', null, 'not_found', 'none', null),
  ('Yuba College', 'none_found', null, 'not_found', 'none', null)
) as v(college, system, url, access, k, proof)
where r.college = v.college
  and r.cor_checked_run is null;

select cor_access, count(*) from public.program_source_registry
where cor_checked_run = 'course-outline-census run 38305389870' group by 1 order by 1;

-- Rollback:
-- update public.program_source_registry set cor_system = null, cor_url = null, cor_access = null,
--   cor_proof_url = null, cor_prints_slos = null, cor_slo_source_url = null, cor_note = null,
--   cor_checked_run = null
-- where cor_checked_run = 'course-outline-census run 38305389870';

-- Applied 2026-10-12 (~22:05Z) as migration program_source_registry_course_outline_fill_2026_10_12: the
-- repo's Supabase guard routes an UPDATE to a shared table through apply_migration, the path Sam named on
-- Open Asks Sheet 70 card 1. Read back: 118 rows carry cor_checked_run 'course-outline-census run
-- 38305389870'; cor_access public 49, sign_in 6, refused 3, unreached 1, not_found 59; 18 print SLOs;
-- md5 over college and the eight fields in college order (C collation) d4f6455fb910545ac8e23ac962067326,
-- equal to kb/_course_outline_registry_fill.py's fields(); program_source_registry_history holds 118
-- prior rows under the run.
