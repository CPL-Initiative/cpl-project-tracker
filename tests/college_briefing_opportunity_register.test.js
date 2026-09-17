// The occupation opportunity register inside the My College tab — jsdom test.
// SkyQuarry (Session 267), 2026-09-17.
//
// Built for Sigrid's meeting with the Bay Area Strong Workforce consortium: a
// facilitator picks any college in the room and reads what it could already give
// credit for, then flips to the next one. The data is precomputed
// (regional_cpl_opportunity_data.js) because the matcher behind it runs ~14
// seconds per college and a room cannot wait on it.
//
// What is guarded here, and every one of these is a failure this repo has
// already had once in another surface:
//
//  (a) ⭐ A COLLEGE OUTSIDE THE REGISTER IS SAID SO, NOT SHOWN EMPTY. The file
//      covers one region. A college it never measured must not render as a
//      college with nothing to adopt — same family as "not in this dataset read
//      as zero", which college_briefing.test.js (d)/(e) guard for programs and
//      measures. Asserted WITH a covered college beside it, so the test cannot
//      pass by rendering the message for everyone;
//  (b) ⭐ THE ACCURACY CAVEAT IS PRESENT, AND ABOVE THE ROWS. A matched row and
//      a human-ruled row paint identically; the caveat is the only thing that
//      tells them apart, so its position is load-bearing, not decoration;
//  (c) ⭐ THE UNMATCHED OCCUPATIONS ARE NAMED, NOT ONLY COUNTED. Recall is about
//      half, so an absence is unconfirmed rather than a finding — the person in
//      the room is the one who can say "we do teach that";
//  (d) ⭐ EVERY ROW CARRIES THE TERM ITS MATCH TURNED ON. A claim with no way to
//      check it is what makes a reader trust the wrong row;
//  (e) loading and failed are distinguishable from each other AND from empty —
//      a failed read that renders as "nothing here" is the same bug as (a);
//  (f) the section is in SECTION_IDS, so Expand all / Collapse all reach it;
//  (g) XSS — occupation, program and course names reach here from MAP and COCI,
//      typed by people.
//
// Run from repo root: `npm test` (or `node tests/college_briefing_opportunity_register.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Load the module in jsdom ──
function load() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function () { return new Promise(function () {}); }; // never resolves
  const tp = w.document.createElement("script");
  tp.textContent = fs.readFileSync("team_phrase.js", "utf8");
  w.document.body.appendChild(tp);
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync("college_briefing.js", "utf8");
  w.document.body.appendChild(s);
  return w;
}

const win = load();
const M = win.CPL_COLLEGE_BRIEFING;
check("module exports on window", !!M);
check("exposes the register's pure body builder", typeof M._oppsBodyFor === "function");

// ── (f) the section is a first-class section ──
check("(f) 'opps' is in SECTION_IDS, so Expand all / Collapse all reach it",
  M._SECTION_IDS.indexOf("opps") !== -1);

// ── A two-college fixture. COVERED is in the register; OUTSIDE is not. ──
const OPPS = {
  meta: {
    region: "the Bay Region",
    n_occupations: 541,
    colleges: ["Covered College", "Other Covered College"],
    priority_labels: {
      P1: "Adopt now — you teach it, the exhibit exists, you are not on it",
      P2: "Build first-in-state — you teach it, no exhibit exists anywhere"
    },
    accuracy: { rulings: 139, precision: "about nine in ten", recall: "roughly half",
                scored_at: "San Joaquin Delta College" }
  },
  colleges: {
    "Covered College": {
      summary: { n_programs: 200, n_courses: 1400 },
      rows: [
        { occupation: "Welders, Cutters, Solderers and Brazers", soc: "51-4121",
          education: "High school diploma or equivalent", fit: "confirmed", priority: "P1",
          exhibit_status: "exists_not_on_it", programs: ["Welding Technology"],
          courses: ["WELD 10 — Introduction to Welding"], exhibits: ["AWS D1.1 Structural Welding"],
          program_evidence: "welding" },
        { occupation: "Ambulatory Coders", soc: "29-2072", fit: "partial", priority: "P2",
          programs: ["Medical Office Assistant"], courses: [], exhibits: [],
          program_evidence: "medical" }
      ],
      unmatched: ["Fast Food and Counter Workers", "Retail Salespersons"]
    },
    "Other Covered College": { summary: {}, rows: [], unmatched: [] }
  }
};

// ── (a) the outside-the-register case, with a covered college as the control ──
{
  const outside = M._oppsBodyFor(OPPS, "Outside College", "ready", []);
  check("(a) a college outside the register is NAMED as outside",
    /is not in/i.test(outside) && outside.indexOf("Outside College") !== -1);
  check("(a) …and the region it is outside of is named",
    outside.indexOf("the Bay Region") !== -1);
  check("(a) …and the register's coverage is stated, so the gap is sizeable",
    /covers\s*28|covers\s*2\b/.test(outside.replace(/<[^>]*>/g, "")));
  check("(a) …and it does NOT render an empty register that reads as 'nothing to adopt'",
    outside.indexOf("cb-opp-list") === -1);

  // Positive control: the covered college must NOT get that message.
  const covered = M._oppsBodyFor(OPPS, "Covered College", "ready", []);
  check("(a) control: a COVERED college renders the register, not the outside message",
    covered.indexOf("cb-opp-list") !== -1 && !/is not in/i.test(covered));
}

// ── (b) the caveat, and its position ──
{
  const h = M._oppsBodyFor(OPPS, "Covered College", "ready", []);
  check("(b) the measured precision reaches the page", h.indexOf("about nine in ten") !== -1);
  check("(b) the RECALL half reaches it too — an absence is unconfirmed",
    h.indexOf("roughly half") !== -1);
  check("(b) the caveat names where the score was measured",
    h.indexOf("San Joaquin Delta College") !== -1);
  check("(b) ⭐ the caveat sits ABOVE the rows, not under them",
    h.indexOf("about nine in ten") < h.indexOf("cb-opp-list"));
  check("(b) confirmation is named as the gate before a college acts",
    /faculty confirm every match/i.test(h));
}

// ── (c) unmatched occupations are named ──
{
  const h = M._oppsBodyFor(OPPS, "Covered College", "ready", []);
  check("(c) the unmatched count is shown", h.indexOf("2 occupations with no program") !== -1);
  check("(c) ⭐ …and the occupations themselves are NAMED, not just counted",
    h.indexOf("Fast Food and Counter Workers") !== -1
    && h.indexOf("Retail Salespersons") !== -1);
  check("(c) …and they are framed as unconfirmed rather than settled",
    /unconfirmed rather than settled/i.test(h));
}

// ── (d) the evidence for each match is on the row ──
{
  const row = M._oppRow(OPPS.colleges["Covered College"].rows[0], OPPS.meta.priority_labels);
  check("(d) ⭐ the term the match turned on is printed", row.indexOf("welding") !== -1);
  check("(d) …and the row says to confirm it", /confirm before acting/i.test(row));
  check("(d) the tier label travels with the tier", row.indexOf("Adopt now") !== -1);
  check("(d) the fit is a WORD, not a color alone", row.indexOf("Confirmed") !== -1);
  check("(d) programs and courses both render",
    row.indexOf("Welding Technology") !== -1 && row.indexOf("WELD 10") !== -1);

  // A row with no exhibits must say so rather than rendering an empty column.
  const thin = M._oppRow(OPPS.colleges["Covered College"].rows[1], OPPS.meta.priority_labels);
  check("(d) an empty column says 'None recorded' rather than going blank",
    thin.indexOf("None recorded") !== -1);
}

// ── (e) loading / failed / no-college are three different messages ──
{
  const nocollege = M._oppsBodyFor(OPPS, null, "ready", []);
  const loading = M._oppsBodyFor(null, "Covered College", "loading", []);
  const failed = M._oppsBodyFor(null, "Covered College", "error", []);
  check("(e) no college picked asks for one", /pick a college/i.test(nocollege));
  check("(e) loading says loading", /loading/i.test(loading));
  check("(e) ⭐ a FAILED read says it failed — never an empty register",
    /could not be loaded/i.test(failed) && failed.indexOf("cb-opp-list") === -1);
  check("(e) …and the three are distinct from one another",
    nocollege !== loading && loading !== failed && nocollege !== failed);
}

// ── (g) XSS — these strings come from MAP and COCI, typed by people ──
{
  const nasty = {
    occupation: '<img src=x onerror="alert(1)">',
    soc: "00-0000", fit: "confirmed", priority: "P1",
    programs: ['<script>alert("p")</script>'],
    courses: ['" onmouseover="alert(2)'],
    exhibits: [], program_evidence: "<b>evidence</b>"
  };
  const row = M._oppRow(nasty, { P1: "Adopt now" });
  check("(g) occupation is escaped", row.indexOf("<img src=x") === -1);
  check("(g) a program name cannot open a script tag",
    row.indexOf("<script>alert") === -1);
  check("(g) a course name cannot break out of an attribute",
    row.indexOf('" onmouseover="') === -1);
  check("(g) the evidence term is escaped", row.indexOf("<b>evidence</b>") === -1);
}

// ── The shipped data file, if it is present, must match what the view expects ──
{
  const path = "regional_cpl_opportunity_data.js";
  if (fs.existsSync(path)) {
    const sandbox = { window: {} };
    // eslint-disable-next-line no-new-func
    new Function("window", fs.readFileSync(path, "utf8"))(sandbox.window);
    const D = sandbox.window.CPL_REGIONAL_OPPS;
    check("shipped data: parses and carries meta + colleges", !!(D && D.meta && D.colleges));
    check("shipped data: the accuracy block travels WITH the data, so the caveat cannot outlive the score",
      !!(D.meta.accuracy && D.meta.accuracy.precision && D.meta.accuracy.recall));
    check("shipped data: meta.colleges agrees with the keys actually present",
      D.meta.colleges.length === Object.keys(D.colleges).length);
    const first = D.colleges[D.meta.colleges[0]];
    check("shipped data: a college carries rows and an unmatched list",
      !!(first && Array.isArray(first.rows) && Array.isArray(first.unmatched)));
    check("shipped data: every tier present in rows has a label in meta",
      Object.keys(D.colleges).every(function (c) {
        return D.colleges[c].rows.every(function (r) {
          return !r.priority || !!D.meta.priority_labels[r.priority];
        });
      }));
    // The register exists for a meeting; a file with no actionable rows anywhere
    // would render 28 empty drawers and nobody would notice until the meeting.
    const actionable = Object.keys(D.colleges).reduce(function (n, c) {
      return n + D.colleges[c].rows.filter(function (r) {
        return r.priority === "P0" || r.priority === "P1";
      }).length;
    }, 0);
    check("shipped data: there are adopt-now rows to show (" + actionable + ")", actionable > 0);
  } else {
    check("shipped data: absent, so nothing to check (regenerate with kb/_emit_regional_opps_data.py)", true);
  }
}

let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
