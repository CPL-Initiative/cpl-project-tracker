// TMC Builder tab — guards the interaction model + the Session-60 refinements:
//   (1) LIST-FIRST: the tab lands on a directory of every TMC; clicking a row
//       opens that one TMC's builder (a "← All TMCs" back link returns).
//   (2) "All colleges" is the default college filter → a REVIEW view (fixed C-ID
//       list + curator notes, no local-course picker, no Save/Submit). Picking a
//       real college switches to BUILD mode: C-ID auto-match + Total Units + a
//       per-TMC "auto-matches" coverage column in the directory.
//   (3) the "Coming soon"/planned status was retired (all 45 TMCs are encoded).
//   (4) one consolidated filter block (College · Show · Find · Curator sign-in).
// Plus the structural invariants: Rule 4 (both HTMLs identical), the nav button +
// pane + lazy boot wiring, the draft seed templates parse, the renderer is
// null-safe, and the curator layer (auth, notes, discrepancy flag, CO queue).
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
check("the 'Coming soon'/planned status was removed from STATUS_META", builderSrc.indexOf("Coming soon") === builderSrc.lastIndexOf("Coming soon")); // only the explanatory comment remains

// the draft seed templates must parse into the expected shape
const tdom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "outside-only" });
tdom.window.eval(templatesSrc);
const T = tdom.window.CPL_TMC_TEMPLATES;
check("templates parse to an object with a templates[] array", T && Array.isArray(T.templates) && T.templates.length >= 8);
check("templates are flagged DRAFT", T && T._meta && T._meta.draft === true);
const psych = (T.templates || []).filter((t) => t.id === "psychology")[0];
check("psychology template has sections + slots with C-IDs", psych && psych.sections.length && psych.sections[0].slots[0].cid);

// quickstart.js mounts the "What are you working on" bar at the overall header level
const qsSrc = fs.readFileSync("quickstart.js", "utf8");
check("quickstart bar mounts at the header level", /querySelector\('\.header'\)/.test(qsSrc));

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
// Two templates: one draft (Test Psychology, with sections) + one official (sorts first).
window.CPL_TMC_TEMPLATES = {
  _meta: { draft: true, sources: {
    "test-psych": "https://example.org/psych.pdf",
    "test-official": "https://example.org/official.pdf"
  } },
  templates: [{
    id: "test-psych", discipline: "Test Psychology", degree: "AA-T", total_units: 10,
    version: "draft", status: "draft", sections: [
      { name: "Required Core", select: "all", units: "6–7", slots: [
        { cid: "PSY 110", title: "Introductory Psychology", units: "3" },
        { cid: "MATH 110", title: "Introduction to Statistics", units: "3–4", alts: ["SOCI 125"], cid_unverified: true }
      ]},
      { name: "List A — select one", select: 1, units: "3–4", slots: [
        { cid: "", title: "Introduction to Biology", units: "3–4", noncid: true }
      ]}
    ]
  },
  { id: "test-official", discipline: "Test Official", degree: "AS-T", status: "official", version: "2026", total_units: 6,
    sections: [{ name: "Required Core", select: "all", units: "6", slots: [
      { cid: "BIOL 110", title: "General Biology", units: "3" }
    ]}]
  }]
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
  if (url.indexOf("status=in.(submitted,approved,returned)") >= 0)
    return Promise.resolve({ ok: true, json: () => Promise.resolve([
      { college: "Test College", tmc_id: "test-psych", tmc_discipline: "Test Psychology", degree_type: "AA-T", filled_slots: 2, total_slots: 3, updated_at: "2026-06-17", status: "submitted", readiness: null }]) });
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
const stFilter0 = document.getElementById("tmc-status-filter");
check("college dropdown leads with an All-colleges option + each college",
  colSel && colSel.options.length === 3 && colSel.options[0].value === "" && /All colleges/.test(colSel.options[0].text));
check("Status filter present with a 'New requests' option", stFilter0 &&
  Array.prototype.some.call(stFilter0.options, (o) => o.value === "requested"));
check("Status filter no longer offers a planned/Coming-soon option", stFilter0 &&
  !Array.prototype.some.call(stFilter0.options, (o) => o.value === "planned" || /Coming soon/.test(o.text)));

function selectVal(sel, val) { sel.value = val; sel.dispatchEvent(new window.Event("change")); }
function listRows() { return document.querySelectorAll("#tab-tmc-builder .tmc-listrow"); }
function rowFor(re) { return Array.prototype.filter.call(listRows(), (r) => re.test(txt(r)))[0]; }

(async function () {
  // ── LIST VIEW (default landing, All colleges) ──
  check("landing shows the TMC directory (one row per template)", listRows().length === 2);
  check("official TMC sorts to the top of the directory", /Test Official/.test(txt(listRows()[0])));
  check("a list row shows a status chip", document.querySelector("#tab-tmc-builder .tmc-listrow .tmc-stchip"));
  check("no coverage column until a college is picked",
    !/Your auto-matches/.test(txt(document.querySelector("#tab-tmc-builder .tmc-listtable thead"))));

  // ── pick a college → BUILD mode; coverage column appears ──
  selectVal(colSel, "Test College");
  await sleep(0);
  check("coverage column appears once a college is selected",
    /Your auto-matches/.test(txt(document.querySelector("#tab-tmc-builder .tmc-listtable thead"))));
  const psychCov = txt(rowFor(/Test Psychology/));
  check("coverage shows the college's C-ID auto-matches (2 / 3)", /2\s*\/\s*3/.test(psychCov));

  // ── open a TMC from the list (build mode) ──
  rowFor(/Test Psychology/).click();
  await sleep(0);
  check("opening a TMC shows a '← All TMCs' back link", document.querySelector("#tab-tmc-builder .tmc-back"));
  const sections = document.querySelectorAll("#tab-tmc-builder .tmc-section");
  check("form renders one block per section", sections.length === 2);
  const slots = document.querySelectorAll("#tab-tmc-builder .tmc-slot");
  check("form renders one row per slot", slots.length === 3);

  // (1) AUTO-MATCH: the PSY 110 + MATH 110 slots pre-select the college's C-ID-carrying course
  const pickerBtns = document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn");
  check("slot PSY 110 auto-populates PSYC 1 (C-ID match)", /PSYC\s*1/.test(txt(pickerBtns[0])) && /Introductory Psychology/.test(txt(pickerBtns[0])));
  check("slot MATH 110 auto-populates MATH 15 (C-ID match)", /MATH\s*15/.test(txt(pickerBtns[1])));
  const statuses = document.querySelectorAll("#tab-tmc-builder .tmc-status.ok");
  check("auto-matched slots show a ✓ C-ID aligned status", statuses.length >= 2 && /C-ID aligned/.test(txt(statuses[0])));
  check("non-C-ID slot stays unselected until the college picks", /Select your/.test(txt(pickerBtns[2])));

  // (2) TOTAL UNITS of the right-side selected courses is shown (3 + 4 = 7)
  const totalEl = document.getElementById("tmc-total-units");
  check("Total Units footer shows the sum of selected course units (7)", totalEl && txt(totalEl) === "7");
  check("header meter leads with Total Units", /Total Units:\s*7/.test(txt(document.getElementById("tmc-meter"))));
  const secsel = document.querySelectorAll("#tab-tmc-builder .tmc-secsel");
  check("Required Core section subtotal = 7 u", /7 u/.test(txt(secsel[0])));

  // null-safety: opening the List A picker must list candidates incl. the null-title row without throwing
  let pickThrew = false;
  try { pickerBtns[2].click(); } catch (e) { pickThrew = true; console.error(e); }
  check("opening a picker with a null-title course in the catalog does not throw", !pickThrew);
  check("picker lists the college's courses as options", document.querySelectorAll("#tab-tmc-builder .tmc-opt").length >= 1);

  // header chip + official-template link + PDF artifact
  const chip = document.querySelector("#tab-tmc-builder .tmc-formhead .tmc-stchip");
  check("draft TMC header shows a Draft status chip", chip && /Draft/.test(txt(chip)));
  const srclink = document.querySelector("#tab-tmc-builder .tmc-formhead .tmc-srclink");
  check("draft TMC header links to the official template", srclink && /example\.org\/psych\.pdf/.test(srclink.getAttribute("href")));
  const pdf = document.querySelector("#tab-tmc-builder .tmc-pdf a");
  check("PDF artifact link points at the committed tmc/source_pdfs copy", pdf && /tmc\/source_pdfs\/psych\.pdf/.test(pdf.getAttribute("href")));

  // (3) CURATOR FEATURES — auth, submit, notes, discrepancy
  const authBar = txt(document.getElementById("tmc-auth"));
  check("signed-in curator shown in the auth bar", /map@rccd\.edu/.test(authBar));
  const submitBtn = Array.prototype.filter.call(document.querySelectorAll("#tab-tmc-builder .tmc-btn"),
    (b) => /Submit for CO review/.test(txt(b)));
  check("'Submit for CO review' action present (build mode)", submitBtn.length === 1);
  const note = document.querySelector("#tab-tmc-builder .tmc-note");
  check("global curator note renders on its course row", note && /C-ID under revision/.test(txt(note)));
  check("signed-in curator gets an add/edit-note affordance", document.querySelector("#tab-tmc-builder .tmc-note-add"));
  check("cid_unverified slot shows a C-ID discrepancy flag", document.querySelector("#tab-tmc-builder .tmc-unv"));

  // ── REVIEW MODE: back to the directory, switch to All colleges, reopen ──
  document.querySelector("#tab-tmc-builder .tmc-back").click();
  await sleep(0);
  check("back link returns to the directory", listRows().length === 2);
  selectVal(document.getElementById("tmc-college-sel"), ""); // All colleges
  await sleep(0);
  rowFor(/Test Psychology/).click();
  await sleep(0);
  check("All-colleges open is a review view (banner shown)", document.querySelector("#tab-tmc-builder .tmc-reviewbar"));
  check("review mode shows no local-course pickers", document.querySelectorAll("#tab-tmc-builder .tmc-picker-btn").length === 0);
  check("review mode still renders the fixed C-ID slots", document.querySelectorAll("#tab-tmc-builder .tmc-slot").length === 3);
  check("review mode hides Save/Submit (needs a college)",
    !Array.prototype.some.call(document.querySelectorAll("#tab-tmc-builder .tmc-btn"), (b) => /Save draft|Submit for CO review/.test(txt(b))));
  check("review mode keeps an export affordance", Array.prototype.some.call(
    document.querySelectorAll("#tab-tmc-builder .tmc-btn"), (b) => /Export Word|Print/.test(txt(b))));

  // ── CO-review queue (Status filter = New requests) ──
  const stFilter = document.getElementById("tmc-status-filter");
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
