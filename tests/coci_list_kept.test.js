// Kept, not counted on the Courses List (Sam, 2026-11-17, relayed by COBIx: "flag the record, never delete it; take
// flagged records out of counts, waiting piles, to-dos and fetch plans"; the Courses bot's ask, #3480 Source 13, test 5).
// Guards:
//   (1) a not-applicable course with no common course stays on the List and is found by search;
//   (2) its panel shows the exact note kb/coci_not_applicable.json writes, and so does a course on a not-applicable card;
//   (3) "No M-ID" and "No identity" leave not-applicable courses out of their counts and their rows; a real gap stays;
//   (4) "Kept, not counted" shows every flagged course, and a card a person ruled on is not among them: its note says
//       the ruling stands;
//   (5) a card a course flag takes out (nc) leaves every to-do job, though it carries the job's tag.
// Run from repo root: `npm test` (or `node tests/coci_list_kept.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond]); if (!cond && why) console.log("     " + name + ": " + why); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
// The notes come from the committed file, so the test reads the exact words a person sees.
const REAL = JSON.parse(fs.readFileSync("kb/coci_not_applicable.json", "utf8"));

// rows: [collegeIdx, ctrl, subj, num, title, units, credit, top, cid, ccn, mid]
const LOOKUP = {
  _built_at: "2026-11-18",
  colleges: ["American River College", "Rio Hondo College"],
  rows: [
    [0, "CCC1", "ENGL", "300", "College Composition", 4, "C", "1501.00: English", "", "", ""],
    [1, "CCC2", "ART", "99", "Independent Study in Art", 1, "C", "1002.00: Art", "", "", ""],
    [1, "CCC3", "FREN", "1", "French 1", 5, "C", "1102.00: French", "", "", ""],
    [0, "CCC4", "ART", "98", "Directed Study in Art", 1, "C", "1002.00: Art", "", "", ""],
    [1, "CCC5", "ART", "97", "Special Projects in Art", 1, "C", "1002.00: Art", "", "", ""],
    [0, "CCC6", "WELD", "110", "Welding I", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [1, "CCC7", "WELD", "120", "Welding II", 3, "C", "0956.50: Welding Technology", "", "", ""]
  ]
};
const MEMBERS = { generated_at: "2026-11-18 03:58", colleges: ["American River College", "Rio Hondo College"], members: {
  "ENGL M1001": [{ c: 0, cn: "CCC1" }],
  "ARTS M1005": [{ c: 0, cn: "CCC4" }],
  "ARTS M1006": [{ c: 1, cn: "CCC5" }],
  "WELD M1109": [{ c: 0, cn: "CCC6" }],
  "WELD M1110": [{ c: 1, cn: "CCC7" }]
} };
const NA = { _course_notes: REAL._course_notes, _card_notes: REAL._card_notes, _person_note: REAL._person_note,
  courses: { "Rio Hondo College|CCC2": ["independent", "Independent Study in Art"] },
  cards: { "ARTS M1005": { kind: "independent", courses: 1, titles: ["Directed Study in Art"] },
           "ARTS M1006": { kind: "independent", courses: 1, titles: ["Special Projects in Art"], person_reviewed: "Nov 9, 2026" } } };
// WELD M1109 is tagged but a flag takes it out (nc); WELD M1110 carries the same tag and counts.
const AUDIT = { rows: [{ id: "WELD M1109", k: "C", tags: ["seed_untouched_discipline"], nc: 1, fl: ["retired"] },
  { id: "WELD M1110", k: "C", tags: ["seed_untouched_discipline"] }] };

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#coci-lookup/courses"), runScripts: "dangerously" });
  const w = dom.window, fetches = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
  w.fetch = function (url) {
    const u = String(url);
    fetches.push(u);
    if (/coci_not_applicable\.json/.test(u)) return opts.naFail ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }) : ok(NA);
    if (/row_audit\/latest\.json/.test(u)) return ok(AUDIT);
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
  return { w, d: w.document, fetches };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + (ms || 5000); while (!fn() && Date.now() < end) await sleep(10); return fn(); }
const P = "ccl-";
function bodyRows(d) { return Array.from(d.querySelectorAll("." + P + "table tbody tr")); }
function dataRows(d) { return bodyRows(d).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow")); }
function heads(d) { return Array.from(d.querySelectorAll("." + P + "table thead th")).map((th) => txt(th.querySelector("." + P + "sort"))).filter(Boolean); }
function colOf(d, name) { return heads(d).findIndex((h) => h.indexOf(name) === 0); }
function cell(tr, d, name) { return tr.children[colOf(d, name) + 1]; }
function titles(d) { return dataRows(d).map((tr) => txt(cell(tr, d, "Title"))); }
function words(d) { return Array.from(d.querySelectorAll("." + P + "fgroup > :not(." + P + "fglabel)")).map(txt); }
function word(d, re) { return Array.from(d.querySelectorAll("button")).find((b) => re.test(txt(b))); }
function input(w, node, v) { node.value = v; node.dispatchEvent(new w.Event("input")); }
function titleBtn(d, title) { const tr = dataRows(d).find((x) => txt(cell(x, d, "Title")).indexOf(title) === 0); return tr && cell(tr, d, "Title").querySelector("button"); }
function panel(d) { return d.getElementById(P + "panel"); }

(async () => {
  const t = tab();
  await until(() => words(t.d).some((x) => /^Kept, not counted \(\d+\)$/.test(x)) && dataRows(t.d).length);
  const fw = words(t.d);
  check("(3) ⭐ No M-ID leaves the not-applicable course out of its count; the real gap stays", fw.indexOf("No M-ID (1)") >= 0, fw.join(" | "));
  check("(3) No identity does too", fw.indexOf("No identity (1)") >= 0, fw.join(" | "));
  check("(4) ⭐ Kept, not counted counts the no-card course and the course on a flagged card, never the person-ruled one",
    fw.indexOf("Kept, not counted (2)") >= 0, fw.join(" | "));
  check("(1) All still counts every course", fw.indexOf("All (7)") >= 0, fw.join(" | "));
  word(t.d, /^No M-ID \(1\)$/).click(); await sleep(20);
  check("(3) No M-ID lists the real gap alone", titles(t.d).join("|") === "French 1", titles(t.d).join("|"));
  word(t.d, /^Kept, not counted \(2\)$/).click(); await sleep(20);
  check("(4) Kept, not counted lists both flagged courses", titles(t.d).slice().sort().join("|") === "Directed Study in Art|Independent Study in Art", titles(t.d).join("|"));
  word(t.d, /^All \(7\)$/).click(); await sleep(20);
  input(t.w, t.d.getElementById(P + "find"), "independent study");
  await sleep(220);   // the finder waits 160 ms for the typing to stop
  check("(1) ⭐ search finds the flagged course", titles(t.d).join("|") === "Independent Study in Art", titles(t.d).join("|"));
  titleBtn(t.d, "Independent Study in Art").click();
  await until(() => /ART 99/.test(txt(t.d.getElementById(P + "panel-t"))));
  const note = REAL._course_notes.independent;
  check("(2) ⭐ its panel shows the exact note", txt(panel(t.d)).indexOf(note) >= 0, txt(panel(t.d)).slice(0, 300));
  check("(2) and not the No M-ID line, which would send a person to work on it", !/No M-ID: the Common Course Reference holds this course/.test(txt(panel(t.d))));
  input(t.w, t.d.getElementById(P + "find"), "");
  await sleep(220);
  titleBtn(t.d, "Directed Study in Art").click();
  await until(() => /ART 98/.test(txt(t.d.getElementById(P + "panel-t"))));
  check("(2) a course on a not-applicable card shows the card's note", txt(panel(t.d)).indexOf(REAL._card_notes.independent) >= 0, txt(panel(t.d)).slice(0, 300));
  titleBtn(t.d, "Special Projects in Art").click();
  await until(() => /ART 97/.test(txt(t.d.getElementById(P + "panel-t"))));
  const person = REAL._person_note.replace("{on}", " on Nov 9, 2026").replace("{note}", REAL._card_notes.independent);
  check("(4) ⭐ a card a person ruled on says the ruling stands", txt(panel(t.d)).indexOf(person) >= 0, txt(panel(t.d)).slice(0, 400));
  check("(2) the file is read once", t.fetches.filter((u) => /coci_not_applicable/.test(u)).length === 1);

  // (5) the to-do jobs skip a card a course flag takes out.
  const j = tab({ hash: "#coci-lookup/list/seedless" });
  await until(() => words(j.d).some((x) => /^Discipline no seed has touched \(\d+\)$/.test(x)));
  check("(5) ⭐ a flagged card leaves the job though it carries the tag", titles(j.d).join("|") === "Welding II"
    && words(j.d).indexOf("Discipline no seed has touched (1)") >= 0, titles(j.d).join("|") + " / " + words(j.d).join(" | "));

  // A failed read leaves the List as it was, never empty.
  const bad = tab({ naFail: true });
  await until(() => dataRows(bad.d).length);
  await sleep(30);
  const bw = words(bad.d);
  check("a failed read counts as before, and Kept, not counted counts nothing", bw.indexOf("No M-ID (2)") >= 0 && bw.indexOf("All (7)") >= 0, bw.join(" | "));

  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ✓ " : "  ✗ ") + n); if (ok) pass++; });
  console.log("\ncoci_list_kept: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
