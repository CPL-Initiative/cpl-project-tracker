// Cumulative targets are delivered by the MULTIPLIER, not by editing prioEntitlement
// (Sam, 2026-08-01 "make the target cumulative"; applied 2026-08-03 as multiplier 2.0).
//
// THE TRAP THIS EXISTS TO PREVENT. "Make targets cumulative" reads like an
// instruction to drop the `/ nYears` in prioEntitlement. It would produce the
// right target — and silently destroy the front-load incentive, because under
// front-load prioCap already puts the whole WINDOW on the table in Year 1 while
// the target stays per-year, and that gap IS the incentive (Sam, 2026-07-30:
// "double the per-student amount, not the students"). prioEntitlement's own
// comment names this as the one reason it is exempt from the no-inline-scope
// guard. A future session reading only the "cumulative" instruction would not
// know that, so these assertions carry the reason.
//
// The identity that makes the multiplier the correct instrument:
//
//     cumulative window target  ==  net x share / rate
//     per-year x multiplier     ==  net x share / nYears / rate x multiplier
//
// which are equal exactly when multiplier == nYears. With the live 2-year
// window, multiplier 2.0 IS the cumulative target — no seam change needed.
//
// Run from repo root: `npm test`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 0.5 : eps); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const D = (function () { const sb = { window: {} }; new Function("window", dataSrc)(sb.window); return sb.window.CPL_FUNDING; })();

const FTES_METRICS = {
  "0": { metric: "Applied CPL Units as FTES (1 Unit = .0334 FTES)", share: 0.50 },
  "1": { metric: "Transcribed CPL Units as FTES (1 Unit = .0334 FTES)", share: 0.45 },
  "2": { metric: "Transcribed Units for Students from either CPL Student Portal or College CPL Landing Page", share: 0.05 },
};

function boot(mult, disbursement) {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='tab-implementation-funding'>" +
    "<div id='cplFundingMount'></div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.CPL_FUNDING_PERF = {
    as_of: "2026-08-02", suppress_below: 5,
    statewide: { pe: 43203, pe_u: 1354526.95, pa: 40533, pa_u: 241894.65, p3: 16829, p3_u: 103138.95, pp: 5, pp_u: 25 },
    colleges: { "Alameda": { pe: 13, pe_u: 529, pa: 12, pa_u: 300, p3: 0, p3_u: 0, pp: 0, pp_u: 0 } },
    unmatched: {},
  };
  w.eval(dataSrc); w.eval(consumerSrc);
  w.CPL_FUNDING_TAB.boot();
  const T = w.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": FTES_METRICS, "2": FTES_METRICS },
                 targetMultiplier: mult, disbursement: disbursement || "frontload" });
  T.render();
  return T;
}
function targetOf(T, college) {
  const row = T._alloc(college);
  const k = Object.keys(row).find(function (x) { return /_heads$/.test(x); });
  return row[k];
}

// ── A. the identity: multiplier == nYears reproduces the cumulative target ──
{
  const pool = D.pool;
  const net = pool.college_funding_before_feeder - pool.feeder_carveout - pool.rural_carveout;
  const rate = pool.ftes_rate_2026_27;
  const nY = D.default_years.length;
  const share = 0.50;
  const cumulative = net * share / rate;
  const perYearTimesMult = (net * share / nY / rate) * nY;
  check("A: multiplier == nYears reproduces the cumulative window target exactly",
    near(cumulative, perYearTimesMult, 0.001));
  check("A: the live window is 2 years, so the live multiplier for 'cumulative' is 2.0",
    nY === 2);
}

// ── B. the multiplier actually scales the target, in the right direction ──
{
  const t1 = targetOf(boot(1.0), "Alameda");
  const t2 = targetOf(boot(2.0), "Alameda");
  check("B: multiplier 2.0 doubles the target (cumulative == 2 x per-year)", near(t2, t1 * 2, 0.01));
  check("B: a HIGHER multiplier makes the target HARDER, not easier", t2 > t1);
}

// ── C. prioEntitlement must STAY per-year — the load-bearing guard ──────────
{
  const body = (consumerSrc.match(/function prioEntitlement\(c, p\)[\s\S]*?\n  \}/) || [""])[0];
  check("C: prioEntitlement still divides by nYears (dropping it kills the front-load incentive)",
    body.length > 0 && /nYears\(\)/.test(body) && /\/\s*nYears\(\)/.test(body));
  check("C: prioEntitlement does NOT route through prioCap (that would double under front-load)",
    body.length > 0 && body.indexOf("prioCap") === -1);
  // And the reason has to survive in the source, or the next session re-breaks it.
  check("C: the reason is documented at the seam, not only in a commit message",
    /cancel the front-load incentive/.test(consumerSrc));
}

// ── D. front-load still pays more per CPL FTES than even tranches ───────────
// This is the property that dropping the / nYears would silently destroy: under
// front-load the whole window is earnable against a per-year target, so the
// effective $/CPL FTES is higher. If a future edit makes targets scope with the
// cap, these two collapse to equal and the incentive is gone with no test failing
// anywhere else.
{
  const even = boot(2.0, "even"), fl = boot(2.0, "frontload");
  const tE = targetOf(even, "Alameda"), tF = targetOf(fl, "Alameda");
  const capOf = function (T) {
    const row = T._alloc("Alameda");
    const k = Object.keys(row).find(function (x) { return /_heads$/.test(x); });
    return row[k.replace(/_heads$/, "")];
  };
  const cE = capOf(even), cF = capOf(fl);
  check("D: front-load leaves the target unchanged (timing moves money, not students)",
    near(tF, tE, 0.001));
  check("D: front-load DOES scale the cap to the whole window", cF > cE * 1.5);
  check("D: so the effective $/CPL FTES really is higher under front-load",
    (cF / tF) > (cE / tE) * 1.5);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
