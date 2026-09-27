-- S295 (SkyHarbor), 2026-09-27, second checkpoint: Rule 8 ingest - five new rows, three status changes.
-- New: Sam's 2026-09-22 open-asks rulings (decision, human-verified), the CLAUDE.md verdicts landed
-- (milestone), the context meter at the root (procedure, proposed until a session's LIVE line reads yes),
-- a ruled card stays on the sheet until its lane marker goes (pitfall), and the August/September military
-- conflict (question). Status changes: two S295 rows promoted to verified now that their PRs merged; the
-- S295 pitfall `context-meter-silent-in-three-repo-sessions` superseded, explicitly, by the root install
-- (a session-sourced row, so Rule 8's human-row protection does not apply).
-- Rollback: delete from cpl_memory_log where actor = 'SkyHarbor-s295b';
--           delete from cpl_memory where author = 'SkyHarbor-s295b';
--           update cpl_memory set status = 'proposed', verified_by = null, verified_at = null
--             where slug in ('claude-md-prompt-audit-2026-09-27', 'esl-monthly-pass-procedure');
--           update cpl_memory set status = 'verified' where slug = 'context-meter-silent-in-three-repo-sessions';
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, verified_by, verified_at, event_date, author)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, x.verified_by,
       case when x.status = 'verified' then now() end, x.event_date::date, 'SkyHarbor-s295b'
from jsonb_to_recordset($json$[
 {"slug": "open-asks-2026-09-22-rulings", "kind": "decision", "event_date": "2026-09-22",
  "title": "Sam's rulings on the 2026-09-22 open-asks sheet (through card 18)",
  "summary": "Sam completed the 2026-09-22 open-asks sheet through card 18, so under his high-water rule these stand as proposed: re-mint the 31 ETHS physical-activity identities under the playbook, sessions write cross-lists before curators get a surface, ACE unit variants are one recommendation naming its range (1-3u), the typographic class is absorbed downstream, and SkyView narrows its phone opening.",
  "detail": "Read from the sheet's store (https://claude.ai/artifact/FTEhLfMxhRfv4YH6DGSPhn, replies + replies/done: through 18, ruled 2, as_proposed 19) on 2026-09-27 by S295. Cards 3-6, 11-15, 17 and 18 were executed or retired earlier. Cards 19-21 (the occupation-match queue, the 381 mojibake titles, GR register rows #2, #10, #16) were never reached and carry no verdict; they ride the 2026-09-27 sheet. Two further cards at or below the mark, the military not-a-topic class (auto-N/A) and subject-area granularity (merge empty qualifiers), contradict Sam's 2026-08-14 answers and are held as a question, see ace-august-answers-stand-until-sam-rules-2026-09-27. Card 7's note ends 'I think this should be a rule for all merges and mints. Advise'; the advice is card 5 of the 2026-09-27 sheet.",
  "plain": "Sam's answers from the 22 September decision sheet: which course identities get renumbered, who may add cross-listings, how military unit ranges are shown, and a narrower opening view on phones.",
  "tags": ["decision-sheet", "discipline-crosslist", "military-ace-cr", "skyview", "open-asks"],
  "source": "Sam's Complete on the 2026-09-22 open-asks sheet (through card 18); decision_sheets.md high-water rule",
  "status": "verified", "verified_by": "Sam (the sheet's reply store, read 2026-09-27)"},
 {"slug": "claude-md-cleanup-verdicts-landed-2026-09-27", "kind": "milestone", "event_date": "2026-09-27",
  "title": "The CLAUDE.md Cleanup sheet's eight verdicts landed the same day",
  "summary": "Sam's eight verdicts on the CLAUDE.md Cleanup sheet (2026-09-27, all as proposed) landed the same day: the context meter now installs at the session root through check_hooks_live.py --fix, the stale statements are corrected, the vault fixes only its own skills and merges CLAUDE.md by hand on update, and the warning marks stay on five rules; the knowledge base's fix waits on his merge.",
  "detail": "Tracker #1712 (card 1: install_prompt_guards.py writes the meter as a PostToolUse block, --meter-only adds it alone to a root whose guards are live, tests pin that the repair never widens the allow list; card 2: fresh SHEET_ID step; card 3: four stale statements; card 8: checkpoint step 11 narrows to the upstream skills) and #1713 (card 6: 114 phrases to sentence case, 34 warning marks to 4). Vault #185 (cards 4, 7, 8) and #186 (card 6's headings). cpl-knowledge-base #23 (card 5) is a draft for Sam's merge, as #17 was. Thread f438bc2d answered and resolved.",
  "plain": "Every change Sam approved to the Claude instruction files is in place, except one small fix in the public knowledge base that waits for him to merge it.",
  "tags": ["doctrine", "claude-md", "decision-sheet", "hooks", "context-pressure"],
  "source": "PRs #1712, #1713 (tracker), #185, #186 (vault), #23 (knowledge base)",
  "status": "verified", "verified_by": "merged PRs #1712, #1713, CPLBrain #185 and #186"},
 {"slug": "context-meter-installs-at-root-via-fix", "kind": "procedure", "event_date": "2026-09-27",
  "title": "The context meter installs at the session root through check_hooks_live.py --fix",
  "summary": "Since #1712, python3 scripts/check_hooks_live.py --fix installs Rule 9a's context meter at the session root of a three-repo session (install_prompt_guards.py --meter-only when the guards are already live), and its LIVE line reports 'context meter: yes' or 'NO'; where it reads NO, run python3 kb/_context_budget.py by hand.",
  "detail": "The meter grants no permission, so --fix may add it to a healthy root; guard and allow-list changes still wait for the environment snapshot rebuild. The environment's setup script runs the full installer, so a rebuilt snapshot carries the meter too. The first live confirmation is the next session's opening LIVE line. Supersedes context-meter-silent-in-three-repo-sessions.",
  "plain": "The automatic warning before a session runs out of memory now works in the usual cloud setup, installed by the check every session already runs first.",
  "tags": ["context-pressure", "rule-9", "hooks", "three-repo"],
  "source": "PR #1712; tests/install_prompt_guards_test.py (22 checks)",
  "status": "proposed", "verified_by": null},
 {"slug": "a-ruled-card-stays-on-the-sheet-until-its-lane-marker-goes", "kind": "pitfall", "event_date": "2026-09-27",
  "title": "A ruled card stays on the standing sheet until its lane's marker goes",
  "summary": "The open-asks builder demands a card for every lane carrying a NEEDS-SAM marker, so a verdict recorded anywhere but the lane leaves the question asked: five days after Sam answered them, seven cards still sat on the standing sheet, and four military questions answered on 2026-08-14 were asked again with two contrary proposals. Record the verdict in the lane and drop the marker in one change.",
  "detail": "Found 2026-09-27 (S295) when card 2 of the CLAUDE.md sheet unblocked the sheet's rebuild and the old store was read first. The military lane still read 'NEEDS SAM (4 questions)' after scope section 10 recorded the August answers; the 2026-09-22 proposals on the not-a-topic class and granularity contradicted those answers and Sam's untouched defaults let them through. Fixed in #1714 (lanes updated, fresh sheet https://claude.ai/artifact/5sWY4QCCDfkAegZtZrW1oe). Durable note: methodology-a-settled-ruling-does-not-enforce-itself.",
  "plain": "When Sam decides something, the note that says he still needs to decide it has to be removed at the same time, or he gets asked again.",
  "tags": ["decision-sheet", "open-asks", "doctrine", "governance"],
  "source": "PR #1714; docs/reference/decision_sheets.md",
  "status": "verified", "verified_by": "PR #1714 and the 2026-09-22 sheet's store"},
 {"slug": "ace-august-answers-stand-until-sam-rules-2026-09-27", "kind": "question", "event_date": "2026-09-27",
  "title": "Military CR: do Sam's August answers or the September defaults stand?",
  "summary": "Which answer stands on two military CR questions: the not-a-topic class (canonicalize every CR, Sam 2026-08-14, versus auto-N/A, the untouched 2026-09-22 default) and subject-area granularity (suggestion-only versus a rule folding empty qualifiers)? Cards 3 and 4 of the 2026-09-27 open-asks sheet ask with August proposed; until Sam answers, August stands.",
  "detail": "Sam's words 2026-08-14 (cpl_memory ace-not-a-topic-gets-canonical-crs): 'We still need a canonicalized CR for it to account for every CR in the corpus.' The 2026-09-22 cards never showed him the August answers, so an untouched default there is weaker evidence than his words (Rule 8). Scope: docs/military_cr_reference_scope.md section 10. When he answers, record it in the lane and section 10 in the same PR and drop the marker.",
  "plain": "Two military credit-recommendation questions got two different answers a month apart, and Sam is being asked which one he meant.",
  "tags": ["military-ace-cr", "decision-sheet", "open-asks", "rule-8"],
  "source": "cpl_memory ace-not-a-topic-gets-canonical-crs; the 2026-09-22 open-asks store; PR #1714",
  "status": "proposed", "verified_by": null}
]$json$::jsonb)
  as x(slug text, kind text, event_date text, title text, summary text, detail text, plain text, tags text[], source text, status text, verified_by text)
where not exists (select 1 from public.cpl_memory m where m.slug = x.slug);
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyHarbor-s295b', 'create', 'S295 second checkpoint', to_jsonb(m) from public.cpl_memory m
where m.slug in ('open-asks-2026-09-22-rulings', 'claude-md-cleanup-verdicts-landed-2026-09-27', 'context-meter-installs-at-root-via-fix', 'a-ruled-card-stays-on-the-sheet-until-its-lane-marker-goes', 'ace-august-answers-stand-until-sam-rules-2026-09-27')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
with before as (select id, to_jsonb(m) as b from public.cpl_memory m
                where slug in ('claude-md-prompt-audit-2026-09-27', 'esl-monthly-pass-procedure') and status = 'proposed'),
     upd as (update public.cpl_memory m set status = 'verified', verified_at = now(),
                    verified_by = case m.slug when 'claude-md-prompt-audit-2026-09-27' then 'merged PR #1708'
                                              else 'merged PR #1710' end
             from before where m.id = before.id returning m.id, to_jsonb(m) as a)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select upd.id, 'SkyHarbor-s295b', 'verify', 'its PR merged', before.b, upd.a from upd join before using (id);
with before as (select id, to_jsonb(m) as b from public.cpl_memory m
                where slug = 'context-meter-silent-in-three-repo-sessions' and status = 'verified'),
     upd as (update public.cpl_memory m set status = 'superseded'
             from before where m.id = before.id returning m.id, to_jsonb(m) as a)
insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select upd.id, 'SkyHarbor-s295b', 'supersede', 'superseded by context-meter-installs-at-root-via-fix (#1712); a session-sourced row', before.b, upd.a
from upd join before using (id);
select slug, status from public.cpl_memory
where slug in ('open-asks-2026-09-22-rulings', 'claude-md-cleanup-verdicts-landed-2026-09-27', 'context-meter-installs-at-root-via-fix',
               'a-ruled-card-stays-on-the-sheet-until-its-lane-marker-goes', 'ace-august-answers-stand-until-sam-rules-2026-09-27',
               'claude-md-prompt-audit-2026-09-27', 'esl-monthly-pass-procedure', 'context-meter-silent-in-three-repo-sessions')
order by 1;
