// My College — drafts for the college, for review (Sam, open-asks sheet 42 card 3,
// 2026-10-05 20:58Z: "Show them now").
//
// The program requirements harvest finds places where a college's own records list
// different courses (its catalog, the state's Program Course File, MAP) and files
// each as a draft for the college. Sheet 32 card 2 sent them to the harvest tab and
// to My College; sheet 42 card 3 chose to show them on My College now, marked for
// review, while the MAP team decides when to send. Only the college's own drafts
// belong here: a gap the reading procedure owns is the MAP team's work and would
// read to a college as its fault.
//
// Run from repo root: `npm test` (or `node tests/my_college_drafts.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const dom = new JSDOM('<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
  { url: "https://example.org/", runScripts: "dangerously" });
const w = dom.window;
w.fetch = function () { return new Promise(function () {}); };
const s = w.document.createElement("script");
s.textContent = fs.readFileSync("college_briefing.js", "utf8");
w.document.body.appendChild(s);
const B = w.CPL_COLLEGE_BRIEFING;

// program_record_college_items' rows: one an item the college owns, in the record's order (n).
const records = [
  { program_title: "Entrepreneurship", control_number: "35030", award: "A.S. Degree", catalog_year: "2026-2027", checked: true,
    n: 1, kind: "MAP names a second course",
    text: "MAP lists AUTO 156G Engine and Related Systems on the EMT Certification articulation beside EMGM 106." },
  { program_title: "Business <Administration> 2.0", control_number: "41496", award: "A.S.-T Degree", catalog_year: "2026-2027", checked: false,
    n: 1, kind: "Catalog and state file differ",
    text: "The state's Program Course File lists ECON 121; the reader found it not in the text." },
  { program_title: "Business <Administration> 2.0", control_number: "41496", award: "A.S.-T Degree", catalog_year: "2026-2027", checked: false,
    n: 3, kind: "Catalog and state file differ",
    text: "The catalog prints ECON C2002, ECON C2001 for this program; the state's Program Course File does not list them." },
  { program_title: "No text", control_number: "00001", n: 1, kind: "Catalog and state file differ", text: null }
];

// ── (1) the college's own drafts, nothing else ─────────────────────────────
const d = B._collegeDrafts(records);
check("(1) only programs with an item are listed, one entry a program", d.length === 2, JSON.stringify(d.map(x => x.program)));
check("(1) each draft keeps its kind and its text word for word",
  d[0].items[0].kind === "MAP names a second course" && /AUTO 156G/.test(d[0].items[0].text));
check("(1) a program's items stay together, in the view's order", d[1].items.length === 2 && /ECON 121/.test(d[1].items[0].text));
check("(1) an item with no text is skipped, never an error", B._collegeDrafts([{}, null, records[3]]).length === 0);
const viewSql = fs.readFileSync("chatbox/supabase_program_record_college_items.sql", "utf8");
check("(1) ⭐ a gap the reading procedure owns never reaches the college's page: the view keeps the college's alone",
  /where g\.item ->> 'owner' = 'college'/.test(viewSql));

// ── (2) the section ───────────────────────────────────────────────────────
check("(2) nothing to review is no section", B._draftsSection([]) === null);
check("(2) ⭐ a failed read (null) is no section, never an empty claim", B._draftsSection(null) === null);
const sec = B._draftsSection(d);
check("(2) the summary counts items and programs, for review",
  sec && sec.summary === "3 items in 2 programs, for review", sec && sec.summary);
check("(2) ⭐ the section is marked for review in words", sec && /cb-tag-rev">For review</.test(sec.body));
check("(2) it says the MAP team follows up, and who keeps the records",
  sec && /MAP team will follow up/.test(sec.body) && /curriculum office and articulation officer/.test(sec.body));
check("(2) it is marked Beta draft, as the harvest is (Sam, 2026-10-04)", sec && /Beta draft/.test(sec.body));
check("(2) the text is escaped", sec && /Business &lt;Administration&gt; 2\.0/.test(sec.body) && !/<Administration>/.test(sec.body));
check("(2) each program names its award, control number and catalog year",
  sec && /\(A\.S\. Degree, control number 35030, 2026-2027 catalog\)/.test(sec.body));
// Every record is public since Sam's Open Asks Sheet 67 (2026-10-12): one no person has
// checked says so in Sam's words, and a checked one carries no mark.
check("(2) an unchecked record says not yet confirmed", sec && /control number 41496, 2026-2027 catalog, not yet confirmed\)/.test(sec.body));
check("(2) a checked record carries no mark", sec && !/control number 35030[^)]*not yet confirmed/.test(sec.body));
check("(2) the read selects checked, so the mark can be drawn",
  /program_record_college_items\?college=eq\.[^;]*select=[^"]*\bchecked\b/.test(fs.readFileSync("college_briefing.js", "utf8")));
check("(2) no emoji or symbol stands in for a word (the glyph rule)",
  sec && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(sec.body));
check("(2) the program is the CPL Initiative, never the MAP Initiative", sec && !/MAP Initiative/.test(sec.body));
check("(2) no 'it is this, not that' frame in the college-facing text (Sam, 2026-09-16)",
  sec && !/\bnot\b[^.]*\bbut\b/i.test(sec.body.replace(/<[^>]+>/g, "")));

// ── (3) where it reads and where it sits ─────────────────────────────────
const src = fs.readFileSync("college_briefing.js", "utf8");
check("(3) the registry turns the college_id into the harvest's name",
  /program_source_registry\?college_id=eq\." \+ id \+ "&select=college"/.test(src));
check("(3) the items are read by that name from the view, in each record's order, every page",
  /jgetAll\(REST \+ "\/program_record_college_items\?college=eq\." \+ encodeURIComponent\(rows\[0\]\.college\)/.test(src)
  && /select=program_title,control_number,award,catalog_year,checked,n,kind,text&order=control_number,n/.test(src));
check("(3) ⭐ My College no longer reads every record's display for its drafts",
  !/program_requirement_records\?college=eq\.[^\n]*display/.test(src));
const iStart = src.indexOf('sec("start"'), iDrafts = src.indexOf('sec("drafts"'), iOpps = src.indexOf('sec("opps"');
check("(3) the section sits right after Start here, before the opportunities",
  iStart > 0 && iDrafts > iStart && iOpps > iDrafts);

// ── (4) every page, so a college past 1,000 items reads whole ────────────
(async function () {
  const ranges = [];
  w.fetch = function (url, opts) {
    const r = opts.headers.Range; ranges.push(r);
    const from = +r.split("-")[0];
    const n = from === 0 ? 1000 : 3;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(Array.from({ length: n }, (_, i) => ({ i: from + i }))) });
  };
  const all = await B._jgetAll("https://example.org/rest/v1/program_record_college_items?college=eq.X");
  check("(4) ⭐ a full first page reads the next: 1,003 rows in two pages", all && all.length === 1003 && ranges.length === 2,
    JSON.stringify(ranges));
  check("(4) the pages ask for items 0-999, then 1000-1999", ranges[0] === "0-999" && ranges[1] === "1000-1999");
  w.fetch = function () { return Promise.resolve({ ok: false, status: 500 }); };
  check("(4) a failed page is a failed read (null), never a short list", (await B._jgetAll("https://example.org/x")) === null);
  finish();
})();

function finish() {
let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (ok || !why ? "" : "  — " + why));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
}
