// Project lifecycle overlay (project_lifecycle.js) — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the script is included in both;
//  (b) indexOverlay drops malformed rows (no project_id, or a state outside the
//      tabled/archived pair) — the failure mode;
//  (c) entryHtml ESCAPES the name + reason (overlay text is reviewer-written —
//      treat as untrusted → no XSS) and carries a badge + a Restore button;
//  (d) reconcile hides a grid card that's in the overlay (data-lifecycle +
//      display:none) and builds a collapsed entry — even for an overlay row whose
//      pid has NO card (name falls back to the pid; no throw);
//  (e) reconcile RESTORES a baked-tabled card that's no longer in the overlay
//      (un-hidden + its collapsed entry removed);
//  (f) mountControls gates on auth — no 🗄 control / Restore hidden when signed
//      out; both appear once a team phrase is present.
//
// Run from repo root: `npm test` (or `node tests/project_lifecycle.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("project_lifecycle.js included in CPL_Dashboard.html", /<script src="project_lifecycle\.js"><\/script>/.test(cpl));
check("project_lifecycle.js included in index.html", /<script src="project_lifecycle\.js"><\/script>/.test(idx));

const SRC = fs.readFileSync("project_lifecycle.js", "utf8");

// ── Part B — behavior, loaded into jsdom ──
function makeDom(overlayRows) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      '<div id="projectsGrid">' +
        // active, visible card
        '<div class="project-card" data-pid="5.1"><div class="project-name">AI-Ready California Demonstration</div></div>' +
        // another active card
        '<div class="project-card" data-pid="1.1"><div class="project-name">CPL Faculty Toolkit</div></div>' +
        // a card baked as tabled (will be restored — it is NOT in the overlay below)
        '<div class="project-card" data-pid="9.9" data-lifecycle="tabled" style="display:none;"><div class="project-name">Old Pilot</div></div>' +
      "</div>" +
      // a baked collapsed section carrying the 9.9 entry (must be removed on restore)
      '<details class="tabled-archived-wrap"><summary class="tabled-archived-summary">🗄 Tabled &amp; Archived <span class="tabled-archived-count">(1)</span></summary>' +
        '<div class="tabled-archived-grid">' +
          '<div class="tabled-card" data-pid="9.9" data-lifecycle="tabled"><span class="tabled-name">Old Pilot <span>9.9</span></span>' +
            '<button class="tabled-restore" data-pid="9.9" style="display:none;">♻ Restore to active</button></div>' +
        '</div></details>' +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  dom._rows = overlayRows;
  w.fetch = function (url, opts) {
    if (/project_lifecycle\?select/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(dom._rows); } });
    }
    if (/rpc\/team_pass_ok/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(true); } });
    }
    // writes (POST upsert / DELETE) succeed
    return Promise.resolve({ ok: true, status: 200, text: function () { return Promise.resolve(""); }, json: function () { return Promise.resolve([]); } });
  };
  w.eval(SRC);
  return dom;
}

// Overlay: 5.1 tabled (matches a card), 7.7 archived (NO card — name falls back),
// plus malformed rows that must be dropped.
const OVERLAY = [
  { project_id: "5.1", state: "tabled", reason: "Contingent on funding not secured for 2026.", updated_by: "map@rccd.edu", updated_at: "2026-06-29T18:00:00Z" },
  { project_id: "7.7", state: "archived", reason: null, updated_by: "(team)", updated_at: "2026-06-29T18:05:00Z" },
  { project_id: null, state: "tabled" },              // malformed — no pid
  { project_id: "8.8", state: "deleted" },            // malformed — bad state
];

(async function () {
  const probe = makeDom(OVERLAY);
  const w = probe.window;
  const API = w.CPL_PROJECT_LIFECYCLE;
  check("module exposes CPL_PROJECT_LIFECYCLE", !!API && typeof API.run === "function");

  // (b) indexOverlay drops malformed rows.
  const idxMap = API.indexOverlay(OVERLAY);
  check("indexOverlay keeps the two valid rows", Object.keys(idxMap).length === 2);
  check("indexOverlay drops a row with no project_id", !idxMap[null] && !idxMap["null"]);
  check("indexOverlay drops a bad-state row (8.8)", !idxMap["8.8"]);
  check("indexOverlay normalizes a null reason to ''", idxMap["7.7"].reason === "");

  // (c) entryHtml escapes + carries badge + restore button.
  const xss = API.entryHtml("5.1", "<img src=x onerror=alert(1)>", { state: "tabled", reason: "<b>bad</b> & risky", updated_by: "map@rccd.edu", updated_at: "2026-06-29T18:00:00Z" });
  check("entryHtml escapes the name (no raw <img>)", xss.indexOf("<img") === -1 && xss.indexOf("&lt;img") !== -1);
  check("entryHtml escapes the reason (no raw <b>)", xss.indexOf("<b>bad") === -1 && xss.indexOf("&lt;b&gt;bad") !== -1);
  check("entryHtml carries a Tabled badge", /Tabled<\/span>/.test(xss));
  check("entryHtml carries a Restore button with the pid", /tabled-restore"[^>]*data-pid="5\.1"/.test(xss));
  check("badgeHtml distinguishes archived", /Archived<\/span>/.test(API.badgeHtml("archived")));

  // let the auto-run fetch resolve + reconcile.
  await new Promise((r) => setTimeout(r, 30));
  const doc = w.document;

  // (d) 5.1 is hidden + an entry is built.
  const card51 = doc.querySelector('.project-card[data-pid="5.1"]');
  check("overlay card 5.1 is hidden", card51 && card51.style.display === "none" && card51.getAttribute("data-lifecycle") === "tabled");
  check("a collapsed entry exists for 5.1", !!doc.querySelector('.tabled-card[data-pid="5.1"]'));
  check("5.1 entry shows the reason", /Contingent on funding/.test(doc.querySelector('.tabled-card[data-pid="5.1"]').innerHTML));
  // 7.7 has no card — entry still built off the pid, no throw.
  check("a collapsed entry exists for the card-less 7.7", !!doc.querySelector('.tabled-card[data-pid="7.7"]'));

  // (e) 9.9 was baked tabled but is NOT in the overlay → restored.
  const card99 = doc.querySelector('.project-card[data-pid="9.9"]');
  check("baked-tabled 9.9 (not in overlay) is un-hidden", card99 && !card99.getAttribute("data-lifecycle") && card99.style.display !== "none");
  check("9.9's stale collapsed entry is removed", !doc.querySelector('.tabled-card[data-pid="9.9"]'));

  // (f) auth gating of the controls.
  check("signed out: no 🗄 Table control on active cards", doc.querySelectorAll(".plc-table-btn").length === 0);
  check("signed out: Restore buttons hidden", Array.prototype.every.call(doc.querySelectorAll(".tabled-restore"), function (b) { return b.style.display === "none"; }));

  // Provide a team phrase → controls light up.
  w.localStorage.setItem("cpl_team_pass", "cpl-team-2026");
  API.mountControls();
  check("with team phrase: 🗄 control appears on the active 1.1 card", !!doc.querySelector('.project-card[data-pid="1.1"] .plc-table-btn'));
  check("with team phrase: no 🗄 control on the hidden/tabled card", !doc.querySelector('.project-card[data-pid="5.1"] .plc-table-btn'));
  check("with team phrase: Restore buttons shown", Array.prototype.some.call(doc.querySelectorAll(".tabled-restore"), function (b) { return b.style.display !== "none"; }));

  // (g) reconcile is idempotent (no throw, no duplicate entries).
  let threw = false;
  try { API.reconcile(); API.reconcile(); } catch (e) { threw = true; }
  check("reconcile is idempotent (no throw, single 5.1 entry)", !threw && doc.querySelectorAll('.tabled-card[data-pid="5.1"]').length === 1);

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
