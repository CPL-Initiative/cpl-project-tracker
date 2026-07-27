// Annual Workplan single-source title/description editors (workplan_goals.js) — jsdom.
//
// Guards the editors added for the single-source-of-truth consolidation, so the
// Annual Workplan Goals tab is the ONE place titles + brief descriptions are
// edited (projects.* for sub-activities, workplan_goals.* for the 4 Activities):
//   (a) a sub-activity brief DESCRIPTION (data-desc-edit) → PATCH projects.description;
//   (b) a top-level Activity TITLE (data-activity-title-edit) → PATCH
//       workplan_goals.name scoped by (activity_id, kind='activity'), rebuilt with
//       the "Activity N: " prefix so the number can't be edited away;
//   (c) a top-level Activity DESCRIPTION (data-activity-desc-edit) → PATCH
//       workplan_goals.description (same scope);
//   (d) the "—" empty-state placeholder edits as BLANK, not the literal "—"
//       (the failure mode: a first-ever description would otherwise save "—…");
//   (e) signed OUT: none light up, none fire.
//
// Run from repo root: `npm test` (or `node tests/workplan_goals_desc_editors.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("workplan_goals.js", "utf8");
check("source defines saveDesc (projects.description PATCH)", /function saveDesc/.test(SRC));
check("source defines saveActivityField (workplan_goals PATCH)", /function saveActivityField/.test(SRC));

// A representative slice: one editable Activity 3 header (name + description),
// one sub-activity (3.2) with a filled description, and one (3.3) with the empty
// "—" placeholder. Mirrors render_annual_goals_table_html's emitted attributes.
const TABLE =
  '<table><tbody>' +
    '<tr><td colspan="8">' +
      '<span>Activity 3: </span>' +
      '<span class="wpg-title-cell" data-activity-title-edit="1" data-aid="3" data-val="Build CPL Data Infrastructure">Build CPL Data Infrastructure</span>' +
      '<div class="wpg-act-desc-cell" data-activity-desc-edit="1" data-aid="3" data-val="Old activity blurb">Old activity blurb</div>' +
    '</td></tr>' +
    '<tr><td rowspan="3"><span>3.2</span> ' +
      '<span class="wpg-title-cell" data-title-edit="1" data-pid="3.2">CPL Units Transcription</span>' +
      '<div class="wpg-desc-cell" data-desc-edit="1" data-pid="3.2" data-val="Old project blurb">Old project blurb</div>' +
    '</td><td>Goal</td><td>1</td></tr>' +
    '<tr><td>Current</td><td>1</td></tr><tr><td>Stretch</td><td>1</td></tr>' +
    '<tr><td rowspan="3"><span>3.3</span> ' +
      '<span class="wpg-title-cell" data-title-edit="1" data-pid="3.3">Statewide Adoption</span>' +
      '<div class="wpg-desc-cell" data-desc-edit="1" data-pid="3.3" data-val="">—</div>' +
    '</td><td>Goal</td><td>1</td></tr>' +
    '<tr><td>Current</td><td>1</td></tr><tr><td>Stretch</td><td>1</td></tr>' +
  '</tbody></table>';

function makeDom(signedIn) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      '<div id="tab-workplan-goals">' + TABLE + "</div></body></html>",
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
  // jsdom (outside-only) leaves readyState="loading" so the IIFE defers to
  // DOMContentLoaded — fire it so the editors bind now.
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
function click(w, node) { node.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
function blur(w, node) { node.dispatchEvent(new w.Event("blur")); }

(function () {
  // ── (a) sub-activity description → projects.description ──
  let dom = makeDom(true), w = dom.window, doc = w.document;
  const descCell = doc.querySelector('[data-desc-edit="1"][data-pid="3.2"]');
  check("signed in: project description lights up (wpg-editable)",
    descCell.classList.contains("wpg-editable"));
  click(w, descCell);
  let ta = descCell.querySelector("textarea");
  check("clicking a description opens a textarea (multi-line)", !!ta);
  if (ta) { ta.value = "New project blurb"; blur(w, ta); }
  let descCall = dom._calls.find(c => /\/projects\?id=eq\.3\.2/.test(c.url) && c.opts.method === "PATCH");
  check("description save PATCHes projects?id=eq.3.2", !!descCall);
  check("...with body { description: 'New project blurb' }",
    descCall && JSON.parse(descCall.opts.body).description === "New project blurb");
  check("description cell repainted optimistically", /New project blurb/.test(descCell.textContent));

  // ── (b) Activity title → workplan_goals.name (scoped, prefixed) ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const actTitle = doc.querySelector('[data-activity-title-edit="1"][data-aid="3"]');
  check("signed in: activity title lights up", actTitle.classList.contains("wpg-editable"));
  click(w, actTitle);
  let inp = actTitle.querySelector("input");
  check("clicking activity title opens an input (single-line)", !!inp);
  if (inp) { inp.value = "Renamed Activity Three"; blur(w, inp); }
  let actCall = dom._calls.find(c => /\/workplan_goals\?/.test(c.url)
    && /activity_id=eq\.3/.test(c.url) && /kind=eq\.activity/.test(c.url)
    && c.opts.method === "PATCH" && /"name"/.test(c.opts.body || ""));
  check("activity title PATCHes workplan_goals scoped to (activity_id=3, kind=activity)", !!actCall);
  check("...name rebuilt with the 'Activity 3: ' prefix (number preserved)",
    actCall && JSON.parse(actCall.opts.body).name === "Activity 3: Renamed Activity Three");

  // ── (c) Activity description → workplan_goals.description ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const actDesc = doc.querySelector('[data-activity-desc-edit="1"][data-aid="3"]');
  click(w, actDesc);
  let ta2 = actDesc.querySelector("textarea");
  check("clicking activity description opens a textarea", !!ta2);
  if (ta2) { ta2.value = "New activity blurb"; blur(w, ta2); }
  let actDescCall = dom._calls.find(c => /\/workplan_goals\?/.test(c.url)
    && /activity_id=eq\.3/.test(c.url) && /kind=eq\.activity/.test(c.url)
    && c.opts.method === "PATCH" && /"description"/.test(c.opts.body || ""));
  check("activity description PATCHes workplan_goals.description (scoped)", !!actDescCall);
  check("...with body { description: 'New activity blurb' }",
    actDescCall && JSON.parse(actDescCall.opts.body).description === "New activity blurb");

  // ── (d) empty "—" placeholder edits as BLANK ──
  dom = makeDom(true); w = dom.window; doc = w.document;
  const emptyDesc = doc.querySelector('[data-desc-edit="1"][data-pid="3.3"]');
  click(w, emptyDesc);
  let ta3 = emptyDesc.querySelector("textarea");
  check("empty '—' description opens a BLANK textarea (not the literal —)",
    ta3 && ta3.value === "");
  if (ta3) { ta3.value = "First real description"; blur(w, ta3); }
  let emptyCall = dom._calls.find(c => /\/projects\?id=eq\.3\.3/.test(c.url) && c.opts.method === "PATCH");
  check("first description on an empty cell PATCHes projects?id=eq.3.3", !!emptyCall);
  check("...with body { description: 'First real description' }",
    emptyCall && JSON.parse(emptyCall.opts.body).description === "First real description");

  // ── (e) signed out — nothing lights, nothing fires ──
  dom = makeDom(false); w = dom.window; doc = w.document;
  const d2 = doc.querySelector('[data-desc-edit="1"][data-pid="3.2"]');
  const at2 = doc.querySelector('[data-activity-title-edit="1"][data-aid="3"]');
  check("signed out: description NOT lit", !d2.classList.contains("wpg-editable"));
  check("signed out: activity title NOT lit", !at2.classList.contains("wpg-editable"));
  click(w, d2); click(w, at2);
  check("signed out: description click opens no editor", !d2.querySelector("textarea"));
  check("signed out: activity title click opens no editor", !at2.querySelector("input"));
  check("signed out: zero writes", dom._calls.length === 0);

  // ── report ──
  let failed = 0;
  results.forEach(r => { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();
