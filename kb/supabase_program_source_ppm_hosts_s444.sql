-- supabase_program_source_ppm_hosts_s444.sql — records the Program Pathways Mapper
-- hosts Sam supplied for the colleges whose registry row names no map host.
--
-- Sam, 2026-10-21, pasted programmapper.org/ppm-schools: "here is a list of PPM
-- colleges I pulled from their website", and "some PPM institutions are not
-- CCCs--don't need to worry about them". The list names 63 community colleges;
-- the registry already held a host for 26. This writes the 37 rows whose
-- sequence_host and sequence_note are both empty, and never a row that holds a
-- host: six list a second host for a mapper that refused the reader (Canada,
-- Canyons, Las Positas, LA Harbor, LA Mission, Oxnard), and asking that one
-- would retry a refusal another way (Sam, open-asks sheet 29 card 3).
--
-- Only sequence_host and sequence_note change, which the census never writes;
-- the row's corrected fields and the census's own fields stay as they are. The
-- table's trigger files each prior row in program_source_registry_history.
-- Rollback (Rule 10 a2): every prior value was null, so
--   update public.program_source_registry set sequence_host = null, sequence_note = null
--    where sequence_note like 'Listed as a Program Pathways Mapper member at programmapper.org/ppm-schools (supplied by Sam, 2026-10-21%';
with v(college, host) as (values
('Bakersfield College','programmap.bakersfieldcollege.edu'),
('Berkeley City College','berkeley-city.programmapper.com'),
('Cañada College','programmapper.canadacollege.edu'),
('Cerritos College','programmap.cerritos.edu'),
('Chabot College','chabot.programmapper.com'),
('Chaffey College','programmap.chaffey.edu'),
('Clovis Community College','programmap.cloviscollege.edu'),
('Coalinga College','programmapper.coalingacollege.edu'),
('Coastline Community College','programmap.coastline.edu'),
('College of San Mateo','programmap.collegeofsanmateo.edu'),
('College of the Canyons','programmap.canyons.edu'),
('Compton College','programmap.compton.edu'),
('Contra Costa College','mypath.contracosta.edu'),
('Cuesta College','programmap.cuesta.edu'),
('Cypress College','programmap.cypresscollege.edu'),
('De Anza College','program-maps.deanza.edu'),
('East Los Angeles College','programmap.elac.edu'),
('El Camino College','programmap.elcamino.edu'),
('Evergreen Valley College','programmap.evc.edu'),
('Foothill College','foothill.programmapper.com'),
('Fullerton College','pathways.fullcoll.edu'),
('Gavilan College','gavilan.programmapper.com'),
('Glendale Community College','programmap.glendale.edu'),
('Golden West College','programmap.goldenwestcollege.edu'),
('Hartnell College','pm.hartnell.edu'),
('Imperial Valley College','programmap.imperial.edu'),
('Lake Tahoe Community College','programmap.ltcc.edu'),
('Laney College','mapsforsuccess.laney.edu'),
('Las Positas College','programmap.laspositascollege.edu'),
('Lemoore College','programmap.lemoorecollege.edu'),
('Long Beach City College','programmap.lbcc.edu'),
('Los Angeles City College','programmap.lacitycollege.edu'),
('Los Angeles Harbor College','programmapper.lahc.edu'),
('Los Angeles Mission College','programmap.lamission.edu'),
('Los Angeles Pierce College','programmapper.piercecollege.edu'),
('Los Angeles Southwest College','programmap.lasc.edu'),
('Los Angeles Trade Technical College','programmap.lattc.edu'),
('Los Angeles Valley College','programmap.lavc.edu'),
('Madera College','programmap.maderacollege.edu'),
('Merced College','merced.programmapper.com'),
('Mission College','programmaps.missioncollege.edu'),
('Modesto Junior College','programmap.mjc.edu'),
('Moorpark College','programmap.moorparkcollege.edu'),
('Orange Coast College','programmap.orangecoastcollege.edu'),
('Oxnard College','oxnard.programmapper.com'),
('Palomar College','programmap.palomar.edu'),
('Pasadena City College','pasadena-city.programmapper.ws'),
('Porterville College','pathwaysmap.portervillecollege.edu'),
('Reedley College','programmap.reedleycollege.edu'),
('Saddleback College','learningpathways.saddleback.edu'),
('San Diego Miramar College','san-diego-miramar.programmapper.com'),
('San Joaquin Delta College','programmap.deltacollege.edu'),
('San Jose City College','jaguarspot.sjcc.edu'),
('Santa Barbara City College','degree-map.sbcc.edu'),
('Santa Rosa Junior College','programmap.santarosa.edu'),
('Sierra College','programmap.sierracollege.edu'),
('Skyline College','programmapper.skylinecollege.edu'),
('Ventura College','programmap.venturacollege.edu'),
('West Los Angeles College','programmap.wlac.edu'),
('West Valley College','programmapper.westvalley.edu')
)
update public.program_source_registry r
   set sequence_host = v.host,
       sequence_note = 'Listed as a Program Pathways Mapper member at programmapper.org/ppm-schools (supplied by Sam, 2026-10-21; recorded by S444 SkyBlueOak). Not yet asked: the reader asks this host''s front page once a run, keeps its name, and never retries a refusal another way (Sam, open-asks sheet 29 card 3, 2026-10-04).'
  from v
 where r.college = v.college and r.sequence_host is null and r.sequence_note is null;
