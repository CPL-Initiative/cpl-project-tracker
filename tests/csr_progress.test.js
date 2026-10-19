// The Common Subjects Reference's Progress view (S425, 2026-10-19): the Commons' dash for the
// reference, drawn by the shared commons_progress.js from this tab's definitions.
//
// Sam, 2026-10-19: "Can you develop a dash for CSR similar to the one you created for PR?" and
// "We should have a CSR dash card for each key step that needs monitoring and stores the
// procedures needed by agents"; "Add 'MQ' to the title for Discipline". Guards:
//   - static: both HTMLs identical and saying MQ discipline; the column, filter and summary
//     words; CI and the daily workflow wired; the module's second word per part;
//   - the two views: Progress opens by default, the switch is two underlined words, the table
//     and its toolbar hide under Progress; the last view is remembered;
//   - the context from the fixture: the headline pair (settled = confirmed less the
//     collisions), the five milestones with You are here on the confirmations, eight cards
//     in the ruled order, the procedures from the real store under the cards, the findings;
//   - a count opens the Reference view with exactly its filter (the Commons' step 3), the
//     address routes a filter and a view, the SUBJ check opens from its card;
//   - the pick's reviewer is the code row's, not a later note's (the eleven-cohort misread);
//   - a failed read says so on the card, never a zero; without the module the view says so
//     and the table still draws; tokens only, no glyph, American spelling.
//
// Run from repo root: `npm test` (or `node tests/csr_progress.test.js`).
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(n) { return (n && n.textContent || "").trim(); }

const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
const MODULE = fs.readFileSync("commons_progress.js", "utf8");
const PROCS = JSON.parse(fs.readFileSync("kb/csr_procedures.json", "utf8"));
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");

// ───────────────────────────── Part A — static invariants ─────────────────────────────
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("the tab's subtitle says per MQ discipline", /one shared 4-letter subject code per MQ discipline/.test(cpl));
check("the scope note says MQ discipline names", /MQ discipline names<\/strong> on this page/.test(cpl));
check("the column is MQ Discipline", /label: "MQ Discipline"/.test(SRC));
check("the filter's first word is All MQ disciplines", /"All MQ disciplines"/.test(SRC));
check("the summary counts MQ disciplines", /<\/strong> MQ disciplines · /.test(SRC));
check("the identifiers kept their names (the hash, the namespace, the field)", /canonical-subj4/.test(SRC) && /_CANON_SUBJ4::/.test(SRC) && /"canonical_subj4"/.test(SRC));
check("the tab reads the scan, the run log and the procedures", /kb\/csr_out\/latest\.json/.test(SRC) && /kb\/status\/subjects\.json/.test(SRC) && /kb\/csr_procedures\.json/.test(SRC));
check("the module draws a second word per part", /o\.p\.more \? o\.p\.more\(x\)/.test(MODULE) && /\.prh-pg-more \{ position:relative; z-index:1; \}/.test(MODULE));
const ci = fs.readFileSync(".github/workflows/js-tests.yml", "utf8");
check("CI runs the procedures store test", /python3 tests\/csr_procedures_test\.py/.test(ci));
const wf = fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8");
check("the daily workflow scans before the Commons build and commits latest.json",
  /python3 kb\/_csr_trail\.py --latest/.test(wf) && /git add kb\/csr_out\/latest\.json/.test(wf) && wf.indexOf("_csr_trail.py --latest") < wf.indexOf("_build_commons_status.py"));
const cssBlock = SRC.slice(SRC.indexOf("function ensureProgressCss()"), SRC.indexOf("].join(\"\\n\")]));", SRC.indexOf("function ensureProgressCss()")));
check("the injected CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(cssBlock.replace(/#tab-canonical-subj4/g, "").replace(/#cs-/g, "")));
check("the injected CSS uses tokens", /var\(--cobalt\)/.test(cssBlock) && /var\(--border\)/.test(cssBlock) && /var\(--text-muted\)/.test(cssBlock));
check("the word controls are 24px tall, underlined, with no fill", /\.cs-word \{[^}]*background:none;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(cssBlock));
check("the hidden attribute wins over the toolbar's display rule", /\.cs-toolbar\[hidden\], #tab-canonical-subj4 \.cs-summary\[hidden\], #tab-canonical-subj4 \.cs-table-wrap\[hidden\] \{ display:none; \}/.test(cssBlock));
check("single column on a phone", /@media \(max-width: 760px\) \{ #tab-canonical-subj4 \.cs-progress \.prh-pg-steps \{ grid-template-columns:minmax\(0, 1fr\)/.test(cssBlock));
const progressBlock = SRC.slice(SRC.indexOf("var SCAN_URL"), SRC.indexOf("// Quickstart-C hint consumer"));
check("no glyph in the Progress view's words", !/[\u2190-\u21ff\u2600-\u27bf\u2b00-\u2bff\u{1f300}-\u{1faff}]/u.test(progressBlock));
check("American spelling in the Progress view's words", !/\b(colour|behaviour|organisation|analyse|centre|cancelled|catalogue|whilst|amongst|licence)\b/i.test(progressBlock));
check("no funding word drifts in", !/\b(money|earn|earned)\b/i.test(progressBlock));

// ───────────────────────────── Part B — the view in jsdom ─────────────────────────────
function entry(code, extra) {
  return Object.assign({ canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, total_mids: 10, variants_observed: {}, local_subject_variants: {}, top_category_2digit: "09",
    canonical_source: "csr", authority_flag: "proposed", authority_chips: [], cid_subject_codes: [], ccn_subject_code: null }, extra || {});
}
const SEED = {
  _counts: {}, _seeded_at: "2026-09-30", _synced_at: "2026-10-19T13:25:33Z",
  disciplines: {
    "Automotive Technology": entry("AUTO", { canonical_source: "c-id", authority_flag: null, cid_subject_codes: ["AUTO"], authority_chips: [{ system: "C-ID", code: "ALTF" }], variants_observed: { AUTO: 10 } }),
    "Auto Body Technology": entry("AUTB", { variants_observed: { AUTB: 9, ZUTB: 1 } }),
    "Agricultural Business and Related Services": entry("AUTB", { source: "data_modal", reviewed_at: null, reviewed_by: null, total_mids: 1, variants_observed: { AUTB: 1 }, top_category_2digit: "01" }),
    "Mathematics": entry("MATH", { source: "data_modal", reviewed_at: null, reviewed_by: null, canonical_source: "ccn", authority_flag: null, ccn_subject_code: "MATH", cid_subject_codes: ["MATH"], variants_observed: { MATH: 10 }, top_category_2digit: "17" }),
    "Psychology": entry("PSYC", { canonical_source: "ccn", authority_flag: null, ccn_subject_code: "PSYC", cid_subject_codes: ["PSY"], variants_observed: { PSYC: 10 }, top_category_2digit: "20" }),
    "Foreign Languages": entry("FLNG", { is_umbrella: true, umbrella_codes: ["FLNG", "SPAN", "FREN"], variants_observed: { SPAN: 6, FREN: 4 }, top_category_2digit: "11" }),
    "Kinesiology": entry("KINE", { is_umbrella: true, umbrella_codes: ["ATHL", "KINE"], variants_observed: { KINE: 7, ATHL: 3 }, top_category_2digit: "08" }),
    // A fan-in pair both entries declare shares FTVE by ruling (Sam, 2026-09-03, item 13).
    "Film and Media Studies": entry("FTVE", { fan_in_with: ["Media Production"], variants_observed: { FTVE: 8 }, top_category_2digit: "06" }),
    "Media Production": entry("FTVE", { fan_in_with: ["Film and Media Studies"], variants_observed: { FTVE: 2 }, top_category_2digit: "06" }),
    // The two agriculture umbrellas carry the same family code by design (cards 4 to 6 the same day).
    "Agriculture": entry("AGRI", { is_umbrella: true, umbrella_codes: ["AGAB", "AGRI"], variants_observed: { AGRI: 6, AGAB: 4 }, top_category_2digit: "01" }),
    "Agricultural Production": entry("AGPR", { is_umbrella: true, umbrella_codes: ["AGAB", "AGPR"], variants_observed: { AGPR: 3, AGAB: 1 }, top_category_2digit: "01" })
  }
};
// The live picks: a code row by a person, then a note a session cohort wrote later.
const OVERLAY = [
  { course_id: "_CANON_SUBJ4::Automotive Technology", field: "canonical_subj4", value: "AUTO", reviewer_email: "map@rccd.edu", reviewed_at: "2026-05-23T17:00:00Z" },
  { course_id: "_CANON_SUBJ4::Automotive Technology", field: "canonical_subj4_notes", value: "a note", reviewer_email: "csr-doctrine-s111@bot", reviewed_at: "2026-07-10T09:00:00Z" },
  { course_id: "_CANON_SUBJ4::Psychology", field: "canonical_subj4", value: "PSYC", reviewer_email: "map@rccd.edu", reviewed_at: "2026-06-12T17:00:00Z" }
];
// A descriptor ending in " X" (172 of the 495 real ones) must be indexed too (S425).
const CID = { _source: "CID_approved_descriptors_3.csv (CCCCO, retrieved 2026-05-20)", descriptors: [
  { descriptor: "AUTO 100", title: "Intro" }, { descriptor: "ALTF 110", title: "Fuels" }, { descriptor: "MATH 110", title: "Math" }, { descriptor: "PSY 110", title: "Psych" },
  { descriptor: "WELD 100 X", title: "Welding" }] };
const CCN = { _source: "COCI_Summary.xlsx col 'COMMON COURSE NUMBER', retrieved 2026-05-20", courses: [
  { ccn: "MATH C1000", subject: "MATH", number: "C1000", title: "Math" }, { ccn: "PSYC C1000", subject: "PSYC", number: "C1000", title: "Psych" }, { ccn: "STAT C1000", subject: "STAT", number: "C1000", title: "Stats" }] };
const MQ = { _extracted_at: "2026-07-10", disciplines: {} };
["Automotive Technology", "Auto Body Technology", "Agricultural Business and Related Services", "Mathematics", "Psychology", "Foreign Languages", "Kinesiology",
  "Film and Media Studies", "Media Production", "Agriculture", "Agricultural Production", "Bicycle Repair", "Shoe Rebuilding", "Watch and Clock Repair"].forEach(function (d) { MQ.disciplines[d] = { mq_list: "masters" }; });
const SCAN = { _scanned_at: "2026-10-19", _registry_synced_at: "2026-10-19T13:25:33Z", _disciplines: 7,
  _mid_codes: { ids: 100, codes: 10, canonical: 7, umbrella: 2, stray_codes: 1, stray_ids: 3, strays: [{ code: "MCOM", ids: 3, disciplines: { "(no discipline)": 3 } }] },
  findings: [
    { id: "CSR0001", rule: "cs2_dup", item: "Agricultural Business and Related Services ↔ Auto Body Technology", evidence: "both map to AUTB", suggestion: null, needs_judgment: true },
    { id: "CSR0002", rule: "cs6_weak_mnemonic", item: "Auto Body Technology", evidence: "canonical AUTB not derivable", suggestion: "confirm or improve mnemonic", needs_judgment: true },
    { id: "CSR0003", rule: "cs7_unreviewed", item: "Mathematics", evidence: "no reviewed_by stamp", suggestion: null, needs_judgment: true },
    { id: "CSR0004", rule: "cs7_unreviewed", item: "Agricultural Business and Related Services", evidence: "no reviewed_by stamp", suggestion: null, needs_judgment: true },
    { id: "CSR0005", rule: "cs4_aligned", item: "Psychology", evidence: "aligned", suggestion: "bless", needs_judgment: true },
    { id: "CSR0006", rule: "cs4_divergence_noted", item: "Commercial Music", evidence: "noted", suggestion: "settled", needs_judgment: false }
  ] };
const STATUS = { schema: 1, project: "subjects", written_at: "2026-10-19T15:00:00Z", session: 425, moniker: "SkyMadrone", run: "Sam's session", decider: "Sam",
  handoff: "docs/session_425_handoff.md", next_step: { title: "Confirm the picks", text: "The unconfirmed picks wait for a person." },
  calls: [{ title: "The definition of complete", text: "Which test makes a Common SUBJ complete.", link: "https://claude.ai/artifact/TestSheet", link_text: "Answer on Open Asks Sheet 99" }],
  changes: [{ at: "2026-10-19T14:00:00Z", text: "The Progress view." }], notes: {}, headline: [] };

function mockFetch(url) {
  const u = String(url);
  const body =
    u.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
    u.indexOf("kb_curation") >= 0 ? OVERLAY :
    u.indexOf("cid_descriptors") >= 0 ? CID :
    u.indexOf("ccn_courses") >= 0 ? CCN :
    u.indexOf("mq_sections") >= 0 ? MQ :
    u.indexOf("csr_out/latest.json") >= 0 ? SCAN :
    u.indexOf("status/subjects.json") >= 0 ? STATUS :
    u.indexOf("csr_procedures.json") >= 0 ? PROCS :
    u.indexOf("discipline_aliases.json") >= 0 ? { aliases: { "Kinesiology": ["Physical Education"] } } :
    u.indexOf("foreign_language_subj4.json") >= 0 ? { discipline: "Foreign Languages", languages: { Spanish: { subj4: "SPAN", subjects: ["SPAN"], title: ["spanish"] } } } :
    u.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: {} } : {};
  return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
}
function failingFetch(url) {
  const u = String(url);
  if (u.indexOf("csr_out/latest.json") >= 0 || u.indexOf("status/subjects.json") >= 0) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  return mockFetch(url);
}

function boot(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="tab-canonical-subj4">
      <div id="cs-toolbar"></div><div id="cs-summary"></div>
      <div id="cs-table-wrap"></div><div id="cs-toast"></div>
      <div id="cs-variants-modal" class="cs-modal-bg"><div class="cs-modal"><button class="cs-modal-close"></button><h3 id="cs-variants-title"></h3><div id="cs-variants-body"></div></div></div>
    </div></body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/" + (opts.hash || "#canonical-subj4") });
  const w = dom.window;
  w.fetch = opts.fetch || mockFetch;
  w.matchMedia = w.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  const ctx = dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(w);
  if (!opts.noModule) vm.runInContext(MODULE, ctx, { filename: "commons_progress.js" });
  vm.runInContext(SRC, ctx, { filename: "canonical_subj4.js" });
  return { w: w, d: w.document };
}

const t = boot();
const t2 = boot({ noModule: true, hash: "#canonical-subj4/reference" });
const t3 = boot({ fetch: failingFetch, hash: "#canonical-subj4/progress" });

setTimeout(function () {
  try {
    const d = t.d, w = t.w, M = w.CPL_CANONICAL_SUBJ4;
    // ── the two views ──
    const sw = d.getElementById("cs-views");
    check("the view switch is a tablist of two words", sw && sw.getAttribute("role") === "tablist" && sw.querySelectorAll("button[role=tab]").length === 2);
    check("the words are Progress and Reference", Array.prototype.map.call(sw.querySelectorAll("button"), txt).join(",") === "Progress,Reference");
    check("Progress opens by default", M._state.view === "progress" && !d.getElementById("cs-progress").hidden && d.getElementById("cs-table-wrap").hidden && d.getElementById("cs-toolbar").hidden);
    check("the selected word is marked and focusable", d.getElementById("cs-tab-progress").getAttribute("aria-selected") === "true" && d.getElementById("cs-tab-reference").getAttribute("tabindex") === "-1");
    const pg = d.getElementById("cs-progress");
    check("the module drew the view", pg.querySelector(".prh-pg") && txt(pg.querySelector(".prh-pg-head h3")) === "Common Subjects Reference");
    // ── the headline pair ──
    const nums = Array.prototype.map.call(pg.querySelectorAll(".prh-pg-pair .prh-pg-n b"), txt);
    check("the headline pair: 11 MQ disciplines with courses, 8 settled (9 confirmed less the AUTB collision)", nums.join(",") === "11,8");
    check("the universe's small print names the handbook's 14 and the 3 with no courses", /names 14; 3 carry no courses/.test(txt(pg.querySelector(".prh-pg-pair .prh-pg-n small"))));
    check("the headline's within line: 2 picks wait, 1 collision, 3 on the authority's own code",
      /2 picks wait for a person/.test(txt(pg.querySelector(".prh-pg-within"))) && /1 collision/.test(txt(pg.querySelector(".prh-pg-within"))) && /3 on the authority's own code/.test(txt(pg.querySelector(".prh-pg-within"))));
    // ── the run status from the run log ──
    const meta = txt(pg.querySelector(".prh-pg-meta"));
    check("the run status reads the run log: S425 SkyMadrone, one call waiting on Sam", /S425 SkyMadrone/.test(meta) && /1 call waiting on Sam/.test(meta));
    // ── the milestones ──
    const steps = Array.prototype.map.call(pg.querySelectorAll(".prh-pg-step"), function (li) { return [txt(li.querySelector("h4")), li.className]; });
    check("five milestones in order", steps.map(function (s) { return s[0]; }).join("|") === "A code for every MQ discipline|The authority's codes adopted|Every pick confirmed|The checks pass|Self-maintaining");
    check("the first two are done, You are here is the confirmations, the checks are next",
      /prh-pg-done/.test(steps[0][1]) && /prh-pg-done/.test(steps[1][1]) && /prh-pg-here/.test(steps[2][1]) && /prh-pg-next/.test(steps[3][1]) && /prh-pg-later/.test(steps[4][1]));
    check("the done milestones name their day", /the fold, Jun 12/.test(txt(pg.querySelectorAll(".prh-pg-step")[0])) && /the recode, Sep 3/.test(txt(pg.querySelectorAll(".prh-pg-step")[1])));
    check("2 picks to confirm are left before the next milestone", /2 picks to confirm/.test(txt(pg.querySelector(".prh-pg-left"))));
    // ── the cards ──
    const cards = pg.querySelectorAll(".prh-pg-part");
    check("eight cards, one per step, in order", cards.length === 8 && Array.prototype.map.call(cards, function (c) { return txt(c.querySelector("h4")); }).join("|") ===
      "The MQ discipline list|The C-ID and CCN subject tables|The authority's code sets the Common SUBJ|Every M-ID carries its discipline's code|One code, one MQ discipline|Umbrellas, fan-ins and cross-listed courses|Confirmation|The daily scan and Jev's sitting");
    const words = Array.prototype.map.call(cards, function (c) { return txt(c.querySelector(".prh-pg-status")); });
    check("the statuses: the lists in progress, the authority rule done, the identity codes in progress, the collision in progress, the confirmations in progress, the scan in progress",
      words.join("|") === "In progress|In progress|Done|In progress|In progress|In progress|In progress|In progress");
    check("the MQ card counts the handbook's 14, the 11 with courses and the 3 with none", /14 MQ disciplines in the handbook's index \(read Jul 10\); 11 carry courses on the map and every one carries a Common SUBJ; 3 carry none\./.test(txt(cards[0].querySelector(".prh-pg-what"))));
    check("the tables card counts 5 C-ID codes (one from a descriptor ending in X) and 3 CCN codes, 1 in both (PSYC is not PSY), CCN adding PSYC and STAT; CCN wins on Psychology",
      /5 C-ID subject codes \(5 descriptors\) and 3 CCN codes \(3 courses\), both read May 20; 1 code is in both, CCN adds PSYC, STAT\./.test(txt(cards[1].querySelector(".prh-pg-what"))) &&
      /Psychology is PSYC, C-ID says PSY/.test(txt(cards[1].querySelector(".prh-pg-foot"))));
    check("the authority card: 2 on CCN, 1 on C-ID, 8 minted here, 1 chip, no missed alignment", /2 MQ disciplines sit on the CCN code, 1 on a C-ID code and 8 on a code this reference minted; 1 of those show the authority's code on a chip\./.test(txt(cards[2].querySelector(".prh-pg-what"))) && /No missed alignment/.test(txt(cards[2].querySelector(".prh-pg-foot"))));
    check("the identity-code card reads the scan's measure", /10 codes on 100 minted identities: 7 are a discipline's Common SUBJ, 2 are umbrella codes, 1 are strays on 3 identities\./.test(txt(cards[3].querySelector(".prh-pg-what"))) && /MCOM 3/.test(txt(cards[3].querySelector(".prh-pg-foot"))));
    check("the one-code card names the AUTB collision, the two codes shared by design (FTVE's fan-in, the umbrellas' AGAB), and Auto Body's row off its code",
      /1 code on two MQ disciplines \(AUTB\); 2 codes are shared by design; 1 discipline carries rows off their code\./.test(txt(cards[4].querySelector(".prh-pg-what"))));
    check("the cross-listing card counts 4 umbrellas with 4 codes beside their own, 1 fan-in family, 1 ruled pair", /4 umbrella disciplines carry 4 codes beside their own; 1 fan-in family folds 1 alternate names, and 1 pair shares one code by ruling/.test(txt(cards[5].querySelector(".prh-pg-what"))));
    check("the confirmation card: 9 of 11 by a person, 2 wait, 1 on the authority's own code; the validate stage unused", /9 of 11 picks confirmed by a person; 2 wait, 1 of them on the authority's own code\./.test(txt(cards[6].querySelector(".prh-pg-what"))) && /No pick has gone through the validate stage/.test(txt(cards[6].querySelector(".prh-pg-foot"))));
    check("the scan card: 6 findings, 2 need a judgment, 2 unconfirmed, 1 aligned", /The scan of Oct 19: 6 findings; 2 need a judgment \(1 a code on two MQ disciplines, 1 a weak mnemonic\), 2 are the unconfirmed picks, 1 confirm an alignment\./.test(txt(cards[7].querySelector(".prh-pg-what"))));
    check("every card carries its Procedure word", Array.prototype.every.call(cards, function (c) { return Array.prototype.some.call(c.querySelectorAll(".prh-pg-more"), function (b) { return txt(b) === "Procedure"; }); }));
    check("the cross-listing card's answer leads to the cross-list sheet", /claude\.ai\/artifact\/BizNPAbrucq6hWARVzTQBp/.test((cards[5].querySelector(".prh-pg-answer") || {}).href || ""));
    // ── the side column ──
    check("the next step and the call come from the run log", /Confirm the picks/.test(txt(pg.querySelector(".prh-pg-side"))) && /The definition of complete/.test(txt(pg.querySelector(".prh-pg-side"))) && /Answer on Open Asks Sheet 99/.test(txt(pg.querySelector(".prh-pg-side"))));
    // ── the procedures and the findings ──
    const procSec = pg.querySelector('details[data-sec="progress:procedures"]');
    check("the procedures section lists the store's eight, 5 of 8 in force", procSec && procSec.querySelectorAll("details.cs-proc").length === 8 && /5 of 8 in force/.test(txt(procSec.querySelector(".cs-sec-meta"))));
    check("a procedure card carries its rule, its steps and its source", /CCN code when one exists/.test(txt(d.getElementById("cs-proc-authority_rule").querySelector(".cs-proc-rule"))) && d.getElementById("cs-proc-authority_rule").querySelectorAll(".cs-proc-steps li").length >= 2 && /Source: Sam, 2026-09-03/.test(txt(d.getElementById("cs-proc-authority_rule").querySelector(".cs-proc-meta"))));
    const findSec = pg.querySelector('details[data-sec="progress:findings"]');
    check("the findings section lists the 2 needing a judgment, not the unconfirmed or the aligned", findSec && findSec.querySelectorAll(".cs-findings li").length === 2 && /2 findings/.test(txt(findSec.querySelector(".cs-sec-meta"))));
    // ── a count opens its list (the Commons' step 3) ──
    const openWaiting = Array.prototype.filter.call(cards[6].querySelectorAll(".prh-pg-open"), function (b) { return /Open the 2 waiting/.test(txt(b)); })[0];
    check("the confirmation card's count is a word", !!openWaiting);
    openWaiting.click();
    check("it opens the Reference view with the pre-seeded filter and the select in step", M._state.view === "reference" && M._state.filter === "pre_seeded" && d.getElementById("cs-filter").value === "pre_seeded" && !d.getElementById("cs-table-wrap").hidden && d.getElementById("cs-progress").hidden);
    const shown = Array.prototype.map.call(d.querySelectorAll("td.cs-disc"), function (td) { return txt(td).split(" also:")[0].replace(/\s+[^\sA-Za-z].*$/, ""); });
    check("the table lists exactly the two unconfirmed picks", shown.length === 2 && /Agricultural Business/.test(shown[0] + shown[1]) && /Mathematics/.test(shown[0] + shown[1]));
    check("the column header says MQ Discipline", /^MQ Discipline/.test(txt(d.querySelector(".cs-table th"))));
    check("the summary says MQ disciplines", /MQ disciplines ·/.test(txt(d.getElementById("cs-summary"))));
    check("the Reference view is remembered", w.localStorage.getItem("cplCsr.view.v1") === "reference");
    // ── the address routes a filter and a view ──
    w.location.hash = "#canonical-subj4/chip";
    w.dispatchEvent(new w.Event("hashchange"));
    check("#canonical-subj4/chip opens the table filtered to the one with a chip", M._state.view === "reference" && M._state.filter === "chip" && d.querySelectorAll("td.cs-disc").length === 1 && /Automotive Technology/.test(txt(d.querySelector("td.cs-disc"))));
    w.location.hash = "#canonical-subj4/progress";
    w.dispatchEvent(new w.Event("hashchange"));
    check("#canonical-subj4/progress opens the Progress view", M._state.view === "progress" && !d.getElementById("cs-progress").hidden);
    w.location.hash = "#canonical-subj4/check";
    w.dispatchEvent(new w.Event("hashchange"));
    check("#canonical-subj4/check opens the SUBJ check on the Reference view", M._state.view === "reference" && d.getElementById("cs-check-modal") && d.getElementById("cs-check-modal").classList.contains("show"));
    // ── the pick's reviewer ──
    check("the pick's reviewer is the code row's, not the later note's", M._state.overlay["Automotive Technology"].reviewed_by === "map@rccd.edu" && M._state.overlay["Automotive Technology"].reviewed_at === "2026-05-23T17:00:00Z" && M._state.overlay["Automotive Technology"]._notes_by === "csr-doctrine-s111@bot");
    // ── the exported context agrees with the screen ──
    const x = M.progressContext(new Date("2026-10-19T16:00:00Z"));
    check("the context: 11 total, 9 confirmed, 8 settled, 2 unconfirmed, 1 collision, 3 on an authority code, 1 chip", x.total === 11 && x.confirmed === 9 && x.settled === 8 && x.unconfirmed === 2 && x.collisions === 1 && x.onAuthority === 3 && x.chips === 1);
    check("a C-ID descriptor ending in X is indexed under its subject", !!M._state.cidBySubj.WELD && M._state.cidBySubj.WELD[0].id === "WELD 100 X" && x.cidSubjects === 5);
    check("the context: 4 umbrella codes beside their own, 1 fan-in pair, 1 alias family, 2 codes shared by design (FTVE, AGAB)", x.umbrellaCodes === 4 && x.fanInPairs === 1 && x.aliasFamilies === 1 && x.aliasShared === 2 && x.collisionCodes.join() === "AUTB");

    // ── without the module: the view says so and the table still draws (t2) ──
    const d2 = t2.d, M2 = t2.w.CPL_CANONICAL_SUBJ4;
    check("the reference route opens the table", M2._state.view === "reference" && !d2.getElementById("cs-table-wrap").hidden && d2.querySelectorAll("td.cs-disc").length === 11);
    M2.applyView("progress");
    check("without the module the Progress view says so, in a line", /commons_progress\.js\) could not be loaded/.test(txt(d2.getElementById("cs-progress"))) && d2.getElementById("cs-progress").querySelector("[role=alert]"));
    check("the table drew all the same", d2.querySelectorAll("td.cs-disc").length === 11);

    // ── a failed read says so, never a zero (t3) ──
    const d3 = t3.d, pg3 = d3.getElementById("cs-progress");
    check("the scan's cards read Could not be read when its file is missing", Array.prototype.filter.call(pg3.querySelectorAll(".prh-pg-part"), function (c) { return txt(c.querySelector(".prh-pg-status")) === "Could not be read"; }).length === 3);
    check("the run status names the missing run log", /run log \(kb\/status\/subjects\.json\) could not be read/.test(txt(pg3.querySelector(".prh-pg-meta"))));
    check("the headline still draws from the seed", Array.prototype.map.call(pg3.querySelectorAll(".prh-pg-pair .prh-pg-n b"), txt).join(",") === "11,8");
    check("the findings section says the scan could not be read", /could not be read/.test(txt(pg3.querySelector('details[data-sec="progress:findings"]'))));
    check("no glyph in the rendered Progress text", !/[\u2600-\u27bf\u2b00-\u2bff\u{1f300}-\u{1faff}]/u.test(txt(pg)));
  } catch (e) {
    check("no exception while checking: " + (e && e.stack || e), false);
  }
  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log(failed ? failed + " check(s) failed" : "all " + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
}, 400);
