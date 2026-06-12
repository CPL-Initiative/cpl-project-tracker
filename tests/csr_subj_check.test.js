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
//   - the "show →" cure jumps the table to the discipline's row
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
    <div id="cs-toolbar"></div><div id="cs-summary"></div>
    <div id="cs-table-wrap"></div><div id="cs-toast"></div>
  </div>
</body></html>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/" });

const { window } = dom;
window.fetch = (u, o) => mockFetch(u, o);
window.matchMedia = window.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
// Signed-in session so the inputs are editable (saves hit the fetch mock).
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "aaa.bbb.ccc", refresh_token: "rrr", email: "test@rccd.edu", exp: Date.now() + 9e6,
}));
// Confirm stub — records calls, approves by default (the cancel path is
// exercised separately below).
let confirmCalls = [];
let confirmAnswer = true;
window.confirm = (msg) => { confirmCalls.push(msg); return confirmAnswer; };

const vm = require("vm");
vm.runInContext(src, dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(window), { filename: "canonical_subj4.js" });

const results = [];
const check = (name, cond) => results.push([name, !!cond]);
const doc = window.document;

function rowFor(disc) {
  for (const td of doc.querySelectorAll("td.cs-disc")) {
    if ((td.textContent || "").trim().indexOf(disc) === 0) return td.parentElement;
  }
  return null;
}
function disciplinesShown() {
  return [...doc.querySelectorAll("td.cs-disc")].map((td) => (td.textContent || "").trim());
}
function fire(elm, type) { elm.dispatchEvent(new window.Event(type)); }

setTimeout(() => {
  try {
    // ── the sweep ────────────────────────────────────────────────────────
    const btn = doc.getElementById("cs-subj-check");
    check("toolbar has the Check SUBJ ⇄ CCR button", !!btn);
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
    check("alias pair THEA lands in the alias-families info section",
      sectionUl("Alias families").indexOf("THEA") >= 0 &&
      sectionUl("Alias families").indexOf("Drama/Theater Arts") >= 0 &&
      sectionUl("Alias families").indexOf("Theater Arts") >= 0);
    const peDrift = [...doc.querySelectorAll("#cs-check-body .cs-check-list li")]
      .map((li) => li.textContent).find((t) => t.indexOf("Physical Education") === 0);
    check("PE drift lists KINE ×5 WITHOUT cross-claiming its own family's owner",
      !!peDrift && peDrift.indexOf("KINE") >= 0 && peDrift.indexOf("×5") >= 0 &&
      peDrift.indexOf("= Kinesiology") < 0);

    // ── the jump cure ────────────────────────────────────────────────────
    const jumps = [...doc.querySelectorAll(".cs-check-jump")].filter((b) => b.textContent.indexOf("Mystery Studies") >= 0);
    check("jump button exists for Mystery Studies", jumps.length > 0);
    jumps[0].click();
    check("jump closes the modal", !modal.classList.contains("show"));
    const shown = disciplinesShown();
    check("jump filters the table to the discipline", shown.length === 1 && shown[0].indexOf("Mystery Studies") === 0);

    // reset the filter for the live-input assertions
    const searchInp = doc.getElementById("cs-search");
    searchInp.value = ""; fire(searchInp, "input");

    // ── live input feedback ──────────────────────────────────────────────
    const abRow = rowFor("Auto Body Technology");
    check("Auto Body row renders", !!abRow);
    const abInput = abRow.querySelector("input.cs-canon");
    const abHint = abRow.querySelector(".cs-subj-hint");
    check("hint container present", !!abHint);
    abInput.value = "AUTO"; fire(abInput, "input");
    check("typing another discipline's canonical shows the collision badge",
      /Common SUBJ of Automotive Technology/.test(abHint.textContent));
    // suggestions: ABOD (own 4-letter local, unclaimed) in; AUTO (owned elsewhere) out
    const chipTexts = [...abHint.querySelectorAll(".cs-sugg-chip")].map((c) => c.textContent.trim());
    check("suggestions include the unclaimed local code ABOD", chipTexts.some((t) => t.indexOf("ABOD") === 0));
    check("suggestions exclude the owned-elsewhere code AUTO", !chipTexts.some((t) => t.indexOf("AUTO") === 0));

    // Live input on an alias-family member: typing the family owner's code
    // (KINE on the Physical Education row) shows neither the ✗ collision
    // badge nor the ⚠ in-use badge — just the own-rows ✓.
    const peRow = rowFor("Physical Education");
    const peInput = peRow.querySelector("input.cs-canon");
    const peHint = peRow.querySelector(".cs-subj-hint");
    peInput.value = "KINE"; fire(peInput, "input");
    check("alias family owner's code raises NO collision/in-use badge",
      peHint.textContent.indexOf("Common SUBJ of") < 0 && peHint.textContent.indexOf("⚠") < 0);
    check("alias family owner's code still shows the own-rows ✓",
      /✓ on 5/.test(peHint.textContent));
    peInput.value = "PEDU"; fire(peInput, "input"); // restore (no save — no blur)

    // ── chip click → fill + blur-save ────────────────────────────────────
    const abodChip = [...abHint.querySelectorAll(".cs-sugg-chip")].find((c) => c.textContent.indexOf("ABOD") === 0);
    abodChip.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true }));
    check("chip mousedown fills the input", abInput.value === "ABOD");
    confirmCalls = [];
    fire(abInput, "blur");
    check("non-colliding save asks NO confirmation", confirmCalls.length === 0);

    // ── collision save guard ─────────────────────────────────────────────
    setTimeout(() => {
      try {
        check("blur-save persisted the chip pick to kb_curation",
          saves.some((s) => s.field === "canonical_subj4" && s.value === "ABOD" && s.course_id === "_CANON_SUBJ4::Auto Body Technology"));

        // The table re-rendered after the save; re-grab the row. Cancel path:
        const barbRow = rowFor("Barbering");
        const barbInput = barbRow.querySelector("input.cs-canon");
        confirmAnswer = false; confirmCalls = []; const nSaves = saves.length;
        barbInput.value = "AUTO"; fire(barbInput, "blur");
        check("saving a colliding code asks for confirmation", confirmCalls.length === 1);
        check("declined confirmation reverts and does not save",
          barbInput.value === "COSM" && saves.length === nSaves);
      } catch (e) {
        check("no exception in async assertions: " + e.message, false);
      }
      finish();
    }, 80);
  } catch (e) {
    check("no exception during assertions: " + e.message, false);
    finish();
  }

  function finish() {
    let pass = 0;
    for (const [n, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; }
    console.log("\n" + pass + "/" + results.length + " checks passed");
    process.exit(pass === results.length && results.length > 0 ? 0 : 1);
  }
}, 200);
