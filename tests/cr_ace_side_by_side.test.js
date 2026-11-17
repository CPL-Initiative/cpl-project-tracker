// The Common CR Reference panel's MAP and ACE text, side by side (S678, COBIx item 5 on #3464, comments 6962133442
// and 6962134078). Guards:
//   (1) the typographic rule in cr_reference.js agrees with kb/cr_typographic.py on the shared fixture
//       (tests/fixtures/cr_typographic_cases.json), so the panel and the nightly counts never disagree;
//   (2) a wording's panel shows, per exhibit whose MAP wording reads exactly this, MAP's wordings beside ACE's catalog
//       wording; AR-0702-0030's two MAP spellings sit on one row with the ACE line, and the note says they differ only
//       in capitals, spacing or unit words;
//   (3) AR-0102-0007's truncated and run-on MAP wordings never fold into its two atomic ACE lines;
//   (4) an exhibit with no catalog line says ACE text is missing; a failed read says it failed, never "missing";
//   (5) signed out, nothing is read and the panel says why;
//   (6) every read is the reviewer-gated view on this project's Supabase: no ACE website is ever fetched;
//   (7) the source text shows as its source holds it, never cleaned.
// Run from repo root: `npm test` (or `node tests/cr_ace_side_by_side.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const SRC = fs.readFileSync("cr_reference.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const CASES = JSON.parse(fs.readFileSync("tests/fixtures/cr_typographic_cases.json", "utf8"));
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/";

function member(rec, rows, colleges) {
  return { rec: rec, topic: rec, rows: rows, screens: { level: false }, units_lo: 3, units_hi: 3, unit_word: "hour",
    credentials: [], credentials_n: 0, colleges_n: colleges, courses: [] };
}
const WORKLIST = { _stats: { distinct_strings: 2, total_rows: 40 }, groups: [
  { key: "supervision", canonical: "3 hours in Supervision", canonical_source: "modal", rung: 5, rung_why: "", acts_automatically: false,
    screens_objecting: [], wordings: 1, rows: 30, credentials: 1, colleges: 4, courses: [], subjects: [], members: [member("3 hours in Supervision", 30, 4)] },
  { key: "fluid power systems", canonical: "3 hours in Fluid Power Systems", canonical_source: "modal", rung: 5, rung_why: "", acts_automatically: false,
    screens_objecting: [], wordings: 1, rows: 10, credentials: 1, colleges: 2, courses: [], subjects: [], members: [member("3 hours in Fluid Power Systems", 10, 2)] }
] };
const LINES = {
  "AR-0702-0030": [
    { exhibit_id: "AR-0702-0030", source: "ACE", cr_text: "3 hours in Supervision", rows_n: null },
    { exhibit_id: "AR-0702-0030", source: "MAP", cr_text: "3 hours in Supervision", rows_n: 5 },
    { exhibit_id: "AR-0702-0030", source: "MAP", cr_text: "3 hours in supervision", rows_n: 2 }],
  "AR-0102-0007": [
    { exhibit_id: "AR-0102-0007", source: "ACE", cr_text: "4 hours in Companion Animal Radiology", rows_n: null },
    { exhibit_id: "AR-0102-0007", source: "ACE", cr_text: "4 hours in Companion Animal Surgical Assistance And Anesthesia", rows_n: null },
    { exhibit_id: "AR-0102-0007", source: "MAP", cr_text: "4 hours in Companion Animal Surgical Assistance And", rows_n: 3 },
    { exhibit_id: "AR-0102-0007", source: "MAP", cr_text: "4 hours in Companion Animal Radiology Companion Animal Surgical Assistance And Anesthesia Laboratory Animal And Small Animal Exotics", rows_n: 1 }],
  "NV-1732-0026": [
    { exhibit_id: "NV-1732-0026", source: "MAP", cr_text: "3 hours in Fluid Power Systems", rows_n: 8 }]
};

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-cr-reference" class="cpl-tab-pane"><div id="cr-reference-root"></div></div></body></html>',
    { url: "https://example.org/#cr-reference/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  if (opts.signedIn !== false) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", headers: init.headers || {} });
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
    if (url === "kb/cr_reference_worklist.json") return ok(WORKLIST);
    if (/\/kb_curation\?select/.test(url)) return ok([]);
    if (/cr_reference_decisions\?select/.test(url)) return ok([]);
    if (/\/map_exhibit_cr_side_by_side\?/.test(url)) {
      if (opts.sbsFails) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      const q = decodeURIComponent(url.split("?")[1]);
      const m = /cr_text=eq\.(.*?)&order/.exec(q);
      if (m) {
        const hits = [];
        Object.keys(LINES).forEach((ex) => LINES[ex].forEach((l) => { if (l.source === "MAP" && l.cr_text === m[1]) hits.push({ exhibit_id: ex }); }));
        return ok(hits);
      }
      const ids = /exhibit_id=in\.\((.*?)\)/.exec(q);
      if (ids) return ok([].concat.apply([], ids[1].split(",").map((x) => LINES[x.replace(/"/g, "")] || [])));
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(null) };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  w.eval(SRC);
  return { w: w, d: w.document, M: w.CPL_CR_REFERENCE, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 14; i++) await tick(); }
const title = (d, wd) => Array.from(d.querySelectorAll(".crl-table tbody td.crl-title button.crl-open")).find((b) => txt(b) === wd);
const sbsRows = (d) => Array.from(d.querySelectorAll("#crl-pn-sbs tbody tr")).map((r) => Array.from(r.children).map(txt));

(async function () {
  // (1) parity with kb/cr_typographic.py
  let t = tab();
  const bad = CASES.pairs.filter((c) => (t.M._crTypoKey(c.a) === t.M._crTypoKey(c.b)) !== c.same
    || (c.clean && (t.M._crClean(c.a) !== c.clean || t.M._crClean(c.b) !== c.clean)));
  check("(1) the JS rule agrees with the shared fixture, case for case", bad.length === 0,
    bad.map((c) => c.case + ": " + t.M._crClean(c.a) + " / " + t.M._crClean(c.b)).join("; "));

  // (2) AR-0702-0030
  t.M.activate(); await settle();
  title(t.d, "3 hours in Supervision").click(); await settle();
  const pn = () => t.d.getElementById("crl-panel");
  check("(2) the panel has a MAP and ACE text section", /MAP and ACE text/.test(txt(pn())), txt(pn()));
  let rows = sbsRows(t.d);
  check("(2) AR-0702-0030's two MAP spellings and the ACE line sit on one row", rows.length === 1 && rows[0][0] === "AR-0702-0030"
    && rows[0][1] === "3 hours in Supervision" + "3 hours in supervision" && rows[0][2] === "3 hours in Supervision", JSON.stringify(rows));
  check("(2) the note says they differ only in capitals, spacing or unit words, and are one recommendation",
    rows[0] && /differ only in capitals, spacing or unit words/.test(rows[0][3]) && /2 MAP wordings are one recommendation/.test(rows[0][3]), rows[0] && rows[0][3]);
  const spellings = Array.from(t.d.querySelectorAll("#crl-pn-sbs tbody tr td:nth-child(2) .crl-pn-sbs-t")).map(txt);
  check("(7) each MAP wording shows as MAP holds it, on its own line", spellings.join("|") === "3 hours in Supervision|3 hours in supervision", spellings.join("|"));
  check("(2) the table is a labelled region with scoped headers", !!t.d.querySelector('#crl-pn-sbs[role="region"][aria-label]')
    && t.d.querySelectorAll('#crl-pn-sbs th[scope="col"]').length === 4);

  // (3) AR-0102-0007 by the exhibit box
  t.d.getElementById("crl-pn-sbs-ex").value = "ar-0102-0007";
  t.d.getElementById("crl-pn-sbs-go").click(); await settle();
  rows = sbsRows(t.d);
  check("(3) AR-0102-0007's truncated and run-on MAP wordings stay apart from its two ACE lines", rows.length === 4
    && rows.filter((r) => /No ACE line matches this MAP wording/.test(r[3])).length === 2
    && rows.filter((r) => /ACE line with no MAP wording/.test(r[3])).length === 2, JSON.stringify(rows));
  check("(3) the exhibit box names the exhibit read, in capitals", /Exhibit AR-0102-0007/.test(txt(pn())), txt(pn()));
  t.d.getElementById("crl-pn-sbs-back").click(); await settle();
  check("(3) Back returns to the wording's own exhibits", sbsRows(t.d).length === 1 && sbsRows(t.d)[0][0] === "AR-0702-0030");

  // (4) no catalog line
  t.d.getElementById("crl-pn-sbs-ex").value = "NV-1732-0026";
  t.d.getElementById("crl-pn-sbs-go").click(); await settle();
  rows = sbsRows(t.d);
  check("(4) an exhibit with no catalog line says ACE text is missing", rows.length === 1 && /ACE text missing/.test(rows[0][3]), JSON.stringify(rows));

  // (6) only the gated view, only this project
  const outside = t.calls.filter((c) => !(/^kb\//.test(c.url) || c.url.indexOf(REST) === 0));
  check("(6) no read leaves this project's Supabase and its own kb/ files: no ACE website", outside.length === 0, outside.map((c) => c.url).join(" "));
  const views = t.calls.filter((c) => /map_exhibit_cr_side_by_side/.test(c.url));
  check("(6) the view is read with the team phrase, never written", views.length >= 3 && views.every((c) => c.method === "GET" && c.headers["x-team-pass"] === "phrase"));

  // (4) a failed read
  t = tab({ sbsFails: true });
  t.M.activate(); await settle();
  title(t.d, "3 hours in Supervision").click(); await settle();
  check("(4) a failed read says so, and never reads as missing text", /could not be read .*a failed read, not missing text/.test(txt(t.d.getElementById("crl-pn-sbs-box"))),
    txt(t.d.getElementById("crl-pn-sbs-box")));

  // (5) signed out
  t = tab({ signedIn: false });
  t.M.activate(); await settle();
  title(t.d, "3 hours in Supervision").click(); await settle();
  check("(5) signed out, the panel says why and reads nothing", /Sign in or unlock with the team phrase/.test(txt(t.d.getElementById("crl-panel")))
    && !t.calls.some((c) => /map_exhibit_cr_side_by_side/.test(c.url)));

  // The section's CSS names no raw hex.
  const css = SRC.slice(SRC.indexOf('"#crl-pn-sbs-ex{'), SRC.indexOf('".crl-pn-sbs-t{') + 40);
  check("the section's CSS uses tokens, no raw hex", css.length > 40 && !/#[0-9a-fA-F]{3,8}\b/.test(css));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  if (pass !== results.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
