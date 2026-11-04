// Test for the CSR SUBJ ⇄ CCR checker (Session 47, canonical_subj4.js):
// the curator-initiated sweep + the live Common SUBJ input feedback.
//
// Guards the failure modes:
//   - cross-discipline canonical COLLISIONS are reported (COSM shared by
//     Barbering + Cosmetology) and umbrella spans don't false-positive
//   - off-canonical CCR rows (variants_observed ≠ canonical) are reported,
//     with the "= Common SUBJ of X" cross-claim annotation (the AUTB class)
//   - umbrella disciplines (Foreign Languages splits, Kinesiology KINE+ATHL)
//     are EXEMPT from drift findings (mirrors kb/_row_audit.py)
//   - multi-code disciplines with no canonical land in the missing queue
//   - the "show →" cure opens the discipline's panel on the List (the Reference table retired into the List, 2026-11-04)
//   - live input: typing another discipline's canonical shows the collision
//     badge; suggestion chips EXCLUDE owned-elsewhere codes; a chip click
//     fills the input and the blur-save persists it
//   - saving a colliding code asks for confirmation first
//
// Run from repo root: `npm test` (or `node tests/csr_subj_check.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("canonical_subj4.js", "utf8");

const SEED = {
  _counts: {},
  _seeded_at: "2026-06-12",
  disciplines: {
    "Automotive Technology": {
      canonical_subj4: "AUTO", source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "AUTO", data_modal_is_4letter: true,
      total_mids: 100, variants_observed: { AUTO: 100 },
      local_subject_variants: { AUTO: 80, AUTOMOT: 20 }, top_category_2digit: "09",
    },
    "Auto Body Technology": {
      canonical_subj4: "AUTB", source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "AUTB", data_modal_is_4letter: true,
      total_mids: 48, variants_observed: { AUTB: 40, AUTO: 6, ZUTB: 2 },
      local_subject_variants: { AUTB: 30, ABOD: 12 }, top_category_2digit: "09",
    },
    "Barbering": {
      canonical_subj4: "COSM", source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "BARB", data_modal_is_4letter: true,
      total_mids: 10, variants_observed: { COSM: 10 },
      local_subject_variants: { BARB: 8 }, top_category_2digit: "30",
    },
    "Cosmetology": {
      canonical_subj4: "COSM", source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "COSM", data_modal_is_4letter: true,
      total_mids: 60, variants_observed: { COSM: 60 },
      local_subject_variants: { COSM: 55 }, top_category_2digit: "30",
    },
    "Foreign Languages": {
      canonical_subj4: "FLNG", source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "SPAN", data_modal_is_4letter: true,
      total_mids: 70, variants_observed: { FLSP: 50, FLFR: 20 },
      local_subject_variants: { SPAN: 40, FREN: 18 }, top_category_2digit: "11",
    },
    "Kinesiology": {
      canonical_subj4: "KINE", source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "KINE", data_modal_is_4letter: true,
      total_mids: 40, variants_observed: { KINE: 30, ATHL: 10 },
      local_subject_variants: { KIN: 22, PE: 11 }, top_category_2digit: "08",
    },
    "Mystery Studies": {
      canonical_subj4: null, source: null, data_modal: "MYS", data_modal_is_4letter: false,
      total_mids: 9, variants_observed: { XAAA: 5, XBBB: 4 },
      local_subject_variants: { XAAA: 5, XBBB: 4 }, top_category_2digit: "49", needs_review: true,
    },
    // Fan-in alias pair sharing one code (the THEA case): "Theater Arts" is
    // the recorded alternate name of "Drama/Theater Arts" — both on THEA is
    // the convergence working, NOT a collision. (The 2026-06-12 sweep flagged
    // exactly this and pushed a needless re-code.)
    "Drama/Theater Arts": {
      canonical_subj4: "THEA", source: "curator_override", reviewed_at: "2026-06-12T14:29:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "THEA", data_modal_is_4letter: true,
      total_mids: 100, variants_observed: { THEA: 100 },
      local_subject_variants: { THEA: 60, DRAM: 10 }, top_category_2digit: "10",
    },
    "Theater Arts": {
      canonical_subj4: "THEA", source: "curator_override", reviewed_at: "2026-06-12T12:54:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "THEA", data_modal_is_4letter: true,
      total_mids: 20, variants_observed: { THEA: 20 },
      local_subject_variants: { THEA: 18 }, top_category_2digit: "10",
    },
    // Alias family with DRIFT across it (the production Kinesiology ⟵
    // Physical Education fan-in): PE rows still keyed KINE must show as plain
    // fold-queue drift, NOT cross-claimed against their own family's owner.
    "Physical Education": {
      canonical_subj4: "PEDU", source: "curator_override", reviewed_at: "2026-06-12T12:48:00Z",
      reviewed_by: "map@rccd.edu", data_modal: "PE", data_modal_is_4letter: false,
      total_mids: 35, variants_observed: { PEDU: 30, KINE: 5 },
      local_subject_variants: { PE: 25, PEDU: 8 }, top_category_2digit: "08",
    },
  },
};
const ALIASES = { aliases: { "Drama/Theater Arts": ["Theater Arts"], "Kinesiology": ["Physical Education"] } };
const FLSPLIT = {
  discipline: "Foreign Languages",
  languages: {
    Spanish: { subj4: "FLSP", subjects: ["SPAN"], title: ["spanish"] },
    French: { subj4: "FLFR", subjects: ["FREN"], title: ["french"] },
  },
};

// Track kb_curation saves so we can assert the chip→blur save flow.
const saves = [];
function mockFetch(url, opts) {
  const u = String(url);
  if (u.indexOf("kb_curation") >= 0 && opts && opts.method === "POST") {
    saves.push(JSON.parse(opts.body));
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  }
  const body =
    u.indexOf("discipline_canonical_subj4.json") >= 0 ? SEED :
    u.indexOf("discipline_aliases.json") >= 0 ? ALIASES :
    u.indexOf("foreign_language_subj4.json") >= 0 ? FLSPLIT :
    u.indexOf("cid_descriptors") >= 0 ? { descriptors: [{ descriptor: "AUTO 100", title: "Intro Auto" }] } :
    u.indexOf("ccn_courses") >= 0 ? { courses: [] } :
    u.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: {} } :
    u.indexOf("kb_curation") >= 0 ? [] : {};
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="tab-canonical-subj4">
    <div id="cs-mount"></div>
  </div>
</body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/#canonical-subj4/list" });

const { window } = dom;
window.fetch = (u, o) => mockFetch(u, o);
window.matchMedia = window.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
window.HTMLElement.prototype.scrollIntoView = function () {};
// Signed-in session so the saves are allowed (they hit the fetch mock).
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "aaa.bbb.ccc", refresh_token: "rrr", email: "test@rccd.edu", exp: Date.now() + 9e6,
}));
// Confirm stub — records calls, approves by default (the cancel path is
// exercised separately below).
let confirmCalls = [];
let confirmAnswer = true;
window.confirm = (msg) => { confirmCalls.push(msg); return confirmAnswer; };

const vm = require("vm");
const ctx = dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(window);
// The List engine loads through CPL_TABS, as in the shell.
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
window.CPL_TABS = { loadScript: function (s, name, cb) {
  if (s === "commons_list.js") vm.runInContext(LIST_SRC, ctx, { filename: "commons_list.js" });
  setTimeout(cb, 0);
} };
vm.runInContext(src, ctx, { filename: "canonical_subj4.js" });

const results = [];
const check = (name, cond) => results.push([name, !!cond]);
const doc = window.document;

const txt = (n) => (n && n.textContent || "").trim();
function titleBtn(disc) {
  return [...doc.querySelectorAll("#cs-list .csl-table tbody tr button.csl-open")].find((b) => txt(b) === disc) || null;
}
function panel() { return doc.getElementById("csl-panel"); }
/* The panel's Codes it could take: each row's code, and its note. */
function suggRows() {
  const t = doc.getElementById("csl-pn-sugg");
  return t ? [...t.querySelectorAll("tbody tr")].map((tr) => ({ code: txt(tr.children[0]), note: txt(tr.children[2]), take: tr.querySelector("button") })) : [];
}
function boxOf(disc) { return [...doc.querySelectorAll(".csl-cellin")].find((b) => b.getAttribute("aria-label") === "Common SUBJ of " + disc); }
function fire(elm, type) { elm.dispatchEvent(new window.Event(type)); }

const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 15; i++) await tick(); }
(async function () {
  try {
    await settle();
    // ── the sweep, from the List's head ──────────────────────────────────
    const btn = doc.getElementById("csl-check");
    check("the List's head has Run the SUBJ check", !!btn);
    btn.click();
    const modal = doc.getElementById("cs-check-modal");
    check("check modal opens", modal && modal.classList.contains("show"));
    const text = (doc.getElementById("cs-check-body") || {}).textContent || "";
    check("collision COSM reported with both owners",
      text.indexOf("COSM") >= 0 && text.indexOf("Barbering") >= 0 && text.indexOf("Cosmetology") >= 0);
    check("off-canonical drift reported for Auto Body (ZUTB ×2)",
      text.indexOf("Auto Body Technology") >= 0 && text.indexOf("ZUTB") >= 0);
    check("cross-claim annotated (AUTO = Common SUBJ of Automotive Technology)",
      text.indexOf("= Automotive Technology") >= 0);
    check("umbrella Foreign Languages NOT in findings", text.indexOf("Foreign Languages") < 0 || text.indexOf("exempt") >= 0 && text.split("Foreign Languages").length === 2);
    check("umbrella Kinesiology not flagged for ATHL span", text.indexOf("Kinesiology (canonical") < 0);
    check("missing-canonical queue lists Mystery Studies", text.indexOf("Mystery Studies") >= 0);
    check("snapshot stamp shown", text.indexOf("2026-06-12") >= 0);

    // ── alias-family exemption (the THEA case) ───────────────────────────
    function sectionUl(headerSubstr) {
      for (const h of doc.querySelectorAll("#cs-check-body .cs-check-section")) {
        if (h.textContent.indexOf(headerSubstr) >= 0) {
          let n = h.nextElementSibling;
          while (n && n.tagName !== "UL") n = n.nextElementSibling;
          return n ? n.textContent : "";
        }
      }
      return "";
    }
    check("alias pair THEA is NOT a collision", sectionUl("Shared Common SUBJ").indexOf("THEA") < 0);
    // S425: the section is "Codes shared by design" (an alias family, a ruled fan-in, an umbrella code both declare).
    check("alias pair THEA lands in the shared-by-design info section",
      sectionUl("Codes shared by design").indexOf("THEA") >= 0 &&
      sectionUl("Codes shared by design").indexOf("Drama/Theater Arts") >= 0 &&
      sectionUl("Codes shared by design").indexOf("Theater Arts") >= 0);
    const peDrift = [...doc.querySelectorAll("#cs-check-body .cs-check-list li")]
      .map((li) => li.textContent).find((t) => t.indexOf("Physical Education") === 0);
    check("PE drift lists KINE ×5 WITHOUT cross-claiming its own family's owner",
      !!peDrift && peDrift.indexOf("KINE") >= 0 && peDrift.indexOf("×5") >= 0 &&
      peDrift.indexOf("= Kinesiology") < 0);

    // ── the "Fix on CCR →" cure for owned-code drift ─────────────────────
    // Auto Body carries AUTO (Automotive Technology's Common SUBJ) → those
    // rows are likely mis-disciplined, so the drift row offers a recommendation
    // + a button that deep-links the Common Course Reference (CPL_QS hint bus +
    // CPL_TABS router), filtered to the discipline + code.
    const abDrift = [...doc.querySelectorAll("#cs-check-body .cs-check-list li")]
      .find((li) => li.textContent.indexOf("Auto Body Technology") === 0);
    const fixBtn = abDrift && abDrift.querySelector(".cs-check-fix");
    check("owned-code drift offers a 'Fix on CCR →' button", !!fixBtn && /Fix on CCR/.test(fixBtn.textContent));
    check("owned-code drift shows a re-discipline recommendation",
      !!abDrift && /likely Automotive Technology/.test(abDrift.textContent));
    let qsHint = null, ccrActivated = null;
    window.addEventListener("cpl-qs-hint", (e) => { qsHint = e.detail; });
    window.CPL_TABS = { activate: (t) => { ccrActivated = t; } };
    if (fixBtn) fixBtn.click();
    check("Fix-on-CCR dispatches a CCR hint filtered to the discipline + code",
      qsHint && qsHint.tab === "unified-courses" && qsHint.hint &&
      qsHint.hint.disc === "Auto Body Technology" && qsHint.hint.search === "AUTO");
    check("Fix-on-CCR activates the Common Course Reference tab", ccrActivated === "unified-courses");
    check("Fix-on-CCR stashes the hint for a cold-loaded tab",
      !!window.sessionStorage.getItem("cpl_qs_hint_unified-courses"));
    check("Fix-on-CCR closes the check modal", !modal.classList.contains("show"));
    btn.click(); // re-open the modal for the jump-cure assertions below

    // ── the jump cure ────────────────────────────────────────────────────
    const jumps = [...doc.querySelectorAll(".cs-check-jump")].filter((b) => b.textContent.indexOf("Mystery Studies") >= 0);
    check("jump button exists for Mystery Studies", jumps.length > 0);
    jumps[0].click(); await settle();
    check("jump closes the modal", !modal.classList.contains("show"));
    check("jump opens the discipline's panel on the List", window.CPL_CANONICAL_SUBJ4._state.view === "list" && !!panel() && /Mystery Studies/.test(txt(panel())));

    // ── the codes it could take (the Reference box's live suggestions, in the panel) ──
    titleBtn("Auto Body Technology").click(); await settle();
    const ab = suggRows();
    check("suggestions include the unclaimed local code ABOD", ab.some((x) => x.code === "ABOD"));
    check("suggestions exclude the owned-elsewhere code AUTO", !ab.some((x) => x.code === "AUTO"));
    titleBtn("Physical Education").click(); await settle();
    const pe = suggRows().filter((x) => x.code === "KINE")[0];
    check("alias family owner's code is offered with no collision or in-use note", !!pe && !/Also on|Common SUBJ of/.test(pe.note));
    // ── Take it saves, no confirm for a free code ────────────────────────
    titleBtn("Auto Body Technology").click(); await settle();
    confirmCalls = [];
    suggRows().find((x) => x.code === "ABOD").take.click(); await settle();
    check("taking a free code asks NO confirmation", confirmCalls.length === 0);
    check("Take it persisted the pick to kb_curation",
      saves.some((s) => s.field === "canonical_subj4" && s.value === "ABOD" && s.course_id === "_CANON_SUBJ4::Auto Body Technology"));
    // Sam, 2026-11-04: Take WOOD saved while the open edit row still read CNSC, and WOOD left the list.
    check("an edit row open on the row follows the Take (its Save would not put the old code back)",
      !!doc.getElementById("csl-subj") && doc.getElementById("csl-subj").value === "ABOD", doc.getElementById("csl-subj") && doc.getElementById("csl-subj").value);
    const took = suggRows().find((x) => x.code === "ABOD");
    check("the code taken stays in Codes it could take, named its Common SUBJ, with no Take word",
      !!took && took.note === "Its Common SUBJ now" && !took.take, JSON.stringify(suggRows().map((x) => x.code + ":" + x.note)));
    // ── collision save guard (the Common SUBJ cell) ──────────────────────
    doc.getElementById("csl-editall").click(); await settle();
    const barb = boxOf("Barbering");
    confirmAnswer = false; confirmCalls = []; const nSaves = saves.length;
    barb.value = "AUTO"; barb.dispatchEvent(new window.Event("change")); await settle();
    check("saving a colliding code asks for confirmation", confirmCalls.length === 1);
    check("declined confirmation writes nothing", saves.length === nSaves);
  } catch (e) {
    check("no exception during assertions: " + e.message, false);
  }
  finish();

  function finish() {
    let pass = 0;
    for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
    console.log("\n" + pass + "/" + results.length + " checks passed");
    process.exit(pass === results.length && results.length > 0 ? 0 : 1);
  }
})();
