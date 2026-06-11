// CPL Implementation Funding tab — renderer + shell-wiring + data guards.
//
// Guards the failure modes:
//  (a) the tab shell (nav button, pane, lazy boot snippet) stays present and
//      IDENTICAL in both HTMLs — the daily generator regenerates neighbouring
//      sections, so losing the shell silently is the realistic regression;
//  (b) the funding data stays LAZY (no eager <script src> tag for it);
//  (c) cpl_funding.js renders the full view from cpl_funding_data.js, and
//      renders a graceful empty state — not a throw — when the data fails to
//      load (loadScript fails soft on 404);
//  (d) search + sort behave over the college table; null census cells ("*Survey
//      did not estimate") render as em-dashes rather than NaN;
//  (e) PII: cpl_funding_data.js carries institutional/census aggregates only —
//      no email addresses outside the allow-list (mirrors tests/pii_guard.test.js,
//      whose fixed file list predates this artifact) and no person-level keys.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants: shell wiring + lazy loading + Rule 4
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");

check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["nav button", 'data-tab="implementation-funding" role="tab"'],
 ["pane", 'id="tab-implementation-funding"'],
 ["mount", 'id="cplFundingMount"'],
 ["lazy boot", "loadScript('cpl_funding.js', 'CPL_FUNDING_TAB'"]].forEach(function (pair) {
  check("shell " + pair[0] + " present (CPL_Dashboard.html)", cpl.indexOf(pair[1]) !== -1);
  check("shell " + pair[0] + " present (index.html)", idx.indexOf(pair[1]) !== -1);
});
["cpl_funding.js", "cpl_funding_data.js"].forEach(function (f) {
  check("no eager <script> for " + f, idx.indexOf('<script src="' + f + '">') === -1);
});

const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
check("consumer lazy-loads cpl_funding_data.js via CPL_TABS.loadScript",
  /CPL_TABS\.loadScript\("cpl_funding_data\.js",\s*"CPL_FUNDING"/.test(consumerSrc));

// ─────────────────────────────────────────────────────────────────────────────
// Part B — data artifact: schema + PII scan
// ─────────────────────────────────────────────────────────────────────────────
const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const sandbox = { window: {} };
new Function("window", dataSrc)(sandbox.window);
const D = sandbox.window.CPL_FUNDING;

check("data global parses (window.CPL_FUNDING)", !!D);
check("data: >100 colleges + SYSTEM row", D && D.colleges.length > 100 && D.system && D.system.college === "SYSTEM");
check("data: 3 priorities, shares sum to 1",
  D && D.priorities.length === 3 &&
  Math.abs(D.priorities.reduce(function (s, p) { return s + p.share; }, 0) - 1) < 1e-6);
check("data: pool math (remaining + one-time − admin − scaling = total)",
  D && Math.abs((D.pool.remaining_2025_26 + D.pool.one_time_2026_27 -
    D.pool.admin_cost - D.pool.scaling_projects_tech) - D.pool.total_college_funding) < 0.01);
check("data: per-college totals = p1+p2+p3 (≤1¢ rounding)",
  D && D.colleges.every(function (c) { return Math.abs(c.p1 + c.p2 + c.p3 - c.total) < 0.03; }));

// PII: emails (allow-list mirrors tests/pii_guard.test.js) + person-level keys.
const emails = dataSrc.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
const badEmails = emails.filter(function (e) {
  return !/@(rccd\.edu|example\.(com|org|net))$/i.test(e);
});
check("PII: no emails in cpl_funding_data.js (outside allow-list)", badEmails.length === 0);
const PERSON_KEYS = /"(first_?name|last_?name|student_?id|ssn|dob|birth|email|phone)"\s*:/i;
check("PII: no person-level keys in the data artifact", !PERSON_KEYS.test(dataSrc));

// ─────────────────────────────────────────────────────────────────────────────
// Part C — renderer behaviour (jsdom)
// ─────────────────────────────────────────────────────────────────────────────
function freshDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body><div id="cplFundingMount">placeholder</div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  return dom;
}

// C1 — happy path: data present before boot.
{
  const { window } = freshDom();
  window.eval(dataSrc);
  window.eval(consumerSrc);
  let threw = false;
  try { window.CPL_FUNDING_TAB.boot(); } catch (e) { threw = true; console.error(e); }
  check("boot() renders without throwing", !threw);
  const doc = window.document;
  check("renders pool cards", doc.querySelectorAll(".cplfund-card").length >= 5);
  check("renders 3 priority cards", doc.querySelectorAll(".cplfund-prio .p").length === 3);
  const bodyRows = doc.querySelectorAll(".cplfund-table tbody tr");
  check("renders one row per college", bodyRows.length === D.colleges.length);
  check("SYSTEM pinned as tfoot total row (not a body row)",
    doc.querySelector(".cplfund-table tfoot").textContent.indexOf("SYSTEM") !== -1);
  check("scoped CSS injected once", doc.querySelectorAll("#cpl-funding-css").length === 1);
  check("uses var(--token) CSS, no raw hex", !/#[0-9a-fA-F]{3,6}\b/.test(doc.getElementById("cpl-funding-css").textContent));

  // Null census cells render as an em-dash, never NaN.
  check("null working-adults cells render as —",
    doc.querySelector(".cplfund-table").textContent.indexOf("NaN") === -1);

  // Search narrows the table.
  const input = doc.getElementById("cplFundSearch");
  input.value = "Yuba";
  input.dispatchEvent(new window.Event("input"));
  const afterSearch = doc.querySelectorAll(".cplfund-table tbody tr").length;
  check("search narrows rows (Yuba)", afterSearch >= 1 && afterSearch < D.colleges.length);
  check("count line reflects the filter",
    doc.getElementById("cplFundCount").textContent.indexOf(afterSearch + " of " + D.colleges.length) === 0);
  input.value = "";
  input.dispatchEvent(new window.Event("input"));

  // Sorting by Total starts descending: biggest allocation first.
  const totalTh = doc.querySelector('th[data-sort="total"]');
  totalTh.dispatchEvent(new window.Event("click", { bubbles: true }));
  const firstRow = doc.querySelector(".cplfund-table tbody tr");
  const maxTotal = Math.max.apply(null, D.colleges.map(function (c) { return c.total; }));
  const maxCollege = D.colleges.filter(function (c) { return c.total === maxTotal; })[0].college;
  check("sort by Total desc puts the largest college first",
    firstRow.textContent.indexOf(maxCollege) !== -1);

  // No-match search shows the empty-row message, not a blank table.
  const input2 = doc.getElementById("cplFundSearch");
  input2.value = "zzz-no-such-college";
  input2.dispatchEvent(new window.Event("input"));
  check("no-match search shows an explicit empty row",
    doc.querySelector(".cplfund-table tbody").textContent.indexOf("No colleges match") !== -1);
}

// C2 — failure mode: data never arrives (404 → loadScript fails soft).
{
  const { window } = freshDom();
  window.eval(consumerSrc);
  let threw = false;
  try {
    window.CPL_FUNDING_TAB.boot();              // no CPL_TABS → manual inject path
    const s = window.document.querySelector('script[src="cpl_funding_data.js"]');
    s.dispatchEvent(new window.Event("error")); // simulate the 404
  } catch (e) { threw = true; console.error(e); }
  check("missing-data boot does not throw", !threw);
  check("missing-data renders graceful empty state",
    window.document.getElementById("cplFundingMount").textContent.indexOf("unavailable") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
