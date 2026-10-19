// Annual Workplan Goals: Set targets, twice, and the row that edits at once (S426) — jsdom.
//
// On 2026-10-14 four sub-activities (1.1.1, 1.1.3, 4.2.1, 4.4.1) took duplicate GOAL and
// STRETCH rows in workplan_goals, 1.1.1 four pairs within 35 seconds: after a Set targets
// save the row kept its Set targets control and read-only blank cells until the nightly
// rebuild, so a second press inserted a second pair. Now:
//   (a) Set targets reads the live rows first and PATCHes a row type that exists, inserting
//       only the missing ones; with none present it inserts both, as before;
//   (b) after the save the row's cells take the ladder attributes (Goal, Current, Stretch),
//       Set targets leaves, and the cells edit at once;
//   (c) a Current cell saved from that row PATCHes cur_<year> on the GOAL row.
//
// Run from repo root: `npm test` (or `node tests/workplan_goals_set_targets.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("workplan_goals.js", "utf8");

function cells(label) {
  return ["25-26", "26-27", "27-28", "28-29", "29-30", "Total"]
    .map((l) => '<td class="wpg-val" data-label="' + l + '"></td>').join("");
}
// The renderer's shape for a ladderless sub-activity: the name cell carries data-no-ladder,
// the three rows carry blank value cells with their column labels.
const TABLE =
  '<table><tbody class="wpg-act-group">' +
    '<tr class="wpg-act-row"><th scope="rowgroup" colspan="8" class="wpg-act-head"><span>Activity 1: </span>' +
      '<span class="wpg-title-cell" data-activity-title-edit="1" data-aid="1" data-val="Infrastructure">Infrastructure</span></th></tr>' +
    '<tr class="wpg-r wpg-r-goal"><th scope="row" rowspan="3" class="wpg-name" data-no-ladder="1" data-pid="1.1.2" data-name="AI Apprenticeship CPL Tools">' +
      '<span class="wpg-pid">1.1.2</span> <span class="wpg-title-cell" data-title-edit="1" data-pid="1.1.2">AI Apprenticeship CPL Tools</span></th>' +
      '<th scope="row" class="wpg-type">Goal</th>' + cells() + '</tr>' +
    '<tr class="wpg-r wpg-r-current"><th scope="row" class="wpg-type">Current</th>' + cells() + '</tr>' +
    '<tr class="wpg-r wpg-r-stretch"><th scope="row" class="wpg-type">Stretch</th>' + cells() + '</tr>' +
  '</tbody></table>';

function makeDom(existingTypes) {
  const dom = new JSDOM("<!doctype html><html><head></head><body>" +
    '<div id="tab-workplan-goals"><div class="wpg-annual"><div class="wpg-annual-head"><h2 class="wpg-annual-title">Annual Workplan Goals</h2><div class="wpg-auth-slot"></div></div>' + TABLE + "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
  dom._calls = [];
  w.fetch = function (url, opts) {
    const u = String(url);
    dom._calls.push({ url: u, opts: opts || {} });
    let body = [];
    if (/workplan_goals\?select=id,row_type/.test(u)) body = (existingTypes || []).map((t, i) => ({ id: 100 + i, row_type: t }));
    if (/\/functions\/v1\/workplan-rebuild$/.test(u)) {
      return Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ ok: false }), text: () => Promise.resolve("") });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body), text: () => Promise.resolve("") });
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function click(w, node) { node.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
const writes = (dom) => dom._calls.filter((c) => /\/rest\/v1\/workplan_goals/.test(c.url) && (c.opts.method === "POST" || c.opts.method === "PATCH"));

(async function () {
  // ── (a) nothing on the row yet: both rows are inserted ──
  let dom = makeDom([]), w = dom.window, doc = w.document;
  let st = doc.querySelector('[data-no-ladder="1"] .wpg-set-targets');
  check("a ladderless row offers Set targets", !!st);
  click(w, st); await settle();
  let card = doc.querySelector(".wpg-modal-card");
  doc.getElementById("wpg-add-goal-yr_2026_27").value = "4";
  doc.getElementById("wpg-add-stretch-yr_2026_27").value = "8";
  dom._calls.length = 0;
  click(w, card.querySelector(".wpg-btn-submit")); await settle();
  let ws = writes(dom);
  check("(a) the live rows are read before any write",
    dom._calls.findIndex((c) => /workplan_goals\?select=id,row_type&activity_id=eq\.1\.1\.2&kind=eq\.project/.test(c.url)) <
      dom._calls.indexOf(ws[0]));
  check("(a) with no row present, one POST carries the GOAL + STRETCH pair",
    ws.length === 1 && ws[0].opts.method === "POST" && JSON.parse(ws[0].opts.body).length === 2);

  // ── (b) the row edits at once ──
  const name = doc.querySelector('.wpg-name[data-pid="1.1.2"]');
  check("(b) Set targets leaves the row", !name.hasAttribute("data-no-ladder") && !name.querySelector(".wpg-set-targets"));
  const goal = doc.querySelector('td[data-editable="1"][data-aid="1.1.2"][data-rt="GOAL"][data-yr="2026-27"]');
  const cur = doc.querySelector('td[data-editable="1"][data-aid="1.1.2"][data-rt="CURRENT"][data-yr="2026-27"]');
  const stretch = doc.querySelector('td[data-editable="1"][data-aid="1.1.2"][data-rt="STRETCH"][data-yr="2026-27"]');
  check("(b) its Goal, Current and Stretch cells carry the ladder attributes",
    goal && cur && stretch && goal.getAttribute("data-yr-key") === "yr_2026_27" && cur.getAttribute("data-yr-key") === "cur_2026_27"
      && stretch.getAttribute("data-yr-key") === "yr_2026_27");
  check("(b) the typed values and their totals show", goal.textContent === "4" && stretch.textContent === "8"
    && doc.querySelector('td[data-aid="1.1.2"][data-rt="GOAL"][data-total="1"]').textContent === "4"
    && doc.querySelector('td[data-aid="1.1.2"][data-rt="STRETCH"][data-total="1"]').textContent === "8");
  check("(b) the cells are lit for the editor and reachable by Tab",
    goal.classList.contains("wpg-editable") && cur.getAttribute("tabindex") === "0");
  check("(b) the editor is told the row edits now", /The row edits now/.test(card.querySelector(".wpg-status").textContent));

  // ── (c) a Current cell on that row saves cur_<year> on the GOAL row ──
  doc.querySelector(".wpg-modal-overlay").remove();
  click(w, cur);
  const input = cur.querySelector("input");
  check("(c) the Current cell opens a field named for its year", input && input.getAttribute("aria-label") === "Current 2026-27 for 1.1.2");
  dom._calls.length = 0;
  input.value = "3"; input.dispatchEvent(new w.Event("blur")); await settle();
  const patch = dom._calls.find((c) => c.opts.method === "PATCH");
  check("(c) ...and PATCHes cur_2026_27 on the GOAL row of 1.1.2, no total",
    patch && /activity_id=eq\.1\.1\.2&row_type=eq\.GOAL&kind=eq\.project/.test(patch.url)
      && JSON.parse(patch.opts.body).cur_2026_27 === 3 && !("total" in JSON.parse(patch.opts.body)));
  check("(c) the Current total repaints", doc.querySelector('td[data-aid="1.1.2"][data-rt="CURRENT"][data-total="1"]').textContent === "3");

  // ── (a) rows already there: PATCH each, insert none ──
  dom = makeDom(["GOAL", "STRETCH"]); w = dom.window; doc = w.document;
  st = doc.querySelector('[data-no-ladder="1"] .wpg-set-targets');
  click(w, st); await settle();
  card = doc.querySelector(".wpg-modal-card");
  doc.getElementById("wpg-add-goal-yr_2025_26").value = "117";
  dom._calls.length = 0;
  click(w, card.querySelector(".wpg-btn-submit")); await settle();
  ws = writes(dom);
  check("(a) with both rows present, two PATCHes and no POST (the second press that made the duplicates)",
    ws.length === 2 && ws.every((c) => c.opts.method === "PATCH") && !dom._calls.some((c) => c.opts.method === "POST" && /workplan_goals$/.test(c.url)));
  check("(a) each PATCH is scoped to its row type and carries the years and total",
    /row_type=eq\.GOAL&kind=eq\.project/.test(ws[0].url) && /row_type=eq\.STRETCH/.test(ws[1].url)
      && JSON.parse(ws[0].opts.body).yr_2025_26 === 117 && JSON.parse(ws[0].opts.body).total === 117
      && !("activity_id" in JSON.parse(ws[0].opts.body)));

  // ── (a) one row present: PATCH it, insert the other ──
  dom = makeDom(["GOAL"]); w = dom.window; doc = w.document;
  click(w, doc.querySelector('[data-no-ladder="1"] .wpg-set-targets')); await settle();
  dom._calls.length = 0;
  click(w, doc.querySelector(".wpg-modal-card .wpg-btn-submit")); await settle();
  ws = writes(dom);
  check("(a) with GOAL alone present, GOAL is patched and STRETCH inserted",
    ws.length === 2 && ws[0].opts.method === "PATCH" && /row_type=eq\.GOAL/.test(ws[0].url)
      && ws[1].opts.method === "POST" && JSON.parse(ws[1].opts.body).length === 1 && JSON.parse(ws[1].opts.body)[0].row_type === "STRETCH");

  let pass = 0;
  results.forEach((r) => { console.log((r[1] ? "  PASS " : "  FAIL ") + r[0]); if (r[1]) pass++; });
  console.log("\n" + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})().catch((e) => { results.forEach((r) => console.log((r[1] ? "  PASS " : "  FAIL ") + r[0])); console.log("FAIL  stopped early: " + (e && e.stack)); process.exit(1); });
