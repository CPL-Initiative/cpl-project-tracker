# -*- coding: utf-8 -*-
"""External (non-MAP) credentials, researched 2026-09-11.
VERIFICATION NOTE: every authoritative domain was BLOCKED at the network level for this
session (osfm.fire.ca.gov, caljac.org, dir.ca.gov, cslb.ca.gov, nwcg.gov, nccer.org,
acenet.edu, cccco.edu all refused connection — tested directly). Items below were reached
through domain-restricted search returning content extracted from the issuing body's own
pages, NOT by opening those pages. Each carries its status; nothing here is presented as
confirmed-by-fetch."""

EXTERNAL = {
 'Lineworker & utility field (NO credential exists)': dict(
   creds=['DAS Certificate of Completion of Apprenticeship (California, state-issued)',
          'ACE credit recommendation — electrical training ALLIANCE Outside Apprenticeship Program, 25 semester credits (year bundles 16 / 16 / 19)',
          'NCCER Power Line Worker — Level One core, plus Distribution / Transmission / Substation',
          'California-Nevada JATC Outside Lineman apprenticeship (IBEW/NECA), ~7,000 OJT hours'],
   urls=['https://www.dir.ca.gov/das/DAS_overview.html',
         'https://www.electricaltrainingalliance.org/training/collegeCredits',
         'https://www.nccer.org/craft-catalog/power-line-worker/',
         'https://calnevjatc.org/power-lineman/power-lineman-career/'],
   status='NOT fetched — domain blocked. Reached via domain-restricted search of the issuing bodies own pages.',
   note=('CORRECTION TO OUR 2026-09-09 STATEMENT. Six California Community Colleges run lineworker / powerline '
         'programs — College of the Desert, Imperial Valley, LA Trade-Technical, Mission, San Diego City and '
         'Santiago Canyon. Our earlier run reported no college pathway; that was a classifier miss (it did not '
         'match the word "Lineman"). The California lineworker CPL gap is therefore an ADOPTION gap, not a '
         'training gap: the training exists, the college programs exist, and ACE has already published a '
         '25-credit recommendation for the Outside Apprenticeship. Nobody in California has written it down as CPL.')),

 'Construction Electrician (IBEW / NCCER commercial / C-10)': dict(
   creds=['California State Electrician Certification — General Electrician (8,000 OJT hrs) / Residential Electrician (4,800)',
          'CSLB C-10 Electrical Contractor license (4 years journey-level experience)',
          'IBEW/NECA Inside Wireman apprenticeship (5 yr) · Residential Wireman (3 yr)',
          'ACE — etA Inside Apprenticeship up to 60 semester credits; Residential 17',
          'NCCER Electrical Levels 1-4', 'Electrician Trainee (ET) registration, DIR'],
   urls=['https://www.dir.ca.gov/dlse/ecu/1a.html','https://www.cslb.ca.gov/about_us/library/licensing_classifications/c-10_-_electrical.aspx',
         'https://www.electricaltrainingalliance.org/training/insideWireman',
         'https://www.electricaltrainingalliance.org/training/collegeCredits',
         'https://www.nccer.org/craft-catalog/electrical/','https://www.dir.ca.gov/dlse/ecu/electricaltrainee.htm'],
   status='NOT fetched — domains blocked. Hour figures and fees especially need confirming.',
   note=('The ACE recommendation on the Inside Apprenticeship (up to 60 credits) is the single largest external '
         'credit lever in the electrical lane and is not represented in MAP at all. CSLB treats apprenticeship '
         'completion as journey level, which is a direct hook for awarding against a DAS completion certificate.')),

 'Industrial & Substation Electrician (NCCER industrial)': dict(
   creds=['NCCER Industrial Electrician (assessment AENELEC08)','NCCER Industrial Maintenance Electrical & Instrumentation',
          'NCCER Power Generation Maintenance Electrician','DAS Certificate of Completion of Apprenticeship'],
   urls=['https://www.nccer.org/craft-catalog/industrial-maintenance-electrical-instrumentation/',
         'https://www.nccer.org/craft-catalog/power-generation-maintenance-electrician/','https://www.dir.ca.gov/das/'],
   status='NOT fetched — domain blocked. Exact issued-credential strings unconfirmed.', note=''),

 'Sound & Communications / VDV': dict(
   creds=['California State Electrician Certification — Voice Data Video Technician (4,000 OJT hrs)',
          'IBEW/NECA Installer-Technician apprenticeship (3 yr)',
          'ACE — etA Telecommunications Installer-Technician, 37 semester credits'],
   urls=['https://www.dir.ca.gov/dlse/ecu/1d.html','https://www.electricaltrainingalliance.org/training/installerTechnician',
         'https://www.electricaltrainingalliance.org/training/collegeCredits'],
   status='NOT fetched — domain blocked. VDV scope-of-work text not retrieved.',
   note='BICSI is the likely missing industry body for VDV and was not researched.'),

 'Instrumentation / Metering / Gas Control': dict(
   creds=['NCCER Instrumentation','NCCER Pipeline Electrical & Instrumentation'],
   urls=['https://www.nccer.org/craft-catalog/instrumentation/','https://www.nccer.org/craft-catalog/pipeline-electrical-instrumentation/'],
   status='NOT fetched — domain blocked.', note=''),

 'Wildland Fire (NWCG bundles)': dict(
   creds=['NWCG position qualifications (PMS 310-1) — S-130/S-190/S-230/S-290 etc.',
          'Interagency Wildland Firefighter Apprenticeship Program (WFAP)'],
   urls=['https://www.nwcg.gov/publications/pms310-1/nwcg-standards-for-wildland-fire-position-qualifications-pms-310-1',
         'https://www.nafri.gov/wfap'],
   status='NOT fetched — domain blocked.',
   note=('"Wildland Fire Fighter Specialist" — named in the request — appears NOWHERE in MAP (zero hits across '
         '2,903 exhibits, unified AND raw titles). Search results suggest it may be a FEDERAL registered-'
         'apprenticeship journey title under the US DOL / interagency WFAP rather than a Cal-JAC credential. '
         'UNCONFIRMED: do NOT name Cal-JAC as its issuer. Also: the statewide wildland recommendations name '
         'receiving courses "Wildland 101-105", which no college teaches under that name.')),
}
CALJAC_NOTE = (
 'Cal-JAC has exactly FIVE credentials in MAP, identified by issuer. Four are statewide; the fifth — Firefighter '
 'Journeyperson Certificate, the apprenticeship completion itself — is flagged Local, carries the HIGHEST potential-'
 'adopter count of the five (98 colleges), and has ZERO published credit-recommendation lines. Fourteen colleges have '
 'already made Cal-JAC credit determinations, which is a stronger conversation opener than an articulation agreement. '
 'DATA-QUALITY FLAG: a college-entered exhibit titled "Cal-JAC Fire Inspector Certificate" canonicalized to an SFT '
 'Fire Inspector 1 identity — a college attributed an SFT certification to Cal-JAC. Treated here as SFT; do not carry '
 'it as a sixth Cal-JAC credential.')
