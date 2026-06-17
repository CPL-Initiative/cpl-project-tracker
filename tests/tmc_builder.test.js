// TMC Builder tab — guards the interaction model + the two things Sam asked for:
//   (1) the right-side picker AUTO-POPULATES the college course that already
//       carries each left-side slot's C-ID, and
//   (2) the form shows the TOTAL UNITS of the selected (right-side) courses.
// Plus the structural invariants: Rule 4 (both HTMLs identical), the nav button +
// pane + lazy boot wiring, the draft seed templates parse, and the renderer is
// null-safe (a college course with a null title/units must not crash the picker).
//
// Run from repo root: `npm test` (or `node tests/tmc_builder.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rejections = [];
process.on("unhandledRejection", (e) => rejections.push(e));

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants on the shipped artifacts
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav has TMC Builder button", /data-tab="tmc-builder" role="tab"/.test(cpl));
check("pane #tab-tmc-builder exists", /id="tab-tmc-builder"/.test(cpl));
check("mount #tmc-builder-root exists", /id="tmc-builder-root"/.test(cpl));
check("boot wiring: onActivate('tmc-builder')", /onActivate\('tmc-builder'/.test(cpl));
check("boot wiring: loadScript('tmc_builder.js')", /loadScript\('tmc_builder\.js'/.test(cpl));

const builderSrc = fs.readFileSync("tmc_builder.js", "utf8");
const templatesSrc = fs.readFileSync("tmc_templates.js", "utf8");
check("tmc_builder.js exposes CPL_TMC_BUILDER.boot", /window\.CPL_TMC_BUILDER\s*=\s*\{\s*boot/.test(builderSrc));
check("tmc_builder.js lazy-loads the per-college COCI index", /tmc_college_courses\.js/.test(builderSrc));
check("tmc_builder.js never embeds the service key (anon only)", builderSrc.indexOf("service_role") === -1);

// the draft seed templates must parse into the expected shape
const tdom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "outside-only" });
tdom.window.eval(templatesSrc);
const T = tdom.window.CPL_TMC_TEMPLATES;
check("templates parse to an object with a templates[] array", T && Array.isArray(T.templates) && T.templates.length >= 8);
check("templates are flagged DRAFT", T && T._meta && T._meta.draft === true);
const psych = (T.templates || []).filter((t) => t.id === "psychology")[0];
check("psychology template has sections + slots with C-IDs", psych && psych.sections.length && psych.sections[0].slots[0].cid);

// ─────────────────────────────────────────────────────────────────────────────
// Part B — interaction model (jsdom) with controlled mock data
// ─────────────────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html><html><body>
  <div class="cpl-tab-pane" id="tab-tmc-builder"><div class="main-container">
    <div id="tmc-builder-root"></div>
  </div></div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;

// Mock the lazy data the module expects (pre-set so ensureScript resolves immediately).
window.CPL_TMC_TEMPLATES = {
  _meta: { draft: true, sources: {
    "test-psych": "https://example.org/psych.pdf",
    "test-planned": "https://example.org/planned.pdf"
  } },
  templates: [{
    id: "test-psych", discipline: "Test Psychology", degree: "AA-T", total_units: 10,
    version: "draft", sections: [
      { name: "Required Core", select: "all", units: "6–7", slots: [
        { cid: "PSY 110", title: "Introductory Psychology", units: "3" },
        { cid: "MATH 110", title: "Introduction to Statistics", units: "3–4", alts: ["SOCI 125"], cid_unverified: true }
      ]},
      { name: "List A — select one", select: 1, units: "3–4", slots: [
        { cid: "", title: "Introduction to Biology", units: "3–4", noncid: true }
      ]}
    ]
  },
  { id: "test-planned", discipline: "Test Planned", status: "planned" }]
};
window.CPL_TMC_COLLEGE_COURSES = {
  colleges: ["Test College", "Other College"],
  courses: {
    "0": [
      ["PSYC", "1", "Introductory Psychology", 3, "PSY 110"],   // ← C-ID match for slot 0:0
      ["MATH", "15", "Elementary Statistics", 4, "MATH 110"],    // ← C-ID match for slot 0:1
      ["BIOL", "10", "General Biology", 3, null],                // candidate for List A (no C-ID)
      ["XYZ", "99", null, null, null]                            // null title/units — must not crash
    ],
    "1": [["PSYC", "2", "Other Psych", 3, "PSY 999"]]
  }
};
// Signed-in curator session (shared cpl_sb key) so curator affordances render.
const fakeJwt = "h." + Buffer.from(JSON.stringify({ email: "map@rccd.edu" })).toString("base64url") + ".s";
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: fakeJwt, refresh_token: "r", email: "map@rccd.edu", exp: Date.now() + 3600000
}));
// Mock the feature endpoints: a curator note on slot 0:0, one submitted request.
window.fetch = function (url, opts) {
  url = String(url);
  if (url.indexOf("status=eq.submitted") >= 0)
    return Promise.resolve({ ok: true, json: () => Promise.resolve([
      { college: "Test College", tmc_id: "test-psych", tmc_discipline: "Test Psychology", degree_type: "AA-T", filled_slots: 2, total_slots: 3, updated_at: "2026-06-17" }]) });
  if (url.indexOf("tmc_curator_notes") >= 0 && (!opts || opts.method !== "POST"))
    return Promise.resolve({ ok: true, json: () => Promise.resolve([
      { slot_key: "0:0", note: "C-ID under revision", reviewer_email: "map@rccd.edu", updated_at: "2026-06-17" }]) });
  return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
};

let threw = false;
try { window.eval(builderSrc); } catch (e) { threw = true; console.error("tmc_builder.js eval threw:", e); }
check("tmc_builder.js evaluates without throwing", !threw);

window.CPL_TMC_BUILDER.boot();

const colSel = document.getElementById("tmc-college-sel");
const tmcSel = document.getElementById("tmc-tmc-sel");
check("college dropdown populated from COCI colleges", colSel && colSel.options.length === 3); // placeholder + 2
check("TMC dropdown populated from templates", tmcSel && tmcSel.options.length === 3);          // placeholder + 1 draft + 1 planned

function selectVal(sel, val) {
  sel.value = val;
  sel.dispatchEvent(new window.Event("change"));
}

(async function () {
  selectVal(colSel, "Test College");
  selectVal(document.getElementById("tmc-tmc-sel"), "test-psych");
  await sleep(0); // let the resume fetch microtask settle

  const sections = document.querySelectorAll("#tab-tmc-builder .tmc-section");
  check("form renders one block per section", sections.length === 2);
  const slots = document.querySelectorAll("#tab-tmc-builder .tmc-slot");
  check("form renders one row per slot", slots.length === 3);

  // (1) AUTO-MATCH: the PSY 110 + MATH 110 slots pre-select the college's C-ID-carrying course
  const pickerBtns = document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn");
  const btn0 = txt(pickerBtns[0]);
  const btn1 = txt(pickerBtns[1]);
  check("slot PSY 110 auto-populates PSYC 1 (C-ID match)", /PSYC\s*1/.test(btn0) && /Introductory Psychology/.test(btn0));
  check("slot MATH 110 auto-populates MATH 15 (C-ID match)", /MATH\s*15/.test(btn1));
  const statuses = document.querySelectorAll("#tab-tmc-builder .tmc-status.ok");
  check("auto-matched slots show a ✓ C-ID aligned status", statuses.length >= 2 && /C-ID aligned/.test(txt(statuses[0])));

  // the non-C-ID List A slot is NOT auto-filled (no C-ID to match)
  const btn2 = txt(pickerBtns[2]);
  check("non-C-ID slot stays unselected until the college picks", /Select your/.test(btn2));

  // (2) TOTAL UNITS of the right-side selected courses is shown (3 + 4 = 7)
  const totalEl = document.getElementById("tmc-total-units");
  check("Total Units footer shows the sum of selected course units (7)", totalEl && txt(totalEl) === "7");
  const meter = txt(document.getElementById("tmc-meter"));
  check("header meter leads with Total Units", /Total Units:\s*7/.test(meter));
  const secsel = document.querySelectorAll("#tab-tmc-builder .tmc-secsel");
  check("Required Core section subtotal = 7 u", /7 u/.test(txt(secsel[0])));

  // null-safety: opening the picker for the List A slot must list candidates incl. the null-title row without throwing
  let pickThrew = false;
  try { pickerBtns[2].click(); } catch (e) { pickThrew = true; console.error(e); }
  check("opening a picker with a null-title course in the catalog does not throw", !pickThrew);
  const opts = document.querySelectorAll("#tab-tmc-builder .tmc-opt");
  check("picker lists the college's courses as options", opts.length >= 1);

  // (3) STATUS INDICATOR — dropdown groups, legend, header chip + official link
  const optgroups = tmcSel.querySelectorAll("optgroup");
  check("TMC dropdown groups by status (Available now / Coming soon)",
    optgroups.length === 2 && /Available now/.test(optgroups[0].label) && /Coming soon/.test(optgroups[1].label));
  const legend = document.querySelector("#tab-tmc-builder .tmc-statuslegend");
  check("status legend shows 'N of M TMCs built'", legend && /1 of 2/.test(txt(legend)));
  const chip = document.querySelector("#tab-tmc-builder .tmc-formhead .tmc-stchip");
  check("draft TMC header shows a Draft status chip", chip && /Draft/.test(txt(chip)));
  const srclink = document.querySelector("#tab-tmc-builder .tmc-formhead .tmc-srclink");
  check("draft TMC header links to the official template",
    srclink && /example\.org\/psych\.pdf/.test(srclink.getAttribute("href")));

  // planned TMC: coming-soon panel + official-template link, NO form slots, no crash
  selectVal(document.getElementById("tmc-tmc-sel"), "test-planned");
  await sleep(0);
  const soon = document.querySelector("#tab-tmc-builder .tmc-soon-badge");
  check("planned TMC shows a Coming soon panel", soon && /Coming soon/.test(txt(soon)));
  const psrc = document.querySelector("#tab-tmc-builder .tmc-srclink");
  check("planned TMC links to its official template",
    psrc && /example\.org\/planned\.pdf/.test(psrc.getAttribute("href")));
  check("planned TMC renders no form slots (not yet encoded)",
    document.querySelectorAll("#tab-tmc-builder .tmc-slot").length === 0);

  // (4) CURATOR FEATURES — auth, status filter, PDF artifact, notes, discrepancy, queue
  selectVal(document.getElementById("tmc-tmc-sel"), "test-psych"); // back to the real form
  await sleep(0); // let loadNotes settle
  const authBar = txt(document.getElementById("tmc-auth"));
  check("signed-in curator shown in the auth bar", /map@rccd\.edu/.test(authBar));
  const stFilter = document.getElementById("tmc-status-filter");
  check("Status filter present with a 'New requests' option", stFilter &&
    Array.prototype.some.call(stFilter.options, function (o) { return o.value === "requested"; }));
  const pdf = document.querySelector("#tab-tmc-builder .tmc-pdf a");
  check("PDF artifact link points at the committed tmc/source_pdfs copy", pdf &&
    /tmc\/source_pdfs\/psych\.pdf/.test(pdf.getAttribute("href")));
  const submitBtn = Array.prototype.filter.call(document.querySelectorAll("#tab-tmc-builder .tmc-btn"),
    function (b) { return /Submit for CO review/.test(txt(b)); });
  check("'Submit for CO review' action present", submitBtn.length === 1);
  const note = document.querySelector("#tab-tmc-builder .tmc-note");
  check("global curator note renders on its course row", note && /C-ID under revision/.test(txt(note)));
  check("signed-in curator gets an add/edit-note affordance", document.querySelector("#tab-tmc-builder .tmc-note-add"));
  check("cid_unverified slot shows a C-ID discrepancy flag", document.querySelector("#tab-tmc-builder .tmc-unv"));

  // switch the Status filter to the CO-review queue
  stFilter.value = "requested";
  stFilter.dispatchEvent(new window.Event("change"));
  await sleep(0);
  const queue = document.querySelector("#tab-tmc-builder .tmc-reqlist");
  check("'New requests' filter renders the CO-review queue", queue && /Test College/.test(txt(queue)));

  check("no unhandled promise rejections", rejections.length === 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
