# District profile, schema 1 (draft)

COBIx draft, Nov 12, 2026, for Sky and Sam. Read-only. Nothing is posted or applied.

**What it is.** It's one JSON record per California Community College district. The record says what systems the district runs and how credit for prior learning (CPL) moves between MAP and those systems. It's the starting file for a future district bot, and the map of where an API would save the most double entry. Files: `district_profile.schema.json` (the rules) and `example.json` (Los Angeles CCD, filled in).

## The six sections
1. **District.** Name, MIS district code, single or multi-college, and each college with its MAP CollegeID, its `program_source_registry` name (the key every harvest file uses), its short name and its MIS code. Filled from `kb/college_identity/<date>/crosswalk.json`.
2. **Systems.**
   - Student information system (SIS): Banner, Colleague, PeopleSoft Campus Solutions or other, with version and scope (district or college).
   - Curriculum system (CMS): CurriQunet META, eLumen, Coursedog, CourseLeaf CIM or other, plus its public view.
   - One catalog entry per college, with the same fields as the registry and the wave-scout contract: platform, URL, year, access, challenge, fallback hosts and registry disagreements.
3. **CPL coding.**
   - The district's CPL policy and its transcript-notation procedure.
   - Whether the transcript names the CPL type, and grading by type.
   - Local SIS codes crosswalked to MAP's CPL type codes (M, IC, SA, Cx, PR, O).
   - Who owns policy and posting, named by role only. Pointers say where contacts live (`map_college_contacts`, `college_contacts_harvest`).
   - The MAP integration state for the district and for each college: manual, batch upload, API, mixed, none or unknown.
4. **Data flows.** Each hop (MAP to SIS, SIS to MAP, CMS to catalog, catalog to our harvest, CMS to COCI) is marked manual, automated or unknown. A **redundant** flag marks a fact that gets keyed twice, and `api_candidate` marks a hop an API could replace. The ids are standard so flows can be compared across districts.
5. **Procedures.** Links to bot procedure docs, keyed by system and vendor. One eLumen procedure can then serve every eLumen district.
6. **Provenance.** Checked at, checked by, a source list, open questions and a change log.

**Rules.** Every fact carries its sources, a confidence and a checked-at time. Confidence uses Sam's three levels:
- **strong:** the district's or college's own current page, or the system's own host, read that day.
- **partial:** a repo record, a census row, or a sibling college.
- **limited:** secondhand or old.

An unknown is `null`, never a guess. Staff names and emails never go in the profile.

## The example: Los Angeles CCD
Most of it is backed by strong evidence.
- **SIS:** PeopleSoft Campus Solutions 9.2, district-wide (laccd.edu SIS FAQs and OIT overview).
- **CMS:** eLumen, district-wide (EPIE Curriculum Support; laccd.elumenapp.com answers 200).
- **Catalogs:** 6 colleges publish a PDF and 3 a web page (live registry, census of Nov 8).
- **CPL rules:** AP 4235 (revised Aug 15, 2024) requires the transcript to note CPL and its type. Credit by exam and portfolio are graded letter or Pass/No Pass. All other types are Pass/No Pass only. Military credit and standardized exams can be awarded automatically. The notation text is in AP 4230 Appendix A, which we haven't read yet, so the local codes are `null`.
- **MAP:** Pierce batch-uploads Cx, AP and IB credit already posted in the SIS (Sam, Nov 11). The other 8 colleges are unknown.
- **Redundancy:** Approved CPL is rekeyed from MAP into PeopleSoft. "Transcribed" is ticked again in MAP. Pierce enters its awards twice. Those are the three API targets.
- **Found along the way:** the registry's `cms_public_view` is empty for all 9 LACCD colleges, even though the eLumen view is public.

## Clusters already visible (live registry, 72 districts)
**Catalog platform, where the whole district uses one:**
- CourseLeaf: 20 districts (Coast, Ventura, North Orange, Grossmont-Cuyamaca, San Jose-Evergreen, Mt. SAC, Santa Barbara and others).
- PDF: 14 districts (Los Rios, Yuba, San Francisco, Glendale, Santa Clarita, Sonoma and others).
- CurriQunet: 13 districts (Peralta, Riverside, Chabot-Las Positas, South Orange, Palomar, Chaffey and others).
- eLumen: 8 districts (Contra Costa, Yosemite, Antelope Valley, Cabrillo, Marin, Redwoods, Siskiyou, Lake Tahoe).
- Acalog: 3 districts (El Camino, Palo Verde, San Joaquin Delta).
- Coursedog: 2 districts (Hartnell, Merced).
- Own web pages: 2 districts (San Mateo, Santa Monica). SmartCatalog: 1 district (West Kern).
- Mixed: 9 districts (LACCD, San Diego, State Center, Rancho Santiago, Kern, Foothill-De Anza, San Bernardino, West Hills, West Valley-Mission).

**Curriculum system, from a public view in the registry:**
- CurriQunet: 19 districts (30 colleges).
- eLumen: 11 districts.
- Coursedog: 2 districts.
- No public view recorded: 40 districts. This is not proof that they have none. LACCD's eLumen and San Jose City's CurriQunet are both missed.

**SIS:** the repo names no district's SIS. LACCD, from public pages, is the first. Statewide transcription training is organized around Banner, Colleague and PeopleSoft.

## Where it lives
- Profiles at `kb/district_profiles/<profile_id>.json`.
- The schema at `kb/district_profiles/district_profile.schema.json`.
- A test that validates every profile and checks that every college in the crosswalk lands in exactly one profile.
- Procedures at `docs/reference/district_procedures/<system>/<vendor>.md`, shared by vendor, not copied per district.
- Built from the registry and crosswalk on each census, and never hand-edited for fields those tables own. A person's correction wins, as in the registry.

## How bots grow into it
- **Phase 0, now:** a script fills the district and catalogs sections from the crosswalk and registry for all 72 districts. Everything else stays `null`.
- **Phase 1, scout and spot-check (read-only):** the wave bots already agreed with Sky keep the catalog entries fresh and file disagreements.
- **Phase 2, systems:** a bot reads public pages for the SIS and CMS, plus each district's CPL policy, and fills those sections with sources. It's still read-only and public-only.
- **Phase 3, CPL coding:** with a district contact, filled in with MAP and ITPI, a bot records the notation codes and the MAP integration state, and measures redundant hops using aggregates only.
- **Phase 4, APIs:** clusters that share a stack (for example PeopleSoft plus eLumen) get one connector design with MAP and ITPI, piloted in one district. Any write goes through Sky's pipeline and Sam.

## Settled (Nov 12, 2026)
**Sam's rulings** (`sam-district-profiles-vision-2026-11-12`, `sam-banner-pilot-citrus-2026-11-12`):
- 72 districts, plus Calbright as the 73rd (a noncredit outlier; its credit question is left aside).
- Pilots, one per SIS: Los Angeles CCD (PeopleSoft), Citrus (Ellucian Banner, single-college) and Riverside CCD (Ellucian Colleague).
- Staff by role only.

**Sky's answers on #3198:**
1. Repo files first, one JSON per district. A Supabase table waits for its first reader and loads from the files.
2. The district and catalog sections are generated from the crosswalk and `program_source_registry`, stamped with the census date, with a `--check` step.
3. Scout runs keep their own dated files under `kb/harvest_scouting/`. The builder folds the newest entry in as `registry_disagrees`, and the registry changes only by its own procedure.
4. The census probes for public curriculum views (eLumen, CurriQunet, Coursedog), robots first, and proposes values with evidence for one reviewed registry write.

## Still open
- Who at MAP or ITPI can confirm each college's integration state? Can we ask a district for its CPL notation codes?
