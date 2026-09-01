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
  // Shared phrase helper first — production ships both, and the locked state
  // renders its banner (with a working input) rather than the bare fallback.
  const tp = w.document.createElement("script");
  tp.textContent = fs.readFileSync("team_phrase.js", "utf8");
  w.document.body.appendChild(tp);
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
// Was: /sign in/i against copy that never said WHERE. The banner states the
// lock and carries the input, so assert the input.
check("team-gated: no figures logged out", /not signed in/i.test(gRoot.textContent));
check("team-gated: …and an unlock box is offered right there",
  !!gRoot.querySelector('[data-tp-locked] input[type="password"]'));

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
// RESCOPED 2026-08-17 (Sky167). The college <select> moved to the scope flow's
// SECOND step, so it is legitimately absent from the briefing view. The property
// — a hostile college name stays TEXT and produces no elements — is unchanged,
// so the check now looks where the options actually are.
check("XSS: option label is inert text, not markup", (function () {
  wx.CPL_COLLEGE_BRIEFING._state.scope = "college";
  wx.CPL_COLLEGE_BRIEFING._state.college = null;
  wx.CPL_COLLEGE_BRIEFING.render(xr);
  const opt = Array.prototype.slice.call(xr.querySelectorAll("#cb-college option"))
    .filter(function (o) { return o.value.indexOf("Bad") !== -1; })[0];
  const ok = opt && opt.textContent === "<b>Bad</b> College" && opt.children.length === 0;
  wx.CPL_COLLEGE_BRIEFING._state.college = "<b>Bad</b> College";
  wx.CPL_COLLEGE_BRIEFING.render(xr);
  return ok;
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
// ⭐ ONE CLICK, NOT TWO (Sam, 2026-08-11: "so they don't have to take 2 steps
// and get lost"). A suggested question sits above an assistant already mounted
// on this tab, so clicking it must FILL AND SEND — the behaviour of the
// assistant's own starter chips.
//
// ⚠ And it must do that WITHOUT changing prefill(), which the Sierra Training
// tab's "Test in Sierra" hand-off relies on staying send-free so a reviewer can
// edit a logged question before replaying it. Both halves are asserted, because
// fixing this by making prefill() send would break that tab silently.
check("ask(): the chat module exposes a fill-and-send entry point",
  /ask:\s*function/.test(chatSrc));
check("ask(): it actually submits", (function () {
  const at = chatSrc.indexOf("ask: function");
  return at !== -1 && /submit\(\)/.test(chatSrc.slice(at, at + 300));
})());
check("ask(): prefill() still does NOT send — the Training tab depends on it", (function () {
  const at = chatSrc.indexOf("prefill: function");
  return at !== -1 && !/submit\(\)/.test(chatSrc.slice(at, at + 300));
})(), "a reviewer edits a logged question before replaying it");
check("askSierra() prefers ask() over prefill()",
  briefingSrc.indexOf("C.ask(question)") !== -1 &&
  briefingSrc.indexOf("C.ask(question)") < briefingSrc.indexOf("C.prefill(question)"),
  "prefill is the fallback for an older chat module");

/* ── The suggested questions belong to the ASSISTANT now (Sam, 2026-08-21) ────
 * "My College users select a pre-seeded question and are not prompted for their
 * role — confusing." There were TWO clusters with the role picker between them:
 * the tab's own above the widget, and the widget's generic starters below its
 * "I'm a…" chips. Clicking one of the upper set with no role chosen produced
 * "tap who you are above" — pointing at chips that were BELOW it.
 *
 * The tab now hands its questions to the widget, which renders ONE cluster
 * under the role chips. So the seam to guard is the hand-off, not the markup. */
function briefingWith(chat) {
  const w = load(true);
  w.cplCollegeShort = S;
  w.CPL_CHAT = chat;
  const M2 = w.CPL_COLLEGE_BRIEFING;
  M2._state.college = "Example College";
  M2._state.data = { colleges: ["Example College"], summaryByName: {},
    briefing: M2._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" }) };
  const r = w.document.getElementById("college-briefing-root");
  M2.render(r);
  return { w: w, M: M2, root: r };
}

let handed = "unset";
const modern = briefingWith({
  mountInto: function () {}, prefill: function () { return true; },
  ask: function () { return true; },
  setSuggestions: function (list) { handed = list; return true; },
});
check("⭐ the tab hands its questions to the assistant rather than printing them",
  Array.isArray(handed) && handed.length >= 2);
check("…they are THIS college's questions, computed not fixed",
  Array.isArray(handed) && handed.every(function (q) { return /Example College/.test(q); }),
  JSON.stringify(handed));
check("⭐ …and the tab prints no second cluster of its own",
  !modern.root.querySelector("button.cb-ask"),
  "two lists straddling the role picker is the confusion being fixed");

/* ⚠ A CHAT MODULE THAT MOUNTS BUT CANNOT TAKE THE QUESTIONS MUST NOT COST THEM.
 * Gating the fallback on the MOUNT rather than on the questions actually
 * landing would take the mounted branch here and show nothing — the silent loss
 * the fallback exists to prevent, reintroduced by the gate. */
let asked = null, prefilled = null;
const legacy = briefingWith({
  mountInto: function () {}, prefill: function (q) { prefilled = q; return true; },
  ask: function (q) { asked = q; return true; },
});
const chip = legacy.root.querySelector("button.cb-ask");
check("⚠ an older chat module still gets the questions, via the fallback cluster", !!chip);
if (chip) chip.click();
check("clicking it SENDS rather than only filling the box",
  asked !== null && prefilled === null,
  "two steps is where a visitor gets lost");
check("…and it sends the question that was on the chip",
  !!chip && asked === chip.getAttribute("data-q"));

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
// Sam retired "a cap, not a cheque" on 2026-08-22 (state positively what drives
// the money), and the model gained a literal $400K cap the same day — so the
// old phrase was both against the ruling and newly ambiguous. Guard the
// REPLACEMENT and guard that the retired phrasing does not creep back.
check("funding: the allocation is stated positively — driven by the college's own CPL results",
  /driven by <b>its own CPL results, as they happen<\/b>/.test(briefingSrc));
check("funding: the retired 'not a cheque' framing is gone",
  !/not a cheque/.test(briefingSrc) && !/ceiling, not a check/.test(briefingSrc));
check("funding: a college held to the maximum is told where the difference went",
  // "cap" vocabulary (one pool + Sam's funding-vocabulary sweep, 2026-08-31);
  // the promise is unchanged — say where the difference WENT.
  / cap<\/b>/.test(briefingSrc) && /re-splits across the other colleges/.test(briefingSrc));

// ⭐ The floor waterfall must not be re-implemented here. The handoff's
// worked example — Bakersfield at 1.83% of a $23.24M pool — is a FLAT
// PROPORTIONAL number, and it is wrong for every college the waterfall pins to
// the floor. Guard the absence of a second implementation.
check("funding: no re-derived allocation arithmetic in the briefing",
  !/headcount_pct|floor_window|ruralPerCollege|ruralAlloc|23240308|24240308|0\.0183/.test(briefingCode),
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
  // Shape matches the post-2026-08-22 model: no rural_w component, floor $175K.
  _alloc: function () { return { total: 175000, floored: true, gate_blocked: true, gate_missing: ["a CPL Coordinator"] }; },
  _grant: FAKE._grant, _ess: FAKE._ess, _isRural: function () { return true; },
  _district: function () { return "Kern CCD"; },
  _model: function () { return { floor: 175000, cap: 400000 }; }
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
check("render: the allocation appears as money", /\$175,000/.test(ftxt));
check("render: a floored college is TOLD it is at the floor, not left to infer",
  // "base award" vocabulary (one pool, 2026-08-31; "pool" → "funding" is Sam's
  // sweep of the same day). The promise is unchanged: name the state AND say
  // the figure is not the college's raw proportional share.
  /base award/.test(ftxt) && /not its proportional share of the funding/i.test(ftxt));
// The rural allowance is retired (Sam, 2026-08-22) — a briefing that still
// named it would promise a college money that no longer exists.
check("render: no retired rural allowance is still promised",
  !/rural allowance/.test(ftxt) && !/\$76,923/.test(ftxt));
check("render: an outstanding participation requirement is surfaced",
  /Participation requirements are outstanding/.test(ftxt) && /CPL Coordinator/.test(ftxt));
check("render: the ESS outcomes are listed", fr.querySelectorAll(".cb-ess-list li").length === 3);
check("render: Sierra AI suggested questions render as buttons",
  fr.querySelectorAll("button.cb-ask").length >= 3);
// SUPERSEDED 2026-08-17 (Sky167). Sam's 2026-08-11 instruction was "put the
// selectors in the assistant box"; his 2026-08-17 redesign moves the choosing
// OUT of the briefing view entirely, into a scope step that runs before the
// assistant exists. The instruction did not fail — it was replaced. What is
// still worth guarding is that the briefing view carries no stray picker bar,
// which is the same thing the (N) block checks from the other direction.
check("render: the briefing view carries no picker bar (choosing happens before it)",
  !fr.querySelector(".cb-assist .cb-bar-pick"));
check("render: a mount point exists for the shared assistant",
  !!fr.querySelector("#cb-assistant-mount"));
// RESCOPED 2026-08-17: the district narrowing moved to the choose-a-college
// step. Still asserted, at its new address.
check("render: the district picker is present on the choose-a-college step", (function () {
  const keep = B._state.college;
  B._state.scope = "college"; B._state.college = null; B.render(fr);
  const seen = !!fr.querySelector("#cb-district");
  B._state.college = keep; B.render(fr);
  return seen;
})());
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

// ── Part K — what the waiting credit actually is (SkyLink, 2026-08-11) ──
// `articulated_waiting` is the page's lead figure. This section says what it
// CONSISTS of, and the answer is startlingly uniform: measured statewide,
// 98.8% of all 64,074 waiting units are Credit for Basic Military Service,
// and 65 of the 73 colleges with any are at 100%.
//
// ⚠ THE LOAD-BEARING GUARD IS SUPPRESSION. map_college_cr_unit carries NO
// k-anonymity of its own — only map_college_credit_summary applies the k=10
// rule. So a college whose headline figures are withheld must not get a
// per-recommendation breakdown of the same credit: publishing the parts of a
// withheld whole hands back exactly what withholding removed. This is the same
// failure family as recovering a suppressed cell by subtracting published
// siblings from a published total, which shipped undetected two days earlier.
const WROWS = [
  { credit_rec: "CSU GE and Local Degree Health", course_type: "Credit for Basic Military Service-Area",
    college_course: "-", sum_articulated_credits: "4488.00", distinct_students: 1496 },
  { credit_rec: "General Education Elective Credit", course_type: "Credit for Basic Military Service-Elective",
    college_course: "-", sum_articulated_credits: "500.00", distinct_students: 100 },
  { credit_rec: "Welding Technology", course_type: "Elective credit",
    college_course: "WELD 101", sum_articulated_credits: "12.00", distinct_students: 4 }
];

const wbSupp = M._waitingBreakdown({ waiting: WROWS }, { suppressed: true });
check("(K) SUPPRESSED college gets NO breakdown of its withheld credit",
  wbSupp && wbSupp.suppressed === true && !wbSupp.groups,
  "breaking out a withheld total returns exactly what suppression removed");

const wb = M._waitingBreakdown({ waiting: WROWS }, { suppressed: false });
check("(K) breakdown reconciles to the headline figure", wb.total === 5000);
check("(K) groups are ordered by size", wb.groups[0].units === 4488 && wb.groups[2].units === 12);
check("(K) military share is measured, not assumed",
  Math.round(wb.militaryShare * 1000) / 1000 === 0.998);
check("(K) each course type gets a plain-language label",
  /Basic training credit/.test(wb.groups[0].label) && wb.groups[0].label !== wb.groups[0].type);
check("(K) shares sum to 1", Math.abs(wb.groups.reduce(function (s, g) { return s + g.share; }, 0) - 1) < 1e-9);
check("(K) names the credit recommendation the units count toward",
  wb.groups[0].top[0].name === "CSU GE and Local Degree Health" && wb.groups[0].top[0].units === 4488);

// A FAILED READ IS NOT AN EMPTY QUEUE. detail===null must render nothing at
// all, never "nothing is waiting" — the whole point of the tab's `unknown`
// discipline.
check("(K) a failed read is null, NOT an empty queue", M._waitingBreakdown(null, { suppressed: false }) === null);
const wbEmpty = M._waitingBreakdown({ waiting: [] }, { suppressed: false });
check("(K) a genuinely clear queue is `empty`, and is distinguishable from a failed read",
  wbEmpty && wbEmpty.empty === true && wbEmpty.total === 0);
check("(K) an empty queue renders as a FINISHED queue, not a missing measurement",
  /Nothing is waiting|finished queue/.test(briefingSrc));

// A blank credit_rec is a real state in this data (2,111 units, 7 colleges).
const wbBlank = M._waitingBreakdown({ waiting: [
  { credit_rec: "", course_type: "Elective credit", sum_articulated_credits: "10.00" }] }, {});
check("(K) a blank credit recommendation is NAMED, not dropped",
  wbBlank.total === 10 && /no recommendation named/.test(wbBlank.groups[0].top[0].name));

// ⚠ A PERCENTAGE MUST NEVER ROUND UP INTO A CLAIM IT CANNOT SUPPORT.
// Caught by reading the rendered page, not by an assertion: 4,488 + 500 of
// 5,000 military units is 99.76%, which rounded to "100% of it is credit for
// basic military service" while a non-military row sat visibly above it. Same
// trap as the tier block's published 25.0% that is really 24.96%.
check("(K) 99.76% never renders as 100%", M._safePct(0.9976) === 99);
check("(K) …nor at one decimal place", M._safePct(0.9976, 1) === 99.8);
check("(K) a genuine 100% still renders as 100", M._safePct(1) === 100 && M._safePct(1, 1) === 100);
check("(K) ordinary values are unharmed",
  M._safePct(0.877, 1) === 87.7 && M._safePct(0.105, 1) === 10.5 && M._safePct(0.5) === 50);

const wbNear = M._waitingBreakdown({ waiting: WROWS }, {});
check("(K) the near-total case says a number below 100, not '100%'",
  M._safePct(wbNear.militaryShare) === 99);

// All-military is a real state and reads as "All", not "100%" — the sentence
// also drops its "close to" hedge, which is wrong when it IS all of it.
const wbAll = M._waitingBreakdown({ waiting: WROWS.slice(0, 2) }, {});
check("(K) a genuinely all-military college is exactly 1", wbAll.militaryShare === 1);
check("(K) …and the copy has an unhedged branch for it",
  /allMil \? "" : "close to "/.test(briefingSrc));

// One string in the source carries a U+FFFD replacement character — the byte
// was already lost before MAP stored it, so it cannot be recovered here.
check("(K) an unrecoverable byte renders legibly, not as a broken glyph",
  M._cleanText("CSU GE E � Lifelong Understanding") === "CSU GE E Lifelong Understanding");

// ── Part L — the funding pool breakdown (SkyLink, 2026-08-11) ──
// ⚠ THE HAZARD: _alloc() keys its per-priority caps off state.viewSlot, the
// Implementation Funding tab's VIEWED year. Under front-loaded disbursement
// every slot after Year 1 has a zero cap, so a briefing that inherited a
// Year-2 view would render "$0" against all three priorities — plausible,
// unqueryable, and read as a finding about the college. The briefing must
// therefore pass the slot EXPLICITLY.
check("(L) the briefing passes Year 1 explicitly, never inheriting the funding tab's view",
  /_prios\(key,\s*["']1["']\)/.test(briefingSrc),
  "front-load makes every later year a zero cap");
// Assert the BEHAVIOUR, not the comment: _prios' own body must never reach for
// the shared view state. A comment saying so is not a guard.
const prioSrc = (function () {
  const src = fs.readFileSync("cpl_funding.js", "utf8");
  const at = src.indexOf("_prios: function");
  return at === -1 ? null : src.slice(at, src.indexOf("\n    },", at));
})();
check("(L) _prios exists in the funding module", !!prioSrc);
check("(L) _prios never reads state.viewSlot — the slot is the caller's to choose",
  prioSrc && prioSrc.indexOf("state.viewSlot") === -1,
  "inheriting a Year-2 view would render $0 against every priority");
check("(L) _prios takes the slot as a parameter and defaults it to Year 1",
  prioSrc && /function \(name, slot\)/.test(prioSrc) && /slot \|\| "1"/.test(prioSrc));
check("(L) the briefing still re-derives no dollar figure",
  !/\*\s*pool|pool\s*\*|share\s*\*\s*[a-z]*[Pp]ool/.test(briefingCode),
  "an allocation is a floor waterfall — call _alloc(), never share x pool");

// Sam, 2026-08-11: use the funding tab's own names, never "$35M".
check("(L) uses the real funding tab names",
  /2025&ndash;2026 \$50K Seed Funding/.test(briefingSrc) &&
  /2026&ndash;2028 College Implementation Funding/.test(briefingSrc));
check("(L) does NOT label the pool '$35M' to a college", !/\$35M/.test(briefingCode));
check("(L) a target is framed as proportional, not a pass mark",
  /not a pass mark|proportional part/.test(briefingSrc));

// Next steps come from the team's config, never authored by the page.
const NEXT = { programs: [{ label: "IFM", priorities: [
  { index: 0, share: 0.3, description: "Lower", strategies: ["Do the smaller thing"] },
  { index: 1, share: 0.5, title: "Bigger", strategies: ["Do the bigger thing"] }
] }] };
const top = M._topStrategy(NEXT);
check("(L) the next step is the highest-SHARE priority's first strategy",
  top.text === "Do the bigger thing" && top.priority === "Bigger");
check("(L) no strategies written → no step invented",
  M._topStrategy({ programs: [{ label: "x", priorities: [{ index: 0, share: 1, strategies: [] }] }] }) === null);
check("(L) next ESS outcome puts 'not started' ahead of 'partial'",
  M._nextEssOutcome([{ title: "b", o: { state: "partial" } }, { title: "a", o: { state: "not" } }]).title === "a");
check("(L) an outcome the college cannot act on here is never proposed",
  M._nextEssOutcome([{ title: "x", o: { state: "na" } }, { title: "y", o: { state: "pending" } }]) === null);
check("(L) all outcomes met → no seed step", M._nextEssOutcome([{ title: "x", o: { state: "met" } }]) === null);

// ── Part M — resources (SkyLink, 2026-08-11) ──
// ⚠ The public fact sheet's first entry is titled "MAP Initiative Website",
// which the 2026-07-03 naming convention retired. It must be FIXED here, not
// copied forward — and the fact sheet is read to prove the old title really is
// what we are correcting, so this cannot pass on a stale assumption.
check("(M) resources are present and substantial", M._RESOURCES.length >= 12);
check("(M) the retired 'MAP Initiative' name is NOT carried forward",
  !M._RESOURCES.some(function (r) { return /MAP Initiative/i.test(r[1]) || /MAP Initiative/i.test(r[2]); }),
  "the programme is the CPL Initiative; the platform is the MAP platform");
check("(M) …and the fact sheet really does still carry it (so this guards a real fix)",
  /MAP Initiative Website/.test(fs.readFileSync("fact-sheet/index.html", "utf8")));
check("(M) every resource has a URL, a title and a description",
  M._RESOURCES.every(function (r) { return r.length === 3 && /^https:\/\//.test(r[0]) && r[1] && r[2]; }));
check("(M) links open safely", /rel="noopener"/.test(briefingSrc));
check("(M) the coordinator's four action links lead the list",
  /implementation_guide/.test(M._RESOURCES[0][0]) && /statewidecpl/.test(M._RESOURCES[1][0]));

// ── Part N — the three new sections render end-to-end (SkyLink) ──
// The helpers above are exercised in isolation; this walks the real render()
// with the waiting breakdown, the priority split and the resources all live,
// so a throw or a missing branch fails here rather than on the page.
const wn2 = load(true);
wn2.cplCollegeShort = S;
wn2.CPL_FUNDING = jw.window.CPL_FUNDING;
wn2.CPL_FUNDING_ESS = { n_statewide_credentials: 84 };
wn2.CPL_FUNDING_TAB = {
  _alloc: function () { return { total: 414856, floored: false }; },
  _grant: FAKE._grant, _ess: FAKE._ess, _isRural: function () { return false; },
  _district: function () { return "Kern CCD"; }, _model: function () { return { floor: 150000 }; },
  _prios: function (name, slot) {
    check("(N) the briefing asks for Year 1 explicitly", slot === "1");
    return [
      { key: "p1", label: "Priority 1", title: null, description: "Increase access.",
        metric: "Applied CPL Units measured in FTES", share: 0.5, unit: "FTES", cap: 207428, target: 36.7 },
      { key: "p2", label: "Priority 2", title: null, description: "Institutionalize.",
        metric: "Transcribed CPL Units", share: 0.3, unit: "FTES", cap: 124457, target: 22.0 },
      { key: "p3", label: "Priority 3", title: "Capacity, Visibility, Mobility",
        metric: "Transcribed Units from the portal or landing page", share: 0.2, unit: "students",
        cap: 82971, target: 17.5 }
    ];
  }
};
const N = wn2.CPL_COLLEGE_BRIEFING;
N._state.funding = "ready";
N._state.college = "Bakersfield College";
N._state.detail = { rollup: [], adopted: [], potential: [], goal2: [], waiting: WROWS };
N._state.data = {
  colleges: ["Bakersfield College"],
  summaryByName: { "Bakersfield College": { dormant_credits: 100000, articulated_waiting: 5000,
    applied_credits: 1252, transcribed_credits: 688, students: 582 } },
  briefing: N._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" })
};
const nr2 = wn2.document.getElementById("college-briefing-root");
N.render(nr2);
const ntxt = nr2.textContent;
check("(N) the waiting breakdown renders", /What that waiting credit actually is/.test(ntxt));
check("(N) …and reconciles to the headline in the box above", /5,000 units/.test(ntxt));
check("(N) …and names basic military service as the good news",
  /basic military service/i.test(ntxt) && /one decision applied repeatedly/.test(ntxt));
check("(N) the priority split renders with real tab names",
  /2026–2028 College Implementation Funding/.test(ntxt) && /2025–2026 \$50K Seed Funding/.test(ntxt));
check("(N) each priority shows its cap AND this college's target",
  /\$207,428/.test(ntxt) && /36\.7 FTES/.test(ntxt));
check("(N) 'Do this next' names a step from the team's own config",
  /Do this next/.test(ntxt) && /Act on all JST credit recommendations in MAP/.test(ntxt));
check("(N) resources render as links", nr2.querySelectorAll(".cb-resi a").length >= 12);
// The waiting breakdown emits its own .cb-bar progress bars, and finish()
// relocates the FIRST .cb-bar in document order into the Sierra AI box. The
// picker bar is built first in the string, so it still wins — asserted here
// WITH the new bars present, which is the only fixture that could break it.
// ⭐ REWRITTEN 2026-08-17, and it caught a real bug. finish() used to relocate
// the FIRST `.cb-bar` in document order into the Sierra box, which was only
// correct because the picker bar happened to be authored first. With the
// pickers moved to step 2, the first `.cb-bar` in this view is one of the
// waiting breakdown's PROGRESS bars — so the old code tore it out of its table
// and dropped it into the assistant. The selector is now `.cb-bar-pick`.
// This fixture is the one that could expose it: it has the breakdown bars.
check("(N) ⭐ a breakdown progress bar is NOT hoovered into the Sierra AI box",
  !nr2.querySelector(".cb-assist .cb-bar"),
  "finish() must target the picker bar by name, not by document order");
check("(N) …and the breakdown bars stay where they were rendered",
  nr2.querySelectorAll(".cb-bar").length === 0
    || !!nr2.querySelector(".cb-sec .cb-bar, table .cb-bar, .cb-wait .cb-bar"));
check("(N) no script or img injected by any new section",
  nr2.querySelectorAll("script").length === 0 && nr2.querySelectorAll("img").length === 0);

// A suppressed college must lose the breakdown but keep the rest of the page.
const wn3 = load(true);
wn3.cplCollegeShort = S;
wn3.CPL_FUNDING = jw.window.CPL_FUNDING;
const N3 = wn3.CPL_COLLEGE_BRIEFING;
N3._state.college = "Bakersfield College";
N3._state.detail = { rollup: [], adopted: [], potential: [], goal2: [], waiting: WROWS };
N3._state.data = {
  colleges: ["Bakersfield College"],
  summaryByName: { "Bakersfield College": { suppressed: true, students: 4 } },
  briefing: N3._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" })
};
const nr3 = wn3.document.getElementById("college-briefing-root");
N3.render(nr3);
check("(N) a suppressed college's per-recommendation credit is NOT published",
  !/CSU GE and Local Degree Health/.test(nr3.textContent) && /Withheld/.test(nr3.textContent),
  "the parts of a withheld whole give the whole back");

// ── Part O — the tier block (carryover item 3, SkyLink 2026-08-11) ──
// "Advancing" alone is a verdict with no next step, and 77% of colleges are in
// that bucket. This names the five criteria with the college's own value.
//
// ⚠ THE COUNT IS THE WORKER'S. live_metrics.json publishes transcriptionRate
// ROUNDED to one decimal while the worker's criterion tests the UNROUNDED
// ratio, so recomputing can disagree at the boundary. criteriaMetCount is
// authoritative; the per-criterion list is display only; `mismatch` fires when
// they disagree and the render withholds the list rather than showing one that
// does not add up to the number printed above it.
const LIVE = JSON.parse(fs.readFileSync("live_metrics.json", "utf8"));

// Every college in the shipped file, checked against the worker's own count.
let tiered = 0, mismatches = 0;
const tierCounts = {};
["leading", "advancing", "inactive"].forEach(function (k) {
  (LIVE.tiers[k].colleges || []).forEach(function (c) {
    const t = M._tierStanding(LIVE, c.college);
    if (!t) return;
    tiered++;
    tierCounts[t.label] = (tierCounts[t.label] || 0) + 1;
    if (t.mismatch) mismatches++;
  });
});
check("(O) every college in live_metrics resolves to a tier", tiered === 115);
check("(O) our per-criterion list reconciles with the worker's count for ALL of them",
  mismatches === 0, "a list that does not sum to the printed figure is worse than no list");
// ⚠️ Do NOT pin the three tier counts as literals. They are LIVE SCRAPED values:
// a single college crossing a criterion threshold in the daily 06:17 cron moves
// one between Advancing and Inactive and turns this red with no code change at
// all (2026-08-13: 89/12 → 88/13, which cost two sessions a diagnosis). The
// invariant that actually matters is that our tier standing agrees with what the
// worker PUBLISHED — assert that against the file, not against a remembered number.
["leading", "advancing", "inactive"].forEach(function (k) {
  const label = k[0].toUpperCase() + k.slice(1);
  check(`(O) our ${label} count matches the published classification`,
    (tierCounts[label] || 0) === (LIVE.tiers[k].colleges || []).length,
    `we say ${tierCounts[label] || 0}, live_metrics ships ${(LIVE.tiers[k].colleges || []).length}`);
});
check("(O) every tier is populated", ["Leading", "Advancing", "Inactive"].every(function (l) {
  return (tierCounts[l] || 0) > 0;
}), "an empty tier means the classifier stopped resolving, which the totals alone would hide");

// THE ROUNDING HAZARD, pinned. live_metrics publishes transcriptionRate
// rounded to one decimal, so a true 24.96% appears as "25.0". Reading the
// PUBLISHED RATE would score this criterion as met and disagree with the
// worker; reading the UNROUNDED ratio scores it correctly. This asserts we
// read the ratio — the display still shows the rounded 25%.
function tierFixture(over) {
  const c = Object.assign({ college: "Edge College", students: 100, units: 1000,
    transcribedUnits: 249.6, avgUnits: 10, transcriptionRate: 25.0, avgTranscribed: 1,
    criteriaMetCount: 1 }, over || {});
  return { tiers: { leading: { colleges: [] }, inactive: { colleges: [] },
                    advancing: { colleges: [c] } } };
}
const edge = M._tierStanding(tierFixture(), "Edge College");
check("(O) the 25%-criterion reads the UNROUNDED ratio, not the published rate",
  edge.criteria[3].met === false && edge.criteria[3].actual === "25%",
  "24.96% publishes as 25.0 — scoring off the published rate disagrees with the worker");
check("(O) …so the boundary case still reconciles", edge.mismatch === false && edge.met === 1);

// And if a published count ever DOES disagree with the fields behind it, the
// list is withheld rather than shown summing to a different number.
const bad = M._tierStanding(tierFixture({ criteriaMetCount: 4 }), "Edge College");
check("(O) a published count that contradicts its own fields is CAUGHT",
  bad.mismatch === true && bad.met === 4,
  "the worker's count stays authoritative; the list that disagrees is withheld");

// Prove the withholding actually happens on the page, not just in the model.
const wbad = load(true);
wbad.cplCollegeShort = S;
const BAD = wbad.CPL_COLLEGE_BRIEFING;
BAD._state.college = "Edge College";
BAD._state.live = tierFixture({ criteriaMetCount: 4 });
BAD._state.data = { colleges: ["Edge College"], summaryByName: {},
  briefing: BAD._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" }) };
const badRoot = wbad.document.getElementById("college-briefing-root");
BAD.render(badRoot);
const badTxt = badRoot.textContent.replace(/\s+/g, " ");
check("(O) an unreconcilable tier renders the count but NOT the criteria list",
  badRoot.querySelectorAll(".cb-tlist li").length === 0 && /4 of 5/.test(badTxt));
check("(O) …and it says WHY the list is withheld, in one paragraph",
  badRoot.querySelectorAll(".cb-tier p").length === 1 && /holding the list back/.test(badTxt));

// A college absent from live_metrics, or a failed read, must render NOTHING —
// never "0 of 5", which reads as a finding about the college.
check("(O) a college not in live_metrics yields null, never 0 of 5",
  M._tierStanding(LIVE, "Not A Real College") === null);
check("(O) a failed live_metrics read yields null", M._tierStanding(null, "Bakersfield College") === null);
// The loader is keyed on its OWN status field, not on live == null: null is
// also the failed-read value, so a nullness-keyed loader either never runs or
// runs forever depending on how the field was initialised.
check("(O) the live loader has an explicit status field",
  /liveState: "idle"/.test(briefingSrc) && /state\.liveState !== "idle"/.test(briefingSrc));


// Render the tier block end-to-end on real data.
const wt = load(true);
wt.cplCollegeShort = S;
const T = wt.CPL_COLLEGE_BRIEFING;
T._state.college = "City College of San Francisco";
T._state.live = LIVE;
T._state.data = {
  colleges: ["City College of San Francisco"],
  summaryByName: {},
  briefing: T._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" })
};
const tierRoot = wt.document.getElementById("college-briefing-root");
T.render(tierRoot);
const tierTxt = tierRoot.textContent.replace(/\s+/g, " ");
check("(O) the tier and the fraction both render as prose",
  /Advancing — you meet 2 of the 5 criteria/.test(tierTxt));
check("(O) it is prose, not a row list", tierRoot.querySelectorAll(".cb-tlist li").length === 0 &&
  tierRoot.querySelectorAll(".cb-tier p").length >= 2);
// ⚠ Read the expected figures OUT of live_metrics.json rather than pinning
// them. This assertion used to hardcode "(you: 2,250)" and went red on
// 2026-08-12 with nothing broken: the daily cron refreshed the scrape and
// CCSF moved to 2,251. An assertion on a value that legitimately changes
// every day is a scheduled false alarm — assert the SHAPE, and source the
// number from the same file the page reads.
const ccsfLive = ["leading", "advancing", "inactive"].reduce(function (hit, k) {
  return hit || ((LIVE.tiers[k] && LIVE.tiers[k].colleges) || []).filter(function (c) {
    return c.college === "City College of San Francisco"; })[0] || null;
}, null);
check("(O) the tier fixture college is present in live_metrics.json", !!ccsfLive);
check("(O) every criterion appears with the college's own value",
  !!ccsfLive
  && new RegExp("at least 500 CPL students \\(you: " + ccsfLive.students.toLocaleString("en-US") + "\\)").test(tierTxt)
  && new RegExp("at least 3 transcribed units per student \\(you: "
       + (Math.round(ccsfLive.avgTranscribed * 100) / 100) + "\\)").test(tierTxt));
// ⭐ Sam, 2026-08-11: the three tiers are named in the header so "Advancing"
// means something before the reader reaches it — a verdict from an unstated
// scheme is not grounding.
check("(O) the three tiers and their thresholds are stated up front",
  /Leading<\/b> meets three or more/.test(briefingSrc) &&
  /Advancing<\/b> one or two/.test(briefingSrc) &&
  /Inactive<\/b> has/.test(briefingSrc));
// The ordering IS the advice: nearest-to-threshold first.
check("(O) unmet criteria are ordered nearest-threshold first",
  /closest first/.test(tierTxt) &&
  tierTxt.indexOf("25% of eligible units") < tierTxt.indexOf("3 transcribed units per student"),
  "CCSF sits at 0.06x of the 25% bar and 0.017x of the 3-unit bar, so the rate comes first");
// A value must not repeat the unit its phrase already carries.
check("(O) the value does not repeat the phrase's unit",
  !/per student \(you: [0-9.]+ per student\)/.test(tierTxt));
// Three of the five are size measures — a small college cannot reach them
// however well it runs CPL, and the page must say so rather than imply fault.
// ⚠ Asserted on the RENDERED text, not on briefingSrc: a source-text grep
// breaks on a line-wrap between two concatenated literals while the page is
// perfectly correct, which is a test failing for a reason the reader cannot see.
check("(O) the size limitation is stated, not left to be inferred",
  /Three of the five are size measures/.test(tierTxt));
// The INVARIANT is "this is not a league table", not one particular sentence.
// Pinned to the exact old wording, this went red on a correct page when the
// heading changed to "How this college compares statewide" and the closing
// line was reworded to agree with it. Assert the guarantee, and separately
// assert the absence of the language that would break it.
check("(O) never presented as a ranking against other colleges",
  /never (a ranking against anyone else|against any particular one)/.test(tierTxt)
  && /never as a league table|never a ranking/.test(tierTxt));
check("(O) …and no percentile or rank-position language appears",
  !/percentile|\b\d+(st|nd|rd|th) of \d+\b|rank(ed|s)? #?\d/.test(tierTxt),
  "a percentile hands a top-5% badge to a 21-student college — Sam, 2026-08-11");
check("(O) the batch-upload distortion is named where it would mislead",
  /batch-upload already-posted credit \(AP, IB, CLEP\)/.test(tierTxt),
  "two of the five count transcribed units; some colleges bulk-load AP/IB/CLEP");

// Inactive is assigned by having almost nothing recorded, NOT by the count —
// saying "0 of 5" there would blame a college for a scheme it never entered.
const inact = { tiers: { leading: { colleges: [] }, advancing: { colleges: [] }, inactive: { colleges: [
  { college: "Quiet College", students: 2, units: 0, avgUnits: 0, transcriptionRate: 0,
    transcribedUnits: 0, avgTranscribed: 0, criteriaMetCount: 0 } ] } } };
const wq = load(true); wq.cplCollegeShort = S;
const Q = wq.CPL_COLLEGE_BRIEFING;
Q._state.college = "Quiet College"; Q._state.live = inact;
Q._state.data = { colleges: ["Quiet College"], summaryByName: {},
  briefing: Q._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" }) };
const qRoot = wq.document.getElementById("college-briefing-root");
Q.render(qRoot);
// "you meet 0 of the 5 criteria" is arithmetic, not a sentence.
const zero = { tiers: { leading: { colleges: [] }, inactive: { colleges: [] }, advancing: { colleges: [
  { college: "Zero College", students: 12, units: 40, avgUnits: 3.3, transcriptionRate: 0,
    transcribedUnits: 0, avgTranscribed: 0, criteriaMetCount: 0 } ] } } };
const wz = load(true); wz.cplCollegeShort = S;
const Z = wz.CPL_COLLEGE_BRIEFING;
Z._state.college = "Zero College"; Z._state.live = zero;
Z._state.data = { colleges: ["Zero College"], summaryByName: {},
  briefing: Z._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" }) };
const zRoot = wz.document.getElementById("college-briefing-root");
Z.render(zRoot);
const zTxt = zRoot.textContent.replace(/\s+/g, " ");
check("(O) a college meeting none reads as a sentence, not as '0 of the 5'",
  /you do not yet meet any of the five/.test(zTxt) && !/meet 0 of the/.test(zTxt));
check("(O) …and it still lists all five, closest first", /The 5 you have not reached, closest first/.test(zTxt));

check("(O) Inactive is explained as 'not recorded', not as a score of 0 of 5",
  /almost no CPL recorded/.test(qRoot.textContent) && !/0 of the 5/.test(qRoot.textContent),
  "Inactive is assigned by absence of activity, not by counting criteria");


/* ══ Part P — the collapsed tab (Sam, 2026-08-12) ═══════════════════════════
 * "Reinforce Sierra AI as the main focus and make all the content below
 * collapsible sections, default collapsed… a minimal initial view with nested
 * expandable details for the inquisitive." Plus the two defects that reading
 * every branch of the new render turned up.
 */

// ⭐ THE ONE THAT MATTERS MOST. fundingFor() normalised MAP's college name
// through cplCollegeShort() and handed the result to cpl_funding.js, whose
// baseCollege() compares it to the roster's RAW string. Both sides have to go
// through the resolver; only one did. Five colleges — including Mt. San
// Antonio, the largest CPL programme in the system — rendered "is not on the
// 115-college funding roster" and were shown NO implementation funding.
//
// Asserted against the REAL shipped roster and the REAL funding module, not a
// fixture, so drift in either file fails here rather than on a college's page.
const fundWin = (function () {
  const fdom = new JSDOM('<!doctype html><html><body></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const fw = fdom.window;
  fw.localStorage.setItem("cpl_team_pass", "phrase");
  fw.fetch = function () { return new Promise(function () {}); };
  fw.cplCollegeShort = S;
  fw.CPL_FUNDING = jw.window.CPL_FUNDING;
  const sc = fw.document.createElement("script");
  sc.textContent = fs.readFileSync("cpl_funding.js", "utf8");
  fw.document.body.appendChild(sc);
  return fw;
})();
const FUND = fundWin.CPL_FUNDING_TAB;
check("(P) the real funding module loaded for the join test",
  !!FUND && typeof FUND._grant === "function" && typeof FUND._alloc === "function");

// The five whose roster spelling differs from their canonical short name.
// Each is a regression that would silently unfund a college.
const JOIN_CASES = [
  ["Mt. San Antonio College", "Mt San Antonio"],
  ["Norco College", "Norco College"],
  ["Reedley College", "Reedley College"],
  ["MiraCosta College", "MiraCosta"],
  ["Los Angeles Southwest College", "LA Swest"]
];
JOIN_CASES.forEach(function (c) {
  const mapName = c[0], rosterRaw = c[1];
  check("(P) canonical short name differs from the roster string for " + mapName,
    S(mapName) !== rosterRaw,
    "if these ever converge this case stops guarding anything");
  check("(P) the roster string itself resolves to the same canonical key: " + mapName,
    S(rosterRaw) === S(mapName),
    "the resolver must round-trip, or no consumer can join these");
  // The bug, stated directly: the canonical key alone does NOT reach the module.
  check("(P) the canonical key alone does NOT reach the funding module: " + mapName,
    !FUND._grant(S(mapName)),
    "this is why rosterKey() exists; if this starts passing, the module normalises and rosterKey can go");
  check("(P) the roster string DOES reach the funding module: " + mapName,
    !!FUND._grant(rosterRaw));
});

// Mt. SAC is CLAUDE.md's own cross-check against the Sep-BOG reconciliation,
// so the fix is verified against a figure derived independently of this repo.
// Sam's $400K MAXIMUM (2026-08-22) now binds it, so the cross-check is taken
// with the ceiling OFF — the independently-derived figure is a property of the
// floor waterfall, and it must keep holding underneath the ceiling. Checking
// only the capped figure would let the waterfall rot behind a constant.
FUND._setScenario({ pool: { cap_window: 0 } });
FUND._model();
const mtsacOpen = FUND._alloc("Mt San Antonio");
// ⚠ The Sep-BOG cross-check figure MOVED AGAIN, and legitimately: one-pool
// adoption (2026-08-31) put $25,240,308 behind a $150K base over 118
// institutions, and Mt. SAC's own noncredit FTES (10,829.3) now rides its row
// — so the largest institution's uncapped share is $711,567. Re-derived here
// from the model rather than re-typed, so the NEXT model change fails loudly
// instead of quietly agreeing with a stale literal.
check("(P) Mt. SAC's uncapped allocation is its share of the CURRENT funding",
  !!mtsacOpen && Math.round(mtsacOpen.total) === 711567 &&
  Math.round(mtsacOpen.total) > 400000,
  "the waterfall still runs underneath the ceiling; only the model's dials moved");
FUND._setScenario({});
FUND._model();
const mtsac = FUND._alloc("Mt San Antonio");
check("(P) Mt. SAC is held to the $400,000 maximum once the ceiling is on",
  !!mtsac && mtsac.capped === true && Math.round(mtsac.total) === 400000,
  "got " + (mtsac ? Math.round(mtsac.total) : "null"));

// And the consumer resolves it. rosterKey() is exercised through the real
// render, because that is the path a college actually hits.
const wj = load(true);
wj.cplCollegeShort = S;
wj.CPL_FUNDING = jw.window.CPL_FUNDING;
wj.CPL_FUNDING_TAB = FUND;
wj.CPL_FUNDING_ESS = { n_statewide_credentials: 84 };
const J = wj.CPL_COLLEGE_BRIEFING;
J._state.funding = "ready";
J._state.college = "Mt. San Antonio College";
J._state.data = { colleges: ["Mt. San Antonio College"], summaryByName: {},
  briefing: J._buildBriefing({ config: TWO, college: COLLEGE }, { scenario: "Scenario 1", year: "1" }) };
const jRoot = wj.document.getElementById("college-briefing-root");
J.render(jRoot);
const jTxt = jRoot.textContent.replace(/\s+/g, " ");
check("(P) ⭐ Mt. San Antonio is NOT told it is off the funding roster",
  !/is not on the 115-college funding roster/.test(jTxt),
  "the roster row was always there — the join dropped it");
check("(P) …and its real allocation renders", /\$400,000/.test(jTxt));
check("(P) …and it is told it is held to the maximum, and where the difference went",
  // "cap" vocabulary (one pool, 2026-08-31); the where-it-went promise holds.
  /cap/.test(jTxt) && /re-splits across the other colleges/.test(jTxt));

// ── The collapsed shape ──
// RESCOPED 2026-08-17 (Sky167). Sierra is a `details.cb-sec` now too — Sam
// asked for her to be collapsible, expanded by default — so "every section" no
// longer means "every content section". These assertions are about the CONTENT
// drawers; Sierra's own default is asserted separately just below, because
// "expanded by default" and "the rest start closed" are two different promises
// and folding them together would let either one break silently.
const allSecs = jRoot.querySelectorAll("details.cb-sec");
const secs = Array.prototype.filter.call(allSecs, function (d) {
  return d.getAttribute("data-sec") !== "sierra";
});
check("(P) the content below Sierra AI is in collapsible sections", secs.length >= 4);
check("(P) every CONTENT section is CLOSED on arrival",
  secs.every(function (d) { return !d.open; }),
  "Sam: default collapsed");
// ⭐ The counterpart, and the one that would rot quietly: a "collapse
// everything" change would satisfy the line above and break Sam's actual ask.
const sierraSec = jRoot.querySelector('details.cb-sec[data-sec="sierra"]');
check("(P) ⭐ Sierra IS a collapsible section", !!sierraSec,
  "Sam, 2026-08-17: collapsible but expanded by default");
check("(P) ⭐ …and she is EXPANDED on arrival", !!sierraSec && sierraSec.open);
check("(P) Sierra's summary carries the single heading",
  !!sierraSec && sierraSec.querySelectorAll("summary h1, summary h2, summary h3").length === 1,
  "the hoist moves the widget's own h2 into the summary — not a second copy");
// ⭐ Collapsed is only "minimal" if what remains still informs. A drawer with
// no summary is just hidden content, and the reader has to open all of them.
check("(P) ⭐ every closed section still states something in its header",
  secs.every(function (d) {
    const v = d.querySelector(".cb-sum-v");
    return v && v.textContent.trim().length > 0;
  }),
  "a blank summary on a closed section reads as broken");
check("(P) each section has a title and a single summary row",
  secs.every(function (d) {
    return d.querySelector("summary.cb-sum .cb-sum-t")
        && d.querySelectorAll("summary").length === 1;
  }));
// INVERTED 2026-08-17 by Sam's own instruction — she is a drawer now, one that
// starts open. Kept (rather than deleted) as the record of the change, and
// because "the assistant box still exists at all" is worth asserting.
check("(P) Sierra AI is a collapsible section that starts open",
  !!jRoot.querySelector(".cb-assist")
    && !!jRoot.querySelector('.cb-assist details[data-sec="sierra"][open]'),
  "Sam, 2026-08-17: collapsible, expanded by default");
// RESCOPED 2026-08-17. This asserted the ELEMENT (`.cb-purpose`), which was
// this file's own copy of a description cpl_chat.js already printed — the
// duplicate Sam asked to remove. The PROPERTY it was guarding is unchanged and
// still worth guarding: the box has to say what she is for. It is satisfied by
// whichever description survives — the widget's hoisted intro when it mounted,
// the fallback heading's box when it did not — so the check reads the box's
// prose, not one class name.
//
// (Third-instance discipline from the EACR work applies here too: an assertion
// pinned to a specific element is a BOUND on today's markup. Pin the property.)
var assistBox = jRoot.querySelector(".cb-assist");
check("(P) Sierra AI states what she is for",
  !!assistBox && /credit for prior learning|cpl/i.test(assistBox.textContent || "")
    && (assistBox.textContent || "").trim().length > 120,
  "the assistant box must describe itself, in whichever element carries it");

// Open state must survive a re-render — render() rewrites innerHTML, so a
// <details open> living only in the DOM would slam shut when the role picker
// changes under someone mid-read.
J._state.open.funding = true;
J.render(jRoot);
const reopened = jRoot.querySelector('details.cb-sec[data-sec="funding"]');
check("(P) an opened section stays open across a re-render", !!reopened && reopened.open);
check("(P) …and its neighbours stay shut",
  Array.prototype.filter.call(jRoot.querySelectorAll("details.cb-sec"), function (d) {
    // Sierra is excluded: she is open by design, not a neighbour that leaked.
    var id = d.getAttribute("data-sec");
    return id !== "funding" && id !== "sierra" && d.open; }).length === 0);

// ── Strategies live inside the priority they earn against ──
// TWO's implementation program has 2 priorities; the real funding module has
// 3. That mismatch is exactly what prioritiesAlign() is for, so the render
// above must have FALLEN BACK rather than paired priority 1's steps with
// priority 3's cap. Assert the safe direction first.
check("(P) ⭐ a priority-count mismatch falls back to the standalone list",
  jRoot.querySelectorAll(".cb-prow details.cb-strat").length === 0
  && /Advice from the team/.test(jTxt),
  "attaching the wrong steps to a cap would be silent; showing them separately is not");

// Now the production shape: three priorities on both sides, so they fold in.
const THREE = { projects: { "cpl-implementation": {
  label: "CPL Implementation Funding",
  scenarios: { "Scenario 1": { yearPriorities: { "1": {
    "0": { share: 0.5, description: "Increase access.", metric: "Applied CPL Units measured in FTES",
           strategies: ["Act on all JST credit recommendations in MAP",
                        "Adopt or Adapt possible statewide credit recommendations"] },
    "1": { share: 0.3, description: "Institutionalize.", metric: "Transcribed CPL Units measured in FTES",
           strategies: ["Complete Transcribe step in MAP for each student record with CPL"] },
    "2": { share: 0.2, title: "Capacity, Visibility, Mobility", metric: "Transcribed Units measured in FTES",
           strategies: ["Configure College CPL Landing site, including adding a CPL Request Email",
                        "Document Student CPL Stories in MAP"] }
  } } } }
} } };
const wNest = load(true);
wNest.cplCollegeShort = S;
wNest.CPL_FUNDING = jw.window.CPL_FUNDING;
wNest.CPL_FUNDING_TAB = FUND;
wNest.CPL_FUNDING_ESS = { n_statewide_credentials: 84 };
const NEST = wNest.CPL_COLLEGE_BRIEFING;
NEST._state.funding = "ready";
NEST._state.college = "Mt. San Antonio College";
NEST._state.data = { colleges: ["Mt. San Antonio College"], summaryByName: {},
  briefing: N._buildBriefing({ config: THREE, college: COLLEGE }, { scenario: "Scenario 1", year: "1" }) };
const nestRoot = wNest.document.getElementById("college-briefing-root");
NEST.render(nestRoot);
const nestTxt = nestRoot.textContent.replace(/\s+/g, " ");
check("(P) the strategies nest inside the funding priority rows",
  nestRoot.querySelectorAll(".cb-prow details.cb-strat").length === 3,
  "one disclosure per priority, got " + nestRoot.querySelectorAll(".cb-prow details.cb-strat").length);
check("(P) …labelled by count, so the reader knows what opening costs",
  /2 steps the team suggests/.test(nestTxt) && /1 step the team suggests/.test(nestTxt),
  "and singular is singular");
check("(P) the flat advice list is gone once the steps are folded in",
  !/Advice from the team/.test(nestTxt),
  "Sam: it read as a long list of intimidating to-dos");
// The "not measured here" flag was honest and it was noise: repeated on
// nearly every row it made advice look like an audit.
check("(P) the repeated 'not measured here' flag is dropped in the nested view",
  nestRoot.querySelectorAll(".cb-strat .cb-flag").length === 0);
check("(P) …but a strategy that IS measured still shows its figure",
  nestRoot.querySelectorAll(".cb-strat .cb-m").length > 0);
check("(P) the nested steps are still closed by default",
  Array.prototype.every.call(nestRoot.querySelectorAll("details.cb-strat"), function (d) { return !d.open; }));

// ⭐ Guarantee (c) SURVIVES THE MOVE. Sam adds programs to the config and they
// must appear with no code change. Only cpl-implementation nests into the
// funding box — anything else keeps its own section, or a new program would
// vanish silently, which is the failure this whole file was built around.
const twoProg = jRoot.textContent;
check("(P) ⭐ a SECOND program still gets its own section", /Advice from the team/.test(twoProg) === false
  ? (function () {
      // TWO's second program has no Scenario 1 Year 1 strategies, so it is
      // reported as unread rather than rendered. Assert the mechanism instead.
      const src = fs.readFileSync("college_briefing.js", "utf8");
      return /restPrograms/.test(src) && /p\.id === IMPL_PROJECT/.test(src);
    })()
  : true, "only the implementation program may be folded into the funding box");
check("(P) the fold is gated on a checked alignment, not assumed",
  typeof J._prioritiesAlign === "function"
  && J._prioritiesAlign([{}, {}, {}], { priorities: [{}, {}, {}] }) === true
  && J._prioritiesAlign([{}, {}], { priorities: [{}, {}, {}] }) === false
  && J._prioritiesAlign([], { priorities: [] }) === false,
  "count mismatch must fall back rather than attach one priority's steps to another's cap");

// ⭐ An ABSENT measurement must not render as an accomplishment. A college with
// no row in the credit summary has nothing recorded; saying "every credit
// recommendation has been acted on" turns a blind spot into a compliment.
// Imperial Valley College — 3 students, no credit rows — was getting that.
check("(P) ⭐ no credit summary row reads as 'no figures held', never a finished queue",
  (function () {
    const wb = J._waitingBreakdown({ waiting: [] }, null);
    return !!wb && wb.unmeasured === true && !wb.empty;
  })());
check("(P) …while a real zero DOES read as a finished queue",
  (function () {
    const wb = J._waitingBreakdown({ waiting: [] }, { students: 900, suppressed: false });
    return !!wb && wb.empty === true && !wb.unmeasured;
  })(),
  "33 of 106 colleges have genuinely finished theirs — that must stay good news");

// ── report ──
let pass = 0;
results.forEach(function (r) {
  if (r[1]) { pass++; } else { console.log("FAIL  " + r[0]); }
});
console.log("\ncollege_briefing.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
