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
  && /git add kb\/exhibits_review\.json kb\/exhibits_review_courses\.json/.test(daily));
check("the daily build runs after the suggestions it reads", daily.indexOf("_suggest_unclassified.py") < daily.indexOf("_build_exhibits_review.py"));
check("the nightly procedures run rebuilds and commits them", /python3 kb\/_build_exhibits_review\.py/.test(proc)
  && /git add kb\/exhibits_review\.json kb\/exhibits_review_courses\.json/.test(proc)
  && proc.indexOf("_cer_procedures.py --classify") < proc.indexOf("_build_exhibits_review.py"));
check("CI runs the builder's test", /python3 tests\/exhibits_review_build_test\.py/.test(fs.readFileSync(".github/workflows/js-tests.yml", "utf8")));
check("the Commons row links Open Exhibits", /"href": "#exhibits", "text": "Open Exhibits"/.test(fs.readFileSync("kb/_build_commons_status.py", "utf8")));
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
      art: [C("Los Angeles Pierce College")], could: [C("Chabot College"), C("Norco College")], basis: "", same: false },
    { raw: WELD, step: "Wording check", why: "the classifier's title has a dangling word", colleges: [C("Norco College")],
      title: "Welding 1 for", issuer: "", from: "the classifier", ids: ["MAPCXI-WELD-1-001"],
      art: [C("Norco College")], could: [], basis: "", same: false }
  ]
};
const COURSES = { schema: 1, colleges: COLLEGES, courses: { "ARTS 250": {
  [String(C("Cabrillo College"))]: [["DM 1", "Intro to Digital Media", 3]],
  [String(C("Cypress College"))]: [["ART 20", "Digital Art I", 3], ["ART 20N", "Digital Art I", 0]] } } };
const STUDENTS = { "0": [null, true], "1": [442, false], "2": [398, false], "3": [0, false] };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root" style="border:1px dashed;padding:28px;">Loading</div></body></html>',
    { url: "https://example.org/#exhibits", runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null, headers: init.headers || {} });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(status) { return Promise.resolve({ ok: false, status: status, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return opts.noData ? bad(404) : ok(REVIEW);
    if (url === "kb/exhibits_review_courses.json") return ok(COURSES);
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
    if (/\/rest\/v1\/kb_curation/.test(url)) return opts.saveFails ? bad(500) : Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return bad(404);
  };
  const sess = opts.signedIn ? { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" } : null;
  w.CPL_SESSION = {
    ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; }
  };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, "").replace("Los Angeles ", "LA "); };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, root: w.document.getElementById("exhibits-root"), calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 6; i++) await tick(); }
function byText(d, sel, t) { return Array.from(d.querySelectorAll(sel)).find(function (b) { return txt(b) === t; }); }
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
  check("a filtered AP title offers Exhibit Adoption's colleges as buttons", /Could adopt \(2\), from Exhibit Adoption/.test(txt(t.d.querySelector(".exh-colleges"))));
  Array.from(t.d.querySelectorAll("button.exh-cchip")).find(function (b) { return txt(b) === "Norco"; }).click(); await settle();
  check("an Exhibit Adoption college says its faculty choose the course", /its faculty choose the course/.test(txt(t.d.getElementById("exh-adopt"))));
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

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
