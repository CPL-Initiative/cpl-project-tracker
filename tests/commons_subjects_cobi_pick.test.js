// The Subjects page shows COBI's common-subject pick (kb/subject_decisions.py, S749; Sam's alignment rulings of
// 2026-11-28, relayed by COBIx): common_source "cobi" with its 0-100 confidence.
//
// WHAT THIS GUARDS (each a way the page would mislead a reviewer about whose call a common code is):
//   (1) a COBI pick shows its common code, the one 0-100 bar with its number, and the words "Picked by COBI";
//   (2) a pick under 80 adds "check it"; one at 80 or more does not;
//   (3) the row never reads as a person's save, and never says Sky.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects_cobi_pick.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const FIX = JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8"));
const COLS = FIX.columns.concat(["page_codes", "noncredit_plain", "noncredit_enhanced", "categories", "common_source", "decision",
  "noncredit_decisions", "renamed_to", "history", "common_confidence"].filter((k) => FIX.columns.indexOf(k) < 0));
FIX.columns = COLS;
const at = (k) => COLS.indexOf(k);
FIX.colleges.forEach((c) => c.rows.forEach((r) => { while (r.length < COLS.length) r.push(null); }));
const alpha = FIX.colleges.find((c) => c.slug === "alpha");
const byCode = (code) => alpha.rows.find((r) => r[0] === code);
const hi = byCode("ENGL"), lo = byCode("MATH");
hi[at("common")] = "ACCT"; hi[at("discipline")] = "Accounting"; hi[at("common_source")] = "cobi"; hi[at("common_confidence")] = 92;
lo[at("common")] = "MRKT"; lo[at("discipline")] = "Marketing"; lo[at("common_source")] = "cobi"; lo[at("common_confidence")] = 70;

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX
};

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {};
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = { get: () => null, isFresh: () => false, ensureFresh: () => Promise.resolve(null),
    authHeaders: (extra) => Object.assign({ apikey: "ANON", Authorization: "Bearer ANON" }, extra || {}), viewAddress: () => {} };
  w.fetch = function (url) {
    url = String(url);
    if (url.indexOf("supabase.co") >= 0) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    const hit = FILES[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }

(async function () {
  const z = load("#commons/subjects/alpha");
  await z.M.boot(); await settle();
  const engl = z.d.querySelector('.csb-codes tr[data-code="ENGL"]'), math = z.d.querySelector('.csb-codes tr[data-code="MATH"]');
  const cell = (tr) => tr && Array.from(tr.children).find((td) => /Picked by COBI/.test(txt(td)));
  const ce = cell(engl), cm = cell(math);
  const be = ce && ce.querySelector(".cmn-cbar"), bm = cm && cm.querySelector(".cmn-cbar");
  check("(1) a COBI pick shows its common code, the bar with its number, and Picked by COBI",
    ce && /ACCT Accounting/.test(txt(ce)) && be && be.getAttribute("data-conf") === "92" && /confidence 92 of 100/.test(be.getAttribute("aria-label")),
    txt(ce));
  check("(2) a pick at 80 or more asks for no check", ce && !/check it/.test(txt(ce)), txt(ce));
  check("(2) a pick under 80 says check it", cm && /Picked by COBI; check it/.test(txt(cm)) && bm && bm.getAttribute("data-conf") === "70", txt(cm));
  check("(3) the row never reads as a person's save, and never says Sky",
    engl && engl.getAttribute("data-saved") !== "yes" && !/\bSky\b/.test(txt(engl)) && !/Filed statewide by a person/.test(txt(ce)));
  let fail = 0;
  results.forEach(([n, ok, d]) => { console.log((ok ? "  ok  " : "FAIL  ") + n + (ok || d == null ? "" : "\n      " + String(d).slice(0, 300))); if (!ok) fail++; });
  console.log((results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})();
