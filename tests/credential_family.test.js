// A credential family is a field, never a fold (Sam, 2026-11-11, in session; cpl_memory
// sam-bundle-family-is-a-field-2026-11-11). Each ASE bundle stays its own canonical title and carries the family
// "ASE Certificate Bundles"; each component test is a search alias. The review of #3117 found nine surfaces that
// misread adoption once unlike bundles shared one title. These checks pin the point on the reader side:
//   1. the CPL opportunity workbook and the Request Quick Adopt chip line (map_links.js), two of those nine, give an
//      A4+A5 college the same answer with the family as without it: it has A4+A5, and it could adopt T2+T8;
//   2. the Credential Catalog finds both the A4+A5 and the A4+A5+A6 bundle for "A4" and for "ASE A4", shows each
//      member's family on a quiet line with the count of titles in it, and its word searches for the family.
// The data side (the conversion plan, the sync, the aliases) is tests/credential_family_test.py.
//
// Run from repo root: `npm test` (or `node tests/credential_family.test.js`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const FAM = "ASE Certificate Bundles";
const A45 = "ASE Bundle — A4, A5", A456 = "ASE Bundle — A4, A5, A6", T28 = "ASE Bundle — T2, T8";
const PIERCE = "Los Angeles Pierce College", LATTC = "Los Angeles Trade Technical College";

// ── 1a. the workbook ────────────────────────────────────────────────────────
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("map_links.js", "utf8"), sandbox);
vm.runInContext(fs.readFileSync("college_cpl_workbook.js", "utf8"), sandbox);
const W = sandbox.window.CPL_COLLEGE_WORKBOOK;
const lookup = { colleges: [PIERCE], rows: [[0, "P1", "AST", "2", "Suspension and Brakes", 5, "C", "0948.00: Automotive Technology", "", "", ""]] };
function statewide(withFamily) {
  const f = withFamily ? { family: FAM } : {};
  return { generated_at: "2026-11-11", exhibits: [
    Object.assign({ unified_title: A45, exhibit_ids: ["MAPICI-ASE(42-1-001"], collaborative_type: "Industry", cpl_type: "Industry Certification",
      issuing_agency: "ASE", adopters: 1, adopter_names: [PIERCE], potential_names: [],
      credit_recs: [{ course: "AST 2", credit: "5 hours in Suspension and Brakes" }], adopter_rec_idx: { [PIERCE]: [0] }, adopter_units: { [PIERCE]: 5 } }, f),
    Object.assign({ unified_title: T28, exhibit_ids: ["MAPICI-ATT+-1-001"], collaborative_type: "Industry", cpl_type: "Industry Certification",
      issuing_agency: "ASE", adopters: 1, adopter_names: [LATTC], potential_names: [PIERCE],
      credit_recs: [{ course: "DSL 1", credit: "4 hours in Diesel Engines" }] }, f)] };
}
function answer(withFamily) {
  const b = W.build({ college: PIERCE, today: "2026-11-11", lookup: lookup, members: { colleges: [PIERCE], members: {} }, aligned: { aligned: {} },
    statewide: statewide(withFamily), programs: { colleges: [], rows: [] }, catalog: [],
    verified: { checked_at: "2026-11-11T19:00Z", found: { "MAPICI-ATT+-1-001": { college: LATTC } } } });
  return { has: b.existing.map((e) => e.title).sort().join("|"), could: b.swRows.map((r) => r.title + ":" + r.couldAdopt + ":" + r.crId).sort().join("|") };
}
const before = answer(false), after = answer(true);
check("workbook: the A4+A5 college has A4+A5 and never T2+T8", before.has === A45 && after.has === A45);
check("workbook: it is offered T2+T8 as could-adopt, and never its own A4+A5", /ASE Bundle — T2, T8:/.test(after.could) && after.could.indexOf(A45) < 0);
check("workbook: the family changes no answer", before.has === after.has && before.could === after.could);

// ── 1b. the Request Quick Adopt chip line ───────────────────────────────────
function chipsFor(index, title) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="host"></div></body></html>', { runScripts: "dangerously", url: "https://example.org/" });
  const w = dom.window;
  w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(index) });
  w.eval(fs.readFileSync("map_links.js", "utf8"));
  w.document.getElementById("host").innerHTML = w.CPL_MAP_LINKS.placeholder(title);
  return new Promise((res) => setTimeout(() => res(Array.from(w.document.querySelectorAll("a.cpl-mapchip")).map((a) => a.textContent)), 60));
}
const INDEX = { found: { "MAPICI-ASE(42-1-001": { college: PIERCE }, "MAPICI-ATT+-1-001": { college: LATTC } },
  by_title: { [A45]: ["MAPICI-ASE(42-1-001"], [T28]: ["MAPICI-ATT+-1-001"] } };

// ── 2. the Credential Catalog ───────────────────────────────────────────────
const PAGE = fs.readFileSync("library/adopt/index.html", "utf8");
const JS = fs.readFileSync("library/adopt/adopt.js", "utf8");
const DATA = { written_at: "2026-11-11T12:00:00Z", counts: { settled: 4, held: 0, in_reference: 4 },
  colleges: [[PIERCE, "Pierce", "LACCD", "Los Angeles (Region 7)", "C"], [LATTC, "LATTC", "LACCD", "Los Angeles (Region 7)", "C"]],
  families: { [FAM]: 3 }, sectors: { "47": "Mechanic and Repair Technologies" }, types: ["Industry Certification"],
  credentials: [
    { t: A45, i: "ASE", y: [0], s: "47", a: [[0, 5, "AST 2"]], fam: FAM, aka: ["ASE A4", "ASE A5", FAM] },
    { t: A456, i: "ASE", y: [0], s: "47", a: [[1, 6, "AUTO 1"]], fam: FAM, aka: ["ASE A4", "ASE A5", "ASE A6", FAM] },
    { t: T28, i: "ASE", y: [0], s: "47", a: [[1, 4, "DSL 1"]], fam: FAM, aka: ["ASE T2", "ASE T8", FAM] },
    { t: "Engine Repair (ASE A1)", i: "ASE", y: [0], s: "47", a: [[1, 3, "AUTO 2"]] }] };

function loadCatalog() {
  const dom = new JSDOM(PAGE, { url: "https://cpl-initiative.github.io/cpl-project-tracker/library/adopt/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.Element.prototype.scrollIntoView = function () {};
  w.fetch = function (url) {
    if (/credential_priority_counts/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    if (/adopt_more|adopt_align|adopt_ai|shards\//.test(url)) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(DATA))) });
  };
  w.requestAnimationFrame = (f) => setTimeout(f, 0);
  w.eval(JS);
  return new Promise((res) => setTimeout(() => res(w), 80));
}

(async function () {
  const chips = { a45: await chipsFor(INDEX, A45), t28: await chipsFor(INDEX, T28) };
  check("chip line: A4+A5 names only the college that built it, T2+T8 only its own builder",
    chips.a45.length === 1 && chips.a45[0].indexOf(PIERCE) >= 0 && chips.t28.length === 1 && chips.t28[0].indexOf(LATTC) >= 0);

  const w = await loadCatalog(), A = w.CPL_ADOPT;
  const R = DATA.credentials.map((c, i) => Object.assign({ std: "awarded", _i: i }, c));
  const F = (o) => Object.assign({ q: "", colleges: {}, regions: {}, areas: {}, sectors: {}, types: {}, standing: { awarded: true }, sort: "az" }, o);
  const found = (q) => A.rows(DATA, R, F({ q: q })).map((c) => c.t).sort().join("|");
  check("catalog: a search for A4 returns both the A4+A5 and the A4+A5+A6 bundle, and not T2+T8", found("A4") === [A45, A456].sort().join("|"));
  check("catalog: a search for ASE A4 returns the same two", found("ASE A4") === [A45, A456].sort().join("|"));
  check("catalog: the family name finds its members only", found(FAM) === [A45, A456, T28].sort().join("|"));
  const d = w.document;
  const cards = Array.from(d.querySelectorAll("#ad-list .cred"));
  const famLine = (t) => { const c = cards.find((x) => x.querySelector("h3").textContent === t); const p = c && c.querySelector(".meta.fam"); return p ? p.textContent : ""; };
  check("catalog: a member shows its family and the count of titles in it, in words", /^One of 3 titles in the family ASE Certificate Bundles\. Show the family$/.test(famLine(A45)));
  check("catalog: a title in no family shows no family line", famLine("Engine Repair (ASE A1)") === "" && cards.length === 4);
  const btn = cards.find((x) => x.querySelector("h3").textContent === A45).querySelector(".meta.fam button");
  btn.click();
  await new Promise((r) => setTimeout(r, 60));
  check("catalog: Show the family searches for it and lists its three members",
    d.getElementById("ad-q").value === FAM && Array.from(d.querySelectorAll("#ad-list .cred h3")).length === 3);
  check("catalog: the family line is plain words, no glyph", !/[←-⯿\u{1F300}-\u{1FAFF}]/u.test(famLine(A45)));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
