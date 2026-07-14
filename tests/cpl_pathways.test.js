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

// (j) ⚡ Quick Adopt intake — form, validation, POST payload, success/error
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_TABS = { loadScript: function (s, g, cb) { w.CPL_CREDENTIAL_REFERENCE = CER_STUB; cb(); } };
  const calls = [];
  w.fetch = function (url, opts) { calls.push({ url, opts }); return Promise.resolve({ ok: true }); };
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  const qa = root.querySelector(".cplpw-adoptopts .cplpw-qa");
  check("Quick Adopt block renders inside the adopt panel", !!qa);
  const goBtn = qa.querySelector("button.go");
  check("⚡ Quick Adopt button present", !!goBtn && /Quick Adopt/.test(goBtn.textContent));
  const form = qa.querySelector("form");
  check("intake form hidden until clicked", !!form && form.style.display === "none");
  goBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("intake form opens", form.style.display !== "none");
  check("privacy note present (write-only intake)", /not publicly readable/.test(form.textContent));
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  check("invalid submit blocked — no fetch fired", calls.length === 0);
  check("validation error shown", /required/.test(qa.querySelector(".cplpw-qa-err").textContent));
  form.querySelector("input[name=adopter_college]").value = "Foothill College";
  form.querySelector("input[name=contact_email]").value = "dean@foothill.edu";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  check("valid submit fires ONE intake POST", calls.length === 1 && /cpl_adoption_interest/.test(calls[0].url));
  if (calls.length === 1) {
    const body = JSON.parse(calls[0].opts.body);
    check("payload stamped with pathway + precedent context",
      body.program_id === "test-prog" && /Registered Dental Hygienist/.test(body.credentials) &&
      /West Los Angeles/.test(body.precedent) && body.course_code === "DH 300");
    check("payload carries the requester", body.adopter_college === "Foothill College" && body.contact_email === "dean@foothill.edu");
    check("POST uses the anon key + minimal return", calls[0].opts.headers.apikey && calls[0].opts.headers.Prefer === "return=minimal");
  }
  Promise.resolve().then(() => {}).then(() => {
    check("success message replaces the form", /Request recorded/.test(qa.textContent) && !qa.contains(form));
  });
}
// (j2) intake failure keeps the form + shows the error
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_TABS = { loadScript: function (s, g, cb) { w.CPL_CREDENTIAL_REFERENCE = CER_STUB; cb(); } };
  w.fetch = function () { return Promise.reject(new Error("down")); };
  w.CPL_PATHWAYS_TAB.activate();
  const qa = w.document.querySelector(".cplpw-adoptopts .cplpw-qa");
  const form = qa.querySelector("form");
  qa.querySelector("button.go").dispatchEvent(new w.Event("click", { bubbles: true }));
  form.querySelector("input[name=adopter_college]").value = "Foothill College";
  form.querySelector("input[name=contact_email]").value = "dean@foothill.edu";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  Promise.resolve().then(() => {}).then(() => {}).then(() => {
    check("intake failure shows the error + keeps the form",
      /Could not record/.test(qa.querySelector(".cplpw-qa-err").textContent) && qa.contains(form));
  });
}

// ── Directory tier — per-baccalaureate CPL-landscape cards ──
// CER stub with TOP-coded articulations across several colleges + a CLEP row.
const DIR_CER = {
  _generated_at: "2026-07-14T00:00:00+00:00",
  unified_titles: [
    // Respiratory (TOP 1210): Foothill's own → ✓ for Foothill
    { ut: "RCP License", cpl_types: ["Industry Certification"],
      articulations: [{ top: "1210.00", disc: "Respiratory Therapy", local: [
        { subj: "RSPT", num: "90", t: "RCP Credit", colleges: ["Foothill College"], u: 24 }] }] },
    // Respiratory (TOP 1210): El Camino peer → ⊕ pool for Foothill (Foothill lacks it)
    { ut: "NBRC CRT", cpl_types: ["Standardized Assessment"],
      articulations: [{ top: "1210.00", disc: "Respiratory Therapy", local: [
        { subj: "RESP", num: "12", t: "CRT Credit", colleges: ["El Camino College"], u: 3 }] }] },
    // Automotive (TOP 0948): Rio Hondo's own → ✓ for Rio Hondo
    { ut: "ASE Brakes", cpl_types: ["Industry Certification"],
      articulations: [{ top: "0948.00", disc: "Automotive Technology", local: [
        { subj: "AUTO", num: "50", t: "Brakes", colleges: ["Rio Hondo College"], u: 3 }] }] },
    // Automotive (TOP 0948): peers only → ⊕ pool for Rio Hondo (2 colleges)
    { ut: "ASE Engine", cpl_types: ["Industry Certification"],
      articulations: [{ top: "0948.00", disc: "Automotive Technology", local: [
        { subj: "AUTO", num: "60", t: "Engine", colleges: ["Long Beach City College"], u: 3 },
        { subj: "AT", num: "60", t: "Engine Perf", colleges: ["Cerritos College"], u: 3 }] }] },
    // Automotive (TOP 0948): Rio Hondo AND a peer have it → NOT in Rio Hondo's pool
    { ut: "ASE Electrical", cpl_types: ["Industry Certification"],
      articulations: [{ top: "0948.00", disc: "Automotive Technology", local: [
        { subj: "AUTO", num: "70", t: "Electrical", colleges: ["Rio Hondo College"], u: 3 },
        { subj: "AT", num: "70", t: "Electrical", colleges: ["Cerritos College"], u: 3 }] }] },
    { ut: "CLEP Bio", cpl_types: ["Standardized Assessment"],
      ge_credit: { program: "CLEP", exam: "Biology", areas: ["Natural Sciences"], units: 6, na: false },
      articulations: [] },
  ],
};
const BACC_STUB = [
  { id: "1210-foothill-resp", college: "Foothill College", cer_college: "Foothill College",
    coci_college: "FOOTHILL", program: "Respiratory Care", degree: "Bachelor of Science",
    degree_abbr: "B.S.", top: "1210.00", top4: "1210", field: "Respiratory Care/Therapy",
    units: 68, status: "Active" },
  { id: "1210-crafton-resp", college: "Crafton Hills", cer_college: null,
    coci_college: "CRAFTON HILLS", program: "Respiratory Care", degree: "Bachelor of Science",
    degree_abbr: "B.S.", top: "1210.00", top4: "1210", field: "Respiratory Care/Therapy",
    units: 40, status: "Active" },
  { id: "0948-rio-auto", college: "Rio Hondo College", cer_college: "Rio Hondo College",
    coci_college: "RIO HONDO", program: "Automotive Technology", degree: "Bachelor of Science",
    degree_abbr: "B.S.", top: "0948.00", top4: "0948", field: "Automotive Technology",
    units: 45, status: "Active" },
];

// (k) buildDirectoryIndex
{
  const w = freshWindow();
  const dir = w.CPL_PATHWAYS_TAB._buildDirectoryIndex(DIR_CER);
  check("directory index built", !!dir && !!dir.byTop4 && !!dir.byCollegeTop4);
  check("byCollegeTop4 buckets a college's in-field CPL",
    !!dir.byCollegeTop4["FOOTHILL COLLEGE"] && !!dir.byCollegeTop4["FOOTHILL COLLEGE"]["1210"]);
  check("byTop4 groups every college's CPL in a field",
    !!dir.byTop4["1210"] && !!dir.byTop4["1210"]["RCP License"] && !!dir.byTop4["1210"]["NBRC CRT"]);
  check("byTop4 credential carries per-college lines",
    Object.keys(dir.byTop4["0948"]["ASE Engine"].colleges).length === 2);
  check("byCollegeCount counts distinct credentials (all fields)",
    Object.keys(dir.byCollegeCount["RIO HONDO COLLEGE"]).length === 2);
  check("directory clepByArea populated", (dir.clepByArea["Natural Sciences"] || []).length === 1);
}

// (l) resolveDirectory — mine / pool / cohort / counts
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const dir = T._buildDirectoryIndex(DIR_CER);
  const foot = T._resolveDirectory(BACC_STUB[0], dir, BACC_STUB);
  check("mine = the college's in-field CPL", foot.mineCreds === 1 && foot.mineCourses === 1 && foot.mine[0].creds[0] === "RCP License");
  check("mineUnits sums the in-field CPL course units", foot.mineUnits === 24);
  check("potentialUnits = current + fullest adoptable precedent (24+3)", foot.potentialUnits === 27);
  check("pool = peer CPL not yet at this college", foot.poolCreds === 1 && foot.pool[0].credential === "NBRC CRT");
  check("pool excludes the home college", foot.pool[0].lines.every(l => !/Foothill/.test(l.college)));
  check("cohort = same-field baccalaureates", foot.cohort.length === 2);
  check("clepExams surfaced", foot.clepExams === 1);

  const rio = T._resolveDirectory(BACC_STUB[2], dir, BACC_STUB);
  check("Rio Hondo owns two in-field credentials", rio.mineCreds === 2);
  check("mineUnits sums across both (3+3=6u)", rio.mineUnits === 6);
  check("potentialUnits adds the fullest adoptable precedent (6+3)", rio.potentialUnits === 9);
  check("a credential the college ALREADY has is not an adoption gap",
    rio.pool.length === 1 && rio.pool[0].credential === "ASE Engine" &&
    !rio.pool.some(p => p.credential === "ASE Electrical"));
  check("pool credential counts its peer colleges", rio.pool[0].colleges === 2);

  const crafton = T._resolveDirectory(BACC_STUB[1], dir, BACC_STUB);
  check("frontier college (no CER match) → no own CPL", crafton.mineCreds === 0 && crafton.totalAtCollege === 0);
  check("frontier college still sees the whole field pool", crafton.poolCreds === 2);

  // a course articulated to MULTIPLE credentials counts once (units not doubled)
  const DUP_CER = { _generated_at: "2026-07-14T00:00:00+00:00", unified_titles: [
    { ut: "FAA Airframe", cpl_types: ["Industry Certification"], articulations: [{ top: "0950.00", disc: "Aviation", local: [
      { subj: "AVIA", num: "1", t: "Maintenance Procedures", colleges: ["West Los Angeles College"], u: 4 }] }] },
    { ut: "FAA Powerplant", cpl_types: ["Industry Certification"], articulations: [{ top: "0950.00", disc: "Aviation", local: [
      { subj: "AVIA", num: "1", t: "Maintenance Procedures", colleges: ["West Los Angeles College"], u: 4 }] }] },
  ] };
  const dupDir = T._buildDirectoryIndex(DUP_CER);
  const dupProg = { id: "0950-wla", college: "West Los Angeles College", cer_college: "West Los Angeles College",
    coci_college: "WEST L.A.", program: "Aviation", degree: "Bachelor of Science", degree_abbr: "B.S.",
    top: "0950.00", top4: "0950", field: "Aeronautical", units: 31, status: "Active" };
  const dup = T._resolveDirectory(dupProg, dupDir, [dupProg]);
  check("one course, two credentials → 1 course / 2 creds / units counted once",
    dup.mineCourses === 1 && dup.mineCreds === 2 && dup.mineUnits === 4);

  // null directory (CER unavailable) resolves to empty, no throw
  const none = T._resolveDirectory(BACC_STUB[0], null, BACC_STUB);
  check("null directory → empty landscape, cohort still computes", none.mineCreds === 0 && none.poolCreds === 0 && none.cohort.length === 2);
}

// (m) full render — dropdown + directory card switching
{
  const w = freshWindow();
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_BACCALAUREATES = { _as_of: "2026-06-17", programs: BACC_STUB };
  w.CPL_TABS = { loadScript: function (s, g, cb) { w.CPL_CREDENTIAL_REFERENCE = DIR_CER; cb(); } };
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  const sel = root.querySelector("select.cplpw-select");
  check("dropdown selector renders (featured + directory > 1 item)", !!sel);
  check("dropdown has a Featured optgroup + field optgroups",
    !!sel && sel.querySelectorAll("optgroup").length >= 2 &&
    /Featured/.test(sel.querySelectorAll("optgroup")[0].label));
  check("dropdown lists every baccalaureate + featured", sel.querySelectorAll("option").length === 1 + BACC_STUB.length);
  check("directory option shows current/potential CPL units", (function () {
    var o = Array.from(sel.options).find(x => /Foothill College — Respiratory Care/.test(x.textContent));
    return !!o && /24\/27u/.test(o.textContent);
  })());
  check("default view is the featured deep map", /Field Ironworker Supervisor/.test(root.textContent) && !!root.querySelector(".cplpw-stagebanner"));
  // switch to the Foothill Respiratory directory card (item index 1)
  sel.value = "1";
  sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  const text = root.textContent;
  check("directory card renders on select", !!root.querySelector(".cplpw-dirtag") && /Respiratory Care — Bachelor of Science/.test(text));
  check("directory card shows the ✓ in-field CPL", /RCP License/.test(text) && root.querySelectorAll(".cplpw-course.done").length >= 1);
  check("directory card shows the ⊕ adoption pool", /NBRC CRT/.test(text) && !!root.querySelector("button.how.adopt"));
  check("directory card shows the field cohort", !!root.querySelector(".cplpw-cohort") && /Crafton Hills/.test(text));
  // the adoption panel carries Quick Adopt
  const adoptBtn = root.querySelector("button.how.adopt");
  adoptBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("adoption panel expands with peer lines + Quick Adopt",
    /El Camino College: RESP 12/.test(root.textContent) && !!root.querySelector(".cplpw-adoptopts .cplpw-qa"));
  // switch to the frontier college (Crafton, index 2) → frontier banner
  sel.value = "2";
  sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("frontier college shows the whole-field pool (no own CPL)",
    root.querySelectorAll(".cplpw-course.done").length === 0 && /NBRC CRT/.test(root.textContent));
}

// (m2) committed directory data file parses + joins to the CER schema
{
  const dsrc = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
  const dom = new JSDOM("<body></body>", { runScripts: "outside-only" });
  dom.window.eval(dsrc);
  const b = dom.window.CPL_BACCALAUREATES;
  check("cpl_baccalaureates_data.js defines window.CPL_BACCALAUREATES", !!b && Array.isArray(b.programs));
  check("directory carries many baccalaureates", !!b && b.programs.length >= 30);
  check("every program has the join keys (top4 + degree + status)",
    !!b && b.programs.every(p => p.top4 && p.degree && p.status && p.program));
  check("directory boot present in BOTH HTMLs", /loadScript\('cpl_baccalaureates_data\.js', 'CPL_BACCALAUREATES'/.test(cpl) && /loadScript\('cpl_baccalaureates_data\.js', 'CPL_BACCALAUREATES'/.test(idx));
}

// (m3) large adoption pool caps to DIR_POOL_CAP with a Show-all toggle
{
  const w = freshWindow();
  const big = { _generated_at: "2026-07-14T00:00:00+00:00", unified_titles: [] };
  for (let i = 0; i < 25; i++) big.unified_titles.push({ ut: "Cred " + i, cpl_types: ["Industry Certification"],
    articulations: [{ top: "0948.00", disc: "Automotive Technology", local: [
      { subj: "AUTO", num: String(i), t: "c" + i, colleges: ["Peer College " + i], u: 3 }] }] });
  const bacc = [{ id: "0948-home-auto", college: "Home College", cer_college: "Home College", coci_college: "HOME",
    program: "Automotive Technology", degree: "Bachelor of Science", degree_abbr: "B.S.",
    top: "0948.00", top4: "0948", field: "Automotive Technology", units: 60, status: "Active" }];
  w.CPL_PATHWAYS = { programs: [PROGRAM_STUB] };
  w.CPL_BACCALAUREATES = { _as_of: "2026-06-17", programs: bacc };
  w.CPL_TABS = { loadScript: function (s, g, cb) { w.CPL_CREDENTIAL_REFERENCE = big; cb(); } };
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  const sel = root.querySelector("select.cplpw-select");
  sel.value = "1"; sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  const showAll = Array.from(root.querySelectorAll("button")).find(b => /Show all 25/.test(b.textContent));
  check("large pool gets a Show-all toggle", !!showAll);
  const moreWrap = showAll ? showAll.nextSibling : null;
  check("overflow hidden initially", !!moreWrap && moreWrap.style.display === "none");
  if (showAll) showAll.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("Show-all reveals the overflow", !!moreWrap && moreWrap.style.display !== "none" && /Show fewer/.test(showAll.textContent));
  check("all 25 adoption rows present in the DOM", root.querySelectorAll("button.how.adopt").length === 25);
}

// ── Report (deferred one macrotask so the async intake checks land first) ──
setTimeout(() => {
  let fail = 0;
  results.forEach(([name, ok]) => { if (!ok) fail++; console.log((ok ? "  ✓ " : "  ✗ ") + name); });
  console.log(`cpl_pathways: ${results.length - fail}/${results.length} passed`);
  if (fail) process.exit(1);
}, 0);
