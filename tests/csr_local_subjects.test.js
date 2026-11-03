// The Common Subjects Reference's Local subjects List (csr_local_subjects.js; Sam, 2026-11-03: "yes on local subjects").
//
// One row per local subject code over kb/reference/subject_discipline_map.json, the seed's local_subject_variants
// inverted into each code's spread, and the _SUBJ_DISC::<CODE> confirms in kb_curation (DR-25). Guarded here:
//   (1) #canonical-subj4/local opens the fourth view and loads the List engine, then the module;
//   (2) one row per code the map names, leaves out on purpose, or the seed's courses use, A to Z, codes normalized;
//   (3) each row's discipline, Common SUBJ, courses, spread and status, including a confirm the map has moved past;
//   (4) the filters and their counts; #canonical-subj4/local/<filter> opens on one;
//   (5) Confirm writes the code's filing: the map's own, or for a code the map does not name, its top discipline, never
//       a split one; a code left out on purpose offers none;
//   (6) a refused write and a signed-out reader change nothing and say so;
//   (7) Edit saves a note row only;
//   (8) a subject map that cannot be read says so.
// Run from repo root: `node tests/csr_local_subjects.test.js` (or `npm test`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(n) { return (n && n.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const LOCAL_SRC = fs.readFileSync("csr_local_subjects.js", "utf8");

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
const MAP = {
  map: { AB: "Auto Body Technology", AUTO: "Automotive Technology", PSY: "Psychology", KIN: "Mathematics", ACCOUNT: "Business", ab: "Auto Body Technology" },
  _deliberately_unmapped: { NC: "generic noncredit bucket, not a discipline" }
};
const LOCAL_OVERLAY = [
  { course_id: "_SUBJ_DISC::AUTO", field: "subject_discipline_confirm", value: "Automotive Technology", reviewer_email: "map@rccd.edu", reviewed_at: "2026-11-02T17:00:00Z" },
  { course_id: "_SUBJ_DISC::PSY", field: "subject_discipline_confirm", value: "Mathematics", reviewer_email: "map@rccd.edu", reviewed_at: "2026-10-01T17:00:00Z" },
  { course_id: "_SUBJ_DISC::PSY", field: "subject_discipline_note", value: "PSY is psychology everywhere", reviewer_email: "map@rccd.edu", reviewed_at: "2026-10-01T17:01:00Z" }
];

function boot(opts) {
  opts = opts || {};
  const posts = [];
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-canonical-subj4">
      <div id="cs-toolbar"></div><div id="cs-summary"></div>
      <div id="cs-table-wrap"></div><div id="cs-toast"></div>
      <div id="cs-variants-modal" class="cs-modal-bg"><div class="cs-modal"><button class="cs-modal-close"></button><h3 id="cs-variants-title"></h3><div id="cs-variants-body"></div></div></div>
    </div></body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/" + (opts.hash || "#canonical-subj4/local") });
  const w = dom.window;
  w.fetch = function (url, init) {
    const u = String(url);
    if (u.indexOf("kb_curation") >= 0 && init && init.method === "POST") {
      posts.push(JSON.parse(init.body));
      return Promise.resolve(opts.refuse ? { ok: false, status: 401, json: () => Promise.resolve({}) } : { ok: true, status: 201, json: () => Promise.resolve([]) });
    }
    if (u.indexOf("subject_discipline_map.json") >= 0 && opts.noMap) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    const body =
      u.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
      u.indexOf("subject_discipline_map.json") >= 0 ? MAP :
      u.indexOf("kb_curation") >= 0 && u.indexOf("_SUBJ_DISC") >= 0 ? LOCAL_OVERLAY :
      u.indexOf("kb_curation") >= 0 ? OVERLAY :
      u.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: {} } : {};
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.matchMedia = w.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  if (opts.signedIn !== false) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaa.bbb.ccc", refresh_token: "rrr", email: "curator@rccd.edu", exp: Date.now() + 9e6 }));
  w.confirm = function () { return false; };
  const ctx = dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(w);
  const loads = [];
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    loads.push(s);
    if (s === "commons_list.js") vm.runInContext(LIST_SRC, ctx, { filename: "commons_list.js" });
    if (s === "csr_local_subjects.js") vm.runInContext(LOCAL_SRC, ctx, { filename: "csr_local_subjects.js" });
    setTimeout(cb, 0);
  } };
  vm.runInContext(SRC, ctx, { filename: "canonical_subj4.js" });
  return { w: w, d: w.document, posts: posts, loads: loads, M: () => w.CPL_CANONICAL_SUBJ4 };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 20; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll("#cs-local .csls-table tbody tr:not(.csls-editrow):not(.csls-band)")); }
function heads(d) { return Array.from(d.querySelectorAll("#cs-local .csls-table thead tr:first-child th")).map(txt); }
function col(d, name) {
  const H = heads(d).map((h) => h.replace(/ \(\d+\)/, "").replace(/, (A to Z|Z to A|low to high|high to low)$/, ""));
  return H.indexOf(name);
}
function titleOf(r) { return txt(r.children[1].querySelector(".csls-open") || r.children[1]); }
function rowOf(d, code) { return rows(d).find((r) => titleOf(r) === code); }
function cell(d, code, name) { const r = rowOf(d, code); return r ? txt(r.children[col(d, name)]) : null; }
function words(d, t) { return Array.from(d.querySelectorAll("#cs-local button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }
function sgOf(d, code) { const r = rowOf(d, code); return r && r.querySelector(".csls-sg"); }
function note(d) { return txt(d.getElementById("csls-cellnote")); }

(async function () {
  // ── (1) the route opens the fourth view ──
  const t = boot();
  await settle();
  const d = t.d, M = t.M();
  const tabs = Array.from(d.querySelectorAll("#cs-views button[role=tab]")).map(txt);
  check("(1) the view switch carries Progress, Reference, List and Local subjects", tabs.join(",") === "Progress,Reference,List,Local subjects", tabs.join(","));
  check("(1) #canonical-subj4/local shows the Local subjects view and hides the others", M._state.view === "local" && !d.getElementById("cs-local").hidden
    && d.getElementById("cs-list").hidden && d.getElementById("cs-table-wrap").hidden && d.getElementById("cs-progress").hidden);
  check("(1) the engine loads, then the module", t.loads.indexOf("commons_list.js") >= 0 && t.loads.indexOf("csr_local_subjects.js") > t.loads.indexOf("commons_list.js"), t.loads.join(","));

  // ── (2) one row per code, A to Z, normalized ──
  const codes = rows(d).map(titleOf);
  check("(2) one row per code the map names, leaves out, or the seed's courses use, A to Z",
    codes.join("|") === "AB|ACCOUNT|AT|AUT|AUTB|AUTO|KIN|MATH|NC|PE|PSY|PSYC|WELD", codes.join("|"));
  check("(2) the header names the columns", ["Local SUBJ", "MQ discipline", "Common SUBJ", "Courses", "Where its courses land", "Status", "Confirmed by", "Note"]
    .every((h) => col(d, h) > -1), heads(d).join(" | "));

  // ── (3) each row's facts ──
  check("(3) AB: the map's discipline, its Common SUBJ, its courses and where they land, open",
    cell(d, "AB", "MQ discipline") === "Auto Body Technology" && cell(d, "AB", "Common SUBJ") === "AUTB" && cell(d, "AB", "Courses") === "14"
    && cell(d, "AB", "Where its courses land") === "Auto Body Technology 10, Agricultural Business and Related Services 4" && cell(d, "AB", "Status") === "Open",
    [cell(d, "AB", "MQ discipline"), cell(d, "AB", "Courses"), cell(d, "AB", "Where its courses land"), cell(d, "AB", "Status")].join(" / "));
  check("(3) AUTO: confirmed by a person, who and when", cell(d, "AUTO", "Status") === "Confirmed by a person" && cell(d, "AUTO", "Confirmed by") === "map@rccd.edu, 2026-11-02");
  check("(3) PSY: a confirm the map has moved past reads so, and its note shows", cell(d, "PSY", "Status") === "Confirmed under another discipline"
    && cell(d, "PSY", "Note") === "PSY is psychology everywhere");
  check("(3) NC: left out on purpose", cell(d, "NC", "Status") === "Left out of the map on purpose" && cell(d, "NC", "MQ discipline") === "Left out on purpose");
  check("(3) AT: not in the map, its courses' discipline shown where they land", cell(d, "AT", "Status") === "Not in the map"
    && cell(d, "AT", "MQ discipline") === "None in the map" && cell(d, "AT", "Where its courses land") === "Automotive Technology 120");
  check("(3) ACCOUNT: in the map with no course in the seed", cell(d, "ACCOUNT", "Courses") === "0" && cell(d, "ACCOUNT", "Where its courses land") === "No course in the seed");

  // ── (4) filters and counts ──
  const fw = Array.from(d.querySelectorAll("#cs-local .csls-filters button, #cs-local .csls-filters span")).map(txt);
  check("(4) each filter word carries its count", ["Open (4)", "Not in the map (7)", "Most courses land elsewhere (1)", "Confirmed by a person (1)", "Left out on purpose (1)"]
    .every((x) => fw.indexOf(x) > -1), fw.join(" | "));
  words(d, "Most courses land elsewhere").click(); await settle();
  check("(4) Most courses land elsewhere keeps KIN, whose courses all sit in Kinesiology", rows(d).map(titleOf).join("|") === "KIN");
  words(d, "Open").click(); await settle();
  check("(4) Open keeps the map's unconfirmed filings and the one it moved past", rows(d).map(titleOf).join("|") === "AB|ACCOUNT|KIN|PSY", rows(d).map(titleOf).join("|"));
  const tf = boot({ hash: "#canonical-subj4/local/absent" });
  await settle();
  check("(4) #canonical-subj4/local/absent opens on Not in the map", rows(tf.d).map(titleOf).join("|") === "AT|AUT|AUTB|MATH|PE|PSYC|WELD", rows(tf.d).map(titleOf).join("|"));

  // ── (5) Confirm writes the filing ──
  const s = boot();
  await settle();
  check("(5) AB offers the map's filing, with how many of its courses land there",
    /Suggested: Auto Body Technology as its MQ discipline \(10 of 14 of its courses land there\)/.test(txt(sgOf(s.d, "AB"))), txt(sgOf(s.d, "AB")));
  check("(5) a code left out on purpose, and one a person confirmed, offer none", !sgOf(s.d, "NC") && !sgOf(s.d, "AUTO"));
  check("(5) a code the map does not name offers its top discipline", /Suggested: Automotive Technology as its MQ discipline \(where 120 of 120/.test(txt(sgOf(s.d, "AT"))));
  sgOf(s.d, "AB").querySelector("button").click(); await settle();
  check("(5) ⭐ Confirm writes the code's filing under DR-25's key", s.posts.length === 1 && s.posts[0].course_id === "_SUBJ_DISC::AB"
    && s.posts[0].field === "subject_discipline_confirm" && s.posts[0].value === "Auto Body Technology" && s.posts[0].reviewer_email === "curator@rccd.edu", JSON.stringify(s.posts));
  check("(5) the row then reads Confirmed by a person and the status line says so", cell(s.d, "AB", "Status") === "Confirmed by a person"
    && /Confirmed: AB under Auto Body Technology\./.test(note(s.d)), note(s.d));
  sgOf(s.d, "AT").querySelector("button").click(); await settle();
  check("(5) a filing for a code the map does not name says the map takes it under DR-25", s.posts[1] && s.posts[1].course_id === "_SUBJ_DISC::AT"
    && s.posts[1].value === "Automotive Technology" && cell(s.d, "AT", "Status") === "Filed by a person, not yet in the map"
    && /The map takes it when a session applies the filings under DR-25/.test(note(s.d)), note(s.d));

  // ── (6) a refused write, a signed-out reader ──
  const u = boot({ refuse: true });
  await settle();
  sgOf(u.d, "AB").querySelector("button").click(); await settle();
  check("(6) a refused write leaves the row as it was and says it did not reach the reference", cell(u.d, "AB", "Status") === "Open"
    && /did not reach the reference \(401\); nothing changed/.test(note(u.d)), note(u.d));
  const v = boot({ signedIn: false });
  await settle();
  check("(6) a signed-out reader sees the list and where to sign in", /You are not signed in/.test(txt(v.d.getElementById("cs-local"))));
  sgOf(v.d, "AB").querySelector("button").click(); await settle();
  check("(6) a signed-out Confirm writes nothing", v.posts.length === 0 && /Sign in on the Reference view/.test(note(v.d)), note(v.d));

  // ── (7) Edit saves a note ──
  const y = boot();
  await settle();
  rowOf(y.d, "KIN").querySelector("button[aria-label='Edit KIN']").click(); await settle();
  const box = y.d.getElementById("csls-note");
  check("(7) Edit opens the row's note", !!box);
  box.value = "KIN is kinesiology"; box.dispatchEvent(new y.w.Event("input"));
  words(y.d, "Save").click(); await settle();
  check("(7) ⭐ Save writes the note row only", y.posts.length === 1 && y.posts[0].course_id === "_SUBJ_DISC::KIN" && y.posts[0].field === "subject_discipline_note"
    && y.posts[0].value === "KIN is kinesiology", JSON.stringify(y.posts));
  check("(7) the note shows on the row", cell(y.d, "KIN", "Note") === "KIN is kinesiology");

  // ── (8) a subject map that cannot be read ──
  const z = boot({ noMap: true });
  await settle();
  check("(8) a subject map that cannot be read says so, never an empty list", /The subject map could not be read/.test(txt(z.d.getElementById("cs-local"))) && rows(z.d).length === 0);

  // ── the pure build ──
  const L = t.w.CPL_CSR_LOCAL;
  check("norm keeps letters and digits, upper case", L.norm("a&p-1 ") === "AP1");

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
