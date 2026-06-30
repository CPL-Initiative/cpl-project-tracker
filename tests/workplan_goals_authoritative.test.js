// Annual Workplan authoritative-source editors (workplan_goals.js) — jsdom test.
//
// Session 85 (SkyLight) made the Annual Workplan tab authoritative:
//   (a) Rule 4 + the script is wired into both HTMLs;
//   (b) signed in, a MANUAL Current cell (data-current-edit) is click-editable
//       → PATCH workplan_goals.current on the GOAL row, and its TOTAL mirror
//       cell repaints optimistically;
//   (c) a sub-activity TITLE span (data-title-edit) is click-editable
//       → PATCH projects.name (the single title store);
//   (d) a LIVE Current cell (no edit attr, read-only) does NOT open an editor;
//   (e) the existing GOAL/STRETCH year-ladder editor (data-editable) still fires
//       its workplan_goals year PATCH;
//   (f) signed OUT, none of the editors fire (no write).
//
// Run from repo root: `npm test` (or `node tests/workplan_goals_authoritative.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("workplan_goals.js wired in CPL_Dashboard.html", /workplan_goals\.js/.test(cpl));
check("workplan_goals.js wired in index.html", /workplan_goals\.js/.test(idx));

const SRC = fs.readFileSync("workplan_goals.js", "utf8");
check("source defines saveCurrent (workplan_goals.current PATCH)", /function saveCurrent/.test(SRC));
check("source defines saveTitle (projects.name PATCH)", /function saveTitle/.test(SRC));

// A representative slice of the rendered Annual Workplan table: one manual
// Current cell + its TOTAL mirror, one live Current cell (read-only), an
// editable title span, and a GOAL year cell (legacy editor).
const TABLE =
  '<table><tbody>' +
    // ── manual sub-activity 1.1 ──
    '<tr><td rowspan="3"><span style="color:#888;font-size:0.75rem;">1.1</span> ' +
      '<span class="wpg-title-cell" data-title-edit="1" data-pid="1.1">MAP Platform Development</span></td>' +
      '<td>Goal</td>' +
      '<td data-editable="1" data-aid="1.1" data-kind="project" data-rt="GOAL" data-yr="2025-26" data-yr-key="yr_2025_26" data-val="4">4</td>' +
      '<td data-aid="1.1" data-kind="project" data-rt="GOAL" data-total="1" data-val="78">78</td></tr>' +
    '<tr><td>Current</td>' +
      '<td data-current-edit="1" data-aid="1.1" data-val="8">8 <span class="wpg-manual-hint">✎</span></td>' +
      '<td data-current-total="1" data-aid="1.1">8</td></tr>' +
    '<tr><td>Stretch</td><td>8</td><td>140</td></tr>' +
    // ── live sub-activity 3.1 (read-only Current) ──
    '<tr><td rowspan="3"><span>3.1</span> ' +
      '<span class="wpg-title-cell" data-title-edit="1" data-pid="3.1">CPL Offers</span></td>' +
      '<td>Goal</td><td>40,000</td><td>716,000</td></tr>' +
    '<tr><td>Current</td>' +
      '<td>48,142 <span class="wpg-live-badge">live · as of 2026-06-30</span></td>' +
      '<td>48,142</td></tr>' +
    '<tr><td>Stretch</td><td>80,000</td><td>1,260,000</td></tr>' +
  '</tbody></table>';

function makeDom(signedIn) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      '<div id="tab-workplan-goals">' + TABLE + "</div>" +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (signedIn) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({
      access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu"
    }));
  }
  dom._calls = [];
  w.fetch = function (url, opts) {
    dom._calls.push({ url: String(url), opts: opts || {} });
    return Promise.resolve({ ok: true, status: 200,
      json: function () { return Promise.resolve([]); },
      text: function () { return Promise.resolve(""); } });
  };
  w.eval(SRC);
  // jsdom (runScripts: outside-only) leaves readyState="loading", so the IIFE's
  // init() defers to DOMContentLoaded — fire it so the editors bind now.
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}

function click(w, node) {
  node.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
}
function blur(w, node) {
  node.dispatchEvent(new w.Event("blur"));
}

(function () {
  // ── (b) manual Current edit ──
  let dom = makeDom(true);
  let w = dom.window, doc = w.document;
  const curCell = doc.querySelector('[data-current-edit="1"][data-aid="1.1"]');
  const curTotal = doc.querySelector('[data-current-total="1"][data-aid="1.1"]');
  check("signed in: manual Current cell lights up (wpg-editable)",
    curCell.classList.contains("wpg-editable"));
  click(w, curCell);
  let input = curCell.querySelector("input");
  check("clicking the manual Current cell opens an input", !!input);
  if (input) {
    input.value = "12345";
    blur(w, input);
  }
  let curCall = dom._calls.find(function (c) { return /\/workplan_goals\?/.test(c.url) && (c.opts.method === "PATCH"); });
  check("manual Current save PATCHes workplan_goals", !!curCall);
  check("...scoped to the GOAL row of 1.1",
    curCall && /activity_id=eq\.1\.1/.test(curCall.url) && /row_type=eq\.GOAL/.test(curCall.url));
  check("...with body { current: 12345 }",
    curCall && JSON.parse(curCall.opts.body).current === 12345);
  check("manual Current TOTAL mirror repainted to 12,345",
    /12,345/.test(curTotal.textContent));

  // ── (c) title edit ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const titleSpan = doc.querySelector('[data-title-edit="1"][data-pid="1.1"]');
  check("signed in: title span lights up (wpg-editable)",
    titleSpan.classList.contains("wpg-editable"));
  click(w, titleSpan);
  input = titleSpan.querySelector("input");
  check("clicking the title opens an input", !!input);
  if (input) { input.value = "MAP Platform Dev (renamed)"; blur(w, input); }
  let titleCall = dom._calls.find(function (c) { return /\/projects\?id=eq\.1\.1/.test(c.url) && c.opts.method === "PATCH"; });
  check("title save PATCHes projects.name", !!titleCall);
  check("...with body { name: ... }",
    titleCall && JSON.parse(titleCall.opts.body).name === "MAP Platform Dev (renamed)");
  check("title cell text updated optimistically",
    /renamed/.test(titleSpan.textContent));

  // ── (d) live Current cell is read-only ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const liveCell = Array.prototype.find.call(
    doc.querySelectorAll("td"), function (td) { return /48,142/.test(td.textContent) && td.querySelector(".wpg-live-badge"); });
  check("live Current cell carries the badge", !!liveCell);
  check("live Current cell has NO edit affordance", liveCell && !liveCell.getAttribute("data-current-edit"));
  click(w, liveCell);
  check("clicking the live Current cell opens NO input", liveCell && !liveCell.querySelector("input"));
  check("clicking the live Current cell fires NO write",
    !dom._calls.some(function (c) { return c.opts.method === "PATCH"; }));

  // ── (e) legacy GOAL/STRETCH year editor still works ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const yearCell = doc.querySelector('[data-editable="1"][data-aid="1.1"][data-yr-key="yr_2025_26"]');
  click(w, yearCell);
  input = yearCell.querySelector("input");
  if (input) { input.value = "5"; blur(w, input); }
  let yearCall = dom._calls.find(function (c) { return /\/workplan_goals\?/.test(c.url) && c.opts.method === "PATCH" && /yr_2025_26/.test(c.opts.body || ""); });
  check("GOAL year-cell edit still PATCHes the year column", !!yearCall);

  // ── (f) signed out: nothing fires ──
  dom = makeDom(false); w = dom.window; doc = w.document;
  const curCell2 = doc.querySelector('[data-current-edit="1"][data-aid="1.1"]');
  const titleSpan2 = doc.querySelector('[data-title-edit="1"][data-pid="1.1"]');
  check("signed out: manual Current cell NOT lit", !curCell2.classList.contains("wpg-editable"));
  check("signed out: title span NOT lit", !titleSpan2.classList.contains("wpg-editable"));
  click(w, curCell2);
  click(w, titleSpan2);
  check("signed out: manual Current click opens no input", !curCell2.querySelector("input"));
  check("signed out: title click opens no input", !titleSpan2.querySelector("input"));
  check("signed out: zero writes", dom._calls.length === 0);

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
