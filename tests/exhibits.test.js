// The Exhibits tab (exhibits.js) — the Review queue, built first (Sam, Open Asks Sheet 147 card 1, 2026-10-31).
//   - Rule 4 (both HTMLs identical) + the nav button / pane / mount / lazy boot, the nav group, both
//     workflows' build step and commit line, CI's builder test, the Commons row's link.
//   - The card (mock-up version 26): the canonical title is the focus and editable; the local titles sit
//     under it; the CER step chip carries its plain hover; the step tiles filter; the finder goes to any
//     held exhibit; a could-adopt chip opens the college's aligned courses and Request Quick Adopt.
//   - The writes are the CER's own kb_curation rows (_UNCLASSIFIED::<local title>); a conflict's Change
//     to Proposed Title clears the saved assignment; re-keying a person-reviewed entry never leaves the page.
//   - Students: a reviewer-only read, sorted most first, a suppressed cell reads "Too few students to
//     show"; signed out, the page holds no count at all.
//   - Tokens only in the injected CSS; no glyphs in the rendered text; American spelling.
//   - Credentials (the credential panel, Sheet 147 step 2): every credential, most students first, a search,
//     and a panel whose issuer and training sites (many, each with the college it trains for) save as
//     _CREDENTIAL_REVIEW:: rows: training_sites_override as JSON and training_agency_override as the sites
//     joined. The live rows win over the daily file; a later one-trainer edit wins over the list.
//   - Exhibit Adoption folded into the panel (Sheet 147 step 3, kb/exhibits_adoption.json): a college chip opens
//     what it articulated (lines, units, its own exhibit) or the course it already teaches; Could adopt is the
//     M-ID prescriptive layer, never the TOP or C-ID overlap (Sam, 2026-09-24; Rule 7), on the panel and on the
//     Review card alike; the What credit does it carry? and Who could adopt it? tiles; Request Quick Adopt from
//     map_links.js.
//
// Run from repo root: `npm test` (or `node tests/exhibits.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ───────────────────────────── Part A — static invariants ─────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav has the Exhibits button beside The Commons", /data-tab="commons">The Commons<\/button>\s*<button class="cpl-tab" data-tab="exhibits">Exhibits</.test(cpl));
check("pane #tab-exhibits and mount #exhibits-root exist", /id="tab-exhibits" data-tab="exhibits"/.test(cpl) && /id="exhibits-root"/.test(cpl));
check("boot wiring: onActivate('exhibits') loads exhibits.js", /onActivate\('exhibits'[\s\S]{0,300}loadScript\('exhibits\.js', 'CPL_EXHIBITS'/.test(cpl));
const groupsSrc = fs.readFileSync("nav_groups.js", "utf8");
check("nav_groups.js lists 'exhibits' after the Commons", /'commons', 'exhibits'/.test(groupsSrc));
const daily = fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8");
const proc = fs.readFileSync(".github/workflows/cer-procedures.yml", "utf8");
check("the daily run builds and commits the review files", /python3 kb\/_build_exhibits_review\.py/.test(daily)
  && /git add kb\/exhibits_review\.json kb\/exhibits_review_courses\.json kb\/exhibits_adoption\.json/.test(daily));
check("the daily build runs after the suggestions it reads", daily.indexOf("_suggest_unclassified.py") < daily.indexOf("_build_exhibits_review.py"));
check("the nightly procedures run rebuilds and commits them", /python3 kb\/_build_exhibits_review\.py/.test(proc)
  && /git add kb\/exhibits_review\.json kb\/exhibits_review_courses\.json kb\/exhibits_adoption\.json/.test(proc)
  && proc.indexOf("_cer_procedures.py --classify") < proc.indexOf("_build_exhibits_review.py"));
check("CI runs the builder's test", /python3 tests\/exhibits_review_build_test\.py/.test(fs.readFileSync(".github/workflows/js-tests.yml", "utf8")));
check("the Commons row links Open Exhibits", /"href": tab, "text": "Open Exhibits"/.test(fs.readFileSync("kb/_build_commons_status.py", "utf8")));
check("the Commons row's tab is Exhibits (Sheet 148, link-retire)", /tab = "#exhibits"/.test(fs.readFileSync("kb/_build_commons_status.py", "utf8"))
  && /\("exhibit", "Common Exhibit Reference", "#exhibits", row_exhibit\)/.test(fs.readFileSync("kb/_build_commons_status.py", "utf8")));
check("the students function is migrated, reviewer-gated and closed to anon",
  (function () {
    const sql = fs.readFileSync("kb/migrations/2026-10-31_exhibit_title_students.sql", "utf8");
    return /is_allowed_reviewer\(\)/.test(sql) && /revoke all on function public\.exhibit_title_students\(text\[\], text\[\]\) from public, anon, authenticated/.test(sql)
      && /c\.n >= 10/.test(sql) && /c\.n between 1 and 9/.test(sql);
  })());
check("the governance map names the read and the tab", (function () {
  const g = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
  return g.mapped["tab:exhibits"] === "DR-07" && /k|ten|1 to 9/.test(g.dismissed["rpc:exhibit_title_students"] || "");
})());

const src = fs.readFileSync("exhibits.js", "utf8");
check("exhibits.js carries no service key", src.indexOf("service_role") === -1);
check("exhibits.js writes the CER's own namespace and fields",
  /"_UNCLASSIFIED::"/.test(src) && /"unified_title_assignment"/.test(src) && /"issuing_agency_assignment"/.test(src));
check("exhibits.js writes the credential panel's fields under the CER's credential namespace",
  /"_CREDENTIAL_REVIEW::"/.test(src) && /"issuing_agency_override"/.test(src) && /"training_sites_override"/.test(src) && /"training_agency_override"/.test(src));
check("the governance map names the training sites field", (function () {
  const g = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
  return g.mapped["field:kb_curation.training_sites_override"] === "DR-07";
})());
check("the overlay sync reads the field and resolves it", /"training_sites_override"/.test(fs.readFileSync("kb/_apply_credential_review.py", "utf8"))
  && /def resolve_sites/.test(fs.readFileSync("kb/_apply_credential_review.py", "utf8")));
check("CI runs the sites test", /python3 tests\/credential_review_sites_test\.py/.test(fs.readFileSync(".github/workflows/js-tests.yml", "utf8")));
const cssStart = src.indexOf("var CSS = [");
const cssBlock = src.slice(cssStart, src.indexOf("].join(", cssStart));
check("the injected CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(cssBlock));
check("the injected CSS uses First Light tokens", /var\(--cobalt\)/.test(cssBlock) && /var\(--seal-blue-text\)/.test(cssBlock) && /var\(--surface\)/.test(cssBlock));
check("the word controls are 24px tall, underlined, with no fill", /button\.exh-w \{ all:unset;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(cssBlock));
check("a focus ring is drawn", /:focus-visible[^{]*\{ outline:2px solid var\(--seal-blue\)/.test(cssBlock));
check("single column below 560px", /@media \(max-width: 560px\) \{ \.exh-ccrow \{ grid-template-columns:minmax\(0, 1fr\)/.test(cssBlock));
check("reduced motion is honored", /prefers-reduced-motion: reduce/.test(cssBlock));
check("American spelling in the source", !/\b(colour|behaviour|organisation|analyse|centre|cancelled|catalogue|whilst|amongst)\b/i.test(src));

// ───────────────────────────── Part B — the renderer in jsdom ─────────────────────────────
const COLLEGES = ["Cabrillo College", "Cañada College", "Chabot College", "Copper Mountain College", "Cypress College",
  "Los Angeles Pierce College", "Modesto Junior College", "Norco College"];
const C = function (n) { return COLLEGES.indexOf(n); };
const DM = "Introduction to Digital Media High School Articulation";
const AP = "AP Computer Science A - Score of 3 or higher";
const JUV = "ADJU 232 - Juvenile Justice Procedures - Credit by Exam";
const WELD = "Welding 1 for";
const REVIEW = {
  schema: 1, written_at: "2026-10-31T08:00:00Z", sources: { procedures_run: "2026-10-31T07:47:00Z" },
  tiles: { names: { n: 5030, of: 5480, waiting: 450 }, aligned: { n: 209, of: 468 }, saved_not_folded: 0, settled_since_run: 0 },
  steps: { "Proposed": 1, "Wording check": 2, "Two issuers": 0, "Conflict with the reference": 1 },
  colleges: COLLEGES,
  held: [
    { raw: JUV, step: "Conflict with the reference", why: "the fold held the saved assignment", colleges: [],
      title: "Juvenile Law and Procedures", issuer: "", from: "the reference, reviewed by a person", saved: "Juvenile Justice Procedures",
      ids: ["MAPCXS-A2-J-1-001", "MAPCxS-JLAP-1-001"], art: [C("Copper Mountain College"), C("Modesto Junior College"), C("Norco College")],
      could: [C("Chabot College")], basis: "", same: false, trainers: ["Regional Academy"], exists: true },
    { raw: DM, step: "Proposed", why: "the classifier is unsure (0.80)", colleges: [C("Cabrillo College")],
      title: "Introduction to Digital Art", issuer: "Local High School", from: "C-ID ARTS 250", ids: ["MAPCXH-ITDM-1-001"],
      art: [C("Cabrillo College")], could: [C("Cañada College"), C("Cypress College")], basis: "C-ID ARTS 250", same: true,
      aligned_id: "ARTS 250", course: "DM 1", alternates: ["Digital Media Basics"], confidence: 0.8,
      under: ["ART 10 Digital Art", "DM 2 Intro Digital Art"], under_count: 2, exists: true },
    { raw: AP, step: "Wording check", why: "the classifier's title has a method word left in", colleges: [C("Los Angeles Pierce College")],
      title: "AP Computer Science A", issuer: "College Board", from: "the classifier", ids: ["MAPSAS-ACSA20-1-001"],
      art: [C("Los Angeles Pierce College")], could: [C("Norco College")], basis: "", same: false, courses_key: "teaches:AP Computer Science A" },
    { raw: WELD, step: "Wording check", why: "the classifier's title has a dangling word", colleges: [C("Norco College")],
      title: "Welding 1 for", issuer: "", from: "the classifier", ids: ["MAPCXI-WELD-1-001"],
      art: [C("Norco College")], could: [], basis: "", same: false }
  ]
};
const COURSES = { schema: 1, colleges: COLLEGES, courses: { "ARTS 250": {
  [String(C("Cabrillo College"))]: [["DM 1", "Intro to Digital Media", 3]],
  [String(C("Cypress College"))]: [["ART 20", "Digital Art I", 3], ["ART 20N", "Digital Art I", 0]] },
  "teaches:AP Computer Science A": { [String(C("Norco College"))]: [["CIS 5", "", 4]] } } };
const AC = ["Bakersfield College", "Cabrillo College", "Cañada College", "Chabot College", "De Anza College", "Norco College"];
const A = function (n) { return String(AC.indexOf(n)); };
const ADOPTION = { schema: 1, written_at: "2026-10-31T08:00:00Z", cip_sectors: { "11": "Computer and Information Sciences", "46": "Construction Trades" },
  colleges: AC, credentials: {
    "CompTIA Security+": { a: { [A("Cabrillo College")]: [3, [["CIS 75", "3 hours in Introduction Information Systems Security"]]],
      [A("Chabot College")]: [2, [["CNT 69", "2 hours in Network Security"]]] },
      c: { [A("Cañada College")]: [["CIS 60", "", 3]], [A("Cabrillo College")]: [["CIS 75", "", 3]], [A("De Anza College")]: [["CIS 108", "", 4.5]] },
      w: 4, s: "11", p: 3,
      x: [["MAPCBEN-SF(-1-001", "Security Fund. (Security+)", 3], ["MAPCXI-CS-1-001", "CompTIA Security+", 3], ["MAPCXN-SCP1-1-001", "Security+ Prep", 2], ["MAPCxS-CSS/-1-001", "CS 004", 3]] },
    "IBEW Electrician Apprenticeship — Year 1": { a: { [A("Norco College")]: [3.5, [["ELC 401", "3.5 hours in Introduction to Electrical Theory"]]], [A("Bakersfield College")]: [0, []] },
      s: "46", p: 3.5, x: [["MAPAPP-IBEW-1-001", "IBEW Year 1", 3.5]] }
  } };
const LINKS = { by_title: { "IBEW Electrician Apprenticeship — Year 1": ["MAPAPP-IBEW-1-001"], "CompTIA Security+": ["MAPCXI-CS-1-001", "NOT-VERIFIED"] },
  found: { "MAPAPP-IBEW-1-001": { college: "Norco College" }, "MAPCXI-CS-1-001": { college: "Cabrillo College" } } };
const IBEW = "IBEW Electrician Apprenticeship — Year 1";
const SECP = "CompTIA Security+";
const MED = "Medical Core";
const JLP = "Juvenile Law and Procedures";
const CREDREF = { _generated_at: "2026-10-31T06:20:00+00:00", unified_titles: [
  { ut: IBEW, issuer: "International Brotherhood of Electrical Workers (IBEW)", trainer: "Joint Apprenticeship Training Committee (JATC)",
    students_served: null, served_suppressed: false, raw_variants: [{ r: "IBEW Electrician Apprenticeship (Year 1)" }, { r: "International Brotherhood of Electrical Workers Year 1" }],
    articulations: [{ cid: "ELEC M1001", sys: "M-ID", title: "Electrical Theory", local: [{ colleges: ["Norco College", "Bakersfield College"] }] }],
    potential_colleges: ["Chabot College"], cpl_types: ["Portfolio Review"], gen_rec: "3.5 hours in Electrical Theory", ccc_rec: "", disc_modal: "Electricity" },
  { ut: JLP, issuer: "California Community Colleges", trainer: "Regional Academy", students_served: null, served_suppressed: false,
    raw_variants: [{ r: "ADJU 232 Juvenile Procedures" }],
    articulations: [{ cid: "AJ 220", sys: "C-ID", title: "Juvenile Procedures", local: [{ colleges: ["Norco College", "Modesto Junior College", "Copper Mountain College"] }] }],
    potential_colleges: [], cpl_types: ["Credit by Exam"], gen_rec: "", ccc_rec: "3 units, AJ 220", disc_modal: "Administration of Justice" },
  { ut: MED, issuer: "Canyon High School", issuers: ["Canyon High School", "El Modena High School"], trainer: "Canyon High School",
    trainers: [{ site: "Canyon High School" }, { site: "El Modena High School" }], students_served: null, served_suppressed: true,
    raw_variants: [{ r: "Medical Core HS" }], articulations: [], potential_colleges: [], cpl_types: [], gen_rec: "", ccc_rec: "", disc_modal: "" },
  { ut: SECP, issuer: "CompTIA", trainer: null, students_served: 57, served_suppressed: false,
    raw_variants: [{ r: "CompTIA Security+ Certification" }, { r: "Security Fund. (Security+)" }, { r: "CompTIA S+ for CIS 060" }, { r: "Sec Plus" }],
    articulations: [{ cid: "ITIS 160", sys: "C-ID", title: "Network Security", local: [{ colleges: ["Cabrillo College"] }] }],
    potential_colleges: COLLEGES.concat(["De Anza College", "Fullerton College", "Long Beach City College"]), cpl_types: ["Industry Certification"],
    gen_rec: "3 units in Network Security", ccc_rec: "", disc_modal: "Computer Information Systems" }
] };
const OVERLAY = [
  { course_id: "_CREDENTIAL_REVIEW::" + JLP, field: "training_sites_override", reviewed_at: "2026-10-31T01:00:00.100+00:00",
    value: JSON.stringify([{ site: "Regional Academy North", college: "Norco College" }, { site: "Valley Academy" }]) },
  { course_id: "_CREDENTIAL_REVIEW::" + JLP, field: "training_agency_override", reviewed_at: "2026-10-31T01:00:00.300+00:00",
    value: "Regional Academy North; Valley Academy" },
  { course_id: "_CREDENTIAL_REVIEW::" + MED, field: "training_sites_override", reviewed_at: "2026-10-01T00:00:00+00:00",
    value: JSON.stringify([{ site: "Canyon High School" }, { site: "El Modena High School" }]) },
  { course_id: "_CREDENTIAL_REVIEW::" + MED, field: "training_agency_override", reviewed_at: "2026-10-20T00:00:00+00:00", value: "Orange High School" },
  { course_id: "_CREDENTIAL_REVIEW::" + SECP, field: "issuing_agency_override", reviewed_at: "2026-10-20T00:00:00+00:00", value: "CompTIA (Computing Technology Industry Association)" }
];
const STUDENTS = { "0": [null, true], "1": [442, false], "2": [398, false], "3": [0, false] };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root" style="border:1px dashed;padding:28px;">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null, headers: init.headers || {} });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(status) { return Promise.resolve({ ok: false, status: status, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return opts.noData ? bad(404) : ok(REVIEW);
    if (url === "kb/exhibits_review_courses.json") return ok(COURSES);
    if (url === "kb/exhibits_adoption.json") return opts.noAdoption ? bad(404) : ok(ADOPTION);
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) {
      if (opts.notReviewer) return ok([]);
      const body = JSON.parse(init.body);
      const keys = Array.from(new Set(body.p_keys));
      return ok(keys.map(function (k) {
        if (k === "*") return { key: "*", students: 840, suppressed: false };
        const s = STUDENTS[k] || [0, false];
        return { key: k, students: s[0], suppressed: s[1] };
      }));
    }
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") {
      return opts.overlayFails ? bad(503) : ok(opts.overlay || []);
    }
    if (/\/rest\/v1\/kb_curation/.test(url)) return opts.saveFails ? bad(500) : Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return bad(404);
  };
  const sess = opts.signedIn ? { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" } : null;
  w.CPL_SESSION = {
    ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; }
  };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, "").replace("Los Angeles ", "LA "); };
  // map_links.js's surface: the verified index, the one address, and the line of chips per building college.
  w.CPL_MAP_LINKS = {
    load: function () { calls.push({ url: "maplinks:load", method: "GET" }); return Promise.resolve(JSON.parse(JSON.stringify(LINKS))); },
    url: function (id) { return "https://map.example/opp?Exhibit=" + encodeURIComponent(id) + "&View=Non-Military"; },
    node: function (title) { const sp = w.document.createElement("span"); sp.className = "cpl-maplinks"; sp.setAttribute("data-ml-title", title);
      sp.textContent = "Request Quick Adopt in MAP, from the exhibit each college built"; return sp; }
  };
  w.CPL_TABS = { loadScript: function (src, name, cb) {
    calls.push({ url: "loadScript:" + src, method: "SCRIPT" });
    if (src === "credential_reference_data.js" && !opts.noCreds) w[name] = JSON.parse(JSON.stringify(CREDREF));
    setTimeout(cb, 0);
  } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, root: w.document.getElementById("exhibits-root"), calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 6; i++) await tick(); }
function byText(d, sel, t) { return Array.from(d.querySelectorAll(sel)).find(function (b) { return txt(b) === t; }); }
function viewBtn(d, name) { return Array.from(d.querySelectorAll(".exh-views button")).find(function (b) { return txt(b).indexOf(name) === 0; }); }
function stepTile(d, label) { return Array.from(d.querySelectorAll(".exh-step")).find(function (b) { return txt(b.querySelector(".exh-sl")) === label; }); }
function title(d) { return d.getElementById("exh-title"); }
function current(d) { const li = d.querySelector(".exh-now"); return li ? txt(li.children[1]) : ""; }

(async function () {
  // ── signed out ──
  let t = load();
  check("exhibits.js evaluates and registers CPL_EXHIBITS", t.M && typeof t.M.boot === "function");
  await t.M.boot(); await settle();
  check("the mount's placeholder style is dropped", !t.root.getAttribute("style"));
  check("the heading is Exhibits", txt(t.d.querySelector(".exh-h")) === "Exhibits");
  check("the status group asks What is it called?", txt(t.d.querySelector(".exh-q")) === "What is it called?");
  const tiles = Array.from(t.d.querySelectorAll(".exh-tile")).map(txt);
  check("the Names tile reads 5,030 of 5,480 with its meter", /Names5,030 of 5,480/.test(tiles[0]) && t.d.querySelector('.exh-bar[aria-label="91.8 percent"]'));
  check("the Aligned course tile reads 209 of 468", /209 of 468/.test(tiles[1]));
  check("signed out, the Students tile says reviewers only and asks for a sign-in", /Reviewers only/.test(tiles[2]) && /Sign in as a reviewer to see them/.test(tiles[2]));
  check("the stamps read as a date and a time", /Procedures run 2026-10-31 07:47Z · queue built 2026-10-31 08:00Z/.test(txt(t.d.querySelector(".exh-titlebar"))));
  check("signed out, no students request is sent", !t.calls.some(function (c) { return /exhibit_title_students/.test(c.url); }));
  check("signed out, no student count is on the page", !/\b(442|398|840)\b/.test(txt(t.root)));
  check("All held is pressed with the whole queue's count", stepTile(t.d, "All held").getAttribute("aria-pressed") === "true" && txt(stepTile(t.d, "All held").querySelector(".exh-sn")) === "4");
  check("each step tile carries its plain hover", /keep, change or edit it/.test(stepTile(t.d, "Proposed").getAttribute("data-tip"))
    && /Proposed, 1\./.test(stepTile(t.d, "Proposed").getAttribute("aria-label")));
  check("Saved, not folded shows and cannot filter", stepTile(t.d, "Saved, not folded").disabled === true);
  check("without students the builder's order stands", current(t.d) === JUV);
  check("the footer says most colleges first", /1 of 4 · most colleges first/.test(txt(t.d.querySelector(".exh-foot"))));
  check("the CER step chip names the step, with its hover", /CER step: Conflict with the reference/.test(txt(t.d.querySelector(".exh-chip")))
    && /never overwrites a person's decision/.test(t.d.querySelector(".exh-chip").getAttribute("data-tip")));
  check("an older file's broad could-adopt list never shows (Rule 7; Sam, 2026-09-24)", /Could adopt \(0\)/.test(txt(t.d.querySelector(".exh-colleges")))
    && !Array.from(t.d.querySelectorAll(".exh-colleges .exh-cchip")).some(function (b) { return txt(b) === "Chabot"; }));
  check("the conflict shows the title saved earlier", /Saved earlier as “Juvenile Justice Procedures”/.test(txt(t.d.querySelector(".exh-card"))));
  check("the training site reads from the reference and is not an input", /Training site:Regional Academy/.test(txt(t.d.querySelector(".exh-read"))) && !t.d.querySelector(".exh-read input"));
  check("signed out, the students line asks for a sign-in", /Sign in as a reviewer to see students/.test(txt(t.d.querySelector(".exh-why"))));
  check("the source links each exhibit in MAP on its Non-Military card",
    Array.from(t.d.querySelectorAll(".exh-card a")).filter(function (a) { return /View=Non-Military$/.test(a.href) && /Exhibit=MAPCXS-A2-J-1-001/.test(a.href); }).length === 1);

  // saving signed out
  byText(t.d, ".exh-acts button", "Skip").click(); await settle();
  check("Skip moves to the next title", current(t.d) === DM);
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  check("signed out, a save asks for a sign-in and writes nothing", /Sign in as a reviewer to save/.test(txt(t.d.querySelector(".exh-status")))
    && !t.calls.some(function (c) { return /kb_curation/.test(c.url); }));

  // the card
  check("the canonical title is the aligned course's, from its identity", title(t.d).value === "Introduction to Digital Art"
    && /Canonical title, from C-ID ARTS 250 \(edit it here\)/.test(txt(t.d.querySelector('label[for="exh-title"]'))));
  check("the issuer box carries the classifier's issuer", t.d.getElementById("exh-issuer").value === "Local High School");
  check("an existing credential says the title joins it", /Joins the credential already in the reference/.test(txt(t.d.querySelector(".exh-canon"))));
  check("the classifier's own title sits beside it with Use it", /Also proposed: Digital Media Basics/.test(txt(t.d.querySelector(".exh-canon"))));
  check("the local title being decided is highlighted, with its course", /Deciding now, Cabrillo: Introduction to Digital Media High School Articulation · articulated to DM 1/.test(txt(t.d.querySelector(".exh-now"))));
  check("the other local titles fold to and 2 more", byText(t.d, ".exh-under button", "and 2 more"));
  title(t.d).value = "Introduction to Digital Art and Media";
  title(t.d).dispatchEvent(new t.w.Event("input"));
  byText(t.d, ".exh-under button", "and 2 more").click(); await settle();
  check("the other local titles open", /ART 10 Digital Art/.test(txt(t.d.querySelector(".exh-under"))));
  check("an edited title survives a re-render", title(t.d).value === "Introduction to Digital Art and Media");
  check("an edited title drops the joins-the-credential note", t.d.querySelector(".exh-canon p").hidden === true);
  check("Could adopt names the same course and counts the colleges", /Could adopt \(2\), same course as C-ID ARTS 250/.test(txt(t.d.querySelector(".exh-colleges"))));
  const cyp = Array.from(t.d.querySelectorAll("button.exh-cchip")).find(function (b) { return txt(b) === "Cypress"; });
  check("a could-adopt chip is a button tied to the panel", cyp && cyp.getAttribute("aria-controls") === "exh-adopt" && cyp.getAttribute("aria-expanded") === "false");
  cyp.click(); await settle();
  const panel = t.d.getElementById("exh-adopt");
  check("the chip opens the college's aligned courses", !panel.hidden && /Courses aligned to C-ID ARTS 250 at this college/.test(txt(panel))
    && /ART 20 Digital Art I, 3 units/.test(txt(panel)) && /ART 20N Digital Art I, noncredit/.test(txt(panel)));
  check("the courses file loads on the first click only", t.calls.filter(function (c) { return c.url === "kb/exhibits_review_courses.json"; }).length === 1);
  check("the panel links Request Quick Adopt to the held exhibit", /Request Quick Adopt in MAP/.test(txt(panel))
    && panel.querySelector("a").href.indexOf("Exhibit=MAPCXH-ITDM-1-001&View=Non-Military") !== -1);
  check("the chip reads expanded", Array.from(t.d.querySelectorAll("button.exh-cchip")).find(function (b) { return txt(b) === "Cypress"; }).getAttribute("aria-expanded") === "true");
  check("the edit survived opening the chip too", title(t.d).value === "Introduction to Digital Art and Media");

  // filters and the finder
  stepTile(t.d, "Wording check").click(); await settle();
  check("a step tile filters the queue and presses", stepTile(t.d, "Wording check").getAttribute("aria-pressed") === "true"
    && current(t.d) === AP && /1 of 2 in Wording check/.test(txt(t.d.querySelector(".exh-foot"))));
  check("a filtered AP title offers the colleges that teach a course mapped to it", /Could adopt \(1\), teach a course mapped to it/.test(txt(t.d.querySelector(".exh-colleges"))));
  Array.from(t.d.querySelectorAll("button.exh-cchip")).find(function (b) { return txt(b) === "Norco"; }).click(); await settle();
  check("a teaching college's chip opens the course mapped to the proposed credential, with no empty title",
    /Courses at this college mapped to AP Computer Science A/.test(txt(t.d.getElementById("exh-adopt"))) && /CIS 5, 4 units/.test(txt(t.d.getElementById("exh-adopt")))
    && !/CIS 5 ,/.test(txt(t.d.getElementById("exh-adopt"))));
  const find = t.d.getElementById("exh-find");
  find.value = "weld"; find.dispatchEvent(new t.w.Event("input"));
  const hit = t.d.querySelector("#exh-results button");
  check("the finder lists a held exhibit by its title", hit && /Welding 1 for/.test(txt(hit)) && /Wording check/.test(txt(hit)));
  hit.click(); await settle();
  check("picking a result opens its card", current(t.d) === WELD);
  const find2 = t.d.getElementById("exh-find");
  find2.value = "zzz"; find2.dispatchEvent(new t.w.Event("input"));
  check("no match says so within the step", /No held exhibit in Wording check matches/.test(txt(t.d.getElementById("exh-results"))));
  check("an exhibit no college could adopt yet says None yet", /None yet/.test(txt(t.d.querySelector(".exh-colleges"))));
  byText(t.d, ".exh-acts button", "Teach a rule").click(); await settle();
  const ta = t.d.getElementById("exh-teach-words");
  check("Teach a rule opens a box for the rule in plain words", ta && byText(t.d, ".exh-teach button", "Copy for a session"));
  const msg = t.M._teachText(REVIEW.held[3], "Drop a trailing for.", "Welding 1", "");
  check("the message for a session names the rule, the example and the paste", /Add a CER procedure/.test(msg) && /Drop a trailing for\./.test(msg)
    && /“Welding 1 for” should read “Welding 1”/.test(msg) && /no investigation/.test(msg));

  // a new visit forgets the filter
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } })); await settle();
  check("a new visit starts on All held at the top", stepTile(t.d, "All held").getAttribute("aria-pressed") === "true" && current(t.d) === JUV);
  check("the CSS is injected once", t.d.querySelectorAll("#exh-css").length === 1);
  check("no emoji or pictograph in the rendered page", !/\p{Extended_Pictographic}/u.test(txt(t.root)));

  // ── signed in as a reviewer ──
  t = load({ signedIn: true });
  await t.M.boot(); await settle();
  const rpc = t.calls.find(function (c) { return /exhibit_title_students/.test(c.url); });
  check("the students function is asked once with each title's exhibits and the whole set",
    rpc && rpc.method === "POST" && rpc.body.p_keys.length === rpc.body.p_ids.length
    && rpc.body.p_keys.filter(function (k) { return k === "*"; }).length === 5 && rpc.body.p_ids.indexOf("MAPCxS-JLAP-1-001") !== -1);
  check("the request carries the reviewer's token", rpc.headers.Authorization === "Bearer " + "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc" && rpc.headers.apikey === "anon-key");
  check("most students first: 442 leads", current(t.d) === DM && /442 students have credit on this exhibit/.test(txt(t.d.querySelector(".exh-why"))));
  check("the Students waiting tile reads the whole set", /Students waiting840/.test(txt(Array.from(t.d.querySelectorAll(".exh-tile"))[2])));
  check("the footer says most students first", /most students first/.test(txt(t.d.querySelector(".exh-foot"))));
  byText(t.d, ".exh-acts button", "Skip").click(); await settle();
  byText(t.d, ".exh-acts button", "Skip").click(); await settle();
  check("a cell under ten reads Too few students to show, ahead of none", current(t.d) === JUV && /Too few students to show/.test(txt(t.d.querySelector(".exh-why"))));
  byText(t.d, ".exh-acts button", "Skip").click(); await settle();
  check("zero reads No students with credit yet", current(t.d) === WELD && /No students with credit yet/.test(txt(t.d.querySelector(".exh-why"))));

  // the conflict's buttons
  stepTile(t.d, "Conflict with the reference").click(); await settle();
  byText(t.d, ".exh-acts button", "Keep Current Title").click(); await settle();
  check("Keep Current Title on a conflict writes nothing and says a session re-keys it",
    !t.calls.some(function (c) { return /kb_curation/.test(c.url); }) && /Tell a session; it is a reviewed change/.test(txt(t.d.querySelector(".exh-status"))));
  title(t.d).value = "Something Else"; title(t.d).dispatchEvent(new t.w.Event("input"));
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  check("an edited title on a conflict writes nothing", !t.calls.some(function (c) { return /kb_curation/.test(c.url); }) && /re-key a person-reviewed entry/.test(txt(t.d.querySelector(".exh-status"))));
  title(t.d).value = "Juvenile Law and Procedures"; title(t.d).dispatchEvent(new t.w.Event("input"));
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  const del = t.calls.find(function (c) { return /kb_curation/.test(c.url); });
  check("the reference's title on a conflict clears the saved assignment", del && del.method === "DELETE"
    && del.url.indexOf("course_id=eq." + encodeURIComponent("_UNCLASSIFIED::" + JUV)) !== -1);
  check("the cleared title leaves the queue and says so", /the reference's title “Juvenile Law and Procedures” stands/.test(txt(t.d.querySelector(".exh-status")))
    && /Nothing waits in this step tonight/.test(txt(t.root)) && txt(stepTile(t.d, "All held").querySelector(".exh-sn")) === "3");

  // a save
  stepTile(t.d, "All held").click(); await settle();
  title(t.d).value = "Introduction to Digital Art"; title(t.d).dispatchEvent(new t.w.Event("input"));
  t.d.getElementById("exh-issuer").value = "Cabrillo High School"; t.d.getElementById("exh-issuer").dispatchEvent(new t.w.Event("input"));
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  const posts = t.calls.filter(function (c) { return /kb_curation$/.test(c.url) && c.method === "POST"; });
  check("Change to Proposed Title writes the CER's two rows", posts.length === 2
    && posts.every(function (p) { return p.body.course_id === "_UNCLASSIFIED::" + DM && p.body.reviewer_email === "reviewer@example.org"; })
    && posts.some(function (p) { return p.body.field === "unified_title_assignment" && p.body.value === "Introduction to Digital Art"; })
    && posts.some(function (p) { return p.body.field === "issuing_agency_assignment" && p.body.value === "Cabrillo High School"; }));
  check("the write merges on the row's key, as the CER's Save does", posts.every(function (p) { return /resolution=merge-duplicates/.test(p.headers.Prefer); }));
  check("the saved title leaves the queue and the next one opens", current(t.d) === AP && /Saved “Introduction to Digital Art”. The nightly run adds it/.test(txt(t.d.querySelector(".exh-status"))));
  byText(t.d, ".exh-acts button", "Keep Current Title").click(); await settle();
  const keep = t.calls.filter(function (c) { return /kb_curation$/.test(c.url) && c.method === "POST"; }).slice(2);
  check("Keep Current Title saves the local title as its own title", keep.some(function (p) { return p.body.field === "unified_title_assignment" && p.body.value === AP; }));

  // a save that fails
  t = load({ signedIn: true, saveFails: true });
  await t.M.boot(); await settle();
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  check("a failed save says nothing changed and keeps the title", /did not reach the reference \(HTTP 500\/500\)/.test(txt(t.d.querySelector(".exh-status"))) && current(t.d) === DM);

  // a sign-in that is not a reviewer's
  t = load({ signedIn: true, notReviewer: true });
  await t.M.boot(); await settle();
  check("a non-reviewer sign-in gets no counts and is told why", /Students show to a reviewer's sign-in/.test(txt(t.d.querySelector(".exh-why")))
    && /Your sign-in is not a reviewer's/.test(txt(Array.from(t.d.querySelectorAll(".exh-tile"))[2])));

  // the file could not be read
  t = load({ noData: true });
  await t.M.boot(); await settle();
  check("an unread review file says so", /The review file could not be read \(HTTP 404\)/.test(txt(t.root)));


  // ───────────────────────────── Part C — Credentials, the credential panel ─────────────────────────────
  t = load({ overlay: OVERLAY });
  await t.M.boot(); await settle();
  check("the views name Review and Credentials, Review current", txt(t.d.querySelector('.exh-views [aria-current="page"]')).indexOf("Review") === 0
    && viewBtn(t.d, "Credentials"));
  check("the credential file is not read until the view opens", !t.calls.some(function (c) { return c.url === "loadScript:credential_reference_data.js"; }));
  viewBtn(t.d, "Credentials").click(); await settle();
  check("Credentials loads the reference's file once and the live rows", t.calls.filter(function (c) { return c.url === "loadScript:credential_reference_data.js"; }).length === 1
    && t.calls.some(function (c) { return /kb_curation\?select=course_id,field,value,reviewed_at/.test(c.url) && /field=in\.\(issuing_agency_override,training_agency_override,training_sites_override\)/.test(c.url)
      && /course_id=like\._CREDENTIAL_REVIEW%3A%3A%25/.test(c.url) && c.headers.Range === "0-999"; }));
  check("the view is current and counts the credentials", /Credentials 4/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]'))));
  const ctiles = Array.from(t.d.querySelectorAll(".exh-tile")).map(txt);
  check("the tiles count issuers and training sites", /Issuers4 of 4/.test(ctiles[1]) && /Training sites3 of 4/.test(ctiles[2]));
  function rowsOf(d) { return Array.from(d.querySelectorAll(".exh-table tbody tr")).map(function (tr) { return Array.from(tr.children).map(txt); }); }
  let rows = rowsOf(t.d);
  check("most students first, then the cells under ten, then by colleges", rows.map(function (r) { return r[0]; }).join("|") === [SECP, MED, JLP, IBEW].join("|"));
  check("a suppressed count reads Too few; none reads None yet", rows[0][3] === "57" && rows[1][3] === "Too few" && rows[3][3] === "None yet");
  check("the live issuer stands over the daily file's", rows[0][1] === "CompTIA (Computing Technology Industry Association)");
  check("no site reads None named", rows[0][2] === "None named");
  check("the live list stands when its joined text matches the trainer saved beside it", rows[2][2] === "Regional Academy North; Valley Academy");
  check("a later one-trainer edit that differs wins over the list", rows[1][2] === "Orange High School");
  check("a credential's other issuers count beside it", rows[1][1] === "Canyon High School and 1 more");
  check("adoption counts the colleges; could adopt is the prescriptive layer, the articulating college left out",
    rows[2][4] === "3 articulate it" && rows[0][4] === "2 articulate it · 2 could adopt" && rows[3][4] === "2 articulate it");
  check("articulated at joins MAP's adopters with no course identity to the reference's colleges", rows[0][4].indexOf("2 articulate it") === 0);
  check("the reference's broad potential_colleges never count", !rows.some(function (r) { return /11 could adopt|1 could adopt/.test(r[4]); }));
  const groups = Array.from(t.d.querySelectorAll(".exh-group > .exh-q")).map(txt);
  check("the view asks the three questions", groups.join("|") === "What is it called?|What credit does it carry?|Who could adopt it?");
  const all = Array.from(t.d.querySelectorAll(".exh-tile")).map(txt);
  check("the credit tiles count recommendations, statewide ones and the field",
    all.some(function (x) { return /^Credit recs3 of 4/.test(x); }) && all.some(function (x) { return /^Statewide recs1 of 4/.test(x); })
    && all.some(function (x) { return /^Field2 of 4/.test(x); }));
  check("the adoption tiles count the adoptable, the shared and the could-adopt credentials",
    all.some(function (x) { return /^Adoptable2 of 4/.test(x); }) && all.some(function (x) { return /^Shared3 of 4/.test(x); })
    && all.some(function (x) { return /^Could adopt1 of 4/.test(x); }));
  check("the adoption file and MAP's index load once with the view", t.calls.filter(function (c) { return c.url === "kb/exhibits_adoption.json"; }).length === 1
    && t.calls.filter(function (c) { return c.url === "maplinks:load"; }).length === 1);
  check("the views link names what Exhibit Adoption still holds", /The college matrix, in Exhibit Adoption/.test(txt(t.d.querySelector(".exh-views"))));
  check("the table is a labeled region with scoped headers and a fixed layout", t.d.querySelector('.exh-tablewrap[role="region"][aria-label="Credentials"][tabindex="0"]')
    && t.d.querySelectorAll('.exh-table th[scope="col"]').length === 5 && t.d.querySelectorAll(".exh-table col").length === 5);

  const cfind = t.d.getElementById("exh-c-find");
  cfind.focus(); cfind.value = "academy"; cfind.dispatchEvent(new t.w.Event("input")); await settle();
  check("the search finds a training site and keeps the box focused", rowsOf(t.d).length === 1 && rowsOf(t.d)[0][0] === JLP && t.d.activeElement === t.d.getElementById("exh-c-find"));
  cfind.value = "security fund"; cfind.dispatchEvent(new t.w.Event("input")); await settle();
  check("the search finds a local title, every word", rowsOf(t.d).length === 1 && rowsOf(t.d)[0][0] === SECP);
  cfind.value = "no such credential"; cfind.dispatchEvent(new t.w.Event("input")); await settle();
  check("no match says so", /No credential matches/.test(txt(t.d.querySelector(".exh-ctable"))));
  cfind.value = ""; cfind.dispatchEvent(new t.w.Event("input")); await settle();

  byText(t.d, ".exh-table button", IBEW).click(); await settle();
  let cp = t.d.getElementById("exh-cpanel");
  check("a credential opens its panel, focused on its name", cp && txt(t.d.getElementById("exh-c-h")) === IBEW && t.d.activeElement === t.d.getElementById("exh-c-h"));
  check("the row reads selected", byText(t.d, ".exh-table button", IBEW).getAttribute("aria-current") === "true");
  check("the panel carries the three questions", ["What is it called?", "What credit does it carry?", "Who could adopt it?"].every(function (q) {
    return Array.from(cp.querySelectorAll("h4")).some(function (h) { return txt(h) === q; }); }));
  check("its CER step chip says In the reference, with the hover", /CER step: In the reference/.test(txt(cp.querySelector(".exh-chip"))) && /Settled\./.test(cp.querySelector(".exh-chip").getAttribute("data-tip")));
  check("the issuer is an input with its label", t.d.getElementById("exh-c-issuer").value === "International Brotherhood of Electrical Workers (IBEW)"
    && t.d.querySelector('label[for="exh-c-issuer"]'));
  check("the daily file's site is the first row, for any college", t.d.getElementById("exh-c-site-0").value === "Joint Apprenticeship Training Committee (JATC)"
    && t.d.getElementById("exh-c-col-0").value === "");
  const opts0 = Array.from(t.d.getElementById("exh-c-col-0").options).map(function (o) { return o.value; });
  check("the college choices are Any college and the colleges that articulate it", opts0.join("|") === "|Bakersfield College|Norco College");
  check("the credit and the colleges show", /3\.5 hours in Electrical Theory/.test(txt(cp)) && /M-ID ELEC M1001, Electrical Theory/.test(txt(cp))
    && /Articulated at \(2\)/.test(txt(cp)) && /Could adopt \(0\)/.test(txt(cp)) && /No students with credit yet/.test(txt(cp)));
  check("the credit block names the field, the peer median and the exhibits", /CIP 46, Construction Trades/.test(txt(cp))
    && /The median articulating college awards 3\.5 units/.test(txt(cp)) && /Exhibits in MAP \(1\): IBEW Year 1, 3\.5 units/.test(txt(cp)));
  check("the panel no longer sends a reader to Exhibit Adoption for a college's courses", !/Each college's courses/.test(txt(cp)));
  check("the MAP line for the credential sits under the chips", cp.querySelector('.cpl-maplinks[data-ml-title="' + IBEW + '"]'));
  const norco = Array.from(cp.querySelectorAll("button.exh-cchip")).find(function (b) { return txt(b) === "Norco"; });
  check("an articulating college is a button tied to the box", norco && norco.getAttribute("aria-controls") === "exh-c-adopt" && norco.getAttribute("aria-expanded") === "false"
    && t.d.getElementById("exh-c-adopt").hidden);
  norco.click(); await settle();
  let box = t.d.getElementById("exh-c-adopt");
  check("its chip opens what it articulated: the line, the units, its own exhibit in MAP", !box.hidden && /Norco College/.test(txt(box))
    && /Articulated, 3\.5 units in all/.test(txt(box)) && /ELC 401: 3\.5 hours in Introduction to Electrical Theory/.test(txt(box))
    && /Its exhibit in MAP/.test(txt(box)) && box.querySelector("a").href === "https://map.example/opp?Exhibit=MAPAPP-IBEW-1-001&View=Non-Military");
  check("the chip reads expanded and the focus target survives", Array.from(t.d.querySelectorAll("#exh-cpanel button.exh-cchip")).find(function (b) { return txt(b) === "Norco"; }).getAttribute("aria-expanded") === "true");
  Array.from(t.d.querySelectorAll("#exh-cpanel button.exh-cchip")).find(function (b) { return txt(b) === "Bakersfield"; }).click(); await settle();
  box = t.d.getElementById("exh-c-adopt");
  check("a college with no line says so and claims no exhibit", /MAP lists no credit recommendation line/.test(txt(box)) && !box.querySelector("a"));
  Array.from(t.d.querySelectorAll("#exh-cpanel button.exh-cchip")).find(function (b) { return txt(b) === "Bakersfield"; }).click(); await settle();
  check("a second click closes the box", t.d.getElementById("exh-c-adopt").hidden);

  // edit: two JATCs, each for its college
  t.d.getElementById("exh-c-col-0").value = "Bakersfield College"; t.d.getElementById("exh-c-col-0").dispatchEvent(new t.w.Event("change"));
  t.d.getElementById("exh-c-site-0").value = "Kern County JATC"; t.d.getElementById("exh-c-site-0").dispatchEvent(new t.w.Event("input"));
  byText(cp, "button", "Add a training site").click(); await settle();
  check("Add a training site adds a row and focuses its box", t.d.getElementById("exh-c-site-1") && t.d.activeElement === t.d.getElementById("exh-c-site-1"));
  check("the first row's edits survive the re-render", t.d.getElementById("exh-c-site-0").value === "Kern County JATC" && t.d.getElementById("exh-c-col-0").value === "Bakersfield College");
  t.d.getElementById("exh-c-col-1").value = "Norco College"; t.d.getElementById("exh-c-col-1").dispatchEvent(new t.w.Event("change"));
  t.d.getElementById("exh-c-site-1").value = "  Inland Empire   JATC "; t.d.getElementById("exh-c-site-1").dispatchEvent(new t.w.Event("input"));
  byText(t.d.getElementById("exh-cpanel"), "button", "Add a training site").click(); await settle();
  t.d.querySelector('[aria-label="Remove training site 3"]').click(); await settle();
  check("Remove takes the row away and returns focus to Add", !t.d.getElementById("exh-c-site-2") && t.d.activeElement === t.d.getElementById("exh-c-add"));
  t.d.getElementById("exh-c-save").click(); await settle();
  check("signed out, Save asks for a sign-in and writes nothing", /Sign in as a reviewer to save/.test(txt(t.d.querySelector("#exh-cpanel .exh-status")))
    && !t.calls.some(function (c) { return /kb_curation$/.test(c.url) && c.method === "POST"; }));

  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } })); await settle();
  check("a new visit starts on Review with no credential chosen", /Review/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]'))) && !t.d.getElementById("exh-cpanel")
    && t.M._state.cs.sel === null && t.M._state.cs.q === "");

  // signed in: the save
  t = load({ signedIn: true, overlay: OVERLAY });
  await t.M.boot(); await settle();
  t.M.openCredential(IBEW); await settle();
  check("the Review card's way in opens a credential's panel", txt(t.d.getElementById("exh-c-h")) === IBEW);
  t.d.getElementById("exh-c-save").click(); await settle();
  check("Save with nothing changed writes nothing and says so", /Nothing changed/.test(txt(t.d.querySelector("#exh-cpanel .exh-status")))
    && !t.calls.some(function (c) { return /kb_curation$/.test(c.url) && c.method === "POST"; }));
  t.d.getElementById("exh-c-col-0").value = "Bakersfield College"; t.d.getElementById("exh-c-col-0").dispatchEvent(new t.w.Event("change"));
  t.d.getElementById("exh-c-site-0").value = "Kern County JATC"; t.d.getElementById("exh-c-site-0").dispatchEvent(new t.w.Event("input"));
  byText(t.d.getElementById("exh-cpanel"), "button", "Add a training site").click(); await settle();
  t.d.getElementById("exh-c-col-1").value = "Norco College"; t.d.getElementById("exh-c-col-1").dispatchEvent(new t.w.Event("change"));
  t.d.getElementById("exh-c-site-1").value = "  Inland Empire   JATC "; t.d.getElementById("exh-c-site-1").dispatchEvent(new t.w.Event("input"));
  t.d.getElementById("exh-c-issuer").value = "IBEW"; t.d.getElementById("exh-c-issuer").dispatchEvent(new t.w.Event("input"));
  t.d.getElementById("exh-c-save").click(); await settle();
  const cposts = t.calls.filter(function (c) { return /kb_curation$/.test(c.url) && c.method === "POST"; });
  const byField = {}; cposts.forEach(function (p) { byField[p.body.field] = p.body; });
  check("Save writes three rows under the credential's key, as the reviewer", cposts.length === 3 && cposts.every(function (p) {
    return p.body.course_id === "_CREDENTIAL_REVIEW::" + IBEW && p.body.reviewer_email === "reviewer@example.org" && /resolution=merge-duplicates/.test(p.headers.Prefer); }));
  check("the issuer saves as issuing_agency_override", byField.issuing_agency_override && byField.issuing_agency_override.value === "IBEW");
  check("the sites save as JSON, in order, each with its college, spaces folded",
    byField.training_sites_override && byField.training_sites_override.value === JSON.stringify([{ site: "Kern County JATC", college: "Bakersfield College" }, { site: "Inland Empire JATC", college: "Norco College" }]));
  check("the one-trainer field carries the sites joined", byField.training_agency_override && byField.training_agency_override.value === "Kern County JATC; Inland Empire JATC");
  check("the save says so and the table shows it at once", /Saved\. The tabs show it now/.test(txt(t.d.querySelector("#exh-cpanel .exh-status")))
    && rowsOf(t.d).some(function (r) { return r[0] === IBEW && r[1] === "IBEW" && r[2] === "Kern County JATC; Inland Empire JATC"; }));
  t.d.getElementById("exh-c-save").click(); await settle();
  check("a second Save right after writes nothing", t.calls.filter(function (c) { return /kb_curation$/.test(c.url) && c.method === "POST"; }).length === 3);
  // removing every site saves an empty list and an empty trainer
  t.d.querySelector('[aria-label="Remove training site 2"]').click(); await settle();
  t.d.querySelector('[aria-label="Remove training site 1"]').click(); await settle();
  check("with no sites the panel says None named", /None named/.test(txt(t.d.querySelector("#exh-cpanel .exh-sites"))));
  t.d.getElementById("exh-c-save").click(); await settle();
  const last = t.calls.filter(function (c) { return /kb_curation$/.test(c.url) && c.method === "POST"; }).slice(3);
  check("clearing the sites saves an empty list and an empty trainer", last.length === 2
    && last.some(function (p) { return p.body.field === "training_sites_override" && p.body.value === "[]"; })
    && last.some(function (p) { return p.body.field === "training_agency_override" && p.body.value === ""; }));

  // the Review card links the panel for a credential already in the reference
  t = load({ overlay: OVERLAY });
  await t.M.boot(); await settle();
  const setIt = byText(t.d, ".exh-read button", "Set in the credential panel");
  check("the card's training site links the credential panel", setIt);
  setIt.click(); await settle();
  check("the link opens the credential the title joins", txt(t.d.getElementById("exh-c-h")) === JLP
    && t.d.getElementById("exh-c-site-0").value === "Regional Academy North" && t.d.getElementById("exh-c-col-0").value === "Norco College");
  t.d.getElementById("exh-c-issuer").value = "Draft issuer"; t.d.getElementById("exh-c-issuer").dispatchEvent(new t.w.Event("input"));
  viewBtn(t.d, "Review").click(); await settle();
  viewBtn(t.d, "Credentials").click(); await settle();
  byText(t.d, ".exh-table button", JLP).click(); await settle();
  check("a panel draft outlives leaving the view", t.d.getElementById("exh-c-issuer").value === "Draft issuer");

  // Exhibit Adoption folded in: CompTIA Security+'s could-adopt colleges
  byText(t.d, ".exh-table button", SECP).click(); await settle();
  cp = t.d.getElementById("exh-cpanel");
  check("Could adopt lists the teaching colleges, the articulating one left out", /Could adopt \(2\)/.test(txt(cp))
    && !Array.from(cp.querySelectorAll(".exh-ccrow")).some(function (row) { return /Could adopt/.test(txt(row)) && /Cabrillo/.test(txt(row)); }));
  check("the over-merged colleges are counted, never named", /4 colleges teach a course under an identity that joins too many courses to name them/.test(txt(cp)));
  check("an adopter MAP records beyond the reference is a chip", Array.from(cp.querySelectorAll("button.exh-cchip")).some(function (b) { return txt(b) === "Chabot"; })
    && /Articulated at \(2\)/.test(txt(cp)));
  check("a more control keeps a space from the text before it", /and 1 more/.test(txt(cp)) && !/unitsand/.test(txt(cp)) && !/Plusand/.test(txt(cp)));
  check("four exhibits fold to three and 1 more", /Exhibits in MAP \(4\)/.test(txt(cp)) && byText(cp, "button", "and 1 more"));
  Array.from(cp.querySelectorAll("button.exh-cchip")).find(function (b) { return txt(b) === "De Anza"; }).click(); await settle();
  box = t.d.getElementById("exh-c-adopt");
  check("a could-adopt chip opens the course it already teaches and points to Request Quick Adopt",
    /Already teaches a course mapped to it/.test(txt(box)) && /CIS 108, 4\.5 units/.test(txt(box)) && /Request Quick Adopt/.test(txt(box)));
  t.M._state.cs.open = null;

  // the adoption file could not be read
  t = load({ noAdoption: true });
  await t.M.boot(); await settle();
  viewBtn(t.d, "Credentials").click(); await settle();
  check("an unread adoption file leaves the table standing and says so on the tiles", rowsOf(t.d).length === 4
    && Array.from(t.d.querySelectorAll(".exh-tile")).some(function (x) { return /^FieldCould not be read/.test(txt(x)); }));
  byText(t.d, ".exh-table button", SECP).click(); await settle();
  check("its Could adopt says it could not be read rather than none", /Could adopt \(0\)Could not be read/.test(txt(t.d.getElementById("exh-cpanel"))));

  // the live rows could not be read
  t = load({ overlayFails: true });
  await t.M.boot(); await settle();
  viewBtn(t.d, "Credentials").click(); await settle();
  check("unread live rows fall back to the daily file and say so", /Today's saves could not be read, so the credentials show as of 2026-10-31 06:20Z/.test(txt(t.root))
    && rowsOf(t.d).some(function (r) { return r[0] === JLP && r[2] === "Regional Academy"; }));
  t = load({ noCreds: true });
  await t.M.boot(); await settle();
  viewBtn(t.d, "Credentials").click(); await settle();
  check("an unread credential file says so", /The credentials could not be read \(the credential file did not load\)/.test(txt(t.root)));

  // #exhibits/<route>: the Commons row's counts land here, read once per visit (Sheet 148, link-retire)
  t = load({ hash: "#exhibits/conflict" });
  await t.M.boot(); await settle();
  check("#exhibits/conflict opens Review on Conflict with the reference", t.M._state.view === "review"
    && stepTile(t.d, "Conflict with the reference").getAttribute("aria-pressed") === "true");
  t = load({ hash: "#exhibits/credentials" });
  await t.M.boot(); await settle();
  check("#exhibits/credentials opens the Credentials view", t.M._state.view === "credentials" && rowsOf(t.d).length === 4);
  t = load({ hash: "#exhibits/nowhere" });
  await t.M.boot(); await settle();
  check("an unknown route opens Review on all held", t.M._state.view === "review" && t.M._state.filter === "");

  // the one rule, shared with kb/_apply_credential_review.py
  const M = t.M;
  check("parseSites drops blanks and repeats and folds spaces", JSON.stringify(M._parseSites(JSON.stringify([{ site: " A  B " }, { site: "" }, { site: "A B" }, { site: "C", college: "Norco College" }, "x"])))
    === JSON.stringify([{ site: "A B" }, { site: "C", college: "Norco College" }]));
  check("parseSites reads a value that is not a list as null", M._parseSites("{}") === null && M._parseSites("not json") === null);
  check("joinSites names each site once", M._joinSites([{ site: "A" }, { site: "A", college: "X" }, { site: "B" }]) === "A; B");
  check("resolveSites: no list, no answer", M._resolveSites({ trainer: "A" }) === null);
  check("resolveSites: a later, different trainer stands the list down", M._resolveSites({ sites: '[{"site":"A"}]', sitesAt: "1", trainer: "B", trainerAt: "2" }) === null);
  check("resolveSites: the list stands when the trainer matches or is older",
    M._resolveSites({ sites: '[{"site":"A"}]', sitesAt: "1", trainer: "A", trainerAt: "2" }).length === 1
    && M._resolveSites({ sites: '[{"site":"A"}]', sitesAt: "2", trainer: "B", trainerAt: "1" }).length === 1);
  check("the rendered credential view has no emoji", !/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(txt(t.root)));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
