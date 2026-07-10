// CPL Pathways tab (cpl_pathways.js) — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the nav button / pane / lazy-boot are
//      present in BOTH HTMLs;
//  (b) course-key normalization — MAP entry drift "40.5" vs catalog "40.50"
//      must resolve to the same key in BOTH directions (the failure mode that
//      would silently drop a ✓ and understate the billboard number);
//  (c) buildLiveIndexes — college match is case-insensitive substring; CLEP
//      rows with ge_credit.na=true are EXCLUDED; spelling-variant duplicate
//      exams de-dupe; non-CLEP programs (AP/IB) never enter clepByArea;
//  (d) resolvePathway — unit buckets (cpl/clep/rest) sum to total_units; a
//      live articulation flips a course to status "cpl"; a GE slot with a
//      matching clep_area flips to "clep"; a plain course stays "rest";
//  (e) baked fallback — live=null still resolves via the course's `cpl` stamp
//      and the slot's `clep_fallback`, and activate() renders with the
//      "live data unavailable" note;
//  (f) full render through activate() with a stubbed CPL_TABS.loadScript —
//      hero, stat tiles, meter segments, ✓ rows, CLEP expander toggles, and
//      the campaign headline's {cpl_units} placeholder is substituted;
//  (g) XSS — a hostile course title renders via textContent (no live element).
//
// Run from repo root: `npm test` (or `node tests/cpl_pathways.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["CPL_Dashboard.html", cpl], ["index.html", idx]].forEach(function (p) {
  check("nav button in " + p[0], /data-tab="cpl-pathways"[^>]*>🎓 CPL Pathways</.test(p[1]));
  check("pane #cpl-pathways-root in " + p[0], /id="cpl-pathways-root"/.test(p[1]));
  check("lazy boot loadScript in " + p[0], /loadScript\('cpl_pathways\.js', 'CPL_PATHWAYS_TAB'/.test(p[1]));
  check("data file boot in " + p[0], /loadScript\('cpl_pathways_data\.js', 'CPL_PATHWAYS'/.test(p[1]));
});
// The committed pathway data file parses and carries the Cerritos program.
{
  const dsrc = fs.readFileSync("cpl_pathways_data.js", "utf8");
  const dom = new JSDOM("<body></body>", { runScripts: "outside-only" });
  dom.window.eval(dsrc);
  const d = dom.window.CPL_PATHWAYS;
  check("cpl_pathways_data.js defines window.CPL_PATHWAYS", !!d && Array.isArray(d.programs));
  check("first program is the Cerritos ironworker BS",
    !!d && d.programs.length >= 1 && /Cerritos/.test(d.programs[0].college || "") &&
    /Ironworker/i.test(d.programs[0].program || ""));
  check("program has sections with courses",
    !!d && Array.isArray(d.programs[0].sections) && d.programs[0].sections.length >= 3 &&
    d.programs[0].sections.every(s => Array.isArray(s.courses) && s.courses.length > 0));
}

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

function freshWindow() {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root" style="border:1px dashed"></div></body>`, {
    runScripts: "outside-only", url: "https://example.test/",
  });
  dom.window.eval(SRC);
  return dom.window;
}

// Stub CER payload: one Cerritos IWAP articulation entered as "40.50" (the
// catalog spelling), one entered as "40.5" (the MAP drift spelling), a CLEP
// row with GE credit, an na:true CLEP row, a duplicate-exam CLEP row, an AP
// row (must not enter clepByArea), and a non-Cerritos line (must not match).
const CER_STUB = {
  _generated_at: "2026-07-10T15:07:33+00:00",
  unified_titles: [
    { ut: "Ironworker Apprenticeship — Cranes", cpl_types: ["Credit By Exam"],
      articulations: [{ cid: "INDT M10OD", sys: "M-ID", local: [
        { subj: "IWAP", num: "40.50", t: "IW - Cranes", colleges: ["Cerritos College"], u: 2.0 }] }] },
    { ut: "Ironworker Apprenticeship — Detailing", cpl_types: ["Credit By Exam"],
      articulations: [{ cid: "INDT M10OW", sys: "M-ID", local: [
        { subj: "IWAP", num: "41.5", t: "IW - Detailing", colleges: ["CERRITOS COLLEGE"], u: 2.0 }] }] },
    { ut: "Some Other College Credential", cpl_types: ["Credit By Exam"],
      articulations: [{ cid: "X M1", sys: "M-ID", local: [
        { subj: "IWAP", num: "40.22", t: "x", colleges: ["Mt. San Antonio College"], u: 2.0 }] }] },
    { ut: "CLEP Introductory Sociology", cpl_types: ["Standardized Assessment"],
      ge_credit: { program: "CLEP", exam: "Introductory Sociology", areas: ["Social/Behavioral Sciences"], units: 3, na: false },
      articulations: [] },
    { ut: "CLEP Introductory Sociology (variant)", cpl_types: ["Standardized Assessment"],
      ge_credit: { program: "CLEP", exam: "Introductory Sociology", areas: ["Social/Behavioral Sciences"], units: 3, na: false },
      articulations: [] },
    { ut: "CLEP College Composition", cpl_types: ["Standardized Assessment"],
      ge_credit: { program: "CLEP", exam: "College Composition", areas: [], units: 0, na: true },
      articulations: [] },
    { ut: "AP Psychology", cpl_types: ["Standardized Assessment"],
      ge_credit: { program: "AP", exam: "Psychology", areas: ["Social/Behavioral Sciences"], units: 3, na: false },
      articulations: [] },
    // Adoption-option material: a credential articulated at ANOTHER college
    // (WLAC) + one line at the home college (must be excluded from ⊕), and a
    // second same-discipline credential at Chaffey (disc-matching).
    { ut: "Registered Dental Hygienist (RDH) License", cpl_types: ["Industry Certification"],
      articulations: [{ cid: "DENT M10HK", sys: "M-ID", disc: "Dental Technology", local: [
        { subj: "DEN HY", num: "421", t: "Dental Hygiene Capstone", colleges: ["West Los Angeles College"], u: 5.0 },
        { subj: "DH", num: "99", t: "Home-college line", colleges: ["Cerritos College"], u: 1.0 }] }] },
    { ut: "Dental Office Procedures", cpl_types: ["Credit By Exam"],
      articulations: [{ cid: "DENT M1081", sys: "M-ID", disc: "Dental Technology", local: [
        { subj: "DENTAL", num: "455", t: "Dental Office Procedures", colleges: ["Chaffey College"], u: 2.0 }] }] },
  ],
};

const PROGRAM_STUB = {
  id: "test-prog",
  college: "Cerritos College",
  program: "Field Ironworker Supervisor",
  degree: "Bachelor of Science",
  start: "Fall 2027",
  total_units: 20,
  campaign: { headline: "Your card is worth {cpl_units} units.", sub: "sub line" },
  sections: [
    { id: "major", title: "Apprenticeship major", courses: [
      // catalog spells 40.5; MAP entered 40.50 — must still match (b).
      // Also adopt-stamped: a ✓ row must NOT grow an ⊕ chip (covered > adopt).
      { code: "IWAP 40.5", title: "IW - Cranes", units: 2.0,
        adopt: { disc: "Dental Technology" } },
      // catalog spells 41.50; MAP entered 41.5 — reverse direction, and the
      // MAP line's college is SHOUTING-CASE (case-insensitive match guard)
      { code: "IWAP 41.50", title: "IW - Detailing", units: 2.0 },
      // non-Cerritos line must NOT match
      { code: "IWAP 40.22", title: "Not at Cerritos", units: 2.0 },
    ]},
    { id: "ge", title: "General Education", courses: [
      { title: "Social & Behavioral Sciences", units: 3, clep_area: "Social/Behavioral Sciences" },
      { title: "No-exam area", units: 3, clep_area: "Language and Rationality" },
    ]},
    { id: "upper", title: "Upper division", courses: [
      { code: "FIWS 401", title: "<img src=x onerror=window.__xss=1>Hostile", units: 3 },
      { code: "DH 300", title: "Adopt by credential", units: 3,
        adopt: { credentials: ["Registered Dental Hygienist (RDH) License"], note: "WLAC precedent" } },
      { code: "DH 301", title: "Adopt by discipline", units: 3,
        adopt: { disc: "Dental Technology" } },
    ]},
  ],
};

// (b) course-key normalization, both directions
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  check("courseKey normalizes 40.5 === 40.50", T._courseKey("IWAP", "40.5") === T._courseKey("IWAP", "40.50"));
  check("courseKey keeps distinct numbers distinct", T._courseKey("IWAP", "40.5") !== T._courseKey("IWAP", "40.53"));
  check("courseKey passes through non-numeric", T._courseKey("HED", "100B") === "HED 100B");
}

// (c) buildLiveIndexes
{
  const w = freshWindow();
  const live = w.CPL_PATHWAYS_TAB._buildLiveIndexes(CER_STUB, "Cerritos");
  check("live index built", !!live && !!live.artIdx);
  check("Cerritos line indexed (40.50 spelling)", !!live.artIdx["IWAP 40.50"]);
  check("case-insensitive college match", !!live.artIdx["IWAP 41.50"]);
  check("non-Cerritos line NOT indexed", !live.artIdx["IWAP 40.22"]);
  const soc = live.clepByArea["Social/Behavioral Sciences"] || [];
  check("CLEP exams collected for GE area", soc.length >= 1);
  check("duplicate CLEP exam de-duped", soc.filter(e => e.exam === "Introductory Sociology").length === 1);
  check("AP exam does NOT enter clepByArea", !soc.some(e => e.exam === "Psychology"));
  const anyNa = Object.keys(live.clepByArea).some(k =>
    live.clepByArea[k].some(e => e.exam === "College Composition"));
  check("na:true CLEP excluded", !anyNa);
}

// (d) resolvePathway with live data
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const live = T._buildLiveIndexes(CER_STUB, "Cerritos");
  const m = T._resolvePathway(PROGRAM_STUB, live);
  check("cpl bucket = the two matched IWAP courses (4u)", m.cplUnits === 4);
  check("clep bucket = the one matched GE slot (3u)", m.clepUnits === 3);
  check("rest = total - cpl - clep", m.restUnits === 20 - 4 - 3);
  const majorRows = m.sections[0].rows;
  check("matched course status=cpl", majorRows[0].status === "cpl" && majorRows[1].status === "cpl");
  check("unmatched course status=rest", majorRows[2].status === "rest");
  check("cpl detail names the MAP credential", /Cranes/.test(majorRows[0].detail || ""));
  const geRows = m.sections[1].rows;
  check("GE slot with exams status=clep", geRows[0].status === "clep" && (geRows[0].clepOptions || []).length >= 1);
  check("GE slot without exams stays rest", geRows[1].status === "rest");
}

// (d2) no_count sections resolve but stay out of the unit buckets
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const live = T._buildLiveIndexes(CER_STUB, "Cerritos");
  const prog = JSON.parse(JSON.stringify(PROGRAM_STUB));
  prog.sections.push({ id: "alt", title: "Alternate track", no_count: true, courses: [
    { code: "IWAP 40.5", title: "IW - Cranes (alt listing)", units: 2.0 }, // live-matches
    { code: "FIWS 999", title: "Unmatched alt", units: 5.0 },
  ]});
  const m = T._resolvePathway(prog, live);
  check("no_count: matched alt course still shows cpl", m.sections[3].rows[0].status === "cpl");
  check("no_count: cpl bucket unchanged", m.cplUnits === 4);
  check("no_count: rest bucket unchanged", m.restUnits === 20 - 4 - 3);
}

// (d3) ⊕ adoption options — live-derived from OTHER colleges' articulations
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const live = T._buildLiveIndexes(CER_STUB, "Cerritos");
  const m = T._resolvePathway(PROGRAM_STUB, live);
  const upper = m.sections[2].rows;
  const byCred = upper[1], byDisc = upper[2], covered = m.sections[0].rows[0];
  check("adopt-by-credential collects the WLAC line", !!byCred.adoptOptions &&
    byCred.adoptOptions.length === 1 && byCred.adoptOptions[0].credential === "Registered Dental Hygienist (RDH) License");
  check("home-college line EXCLUDED from adoption options",
    !!byCred.adoptOptions && byCred.adoptOptions[0].lines.every(l => !/Cerritos/.test(l.college)));
  check("adoption line carries college + code + units", (function () {
    const l = byCred.adoptOptions[0].lines[0];
    return /West Los Angeles/.test(l.college) && l.code === "DEN HY 421" && l.units === 5;
  })());
  check("adopt-by-discipline pulls BOTH Dental Technology credentials",
    !!byDisc.adoptOptions && byDisc.adoptOptions.length === 2);
  check("adopt rows keep status rest (opportunity, not credit)",
    byCred.status === "rest" && byDisc.status === "rest");
  check("adopt does not change the unit buckets", m.cplUnits === 4 && m.clepUnits === 3);
  check("✓-covered row gets NO adoption options even when stamped", !covered.adoptOptions);
  check("model.hasAdopt flags the legend line", m.hasAdopt === true);
  // live=null → no adoption chips (purely live-derived)
  const m0 = T._resolvePathway(PROGRAM_STUB, null);
  check("no live data → no adoption options", !m0.sections[2].rows[1].adoptOptions && m0.hasAdopt === false);
}

// (e) baked fallback when live is null
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const prog = JSON.parse(JSON.stringify(PROGRAM_STUB));
  prog.sections[0].courses[0].cpl = { credential: "Ironworker Apprenticeship — Cranes", types: ["Credit By Exam"] };
  prog.sections[1].courses[0].clep_fallback = [{ exam: "Introductory Sociology", units: 3 }];
  const m = T._resolvePathway(prog, null);
  check("fallback: baked cpl stamp resolves", m.sections[0].rows[0].status === "cpl");
  check("fallback: clep_fallback resolves", m.sections[1].rows[0].status === "clep");
  check("fallback: unstamped course stays rest", m.sections[0].rows[1].status === "rest");
}

// (f)+(g) full render through activate()
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_TABS = { loadScript: function (src, globalName, cb) {
    // simulate the CER data script landing
    w.CPL_CREDENTIAL_REFERENCE = CER_STUB;
    cb();
  }};
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  const text = root.textContent;
  check("hero renders program name", /Field Ironworker Supervisor/.test(text));
  check("stat tiles render cpl units", /✓ 4/.test(text));
  check("meter has cpl + clep + rest segments", root.querySelectorAll(".cplpw-meter .seg").length === 3);
  check("✓ rows render with done class", root.querySelectorAll(".cplpw-course.done").length === 2);
  check("campaign {cpl_units} substituted", /worth 4 units/.test(text));
  // CLEP expander toggles
  const btn = root.querySelector("button.how.clep");
  check("CLEP expander button present", !!btn);
  const panel = root.querySelector(".cplpw-clepopts");
  check("options panel hidden initially", panel && panel.style.display === "none");
  btn.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("options panel opens on click", panel && panel.style.display !== "none");
  check("panel lists the exam", /Introductory Sociology/.test(panel.textContent));
  // ⊕ adoption chip rendering
  const adoptBtns = root.querySelectorAll("button.how.adopt");
  check("⊕ chips render on the two adopt rows only", adoptBtns.length === 2);
  check("⊕ chip labels the count", /⊕ adopted elsewhere × 1/.test(adoptBtns[0].textContent));
  const adoptPanel = root.querySelector(".cplpw-adoptopts");
  check("adopt panel hidden initially", adoptPanel && adoptPanel.style.display === "none");
  adoptBtns[0].dispatchEvent(new w.Event("click", { bubbles: true }));
  check("adopt panel opens on click", adoptPanel.style.display !== "none");
  check("adopt panel names credential + college + note",
    /Registered Dental Hygienist/.test(adoptPanel.textContent) &&
    /West Los Angeles College: DEN HY 421/.test(adoptPanel.textContent) &&
    /WLAC precedent/.test(adoptPanel.textContent));
  check("legend gains the ⊕ line", /adoption opportunity/.test(root.querySelector(".cplpw-legend").textContent));
  // XSS
  check("hostile title rendered inert (no <img>)", root.querySelectorAll("img").length === 0 && !w.__xss);
  check("hostile title visible as text", /Hostile/.test(text));
  // idempotent activate
  w.CPL_PATHWAYS_TAB.activate();
  check("activate() is idempotent", root.querySelectorAll(".cplpw-hero").length === 1);
}

// (h) status stages — banner, selector, persistence, data default
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_TABS = { loadScript: function (src, g, cb) { w.CPL_CREDENTIAL_REFERENCE = CER_STUB; cb(); } };
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  const banner = root.querySelector(".cplpw-stagebanner");
  check("status banner renders", !!banner);
  check("default stage is DISCUSSION DRAFT (no stage in stub → safe default)",
    banner.classList.contains("draft") && /DISCUSSION DRAFT/.test(banner.textContent));
  check("banner carries the feedback note", /mock-up for feedback/.test(banner.textContent));
  check("hero carries a stage chip", !!root.querySelector(".cplpw-chip.stage-draft"));
  const selBtns = root.querySelectorAll(".cplpw-stagesel button");
  check("selector offers the 3 stages", selBtns.length === 3);
  check("Discussion Draft selected by default", selBtns[0].className.indexOf("on") === 0);
  // flip to Active
  selBtns[1].dispatchEvent(new w.Event("click", { bubbles: true }));
  const banner2 = root.querySelector(".cplpw-stagebanner");
  check("selecting Active swaps the banner", banner2.classList.contains("active") && /ACTIVE PATHWAY/.test(banner2.textContent));
  check("stage persisted to localStorage", w.localStorage.getItem("cplPathwaysStage.test-prog") === "active");
  check("hero chip follows the stage", !!root.querySelector(".cplpw-chip.stage-active"));
}
// (h2) localStorage override wins over the data default in a fresh window
{
  const w = freshWindow();
  w.localStorage.setItem("cplPathwaysStage.test-prog", "tabled");
  w.CPL_PATHWAYS = { programs: [Object.assign({}, PROGRAM_STUB, { stage: "active" })] };
  w.CPL_TABS = { loadScript: function (src, g, cb) { w.CPL_CREDENTIAL_REFERENCE = CER_STUB; cb(); } };
  w.CPL_PATHWAYS_TAB.activate();
  const banner = w.document.querySelector(".cplpw-stagebanner");
  check("localStorage view override wins over data stage", banner.classList.contains("tabled") && /TABLED/.test(banner.textContent));
}
// (h3) data stage field respected when no override
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [Object.assign({}, PROGRAM_STUB, { stage: "active" })] };
  w.CPL_TABS = { loadScript: function (src, g, cb) { w.CPL_CREDENTIAL_REFERENCE = CER_STUB; cb(); } };
  w.CPL_PATHWAYS_TAB.activate();
  check("data stage=active renders the Active banner",
    w.document.querySelector(".cplpw-stagebanner").classList.contains("active"));
}

// (i) PDF extract — opens a print window with the map, banner, no toolbar
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_TABS = { loadScript: function (src, g, cb) { w.CPL_CREDENTIAL_REFERENCE = CER_STUB; cb(); } };
  let printed = 0, opened = null;
  w.open = function () {
    const d = w.document.implementation.createHTMLDocument("print");
    opened = { document: d, focus: function () {}, setTimeout: function (fn) { fn(); }, print: function () { printed++; } };
    return opened;
  };
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  const pdfBtn = root.querySelector(".cplpw-pdfbtn");
  check("PDF button present in the toolbar", !!pdfBtn);
  pdfBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("PDF window opened + print() called", !!opened && printed === 1);
  const pbody = opened ? opened.document.body : null;
  check("print doc carries the program name", !!pbody && /Field Ironworker Supervisor/.test(pbody.textContent));
  check("print doc carries the status banner", !!pbody && /DISCUSSION DRAFT/.test(pbody.textContent));
  check("print doc strips the toolbar", !!pbody && !pbody.querySelector(".cplpw-toolbar"));
  check("print doc expands CLEP panels", !!pbody && (function () {
    const p = pbody.querySelector(".cplpw-clepopts");
    return p && p.style.display !== "none";
  })());
  check("print title names program + stage", /Field Ironworker Supervisor \(Discussion Draft\)/.test(opened.document.title));
  check("print doc has the token block (var() can't resolve without :root)",
    /--hunter:#2C601A/.test(opened.document.head.textContent));
}

// (e2) render note when CER unavailable
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_TABS = { loadScript: function (src, g, cb) { cb(); } }; // never sets the global
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  check("live-unavailable note renders", /unavailable/.test(root.textContent));
}

// ── Report ──
let fail = 0;
results.forEach(([name, ok]) => { if (!ok) fail++; console.log((ok ? "  ✓ " : "  ✗ ") + name); });
console.log(`cpl_pathways: ${results.length - fail}/${results.length} passed`);
if (fail) process.exit(1);
