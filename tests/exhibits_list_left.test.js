// The Exhibits List's filter for the titles in the reference that MAP no longer carries, which the Commons' 622 opens
// (Sam, 2026-11-04: "the links on all surfaces should open to the filtered view of the job needed", then "I keep seeing
// those 622 mentioned but don't know what to do with them, so if you can clarify on the commons card or link"). Guards:
//   (1) #exhibits/list/left lists the credentials that still fold a title MAP no longer carries (the auditor's
//       stale_kb_entry, never an unclassified title still in MAP), and the List says how many titles and what to do;
//   (2) each panel names its titles that have left MAP and the curator's choice;
//   (3) the auditor's file is read only for this filter, and a failed read says so, never an empty list as a zero;
//   (4) the Commons card's words say what the titles are and what the job is, and its count opens this filter;
//   (5) Keep, Move and Remove on each old title's link, the split and the graded and cert-based guard on Move (S678);
//   (6) Rename and Combine on the leftover row act on the canonical title through the List's own Edit and Accept, and
//       the guard covers Combine (S679);
//   (7) the guard reads a pending rename's chain, and Move and Remove only where nothing uses the title;
//   (8) one choke point writes every fold: the List's Accept, Combine and Re-point, guarded on the title the write lands on;
//   (9) the guard fails closed: an unread types file holds the fold and a retry fetches the file again; a title with no
//       CPL type recorded along its chain asks on the first press and writes on the second, logged with the reason "CPL
//       type not recorded"; and the second press that overrides the guard is armed per surface and per pair;
//   (10) the two-step case: a Rename onto an existing title of the other group, then the Common Exhibit Reference tab's
//       Confirm merge, which reads the same guard (combine_guard.js).
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
const GSRC = fs.readFileSync("combine_guard.js", "utf8");
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
    if (Object.prototype.hasOwnProperty.call(files, url)) {
      // A file given as a function is read at each fetch, so a test can make it answer 404 first and load later.
      const v = typeof files[url] === "function" ? files[url]() : files[url];
      return v === 404 ? bad(404) : ok(v);
    }
    if (/\/rest\/v1\/kb_curation/.test(url) && /_CREDENTIAL_REVIEW/.test(url) && (!init.method || init.method === "GET")) return ok(opts.overlay || []);
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
  require("./lib/combine_guard_env.js").install(w, 404);
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
  // Move under a canonical title with no CPL type recorded asks on the first try and logs on the second.
  const LMAPM = JSON.parse(JSON.stringify(LMAP)); LMAPM.canonicals["Unrecorded Course"] = { type: "CPL type not recorded", group: "" };
  const mu = await boot({ hash: "#exhibits/list/left", signedIn: true, files: { "kb/exhibit_audit/latest.json": AUD3, "kb/exhibit_left_map.json": LMAPM } });
  await settle(); await settle();
  titleBtn(mu.d, "Emergency Medical Technician").click(); await settle();
  const murow = () => Array.from(panel(mu.d).querySelectorAll("[data-left-raw]")).find((x) => x.getAttribute("data-left-raw") === "EMT-B old");
  murow().querySelector('[data-left-act="move"]').click(); await settle();
  const muOpt = Array.from(murow().querySelectorAll("option")).find((o) => o.value === "Unrecorded Course");
  murow().querySelector(".exh-left-q").value = "Unrecorded Course";
  murow().querySelector("[data-left-go]").click(); await settle();
  const muPosts = () => mu.calls.filter((c) => c.method === "POST" && /kb_curation/.test(c.url));
  check("(5) ⭐ a move under a canonical with no CPL type recorded asks on the first try, with nothing written, and the list names the untyped title",
    muOpt && /CPL type not recorded/.test(muOpt.getAttribute("label")) && muPosts().length === 0
    && /Unrecorded Course has no CPL type recorded, so this combine could join graded and cert-based records\. Press again to combine\./.test(txt(murow())), txt(murow()));
  murow().querySelector("[data-left-go]").click(); await settle(); await settle();
  const mup = muPosts().pop();
  check("(5) ⭐ the second try moves it and logs the override with the reason CPL type not recorded",
    mup && mup.body.some((x) => x.field === "left_map_decision" && x.value === "moved:Unrecorded Course")
    && mup.body.some((x) => x.field === "cpl_type_group_override" && x.value === "move with CPL type not recorded (Unrecorded Course): EMT-B old -> Unrecorded Course"), mup && JSON.stringify(mup.body));

  // (6) S679, the lane's NEXT 2: Rename and Combine on the leftover row act on the canonical title through the List's
  //     own title Edit (listCellSave) and Accept (listSuggestAccept), and the graded and cert-based guard covers Combine.
  const postsOf = (x) => x.calls.filter((c) => c.method === "POST" && /kb_curation/.test(c.url)).map((c) => c.body);
  const rowIn = (x, raw) => Array.from(panel(x.d).querySelectorAll("[data-left-raw]")).find((e) => e.getAttribute("data-left-raw") === raw);
  async function openLeft(lmap) {
    const x = await boot({ hash: "#exhibits/list/left", signedIn: true, files: { "kb/exhibit_audit/latest.json": AUD3, "kb/exhibit_left_map.json": lmap || LMAP } });
    await settle(); await settle();
    titleBtn(x.d, "Emergency Medical Technician").click(); await settle();
    return x;
  }
  const rn = await openLeft();
  const acts = rowIn(rn, "EMT Basic 1998").querySelector(".exh-left-acts");
  const bRen = acts.querySelector('[data-left-act="rename"]'), bCom = acts.querySelector('[data-left-act="combine"]');
  check("(6) ⭐ the leftover row offers Rename and Combine as underlined words on the canonical title, never a glyph",
    bRen && bCom && bRen.tagName === "BUTTON" && bCom.tagName === "BUTTON" && bRen.classList.contains("exh-w") && bCom.classList.contains("exh-w")
    && txt(bRen) === "Rename the canonical title" && txt(bCom) === "Combine the canonical title with another"
    && /^[A-Za-z ]+$/.test(txt(bRen) + txt(bCom)) && bRen.getAttribute("aria-expanded") === "false"
    && /Emergency Medical Technician/.test(bRen.getAttribute("aria-label")) && /Emergency Medical Technician/.test(bCom.getAttribute("aria-label")),
    acts && acts.outerHTML.slice(0, 400));
  check("(6) a title Sam reviewed still shows no buttons", !rowIn(rn, "EMT Reviewed").querySelector("button"));
  bRen.click(); await settle();
  const rbox = rowIn(rn, "EMT Basic 1998").querySelector('[data-left-box="rename"]');
  const rin = rbox && rbox.querySelector("input");
  check("(6) Rename opens a labeled box holding the canonical title's name", rin && rin.value === "Emergency Medical Technician" && /canonical title Emergency Medical Technician/.test(rin.getAttribute("aria-label"))
    && rowIn(rn, "EMT Basic 1998").querySelector('[data-left-act="rename"]').getAttribute("aria-expanded") === "true");
  rin.value = "Emergency Medical Technician (EMT)";
  rbox.querySelector('[data-left-go="rename"]').click(); await settle(); await settle();
  const rpost = postsOf(rn);
  check("(6) ⭐ Rename saves the canonical title's rename the way the List's Edit does, and never touches the local title or its link",
    rpost.length === 1 && rpost[0].course_id === "_CREDENTIAL_REVIEW::Emergency Medical Technician" && rpost[0].field === "unified_title_override"
    && rpost[0].value === "Emergency Medical Technician (EMT)" && !rpost.some((b) => /^_LEFT_MAP::|^_UNCLASSIFIED::/.test(b.course_id || "")), JSON.stringify(rpost));
  check("(6) the row says what the rename did", /Renamed: Emergency Medical Technician is saved as Emergency Medical Technician \(EMT\)/.test(txt(panel(rn.d))), txt(panel(rn.d)).slice(0, 600));

  // (10) S679, the two-step case: Rename saves a canonical title's new name with no merge, even when the name is an
  //      existing title of the other group; the Common Exhibit Reference tab's Confirm merge then reads the same guard,
  //      so the two steps together cannot combine graded and cert-based titles without the second press and its logged
  //      override.
  const by = await openLeft();
  rowIn(by, "EMT Basic 1998").querySelector('[data-left-act="rename"]').click(); await settle();
  const bybox = rowIn(by, "EMT Basic 1998").querySelector('[data-left-box="rename"]');
  bybox.querySelector("input").value = "Paramedic";
  bybox.querySelector('[data-left-go="rename"]').click(); await settle(); await settle();
  const step1 = postsOf(by);
  check("(10) step one: Rename onto an existing graded title saves the rename alone, no merge confirm",
    step1.length === 1 && step1[0].field === "unified_title_override" && step1[0].value === "Paramedic", JSON.stringify(step1));
  const cer = require("./lib/cer_harness.js");
  const cerRec = (ut) => ({ ut: ut, raw_count: 1, conf_title: 0.9, issuer: "National Registry", cpl_types: [], audit_tags: {}, audit_tag_total: 0, articulations: [] });
  const tab = await cer.boot({ payload: { _generated_at: "t", top_categories: {}, unified_titles: [cerRec("Emergency Medical Technician"), cerRec("Paramedic")] },
    overlay: step1.map((b) => Object.assign({ reviewer_email: "reviewer@example.org", reviewed_at: "2026-11-17T16:00:00Z" }, b)), types: LMAP });
  const { cerLane } = require("./_cer_views");
  cerLane(tab.doc, /Merge/).click(); await cer.sleep(60);
  const mgRow = tab.doc.querySelector('.cr-mg-row[data-ut="Emergency Medical Technician"]');
  if (mgRow) { mgRow.querySelector(".cr-mg-confirm").click(); await cer.sleep(60); }
  check("(10) ⭐ step two: the Common Exhibit Reference's Confirm merge blocks the combine the rename set up, with nothing written",
    mgRow && tab.writes.length === 0 && /^Blocked: Emergency Medical Technician is a mix of graded and cert-based types and the fold lands on Paramedic, which is graded/.test(txt(mgRow.querySelector(".cr-guard-note"))),
    mgRow ? txt(mgRow) : "no pending merge row");
  if (mgRow) { mgRow.querySelector(".cr-mg-confirm").click(); await cer.sleep(60); }
  const step2 = tab.writes.map((w) => w.body);
  check("(10) ⭐ pressed again, the merge is written with the override logged beside it",
    step2.length === 3 && step2.some((b) => b.field === "unified_title_merge_confirm" && b.value === "Paramedic")
    && step2.some((b) => b.field === "cpl_type_group_override" && b.value === "combine across groups: mixed into graded: Emergency Medical Technician -> Paramedic"), JSON.stringify(step2));

  // Combine across Sam's two groups: the canonical is a mix and Paramedic is graded, so the first try is blocked.
  const cm = await openLeft();
  rowIn(cm, "EMT Basic 1998").querySelector('[data-left-act="combine"]').click(); await settle();
  const cbox = () => rowIn(cm, "EMT Basic 1998").querySelector('[data-left-box="combine"]');
  check("(6) Combine opens a search over the other canonical titles, each with its CPL type", cbox() && Array.from(cbox().querySelectorAll("option")).map((o) => o.value).join("|") === "CompTIA Security+|Paramedic"
    && /Paramedic \(Credit By Exam\)/.test(Array.from(cbox().querySelectorAll("option")).map((o) => o.getAttribute("label")).join("|")));
  cbox().querySelector("input").value = "Paramedic";
  cbox().querySelector('[data-left-go="combine"]').click(); await settle(); await settle();
  check("(6) ⭐ a combine across graded and cert-based is blocked on the first try, in plain words, with nothing written",
    postsOf(cm).length === 0 && /Blocked: Emergency Medical Technician is a mix of graded and cert-based types and the fold lands on Paramedic, which is graded .*Press Combine here again to combine them anyway; that override is logged\./.test(txt(cbox())), txt(cbox()));
  cbox().querySelector('[data-left-go="combine"]').click(); await settle(); await settle();
  const cpost = postsOf(cm), cf = (f) => cpost.find((b) => b.field === f);
  check("(6) ⭐ the second try writes the List's Accept pair on the canonical and logs the override",
    cpost.length === 3 && cf("unified_title_override") && cf("unified_title_override").value === "Paramedic" && cf("unified_title_merge_confirm") && cf("unified_title_merge_confirm").value === "Paramedic"
    && cpost.every((b) => b.course_id === "_CREDENTIAL_REVIEW::Emergency Medical Technician")
    && cf("cpl_type_group_override") && /combine across groups: mixed into graded: Emergency Medical Technician -> Paramedic/.test(cf("cpl_type_group_override").value), JSON.stringify(cpost));
  check("(6) the row says what the combine did", /Saved: Emergency Medical Technician folds into Paramedic\./.test(txt(panel(cm.d))), txt(panel(cm.d)).slice(0, 600));

  // Combine inside one group goes through on the first try and logs nothing.
  const LMAP_CERT = JSON.parse(JSON.stringify(LMAP));
  LMAP_CERT.canonicals["Emergency Medical Technician"] = { type: "Industry Certification", group: "cert" };
  const cc = await openLeft(LMAP_CERT);
  rowIn(cc, "EMT Basic 1998").querySelector('[data-left-act="combine"]').click(); await settle();
  const cbox2 = rowIn(cc, "EMT Basic 1998").querySelector('[data-left-box="combine"]');
  cbox2.querySelector("input").value = "CompTIA Security+";
  cbox2.querySelector('[data-left-go="combine"]').click(); await settle(); await settle();
  const c2 = postsOf(cc);
  check("(6) ⭐ a combine inside one group goes through on the first try and logs no override",
    c2.length === 2 && c2.every((b) => b.field !== "cpl_type_group_override") && c2.some((b) => b.field === "unified_title_merge_confirm" && b.value === "CompTIA Security+"), JSON.stringify(c2));
  check("(6) Combine and Rename reuse the List's handlers rather than a copy",
    /function leftCombineBox[\s\S]*?foldWrite\(r, to,/.test(src) && /function leftRenameBox[\s\S]*?listCellSave\(r, "title", inp, "Title"\)/.test(src)
    && !/combine across groups: /.test(src) && (GSRC.match(/combine across groups: /g) || []).length === 1);

  // (7) S679, the second reader's blocker: the guard reads the picked title before its chain of saved renames. A pending
  //     rename names a title the map does not hold yet ("Paramedic (Advanced)"), so a guard that read only the chain's
  //     end found no type and let a cert-based canonical combine into graded Paramedic on one press.
  const LMAP7 = { schema: 1, counts: {}, titles: {
      "EMT Basic 1998": { canonical: "Emergency Medical Technician", type: "Industry Certification", group: "cert", used: false, where: [], twin: null, reviewed: false, only_local: false },
      "EMT Used": { canonical: "Emergency Medical Technician", type: "Industry Certification", group: "cert", used: true, where: ["course-credit listing"], twin: null, reviewed: false, only_local: false } },
    canonicals: { "Emergency Medical Technician": { type: "Industry Certification", group: "cert" },
      "CompTIA Security+": { type: "Industry Certification", group: "cert" }, "Paramedic": { type: "Credit By Exam", group: "graded" } } };
  const AUD7 = { title_cards: [{ raw_title: "EMT Basic 1998", unified_title: "Emergency Medical Technician", tags: ["stale_kb_entry"] },
    { raw_title: "EMT Used", unified_title: "Emergency Medical Technician", tags: ["stale_kb_entry"] }] };
  const PENDING = [{ course_id: "_CREDENTIAL_REVIEW::Paramedic", field: "unified_title_override", value: "Paramedic (Advanced)", reviewed_at: "2026-11-17T00:00:00Z" }];
  async function bootPending() {
    const x = await boot({ hash: "#exhibits/list/left", signedIn: true, overlay: PENDING, files: { "kb/exhibit_audit/latest.json": AUD7, "kb/exhibit_left_map.json": LMAP7 } });
    await settle(); await settle();
    return x;
  }
  const bp = await bootPending();
  titleBtn(bp.d, "Emergency Medical Technician").click(); await settle();
  rowIn(bp, "EMT Basic 1998").querySelector('[data-left-act="combine"]').click(); await settle();
  const bbox = () => rowIn(bp, "EMT Basic 1998").querySelector('[data-left-box="combine"]');
  bbox().querySelector("input").value = "Paramedic";
  bbox().querySelector('[data-left-go="combine"]').click(); await settle(); await settle();
  check("(7) ⭐ Combine into a title whose pending rename the map does not hold yet is still blocked on the first try, with nothing written",
    postsOf(bp).length === 0 && /Blocked: Emergency Medical Technician is cert-based .* and the fold lands on Paramedic \(Advanced\) \(Paramedic is saved to become Paramedic \(Advanced\)\), which is graded .*, the type of Paramedic/.test(txt(bbox())), txt(bbox()) + " | " + JSON.stringify(postsOf(bp)));
  if (bbox()) { bbox().querySelector('[data-left-go="combine"]').click(); await settle(); await settle(); }
  const bpost = postsOf(bp);
  check("(7) the second try folds into the chain's end and logs the override",
    bpost.some((b) => b.field === "unified_title_merge_confirm" && b.value === "Paramedic (Advanced)")
    && bpost.some((b) => b.field === "cpl_type_group_override" && /cert into graded/.test(b.value)), JSON.stringify(bpost));
  // The conductor's call (S679): Move only where nothing uses the title, the same limit Remove has.
  const ua = rowIn(bp, "EMT Used") && rowIn(bp, "EMT Used").querySelector(".exh-left-acts");
  check("(7) ⭐ a leftover title still used somewhere offers Keep, Rename and Combine, and neither Move nor Remove",
    ua && ua.querySelector('[data-left-act="keep"]') && !ua.querySelector('[data-left-act="move"]') && !ua.querySelector('[data-left-act="remove"]')
    && ua.querySelector('[data-left-act="combine"]'), ua && txt(ua));
  check("(7) a title nothing uses still offers Move and Remove", rowIn(bp, "EMT Basic 1998").querySelector('[data-left-act="move"]') && rowIn(bp, "EMT Basic 1998").querySelector('[data-left-act="remove"]'));

  // (8) S679, the third round on the graded and cert-based guard: one choke point, foldWrite, writes every fold, and the
  //     guard reads the title the write lands on (the end of the picked title's chain of saved renames, by the resolver the
  //     write uses) and its type, else the last typed title along the chain. Each case presses the real buttons.
  const CAN8 = { "Emergency Medical Technician": { type: "Industry Certification", group: "cert" },
    "CompTIA Security+": { type: "Industry Certification", group: "cert" }, "CompTIA Network+": { type: "Industry Certification", group: "cert" },
    "Paramedic": { type: "Credit By Exam", group: "graded" } };
  const LMAP8 = { schema: 1, counts: {}, titles: {
    "EMT Basic 1998": { canonical: "Emergency Medical Technician", type: "Industry Certification", group: "cert", used: false, where: [], twin: null, reviewed: false, only_local: false } },
    canonicals: CAN8 };
  const AUD8 = { title_cards: [{ raw_title: "EMT Basic 1998", unified_title: "Emergency Medical Technician", tags: ["stale_kb_entry"] }] };
  const ren = (a, b) => ({ course_id: "_CREDENTIAL_REVIEW::" + a, field: "unified_title_override", value: b, reviewed_at: "2026-11-17T00:00:00Z" });
  const mc = (a, b) => ({ course_id: "_CREDENTIAL_REVIEW::" + a, field: "unified_title_merge_confirm", value: b, reviewed_at: "2026-11-17T00:00:00Z" });
  const fieldOf = (bodies, f) => bodies.filter((b) => b.field === f);
  // The leftover row's Combine: pick a title and press Combine here; `again` presses it a second time.
  async function combine8(ov, pick, again) {
    const x = await boot({ hash: "#exhibits/list/left", signedIn: true, overlay: ov, files: { "kb/exhibit_audit/latest.json": AUD8, "kb/exhibit_left_map.json": LMAP8 } });
    await settle(); await settle();
    titleBtn(x.d, "Emergency Medical Technician").click(); await settle();
    const row = () => rowIn(x, "EMT Basic 1998");
    row().querySelector('[data-left-act="combine"]').click(); await settle();
    const box = () => row().querySelector('[data-left-box="combine"]');
    box().querySelector("input").value = pick;
    box().querySelector('[data-left-go="combine"]').click(); await settle(); await settle();
    const first = { posts: postsOf(x).slice(), words: box() ? txt(box()) : txt(panel(x.d)) };
    if (again && box()) { box().querySelector('[data-left-go="combine"]').click(); await settle(); await settle(); }
    return { first: first, posts: postsOf(x), words: txt(panel(x.d)) };
  }
  // The regular List's Accept on a suggested fold, from commons_list.js's own button.
  async function accept8(ov, sugTo, again) {
    const AIS = { schema: 1, groups: [], order: {}, counts: { suggested_folds: 1 }, suggest: { "Emergency Medical Technician": { to: sugTo, why: "spelled another way" } } };
    const x = await boot({ hash: "#exhibits/list", signedIn: true, overlay: ov, files: { "kb/exhibit_audit/latest.json": AUD8, "kb/exhibit_left_map.json": LMAP8, "kb/exhibits_ai_sort.json": AIS } });
    await settle(); await settle();
    const ed = x.d.getElementById("exh-l-editall"); if (ed) { ed.click(); await settle(); }
    const sf = Array.from(x.d.querySelectorAll("button")).find((b) => /^Suggested folds/.test(txt(b))); if (sf) { sf.click(); await settle(); }
    const btn = () => Array.from(x.d.querySelectorAll("button")).find((b) => txt(b) === "Accept" && /Emergency Medical Technician/.test(b.getAttribute("aria-label") || ""));
    if (!btn()) return { found: false, posts: [], words: "", line: "" };
    const line = txt(btn().parentNode), label = btn().getAttribute("aria-label");
    btn().click(); await settle(); await settle();
    const note = () => txt(x.d.getElementById("exh-l-cellnote"));
    const first = { posts: postsOf(x).slice(), words: note() };
    if (again && btn()) { btn().click(); await settle(); await settle(); }
    return { found: true, line: line, label: label, first: first, posts: postsOf(x), words: note() };
  }
  // (a) The List's Accept on a suggestion to graded Paramedic while Paramedic has a pending rename to a title the map
  //     does not hold: blocked, the words name where the fold lands and the type it carries; a second press logs it.
  const a8 = await accept8([ren("Paramedic", "Paramedic (Advanced)")], "Paramedic", true);
  check("(8a) the List shows the suggestion's landing title, in its line and its Accept label",
    a8.found && /Suggested: fold into Paramedic \(Advanced\)/.test(a8.line) && a8.label === "Fold Emergency Medical Technician into Paramedic (Advanced)", a8.line + " | " + a8.label);
  check("(8a) ⭐ the List's Accept into Paramedic, whose pending rename lands on Paramedic (Advanced), is blocked with nothing written",
    a8.found && a8.first.posts.length === 0 && /Blocked: Emergency Medical Technician is cert-based .* and the fold lands on Paramedic \(Advanced\) \(Paramedic is saved to become Paramedic \(Advanced\)\), which is graded \(Credit By Exam or Portfolio Review\), the type of Paramedic, since Paramedic \(Advanced\) has no CPL type of its own\. .*Accept again to combine them anyway/.test(a8.first.words),
    a8.first.words + " | " + JSON.stringify(a8.first.posts));
  check("(8a) a second Accept writes the fold onto the landing title and logs the override",
    fieldOf(a8.posts, "unified_title_merge_confirm").some((b) => b.value === "Paramedic (Advanced)") && fieldOf(a8.posts, "unified_title_override").some((b) => b.value === "Paramedic (Advanced)")
    && fieldOf(a8.posts, "cpl_type_group_override").some((b) => b.value === "combine across groups: cert into graded: Emergency Medical Technician -> Paramedic (Advanced)"), JSON.stringify(a8.posts));
  // (b) A cert-based picked title whose pending rename lands on graded Paramedic: blocked, the words name Paramedic.
  const b8 = await combine8([ren("CompTIA Security+", "Paramedic")], "CompTIA Security+");
  check("(8b) ⭐ Combine into cert-based CompTIA Security+, whose pending rename lands on graded Paramedic, is blocked with nothing written",
    b8.first.posts.length === 0 && /Blocked: Emergency Medical Technician is cert-based .* and the fold lands on Paramedic \(CompTIA Security\+ is saved to become Paramedic\), which is graded \(Credit By Exam or Portfolio Review\)\. Sam's rule/.test(b8.first.words), b8.first.words);
  const b8l = await accept8([ren("CompTIA Security+", "Paramedic")], "CompTIA Security+");
  check("(8b) the List's Accept of the same suggestion is blocked the same way", b8l.found && b8l.first.posts.length === 0 && /and the fold lands on Paramedic \(CompTIA Security\+ is saved to become Paramedic\), which is graded/.test(b8l.first.words), b8l.first.words);
  // (c) An untyped title in the middle of the chain: the guard reads past it to the typed end, and reads back from an
  //     untyped end to the last typed title.
  const c8 = await combine8([ren("CompTIA Security+", "Sec New"), ren("Sec New", "Paramedic")], "CompTIA Security+");
  check("(8c) ⭐ an untyped title mid-chain (CompTIA Security+ to Sec New to Paramedic): the guard reads Paramedic's type at the end and blocks",
    c8.first.posts.length === 0 && /the fold lands on Paramedic \(CompTIA Security\+ is saved to become Paramedic\), which is graded \(Credit By Exam or Portfolio Review\)\. /.test(c8.first.words), c8.first.words);
  const c8b = await combine8([ren("Paramedic", "Para Mid"), ren("Para Mid", "CompTIA Security+")], "Paramedic");
  check("(8c) an untyped title mid-chain that ends on a cert-based title combines from a cert-based source on one press",
    c8b.first.posts.length === 2 && fieldOf(c8b.posts, "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+") && !fieldOf(c8b.posts, "cpl_type_group_override").length, JSON.stringify(c8b.posts));
  // (d) Paramedic with a pending rename to CompTIA Security+, combined from a cert-based source: cert into cert, allowed.
  const d8 = await combine8([ren("Paramedic", "CompTIA Security+")], "Paramedic");
  check("(8d) ⭐ Paramedic, saved to become CompTIA Security+, takes a cert-based combine on one press and logs no override",
    d8.first.posts.length === 2 && fieldOf(d8.posts, "unified_title_override").some((b) => b.value === "CompTIA Security+")
    && fieldOf(d8.posts, "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+") && !fieldOf(d8.posts, "cpl_type_group_override").length, JSON.stringify(d8.posts));
  check("(8d) its words say where the fold lands and carry no false wording",
    /Saved: Emergency Medical Technician folds into CompTIA Security\+, where Paramedic's saved rename lands\./.test(d8.words) && !/Blocked|graded|override|Sam's rule/.test(d8.words), d8.words.slice(0, 400));
  // (e) Combines inside one group pass on the first press, with and without a chain.
  const e8 = await combine8([], "CompTIA Security+");
  check("(8e) ⭐ cert into cert with no chain combines on one press, with no override",
    e8.first.posts.length === 2 && fieldOf(e8.posts, "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+") && !fieldOf(e8.posts, "cpl_type_group_override").length, JSON.stringify(e8.posts));
  const e8c = await combine8([ren("CompTIA Security+", "CompTIA Security+ (2024)")], "CompTIA Security+");
  check("(8e) ⭐ cert into cert through a chain to an untyped title combines on one press, onto the chain's end",
    e8c.first.posts.length === 2 && fieldOf(e8c.posts, "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+ (2024)") && !fieldOf(e8c.posts, "cpl_type_group_override").length, JSON.stringify(e8c.posts));
  const e8l = await accept8([ren("CompTIA Security+", "CompTIA Security+ (2024)")], "CompTIA Security+");
  check("(8e) the List's Accept inside one group through a chain saves on one press", e8l.found && e8l.first.posts.length === 2 && /Saved: Emergency Medical Technician folds into CompTIA Security\+ \(2024\)/.test(e8l.first.words), e8l.first.words);
  // (f) A chain of two renames: the write and the guard both land on the second rename's title.
  const f8 = await combine8([ren("Paramedic", "Paramedic (Advanced)"), ren("Paramedic (Advanced)", "Paramedic II")], "Paramedic", true);
  check("(8f) ⭐ a chain of two renames (Paramedic to Paramedic (Advanced) to Paramedic II) is blocked naming Paramedic II and Paramedic's type",
    f8.first.posts.length === 0 && /the fold lands on Paramedic II \(Paramedic is saved to become Paramedic II\), which is graded \(Credit By Exam or Portfolio Review\), the type of Paramedic, since Paramedic II has no CPL type of its own/.test(f8.first.words), f8.first.words);
  check("(8f) the second press writes the fold onto Paramedic II and logs it",
    fieldOf(f8.posts, "unified_title_merge_confirm").some((b) => b.value === "Paramedic II") && fieldOf(f8.posts, "cpl_type_group_override").some((b) => /cert into graded: Emergency Medical Technician -> Paramedic II$/.test(b.value)), JSON.stringify(f8.posts));
  const f8ok = await combine8([ren("CompTIA Security+", "Sec New"), ren("Sec New", "CompTIA Network+")], "CompTIA Security+");
  check("(8f) a chain of two renames inside one group combines on one press, onto the last title",
    f8ok.first.posts.length === 2 && fieldOf(f8ok.posts, "unified_title_merge_confirm").some((b) => b.value === "CompTIA Network+"), JSON.stringify(f8ok.posts));
  // Re-point writes a fold too, so it goes through the same choke point: a waiting fold into CompTIA Security+, whose
  // own rename now lands on graded Paramedic, is blocked when Re-point is pressed.
  const rp8 = await boot({ hash: "#exhibits/list", signedIn: true, files: { "kb/exhibit_audit/latest.json": AUD8, "kb/exhibit_left_map.json": LMAP8 },
    overlay: [ren("Emergency Medical Technician", "CompTIA Security+"), mc("Emergency Medical Technician", "CompTIA Security+"), ren("CompTIA Security+", "Paramedic")] });
  await settle(); await settle();
  const rpb = Array.from(rp8.d.querySelectorAll("button")).find((b) => txt(b) === "Re-point to Paramedic");
  if (rpb) { rpb.click(); await settle(); await settle(); }
  check("(8) ⭐ Re-point goes through the same guard: re-pointing a cert-based fold onto graded Paramedic is blocked with nothing written",
    rpb && postsOf(rp8).length === 0 && /Blocked: Emergency Medical Technician is cert-based .* and the fold lands on Paramedic .*Press Re-point again/.test(txt(rp8.d.getElementById("exh-l-cellnote"))),
    (rpb ? "" : "no Re-point button; ") + txt(rp8.d.getElementById("exh-l-cellnote")));
  check("(8) one choke point: Accept, Combine and Re-point call foldWrite, the guard's words live once, and the old chain-type walk is gone",
    /function listSuggestAccept\(r, sg\) \{ return foldWrite\(r, sg\.to\); \}/.test(src) && /function leftCombineBox[\s\S]*?foldWrite\(r, to,/.test(src)
    && /function listRepoint[\s\S]*?foldWrite\(r, pf\.to,/.test(src) && !/chainType|sg\.via|via: to/.test(src)
    && !/combine across groups: /.test(src) && !/function foldLanding\(|function landing\(/.test(src)
    && (GSRC.match(/combine across groups: /g) || []).length === 1 && (GSRC.match(/function landing\(/g) || []).length === 1
    && /function relSave[\s\S]*?foldGate\(/.test(src) && /function approveRename[\s\S]*?foldGate\(/.test(src));

  // (9) S679, the second reader's third pass. (a) The guard fails closed: a 404 on the CPL types file holds the List's
  //     Accept with nothing written, the next press fetches the file again, and the guard then reads the types.
  const mapFetches = (x) => x.calls.filter((c) => c.url === "kb/exhibit_left_map.json").length;
  const AIS9 = (to) => ({ schema: 1, groups: [], order: {}, counts: { suggested_folds: 1 }, suggest: { "Emergency Medical Technician": { to: to, why: "spelled another way" } } });
  async function listAt(files, ov) {
    const x = await boot({ hash: "#exhibits/list", signedIn: true, overlay: ov || [], files: Object.assign({ "kb/exhibit_audit/latest.json": AUD8 }, files) });
    await settle(); await settle();
    const ed = x.d.getElementById("exh-l-editall"); if (ed) { ed.click(); await settle(); }
    const sf = Array.from(x.d.querySelectorAll("button")).find((b) => /^Suggested folds/.test(txt(b))); if (sf) { sf.click(); await settle(); }
    return x;
  }
  const acceptBtn = (x) => Array.from(x.d.querySelectorAll("button")).find((b) => txt(b) === "Accept" && /Emergency Medical Technician/.test(b.getAttribute("aria-label") || ""));
  const cellNote = (x) => txt(x.d.getElementById("exh-l-cellnote"));
  async function press(x) { const b = acceptBtn(x); if (b) { b.click(); await settle(); await settle(); } return !!b; }
  let up9 = false;
  const f9 = await listAt({ "kb/exhibit_left_map.json": () => (up9 ? LMAP8 : 404), "kb/exhibits_ai_sort.json": AIS9("Paramedic") });
  const p9 = await press(f9);
  check("(9a) ⭐ a 404 on the CPL types file holds the List's Accept of cert-based Emergency Medical Technician into graded Paramedic, with nothing written",
    p9 && postsOf(f9).length === 0 && cellNote(f9) === "The CPL types did not load, so this combine is held. Try again.", cellNote(f9) + " | " + JSON.stringify(postsOf(f9)));
  const n9 = mapFetches(f9);
  up9 = true;
  await press(f9);
  check("(9a) ⭐ a retry after the file loads fetches it again and proceeds to the guard, which blocks the cross on its first read",
    mapFetches(f9) === n9 + 1 && postsOf(f9).length === 0 && /^Blocked: Emergency Medical Technician is cert-based .* and the fold lands on Paramedic, which is graded/.test(cellNote(f9)), mapFetches(f9) + " | " + cellNote(f9));
  await press(f9);
  check("(9a) the press after that writes the fold and logs the override",
    fieldOf(postsOf(f9), "unified_title_merge_confirm").some((b) => b.value === "Paramedic") && fieldOf(postsOf(f9), "cpl_type_group_override").length === 1, JSON.stringify(postsOf(f9)));
  let upG = false;
  const g9 = await listAt({ "kb/exhibit_left_map.json": () => (upG ? LMAP8 : 404), "kb/exhibits_ai_sort.json": AIS9("CompTIA Security+") });
  await press(g9);
  const heldG = postsOf(g9).length === 0 && /did not load/.test(cellNote(g9));
  upG = true;
  await press(g9);
  check("(9a) inside one group, the retry after the file loads saves on that press", heldG && postsOf(g9).length === 2
    && fieldOf(postsOf(g9), "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+") && !fieldOf(postsOf(g9), "cpl_type_group_override").length, cellNote(g9) + " | " + JSON.stringify(postsOf(g9)));
  const none9 = await listAt({ "kb/exhibit_left_map.json": 404, "kb/exhibits_ai_sort.json": AIS9("Paramedic") });
  await settle(); await settle();
  check("(9a) the List's own draw never retries a missing file in a loop", mapFetches(none9) === 1, String(mapFetches(none9)));
  // (b) A title with no CPL type recorded along its chain asks on the first press and writes on the second, on either
  //     side (the conductor's call, S679): a title the file does not hold, or the nightly build's untyped entry.
  const notRec = (b) => /^combine with CPL type not recorded \(/.test(b.value || "");
  const noLand = JSON.parse(JSON.stringify(LMAP8)); delete noLand.canonicals["CompTIA Security+"];
  const b9 = await listAt({ "kb/exhibit_left_map.json": noLand, "kb/exhibits_ai_sort.json": AIS9("CompTIA Security+") });
  await press(b9);
  const b9first = postsOf(b9).length === 0 && cellNote(b9) === "CompTIA Security+ has no CPL type recorded, so this combine could join graded and cert-based records. Press again to combine.";
  check("(9b) ⭐ a picked title missing from the types file, with no typed title along its chain, asks on the first press with nothing written", b9first, cellNote(b9));
  await press(b9);
  check("(9b) ⭐ the second press writes the fold and logs the override with the reason CPL type not recorded",
    fieldOf(postsOf(b9), "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+")
    && fieldOf(postsOf(b9), "cpl_type_group_override").some((b) => b.value === "combine with CPL type not recorded (CompTIA Security+): Emergency Medical Technician -> CompTIA Security+"),
    JSON.stringify(postsOf(b9)));
  const b9c = await listAt({ "kb/exhibit_left_map.json": noLand, "kb/exhibits_ai_sort.json": AIS9("CompTIA Security+") }, [ren("CompTIA Security+", "CompTIA Network+")]);
  await press(b9c);
  check("(9b) the same title takes the type of a typed title along its chain, and the fold saves",
    postsOf(b9c).length === 2 && fieldOf(postsOf(b9c), "unified_title_merge_confirm").some((b) => b.value === "CompTIA Network+"), cellNote(b9c) + " | " + JSON.stringify(postsOf(b9c)));
  // The nightly build's untyped entry ("CPL type not recorded", no group) on the source: untyped into cert asks twice.
  const unSrc = JSON.parse(JSON.stringify(LMAP8)); unSrc.canonicals["Emergency Medical Technician"] = { type: "CPL type not recorded", group: "" };
  const b9s = await listAt({ "kb/exhibit_left_map.json": unSrc, "kb/exhibits_ai_sort.json": AIS9("CompTIA Security+") });
  await press(b9s);
  const b9sFirst = postsOf(b9s).length === 0 && /^Emergency Medical Technician has no CPL type recorded, so this combine could join graded and cert-based records\. Press again to combine\.$/.test(cellNote(b9s));
  await press(b9s);
  check("(9b) ⭐ an untyped source (CPL type not recorded) into a cert-based title asks on the first press, then writes and logs on the second",
    b9sFirst && fieldOf(postsOf(b9s), "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+") && fieldOf(postsOf(b9s), "cpl_type_group_override").filter(notRec).length === 1,
    cellNote(b9s) + " | " + JSON.stringify(postsOf(b9s)));
  // The leftover row's Combine over a map that carries an untyped canonical.
  const LMAPU = JSON.parse(JSON.stringify(LMAP8));
  LMAPU.canonicals["Unrecorded Course"] = { type: "CPL type not recorded", group: "" };
  async function combineAt(lmap, ov, pick) {
    const x = await boot({ hash: "#exhibits/list/left", signedIn: true, overlay: ov, files: { "kb/exhibit_audit/latest.json": AUD8, "kb/exhibit_left_map.json": lmap } });
    await settle(); await settle();
    titleBtn(x.d, "Emergency Medical Technician").click(); await settle();
    const row = () => rowIn(x, "EMT Basic 1998");
    row().querySelector('[data-left-act="combine"]').click(); await settle();
    const box = () => row() && row().querySelector('[data-left-box="combine"]');
    const go = async () => { if (box()) { box().querySelector('[data-left-go="combine"]').click(); await settle(); await settle(); } };
    box().querySelector("input").value = pick;
    await go();
    const first = { posts: postsOf(x).slice(), words: box() ? txt(box()) : txt(panel(x.d)) };
    await go();
    return { first: first, posts: postsOf(x) };
  }
  const gU = JSON.parse(JSON.stringify(LMAPU)); gU.canonicals["Emergency Medical Technician"] = { type: "Credit By Exam", group: "graded" };
  const u9 = await combineAt(gU, [], "Unrecorded Course");
  check("(9b) ⭐ a graded title combined into an untyped one asks on the first press with nothing written, and the picker offers the untyped title",
    u9.first.posts.length === 0 && /Unrecorded Course has no CPL type recorded, so this combine could join graded and cert-based records\. Press again to combine\./.test(u9.first.words), u9.first.words);
  check("(9b) ⭐ the second press writes it and logs the override",
    fieldOf(u9.posts, "unified_title_merge_confirm").some((b) => b.value === "Unrecorded Course")
    && fieldOf(u9.posts, "cpl_type_group_override").some((b) => b.value === "combine with CPL type not recorded (Unrecorded Course): Emergency Medical Technician -> Unrecorded Course"), JSON.stringify(u9.posts));
  // A chain whose end is the untyped entry: the guard reads the typed title before it.
  const c9 = await combineAt(LMAPU, [ren("Paramedic", "Unrecorded Course")], "Paramedic");
  check("(9b) ⭐ a chain ending on an untyped title (Paramedic saved to become Unrecorded Course) checks Paramedic's type: cert into it is blocked as a cross",
    c9.first.posts.length === 0 && /Blocked: Emergency Medical Technician is cert-based .* and the fold lands on Unrecorded Course \(Paramedic is saved to become Unrecorded Course\), which is graded \(Credit By Exam or Portfolio Review\), the type of Paramedic, since Unrecorded Course has no CPL type of its own/.test(c9.first.words),
    c9.first.words);
  check("(9b) its second press logs the cross, never the untyped reason",
    fieldOf(c9.posts, "cpl_type_group_override").some((b) => /^combine across groups: cert into graded: Emergency Medical Technician -> Unrecorded Course$/.test(b.value)) && !fieldOf(c9.posts, "cpl_type_group_override").some(notRec), JSON.stringify(c9.posts));
  const k9 = await combineAt(LMAPU, [], "CompTIA Security+");
  check("(9b) ⭐ two typed titles in one group still combine on one press, with the untyped entry in the file",
    k9.first.posts.length === 2 && !fieldOf(k9.first.posts, "cpl_type_group_override").length && fieldOf(k9.first.posts, "unified_title_merge_confirm").some((b) => b.value === "CompTIA Security+"), JSON.stringify(k9.first.posts));
  // (c) The override's second press is armed per surface and per pair: a block on the List's Accept never arms the
  //     leftover row's Combine for the same pair, and the reverse.
  const s9 = await listAt({ "kb/exhibit_left_map.json": LMAP8, "kb/exhibits_ai_sort.json": AIS9("Paramedic") });
  await press(s9);
  const blockedAccept = postsOf(s9).length === 0 && /^Blocked: /.test(cellNote(s9));
  const leftF = Array.from(s9.d.querySelectorAll("button")).find((b) => /^A title that has left MAP/.test(txt(b)));
  if (leftF) { leftF.click(); await settle(); await settle(); await settle(); }
  // Leave Edit every row, so the title opens its panel again.
  const edOff = s9.d.getElementById("exh-l-editall"); if (edOff) { edOff.click(); await settle(); }
  const emt = titleBtn(s9.d, "Emergency Medical Technician");
  if (emt) { emt.click(); await settle(); }  const srow = () => panel(s9.d) && rowIn(s9, "EMT Basic 1998");
  if (srow()) { srow().querySelector('[data-left-act="combine"]').click(); await settle(); }
  const sbox = () => srow() && srow().querySelector('[data-left-box="combine"]');
  if (sbox()) { sbox().querySelector("input").value = "Paramedic"; sbox().querySelector('[data-left-go="combine"]').click(); await settle(); await settle(); }
  check("(9c) ⭐ after a block on the List's Accept, the leftover row's Combine of the same pair is blocked on its own first press, with nothing written",
    blockedAccept && !!sbox() && postsOf(s9).length === 0 && /Blocked: Emergency Medical Technician is cert-based .*Press Combine here again/.test(txt(sbox())),
    (leftF ? "" : "no left filter; ") + (sbox() ? txt(sbox()) : "no combine box") + " | " + JSON.stringify(postsOf(s9)));
  if (sbox()) { sbox().querySelector('[data-left-go="combine"]').click(); await settle(); await settle(); }
  check("(9c) its own second press writes the fold and logs the override once",
    fieldOf(postsOf(s9), "unified_title_merge_confirm").some((b) => b.value === "Paramedic") && fieldOf(postsOf(s9), "cpl_type_group_override").length === 1, JSON.stringify(postsOf(s9)));
  check("(9c) every arm and read of the override goes through guardKey, keyed by a surface",
    /function guardKey\(surface, key\)/.test(GSRC) && !(src.match(/LEFT\.guard\[(?!gk\]|k\]|guardKey\()/g) || []).length
    && /surface: "combine"/.test(src) && /surface: "repoint"/.test(src) && /"related"\)/.test(src) && /"batch"\)/.test(src) && /guardKey\("move"/.test(src));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
