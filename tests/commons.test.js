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
      pair: [{ n: 3208, of: 27581, words: "cards the auditor scores 0.85 or better", open: "#unified-courses" }], tests: ["scored by the auditor"],
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
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = opts.fetch || responder({ "kb/status/commons.json": STATUS, "kb/status/program-requirements.json": PR_LOG });
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
  check("Recently is the run log's latest change, cut to its first sentence; Next is its next step",
    /Recently\s+Glendale's 220 records loaded\.$/.test(txt(reqCard.querySelector(".cmn-card-lines p:nth-child(2)")).replace(/\s+/g, " "))
    && /Next\s+Hand Sam the Commons mock-up/.test(txt(reqCard.querySelector(".cmn-card-lines p:nth-child(3)")).replace(/\s+/g, " ")));
  check("the Programs card opens as CPL Pathways (Sam, 2026-10-21) and carries Decision record",
    txt(reqCard.querySelector('.cmn-card-links a[href="#program-requirements"]')) === "CPL Pathways" && txt(reqCard.querySelector(".cmn-record")) === "Decision record");
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

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
