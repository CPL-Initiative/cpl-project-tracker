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
//  (h) reconcile NEVER hides an Activity-metrics KPI card (Session 95 — the
//      2026-07-02 mixup: tabling a "redundant" project card erased its
//      Activity card too);
//  (i) activity-layer ids (CPL_DATA.activity_kpis) are IMMUNE: no hide, no
//      collapsed entry, no 🗄 control — table/archive applies to real
//      work-item projects only;
//  (j) the Table/Archive modal survives clicks INSIDE it (Session-95 fix —
//      picking the Archive radio used to dismiss the modal via the capture-
//      phase overlay walk, so only the default "Tabled" could be confirmed);
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

// ── Part B — behavior, loaded into jsdom ──
function makeDom(overlayRows, opts) {
  opts = opts || {};
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      // An Activity-metrics KPI card hooked (card_updates.js pattern) to 5.1 —
      // 5.1 is tabled in the overlay below, but the Activity card must NEVER
      // be hidden by the project lifecycle (Session 95).
      '<div class="activity-kpi-card"><div class="cpl-live-update" data-update-key="project:5.1"></div></div>' +
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
      // the Annual Workplan Goals table (a SEPARATE surface) — 3 rows per project,
      // the name cell carries data-pid + rowspan=3. 5.1 (in overlay) must get
      // hidden; 9.9 (baked tabled, NOT in overlay) must be un-hidden on restore.
      '<table id="goals"><tbody>' +
        '<tr class="g51 gr"><td rowspan="3"><div class="wpg-assoc-cell" data-pid="5.1">x</div></td><td>Goal</td></tr>' +
        '<tr class="g51 gr"><td>Current</td></tr>' +
        '<tr class="g51 gr"><td>Stretch</td></tr>' +
        '<tr class="g99 gr" style="display:none;"><td rowspan="3"><div class="wpg-assoc-cell" data-pid="9.9">y</div></td><td>Goal</td></tr>' +
        '<tr class="g99 gr" style="display:none;"><td>Current</td></tr>' +
        '<tr class="g99 gr" style="display:none;"><td>Stretch</td></tr>' +
      '</tbody></table>' +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  dom._rows = overlayRows;
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
  if (opts.preEval) opts.preEval(w);
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

  // (e2) Annual Goals table reconciliation — the tabled 5.1 rowspan block is
  // hidden live; the restored 9.9 block (baked tabled, not in overlay) un-hidden.
  check("goals table: tabled 5.1's 3 rows are hidden", Array.prototype.every.call(doc.querySelectorAll(".g51"), function (r) { return r.style.display === "none"; }));
  check("goals table: restored 9.9's 3 rows are un-hidden", Array.prototype.every.call(doc.querySelectorAll(".g99"), function (r) { return r.style.display !== "none"; }));

  // (f) the 🗄 control is ALWAYS visible (affordance-visibility vs eligibility) so
  // the team-phrase / reviewer unlock is reachable from the card even signed out.
  check("signed out: 🗄 Table control IS shown on active cards", doc.querySelectorAll(".plc-table-btn").length >= 1);
  check("signed out: 🗄 control on the active 1.1 card", !!doc.querySelector('.project-card[data-pid="1.1"] .plc-table-btn'));
  check("signed out: no 🗄 control on the hidden/tabled 5.1 card", !doc.querySelector('.project-card[data-pid="5.1"] .plc-table-btn'));
  check("signed out: Restore buttons hidden", Array.prototype.every.call(doc.querySelectorAll(".tabled-restore"), function (b) { return b.style.display === "none"; }));

  // Provide a team phrase → Restore lights up too.
  w.localStorage.setItem("cpl_team_pass", "cpl-team-2026");
  API.mountControls();
  check("with team phrase: 🗄 control still on the active 1.1 card", !!doc.querySelector('.project-card[data-pid="1.1"] .plc-table-btn'));
  check("with team phrase: Restore buttons shown", Array.prototype.some.call(doc.querySelectorAll(".tabled-restore"), function (b) { return b.style.display !== "none"; }));

  // (g) reconcile is idempotent (no throw, no duplicate entries).
  let threw = false;
  try { API.reconcile(); API.reconcile(); } catch (e) { threw = true; }
  check("reconcile is idempotent (no throw, single 5.1 entry)", !threw && doc.querySelectorAll('.tabled-card[data-pid="5.1"]').length === 1);

  // (h) the Activity-metrics KPI card hooked to the tabled 5.1 is NOT hidden —
  // the project lifecycle never touches the Activity layer (Session 95).
  const actCard = doc.querySelector(".activity-kpi-card");
  check("activity KPI card for tabled 5.1 stays visible", actCard && actCard.style.display !== "none");

  // (i) activity-layer ids (CPL_DATA.activity_kpis) are IMMUNE end-to-end.
  const dom2 = makeDom(
    [{ project_id: "1.1", state: "tabled", reason: "mixup", updated_by: "(team)", updated_at: "2026-07-02T15:28:35Z" }],
    { preEval: function (w2) {
        w2.CPL_DATA = { activity_kpis: [
          { activity_id: "Activity 1", kpis: [{ id: "1.1", name: "MAP Platform Development" }] },
          // a ladder-bearing legacy 5.x — a REAL project, never immune
          { activity_id: "Activity 4", kpis: [{ id: "5.1", name: "AI-Ready California Demonstration" }] },
        ] };
        w2.localStorage.setItem("cpl_team_pass", "cpl-team-2026");
      } });
  await new Promise((r) => setTimeout(r, 30));
  const doc2 = dom2.window.document;
  const API2 = dom2.window.CPL_PROJECT_LIFECYCLE;
  check("immune: activityLayerIds reads CPL_DATA", API2.activityLayerIds()["1.1"] === true);
  check("immune: legacy 5.x is NEVER immune (real project)", !API2.activityLayerIds()["5.1"]);
  const card11 = doc2.querySelector('.project-card[data-pid="1.1"]');
  check("immune: overlay row on sub-activity 1.1 does NOT hide its card",
    card11 && card11.style.display !== "none" && !card11.getAttribute("data-lifecycle"));
  check("immune: no collapsed Tabled entry for sub-activity 1.1", !doc2.querySelector('.tabled-card[data-pid="1.1"]'));
  check("immune: no 🗄 control on sub-activity 1.1 even when authed", !doc2.querySelector('.project-card[data-pid="1.1"] .plc-table-btn'));
  check("immune: real project 5.1 still gets a 🗄 control", !!doc2.querySelector('.project-card[data-pid="5.1"] .plc-table-btn'));

  // (j) the modal survives inner clicks; Archive is now confirmable.
  const dom3 = makeDom([], { preEval: function (w3) { w3.localStorage.setItem("cpl_team_pass", "cpl-team-2026"); } });
  await new Promise((r) => setTimeout(r, 30));
  const w3 = dom3.window, doc3 = w3.document;
  doc3.querySelector('.project-card[data-pid="5.1"] .plc-table-btn').click();
  check("modal opens with the state choice (authed)", !!doc3.querySelector(".plc-modal .plc-choice"));
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
  // Reopen → a TRUE backdrop click still closes.
  dom3.window.CPL_PROJECT_LIFECYCLE.mountControls();
  const btn11 = doc3.querySelector('.project-card[data-pid="1.1"] .plc-table-btn');
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
