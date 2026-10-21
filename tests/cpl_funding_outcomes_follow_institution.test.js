// tests/cpl_funding_outcomes_follow_institution.test.js
//
// Sam, 2026-10-20, on the public funding page (funding-model/), in a side
// session beside the program-requirements harvest:
//
//   1. "Refine the Step 1 and 2 by having the user select first which view
//      they want: 'All Institutions' or 'My Institution' (note that I'm using
//      Institution rather than spelling out 'College or District' to save
//      space...but the hover over should clarify this"
//   2. "Once a view is chosen, if user selects My Institutions, require them
//      to choose one (either college or district)"
//   3. "For the Funding Outcomes section, adjust the numbers to match the
//      selected institution rather than the whole state (if an institution is
//      selected)."
//
// Asks 1 and 2 are guarded in cpl_funding_step_two_view.test.js. This file
// guards ask 3: under My Institution, with a college or a district chosen, each
// outcome card's Target and Progress lines are that institution's, and one
// sentence before the cards names it. Under All Institutions, or with none
// chosen, the cards stay statewide.
//
// The institution's figures are the SAME TERMS the statewide figures add up
// (addInstPrios, shared with earnAgg), so the identity is asserted outright:
// the colleges' figures plus the noncredit-only institutions' are the
// statewide figures. A district is its colleges added up. Its demonstrated
// dollars follow the public rule (nearest $1,000, "less than $1,000" under the
// floor), and the percentage reads the coarse figure.
//
// No figure is pinned (the funding lane's rule since 2026-09-16): every
// expectation is derived from the model, under the stored config fixture.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_outcomes_follow_institution.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("funding-model/index.html");
const CONFIG = JSON.parse(read("tests/fixtures/cpl_funding_config_e21658f9.json"));
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const money2 = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct2 = (f) => (Math.round(f * 10000) / 100).toString() + "%";
const one1 = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

// The page as funding_model_page.test.js boots it: the engine, then the
// page's own inline scripts in document order. `before` runs between the two.
function page(before) {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w = dom.window;
  w.CPL_FUNDING_NO_REMOTE = true;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  w.eval(read("cpl_funding_data.js"));
  w.eval(read("funding_model_payload.js"));
  w.eval(read("cpl_funding.js"));
  if (before) before(w);
  Array.from(w.document.querySelectorAll("script:not([src])")).map((s) => s.textContent).forEach((code) => w.eval(code));
  return { w, doc: w.document, T: w.CPL_FUNDING_TAB, F: w.CPL_FUNDING };
}
const lines = (doc) => Array.from(doc.querySelectorAll("#prios .prio")).map((el) =>
  Array.from(el.querySelectorAll(".prog")).map((x) => x.textContent));
const scopeNote = (doc) => { const n = doc.querySelector("#prios .prios-scope"); return n ? n.textContent : null; };

const { w, doc, T, F } = page();
T._setConfig(CONFIG);
T.render();

// ── statewide, the default ──────────────────────────────────────────────────
const S0 = T._publicProgress();
const L0 = lines(doc);
check("s1: All Institutions opens on the statewide cards: no scope, no note, every target line statewide",
  S0.scope === null && scopeNote(doc) === null && L0.length === S0.prios.length && L0.length > 0 &&
  L0.every((x) => /^Target: [\d,.]+ CPL FTES statewide, /.test(x[0])));

// ── the identity: every institution's lanes add up to the statewide figures ──
// The model's own per-institution API (_prios / _ncPrios, cached, cheap) over
// the whole roster: the credit lane where an institution has a credit share,
// the noncredit lane where it has a noncredit one, as addInstPrios adds them.
const nco = (F.feeders || []).filter((f) => !f.nc_ftes_on_credit_row && T._ncPrios(f.short)).map((f) => f.short);
const lanesOf = (name) => {
  const a = T._alloc(name), cr = T._prios(name) || [], nc = T._ncPrios(name) || [];
  return S0.prios.map((p, i) => ({
    target: (a.cr_award > 0.5 && cr[i] ? cr[i].target : 0) + (a.nc_award > 0.5 && nc[i] ? nc[i].target : 0),
    cap: (cr[i] ? cr[i].cap : 0) + (nc[i] ? nc[i].cap : 0) }));
};
const lane = {};
F.colleges.forEach((c) => { lane[c.college] = lanesOf(c.college); });
nco.forEach((s) => { lane[s] = lanesOf(s); });
check("s2: the roster is the 115 colleges and the three noncredit-only institutions the chooser leaves out",
  nco.length === 3 && Object.keys(lane).length === F.colleges.length + 3);
check("s3: the institutions' lane targets add up to the statewide target, priority by priority",
  S0.prios.every((p, i) => near(Object.keys(lane).reduce((t, k) => t + lane[k][i].target, 0), p.target)));
check("s4: ...and their lane ceilings to the statewide Total Possible",
  S0.prios.every((p, i) => near(Object.keys(lane).reduce((t, k) => t + lane[k][i].cap, 0), p.totalPossible)));
// The scoped line against those lanes, for the colleges each rule bites on:
// both lanes, credit only, a quarter calendar, and the maximum award. Each
// scope is read through the state the view sets (no render).
const scopeOf = (v) => {
  T._state.collegeView = "one"; T._state.oneCollege = v;
  const r = T._publicProgress();
  T._state.collegeView = "all"; T._state.oneCollege = "";
  return r;
};
const both = F.colleges.filter((c) => !c.quarter && (Number(c.noncredit_ftes) || 0) > 0)[0];
const crOnly = F.colleges.filter((c) => !c.quarter && !(T._alloc(c.college).nc_award > 0.5))[0];
const quarter = F.colleges.filter((c) => c.quarter)[0];
const capped = F.colleges.filter((c) => !c.quarter && T._alloc(c.college).capped)[0];
const sample = [both, crOnly, quarter, capped].filter(Boolean);
const per = {};
sample.forEach((c) => { per[c.college] = scopeOf(c.college); });
check("s5: a chosen college's target and Total Possible are its lanes' (" + sample.map((c) => c.college).join(", ") + ")",
  sample.length === 4 && sample.every((c) => per[c.college].prios.every((p, i) =>
    near(p.target, lane[c.college][i].target) && near(p.totalPossible, lane[c.college][i].cap))));
check("s5b: ...and its scope names it as the chooser does, one member, the maximum award counted",
  sample.every((c) => { const sc = per[c.college].scope; return sc && sc.kind === "college" && sc.members === 1 &&
    sc.atMax === (T._alloc(c.college).capped ? 1 : 0) &&
    sc.name === doc.querySelector('#cplFundOnePick option[value="' + c.college.replace(/"/g, '\\"') + '"]').textContent; }));
check("s6: the other figures on the line (the rate, the factor, the reimbursement rate) are the statewide line's",
  sample.every((c) => per[c.college].prios.every((p, i) => p.rate === S0.prios[i].rate && p.factor === S0.prios[i].factor &&
    p.price === S0.prios[i].price && p.ftes === S0.prios[i].ftes && p.label === S0.prios[i].label)));
// The public dollar rule.
const coarseOk = (p) => p.demonstrated == null ||
  (p.demonstrated >= 0 && p.demonstrated % 1000 === 0 && (!p.under || p.demonstrated === 1000) &&
   near(p.pct, p.demonstrated / p.totalPossible));
check("s7: a college's demonstrated dollars are coarse (nearest $1,000, the floor under it) and its percentage reads them",
  sample.every((c) => per[c.college].prios.every(coarseOk)));
check("s8: the semester colleges' lines count semester units, at the statewide units per FTES",
  near(per[both.college].prios[0].units / per[both.college].prios[0].target, S0.prios[0].units / S0.prios[0].target) &&
  per[both.college].prios.every((p) => p.unitWord === "semester"));
const qp = per[quarter.college].prios[0];
check("s9: a quarter college's line counts quarter units, half again as many per FTES (" + quarter.college + ")",
  qp.unitWord === "quarter" && Math.abs((qp.units / qp.target) / (S0.prios[0].units / S0.prios[0].target) - 1.5) < 0.01);

// ── a college chosen on the page: the cards repaint with its figures ──────────
T.chooseOne(both.college);
const P1 = T._publicProgress(), L1 = lines(doc), nm = P1.scope.name;
check("c1: choosing a college in Step 2 repaints the cards, and one sentence names whose figures they are",
  scopeNote(doc) === "The targets and progress below are for " + nm +
    ". Choose All Institutions in Step 1 for the statewide figures." &&
  doc.querySelector("#prios").firstElementChild.classList.contains("prios-scope"));
const tgtLine = (p, who, unit, tail) => "Target: " + one1(p.target) + " CPL FTES for " + who + ", about " +
  Math.round(p.units).toLocaleString("en-US") + " " + unit + " units, at an FTES reimbursement rate of " + money2(p.price) +
  " (the " + money2(p.rate) + " base rate times a factor of " + (+p.factor).toFixed(1) + ")." + tail;
const progLine = (p) => p.demonstrated == null ? "Progress: TBA." : "Progress: MAP records demonstrate " +
  (p.under ? "less than " : "") + money(p.demonstrated) + " of the " + money(p.totalPossible) + " Total Possible (" +
  (p.under ? "under " : "") + pct2(p.pct) + ").";
check("c2: each Target line is the college's, in its calendar's units, and says statewide nowhere",
  L1.length === P1.prios.length && L1.every((x, i) => x[0] === tgtLine(P1.prios[i], nm, "semester",
    P1.scope.atMax > 0 ? " The maximum award lowers this target." : "")) && !/statewide/.test(L1.join(" ")));
check("c3: each Progress line is the college's coarse demonstrated figure of its own Total Possible",
  L1.every((x, i) => x[1] === progLine(P1.prios[i])));
check("c4: the cards' figures moved with the choice (the college's Total Possible is not the state's)",
  P1.prios.every((p, i) => p.totalPossible < S0.prios[i].totalPossible));
// A capped college says what the maximum award does to its target.
T.chooseOne(capped.college);
check("c5: a college at the maximum award says it lowers the target (" + capped.college + ")",
  T._publicProgress().scope.atMax === 1 && lines(doc).every((x) => / The maximum award lowers this target\.$/.test(x[0])));
// A quarter college, painted.
T.chooseOne(quarter.college);
check("c6: a quarter college's lines say quarter units", lines(doc).every((x) => / quarter units, at /.test(x[0])));

// ── a district chosen: its colleges added up ─────────────────────────────────
const byD = {};
F.colleges.forEach((c) => { if (c.district) (byD[c.district] = byD[c.district] || []).push(c.college); });
const dist = Object.keys(byD).sort((a, b) => byD[b].length - byD[a].length)[0];
const members = byD[dist];
T.chooseOne("d:" + dist);
const PD = T._publicProgress(), LD = lines(doc);
check("d1: a district's scope counts its colleges and names it as the chooser does",
  PD.scope.kind === "district" && PD.scope.members === members.length &&
  PD.scope.name === doc.querySelector('#cplFundOnePick option[value="d:' + dist + '"]').textContent &&
  PD.scope.atMax === members.filter((m) => T._alloc(m).capped).length);
check("d2: its target and Total Possible are its colleges' added up",
  PD.prios.every((p, i) => near(p.target, members.reduce((t, m) => t + lane[m][i].target, 0)) &&
    near(p.totalPossible, members.reduce((t, m) => t + lane[m][i].cap, 0))));
check("d3: its demonstrated dollars are coarse too", PD.prios.every(coarseOk));
const words = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const k = PD.scope.atMax, dtail = " Its " + words[members.length - 1] + " colleges' targets add up to this figure" +
  (k > 0 ? "; the maximum award lowers the " + (k === 1 ? "target of the one that reaches" : "targets of the " + words[k - 1] + " that reach") + " it." : ".");
check("d4: each Target line is the district's, and says its colleges' targets add up to it",
  LD.every((x, i) => x[0] === tgtLine(PD.prios[i], PD.scope.name, "semester", dtail)) &&
  LD.every((x, i) => x[1] === progLine(PD.prios[i])));

// ── back to All Institutions: the statewide cards return, unchanged ─────────
doc.querySelector('#cplFundCollegeView button[data-val="all"]').click();
const S1 = T._publicProgress();
check("a1: All Institutions brings the statewide cards back, with no note",
  S1.scope === null && scopeNote(doc) === null && JSON.stringify(lines(doc)) === JSON.stringify(L0) &&
  JSON.stringify(S1.prios) === JSON.stringify(S0.prios));
// My Institution with nothing chosen keeps the cards statewide: the view
// asks for an institution first, and shows none of its figures until then.
T._state.oneCollege = "";
doc.querySelector('#cplFundCollegeView button[data-val="one"]').click();
check("a2: My Institution with none chosen keeps the statewide cards", T._publicProgress().scope === null &&
  scopeNote(doc) === null && JSON.stringify(lines(doc)) === JSON.stringify(L0));

// ── a returning reader: the remembered institution reaches the FIRST notice ──
// The remembered choice returns before render() notifies, so the page's first
// paint (and any subscriber) reads it, not only the paint that follows boot.
// A bare page (no mount) keeps this cheap: render() stops after the notice.
{
  const dom2 = new JSDOM("<!doctype html><html><head></head><body></body></html>",
    { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w2 = dom2.window;
  w2.CPL_FUNDING_NO_REMOTE = true;
  w2.CPL_FUNDING_PUBLIC = true;
  w2.CPL_FUNDING_EMBED = "college";
  w2.localStorage.setItem("cplfund_one_choice_v1", both.college);
  w2.eval(read("cpl_funding_data.js"));
  w2.eval(read("cpl_funding.js"));
  let first;
  w2.CPL_FUNDING_TAB.onModelChange(function () {
    if (first === undefined) first = w2.CPL_FUNDING_TAB._publicProgress().scope;
  });
  w2.CPL_FUNDING_TAB.boot();
  check("r1: a choice an earlier build stored never opens; the first notice reads statewide (Sam, Sheet 111 card 2)",
    (first == null || first.kind !== "college") && w2.localStorage.getItem("cplfund_one_choice_v1") === null);
}

// ── words: the scoped lines keep the house vocabulary ────────────────────────
T.chooseOne(both.college);
const said = scopeNote(doc) + " " + lines(doc).join(" ");
check("v1: no price, earn, draw, money or glyph in the scoped lines",
  !/\b(pric(e|ed|es|ing)|earn\w*|draws?|money)\b/i.test(said) && !/[×≈—]/.test(said));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
