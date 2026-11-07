// Sierra reads CPL-AI's course ratings (cpl-chat's CPL-AI BLOCK, SkyFern, 2026-11-07).
//
// Sam, in session 2026-11-06: "I do want the CPL-AI recs on public view". The Credential
// Catalog shows them as the CPL-AI course match badge; Sierra had no read of them. This lifts
// the real block out of index.ts (tests/lib/lift_ts.js) and runs it on the committed Catalog
// files, library/adopt/adopt_ai.json with the college column names the builder now writes
// into it (taken here from adopt_data.json, the same list in the same order). It holds:
//   (1) a credential CPL-AI rated, at a college with Strong evidence courses: those courses,
//       strongest first, the tier names, the Catalog link for that college, the source line,
//       the caveat and the rule;
//   (2) a title matches by its words, never by part: Network+ is not Security+;
//   (3) a college with no rated course: the absence is said, with the colleges that hold the
//       most Strong evidence courses, by name;
//   (4) a file without the column list (written before the builder carried it) claims
//       nothing about any one college and never prints a column number as a college;
//   (5) a credential CPL-AI did not rate, or no file, adds nothing;
//   (6) the rule keeps a rating evidence for faculty review;
//   (7) the handler: the read rides the credential routes' Promise.all, the section is
//       appended outside the recs try, and the answer's log names it;
//   (8) the builder writes the column names into adopt_ai.json.
// Run from repo root: `node tests/sierra_cpl_ai.test.js`.
const fs = require("fs");
const path = require("path");
const { liftBlock } = require("./lib/lift_ts");

const ROOT = path.join(__dirname, "..");
const FN = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function finish() {
  let failed = 0;
  for (const [name, ok, why] of results) {
    console.log(`${ok ? "PASS" : "FAIL"} ${name}${!ok && why ? " — " + why : ""}`);
    if (!ok) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

let L = null;
try {
  L = liftBlock(FN, "// ── CPL-AI BLOCK START", "// ── CPL-AI BLOCK END",
    ["buildCplAiContext", "cplAiEntry", "cplAiCollegeKey", "cplAiPick", "CPL_AI_RULE", "CPL_AI_CATALOG"]);
} catch (e) { check("(0) the CPL-AI block lifts out of index.ts — " + e.message, false); }
check("(0) the CPL-AI block lifts out of index.ts", !!L && typeof L.buildCplAiContext === "function");
if (!L) finish();

const AI = JSON.parse(fs.readFileSync(path.join(ROOT, "library/adopt/adopt_ai.json"), "utf8"));
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, "library/adopt/adopt_data.json"), "utf8"));
const COLS = DATA.colleges.map((c) => c[0]);
const DOC = Object.assign({}, AI, { colleges: COLS });
const SEC = "CompTIA Security+";

// The college with the most Strong evidence courses against Security+, measured from the file.
const cert = (AI.by_exhibit[SEC] || [])[0];
check("(fixture) CPL-AI joined a certification to CompTIA Security+", !!cert);
if (!cert) finish();
let best = null;
for (const [k, rows] of Object.entries(cert.by_college)) {
  if (!/^\d+$/.test(k)) continue;
  const n = rows.filter((r) => r[2] === 1).length;
  if (!best || n > best.n) best = { k, n, rows };
}
const BEST = COLS[Number(best.k)];
const strongRows = best.rows.filter((r) => r[2] === 1);

// (1)
const out = L.buildCplAiContext(DOC, SEC, BEST);
check("(1) the section is headed for the credential and says it is evidence for faculty review",
  out.includes("CPL-AI COURSE RATINGS FOR COMPTIA SECURITY+ (evidence for faculty review"), out.slice(0, 200));
check("(1) the section names the college and its Strong evidence courses",
  out.includes(`At ${BEST}:`) && out.includes("Strong evidence:") && strongRows.every((r) => out.includes(`${r[0]} ${r[1]}`)));
check("(1) each course line carries its skill areas",
  out.includes(`${strongRows[0][0]} ${strongRows[0][1]} (${strongRows[0][3]} of ${strongRows[0][4]} skill areas)`));
const firstStrong = out.indexOf("Strong evidence:"), firstInterp = out.indexOf("Faculty interpretation:");
check("(1) Strong evidence comes before Faculty interpretation", firstInterp < 0 || firstStrong < firstInterp);
check("(1) the Catalog link opens on that college",
  out.includes(L.CPL_AI_CATALOG + "?college=" + encodeURIComponent(BEST)));
check("(1) the statewide counts are the file's", out.includes(`${cert.by_tier["1"]} Strong evidence, ${cert.by_tier["2"]} Faculty interpretation`));
check("(1) the source and the caveat ride the section", out.includes("Source: " + AI.credit) && out.includes("Caveat: " + AI.caveat));
check("(1) the rule rides the section", out.includes(L.CPL_AI_RULE));

// (2)
check("(2) a title in another case or punctuation finds the same certifications",
  L.cplAiEntry(DOC, "comptia security+").length === AI.by_exhibit[SEC].length);
const net = L.cplAiEntry(DOC, "CompTIA Network+");
check("(2) Network+ is not Security+", net.length > 0 && net.every((c) => c.code !== cert.code));
check("(2) part of a title matches nothing", L.cplAiEntry(DOC, "CompTIA").length === 0);

// (3)
const noneIdx = COLS.findIndex((_, i) => !(String(i) in cert.by_college));
check("(fixture) a college has no course CPL-AI rated against Security+", noneIdx >= 0);
const none = L.buildCplAiContext(DOC, SEC, COLS[noneIdx]);
check("(3) the absence is said for that college", none.includes(`CPL-AI rated no course at ${COLS[noneIdx]} against it.`));
check("(3) the colleges with the most Strong evidence courses are named, the strongest first",
  none.includes("Colleges with the most Strong evidence courses: ") && none.includes(`(${best.n})`));
check("(3) no college is named by its column number", !/(?:: |; )\d+ \(\d+\)/.test(none));

// (4)
const old = L.buildCplAiContext(AI, SEC, BEST);
check("(4) without the column list no college is said to have none", !old.includes("rated no course"));
check("(4) without the column list no college list is printed", !old.includes("Colleges with the most Strong evidence courses"));
check("(4) without the column list the statewide counts still ride", old.includes(`${cert.by_tier["1"]} Strong evidence`));
check("(4) a college CPL-AI names without a column is never said to have none",
  !L.buildCplAiContext(DOC, SEC, "Calbright College").includes("rated no course"));

// (5)
check("(5) a credential CPL-AI did not rate adds nothing", L.buildCplAiContext(DOC, "Basic Military Training", BEST) === "");
check("(5) no file adds nothing", L.buildCplAiContext(null, SEC, BEST) === "");
check("(5) no title adds nothing", L.buildCplAiContext(DOC, null, BEST) === "");

// (5b) which matched credential the section is about (the preview A/B, 2026-11-07)
const SAC_Q = "Which Sacramento City College courses could faculty review for credit for CompTIA Security+?";
check("(5b) a first-ranked credential CPL-AI did not rate gives way to the one asked about",
  L.cplAiPick(DOC, ["LA City Certified Welder — AWS D1.1 SMAW", "CompTIA Security+"], SAC_Q) === "CompTIA Security+");
check("(5b) a Network+ question takes Network+ over a Security+ match ranked first",
  L.cplAiPick(DOC, ["CompTIA Security+", "CompTIA Network+"], "Which of our courses fit CompTIA Network+?") === "CompTIA Network+");
check("(5b) a rated title the question does not name is not picked",
  L.cplAiPick(DOC, ["CompTIA Security+"], "Which Sacramento City College courses fit welding?") === null);
check("(5b) a title with digits matches on them (ASE A5 for brakes)",
  L.cplAiPick(DOC, ["ASE A5 — Brakes"], "Do any courses count for ASE A5 brakes?") === "ASE A5 — Brakes");
check("(5b) no file picks nothing", L.cplAiPick(null, ["CompTIA Security+"], SAC_Q) === null);

// (6)
check("(6) the rule says the faculty make every CPL determination", /faculty make every CPL determination/.test(L.CPL_AI_RULE));
check("(6) the rule forbids presenting a rating as credit a student will receive",
  /Never tell a student a rated course is credit they will receive/.test(L.CPL_AI_RULE));
check("(6) the rule puts an existing MAP award first", /already awards credit for this credential, give that first/.test(L.CPL_AI_RULE));

// (7)
check("(7) the read rides the credential routes' Promise.all", /fetchMapLinks\(\) : Promise\.resolve\(null\),\s*fetchCplAi\(\),/.test(FN));
const tryEnd = FN.indexOf('console.error("credential recs lookup failed:", e);');
const appendAt = FN.indexOf("credentialContext += cplAiContext;");
check("(7) the section is appended after the recs try, so a failed lookup keeps it", tryEnd > 0 && appendAt > tryEnd);
check("(7) the handler picks the title with cplAiPick over every route's matches, the volume route included", /cplAiTitle = cplAiPick\(cplAiDoc,\s*\[\.\.\.\(stdRecs \|\| \[\]\), \.\.\.\(anyCreds \|\| \[\]\), \.\.\.\(vol \|\| \[\]\)/.test(FN));
check("(7) the answer's log names the CPL-AI section", /cpl_ai: \{ credential: cplAiTitle, college: [^}]*loaded: !!cplAiDoc/.test(FN));

// (8)
const BUILDER = fs.readFileSync(path.join(ROOT, "kb/_build_adopt_page.py"), "utf8");
check("(8) the builder writes the college column names into adopt_ai.json", /"colleges": \[c\[0\] for c in colleges\]/.test(BUILDER));

finish();
