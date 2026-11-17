// The Exhibits List's filter for the titles in the reference that MAP no longer carries, which the Commons' 622 opens
// (Sam, 2026-11-04: "the links on all surfaces should open to the filtered view of the job needed", then "I keep seeing
// those 622 mentioned but don't know what to do with them, so if you can clarify on the commons card or link"). Guards:
//   (1) #exhibits/list/left lists the credentials that still fold a title MAP no longer carries (the auditor's
//       stale_kb_entry, never an unclassified title still in MAP), and the List says how many titles and what to do;
//   (2) each panel names its titles that have left MAP and the curator's choice;
//   (3) the auditor's file is read only for this filter, and a failed read says so, never an empty list as a zero;
//   (4) the Commons card's words say what the titles are and what the job is, and its count opens this filter.
// Run from repo root: `npm test` (or `node tests/exhibits_list_left.test.js`).
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
check("the panel's CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(src.slice(src.indexOf('".exh-l-pn-h'), src.indexOf('".exh-vh'))));

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
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok(init.method && init.method !== "GET" ? {} : (/left_map_decision/.test(url) ? (opts.decisions || []) : []));
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
function window_confirm(w, yes) { w.confirm = function () { return yes; }; }

const AUDIT = { title_cards: [
  { raw_title: "EMT Basic 1998", unified_title: "Emergency Medical Technician", tags: ["stale_kb_entry"] },
  { raw_title: "EMT-B old", unified_title: "Emergency Medical Technician", tags: ["stale_kb_entry", "low_confidence_title"] },
  { raw_title: "Sec Plus", unified_title: "CompTIA Security+", tags: ["stale_kb_entry", "unclassified_in_map"] }] };
(async function () {
  const t = await boot({ hash: "#exhibits/list/left", files: { "kb/exhibit_audit/latest.json": AUDIT } });
  await settle(); await settle();
  const titles = Array.from(t.d.querySelectorAll("td.exh-l-title .exh-l-open")).map(txt).filter(Boolean);
  check("(1) ⭐ the filter lists the credentials that still fold a title MAP no longer carries", titles.join("|") === "Emergency Medical Technician", titles.join("|"));
  check("(1) the List says how many titles and what to do", /2 old local titles no MAP exhibit uses any more sit in the reference, under 1 canonical title below\. Nothing breaks while they stay\. Open one to keep each old title under its canonical title, move it to another, or remove it from that title\. The local title itself never changes\./.test(txt(t.d.body)), txt(t.d.body).slice(0, 400));
  titleBtn(t.d, "Emergency Medical Technician").click(); await settle();
  const pt = txt(panel(t.d));
  check("(2) ⭐ the panel names its titles that have left MAP and the choice", /Titles that have left MAP/.test(pt) && /EMT Basic 1998/.test(pt) && /EMT-B old/.test(pt)
    && /keep it under this title, move it to another, or remove it from this title/.test(pt) && !/retire/i.test(pt), pt.slice(0, 300));
  const reads = (x) => x.calls.filter((c) => /exhibit_audit/.test(c.url)).length;
  check("(3) the auditor's file is read once for the filter", reads(t) === 1, String(reads(t)));
  const plain = await boot({ hash: "#exhibits/list", files: { "kb/exhibit_audit/latest.json": AUDIT } });
  check("(3) and not at all without it", reads(plain) === 0, String(reads(plain)));
  const bad = await boot({ hash: "#exhibits/list/left", files: { "kb/exhibit_audit/latest.json": 404 } });
  await settle(); await settle();
  check("(3) a failed read says so", /kb\/exhibit_audit\/latest\.json answered 404, so this filter shows nothing/.test(txt(bad.d.body)));
  const CM = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
  const ex = CM.rows.find((r) => r.key === "exhibit"), left = (ex.issues || []).find((i) => /no MAP exhibit uses any more/.test(i.words));
  check("(4) ⭐ the Commons card says what the titles are and what to do, and its count opens the filter", !!left && left.open === "#exhibits/list/left"
    && /nothing breaks while they stay; retire each, or keep one a college may enter again/.test(left.words), left && JSON.stringify(left));

  // (5) S678, COBIx's item 2 on #3464: act on each old title from its row, the split, the labels and the guard.
  const LMAP = { schema: 1, counts: {}, titles: {
      "EMT Basic 1998": { canonical: "Emergency Medical Technician", type: "Credit By Exam", group: "graded", used: false, where: [], twin: { title: "EMT Card", how: "already under the same title" }, reviewed: false, only_local: false },
      "EMT-B old": { canonical: "Emergency Medical Technician", type: "Industry Certification", group: "cert", used: false, where: [], twin: null, reviewed: false, only_local: true },
      "EMT Reviewed": { canonical: "Emergency Medical Technician", type: "Industry Certification", group: "cert", used: true, where: ["course-credit listing"], twin: null, reviewed: true, only_local: false } },
    canonicals: { "Emergency Medical Technician": { type: "Credit By Exam and Industry Certification (mixed)", group: "mixed" },
      "CompTIA Security+": { type: "Industry Certification", group: "cert" }, "Paramedic": { type: "Credit By Exam", group: "graded" } } };
  const AUD3 = { title_cards: AUDIT.title_cards.concat([{ raw_title: "EMT Reviewed", unified_title: "Emergency Medical Technician", tags: ["stale_kb_entry"] }]) };
  const a = await boot({ hash: "#exhibits/list/left", signedIn: true, files: { "kb/exhibit_audit/latest.json": AUD3, "kb/exhibit_left_map.json": LMAP } });
  await settle(); await settle();
  const sum = a.d.querySelector("[data-left-summary]");
  check("(5) ⭐ the split: nothing points to it, still used somewhere, already reviewed by you", /Nothing points to it: 2\. Still used somewhere: 1 .*Already reviewed by you: 1, settled/.test(txt(sum)), txt(sum));
  const bk = a.d.querySelector('[data-left-bulk="keep"]'), br = a.d.querySelector('[data-left-bulk="remove"]');
  check("(5) bulk Keep is offered for the titles with a live twin, bulk Remove only for those with none, and the Remove confirm counts the lonely ones",
    bk && /Keep all 1 under their title/.test(txt(bk)) && br && /Remove all 1 from their title/.test(txt(br)) && br.getAttribute("data-left-lonely") === "1");
  titleBtn(a.d, "Emergency Medical Technician").click(); await settle();
  const rows = Array.from(panel(a.d).querySelectorAll("[data-left-raw]"));
  const rowOf = (raw) => rows.find((x) => x.getAttribute("data-left-raw") === raw);
  check("(5) ⭐ each old title shows its CPL type and its twin, and the canonical its own type", /\(Credit By Exam\)/.test(txt(rowOf("EMT Basic 1998"))) && /Still in MAP: EMT Card/.test(txt(rowOf("EMT Basic 1998")))
    && /CPL type: Credit By Exam and Industry Certification \(mixed\)/.test(txt(panel(a.d))));
  check("(5) ⭐ a title Sam reviewed shows no buttons", rowOf("EMT Reviewed") && !rowOf("EMT Reviewed").querySelector("button") && /Reviewed by you, settled/.test(txt(rowOf("EMT Reviewed"))));
  check("(5) the three buttons are words, none says retire", ["keep", "move", "remove"].every((k) => rowOf("EMT Basic 1998").querySelector('[data-left-act="' + k + '"]'))
    && !/retire|stale|fold/i.test(txt(rowOf("EMT Basic 1998").querySelector(".exh-left-acts"))));
  window_confirm(a.w, true);
  rowOf("EMT Basic 1998").querySelector('[data-left-act="keep"]').click(); await settle(); await settle();
  const post = a.calls.filter((c) => c.method === "POST" && /kb_curation/.test(c.url)).pop();
  check("(5) ⭐ Keep writes one _LEFT_MAP:: decision, never an unclassified assignment or a local-title edit", post && post.body.length === 1 && post.body[0].course_id === "_LEFT_MAP::EMT Basic 1998"
    && post.body[0].field === "left_map_decision" && post.body[0].value === "keep", post && JSON.stringify(post.body));
  check("(5) ⭐ the count drops by one at once", a.d.querySelector("[data-left-count]") && a.d.querySelector("[data-left-count]").getAttribute("data-left-count") === "2");
  // A decision saved earlier today: the title is gone on reload.
  const r2 = await boot({ hash: "#exhibits/list/left", files: { "kb/exhibit_audit/latest.json": AUD3, "kb/exhibit_left_map.json": LMAP },
    decisions: [{ course_id: "_LEFT_MAP::EMT-B old", value: "removed" }] });
  await settle(); await settle();
  check("(5) ⭐ a decision saved today drops the title on reload (the live read)", r2.d.querySelector("[data-left-count]") && r2.d.querySelector("[data-left-count]").getAttribute("data-left-count") === "2");
  // Move across Sam's two groups is blocked on the first try; a second try goes through and is logged.
  const m = await boot({ hash: "#exhibits/list/left", signedIn: true, files: { "kb/exhibit_audit/latest.json": AUD3, "kb/exhibit_left_map.json": LMAP } });
  await settle(); await settle();
  titleBtn(m.d, "Emergency Medical Technician").click(); await settle();
  const mrow = () => Array.from(panel(m.d).querySelectorAll("[data-left-raw]")).find((x) => x.getAttribute("data-left-raw") === "EMT-B old");
  mrow().querySelector('[data-left-act="move"]').click(); await settle();
  const q = mrow().querySelector(".exh-left-q"); q.value = "Paramedic";
  mrow().querySelector("[data-left-go]").click(); await settle();
  const posts = () => m.calls.filter((c) => c.method === "POST" && /kb_curation/.test(c.url));
  check("(5) ⭐ a cert-based title moved under a graded canonical is blocked on the first try, in plain words", posts().length === 0 && /Blocked: EMT-B old is cert-based .* Paramedic is graded/.test(txt(mrow())), txt(mrow()));
  mrow().querySelector("[data-left-go]").click(); await settle(); await settle();
  const mp = posts().pop();
  check("(5) ⭐ the second try moves it, link only, and logs the override", mp && mp.body.some((x) => x.field === "left_map_decision" && x.value === "moved:Paramedic")
    && mp.body.some((x) => x.field === "cpl_type_group_override" && /cert into graded/.test(x.value)) && !mp.body.some((x) => /^_UNCLASSIFIED::|^_CREDENTIAL_REVIEW::/.test(x.course_id)), mp && JSON.stringify(mp.body));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
