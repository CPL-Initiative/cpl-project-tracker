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
//   (4) no row names a C-ID or CCN identity, and the section's only controls are the course words, each naming its pane;
//   (5) S712: a course's word opens its hand-over pane beside the list at #collect/slos/outline/<college>-<code>, with
//       Previous and Next through the list and the hand-over box for course outlines (commons_handover.js); Close puts
//       the address back and the focus on the course's word;
//   (6) an arrival at a course's address opens it once the list is read, and an address naming a course the list does
//       not hold is repaired to #collect/slos;
//   (7) what has been handed over for a course shows on its row, from the public counts only.
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
const HANDOVER = fs.readFileSync("commons_handover.js", "utf8");

function load(hash, withHunt, summary) {
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
    if (summary && /rpc\/commons_handover_summary/.test(String(url))) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(summary.slice()) });
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [SESSION, PROGRESS, SRC, COMMONS].concat(summary ? [HANDOVER] : []).forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS };
}
function huntKey(r) {
  const slug = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug(r.college) + "-" + slug(r.code);
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
    check("(1) the words say where a found outline goes", !live || (/hand it over on its row/.test(txt(v.d.querySelector("#cdd-hunt-sum")))
      && /drop into a session/.test(txt(v.d.querySelector("#cdd-hunt-sum")))));
    check("(4) no row names a C-ID or CCN identity", HUNT.courses.every((c) => / M[0-9A-Z]{4}$/.test(c.mid)));
    const ctl = Array.from(sec.querySelectorAll("a, button"));
    check("(4) the section's only controls are the course words, one a row, each naming its pane",
      !live || (ctl.length === rows.length && ctl.every((b) => b.tagName === "BUTTON" && /^outline\/[a-z0-9-]+$/.test(b.getAttribute("data-pane") || ""))),
      ctl.length);
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
  if (live && HUNT.courses.length > 1) {
    const C = HUNT.courses, k0 = huntKey(C[0]), k1 = huntKey(C[1]), kl = huntKey(C[C.length - 1]);
    const SUM = [{ dataset: "course_outlines", subject_kind: "course", college: C[0].college, course_code: C[0].code, kind: "file", status: "waiting", n: 1 }];
    const v = load("#collect/slos", true, SUM);
    await v.M.boot(); await settle();
    const word = v.d.querySelector('[data-hunt-open="' + k0 + '"]');
    word.click(); await settle();
    const panel = v.d.querySelector("#cdd-panel"), box = () => v.d.querySelector("#cdd-panel:not([hidden]) .cho-box");
    check("(5) a course's word opens its pane, with the address following",
      v.w.location.hash === "#collect/slos/outline/" + k0 && txt(v.d.querySelector("#cdd-panel-h")).indexOf(C[0].college + " " + C[0].code) === 0, v.w.location.hash);
    check("(5) the pane holds the hand-over box for course outlines, naming the course",
      !!box() && box().getAttribute("data-handover") === "course_outlines" && box().getAttribute("data-subject") === "course");
    check("(5) the pane says why the course is on the list and which M-ID it serves",
      /Why this one/.test(txt(panel)) && txt(panel).indexOf(C[0].mid) >= 0 && /Course 1 of /.test(txt(v.d.querySelector("#cdd-hunt-pos"))));
    v.d.querySelector("#cdd-hunt-next").click(); await settle();
    check("(5) Next opens the next course", v.w.location.hash === "#collect/slos/outline/" + k1 && /Course 2 of /.test(txt(v.d.querySelector("#cdd-hunt-pos"))), v.w.location.hash);
    v.d.querySelector("#cdd-hunt-prev").click(); await settle();
    v.d.querySelector("#cdd-hunt-prev").click(); await settle();
    check("(5) Previous from the first course goes to the last", v.w.location.hash === "#collect/slos/outline/" + kl, v.w.location.hash);
    v.d.querySelector("#cdd-panel-close").click(); await settle();
    check("(5) Close puts the address back and the focus on the course's word",
      v.w.location.hash === "#collect/slos" && v.d.activeElement === v.d.querySelector('[data-hunt-open="' + kl + '"]'), [v.w.location.hash, v.d.activeElement && v.d.activeElement.outerHTML.slice(0, 80)]);
    const have = v.d.querySelector('[data-hunt-have="' + k0 + '"]'), none = v.d.querySelector('[data-hunt-have="' + k1 + '"]');
    check("(7) a row shows what has been handed over for its course, and a course with nothing shows nothing",
      /Handed over: 1 file to be opened by our reader/.test(txt(have)) && txt(none) === "", [txt(have), txt(none)]);
    check("(7) the row's words name no person, file or address", !/@|\.pdf|https?:/.test(txt(have)));
  }
  if (live && HUNT.courses.length) {
    const k1 = huntKey(HUNT.courses[Math.min(1, HUNT.courses.length - 1)]);
    const a = load("#collect/slos/outline/" + k1, true, []);
    await a.M.boot(); await settle();
    check("(6) an arrival at a course's address opens that course once the list is read",
      a.w.location.hash === "#collect/slos/outline/" + k1 && !!a.d.querySelector("#cdd-panel:not([hidden]) .cho-box"), a.w.location.hash);
    const b = load("#collect/slos/outline/no-such-college-xyz-1", true, []);
    await b.M.boot(); await settle();
    check("(6) an address naming a course the list does not hold is repaired, and no panel stays open",
      b.w.location.hash === "#collect/slos" && !b.d.querySelector("#cdd-panel:not([hidden])"), b.w.location.hash);
  }
  let fail = 0;
  for (const [n, ok, d] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + JSON.stringify(d))); if (!ok) fail++; }
  console.log("\n" + (fail ? fail + " FAILED" : "all passed"));
  process.exit(fail ? 1 : 0);
})();
