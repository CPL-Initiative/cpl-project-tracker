// My College — the CPL opportunity workbook (Ashley's analysis, Sam's ask of
// 2026-10-20: "make it possible to pull a spreadsheet like Ashley needs from the
// My College tab"). Guards the failure modes the first run (American River
// College) met:
//   1. course identity comes from unified_courses_members.js; coci_lookup_data.js's
//      identity column predates re-mints (741 of ARC's 2,461 courses differ)
//   2. AP and IB never appear as an exhibit or as peer evidence; CLEP does
//      (Ashley, 2026-10-20: "excluding AP and IB. Include CLEP exhibits")
//   3. title-only matching keeps the module, process and generic-word guards
//   4. a college spelled differently in each source still resolves
//   5. the .xlsx is a valid zip with frozen, filtered sheets and escaped names
//   6. "Could Adopt - View in MAP" is a working hyperlink only for an ID MAP listed
//   7. a catalog code written without its space (Bakersfield's "AUTOB30") still finds its course
//
// Run from repo root: `npm test` (or `node tests/college_cpl_workbook.test.js`).
const fs = require("fs");
const vm = require("vm");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("college_cpl_workbook.js", "utf8"), sandbox);
const W = sandbox.window.CPL_COLLEGE_WORKBOOK;

const COLLEGE = "Test River College";
const lookup = {
  colleges: ["Other College", COLLEGE],
  rows: [
    // [college, cn, subj, num, title, units, credit, top, cid, ccn, identity (STALE here)]
    [1, "CCC1", "CISC", "323", "Server Administration", 3, "C", "0702.00: Computer Information Systems", "", "", "OLD M0001"],
    [1, "CCC2", "FIRE", "1706", "Fire Inspector 1C: Field Inspection", 2, "C", "2133.00: Fire Technology", "", "", ""],
    [1, "CCC3", "PLUMB", "166", "Certification Preparation", 1, "C", "0952.30: Plumbing", "", "", ""],
    [1, "CCC4", "HIST", "300", "World History", 3, "C", "2205.00: History", "", "", ""],
    [0, "CCC9", "CIS", "21", "Server Admin", 3, "C", "0702.00: x", "", "", ""]
  ]
};
const members = { generated_at: "2026-10-20 17:21", colleges: ["Other College", COLLEGE],
  members: { "CISC M1000": [{ c: 1, cn: "CCC1" }, { c: 0, cn: "CCC9" }], "HIST M2000": [{ c: 1, cn: "CCC4" }] } };
const aligned = { generated_at: "2026-10-20 17:21", aligned: {
  "CISC M1000": [
    { c: "CompTIA Network+", i: "CompTIA", p: "Industry Certification", r: ["3 hours in Networking"], g: ["Other College", "Peer A", "Peer B"], n: 3, x: "CCC" },
    { c: "AP Computer Science A", i: "College Board", p: "Standardized Assessment", r: ["3 hours"], g: ["Peer A"], n: 1, x: "" }
  ],
  "OLD M0001": [{ c: "Stale Credential", p: "Industry Certification", r: [], g: ["Peer A", "Peer B", "Peer C"], n: 3, x: "" }],
  "HIST M2000": [{ c: "CLEP History of the United States 1", p: "Credit By Exam", r: [], g: ["Peer A", "Peer B", "Peer C"], n: 3, x: "" }]
} };
const statewide = { generated_at: "2026-10-20T17:19:25", exhibits: [
  { unified_title: "CompTIA Network+", exhibit_ids: ["MAPICI-CN-1-001"], collaborative_type: "CCC Collaborative",
    cpl_type: "Industry Certification", discipline: "IT", issuing_agency: "CompTIA", adopters: 3,
    adopter_names: ["Other College", "Peer A", "Peer B"], potential_names: ["Test River College"],
    credit_recs: [{ course: "CIS 21", credit: "3 hours in Networking" }], adopter_rec_idx: {}, peer_units_median: 3 },
  { unified_title: "Fire Inspector 1D", exhibit_ids: ["MAPICA-FI1D-1-001"], collaborative_type: "CCC Collaborative",
    cpl_type: "Industry Certification", discipline: "Fire", issuing_agency: "SFT", adopters: 1,
    adopter_names: ["Peer A"], potential_names: [COLLEGE], credit_recs: [{ course: "FT 1", credit: "2 hours in Fire Inspector 1D: Field Inspection" }] },
  { unified_title: "CompTIA A+", exhibit_ids: ["MAPICI-CA-1-001"], collaborative_type: "CCC Collaborative",
    cpl_type: "Industry Certification", discipline: "IT", issuing_agency: "CompTIA", adopters: 1,
    adopter_names: ["Peer A"], potential_names: [COLLEGE], credit_recs: [{ course: "CS 1", credit: "3 hours in Certification Preparation and Review" }] },
  { unified_title: "CompTIA Server+", exhibit_ids: ["MAPICI-CS3-1-001"], collaborative_type: "CCC Collaborative",
    cpl_type: "Industry Certification", discipline: "IT", issuing_agency: "CompTIA", adopters: 2,
    adopter_names: [COLLEGE, "Peer A"], potential_names: [],
    credit_recs: [{ course: "CISC 323", credit: "3 hours in Systems Administration" }],
    adopter_rec_idx: { "Test River College": [0] }, adopter_units: { "Test River College": 3 } },
  { unified_title: "AP Biology", exhibit_ids: ["MAPSAH-AB-1-001"], collaborative_type: "Local",
    cpl_type: "Standardized Assessment", adopter_names: [COLLEGE], potential_names: [],
    credit_recs: [{ course: "HIST 300", credit: "3 hours" }], adopter_rec_idx: { "Test River College": [0] } }
] };
const programs = { colleges: ["TEST RIVER"], awards: ["A.S. Degree"], statuses: ["Active"],
  rows: [[0, "07200", "Computer Networking", "0702.00", "11.0901", 0, 0, "18", 0, 1]] };
const catalog = [{ control_number: "07200", program_title: "Computer Networking", award: "A.S.", source_url: "https://example.edu/c.pdf#page=1",
  blocks: [{ courses: [{ code: "CISC 323" }, { code: "PLUMB 166" }] }] }];

const b = W.build({ college: COLLEGE, today: "2026-10-20", lookup: lookup, members: members, aligned: aligned,
  statewide: statewide, programs: programs, catalog: catalog, shareBase: "https://example.org/cpl-opportunity/",
  verified: { checked_at: "2026-10-20T19:00Z", found: { "MAPICI-CN-1-001": { title: "CompTIA Network+" } } } });
const byId = {};
b.courses.forEach(function (c) { byId[c.id] = c; });

// 1. identity from members, never the stale lookup column
check("CISC 323 takes its identity from the members file", byId["CISC 323"].ident === "CISC M1000");
check("…so the stale identity's credential never reaches it", !byId["CISC 323"].peer.some(function (x) { return x.ent.c === "Stale Credential"; }));
check("the statewide CR reaches CISC 323 through its three peer colleges",
  byId["CISC 323"].sw.length === 1 && byId["CISC 323"].sw[0].peers.join() === "Other College,Peer A,Peer B");

// 7. an unspaced catalog code resolves to its course; an unknown one stays as read
const b7 = W.build({ college: COLLEGE, today: "2026-10-21", lookup: lookup, members: members, aligned: aligned,
  statewide: statewide, programs: programs, shareBase: "https://example.org/cpl-opportunity/",
  catalog: [{ control_number: "07200", program_title: "Computer Networking", blocks: [{ courses: [{ code: "FIRE1706" }, { code: "ZZZ999", alternatives: ["HIST300"] }] }] }] });
const by7 = {};
b7.courses.forEach(function (c) { by7[c.id] = c; });
check("an unspaced catalog code (FIRE1706) marks FIRE 1706 as in the catalog", by7["FIRE 1706"].inCatalog === true);
check("an unspaced alternative (HIST300) marks HIST 300 too", by7["HIST 300"].inCatalog === true);
check("a course the catalog does not list stays out", by7["CISC 323"].inCatalog === false);

// 2. AP / IB excluded, CLEP kept
check("an AP exhibit the college holds is not an existing exhibit", !b.existing.some(function (e) { return /^AP /.test(e.title); }));
check("the college's CompTIA Server+ line is an existing exhibit on CISC 323",
  b.existing.length === 1 && b.existing[0].course === "CISC 323" && b.existing[0].units === 3);
check("an AP credential is never peer evidence", !byId["CISC 323"].peer.some(function (x) { return /^AP /.test(x.ent.c); }));
check("a CLEP credential counts as peer evidence", byId["HIST 300"].peer.length === 1);
check("an adopted CR is not offered again", !b.swRows.some(function (r) { return r.title === "CompTIA Server+"; }));

// 3. title-only guards
check("Fire Inspector 1D never matches a 1C course", !b.swRows.some(function (r) { return r.title === "Fire Inspector 1D" && r.courseId; }));
check("generic words never make a match (Certification Preparation)", !b.swRows.some(function (r) { return r.title === "CompTIA A+" && r.courseId; }));
check("an unmatched CR still gets a row saying so", b.swRows.some(function (r) { return r.title === "CompTIA A+" && r.tier === "None identified"; }));
check("a welding process must agree on both sides", W._titleMatches("Gas Metal Arc Welding", "Shielded Metal Arc Welding (Pipe)") === null);
check("a plain topic still matches its course", !!W._titleMatches("Information Systems Security Fundamentals", "Introduction to Information Systems Security Fundamentals"));

// 4. names
const b2 = W.build({ college: "Test River Community College", today: "x", lookup: lookup, members: members,
  aligned: aligned, statewide: statewide, programs: programs, catalog: [] });
check("a differently worded college name resolves in every source", b2.courses.length === 4 && b2.programs.length === 1);
check("the program reads its courses from the catalog harvest", b.programs[0].nCourses === 2 && b.programs[0].nExisting === 1);
check("the existing course is confirmed and not an opportunity",
  byId["CISC 323"].tier === "Confirmed: existing MAP exhibit" && !b.opps.some(function (o) { return o.id === "CISC 323"; }));

// 5. the .xlsx
const sheets = W.sheets(b);
check("six sheets, Ashley's five plus About & Sources", sheets.length === 6 && sheets[0].name === "1 Active Programs (COCI)" && sheets[5].name === "About & Sources");
const z = Buffer.from(W.toXlsx(sheets));
check("the file is a zip", z.readUInt32LE(0) === 0x04034b50);
const eocd = z.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
check("its directory lists every part", z.readUInt16LE(eocd + 10) === 5 + sheets.length);
// walk the local headers, checking each part's CRC
let at = 0, crcOk = true, parts = {};
while (z.readUInt32LE(at) === 0x04034b50) {
  const crc = z.readUInt32LE(at + 14), size = z.readUInt32LE(at + 18), nlen = z.readUInt16LE(at + 26);
  const name = z.slice(at + 30, at + 30 + nlen).toString("utf8");
  const data = z.slice(at + 30 + nlen, at + 30 + nlen + size);
  if (W._crc32(new Uint8Array(data)) !== crc) crcOk = false;
  parts[name] = data.toString("utf8");
  at += 30 + nlen + size;
}
check("every part's CRC is right", crcOk);
check("the workbook escapes the ampersand in a sheet name", /About &amp; Sources/.test(parts["xl/workbook.xml"]) && !/About & Sources/.test(parts["xl/workbook.xml"]));
check("each sheet freezes its header row", /state="frozen"/.test(parts["xl/worksheets/sheet4.xml"]));
check("each sheet carries a filter", /<autoFilter ref="A1:T/.test(parts["xl/worksheets/sheet4.xml"]));
check("tab 5 carries Ashley's columns", ["Could Adopt (Yes/No)", "Statewide Credit Recommendation ID", "MAP Exhibit ID",
  "Could Adopt - View in MAP", "Link Verification Status", "Priority Level", "Recommended Next Step"].every(function (h) { return sheets[4].headers.indexOf(h) >= 0; }));
check("tab 4 carries the same link columns", sheets[3].headers.indexOf("Could Adopt - View in MAP") >= 0 && sheets[3].headers.indexOf("Could Adopt (Yes/No)") >= 0);
check("a verified CR's link is a working Excel hyperlink to MAP",
  /<f>HYPERLINK\("https:\/\/cpldashboardcccco\.azurewebsites\.net\/insights\/exhibit-courses","Could Adopt - View in MAP"\)<\/f>/.test(parts["xl/worksheets/sheet5.xml"]));
const nw = b.swRows.find(function (r) { return r.title === "CompTIA Network+"; });
check("the verified CR names the ID to search", nw.link && /^Verified 2026-10-20: MAPICI-CN-1-001/.test(nw.linkStatus) && nw.crId === "MAPICI-CN-1-001");
const fi = b.swRows.find(function (r) { return r.title === "Fire Inspector 1D"; });
check("an unverified CR gets no link and says why", fi.link === "" && /^Not listed on MAP/.test(fi.linkStatus));
const b3 = W.build({ college: COLLEGE, today: "x", lookup: lookup, members: members, aligned: aligned, statewide: statewide, programs: programs, catalog: [] });
check("with no verification read, no CR gets a link", b3.swRows.every(function (r) { return r.link === ""; }));
const html = W.pageHtml(b);
check("the visual names the college", html.indexOf("<h1>Test River College</h1>") > 0);
check("the visual's Could Adopt table links the verified CR to MAP", /class="cpo-adopt" href="https:\/\/cpldashboardcccco\.azurewebsites\.net\/insights\/exhibit-courses"/.test(html));
check("the visual offers its shareable link", html.indexOf("https://example.org/cpl-opportunity/?college=Test%20River%20College") > 0);
check("every table header cell is scoped", (html.match(/<th /g) || []).length === (html.match(/<th scope="col">/g) || []).length);

const pw = fs.readFileSync("cpl_pathways.js", "utf8");
check("the CPL Pathways college picker links the college's visual", /"cpl-opportunity\/\?college=" \+ encodeURIComponent\(col\.value\)/.test(pw));
check("…and offers the extract", /textContent = "Download CPL Extract"/.test(pw));
check("…and hides both until a college is chosen", /opp\.hidden = !col\.value/.test(pw) && /\.cplpw-oppacts\[hidden\] \{ display:none; \}/.test(pw));
const page = fs.readFileSync("cpl-opportunity/index.html", "utf8");
check("the shareable page reads its college from ?college=", /get\("college"\)/.test(page) && /\.\.\/college_cpl_workbook\.js/.test(page));

// the My College controls
const src = fs.readFileSync("college_briefing.js", "utf8");
check("My College offers the visual and the extract only for one college",
  /state\.scope === "college" && state\.college\s*\?\s*'<a class="cb-act" id="cb-oppvisual"/.test(src) && /id="cb-workbook">Download CPL Extract</.test(src));
check("My College loads the builder on first use", /loadScript\("college_cpl_workbook\.js", "CPL_COLLEGE_WORKBOOK"/.test(src));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
