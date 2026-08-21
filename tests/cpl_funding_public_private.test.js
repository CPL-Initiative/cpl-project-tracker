// tests/cpl_funding_public_private.test.js
//
// The PUBLIC ⇄ PRIVATE split on the Implementation Funding tab (Sam, 2026-07-30:
// "public views need to see less, whereas private view can show all the
// calculations").
//
// Lives in its own file rather than in tests/cpl_funding.test.js because that
// file already holds ~30 JSDOM instances and adding two more OOMs the run even
// at --max-old-space-size=3072. Each test file gets a fresh process.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_public_private.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const D = (function () {
  var sandbox = { window: {} };
  new Function("window", dataSrc).call(sandbox, sandbox.window);
  return sandbox.window.CPL_FUNDING;
})();

function freshDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div id="cplFundingMount">placeholder</div>' +
    "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  return dom;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}

// ─────────────────────────────────────────────────────────────────────────────
// Part W — PUBLIC SEES LESS, PRIVATE SEES ALL THE CALCULATIONS (Sam, 2026-07-30).
// The load-bearing distinction: public visibility is DISPLAY-ONLY and must never
// touch the funding math. The existing poolHidden() is STRUCTURAL — it drops the
// line item from grossRevenue()/grossDeduction() — so reusing it to hide the CO
// deductions from colleges would have ADDED those dollars back into the college
// pool and overstated every allocation on the public page.
// (Two DOMs only — this file is already heap-heavy.)
// ─────────────────────────────────────────────────────────────────────────────
{
  const priv = freshDom();
  const privDoc = boot(priv.window);
  const P = priv.window.CPL_FUNDING_TAB;
  P.render();

  const pub = freshDom();
  pub.window.CPL_FUNDING_PUBLIC = true;
  const pubDoc = boot(pub.window);
  const B = pub.window.CPL_FUNDING_TAB;
  B.render();

  // THE invariant: hiding boxes from colleges must not move a single dollar.
  const privNet = P._netCollege(), pubNet = B._netCollege();
  check("W1: the college pool is IDENTICAL in public and private mode",
    privNet > 0 && Math.abs(privNet - pubNet) < 0.01);
  check("W1: a college's allocation is identical in public and private mode",
    Math.abs(P._alloc(D.colleges[0].college).total - B._alloc(D.colleges[0].college).total) < 0.01);

  // Public shows fewer pool boxes (the CO's own deductions default off there).
  const privCards = privDoc.querySelectorAll(".cplfund-card").length;
  const pubCards = pubDoc.querySelectorAll(".cplfund-card").length;
  check("W2: the public page shows FEWER pool boxes than the curator view",
    pubCards < privCards && pubCards > 0);

  // The model explainer ("How this funding model works", renamed from
  // "Calculation sanity check" 2026-08-21) is a team working tool — an
  // access-controlled Claude artifact, private only, never on the college page.
  const privHtml = privDoc.getElementById("cplFundingMount").innerHTML;
  const pubHtml = pubDoc.getElementById("cplFundingMount").innerHTML;
  check("W2b: the private view links the funding-model explainer",
    /claude\.ai\/code\/artifact/.test(privHtml) && /How this funding model works/.test(privHtml));
  check("W2b: the public college page does NOT expose the explainer link",
    !/claude\.ai\/code\/artifact/.test(pubHtml) && !/How this funding model works/.test(pubHtml));
  // The label is a link, not a decorated one — Sam's no-decorative-glyphs rule.
  check("W2b: the explainer link carries no decorative glyph",
    privHtml.indexOf("🧮") === -1);

  // The structural hide is still available and still DOES move money — the two
  // mechanisms must stay distinguishable, or the whole point is lost.
  const before = P._netCollege();
  P._setScenario({ hiddenPool: { admin_cost: true } });
  P.render();
  check("W3: the STRUCTURAL hide still changes the math (a what-if, not a display flag)",
    Math.abs(P._netCollege() - before) > 1);
  P._setScenario({});
  P.render();

  // The seed-funding tab: private keeps every calculation, public gets the short
  // reconciliation instead of the project boxes.
  P._setSubview("grants");
  const privTxt = privDoc.getElementById("cplFundingMount").textContent;
  B._setSubview("grants");
  const pubTxt = pubDoc.getElementById("cplFundingMount").textContent;

  check("W4: the curator view still itemizes the N2N carve-off + remaining balance",
    /N2N/.test(privTxt) && /Remaining 2025-26/.test(privTxt) && /Reconciliation/.test(privTxt));
  check("W5: the public view drops the project boxes (no 'what projects?' bait)",
    !/N2N/.test(pubTxt) && !/Remaining 2025-26/.test(pubTxt));
  check("W5: but the public view STILL reconciles to the $15M appropriation",
    /account for/.test(pubTxt) && /\$15,000,000/.test(pubTxt));
  check("W6: the tab is renamed to the seed-funding framing",
    /\$50K Seed Funding/.test(privTxt));
  check("W6: the model tab is renamed for a college audience",
    /College Implementation Funding/.test(privTxt));
}


let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
