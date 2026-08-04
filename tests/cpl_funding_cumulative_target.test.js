// Cumulative targets + the per-priority PRICE FACTOR (Sam & Malone, 2026-08-04).
//
// The single global "target multiplier" is RETIRED. Each priority now carries its
// own `factor`: a priority's PRICE per CPL FTES = factor × the base rate, and its
// target = pot ÷ price. So a HIGHER factor pays MORE per FTES and the pot is
// earned with FEWER FTES (target ÷ factor); a LOWER factor demands more.
//
// factor 1.0 = par = today's uniform model, exactly. The CUMULATIVE-window
// conversion the old ×2 used to carry is now STRUCTURAL: prioTarget multiplies the
// per-year entitlement by nYears(), so on a 2-year window factor 1.0 already gives
// the cumulative target — no config multiplier needed.
//
// THE TRAP THIS EXISTS TO PREVENT (unchanged). "Make targets cumulative" reads like
// an instruction to drop the `/ nYears` in prioEntitlement. It would produce the
// right target — and silently destroy the front-load incentive, because under
// front-load prioCap already puts the whole WINDOW on the table in Year 1 while the
// target stays per-year, and that gap IS the incentive (Sam, 2026-07-30: "double
// the per-student amount, not the students"). prioEntitlement stays per-year; the
// ×nYears lives in prioTarget, never in prioEntitlement.
//
//     cumulative window target  ==  net x share / rate
//     per-year x nYears         ==  net x share / nYears / rate x nYears
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

function metrics(factor) {
  return {
    "0": { metric: "Applied CPL Units as FTES (1 Unit = .0334 FTES)", share: 0.50, factor: factor },
    "1": { metric: "Transcribed CPL Units as FTES (1 Unit = .0334 FTES)", share: 0.45, factor: factor },
    "2": { metric: "Transcribed Units for Students from either CPL Student Portal or College CPL Landing Page", share: 0.05, factor: factor },
  };
}

function boot(factor, disbursement) {
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
  T._setShared({ yearPriorities: { "1": metrics(factor), "2": metrics(factor) },
                 disbursement: disbursement || "frontload" });
  T.render();
  return T;
}
function targetOf(T, college) {
  const row = T._alloc(college);
  const k = Object.keys(row).find(function (x) { return /_heads$/.test(x); });
  return row[k];
}

// ── A. factor 1.0 IS the cumulative window target, and the ×nYears is structural ──
{
  const T = boot(1.0);
  const m = T._model();
  const rate = D.pool.ftes_rate_2026_27;
  const net = T._netCollege();
  const totFtes = D.colleges.reduce(function (s, c) { return s + c.credit_ftes; }, 0);
  const share = 0.50;   // P1 (the first _heads on the row)
  const col = D.colleges.find(function (c) { return !m.floored[c.college] && !c.rural; });
  const tgt = targetOf(T, col.college);
  const cumulative = (col.credit_ftes / totFtes) * net * share / rate;   // NO ÷ nYears
  check("A: at factor 1.0 an unfloored college's target is its CUMULATIVE entitlement ÷ rate",
    near(tgt, cumulative, 0.01));
  check("A: the global target multiplier is retired — the ×nYears is structural in prioTarget",
    D.default_years.length === 2 && !/targetMultiplier/.test(consumerSrc) && D.target_multiplier === undefined);
}

// ── B. the factor scales the target INVERSELY (the price reading) ────────────
{
  const t1 = targetOf(boot(1.0), "Alameda");
  const tHalf = targetOf(boot(2.0), "Alameda");   // factor 2 → pays 2x/FTES → target ÷2
  const tDouble = targetOf(boot(0.5), "Alameda");  // factor 0.5 → pays half → target ×2
  check("B: factor 2.0 HALVES the target — pays more per FTES, so fewer FTES earn the pot",
    t1 > 0 && near(tHalf, t1 / 2, 0.01));
  check("B: factor 0.5 DOUBLES the target — pays less per FTES, so more FTES are needed",
    near(tDouble, t1 * 2, 0.01));
  check("B: a HIGHER factor makes the pot EASIER to earn (the premium direction Sam confirmed)",
    tHalf < t1 && tDouble > t1);
}

// ── C. prioEntitlement must STAY per-year — the load-bearing guard ──────────
{
  const body = (consumerSrc.match(/function prioEntitlement\(c, p\)[\s\S]*?\n  \}/) || [""])[0];
  check("C: prioEntitlement still divides by nYears (dropping it kills the front-load incentive)",
    body.length > 0 && /nYears\(\)/.test(body) && /\/\s*nYears\(\)/.test(body));
  check("C: prioEntitlement does NOT route through prioCap (that would double under front-load)",
    body.length > 0 && body.indexOf("prioCap") === -1);
  check("C: the reason is documented at the seam, not only in a commit message",
    /cancel the front-load incentive/.test(consumerSrc));
}

// ── D. front-load still pays more per CPL FTES than even tranches ───────────
// The property dropping the / nYears would silently destroy: under front-load the
// whole window is earnable against a per-year target, so effective $/CPL FTES is
// higher. Independent of the factor (held at 1.0 on both sides here).
{
  const even = boot(1.0, "even"), fl = boot(1.0, "frontload");
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
