// Annual Goals: Table and Restore for a signed-in reviewer (Sam, Open Asks Sheet 75
// card 3, "reviewer", 2026-10-13). An official sub-activity may leave the workplan,
// reversibly, by a signed-in reviewer; the team phrase gets neither control here.
//
// The Annual Goals editor opens the Activities tab's own Table / Archive dialog
// (project_lifecycle.js), so project_lifecycle keeps one writer. Guards:
//   (a) signed out and the team phrase: no Table, no Tabled and archived list;
//   (b) a reviewer gets Table beside Move on every sub-activity, named for a screen
//       reader, and it opens the shared dialog with the row's id and name;
//   (c) the shared dialog's save hides the row's three Annual Goals rows at once,
//       through the name cell, which is a row header since #2054 (the selector
//       looked for a td and missed it);
//   (d) a reviewer sees what is tabled or archived under the table (sub-activity
//       ids only, never a D.* helper row), each with Restore, which un-hides the
//       rows and deletes the lifecycle row;
//   (e) a save or restore on either tab redraws the list.
//
// Run from repo root: `npm test` (or `node tests/workplan_goals_table_control.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const PLC = fs.readFileSync("project_lifecycle.js", "utf8");
const WPG = fs.readFileSync("workplan_goals.js", "utf8");

function sub(pid, name) {
  // The renderer's shape: a row-header name cell spanning Goal, Current and Stretch,
  // each row's ladder cells carrying data-aid.
  const cells = (row) => '<td data-aid="' + pid + '" data-row="' + row + '">0</td>';
  return '<tr class="g-' + pid + '"><th scope="row" rowspan="3" class="wpg-name"><span class="wpg-pid">' + pid + '</span> ' +
    '<span class="wpg-title-cell" data-title-edit="1" data-pid="' + pid + '">' + name + '</span></th>' +
    '<th scope="row">Goal</th>' + cells("goal") + '</tr>' +
    '<tr class="c-' + pid + '"><th scope="row">Current</th><td>0</td></tr>' +
    '<tr class="s-' + pid + '"><th scope="row">Stretch</th>' + cells("stretch") + '</tr>';
}
const TABLE = '<table><tbody><tr><th colspan="8" scope="rowgroup">Activity 4</th></tr>' +
  sub("4.6", "Workforce Sprint") + sub("4.7", "EMS Corps") + '</tbody></table>';

function makeDom(kind, lifecycleRows) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id=\"tab-workplan-goals\">" + TABLE + "</div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (kind === "reviewer") w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
  if (kind === "phrase") {
    w.CPL_TEAM_PHRASE = { session: () => ({ teamPass: "phrase", email: "(team)" }), clear() {}, decorateHeaders() {},
      unlockRow: () => w.document.createElement("span") };
  }
  dom._calls = [];
  dom._rows = lifecycleRows || [];
  w.fetch = function (url, opts) {
    url = String(url);
    dom._calls.push({ url: url, opts: opts || {} });
    const method = (opts && opts.method) || "GET";
    if (method === "POST" && /\/project_lifecycle$/.test(url)) {
      const b = JSON.parse(opts.body);
      dom._rows = dom._rows.filter((r) => r.project_id !== b.project_id).concat([b]);
      return Promise.resolve({ ok: true, status: 201, text: () => Promise.resolve("") });
    }
    if (method === "DELETE" && /\/project_lifecycle\?project_id=eq\./.test(url)) {
      const pid = decodeURIComponent(url.split("eq.")[1]);
      dom._rows = dom._rows.filter((r) => r.project_id !== pid);
      return Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve("") });
    }
    let body = [];
    if (/\/project_lifecycle\?select/.test(url)) body = dom._rows;
    if (/\/projects\?select=id,name/.test(url)) body = [{ id: "4.6", name: "Workforce Sprint" }, { id: "4.7", name: "EMS Corps" },
      { id: "3.2", name: "Old pilot" }, { id: "D.1", name: "Helper" }];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body), text: () => Promise.resolve("") });
  };
  w.eval(PLC);
  w.eval(WPG);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
const tables = (doc) => doc.querySelectorAll(".wpg-table").length;
const shown = (doc, cls) => doc.querySelector("tr." + cls).style.display !== "none";

(async function () {
  // ── (a) ──
  let dom = makeDom(null), doc = dom.window.document;
  await settle();
  check("(a) signed out: no Table and no list", tables(doc) === 0 && !doc.querySelector(".wpg-tabled"));
  dom = makeDom("phrase"); doc = dom.window.document;
  await settle();
  check("(a) the team phrase: no Table and no list (reviewer-only, Sheet 75 card 3)", tables(doc) === 0 && !doc.querySelector(".wpg-tabled"));

  // ── (b) ──
  dom = makeDom("reviewer"); let w = dom.window; doc = w.document;
  await settle();
  check("(b) a reviewer gets Table on every sub-activity", tables(doc) === 2);
  const t47 = Array.prototype.find.call(doc.querySelectorAll(".wpg-table"), (b) => /4\.7/.test(b.getAttribute("aria-label")));
  check("(b) Table sits beside Move in the same row", t47 && t47.parentNode.querySelector(".wpg-move") !== null);
  check("(b) each Table names its row for a screen reader", t47 && t47.getAttribute("aria-label") === "Table or archive 4.7 EMS Corps");
  check("(b) its text is a word", t47 && t47.textContent === "Table");
  t47.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  const modal = doc.querySelector(".plc-modal");
  check("(b) it opens the Activities tab's own dialog, on this row", modal && /Table or archive: EMS Corps \(4\.7\)/.test(modal.textContent));

  // ── (c) ──
  const confirmBtn = modal.querySelector(".plc-btn-submit");
  confirmBtn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  const post = dom._calls.filter((c) => c.opts.method === "POST" && /\/project_lifecycle$/.test(c.url));
  check("(c) one write to project_lifecycle, as the reviewer", post.length === 1 &&
    JSON.parse(post[0].opts.body).project_id === "4.7" && JSON.parse(post[0].opts.body).updated_by === "map@rccd.edu");
  check("(c) the row's Goal, Current and Stretch rows hide at once", !shown(doc, "g-4\\.7") && !shown(doc, "c-4\\.7") && !shown(doc, "s-4\\.7"));
  check("(c) the other sub-activity stays", shown(doc, "g-4\\.6") && shown(doc, "c-4\\.6"));

  // ── (d, e) ──
  const box = doc.querySelector(".wpg-tabled");
  check("(e) the save redraws the list here", box && /Tabled and archived \(1\)/.test(box.textContent) && /4\.7 EMS Corps/.test(box.textContent));
  const restore = box && box.querySelector(".wpg-restore");
  check("(d) Restore names its row", restore && restore.getAttribute("aria-label") === "Restore 4.7 EMS Corps" && restore.textContent === "Restore");
  restore.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  const del = dom._calls.filter((c) => c.opts.method === "DELETE");
  check("(d) Restore deletes the lifecycle row", del.length === 1 && /project_id=eq\.4\.7$/.test(del[0].url));
  check("(d) Restore brings the rows back at once", shown(doc, "g-4\\.7") && shown(doc, "c-4\\.7") && shown(doc, "s-4\\.7"));
  check("(e) the restore redraws the list", /Tabled and archived \(0\)/.test(doc.querySelector(".wpg-tabled").textContent));

  // A list read on load: sub-activity ids only, tabled and archived, names from projects.
  dom = makeDom("reviewer", [
    { project_id: "3.2", state: "archived", reason: "Pilot closed", updated_at: "2026-10-01T00:00:00Z" },
    { project_id: "D.1", state: "tabled", reason: null, updated_at: "2026-10-02T00:00:00Z" },
    { project_id: "4.6", state: "active", reason: null, updated_at: "2026-10-03T00:00:00Z" }]);
  doc = dom.window.document;
  await settle();
  const items = Array.prototype.map.call(doc.querySelectorAll(".wpg-tabled li"), (li) => li.textContent);
  check("(d) the list reads sub-activities only, with state and reason (no D.* helper, no other state)",
    items.length === 1 && /3\.2 Old pilot/.test(items[0]) && /Archived/.test(items[0]) && /Pilot closed/.test(items[0]));

  let fail = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
