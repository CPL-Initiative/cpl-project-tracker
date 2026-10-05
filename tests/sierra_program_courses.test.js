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
     "PROGRAM_COURSES_LISTED", "PROGRAM_COURSES_PER_LIST", "requirementLines", "fmtAmount", "courseKey"]);
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
  // The S319 A/B: the old rule ("honors versions and alternatives appear side by
  // side") came back as "side by side rather than as substitutes you'd choose
  // between", which tells a student to take ENGL C1000 and C1000H both.
  check("the rules say a student takes one course of each honors pair",
    /a student takes one course of each honors pair/.test(ctx), ctx);
  check("the rules route alternatives to the catalog or a counselor",
    /look like alternatives, say the catalog or a counselor confirms which ones count/.test(ctx), ctx);
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

// Sam, open-asks sheet 29 card 4 (2026-10-04, "yes"): a program whose record
// passed all four checks renders as CATALOG REQUIREMENTS, and Sierra may say
// required and give the total the catalog prints. Every other program keeps
// "lists". The records are the harvest's own files, rendered for real here.
const RECDIR = "kb/program_requirements_pilot/records/";
function recOf(key) {
  const d = JSON.parse(fs.readFileSync(RECDIR + key + ".json", "utf8"));
  const src = JSON.parse(fs.readFileSync(d.source_file, "utf8"));
  const p = d.record.program;
  return { d, src, rec: { control_number: d.control_number, catalog_year: src.catalog_year, measure: p.measure,
    total_min: (p.total_units || {}).min, total_max: (p.total_units || {}).max, record: d.record } };
}
function rowsOf(src, ctl) {
  return src.closed_list.map((c) => row(src.title, src.award, ctl, src.closed_list.length,
    { course_code: c.code, course_title: c.title, units: c.units }));
}

block("10. a checked record renders the catalog's rules, and only for its own program", () => {
  const { d, src, rec } = recOf("cerritos_42158");          // Ironworker: an option group, a range total
  const other = row("Welding Technology", "A.S. Degree", "99999", 1, { course_code: "WELD 100", course_title: "Welding I", units: 3 });
  const rows = rowsOf(src, d.control_number).concat([other]);
  const ctx = M.buildProgramCoursesContext("Cerritos College", rows, ["ironworkers", "welding"],
    new Map([[d.control_number, rec]]));
  check("the checked program is marked, naming the catalog and its year",
    ctx.includes("CATALOG REQUIREMENTS, from Cerritos College's 2026-2027 catalog"), ctx);
  check("the option group renders once, as one choice among its options",
    (ctx.match(/Complete ONE of these 2 options \(Reinforcing or Structural option\)/g) || []).length === 1
    && (ctx.match(/Option 2: Structural Program/g) || []).length === 1, ctx);
  check("the total is the one the catalog prints, as a range",
    ctx.includes("Program total, as the catalog prints it: 34-38 units."), ctx);
  check("the rule permits 'required' and the printed total for the marked program only",
    /A program marked CATALOG REQUIREMENTS/.test(ctx) && /never add units up yourself/.test(ctx), ctx);
  check("every other program keeps 'lists'",
    /Every other program below only LISTS its courses/.test(ctx) && ctx.includes("  - WELD 100 — Welding I (3 units)"), ctx);
  check("a course in the record carries its title from the state list",
    /IWAP 40\.07 — \S/.test(ctx), ctx);
});

block("11. without a checked record, nothing changes", () => {
  const { d, src } = recOf("cerritos_42158");
  const ctx = M.buildProgramCoursesContext("Cerritos College", rowsOf(src, d.control_number), ["ironworkers"]);
  check("no marker", !/CATALOG REQUIREMENTS/.test(ctx), ctx);
  check("the old rule stands word for word",
    /never call a course required and never add up the units/.test(ctx), ctx);
  const elsewhere = M.buildProgramCoursesContext("Cerritos College", rowsOf(src, d.control_number), ["ironworkers"],
    new Map([["00000", recOf("cerritos_42158").rec]]));
  check("a record for a program not shown marks nothing", !/CATALOG REQUIREMENTS/.test(elsewhere), elsewhere);
});

block("12. the record's own shapes read right", () => {
  const { rec } = recOf("mtsac_42916");                    // Vocational Nursing: the catalog prints no total
  check("no printed total says so and forbids adding one",
    /The catalog prints no program total\. Say so; never add one up\./.test(M.requirementLines(rec, new Map())));
  const pub = recOf("cerritos_45549").rec;                  // Public Health: choose blocks, alternatives
  const lines = M.requirementLines(pub, new Map([["HO102", "Introduction to Public Health"]]));
  check("a choose block carries the catalog's words and the rule",
    lines.includes("List A (Select one course for 4-5 units) [choose 1 course; the catalog prints 4-5 units]"), lines);
  check("alternatives join with 'or' and carry their own titles",
    lines.includes("or HO 102 — Introduction to Public Health"), lines);
  check("hours read as hours", M.fmtAmount(136, 136, "hours") === "136 hours");
  check("a course number matches across spacing", M.courseKey("ANAT 10A") === M.courseKey("anat-10a"));
});

block("13. the read is of checked records only, end to end", () => {
  const RSQL = fs.readFileSync("chatbox/supabase_program_requirement_records.sql", "utf8");
  check("the public read policy shows checked rows only", /for select to anon, authenticated using \(checked\)/.test(RSQL));
  check("index.ts asks for checked rows by college and control number",
    /\.from\("program_requirement_records"\)[\s\S]{0,200}\.eq\("college", college\)\.eq\("checked", true\)\.in\("control_number", controls\)/.test(FN));
  check("the handler passes the records into the block",
    /const reqs = await fetchCheckedRequirements\(singleProfile\.college, listRows, sb\);/.test(FN)
    && /singleProfile\.college\)\), reqs\);/.test(FN));
  const { execFileSync } = require("child_process");
  let out = "";
  try { out = execFileSync("python3", ["kb/_program_requirements_load.py", "--check"], { encoding: "utf8" }); }
  catch (e) { out = String(e.stdout || e.message); }
  check("the committed load matches the record files", /current \(20 records\)/.test(out), out);
  const LOAD = fs.readFileSync("kb/receipts/program_requirement_records_load_2026-10-04.sql", "utf8");
  check("all 20 pilot records load checked", /\(20 records, 20 checked\)/.test(LOAD));
});

block("9. smoke mode 7l asks what index.ts would build", () => {
  const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");
  const V = liftBlock(FN, "const TOPIC_SYNONYMS", "// ── Topic-based exhibit search",
    ["extractTopicKeywords", "expandWithSynonyms"]);
  const college = (SMOKE.match(/^PL_COLLEGE='([^']+)'/m) || [])[1];
  const q = (SMOKE.match(/^PL_QUESTION='([^']+)'/m) || [])[1];
  const terms = (SMOKE.match(/^PL_TERMS='([^']+)'/m) || [])[1];
  check("7l pins its college, question and terms", !!college && !!q && !!terms);
  if (!college || !q || !terms) return;
  check("the 7l question names the 7l college", q.includes(college));
  check("the 7l question fires the course intent", M.asksProgramCourses(q));
  const derived = V.expandWithSynonyms(M.programTerms(V.extractTopicKeywords(q), college));
  check("⭐ PL_TERMS is what index.ts builds for the 7l question",
    JSON.stringify(derived) === JSON.stringify(JSON.parse(terms)),
    "index.ts builds " + JSON.stringify(derived) + " — re-derive the smoke literal");
  check("index.ts reads 8 programs and PROGRAM_COURSES_PER_LIST courses",
    /program_limit: 8,\s*course_limit: PROGRAM_COURSES_PER_LIST,/.test(FN) && M.PROGRAM_COURSES_PER_LIST === 40);
  const CODE = SMOKE.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
  check("7l calls the RPC with the same limits", /"program_limit":8,"course_limit":40/.test(CODE));
  check("7l asks the question of the function", /run "7l program course list/.test(CODE));
  check("7l asserts a course outside nursing, by number", /7l ⭐ names a course the LVN-to-RN program lists outside nursing/.test(CODE));
});

// S327: the ROEP display facts (kb/_build_roep_display.py) ride the checked
// record. Sierra quotes them and computes nothing; the page reads the same build
// from cpl_pathways_roep_data.js, so these checks render the page's own file.
global.window = global.window || {};
require("../cpl_pathways_roep_data.js");
const ROEP = global.window.CPL_PATHWAYS_ROEP;
function withDisplay(key) {
  const x = recOf(key);
  const p = ROEP.programs.find((q) => q.key === key);
  return Object.assign({}, x, { rec: Object.assign({}, x.rec, { display: p.display }), p });
}

block("14. the display facts render on a checked program, quoted, never recomputed", () => {
  const { d, src, rec, p } = withDisplay("cerritos_42158");
  const ctx = M.buildProgramCoursesContext("Cerritos College", rowsOf(src, d.control_number), ["ironworkers"],
    new Map([[d.control_number, rec]]));
  check("a course with CPL here names its credential on its own line",
    /IWAP 40\.07 — [^\n]*\(4 units\) \[CPL here: FIW Orientation\]/.test(ctx), ctx);
  check("the figure is the page's: up to 31.5 of the 34-38 units the catalog prints",
    p.display.figure.up_to === 31.5
    && ctx.includes("CPL figure: up to 31.5 units of the 34-38 units the catalog prints can be met through CPL Cerritos College has articulated"), ctx);
  check("the recommended-path figure reads TBA while no map is read",
    ctx.includes("Recommended-path figure: TBA. No pathway map has been read for this program."), ctx);
  check("the map line says no map was found", /Term-by-term map: no term-by-term program map found/.test(ctx), ctx);
  check("the rules name the three kinds and keep the leads leads",
    /marked "CPL here" is credit for prior learning Cerritos College has articulated/.test(ctx)
    && /never say a learner will receive that credit at Cerritos College/.test(ctx)
    && /Give the figure as the line states it; never compute another/.test(ctx), ctx);
  check("a reader's working note never reaches Sierra", !/Reader's note|URL slug reads/.test(ctx), ctx);

  const rv = withDisplay("riverside_31456");
  const rctx = M.buildProgramCoursesContext("Riverside City College", rowsOf(rv.src, rv.d.control_number), ["justice"],
    new Map([[rv.d.control_number, rv.rec]]));
  // S332: ADJ-3's identity is now C-ID AJ 120 (the live CCR), so its leads span every college
  // on that C-ID; Norco's Criminal Law (the S327 pin) is fifth of five, past the four shown.
  check("a could-adopt lead names the credential and the college that articulated it",
    /ADJ-3 — [^\n]*could adopt: Basic Correctional Officer Academy at Bakersfield College, /.test(rctx), rctx);

  const mi = withDisplay("miramar_41496");
  const mctx = M.buildProgramCoursesContext("San Diego Miramar College", rowsOf(mi.src, mi.d.control_number), ["business"],
    new Map([[mi.d.control_number, mi.rec]]));
  check("a catalog and state-file difference is the college's to reconcile",
    mctx.includes("Catalog and state file differ (San Diego Miramar College's to reconcile): The state's Program Course File lists ECON 120"), mctx);

  // S335: a MAP articulation that names a second course is the college's too, under its own name.
  const en = withDisplay("miramar_35030");
  const ectx = M.buildProgramCoursesContext("San Diego Miramar College", rowsOf(en.src, en.d.control_number), ["entrepreneurship"],
    new Map([[en.d.control_number, en.rec]]));
  check("a second course MAP names is labeled as that, never as a catalog difference",
    ectx.includes("MAP names a second course (San Diego Miramar College's to reconcile): MAP lists AUTO 156G")
    && !/Catalog and state file differ[^\n]*MAP lists AUTO 156G/.test(ectx), ectx);
});

block("15. without display facts the block is unchanged, and the read asks for them", () => {
  const { d, src, rec } = recOf("cerritos_42158");
  const ctx = M.buildProgramCoursesContext("Cerritos College", rowsOf(src, d.control_number), ["ironworkers"],
    new Map([[d.control_number, rec]]));
  check("no figure, no CPL rule", !/CPL figure|could adopt|CPL here/.test(ctx), ctx);
  check("fetchCheckedRequirements selects display",
    /\.select\("control_number,catalog_year,source_url,measure,total_min,total_max,record,display"\)/.test(FN));
  const SMOKE = fs.readFileSync("chatbox/smoke_test.sh", "utf8");
  check("smoke 7t holds the answer to the page's figure",
    /run "7t CPL on a checked program/.test(SMOKE) && /answer_must_match "31\\\.5"/.test(SMOKE));
});

const failed = results.filter((r) => !r[1]);
for (const [name, ok, why] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !why ? "" : " — " + String(why).slice(0, 400)}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
