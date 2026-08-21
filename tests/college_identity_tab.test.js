// College & District Identity tab — the lint surface.
//
// Sam, 2026-08-21: "Maybe it's time to add a new COBI tab to visually show the
// key source lookup tables we rely upon, particularly the college/district
// table that should list loc IDs and all variations of the names found in the
// DB."
//
// ⭐ The tab's value is showing what is EMPTY OR DISAGREEING, so these checks are
// mostly about absence: that a failed read renders "unknown" and never 0, that a
// stale snapshot announces itself, and that a gated read it could not make is
// named rather than silently dropped. A viewer that mirrors SQL would need none
// of this — which is the point.
//
// Run from repo root: `npm test` (or `node tests/college_identity_tab.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("college_identity.js", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");

// ── (1) Rule 4 + the wiring contract ───────────────────────────────────────
block("(1)", function () {
  check("(1) ⚠ both HTMLs are byte-identical", DASH === INDEX,
    "Rule 4 — the workflow copies one to the other");
  ["data-tab=\"college-identity\"", "id=\"college-identity-root\"",
   "onActivate('college-identity'", "loadScript('college_identity.js'"].forEach(function (frag) {
    check("(1) the shell carries " + frag, DASH.indexOf(frag) >= 0);
  });
  // ⚠ The data file must load BEFORE the module, or the first paint drops the
  // snapshot findings. Nested, not two sibling calls.
  check("(1) ⚠ the DATA file loads before the module, nested not parallel",
    /loadScript\('college_identity_data\.js'[\s\S]{0,200}loadScript\('college_identity\.js'/.test(DASH),
    "loading the module first paints one frame with the findings missing");
  check("(1) ⚠ the module listens on WINDOW, not document",
    /window\.addEventListener\("cpl-tab-activated"/.test(SRC) &&
    !/document\.addEventListener\("cpl-tab-activated"/.test(SRC),
    "the event is dispatched on window — a document listener never fires");
});

// ── (2) The pure lint ──────────────────────────────────────────────────────
function loadModule() {
  const dom = new JSDOM('<!doctype html><html><head></head><body>'
    + '<div id="college-identity-root" style="text-align:center;padding:28px;">Loading&hellip;</div>'
    + "</body></html>", { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  const s = w.document.createElement("script");
  s.textContent = SRC;
  w.document.body.appendChild(s);
  return { w, M: w.CPL_COLLEGE_IDENTITY_TAB, root: w.document.getElementById("college-identity-root") };
}

const COLLEGES = [
  { college_id: 46, college_name: "Cypress College", entity_kind: "college",
    variants: ["Cypress College "], district: "North Orange County Community College District",
    mis_district_code: "860", mis_college_code: "861" },
  { college_id: 82, college_name: "Mission College", entity_kind: "college", variants: [],
    district: "West Valley-Mission Community College District", mis_district_code: "490", mis_college_code: "492" },
  { college_id: 71, college_name: "Los Angeles Mission College", entity_kind: "college",
    variants: ["Mission College"],   // ⚠ collides with a real college's own name
    district: "Los Angeles Community College District", mis_district_code: "740", mis_college_code: "743" },
  { college_id: 133, college_name: "Futuro Health", entity_kind: "partner", variants: [],
    district: null, mis_district_code: null, mis_college_code: null,
    mis_absent_why: "A partner organisation, not a California Community College." },
];

block("(2)", function () {
  const { M } = loadModule();
  const f = M._liveFindings(COLLEGES, [
    "Cypress College ", "Mission College", "Pima Medical Institute", "Futuro Health",
  ]);
  const by = {};
  (f || []).forEach(function (x) { by[x.name] = x; });

  check("(2) ⭐ a trailing-space name is classed as WHITESPACE, not a spelling",
    by["Cypress College "] && by["Cypress College "].cls === "whitespace", JSON.stringify(f));
  check("(2) …and it resolves, because variants carries that exact string",
    by["Cypress College "] && by["Cypress College "].resolves_to === "Cypress College");
  check("(2) …and the why says an exact-match join still misses it",
    by["Cypress College "] && /exact-match/.test(by["Cypress College "].why));
  check("(2) ⚠ a name a college OWNS is not a finding at all",
    !by["Mission College"],
    "Mission College is a real college; it must not be reported because ANOTHER college lists it as a variant");
  check("(2) an unclaimed name is reported as unknown",
    by["Pima Medical Institute"] && by["Pima Medical Institute"].cls === "unknown");
  check("(2) a clean canonical name produces nothing", !by["Futuro Health"]);
  check("(2) positive control: the lint is not simply empty", (f || []).length === 2);

  // ⚠ A missing input must yield null (unknown), never [] (nothing wrong).
  check("(2) ⚠ a missing contacts read returns null, NOT an empty finding list",
    M._liveFindings(COLLEGES, null) === null,
    "[] would render as 'nothing outstanding' for a read that never happened");
});

// ── (3) Render: absence is visible, and a failed read is not a zero ────────
block("(3)", function () {
  const { M, root, w } = loadModule();
  check("(3) precondition: the shipped pane really does centre its contents",
    root.style.textAlign === "center");
  M._state.live = null; M._state.contacts = null; M._state.error = "401"; M._state.loading = false;
  M._render(root);
  check("(3) ⭐ the inline centring is shed before anything renders", !root.style.textAlign);
  const txt = root.textContent;
  check("(3) ⭐ a failed read says UNKNOWN and never renders a zero table",
    /unknown, not zero/.test(txt) && /Could not read map_colleges/.test(txt), JSON.stringify(txt.slice(0, 300)));
  check("(3) ⚠ …and it does not print an entity count it never read",
    !/0 entities in map_colleges/.test(txt));
  check("(3) the gated contacts read is NAMED when it did not happen",
    /Contact names not read/.test(txt),
    "a lint that quietly skips half its input is worse than one that refuses to run");
  /* ⭐ AND THE WAY IN IS OFFERED, not just the obstacle named.
   * tests/team_phrase_affordance.test.js failed this tab on exactly this, and
   * the READ-gated case is the severe one: without the phrase that half is not
   * read-only, it is EMPTY. With team_phrase.js absent (as here) the module
   * must still POINT at the header control rather than render nothing. */
  const slot = root.querySelector("#cid-unlock");
  check("(3) ⭐ a missing gated read offers an unlock slot", !!slot);
  check("(3) …and with no team_phrase.js present it still points at the header",
    slot && /lock button in the header/i.test(slot.textContent),
    "losing the shared helper must not lose the route");

  // Now a successful read.
  M._state.live = COLLEGES; M._state.contacts = ["Cypress College "]; M._state.error = null;
  w.CPL_COLLEGE_IDENTITY = { generated: "2026-08-21",
    counts: { entities: 4, with_variants: 2, with_district: 3 }, findings: [] };
  M._render(root);
  const t2 = root.textContent;
  check("(3) counts render as N of M, never a bare N",
    /2 of 4/.test(t2) && /3 of 4/.test(t2), JSON.stringify(t2.slice(0, 400)));
  check("(3) contact names read live are labelled live", /checked live/i.test(t2));
  check("(3) a partner's missing MIS code shows its REASON, not a blank",
    /not a California Community College/.test(t2));
  check("(3) ⚠ …and the unlock slot is gone once the read succeeded",
    !root.querySelector("#cid-unlock"),
    "an affordance for a problem you no longer have is noise");
});

// ── (4) ⭐ The tab checks its own snapshot ──────────────────────────────────
block("(4)", function () {
  const { M, root, w } = loadModule();
  M._state.live = COLLEGES; M._state.contacts = []; M._state.error = null; M._state.loading = false;
  // A snapshot that disagrees with the live table.
  w.CPL_COLLEGE_IDENTITY = { generated: "2026-01-01",
    counts: { entities: 4, with_variants: 0, with_district: 0 }, findings: [] };
  M._render(root);
  const txt = root.textContent;
  check("(4) ⭐ a stale snapshot announces itself", /snapshot below is out of date/i.test(txt));
  check("(4) …naming the date and the disagreement", /2026-01-01/.test(txt) && /variants 0 vs 2/.test(txt));
  check("(4) …and says which figures to trust", /live figures above are the ones to trust/i.test(txt));

  // An AGREEING snapshot must be silent — a warning that always shows is noise.
  w.CPL_COLLEGE_IDENTITY = { generated: "2026-08-21",
    counts: { entities: 4, with_variants: 2, with_district: 3 }, findings: [] };
  M._render(root);
  check("(4) ⚠ an up-to-date snapshot raises NO warning",
    !/out of date/i.test(root.textContent),
    "a flag that never goes away stops being read");
});

// ── (5) Accessibility + design-system basics ──────────────────────────────
block("(5)", function () {
  const { M, root } = loadModule();
  M._state.live = COLLEGES; M._state.contacts = []; M._state.error = null; M._state.loading = false;
  M._render(root);
  const ths = root.querySelectorAll(".cid-t thead th");
  check("(5) every header cell carries scope", ths.length === 6 &&
    Array.prototype.every.call(ths, function (th) { return th.getAttribute("scope") === "col"; }));
  const wrap = root.querySelector(".cid-wrap");
  check("(5) the scrolling table sits in a focusable, named region",
    wrap && wrap.getAttribute("role") === "region" && !!wrap.getAttribute("aria-label")
      && wrap.getAttribute("tabindex") === "0");
  check("(5) the filter input has a real label",
    !!root.querySelector('label[for="cid-q"]') && !!root.querySelector("#cid-q"));
  check("(5) ⚠ the table is fixed-layout with an explicit colgroup",
    /table-layout:fixed/.test(SRC) && !!root.querySelector(".cid-t colgroup"),
    "auto layout silently parks columns past the wrap's right edge");
  // Design system: tokens, not raw hex, for anything brand-coloured.
  const css = (SRC.match(/function ensureCss\(\)[\s\S]*?document\.head\.appendChild/) || [""])[0];
  const bareHex = (css.match(/:\s*#[0-9a-fA-F]{3,6}\s*[;"]/g) || []);
  check("(5) new CSS uses var(--token), with hex only as a fallback",
    bareHex.length === 0, JSON.stringify(bareHex.slice(0, 5)));
  check("(5) ⚠ no decorative glyphs in rendered text",
    !/[\u{1F000}-\u{1FAFF}\u{2700}-\u{27BF}]/u.test(root.textContent),
    "Sam, 2026-08-14 and again 08-17: plain words, no emoji");
});

let pass = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
  if (ok) pass++;
}
console.log("\ncollege_identity_tab.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);
