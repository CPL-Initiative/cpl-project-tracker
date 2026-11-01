// The Common Subjects Reference's List view on the Catalog Commons' shared engine (Sam, 2026-11-01: "This new list
// view is so helpful that I want one now for each of our Catalog Commons groups"). Guards:
//   (1) #canonical-subj4/list opens the List: the view switch carries three words and selects List, the engine loads
//       through CPL_TABS.loadScript, and every MQ discipline is one row, A to Z, under th scope=col headers in a
//       labelled region; no flag column and no find and replace (the reference has no flag field, and a replace would
//       hand one code to several MQ disciplines);
//   (2) the columns are found by name and read the merge the table reads: Common SUBJ, Status (a person, the nightly
//       procedure, a session cohort, open; a later note never steals the pick's reviewer), the Local SUBJs and how
//       many, local courses, M-IDs, and the collision (AUTB on two MQ disciplines; the FTVE fan-in and the umbrellas'
//       AGAB are shared by design and stay out of the column);
//   (3) the filters (Open, Confirmed by a person, Confirmed by a procedure, In a collision) and the finder (a local
//       code, an alternate name) narrow the rows;
//   (4) Edit every row turns Common SUBJ into boxes; leaving one writes THAT discipline's _CANON_SUBJ4 kb_curation row
//       through the table's own path, the row then reads Confirmed by a person, the Reference table shows the code,
//       and the collision clears from both rows it joined;
//   (5) a code another MQ discipline owns asks the table's confirm; declined, nothing writes and the value is back;
//       a value that is not four letters never writes;
//   (6) a refused write says it did not save and puts the value back;
//   (7) signed out, the List says so and a save asks for a sign-in without writing;
//   (8) the Status drawer's Confirm this pick writes the open pick's own code for its discipline;
//   (9) Edit (one row) saves a note through the note path, and the pick's reviewer stays the code row's;
//  (10) tokens only, no glyph, American spelling in the List's source.
// Run from repo root: `npm test` (or `node tests/csr_list.test.js`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(n) { return (n && n.textContent || "").trim(); }

const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

function entry(code, extra) {
  return Object.assign({ canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, data_modal_share: 0.8, total_mids: 10, variants_observed: {}, local_subject_variants: {},
    local_subject_total: 0, top_category_2digit: "09", canonical_source: "csr", authority_flag: "proposed", authority_chips: [],
    cid_subject_codes: [], ccn_subject_code: null }, extra || {});
}
function open(code, extra) { return entry(code, Object.assign({ source: "data_modal", reviewed_at: null, reviewed_by: null }, extra || {})); }
const SEED = {
  _counts: {}, _seeded_at: "2026-09-30", _synced_at: "2026-10-19T13:25:33Z",
  disciplines: {
    "Automotive Technology": entry("AUTO", { total_mids: 120, local_subject_total: 470, local_subject_variants: { AUTO: 300, AT: 120, AUT: 50 },
      local_subject_variants_truncated: 2, variants_observed: { AUTO: 120 }, canonical_source: "c-id", authority_flag: null,
      authority_chips: [{ system: "C-ID", code: "ALTF" }], _notes: "a note" }),
    "Auto Body Technology": entry("AUTB", { total_mids: 9, local_subject_total: 30, local_subject_variants: { AUTB: 20, AB: 10 }, variants_observed: { AUTB: 9 } }),
    "Agricultural Business and Related Services": open("AUTB", { total_mids: 1, local_subject_total: 4, local_subject_variants: { AB: 4 },
      variants_observed: { AUTB: 1 }, top_category_2digit: "01" }),
    "Mathematics": open("MATH", { canonical_source: "ccn", authority_flag: null, ccn_subject_code: "MATH", total_mids: 40, local_subject_total: 90,
      local_subject_variants: { MATH: 90 }, variants_observed: { MATH: 40 } }),
    "Psychology": open("PSYC", { total_mids: 30, local_subject_total: 60, local_subject_variants: { PSYC: 40, PSY: 20 }, variants_observed: { PSYC: 30 } }),
    "Welding": open("WELD", { total_mids: 12, local_subject_total: 20, local_subject_variants: { WELD: 20 }, variants_observed: { WELD: 12 } }),
    "Kinesiology": entry("KINE", { is_umbrella: true, umbrella_codes: ["ATHL", "KINE"], variants_observed: { KINE: 7, ATHL: 3 }, local_subject_variants: { PE: 50, KIN: 30 } }),
    "Film and Media Studies": entry("FTVE", { fan_in_with: ["Media Production"], variants_observed: { FTVE: 8 } }),
    "Media Production": entry("FTVE", { fan_in_with: ["Film and Media Studies"], variants_observed: { FTVE: 2 } }),
    "Agriculture": entry("AGRI", { is_umbrella: true, umbrella_codes: ["AGAB", "AGRI"], variants_observed: { AGRI: 6, AGAB: 4 }, top_category_2digit: "01" }),
    "Agricultural Production": entry("AGPR", { is_umbrella: true, umbrella_codes: ["AGAB", "AGPR"], variants_observed: { AGPR: 3, AGAB: 1 }, top_category_2digit: "01" })
  }
};
// The live rows: code rows by a person, by the nightly procedure and by a session cohort; then a later note by a cohort.
const OVERLAY = [
  { course_id: "_CANON_SUBJ4::Automotive Technology", field: "canonical_subj4", value: "AUTO", reviewer_email: "map@rccd.edu", reviewed_at: "2026-05-23T17:00:00Z" },
  { course_id: "_CANON_SUBJ4::Automotive Technology", field: "canonical_subj4_notes", value: "a note", reviewer_email: "csr-doctrine-s111@bot", reviewed_at: "2026-07-10T09:00:00Z" },
  { course_id: "_CANON_SUBJ4::Auto Body Technology", field: "canonical_subj4", value: "AUTB", reviewer_email: "map@rccd.edu", reviewed_at: "2026-06-12T17:00:00Z" },
  { course_id: "_CANON_SUBJ4::Mathematics", field: "canonical_subj4", value: "MATH", reviewer_email: "csr-confirm-authority@bot", reviewed_at: "2026-10-19T22:09:00Z" },
  { course_id: "_CANON_SUBJ4::Welding", field: "canonical_subj4", value: "WELD", reviewer_email: "csr-s427@bot", reviewed_at: "2026-10-19T20:00:00Z" }
];
const ALIASES = { aliases: { "Kinesiology": ["Physical Education"] } };

function boot(opts) {
  opts = opts || {};
  const posts = [];
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-canonical-subj4">
      <div id="cs-toolbar"></div><div id="cs-summary"></div>
      <div id="cs-table-wrap"></div><div id="cs-toast"></div>
      <div id="cs-variants-modal" class="cs-modal-bg"><div class="cs-modal"><button class="cs-modal-close"></button><h3 id="cs-variants-title"></h3><div id="cs-variants-body"></div></div></div>
    </div></body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/" + (opts.hash || "#canonical-subj4/list") });
  const w = dom.window;
  w.fetch = function (url, init) {
    const u = String(url);
    if (u.indexOf("kb_curation") >= 0 && init && init.method === "POST") {
      posts.push(JSON.parse(init.body));
      return Promise.resolve(opts.refuse ? { ok: false, status: 401, json: () => Promise.resolve({}) } : { ok: true, status: 201, json: () => Promise.resolve([]) });
    }
    const body =
      u.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
      u.indexOf("kb_curation") >= 0 ? OVERLAY :
      u.indexOf("discipline_aliases.json") >= 0 ? ALIASES :
      u.indexOf("cid_descriptors") >= 0 ? { descriptors: [{ descriptor: "AUTO 100", title: "Intro" }] } :
      u.indexOf("ccn_courses") >= 0 ? { courses: [{ ccn: "MATH C1000", subject: "MATH", number: "C1000", title: "Math" }] } :
      u.indexOf("mq_sections") >= 0 ? { disciplines: { "Mathematics": { mq_list: "masters", mq_list_label: "Master's degree list" } } } :
      u.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: {} } : {};
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.matchMedia = w.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  if (opts.signedIn !== false) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaa.bbb.ccc", refresh_token: "rrr", email: "curator@rccd.edu", exp: Date.now() + 9e6 }));
  const confirms = [];
  w.confirm = function (m) { confirms.push(m); return !!opts.confirmYes; };
  const ctx = dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(w);
  const loads = [];
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    loads.push(s);
    if (s === "commons_list.js") vm.runInContext(LIST_SRC, ctx, { filename: "commons_list.js" });
    setTimeout(cb, 0);
  } };
  vm.runInContext(SRC, ctx, { filename: "canonical_subj4.js" });
  return { w: w, d: w.document, posts: posts, confirms: confirms, loads: loads, M: () => w.CPL_CANONICAL_SUBJ4 };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 15; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".csl-table tbody tr:not(.csl-editrow):not(.csl-band)")); }
function heads(d) { return Array.from(d.querySelectorAll(".csl-table thead tr:first-child th")).map(txt); }
/* A column's index among the cells, by its header's name (the sort words stripped): never by position. */
function col(d, name) {
  const H = heads(d).map((h) => h.replace(/ \(\d+\)/, "").replace(/, (A to Z|Z to A|low to high|high to low)$/, ""));
  return H.indexOf(name);
}
function rowOf(d, disc) { return rows(d).find((r) => txt(r.children[1]) === disc); }
function cell(d, disc, name) { const r = rowOf(d, disc); return r ? txt(r.children[col(d, name)]) : null; }
/* The engine draws an empty cell as a dash it can be pressed on. */
function blank(s) { return s === "" || s === "\u2014"; }
function words(d, t) { return Array.from(d.querySelectorAll("#cs-list button")).find((b) => txt(b) === t); }
function boxOf(d, disc, label) { return Array.from(d.querySelectorAll(".csl-cellin")).find((b) => b.getAttribute("aria-label") === label + " of " + disc); }
function change(t, inp, v) { inp.value = v; inp.dispatchEvent(new t.w.Event("change")); }

(async function () {
  // ── (1) the route opens the List ──
  const t = boot();
  await settle();
  const d = t.d, M = t.M();
  const sw = d.getElementById("cs-views");
  check("(1) the view switch carries Progress, Reference and List, List selected",
    Array.from(sw.querySelectorAll("button[role=tab]")).map(txt).join(",") === "Progress,Reference,List"
    && d.getElementById("cs-tab-list").getAttribute("aria-selected") === "true" && d.getElementById("cs-tab-list").getAttribute("aria-controls") === "cs-list");
  check("(1) the List shows; the table, its toolbar and Progress hide", M._state.view === "list" && !d.getElementById("cs-list").hidden
    && d.getElementById("cs-table-wrap").hidden && d.getElementById("cs-toolbar").hidden && d.getElementById("cs-progress").hidden);
  check("(1) the engine loads through CPL_TABS.loadScript", t.loads.indexOf("commons_list.js") >= 0 && !!t.w.CPL_COMMONS_LIST);
  const names = rows(d).map((r) => txt(r.children[1]));
  check("(1) ⭐ every MQ discipline is one row, A to Z", names.length === 11 && names[0] === "Agricultural Business and Related Services"
    && names[10] === "Welding" && names.join("|") === names.slice().sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join("|"), names.join(" | "));
  const H = heads(d);
  check("(1) th scope=col headers in a labelled region, no flag column, no find and replace",
    d.querySelectorAll(".csl-table thead tr:first-child th[scope='col']").length === H.length && !!d.querySelector("#cs-list .csl-wrap[role='region'][aria-label]")
    && H.indexOf("Flag") === -1 && !words(d, "Find and replace") && !d.getElementById("csl-fr-open"), H.join(","));
  check("(1) the view is remembered as list", t.w.localStorage.getItem("cplCsr.view.v1") === "list");

  // ── (2) the columns, by name ──
  const want = ["MQ Discipline", "Common SUBJ", "Status", "Collision", "Local SUBJs", "Local SUBJ count", "Local courses", "M-IDs", "Authority", "Notes"];
  check("(2) every column is found by its name", want.every((n) => col(d, n) > 0), want.map((n) => n + "=" + col(d, n)).join(" "));
  check("(2) Common SUBJ reads the pick", cell(d, "Automotive Technology", "Common SUBJ") === "AUTO" && cell(d, "Psychology", "Common SUBJ") === "PSYC");
  check("(2) ⭐ Status: a person, the nightly procedure, a session cohort, open",
    cell(d, "Automotive Technology", "Status") === "Confirmed by a person" && cell(d, "Mathematics", "Status") === "Confirmed by the nightly procedure"
    && cell(d, "Welding", "Status") === "Confirmed by a session cohort" && cell(d, "Psychology", "Status") === "Open",
    ["Automotive Technology", "Mathematics", "Welding", "Psychology"].map((x) => cell(d, x, "Status")).join(" | "));
  const auto = M._listRows().find((r) => r.ut === "Automotive Technology");
  check("(2) a later note by a cohort leaves the pick's reviewer the code row's", auto.e.reviewed_by === "map@rccd.edu" && auto.how === "person");
  check("(2) the Local SUBJs, most used first, with the count the seed truncated",
    cell(d, "Automotive Technology", "Local SUBJs") === "AUTO (300), AT (120), AUT (50), and 2 more" && cell(d, "Automotive Technology", "Local SUBJ count") === "5",
    cell(d, "Automotive Technology", "Local SUBJs") + " / " + cell(d, "Automotive Technology", "Local SUBJ count"));
  check("(2) local courses and M-IDs", cell(d, "Automotive Technology", "Local courses") === "470" && cell(d, "Automotive Technology", "M-IDs") === "120");
  check("(2) ⭐ the AUTB collision names the other MQ discipline on both rows",
    cell(d, "Auto Body Technology", "Collision") === "AUTB with Agricultural Business and Related Services"
    && cell(d, "Agricultural Business and Related Services", "Collision") === "AUTB with Auto Body Technology");
  check("(2) the FTVE fan-in and the umbrellas' AGAB are shared by design, not collisions",
    blank(cell(d, "Film and Media Studies", "Collision")) && blank(cell(d, "Agriculture", "Collision")) && blank(cell(d, "Agricultural Production", "Collision")));
  check("(2) Authority reads the source and the chip", cell(d, "Automotive Technology", "Authority") === "C-ID; C-ID says ALTF"
    && cell(d, "Psychology", "Authority") === "Minted here (proposed)");

  // ── (3) filters and the finder ──
  words(d, "Open").click(); await settle();
  check("(3) Open shows the picks no one confirmed", rows(d).map((r) => txt(r.children[1])).join("|") === "Agricultural Business and Related Services|Psychology",
    rows(d).map((r) => txt(r.children[1])).join("|"));
  words(d, "Confirmed by a procedure").click(); await settle();
  check("(3) Confirmed by a procedure shows the nightly and the cohort picks", rows(d).map((r) => txt(r.children[1])).join("|") === "Mathematics|Welding");
  words(d, "In a collision").click(); await settle();
  check("(3) In a collision shows the two AUTB rows", rows(d).length === 2 && rows(d).every((r) => /AUTB/.test(txt(r))));
  words(d, "Confirmed by a person").click(); await settle();
  check("(3) Confirmed by a person leaves out the procedures and the open", rows(d).length === 7 && !rowOf(d, "Mathematics") && !rowOf(d, "Psychology"));
  words(d, "All").click(); await settle();
  let q = d.getElementById("csl-find");
  q.value = "ADMJ"; q.dispatchEvent(new t.w.Event("input")); await settle();
  check("(3) a code no row carries finds nothing", rows(d).length === 0);
  q = d.getElementById("csl-find"); q.value = "PSY"; q.dispatchEvent(new t.w.Event("input")); await settle();
  check("(3) the finder finds an MQ discipline by a local code", rows(d).length === 1 && txt(rows(d)[0].children[1]) === "Psychology");
  q = d.getElementById("csl-find"); q.value = "physical education"; q.dispatchEvent(new t.w.Event("input")); await settle();
  check("(3) the finder finds an MQ discipline by its alternate name", rows(d).length === 1 && txt(rows(d)[0].children[1]) === "Kinesiology");
  q = d.getElementById("csl-find"); q.value = ""; q.dispatchEvent(new t.w.Event("input")); await settle();

  // ── (4) Edit every row writes the right row ──
  d.getElementById("csl-editall").click(); await settle();
  const subjBoxes = Array.from(d.querySelectorAll(".csl-cellin[data-kind='subj']"));
  check("(4) Edit every row puts a Common SUBJ box on every row", subjBoxes.length === 11 && !!boxOf(d, "Agricultural Business and Related Services", "Common SUBJ"));
  let n0 = t.posts.length;
  const agBox = boxOf(d, "Agricultural Business and Related Services", "Common SUBJ");
  agBox.focus();
  change(t, agBox, "agbs");
  await settle();
  let p = t.posts.slice(n0);
  check("(4) ⭐ leaving the box writes that discipline's Common SUBJ row, once",
    p.length === 1 && p[0].course_id === "_CANON_SUBJ4::Agricultural Business and Related Services" && p[0].field === "canonical_subj4"
    && p[0].value === "AGBS" && p[0].reviewer_email === "curator@rccd.edu", JSON.stringify(p));
  check("(4) a code no other MQ discipline owns asks no confirm", t.confirms.length === 0);
  check("(4) the row then reads the code, Confirmed by a person", boxOf(d, "Agricultural Business and Related Services", "Common SUBJ").value === "AGBS"
    && cell(d, "Agricultural Business and Related Services", "Status") === "Confirmed by a person");
  check("(4) ⭐ the collision clears from both rows it joined", blank(cell(d, "Agricultural Business and Related Services", "Collision"))
    && blank(cell(d, "Auto Body Technology", "Collision")));
  check("(4) the note line says what saved", /Saved Agricultural Business and Related Services: AGBS\./.test(txt(d.getElementById("csl-cellnote"))));
  const refInput = Array.from(d.querySelectorAll("#cs-table-wrap tr")).find((r) => /^Agricultural Business/.test(txt(r.querySelector("td.cs-disc"))));
  check("(4) the Reference table shows the code (the same overlay)", refInput && refInput.querySelector("input.cs-canon").value === "AGBS");
  check("(4) focus comes back to the redrawn box, so Edit every row keeps its place", d.activeElement !== agBox && d.activeElement.classList.contains("csl-cellin")
    && d.activeElement.getAttribute("aria-label") === "Common SUBJ of Agricultural Business and Related Services");

  // ── (5) the confirm on a code another MQ discipline owns, and the four-letter rule ──
  n0 = t.posts.length;
  change(t, boxOf(d, "Psychology", "Common SUBJ"), "MATH");
  await settle();
  check("(5) ⭐ a code another MQ discipline owns asks the table's confirm; declined, nothing writes and the value is back",
    t.confirms.length === 1 && /MATH is already the Common SUBJ of Mathematics/.test(t.confirms[0]) && t.posts.length === n0
    && boxOf(d, "Psychology", "Common SUBJ").value === "PSYC" && /MATH stays off Psychology/.test(txt(d.getElementById("csl-cellnote"))));
  change(t, boxOf(d, "Psychology", "Common SUBJ"), "PSY");
  await settle();
  check("(5) a value that is not four letters never writes", t.posts.length === n0 && boxOf(d, "Psychology", "Common SUBJ").value === "PSYC"
    && /four letters/.test(txt(d.getElementById("csl-cellnote"))));

  // ── (6) a refused write ──
  const u = boot({ refuse: true });
  await settle();
  u.d.getElementById("csl-editall").click(); await settle();
  change(u, boxOf(u.d, "Welding", "Common SUBJ"), "WLDG");
  await settle();
  check("(6) ⭐ a refused write says it did not save and puts the value back", u.posts.length === 1 && boxOf(u.d, "Welding", "Common SUBJ").value === "WELD"
    && /did not save \(status 401\)/.test(txt(u.d.getElementById("csl-cellnote"))) && cell(u.d, "Welding", "Status") === "Confirmed by a session cohort",
    txt(u.d.getElementById("csl-cellnote")));

  // ── (7) signed out ──
  const v = boot({ signedIn: false });
  await settle();
  check("(7) signed out, the List says so", /You are not signed in/.test(txt(v.d.getElementById("cs-list"))));
  v.d.getElementById("csl-editall").click(); await settle();
  change(v, boxOf(v.d, "Psychology", "Common SUBJ"), "PSYH");
  await settle();
  check("(7) a save asks for a sign-in and writes nothing", v.posts.length === 0 && /Sign in as a reviewer/.test(txt(v.d.getElementById("csl-cellnote")))
    && boxOf(v.d, "Psychology", "Common SUBJ").value === "PSYC");

  // ── (8) Confirm this pick ──
  const x = boot();
  await settle();
  rowOf(x.d, "Psychology").children[col(x.d, "Status")].querySelector("button").click(); await settle();
  const drawer = x.d.querySelector("#cs-list .csl-drawer");
  check("(8) the Status drawer says the pick waits and offers Confirm this pick", !!drawer && /waits for a person to confirm it/.test(txt(drawer)) && !!words(x.d, "Confirm this pick"), txt(drawer));
  words(x.d, "Confirm this pick").click(); await settle();
  check("(8) ⭐ Confirm this pick writes the open pick's own code for its discipline",
    x.posts.length === 1 && x.posts[0].course_id === "_CANON_SUBJ4::Psychology" && x.posts[0].field === "canonical_subj4" && x.posts[0].value === "PSYC");
  check("(8) the row then reads Confirmed by a person", cell(x.d, "Psychology", "Status") === "Confirmed by a person" && /Confirmed PSYC for Psychology/.test(txt(x.d.getElementById("csl-cellnote"))));
  rowOf(x.d, "Mathematics").children[col(x.d, "Status")].querySelector("button").click(); await settle();
  check("(8) a confirmed pick's drawer names who confirmed it and offers no Confirm", /Confirmed by the nightly procedure, csr-confirm-authority@bot/.test(txt(x.d.querySelector("#cs-list .csl-drawer")))
    && !words(x.d, "Confirm this pick"));

  // ── (9) Edit (one row) saves a note through the note path ──
  const y = boot();
  await settle();
  rowOf(y.d, "Auto Body Technology").querySelector("button[aria-label='Edit Auto Body Technology']").click(); await settle();
  const noteBox = y.d.getElementById("csl-notes");
  check("(9) Edit opens the row's Common SUBJ and note", !!noteBox && y.d.getElementById("csl-subj").value === "AUTB");
  noteBox.value = "Auto Body keeps AUTB"; noteBox.dispatchEvent(new y.w.Event("input"));
  words(y.d, "Save").click(); await settle();
  check("(9) ⭐ Save writes the note row only, for that discipline", y.posts.length === 1 && y.posts[0].course_id === "_CANON_SUBJ4::Auto Body Technology"
    && y.posts[0].field === "canonical_subj4_notes" && y.posts[0].value === "Auto Body keeps AUTB", JSON.stringify(y.posts));
  const ab = y.M()._listRows().find((r) => r.ut === "Auto Body Technology");
  check("(9) the note shows and the pick's reviewer stays the code row's", cell(y.d, "Auto Body Technology", "Notes") === "Auto Body keeps AUTB"
    && ab.e.reviewed_by === "map@rccd.edu" && ab.how === "person");

  // ── (10) the List's source ──
  const block = SRC.slice(SRC.indexOf("/* ── List: every MQ discipline"), SRC.indexOf("/* ── the three views"));
  check("(10) no raw hex in the List's source", !/#[0-9a-fA-F]{3,8}\b/.test(block));
  check("(10) no glyph in the List's words", !/[←-⇿☀-➿⬀-⯿\u{1f300}-\u{1faff}✓✗⚠]/u.test(block));
  check("(10) American spelling", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst|licence)\b/i.test(block));
  check("(10) the List writes only through the table's path", !/saveField\(/.test(block) && /writeCanon\(/.test(block) && /writeNote\(/.test(block) && /canonCheck\(/.test(block));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
