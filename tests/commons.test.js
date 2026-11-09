// The Commons tab (commons.js) — every common reference's dash on one page.
//   - Rule 4 (both HTMLs identical) + the nav button / pane / mount / lazy boot, the nav group,
//     the daily workflow's build step and commit line, CI's builder test.
//   - render(): five rows from a status file in the mock-up's shape; a null figure reads
//     "Could not be read", never a zero (S343); a stamp past its cadence reads stale; a project
//     with no run log says so; a run log that fails to load says so; its calls list.
//   - The controls are words: Collapse / Expand per row (aria-expanded, aria-controls, named for
//     the row), Collapse all / Expand all, Move up / Move down, Back to the starting order; the
//     order and the fold survive in localStorage; a collapsed row keeps its count and meter
//     (Sam, 2026-10-18 20:03Z).
//   - Tokens only in the injected CSS; no glyphs in the rendered text; American spelling.
//
// Run from repo root: `npm test` (or `node tests/commons.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ───────────────────────────── Part A — static invariants ─────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav has the CPL Commons button (Sam, Sheet 158 card 3, 2026-11-02)", /class="cpl-tab[^"]*" data-tab="commons"[^>]*>CPL Commons</.test(cpl));
check("pane #tab-commons exists", /id="tab-commons" data-tab="commons"/.test(cpl));
check("mount #commons-root exists", /id="commons-root"/.test(cpl));
check("boot wiring: onActivate('commons')", /onActivate\('commons'/.test(cpl));
check("boot wiring loads commons_progress.js before commons.js",
  /onActivate\('commons'[\s\S]{0,400}loadScript\('commons_progress\.js'[\s\S]{0,300}loadScript\('commons\.js', 'CPL_COMMONS'/.test(cpl));
const groupsSrc = fs.readFileSync("nav_groups.js", "utf8");
check("nav_groups.js lists 'commons' beside program-requirements", /'program-requirements', 'commons'/.test(groupsSrc));
const wf = fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8");
check("daily workflow builds the Commons status", /python3 kb\/_build_commons_status\.py/.test(wf));
check("daily workflow commits kb/status/commons.json", /git add kb\/status\/commons\.json/.test(wf));
check("the build step runs before the copy to index.html", wf.indexOf("_build_commons_status.py") < wf.indexOf("cp CPL_Dashboard.html index.html"));
// The nightly procedures run rewrites the held titles the Exhibit row counts, so it rebuilds the status after its
// own builds and commits it (#2665's note: the tile read 351 held while Review read 1 until the next daily run).
const proc = fs.readFileSync(".github/workflows/cer-procedures.yml", "utf8");
check("the nightly procedures run rebuilds the Commons status after the files it reads", /python3 kb\/_build_commons_status\.py/.test(proc)
  && proc.indexOf("_cer_procedures.py --classify") < proc.indexOf("_build_commons_status.py")
  && proc.indexOf("_sweep_exhibit_titles.py") < proc.indexOf("_build_commons_status.py"));
check("the nightly procedures run commits kb/status/commons.json", /git add kb\/status\/commons\.json/.test(proc));
const ci = fs.readFileSync(".github/workflows/js-tests.yml", "utf8");
check("CI runs the builder's test", /python3 tests\/commons_status_build_test\.py/.test(ci));
check("the first status file is committed", fs.existsSync("kb/status/commons.json"));

const src = fs.readFileSync("commons.js", "utf8");
check("commons.js exposes CPL_COMMONS.boot and render", /window\.CPL_COMMONS\s*=\s*\{\s*boot: boot, render: render/.test(src));
check("commons.js carries no service key", src.indexOf("service_role") === -1);
check("commons.js reads kb/status/commons.json", /kb\/status\/commons\.json/.test(src));
const cssBlock = src.slice(src.indexOf("var CSS = ["), src.indexOf("].join("));
check("the injected CSS names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(cssBlock));
check("the injected CSS uses the tab's tokens", /var\(--cmn-link\)/.test(cssBlock) && /var\(--cmn-line\)/.test(cssBlock) && !/var\(--cobalt\)/.test(cssBlock));
const tokensBlock = src.slice(src.indexOf("var TOKENS = ["), src.indexOf("].join(", src.indexOf("var TOKENS = [")));
check("Malone's palette lives only in the tab's token block, scoped to #tab-commons", /#tab-commons \{ --cmn-page:#F5FAFF;/.test(tokensBlock) && /--cmn-sans:Inter/.test(tokensBlock));
check("dark mode maps every role onto a First Light dark token and invents no color",
  /:root\[data-theme=\\?"dark\\?"\] #tab-commons \{[^}]*--cmn-surface:var\(--surface\)[^}]*--cmn-heading:var\(--text-strong\)/.test(tokensBlock)
  && !/data-theme=\\?"dark\\?"\] #tab-commons \{[^}]*#[0-9a-fA-F]{3,8}\b/.test(tokensBlock) && /prefers-color-scheme: dark/.test(tokensBlock));
check("the word controls are 24px tall, underlined, with no fill", /button\.cmn-word \{ all:unset;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(cssBlock));
check("a link in a card's name or words row is at least 24px tall (WCAG 2.2 target size)", /\.cmn-card-name a \{[^}]*min-height:24px/.test(cssBlock) && /\.cmn-card-links a, \.cmn-acts a[^{]*\{[^}]*min-height:24px; line-height:24px/.test(cssBlock));
check("a focus ring is drawn", /:focus-visible \{ outline:2px solid var\(--cmn-accent\)/.test(cssBlock));
check("single column below 560px", /@media \(max-width: 560px\) \{ \.cmn-cells \{ grid-template-columns:minmax\(0, 1fr\)/.test(cssBlock));
check("American spelling in the source", !/\b(colour|behaviour|organisation|analyse|centre|cancelled|catalogue|whilst|amongst)\b/i.test(src));

// ───────────────────────────── Part B — the renderer in jsdom ─────────────────────────────
const COMMONS = fs.readFileSync("commons_progress.js", "utf8");
const NOW = new Date("2026-10-19T00:00:00Z");
const STATUS = {
  schema: 1, written_at: "2026-10-18T23:00:00Z",
  rows: [
    { key: "requirements", title: "Program Requirements", tab: "#program-requirements", links: [{ href: "#program-requirements", text: "Open the tab" }],
      status_file: "kb/status/program-requirements.json",
      pair: [{ n: 11625, of: 20282, words: "complete at 113 colleges", open: "#program-requirements" }], tests: ["machine-checked"],
      issues: [{ n: 3918, words: "active programs whose record fails a check", owner: "the college's reading procedure", open: "#program-requirements" },
               { n: 4739, words: "active programs with no record yet", owner: "the harvest", open: "#program-requirements" }],
      procedures: [{ n: 114, words: "reading procedures, one per college read, versioned", open: "#program-requirements" }, { words: "A misread is fixed in the procedure" }],
      machine: { what: "the last college read", at: "2026-10-18T12:45:57Z", every_hours: null }, sources: ["x"] },
    { key: "exhibit", title: "Common Exhibit Reference", tab: "#credential-reference", links: [{ href: "#credential-reference", text: "Open the tab" }],
      status_file: "kb/status/exhibit.json",
      pair: [{ n: 1729, of: 4915, words: "titles carry a review stamp", open: "#credential-reference" }], tests: ["curator-stamped", "procedure-settled"],
      issues: [{ n: 396, words: "titles held for a person", owner: "a curator", open: "#credential-reference" }],
      procedures: [{ n: 12, words: "in force", open: "#credential-reference" }],
      machine: { what: "the saving run and the fold", at: "2026-10-18T17:47:11Z", every_hours: 24 }, sources: ["x"] },
    { key: "course", title: "Common Course Reference", tab: "#unified-courses",
      links: [{ href: "https://example.org/prototype/skyview.html", text: "Open SkyView" }],
      status_file: null,
      pair: [{ n: 3208, of: 27581, words: "cards the auditor scores 0.85 or better", open: "#unified-courses" },
        { n: 957, of: 27581, words: "confirmed by a person, 152 of them ready", open: "#unified-courses" }], tests: ["scored by the auditor"],
      issues: [{ n: 4179, words: "unit anomalies", owner: "a curator", open: "#unified-courses" }],
      procedures: [{ words: "TOP is a last-in-line signal" }],
      machine: { what: "the auditor", at: "2026-10-16T17:48:47+00:00", every_hours: 24 }, sources: ["x"] },
    { key: "cr", title: "Common CR Reference", tab: "#cr-reference", links: [{ href: "#cr-reference", text: "Open the tab" }], status_file: null,
      pair: [{ n: 156, of: 2159, words: "groups collapsed by a rung-1 to 4 rule", open: "#cr-reference" },
             { n: 30, words: "groups a curator decided", open: "#cr-reference" }], tests: ["assigned by rung", "curator-decided"],
      issues: [{ n: 1936, words: "groups at rung 5", owner: "a curator", open: "#cr-reference" }],
      procedures: [{ words: "Five rungs" }],
      machine: { what: "the worklist build, last changed", at: "2026-10-18T17:50:29+00:00", every_hours: null }, sources: ["x"] },
    { key: "subjects", title: "Common Subjects Reference", tab: "#canonical-subj4", links: [{ href: "#canonical-subj4", text: "Open the tab" }], status_file: null,
      pair: [{ n: null, of: null, words: "", open: "#canonical-subj4" }], tests: [], issues: [], procedures: [],
      machine: { what: null, at: null, every_hours: null }, error: "FileNotFoundError: kb/discipline_canonical_subj4.json", sources: [] }
  ],
  building: [
    { key: "credentials", title: "Industry credentials", tab: "#exhibits", links: [{ href: "#exhibits", text: "Open Exhibits" }],
      pair: [{ n: 7536, of: null, words: "credentials from 1,525 issuers", open: "#exhibits" }], tests: ["issuer-published"],
      machine: { what: "the credential watch's catalog", at: "2026-10-18T00:00:00Z", every_hours: null }, sources: ["kb/it_ai_credential_catalog.json"] },
    { key: "outcomes", title: "Course outcomes", tab: "#coci-lookup", links: [{ href: "#coci-lookup", text: "Open the Courses List" }],
      pair: [{ n: 19821, of: null, words: "outcomes read from 4,729 courses at 7 colleges", open: "#coci-lookup" }], tests: ["read from the public outline"],
      machine: { what: "the last outline read", at: "2026-10-18T07:02:26Z", every_hours: null }, sources: ["kb/course_outcomes/*/read_*.json"] },
    { key: "skills", title: "Skills", tab: null, links: [],
      pair: [{ n: 26, of: null, words: "credentials list their issuer's skills so far", open: null }], tests: ["issuer-published"],
      machine: { what: "the credential watch's catalog", at: "2026-10-18T00:00:00Z", every_hours: null }, sources: ["kb/it_ai_credential_catalog.json"] }
  ]
};
const PR_LOG = { schema: 1, project: "program-requirements", written_at: "2026-10-18T18:15:53Z", session: 418, moniker: "SkyMadrone",
  next_step: { title: "Hand Sam the Commons mock-up, then the shared Progress module" },
  changes: [{ at: "2026-10-18T18:00:00Z", text: "Glendale's 220 records loaded. The reader now follows the catalog's own links." }],
  calls: [{ title: "The Commons mock-up, version 3, waits on Sam's look", link: "https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi" },
    { title: "The second reader waits on a new xAI subscription", link: "https://claude.ai/artifact/RmbXT7Ay2955zcpg1hfHzu",
      answer: { by: "Sam", at: "2026-10-21", words: "Later: keep this on ice." } }] };

function responder(map) {
  return function (url) {
    url = String(url);
    const hit = map[url];
    if (hit === undefined) return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.reject(new Error("404")); } });
    if (hit instanceof Error) return Promise.reject(hit);
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(hit))); } });
  };
}
function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="commons-root" style="padding:28px;">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = opts.fetch || responder({ "kb/status/commons.json": STATUS, "kb/status/program-requirements.json": PR_LOG });
  // the keeper (cpl_session.js) first, as the page loads it, with storage stubs it reads at start
  if (opts.session) {
    const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
    Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
    Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
    w.eval(fs.readFileSync("cpl_session.js", "utf8"));
  }
  if (opts.noStorage) Object.defineProperty(w, "localStorage", { get: function () { throw new Error("SecurityError"); } });
  // boot() reads the clock (new Date()), so the window's clock is pinned to NOW: the fixture's stamps are fixed, and
  // on the real clock the "inside 36 hours" check turned red 36 hours after its stamp (2026-10-20 05:47Z, S432).
  w.eval("(function(){var R=Date,T=" + NOW.getTime() + ";function D(){if(!(this instanceof D))return new R(T).toString();" +
         "return arguments.length?new(Function.prototype.bind.apply(R,[null].concat([].slice.call(arguments)))):new R(T);}" +
         "D.prototype=R.prototype;D.now=function(){return T;};D.UTC=R.UTC;D.parse=R.parse;Date=D;})();");
  if (!opts.noModule) { const s0 = w.document.createElement("script"); s0.textContent = COMMONS; w.document.body.appendChild(s0); }
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_COMMONS, root: w.document.getElementById("commons-root") };
}
function rows(d) { return Array.from(d.querySelectorAll(".cmn-ref")); }
function byKey(d, k) { return d.querySelector('.cmn-ref[data-key="' + k + '"]'); }
function cellText(li, title) {
  const h = Array.from(li.querySelectorAll(".cmn-cell h4")).find(function (x) { return txt(x) === title; });
  return h ? txt(h.parentNode) : "";
}

(async function () {
  // boot: reads the status file and each row's run log, then draws
  const t = load();
  check("commons.js evaluates and registers CPL_COMMONS", t.M && typeof t.M.boot === "function");
  const r = await t.M.boot();
  check("boot() resolves with the data and the run logs", r && r.data && r.S && r.S.requirements && r.S.requirements.Q && r.S.requirements.Q.session === 418);
  check("the mount's placeholder style is dropped", !t.root.getAttribute("style"));
  check("the heading is CPL Commons (Sam, 2026-11-02)", txt(t.d.querySelector(".cmn-title")) === "CPL Commons");
  check("five rows draw in the file's order", rows(t.d).map(function (li) { return li.getAttribute("data-key"); }).join(",") === "requirements,exhibit,course,cr,subjects");
  check("the rows are numbered 1 to 5", rows(t.d).map(function (li) { return txt(li.querySelector(".cmn-pos")); }).join("") === "12345");
  check("the bar says when the figures were read", /Figures read/.test(txt(t.d.querySelector(".cmn-note"))));

  // ── the first view (the mock Sam locked, S552, 2026-11-02): a card per common reference ──
  const cards = () => Array.from(t.d.querySelectorAll(".cmn-card"));
  const cardKeys = () => cards().map((c) => c.getAttribute("data-card"));
  check("⭐ eight cards draw: the five references and the three being built", cards().length === 8);
  check("⭐ the cards are the Common references, your decisions first, then by how far along, then the builds",
    cardKeys().join(",") === "requirements,exhibit,course,cr,subjects,credentials,outcomes,skills"
    && cards().map((c) => txt(c.querySelector(".cmn-card-name"))).join("|") === "Common Programs|Common Exhibits|Common Courses|Common Credit Recommendations|Common Subjects|Common Credentials|Common Outcomes|Common Skills");
  const reqCard = t.d.querySelector('.cmn-card[data-card="requirements"]');
  check("a card with an open call reads Needs you under a gold rule and carries Your decision with the call's sheet link",
    txt(reqCard.querySelector(".cmn-pill")) === "Needs you" && reqCard.classList.contains("cmn-card-needs")
    && /Your decision\s+The Commons mock-up, version 3/.test(txt(reqCard.querySelector(".cmn-card-ask")).replace(/\s+/g, " "))
    && reqCard.querySelector('.cmn-card-ask a[href="https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi"]'));
  check("the card's headline is the pair in one line with its meter",
    /11,625 of 20,282 complete at 113 colleges/.test(txt(reqCard.querySelector(".cmn-card-n")).replace(/\s+/g, " "))
    && reqCard.querySelector(".cmn-card-meter") && /57\.3%/.test(reqCard.querySelector(".cmn-card-meter i").style.width));
  const courseCard = t.d.querySelector('.cmn-card[data-card="course"]');
  check("Sheet 160 (S565): a card counts Confirmed by a person under its figure, beside the first pair and never in its place; a one-pair card adds no line",
    /^3,208 of 27,581/.test(txt(courseCard.querySelector(".cmn-card-n")).replace(/\s+/g, " "))
    && txt(courseCard.querySelector(".cmn-card-also")) === "957 confirmed by a person, 152 of them ready"
    && !reqCard.querySelector(".cmn-card-also"));
  check("Recently is the run log's latest change, cut to its first sentence; Next is its next step",
    /Recently\s+Glendale's 220 records loaded\.$/.test(txt(reqCard.querySelector(".cmn-card-lines p:nth-child(2)")).replace(/\s+/g, " "))
    && /Next\s+Hand Sam the Commons mock-up/.test(txt(reqCard.querySelector(".cmn-card-lines p:nth-child(3)")).replace(/\s+/g, " ")));
  check("the Programs card opens as CPL Pathways (Sam, 2026-10-21) and carries Decision record",
    txt(reqCard.querySelector('.cmn-card-links a[href="#program-requirements/list"]')) === "CPL Pathways" && txt(reqCard.querySelector(".cmn-record")) === "Decision record");
  const exCard = t.d.querySelector('.cmn-card[data-card="exhibit"]');
  check("a card with no run log reads In progress and Recently from its machine stamp", txt(exCard.querySelector(".cmn-pill")) === "In progress"
    && /Recently\s+The saving run and the fold, /.test(txt(exCard.querySelector(".cmn-card-lines")).replace(/\s+/g, " ")));
  const skCard = t.d.querySelector('.cmn-card[data-card="skills"]');
  check("a building card reads its status word with a count and no meter", txt(skCard.querySelector(".cmn-pill")) === "Starting"
    && /^26 credentials list their issuer's skills so far$/.test(txt(skCard.querySelector(".cmn-card-n")).replace(/\s+/g, " ")) && !skCard.querySelector(".cmn-card-meter")
    && txt(t.d.querySelector('.cmn-card[data-card="credentials"] .cmn-pill')) === "Building");
  const suCard = t.d.querySelector('.cmn-card[data-card="subjects"]');
  check("an unread card says Could not be read with the error, never a zero", txt(suCard.querySelector(".cmn-pill")) === "Could not be read"
    && /Could not be read/.test(txt(suCard.querySelector(".cmn-card-n"))) && /FileNotFoundError/.test(txt(suCard.querySelector(".cmn-card-n"))) && !/\b0\b/.test(txt(suCard.querySelector(".cmn-card-n"))));
  check("the decisions waiting on Sam lead the page, each naming its card", txt(t.d.querySelector(".cmn-band-h")) === "One decision waits on you"
    && /Common Programs: The Commons mock-up, version 3/.test(txt(t.d.querySelector(".cmn-band-list")).replace(/\s+/g, " ")));
  check("the lede counts the references and the sub line says when the figures were read",
    /^Eight common references the California Community Colleges keep together/.test(txt(t.d.querySelector(".cmn-lede"))) && /Figures read/.test(txt(t.d.querySelector(".cmn-sub"))));
  // the filter words last the visit and are never kept
  const filterOf = (k) => t.d.querySelector('.cmn-filter[data-show="' + k + '"]');
  check("the filter words are All eight, Needs you, Building, All pressed", txt(filterOf("all")) === "All eight" && filterOf("all").getAttribute("aria-pressed") === "true" && txt(filterOf("needs")) === "Needs you" && txt(filterOf("build")) === "Building");
  filterOf("needs").click();
  check("Needs you shows the one card with an open call and presses its word", cardKeys().join(",") === "requirements" && filterOf("needs").getAttribute("aria-pressed") === "true" && filterOf("all").getAttribute("aria-pressed") === "false");
  filterOf("build").click();
  check("Building shows the three being built", cardKeys().join(",") === "credentials,outcomes,skills");
  filterOf("all").click();
  check("the filter is not kept in storage (tabs never remember a filter, Sam 2026-10-21)", cards().length === 8 && !Object.keys(t.w.localStorage).some((k) => /filter|show/i.test(k)));
  // the details: the rows, one word away
  const detailsWord = t.d.getElementById("cmn-details-word"), details = t.d.getElementById("cmn-details");
  check("the rows sit under Details, hidden until asked, with aria-expanded on the word", details.hidden && detailsWord.getAttribute("aria-expanded") === "false" && detailsWord.getAttribute("aria-controls") === "cmn-details" && rows(t.d).length === 5);
  detailsWord.click();
  check("Details opens the rows and the word reads Hide details", !details.hidden && detailsWord.getAttribute("aria-expanded") === "true" && txt(detailsWord) === "Hide details");
  detailsWord.click();
  check("Hide details closes them", details.hidden && txt(detailsWord) === "Details");
  t.d.querySelector('.cmn-card[data-card="cr"] .cmn-record').click();
  check("a card's Decision record opens Details and moves focus to that row", !details.hidden && t.d.activeElement === byKey(t.d, "cr").querySelector("h3"));
  detailsWord.click();
  check("the foot says every reference is staging and Read the decision record is a word", /staging until faculty publish it/.test(txt(t.d.querySelector(".cmn-foot"))) && txt(t.d.getElementById("cmn-record-word")) === "Read the decision record");
  check("the tab's tokens and font are added once", t.d.querySelectorAll("#cmn-tokens").length === 1 && t.d.querySelectorAll("#cmn-font").length === 1 && /fonts\.googleapis\.com\/css2\?family=Inter/.test(t.d.getElementById("cmn-font").getAttribute("href")));

  const req = byKey(t.d, "requirements");
  check("the pair reads 11,625 of 20,282 with its words", /11,625\s*of\s*20,282\s*complete at 113 colleges/.test(txt(req.querySelector(".cmn-n")).replace(/\s+/g, " ")));
  check("the count opens the tab in place", req.querySelector(".cmn-n a").getAttribute("href") === "#program-requirements");
  const meter = req.querySelector(".cmn-meter");
  check("the meter carries the share and its label", meter && meter.getAttribute("role") === "img" && /57\.3%/.test(meter.querySelector("i").style.width) && /11,625 of 20,282/.test(meter.getAttribute("aria-label")));
  check("the test behind the count is a chip", txt(req.querySelector(".cmn-test")) === "machine-checked");
  check("a known issue carries its count, words and owner", /3,918 active programs whose record fails a check · the college's reading procedure/.test(cellText(req, "Known issues").replace(/\s+/g, " ")));
  check("a known issue's count opens the tab", req.querySelector(".cmn-cell a.cmn-count").getAttribute("href") === "#program-requirements");
  check("a settled procedure with a count and one without both draw", /114 reading procedures/.test(cellText(req, "Settled procedures")) && /A misread is fixed/.test(cellText(req, "Settled procedures")));
  check("the calls cell lists the run log's call with its sheet link", /1 open/.test(cellText(req, "Decision Sheet Library")) && req.querySelector('.cmn-cell a[href="https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi"]'));
  check("a call answered on its sheet stays listed with his words and leaves the open count (Sam, 2026-10-21)",
    /1 open/.test(cellText(req, "Decision Sheet Library")) && /Answered by Sam, 2026-10-21: Later: keep this on ice\./.test(cellText(req, "Decision Sheet Library")));
  check("a sheet link opens in a new tab", req.querySelector('.cmn-cell a[href^="https://"]').getAttribute("target") === "_blank");
  // Sam, 2026-11-01: "Change the Decisions Waiting on Sam label to Decision Sheet Library and bold the label that notes how
  // many I have waiting on me and if it's 0, make the 0 green. add a label over all the completed sheets called Completed
  // Decision Sheets and truncate the descriptive text with ... that can open for details if needed."
  const lib = Array.from(req.querySelectorAll(".cmn-cell h4")).find((h) => txt(h) === "Decision Sheet Library").parentNode;
  check("⭐ the cell reads Decision Sheet Library; its count is bold", !!lib && txt(lib.querySelector(".cmn-waiting")) === "1 open"
    && /\.cmn-waiting \.cmn-state \{ font-weight:700; \}/.test(t.d.getElementById("cmn-css") ? t.d.getElementById("cmn-css").textContent : t.d.head.textContent));
  const doneH = lib.querySelector(".cmn-done-h"), doneLi = lib.querySelectorAll(".cmn-done li");
  check("⭐ answered sheets sit under Completed Decision Sheets, one line each that opens", !!doneH && txt(doneH) === "Completed Decision Sheets"
    && doneLi.length === 1 && !!doneLi[0].querySelector("details > summary .cmn-done-line")
    && /The second reader .* · Answered by Sam, 2026-10-21: Later: keep this on ice\./.test(txt(doneLi[0].querySelector("summary")))
    && !!doneLi[0].querySelector('details a[href="https://claude.ai/artifact/RmbXT7Ay2955zcpg1hfHzu"]'));
  check("an open call stays listed in full above, outside Completed Decision Sheets",
    !!lib.querySelector('ul:not(.cmn-done) a[href="https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi"]') && !lib.querySelector("ul:not(.cmn-done) details"));
  const css = Array.from(t.d.querySelectorAll("style")).map((x) => x.textContent).join("\n");
  check("the tab spans the window: its main column and the wrap drop their caps (Sam, 2026-11-01)",
    /#tab-commons \.main-container \{ max-width:none;/.test(css) && !/\.cmn-wrap \{[^}]*max-width:1080px/.test(css)
    && /\.cmn-done-line \{[^}]*text-overflow:ellipsis/.test(css));
  const run = cellText(req, "Last run").replace(/\s+/g, " ");
  check("the machine stamp names what ran and reads on dispatch when it has no cadence", /Machine: the last college read, /.test(run) && /on dispatch · on dispatch/.test(run));
  check("the session stamp names the session that wrote the run log and reads current", /Session: S418 SkyMadrone wrote the run log, /.test(run) && /each checkpoint · current/.test(run));
  check("the next step is carried from the run log", /Next: Hand Sam the Commons mock-up/.test(run));

  const z = load({ fetch: responder({ "kb/status/commons.json": STATUS, "kb/status/program-requirements.json":
    Object.assign({}, PR_LOG, { calls: PR_LOG.calls.slice(1) }) }) });
  await z.M.boot();
  const zLib = Array.from(byKey(z.d, "requirements").querySelectorAll(".cmn-cell h4")).find((h) => txt(h) === "Decision Sheet Library").parentNode;
  check("⭐ with nothing waiting the count reads 0 open, the 0 green", txt(zLib.querySelector(".cmn-waiting")) === "0 open"
    && txt(zLib.querySelector(".cmn-waiting .cmn-zero")) === "0"
    && /\.cmn-waiting \.cmn-zero \{ color:var\(--hunter\); \}/.test(Array.from(z.d.querySelectorAll("style")).map((x) => x.textContent).join("\n")));

  const ex = byKey(t.d, "exhibit");
  check("a run log that fails to load says so in the calls cell", /Could not be read/.test(cellText(ex, "Decision Sheet Library")) && /404/.test(cellText(ex, "Decision Sheet Library")));
  check("a daily machine stamp inside 36 hours reads current", /daily · current/.test(cellText(ex, "Last run").replace(/\s+/g, " ")));
  check("two tests draw two chips", ex.querySelectorAll(".cmn-test").length === 2);

  const co = byKey(t.d, "course");
  check("a project with no run log says no run log", /Session: no run log/.test(cellText(co, "Last run").replace(/\s+/g, " ")) && /no run log/.test(cellText(co, "Decision Sheet Library")));
  check("a daily machine stamp older than 36 hours reads stale", /daily · stale/.test(cellText(co, "Last run").replace(/\s+/g, " ")));
  const coLinks = Array.from(co.querySelectorAll(".cmn-acts a"));
  check("the Course row's one link opens SkyView in a new tab (SkyView alone, Sam 20:46Z)",
    coLinks.length === 1 && txt(coLinks[0]) === "Open SkyView" && coLinks[0].getAttribute("target") === "_blank" && coLinks[0].getAttribute("href").endsWith("skyview.html"));

  const cr = byKey(t.d, "cr");
  check("a second pair line with no universe draws its count and words", cr.querySelectorAll(".cmn-n").length === 2 && /30 groups a curator decided/.test(txt(cr.querySelectorAll(".cmn-n")[1]).replace(/\s+/g, " ")));
  check("the meter reads the first pair only", cr.querySelectorAll(".cmn-meter").length === 1);

  const su = byKey(t.d, "subjects");
  check("a row whose reads failed says Could not be read with the error, never a zero", /Could not be read/.test(txt(su.querySelector(".cmn-n"))) && /FileNotFoundError/.test(txt(su.querySelector(".cmn-n"))) && !/\b0\b/.test(txt(su.querySelector(".cmn-n"))));
  check("an unread row draws no meter", !su.querySelector(".cmn-meter"));
  check("an unread row's machine stamp reads Could not be read", /Could not be read/.test(cellText(su, "Last run")));

  // glyphs and words
  const all = txt(t.root);
  check("no emoji or symbol glyph in the rendered text", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}✔✖▶▼]/u.test(all));
  check("every control is a button with a word", Array.from(t.d.querySelectorAll("button")).every(function (b) { return /^[A-Za-z][A-Za-z ]+$/.test(txt(b)); }));
  check("the fold words are named for their row", byKey(t.d, "cr").querySelector(".cmn-fold").getAttribute("aria-label") === "Collapse Common CR Reference");

  // the fold
  const fold = req.querySelector(".cmn-fold");
  check("every row starts expanded", rows(t.d).every(function (li) { return !li.querySelector(".cmn-detail").hidden && li.querySelector(".cmn-fold").getAttribute("aria-expanded") === "true"; }));
  fold.click();
  check("Collapse hides the detail and keeps the count and meter", req.querySelector(".cmn-detail").hidden && req.querySelector(".cmn-n") && req.querySelector(".cmn-meter") && !req.querySelector(".cmn-n").hidden);
  check("the word flips to Expand with aria-expanded false and its row's name", txt(fold) === "Expand" && fold.getAttribute("aria-expanded") === "false" && fold.getAttribute("aria-label") === "Expand Program Requirements" && fold.getAttribute("aria-controls") === "cmn-detail-requirements");
  check("the fold is kept in localStorage", t.w.localStorage.getItem("cplCommons.fold.v1") === JSON.stringify(["requirements"]));
  const foldAll = t.d.getElementById("cmn-foldall");
  check("with one row folded the top word reads Collapse all", txt(foldAll) === "Collapse all");
  foldAll.click();
  check("Collapse all folds every row and reads Expand all", rows(t.d).every(function (li) { return li.querySelector(".cmn-detail").hidden; }) && txt(foldAll) === "Expand all");
  foldAll.click();
  check("Expand all opens every row and reads Collapse all", rows(t.d).every(function (li) { return !li.querySelector(".cmn-detail").hidden; }) && txt(foldAll) === "Collapse all" && t.w.localStorage.getItem("cplCommons.fold.v1") === "[]");

  // the order
  check("Move up is disabled on the first row and Move down on the last", req.querySelector(".cmn-up").disabled && byKey(t.d, "subjects").querySelector(".cmn-down").disabled);
  byKey(t.d, "exhibit").querySelector(".cmn-up").click();
  check("Move up reorders and renumbers", rows(t.d).map(function (li) { return li.getAttribute("data-key"); }).join(",") === "exhibit,requirements,course,cr,subjects" && txt(byKey(t.d, "exhibit").querySelector(".cmn-pos")) === "1");
  check("the order is kept in localStorage", t.w.localStorage.getItem("cplCommons.order.v1") === JSON.stringify(["exhibit", "requirements", "course", "cr", "subjects"]));
  t.d.getElementById("cmn-reset").click();
  check("Back to the starting order restores the file's order", rows(t.d).map(function (li) { return li.getAttribute("data-key"); }).join(",") === "requirements,exhibit,course,cr,subjects");

  // a second visit reads the kept order and fold back
  const t2 = load();
  t2.w.localStorage.setItem("cplCommons.order.v1", JSON.stringify(["cr", "subjects", "nope"]));
  t2.w.localStorage.setItem("cplCommons.fold.v1", JSON.stringify(["cr", "course"]));
  await t2.M.boot();
  check("a kept order applies, unknown keys ignored, the rest in the file's order", rows(t2.d).map(function (li) { return li.getAttribute("data-key"); }).join(",") === "cr,subjects,requirements,exhibit,course");
  check("a kept fold applies and the top word still reads Collapse all", byKey(t2.d, "cr").querySelector(".cmn-detail").hidden && byKey(t2.d, "course").querySelector(".cmn-detail").hidden && !byKey(t2.d, "exhibit").querySelector(".cmn-detail").hidden && txt(t2.d.getElementById("cmn-foldall")) === "Collapse all");

  // storage refused: the tab still draws
  const t3 = load({ noStorage: true });
  let threw = false;
  try { await t3.M.boot(); } catch (e) { threw = true; }
  check("a browser that refuses storage still gets the page", !threw && rows(t3.d).length === 5);

  // the status file fails to load
  const t4 = load({ fetch: responder({}) });
  await t4.M.boot();
  check("a status file that cannot be read says so and names the file", /could not be read/.test(txt(t4.root)) && /commons\.json answered 404/.test(txt(t4.root)));
  const t5 = load({ fetch: responder({ "kb/status/commons.json": { schema: 1, nope: true } }) });
  await t5.M.boot();
  check("a file that is not the Commons' status file is refused", /is not the Commons' status file/.test(txt(t5.root)));

  // the shared module missing
  const t6 = load({ noModule: true });
  await t6.M.boot();
  check("without commons_progress.js the tab says so instead of drawing", /commons_progress\.js\) could not be loaded/.test(txt(t6.root)) && rows(t6.d).length === 0);

  // ── a to-do closes from the Commons (Sam, 2026-11-02: "There is one decision in the queue that doesn't give me a way
  //    to close it, just links to review.") ──
  {
    const TODO = { title: "Glendale is parked: what would turn it back on", text: "Send a structured export.",
      view: { href: "#program-requirements", text: "Open Program records" }, todo_id: "glendale-parked-2026-10-30" };
    const LOG2 = Object.assign({}, PR_LOG, { calls: [TODO] });
    const SESSION = { get: () => ({ email: "slee@cccco.edu", access_token: "h.p.s" }), isFresh: () => true,
      authHeaders: (x) => Object.assign({ apikey: "anon", Authorization: "Bearer h.p.s" }, x || {}) };
    const posts = [];
    const base = responder({ "kb/status/commons.json": STATUS, "kb/status/program-requirements.json": LOG2 });
    const withMarks = (marks) => function (url, init) {
      url = String(url);
      if (/\/rest\/v1\/queue_todo_done\?/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(marks) });
      if (/\/rpc\/queue_todo_done_add$/.test(url)) { posts.push(JSON.parse(init.body));
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ by_email: "slee@cccco.edu" }) }); }
      return base(url);
    };
    // marked done on Program Requirements: the Commons reads the mark, and the call leaves the band
    const a = load({ fetch: withMarks([{ project: "program-requirements", todo_id: TODO.todo_id, note: "Let's keep going with Glendale.",
      reopen: false, by_email: "slee@cccco.edu", at: "2026-11-02T22:55:11Z" }]) });
    a.w.CPL_SESSION = SESSION;
    await a.M.boot();
    check("todo 1: a to-do marked done on Program Requirements no longer waits in the Commons band",
      !a.d.querySelector(".cmn-band") && /Marked done: Let's keep going with Glendale\./.test(txt(a.root)));
    // still open, signed in: Mark done sits beside it in the band and writes through the one RPC
    const b = load({ fetch: withMarks([]) });
    b.w.CPL_SESSION = SESSION;
    await b.M.boot();
    const band = b.d.querySelector(".cmn-band");
    const det = band && band.querySelector(".cmn-todo-det");
    check("todo 2: an open to-do in the band offers Mark done, with a note box", !!det && txt(det.querySelector("summary")) === "Mark done" && !!det.querySelector("textarea"));
    det.querySelector("textarea").value = "Glendale's curriculum office will send the export.";
    det.querySelector("button").dispatchEvent(new b.w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    check("todo 3: Mark done writes the project, the to-do and the note through rpc/queue_todo_done_add",
      posts.length === 1 && posts[0].p_project === "program-requirements" && posts[0].p_todo_id === TODO.todo_id &&
      posts[0].p_note === "Glendale's curriculum office will send the export." && posts[0].p_reopen === false);
    check("todo 4: once saved, the call leaves the band and the count", !b.d.querySelector(".cmn-band"));
    // signed out: the band says where to sign in, and reads no marks
    const c = load({ fetch: withMarks([]) });
    await c.M.boot();
    check("todo 5: signed out, the to-do says Mark done takes a reviewer sign-in, not the team phrase, and offers no Mark done",
      /Mark done takes a reviewer sign-in, the emailed link; the team phrase does not carry it/.test(txt(c.d.querySelector(".cmn-band"))) && !c.d.querySelector(".cmn-todo-det"));
    // Sam's recording, 2026-11-06: the header read Signed in, the card read a lapsed token as signed out. A reviewer
    // whose token lapsed and can renew keeps Mark done; the save renews the token first.
    const lapsed = load({ fetch: withMarks([]) });
    lapsed.w.CPL_SESSION = Object.assign({}, SESSION, { get: () => ({ email: "slee@cccco.edu", refresh_token: "r" }), isFresh: () => false });
    await lapsed.M.boot();
    check("todo 6: a lapsed reviewer token that can renew still offers Mark done", !!lapsed.d.querySelector(".cmn-band .cmn-todo-det"));
    // ...and reads the marks after renewing: Sam's Monterey mark (2026-11-06) saved on CPL Pathways but never left the band.
    let renewed = 0;
    const lapsedDone = load({ fetch: withMarks([{ project: "program-requirements", todo_id: TODO.todo_id, note: "keep going", reopen: false,
      by_email: "slee@cccco.edu", at: "2026-11-06T19:29:50Z" }]) });
    lapsedDone.w.CPL_SESSION = Object.assign({}, SESSION, { get: () => ({ email: "slee@cccco.edu", refresh_token: "r" }), isFresh: () => false,
      ensureFresh: () => { renewed++; return Promise.resolve({ email: "slee@cccco.edu", access_token: "h.p.s" }); } });
    await lapsedDone.M.boot();
    check("todo 6b: a lapsed token renews, the marks are read, and a to-do marked done on CPL Pathways leaves the band",
      renewed >= 1 && !lapsedDone.d.querySelector(".cmn-band") && /Marked done: keep going/.test(txt(lapsedDone.root)));
    const dead = load({ fetch: withMarks([]) });
    dead.w.CPL_SESSION = Object.assign({}, SESSION, { get: () => ({ email: "slee@cccco.edu" }), isFresh: () => false });
    await dead.M.boot();
    check("todo 7: a lapsed token with no way to renew does not", !dead.d.querySelector(".cmn-band .cmn-todo-det"));
    // The keeper's renewal announcement re-reads the marks, so a mark saved elsewhere reaches the band without a reload.
    let marksNow = [];
    const late = load({ fetch: function (url, init) { return withMarks(marksNow)(url, init); } });
    late.w.CPL_SESSION = SESSION;
    await late.M.boot();
    const before = !!late.d.querySelector(".cmn-band");
    marksNow = [{ project: "program-requirements", todo_id: TODO.todo_id, note: "keep going", reopen: false, by_email: "slee@cccco.edu", at: "2026-11-06T19:29:50Z" }];
    late.w.dispatchEvent(new late.w.CustomEvent("cpl-session-changed", { detail: { signedIn: true } }));
    await new Promise((r) => setTimeout(r, 40));
    check("todo 8: a renewed sign-in re-reads the marks and the marked call leaves the band", before && !late.d.querySelector(".cmn-band"));
  }

  // the one queue (Sam, 2026-11-04, S573): what waits on a person, by reason, and what the routines carry
  {
    const Q = { reasons: [
        { key: "no_procedure", items: [{ ref: "cr", title: "Common CR Reference", n: 1883, words: "wordings no rule places", owner: "a curator", open: "#cr-reference/open" }] },
        { key: "unsure", items: [{ ref: "exhibit", title: "Common Exhibit Reference", n: null, words: "titles held for a person", owner: "a curator", open: "#exhibits/held", error: "E" }] },
        { key: "reaches", items: [] },
        { key: "keep_call", items: [{ ref: "exhibit", title: "Common Exhibit Reference", n: 622, words: "titles in the reference that have left MAP", owner: "a curator", open: "#credential-reference/all" }] }],
      carried: [{ ref: "requirements", title: "Program Requirements", n: 3349, words: "active programs with no record yet", owner: "the harvest", open: "#program-requirements/list/unread" }] };
    const withQ = JSON.parse(JSON.stringify(STATUS)); withQ.queue = Q;
    const q = load({ fetch: responder({ "kb/status/commons.json": withQ, "kb/status/program-requirements.json": PR_LOG }) });
    await q.M.boot();
    const sec = q.d.querySelector(".cmn-queue");
    check("queue 1: the section draws, headed Waiting on a person, labelled by its heading",
      sec && txt(sec.querySelector("#cmn-queue-h")) === "Waiting on a person" && sec.getAttribute("aria-labelledby") === "cmn-queue-h");
    check("queue 2: one box per reason, in the file's order, each with its plain words",
      Array.prototype.map.call(sec.querySelectorAll(".cmn-reason"), function (b) { return b.getAttribute("data-reason"); }).join() === "no_procedure,unsure,reaches,keep_call"
      && txt(sec.querySelector('[data-reason="no_procedure"] .cmn-reason-h')) === "No procedure covers it yet");
    const first = sec.querySelector('[data-reason="no_procedure"] li');
    check("queue 3: an item names its card's Common name, links its count and keeps its words",
      /^Common Credit Recommendations: 1,883 wordings no rule places$/.test(txt(first)) && first.querySelector("a").getAttribute("href") === "#cr-reference/open");
    check("queue 4: an unread count reads Could not be read, never a zero",
      /Could not be read/.test(txt(sec.querySelector('[data-reason="unsure"] li'))) && !/: 0 /.test(txt(sec)));
    check("queue 5: an empty reason says Nothing waits here",
      txt(sec.querySelector('[data-reason="reaches"] .cmn-quiet')) === "Nothing waits here.");
    check("queue 6: the routines' items sit apart, under The routines carry, never in a reason box",
      /The routines carry/.test(txt(sec.querySelector(".cmn-carried"))) && /3,349 active programs with no record yet/.test(txt(sec.querySelector(".cmn-carried")))
      && !/no record yet/.test(Array.prototype.map.call(sec.querySelectorAll(".cmn-reason"), txt).join(" ")));
    check("queue 7: the queue sits after the decisions band and before the filter words",
      (function () { const kids = Array.prototype.slice.call(q.d.querySelector(".cmn-wrap").children);
        const iq = kids.indexOf(sec), ib = kids.indexOf(q.d.querySelector(".cmn-band")), iff = kids.indexOf(q.d.querySelector(".cmn-filter-row"));
        return iq > ib && iq < iff; })());
    check("queue 8: the queue's words name no person and carry no glyph",
      !/Sam/.test(txt(sec)) && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}✔✖▶▼]/u.test(txt(sec)));
    check("queue 9: a status file with no queue draws no queue section", !t.d.querySelector(".cmn-queue"));
    const unsorted = q.M.queueSection({ reasons: [], unsorted: [{ ref: "x", title: "X", n: 2, words: "a new issue", open: null }] });
    check("queue 10: an unsorted issue shows under Not yet sorted, so it cannot hide",
      txt(unsorted.querySelector('[data-reason="unsorted"] .cmn-reason-h')) === "Not yet sorted");
  }

  // the confidence count (Sam, 2026-11-04, S573): what a person did with each procedure's work afterward
  {
    const C = [
      { ref: "exhibit", unit: "titles", total: { placed: 1178, untouched: 1047, kept: 23, renamed: 71, moved: 0, by_procedure: 24, left: 13, looked: 94 },
        procedures: [{ name: "classifier", placed: 890, untouched: 807, kept: 4, renamed: 53, moved: 0, by_procedure: 19, left: 7, looked: 57 }] },
      { ref: "subjects", unit: "picks", total: { placed: 13, untouched: 13, kept: 0, renamed: 0, moved: 0, by_procedure: 0, left: 0, looked: 0 },
        procedures: [{ name: "confirm-authority", placed: 13, untouched: 13, kept: 0, renamed: 0, moved: 0, by_procedure: 0, left: 0, looked: 0 }] },
      { ref: "cr", error: "FileNotFoundError: x" }];
    const withC = JSON.parse(JSON.stringify(STATUS)); withC.confidence = C;
    const c = load({ fetch: responder({ "kb/status/commons.json": withC, "kb/status/program-requirements.json": PR_LOG }) });
    await c.M.boot();
    const sec = c.d.querySelector(".cmn-conf");
    check("confidence 1: the section draws, headed How far to trust the procedures", sec && txt(sec.querySelector("#cmn-conf-h")) === "How far to trust the procedures");
    check("confidence 2: a reference's line says how many a person looked at and what they did",
      /A person has looked at 94 of 1,178: 23 kept, 71 renamed with their family, 0 moved elsewhere\. 24 later revised by another procedure; 13 left the reference\./.test(txt(sec)));
    check("confidence 3: a reference no person has looked at says so", /No person has looked at any of the 13 yet\./.test(txt(sec)));
    const th = sec.querySelector("table").querySelectorAll("thead th");
    check("confidence 4: each table names its columns with th scope=col, its rows with th scope=row",
      th.length === 7 && Array.prototype.every.call(th, function (h) { return h.getAttribute("scope") === "col"; })
      && sec.querySelector("tbody th").getAttribute("scope") === "row" && txt(sec.querySelector("tbody th")) === "the classifier");
    check("confidence 5: the table scrolls in its own labelled region", sec.querySelector(".cmn-conf-wrap").getAttribute("role") === "region"
      && /Common Exhibits: each procedure/.test(sec.querySelector(".cmn-conf-wrap").getAttribute("aria-label")));
    check("confidence 6: an unread source reads Could not be read, never a zero", /Common Credit Recommendations[\s\S]*Could not be read/.test(txt(sec)));
    check("confidence 7: the section sits after the queue's place and names no person", !/Sam/.test(txt(sec)) && !t.d.querySelector(".cmn-conf"));
  }

  // the next batch, the learning line, the folds and Complete (Sam's Commons rulings, 2026-11-08, #2921; S604)
  {
    const C = [{ ref: "exhibit", unit: "titles", total: { placed: 1201, untouched: 1098, kept: 23, renamed: 80, moved: 0, by_procedure: 24, left: 0, looked: 103 },
      procedures: [{ name: "classifier", placed: 896, untouched: 820, kept: 4, renamed: 53, moved: 0, by_procedure: 19, left: 0, looked: 57 }] }];
    const withB = JSON.parse(JSON.stringify(STATUS));
    withB.confidence = C;
    withB.next_batch = { kind: "another-look", n: 6, of: 6, open: "#exhibits/another-look/batch", title: "Another look at 6 exhibit titles",
      teaches: "Keep what works, correct what does not; each answer teaches the next nightly sweep.", stop: "The batch ends when its cards are decided." };
    withB.queue = { reasons: [{ key: "no_procedure", items: [{ ref: "cr", title: "Common CR Reference", n: 1883, words: "wordings no rule places", owner: "a curator", open: "#cr-reference/open" }] }],
      carried: [{ ref: "requirements", title: "Program Requirements", n: 3339, words: "active programs with no record yet", owner: "the harvest", open: "#program-requirements/list/unread" }] };
    const sub = withB.rows.filter(function (r) { return r.key === "subjects"; })[0];
    sub.pair = [{ n: 147, of: 147, words: "disciplines with a Common SUBJ", open: "#canonical-subj4" }];
    const b = load({ fetch: responder({ "kb/status/commons.json": withB, "kb/status/program-requirements.json": PR_LOG }) });
    await b.M.boot();
    const nb = b.d.querySelector(".cmn-next");
    const kids = Array.prototype.slice.call(b.d.querySelector(".cmn-wrap").children);
    check("batch 1: the page opens on Your next batch, before the decisions band and the queue",
      nb && kids.indexOf(nb) === 1 && (!b.d.querySelector(".cmn-band") || kids.indexOf(nb) < kids.indexOf(b.d.querySelector(".cmn-band")))
      && kids.indexOf(nb) < kids.indexOf(b.d.querySelector(".cmn-queue")));
    check("batch 2: it names the batch, what the answers teach and when to stop",
      txt(nb.querySelector("#cmn-next-h")) === "Another look at 6 exhibit titles" && /teaches the next nightly sweep/.test(txt(nb))
      && /6 cards as of last night's sweep; Start counts again\. The batch ends when its cards are decided\./.test(txt(nb)) && nb.getAttribute("aria-labelledby") === "cmn-next-h");
    const start = nb.querySelector("a.cmn-start");
    check("batch 3: Start is a plain word that opens Another look in Exhibits, never a second card screen",
      start && txt(start) === "Start" && start.getAttribute("href") === "#exhibits/another-look/batch" && !b.d.querySelector(".cmn-next button"));
    // COBIx on #2921 (2026-11-09 03:12Z, ask 1d): a file with no batch says so, where the hero had vanished until the run.
    {
      const nob = load();
      await nob.M.boot();
      const un = nob.d.querySelector("#cmn-next-sec");
      check("batch 4: a file carrying no batch reads Your next batch could not be read, never an empty page",
        un && txt(un.querySelector("#cmn-next-h")) === "Your next batch could not be read" && !un.querySelector("a.cmn-start")
        && b.M.batchList({ next_batch: { error: "x" } }) === null && b.M.batchList({ batches: [] }).length === 0);
    }

    // #2963 step 1 (COBIx on #2921, 2026-11-09 12:10Z): the batch closes in place and the next one comes up.
    {
      const SESS = { get: () => ({ email: "slee@cccco.edu", access_token: "h.p.s" }), isFresh: () => true,
        authHeaders: (x) => Object.assign({ apikey: "anon", Authorization: "Bearer h.p.s" }, x || {}) };
      const six = [1, 2, 3, 4, 5, 6].map(function (i) { return { id: "c" + i, current: "Title " + i, keys: ["_UNCLASSIFIED::local " + i] }; });
      const AL = { kind: "another-look", n: 6, of: 6, open: "#exhibits/another-look/batch", title: "Another look at 6 exhibit titles",
        teaches: "Keep what works.", stop: "The batch ends when its cards are decided.", cards: six, at: "2026-11-07T15:03:25Z" };
      const DEC = { kind: "decision", project: "program-requirements", n: 1, title: "The Commons mock-up, version 3, waits on Sam's look",
        teaches: "Look at the mock.", open: "https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi", stop: "It ends when you answer the sheet." };
      const ANS = { kind: "decision", project: "program-requirements", n: 1, title: "The second reader waits on a new xAI subscription",
        open: "https://claude.ai/artifact/RmbXT7Ay2955zcpg1hfHzu" };
      const JOB = { kind: "job", ref: "course", n: 8, title: "Common Course Reference", words: "cards whose catalog description reads as another discipline",
        teaches: "Sam (rule on each and say why)", open: "#coci-lookup/list/doubt" };
      const withList = function (list) { const x = JSON.parse(JSON.stringify(STATUS)); x.batches = list; x.next_batch = list[0] || null; return x; };
      const reads = [];
      const saved = function (n, extra) { return six.slice(0, n).map(function (c, i) {
        return i % 2 ? { course_id: c.keys[0], field: "unified_title_supersedes", value: c.current, reviewed_at: "2026-11-09T12:00:00Z" }
                     : { course_id: c.keys[0], field: "title_sweep_kept", value: "true", reviewed_at: "2026-11-09T12:00:00Z" }; }).concat(extra || []); };
      const fetcher = function (status, rowsFor) {
        const base = responder({ "kb/status/commons.json": status, "kb/status/program-requirements.json": PR_LOG });
        return function (url, init) {
          url = String(url);
          if (/\/rest\/v1\/kb_curation\?/.test(url)) { reads.push(url); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(rowsFor()) }); }
          if (/\/rest\/v1\/queue_todo_done\?/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
          return base(url, init);
        };
      };
      const boot = async function (status, rowsFor, ex) {
        const x = load({ fetch: fetcher(status, rowsFor) });
        x.w.CPL_SESSION = SESS;
        if (ex) x.w.CPL_EXHIBITS = ex;
        await x.M.boot();
        return x;
      };
      const hero = function (x) { return x.d.querySelector("#cmn-next-sec"); };

      // all six saved since the sweep was built: the batch reads done and the open decision comes up
      let n = 6;
      const all = await boot(withList([AL, ANS, DEC, JOB]), function () { return saved(n); });
      const h1 = hero(all);
      check("docket 1: six saves since the sweep close the batch on the spot, and say what it taught",
        /Done: you decided 6 of 6 exhibit titles\. The nightly sweep learns from them tonight\./.test(txt(h1))
        && h1.querySelector(".cmn-next-done").getAttribute("role") === "status");
      check("docket 2: the next batch is the first decision still open; an answered one is passed over",
        h1.getAttribute("data-kind") === "decision" && txt(h1.querySelector("#cmn-next-h")) === DEC.title
        && /One decision, on its sheet\. It ends when you answer the sheet\./.test(txt(h1)));
      const st = h1.querySelector("a.cmn-start");
      check("docket 3: its Start opens the sheet in a new tab", st && st.getAttribute("href") === DEC.open && st.getAttribute("target") === "_blank"
        && st.getAttribute("rel") === "noopener");
      check("docket 4: the count reads the saves the way Exhibits reconciles them: both fields, since the sweep, the six keys",
        reads.length === 1 && /field=in\.\(title_sweep_kept,unified_title_supersedes\)/.test(reads[0])
        && reads[0].indexOf("reviewed_at=gt." + encodeURIComponent(AL.at)) > 0 && (reads[0].match(/_UNCLASSIFIED/g) || []).length === 6);

      // two saved, and a fold onto some other title does not count
      n = 2;
      const part = await boot(withList([AL, DEC]), function () { return saved(n, [{ course_id: six[3].keys[0], field: "unified_title_supersedes", value: "Elsewhere" }]); });
      check("docket 5: a part-decided batch stays the hero and says how far along it is",
        hero(part).getAttribute("data-kind") === "another-look" && /2 of 6 decided\./.test(txt(hero(part))) && !part.d.querySelector(".cmn-next-done"));

      // the visit's own decisions in Exhibits count before any save is read back, and a visit back redraws without a reload
      reads.length = 0; n = 0;
      const ex = { _state: { sw: { done: {} } } };
      const visit = await boot(withList([AL, JOB]), function () { return saved(n); }, ex);
      check("docket 6: before any card is decided the batch is the hero", hero(visit).getAttribute("data-kind") === "another-look");
      six.forEach(function (c) { ex._state.sw.done[c.id] = true; });
      visit.w.dispatchEvent(new visit.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
      await new Promise(function (r) { setTimeout(r, 20); });
      const h6 = hero(visit);
      check("docket 7: deciding every card in Exhibits brings the next batch on the way back, without a reload",
        /Done: you decided 6 of 6/.test(txt(h6)) && h6.getAttribute("data-kind") === "job"
        && txt(h6.querySelector("#cmn-next-h")) === "8 cards whose catalog description reads as another discipline"
        && h6.querySelector("a.cmn-start").getAttribute("href") === "#coci-lookup/list/doubt" && !h6.querySelector("a.cmn-start").getAttribute("target"));

      // nothing left: the page says so plainly
      n = 6;
      const none = await boot(withList([AL, ANS]), function () { return saved(n); });
      check("docket 8: when every batch is decided the page says so plainly, with no Start",
        txt(hero(none).querySelector("#cmn-next-h")) === "Nothing waits on you in a batch" && !hero(none).querySelector("a.cmn-start"));
      const empty = await boot(withList([]), function () { return []; });
      check("docket 9: an empty list draws nothing to start", !hero(empty) || !hero(empty).querySelector("a.cmn-start"));

      // a failed read leaves the file's count: the batch stays open rather than closing on a guess
      const failing = load({ fetch: function (url, init) {
        url = String(url);
        if (/kb_curation/.test(url)) return Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error("500")) });
        return fetcher(withList([AL, DEC]), function () { return []; })(url, init); } });
      failing.w.CPL_SESSION = SESS;
      await failing.M.boot();
      check("docket 10: a failed read of the saves leaves the batch open, never closed on a guess",
        hero(failing).getAttribute("data-kind") === "another-look" && !failing.d.querySelector(".cmn-next-done"));
    }
    const learn = b.d.querySelector(".cmn-learn");
    check("learn 1: the learning line counts what people did, from the confidence count, and calls the rest unchecked",
      /The procedures placed 1,201 exhibit titles\. A person checked 103 and moved 0 elsewhere\. The rest are unchecked, not proven\./.test(txt(learn)));
    check("learn 2: its word opens the trust table", (function () {
      const f = b.d.getElementById("cmn-conf-fold"); const was = f.open; learn.querySelector("button.cmn-word").click(); return !was && f.open; })());
    const q = b.d.querySelector(".cmn-queue:not(.cmn-conf)");
    check("fold 1: the pools sit behind one word, closed, and say how many they hold",
      q.querySelector("details.cmn-fold") && !q.querySelector("details.cmn-fold").open
      && /Show the 1,883 items in the pools, and what the routines carry/.test(txt(q.querySelector("summary"))));
    const b2 = load({ fetch: responder({ "kb/status/commons.json": withB, "kb/status/program-requirements.json": PR_LOG }) });
    await b2.M.boot();
    check("fold 2: the trust table starts closed", b2.d.getElementById("cmn-conf-fold") && !b2.d.getElementById("cmn-conf-fold").open);
    const subj = b.d.querySelector('.cmn-card[data-card="subjects"]');
    check("complete 1: a reference whose headline pair is all done reads Complete, with its own pill",
      subj && txt(subj.querySelector(".cmn-pill")) === "Complete" && subj.querySelector(".cmn-pill-done"));
    check("complete 2: one still in progress does not", !/Complete/.test(txt(b.d.querySelector('.cmn-card[data-card="requirements"] .cmn-pill'))));
    check("batch 5: the new words carry no glyph", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}✔✖▶▼]/u.test(txt(nb) + txt(learn)));
  }

  // every view has an address (2026-11-04): #commons/<needs|build> opens that filter word; the view reports it back
  {
    const pressed = (x) => { const b = x.d.querySelector(".cmn-filter[aria-pressed=\"true\"]"); return b && b.getAttribute("data-show"); };
    const keysOf = (x) => Array.from(x.d.querySelectorAll(".cmn-card")).map((c) => c.getAttribute("data-card"));
    const ask = (x) => { x.w.CPL_SESSION.stashReturnTab("commons"); return (JSON.parse(x.w.localStorage.getItem("cpl_sb_return_tab")) || {}).tab; };
    const a = load({ hash: "#commons/needs", session: true });
    await a.M.boot();
    check("address 1: #commons/needs opens on Needs you", pressed(a) === "needs" && keysOf(a).join(",") === "requirements");
    check("address 2: the view reports commons/needs", ask(a) === "commons/needs");
    a.d.querySelector('.cmn-filter[data-show="build"]').click();
    check("address 3: switched to Building, the view reports commons/build", ask(a) === "commons/build");
    a.d.querySelector('.cmn-filter[data-show="all"]').click();
    check("address 4: All reports the bare commons", ask(a) === "commons");
    const b = load({ hash: "#commons", session: true });
    await b.M.boot();
    check("address 5: the bare #commons opens on All, as before", pressed(b) === "all" && keysOf(b).length === 8 && ask(b) === "commons");
    const c = load({ hash: "#commons/nonsense", session: true });
    await c.M.boot();
    check("address 6: an unknown word leaves All", pressed(c) === "all");
    // a later visit on an address that names a filter opens it
    b.w.history.replaceState(null, "", "#commons/build");
    b.w.dispatchEvent(new b.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
    check("address 7: a later visit on #commons/build redraws on Building", pressed(b) === "build" && keysOf(b).join(",") === "credentials,outcomes,skills");
    check("address 8: nothing about the view is stored", !Object.keys(b.w.localStorage).some((k) => /filter|show|view/i.test(k)));
  }

  // the states, on their own
  const M = t.M;
  check("machineState: no stamp is Could not be read", M.machineState({}, NOW).key === "unread" && M.machineState(null, NOW).word === "Could not be read");
  check("machineState: inside 1.5 cadences is current, past it stale", M.machineState({ at: "2026-10-18T00:00:00Z", every_hours: 24 }, NOW).key === "ok" && M.machineState({ at: "2026-10-17T11:00:00Z", every_hours: 24 }, NOW).key === "stale");
  check("machineState: no cadence reads on dispatch", M.machineState({ at: "2026-09-01T00:00:00Z", every_hours: null }, NOW).word === "on dispatch");
  check("sessionState: within a week current, past it stale, none is no run log, an error Could not be read",
    M.sessionState({ written_at: "2026-10-13T00:00:00Z" }, null, NOW).key === "ok" && M.sessionState({ written_at: "2026-10-01T00:00:00Z" }, null, NOW).key === "stale"
    && M.sessionState(null, null, NOW).word === "no run log" && M.sessionState(null, "x answered 404", NOW).word === "Could not be read");
  check("cadenceWords: daily, weekly, every 12 hours, on dispatch", M.cadenceWords(24) === "daily" && M.cadenceWords(168) === "weekly" && M.cadenceWords(12) === "every 12 hours" && M.cadenceWords(null) === "on dispatch");
  check("the CSS is injected once", t.d.querySelectorAll("#cmn-css").length === 1);

  // Sam's recording, 2026-11-06: a completed sheet's line widened its Details cell past Last run and the card (the page
  // measured 3,414px in a 1,920px window). Each Details list is one shrinking column, so the line cuts with its ellipsis.
  check("Details lists are one shrinking column: a completed sheet's line cuts, never widens the cell",
    /"\.cmn-done \{[^"]*grid-template-columns:minmax\(0, 1fr\)/.test(src) && /"\.cmn-cell \{ grid-template-columns:minmax\(0, 1fr\); \}"/.test(src)
    && /"\.cmn-done li, \.cmn-done details, \.cmn-done summary \{ min-width:0; \}"/.test(src)
    && /"\.cmn-done-line \{[^"]*white-space:nowrap; text-overflow:ellipsis/.test(src));
  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
