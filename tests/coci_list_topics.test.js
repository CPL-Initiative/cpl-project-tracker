// Special and selected topics leave the Courses List's Needs an M-ID pile (S695; session decision
// d-topics-not-applicable-2026-11-20): kb/_build_not_applicable.py writes them to kb/coci_not_applicable.json with the
// topics reason, beside independent study. Guards:
//   (1) Needs an M-ID leaves the topics course out of its count and rows; the near-miss "Topics in History" stays;
//   (2) Kept, not counted lists it;
//   (3) its panel shows the topics note, word for word from the committed file, and no No M-ID line.
// Run from repo root: `npm test` (or `node tests/coci_list_topics.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond]); if (!cond && why) console.log("     " + name + ": " + why); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const REAL = JSON.parse(fs.readFileSync("kb/coci_not_applicable.json", "utf8"));

// rows: [collegeIdx, ctrl, subj, num, title, units, credit, top, cid, ccn, mid]
const LOOKUP = {
  _built_at: "2026-11-21",
  colleges: ["American River College", "Rio Hondo College"],
  rows: [
    [0, "CCC1", "ENGL", "300", "College Composition", 4, "C", "1501.00: English", "", "", ""],
    [1, "CCC2", "BIOL", "98", "Special Topics in Biology", 3, "C", "0401.00: Biology", "", "", ""],
    [0, "CCC3", "HIST", "10", "Topics in History", 3, "C", "2205.00: History", "", "", ""],
    [1, "CCC4", "FREN", "1", "French 1", 5, "C", "1102.00: French", "", "", ""]
  ]
};
const MEMBERS = { generated_at: "2026-11-21 03:58", colleges: ["American River College", "Rio Hondo College"], members: {
  "ENGL M1001": [{ c: 0, cn: "CCC1" }]
} };
const NA = { _course_notes: REAL._course_notes, _card_notes: REAL._card_notes, _person_note: REAL._person_note,
  courses: { "Rio Hondo College|CCC2": ["topics", "Special Topics in Biology"] }, cards: {} };

function tab() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/#coci-lookup/courses", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
  w.fetch = function (url) {
    const u = String(url);
    if (/coci_not_applicable\.json/.test(u)) return ok(NA);
    if (/row_audit\/latest\.json/.test(u)) return ok({ rows: [] });
    if (/csr_out\/latest\.json/.test(u)) return ok({ _mid_codes: { strays: [] }, findings: [] });
    return ok([]);
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    setTimeout(cb, 0);
  } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + (ms || 5000); while (!fn() && Date.now() < end) await sleep(10); return fn(); }
const P = "ccl-";
function dataRows(d) { return Array.from(d.querySelectorAll("." + P + "table tbody tr")).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow")); }
function heads(d) { return Array.from(d.querySelectorAll("." + P + "table thead th")).map((th) => txt(th.querySelector("." + P + "sort"))).filter(Boolean); }
function cell(tr, d, name) { return tr.children[heads(d).findIndex((h) => h.indexOf(name) === 0) + 1]; }
function titles(d) { return dataRows(d).map((tr) => txt(cell(tr, d, "Title"))); }
function words(d) { return Array.from(d.querySelectorAll("." + P + "fgroup > :not(." + P + "fglabel)")).map(txt); }
function word(d, re) { return Array.from(d.querySelectorAll("button")).find((b) => re.test(txt(b))); }
function titleBtn(d, title) { const tr = dataRows(d).find((x) => txt(cell(x, d, "Title")).indexOf(title) === 0); return tr && cell(tr, d, "Title").querySelector("button"); }

(async () => {
  const note = REAL._course_notes && REAL._course_notes.topics;
  check("the committed file carries a topics note", typeof note === "string" && /^Not applicable: special or selected topics\./.test(note), String(note));
  const t = tab();
  await until(() => words(t.d).some((x) => /^Kept, not counted \(\d+\)$/.test(x)) && dataRows(t.d).length);
  const fw = words(t.d);
  check("(1) Needs an M-ID counts the two real gaps, not the topics course", fw.indexOf("Needs an M-ID (2)") >= 0, fw.join(" | "));
  check("(2) Kept, not counted counts the topics course", fw.indexOf("Kept, not counted (1)") >= 0, fw.join(" | "));
  word(t.d, /^Needs an M-ID \(2\)$/).click(); await sleep(20);
  check("(1) the pile lists the near-miss and the real gap", titles(t.d).slice().sort().join("|") === "French 1|Topics in History", titles(t.d).join("|"));
  word(t.d, /^Kept, not counted \(1\)$/).click(); await sleep(20);
  check("(2) Kept, not counted lists the topics course", titles(t.d).join("|") === "Special Topics in Biology", titles(t.d).join("|"));
  titleBtn(t.d, "Special Topics in Biology").click();
  await until(() => /BIOL 98/.test(txt(t.d.getElementById(P + "panel-t"))));
  const p = txt(t.d.getElementById(P + "panel"));
  check("(3) its panel shows the topics note", note && p.indexOf(note) >= 0, p.slice(0, 300));
  check("(3) and no No M-ID line", !/No M-ID: the Common Course Reference holds this course/.test(p));

  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ✓ " : "  ✗ ") + n); if (ok) pass++; });
  console.log("\ncoci_list_topics: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
