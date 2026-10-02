// Sierra's program-course route (S318, 2026-10-02): the courses a program LISTS
// at the one college asked, from coci_program_courses through the
// college_program_courses RPC — never the TOP-code proxy.
//
// Lifts the real block out of index.ts (tests/lib/lift_ts.js) and checks the
// failure modes it exists to prevent: a false absence before the key is loaded,
// "required" or a unit total in the rules, the asked program losing to a
// neighbour the matcher ranked higher, the college's own name steering the
// search, and the intent firing on a bare program question.
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SQL = fs.readFileSync("chatbox/supabase_college_program_courses.sql", "utf8");

let M = null;
block("lift", () => {
  M = liftBlock(FN, "// ── The courses a program lists, at the one college asked",
    "// ── Prospective credit: the courses a held credential could count toward",
    ["asksProgramCourses", "programTerms", "titleCoverage", "buildProgramCoursesContext",
     "PROGRAM_COURSES_LISTED", "PROGRAM_COURSES_PER_LIST"]);
});

const MTSAC = "Mt. San Antonio College";
function row(title, award, ctl, size, course) {
  return Object.assign({ program_title: title, award, status: "Active", matched_via: "title+code",
    control_number: ctl, list_size: size, course_code: null, course_title: null, units: null,
    cid: null, course_college: null }, course || {});
}

block("1. intent", () => {
  check("a course question fires", M.asksProgramCourses("What courses are in the LVN program at Mt. San Antonio College?"));
  check("'what do I need to take' fires", M.asksProgramCourses("what do I need to take for welding at Cerritos"));
  check("a bare program question does not fire",
    !M.asksProgramCourses("Does Cerritos College have a welding program?"));
  check("'discourse' is not 'course'", !M.asksProgramCourses("discourse analysis at Pasadena"));
});

block("2. program terms drop ask words and the college's own name", () => {
  const t = M.programTerms(["classes", "need", "welding", "cerritos"], "Cerritos College");
  check("welding survives; classes, need and cerritos go", JSON.stringify(t) === '["welding"]', JSON.stringify(t));
  const t2 = M.programTerms(["list", "fire", "technology", "degree", "santa", "ana"], "Santa Ana College");
  check("fire technology survives; list, degree, santa, ana go",
    JSON.stringify(t2) === '["fire","technology"]', JSON.stringify(t2));
});

block("3. before the key is loaded, nothing about courses renders", () => {
  const rows = [row("Vocational Nursing", "Noncredit program", null, null)];
  check("all controls null -> empty block", M.buildProgramCoursesContext(MTSAC, rows, ["lvn"]) === "");
});

block("4. a known program with no list is an absence in the data, not of courses", () => {
  const ctx = M.buildProgramCoursesContext(MTSAC, [row("Vocational Nursing", "Noncredit program", "42916", 0)], ["lvn"]);
  check("says the catalog data carries no course list", /carries no course list for this program/.test(ctx), ctx);
  check("forbids 'has no courses'", /never say the program has no courses/.test(ctx), ctx);
});

block("5. the lists render with the rules that keep them honest", () => {
  const rows = [
    row("Nursing- Licensed Vocational Nurse (LVN) to Registered Nurse (RN) Option", "A.S. Degree", "08086", 27,
      { course_code: "ANAT 35", course_title: "Human Anatomy", units: 5, cid: "BIOL 110 B" }),
    row("Nursing- Licensed Vocational Nurse (LVN) to Registered Nurse (RN) Option", "A.S. Degree", "08086", 27,
      { course_code: "NURS 114", course_title: "Maternal-Newborn Nursing", units: 4.5 }),
    row("Kinesiology", "A.A. Degree", "11111", 1,
      { course_code: "MAT 12", course_title: "Statistics", units: 1, course_college: "Norco College" }),
  ];
  const ctx = M.buildProgramCoursesContext(MTSAC, rows, ["lvn", "kinesiology"]);
  check("a course line carries number, title, units and C-ID",
    ctx.includes("  - ANAT 35 — Human Anatomy (5 units) [C-ID BIOL 110 B]"), ctx);
  check("fractional and singular units read right",
    ctx.includes("(4.5 units)") && ctx.includes("(1 unit)"), ctx);
  check("a sister college's course names that college", ctx.includes("(a Norco College course)"), ctx);
  check("the list says how many it left out", /and 25 more course\(s\) the program lists/.test(ctx), ctx);
  check("the rules forbid 'required' and a unit total",
    /never call a course required and never add up the units/.test(ctx), ctx);
  check("the block says catalog data and its date, never COCI",
    /catalog data, as of July 2026/.test(ctx) && !/COCI/.test(ctx), ctx);
});

block("6. the visitor's words outrank the matcher's loose order inside one college", () => {
  // search_college_programs order at Mt. SAC for "lvn vocational nursing" (live, 2026-10-02):
  // LVN-to-RN 1, CNA 2, RN Generic 3, LPT-to-RN 4, Vocational Nursing 5.
  const order = ["Nursing- Licensed Vocational Nurse (LVN) to Registered Nurse (RN) Option",
    "Certified Nursing and Acute Care Nursing Assistant", "Nursing - Registered Nursing (RN) Generic Option",
    "Nursing- Licensed Psychiatric Technician (LPT) to Registered Nurse (RN) Option", "Vocational Nursing"];
  const rows = order.map((t, i) => row(t, "x", String(100 + i), 1, { course_code: "C " + i, course_title: "T" }));
  const terms = ["lvn", "practical nursing", "vocational nursing"];
  const ctx = M.buildProgramCoursesContext(MTSAC, rows, terms);
  const shown = ctx.split("\n").filter((l) => l.startsWith("### ")).map((l) => l.slice(4));
  check("Vocational Nursing is listed among the first three",
    shown.some((s) => s.startsWith("Vocational Nursing")), JSON.stringify(shown));
  check("exactly three lists, the rest named", shown.length === M.PROGRAM_COURSES_LISTED
    && /Other matching programs at Mt\. San Antonio College/.test(ctx), JSON.stringify(shown));
  check("a term matches at a word start only ('nurs' in 'nursery' is no 'lvn')",
    M.titleCoverage("Nursery Management", ["lvn", "vocational nursing"]) === 0);
});

block("7. the SQL reuses the one program matcher", () => {
  check("college_program_courses calls search_college_programs",
    /from public\.search_college_programs\(search_terms, p_college, 40\)/.test(SQL));
  check("no definer function (reads as the caller)", !/security definer/i.test(SQL));
  check("a null control yields a null list_size",
    /case when l\.control_number is null then null else l\.n::integer end as list_size/.test(SQL));
});

block("8. wired in the handler behind the intent and one college", () => {
  check("the handler calls the route only for one college and a course question",
    /if \(singleProfile\?\.college && asksProgramCourses\(routeText\)\)/.test(FN));
  check("the block appends to the program context",
    /programsContext \+= buildProgramCoursesContext\(/.test(FN));
});

const failed = results.filter((r) => !r[1]);
for (const [name, ok, why] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !why ? "" : " — " + String(why).slice(0, 400)}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
