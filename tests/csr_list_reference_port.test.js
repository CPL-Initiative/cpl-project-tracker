// The Common Subjects Reference's List carries what only its Reference view did, before that view retires (the List
// norms: a view retires once its List does what it does; port first, SkyMulberry's lesson). Guards:
//   (1) the Reference view's lists are the List's filters: No code yet, Confirmed, On the CCN code, On the C-ID code,
//       An official code differs, Proposed; each old address and every Progress count opens the List on its filter;
//   (2) the sign-in sits on the List's head: signed out it offers the sign-in, signed in it names the reviewer, and
//       sign out repaints the List signed out;
//   (3) Run the SUBJ check opens the check from the List, and the List stays;
//   (4) the panel carries the CPL window (the credentials articulated to its courses) and the variants window's
//       official courses (the C-ID and CCN courses on its codes), each folded;
//   (5) the TOP column takes the TOP filter's place, and a quickstart hint (status, TOP, search) opens the List on them,
//       surviving the visit's reset on arrival.
// Run from repo root: `npm test` (or `node tests/csr_list_reference_port.test.js`).
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
      u.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
      u.indexOf("kb_curation") >= 0 ? OVERLAY :
      u.indexOf("discipline_aliases.json") >= 0 ? ALIASES :
      u.indexOf("cid_descriptors") >= 0 ? { descriptors: [{ descriptor: "AUTO 100", title: "Intro" }] } :
      u.indexOf("ccn_courses") >= 0 ? { courses: [{ ccn: "MATH C1000", subject: "MATH", number: "C1000", title: "Math" }] } :
      u.indexOf("mq_sections") >= 0 ? { disciplines: { "Mathematics": { mq_list: "masters", mq_list_label: "Master's degree list" } } } :
      u.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: opts.cpl || {} } : {};
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
function titleOf(r) { return txt(r.children[1].querySelector(".csl-open") || r.children[1]); }
function rowOf(d, disc) { return rows(d).find((r) => titleOf(r) === disc); }
function cell(d, disc, name) { const r = rowOf(d, disc); return r ? txt(r.children[col(d, name)]) : null; }
/* The engine draws an empty cell as a dash it can be pressed on. */
function blank(s) { return s === "" || s === "\u2014"; }
function inDrawer(d, t) { return Array.from(d.querySelectorAll("#cs-list .csl-drawer button")).find((b) => txt(b) === t); }
/* A filter word carries its count, "Decided (2)"; a word is found by its label either way. */
function words(d, t) { return Array.from(d.querySelectorAll("#cs-list button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t); }
function boxOf(d, disc, label) { return Array.from(d.querySelectorAll(".csl-cellin")).find((b) => b.getAttribute("aria-label") === label + " of " + disc); }
function change(t, inp, v) { inp.value = v; inp.dispatchEvent(new t.w.Event("change")); }


function panel(d) { return d.getElementById("csl-panel"); }
function titleBtn(d, disc) { const r = rowOf(d, disc); return r && r.children[1].querySelector("button.csl-open"); }
function count(d, label) { const b = words(d, label); const m = b && /\(([\d,]+)\)$/.exec(txt(b)); return m ? Number(m[1].replace(/,/g, "")) : null; }
const CPL = { "Automotive Technology": { n_creds: 2, n_colleges: 5, n_courses: 3,
  creds: [{ c: "ASE A1 Engine Repair", i: "ASE", n: 4 }, { c: "ASE A8 Engine Performance", i: "ASE", n: 5 }] } };

(async function () {
  // ── (1) the filters ──
  const t = boot({ cpl: CPL });
  await settle();
  const d = t.d, M = t.M();
  check("(1) ⭐ the Reference view's lists are filters on the List, each with its count",
    count(d, "No code yet") === 0 && count(d, "Confirmed") === 9 && count(d, "On the CCN code") === 1 && count(d, "On the C-ID code") === 1
    && count(d, "An official code differs") === 1 && count(d, "Proposed, no official code") === 9,
    ["No code yet", "Confirmed", "On the CCN code", "On the C-ID code", "An official code differs", "Proposed, no official code"].map((x) => x + " " + count(d, x)).join(", "));
  words(d, "An official code differs").click(); await settle();
  check("(1) An official code differs lists the one with a chip", rows(d).map(titleOf).join("|") === "Automotive Technology", rows(d).map(titleOf).join("|"));
  words(d, "On the CCN code").click(); await settle();
  check("(1) On the CCN code lists Mathematics", rows(d).map(titleOf).join("|") === "Mathematics");
  check("(1) every Progress count opens the List or the check, never the Reference view",
    Object.keys(M.TO).every((k) => M.TO[k].view !== "reference") && M.TO.needsReview.filter === "nocode" && M.TO.reviewed.filter === "confirmed" && M.TO.chip.filter === "chip");
  t.w.location.hash = "#canonical-subj4/proposed"; t.w.dispatchEvent(new t.w.Event("hashchange")); await settle();
  check("(1) an old filter address opens the List on its filter", M._state.view === "list" && M._state.ls.f === "proposed" && rows(d).length === 9);

  // ── (2) the sign-in on the List's head ──
  const head = () => d.querySelector("#cs-list .csl-auth");
  check("(2) ⭐ signed in, the List's head names the reviewer and offers sign out", !!head() && /curator@rccd\.edu/.test(txt(head())) && /sign out/.test(txt(head())), head() && txt(head()));
  check("(2) the List no longer sends a reader to the Reference view to sign in", !/Go to the Reference view/.test(txt(d.getElementById("cs-list"))));
  Array.from(head().querySelectorAll("a")).find((a) => txt(a) === "sign out").click(); await settle();
  check("(2) sign out repaints the List signed out, with the sign-in beside it", /not signed in/.test(txt(head())) && /sign in to edit/.test(txt(head())) && !t.w.sessionStorage.getItem("cpl_sb"));
  const so = boot({ signedIn: false });
  await settle();
  check("(2) signed out from the start, the head offers the sign-in", /You are not signed in/.test(txt(so.d.querySelector("#cs-list .csl-auth"))) && /sign in to edit/.test(txt(so.d.querySelector("#cs-list .csl-auth"))));

  // ── (3) the SUBJ check ──
  const t3 = boot();
  await settle();
  t3.d.getElementById("csl-check").click(); await settle();
  const modal = t3.d.getElementById("cs-check-modal");
  check("(3) ⭐ Run the SUBJ check opens the check, and the List stays", !!modal && modal.classList.contains("show") && t3.M()._state.view === "list" && !t3.d.getElementById("cs-list").hidden);
  check("(3) the check names the collision", /AUTB/.test(txt(modal)));

  // ── (4) the panel ──
  const t4 = boot({ cpl: CPL });
  await settle();
  titleBtn(t4.d, "Automotive Technology").click(); await settle();
  const pn = panel(t4.d);
  const folds = pn ? Array.from(pn.querySelectorAll("details summary")).map(txt) : [];
  check("(4) ⭐ the panel carries the CPL window, folded", folds.indexOf("Its CPL opportunities: 2 credentials at 5 colleges") >= 0, folds.join(" | "));
  const cplRows = pn ? Array.from(pn.querySelectorAll("#csl-pn-cpl tbody tr, [id$='cpl'] tbody tr")).map(txt) : [];
  check("(4) its table lists each credential, most colleges first", cplRows.length === 2 && /Engine Performance/.test(cplRows[0]), cplRows.join(" | "));
  check("(4) ⭐ and the official courses on its codes", folds.indexOf("C-ID and CCN courses on its codes: 1") >= 0 && /AUTO 100/.test(txt(pn)), folds.join(" | "));
  titleBtn(t4.d, "Psychology").click(); await settle();
  const folds2 = Array.from(panel(t4.d).querySelectorAll("details summary")).map(txt);
  check("(4) a discipline with no CPL shows no CPL fold, and says it has no official course", !folds2.some((f) => /CPL opportunities/.test(f)) && folds2.indexOf("C-ID and CCN courses on its codes: none") >= 0, folds2.join(" | "));

  // ── (5) TOP and the quickstart hint ──
  check("(5) the TOP column sits before Notes", col(t4.d, "TOP") === col(t4.d, "Notes") - 1 && /^09/.test(cell(t4.d, "Psychology", "TOP")), String(cell(t4.d, "Psychology", "TOP")));
  const t5 = boot({ hash: "#canonical-subj4/progress" });
  await settle();
  t5.w.dispatchEvent(new t5.w.CustomEvent("cpl-qs-hint", { detail: { tab: "canonical-subj4", hint: { status: "pre_seeded", top_2digit: "01" } } }));
  await settle();
  // The tab's arrival resets the visit's List state; the hint waits for the next one.
  t5.w.dispatchEvent(new t5.w.CustomEvent("cpl-tab-activated", { detail: { tab: "elsewhere" } }));
  t5.w.dispatchEvent(new t5.w.CustomEvent("cpl-tab-activated", { detail: { tab: "canonical-subj4" } }));
  await settle();
  check("(5) ⭐ a quickstart hint opens the List on its status and TOP, past the visit's reset",
    t5.M()._state.view === "list" && rows(t5.d).map(titleOf).join("|") === "Agricultural Business and Related Services", rows(t5.d).map(titleOf).join("|"));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { results.forEach(([n, ok, why]) => console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why))); console.error(e); process.exit(1); });
