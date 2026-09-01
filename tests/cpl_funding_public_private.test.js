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
    // The title-row slot is present in BOTH the private and the public DOM on
    // purpose: the public page must be missing the explainer link because
    // publicMode() blanks it, not because its markup happens to lack a slot.
    '<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>' +
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
  // The link MOVED to the tab's title row (Sam, 2026-08-22) — it describes the
  // whole model, so it sits beside the tab's name rather than as a full-width
  // strip above the content. Scan the whole pane, not just the mount, or this
  // guard silently stops seeing the thing it guards.
  const privHtml = privDoc.querySelector(".main-container").innerHTML;
  const pubHtml = pubDoc.querySelector(".main-container").innerHTML;
  // The explainer moved from a published Claude artifact to a LIVE page in this
  // repo (2026-08-23), so the href is the relative "funding-model/". Matching on
  // the href rather than the old host is the point: an artifact URL reappearing
  // here would mean the tab is pointing at a snapshot again.
  const HREF = /href="funding-model\/"/;
  check("W2b: the private view links the funding-model explainer",
    HREF.test(privHtml) && /How this funding model works/.test(privHtml));
  check("W2b: ...and it is the LIVE page, not a republished snapshot",
    !/claude\.ai\/code\/artifact/.test(privHtml));
  check("W2b: the explainer link is in the TITLE ROW, not inside the mount",
    HREF.test(privDoc.getElementById("cplFundTitleLink").innerHTML) &&
    !HREF.test(privDoc.getElementById("cplFundingMount").innerHTML));
  check("W2b: the public college page does NOT expose the explainer link",
    !HREF.test(pubHtml) && !/How this funding model works/.test(pubHtml));
  check("W2b: the public page is blank because publicMode() blanks it, not for want of a slot",
    !!pubDoc.getElementById("cplFundTitleLink") &&
    pubDoc.getElementById("cplFundTitleLink").innerHTML === "");
  // The label is a link, not a decorated one — Sam's no-decorative-glyphs rule.
  check("W2b: the explainer link carries no decorative glyph",
    privHtml.indexOf("🧮") === -1);

  // Sam's minimum/maximum box holds TWO editable dials (2026-08-22). On the
  // college page both must degrade to plain figures — the curate sweep takes
  // data-edit inputs out, and an empty box would read as "no minimum is set".
  // The dials are the ADOPTED one-pool pair (base $150,000 / cap $400,000 on
  // the combined award, 2026-08-31 — the baked floor was 175,000 before), and
  // the labels are Sam's renames: "Base award (minimum)" / "Cap (maximum)".
  const pubFloor = pubDoc.querySelector(".cplfund-card.floor");
  const privFloor = privDoc.querySelector(".cplfund-card.floor");
  check("W2c: the public page shows the base AND the cap as plain figures",
    !!pubFloor && /150,000/.test(pubFloor.textContent) && /400,000/.test(pubFloor.textContent) &&
    /Base award \(minimum\)/.test(pubFloor.textContent) && /Cap \(maximum\)/.test(pubFloor.textContent));
  check("W2c: …with no editable control on either dial",
    !!pubFloor && pubFloor.querySelectorAll("[data-edit]").length === 0 &&
    !!privFloor && privFloor.querySelectorAll("[data-edit]").length === 4);

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
