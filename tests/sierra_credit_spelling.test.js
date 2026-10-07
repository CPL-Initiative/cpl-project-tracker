// Sierra and the course list's two spellings of one college (S343).
//
// The course list spells two continuing-education colleges twice: "North Orange
// Continuing Education" and "... Credit", and San Diego College of Continuing
// Education the same (chatbox/build_program_courses.py, same_college). The Credit
// rows repeat the college's own courses. Unfolded, the S342 A/B answer to Sam's
// NOCE question read the duplicate as a second college "about 1 mile away", and
// the same answer called NOCE's Google IT Support program "a direct lead-in to
// industry certs like CompTIA A+, Network+", which no title names.
//
// The failures this guards: a "<college> Credit" heading in the offerings block,
// a course count doubled by the fold, a fold that eats a name with no base college
// (Calbright College Credit), and the program block losing its certification rule.
//
// Run from repo root: `npm test` (or `node tests/sierra_credit_spelling.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

let G = null, P = null, liftErr = null;
try {
  G = liftBlock(SRC, "// Proximity band for ranking", "// ── Live CPL contacts (v45",
    ["foldCreditSpelling", "buildOfferingsContext", "pickProspectivePairs", "proximityBand", "geoLabel"]);
  P = liftBlock(SRC, "// ── The courses a program lists, at the one college asked",
    "// ── Prospective credit: the courses a held credential could count toward",
    ["buildProgramCoursesContext"]);
} catch (e) { liftErr = e; }
check("the offerings and program blocks lift out of index.ts", !liftErr && G && P, liftErr && liftErr.message);

const NOCE = "North Orange Continuing Education";
const geo = { region: "Orange County", county: "Orange" };
// Shapes from coci_college_offerings, 2026-10-07: the Credit rows repeat NOCE's own
// courses with slightly smaller counts.
const ROWS = [
  { college: NOCE, top_code: "051400", top_title: "Office Technology/Office Computer Applications", course_count: 41, cid_count: 0,
    sample_courses: [{ code: "BMGR 455", title: "INTRO TO LEGAL STUDIES" }], ...geo },
  { college: NOCE + " Credit", top_code: "051400", top_title: "Office Technology/Office Computer Applications", course_count: 39, cid_count: 0,
    sample_courses: [{ code: "BMGR 455", title: "INTRO TO LEGAL STUDIES" }], ...geo },
  { college: NOCE + " Credit", top_code: "070100", top_title: "Information Technology, General", course_count: 14, cid_count: 0,
    sample_courses: [{ code: "BUSN 218", title: "USING A COMPUTER AS CREATIVE" }], ...geo },
  { college: "Calbright College Credit", top_code: "070100", top_title: "Information Technology, General", course_count: 6, cid_count: 0,
    sample_courses: [], region: null, county: null },
  { college: "Cypress College", top_code: "070100", top_title: "Information Technology, General", course_count: 9, cid_count: 1,
    sample_courses: [], ...geo }
];

if (G && P) {
  const geoMap = new Map([[NOCE, geo], [NOCE + " Credit", geo], ["Cypress College", geo], ["Calbright College Credit", {}]]);
  const f = G.foldCreditSpelling(ROWS, geoMap);
  const noce = f.filter((r) => r.college === NOCE);
  check("a <college> Credit row folds into its college", !f.some((r) => r.college === NOCE + " Credit"),
    f.map((r) => r.college).join(" | "));
  check("one row per program area, the larger count kept (never a doubled count)",
    noce.length === 2 && noce.find((r) => r.top_code === "051400").course_count === 41 &&
    noce.find((r) => r.top_code === "070100").course_count === 14, JSON.stringify(noce.map((r) => [r.top_code, r.course_count])));
  check("a Credit name whose base is no college stays as it is (Calbright College Credit)",
    f.some((r) => r.college === "Calbright College Credit"));
  check("the fold reaches the base through college_geo when the rows lack it",
    G.foldCreditSpelling([ROWS[2]], geoMap)[0].college === NOCE);
  check("the fold leaves its input untouched", ROWS[1].college === NOCE + " Credit");

  const ctx = G.buildOfferingsContext(ROWS, NOCE, geo, ["information", "office"], geoMap);
  check("the offerings block never names the Credit spelling as a college", !/Continuing Education Credit/.test(ctx), ctx.slice(0, 600));
  check("NOCE is still the asked college that teaches it", /### North Orange Continuing Education DOES teach/.test(ctx), ctx.slice(0, 600));
  check("NOCE's own count is not doubled", /teaches 55 course\(s\)/.test(ctx), ctx.slice(0, 600));

  const pairs = G.pickProspectivePairs(ROWS, ["information"], null, geo, geoMap);
  check("the prospective list never names the Credit spelling", !pairs.some((p) => /Continuing Education Credit/.test(p.college)),
    JSON.stringify(pairs.map((p) => p.college)));

  const block = P.buildProgramCoursesContext(NOCE, [
    { program_title: "Google IT Support Professional Pre-Apprenticeship", award: "Noncredit", status: "Active", matched_via: "title",
      control_number: "43318", list_size: 1, course_code: "CIST 100", course_title: "Information Technology (IT) Technical Support Fundamentals",
      units: 0, cid: null, course_college: null }], ["google"], null);
  check("the program block names a certification only where a title names it",
    /Name an industry certification .* only where a program title or a course title in this section names it/.test(block) &&
    /never say a program leads to, prepares for or covers a certification its titles do not name/.test(block), block.slice(0, 900));
}

let pass = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
  if (ok) pass++;
}
console.log("\nsierra_credit_spelling.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
