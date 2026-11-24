// tests/cpl_funding_whole_dollars.test.js
//
// EVERY AWARD IS WHOLE DOLLARS AT ITS SOURCE (Sam, 2026-11-24: "no cents should
// be included in our calcs"). Before this, each figure rounded on its own, and
// Funds Qualified So Far's 118 rows added to $4 more than the Statewide row
// (measured 2026-11-24 under the published scenario). These checks fail on a
// $1 gap: the rows add to the Statewide row, credit plus noncredit is the
// combined figure, and every award divides evenly by the years. Both views:
// Annual funding and the whole window (front-loaded).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_whole_dollars.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function boot(frontload) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div id="cplFundingMount"></div></div></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.CPL_FUNDING_PUBLIC = true;
  w.eval(fs.readFileSync("cpl_funding_data.js", "utf8"));
  w.eval(fs.readFileSync("cpl_funding.js", "utf8"));
  const T = w.CPL_FUNDING_TAB;
  T.boot();
  if (frontload) { T._setShared(Object.assign({}, T._getShared(), { disbursement: "frontload" })); T.render(); }
  return { doc: w.document, T };
}
const num = (t) => Number(String(t || "").replace(/[^\d.-]/g, "")) || 0;
const amt = (td) => !td ? 0 : num(td.querySelector(".cf-amt") ? td.querySelector(".cf-amt").childNodes[0].textContent : td.textContent);

[false, true].forEach(function (frontload) {
  const tag = frontload ? "window" : "Annual";
  const { doc, T } = boot(frontload);
  const rows = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row"));
  const sys = doc.querySelector("#cplFundTable tr.cplfund-systemrow");
  const sum = (sel) => rows.reduce((t, r) => t + amt(r.querySelector(sel)), 0);
  check(tag + ": the table has its institutions and a Statewide row", rows.length > 100 && !!sys);
  const sm = sum("td.cf-total"), ss = amt(sys && sys.querySelector("td.cf-total"));
  check(tag + ": the rows' Max Funds add to the Statewide row exactly (" + sm + " vs " + ss + ")", sm === ss && sm > 0);
  const qm = sum("td.cf-cur-total"), qs = amt(sys && sys.querySelector("td.cf-cur-total"));
  check(tag + ": the rows' Funds Qualified So Far add to the Statewide row exactly (" + qm + " vs " + qs + ")", qm === qs && qm > 0);
  const split = rows.filter((r) => {
    const a = Array.from(r.querySelectorAll("td.cf-award")).map(amt);
    return a.length >= 3 && a[0] + a[1] !== a[2];
  });
  check(tag + ": on every row Max CR Funds plus Max NC Funds is Max Funds (" + split.length + " off)", split.length === 0);
  const cur = rows.filter((r) => amt(r.querySelector("td.cf-cur-cr")) + amt(r.querySelector("td.cf-cur-nc")) !== amt(r.querySelector("td.cf-cur-total")));
  check(tag + ": on every row the two qualifying lanes add to the combined figure (" + cur.length + " off)", cur.length === 0);
  // The model itself carries whole dollars, so no consumer (the memo, the CSV) can round differently.
  const names = rows.map((r) => r.getAttribute("data-id").slice(2));
  const ny = (T._getShared().years || ["", ""]).length || 2;
  const allocs = names.map((n) => T._alloc(n)).filter(Boolean);
  check(tag + ": every award, credit share and qualifying figure is whole dollars",
    allocs.length === names.length && allocs.every((a) => [a.total, a.cr_award, a.nc_award, a.earned_total, a.earned_cr, a.earned_nc]
      .every((v) => Math.abs(v - Math.round(v)) < 1e-6)));
  check(tag + ": every award divides evenly by the years (" + ny + ")",
    allocs.every((a) => Math.abs(a.total / ny - Math.round(a.total / ny)) < 1e-6));
  // Open every row: its priority rows add to the row's Max Funds and Funds Qualified So Far.
  names.forEach((n) => { T._state.open["c:" + n] = true; });
  T.render();
  let pMax = 0, pQ = 0;
  const hasPrio = (r) => { for (let n = r.nextElementSibling; n && !n.classList.contains("cplfund-row"); n = n.nextElementSibling) if (n.classList.contains("cplfund-subrow")) return true; return false; };
  Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row")).forEach((r) => {
    const cells = Array.from(r.children);
    const iM = cells.findIndex((c) => c.classList.contains("cf-total"));
    const iQ = cells.findIndex((c) => c.classList.contains("cf-cur-total"));
    let sm = 0, sq = 0, nx = r.nextElementSibling;
    while (nx && !nx.classList.contains("cplfund-row")) {
      if (nx.classList.contains("cplfund-subrow")) {
        const c = Array.from(nx.children);
        const fig = (i) => c[i] && c[i].childNodes[0] ? num(c[i].childNodes[0].textContent) : 0;
        sm += fig(iM); sq += fig(iQ);
      }
      nx = nx.nextElementSibling;
    }
    // A noncredit-only institution qualifying by origination has no priority rows to add.
    if (!r.nextElementSibling || !hasPrio(r)) return;
    if (sm !== amt(cells[iM])) pMax++;
    if (sq !== amt(cells[iQ])) pQ++;
  });
  check(tag + ": every row's priority rows add to its Max Funds (" + pMax + " off)", pMax === 0);
  check(tag + ": every row's priority rows add to its Funds Qualified So Far (" + pQ + " off)", pQ === 0);
});

let fails = 0;
results.forEach(function (r) { console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]); if (!r[1]) fails++; });
console.log("\n" + (results.length - fails) + "/" + results.length + " passed");
if (fails) process.exit(1);
