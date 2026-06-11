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
// rev2 shares-first model: SHARE is the allocation input, target_rate is a
// projection target that moves no dollars, the old factor is gone, and the
// SUM-range fix makes balance + conservation structural.
check("data: rev2 priorities carry share + target_rate, no factor",
  D && D.priorities.every(function (p) { return p.share != null && p.target_rate != null && p.factor === undefined; }));
check("data: balance is $0 by construction", D && D.pool.balance === 0);
check("data: college totals redistribute the SYSTEM row exactly (≤5¢)",
  D && Math.abs(D.colleges.reduce(function (s, c) { return s + c.total; }, 0) - D.system.total) < 0.05);
check("data: SYSTEM headcount = Σ college rows (SUM-range fix)",
  D && D.system.headcount === D.colleges.reduce(function (s, c) { return s + (c.headcount || 0); }, 0));
check("data: pool math (remaining + one-time − admin − scaling = total)",
  D && Math.abs((D.pool.remaining_2025_26 + D.pool.one_time_2026_27 -
    D.pool.admin_cost - D.pool.scaling_projects_tech) - D.pool.total_college_funding) < 0.01);
check("data: per-college totals = p1+p2+p3 (≤1¢ rounding)",
  D && D.colleges.every(function (c) { return Math.abs(c.p1 + c.p2 + c.p3 - c.total) < 0.03; }));

// Headcount provenance (Sam, 2026-06-11): vintage label from the workbook's
// own column header + the CCCCO DataMart source — both carried in the data
// so the tab cites them and a refreshed workbook edition re-labels itself.
check("data: headcount_label carries the workbook vintage",
  D && /MIS ANNUAL HEADCOUNT/i.test(D.headcount_label || ""));
check("data: headcount_source points at the CCCCO DataMart report",
  D && D.headcount_source && /datamart\.cccco\.edu/.test(D.headcount_source.url || ""));

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

  // Provenance surfaces: footnote cites the DataMart; headcount header
  // tooltip carries the workbook vintage.
  check("footnote cites the DataMart headcount source",
    doc.querySelector(".cplfund-foot").textContent.indexOf("DataMart") !== -1);
  check("headcount column header tooltips the vintage",
    (doc.querySelector('th[data-sort="headcount"]').getAttribute("title") || "").indexOf("2022-2023") !== -1);

  // No-match search shows the empty-row message, not a blank table.
  const input2 = doc.getElementById("cplFundSearch");
  input2.value = "zzz-no-such-college";
  input2.dispatchEvent(new window.Event("input"));
  check("no-match search shows an explicit empty row",
    doc.querySelector(".cplfund-table tbody").textContent.indexOf("No colleges match") !== -1);
}

// C1b — v1.1: district rollup, period toggle, drill-in rows.
{
  const { window } = freshDom();
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  const doc = window.document;
  function click(el) { el.dispatchEvent(new window.Event("click", { bubbles: true })); }

  // Drill-in: clicking a college row expands a detail row with the priority math.
  const firstRow = doc.querySelector("tr.cplfund-row");
  click(firstRow);
  let detail = doc.querySelector("tr.cplfund-detail");
  check("college drill-in renders a detail row", !!detail);
  check("drill-in shows the per-priority math",
    detail && detail.textContent.indexOf("Priority 1") !== -1 && detail.textContent.indexOf("share") !== -1);
  click(doc.querySelector("tr.cplfund-row"));
  check("re-click collapses the drill-in", !doc.querySelector("tr.cplfund-detail"));

  // Period toggle: SYSTEM tfoot total ×3 = the 2026-30 pool; header label flips.
  const totalBtn = doc.querySelector('#cplFundPeriod button[data-val="3"]');
  click(totalBtn);
  check("period header flips to Total 2026-30",
    doc.querySelector(".cplfund-table thead").textContent.indexOf("Total 2026-30") !== -1);
  const tfootTxt = doc.querySelector(".cplfund-table tfoot").textContent;
  check("SYSTEM total in 2026-30 mode = $34,800,000", tfootTxt.indexOf("$34,800,000") !== -1);
  click(doc.querySelector('#cplFundPeriod button[data-val="1"]'));

  // District rollup: row per distinct district; sums reconcile to SYSTEM.
  const distinctDistricts = new Set(D.colleges.map((c) => c.district || "(no district)")).size;
  click(doc.querySelector('#cplFundView button[data-val="district"]'));
  const dRows = doc.querySelectorAll(".cplfund-table tbody tr");
  check("district view renders one row per district (" + distinctDistricts + ")", dRows.length === distinctDistricts);
  // Conservation: the rollup must redistribute the college list EXACTLY —
  // and since the rev2 SUM-range fix, the list IS the SYSTEM row.
  const listHeads = D.colleges.reduce((s, c) => s + (c.headcount || 0), 0);
  const dHead = Array.from(dRows).reduce((s, tr) => {
    const cell = tr.querySelectorAll("td")[3];
    return s + Number(cell.textContent.replace(/,/g, ""));
  }, 0);
  check("district rollup conserves the college-list headcount", dHead === listHeads);
  const listTotal = D.colleges.reduce((s, c) => s + c.total, 0);
  check("source variance stays small (<1% of the SYSTEM pool — honesty bound)",
    Math.abs(listTotal - D.system.total) / D.system.total < 0.01);
  check("no variance footnote — the rev2 workbook is internally consistent",
    doc.querySelector(".cplfund-foot").textContent.indexOf("source-workbook variance") === -1);
  check("district tfoot college count = " + D.colleges.length,
    doc.querySelector(".cplfund-table tfoot").textContent.indexOf(String(D.colleges.length)) !== -1);

  // District drill-in lists member colleges.
  click(doc.querySelector("tr.cplfund-row"));
  detail = doc.querySelector("tr.cplfund-detail");
  check("district drill-in lists member colleges", !!detail && detail.querySelectorAll(".cplfund-detail-grid div").length >= 1);

  // Sorting by a college-only key then switching views must not crash; search works per view.
  click(doc.querySelector('#cplFundView button[data-val="college"]'));
  click(doc.querySelector('th[data-sort="college"]'));
  click(doc.querySelector('#cplFundView button[data-val="district"]'));
  check("view switch resets a college-only sort key without crashing",
    doc.querySelectorAll(".cplfund-table tbody tr").length === distinctDistricts);
  const input = doc.getElementById("cplFundSearch");
  input.value = "Yuba";
  input.dispatchEvent(new window.Event("input"));
  check("district search narrows rows",
    doc.querySelectorAll(".cplfund-table tbody tr").length < distinctDistricts);
}

// C1c — what-if sandbox: pools / headcount / factors / projection % editable,
// everything recomputes via the workbook's own formula chain; per-browser
// persistence; reset; the BALANCE readout goes red when edits un-balance the
// model (shares ≠ 100%).
{
  const { window } = freshDom();
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  const doc = window.document;
  function click(el) { el.dispatchEvent(new window.Event("click", { bubbles: true })); }
  function commit(sel, v) {
    const inp = doc.querySelector(sel);
    inp.value = v;
    inp.dispatchEvent(new window.Event("change"));
  }

  check("sandbox banner renders; pristine shows no modified pill",
    doc.querySelector(".cplfund-sandbox") && !doc.querySelector(".cplfund-sandbox .mod"));
  check("pool + priority inputs carry the workbook values",
    doc.querySelector('input[data-wf="oneTime"]').value === "35,000,000" &&
    doc.querySelector('input[data-wf="share"][data-i="0"]').value === "30" &&
    doc.querySelector('input[data-wf="target"][data-i="2"]').value === "4.6666666");
  check("no CCC-headcount input — it derives from the college rows in rev2",
    !doc.querySelector('input[data-wf="headcount"]'));
  check("pristine per-student rate shows the corrected $5.27",
    doc.querySelector(".cplfund-cards").textContent.indexOf("$5.27") !== -1);
  check("pristine balance card reads $0",
    doc.querySelector(".cplfund-cards .cplfund-card:last-child .v").textContent.trim() === "$0");

  // Edit the 2026-27 pool: 35,000,000 → 23,400,000 ⇒ net 2026-30 = $23,200,000.
  commit('input[data-wf="oneTime"]', "23,400,000");
  check("edit shows the modified pill + Reset button",
    doc.querySelector(".cplfund-sandbox .mod") && doc.getElementById("cplFundReset"));
  check("hero recomputes the 2026-30 pool to $23,200,000",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf("$23,200,000") !== -1);
  check("balance stays $0 while shares still sum to 100%",
    doc.querySelector(".cplfund-cards .cplfund-card:last-child .v").textContent.trim() === "$0");
  // College rows rescale per the rev2 (shares-first) formula chain.
  {
    const perYear = 23200000 / 3;
    const head = D.system.headcount;
    let exp = 0;
    D.priorities.forEach((p) => { exp += (D.colleges[0].headcount / head) * p.share * perYear; });
    check("college rows recompute (first row total matches the formula)",
      doc.querySelector(".cplfund-table tbody tr").textContent.indexOf("$" + Math.round(exp).toLocaleString("en-US")) !== -1);
  }
  const stored = window.localStorage.getItem("cpl_funding_whatif_v2");
  check("edit persists to localStorage", !!stored);

  // P1 share 30% → 60% ⇒ shares sum 130% ⇒ warn + red balance.
  commit('input[data-wf="share"][data-i="0"]', "60");
  check("priority share chip recomputes (60% of each tranche)",
    doc.querySelector(".cplfund-prio .p .share").textContent.indexOf("60%") !== -1);
  check("formula line warns when shares no longer sum to 100%",
    (doc.querySelector(".cplfund-formula .cplfund-warn-text") || { textContent: "" }).textContent.indexOf("130") !== -1);
  check("balance goes red when the model over-allocates",
    !!doc.querySelector(".cplfund-cards .cplfund-warn-text"));
  check("workbook-variance footnote suppressed while modified",
    doc.querySelector(".cplfund-foot").textContent.indexOf("source-workbook variance") === -1);

  // Projection targets move students, never dollars (THE shares-first point).
  commit('input[data-wf="share"][data-i="0"]', "30");
  const totalBefore = doc.querySelector(".cplfund-table tbody tr td.tot").textContent;
  commit('input[data-wf="target"][data-i="0"]', "10");
  check("target edit doubles projected students (statewide P1 → 219,916)",
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("219,916") !== -1);
  check("target edit moves NO dollars (first-row total unchanged)",
    doc.querySelector(".cplfund-table tbody tr td.tot").textContent === totalBefore);

  // Typing the workbook values back returns to pristine (pill + storage clear).
  commit('input[data-wf="target"][data-i="0"]', "5");
  commit('input[data-wf="oneTime"]', "35,000,000");
  check("typing workbook values back returns to pristine",
    !doc.querySelector(".cplfund-sandbox .mod") && !window.localStorage.getItem("cpl_funding_whatif_v2"));

  // Reset restores the workbook model from any modified state.
  commit('input[data-wf="share"][data-i="0"]', "55");
  click(doc.getElementById("cplFundReset"));
  check("Reset restores the workbook model ($34,800,000 hero, no pill)",
    doc.querySelector(".cplfund-card.hero .v").textContent.indexOf("$34,800,000") !== -1 &&
    !doc.querySelector(".cplfund-sandbox .mod"));
  check("Reset clears localStorage", !window.localStorage.getItem("cpl_funding_whatif_v2"));

  // Persistence: a fresh boot with a stored sandbox re-applies it.
  {
    const dom2 = freshDom();
    const w2 = dom2.window;
    w2.localStorage.setItem("cpl_funding_whatif_v2", stored);
    w2.eval(dataSrc);
    w2.eval(consumerSrc);
    w2.CPL_FUNDING_TAB.boot();
    check("a stored sandbox re-applies on fresh boot ($23,200,000 hero + pill)",
      w2.document.querySelector(".cplfund-card.hero .v").textContent.indexOf("$23,200,000") !== -1 &&
      !!w2.document.querySelector(".cplfund-sandbox .mod"));
  }
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
