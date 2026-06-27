// Card RACI overlay (card_raci.js) — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the script is included in both;
//  (b) leadNames picks Responsible, falls back to Accountable, else empty;
//  (c) rosterHtml lists every populated role and ESCAPES names (untrusted);
//  (d) the overlay rewrites a project card's Lead to the RACI Responsible, and
//      reveals + fills the placeholder Lead row on activity / sub-activity cards;
//  (e) the failure mode — an item with NO RACI row keeps the project card's
//      creation-era lead and leaves the placeholder rows hidden (no throw);
//  (f) a hover over a 👥 RACI button pops the R/A/C/I roster.
//
// Run from repo root: `npm test` (or `node tests/card_raci.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("card_raci.js included in CPL_Dashboard.html", /<script src="card_raci\.js"><\/script>/.test(cpl));
check("card_raci.js included in index.html", /<script src="card_raci\.js"><\/script>/.test(idx));

const SRC = fs.readFileSync("card_raci.js", "utf8");

// ── Part B — behavior, loaded into jsdom ──
function makeDom(rows) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      // Project card 1.1: creation-era lead "Terence Nelson" — RACI must override.
      '<div class="project-card">' +
        '<div><strong>Lead:</strong> <span class="cpl-raci-lead" data-raci-key="project:1.1">Terence Nelson</span></div>' +
        '<a href="#raci" class="raci-link" data-raci-key="project:1.1">RACI</a>' +
      "</div>" +
      // Sub-activity card 1.2: placeholder Lead row (hidden) — RACI must reveal+fill.
      '<div class="activity-kpi-card">' +
        '<div class="cpl-raci-lead-row" style="display:none;"><strong>Lead:</strong> <span class="cpl-raci-lead" data-raci-key="project:1.2">—</span></div>' +
      "</div>" +
      // Activity header: placeholder Lead row keyed activity:1.
      '<div class="activity-group">' +
        '<div class="cpl-raci-lead-row" style="display:none;"><strong>Lead:</strong> <span class="cpl-raci-lead" data-raci-key="activity:1">—</span></div>' +
        '<a href="#raci" class="act-raci-link" data-raci-key="activity:1">RACI</a>' +
      "</div>" +
      // Project card 9.9: NO RACI row — keeps its creation-era lead, no throw.
      '<div class="project-card">' +
        '<div><strong>Lead:</strong> <span class="cpl-raci-lead" data-raci-key="project:9.9">Old Owner</span></div>' +
      "</div>" +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  dom._rows = rows;
  dom._fetches = 0;
  w.fetch = function (url) {
    if (/item_raci/.test(url)) {
      dom._fetches++;
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(dom._rows); } });
    }
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve([]); } });
  };
  w.eval(SRC);
  return dom;
}

const ROWS = [
  { item_type: "project", item_id: "1.1", raci: { R: [{ name: "Malone Dunlavy" }], A: [{ name: "Samuel Lee" }], C: [{ name: "Crystal Nasio" }], I: [] } },
  { item_type: "project", item_id: "1.2", raci: { R: [], A: [{ name: "James Todd" }], C: [], I: [] } }, // A-only → lead falls back to A
  { item_type: "activity", item_id: "1", raci: { R: [{ name: "Malone Dunlavy" }], A: [{ name: "Samuel Lee" }, { name: "James Todd" }], C: [], I: [{ name: "Riley McFall" }] } },
];

(async function () {
  const probe = makeDom(ROWS);
  const API = probe.window.CPL_CARD_RACI;
  check("module exposes CPL_CARD_RACI", !!API && typeof API.run === "function");

  // (b) leadNames
  check("leadNames picks Responsible", API.leadNames(ROWS[0].raci).join() === "Malone Dunlavy");
  check("leadNames falls back to Accountable", API.leadNames(ROWS[1].raci).join() === "James Todd");
  check("leadNames empty when neither R nor A", API.leadNames({ C: [{ name: "x" }] }).length === 0);

  // (c) rosterHtml escapes + lists roles
  const roster = API.rosterHtml({ R: [{ name: "<img src=x onerror=alert(1)>" }], A: [{ name: "Sam" }], C: [], I: [] });
  check("rosterHtml escapes names (no raw <img>)", roster.indexOf("<img") === -1 && roster.indexOf("&lt;img") !== -1);
  check("rosterHtml shows Responsible + Accountable labels", /Responsible/.test(roster) && /Accountable/.test(roster));
  check("rosterHtml skips empty roles (no Informed row)", roster.indexOf("Informed") === -1);

  // (d) DOM application — let the mocked fetch resolve.
  await new Promise((r) => setTimeout(r, 30));
  const doc = probe.window.document;

  const lead11 = doc.querySelector('.cpl-raci-lead[data-raci-key="project:1.1"]');
  check("project 1.1 Lead overridden to RACI Responsible (Malone)", lead11 && lead11.textContent === "Malone Dunlavy");
  check("project 1.1 Lead marked from-raci", lead11 && lead11.getAttribute("data-from-raci") === "1");

  const row12 = doc.querySelector('.activity-kpi-card .cpl-raci-lead-row');
  const lead12 = doc.querySelector('.cpl-raci-lead[data-raci-key="project:1.2"]');
  check("sub-activity 1.2 placeholder row revealed", row12 && row12.style.display !== "none");
  check("sub-activity 1.2 Lead filled from Accountable fallback", lead12 && lead12.textContent === "James Todd");

  const rowAct = doc.querySelector('.activity-group .cpl-raci-lead-row');
  const leadAct = doc.querySelector('.cpl-raci-lead[data-raci-key="activity:1"]');
  check("activity:1 Lead row revealed + filled (Malone)", rowAct && rowAct.style.display !== "none" && leadAct.textContent === "Malone Dunlavy");

  // (e) no-RACI item keeps its creation-era lead, row not present → no throw.
  const lead99 = doc.querySelector('.cpl-raci-lead[data-raci-key="project:9.9"]');
  check("project 9.9 (no RACI) keeps creation-era lead", lead99 && lead99.textContent === "Old Owner" && !lead99.getAttribute("data-from-raci"));

  // (f) hover roster popover
  const btn = doc.querySelector('.act-raci-link[data-raci-key="activity:1"]');
  btn.dispatchEvent(new probe.window.MouseEvent("mouseover", { bubbles: true }));
  const pop = doc.querySelector(".cpl-raci-pop");
  check("hover pops a roster on the 👥 RACI button", pop && pop.style.display !== "none");
  check("roster popover lists the Responsible member", pop && /Malone Dunlavy/.test(pop.innerHTML));
  check("roster popover lists both Accountable members", pop && /Samuel Lee/.test(pop.innerHTML) && /James Todd/.test(pop.innerHTML));

  // (g) re-run idempotent + live refresh on cpl-raci-updated (R changes).
  let threw = false;
  try { API.run(); await new Promise((r) => setTimeout(r, 10)); } catch (e) { threw = true; }
  check("re-run is idempotent (no throw, Malone still shown)", !threw && lead11.textContent === "Malone Dunlavy");

  const fetchesBefore = probe._fetches;
  probe._rows = [
    { item_type: "project", item_id: "1.1", raci: { R: [{ name: "New Lead" }], A: [], C: [], I: [] } },
  ].concat(ROWS.slice(1));
  probe.window.dispatchEvent(new probe.window.CustomEvent("cpl-raci-updated", { detail: { key: "project:1.1" } }));
  await new Promise((r) => setTimeout(r, 30));
  check("cpl-raci-updated triggers a refetch", probe._fetches > fetchesBefore);
  check("a RACI change refreshes the card Lead live", lead11.textContent === "New Lead");

  // (h) clearing R+A on 1.1 reverts the project card to its creation-era lead.
  probe._rows = [
    { item_type: "project", item_id: "1.1", raci: { R: [], A: [], C: [], I: [] } },
  ].concat(ROWS.slice(1));
  probe.window.dispatchEvent(new probe.window.CustomEvent("cpl-raci-updated", {}));
  await new Promise((r) => setTimeout(r, 30));
  check("clearing RACI R+A restores the creation-era lead", lead11.textContent === "Terence Nelson" && !lead11.getAttribute("data-from-raci"));

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
