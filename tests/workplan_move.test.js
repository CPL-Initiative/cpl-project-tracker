// The Annual Goals Move control (PR C): the function's SQL, then the dialog in jsdom.
//
// The workplan tree is keyed by the id itself, so a move is a re-key of every table
// that stores it; the #872 reorg missed four and silently mis-attached targets. The
// function's behavior is proven against a real Postgres by
// scripts/verify_workplan_move.js (PGlite; not a dependency, so not in this suite).
// This file pins what CI can read without a database:
//   (a) the gate comes first: a signed-in reviewer, nothing else;
//   (b) every id-keyed table is re-keyed, and THE GUARD scans every project_id /
//       item_id / activity_id column for the old id and raises, so a table added
//       later cannot be left behind silently;
//   (c) the move files its before-values (Rule 10 a2), and the grants close it to anon;
//   (d) the dialog: Move shows for a reviewer only, the parent list never offers the
//       row itself or its children, the next free number is suggested from the live
//       list, the old-Activity link is offered only when the home changes, one RPC
//       call carries the choice, and a refusal is shown in words;
//   (e) a sub-activity with sub-activities under it cannot be moved from the dialog.
//
// Run from repo root: `npm test` (or `node tests/workplan_move.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SQL = fs.readFileSync("kb/supabase_workplan_move.sql", "utf8");
const fnStart = SQL.indexOf("create or replace function public.workplan_move_sub_activity(");
const body = SQL.slice(fnStart, SQL.indexOf("$$;", fnStart));

// ── (a) the gate ──
const gate = body.indexOf("not public.is_allowed_reviewer()");
const firstWrite = body.search(/\b(insert into|update|delete from) public\./);
check("(a) the function is security definer with a fixed search_path",
  /security definer\s+set search_path = public/.test(body));
check("(a) a signed-in reviewer is the first thing checked, before any write",
  gate > 0 && firstWrite > gate && /raise exception[^;]*not an allowed reviewer[^;]*42501/.test(body));
check("(a) the team phrase does not open it (no team_pass_ok in the function)", !/team_pass_ok/.test(body));

// ── (b) every table, and the guard ──
const rekeys = {
  projects: /insert into public\.projects[\s\S]*?delete from public\.projects where id = v_old/,
  update_log: /update public\.update_log set project_id = v_new where project_id = v_old/,
  item_raci: /update public\.item_raci set item_id = v_new where item_type = 'project' and item_id = v_old/,
  item_updates: /update public\.item_updates set item_id = v_new where item_type = 'project' and item_id = v_old/,
  project_lifecycle: /update public\.project_lifecycle set project_id = v_new where project_id = v_old/,
  workplan_goals: /update public\.workplan_goals set activity_id = v_new where kind = 'project' and activity_id = v_old/,
  workplan_activity_associations: /update public\.workplan_activity_associations\s+set project_id = v_new/,
};
Object.keys(rekeys).forEach((t) => check("(b) re-keys " + t, rekeys[t].test(body)));
check("(b) the copy comes before the FK re-point, and the delete after it",
  body.indexOf("insert into public.projects") < body.indexOf("update public.update_log") &&
  body.indexOf("update public.update_log") < body.indexOf("delete from public.projects"));
check("(b) THE GUARD scans every public base table's project_id, item_id and activity_id columns",
  /information_schema\.columns[\s\S]*table_type = 'BASE TABLE'[\s\S]*column_name in \('project_id', 'item_id', 'activity_id'\)/.test(body));
check("(b) ...after the re-key, and raises (55000) on any table still holding the old id",
  body.indexOf("information_schema.columns") > body.indexOf("update public.workplan_activity_associations") &&
  /still holds % after the move[\s\S]*errcode = '55000'/.test(body));
check("(b) the new id is refused when any table already uses it",
  ["projects where id = v_new", "workplan_goals where activity_id = v_new", "workplan_activity_associations where project_id = v_new",
   "item_raci where item_type = 'project' and item_id = v_new", "item_updates where item_type = 'project' and item_id = v_new",
   "project_lifecycle where project_id = v_new", "update_log where project_id = v_new"].every((s) => body.indexOf(s) !== -1));
check("(b) a sub-activity with children is refused", /id like v_old \|\| '\.%'\)[\s\S]{0,80}raise exception[\s\S]{0,80}move those first/.test(body));

// ── (c) reversible and closed ──
check("(c) every move files who, the ids and the before-values",
  /insert into public\.workplan_id_moves \(moved_by, old_id, new_id, before, counts\)/.test(body) &&
  /'workplan_activity_associations', \(select coalesce\(jsonb_agg\(to_jsonb\(a\)\)/.test(body));
check("(c) the header carries the undo", /-- REVERSIBLE[\s\S]*jsonb_to_recordset/.test(SQL));
check("(c) closed to anon: revoke from public, anon, authenticated",
  /revoke all on function public\.workplan_move_sub_activity\(text, text, boolean\) from public, anon, authenticated;/.test(SQL));
check("(c) execute only for a signed-in caller and the service role",
  /grant execute on function public\.workplan_move_sub_activity\(text, text, boolean\) to authenticated, service_role;/.test(SQL) &&
  !/grant execute on function public\.workplan_move_sub_activity[^;]*\banon\b/.test(SQL));
check("(c) the move log is reviewer-read only, no anon",
  /revoke all on table public\.workplan_id_moves from public, anon, authenticated;/.test(SQL) &&
  /create policy workplan_id_moves_reviewer_read[\s\S]*is_allowed_reviewer\(\)/.test(SQL));
check("(c) the behavior check exists and runs this file",
  fs.existsSync("scripts/verify_workplan_move.js") &&
  /supabase_workplan_move\.sql/.test(fs.readFileSync("scripts/verify_workplan_move.js", "utf8")));

// ── (d, e) the dialog ──
const SRC = fs.readFileSync("workplan_goals.js", "utf8");
function nameCell(pid, name) {
  return '<th scope="row" rowspan="3" class="wpg-name"><span class="wpg-pid">' + pid + '</span> ' +
    '<span class="wpg-title-cell" data-title-edit="1" data-pid="' + pid + '">' + name + '</span></th>';
}
function act(n, name) {
  return '<tbody><tr><th colspan="8" scope="rowgroup"><span class="wpg-title-cell" data-activity-title-edit="1" data-aid="' + n +
    '" data-val="' + name + '">' + name + '</span></th></tr>';
}
const TABLE = '<table>' +
  act("1", "Build AI-Enhanced CPL Infrastructure") +
  '<tr>' + nameCell("1.1", "MAP Platform Development") + '</tr>' +
  '<tr>' + nameCell("1.1.2", "AI Apprenticeship CPL Tools") + '</tr></tbody>' +
  act("4", "Coordinate CPL Sprints") +
  '<tr>' + nameCell("4.1", "Veteran Sprint") + '</tr>' +
  '<tr>' + nameCell("4.1.1", "29 Palms") + '</tr>' +
  '<tr>' + nameCell("4.2", "Apprenticeship Sprint") + '</tr></tbody></table>';

function makeDom(kind, liveIds, rpcReply) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id=\"tab-workplan-goals\">" + TABLE + "</div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (kind === "reviewer") w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
  if (kind === "phrase") {
    w.CPL_TEAM_PHRASE = { session: () => ({ teamPass: "phrase", email: "(team)" }), clear() {}, decorateHeaders() {},
      unlockRow: () => w.document.createElement("span") };
  }
  dom._calls = [];
  w.fetch = function (url, opts) {
    dom._calls.push({ url: String(url), opts: opts || {} });
    if (/\/rpc\/workplan_move_sub_activity$/.test(String(url))) {
      const rep = rpcReply || { ok: true, status: 200, body: { ok: true, new_id: "4.2.1" } };
      return Promise.resolve({ ok: rep.ok, status: rep.status, text: () => Promise.resolve(JSON.stringify(rep.body)) });
    }
    return Promise.resolve({ ok: true, status: 200,
      json: () => Promise.resolve((liveIds || []).map((id) => ({ id }))), text: () => Promise.resolve("") });
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
const moves = (doc) => doc.querySelectorAll(".wpg-move").length;

(async function () {
  let dom = makeDom(null), doc = dom.window.document;
  check("(d) signed out: no Move", moves(doc) === 0);
  dom = makeDom("phrase"); doc = dom.window.document;
  check("(d) the team phrase: no Move (reviewer-only until Sam rules)", moves(doc) === 0);

  dom = makeDom("reviewer", ["1.1", "1.1.2", "4.1", "4.1.1", "4.2"]); let w = dom.window; doc = w.document;
  check("(d) a signed-in reviewer gets Move on every sub-activity", moves(doc) === 5);
  const btn = Array.prototype.find.call(doc.querySelectorAll(".wpg-move"), (b) => /1\.1\.2/.test(b.getAttribute("aria-label")));
  check("(d) each Move names its row for a screen reader", btn && btn.getAttribute("aria-label") === "Move 1.1.2 AI Apprenticeship CPL Tools");
  btn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  const sel = doc.getElementById("wpg-move-parent");
  const opts = Array.prototype.map.call(sel.options, (o) => o.value);
  check("(d) the dialog opens on the row", doc.querySelector(".wpg-modal-card .wpg-fixed").textContent === "1.1.2 AI Apprenticeship CPL Tools");
  check("(d) the parent list never offers the row itself", opts.indexOf("1.1.2") === -1 && opts.indexOf("4.2") !== -1 && opts.indexOf("1") !== -1);
  sel.value = "4.2"; sel.dispatchEvent(new w.Event("change"));
  check("(d) the next free number under 4.2 is suggested", doc.getElementById("wpg-move-id").value === "4.2.1");
  const keep = doc.querySelector(".wpg-keep-row");
  check("(d) a new home Activity offers to keep the old Activity's link, checked",
    !keep.hidden && doc.getElementById("wpg-move-keep").checked && /Activity 1/.test(keep.textContent));
  sel.value = "1.1"; sel.dispatchEvent(new w.Event("change"));
  // 1.1.2 still holds its own slot under 1.1 until it moves, so the next free is 1.1.3.
  check("(d) a move inside the same Activity does not ask", keep.hidden && doc.getElementById("wpg-move-id").value === "1.1.3");
  sel.value = "4.2"; sel.dispatchEvent(new w.Event("change"));
  dom._calls.length = 0;
  doc.querySelector(".wpg-btn-submit").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  const rpc = dom._calls.filter((c) => /\/rpc\/workplan_move_sub_activity$/.test(c.url));
  check("(d) one RPC call, as the signed-in reviewer", rpc.length === 1 && rpc[0].opts.method === "POST" &&
    rpc[0].opts.headers.Authorization === "Bearer aaaa.bbbb.cccc");
  const sent = rpc.length ? JSON.parse(rpc[0].opts.body) : {};
  check("(d) it carries the old id, the new id and the link choice",
    sent.p_old_id === "1.1.2" && sent.p_new_id === "4.2.1" && sent.p_keep_old_link === true);
  check("(d) success says when it shows", /Moved 1\.1\.2 to 4\.2\.1\. It shows in its new place after tonight's rebuild\./.test(
    doc.querySelector(".wpg-modal-card .wpg-status").textContent));

  // A tabled id (absent from the page, present live) is skipped; a refusal reads in words.
  dom = makeDom("reviewer", ["1.1", "1.1.2", "4.1", "4.1.1", "4.2", "4.2.1"],
    { ok: false, status: 409, body: { code: "23505", message: "workplan_move_sub_activity: 4.2.2 is already in use" } });
  w = dom.window; doc = w.document;
  check("(d) the API opens it for a reviewer", w.CPL_WORKPLAN_ADD.move("1.1.2", "AI Apprenticeship CPL Tools") === true);
  await settle();
  const sel2 = doc.getElementById("wpg-move-parent");
  sel2.value = "4.2"; sel2.dispatchEvent(new w.Event("change"));
  check("(d) a tabled 4.2.1 pushes the suggestion to 4.2.2", doc.getElementById("wpg-move-id").value === "4.2.2");
  doc.querySelector(".wpg-btn-submit").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  check("(d) a refusal is shown in words, without the function's name",
    doc.querySelector(".wpg-modal-card .wpg-status").textContent === "Not moved: 4.2.2 is already in use.");
  doc.getElementById("wpg-move-id").value = "4.2.1";
  doc.getElementById("wpg-move-id").dispatchEvent(new w.Event("input"));
  dom._calls.length = 0;
  doc.querySelector(".wpg-btn-submit").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  check("(d) an id already in use (tabled) is refused before any call",
    /4\.2\.1 is already in use/.test(doc.querySelector(".wpg-modal-card .wpg-status").textContent) &&
    dom._calls.filter((c) => /\/rpc\//.test(c.url)).length === 0);

  // ── (e) a row with children ──
  w.CPL_WORKPLAN_ADD.move("4.1", "Veteran Sprint");
  await settle();
  check("(e) a sub-activity with children cannot be moved from the dialog",
    doc.querySelector(".wpg-btn-submit").disabled && /4\.1\.1\)\. Move those first\./.test(doc.querySelector(".wpg-modal-card .wpg-status").textContent));
  check("(e) the phrase API refuses too", (function () {
    const d = makeDom("phrase"); return d.window.CPL_WORKPLAN_ADD.move("1.1.2") === false;
  })());

  let fail = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
