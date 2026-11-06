// The Exhibits List names each row's CPL-AI pairs (SkyLantern, 2026-11-06; Sam: "go ahead and have the Exhibits List row
// name its CPL-AI pairs"). Guards:
//   (1) a row joined to CPL-AI says so under its title: the certification, its pairs, the colleges holding a Strong
//       evidence course; a related join says "related";
//   (2) the certification's name opens the CPL-AI recommendations view on it;
//   (3) #exhibits/list/cplai lists only the joined rows, and the search finds a row by its CPL-AI certification;
//   (4) a failed read of the join leaves the List standing, with no CPL-AI line and the filter uncounted;
//   (5) the committed join file carries by_exhibit, and every exhibit it names is in the reference or a committed plan.
// Built on tests/exhibits_list_left.test.js's harness. Run from repo root: `npm test`.
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
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (Object.prototype.hasOwnProperty.call(files, url)) return files[url] === 404 ? bad(404) : ok(files[url]);
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(opts.signedIn ? { access_token: "t", email: "reviewer@example.org" } : null); },
    authHeaders: function () { return { apikey: "anon" }; } };
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

const JOIN = { by_exhibit: {
  "CompTIA Security+": [{ code: "comptia14", title: "CompTIA Security+", kind: "exact", pairs: 343, strong: 211, strong_colleges: 98 }],
  "Emergency Medical Technician": [{ code: "x1", title: "Some Related Cert", kind: "related", pairs: 12, strong: 1, strong_colleges: 1 },
    { code: "x2", title: "Another Related Cert", kind: "related", pairs: 3, strong: 0, strong_colleges: 0 }] } };
const CPLAI_INDEX = { page: "https://map.rccd.edu/CPL-AI/", fetched_at: "2026-11-06T18:08:00Z", credit: "c", caveat: "v",
  tiers: { "1": "Strong evidence", "2": "Faculty interpretation", "3": "Limited evidence" },
  counts: { pairs: 1, reports: 1, certifications: 1, colleges: 1, courses: 1, by_tier: { "1": 1, "2": 0, "3": 0 } },
  colleges: ["Alpha College"], credentials: [{ code: "comptia14", file: "comptia14.json.gz", title: "CompTIA Security+", pairs: 1, by_tier: { "1": 1, "2": 0, "3": 0 }, colleges: 1, courses: 1, disciplines: [], by_college: { "0": [1, 0, 0] } }] };
function rowFor(d, t) { return Array.from(d.querySelectorAll("tr")).find((tr) => { const b = tr.querySelector("td.exh-l-title .exh-l-open"); return b && txt(b) === t; }); }
(async function () {
  const files = { "kb/cpl_ai/exhibit_join.json": JOIN, "kb/cpl_ai/hosted/index.json": CPLAI_INDEX };
  let t = await boot({ hash: "#exhibits/list", files: files });
  await settle(); await settle();
  const sec = rowFor(t.d, "CompTIA Security+"), emt = rowFor(t.d, "Emergency Medical Technician");
  const line = sec && sec.querySelector(".exh-l-cai");
  const lb = line && line.querySelector("button");
  check("(1) a joined row's line is short enough for the title column, the full sentence in its title", lb && txt(lb) === "CPL-AI, 343 pairs"
    && lb.title === "CompTIA Security+: 343 pairs, 98 colleges hold a Strong evidence course", txt(line) + " | " + (lb && lb.title));
  const eb = emt && emt.querySelector(".exh-l-cai button");
  check("(1) several certifications are counted, and a related join says related", eb && txt(eb) === "CPL-AI, 2 certifications, 15 pairs, related"
    && /Some Related Cert \(a related certification\): 12 pairs/.test(eb.title) && /Another Related Cert/.test(eb.title), eb && txt(eb));
  t.w.CPL_TABS.loadScript = (function (orig) { return function (s, name, cb) {
    if (s === "exhibits_cpl_ai.js") { const e = t.d.createElement("script"); e.textContent = fs.readFileSync("exhibits_cpl_ai.js", "utf8"); t.d.body.appendChild(e); }
    return orig(s, name, cb); }; })(t.w.CPL_TABS.loadScript);
  t.d.querySelector("td.exh-l-title .exh-l-open") && rowFor(t.d, "CompTIA Security+").querySelector("td.exh-l-title .exh-l-open").click(); await settle();
  const pn = t.d.getElementById("exh-l-panel");
  check("(1) the side panel spells out each certification", pn && /CPL-AI recommendations/.test(txt(pn))
    && /CompTIA Security\+ : 343 pairs, 211 with Strong evidence; 98 colleges hold a Strong evidence course\./.test(txt(pn)), txt(pn).slice(0, 400));
  line.querySelector("button").click(); await settle(); await settle();
  check("(2) the certification's name opens the CPL-AI view on it", /^CPL-AI recommendations/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]')))
    && t.w.CPL_EXHIBITS_CPLAI && t.w.CPL_EXHIBITS_CPLAI.address() === "exhibits/cpl-ai/comptia14", txt(t.d.querySelector(".exh-views")));
  t = await boot({ hash: "#exhibits/list", files: files });
  await settle(); await settle();
  t.w.CPL_TABS.loadScript = (function (orig) { return function (s, name, cb) {
    if (s === "exhibits_cpl_ai.js") { const e = t.d.createElement("script"); e.textContent = fs.readFileSync("exhibits_cpl_ai.js", "utf8"); t.d.body.appendChild(e); }
    return orig(s, name, cb); }; })(t.w.CPL_TABS.loadScript);
  rowFor(t.d, "Emergency Medical Technician").querySelector(".exh-l-cai button").click(); await settle(); await settle();
  check("(2) several certifications open the CPL-AI list searched to the exhibit", t.w.CPL_EXHIBITS_CPLAI
    && t.w.CPL_EXHIBITS_CPLAI._state.q === "Emergency Medical Technician" && t.w.CPL_EXHIBITS_CPLAI.address() === "exhibits/cpl-ai");
  t = await boot({ hash: "#exhibits/list/cplai", files: files });
  await settle(); await settle();
  const shown = Array.from(t.d.querySelectorAll("td.exh-l-title .exh-l-open")).map(txt).filter(Boolean).sort();
  check("(3) the CPL-AI filter lists only the joined rows", shown.join("|") === "CompTIA Security+|Emergency Medical Technician", shown.join("|"));
  t = await boot({ hash: "#exhibits/list", files: files });
  await settle(); await settle();
  const q = t.d.querySelector("input.exh-search, input[type=search]");
  q.value = "Another Related Cert"; q.dispatchEvent(new t.w.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400)); await settle();
  const found = Array.from(t.d.querySelectorAll("td.exh-l-title .exh-l-open")).map(txt).filter(Boolean);
  check("(3) the List's search finds a row by its CPL-AI certification", found.join("|") === "Emergency Medical Technician", found.join("|"));
  t = await boot({ hash: "#exhibits/list", files: { "kb/cpl_ai/exhibit_join.json": 404 } });
  await settle();
  check("(4) a failed read leaves the List standing with no CPL-AI line", rowFor(t.d, "CompTIA Security+") && !t.d.querySelector(".exh-l-cai"));
  const j = JSON.parse(fs.readFileSync("kb/cpl_ai/exhibit_join.json", "utf8"));
  check("(5) the committed join carries by_exhibit", j.by_exhibit && j.by_exhibit["CompTIA Security+"] && j.by_exhibit["CompTIA Security+"][0].code === "comptia14");
  const out = require("child_process").spawnSync("python3", ["kb/_build_cpl_ai_join.py", "--check"], { encoding: "utf8" });
  check("(5) the join is current: " + (out.stdout || out.stderr).trim(), out.status === 0);

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] ? "" : "  — " + (r[2] || ""))));
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
