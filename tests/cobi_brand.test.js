// COBI brand layer (cobi_brand.js) — the masthead personality.
//
// Guards: (a) Rule 4 (both HTMLs identical) + the script tag + the COBI
// masthead markup; (b) the rotating Mamba subtitle is set from the lineup;
// (c) the 8→24 jersey wink injects + flips on hover; (d) Mamba Day (Aug 24)
// flips the masthead into its purple-and-gold state.
//
// Run from repo root: `npm test` (or `node tests/cobi_brand.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
const tag = '<script src="cobi_brand.js"></script>';
check("cobi_brand.js script tag present exactly once", cpl.split(tag).length === 2);
check("masthead wordmark is COBI", /<h1>COBI<\/h1>/.test(cpl));
check("backronym tagline present", /class="cobi-tagline">Chancellor(&#39;|')s Office Business Intelligence/.test(cpl));
check("rotating Mamba slot present", /id="cobi-mamba"/.test(cpl));
check("nav label renamed to COBI", /data-tab="dashboard">COBI<\/a>/.test(cpl));
check("old 'CPL Initiative — Project Dashboard' h1 gone", !/CPL Initiative &mdash; Project Dashboard/.test(cpl));

const SRC = fs.readFileSync("cobi_brand.js", "utf8");
const MAST =
  '<div class="header"><h1>COBI</h1>' +
  '<div class="cobi-tagline">Chancellor&#39;s Office Business Intelligence</div>' +
  '<div class="subtitle" id="cobi-mamba">Mamba Mentality</div></div>';

function boot(forceDate) {
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + MAST + "</body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  if (forceDate) {
    const Real = dom.window.Date;
    function Fake() { return new Real(forceDate.y, forceDate.m, forceDate.d); }
    Fake.now = function () { return new Real(forceDate.y, forceDate.m, forceDate.d).getTime(); };
    dom.window.Date = Fake;
  }
  dom.window.eval(SRC);
  dom.window.COBI_BRAND.init(); // jsdom sits at readyState "loading"; init is idempotent
  return dom;
}

// (b) rotating subtitle is one of the lineup
{
  const dom = boot();
  const phrases = dom.window.COBI_BRAND.mambaPhrases;
  const sub = dom.window.document.getElementById("cobi-mamba").textContent;
  check("Mamba subtitle set from the lineup", phrases.indexOf(sub) !== -1);
  check("lineup carries the curated picks",
    phrases.indexOf("Bean Counting") !== -1 && phrases.indexOf("Mamba Mentality") !== -1 &&
    phrases.indexOf("Black Mambanator") !== -1);

  // (c) 8 → 24 jersey wink
  const num = dom.window.document.querySelector(".header h1 .cobi-num");
  check("8 → 24 wink injected onto the wordmark", !!num && num.textContent === "8");
  if (num) {
    num.dispatchEvent(new dom.window.MouseEvent("mouseenter"));
    check("wink flips to 24 on hover", num.textContent === "24");
    num.dispatchEvent(new dom.window.MouseEvent("mouseleave"));
    check("wink flips back to 8", num.textContent === "8");
  } else { check("wink flips to 24 on hover", false); check("wink flips back to 8", false); }

  check("normal day: not in Mamba-Day state",
    !dom.window.document.body.classList.contains("cobi-mamba-day"));
}

// (d) Mamba Day — Aug 24 (month index 7)
{
  const dom = boot({ y: 2026, m: 7, d: 24 });
  check("Mamba Day: masthead goes purple-and-gold",
    dom.window.document.body.classList.contains("cobi-mamba-day"));
  check("Mamba Day: subtitle salutes the day",
    /Mamba Mentality/.test(dom.window.document.getElementById("cobi-mamba").textContent));
}

// isMambaDay logic
{
  const dom = boot();
  const f = dom.window.COBI_BRAND.isMambaDay;
  check("isMambaDay true on Aug 24", f(new Date(2026, 7, 24)) === true);
  check("isMambaDay false otherwise", f(new Date(2026, 5, 19)) === false);
}

let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
