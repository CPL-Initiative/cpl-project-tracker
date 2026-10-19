-- Annual Workplan Goals: descriptions drafted for the sub-activities that had none.
-- Procedure: kb/_draft_workplan_descriptions.py; the drafts and their sources:
-- kb/workplan_description_drafts.json. Sam, 2026-10-19: "take your best guess and I'll edit it".
-- Each UPDATE writes only where the description is still null, so a description typed
-- on the tab in the meantime wins. Sam edits the result on the Annual Workplan Goals tab.
--
-- ROLLBACK (each line clears only the draft this file wrote):
--   update public.projects set description = null where id = '4.7' and description = $d$A partnership with Public Works Alliance's EMS Corps, the five-month emergency medical technician program for young adults facing barriers to employment, now delivered with California community colleges under instructional service agreements. The work develops the CPL procedures that articulate the training and reach its graduates, beginning with the more than 500 alumni the Chancellor has committed to reach for credit toward paramedicine, fire technology and emergency management degrees.$d$;
--   update public.projects set description = null where id = '4.8' and description = $d$A partnership with Futuro Health to award credit for its behavioral healthcare training, beginning with the Human Touch Healthcare program, which holds an ACE credit recommendation of three lower-division units. The project builds the crosswalk from Futuro's programs to aligned courses at five priority colleges (Merritt, City College of San Francisco, North Orange Continuing Education, Sacramento City and Contra Costa) and the faculty articulations that let its scholars receive CPL toward health and behavioral health degrees.$d$;

-- 4.7: a best guess, marked for editing (drafted by S426 SkyTorreya, 2026-10-19).
update public.projects
   set description = $d$A partnership with Public Works Alliance's EMS Corps, the five-month emergency medical technician program for young adults facing barriers to employment, now delivered with California community colleges under instructional service agreements. The work develops the CPL procedures that articulate the training and reach its graduates, beginning with the more than 500 alumni the Chancellor has committed to reach for credit toward paramedicine, fire technology and emergency management degrees.$d$,
       updated_at = now()
 where id = '4.7'
   and description is null;

-- 4.8: a best guess, marked for editing (drafted by S426 SkyTorreya, 2026-10-19).
update public.projects
   set description = $d$A partnership with Futuro Health to award credit for its behavioral healthcare training, beginning with the Human Touch Healthcare program, which holds an ACE credit recommendation of three lower-division units. The project builds the crosswalk from Futuro's programs to aligned courses at five priority colleges (Merritt, City College of San Francisco, North Orange Continuing Education, Sacramento City and Contra Costa) and the faculty articulations that let its scholars receive CPL toward health and behavioral health degrees.$d$,
       updated_at = now()
 where id = '4.8'
   and description is null;

-- Read back: expect every id below with its draft.
select id, left(description, 80) as description from public.projects where id in ('4.7', '4.8') order by id;
