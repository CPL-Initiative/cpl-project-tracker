// The worklist's guards, ported onto the List before the worklist retires (the List norms: a view retires once its List
// does what it does; "before a view retires, port its tests onto the place that replaces it", SkyMulberry). Each check
// names the cr_reference.test.js Part B check it carries:
//   B1/B2 a failed decisions read warns, and says decided work is not shown rather than implying none exists;
//   B3/B4 signed out says so, never claims the queue undecided, and the List still reads;
//   B5-B7 a 200-with-empty-body write is a failure in the panel, and no decision is recorded from it;
//   B8 an open panel survives a repaint;
//   B9 a group whose wordings award different units states the range;
//   B10/B11 a decided group names who decided it and when (the Decided by column), beside the rung, kept separate;
//   B12/B13 Needs a decision holds only groups with more than one wording;
//   B14/B15 the List's CSV keeps Rung (automation) and Decision (judgment) in separate columns, with Decided by;
//   B16 Clear writes a cleared row, never a DELETE.
// Run from repo root: `npm test` (or `node tests/cr_list_worklist_port.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const SRC = fs.readFileSync("cr_reference.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

function member(rec, rows, colleges, extra) {
  return Object.assign({ rec: rec, topic: rec, rows: rows, screens: { level: false }, units_lo: 3, units_hi: 3, unit_word: "hour",
    credentials: [], credentials_n: 0, colleges_n: colleges, courses: [] }, extra || {});
}
const WORKLIST = { _stats: { distinct_strings: 5, total_rows: 900 }, groups: [
  { key: "community relations", canonical: "3 hours in Community Relations", canonical_source: "published_statewide", rung: 1,
    rung_why: "Published statewide recommendation", acts_automatically: true, screens_objecting: [], wordings: 2, rows: 415,
    credentials: 4, colleges: 28, courses: [], subjects: [], members: [
      member("3 hours in Community Relations", 293, 28, { credentials: ["POST Basic Academy"] }),
      member("3.0 hours in Community Relations", 122, 20)] },
  { key: "engine performance", canonical: "3 or 4 hours in Engine Performance", canonical_source: "published_statewide", rung: 5,
    rung_why: "", acts_automatically: false, screens_objecting: [], wordings: 2, rows: 66, credentials: 3, colleges: 15,
    courses: ["AUTO M1008"], subjects: [], members: [
      member("3 or 4 hours in Engine Performance", 38, 9, { courses: ["AUTO M1008"] }),
      member("5 hours in Engine Performance", 28, 8)] },
  { key: "welding", canonical: "4 hours in Welding", canonical_source: "modal", rung: 5, rung_why: "", acts_automatically: false,
    screens_objecting: [], wordings: 1, rows: 12, credentials: 1, colleges: 3, courses: [], subjects: [], members: [
      member("4 hours in Welding", 12, 3, { credentials: ["AWS Certified Welder"] })] }
] };

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-cr-reference" class="cpl-tab-pane"><div id="cr-reference-root"></div></div></body></html>',
    { url: "https://example.org/#cr-reference/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  if (opts.signedIn !== false) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url: url, method: init.method || "GET", body: body });
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    if (url === "kb/cr_reference_worklist.json") return ok(opts.worklist || WORKLIST);
    if (/\/kb_curation\?select/.test(url)) return opts.flagReadFails ? Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }) : ok(opts.flags || []);
    if (/\/kb_curation$/.test(url) && init.method === "POST") return ok(body.map((r) => Object.assign({}, r)));
    if (/cr_reference_decisions\?select/.test(url)) return opts.decisionsFail ? Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }) : ok(opts.decisions || []);
    if (/cr_reference_decisions/.test(url) && init.method === "POST") return ok(opts.refuse ? [] : body.map((r) => Object.assign({}, r)));
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(opts.reviewer === false ? null : { access_token: "a.b.c", email: "sam@example.org" }) };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push({ url: "loadScript:" + s, method: "SCRIPT" });
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  w.eval(SRC);
  return { w: w, d: w.document, M: w.CPL_CR_REFERENCE, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".crl-table tbody tr:not(.crl-editrow):not(.crl-band)")); }
/* A filter word carries its count, "Decided (2)"; a word is found by its label either way. */
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }
function posts(t) { return t.calls.filter((c) => c.method === "POST"); }


function root(d) { return d.getElementById("cr-reference-root"); }
function pn(d) { return d.getElementById("crl-panel"); }
const title = (d, w) => Array.from(d.querySelectorAll(".crl-table tbody td.crl-title button.crl-open")).find((b) => txt(b) === w);

(async function () {
  // B1/B2
  let t = tab({ decisionsFail: true });
  t.M.activate(); await settle();
  check("B1 (List) a failed decisions read warns", /Could not read the decisions table/.test(txt(root(t.d))));
  check("B2 (List) ...and says it is a failed read, not an empty table", /failed read, not an empty table/.test(txt(root(t.d))));
  // B3/B4
  t = tab({ signedIn: false });
  t.M.activate(); await settle();
  check("B3 (List) signed out says so, and never as a failed read", /not signed in/i.test(txt(root(t.d))) && !/Could not read the decisions table/.test(txt(root(t.d))));
  check("B4 (List) ...and the List still reads", rows(t.d).some((r) => /Community Relations/.test(txt(r))));
  // B5-B7
  t = tab({ refuse: true });
  t.M.activate(); await settle();
  title(t.d, "3 hours in Community Relations").click(); await settle();
  check("B5 (List) the panel offers Confirm the group to a signed-in curator", !!t.d.getElementById("crl-pn-confirmed"));
  t.d.getElementById("crl-pn-confirmed").click(); await settle();
  check("B6 (List) a 200-with-empty-body write is reported as a failure", /It did not save \(not saved .*does not allow recording decisions\)\. Nothing changed\./.test(txt(pn(t.d).querySelector(".crr-status"))),
    txt(pn(t.d).querySelector(".crr-status")));
  check("B7 (List) ...and no decision is recorded from it", /No decision recorded yet/.test(txt(pn(t.d))) && !t.M._state.decisions["community relations"]);
  // B8
  t = tab();
  t.M.activate(); await settle();
  title(t.d, "3 hours in Community Relations").click(); await settle();
  t.M._render(); await settle();
  check("B8 (List) an open panel survives a full repaint", !!pn(t.d) && /Confirm the group/.test(txt(pn(t.d))));
  // B9
  const WL = JSON.parse(JSON.stringify(WORKLIST));
  WL.groups[1].members[0].units_lo = 3; WL.groups[1].members[0].units_hi = 4; WL.groups[1].members[1].units_lo = 5; WL.groups[1].members[1].units_hi = 5;
  WL.groups[1].units_differ = true;
  t = tab({ worklist: WL });
  t.M.activate(); await settle();
  const ep = rows(t.d).filter((r) => /Engine Performance/.test(txt(r))).map(txt).join(" | ");
  check("B9 (List) wordings that award different units each state their own figure; none reads a bare 'units vary'", /3.4 units/.test(ep) && /5 units/.test(ep) && !/units vary/.test(ep), ep);
  // B10/B11 and B14/B15
  t = tab({ decisions: [{ group_key: "community relations", decision: "confirmed", canonical: "3 hours in Community Relations", members: [], excluded: [],
    updated_by: "sam@rccd.edu", updated_at: "2026-08-13T10:00:00Z" }] });
  t.M.activate(); await settle();
  const H = Array.from(t.d.querySelectorAll(".crl-table thead tr:first-child th")).map(txt);
  const col = (name) => H.findIndex((h) => h.indexOf(name) === 0);
  const cr = rows(t.d).find((r) => /^3 hours in Community Relations/.test(txt(r.querySelector("td.crl-title"))));
  check("B10 (List) a decided group names who decided it and when", !!cr && txt(cr.children[col("Decided by")]) === "sam@rccd.edu, 2026-08-13", cr && txt(cr.children[col("Decided by")]));
  check("B11 (List) ...beside the automatic rung, in its own column", txt(cr.children[col("Rung")]) === "Published" && txt(cr.children[col("Decision")]) === "Confirmed");
  check("B14 (List) the List's columns keep Rung and Decision apart, so its CSV does", col("Rung") > 0 && col("Decision") > 0 && col("Decision") !== col("Rung"));
  check("B15 (List) ...and carries Decided by", col("Decided by") > 0);
  // B12/B13
  words(t.d, "Needs a decision").click(); await settle();
  check("B12 (List) a single-wording group is not in Needs a decision", !rows(t.d).some((r) => /Welding/.test(txt(r))));
  check("B13 (List) ...and a multi-wording group with no decision is", rows(t.d).some((r) => /Engine Performance/.test(txt(r))) && !rows(t.d).some((r) => /Community Relations/.test(txt(r))));
  // B16
  t = tab({ decisions: [{ group_key: "community relations", decision: "confirmed", canonical: "3 hours in Community Relations", members: [], excluded: [],
    updated_by: "sam@rccd.edu", updated_at: "2026-08-13T10:00:00Z" }] });
  t.M.activate(); await settle();
  title(t.d, "3 hours in Community Relations").click(); await settle();
  const n0 = posts(t).length;
  t.d.getElementById("crl-pn-cleared").click(); await settle();
  const pp = posts(t).slice(n0);
  check("B16 (List) Clear writes a cleared row, never a DELETE", pp.length === 1 && pp[0].body[0].decision === "cleared" && !t.calls.some((c) => c.method === "DELETE"));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
  console.log("\ncr_list_worklist_port: " + (results.length - failed.length) + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
