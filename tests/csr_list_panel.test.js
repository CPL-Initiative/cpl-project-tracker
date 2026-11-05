// The line over the Common Subjects Reference's List, its folded cards and an MQ discipline's side panel (the List norms,
// The List is the workspace; Sam, 2026-11-03: "incorporating the list view below the action/metric cards and make that
// top level collapsible while keeping the one-line action/metric links like we do elsewhere", and "a side bar open for
// list items to show all the details"). Exhibits and CR came first; Subjects is the third List on the engine's parts.
// Guards:
//   (1) the line reads the subjects row of kb/status/commons.json through the engine (api.line, readCommons): the pair's
//       count of its whole, the confirmed count, then each known issue;
//   (2) a count whose place is the List's own filter (Open, Confirmed by a person) is a word that sets it; the List's own
//       count is plain text until a filter is set; a count whose place is the Progress view stays a link;
//   (3) the Progress view's opened page (Needs attention, the three questions) sits in a fold under the line, under its
//       own prefix so its ids never meet the Progress view's; Hide the top hides it and its word says so;
//   (4) a failed read says the figures could not be read, once, with no retry loop; a summary whose modules do not
//       load says so once, and never loops;
//   (5) a title opens the panel: the MQ discipline, its local subjects in a sortable table, the codes it shares (a
//       collision and a code shared by design, each other MQ discipline's name opening its panel), and the rest folded;
//       the title's drawer moves in;
//   (6) Confirm this pick in the panel writes the discipline's own _CANON_SUBJ4 row, says so in the panel's status line,
//       and the row reads Confirmed by a person; signed out it writes nothing and says to sign in;
//   (7) tokens only, no glyph in the new code.
// Run from repo root: `npm test` (or `node tests/csr_list_panel.test.js`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(n) { return (n && n.textContent || "").trim(); }

const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const PROGRESS_SRC = fs.readFileSync("commons_progress.js", "utf8");
const PAGE_SRC = fs.readFileSync("commons_page.js", "utf8");

function entry(code, extra) {
  return Object.assign({ canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, data_modal_share: 0.8, total_mids: 10, variants_observed: {}, local_subject_variants: {},
    local_subject_total: 0, top_category_2digit: "09", canonical_source: "csr", authority_flag: "proposed", authority_chips: [],
    cid_subject_codes: [], ccn_subject_code: null }, extra || {});
}
function open(code, extra) { return entry(code, Object.assign({ source: "data_modal", reviewed_at: null, reviewed_by: null }, extra || {})); }
const LOCAL_COURSES = { discipline: "Automotive Technology", colleges: ["Alpha College", "Beta College", "Gamma College"],
  by: { AT: [[0, "101", "Brakes", "CCC000000101"], [0, "102", "Engine Repair", "CCC000000102"]],
    AUTO: [[0, "1", "Auto Basics", "CCC000000001"], [1, "10", "Auto Shop", "CCC000000010"], [2, "5", "Auto Systems", "CCC000000005"]] } };
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
  const posts = [], reads = [];
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
    if (u.indexOf("kb/status/commons.json") >= 0) {
      reads.push(u);
      if (!opts.commons) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opts.commons))) });
    }
    const body =
      u.indexOf("discipline_local_courses/index.json") >= 0 ? { files: { "Automotive Technology": "automotive-technology.json" } } :
      u.indexOf("discipline_local_courses/automotive-technology.json") >= 0 ? LOCAL_COURSES :
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
    if (opts.modules && s === "commons_progress.js") vm.runInContext(PROGRESS_SRC, ctx, { filename: "commons_progress.js" });
    if (opts.modules && s === "commons_page.js") vm.runInContext(PAGE_SRC, ctx, { filename: "commons_page.js" });
    setTimeout(cb, 0);
  } };
  vm.runInContext(SRC, ctx, { filename: "canonical_subj4.js" });
  return { w: w, d: w.document, posts: posts, reads: reads, confirms: confirms, loads: loads, M: () => w.CPL_CANONICAL_SUBJ4 };
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
/* The title cell carries its lines under the title (a suggestion, changed this visit), so a row is found by its title word. */
function titleOf(r) { return txt(r.querySelector(".csl-title .csl-open") || r.querySelector(".csl-title")); }
function rowOf(d, disc) { return rows(d).find((r) => titleOf(r) === disc); }
function cell(d, disc, name) { const r = rowOf(d, disc); return r ? txt(r.children[col(d, name)]) : null; }
/* The engine draws an empty cell as a dash it can be pressed on. */
function blank(s) { return s === "" || s === "\u2014"; }
function inDrawer(d, t) { return Array.from(d.querySelectorAll("#cs-list .csl-drawer button")).find((b) => txt(b) === t); }
/* A filter word carries its count, "Decided (2)"; a word is found by its label either way. */
function words(d, t) { return Array.from(d.querySelectorAll("#cs-list button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }
function boxOf(d, disc, label) { return Array.from(d.querySelectorAll(".csl-cellin")).find((b) => b.getAttribute("aria-label") === label + " of " + disc); }
function change(t, inp, v) { inp.value = v; inp.dispatchEvent(new t.w.Event("change")); }


const COMMONS = { schema: 1, written_at: "2026-11-04T06:00:00Z", rows: [{ key: "cr", pair: [], issues: [] }, { key: "subjects", title: "Common Subjects Reference",
  pair: [{ n: 136, of: 147, words: "MQ disciplines with courses carry a settled Common SUBJ: confirmed (by a person, or by the nightly procedure where the code is the authority's own), on the authority rule", open: "#canonical-subj4/list" },
    { n: 122, of: 147, words: "confirmed by a person, 122 of them settled", open: "#canonical-subj4/list/person", error: null }],
  issues: [{ n: 11, words: "MQ disciplines on the data's modal code, unconfirmed", open: "#canonical-subj4/open" },
    { n: 93, words: "identity codes that are neither a Common SUBJ nor an umbrella code, on 305 identities", open: "#canonical-subj4/progress" }] }] };
function lineOf(d) { return d.querySelector("#cs-list .csl-line"); }
function panel(d) { return d.getElementById("csl-panel"); }
function w0(d) { return d.defaultView; }
function titleBtn(d, disc) { const r = rowOf(d, disc); return r && r.querySelector(".csl-title button.csl-open"); }

(async function () {
  // ── (1) the line ──
  const t = boot({ commons: COMMONS });
  await settle();
  const d = t.d;
  const ln = lineOf(d);
  check("(1) ⭐ the line reads the subjects row: the pair's count of its whole, the confirmed count, each issue",
    ln && Array.from(ln.children).filter((x) => !x.classList.contains("csl-sep")).map(txt).join(" · ") === "136 of 147 MQ disciplines with courses carry a settled Common SUBJ · 122 confirmed by a person · 11 MQ disciplines on the data's modal code, unconfirmed · 93 identity codes that are neither a Common SUBJ nor an umbrella code, on 305 identities",
    ln && txt(ln));
  check("(1) the dots between the counts are quiet and hidden from a screen reader", Array.from(ln.querySelectorAll(".csl-sep")).length === 3
    && Array.from(ln.querySelectorAll(".csl-sep")).every((x) => x.getAttribute("aria-hidden") === "true"));
  check("(1) the Commons file is read once for the visit", t.reads.length === 1, String(t.reads.length));
  // ── (2) the counts open the List's own filters ──
  const ws = Array.from(ln.querySelectorAll("button")).map(txt);
  check("(2) Confirmed by a person and Open are words; the List's own count is plain text on All",
    ws.length === 2 && /^122 confirmed by a person$/.test(ws[0]) && /^11 MQ disciplines/.test(ws[1]), ws.join(" | "));
  check("(2) the count whose place is the Progress view stays a link", !!Array.from(ln.querySelectorAll("a")).find((a) => a.getAttribute("href") === "#canonical-subj4/progress"));
  Array.from(ln.querySelectorAll("button")).find((b) => /^11 /.test(txt(b))).click(); await settle();
  check("(2) ⭐ the unconfirmed count sets the List on Open", t.M()._state.ls.f === "open"
    && rows(d).map(titleOf).join("|") === "Agricultural Business and Related Services|Psychology", rows(d).map(titleOf).join("|"));
  const back = Array.from(lineOf(d).querySelectorAll("button")).find((b) => /^136 /.test(txt(b)));
  check("(2) the List's own count turns back into a word once a filter is set, and the Open count is plain text",
    !!back && !Array.from(lineOf(d).querySelectorAll("button")).find((b) => /^11 /.test(txt(b))));
  back.click(); await settle();
  check("(2) the List's own count clears the filter", t.M()._state.ls.f === "" && rows(d).length === 11);
  check("(1) a repaint does not read the file again", t.reads.length === 1, String(t.reads.length));

  // ── (4) the summary's modules not loaded: says so once, no loop ──
  const fold0 = d.getElementById("csl-fold");
  check("(4) a summary whose modules do not load says so", fold0 && /could not be loaded/.test(txt(fold0)) && t.loads.filter((s) => s === "commons_page.js").length === 1,
    t.loads.join(","));

  // ── (3) the folded cards ──
  const tm = boot({ commons: COMMONS, modules: true });
  await settle();
  const fold = tm.d.getElementById("csl-fold"), tog = tm.d.getElementById("csl-fold-w");
  check("(3) ⭐ the Progress view's page sits in the fold: Needs attention and the three questions, under its own prefix",
    fold && !fold.hidden && !!fold.querySelector("#csl-pg-attention") && /What is it called\?/.test(txt(fold)) && /Whose code is it\?/.test(txt(fold))
    && !fold.querySelector("[id^='cs-pg-']"), fold && txt(fold).slice(0, 200));
  check("(3) the fold's word reads Hide the top and controls the fold", tog && txt(tog) === "Hide the top"
    && tog.getAttribute("aria-expanded") === "true" && tog.getAttribute("aria-controls") === "csl-fold");
  tog.click(); await settle();
  const tog2 = tm.d.getElementById("csl-fold-w");
  check("(3) ⭐ Hide the top hides it; the word says Show the top and keeps focus", tm.d.getElementById("csl-fold").hidden
    && txt(tog2) === "Show the top" && tog2.getAttribute("aria-expanded") === "false" && tm.d.activeElement === tog2);
  tog2.click(); await settle();
  check("(3) Show the top brings it back", !tm.d.getElementById("csl-fold").hidden && !!tm.d.querySelector("#csl-pg-attention"));

  // ── (4) a failed read ──
  const tf = boot();
  await settle(); await settle();
  check("(4) ⭐ a failed read says the figures could not be read, and reads once (no loop)",
    /could not be read/.test(txt(lineOf(tf.d))) && tf.reads.length === 1, txt(lineOf(tf.d)) + " / " + tf.reads.length);

  // ── (5) the panel ──
  titleBtn(d, "Automotive Technology").click(); await settle();
  const p = panel(d);
  check("(5) ⭐ a title opens the panel, named for the MQ discipline", p && txt(d.getElementById("csl-panel-t")) === "MQ discipline: Automotive Technology"
    && /AUTO/.test(txt(p.querySelector(".csl-pn-meta"))) && /Confirmed by a person/.test(txt(p.querySelector(".csl-pn-meta"))));
  const lt = p.querySelector("#csl-pn-locals");
  const lrows = lt ? Array.from(lt.querySelectorAll("tbody tr")).map((r) => Array.from(r.children).map(txt).join(",")) : [];
  // Colleges beside Courses, sorted by colleges (Sam, 2026-11-04, on Diesel Mechanics: "show me the count of colleges
  // that use each subject code so I can see if one code is more common than others"; "keep the course column").
  check("(5) ⭐ its local subjects, by the colleges that use each code, with courses, share, and the Common SUBJ named",
    lrows.join("|") === "AUTO,3,300,64%,The Common SUBJ; Most courses; Most colleges|AT,1,120,26%,|AUT,,50,11%,"
    && /5 local codes on 470 local courses; 2 more/.test(txt(p)) && /Colleges counts the colleges/.test(txt(p)), lrows.join("|"));
  check("(5) the members table is a labelled region with th scope=col", lt.getAttribute("role") === "region" && !!lt.getAttribute("aria-label")
    && lt.querySelectorAll("th[scope='col']").length === 5 && txt(lt.querySelectorAll("th")[1]) === "Colleges, high to low");
  const sortBtn = Array.from(lt.querySelectorAll("th button")).find((b) => /^Courses/.test(txt(b)));
  sortBtn.click(); await settle();
  const lrows2 = Array.from(panel(d).querySelectorAll("#csl-pn-locals tbody tr")).map((r) => txt(r.children[0]));
  check("(5) Courses opens high to low, so a press sorts it low to high", lrows2.join(",") === "AUT,AT,AUTO"
    && /^Courses, low to high/.test(txt(panel(d).querySelectorAll("#csl-pn-locals th button")[2])), lrows2.join(","));
  // (5b) the courses behind a count (Sam, 2026-11-04, on ECONMT's 55: "Add a hover over on the 55 so I can see the 55
  //      course titles"): the panel reads its MQ discipline's course file as it opens, each count's tooltip names them,
  //      a press lists them under the table, and the way to refile the code opens Local subjects on it.
  const atBtn = panel(d).querySelector("#csl-lc-AT");
  check("(5b) ⭐ a count is a word whose tooltip names its courses", !!atBtn && atBtn.tagName === "BUTTON" && /^AT 101  Brakes\nAT 102  Engine Repair$/.test(atBtn.title || ""), atBtn && atBtn.title);
  atBtn.click(); await settle();
  const lc = panel(d).querySelector(".csl-lc");
  const lcRows = lc ? Array.from(lc.querySelectorAll("tbody tr")).map((r) => Array.from(r.children).map(txt).join(",")) : [];
  check("(5b) ⭐ pressing it lists the courses with their control numbers, at their one college", !!lc && /The courses on AT/.test(txt(lc))
    && lcRows.join("|") === "AT 101,Brakes,CCC000000101|AT 102,Engine Repair,CCC000000102" && /2 courses, all at Alpha College/.test(txt(lc))
    && panel(d).querySelector("#csl-lc-AT").getAttribute("aria-expanded") === "true", lcRows.join("|"));
  const refile = Array.from(lc.querySelectorAll("button")).find((b) => txt(b) === "Refile AT in Local subjects");
  check("(5b) the courses offer the way to refile the code, and to hide them", !!refile && Array.from(lc.querySelectorAll("button")).some((b) => txt(b) === "Hide the courses"));
  const noList = panel(d).querySelector("#csl-lc-AUT");
  check("(5b) a code the build names no courses for says so in its tooltip", !!noList && /No course list for AUT/.test(noList.title || ""));
  refile.click(); await settle();
  check("(5b) ⭐ Refile opens the Local subjects view", /canonical-subj4\/local/.test(w0(d).location.hash) || !!d.querySelector("#cs-local:not([hidden])"), w0(d).location.hash);
  w0(d).location.hash = "#canonical-subj4/list"; await settle();
  check("(5) the title's drawer moves in: the MQ discipline's other words", !!panel(d).querySelector(".csl-pdrawer"));
  check("(5) the rest folded: authority and note", !!panel(d).querySelector("details.csl-pn-more") && /C-ID code/.test(txt(panel(d).querySelector("details.csl-pn-more")))
    && /Note: a note/.test(txt(panel(d).querySelector("details.csl-pn-more"))));
  titleBtn(d, "Auto Body Technology").click(); await settle();
  const sh = panel(d).querySelector("#csl-pn-shares");
  const shRows = sh ? Array.from(sh.querySelectorAll("tbody tr")).map((r) => txt(r.children[0]) + "," + txt(r.children[1]) + "," + txt(r.children[3])) : [];
  check("(5) ⭐ the codes it shares: the AUTB collision with the other MQ discipline", shRows.join("|") === "AUTB,Agricultural Business and Related Services,A collision", shRows.join("|"));
  sh.querySelector("tbody button").click(); await settle();
  check("(5) another MQ discipline's name opens its panel", txt(d.getElementById("csl-panel-t")) === "MQ discipline: Agricultural Business and Related Services");
  titleBtn(d, "Film and Media Studies").click(); await settle();
  check("(5) a fan-in reads as shared by design", /FTVE,Media Production,Shared by design/.test(Array.from(panel(d).querySelectorAll("#csl-pn-shares tbody tr")).map((r) => [0, 1, 3].map((i) => txt(r.children[i])).join(",")).join("|")));

  // ── (6) Confirm this pick in the panel ──
  titleBtn(d, "Psychology").click(); await settle();
  check("(6) an open pick says it waits for a person", /Open: the pick is the data's most-used code/.test(txt(panel(d).querySelector(".csl-pn-dec"))));
  d.getElementById("csl-pn-confirm").click(); await settle();
  check("(6) ⭐ Confirm this pick writes the discipline's own code row", t.posts.length === 1 && t.posts[0].course_id === "_CANON_SUBJ4::Psychology"
    && t.posts[0].field === "canonical_subj4" && t.posts[0].value === "PSYC", JSON.stringify(t.posts));
  check("(6) the panel's status line says it, and the row reads Confirmed by a person",
    /Confirmed PSYC for Psychology/.test(txt(panel(d).querySelector("[role=status]"))) && cell(d, "Psychology", "Status") === "Confirmed by a person",
    txt(panel(d).querySelector("[role=status]")));
  check("(6) the panel stays open and the pick no longer offers Confirm", !!panel(d) && !d.getElementById("csl-pn-confirm"));
  const so = boot({ signedIn: false });
  await settle();
  titleBtn(so.d, "Psychology").click(); await settle();
  so.d.getElementById("csl-pn-confirm").click(); await settle();
  check("(6) signed out, Confirm writes nothing and says to sign in", so.posts.length === 0 && /Sign in as a reviewer/.test(txt(panel(so.d).querySelector("[role=status]"))));

  // ── (7) the source ──
  const block = SRC.slice(SRC.indexOf("var LINE_FILTERS"), SRC.indexOf("function listApi()"));
  check("(7) no raw hex and no glyph in the new code", block.length > 2000 && !/#[0-9a-fA-F]{3,6}\b/.test(block.replace(/#canonical-subj4[^"]*/g, ""))
    && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(block));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { results.forEach(([n, ok, why]) => console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why))); console.error(e); process.exit(1); });
