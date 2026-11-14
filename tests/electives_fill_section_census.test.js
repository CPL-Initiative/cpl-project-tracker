// The electives-fill section census (S652, kb/_electives_fill_section_census.py), pinned on a fixture.
//
// WHY. COBIx asked on #3111, before draft #3293 changes the rule, how many rows pass the electives fill only on
// a match outside their own program's section (Lassen 32083: "elective" on p.93, the next program's page,
// p-word-guard-neighbor-page-pass-s651). The census classifies each guard-decided fill pass from committed
// files. A census that called a row's own words a neighbor's, or a program's legacy number a neighbor, would
// misstate the count either way, so its logic is pinned here on two tiny fake colleges, never on a live file.
//
// What it guards: (1) a passing record whose degree check passes on a fill is counted, and a record with no
// shortfall or no electives_fill_degree is not; (2) a record whose own block or quoted note names electives is
// inside_evidenced; (3) a record with no quoted word whose PDF range runs into the next program's start page is
// an outside_candidate, with the page its section ends and the neighbor named; (4) a legacy and a 2.0 number
// reading one section are no neighbors (own_window), and another program starting on the record's own first
// page leaves the span unknown; (5) an apostrophe never opens a quotation, a field name in a note is not a
// catalog word, and a note's unquoted "electives" is listed as the reader's paraphrase, never as evidence;
// (6) an HTML page another program was read from is a neighbor, and a reread from another URL is span_unknown.
//
// Run from repo root: `npm test` (or `node tests/electives_fill_section_census.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const PDF = "https://example.edu/catalog.pdf";
// A passing shape-6 record: the major total met exactly, the degree check passing on an 8-unit fill.
function rec(cn, url, { blocks = ["Required Core"], notes = [], efd = true, fill = [8, 8], pass = true } = {}) {
  return {
    college: "Fixture College", control_number: cn, award: "A.A- T Degree", source_url: url,
    score: {
      coverage: { pass: true }, invented: { pass: true },
      arithmetic: { pass, status: pass ? "equal" : "incomplete", against: "program", computed: [18, 18],
                    stated: [18, 18], degree: { pass, status: "equal", against: "degree", fill } },
    },
    record: {
      program: { section_heading: "Program " + cn, total_units: { min: 18, max: 18 },
                 degree_total: { min: 60, max: 60 }, ge_units: { min: 34, max: 34 }, electives_fill_degree: efd },
      blocks: blocks.map((name) => ({ name, rule: "all", courses: [] })),
      notes,
    },
  };
}
function src(cn, title, heading, pages, url) {
  return { control_number: cn, title, award: "A.A- T Degree", method: pages ? "pdf_pages" : "sitemap_page",
           source: { url, title: heading, pages: pages || undefined } };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "efsc-"));
function college(slug, sources, records) {
  const dir = path.join(tmp, slug, "records");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(tmp, slug, "sources.json"), JSON.stringify(sources));
  for (const r of records) fs.writeFileSync(path.join(dir, r.control_number + ".json"), JSON.stringify(r));
}
college("pdf_college", [
  src("10001", "Psychology", "AA-T in Psychology", [10, 11, 12], PDF + "#page=10"),
  src("10002", "Sociology", "AA-T in Sociology", [20, 21], PDF + "#page=20"),
  src("10003", "General Studies", "General Studies", [11, 12], PDF + "#page=11"),
  src("10004", "History", "AA-T in History", [30], PDF + "#page=30"),
  src("10005", "History 2.0", "AA-T in History", [30], PDF + "#page=30"),
  src("10006", "Geography", "AA-T in Geography", [40, 41], PDF + "#page=40"),
  src("10007", "Global Studies", "AA-T in Global Studies", [40], PDF + "#page=40"),
  src("10008", "Art", "AA-T in Art", [50, 51], PDF + "#page=50"),
  src("10009", "Music", "AA-T in Music", [60, 61], PDF + "#page=60"),
], [
  // Outside only: the note quotes "courses numbered 1-49", no electives word; the range runs into 10003's p.11.
  rec("10001", PDF + "#page=10", { notes: ["Remaining units to reach 60 may be selected from 'courses numbered 1-49'; "
    + "no units printed for them, so electives_fill_degree is true."] }),
  // Inside: its own block heading names electives.
  rec("10002", PDF + "#page=20", { blocks: ["Required Core", "Psychology Electives (6 units)"] }),
  // A legacy and a 2.0 number reading one section: no neighbor, so own window.
  rec("10004", PDF + "#page=30"),
  rec("10005", PDF + "#page=30"),
  // Another program starts on the record's own first page: the order on the page is not filed.
  rec("10006", PDF + "#page=40"),
  // An apostrophe before a quotation that names electives: inside, from the note.
  rec("10008", PDF + "#page=50", { notes: ["degree_total from the section's description ('the remainder of the 60 "
    + "units in degree-applicable electives')."] }),
  // Not counted: no shortfall to fill; and a record that does not say electives fill it.
  rec("10009", PDF + "#page=60", { fill: [0, 0] }),
  rec("10003", PDF + "#page=11", { efd: false }),
]);
college("html_college", [
  src("20001", "Biology", "AS-T in Biology", null, "https://example.edu/programs/stem/"),
  src("20002", "Chemistry", "AS-T in Chemistry", null, "https://example.edu/programs/stem/#chem"),
  src("20003", "Physics", "AS-T in Physics", null, "https://example.edu/programs/physics/"),
], [
  // A page another program was read from; the note names electives only in the reader's own words.
  rec("20001", "https://example.edu/programs/stem/", { notes: ["Transferable electives as needed to reach 60."] }),
  // Read from another URL than the capture's (a reread): the window is not filed.
  rec("20003", "https://example.edu/programs/physics-2026/"),
  // Failing: never counted.
  rec("20002", "https://example.edu/programs/stem/#chem", { pass: false }),
]);

const PY = [
  "import json, sys",
  "sys.path.insert(0, 'kb')",
  "import _electives_fill_section_census as C",
  "rows = C.load(sys.argv[1])",
  "out = {'census': C.census(rows), 'classes': {}}",
  "for slug, d, e, es in rows:",
  "    g = C.guard_decided(d)",
  "    out['classes'][d['control_number']] = None if g is None else dict(C.classify(d, e, es), shortfall=g['shortfall'])",
  "print(json.dumps(out))",
].join("\n");

let got = null;
block("(run)", () => {
  got = JSON.parse(execFileSync("python3", ["-c", PY, tmp], { cwd: ROOT, encoding: "utf8" }));
});
const cls = (cn) => ((got && got.classes[cn]) || {}).class;

block("(1)", () => {
  check("(1) a passing record whose degree check passes on a fill is counted", got.classes["10001"]
    && got.classes["10001"].shortfall === true);
  check("(1) a record with no shortfall to fill is gated, not counted", got.classes["10009"].shortfall === false
    && got.census.fill_passes === 8, String(got.census.fill_passes));
  check("(1) a record that does not say electives fill it, and a failing record, are not counted",
    got.classes["10003"] === null && got.classes["20002"] === null);
});
block("(2)", () => {
  check("(2) a record whose own block heading names electives is inside", cls("10002") === "inside_evidenced"
    && got.classes["10002"].own_words.join() === "block");
  check("(2) the block-heading-only count names it", got.census.inside_evidenced_block_heading_only === 1);
});
block("(3)", () => {
  check("(3) no quoted word and a range running into the next program: an outside candidate",
    cls("10001") === "outside_candidate");
  const c = got.census.outside_candidates.find((r) => r.control_number === "10001") || {};
  check("(3) its section ends on the neighbor's first page, and the neighbor is named",
    c.section_ends_page === 11 && c.neighbor === "10003" && c.route === "pdf", JSON.stringify(c));
  check("(3) the census names its college", got.census.by_college.some((r) => r.college === "Fixture College"
    && r.outside_candidate === 2));
});
block("(4)", () => {
  check("(4) a legacy and a 2.0 number reading one section are no neighbors",
    cls("10004") === "own_window" && cls("10005") === "own_window");
  check("(4) another program starting on the record's own first page leaves the span unknown",
    cls("10006") === "span_unknown");
});
block("(5)", () => {
  check("(5) an apostrophe never opens a quotation; the quoted electives words count as the section's",
    cls("10008") === "inside_evidenced" && got.classes["10008"].own_words.join() === "note");
  check("(5) a field name in a note is not a catalog word", cls("10001") !== "inside_evidenced");
  const c = got.census.outside_candidates.find((r) => r.control_number === "10001") || {};
  check("(5) a note with no unquoted electives word is no paraphrase", c.reader_paraphrase === false);
});
block("(6)", () => {
  check("(6) an HTML page another program was read from is a neighbor", cls("20001") === "outside_candidate");
  const c = got.census.outside_candidates.find((r) => r.control_number === "20001") || {};
  check("(6) its unquoted electives note is listed as the reader's paraphrase", c.reader_paraphrase === true);
  check("(6) a reread from another URL leaves the span unknown", cls("20003") === "span_unknown");
  check("(6) the totals add up", got.census.inside_evidenced + got.census.own_window + got.census.outside_candidate
    + got.census.span_unknown === got.census.fill_passes);
});

fs.rmSync(tmp, { recursive: true, force: true });
const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nelectives_fill_section_census.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
