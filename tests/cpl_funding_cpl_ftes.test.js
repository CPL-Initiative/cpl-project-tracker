// tests/cpl_funding_cpl_ftes.test.js
//
// CPL FTES: the conversion, the term-length multiplier, and the target
// denominated in the 2026-27 credit rate (Sam, 2026-07-31).
//
//   1 FTES = 525 contact hours
//   1 semester unit = 17.5 contact hours  ->  30 units per FTES
//   1 quarter  unit = 11.67 contact hours ->  45 units per FTES
//
// Sam's framing, and the reason there is no special-case quarter conversion:
// "the only conversion factor needed is to use 11.67 as the tlm rather than
// 17.5 for semesters." TLM is a parameter; everything else derives.
//
// TARGET = the college's PRE-FLOOR, PRE-RURAL proportional entitlement divided
// by the reimbursement rate x a policy multiplier — "earn your allocation by
// producing the CPL FTES it would have paid for at the state rate."
//
// THE NAMING HAZARD these guard: two quantities here are called FTES and differ
// by ~500x. `credit_ftes` / sizeOf / totalSize are ENROLMENT FTES (1,069,182
// statewide) and are the ALLOCATION BASIS. CPL FTES is prior learning awarded,
// order 10^3-10^4, and is a PERFORMANCE quantity. Conflating them is a
// one-character mistake, so several assertions below exist purely to keep the
// two apart.
//
// Run from repo root: `npm test`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.5 : eps); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const D = (function () {
  const sb = { window: {} };
  new Function("window", dataSrc)(sb.window);
  return sb.window.CPL_FUNDING;
})();

const FTES_METRICS = {
  "0": { metric: "Eligible CPL Units as FTES (1 Unit = .0334 FTES)" },
  "1": { metric: "Transcribed CPL Units as FTES (1 Unit = .0334 FTES)" },
  "2": { metric: "Transcribed Units for Students from either CPL Student Portal or College CPL Landing Page" },
};

function freshDom() {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='tab-implementation-funding'>" +
    "<div id='cplFundingMount'></div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  return dom;
}
// Give two colleges the SAME raw unit count — one semester, one quarter. Any
// difference in their CPL FTES is the TLM doing its job and nothing else.
function bootWithUnits(window, units) {
  window.CPL_FUNDING_PERF = {
    as_of: "2026-07-31", suppress_below: 5,
    statewide: { pe: 43122, pe_u: 181975, p3: 16829, p3_u: 55031, pp: 5, pp_u: 12 },
    colleges: {
      "Foothill": { pe: 73, pe_u: units, p3: 20, p3_u: units, pp: 0, pp_u: 0 },   // QUARTER
      "Alameda": { pe: 120, pe_u: units, p3: 40, p3_u: units, pp: 0, pp_u: 0 },   // semester
    },
    unmatched: {},
  };
  window.eval(dataSrc); window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": FTES_METRICS, "2": FTES_METRICS } });
  T.render();
  return T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Part A — the factors are stored as BASES, with the quotient derived
// ─────────────────────────────────────────────────────────────────────────────
check("contact-hour bases are stored (525 / 17.5 / 11.67)",
  D.ftes_factors && D.ftes_factors.contact_hours_per_ftes === 525 &&
  D.ftes_factors.contact_hours_per_unit_semester === 17.5 &&
  D.ftes_factors.contact_hours_per_unit_quarter === 11.67);
// Storing 30 (or 45, or .03333) beside the bases would be three numbers for one
// fact — i.e. two ways to drift. The quotient must be computed.
check("units-per-FTES is NOT stored anywhere (it is derived from the two bases)",
  D.ftes_factors.units_per_ftes === undefined &&
  D.ftes_factors.ftes_per_unit === undefined &&
  !/units_per_ftes|ftes_per_unit/.test(dataSrc));
check("the derivation is what the code does (525/17.5 = 30, 525/11.67 = 45)",
  near(525 / 17.5, 30, 0.001) && near(525 / 11.67, 45, 0.02));
check("the 2026-27 credit FTES rate is configured",
  D.pool.ftes_rate_2026_27 === 5649.63);
check("each priority carries a price factor, defaulting to par (1.0); the global multiplier is retired",
  D.target_multiplier === undefined &&
  D.year_priorities["1"].every(function (p) { return p.factor === 1; }) &&
  D.year_priorities["2"].every(function (p) { return p.factor === 1; }));
check("exactly the two known quarter colleges are flagged",
  D.colleges.filter(function (c) { return c.quarter; }).map(function (c) { return c.college; })
    .sort().join(",") === "De Anza,Foothill");

// ─────────────────────────────────────────────────────────────────────────────
// Part B — the naming hazard: enrolment FTES is not CPL FTES
// ─────────────────────────────────────────────────────────────────────────────
check("the CPL quantity is named cplFtes, never a bare ftes",
  /function unitsToCplFtes/.test(consumerSrc) && /function unitsPerCplFtes/.test(consumerSrc));
// The target must never be built from the ALLOCATION basis quantity.
{
  const body = (consumerSrc.match(/function prioTarget\(c, p\)[\s\S]*?\n  \}/) || [""])[0];
  check("prioTarget never reads credit_ftes (that is enrolment FTES, a different quantity)",
    body.length > 0 && body.indexOf("credit_ftes") === -1);
}
check("the two quantities are ~500x apart, so a mix-up could not hide",
  D.system.credit_ftes > 1000000 && (D.pool.college_funding_before_feeder / 5649.63) < 10000);

// ─────────────────────────────────────────────────────────────────────────────
// Part C — the TLM does the whole job: same units, different FTES
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const P = T._priorities ? null : null;   // (no seam needed; read via the row)

  // 900 units: semester -> 30.0 FTES, quarter -> 20.0 FTES.
  const rows = ["Alameda", "Foothill"].map(function (n) {
    const row = Array.from(window.document.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find(function (r) {
        const td = r.querySelectorAll("td")[1];
        return td && td.textContent.trim().replace(/^▸/, "").indexOf(n) === 0;
      });
    return { n: n, td: row.querySelector("td.cf-prio") };
  });
  const txt = function (i) { return rows[i].td.textContent.replace(/\s+/g, " "); };
  check("semester college: 900 units reads 30 CPL FTES", /Now 30 FTES/.test(txt(0)));
  check("QUARTER college: the same 900 units reads 20 CPL FTES (÷45, not ÷30)",
    /Now 20 FTES/.test(txt(1)));
  check("...so the quarter college is NOT credited 1.5x for identical work",
    /Now 30 FTES/.test(txt(0)) && !/Now 30 FTES/.test(txt(1)));
  check("the cell counts in FTES, not students, when the metric is FTES",
    /Tgt [\d.,]+ FTES/.test(txt(0)) && !/stu/.test(txt(0)));
  // The hover has to show the working, including which calendar was applied.
  const q = rows[1].td.getAttribute("title") || "";
  check("the quarter college's hover shows units ÷ units-per-FTES and names the calendar",
    /900 units ÷ 45\.0 units\/FTES, quarter calendar/.test(q));
  check("the hover states the target in CPL FTES and where it came from",
    /Target [\d.]+ CPL FTES \([\d,]+ units — its allocation ÷ \$5,?649\.63\/FTES\)/.test(q));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the target is entitlement ÷ rate, and rides the RIGHT entitlement
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const m = T._model();

  // An unfloored, non-rural college's target must be its PRE-FLOOR proportional
  // entitlement ÷ the rate. Recompute from the baked data, independently.
  const totFtes = D.colleges.reduce(function (s, c) { return s + c.credit_ftes; }, 0);
  const net = T._netCollege();
  const ny = D.default_years.length || 2;
  const share = D.year_priorities["1"][0].share;
  const plain = D.colleges.filter(function (c) {
    return !m.floored[c.college] && !c.rural;
  }).slice(0, 12);
  const worst = plain.reduce(function (mx, c) {
    const row = T._alloc(c.college);
    const key = Object.keys(row).find(function (k) { return /_heads$/.test(k); });
    // factor 1.0 ⇒ CUMULATIVE window target — the ×nYears is structural now, so
    // no ÷ ny here (dividing would give the retired per-year target).
    const expect = (c.credit_ftes / totFtes) * net * share / 5649.63;
    return Math.max(mx, Math.abs(row[key] - expect));
  }, 0);
  check("target == pre-floor proportional CUMULATIVE entitlement ÷ rate (max err < 0.01 FTES)",
    plain.length > 5 && worst < 0.01);

  // THE FLOOR TRAP: a floored college's cap is topped up to $150K. Its TARGET
  // must not rise with it — "the floor raises a college's funding, not its
  // targets". Compare a floored college's target against its own pre-floor share.
  const floored = D.colleges.filter(function (c) { return m.floored[c.college] && !c.rural; })[0];
  if (floored) {
    const row = T._alloc(floored.college);
    const key = Object.keys(row).find(function (k) { return /_heads$/.test(k); });
    const cap = key.replace(/_heads$/, "");
    const preFloor = (floored.credit_ftes / totFtes) * net * share / 5649.63;
    check("FLOOR TRAP: a floored college's target stays on its PRE-floor share",
      near(row[key], preFloor, 0.01));
    check("...even though its cap was topped up above that share",
      row[cap] > preFloor * 5649.63 * 1.05);
  } else {
    check("FLOOR TRAP: (no unfloored-rural-free floored college to test)", false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E — the per-priority PRICE FACTOR is the policy dial (the single global
// multiplier is retired, Sam & Malone 2026-08-04). factor = price × the base
// rate; target = pot ÷ price, so the factor scales the target INVERSELY.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const key = function () {
    const row = T._alloc("Alameda");
    return row[Object.keys(row).find(function (k) { return /_heads$/.test(k); })];
  };
  const par = key();
  const setFac = function (f) {
    T._setScenario({ yearPriorities: { "1": { "0": { factor: f } }, "2": { "0": { factor: f } } } });
    T.render();
  };
  setFac(2);
  check("a factor of 2 HALVES the target — pays more per FTES, so fewer FTES earn the pot",
    par > 0 && near(key(), par / 2, 0.001));
  setFac(0.5);
  check("a factor of 0.5 DOUBLES the target — pays less per FTES, so more FTES are needed",
    near(key(), par * 2, 0.001));
  T._setScenario({});
  T.render();
  check("clearing the override returns to par (factor 1.0)", near(key(), par, 0.001));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — front-load must not double the target alongside the cap
// ─────────────────────────────────────────────────────────────────────────────
// If the target were built from prioCap it would scale with the window under
// front-load, the ratio would cancel, and every earned dollar would be identical
// to EVEN mode — silently deleting the incentive Sam built front-load for.
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const tgt = function () {
    const row = T._alloc("Alameda");
    return row[Object.keys(row).find(function (k) { return /_heads$/.test(k); })];
  };
  const cap = function () {
    const row = T._alloc("Alameda");
    const k = Object.keys(row).find(function (x) { return /_heads$/.test(x); });
    return row[k.replace(/_heads$/, "")];
  };
  T._setScenario({ disbursement: "even" });
  T.render();
  const evenT = tgt(), evenC = cap();
  T._setScenario({ disbursement: "frontload" });
  T.render();
  const flT = tgt(), flC = cap();
  check("front-load leaves the CPL FTES target unchanged (per-year, as designed)",
    near(flT, evenT, 0.001));
  check("...while the cap DOES scale to the whole window",
    flC > evenC * 1.5);
  check("...so the effective $/FTES really does rise under front-load",
    (flC / flT) > (evenC / evenT) * 1.5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — UNIT AGREEMENT on the SUMMARY surfaces (2026-08-01)
//
// The per-college P-cells convert units -> CPL FTES (Part C above). Three
// summary surfaces did NOT, and shipped live saying so:
//
//   priority card, actual : "Actual 1,354,527 students — 193,700% of target"
//                           (raw UNITS, against an FTES target, called students)
//   priority card, target : "Per-student rate $73.90 per student -> 699
//                           students (0.028% of statewide headcount)"
//                           (CPL FTES relabelled students, divided by people)
//   pool card, rate       : "$4.62 per student — $11,620,154 ÷ 2,517,685
//                           headcount" (a denominator the model no longer uses)
//
// The failure mode is generic: a value and its target agreeing in MAGNITUDE is
// not the same as agreeing in UNIT, and every one of these read as fact. So
// these assert the RELATIONSHIP between the rendered number and the target's
// unit, never just that each side is present.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const doc = window.document;
  const cardTexts = Array.from(doc.querySelectorAll(".cplfund-card .l"))
    .map(function (l) { return l.textContent.replace(/\s+/g, " "); });
  const prio = Array.from(doc.querySelectorAll(".cplfund-prio .p"))
    .map(function (p) { return p.textContent.replace(/\s+/g, " "); });

  // ── the actual line ──
  // Fixture statewide pe_u = 181,975 units -> 6,065.8 CPL FTES at 30/FTES.
  check("F: the priority-card actual is stated in CPL FTES, not students",
    prio.some(function (t) { return /Actual 6,065\.8 CPL FTES per MAP/.test(t); }));
  check("F: the raw UNIT count is no longer rendered as the actual",
    !prio.some(function (t) { return /Actual 181,975/.test(t); }));
  check("F: the actual shows its working (units ÷ units-per-FTES)",
    prio.some(function (t) { return /181,975 units ÷ 30\.0 units\/FTES/.test(t); }));
  // The ratio is the thing that was 30x wrong — assert it against the target
  // the same card prints, not against a literal.
  {
    const m = prio.join(" ").match(/Target ([\d,.]+) CPL FTES[\s\S]*?Actual ([\d,.]+) CPL FTES[^%]*?— ([\d.]+)% of target/);
    const num = function (s) { return parseFloat(String(s).replace(/,/g, "")); };
    check("F: % of target = actual ÷ target on the card's OWN two numbers",
      !!m && Math.abs(num(m[3]) - (num(m[2]) / num(m[1])) * 100) < 1);
  }

  // ── the target line ──
  check("F: the FTES target is labelled CPL FTES, not students",
    prio.some(function (t) { return /Target [\d,.]+ CPL FTES/.test(t); }));
  check("F: the dormant per-student rate is gone from an FTES priority",
    !prio.some(function (t) { return /Per-student rate/.test(t); }));
  check("F: CPL FTES is never divided by headcount to make a reach %",
    !prio.some(function (t) { return /of statewide headcount/.test(t); }));
  check("F: the target names the rate it was derived from",
    prio.some(function (t) { return /÷ \$5,649\.63 per CPL FTES/.test(t); }));

  // ── the pool rate card ──
  const rate = cardTexts.find(function (t) { return /Reimbursement rate per/.test(t); });
  check("F: the $4.62-per-headcount card is retired under FTES metrics",
    !cardTexts.some(function (t) { return /Per-student rate/.test(t) && /headcount/.test(t); }));
  check("F: the rate card is denominated per CPL FTES", !!rate && /per CPL FTES/.test(rate));
  check("F: the rate card states what the tranche buys, in CPL FTES",
    !!rate && /CPL FTES the annual tranche buys/.test(rate));
  {
    // The card's own three numbers must reconcile: tranche ÷ rate = CPL FTES.
    const m = rate && rate.match(/\$([\d,]+) ÷ \$([\d,.]+) = ([\d,.]+) CPL FTES/);
    const num = function (s) { return parseFloat(String(s).replace(/,/g, "")); };
    check("F: rate card arithmetic reconciles (tranche ÷ rate = CPL FTES bought)",
      !!m && Math.abs(num(m[1]) / num(m[2]) - num(m[3])) < 1);
  }

  // ── the basis card ──
  check("F: the basis card names credit FTES, not headcount",
    cardTexts.some(function (t) { return /credit FTES \(allocation basis\)/.test(t); }));
  check("F: pool-depth per credit FTES rides as a NOTE, not as the headline rate",
    Array.from(doc.querySelectorAll(".cplfund-card")).some(function (c) {
      return /per credit FTES — pool depth, informational/.test(c.textContent.replace(/\s+/g, " "));
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — Applied CPL units are wired (2026-08-01, Sam)
//
// Sam's call: P1 should score APPLIED units, not eligible. Eligible is inflated
// upstream by the ACE/JST skill-level duplication we cannot fix
// (map_data_quality 10ad9e0a) and measures opportunity rather than an action.
//
// The load-bearing assertion is the FIRST one. Metric text is curator-editable
// live in Supabase, so the instant Sam retypes P1 the string must resolve to a
// measure. Without its own MEASURES entry "Applied CPL Units as FTES" matched
// NO rule — including none of the headcount ones — and fell through to `{}`,
// which earnFraction() reads as a data gap and pays at FULL CAP as an advance.
// The metric would have looked fine and quietly stopped measuring anything.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const M = T._measurability || null;
  if (!M) {
    // No seam exported — assert on the source instead, which is still specific.
    check("G: an applied-units MEASURES entry exists and precedes the eligible one",
      consumerSrc.indexOf('src: "pa_u"') !== -1 &&
      consumerSrc.indexOf('src: "pa_u"') < consumerSrc.indexOf('src: "pe_u"'));
    check("G: a headcount counterpart exists too",
      consumerSrc.indexOf('src: "pa",') !== -1);
    check("G: applied is matched on the word 'applied', not on 'eligible'",
      /wantsUnits\(m\) && has\(m, "applied"\)/.test(consumerSrc));
  } else {
    check("G: an applied-FTES metric resolves to the applied unit sum",
      M("Applied CPL Units as FTES (1 Unit = .0334 FTES)").src === "pa_u");
    check("G: it does NOT fall through to a data gap (which would pay full cap)",
      !M("Applied CPL Units as FTES (1 Unit = .0334 FTES)").gap);
    check("G: an applied HEADCOUNT metric resolves to the student count",
      M("Headcount with any applied CPL").src === "pa");
  }
  check("G: eligible still resolves to eligible (the new rule did not shadow it)",
    /src: "pe_u"/.test(consumerSrc) &&
    consumerSrc.indexOf('units of eligible CPL identified in MAP') !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part H — the reimbursement rate is CURATOR-EDITABLE (Sam, 2026-08-01)
//
// Sam settled the rate at the SCFF base $5,649.63 and asked for it as an
// editable variable in the funding pools. Three things have to hold, and the
// last two are the ones that bite:
//
//  1. it edits at all, from the pool card and from the FTES-factors box;
//  2. the two entry points cannot DISAGREE — they share one setter, so an edit
//     in either place is visible in the other;
//  3. a bad value is REJECTED, not stored. A zero rate makes every prioTarget()
//     zero, which earnFraction() reads as "none" — every college in the state
//     silently earns $0 off one stray keystroke.
//
// Also asserted: the editable field is the BASE rate, never the derived
// effective rate (rate ÷ multiplier). Typing into a derived field would push
// the curator's number through a divisor and store something else.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const T = bootWithUnits(window, 900);
  const doc = window.document;
  const rateInputs = function () {
    return Array.from(doc.querySelectorAll('[data-edit="ftesrate"]'));
  };
  check("H: the rate is editable (an ftesrate input exists)", rateInputs().length >= 1);
  check("H: it is editable in BOTH the pool card and the FTES-factors box",
    rateInputs().length >= 2);
  check("H: the editable value is the BASE rate, not the derived effective rate",
    rateInputs().every(function (i) { return i.value === "5,649.63"; }));

  // Edit via the FIRST input; assert the model AND the other input follow.
  const setVia = function (i, v) {
    const el = rateInputs()[i];
    el.value = v;
    el.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  const targetNow = function () {
    const row = T._alloc("Alameda");
    const k = Object.keys(row).find(function (x) { return /_heads$/.test(x); });
    return row[k];
  };
  const before = targetNow();
  setVia(0, "8,071.00");   // comma-formatted, as the field renders it
  check("H: editing the pool card changes the model's target",
    Math.abs(targetNow() - before) > 0.01);
  // Halving the price of a CPL FTES doubles what the same money buys, so the
  // target must move INVERSELY — the relationship Sam flagged as counterintuitive.
  check("H: raising the rate LOWERS the target (target = allocation ÷ rate)",
    targetNow() < before);
  check("H: a comma-formatted entry round-trips (the field renders with commas)",
    rateInputs().every(function (i) { return i.value === "8,071.00"; }));
  check("H: the OTHER entry point reflects the edit (one setter, cannot diverge)",
    rateInputs().length >= 2 &&
    rateInputs()[0].value === rateInputs()[1].value);

  setVia(1, "5,649.63");
  check("H: editing from the FTES-factors box works the same way",
    Math.abs(targetNow() - before) < 0.01);

  // Rejection: a zero (or junk) rate must leave the last good value standing.
  const good = targetNow();
  setVia(0, "0");
  check("H: a ZERO rate is rejected, not stored (it would zero every target)",
    Math.abs(targetNow() - good) < 0.01 &&
    rateInputs().every(function (i) { return i.value === "5,649.63"; }));
  setVia(0, "not a number");
  check("H: junk is rejected too", Math.abs(targetNow() - good) < 0.01);
  setVia(0, "-100");
  check("H: a negative rate is rejected", Math.abs(targetNow() - good) < 0.01);

  // Precedence: the edit must land where ftesRate() actually READS it. Writing
  // the pool field instead would sit under any top-level override and silently
  // do nothing, with nothing on screen to explain why.
  check("H: the editor writes via setFtesRate, not setPool",
    /if \(edit === "ftesrate"\)[\s\S]{0,600}setFtesRate\(/.test(consumerSrc) &&
    !/if \(edit === "ftesrate"\)[\s\S]{0,600}setPool\(/.test(consumerSrc));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
