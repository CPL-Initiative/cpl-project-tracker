// The Courses List's read-only "Side by side" fold (coci_lookup.js sbsFold; S678, COBIx's item 7 on #3464,
// courses/ask-sky-side-by-side.md).
//
// WHAT THIS GUARDS:
//   (1) the fold sits under the card in a course's panel, reads kb/side_by_side.json only when it opens, and once;
//   (2) ⭐ for each fixture card the fold shows the rows and the reading of COBIx's case_studies.md (#3464):
//       NRSR M1137 three Nursing rows, all Active, TOP 1230.10 (Registered Nursing), both tables say Nursing;
//       AGAB M1002 "the scorer reads 0 college courses; the List shows 3", each row "List file only", the TOP code
//       and subject not in our tables; AUTO M9003 two rows with no row in the program course file;
//   (3) ⭐ opening the fold makes no write: no POST, PATCH or DELETE leaves the page, and the fold has no form control
//       beyond "Read the rest";
//   (4) the words check: the fold's text uses none of "seed", "null", "should", "please", or "M-ID" without its plain
//       name;
//   (5) the table scrolls inside its own named region, with th scope on every header.
//
// The fold reads the committed kb/side_by_side.json, so a rebuild that loses a fixture's figures fails here.
// Run from repo root: `npm test` (or `node tests/coci_list_side_by_side.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const SBS = JSON.parse(fs.readFileSync("kb/side_by_side.json", "utf8"));

const COLLEGES = ["Mt. San Jacinto College", "Santa Barbara City College", "Merced College",
  "North Orange Continuing Education", "North Orange Continuing Education Credit"];
const LOOKUP = {
  _built_at: "2026-07-09",
  colleges: COLLEGES,
  rows: [
    [0, "CCC000502913", "NURS", "234", "Intermediate Medical-Surgical Nursing III", 5, "C", "1230.10: Registered Nursing", "", "", "NRSR M1137"],
    [0, "CCC000642246", "NURS", "506", "Intermediate Medical-Surgical Nursing III", 6, "C", "1230.10: Registered Nursing", "", "", "NRSR M1137"],
    [1, "CCC000593129", "NURS", "166", "Intermediate Medical-Surgical Nursing III", 5.5, "C", "1230.10: Registered Nursing", "", "", "NRSR M1137"],
    [2, "CCC000553356", "AGAB", "31A", "Agricultural Ambassadors - Introduction", 2, "C", "0112.00: Agriculture Business, Sales, and Service", "", "", "AGAB M1002"],
    [2, "CCC000553354", "AGAB", "31C", "Agricultural Ambassadors - Public Relations", 2, "C", "0112.00: Agriculture Business, Sales, and Service", "", "", "AGAB M1002"],
    [2, "CCC000553355", "AGAB", "31B", "Agricultural Ambassadors - Recruitment", 2, "C", "0112.00: Agriculture Business, Sales, and Service", "", "", "AGAB M1002"],
    [3, "CCC000421219", "ACRT", "166", "8HR TRAN/SMOG TECH", 0, "N", "0948.00: Automotive Technology", "", "", "AUTO M9003"],
    [4, "CCC000421219", "ACRT", "166", "8HR TRAN/SMOG TECH", 0, "N", "0948.00: Automotive Technology", "", "", "AUTO M9003"]
  ]
};
const MEMBERS = {
  generated_at: "2026-11-17 03:10",
  colleges: COLLEGES,
  members: {
    "NRSR M1137": [{ c: 0, cn: "CCC000502913" }, { c: 0, cn: "CCC000642246" }, { c: 1, cn: "CCC000593129" }],
    "AGAB M1002": [{ c: 2, cn: "CCC000553356" }, { c: 2, cn: "CCC000553354" }, { c: 2, cn: "CCC000553355" }],
    "AUTO M9003": [{ c: 3, cn: "CCC000421219" }, { c: 4, cn: "CCC000421219" }]
  }
};
const UC = { generated_at: "2026-11-17 03:10", mq_disciplines: ["Agriculture", "Automotive Technology", "Nursing"], rows: [
  { kind: "Course", id: "NRSR M1137", title: "Intermediate Medical-Surgical Nursing 3", disc: "Nursing", credit: "Credit", units: 5, subj: ["NURS"], id_system: "M-ID", flags: {} },
  { kind: "Course", id: "AGAB M1002", mt: 1, title: "Agricultural Ambassadors - Public Relations", disc: "Agriculture", credit: "Credit", units: 2, subj: ["AGAB"], id_system: "M-ID", flags: {} },
  { kind: "Course", id: "AUTO M9003", title: "8HR Tran/Smog Tech", disc: "Automotive Technology", credit: "Noncredit", units: 0, subj: ["ACRT"], id_system: "M-ID", flags: {} }] };
const DESC = { N: { CCC000502913: "This course, Intermediate Medical-Surgical Nursing III, will synthesize and correlate nursing knowledge. " + "More words. ".repeat(30) },
  A: { CCC000553356: "The purpose of this course is to introduce students to the Agricultural Ambassador program." } };

function tab() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/#coci-lookup", runScripts: "dangerously" });
  const w = dom.window, calls = [], sent = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    sent.push({ url: url, method: String(init.method || "GET").toUpperCase() });
    if (/kb\/side_by_side\.json/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(SBS))) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push(s);
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    if (s === "unified_courses_data.js") w.CPL_UNIFIED_COURSES = JSON.parse(JSON.stringify(UC));
    const m = /coci_lookup_desc_([A-Z0])\.js/.exec(s);
    if (m) { w.CPL_COCI_DESC = w.CPL_COCI_DESC || {}; w.CPL_COCI_DESC[m[1]] = DESC[m[1]] || {}; }
    setTimeout(cb, 0);
  } };
  w.CPL_SESSION = { get: () => null, isFresh: () => false, ensureFresh: () => Promise.resolve(null) };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document, calls, sent };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms) { const end = Date.now() + (ms || 5000); while (!fn() && Date.now() < end) await sleep(10); return fn(); }
const P = "ccl-";
function panel(d) { return d.getElementById(P + "panel"); }
function titleBtn(d, title) {
  return Array.from(d.querySelectorAll("." + P + "table tbody button")).find((b) => txt(b).indexOf(title) === 0);
}
async function openPanel(t, title) {
  await until(() => titleBtn(t.d, title));
  titleBtn(t.d, title).click();
  await until(() => panel(t.d) && t.d.getElementById("ccl-sbs"));
}
async function openFold(t) {
  const f = t.d.getElementById("ccl-sbs");
  f.open = true; f.dispatchEvent(new t.w.Event("toggle"));
  await until(() => { const g = t.d.getElementById("ccl-sbs"); return g && g.querySelector(".ccl-sbs-table") || /did not arrive|scorer reads only/.test(txt(g)); });
  await until(() => !/reading…/.test(txt(t.d.getElementById("ccl-sbs"))));
  return t.d.getElementById("ccl-sbs");
}
function rows(f) {
  return Array.from(f.querySelectorAll(".ccl-sbs-table tbody tr")).map((tr) => Array.from(tr.children).map(txt));
}

(async () => {
  const t = tab();
  await openPanel(t, "Intermediate Medical-Surgical Nursing III");
  // ── (1) placement and loading ──
  const kids = Array.from(panel(t.d).querySelector("." + P + "pbody").children);
  check("(1) the fold is in the panel, closed", !!t.d.getElementById("ccl-sbs") && !t.d.getElementById("ccl-sbs").open);
  check("(1) the fold's file is not read before it opens", !t.sent.some((x) => /side_by_side/.test(x.url)), JSON.stringify(t.sent));
  check("(1) wrapped, so it never anchors the Title drawer", kids.some((k) => k.classList.contains("ccl-sbs-outer")));
  const name = txt(t.d.querySelector("#ccl-sbs > summary"));
  check("(1) it is called Side by side", /^Side by side/.test(name), name);
  let f = await openFold(t);
  const sentAtOpen = t.sent.length;

  // ── (2) NRSR M1137 ──
  let p = txt(f), r = rows(f);
  const seen = [p];
  check("(2) ⭐ NRSR M1137: our record", /The card: NRSR M1137, Intermediate Medical-Surgical Nursing 3/.test(p) && /Subject code: NURS/.test(p)
    && /Discipline: Nursing, the first machine guess, never re-checked/.test(p) && /Credit status: Credit/.test(p)
    && /Its own description: Focuses on the care of adult clients/.test(p), p.slice(0, 600));
  check("(2) ⭐ NRSR M1137: three college rows", r.length === 3, JSON.stringify(r));
  check("(2) NRSR M1137: each row is Active, TOP 1230.10 (Registered Nursing), Nursing in both tables",
    r.every((c) => c[3] === "1230.10 (Registered Nursing)" && c[4] === "Nursing" && c[5] === "Nursing" && c[6] === "Active"), JSON.stringify(r));
  check("(2) NRSR M1137: the courses and control numbers", r.map((c) => c[1]).sort().join("|") === "NURS 166, CCC000593129|NURS 234, CCC000502913|NURS 506, CCC000642246");
  check("(2) NRSR M1137: no disagreement note (the scorer and the List both hold 3)", !f.querySelector(".ccl-sbs-note"));
  check("(2) NRSR M1137: the three signals agree", /Its own subject code agrees\./.test(p) && /Its colleges' subject codes agree\./.test(p) && /TOP codes \(a last-in-line signal\) agree\./.test(p), p);
  const longRow = r.find((c) => /NURS 234/.test(c[1]));
  check("(2) a description shows its first 200 characters, with the rest on click", longRow && /…\s*Read the rest$/.test(longRow[7]), longRow && longRow[7]);
  check("(2) the outline column says yes or no", r.every((c) => c[8] === "no"), JSON.stringify(r.map((c) => c[8])));
  const more = Array.from(f.querySelectorAll("button")).find((b) => /Read the rest/.test(txt(b)));
  if (more) more.click();
  await sleep(20);
  check("(2) Read the rest shows the whole description", /Show less/.test(txt(t.d.getElementById("ccl-sbs"))));
  // ── (3) no write ──
  const controls = Array.from(t.d.getElementById("ccl-sbs").querySelectorAll("button, input, select, textarea")).map(txt);
  check("(3) ⭐ the fold's only control is Read the rest or Show less", controls.every((x) => /^(Read the rest|Show less)$/.test(x)), JSON.stringify(controls));
  // ── (5) the table ──
  const wrap = f.querySelector(".ccl-sbs-wrap");
  check("(5) the table scrolls inside its own named region", wrap && wrap.getAttribute("role") === "region" && /college courses on NRSR M1137/.test(wrap.getAttribute("aria-label") || ""));
  check("(5) th scope on every header", Array.from(f.querySelectorAll("th")).every((th) => th.getAttribute("scope") === "col"));

  // ── (2) AGAB M1002 ──
  await openPanel(t, "Agricultural Ambassadors - Public Relations");
  f = t.d.getElementById("ccl-sbs");
  if (!f.open) f = await openFold(t); else await until(() => !/reading…/.test(txt(t.d.getElementById("ccl-sbs"))));
  f = t.d.getElementById("ccl-sbs");
  p = txt(f); r = rows(f); seen.push(p);
  check("(2) ⭐ AGAB M1002: the scorer reads 0 courses while the List shows 3", /The scorer reads 0 college courses for this card; the List shows 3\./.test(p), p.slice(0, 800));
  check("(2) AGAB M1002: each row is List file only, at Merced College", r.length === 3 && r.every((c) => c[0] === "Merced College (List file only)"), JSON.stringify(r));
  check("(2) AGAB M1002: TOP 0112.00, not in either table, Active",
    r.every((c) => c[3] === "0112.00 (Agriculture Business, Sales, and Service)" && c[4] === "not in our TOP table" && c[5] === "not in the subject map" && c[6] === "Active"), JSON.stringify(r));
  check("(2) AGAB M1002: own description none; subject unmapped; the other two signals missing",
    /Its own description: none/.test(p) && /Its own subject code is not in the subject map\./.test(p) && /subject codes name no field our tables hold/.test(p), p);

  // ── (2) AUTO M9003 ──
  await openPanel(t, "8HR TRAN/SMOG TECH");
  f = t.d.getElementById("ccl-sbs");
  if (!f.open) f = await openFold(t); else await until(() => !/reading…/.test(txt(t.d.getElementById("ccl-sbs"))));
  f = t.d.getElementById("ccl-sbs");
  p = txt(f); r = rows(f); seen.push(p);
  check("(2) ⭐ AUTO M9003: two rows, no row in the program course file, Automotive Technology in both tables",
    r.length === 2 && r.every((c) => c[6] === "no row in the program course file" && c[4] === "Automotive Technology" && c[5] === "Automotive Technology"), JSON.stringify(r));
  check("(2) AUTO M9003: Noncredit, the description none", /Credit status: Noncredit/.test(p) && /Its own description: none/.test(p) && /description\s*$|none in the extract/.test(r.map((c) => c[7]).join(" ")));

  // ── (1) once ──
  check("(1) the fold's file is read once across panels", t.sent.filter((x) => /side_by_side/.test(x.url)).length === 1, JSON.stringify(t.sent.filter((x) => /side_by_side/.test(x.url))));
  // ── (3) ⭐ no write, across all three ──
  const writes = t.sent.filter((x) => x.method !== "GET");
  check("(3) ⭐ no POST, PATCH or DELETE is sent when a fold opens", writes.length === 0, JSON.stringify(writes));
  check("(3) every request after opening is a read", t.sent.slice(sentAtOpen - 1).every((x) => x.method === "GET"));
  // ── (4) words ──
  const words = seen.join(" ");
  check("(4) the fold's words use none of seed, null, should, please", !/\b(seed|null|should|please)\b/i.test(words), words.slice(0, 300));
  check("(4) no bare M-ID in the fold", !/M-ID/.test(words));

  let pass = 0;
  for (const [n, ok, why] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; }
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
