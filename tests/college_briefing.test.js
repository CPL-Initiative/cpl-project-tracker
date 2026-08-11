// College Briefing (college_briefing.js) — jsdom test. SkyHigh (Session 132), 2026-08-09.
//
// The college-facing half of the "one engine, two audiences" pair. The MAP Team
// Queue leads with AGE; this leads with OPPORTUNITY. What is guarded here:
//
//  (a) Rule 4 + nav / pane / lazy-boot present in BOTH HTMLs;
//  (b) TEAM-GATED — per-college figures must not render logged out;
//  (c) ⭐ EVERY PROJECT IS WALKED. Sam is adding strategies to the $50k /
//      ESS 25-82 program later, and asked that they wire in "like the other
//      strategies". The loader must therefore iterate config.projects rather
//      than reaching into cpl-implementation, so a new program appears with no
//      code change. This is the forward-compatibility guarantee and it is
//      asserted with a two-project fixture;
//  (d) ⭐ A PROGRAM WE COULD NOT READ IS NAMED, NOT SKIPPED. Same failure
//      family as "not in this dataset" read as zero. Asserted WITH a readable
//      program beside it, so the test cannot pass by dropping everything;
//  (e) ⭐ A MEASURE WE DO NOT HOLD IS NOT ZERO. A suppressed college and a
//      college with no row must render as "no figure", never 0% or done;
//  (f) ⭐ MATCHING DEGRADES SAFELY. Measures match a stable substring of the
//      team's own wording. If a curator edits that wording, the strategy must
//      fall back to unmeasured rather than attach a number to the WRONG
//      strategy — the safe direction, and the reason matching is substring-based
//      rather than positional;
//  (g) an empty-string strategy (a real curator typo in Scenario 1 Year 1) is
//      dropped from display but COUNTED, so the list never silently shrinks;
//  (h) a year with no strategies written (Scenario 1 Year 2, live) is reported
//      as unread rather than rendering an empty, healthy-looking program;
//  (i) XSS — college names, strategy text and program labels are escaped; they
//      reach here from Supabase, typed by people.
//
// Run from repo root: `npm test` (or `node tests/college_briefing.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
["CPL_Dashboard.html", "index.html"].forEach(function (f) {
  const h = f === "index.html" ? idx : cpl;
  check(f + ": nav button present", h.indexOf('data-tab="college-briefing"') !== -1);
  check(f + ": pane root present", h.indexOf('id="college-briefing-root"') !== -1);
  check(f + ": lazy-boots college_briefing.js", h.indexOf("loadScript('college_briefing.js', 'CPL_COLLEGE_BRIEFING'") !== -1);
});

// ── Part B — load the module in jsdom ──
function load(signedIn) {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  if (signedIn) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function () { return new Promise(function () {}); }; // never resolves
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync("college_briefing.js", "utf8");
  w.document.body.appendChild(s);
  return w;
}

const win = load(true);
const M = win.CPL_COLLEGE_BRIEFING;
check("module exports on window", !!M);
check("exposes the pure engine", typeof M._buildBriefing === "function" && typeof M._collectPrograms === "function");
check("defaults to Sam's answer: Scenario 1 / Year 1", M._SCENARIO === "Scenario 1" && M._YEAR === "1");

// gate
const out = load(false);
const gRoot = out.document.getElementById("college-briefing-root");
out.CPL_COLLEGE_BRIEFING.render(gRoot);
check("team-gated: no figures logged out", /sign in/i.test(gRoot.textContent));

// ── Part C — the strategy library ──
// Two programs: one shaped like the live cpl-implementation, one standing in
// for the $50k program Sam is adding later. Both must appear.
const TWO = {
  projects: {
    "cpl-implementation": {
      label: "CPL Implementation Funding",
      scenarios: { "Scenario 1": { yearPriorities: { "1": {
        "0": { share: 0.5, description: "Increase access.", metric: "Applied CPL Units measured in FTES",
               strategies: ["Act on all JST credit recommendations in MAP", "Adopt or Adapt possible statewide credit recommendations"] },
        "1": { share: 0.3, description: "Institutionalize.", metric: "Transcribed CPL Units",
               strategies: ["Complete Transcribe step in MAP for each student record with CPL", ""] }
      } } } }
    },
    "ess-25-82": {
      label: "$50k ESS 25-82",
      scenarios: { "Scenario 1": { yearPriorities: { "1": {
        "0": { share: 1, title: "Outcomes", strategies: ["Ensure a CPL Coordinator and/or Counselor is listed and responsive"] }
      } } } }
    }
  }
};

const lib = M._collectPrograms(TWO, { scenario: "Scenario 1", year: "1" });
check("(c) walks EVERY project — both programs found", lib.programs.length === 2);
check("(c) the later-added $50k program is present by label",
  lib.programs.some(function (p) { return p.label === "$50k ESS 25-82"; }));
check("(c) the existing IFM program is still present (positive control)",
  lib.programs.some(function (p) { return p.id === "cpl-implementation"; }));
check("(g) empty-string strategy dropped from display", lib.programs[0].priorities[1].strategies.length === 1);
check("(g) …but counted, so the list cannot silently shrink", lib.programs[0].priorities[1].blankCount === 1);

// unread: a malformed program is NAMED, with a readable one beside it
const MIXED = {
  projects: {
    "good": TWO.projects["cpl-implementation"],
    "broken": { label: "Mystery Program", scenarios: { "Scenario 9": {} } },
    "empty-year": { label: "Year Two Program", scenarios: { "Scenario 1": { yearPriorities: { "1": { "0": { share: 1, strategies: [] } } } } } }
  }
};
const mixed = M._collectPrograms(MIXED, {});
check("(d) malformed program is reported, not skipped",
  mixed.unread.some(function (u) { return u.id === "broken" && /Scenario 1/.test(u.why); }));
check("(h) a program whose year has no strategies is reported as unread",
  mixed.unread.some(function (u) { return u.id === "empty-year" && /no strategies/i.test(u.why); }));
check("(d) POSITIVE CONTROL: the readable program still renders",
  mixed.programs.length === 1 && mixed.programs[0].id === "good");

// ── Part D — measures ──
const COLLEGE = {
  name: "Example College", suppressed: false,
  dormant_credits: 12000, articulated_waiting: 900,
  applied_credits: 1000, transcribed_credits: 540,
  contactEmail: null, contactKnown: true
};

const jst = M._measureFor("Act on all JST credit recommendations in MAP", COLLEGE);
check("measures the JST backlog", jst.measured && jst.result && /12,000/.test(jst.result.headline));
check("…and leads with the already-articulated subset", /900/.test(jst.result.detail));

const tr = M._measureFor("Complete Transcribe step in MAP for each student record with CPL", COLLEGE);
check("measures transcribe as a FRACTION, not a checkmark",
  tr.result && tr.result.fraction && tr.result.fraction.pct === 54);

const unmeasured = M._measureFor("Document Student CPL Stories in MAP", COLLEGE);
check("an unmeasurable strategy is marked unmeasured", unmeasured.measured === false && !unmeasured.result);

// (f) safe degradation — the property that makes substring matching acceptable
const edited = M._measureFor("Act on every JST credit recommendation inside MAP", COLLEGE);
check("(f) edited wording degrades to UNMEASURED…", edited.measured === false);
check("(f) …rather than attaching a number to the wrong strategy", edited.result === null);

// (e) suppressed and absent are not zero
const supp = Object.assign({}, COLLEGE, { suppressed: true });
check("(e) suppressed college yields NO figure (not 0)", M._measureFor("Act on all JST credit recommendations in MAP", supp).result === null);
check("(e) …and no transcribe fraction either", M._measureFor("Complete Transcribe step in MAP for each student record with CPL", supp).result === null);
check("(e) a college we hold nothing for yields no figure",
  M._measureFor("Act on all JST credit recommendations in MAP", null).result === null);

// contact measure, both directions
check("missing contact is flagged as a real gap",
  /no contact listed/i.test(M._measureFor("Ensure a CPL Coordinator and/or Counselor is listed and responsive", COLLEGE).result.headline));
check("POSITIVE CONTROL: a present contact is reported as present",
  /a@b\.edu/.test(M._measureFor("Ensure a CPL Coordinator and/or Counselor is listed and responsive",
    Object.assign({}, COLLEGE, { contactEmail: "a@b.edu" })).result.headline));

// ── Part E — the whole briefing ──
const b = M._buildBriefing({ config: TWO, college: COLLEGE }, {});
check("briefing counts strategies across BOTH programs", b.strategyTotal === 4);
check("briefing measured 3 of them", b.measuredTotal === 3);
check("leads with high-emphasis opportunities", b.leads.length >= 1);
// Suppression hides CREDIT figures (small-N student data). It must NOT hide
// whether the college has a contact email — that is not student data, and
// blanking it would invent a gap. Asserted in both directions on purpose:
// an earlier version of this test asserted "nothing is measured", which was a
// PROXY for "credit figures are suppressed" and wrongly failed on the contact
// measure doing the right thing.
check("(e) under suppression the CREDIT item is noData, not zero", (function () {
  const b2 = M._buildBriefing({ config: TWO, college: supp }, {});
  const items = [];
  b2.programs.forEach(function (p) { p.priorities.forEach(function (pr) { pr.items.forEach(function (i) { items.push(i); }); }); });
  const jstItem = items.filter(function (i) { return /Act on all JST/.test(i.text); })[0];
  const contactItem = items.filter(function (i) { return /CPL Coordinator/.test(i.text); })[0];
  return jstItem && jstItem.noData === true && !jstItem.measure
    // POSITIVE CONTROL: suppression is scoped to credit, not to everything
    && contactItem && !!contactItem.measure;
})());
check("no config at all is reported, not rendered as an empty healthy page",
  M._buildBriefing({ config: {}, college: COLLEGE }, {}).unread.length === 1);

// ── Part F — XSS ──
const XSS = { projects: { "x": { label: "<img src=x onerror=alert(1)>",
  scenarios: { "Scenario 1": { yearPriorities: { "1": { "0": { share: 1, strategies: ["<script>alert(2)</script>"] } } } } } } } };
const wx = load(true);
wx.CPL_COLLEGE_BRIEFING._state.college = "<b>Bad</b> College";
wx.CPL_COLLEGE_BRIEFING._state.data = {
  colleges: ["<b>Bad</b> College"],
  briefing: wx.CPL_COLLEGE_BRIEFING._buildBriefing({ config: XSS, college: COLLEGE }, {})
};
const xr = wx.document.getElementById("college-briefing-root");
wx.CPL_COLLEGE_BRIEFING.render(xr);
check("XSS: no injected script element", xr.querySelectorAll("script").length === 0);
check("XSS: no injected img element", xr.querySelectorAll("img").length === 0);
// Assert STRUCTURE, not serialized text. innerHTML round-trips an attribute
// value without escaping "<" (legal inside an attribute), so a substring check
// on innerHTML is a proxy that fails on correct output. What actually matters
// is that the hostile string stayed TEXT and produced no elements.
check("XSS: option label is inert text, not markup", (function () {
  const opt = Array.prototype.slice.call(xr.querySelectorAll("#cb-college option"))
    .filter(function (o) { return o.value.indexOf("Bad") !== -1; })[0];
  return opt && opt.textContent === "<b>Bad</b> College" && opt.children.length === 0;
})());
check("XSS: strategy text produced no elements", (function () {
  const prog = xr.querySelector(".cb-prog");
  return prog && prog.querySelectorAll("script, img").length === 0 && /alert\(2\)/.test(prog.textContent);
})());

/* ── Absorbed from the retired Course Credit tab (2026-08-11) ──────────────
 * college_goal2.js and its test were deleted when the Course Credit tab was
 * folded into this page. Its load-bearing assertion moves here, because the
 * logic did — courseShare() carries it now.
 *
 * The rule: a rate is published ONLY when every cell is visible. Publishing a
 * share beside a suppressed cell hands back exactly what suppression removed,
 * since any two of {total, part, rate} give you the third.
 */
check("courseShare: withholds the rate when ANY cell is suppressed",
  (function () {
    const r = M._courseShare([
      { dest: "COURSE", rows_n: 80, suppressed: false },
      { dest: "AREA", rows_n: null, suppressed: true, reason: "k" },
      { dest: "ELECTIVE", rows_n: 20, suppressed: false }
    ]);
    return r && r.share === null && r.suppressed === true;
  })(),
  "a share published beside a hidden cell reveals the hidden cell");

check("courseShare: publishes the rate when every cell is visible",
  (function () {
    const r = M._courseShare([
      { dest: "COURSE", rows_n: 75, suppressed: false },
      { dest: "AREA", rows_n: 15, suppressed: false },
      { dest: "ELECTIVE", rows_n: 10, suppressed: false }
    ]);
    return r && Math.abs(r.share - 0.75) < 1e-9 && r.awarded === 100;
  })());

check("courseShare: no goal-2 rows is null, never 0%",
  M._courseShare([]) === null && M._courseShare(null) === null,
  "0% would read as 'this college awards nothing to courses' — a different claim");

check("byCplType: a suppressed cell and an absent one do NOT collapse",
  (function () {
    const supp = M._byCplType({
      rollup: [{ cpl_types: ["Military"], students: null, students_suppressed: true }],
      adopted: [], potential: [], goal2: []
    }).find(function (t) { return t.key === "Military"; });
    const none = M._byCplType({ rollup: [], adopted: [], potential: [], goal2: [] })
      .find(function (t) { return t.key === "Military"; });
    return supp.students === null && supp.suppressedCells === 1
        && none.students === null && none.suppressedCells === 0;
  })(),
  "'fewer than 10' (real students) must not render like 'none nameable' (a blind spot)");

check("byCplType: counts adopted and adoptable separately",
  (function () {
    const t = M._byCplType({
      rollup: [],
      adopted:   [{ unified_title: "A", cpl_types: ["Industry Certification"] }],
      potential: [{ unified_title: "B", cpl_types: ["Industry Certification"], statewide: true,
                    adopter_colleges: ["x", "y", "z"] }],
      goal2: []
    }).find(function (t) { return t.key === "Industry Certification"; });
    return t.articulated === 1 && t.couldAdopt === 1 && t.couldAdoptStatewide === 1
        && t.candidates[0].peers === 3;
  })());

check("byCplType: ranks candidates by peer adoption, not alphabetically",
  (function () {
    const t = M._byCplType({
      rollup: [], adopted: [],
      potential: [
        { unified_title: "Aaa", cpl_types: ["Military"], adopter_colleges: ["x"] },
        { unified_title: "Zzz", cpl_types: ["Military"], adopter_colleges: ["x", "y", "z"] }
      ],
      goal2: []
    }).find(function (t) { return t.key === "Military"; });
    return t.candidates[0].title === "Zzz";
  })(),
  "peer adoption proxies well-trodden; it ranks OPPORTUNITIES, never colleges");

// Strip comments before asserting: the file explains WHY the pot share was
// removed, and that explanation necessarily contains the phrase. Matching the
// prose instead of the code would make this guard unfixable.
const briefingSrc = fs.readFileSync("college_briefing.js", "utf8");
const briefingCode = briefingSrc
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
check("the pot share is NOT rendered",
  !/% of the pot/.test(briefingCode),
  "state allocation logic a coordinator cannot act on — Sam, 2026-08-10");
check("advice is demoted below the data",
  /Advice from the team/.test(briefingSrc));

check("Course Credit nav/pane/boot removed from BOTH HTMLs",
  !/course-credit/.test(cpl) && !/course-credit/.test(idx)
  && !/college_goal2/.test(cpl) && !/college_goal2/.test(idx));
check("the briefing nav reads My College in BOTH HTMLs",
  /My College/.test(cpl) && /My College/.test(idx));

// ── report ──
let pass = 0;
results.forEach(function (r) {
  if (r[1]) { pass++; } else { console.log("FAIL  " + r[0]); }
});
console.log("\ncollege_briefing.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
