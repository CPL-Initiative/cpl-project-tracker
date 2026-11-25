// The college's CPL landing page in a bottom bar on the public funding page (Sam, 2026-11-25). What fails without it:
//
//   B1  a name with a landing page on file does not open the bar, or also opens the row's detail.
//   B2  the caret before the pie is not the row's toggle where the name opens the page (no way left to the detail).
//   B3  a name without a page on file, or the COBI tab's table, lost its toggle.
//   B4  the bar's top row: the college, How to Configure the College Landing Page (the Contents video link),
//       Configure Landing Page in MAP (MAP's sign-in), Close; the frame loads the page; Escape closes and the name
//       gets focus back.
//   B5  the grip resizes within 160px and the window, by keys.
//   B6  a non-https address reaches the frame.
//   B7  the As of / Ver. label shows to a reader who is not signed in (Sam, 2026-11-25: hide it on the public view).
//
// Run from repo root: `npm test` (or `node tests/funding_college_bar.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const H = require("./lib/cpl_funding_harness.js");
const { check, finish } = H;

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("funding-model/index.html");
const URL_A = "https://cpldashboardcccco.azurewebsites.net/laney";

function page() {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w = dom.window;
  w.CPL_FUNDING_NO_REMOTE = true;
  w.scrollTo = function () {}; w.scrollBy = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  ["cpl_funding_data.js", "funding_model_payload.js", "cpl_funding.js"].forEach((f) => w.eval(read(f)));
  const T = w.CPL_FUNDING_TAB;
  Array.from(w.document.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
  T._setShared({ participationDeadline: "2099-11-01" });
  T._setElig({ coordOk: true, coord: {}, asOf: "2026-11-01",
    contacts: [{ college: "Laney", cpl_coordinator: "x", landing_page_url: URL_A },
               { college: "Butte", cpl_coordinator: "x", landing_page_url: "javascript:alert(1)" }] });
  w.eval(read("funding-model/college_bar.js"));
  T.render();
  return { w, doc: w.document, T, B: w.CPL_COLLEGE_BAR };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
const rowOf = (doc, name) => Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row")).filter((tr) => {
  const n = tr.querySelector(".cplfund-instname"); return n && n.textContent.trim() === name; })[0];

{
  const { w, doc, B } = page();
  let tr = rowOf(doc, "Laney");
  const nm = tr && tr.querySelector(".cf-lpname");
  check("B1a: a name with a page on file is the landing-page link", !!nm && nm.getAttribute("data-lp-url") === URL_A &&
    !nm.hasAttribute("aria-expanded") && nm.getAttribute("title") === "Click to see the College Landing page below.");
  click(w, nm);
  tr = rowOf(doc, "Laney");
  check("B1b: pressing it opens the bar on that page and leaves the row closed", B.isOpen() &&
    doc.querySelector("#collegeBar .cbar-frame").getAttribute("src") === URL_A && !tr.classList.contains("cplfund-open"));
  const bar = doc.getElementById("collegeBar");
  const links = Array.from(bar.querySelectorAll(".cbar-top a")).map((a) => a.textContent + "=" + a.getAttribute("href"));
  check("B4a: the top row names the college and carries the two links and Close (" + links.join(" | ") + ")",
    /^Laney/.test(bar.querySelector(".cbar-title").textContent) &&
    links[0] === "How to Configure the College Landing Page=" + doc.getElementById("training-link").getAttribute("href") &&
    links[1] === "Configure Landing Page in MAP=https://mappingarticulatedpathways.azurewebsites.net/modules/security/Login.aspx" &&
    !!bar.querySelector(".cbar-close") && bar.querySelectorAll(".cbar-top a[target=_blank]").length === 2);
  check("B5a: it opens on 65% of the window (" + B.height() + " of " + w.innerHeight + ")", B.height() === Math.round(w.innerHeight * 0.65));
  const grip = bar.querySelector(".cbar-grip");
  B.setHeight(400);
  grip.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  const up = B.height();
  grip.dispatchEvent(new w.KeyboardEvent("keydown", { key: "End", bubbles: true }));
  const low = B.height();
  grip.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Home", bubbles: true }));
  check("B5: the grip resizes by keys, from 160px to the window (" + up + "," + low + "," + B.height() + ")",
    up === 460 && low === 160 && B.height() === w.innerHeight);
  bar.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("B4b: Escape closes it and the name has focus again", !B.isOpen() && doc.activeElement &&
    doc.activeElement.classList.contains("cf-lpname"));
  tr = rowOf(doc, "Laney");
  const chev = tr.querySelector("button.cf-chev");
  click(w, chev);
  tr = rowOf(doc, "Laney");
  check("B2: the caret is the row's toggle button there, and opens the detail", !!chev &&
    chev.getAttribute("aria-label") === "Laney, per-priority detail" && tr.classList.contains("cplfund-open") &&
    tr.querySelector("button.cf-chev").getAttribute("aria-expanded") === "true");
  const butte = rowOf(doc, "Butte");
  check("B6: a non-https address never becomes a link (Butte keeps its toggle)", !!butte && !butte.querySelector(".cf-lpname") &&
    butte.querySelector(".cplfund-caret").getAttribute("aria-expanded") === "false" && !butte.querySelector("button.cf-chev"));
  check("B6b: the bar refuses a non-https address", B.open("javascript:alert(1)", "X") === false);
  const ver = doc.querySelector(".cplh-end > .ver");
  check("B7: signed out, the As of / Ver. label is hidden", !!ver && ver.hidden === true);
}
{
  const { window } = H.freshDom();
  const doc = H.boot(window);
  window.CPL_FUNDING_TAB.render();
  check("B3: the COBI tab's names stay the row toggle", doc.querySelectorAll(".cf-lpname").length === 0 &&
    doc.querySelectorAll(".cplfund-caret[aria-expanded]").length > 0);
}

finish();
