// Course Credit tab (college_goal2.js) — jsdom test.
//
// This tab publishes per-college figures derived from student-grain data, so the
// properties worth guarding are the DISCLOSURE ones. They are also the ones that
// fail silently: a leaked cell looks like a working page.
//
//  (a) Rule 4 + nav/pane/lazy-boot present in BOTH HTMLs;
//  (b) TEAM-GATED — internal comparative material must not render logged out;
//  (c) a suppressed cell renders "<10" and NEVER its number;
//  (d) ⭐ a college with ANY suppressed cell publishes NO rate. This is the one
//      that matters: publishing total + siblings + rate hands back exactly what
//      suppression removed, since any two of {total, part, rate} give the third.
//      Testing that a `suppressed` flag is set would pass on a broken build —
//      this tests the property;
//  (e) a FAILED READ renders as an error, never as "no college awarded anything";
//  (f) no rank positions anywhere — "never rank colleges publicly" is standing,
//      and a tab that sorts is one careless edit away from numbering.
//
// Run from repo root: `npm test` (or `node tests/college_goal2.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav button present", /data-tab="course-credit"[^>]*>🎓 Course Credit</.test(cpl));
check("tab pane present", /id="tab-course-credit"/.test(cpl));
check("mount point present", /id="course-credit-root"/.test(cpl));
check("lazy boot wired to CPL_GOAL2", /loadScript\('college_goal2\.js',\s*'CPL_GOAL2'/.test(cpl));

// The build SQL must be committed, or the table is reproducible only from a
// chat transcript — which is how a nightly rebuild quietly stops happening.
const sql = fs.readFileSync("kb/supabase_map_college_goal2.sql", "utf8");
check("build SQL committed", sql.length > 500);
check("build SQL applies k=10 on DISTINCT students", /students\s*<\s*10/.test(sql) && /count\(distinct student_key\)/.test(sql));
check("build SQL applies complementary suppression", /complement_target/.test(sql) && /smallest sibling/.test(sql));
check("build SQL nulls BOTH measures on a suppressed cell",
  /then null else f\.students end/.test(sql) && /then null else f\.rows_n\s*end/.test(sql));
check("build SQL carries the never-rank rule", /NEVER RANK COLLEGES/.test(sql));

// ── Part B — behavior ──
const SRC = fs.readFileSync("college_goal2.js", "utf8");
function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="course-credit-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  w.fetch = function () { return new Promise(function () {}); };
  w.eval(SRC);
  return w;
}

// A fixture with every shape that matters, including the decoys:
//  college 1 — all three cells visible          → rate publishable
//  college 2 — one cell below k + a complement  → rate MUST be withheld
//  college 3 — every cell suppressed            → existence only
const CELLS = [
  { college_id: 1, dest: "COURSE",   students: 40, rows_n: 60, suppressed: false, reason: null },
  { college_id: 1, dest: "AREA",     students: 20, rows_n: 30, suppressed: false, reason: null },
  { college_id: 1, dest: "ELECTIVE", students: 15, rows_n: 10, suppressed: false, reason: null },
  { college_id: 2, dest: "COURSE",   students: 50, rows_n: 90, suppressed: false, reason: null },
  { college_id: 2, dest: "AREA",     students: null, rows_n: null, suppressed: true, reason: "below_k" },
  { college_id: 2, dest: "ELECTIVE", students: null, rows_n: null, suppressed: true, reason: "complement" },
  { college_id: 3, dest: "COURSE",   students: null, rows_n: null, suppressed: true, reason: "below_k" }
];
const LOAD = { loaded_at: new Date().toISOString(), loaded_rows: 220588, reconciled: true };

function seeded(opts) {
  const w = makeWin(opts || { teamPass: "p" });
  const G = w.CPL_GOAL2;
  G._state.cells = CELLS;
  G._state.load = LOAD;
  G._state.names = { "1": "Alpha College", "2": "Beta College", "3": "Gamma College" };
  // Credit summary: college 1 published, college 3 suppressed (thin college).
  G._state.credits = {
    "1": { college_id: 1, students: 75, suppressed: false, dormant_credits: 12345,
           articulated_waiting: 6789, applied_credits: 100, transcribed_credits: 50 },
    "2": { college_id: 2, students: 60, suppressed: false, dormant_credits: 900,
           articulated_waiting: 120, applied_credits: 10, transcribed_credits: 5 },
    "3": { college_id: 3, students: 4,  suppressed: true,  dormant_credits: null,
           articulated_waiting: null, applied_credits: null, transcribed_credits: null }
  };
  G._state.namesMissing = false;
  G._state.loading = false;
  G._state.error = null;
  return w;
}

// (b) gating
(function () {
  const w = makeWin();                       // logged out
  const G = w.CPL_GOAL2;
  G._state.cells = CELLS; G._state.loading = false;
  const r = w.document.getElementById("course-credit-root");
  G.render(r);
  check("gate: logged out sees the team gate, not the table", /team phrase/i.test(r.innerHTML));
  check("gate: logged out leaks no college names", !/Alpha College|Beta College/.test(r.innerHTML));
  check("gate: logged out leaks no figures", !/\b60\b/.test(r.innerHTML.replace(/[0-9a-f]{6}/gi, "")));
})();

// (c) suppressed cells never print their number
(function () {
  const w = seeded();
  const r = w.document.getElementById("course-credit-root");
  w.CPL_GOAL2.render(r);
  const html = r.innerHTML;
  check("suppressed cell renders <10", /&lt;10/.test(html));
  check("suppressed cell explains itself on hover",
    /Fewer than 10 students/.test(html) && /cannot be recovered by subtraction/.test(html));
  check("a visible cell still prints its number", />40</.test(html));
})();

// (d) ⭐ THE PROPERTY: no rate where any cell is suppressed
(function () {
  const w = seeded();
  const G = w.CPL_GOAL2;
  const rows = G._byCollege();
  const c1 = rows.filter((r) => r.id === 1)[0];
  const c2 = rows.filter((r) => r.id === 2)[0];
  const c3 = rows.filter((r) => r.id === 3)[0];

  check("college with all cells visible gets a rate", c1 && c1.share != null);
  check("⭐ college with a suppressed cell gets NO rate", c2 && c2.share === null);
  check("⭐ fully suppressed college gets NO rate", c3 && c3.share === null);

  // The differencing attack, run directly: college 2 shows COURSE=90 rows. If a
  // rate were published alongside it, AREA+ELECTIVE falls straight out.
  const r = w.document.getElementById("course-credit-root");
  G.render(r);
  const betaRow = r.innerHTML.split("<tr>").filter((s) => /Beta College/.test(s))[0] || "";
  check("⭐ suppressed college's row prints no percentage at all", !/%<\/span>/.test(betaRow));
  check("suppressed college's row says why", /not published/.test(betaRow));
  check("suppressed college's awarded-row total is withheld too", !/>90</.test(betaRow));
})();

// (e) a failed read is not an empty result
(function () {
  const w = makeWin({ teamPass: "p" });
  const G = w.CPL_GOAL2;
  G._state.error = "HTTP 401 on /map_college_goal2";
  G._state.loading = false;
  const r = w.document.getElementById("course-credit-root");
  G.render(r);
  check("failed read renders an error", /Could not read the data/.test(r.innerHTML));
  check("failed read explicitly denies 'no data'", /not.{0,20}an empty result/i.test(r.innerHTML));
  check("failed read renders no table", !/<table/.test(r.innerHTML));
})();

// (f) never rank
(function () {
  const w = seeded();
  const r = w.document.getElementById("course-credit-root");
  w.CPL_GOAL2.render(r);
  const html = r.innerHTML;
  // Match ranking ARTIFACTS, not the substring "rank" — the first version of
  // this check fired on the tab's own disclaimer ("Colleges are never ranked"),
  // which is the opposite of the thing it exists to catch.
  const headers = (html.match(/<th[^>]*>(.*?)<\/th>/gi) || []).join(" ");
  check("no rank column header", !/rank|position|placing|№/i.test(headers));
  check("no ordinal position markers in cells", !/<td[^>]*>\s*#?\d+(st|nd|rd|th)\b/i.test(html));
  check("no '#N of M' league framing", !/#\d+\s*(of|\/)\s*\d+/.test(html));
  check("no pejorative framing", !/worst|failing|bottom \d|laggard/i.test(html));
  check("frames the gap as unclaimed opportunity", /already earned/i.test(html));
})();

// (g) freshness is stated, because this is meant to reload nightly
(function () {
  const w = seeded();
  const r = w.document.getElementById("course-credit-root");
  w.CPL_GOAL2.render(r);
  check("states when the data was loaded", /Data loaded \d{4}-\d{2}-\d{2}/.test(r.innerHTML));
  check("states whether the count was reconciled", /count reconciled against the source/.test(r.innerHTML));

  const w2 = seeded();
  w2.CPL_GOAL2._state.load = { loaded_at: new Date(Date.now() - 5 * 86400000).toISOString(),
                               loaded_rows: 220588, reconciled: false };
  const r2 = w2.document.getElementById("course-credit-root");
  w2.CPL_GOAL2.render(r2);
  check("⚠ stale data is flagged, not shown as current", /stale|days ago/.test(r2.innerHTML));
  check("⚠ an unreconciled load says so", /NOT reconciled/.test(r2.innerHTML));
})();

// (h) missing college-name lookup is disclosed, not silently papered over
(function () {
  const w = seeded();
  const G = w.CPL_GOAL2;
  G._state.names = null; G._state.namesMissing = true;
  const r = w.document.getElementById("course-credit-root");
  G.render(r);
  check("missing name lookup is disclosed", /College names are not loaded yet/.test(r.innerHTML));
  // The lookup is a LIVE table read, not a committed file — a snapshot would
  // drift the moment a college is added.
  check("names come from the live map_colleges lookup",
    /map_colleges\?select=college_id,college_name/.test(fs.readFileSync("college_goal2.js","utf8")));
  check("a failed name read is disclosed, not rendered as ids-by-choice",
    /namesMissing = true/.test(fs.readFileSync("college_goal2.js","utf8")));
  check("falls back to the MAP id rather than blank", /College 1</.test(r.innerHTML));
})();

// (i) the credits view
(function () {
  const w = seeded();
  const r = w.document.getElementById("course-credit-root");
  w.CPL_GOAL2.render(r);
  const html = r.innerHTML;
  check("credits come from map_college_credit_summary",
    /map_college_credit_summary\?select=/.test(fs.readFileSync("college_goal2.js", "utf8")));
  check("dormant credit total is shown, thousands-formatted", /13,245|12,345/.test(html));
  check("⭐ the already-articulated figure is called out as the number to act on",
    /Ready to award/.test(html) && /nobody acted/i.test(html));
  check("the ceiling is qualified, not presented as all-awardable",
    /not all of it would be awarded/i.test(html));

  // A thin college must withhold BOTH credit measures — a 4-student college
  // publishing its credit total discloses those four students.
  const gammaRow = html.split("<tr>").filter((x) => /Gamma College/.test(x))[0] || "";
  check("⭐ thin college withholds its dormant-credit figure", !/12,345|900/.test(gammaRow));
  check("thin college says why", /&lt;10 students/.test(gammaRow));
})();

let reported = false;
function finish() {
  reported = true;
  let failed = 0;
  for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
}
finish();
