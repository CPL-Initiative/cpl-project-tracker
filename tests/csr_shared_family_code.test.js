// The Common Subjects Reference's SUBJ check: a family code one MQ discipline took as its own
// while the umbrellas keep declaring it is shared by design, never a collision (S427).
//
// Sam, Open Asks Sheet 99 card 3 (2026-10-19, "agab"): Agricultural Business and Related
// Services takes AGAB, the C-ID family code AG-AB, which the two agriculture umbrellas declare
// among their codes (cards 4 to 6 of 2026-09-03). Before this change the tab's check read a
// code owned by a canonical holder and two umbrella declarers as a collision, so the ruling
// would have replaced the one collision it closed (AUTB) with a false one (AGAB). Guards:
//   - AGAB: one discipline canonical on it, two umbrellas declaring it: shared by design;
//   - a code two disciplines are canonical on is still the collision;
//   - two disciplines canonical on a code an umbrella also declares are still a collision;
//   - the discipline's row off its code (AUTB M1071 under Agricultural Business, Sam's
//     2026-07-13 row, his card) is still listed as drift, which is true.
//
// Run from repo root: `npm test` (or `node tests/csr_shared_family_code.test.js`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(n) { return (n && n.textContent || "").trim(); }

const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
const MODULE = fs.readFileSync("commons_progress.js", "utf8");
const PROCS = JSON.parse(fs.readFileSync("kb/csr_procedures.json", "utf8"));

function entry(code, extra) {
  return Object.assign({ canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, total_mids: 10, variants_observed: {}, local_subject_variants: {}, top_category_2digit: "01",
    canonical_source: "csr", authority_flag: "proposed", authority_chips: [], cid_subject_codes: [], ccn_subject_code: null }, extra || {});
}
const SEED = {
  _counts: {}, _seeded_at: "2026-10-19", _synced_at: "2026-10-19T21:00:00Z",
  disciplines: {
    // The ruled case: one discipline canonical on AGAB, two umbrellas declaring it.
    "Agricultural Business and Related Services": entry("AGAB", { reviewed_by: "csr-s427@bot", reviewed_at: "2026-10-19T21:51:34Z", variants_observed: { AGAB: 1, AUTB: 1 }, total_mids: 2 }),
    "Agriculture": entry("AGRI", { is_umbrella: true, umbrella_codes: ["AGAB", "AGAS", "AGRI"], variants_observed: { AGRI: 6, AGAB: 4 } }),
    "Agricultural Production": entry("AGPR", { is_umbrella: true, umbrella_codes: ["AGAB", "AGAS", "AGPR"], variants_observed: { AGPR: 3, AGAB: 1 } }),
    "Auto Body Technology": entry("AUTB", { variants_observed: { AUTB: 9 }, top_category_2digit: "09" }),
    // A genuine collision: two disciplines canonical on one code.
    "Cosmetology": entry("COSM", { variants_observed: { COSM: 5 }, top_category_2digit: "30" }),
    "Barbering": entry("COSM", { source: "data_modal", reviewed_at: null, reviewed_by: null, variants_observed: { COSM: 2 }, top_category_2digit: "30" }),
    // Two canonical holders behind an umbrella's declaration: still a collision.
    "Welding": entry("WELD", { variants_observed: { WELD: 8 }, top_category_2digit: "09" }),
    "Welding Technology": entry("WELD", { variants_observed: { WELD: 3 }, top_category_2digit: "09" }),
    "Machining": entry("MACH", { is_umbrella: true, umbrella_codes: ["MACH", "WELD"], variants_observed: { MACH: 4, WELD: 1 }, top_category_2digit: "09" })
  }
};
const SCAN = { _scanned_at: "2026-10-19", _registry_synced_at: "2026-10-19T21:00:00Z", _disciplines: 9,
  _mid_codes: { ids: 50, codes: 8, canonical: 6, umbrella: 2, stray_codes: 0, stray_ids: 0, strays: [] }, findings: [] };
const STATUS = { schema: 1, project: "subjects", written_at: "2026-10-19T21:00:00Z", session: 427, moniker: "SkyMadrona", run: "Sam's session", decider: "Sam",
  handoff: "docs/session_427_handoff.md", next_step: { title: "Next", text: "Next." }, calls: [], changes: [], notes: {}, headline: [] };
const MQ = { _extracted_at: "2026-07-10", disciplines: {} };
Object.keys(SEED.disciplines).forEach(function (d) { MQ.disciplines[d] = { mq_list: "masters" }; });

function mockFetch(url) {
  const u = String(url);
  const body =
    u.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
    u.indexOf("kb_curation") >= 0 ? [] :
    u.indexOf("cid_descriptors") >= 0 ? { _source: "CID (retrieved 2026-05-20)", descriptors: [{ descriptor: "AG-AB 104", title: "Introduction to Agriculture Business" }] } :
    u.indexOf("ccn_courses") >= 0 ? { _source: "COCI (retrieved 2026-05-20)", courses: [] } :
    u.indexOf("mq_sections") >= 0 ? MQ :
    u.indexOf("csr_out/latest.json") >= 0 ? SCAN :
    u.indexOf("status/subjects.json") >= 0 ? STATUS :
    u.indexOf("csr_procedures.json") >= 0 ? PROCS :
    u.indexOf("discipline_aliases.json") >= 0 ? { aliases: {} } :
    u.indexOf("foreign_language_subj4.json") >= 0 ? { discipline: "Foreign Languages", languages: {} } :
    u.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: {} } : {};
  return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
}

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="tab-canonical-subj4">
    <div id="cs-toolbar"></div><div id="cs-summary"></div>
    <div id="cs-table-wrap"></div><div id="cs-toast"></div>
    <div id="cs-variants-modal" class="cs-modal-bg"><div class="cs-modal"><button class="cs-modal-close"></button><h3 id="cs-variants-title"></h3><div id="cs-variants-body"></div></div></div>
  </div></body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/#canonical-subj4" });
const w = dom.window;
w.fetch = mockFetch;
w.matchMedia = w.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
w.HTMLElement.prototype.scrollIntoView = function () {};
const ctx = dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(w);
vm.runInContext(MODULE, ctx, { filename: "commons_progress.js" });
vm.runInContext(SRC, ctx, { filename: "canonical_subj4.js" });

setTimeout(function () {
  try {
    const d = w.document;
    const pg = d.getElementById("cs-progress");
    const cards = pg.querySelectorAll(".prh-pg-part");
    const one = Array.prototype.filter.call(cards, function (c) { return txt(c.querySelector("h4")) === "One code, one MQ discipline"; })[0];
    const what = txt(one && one.querySelector(".prh-pg-what"));
    check("the view drew the one-code card", !!one);
    check("two collisions, COSM (two canonical holders) and WELD (two canonical holders behind an umbrella's declaration), and not AGAB: " + what,
      /2 codes on two MQ disciplines \(COSM, WELD\)/.test(what));
    check("AGAB (a family code one discipline took, two umbrellas declare) and AGAS (two umbrellas declare) are the codes shared by design", /2 codes are shared by design/.test(what));
    check("Agricultural Business's row off its code (AUTB, Sam's 2026-07-13 row on M1071) is still listed as drift", /1 discipline carries rows off their code/.test(what));
    const pair = Array.prototype.map.call(pg.querySelectorAll(".prh-pg-pair .prh-pg-n b"), txt);
    // Settled is confirmed less every owner of a collided code: Cosmetology, Welding, Welding Technology and
    // Machining (whose umbrella declares WELD) leave 4 of the 8 confirmed; Agricultural Business stays.
    check("the headline counts Agricultural Business as settled: 8 confirmed (7 by a person, 1 by the cohort), less the four confirmed owners of a collided code, is 4 of 9: " + pair.join(","), pair.join(",") === "9,4");
    const conf = Array.prototype.filter.call(cards, function (c) { return txt(c.querySelector("h4")) === "Confirmation"; })[0];
    check("the confirmation card counts the cohort's pick beside a person's", /8 of 9 picks confirmed by a person or a session cohort \(1\)/.test(txt(conf.querySelector(".prh-pg-what"))));
    check("no glyph in the rendered Progress text", !/[☀-➿⬀-⯿\u{1f300}-\u{1faff}]/u.test(txt(pg)));
  } catch (e) {
    check("no exception while checking: " + (e && e.stack || e), false);
  }
  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log(failed ? failed + " check(s) failed" : "all " + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
}, 400);
