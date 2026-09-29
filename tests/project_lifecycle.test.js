// Project lifecycle overlay (project_lifecycle.js) — jsdom test.
//
// POST-REORG reality (Activities-tab reorg, 2026-07-21): the separate
// #projectsGrid of .project-card's is DISSOLVED. Every project now renders as a
// nested `.activity-kpi-card[data-pid]` under its Activity (with an
// `.akpi-name` name cell), and the generator emits ONLY the collapsed
// "Tabled & Archived" ledger between the Projects-Grid markers (no #projectsGrid
// wrapper → gridEl() is null on the live page). Tabling now works on the nested
// cards; the old Session-95 `immune` gate is dropped (it would mark *everything*
// immune post-reorg since all projects live in activity_kpis).
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the script is included in both;
//  (b) indexOverlay drops malformed rows (no project_id, or a state outside the
//      tabled/archived pair) — the failure mode;
//  (c) entryHtml ESCAPES the name + reason (overlay text is reviewer-written —
//      treat as untrusted → no XSS) and carries a badge + a Restore button;
//  (d) reconcile hides an ACTIVE .activity-kpi-card that's in the overlay
//      (data-lifecycle + display:none, resolved via cardFor's new selector) and
//      builds a collapsed ledger entry — even for an overlay row whose pid has
//      NO card (name falls back to the pid; no throw);
//  (e) a baked ledger entry no longer in the overlay is removed on reconcile;
//  (f) mountControls mounts a 🗄 control on EVERY active .activity-kpi-card[data-pid]
//      (1.1 and a re-homed 1.1.1), NOT on the .activity-group-header, and NOT on a
//      card already carrying data-lifecycle; Restore buttons gate on auth;
//  (g) the run() overlay-load fires on the post-reorg DOM (no #projectsGrid) —
//      the Activities surface is detected via the nested cards / ledger, so a
//      drift-tabled card still reconciles (hides) on load;
//  (h) activityLayerIds() still returns its CPL_DATA-derived shape but NO LONGER
//      gates: a sub-activity id in CPL_DATA.activity_kpis is now tableable/hideable
//      (INVERTS the old "immune → no hide / no control" assertions);
//  (i) the legacy #projectsGrid .project-card fallback still resolves (cardFor +
//      mountControls + reconcile-restore) so pre-regen HTML works in transition;
//  (j) the Table/Archive modal (opened from an .activity-kpi-card) survives
//      clicks INSIDE it (Session-95 fix — the Archive radio used to dismiss it);
//      Confirm saves the picked state + reason; a true backdrop click closes.
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

function installFetch(dom) {
  const w = dom.window;
  dom._writes = [];
  w.fetch = function (url, fopts) {
    if (/project_lifecycle\?select/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(dom._rows); } });
    }
    if (/rpc\/team_pass_ok/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(true); } });
    }
    // writes (POST upsert / DELETE) succeed — recorded for the modal test (j)
    dom._writes.push({ url: url, opts: fopts || {} });
    return Promise.resolve({ ok: true, status: 200, text: function () { return Promise.resolve(""); }, json: function () { return Promise.resolve([]); } });
  };
}

// ── Part B — behavior, loaded into jsdom (POST-REORG structure) ──
// Mirrors the generator: an .activity-kpi-section of .activity-group blocks,
// each with an .activity-group-header (NOT a card, NEVER tableable) and an
// .activity-kpi-grid of sibling .activity-kpi-card[data-pid] project cards whose
// name lives in .akpi-name. NO #projectsGrid — only the baked "Tabled &
// Archived" ledger the generator now emits between the Projects-Grid markers.
function makeDom(overlayRows, opts) {
  opts = opts || {};
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      '<div class="activity-kpi-section" id="activityKpiSection">' +
        '<div class="activity-group">' +
          '<div class="activity-group-header"><h3>Activity 1: Faculty &amp; Curriculum</h3></div>' +
          '<div class="activity-kpi-grid">' +
            // active, visible sub-activity card
            '<div class="activity-kpi-card has-metric" data-pid="1.1" data-activity="Activity 1" data-depth="0">' +
              '<div class="akpi-header"><span class="akpi-id">1.1</span></div>' +
              '<div class="akpi-name">CPL Faculty Toolkit</div></div>' +
            // a re-homed CHILD sub-activity card (data-depth=1) — also tableable
            '<div class="activity-kpi-card no-metric" data-pid="1.1.1" data-activity="Activity 1" data-depth="1" style="border-left:3px solid var(--cobalt);">' +
              '<div class="akpi-header"><span class="akpi-id">1.1.1</span></div>' +
              '<div class="akpi-name">Toolkit — Faculty Workshops</div></div>' +
          "</div>" +
        "</div>" +
        '<div class="activity-group">' +
          '<div class="activity-group-header"><h3>Activity 4: Veteran &amp; Apprenticeship</h3></div>' +
          '<div class="activity-kpi-grid">' +
            // active card whose pid (5.1) is TABLED in the overlay → reconcile
            // must hide it via cardFor (the drift case).
            '<div class="activity-kpi-card has-metric" data-pid="5.1" data-activity="Activity 4" data-depth="0">' +
              '<div class="akpi-header"><span class="akpi-id">5.1</span></div>' +
              '<div class="akpi-name">AI-Ready California Demonstration</div></div>' +
            // a card carrying data-lifecycle already (defensive) — mountControls
            // must NOT add a 🗄 control to it. NOT in the overlay below.
            '<div class="activity-kpi-card has-metric" data-pid="4.9" data-activity="Activity 4" data-depth="0" data-lifecycle="tabled" style="display:none;">' +
              '<div class="akpi-header"><span class="akpi-id">4.9</span></div>' +
              '<div class="akpi-name">Old Sprint Pilot</div></div>' +
          "</div>" +
        "</div>" +
      "</div>" +
      // the baked collapsed ledger (post-reorg = the only thing between the
      // Projects-Grid markers). Carries a stale 4.9 entry NOT in the overlay →
      // removed on reconcile.
      '<details class="tabled-archived-wrap"><summary class="tabled-archived-summary">🗄 Tabled &amp; Archived <span class="tabled-archived-count">(1)</span></summary>' +
        '<div class="tabled-archived-grid">' +
          '<div class="tabled-card" data-pid="4.9" data-lifecycle="tabled"><span class="tabled-name">Old Sprint Pilot <span>4.9</span></span>' +
            '<button class="tabled-restore" data-pid="4.9" style="display:none;">♻ Restore to active</button></div>' +
        '</div></details>' +
      // the Annual Workplan Goals table (a SEPARATE surface, unchanged) — 3 rows
      // per project, the name cell carries data-pid + rowspan=3. 5.1 (in overlay)
      // must get hidden.
      '<table id="goals"><tbody>' +
        '<tr class="g51 gr"><td rowspan="3"><div class="wpg-assoc-cell" data-pid="5.1">x</div></td><td>Goal</td></tr>' +
        '<tr class="g51 gr"><td>Current</td></tr>' +
        '<tr class="g51 gr"><td>Stretch</td></tr>' +
      '</tbody></table>' +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  dom._rows = overlayRows;
  installFetch(dom);
  if (opts.preEval) opts.preEval(dom.window);
  dom.window.eval(SRC);
  return dom;
}

// A LEGACY (pre-regen) DOM that still carries the old #projectsGrid .project-card
// structure, to guard the transition fallback in cardFor / mountControls /
// reconcile-restore (test i).
function makeLegacyDom(overlayRows, opts) {
  opts = opts || {};
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      '<div id="projectsGrid">' +
        '<div class="project-card" data-pid="2.2"><div class="project-name">Legacy Active Project</div></div>' +
        // baked-tabled grid card NOT in the overlay → restored (un-hidden) on reconcile
        '<div class="project-card" data-pid="9.9" data-lifecycle="tabled" style="display:none;"><div class="project-name">Old Pilot</div></div>' +
      "</div>" +
      '<details class="tabled-archived-wrap"><summary class="tabled-archived-summary">🗄 Tabled &amp; Archived <span class="tabled-archived-count">(1)</span></summary>' +
        '<div class="tabled-archived-grid">' +
          '<div class="tabled-card" data-pid="9.9" data-lifecycle="tabled"><span class="tabled-name">Old Pilot <span>9.9</span></span>' +
            '<button class="tabled-restore" data-pid="9.9" style="display:none;">♻ Restore to active</button></div>' +
        '</div></details>' +
      '<table id="goals"><tbody>' +
        '<tr class="g99 gr" style="display:none;"><td rowspan="3"><div class="wpg-assoc-cell" data-pid="9.9">y</div></td><td>Goal</td></tr>' +
        '<tr class="g99 gr" style="display:none;"><td>Current</td></tr>' +
        '<tr class="g99 gr" style="display:none;"><td>Stretch</td></tr>' +
      '</tbody></table>' +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  dom._rows = overlayRows;
  installFetch(dom);
  if (opts.preEval) opts.preEval(dom.window);
  dom.window.eval(SRC);
  return dom;
}

// Overlay: 5.1 tabled (matches an active card → drift hide), 7.7 archived (NO
// card — name falls back), plus malformed rows that must be dropped.
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

  // let the auto-run fetch resolve + reconcile. (g) — run() must load the overlay
  // even though there is NO #projectsGrid (the Activities surface is detected via
  // the nested .activity-kpi-card / the ledger).
  await new Promise((r) => setTimeout(r, 30));
  const doc = w.document;

  // (d) the active card 5.1 is hidden via cardFor's new selector + an entry built.
  const card51 = doc.querySelector('.activity-kpi-card[data-pid="5.1"]');
  check("run() loaded the overlay on a grid-less DOM (5.1 reconciled)", card51 && card51.getAttribute("data-lifecycle") === "tabled");
  check("overlay card 5.1 is hidden", card51 && card51.style.display === "none");
  check("a collapsed entry exists for 5.1", !!doc.querySelector('.tabled-card[data-pid="5.1"]'));
  check("5.1 entry (name from .akpi-name) shows the reason", /Contingent on funding/.test(doc.querySelector('.tabled-card[data-pid="5.1"]').innerHTML));
  check("5.1 entry name came from .akpi-name", /AI-Ready California Demonstration/.test(doc.querySelector('.tabled-card[data-pid="5.1"]').innerHTML));
  // 7.7 has no card — entry still built off the pid, no throw.
  check("a collapsed entry exists for the card-less 7.7", !!doc.querySelector('.tabled-card[data-pid="7.7"]'));

  // (e) the baked 4.9 ledger entry is NOT in the overlay → removed on reconcile.
  check("stale 4.9 ledger entry (not in overlay) is removed", !doc.querySelector('.tabled-card[data-pid="4.9"]'));

  // (e2) Annual Goals table — the tabled 5.1 rowspan block is hidden live.
  check("goals table: tabled 5.1's 3 rows are hidden", Array.prototype.every.call(doc.querySelectorAll(".g51"), function (r) { return r.style.display === "none"; }));

  // (f) mountControls mounts a 🗄 control on EVERY active .activity-kpi-card —
  // INVERTS the old "core ids are immune, no control" assertions.
  check("🗄 control mounted on the active 1.1 card", !!doc.querySelector('.activity-kpi-card[data-pid="1.1"] .plc-table-btn'));
  check("🗄 control mounted on the re-homed child 1.1.1 card", !!doc.querySelector('.activity-kpi-card[data-pid="1.1.1"] .plc-table-btn'));
  check("no 🗄 control on the hidden/tabled 5.1 card", !doc.querySelector('.activity-kpi-card[data-pid="5.1"] .plc-table-btn'));
  check("no 🗄 control on the data-lifecycle 4.9 card", !doc.querySelector('.activity-kpi-card[data-pid="4.9"] .plc-table-btn'));
  // the Activity group HEADER is never a card → never tableable / hidden.
  check("no 🗄 control on any .activity-group-header", doc.querySelectorAll(".activity-group-header .plc-table-btn").length === 0);
  check("group headers stay visible (never hidden by tabling)", Array.prototype.every.call(doc.querySelectorAll(".activity-group-header"), function (h) { return h.style.display !== "none" && !h.getAttribute("data-lifecycle"); }));

  // signed out: the 🗄 control is ALWAYS visible (affordance-visibility vs
  // eligibility); Restore buttons stay hidden until authed.
  check("signed out: 🗄 controls present on active cards", doc.querySelectorAll(".plc-table-btn").length >= 2);
  check("signed out: Restore buttons hidden", Array.prototype.every.call(doc.querySelectorAll(".tabled-restore"), function (b) { return b.style.display === "none"; }));

  // Provide a team phrase → Restore lights up too.
  w.localStorage.setItem("cpl_team_pass", "cpl-team-2026");
  API.mountControls();
  check("with team phrase: 🗄 control still on the active 1.1 card", !!doc.querySelector('.activity-kpi-card[data-pid="1.1"] .plc-table-btn'));
  check("with team phrase: Restore buttons shown", Array.prototype.some.call(doc.querySelectorAll(".tabled-restore"), function (b) { return b.style.display !== "none"; }));

  // reconcile is idempotent (no throw, no duplicate entries).
  let threw = false;
  try { API.reconcile(); API.reconcile(); } catch (e) { threw = true; }
  check("reconcile is idempotent (no throw, single 5.1 entry)", !threw && doc.querySelectorAll('.tabled-card[data-pid="5.1"]').length === 1);
  check("mountControls is idempotent (single control row on 1.1)", doc.querySelectorAll('.activity-kpi-card[data-pid="1.1"] .plc-ctl-row').length === 1);

  // (h) activityLayerIds() keeps its CPL_DATA shape but NO LONGER gates tabling —
  // a sub-activity id in CPL_DATA.activity_kpis is now tableable/hideable.
  const dom2 = makeDom(
    [{ project_id: "1.1", state: "tabled", reason: "reorg", updated_by: "(team)", updated_at: "2026-07-21T15:28:35Z" }],
    { preEval: function (w2) {
        w2.CPL_DATA = { activity_kpis: [
          { activity_id: "Activity 1", kpis: [{ id: "1.1", name: "CPL Faculty Toolkit" }] },
          // a legacy 5.x id — the indexOf("5.") guard keeps it OUT of the map
          { activity_id: "Activity 4", kpis: [{ id: "5.1", name: "AI-Ready California Demonstration" }] },
        ] };
        w2.localStorage.setItem("cpl_team_pass", "cpl-team-2026");
      } });
  await new Promise((r) => setTimeout(r, 30));
  const doc2 = dom2.window.document;
  const API2 = dom2.window.CPL_PROJECT_LIFECYCLE;
  check("activityLayerIds still reads CPL_DATA (shape preserved)", API2.activityLayerIds()["1.1"] === true);
  check("activityLayerIds still excludes 5.x (indexOf guard)", !API2.activityLayerIds()["5.1"]);
  const card11 = doc2.querySelector('.activity-kpi-card[data-pid="1.1"]');
  check("NO LONGER immune: overlay row on 1.1 DOES hide its card now",
    card11 && card11.style.display === "none" && card11.getAttribute("data-lifecycle") === "tabled");
  check("NO LONGER immune: a collapsed ledger entry IS built for 1.1", !!doc2.querySelector('.tabled-card[data-pid="1.1"]'));
  check("tabled 1.1 (now hidden) gets no 🗄 control", !doc2.querySelector('.activity-kpi-card[data-pid="1.1"] .plc-table-btn'));
  check("active 5.1 (not in overlay) still gets a 🗄 control", !!doc2.querySelector('.activity-kpi-card[data-pid="5.1"] .plc-table-btn'));

  // (i) LEGACY transition fallback: cardFor + mountControls + reconcile-restore
  // still work against the old #projectsGrid .project-card structure.
  const domL = makeLegacyDom(
    [], // empty overlay → the baked-tabled 9.9 grid card is restored
    { preEval: function (wL) { wL.localStorage.setItem("cpl_team_pass", "cpl-team-2026"); } });
  await new Promise((r) => setTimeout(r, 30));
  const docL = domL.window.document;
  check("legacy: 🗄 control mounts on the #projectsGrid .project-card 2.2", !!docL.querySelector('.project-card[data-pid="2.2"] .plc-table-btn'));
  const cardL99 = docL.querySelector('.project-card[data-pid="9.9"]');
  check("legacy: baked-tabled 9.9 (not in overlay) is un-hidden (restore)", cardL99 && !cardL99.getAttribute("data-lifecycle") && cardL99.style.display !== "none");
  check("legacy: 9.9's stale ledger entry is removed", !docL.querySelector('.tabled-card[data-pid="9.9"]'));
  check("legacy: restored 9.9's goals rows are un-hidden", Array.prototype.every.call(docL.querySelectorAll(".g99"), function (r) { return r.style.display !== "none"; }));

  // (j) the modal survives inner clicks; Archive is confirmable — opened from an
  // .activity-kpi-card. Empty overlay so 5.1 stays active + carries a control.
  const dom3 = makeDom([], { preEval: function (w3) { w3.localStorage.setItem("cpl_team_pass", "cpl-team-2026"); } });
  await new Promise((r) => setTimeout(r, 30));
  const w3 = dom3.window, doc3 = w3.document;
  doc3.querySelector('.activity-kpi-card[data-pid="5.1"] .plc-table-btn').click();
  check("modal opens with the state choice (authed)", !!doc3.querySelector(".plc-modal .plc-choice"));
  check("modal title uses the .akpi-name project name", /AI-Ready California Demonstration/.test(doc3.querySelector(".plc-modal h3").textContent));
  const archRadio = doc3.querySelector('input[name="plc-state"][value="archived"]');
  archRadio.click();
  check("clicking the Archive radio does NOT dismiss the modal", !!doc3.querySelector(".plc-modal-overlay"));
  check("Archive radio is selected after the click", archRadio.checked === true);
  doc3.querySelector(".plc-reason").value = "Completed in June.";
  doc3.querySelector(".plc-btn-submit").click();
  await new Promise((r) => setTimeout(r, 30));
  const upsert = dom3._writes.find(function (x) { return /rest\/v1\/project_lifecycle$/.test(x.url) && x.opts.method === "POST"; });
  const body = upsert ? JSON.parse(upsert.opts.body) : {};
  check("Confirm saves state=archived (not the default tabled)", body.state === "archived");
  check("Confirm saves the typed reason", body.reason === "Completed in June.");
  check("Confirm optimistically hides the 5.1 card (via cardFor)", doc3.querySelector('.activity-kpi-card[data-pid="5.1"]').style.display === "none");
  check("Confirm optimistically adds a 5.1 ledger entry", !!doc3.querySelector('.tabled-card[data-pid="5.1"]'));
  // Reopen from another active card → a TRUE backdrop click still closes.
  const btn11 = doc3.querySelector('.activity-kpi-card[data-pid="1.1"] .plc-table-btn');
  if (btn11) btn11.click();
  const backdrop = doc3.querySelector(".plc-modal-overlay");
  check("modal reopens for the backdrop test", !!backdrop);
  if (backdrop) backdrop.click();
  check("a true backdrop click closes the modal", !doc3.querySelector(".plc-modal-overlay"));

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
