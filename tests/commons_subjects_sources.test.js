// The Subjects tab's colleges by source, at #commons/subjects/sources (S717). Sam, 2026-11-23: the Subjects card mock's
// Colleges artboard, every college with each way we look for its subject titles and a status word for each.
//
// WHAT THIS GUARDS (each a way the view would mislead the person choosing the next college to read):
//   (1) the address opens the view, which reads its file only then, and reports the address;
//   (2) the default shows the colleges that still need titles; Titled and All show the rest, counts on the chips;
//   (3) a row shows its platform, codes, a status word for each way in the ladder's order, and Next;
//   (4) a college with a catalog on file links to its own view and counts its titled codes live, never the file's
//       stale count; a college with none is plain text;
//   (5) every header cell carries a scope, the table scrolls inside a labelled region, nothing is stored, and the
//       front page links the view;
//   (6) a pick lasts the visit: leaving the view and coming back shows Titles needed again.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects_sources.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const W = (s, d, n) => ({ status: s, date: d || null, note: n || null });
const SRC = {
  ways: [["catalog", "Catalog"], ["system", "Catalog system"], ["schedule", "Class schedule"], ["department", "Department list"]],
  status_words: { read: "Read", probing: "Probing", to_try: "To try", blocked: "Blocked", not_needed: "Not needed", no_system: "No system" },
  totals: { colleges: 3, titled: 1, titles_needed: 2, by_way: { catalog: { read: 1, to_try: 2 }, system: { probing: 1, no_system: 2 }, schedule: { to_try: 2, not_needed: 1 }, department: { to_try: 2, not_needed: 1 } } },
  colleges: [
    { slug: "gamma", college: "Gamma College", platform: "elumen", platform_words: "eLumen", codes: 90, titled: 0, catalog_on_file: false,
      ways: { catalog: W("to_try"), system: W("probing", "2026-11-23", "The courses view"), schedule: W("to_try"), department: W("to_try") }, next: "Read the catalog system's subject list (probe sent 2026-11-23)" },
    { slug: "delta", college: "Delta College", platform: "pdf", platform_words: "PDF", codes: 70, titled: 0, catalog_on_file: false,
      ways: { catalog: W("to_try"), system: W("no_system"), schedule: W("to_try"), department: W("to_try") }, next: "Read the course section of the catalog PDF" },
    { slug: "alpha", college: "Alpha College", platform: "courseleaf", platform_words: "CourseLeaf", codes: 4, titled: 99, catalog_on_file: true,
      ways: { catalog: W("read", "2026-11-20"), system: W("no_system"), schedule: W("not_needed"), department: W("not_needed") }, next: "1 code not in the catalog: a person's title" }]
};
const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8")),
  "kb/status/subject_sources.json": SRC
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";
const ME = { email: "a@rccd.edu", access_token: "tok.en.x", refresh_token: "r" };

function load(hash, opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {}, calls = [], fetched = [];
  let writes = 0;
  const sess = opt.sess || null;
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { writes++; o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = {
    get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess),
    authHeaders: (extra) => Object.assign({ apikey: "ANON", Authorization: "Bearer " + (sess ? sess.access_token : "ANON") }, extra || {}),
    viewAddress: () => {}
  };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    fetched.push(url);
    if (url.indexOf(REST) === 0) {
      const method = init.method || "GET";
      calls.push({ url, method, body: init.body });
      if (method === "GET") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(null) });
    }
    const hit = Object.assign({}, FILES, opt.files || {})[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls, fetched, writes: () => writes };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
const rows = (d) => Array.from(d.querySelectorAll(".csb-src tbody tr")).map((r) => r.getAttribute("data-college"));

(async function () {
  let x = load("#commons/subjects/sources");
  await x.M.boot(); await settle();
  let d = x.d;
  check("(1) the address opens colleges by source", txt(d.getElementById("csb-h")) === "Subjects: colleges by source");
  check("(1) the view reports its address", x.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/sources" && x.w.location.hash === "#commons/subjects/sources");
  check("(1) the file is read once the view opens", x.fetched.indexOf("kb/status/subject_sources.json") >= 0);
  check("(2) the default shows the colleges that still need titles", JSON.stringify(rows(d)) === JSON.stringify(["gamma", "delta"]), rows(d));
  check("(2) the chips carry their counts", txt(d.getElementById("csb-src-f-needed")) === "Titles needed (2)" && txt(d.getElementById("csb-src-f-titled")) === "Titled (1)"
    && txt(d.getElementById("csb-src-f-all")) === "All (3)" && d.getElementById("csb-src-f-needed").getAttribute("aria-pressed") === "true");
  const heads = Array.from(d.querySelectorAll(".csb-src thead th")).map((th) => txt(th).replace(/\s*(Sort|Resize).*$/, ""));
  check("(3) the columns follow the ladder's order", /^College.*Catalog platform.*Codes.*Titled.*Catalog.*Catalog system.*Class schedule.*Department list.*Next/.test(heads.join("|")), heads);
  const g = d.querySelector('.csb-src tr[data-college="gamma"]');
  check("(3) a row shows its platform, codes, a word per way and Next",
    txt(g.children[1]) === "eLumen" && txt(g.children[2]) === "90" && txt(g.children[4]) === "To try" && txt(g.children[5]) === "Probing"
    && /probe sent 2026-11-23/.test(txt(g.children[8])) && /The courses view/.test(g.children[5].getAttribute("title") || ""), txt(g));
  check("(4) a college with no catalog on file is plain text", !g.querySelector("th a"));
  check("(5) the summary names the scale and the ways", /1 of 3 colleges have a catalog read; 2 still need titles/.test(txt(d.getElementById("csb-src-sum"))) && /COCI and the MIS reports carry no subject names/.test(txt(d.getElementById("csb-src-sum"))));
  d.getElementById("csb-src-f-titled").click(); await settle();
  const a = d.querySelector('.csb-src tr[data-college="alpha"]');
  check("(2) Titled shows the colleges with a catalog read", JSON.stringify(rows(d)) === JSON.stringify(["alpha"]), rows(d));
  check("(4) a college with a catalog on file links to its own view and counts its titled codes live",
    a && a.querySelector('th a[href="#commons/subjects/alpha"]') && txt(a.children[3]) === "3" && txt(a.children[4]) === "Read" && txt(a.children[6]) === "Not needed", a && txt(a));
  d.getElementById("csb-src-f-all").click(); await settle();
  check("(2) All shows every college", rows(d).length === 3);
  check("(5) every header cell carries a scope; the table scrolls inside a labelled region; nothing is stored",
    Array.from(d.querySelectorAll(".csb-src th")).every((th) => th.getAttribute("scope")) && d.querySelector(".csb-src table").closest("[role=region]").getAttribute("aria-label") === "Colleges by source" && x.writes() === 0);
  x.w.CPL_COMMONS_SUBJECTS && d.querySelector('a[data-csb-go=""]') && d.querySelector('a[data-csb-go=""]').click(); await settle();
  check("(5) the front page links the view", !!d.querySelector('a[href="#commons/subjects/sources"]'));
  d.querySelector('a[href="#commons/subjects/sources"]').click(); await settle();
  check("(6) a pick lasts the visit: back on the view, Titles needed again", JSON.stringify(rows(d)) === JSON.stringify(["gamma", "delta"]), rows(d));

  let fail = 0;
  for (const [n, ok, det] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + JSON.stringify(det))); if (!ok) fail++; }
  console.log("\n" + (fail ? fail + " FAILED" : results.length + "/" + results.length + " checks passed"));
  process.exit(fail ? 1 : 0);
})();
