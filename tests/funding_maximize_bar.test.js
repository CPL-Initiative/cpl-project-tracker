// How to maximize funding on the public funding page (Sam, 2026-11-25). What fails without it:
//
//   M1  no "How to maximize funding" on a credit priority row of an institution's detail, or one in the COBI tab.
//   M2  the panel does not open on that institution and priority, or its figures are not the row's.
//   M3  the strategies are missing, or a landing-page strategy stays a step for a college whose page is on file.
//   M4  no Get Help in Office Hours link to MAP's Get Involved page, or no Priority N Strategies link.
//   M5  the panel does not give the page its width (beside, never over), or resizes past 360px of view left.
//   M6  Escape does not close it, or focus does not return to the link.
//
// Run from repo root: `npm test` (or `node tests/funding_maximize_bar.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const H = require("./lib/cpl_funding_harness.js");
const { check, finish } = H;

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("funding-model/index.html");
const STRATS = ["Configure your College CPL Landing Page, including a CPL Request Email", "Batch upload all transcribed CPL"];

function page() {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/", pretendToBeVisual: true });
  const w = dom.window;
  w.CPL_FUNDING_NO_REMOTE = true;
  w.scrollTo = function () {}; w.scrollBy = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  ["cpl_funding_data.js", "funding_model_payload.js", "cpl_funding.js"].forEach((f) => w.eval(read(f)));
  const T = w.CPL_FUNDING_TAB;
  Array.from(w.document.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
  T._setShared({ participationDeadline: "2099-11-01", yearPriorities: { "1": { "0": { strategies: STRATS } } } });
  T._setElig({ coordOk: true, coord: {}, asOf: "2026-11-01",
    contacts: [{ college: "Laney", cpl_coordinator: "x", landing_page_url: "https://cpldashboardcccco.azurewebsites.net/laney" }] });
  w.eval(read("funding-model/college_bar.js"));
  w.eval(read("funding-model/maximize_bar.js"));
  T.render();
  return { w, doc: w.document, T, M: w.CPL_MAXIMIZE_BAR };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
const rowOf = (doc, name) => Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row")).filter((tr) => {
  const n = tr.querySelector(".cplfund-instname"); return n && n.textContent.trim() === name; })[0];

{
  const { w, doc, M } = page();
  click(w, rowOf(doc, "Laney").querySelector("button.cf-chev"));
  const sub = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-subrow"))[0];
  const btn = sub && sub.querySelector(".cf-maxbtn");
  check("M1a: a credit priority row carries How to maximize funding, on its own label cell",
    !!btn && btn.textContent === "How to maximize funding" && btn.closest("td").classList.contains("cf-subname"));
  click(w, btn);
  const bar = doc.getElementById("maximizeBar");
  const t = bar && bar.querySelector(".mbar-title").textContent;
  check("M2a: the panel opens on that institution and priority (" + t + ")", M.isOpen() && /^Laney · Priority 1/.test(t));
  const text = bar.querySelector(".mbar-body").textContent;
  check("M2b: it says where the institution stands, in the row's own dollars", /qualified of a \$[\d,]+ max\. \$[\d,]+ remaining\./.test(text));
  const steps = Array.from(bar.querySelectorAll("ol li")).map((li) => li.textContent);
  const done = Array.from(bar.querySelectorAll("ul.mbar-done li")).map((li) => li.textContent);
  check("M3: the strategies show, the landing-page one under Already in place (" + steps.length + "/" + done.length + ")",
    steps.length === 1 && /Batch upload/.test(steps[0]) && done.length === 1 && /Landing Page/.test(done[0]));
  const oh = Array.from(bar.querySelectorAll(".mbar-links a")).filter((a) => a.textContent === "Get Help in Office Hours")[0];
  check("M4: Get Help in Office Hours goes to MAP's Get Involved page, in a new tab",
    !!oh && oh.getAttribute("href") === "https://map.rccd.edu/get-involved/" && oh.getAttribute("target") === "_blank");
  const strat = bar.querySelector(".mbar-links a.mbar-strat");
  check("M4b: the strategies link is named for the priority and goes to its section (" + (strat && strat.textContent) + ")",
    !!strat && strat.textContent === "Priority 1 Strategies" && strat.getAttribute("href") === "#outcomes");
  check("M2c: the dollars are the row's own (" + (text.match(/\$[\d,]+ max/) || [""])[0] + ")", (function () {
    const tds = sub.querySelectorAll("td.c");
    // The row's Max Funds is its largest figure (the Total column adds the credit and noncredit shares).
    const vals = Array.from(tds).map((td) => (td.textContent.match(/\$([\d,]+)/) || [])[1]).filter(Boolean)
      .map((v) => Number(v.replace(/,/g, "")));
    const rowMax = "$" + Math.max.apply(null, vals).toLocaleString("en-US");
    return vals.length > 0 && text.indexOf(rowMax + " max") >= 0;
  })());
  check("M5a: the page gives the panel its width", doc.body.classList.contains("mbar-on") &&
    doc.body.style.getPropertyValue("--mbar-w") === M.width() + "px");
  M.setWidth(99999);
  const vwid = doc.documentElement.clientWidth || w.innerWidth;
  check("M5b: a resize stops where 360px of the view is left (" + M.width() + " of " + vwid + ")", M.width() === Math.max(320, vwid - 360));
  bar.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("M6: Escape closes it and the link has focus again", !M.isOpen() && doc.activeElement &&
    doc.activeElement.classList.contains("cf-maxbtn") && !doc.body.classList.contains("mbar-on"));
  // A college without a landing page keeps the landing-page strategy as a step.
  click(w, rowOf(doc, "Butte").querySelector(".cplfund-caret"));
  const bsub = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-subrow")).filter((r) => {
    let p = r.previousElementSibling; while (p && !p.classList.contains("cplfund-row")) p = p.previousElementSibling;
    return p && p.querySelector(".cplfund-instname").textContent.trim() === "Butte"; })[0];
  click(w, bsub.querySelector(".cf-maxbtn"));
  const bsteps = Array.from(doc.querySelectorAll("#maximizeBar ol li")).map((li) => li.textContent);
  check("M3b: without a landing page on file, configuring one stays a step", bsteps.length === 2 && /Landing Page/.test(bsteps[0]));
}
{
  const { window } = H.freshDom();
  const doc = H.boot(window);
  window.CPL_FUNDING_TAB.render();
  const first = doc.querySelector("#cplFundTable tr.cplfund-row");
  if (first) first.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("M1b: the COBI tab's detail rows carry no such link", doc.querySelectorAll(".cf-maxbtn").length === 0);
}

finish();
