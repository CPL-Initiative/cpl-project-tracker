// The Exhibits List's side panel (Sam, 2026-11-03: "when you click on an exhibit in the list and open the side bar it
// shows a list (like you've designed) of the folded members"; "yes, build the side panel into the Exhibits List").
//
// The engine's panel hook (commons_list.js) and Exhibits' contents (listPanelBody in exhibits.js). Guarded here:
//   (1) pressing a row's title opens the panel beside the table, in place of the title's drawer, and the title says so;
//   (2) the panel: the title, one line of what it is, and the members (the MAP exhibits folded under it), sortable,
//       each with its MAP link;
//   (3) the rest folded below: what each college awards, the issuer and training sites, who could adopt it;
//   (4) another title swaps the panel; Close and Escape shut it and return focus to the row's title;
//   (5) the Students column reads the reference's count, a suppressed one Too few.
// Run from repo root: `node tests/exhibits_side_panel.test.js` (or `npm test`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) {
  if (!el) return "";
  const parts = [], walk = el.ownerDocument.createTreeWalker(el, 4);
  while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
const src = fs.readFileSync("exhibits.js", "utf8");
const listSrc = fs.readFileSync("commons_list.js", "utf8");
check("the engine documents the panel hook", /\/\/   panel              \{ label\(r\)/.test(listSrc));
check("the panel's CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(src.slice(src.indexOf('".exh-pn-h'), src.indexOf('".exh-vh'))));

const H = 36e5;
function ago(h) { return new Date(Date.now() - h * H).toISOString().replace(/\.\d+Z$/, "Z"); }
const PAIR_WORDS = "titles carry a review stamp (1,088 a person's, 1,314 a cohort's); 2,673 credentials, 2,188 of 2,961 records stamped";
function exhibitRow(over) {
  return Object.assign({
    key: "exhibit", title: "Common Exhibit Reference", tab: "#exhibits", links: [{ href: "#exhibits", text: "Open Exhibits" }],
    status_file: "kb/status/exhibit.json",
    pair: [{ n: 2402, of: 5492, words: PAIR_WORDS, open: "#exhibits/credentials" }],
    tests: ["curator-stamped", "procedure-settled"],
    issues: [
      { n: 351, words: "titles held for a person", owner: "a curator (the classifier is unsure 274, a merge would join two issuers 42)", open: "#exhibits/held", error: null },
      { n: 18, words: "saved assignments the fold holds", owner: "a curator (a human-reviewed classification stands)", open: "#exhibits/conflict", error: null },
      { n: 621, words: "titles in the reference that have left MAP", owner: "a curator (retire or keep)", open: "#credential-reference/all", error: null }
    ],
    procedures: [
      { n: 16, words: "in force: 8 rules applied by code, 8 read by the classifier", open: "#credential-reference/procs", error: null },
      { words: "A procedure's saves undo together" }
    ],
    machine: { what: "the saving run and the fold", at: ago(3), every_hours: 24 }
  }, over || {});
}
function status(row) {
  return { schema: 1, written_at: ago(2), rows: [{ key: "subjects", title: "Common Subjects Reference", pair: [], issues: [], procedures: [] }, row] };
}
const ANSWERED = [
  { title: "Merge EACR into the CER as one Exhibits tab", text: "Answered on Open Asks Sheet 147 card 1.", link: "https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB",
    answer: { by: "Sam", at: "2026-10-31", words: "merge" } },
  { title: "Which names CLEP exams take", text: "Answered fold.", link: "https://claude.ai/artifact/3MJJ8ftqz7BABwnQAsjfFL",
    answer: { by: "Sam", at: "2026-11-01", words: "fold" } }
];
const OPEN_CALL = { title: "Name the public adoption page", text: "Waiting on Sam.", link: "https://claude.ai/artifact/OpenSheetLink00000000" };
function runlog(over) {
  return Object.assign({ schema: 1, session: 541, moniker: "SkyBlatusoff", decider: "Sam", calls: ANSWERED.slice(),
    written_at: ago(1), next_step: { title: "The cert link's next families", text: "Add AP, CLEP and IB." } }, over || {});
}
const REVIEW = { schema: 1, written_at: ago(5), sources: { procedures_run: ago(5) },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 1, of: 2 }, saved_not_folded: 0 },
  colleges: ["Norco College"],
  held: [{ raw: "Welding 1 for", step: "Wording check", why: "a dangling word", colleges: [0], title: "Welding 1", issuer: "", from: "the classifier",
    ids: ["MAPCXI-WELD-1-001"], art: [0], could: [], basis: "", same: false },
  { raw: "ADJU 232", step: "Conflict with the reference", why: "the fold held the saved assignment", colleges: [], title: "Juvenile Law", issuer: "",
    from: "the reference", saved: "Juvenile Justice", ids: ["MAPCXS-A2-J-1-001"], art: [0], could: [], basis: "", same: false, exists: true }] };
const CREDREF = { _generated_at: ago(6), unified_titles: [
  { ut: "CompTIA Security+", issuer: "CompTIA", trainer: null, students_served: 57, served_suppressed: false, raw_variants: [{ r: "Sec Plus" }],
    articulations: [], potential_colleges: [], cpl_types: [], gen_rec: "3 units", ccc_rec: "", disc_modal: "", raw_count: 1 },
  { ut: "Emergency Medical Technician", issuer: "National Registry of Emergency Medical Technicians", trainer: "Fontana High School", students_served: null,
    served_suppressed: true, raw_variants: [{ r: "EMT Card" }], articulations: [], potential_colleges: [], cpl_types: ["Industry Certification"],
    gen_rec: "", ccc_rec: "", disc_modal: "Emergency Medical Technologies", raw_count: 3 }] };
const ADOPT = { schema: 1, written_at: ago(6), colleges: ["Bakersfield College", "Los Angeles Mission College", "College of San Mateo"],
  cip_sectors: { "51": "Health Professions and Related Programs" },
  credentials: { "Emergency Medical Technician": {
    a: { "0": [9, [["EMTC B50", "9 hours in Emergency Medical Technician"]]], "1": [3, [["LACCD GE 7", "3 hours in Lifelong Learning"]]] },
    c: { "2": [["FIRE 717", "", 3]] },
    x: [["MAPICI-SOCE-1-001", "State or County EMT Certification", 9], ["MAPCXH-REMT-1-001", "RCOE Emergency Medical Technician (HS: RCOE)", 6],
        ["MAPICI-EMT(3-1-001", "Emergency Medical Technician (EMT) Certification", 3]],
    s: "51", p: 6 } } };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits/credentials"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  const files = Object.assign({
    "kb/status/commons.json": status(exhibitRow()),
    "kb/status/exhibit.json": runlog(),
    "kb/exhibits_review.json": REVIEW,
    "kb/exhibits_adoption.json": ADOPT
  }, opts.files || {});
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET" });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (Object.prototype.hasOwnProperty.call(files, url)) return files[url] === 404 ? bad(404) : ok(files[url]);
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(null); }, authHeaders: function () { return {}; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, root: w.document.getElementById("exhibits-root"), calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
async function boot(opts) { const t = load(opts); await t.M.boot(); await settle(); return t; }
function tiles(d, label) { return Array.from(d.querySelectorAll(".exh-tile")).filter(function (x) { return txt(x.querySelector(".exh-tl")) === label; }); }
function tile(d, label) { return tiles(d, label)[0]; }
function titleBtn(d, t) { return Array.from(d.querySelectorAll("td.exh-l-title .exh-l-open, td[class$='title'] button")).find((b) => /^[^,]+/.exec(b.getAttribute("aria-label") || "") && txt(b) === t); }
function panel(d) { return d.getElementById("exh-l-panel"); }

(async function () {
  let t = await boot({ hash: "#exhibits/list" });
  const d = t.d;
  const emt = titleBtn(d, "Emergency Medical Technician");
  check("(1) the row's title is the panel's control, closed", !!emt && emt.getAttribute("aria-expanded") === "false"
    && emt.getAttribute("aria-controls") === "exh-l-panel" && /open its panel$/.test(emt.getAttribute("aria-label")), emt && emt.outerHTML);
  emt.click(); await settle();
  const p = panel(d);
  check("(1) pressing it opens the panel beside the table, no drawer", !!p && p.tagName === "ASIDE" && !!d.querySelector(".exh-l-split .exh-l-wrap")
    && !d.querySelector(".exh-l-drawer"));
  check("(1) focus moves to the panel's bar, which names it", d.activeElement && d.activeElement.id === "exh-l-panel-t"
    && txt(d.getElementById("exh-l-panel-t")) === "Exhibit: Emergency Medical Technician");
  check("(1) the title now says it closes the panel", /close its panel$/.test(titleBtn(d, "Emergency Medical Technician").getAttribute("aria-label")));
  check("(2) the title and one line of what it is", txt(p.querySelector(".exh-pn-h")) === "Emergency Medical Technician"
    && txt(p.querySelector(".exh-pn-meta")) === "National Registry of Emergency Medical Technicians · CIP 51 Health Professions and Related Programs · 3 MAP titles · 2 colleges articulate · 1 could adopt · Students: Too few",
    txt(p.querySelector(".exh-pn-meta")));
  const memberRows = () => Array.from(panel(t.d).querySelectorAll(".exh-pn-table tbody tr")).map((r) => txt(r.children[1]));
  check("(2) the members: every MAP exhibit folded under it, A to Z by local title", memberRows().join("|")
    === "Emergency Medical Technician (EMT) Certification|RCOE Emergency Medical Technician (HS: RCOE)|State or County EMT Certification", memberRows().join("|"));
  const link = p.querySelector(".exh-pn-table tbody tr a");
  check("(2) each member links to MAP", !!link && /Exhibit=MAPICI-EMT/.test(decodeURIComponent(link.getAttribute("href"))) && link.getAttribute("target") === "_blank", link && link.getAttribute("href"));
  Array.from(p.querySelectorAll(".exh-pn-table th button")).find((b) => /^Units/.test(txt(b))).click(); await settle();
  check("(2) a header sorts the members, focus kept on it", memberRows().join("|")
    === "Emergency Medical Technician (EMT) Certification|RCOE Emergency Medical Technician (HS: RCOE)|State or County EMT Certification"
    && /^Units, low to high/.test(txt(t.d.activeElement)), memberRows().join("|") + " / " + txt(t.d.activeElement));
  const more = panel(t.d).querySelector("details.exh-pn-more");
  check("(3) the rest is folded below", !!more && !more.open && /^More about this exhibit/.test(txt(more.querySelector("summary"))));
  check("(3) what each college awards, most units first, with the median", /The median articulating college awards 6 units\./.test(txt(more))
    && /Bakersfield College , 9 units: EMTC B50, 9 hours in Emergency Medical Technician/.test(txt(more))
    && txt(more).indexOf("Bakersfield") < txt(more).indexOf("Los Angeles Mission"), txt(more));
  check("(3) the issuer, the training sites and who could adopt it", /Issuer: National Registry of Emergency Medical Technicians/.test(txt(more))
    && /Training sites: Fontana High School, for any college/.test(txt(more)) && /College of San Mateo already teaches FIRE 717 \(3 units\)/.test(txt(more)), txt(more));
  // (4) another title swaps it; Close and Escape return focus to the row
  titleBtn(t.d, "CompTIA Security+").click(); await settle();
  check("(4) another title swaps the panel", txt(panel(t.d).querySelector(".exh-pn-h")) === "CompTIA Security+"
    && /MAP records no exhibit under this name/.test(txt(panel(t.d))));
  Array.from(panel(t.d).querySelectorAll("button")).find((b) => txt(b) === "Close").click(); await settle();
  check("(4) Close shuts it and returns focus to the row's title", !panel(t.d) && t.d.activeElement && txt(t.d.activeElement) === "CompTIA Security+");
  titleBtn(t.d, "Emergency Medical Technician").click(); await settle();
  panel(t.d).dispatchEvent(new t.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await settle();
  check("(4) Escape shuts it too", !panel(t.d) && txt(t.d.activeElement) === "Emergency Medical Technician");
  // (5) the Students column
  const heads = Array.from(t.d.querySelectorAll(".exh-l-table thead tr:first-child th")).map(txt);
  const si = heads.findIndex((h) => /^Students/.test(h));
  const rowOf = (ut) => Array.from(t.d.querySelectorAll(".exh-l-table tbody tr")).find((r) => r.querySelector("td[data-key]") && r.querySelector("td[data-key]").getAttribute("data-key") === ut);
  check("(5) the Students column reads the count, a suppressed one Too few", si > -1 && txt(rowOf("CompTIA Security+").children[si]) === "57"
    && txt(rowOf("Emergency Medical Technician").children[si]) === "Too few", heads.join(" | "));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
