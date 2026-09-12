// CPL Implementation Funding — moving sections, excluding them from the public
// page, and the reported boxes for outcomes the model funds but cannot measure
// (Sam, 2026-09-11).
//
// His four asks, and what each assertion here defends:
//
//   1. "Make the sections movable when curating so I can change the order of
//      appearance."  ASSERT ORDER, NOT PRESENCE. Every section renders before
//      and after a reorder, so any check that merely looks for a section passes
//      either way — the S257 lesson, and the reason the first check in this file
//      reads the DOM sequence rather than a selector.
//   2. "Revise the … section to include the measurable and non-measurable
//      priorities."  A goal carrying designated activities gets a box beside the
//      measured cards, in the same band.
//   3. "Add a priority box for (C) … I want to designate certain projects to
//      this and report on project outcomes."  The box is NOT a priority in the
//      model: priorities(slot) drives every share, factor, target and cap, and
//      an entry there with share 0 would earn nothing while still entering every
//      sum, export and memo. So the card count is pinned.
//   4. "On public view add a chip for me in curation to exclude each section."
//      The chips live on the PREVIEW and nowhere else: a real public rendering
//      carries none of them, and the sweep is what guarantees it rather than
//      each emitter remembering to check.
//
// ⚠️ The id-keyed order is the load-bearing choice. A stored permutation of
// POSITIONS would re-point at different sections the first time one is shipped
// or retired, so the two rules that make a stored order survive OUR edits — an
// unknown id is ignored, a new id is appended — are asserted directly.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_section_order.test.js`).
const { check, finish, freshDom, boot, click, commit } = require("./lib/cpl_funding_harness.js");

const HOUSE = ["about", "college", "window", "pools", "formula", "eligibility", "priorities", "timing"];

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    onChange: function () {},
  };
}
// The rendered sequence of TOP-LEVEL sections. Nested sections (ftes-factors
// lives inside the priorities body) are excluded by asking only for the ids the
// house order names — the same set the position picker offers.
function domOrder(doc) {
  return Array.from(doc.querySelectorAll("[data-sec], [data-secstub]"))
    .map(function (el) { return el.getAttribute("data-sec") || el.getAttribute("data-secstub"); })
    .filter(function (id) { return HOUSE.indexOf(id) >= 0; });
}
// Click a selector, reporting its ABSENCE as a named failure rather than dying
// on it. Without this a regression that removes a control takes the process out
// with "Cannot read properties of null" before finish() runs, and CI shows a
// crash instead of the one line that says what broke — which is exactly what
// the sweep-exemption mutation produced while this suite was being written.
function clickSel(window, doc, sel) {
  const el = doc.querySelector(sel);
  check("control present: " + sel, !!el);
  if (el) click(window, el);
  return !!el;
}
// The designated list of ONE reported box, as text.
//
// ⚠️ Never read the box's own textContent for this. The designation picker is
// rendered INSIDE the box and lists the whole register, so every project name
// appears in the box's text whether or not it is designated — which made the
// first version of the release check pass on a box that still listed the thing
// it was asked to prove gone, and fail on one that did not.
function designatedText(doc, gkey) {
  const list = doc.querySelector('[data-rprio="' + gkey + '"] .cplfund-rprio-list');
  return list ? list.textContent : "";
}
// A small stand-in for the Activities register. The harness's DOM carries no
// window.CPL_DATA, so without this every designation renders with no outcome
// and the picker has nothing to offer — a suite that would pass while proving
// nothing about either.
function registerStub() {
  return {
    projects: [
      { id: "1.4", name: "California Credential Registry", activity: "Activity 1: AI-Enhanced CPL Infrastructure",
        status: "Foundational Year", pct: 15, update: "Planning session with LWDA and WestEd.", update_date: "2026-06-29" },
      { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: AI-Enhanced CPL Infrastructure",
        status: "On Track", pct: 70, update: "Student Portal and JST processing.", update_date: "2026-07-01" },
      { id: "4.2", name: "Apprenticeship Sprint", activity: "Activity 4: Field Engagement",
        status: "In Progress", pct: 35, update: "", update_date: "" },
      { id: "3.5", name: "Student Stories", activity: "Activity 3: Outcomes",
        status: "On Track", pct: 64, update: "", update_date: "" },
    ],
  };
}

// ── 1. the order seam, on the internal curator view ──────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  check("1a: the house order is what renders with nothing stored",
    domOrder(doc).join(",") === HOUSE.join(","));

  window.CPL_SESSION = reviewerSession();
  T.render();

  const pickers = Array.from(doc.querySelectorAll("[data-secpos]"));
  check("1b: signed in, every top-level section carries a position picker",
    pickers.length === HOUSE.length &&
    pickers.map(function (p) { return p.getAttribute("data-secpos"); }).sort().join(",") ===
      HOUSE.slice().sort().join(","));
  // ⚠️ FORCED, not assumed. `ftes-factors` renders only while some priority is
  // measured in FTES, and the baked default set is not — so the first version of
  // this check asserted over a section that was not on the page, and the guard
  // that a NESTED section never collects a position picker proved nothing. A
  // picker there would carry a position of -1 and reorder a section that is not
  // in the order at all.
  T._setShared({ yearPriorities: { "1": [{ unit: "ftes" }] } });
  T.render();
  check("1c: the NESTED section renders, is renameable, and is never movable",
    !!doc.querySelector('[data-secrename="ftes-factors"]') &&
    !doc.querySelector('[data-secpos="ftes-factors"]') &&
    doc.querySelectorAll("[data-secpos]").length === HOUSE.length);
  T._setShared({});
  T.render();
  check("1d: a picker offers exactly one position per section",
    pickers[0].querySelectorAll("option").length === HOUSE.length);
  check("1e: no control is inside a <summary> — it would fight the fold",
    !doc.querySelector(".cplfund-sec-sum [data-secpos]") &&
    !doc.querySelector("summary select"));

  // Move `priorities` (house position 6) to the front.
  const prioPicker = doc.querySelector('[data-secpos="priorities"]');
  commit(window, prioPicker, "0");
  const moved = domOrder(doc);
  check("1f: the section MOVES — priorities now renders first",
    moved[0] === "priorities" && moved.length === HOUSE.length);
  check("1g: ...and nothing else is lost or duplicated",
    moved.slice().sort().join(",") === HOUSE.slice().sort().join(","));
  check("1h: the order is stored as section IDS, not positions",
    Array.isArray(T._getShared().secOrder) &&
    T._getShared().secOrder[0] === "priorities" &&
    T._getShared().secOrder.every(function (v) { return typeof v === "string"; }));

  // The two rules that make a stored order survive OUR edits.
  T._setShared({ secOrder: ["timing", "not-a-section", "about"] });
  T.render();
  const survived = domOrder(doc);
  check("1i: an id we no longer emit is IGNORED rather than rendered or thrown",
    survived.indexOf("not-a-section") < 0 && survived.length === HOUSE.length);
  check("1j: a stored order names three, and the rest APPEND in house order",
    survived[0] === "timing" && survived[1] === "about" &&
    survived.slice(2).join(",") ===
      HOUSE.filter(function (id) { return id !== "timing" && id !== "about"; }).join(","));

  const reset = doc.querySelector("#cplFundSecOrderReset");
  check("1k: a custom order offers the way back", !!reset);
  if (reset) click(window, reset);
  check("1l: reset restores the house order",
    domOrder(doc).join(",") === HOUSE.join(","));
  check("1m: ...and with the house order there is nothing to restore",
    !doc.querySelector("#cplFundSecOrderReset"));
}

// ── 2. the public PREVIEW: exclude chips, and the stub that keeps a way back ──
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  window.CPL_SESSION = reviewerSession();
  T.render();

  const toPublic = doc.querySelector('[data-viewmode="public"]');
  check("2a: the view control is there to preview with", !!toPublic);
  click(window, toPublic);

  check("2b: the preview carries an exclude chip on every top-level section",
    doc.querySelectorAll("[data-secpvhide]").length === HOUSE.length);
  check("2c: ...and NOT the editing controls — renaming belongs on the internal view",
    !doc.querySelector("[data-secrename]") && !doc.querySelector("[data-textedit]"));

  const pubRows = Array.from(doc.querySelectorAll("[data-pubsechide], [data-pubsecshow]"));
  check("2d: the public explainer's OWN seven sections are curatable here",
    pubRows.length === 7);

  // Exclude a tab section: it must not simply vanish from its own curator.
  clickSel(window, doc, '[data-secpvhide="eligibility"]');
  const stub = doc.querySelector('[data-secstub="eligibility"]');
  check("2e: an excluded section leaves a STUB in the preview, not a hole",
    !!stub && /Excluded from the public page/.test(stub.textContent));
  check("2f: the stub carries no body — the preview stays honest about what a college reads",
    !!stub && !stub.querySelector(".cplfund-sec-body"));
  check("2g: ...and the way back is on the stub itself",
    !!doc.querySelector('[data-secpvshow="eligibility"]'));
  check("2h: the exclusion is stored where every other curator edit is",
    T._getShared().secHidden && T._getShared().secHidden.eligibility === true);
  clickSel(window, doc, '[data-secpvshow="eligibility"]');
  check("2i: including it again removes the stub and brings the section back",
    !doc.querySelector('[data-secstub="eligibility"]') &&
    !!doc.querySelector('[data-sec="eligibility"]'));

  // A public-explainer section, excluded from the same block.
  clickSel(window, doc, '[data-pubsechide="qualify"]');
  check("2j: an explainer section excludes from the tab, under its own id",
    T._getShared().secHidden.qualify === true &&
    !!doc.querySelector('[data-pubsecshow="qualify"]'));
  check("2k: the row says it is out rather than leaving the list",
    !!doc.querySelector(".cplfund-pubsec-row.is-out"));
  check("2l: `timing` is named as one switch, because it is in BOTH id sets",
    /one switch with this tab/i.test(doc.querySelector(".cplfund-pubsec").textContent));

  // Reordering the public page's sections is the same seam, a different key.
  const pubPicker = doc.querySelector('[data-pubsecpos="timing"]');
  check("2m: the explainer's sections carry position pickers too", !!pubPicker);
  if (pubPicker) commit(window, pubPicker, "0");
  check("2n: the explainer order is stored under its OWN key, not the tab's",
    T._getShared().pubSecOrder && T._getShared().pubSecOrder[0] === "timing" &&
    T.publicSectionOrder()[0] === "timing");
  check("2o: ...and the tab's own order is untouched by it",
    domOrder(doc).join(",") === HOUSE.join(","));
}

// ── 3. the REAL public rendering carries none of it ──────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Signed in AND public: the combination that would leak a control if the
  // sweep read `unlocked()` alone.
  window.CPL_SESSION = reviewerSession();
  T._setShared({ secHidden: { eligibility: true } });
  T.render();

  check("3a: no preview chip survives on the public page",
    !doc.querySelector("[data-secpvhide]") && !doc.querySelector("[data-secpvshow]") &&
    !doc.querySelector("[data-secpvpos]"));
  check("3b: no explainer-section block, and no reset buttons",
    !doc.querySelector(".cplfund-pubsec") &&
    !doc.querySelector("#cplFundSecOrderReset") && !doc.querySelector("#cplFundPubOrderReset"));
  check("3c: no position picker and no designation control",
    !doc.querySelector("[data-secpos]") && !doc.querySelector("[data-projsel]") &&
    !doc.querySelector("[data-projadd]") && !doc.querySelector("[data-projrelease]"));
  check("3d: an excluded section is GONE here, not a stub",
    !doc.querySelector('[data-sec="eligibility"]') &&
    !doc.querySelector('[data-secstub="eligibility"]'));
  check("3e: ...and the sections that are not excluded still render in order",
    domOrder(doc).join(",") === HOUSE.filter(function (id) { return id !== "eligibility"; }).join(","));
}

// ── 4. reported boxes, and designating an activity to a goal ─────────────
{
  const { window } = freshDom();
  window.CPL_DATA = registerStub();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  const cBox = doc.querySelector('[data-rprio="C"]');
  check("4a: goal (C) carries a reported box with nothing signed in — it is a READING, not a dial",
    !!cBox && /Advancing career attainment/.test(cBox.textContent));
  check("4b: the box says plainly that nothing prices it",
    !!cBox && /No campus measure scores this outcome/.test(cBox.textContent) &&
    /Reported, not measured/.test(cBox.textContent));
  check("4c: the seeded designations are the three that resolve in the register",
    doc.querySelectorAll('[data-rprio="C"] .cplfund-rprio-p').length === 3 &&
    /California Credential Registry/.test(designatedText(doc, "C")) &&
    /Apprenticeship Sprint/.test(designatedText(doc, "C")) &&
    /Student Stories/.test(designatedText(doc, "C")));
  check("4d: each one reports its OUTCOME from the register, not from the config",
    /Foundational Year/.test(designatedText(doc, "C")) && /15% complete/.test(designatedText(doc, "C")));
  check("4e: the box sits in the Success band, beside the measured cards",
    !!doc.querySelector('#cplfund-band-success [data-rprio="C"]'));
  check("4f: signed out there is no designation control anywhere",
    !doc.querySelector("[data-projsel]") && !doc.querySelector("[data-projrelease]"));

  // ⚠️ The box must not have become a priority in the model.
  const cardsBefore = doc.querySelectorAll("[data-priocard]").length;
  check("4g: a reported box is NOT a priority card", cardsBefore > 0 &&
    !cBox.hasAttribute("data-priocard"));
  check("4h: ...and it is not inside the priority GRID as a card either — the grid is\n" +
    "      what the reorder handlers bind over, so a box that looked like a card\n" +
    "      would collect a position picker and reorder a priority that does not exist",
    !!cBox && !cBox.querySelector("[data-priopos]") && !cBox.querySelector("[data-priodrag]"));

  window.CPL_SESSION = reviewerSession();
  T.render();

  const sel = doc.querySelector('[data-projsel="C"]');
  check("4i: the picker is a MULTI-select over the whole register",
    !!sel && sel.hasAttribute("multiple") &&
    sel.querySelectorAll("option").length === registerStub().projects.length);
  check("4j: ...grouped by Activity, because 32 flat rows is a list nobody finishes",
    !!sel && sel.querySelectorAll("optgroup").length >= 2);
  check("4k: ...and the rows already designated SAY SO rather than disappearing",
    !!sel && /already designated/.test(sel.textContent));
  check("4l: nothing is pre-selected — the selection means what is being ADDED",
    !!sel && Array.from(sel.options).every(function (o) { return !o.selected; }));
  check("4m: the card count did not change when the curator signed in",
    doc.querySelectorAll("[data-priocard]").length === cardsBefore);

  // (D) Opportunities gets the same affordance, with nothing designated yet.
  check("4n: a goal with nothing designated offers the row rather than a box",
    !!doc.querySelector('[data-desig="D"]') && !doc.querySelector('[data-rprio="D"]'));
  check("4o: ...inside the Opportunities band, where its funding already sits",
    !!doc.querySelector('#cplfund-band-opps [data-desig="D"]'));

  // Designate two activities to (D) in one action.
  const dSel = doc.querySelector('[data-projsel="D"]');
  check("4p: (D) offers the whole register too", !!dSel && dSel.hasAttribute("multiple"));
  Array.from(dSel.options).forEach(function (o) {
    if (o.value === "1.1" || o.value === "4.2") o.selected = true;
  });
  clickSel(window, doc, '[data-projadd="D"]');
  check("4q: designating gives (D) a reported box with BOTH chosen activities",
    doc.querySelectorAll('[data-rprio="D"] .cplfund-rprio-p').length === 2 &&
    /MAP Platform Development/.test(designatedText(doc, "D")) &&
    /Apprenticeship Sprint/.test(designatedText(doc, "D")));
  check("4r: the register's NAME travels into the config, for the page with no register",
    T._getShared().projectNames && T._getShared().projectNames["1.1"] === "MAP Platform Development");
  check("4s: ...and the designate ROW is gone now that the goal has a box",
    !doc.querySelector('[data-desig="D"]'));
  check("4t: the model's priority cards are STILL untouched",
    doc.querySelectorAll("[data-priocard]").length === cardsBefore);

  // Releasing one must STAY released across a re-render — the defaults would
  // otherwise surface again and undo it.
  clickSel(window, doc, '[data-rprio="C"] [data-projrelease="3.5"]');
  T.render();
  check("4u: a released activity is gone, and stays gone after a re-render",
    doc.querySelectorAll('[data-rprio="C"] .cplfund-rprio-p').length === 2 &&
    !/Student Stories/.test(designatedText(doc, "C")) &&
    /California Credential Registry/.test(designatedText(doc, "C")));
  check("4v: the release is stored as an EMPTY list, not a deleted key",
    Array.isArray(T._getShared().projectGoals["3.5"]) &&
    T._getShared().projectGoals["3.5"].length === 0);

  // The payload the public explainer paints from.
  const rep = T.reportedGoals();
  check("4w: reportedGoals() emits only the goals that carry designations",
    Array.isArray(rep) && rep.length === 2 &&
    rep.map(function (r) { return r.key; }).sort().join(",") === "C,D");
  check("4x: ...carrying names, and deliberately NOT a weekly-changing status",
    rep[0].projects.every(function (p) { return !!p.name && p.status === undefined; }));
}

finish();
