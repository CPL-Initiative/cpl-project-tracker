// Sierra and the credit-disposition aggregates — what colleges have ACTED on.
//
// WHY THIS TEST EXISTS
// --------------------
// Until 2026-08-09 Sierra could say what CPL credit EXISTS and never what a
// college had DONE with it. The published aggregates (`map_college_credit_summary`,
// `map_college_goal2`) closed that gap. Three things about this wiring are easy
// to break and expensive to break:
//
// 1. THE NUMBERS MUST BE COMPUTED, NEVER HARDCODED. The project docs quote
//    1,052,531 dormant units; the published table sums to 1,051,870. The gap is
//    small-cell suppression working as designed (13 suppressed cells carry NULL
//    measures), and the 🎓 Course Credit tab has the same property because it
//    sums the same table. If a number is ever pasted into prompt text, Sierra and
//    the tab drift apart and one of them starts lying. So: roll up from the same
//    four objects the tab reads, and assert nothing is baked in.
//
// 2. SUPPRESSION MUST SURVIVE THE CHATBOT. A tab renders one view; Sierra answers
//    a sequence of questions over the same data. `adr-student-detail-aggregate-
//    disclosure-control` fixes the published grain at k=10 at WRITE time for
//    exactly this reason. This test asserts the context builder never emits a
//    suppressed college's figures — the last mile where it could still leak.
//
// 3. "NOT IN THE DATASET" IS NOT "ZERO". 111 of 128 entities have credit data.
//    Rendering a missing college as an absence reads as "this college has awarded
//    nothing," which is defamatory and false. It gets an explicit note.
//
// The pure functions are lifted out of the Deno source and CALLED, rather than
// re-implemented here — a re-implementation drifts and stops guarding anything.
// The prompt-rule checks are source-level, matching sierra_student_portal.test.js.
//
// Run from repo root: `npm test` (or `node tests/sierra_credit_disposition.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

const mod = liftBlock(
  SRC,
  "// Returns a CreditStatus (see the interface above)",
  "// Proximity band for ranking",
  ["shapeCreditStatus", "buildCreditContext", "fmtN"]
);
const { shapeCreditStatus, buildCreditContext } = mod;

// ── Fixture: shaped like the live tables, small enough to reason about ────────
// Two healthy colleges, one suppressed (thin), and a college_id present in
// map_colleges but absent from the summary.
const RAW = {
  summary: [
    { college_id: 1, students: 4626, suppressed: false, dormant_credits: "83656.00",
      articulated_waiting: "4593.00", applied_credits: "9247.50", transcribed_credits: "9225.50" },
    { college_id: 2, students: 897, suppressed: false, dormant_credits: "55654.00",
      articulated_waiting: "0.00", applied_credits: "2966.00", transcribed_credits: "0.00" },
    // Thin cell: k=10 suppression applied at write time — measures are NULL.
    { college_id: 3, students: null, suppressed: true, dormant_credits: null,
      articulated_waiting: null, applied_credits: null, transcribed_credits: null },
  ],
  colleges: [
    { college_id: 1, college_name: "San Diego Mesa College", entity_kind: "college" },
    { college_id: 2, college_name: "Coastline Community College", entity_kind: "college" },
    { college_id: 3, college_name: "Tiny Partner Institute", entity_kind: "partner" },
    { college_id: 9, college_name: "Calbright College", entity_kind: "college" },
  ],
  goal2: [
    { college_id: 1, dest: "COURSE", students: 2000, rows_n: 3000, suppressed: false },
    { college_id: 1, dest: "AREA", students: 900, rows_n: 1000, suppressed: false },
    { college_id: 2, dest: "COURSE", students: 400, rows_n: 500, suppressed: false },
    { college_id: 3, dest: "COURSE", students: null, rows_n: null, suppressed: true },
  ],
  load: [{ loaded_at: "2026-08-08 23:09:19.58695+00" }],
};

// ── 1. Statewide roll-up ─────────────────────────────────────────────────────
const st = shapeCreditStatus(RAW, null);
check("1 shapes a status object from raw rows", !!st);
check("1 counts only colleges present in the summary", st.collegesWithData === 3);
check("1 sums dormant credits across colleges", st.statewide.dormant === 83656 + 55654);
check("1 sums articulated-waiting", st.statewide.ready === 4593 + 0);
check("1 sums applied", st.statewide.applied === 9247.5 + 2966);
check("1 sums transcribed", st.statewide.transcribed === 9225.5 + 0);
check("1 sums students", st.statewide.students === 4626 + 897);
// 9225.5 / 12213.5 = 0.75536 → 75.5%
check("1 computes transcribed share", st.statewide.transcribedPct === 75.5);
check("1 stamps the load date", st.asOf === "2026-08-08");

// A suppressed row contributes NOTHING rather than coercing null to a number —
// this is precisely why the published total lands under the raw internal one.
check("1 suppressed rows do not corrupt the roll-up with NaN",
  Number.isFinite(st.statewide.dormant) && Number.isFinite(st.statewide.applied));

// Division-by-zero guard: the goal-2 formula divided by zero on the whole
// backlog in an earlier draft of this workstream. Never again.
const zeroApplied = shapeCreditStatus({
  ...RAW,
  summary: [{ college_id: 1, students: 5, suppressed: false, dormant_credits: "10",
    articulated_waiting: "0", applied_credits: "0", transcribed_credits: "0" }],
}, null);
check("1 transcribed share is null (not NaN/Infinity) when nothing is applied",
  zeroApplied.statewide.transcribedPct === null);

// ── 2. A named college ───────────────────────────────────────────────────────
const mesa = shapeCreditStatus(RAW, "San Diego Mesa College");
check("2 resolves a named college", mesa.college && mesa.college.name === "San Diego Mesa College");
check("2 carries that college's dormant credits", mesa.college.dormant === 83656);
check("2 carries articulated-waiting", mesa.college.ready === 4593);
check("2 carries its goal-2 rows", mesa.college.goal2.length === 2);
check("2 name match is case/whitespace insensitive",
  shapeCreditStatus(RAW, "  san diego MESA college ").college !== null);

const mesaCtx = buildCreditContext(mesa);
check("2 context names the college", /San Diego Mesa College/.test(mesaCtx));
check("2 context prints the dormant figure", /83,656/.test(mesaCtx));
check("2 context prints the already-articulated figure", /4,593/.test(mesaCtx));

// ── 3. Suppression must survive ──────────────────────────────────────────────
const thin = shapeCreditStatus(RAW, "Tiny Partner Institute");
check("3 flags the thin college as suppressed", thin.college && thin.college.suppressed === true);
const thinCtx = buildCreditContext(thin);
check("3 suppressed context states that activity exists", /Tiny Partner Institute/.test(thinCtx));
check("3 suppressed context says fewer than 10", /[Ff]ewer than 10/.test(thinCtx));
check("3 suppressed context instructs against estimating", /do not estimate/i.test(thinCtx));
// The property, not the flag: no per-college measure for the thin college may
// appear anywhere in its own section. `assert cell is None` passes on a broken
// implementation; this asserts nothing leaked into the rendered text.
const thinSection = thinCtx.slice(thinCtx.indexOf("At Tiny Partner Institute"));
check("3 suppressed college emits NO credit figures at all",
  !/\d[\d,]*\s+units/.test(thinSection));
check("3 suppressed college emits no student count",
  !/CPL students: [\d,]+/.test(thinSection));

// ── 4. Absent from the dataset is not zero ───────────────────────────────────
const absent = shapeCreditStatus(RAW, "Calbright College");
check("4 marks a college with no summary row", absent.collegeHasNoRow === true);
check("4 does not fabricate a college record", absent.college === null);
const absentCtx = buildCreditContext(absent);
check("4 context names the missing college", /Calbright College/.test(absentCtx));
check("4 context distinguishes absence from zero",
  /not in this dataset|no credit-disposition data/i.test(absentCtx)
  && /completely different statements/i.test(absentCtx));
check("4 context does not print a zero for it", !/Calbright College[^\n]*\b0\b/.test(absentCtx));

// A college that was never detected at all is NOT reported as missing.
check("4 no college asked → no missing-college note",
  !/no credit-disposition data/i.test(buildCreditContext(st)));

// ── 5. A failed read is not "no credit anywhere" ─────────────────────────────
check("5 null raw yields null status", shapeCreditStatus(null, null) === null);
check("5 null status yields EMPTY context, not a zeroed one",
  buildCreditContext(null) === "");
check("5 an empty summary yields null rather than a zero roll-up",
  shapeCreditStatus({ ...RAW, summary: [] }, null) === null);

// ── 6. Statewide context content ─────────────────────────────────────────────
const stCtx = buildCreditContext(st);
check("6 context leads with a Needs Action figure", /Needs Action/.test(stCtx));
check("6 context flags the already-articulated subset", /ALREADY ARTICULATED/.test(stCtx));
check("6 context states the as-of date", /as of 2026-08-08/.test(stCtx));
check("6 context reports goal-2 destinations", /COURSE/.test(stCtx) && /AREA/.test(stCtx));
check("6 context says how many colleges are covered", /3 colleges/.test(stCtx));

// ── 7. Numbers are computed, never hardcoded ─────────────────────────────────
// The single most important guard in this file. If a headline number is ever
// pasted into the function source, Sierra stops agreeing with the tab the moment
// Sam reloads the data.
const HARDCODED = /\b1[,_]?052[,_]?531\b|\b1[,_]?051[,_]?870\b|\b64[,_]?074\b|\b63[,_]?991\b/;
check("7 no headline credit total is hardcoded in the function source",
  !HARDCODED.test(SRC));
check("7 the roll-up reads map_college_credit_summary",
  /from\("map_college_credit_summary"\)/.test(SRC));
check("7 the roll-up reads map_college_goal2", /from\("map_college_goal2"\)/.test(SRC));
check("7 freshness comes from map_data_loads", /from\("map_data_loads"\)/.test(SRC));

// The reviewer-only student grain must never be read by this function.
check("7 the student-grain table is NEVER queried by the edge function",
  !/from\("map_student_credit"\)/.test(SRC));

// ── 8. Wiring ────────────────────────────────────────────────────────────────
check("8 fetchCreditData rides in the main Promise.all",
  /fetchCreditData\(sb\),/.test(SRC));
check("8 the per-college pick uses the resolved single profile",
  /shapeCreditStatus\(creditData, singleProfile\?\.college \|\| null\)/.test(SRC));
check("8 creditContext is passed to buildSystemPrompt",
  /teamGuidance \|\| "", creditContext\)/.test(SRC));
check("8 creditContext is interpolated into the system prompt",
  /\$\{offeringsContext\}\$\{creditContext\}/.test(SRC));
// The rule is dead weight (and confusing) when there is no data to talk about.
check("8 CREDIT_STATUS_RULE only ships when credit context is present",
  /\$\{creditContext \? CREDIT_STATUS_RULE : ""\}/.test(SRC));

// ── 9. The framing rule ──────────────────────────────────────────────────────
// Sam, 2026-08-09: transparency and truth, framed as opportunity rather than
// deficiency — colleges want to do this work and have not had the tools or data
// visibility until now. These assert the framing cannot silently revert.
function rule(name) {
  const m = SRC.match(new RegExp(`const ${name} = \`([\\s\\S]*?)\`;`));
  if (!m) throw new Error(`rule not found: ${name}`);
  return m[1];
}
const R = rule("CREDIT_STATUS_RULE");

check("9 rule leads with the already-articulated figure",
  /[Ll]ead with the ALREADY ARTICULATED/.test(R));
check("9 rule frames figures as opportunity, not deficiency",
  /OPPORTUNITY, never a deficiency/.test(R));
check("9 rule carries the visibility-gap premise, not indifference",
  /have not had the tools or the data visibility/.test(R));
check("9 rule states colleges WANT to do this work", /colleges WANT to do this work/.test(R));
check("9 rule forbids a report-card reading", /never a report card/i.test(R));

// Transparency half — the permission, which rots silently if it breaks.
check("9 rule requires stating real numbers plainly",
  /transparent and truthful/i.test(R) && /[Dd]o not round them away/.test(R));
check("9 rule names the next concrete step", /CPL coordinator or articulation officer/.test(R));

// Truthfulness guards.
check("9 rule carries the ~30% Not Applicable ceiling caveat",
  /30% of credit that gets reviewed is correctly ruled Not Applicable/.test(R));
check("9 rule says the total is a ceiling, not a debt", /CEILING, not a backlog/.test(R));
check("9 rule explains why totals sit below internal figures",
  /privacy suppression already applied/.test(R));
check("9 rule forbids estimating a suppressed value",
  /Never estimate a suppressed value/.test(R));
check("9 rule forbids recovering a suppressed value by subtraction",
  /subtracting from a total/.test(R));
check("9 rule separates 'not in dataset' from zero",
  /completely different statements and must never be blurred/.test(R));
check("9 rule forbids inventing a figure", /Never invent a figure/.test(R));

// Comparative questions: answered, but never as a league table.
check("9 rule permits comparative answers", /answer it/.test(R));
check("9 rule frames comparisons as opportunities", /biggest OPPORTUNITIES/.test(R));
check("9 rule forbids a best-to-worst ranking", /[Nn]ever present it as a ranking/.test(R));
check("9 rule forbids labelling colleges as lagging or failing",
  /never label colleges as lagging or failing/.test(R));
check("9 rule forbids volunteering a worst-performers list",
  /do not volunteer an unsolicited worst-performers list/.test(R));

// ── Report ───────────────────────────────────────────────────────────────────
let failed = 0;
for (const [name, ok] of results) {
  if (!ok) { failed++; console.log(`  ✗ ${name}`); }
}
console.log(`sierra_credit_disposition: ${results.length - failed}/${results.length} passed`);
if (failed > 0) process.exit(1);
