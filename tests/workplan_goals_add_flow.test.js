// Annual Workplan Goals: the one add flow, Set targets, and the counting notes — jsdom.
//
// Sam, 2026-10-12, adding 3.9 Futuro Behavioral Healthcare Project: the dialog said
// "no Activities exist yet" and "Project prefix '3' is not an existing Activity ID".
// Two faults sat under that:
//   (a) the Activity list read a DOM marker (data-kind="activity") the Annual table no
//       longer prints, so it came back empty and every sub-activity was refused;
//   (b) a sub-activity add wrote only the goal ladder, never the projects row the
//       table iterates (Path A), so even a valid add never appeared.
// And the asks that came with it:
//   (c) the next free number is suggested from a parent ("3" -> 3.9, "4.2" -> 4.2.1);
//   (d) a new sub-activity writes projects, then workplan_goals, then its links, the
//       home Activity always linked and marked primary;
//   (e) a tabled id (absent from the page) is read live, so the suggestion skips it;
//   (f) a row with no ladder offers "Set targets", which writes the ladder only;
//   (g) what the numbers count (projects.kpi_unit) and how they are counted
//       (projects.count_note) edit in place, the empty "Add" prompt saving as blank;
//   (h) the Activities tab's activity headers offer "Add sub-activity" to an editor;
//   (i) signed out, none of the controls or empty counting lines show.
//
// Run from repo root: `npm test` (or `node tests/workplan_goals_add_flow.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("workplan_goals.js", "utf8");

// Mirrors render_annual_goals_table_html's attributes: four Activity headers, a
// ladder-bearing 3.8, a ladderless 1.1.2 with empty counting lines, and one
// Activities-tab activity header.
function header(n, name) {
  return '<tr><td colspan="8"><span>Activity ' + n + ': </span>' +
    '<span class="wpg-title-cell" data-activity-title-edit="1" data-aid="' + n + '" data-val="' + name + '">' + name + '</span>' +
    '</td></tr>';
}
const TABLE =
  '<table><tbody>' +
    header(1, "Build AI-Enhanced CPL Infrastructure") +
    '<tr><td rowspan="3" data-no-ladder="1" data-pid="1.1.2" data-name="AI Apprenticeship CPL Tools"><span>1.1.2</span> ' +
      '<span class="wpg-title-cell" data-title-edit="1" data-pid="1.1.2">AI Apprenticeship CPL Tools</span>' +
      '<div class="wpg-count-line" hidden><span class="wpg-count-label">Counts:</span> ' +
        '<span class="wpg-unit-cell" data-unit-edit="1" data-pid="1.1.2" data-val=""></span></div>' +
      '<div class="wpg-count-line" hidden><span class="wpg-count-label">How it is counted:</span> ' +
        '<span class="wpg-note-cell" data-note-edit="1" data-pid="1.1.2" data-val=""></span></div>' +
    '</td><td>Goal</td><td></td></tr>' +
    header(2, "Faculty Workgroups & Credit Recommendations") +
    header(3, "Build CPL Data Infrastructure") +
    '<tr><td rowspan="3"><span>3.8</span> ' +
      '<span class="wpg-title-cell" data-title-edit="1" data-pid="3.8">MIS Data Reconciliation</span>' +
    '</td><td>Goal</td><td data-editable="1" data-aid="3.8" data-kind="project" data-rt="GOAL" data-yr="2025-26" data-yr-key="yr_2025_26" data-val="0"></td></tr>' +
    header(4, "Coordinate CPL Sprints") +
  '</tbody></table>';
const ACT_HEADER =
  '<div id="tab-activities-projects"><div class="activity-group-header"><h3>Activity 3: Build CPL Data Infrastructure</h3>' +
  '<span><a href="#raci" class="act-raci-link" data-raci-key="activity:3">RACI</a></span></div></div>';

function makeDom(signedIn, liveIds) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" + ACT_HEADER +
      '<div id="tab-workplan-goals">' + TABLE + "</div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (signedIn) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
  }
  dom._calls = [];
  w.fetch = function (url, opts) {
    dom._calls.push({ url: String(url), opts: opts || {} });
    const isIdList = /\/projects\?select=id$/.test(String(url)) && !(opts && opts.method);
    return Promise.resolve({ ok: true, status: 200,
      json: function () { return Promise.resolve(isIdList ? (liveIds || []).map(function (id) { return { id: id }; }) : []); },
      text: function () { return Promise.resolve(""); } });
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
const tick = function () { return new Promise(function (r) { setTimeout(r, 0); }); };
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
function click(w, node) { node.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
function posts(dom) { return dom._calls.filter(function (c) { return c.opts.method === "POST"; }); }
function bodyOf(c) { return JSON.parse(c.opts.body); }

(async function () {
  // ── (a) the four Activities are found from the header rows ──
  let dom = makeDom(true), w = dom.window, doc = w.document;
  const API = w.CPL_WORKPLAN_ADD;
  check("module exposes CPL_WORKPLAN_ADD", !!API && typeof API.open === "function");
  const ids = API.collectExistingIds();
  check("(a) the four Activities are found from the header rows", ids.activities.join(",") === "1,2,3,4");
  check("(a) the Activity names come along", ids.activityNames["3"] === "Build CPL Data Infrastructure");
  check("(a) a ladderless sub-activity counts as existing", ids.projects.indexOf("1.1.2") !== -1);

  // ── (c) the next free number ──
  check("(c) 3.8 under Activity 3 -> 3.9", API.suggestChildId(["3.1", "3.8"], "3") === "3.9");
  check("(c) numeric, 3.10 -> 3.11", API.suggestChildId(["3.9", "3.10"], "3") === "3.11");
  check("(c) under a sub-activity, 4.2.1 -> 4.2.2", API.suggestChildId(["4.2", "4.2.1"], "4.2") === "4.2.2");
  check("(c) a first child, 4.2 -> 4.2.1", API.suggestChildId(["4.2"], "4.2") === "4.2.1");
  check("(c) the home Activity of 4.2.1 is 4", API.homeActivityOf("4.2.1") === "4");

  // ── (d) a new sub-activity writes projects, then workplan_goals, then its links ──
  check("(d) the dialog opens for an editor", API.open({ parent: "3" }) === true);
  await settle();
  let card = doc.querySelector(".wpg-modal-card");
  check("(d) the empty-list message is gone", !/no Activities exist/.test(card.textContent));
  check("(d) the suggested id under Activity 3 is 3.9", doc.getElementById("wpg-add-id").value === "3.9");
  const homeBox = card.querySelector('.wpg-assoc-checkboxes input[value="3"]');
  check("(d) Activity 3 is checked and labeled home", homeBox.checked && /\(home\)/.test(homeBox.parentNode.textContent));
  doc.getElementById("wpg-add-name").value = "Futuro Behavioral Healthcare Project";
  doc.getElementById("wpg-add-unit").value = "Programs with CPL pathways";
  doc.getElementById("wpg-add-note").value = "Counted when a program publishes its CPL pathway.";
  doc.getElementById("wpg-add-goal-yr_2026_27").value = "2";
  doc.getElementById("wpg-add-stretch-yr_2026_27").value = "4";
  dom._calls.length = 0;
  click(w, card.querySelector(".wpg-btn-submit"));
  await settle();
  let p = posts(dom);
  check("(d) three inserts, in order: projects, workplan_goals, links",
    p.length === 3 && /\/projects$/.test(p[0].url) && /\/workplan_goals$/.test(p[1].url)
      && /\/workplan_activity_associations$/.test(p[2].url));
  const proj = bodyOf(p[0]);
  check("(d) the project row carries id, name and its home Activity",
    proj.id === "3.9" && proj.name === "Futuro Behavioral Healthcare Project"
      && /^Activity 3: Build CPL Data Infrastructure$/.test(proj.workplan_activity));
  check("(d) ...and what it counts and how", proj.kpi_unit === "Programs with CPL pathways"
    && proj.count_note === "Counted when a program publishes its CPL pathway.");
  const ladder = bodyOf(p[1]);
  check("(d) the ladder is a GOAL + STRETCH pair keyed 3.9, kind project",
    ladder.length === 2 && ladder[0].row_type === "GOAL" && ladder[1].row_type === "STRETCH"
      && ladder[0].activity_id === "3.9" && ladder[0].kind === "project");
  check("(d) the ladder carries the typed years and totals",
    ladder[0].yr_2026_27 === 2 && ladder[0].total === 2 && ladder[1].yr_2026_27 === 4 && ladder[1].total === 4);
  const links = bodyOf(p[2]);
  check("(d) the home link is primary", links.length === 1 && links[0].activity_id === "3" && links[0].is_primary === true);
  check("(d) the editor is told when it will appear", /tonight's rebuild/.test(card.querySelector(".wpg-status").textContent));

  // A duplicate id is refused before any write.
  w.document.querySelector(".wpg-modal-overlay").remove();
  API.open({ parent: "3" });
  await settle();
  card = doc.querySelector(".wpg-modal-card");
  doc.getElementById("wpg-add-id").value = "3.8";
  doc.getElementById("wpg-add-name").value = "Duplicate";
  dom._calls.length = 0;
  click(w, card.querySelector(".wpg-btn-submit"));
  await settle();
  check("(d) an id already in use is refused, nothing written",
    posts(dom).length === 0 && /3\.8 is already in use/.test(card.querySelector(".wpg-status").textContent));

  // ── (e) a tabled id read live moves the suggestion past it ──
  dom = makeDom(true, ["3.8", "3.9", "3.10"]); w = dom.window; doc = w.document;
  w.CPL_WORKPLAN_ADD.open({ parent: "3" });
  await settle();
  check("(e) tabled 3.9 and 3.10 (absent from the page) push the suggestion to 3.11",
    doc.getElementById("wpg-add-id").value === "3.11");

  // ── (f) Set targets writes the ladder only ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const st = doc.querySelector('[data-no-ladder="1"] .wpg-set-targets');
  check("(f) a ladderless row offers Set targets to an editor", !!st && st.tagName === "BUTTON");
  click(w, st);
  await settle();
  card = doc.querySelector(".wpg-modal-card");
  check("(f) the dialog is Set targets for 1.1.2", /Set targets/.test(card.querySelector("h3").textContent)
    && /1\.1\.2 AI Apprenticeship CPL Tools/.test(card.textContent));
  dom._calls.length = 0;
  click(w, card.querySelector(".wpg-btn-submit"));
  await settle();
  p = posts(dom);
  check("(f) only the ladder is written, keyed 1.1.2",
    p.length === 1 && /\/workplan_goals$/.test(p[0].url) && bodyOf(p[0])[0].activity_id === "1.1.2");

  // ── (g) the counting notes edit in place ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const unit = doc.querySelector('[data-unit-edit="1"][data-pid="1.1.2"]');
  check("(g) an editor sees the empty line with an Add prompt",
    !unit.parentNode.hidden && unit.textContent === "Add" && unit.classList.contains("wpg-editable"));
  click(w, unit);
  const unitInput = unit.querySelector("input");
  check("(g) the Add prompt edits as blank", !!unitInput && unitInput.value === "");
  unitInput.value = "Apprenticeship programs with AI-assisted CPL";
  dom._calls.length = 0;
  unitInput.dispatchEvent(new w.Event("blur"));
  await settle();
  let patch = dom._calls.find(function (c) { return c.opts.method === "PATCH"; });
  check("(g) what it counts PATCHes projects.kpi_unit for 1.1.2",
    !!patch && /\/projects\?id=eq\.1\.1\.2$/.test(patch.url)
      && JSON.parse(patch.opts.body).kpi_unit === "Apprenticeship programs with AI-assisted CPL");
  const note = doc.querySelector('[data-note-edit="1"][data-pid="1.1.2"]');
  click(w, note);
  const noteArea = note.querySelector("textarea");
  check("(g) how it is counted opens a multi-line field", !!noteArea);
  noteArea.value = "A program counts once its first apprentice receives CPL through the tool.";
  dom._calls.length = 0;
  noteArea.dispatchEvent(new w.Event("blur"));
  await settle();
  patch = dom._calls.find(function (c) { return c.opts.method === "PATCH"; });
  check("(g) how it is counted PATCHes projects.count_note",
    !!patch && /count_note/.test(patch.opts.body));

  // ── (h) the Activities tab header offers Add sub-activity ──
  const add = doc.querySelector(".activity-group-header .wpg-add-sub");
  check("(h) an editor gets Add sub-activity on the activity header", !!add && add.tagName === "BUTTON");
  click(w, add);
  await settle();
  check("(h) it opens the dialog with that Activity as the parent",
    doc.getElementById("wpg-add-parent").value === "3" && doc.getElementById("wpg-add-id").value === "3.9");

  // ── (i) signed out ──
  dom = makeDom(false); w = dom.window; doc = w.document;
  check("(i) signed out: no Set targets", !doc.querySelector(".wpg-set-targets"));
  check("(i) signed out: no Add sub-activity", !doc.querySelector(".wpg-add-sub"));
  check("(i) signed out: empty counting lines stay hidden",
    Array.prototype.every.call(doc.querySelectorAll(".wpg-count-line"), function (l) { return l.hidden; }));
  check("(i) signed out: the dialog will not open", w.CPL_WORKPLAN_ADD.open({ parent: "3" }) === false);

  let pass = 0;
  results.forEach(function (r) { console.log((r[1] ? "  PASS " : "  FAIL ") + r[0]); if (r[1]) pass++; });
  console.log("\n" + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
})();
