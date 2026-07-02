// Attach-flow explainer (dashboard_filters.js) — jsdom test.
//
// Guards (Sam, 2026-07-02: "taking me to an attachment folder but no way I
// see to select and attach it"):
//  (a) the per-card 📎 attach buttons still deep-link to the project's
//      SharePoint subfolder (AllItems.aspx?id=<base>/<folder>);
//  (b) first click shows the explainer popover INSTEAD of silently opening
//      the folder — it names the SharePoint Upload / drag-&-drop step and
//      carries an "Open the project folder" link with the same href;
//  (c) "Got it" (checkbox + open) persists per browser and later clicks skip
//      the popover (normal navigation);
//  (d) the toolbar Attach Doc + Master Report affordances exist (button ids).
//
// Run from repo root: `npm test` (or `node tests/attach_explainer.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("dashboard_filters.js", "utf8");
const SP_URL = "https://rccd.sharepoint.com/sites/CPL/Shared%20Documents/Forms/AllItems.aspx"
  + "?id=%2Fsites%2FCPL%2FShared%20Documents%2FAttachments&viewid=abc-123";

function makeWin() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body>' +
    '<div class="filter-bar"><div id="filterButtons" class="filter-buttons"></div></div>' +
    '<div class="project-card"><a class="attach-btn" href="#" data-folder="1.1 MAP Platform Development">&#128206; Attach</a></div>' +
    '</body></html>',
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_ATTACHMENTS_URL = SP_URL;
  // Swallow jsdom's "Not implemented: navigation" from anchor clicks.
  dom.virtualConsole && dom.virtualConsole.on && dom.virtualConsole.on("jsdomError", function () {});
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

(function () {
  const w = makeWin();
  const doc = w.document;

  // (d) toolbar affordances
  check("toolbar: Master Report button injected", !!doc.getElementById("masterReportBtn"));
  check("toolbar: Attach Doc link injected (id attachDocBtn)", !!doc.getElementById("attachDocBtn"));

  // (a) card attach button rewritten to the project subfolder
  const cardBtn = doc.querySelector("a.attach-btn");
  check("card attach button deep-links the project subfolder",
    /AllItems\.aspx\?id=/.test(cardBtn.href) && /1\.1%20MAP%20Platform%20Development/.test(cardBtn.href));

  // (b) first click → explainer popover, not navigation
  cardBtn.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  const pop = doc.getElementById("attachExplainer");
  check("first click shows the explainer popover", !!pop);
  check("explainer names the SharePoint upload step", /Create or upload/.test(pop.innerHTML) && /drag/i.test(pop.innerHTML));
  const go = doc.getElementById("attachExplainerGo");
  check("explainer 'Open the project folder' carries the same href", go && go.href === cardBtn.href);
  check("explainer open link is a new tab", go && go.getAttribute("target") === "_blank");
  // Missing-folder fallback (Sam's 4.1.4 "Unknown render failure"): a parent-
  // Attachments link + the create-the-folder guidance.
  const parent = doc.getElementById("attachExplainerParent");
  check("explainer links the PARENT Attachments folder (no subfolder in id=)",
    parent && /AllItems\.aspx\?id=/.test(parent.href) && !/1\.1%20MAP/.test(parent.href));
  check("explainer covers the missing-folder failure mode", /isn't available|something went wrong/i.test(pop.innerHTML));

  // (c) Got-it persistence: check the box, click open → dismissed + stored
  doc.getElementById("attachExplainerSkip").checked = true;
  go.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("open click dismisses the popover", !doc.getElementById("attachExplainer"));
  check("Got-it persists in localStorage", w.localStorage.getItem("cplAttachHelp.v1") === "dismissed");

  cardBtn.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("later clicks skip the popover (straight to the folder)", !doc.getElementById("attachExplainer"));

  // × close path (fresh window, no persistence)
  const w2 = makeWin();
  const btn2 = w2.document.querySelector("a.attach-btn");
  btn2.dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true }));
  w2.document.getElementById("attachExplainerClose").dispatchEvent(new w2.MouseEvent("click", { bubbles: true }));
  check("× closes without persisting", !w2.document.getElementById("attachExplainer")
    && w2.localStorage.getItem("cplAttachHelp.v1") !== "dismissed");
  btn2.dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("undismissed → popover shows again next click", !!w2.document.getElementById("attachExplainer"));

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
