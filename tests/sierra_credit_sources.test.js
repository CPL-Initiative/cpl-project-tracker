// Sierra — the military split and the exhibits behind applied and transcribed
// credit (sheet 2026-09-30-sierra-credit-source, items 2, 4, 5 and 6).
//
// WHY THIS TEST EXISTS
// --------------------
// Sam asked Sierra for the breakdown of Chaffey's 19,405 applied units, then
// for the military and non-military split and for the exhibits and credit
// recommendations behind them. She had none of it. Worse, her one answer:
//   · counted the 1,206 articulated-but-waiting units inside "applied" AND
//     inside "not yet acted on", calling them separate pools;
//   · read "110 Standardized, 77 Credit by Exam" off the list of articulated
//     exhibits and implied that was where the units came from. By units,
//     Credit by Exam carried none of Chaffey's applied credit.
// And Sam's item 6 ruling: real totals for everyone, "<10" wherever fewer than
// 10 students stand behind a figure.
//
// So these guard the failure modes, calling the lifted functions for real:
//   1. applied means applied on the CPL plan; MAP's column is labeled as the
//      one that CONTAINS the waiting credit, never a separate pool;
//   2. a withheld figure reads "<10 students", never 0 and never "not published";
//   3. statewide totals are the REAL ones when the statewide row exists;
//   4. both buckets appear, non-military first;
//   5. the sources block speaks in units, lists recommendations, carries the
//      "<10 each" lines, and never lists a withheld exhibit's units;
//   6. the function reads the exhibit table for ONE college only.
//
// Run from repo root: `npm test` (or `node tests/sierra_credit_sources.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const { shapeCreditStatus, buildCreditContext } = liftBlock(
  SRC,
  "// Returns a CreditStatus (see the interface above)",
  "// Proximity band for ranking",
  ["shapeCreditStatus", "buildCreditContext", "fmtN"]
);

// ── Fixture: shaped like the live tables (Chaffey's proportions, round numbers)
const RAW = {
  summary: [
    { college_id: 9, students: 1500, suppressed: false, dormant_credits: "7000", articulated_waiting: "1200",
      applied_credits: "19000", transcribed_credits: "400", applied_in_plan: "17800",
      transcribed_student_view: "330", withheld: [] },
    // Published college whose transcribed figure is withheld (< 10 students behind it).
    { college_id: 4, students: 400, suppressed: false, dormant_credits: "9000", articulated_waiting: "300",
      applied_credits: "2500", transcribed_credits: null, applied_in_plan: "2200",
      transcribed_student_view: null, withheld: ["transcribed_credits", "transcribed_student_view"] },
  ],
  colleges: [
    { college_id: 9, college_name: "Chaffey College", entity_kind: "college" },
    { college_id: 4, college_name: "Example Valley College", entity_kind: "college" },
  ],
  goal2: [],
  load: [{ loaded_at: "2026-09-29 18:56:15+00" }],
  statewide: { scope: "college", colleges: 108, students: 50000, dormant_credits: "1250000",
    articulated_waiting: "75000", applied_credits: "246000", transcribed_credits: "82000",
    applied_in_plan: "162000", transcribed_student_view: "75000", colleges_withheld: { transcribed_credits: 18 } },
  buckets: [
    { scope: "statewide", college_id: 0, bucket: "military", dormant_credits: 1150000, articulated_waiting: 74800,
      students_applied: 17000, applied_in_plan: 69000, students_transcribed: 2900, transcribed: 16000,
      apprenticeship_in_plan: null, withheld: [] },
    { scope: "statewide", college_id: 0, bucket: "non_military", dormant_credits: 40000, articulated_waiting: null,
      students_applied: 15000, applied_in_plan: 93000, students_transcribed: 12600, transcribed: 59000,
      apprenticeship_in_plan: 8200, withheld: ["articulated_waiting"] },
    { scope: "college", college_id: 9, bucket: "military", dormant_credits: null, articulated_waiting: 1200,
      students_applied: 120, applied_in_plan: 670, students_transcribed: 19, transcribed: 70,
      apprenticeship_in_plan: null, withheld: ["dormant_credits"] },
    { scope: "college", college_id: 9, bucket: "non_military", dormant_credits: null, articulated_waiting: 0,
      students_applied: 1170, applied_in_plan: 17130, students_transcribed: 30, transcribed: 260,
      apprenticeship_in_plan: null, withheld: ["dormant_credits", "apprenticeship_in_plan"] },
  ],
};
const SOURCES = [
  { exhibit_id: "MAPSAS-AE-L3-1-001", is_rollup: false, title: "AP English - Literature and Composition",
    cpl_type: "Standardized Assessment", bucket: "non_military", students_applied: 436, applied_in_plan: 2616,
    students_transcribed: 0, transcribed: 0, withheld: [],
    credit_recs: [{ cr: "ENGL 1A — English Composition", applied_in_plan: 1308, transcribed: 0 },
                  { cr: "ENGL 1B — Literature", applied_in_plan: 1308, transcribed: 0 }] },
  { exhibit_id: "MAPSAS-ASLA7-1-001", is_rollup: false, title: "AP Spanish Language and Culture",
    cpl_type: "Standardized Assessment", bucket: "non_military", students_applied: 306, applied_in_plan: 2444,
    students_transcribed: null, transcribed: null, withheld: ["transcribed"],
    credit_recs: [{ cr: "SPAN 1", applied_in_plan: null, transcribed: null }] },
  // A thin exhibit: its units must never be printed.
  { exhibit_id: "AR-1715-1207", is_rollup: false, title: "Wheeled Vehicle Mechanic", cpl_type: "Military",
    bucket: "military", students_applied: null, applied_in_plan: null, students_transcribed: null,
    transcribed: null, withheld: ["applied_in_plan", "transcribed"], credit_recs: [{ cr: "AUTO 1" }] },
  { exhibit_id: "*military", is_rollup: true, exhibits_in_rollup: 86, exhibits_in_rollup_transcribed: 3,
    title: "Exhibits with fewer than 10 students each", cpl_type: null, bucket: "military",
    applied_in_plan: 670, transcribed: 70, withheld: [] },
  { exhibit_id: "*non_military", is_rollup: true, exhibits_in_rollup: 48, exhibits_in_rollup_transcribed: 36,
    title: "Exhibits with fewer than 10 students each", cpl_type: null, bucket: "non_military",
    applied_in_plan: 450, transcribed: 260, withheld: [] },
];

const cs = shapeCreditStatus(RAW, "Chaffey College");
cs.sources = SOURCES;
const ctx = buildCreditContext(cs);

// ── 1. applied on the plan leads; MAP's column contains the waiting credit ────
check("1 statewide leads with applied on the CPL plan", /Applied to students' CPL plans: 162,000 units/.test(ctx));
check("1 college leads with applied on the CPL plan", /Applied to students' CPL plans: 17,800 units/.test(ctx));
check("1 MAP's column is labeled as containing the waiting credit, never a separate pool",
  /MAP's Applied Credits column reads 19,000 units/.test(ctx) && /never present the two as separate pools/.test(ctx));

// ── 2. withheld reads <10, never zero ─────────────────────────────────────────
const ev = shapeCreditStatus(RAW, "Example Valley College");
const evCtx = buildCreditContext(ev);
check("2 a withheld transcribed figure reads <10 students", /transcribed: <10 students \(withheld\) units/.test(evCtx),
  "a NULL on a published row is withheld; it must say so");
check("2 …and never renders as 0 or as 'not published'",
  !/transcribed: 0 units/.test(evCtx) && !/transcribed: not published/.test(evCtx));
check("2 a withheld bucket figure reads <10 students", /recommended, not yet acted on <10 students \(withheld\)/.test(ctx));

// ── 3. real statewide totals ──────────────────────────────────────────────────
check("3 statewide totals come from the statewide row", cs.statewide.real === true && cs.statewide.appliedInPlan === 162000);
check("3 the context says the totals are real and include withheld colleges",
  /REAL totals: they include colleges whose own figure shows <10/.test(ctx));
check("3 without the statewide row, the older published-cell roll-up stands",
  shapeCreditStatus(Object.assign({}, RAW, { statewide: null }), null).statewide.real === false);

// ── 4. both buckets, non-military first ───────────────────────────────────────
const iNon = ctx.indexOf("- Non-military"), iMil = ctx.indexOf("- Military");
check("4 both buckets appear for the college", /applied on the CPL plan 17,130 units \(1,170 students\)/.test(ctx)
  && /applied on the CPL plan 670 units \(120 students\)/.test(ctx));
check("4 non-military is listed before military", iNon >= 0 && iMil > iNon);
check("4 statewide buckets appear", /Statewide by bucket:/.test(ctx) && /69,000/.test(ctx) && /93,000/.test(ctx));

// ── 5. the sources block ──────────────────────────────────────────────────────
check("5 the sources block is present", /WHERE CHAFFEY COLLEGE'S APPLIED AND TRANSCRIBED CREDIT COMES FROM/.test(ctx));
check("5 it gives totals by CPL type in units", /By CPL type[^\n]*Standardized Assessment 5,060 applied/.test(ctx));
check("5 it lists leading exhibits with units and students",
  /AP English - Literature and Composition \(Standardized Assessment\): 2,616 units applied, 436 students/.test(ctx));
check("5 it names credit recommendations with their units when published",
  /ENGL 1A — English Composition \(1,308 units\)/.test(ctx));
check("5 a withheld recommendation is named without units", /SPAN 1(?! \()/.test(ctx));
check("5 the '<10 each' lines carry the combined figures by bucket",
  /fewer than 10 students each \(military\): 86 exhibits, 670 units applied together; 3 exhibits, 70 units transcribed together/.test(ctx)
  && /fewer than 10 students each \(non-military\): 48 exhibits, 450 units applied together/.test(ctx));
check("5 a thin exhibit is never listed with units", !/Wheeled Vehicle Mechanic/.test(ctx),
  "a withheld exhibit carries no units, so it has no place in a units ranking");
check("5 a college under the floor gets no sources block",
  !/COMES FROM/.test(buildCreditContext(Object.assign(shapeCreditStatus(
    { ...RAW, summary: [{ college_id: 9, students: null, suppressed: true, withheld: [] }] }, "Chaffey College"),
    { sources: SOURCES }))));

// ── 6. source-level wiring ────────────────────────────────────────────────────
check("6 the exhibit table is read for one college only",
  /from\("map_college_exhibit_credit"\)[\s\S]{0,400}\.eq\("college_id", collegeId\)/.test(SRC));
check("6 the statewide and bucket tables ride in the credit fetch",
  /from\("map_college_credit_statewide"\)/.test(SRC) && /from\("map_college_credit_bucket"\)/.test(SRC));
check("6 the student grain is still never queried", !/from\("map_student_credit"\)/.test(SRC));
check("6 the rule forbids inferring a unit split from exhibit counts",
  /Never infer a split of units from counts of articulated exhibits/.test(SRC));
check("6 the rule splits the buckets and never discounts military credit",
  /never a reason to value military credit less/.test(SRC));

let fail = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ✓ " : "  ✗ ") + name + (ok || !why ? "" : "\n      " + why));
  if (!ok) fail++;
}
console.log(`sierra_credit_sources: ${results.length - fail}/${results.length} passed`);
if (fail) process.exit(1);
