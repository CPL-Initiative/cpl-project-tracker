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

// ── Part G — the money join, the district picker and the Sierra hand-off ──
// (Session 140.) The join is the dangerous one: it decides WHICH COLLEGE'S
// MONEY is shown. The funding roster keys on short names ("Bakersfield"), the
// briefing on MAP's full names ("Bakersfield College"), so an unchecked join
// either drops a college silently or — far worse — attaches one college's
// allocation to another. These assert against the REAL shipped rosters, not a
// fixture, so drift in either file fails here instead of on the page.
const shortSrc = fs.readFileSync("college_short_names.js", "utf8");
const fundSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const jw = { window: {} };
new Function("window", shortSrc).call(jw, jw.window);
new Function("window", fundSrc).call(jw, jw.window);
const S = jw.window.cplCollegeShort;
const ROSTER = jw.window.CPL_FUNDING.colleges;

// Every funding row must resolve to a DISTINCT key, or two colleges collapse
// onto one allocation.
const rosterKeys = {};
ROSTER.forEach(function (c) { const k = S(c.college); (rosterKeys[k] = rosterKeys[k] || []).push(c.college); });
const rosterDupes = Object.keys(rosterKeys).filter(function (k) { return rosterKeys[k].length > 1; });
check("join: every funding row resolves to a distinct key (0 collisions)",
  rosterDupes.length === 0 && Object.keys(rosterKeys).length === ROSTER.length,
  "collisions: " + JSON.stringify(rosterDupes));

// The resolver must round-trip its own output. It did NOT before 2026-08-11:
// only `canonical` + `aliases` were indexed, so cplCollegeShort("LA Swest")
// hit the safe fallback and returned the input — and a caller joining two
// datasets THROUGH the resolver lost Los Angeles Southwest College entirely.
check("join: the resolver round-trips its own short names",
  ROSTER.every(function (c) { return S(S(c.college)) === S(c.college); }));
check("join: LA Swest resolves (the round-trip regression)",
  S("LA Swest") === S("Los Angeles Southwest College"));

// Every college on the funding roster must be REACHABLE from a MAP-style full
// name — an unreachable row is a college whose money box would never render.
const MAP_STYLE = ROSTER.map(function (c) { return c.college; })
  .concat(["Bakersfield College", "City College of San Francisco", "College of Alameda",
           "Mt. San Antonio College", "MiraCosta College", "Norco College", "Reedley College",
           "Los Angeles Southwest College", "Cañada College"]);
const reached = {};
MAP_STYLE.forEach(function (n) { const k = S(n); if (rosterKeys[k]) reached[k] = true; });
check("join: every funding roster row is reachable (0 orphans)",
  Object.keys(reached).length === ROSTER.length,
  "unreached: " + Object.keys(rosterKeys).filter(function (k) { return !reached[k]; }).join(", "));

// ⭐ The three states must stay distinguishable. A model that has not loaded,
// a college that is not on the roster, and a college with a real $0 are
// DIFFERENT CLAIMS — collapsing them is how a blind spot becomes a zero.
check("funding: model not loaded returns null, never a zero", M._fundingFor("Bakersfield College") === null);

const FAKE = {
  _alloc: function (k) { return k === "Bakersfield" ? { total: 426000, floored: false, rural_w: 0 } : null; },
  _grant: function (k) {
    if (k === "Bakersfield") return { amount: 50000, declined: false, kind: "credit", display: "Bakersfield" };
    if (k === "Sequoias") return { amount: 50000, declined: true, kind: "credit", display: "Sequoias" };
    if (k === "Calbright") return { amount: 50000, declined: false, kind: "noncredit", display: "Calbright" };
    return null;   // not on either roster
  },
  _ess: function () { return { o1: { state: "met", why: "w1" }, o2: { state: "not", why: "w2" }, o3: { state: "pending", why: "w3" } }; },
  _isRural: function () { return false; },
  _district: function () { return "Kern CCD"; },
  _model: function () { return { floor: 150000 }; }
};
win.CPL_FUNDING_TAB = FAKE;
win.cplCollegeShort = S;
win.CPL_FUNDING = jw.window.CPL_FUNDING;   // the real roster, for districtIndex

const fB = M._fundingFor("Bakersfield College");
check("funding: full MAP name resolves to the right roster row", fB && fB.key === "Bakersfield" && fB.onRoster);
check("funding: reads the model's allocation, not a re-derived one", fB && fB.alloc && fB.alloc.total === 426000);
check("funding: carries the floor from the model", fB && fB.floor === 150000);

const fC = M._fundingFor("Calbright College Non-Credit");
check("funding: a noncredit feeder gets no college-pool allocation", fC && fC.onRoster && fC.alloc === null,
  "it is funded by the $1M noncredit carve-out — a different route, not an absence");

check("funding: an off-roster college is flagged, not zeroed",
  (function () { const r = M._fundingFor("Some Other College"); return r && r.onRoster === false && !("alloc" in r); })());

const fS = M._fundingFor("College of the Sequoias");
check("funding: a DECLINED grant is a state, not $0", fS && fS.grant.declined === true && fS.grant.amount === 50000);

// ESS outcome 2 carries the real fraction — a bare tick is what taught colleges
// that uploading is the finish line.
const prog = M._essProgress(fB, {
  adopted: [{ statewide: true }, { statewide: true }, { statewide: false }],
  potential: [{ statewide: true }, { statewide: true }, { statewide: true }, { statewide: false }]
}, { n_statewide_credentials: 84 });
check("ESS: three outcomes returned", prog && prog.length === 3);
check("ESS: outcome 2 is a FRACTION, not a tick",
  prog[1].frac && prog[1].frac.have === 2 && prog[1].frac.of === 84 && prog[1].frac.available === 3);
check("ESS: the outcome states survive verbatim from the model",
  prog[0].o.state === "met" && prog[2].o.state === "pending");
check("ESS: no detail loaded → no invented fraction",
  (function () { const p = M._essProgress(fB, null, { n_statewide_credentials: 84 }); return p[1].frac === null; })());

// District picker
const dIdx = M._districtIndex(["Bakersfield College", "Cerro Coso Community College", "Porterville College"]);
check("districts: index built from the roster", !!dIdx && Object.keys(dIdx).length >= 1);
check("districts: a college lands in exactly one district",
  Object.keys(dIdx).reduce(function (n, d) { return n + dIdx[d].length; }, 0) === 3);
check("districts: null when the roster has not loaded",
  (function () { const saved = win.CPL_FUNDING; win.CPL_FUNDING = undefined;
    const r = M._districtIndex(["Bakersfield College"]); win.CPL_FUNDING = saved; return r === null; })());

// ── Sierra AI: ONE assistant, embedded — not a second chat ──
// Sam, 2026-08-11: "embed the functionality right on the page… so they can type
// their question there and not leave the tab", and name it Sierra AI so it is
// not read as Sierra College. The guard that matters is that this tab never
// builds its own chat: it mounts cpl_chat.js's instance, so the audience rules,
// the feedback path and the history stay in one file.
const chatSrc = fs.readFileSync("cpl_chat.js", "utf8");
check("Sierra AI: cpl_chat exposes a second-mount hook", /mountInto:\s*mountInto/.test(chatSrc));
check("Sierra AI: cpl_chat exposes prefill (fill the box, never auto-send)",
  /prefill:\s*function/.test(chatSrc) && !/\bsubmit\(\)/.test(chatSrc.slice(chatSrc.indexOf("prefill: function"), chatSrc.indexOf("prefill: function") + 400)));
check("Sierra AI: the briefing mounts that instance rather than building a chat",
  /CPL_CHAT/.test(briefingSrc) && /mountInto/.test(briefingSrc));
check("Sierra AI: the briefing never calls the chat endpoint itself",
  !/functions\/v1|cpl-chat/.test(briefingSrc),
  "one assistant means one set of audience rules");
check("Sierra AI: named so it is not confused with Sierra College",
  /Sierra AI/.test(briefingSrc));
check("Sierra AI: falls back to the deep link when the chat module is absent",
  M._SIERRA_Q_KEY === "cplSierraTestQ.v1"
  && (chatSrc.indexOf("'cplSierraTestQ.v1'") !== -1 || chatSrc.indexOf('"cplSierraTestQ.v1"') !== -1));

// ⭐ The suggested questions are COMPUTED from this college's own figures, so
// they stay right as its position changes and nobody maintains a list.
const qWait = M._sierraQuestions("Example College",
  { potential: [{ unified_title: "CompTIA A+", adopter_colleges: ["a","b","c"] },
                { unified_title: "Rare Thing",  adopter_colleges: ["a"] }] },
  { articulatedWaiting: 4306, eligible: 11793 });
check("questions: the first is always how-are-we-doing + what to do",
  /How is Example College doing on CPL, and what quick steps/.test(qWait[0]));
check("questions: name the college so the assistant can resolve it",
  qWait.every(function (q) { return q.indexOf("Example College") !== -1; }));
check("questions: carry this college's OWN waiting figure", /4,306 units already waiting/.test(qWait.join(" ")));
check("questions: name the best adoption opportunity by PEER COUNT, never by naming colleges",
  /Should Example College add CompTIA A\+\? 3 other colleges/.test(qWait.join(" ")),
  "a college page must never turn into a comparison against a named college");

// The zero case must not ask a question with no answer.
const qZero = M._sierraQuestions("Example College", { potential: [] }, { articulatedWaiting: 0, eligible: 17253 });
check("questions: nothing waiting → asks where to look instead",
  /Nothing is set up and waiting/.test(qZero.join(" ")) && !/fastest way to award/.test(qZero.join(" ")));
check("questions: none without a college", M._sierraQuestions(null, null, null).length === 0);

// A failed model read must read as a failed read.
check("funding: a failed model load renders 'failed read', not an empty result",
  /failed read, not a finding/.test(briefingSrc));
check("funding: the allocation is labelled a cap, not a payment",
  /cap, not a cheque/.test(briefingSrc));

// ⭐ The floor waterfall must not be re-implemented here. The handoff's
// worked example — Bakersfield at 1.83% of a $23.24M pool — is a FLAT
// PROPORTIONAL number, and it is wrong for every college the waterfall pins to
// the floor. Guard the absence of a second implementation.
check("funding: no re-derived allocation arithmetic in the briefing",
  !/headcount_pct|floor_window|ruralPerCollege|23240308|0\.0183/.test(briefingCode),
  "the allocation comes from cpl_funding.js via _alloc(); a second implementation drifts");

// ── Part H — the funding section renders end-to-end ──
// The pure helpers above are exercised in isolation; this walks the real
// render() with a college selected, so a throw or a missing branch fails here
// rather than on the page.
const wf = load(true);
wf.cplCollegeShort = S;
wf.CPL_FUNDING = jw.window.CPL_FUNDING;
wf.CPL_FUNDING_ESS = { n_statewide_credentials: 84 };
wf.CPL_FUNDING_TAB = {
  _alloc: function () { return { total: 150000, floored: true, rural_w: 76923, gate_blocked: true, gate_missing: ["a CPL Coordinator"] }; },
  _grant: FAKE._grant, _ess: FAKE._ess, _isRural: function () { return true; },
  _district: function () { return "Kern CCD"; }, _model: function () { return { floor: 150000 }; }
};
const B = wf.CPL_COLLEGE_BRIEFING;
B._state.funding = "ready";
B._state.college = "Bakersfield College";
B._state.data = {
  colleges: ["Bakersfield College"],
  summaryByName: { "Bakersfield College": { dormant_credits: 1000, articulated_waiting: 100, applied_credits: 50, transcribed_credits: 10, students: 582 } },
  briefing: B._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" })
};
const fr = wf.document.getElementById("college-briefing-root");
B.render(fr);
const ftxt = fr.textContent;
check("render: the seed grant appears as money", /\$50,000/.test(ftxt));
check("render: the allocation appears as money", /\$150,000/.test(ftxt));
check("render: a floored college is TOLD it is at the floor, not left to infer",
  /minimum-viable floor/.test(ftxt) && /not.{0,3} its share of the pool/i.test(ftxt));
check("render: the guaranteed rural allowance is named", /rural allowance/.test(ftxt) && /\$76,923/.test(ftxt));
check("render: an outstanding participation requirement is surfaced",
  /Participation requirements are outstanding/.test(ftxt) && /CPL Coordinator/.test(ftxt));
check("render: the ESS outcomes are listed", fr.querySelectorAll(".cb-ess-list li").length === 3);
check("render: Sierra AI suggested questions render as buttons",
  fr.querySelectorAll("button.cb-ask").length >= 3);
check("render: the pickers sit INSIDE the Sierra AI box",
  !!fr.querySelector(".cb-assist .cb-bar"),
  "Sam: put the selectors in the assistant box");
check("render: a mount point exists for the shared assistant",
  !!fr.querySelector("#cb-assistant-mount"));
check("render: the district picker is present", !!fr.querySelector("#cb-district"));
check("render: no script/img injected anywhere in the new sections",
  fr.querySelectorAll("script").length === 0 && fr.querySelectorAll("img").length === 0);

// The same page with the model absent must not imply the college gets nothing.
const wn = load(true);
wn.cplCollegeShort = S;
wn.CPL_FUNDING = jw.window.CPL_FUNDING;
const Bn = wn.CPL_COLLEGE_BRIEFING;
Bn._state.funding = "error";
Bn._state.college = "Bakersfield College";
Bn._state.data = { colleges: ["Bakersfield College"], summaryByName: {},
  briefing: Bn._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" }) };
const nr = wn.document.getElementById("college-briefing-root");
Bn.render(nr);
// Assert the CONTRACT — "no money is attributed to this college" — via the
// element that carries a college's money, not via a "$" substring. The page
// legitimately contains "$50k ESS 25-82" as a PROGRAM NAME, so a text-level
// dollar match fails on correct output.
check("render: a failed model read says so, and attributes NO money to the college",
  /failed read, not a finding/.test(nr.textContent) && nr.querySelectorAll(".cb-fbig").length === 0);

// ── Part I — "transcribed" in MAP is a MARK, not a posting ──
// Sam, 2026-08-11: a college checks the Transcribe step in MAP when it judges
// the CPL on a student's plan ready, then forwards the plan to Admissions &
// Records, who post the credit in the college SIS BY HAND — there is no SIS
// integration with MAP. So map_student_credit.transcribed_credits means "the
// college marked it done", never "it is on the student's transcript". Copy
// that says otherwise asserts something MAP cannot know, and it also misleads
// a coordinator into thinking A&R's step is already handled.
const stripped = briefingSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
check("transcribed: never claims credit reached a transcript",
  !/reached the transcript|onto the transcript|Written onto the transcript|on their transcript/i.test(stripped),
  "MAP records a mark, not a posting");
check("transcribed: the figure is labelled as a MARK",
  /marked transcribed/i.test(stripped));
check("transcribed: names Admissions & Records as who actually posts it",
  /Admissions &(amp;)? Records/i.test(stripped),
  "otherwise a coordinator reads the checkbox as the credit being posted");
check("transcribed: says there is no automatic link to the college's own system",
  /no automatic link|does not do that for you|no SIS integration/i.test(stripped));

// ── Part J — who MAP has on file (Sam, 2026-08-11) ──
// The college's OWN roster, shown to the college. MAP stores several of these
// as multi-value strings — Moreno Valley's primary contact is the same address
// eleven times — so values are de-duplicated before display.
check("roster: de-duplicates a repeated address",
  M._dedupeValue("a@x.edu,\na@x.edu,\nA@x.edu") === "a@x.edu");
check("roster: keeps genuinely different addresses",
  M._dedupeValue("a@x.edu,\nb@x.edu") === "a@x.edu, b@x.edu");
check("roster: empty stays empty, never a stray comma", M._dedupeValue("") === null && M._dedupeValue(null) === null);
const ros = M._contactRoster({ primary_contact: "Ann Lee", primary_contact_email: "ann@x.edu,\nann@x.edu",
  cpl_coordinator: null, landing_page_url: "https://x.edu/cpl" });
check("roster: splits filled from blank roles", ros.filled.length >= 1 && ros.blank.length >= 1);
check("roster: primary contact is flagged as the lead row",
  ros.filled[0].lead === true && ros.filled[0].email === "ann@x.edu");
check("roster: carries the landing page through", ros.landing === "https://x.edu/cpl");

// ── report ──
let pass = 0;
results.forEach(function (r) {
  if (r[1]) { pass++; } else { console.log("FAIL  " + r[0]); }
});
console.log("\ncollege_briefing.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
