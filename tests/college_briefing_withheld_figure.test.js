// My College — a figure withheld below 10 students must never render as zero.
//
// ⭐ WHY. From 2026-09-30 map_college_credit_summary suppresses each figure on
// the students behind it, not only on the college's total headcount (sheet
// 2026-09-30-sierra-credit-source item 1). A college with 400 CPL students and
// one student holding transcribed credit now publishes transcribed_credits =
// NULL on a row whose `suppressed` is false. The page read every figure with
// num(), and Number(null) is 0, so that NULL would have rendered as
// "0 units marked transcribed": a false zero, the worst answer the page gives.
// Sam, 2026-09-30: "when the totals (at any level) are below 10, to show
// \"<10\" on the views."
//
// Run from repo root: `npm test` (or `node tests/college_briefing_withheld_figure.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function load() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  const tp = w.document.createElement("script");
  tp.textContent = fs.readFileSync("team_phrase.js", "utf8");
  w.document.body.appendChild(tp);
  const s = w.document.createElement("script");
  s.textContent = fs.readFileSync("college_briefing.js", "utf8");
  w.document.body.appendChild(s);
  return w;
}

const w = load();
const M = w.CPL_COLLEGE_BRIEFING;

// A published college whose transcribed figure is withheld.
const THIN = { suppressed: false, students: 412, dormant_credits: 5000, articulated_waiting: 800,
  applied_credits: 3000, transcribed_credits: null, withheld: ["transcribed_credits"] };
// The same college with a TRUE zero transcribed.
const ZERO = Object.assign({}, THIN, { transcribed_credits: 0, withheld: [] });

// ── (1) the standing model keeps null as null ────────────────────────────────
const st = M._standing(THIN, null);
check("(1) a withheld figure stays null in the standing model", st.transcribed === null,
  "Number(null) is 0; the summary's NULL means withheld, not none");
check("(1) a true zero stays zero", M._standing(ZERO, null).transcribed === 0);
check("(1) the published figures beside it are untouched", st.applied === 3000 && st.eligible === 5000);

// ── (2) the Where you stand section ──────────────────────────────────────────
const sec = M._standSection(st, THIN);
const txt = new w.DOMParser().parseFromString(sec.body, "text/html").body.textContent;
check("(2) ⭐ the withheld figure reads <10, never 0",
  /<10\s*students behind this figure/.test(txt) && !/\b0\s*units marked transcribed/.test(txt));
check("(2) …and says why", /Fewer than 10 students stand behind this figure/.test(txt));
check("(2) the published figures still render", /3,000/.test(txt) && /800/.test(txt) && /412/.test(txt));
const zsec = M._standSection(M._standing(ZERO, null), ZERO);
const ztxt = new w.DOMParser().parseFromString(zsec.body, "text/html").body.textContent;
check("(2) a true zero renders as 0, not as withheld",
  /\b0\s*units marked transcribed/.test(ztxt) && !/<10/.test(ztxt));

// A withheld waiting figure moves the section header too.
const W2 = Object.assign({}, THIN, { articulated_waiting: null, withheld: ["articulated_waiting"] });
const wsec = M._standSection(M._standing(W2, null), W2);
check("(2) a withheld waiting figure never heads the section as 0 units waiting",
  /(&lt;|<)10 students/.test(wsec.summary) && !/^0 units waiting/.test(wsec.summary));

// ── (3) a college under the floor as a whole keeps its own note ──────────────
const sup = M._standSection(M._standing({ suppressed: true, students: null }, null),
  { suppressed: true, students: null });
check("(3) a suppressed college still reads as withheld, with the privacy note",
  sup && /Withheld/.test(sup.summary) && /fewer than 10 CPL students/.test(sup.body));

// ── (4) the measures behind "Do this next" ───────────────────────────────────
const tr = M._measureFor("Complete Transcribe step in MAP for each student record with CPL", THIN);
check("(4) the transcribe measure reads <10 students when its figure is withheld",
  tr.measured && tr.result && /<10 students/.test(tr.result.headline) && tr.result.withheld === true,
  "returning null here would say 'we hold nothing', which is untrue: we hold it and withhold it");
check("(4) …and never computes a percentage from a withheld figure",
  !tr.result.fraction && !/%/.test(tr.result.headline));
const trz = M._measureFor("Complete Transcribe step in MAP for each student record with CPL", ZERO);
check("(4) a true zero still measures, at 0%", trz.result && /0 of 3,000/.test(trz.result.headline));
const D2 = Object.assign({}, THIN, { dormant_credits: null, withheld: ["dormant_credits"] });
const jst = M._measureFor("Act on all JST credit recommendations in MAP", D2);
check("(4) the JST measure reads <10 students when the waiting total is withheld",
  jst.result && /<10 students/.test(jst.result.headline));

// ── report ───────────────────────────────────────────────────────────────────
let fail = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "PASS  " : "FAIL  ") + name + (ok || !why ? "" : "\n      " + why));
  if (!ok) fail++;
}
console.log(`\ncollege_briefing_withheld_figure.test.js: ${results.length - fail}/${results.length} checks passed`);
if (fail) process.exit(1);
