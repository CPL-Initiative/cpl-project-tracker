// The course outlines to find by hand, on the SLOs and objectives view (commons_data.js, #collect/slos; S711).
//
// Sam, 2026-11-23: "add to the SLO, objective card on commons a prioritized list of 50 course cors to manually find and
// drop to you later". kb/_outline_hunt.py writes kb/status/outline_hunt.json; the view reads it.
//
// WHAT THIS GUARDS:
//   (1) the view lists every course the committed file holds, in rank order, each row's course a th scope="row",
//       inside a labelled region, with a caption, and says where a found outline goes;
//   (2) the file is read only when the view opens, never on the dashboard's front;
//   (3) a file that cannot be read says so in words, and the SLO table above still draws;
//   (4) no row names a C-ID or CCN identity, and the section carries no control that does nothing.
//
// Run from repo root: `npm test` (or `node tests/commons_outline_hunt.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_data.js", "utf8");
const DATA = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));
const STATUS = fs.existsSync("kb/status/commons.json") ? JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")) : {};
const HUNT = JSON.parse(fs.readFileSync("kb/status/outline_hunt.json", "utf8"));
const FILE = "kb/status/outline_hunt.json";

function load(hash, withHunt) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = { "kb/status/commons_data.json": DATA, "kb/status/commons.json": STATUS };
  if (withHunt) files[FILE] = HUNT;
  w.__fetched = [];
  w.fetch = function (url) {
    w.__fetched.push(String(url));
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [SESSION, PROGRESS, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }

(async () => {
  const live = DATA.live && DATA.live.state === "read";
  {
    const v = load("#collect/slos", true);
    await v.M.boot(); await settle();
    const sec = v.d.querySelector("#cdd-hunt");
    const rows = Array.from(v.d.querySelectorAll("#cdd-hunt-table tbody tr"));
    const ranks = rows.map((r) => Number(r.getAttribute("data-hunt-row")));
    check("(1) the view lists every course the file holds, in rank order",
      !live || (!!sec && rows.length === HUNT.courses.length && rows.length > 0 && JSON.stringify(ranks) === JSON.stringify(HUNT.courses.map((c) => c.rank))),
      [rows.length, HUNT.courses.length]);
    const first = rows[0], c0 = HUNT.courses[0];
    check("(1) each row's course is a th scope=row naming the college, code and title",
      !live || (first && first.querySelector('th[scope="row"]') && txt(first.querySelector("th")).indexOf(c0.college + " " + c0.code) === 0
        && txt(first.querySelector("th")).indexOf(c0.course_title) > 0), first && txt(first));
    check("(1) the table sits in a labelled region with a caption and column headers",
      !live || (sec.querySelector('.cdd-wrap[role="region"][aria-label]') && sec.querySelector("caption")
        && sec.querySelectorAll('thead th[scope="col"]').length === 5));
    check("(1) the words say where a found outline goes", !live || /drop it into a session/.test(txt(v.d.querySelector("#cdd-hunt-sum"))));
    check("(4) no row names a C-ID or CCN identity", HUNT.courses.every((c) => / M[0-9A-Z]{4}$/.test(c.mid)));
    check("(4) the section holds no button or link that could do nothing", !live || sec.querySelectorAll("a, button").length === 0);
  }
  {
    const f = load("#collect", true);
    await f.M.boot(); await settle();
    check("(2) the dashboard's front never reads the list", f.w.__fetched.indexOf(FILE) < 0, f.w.__fetched);
  }
  {
    const e = load("#collect/slos", false);
    await e.M.boot(); await settle();
    check("(3) a file that cannot be read says so in words, and the SLO table still draws",
      !live || (/could not be read/.test(txt(e.d.querySelector("#cdd-hunt"))) && !!e.d.querySelector("#cdd-slos-table")));
  }
  let fail = 0;
  for (const [n, ok, d] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + JSON.stringify(d))); if (!ok) fail++; }
  console.log("\n" + (fail ? fail + " FAILED" : "all passed"));
  process.exit(fail ? 1 : 0);
})();
