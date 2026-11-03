// The Exhibits tab's Progress view: the reference opened, in the CPL Commons mock's shape.
//
// Sam locked the CPL Commons mock on 2026-11-02 (S552), the Exhibits artboard with it
// (CPLBrain/04-projects/cpl-initiative/catalog-commons-mock/Exhibits.dc.html): a progress line, Needs attention with an
// action each, and the three questions, every count over one denominator. The page is drawn by the Commons' shared
// renderer (commons_page.js) so the other references can take it next. Guarded here:
//   - the shared renderer: its spec in, the page out; a count the reads could not supply says "Could not be read",
//     never a zero (the S343 rule); a zero-count item leaves Needs attention; controls are words; tokens only;
//   - the Exhibits host: Progress is the first view and #exhibits/progress opens it, while the tab still opens on
//     Review (Sam's Sheet 147); the headline is the Commons row's pair, a title with a review stamp (his keep on Sheets
//     107 and 108); the three questions read the same counts as the Credentials view's tiles, over one denominator;
//     Needs attention lists the row's known issues and the tab's own queues, each with an action that opens its place;
//   - the Commons card for the reference opens this view.
//
// Run from repo root: `node tests/exhibits_progress_page.test.js` (or `npm test`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
/* The text a reader sees, a space between an element's parts, whitespace folded. */
function txt(el) {
  if (!el) return "";
  const parts = [], walk = el.ownerDocument.createTreeWalker(el, 4);
  while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
  return parts.join(" ").replace(/\s+/g, " ").replace(/ ([.,:])/g, "$1").trim();
}

const pageSrc = fs.readFileSync("commons_page.js", "utf8");
const src = fs.readFileSync("exhibits.js", "utf8");

// ───────────────────────────── static ─────────────────────────────
const cssBlock = pageSrc.slice(pageSrc.indexOf("function css(p)"), pageSrc.indexOf("function ensureCss"));
check("the shared renderer names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(cssBlock));
check("controls are underlined words, 24px tall", /button\." \+ p \+ "w \{ all:unset; cursor:pointer; min-height:24px;[^}]*text-decoration:underline/.test(cssBlock));
check("the three groups fold to one column on a narrow window", /@media \(max-width: 980px\) \{ " \+ s \+ "groups \{ grid-template-columns:minmax\(0, 1fr\); \} \}/.test(cssBlock));
check("the Commons card for the reference opens the Progress view",
  /"links": \[\{"href": tab \+ "\/progress", "text": "Open Exhibits"\}\]/.test(fs.readFileSync("kb/_build_commons_status.py", "utf8")));
check("no figure is copied into the host", !/\b(2,?457|5,?493|2,?644|2,?639|1,?605)\b/.test(src.slice(src.indexOf("function progressSpec"), src.indexOf("function renderProgress"))));

// ───────────────────────────── the shared renderer alone ─────────────────────────────
(function () {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", { runScripts: "dangerously" });
  const w = dom.window, d = w.document;
  const s = d.createElement("script"); s.textContent = pageSrc; d.body.appendChild(s);
  let went = 0;
  const node = w.CPL_COMMONS_PAGE.render({
    label: "Common Test Reference", lede: "A test.", read: "Figures read today.", status: "In progress",
    links: [{ words: "How it is kept", go: function () { went++; } }],
    progress: { n: 25, of: 100, words: "things done", recently: "Recently: a thing.", calls: "No decisions wait on Sam." },
    attention: { items: [{ n: 3, words: "things to fix.", action: { words: "Fix them", go: function () { went += 10; } } },
      { n: 0, words: "things that need nothing." }, { n: null, words: "things whose read failed." }], next: "Do the next thing." },
    groups: [{ q: "Q1?", rows: [{ label: "Has a name", n: 40 }, { label: "Unread", n: null }] }, { q: "Q2?", rows: [{ label: "Two", n: 2 }] },
      { q: "Q3?", rows: [{ label: "Three", n: 3 }] }],
    of: 50, ofWords: "things in the reference", foot: "Staging."
  });
  d.body.appendChild(node);
  check("renderer: the headline sits over its one denominator", /25 of 100 things done/.test(txt(d.querySelector("[aria-label=Progress]"))));
  check("renderer: the bar names its share in words", !!d.querySelector('[aria-label=Progress] [role=img][aria-label="25 percent done"]'));
  const att = d.getElementById("cpg-attention");
  check("renderer: Needs attention is a named region with a heading", att && att.getAttribute("aria-labelledby") === "cpg-att-h" && txt(d.getElementById("cpg-att-h")) === "Needs attention");
  check("renderer: an item with a count shows it and its action", /3 things to fix\./.test(txt(att)) && !!Array.from(att.querySelectorAll("button")).find(function (b) { return txt(b) === "Fix them"; }));
  check("renderer: a zero-count item leaves the list", !/need nothing/.test(txt(att)));
  check("renderer: an unread count says Could not be read, never a zero", /Could not be read things whose read failed/.test(txt(att)));
  check("renderer: the team's next step closes Needs attention", /Next for the team: Do the next thing\./.test(txt(att)));
  Array.from(att.querySelectorAll("button")).find(function (b) { return txt(b) === "Fix them"; }).click();
  check("renderer: an action's word acts", went === 10);
  const groups = d.querySelectorAll(".cpg-groups > section");
  check("renderer: three question groups, each a named region", groups.length === 3 && groups[0].getAttribute("aria-labelledby") === "cpg-q-0");
  check("renderer: every row counts over the one denominator", /Has a name 40 of 50/.test(txt(groups[0])) && /Two 2 of 50/.test(txt(groups[1])));
  check("renderer: a row whose count was not read says so", /Unread Could not be read/.test(txt(groups[0])));
  check("renderer: the foot names the denominator", /Each count is of the 50 things in the reference\. Staging\./.test(txt(node)));
  check("renderer: the status is a word beside the lede", /In progress A test\. Figures read today\./.test(txt(node.querySelector(".cpg-lede"))));
  check("renderer: an accessible name starts with the visible label",
    Array.from(node.querySelectorAll("[aria-label]")).filter(function (e) { return e.tagName === "BUTTON" || e.tagName === "A"; })
      .every(function (e) { return e.getAttribute("aria-label").indexOf(txt(e)) === 0; }));
  check("renderer: its styles go in once", d.querySelectorAll("#cpl-commons-page-css").length === 1);
})();

// ───────────────────────────── the Exhibits host ─────────────────────────────
const H = 36e5;
function ago(h) { return new Date(Date.now() - h * H).toISOString().replace(/\.\d+Z$/, "Z"); }
function exhibitRow(over) {
  return Object.assign({
    key: "exhibit", title: "Common Exhibit Reference", tab: "#exhibits", links: [{ href: "#exhibits/progress", text: "Open Exhibits" }],
    status_file: "kb/status/exhibit.json",
    pair: [{ n: 2402, of: 5492, words: "titles carry a review stamp", open: "#exhibits/credentials" }],
    tests: ["curator-stamped", "procedure-settled"],
    issues: [{ n: 1, words: "titles held for a person", owner: "a curator", open: "#exhibits/held", error: null },
      { n: 621, words: "titles in the reference that have left MAP", owner: "a curator (retire or keep)", open: "#credential-reference/all", error: null }],
    procedures: [{ n: 16, words: "in force", open: "#credential-reference/procs", error: null }],
    machine: { what: "the saving run and the fold", at: ago(3), every_hours: 24 },
    facts: { titles: 5492, stamped: 2402, person: 1088, cohort: 1314 }
  }, over || {});
}
function status(row) { return { schema: 1, written_at: ago(2), rows: [row] }; }
const SHEET = "https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB";
function runlog(over) {
  return Object.assign({ schema: 1, decider: "Sam", written_at: ago(1),
    calls: [{ title: "Merge", link: SHEET, answer: { by: "Sam", at: "2026-10-31", words: "merge" } }],
    changes: [{ at: ago(1), text: "The cert link gains a family. More words follow here." }],
    next_step: { title: "Move the panel rows", text: "After each run." } }, over || {});
}
const REVIEW = { schema: 1, written_at: ago(5), sources: { procedures_run: ago(5) },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 1, of: 2 }, saved_not_folded: 0 }, colleges: ["Norco College"],
  held: [{ raw: "Welding 1 for", step: "Wording check", why: "a dangling word", colleges: [0], title: "Welding 1", issuer: "", from: "the classifier",
    ids: ["MAPCXI-WELD-1-001"], art: [0], could: [], basis: "", same: false },
  { raw: "ADJU 232", step: "Conflict with the reference", why: "the fold held it", colleges: [], title: "Juvenile Law", issuer: "",
    from: "the reference", saved: "Juvenile Justice", ids: ["MAPCXS-A2-J-1-001"], art: [0], could: [], basis: "", same: false, exists: true }] };
const CREDREF = { _generated_at: ago(6), unified_titles: [
  { ut: "CompTIA Security+", issuer: "CompTIA", trainer: null, students_served: 57, served_suppressed: false, raw_variants: [{ r: "Sec Plus" }],
    articulations: [], potential_colleges: [], cpl_types: [], gen_rec: "3 units", ccc_rec: "", disc_modal: "" },
  { ut: "Statewide Welder", issuer: "", trainer: null, students_served: 0, served_suppressed: false, raw_variants: [{ r: "Welder" }],
    articulations: [], potential_colleges: [], cpl_types: [], gen_rec: "", ccc_rec: "6 units", disc_modal: "" },
  { ut: "Local Thing", issuer: "", trainer: null, students_served: 0, served_suppressed: false, raw_variants: [{ r: "Thing" }],
    articulations: [], potential_colleges: [], cpl_types: [], gen_rec: "", ccc_rec: "", disc_modal: "" }] };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash == null ? "#exhibits/progress" : opts.hash), runScripts: "dangerously" });
  const w = dom.window;
  const files = Object.assign({ "kb/status/commons.json": status(exhibitRow()), "kb/status/exhibit.json": runlog(),
    "kb/exhibits_review.json": REVIEW }, opts.files || {});
  w.fetch = function (url) {
    url = String(url);
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (Object.prototype.hasOwnProperty.call(files, url)) return files[url] === 404 ? bad(404) : ok(files[url]);
    if (/\/rest\/v1\//.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(null); }, authHeaders: function () { return {}; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "commons_page.js" && !opts.noPage) { const e = w.document.createElement("script"); e.textContent = pageSrc; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
async function boot(opts) { const t = load(opts); await t.M.boot(); await settle(); t.M.render(); await settle(); return t; }
function views(d) { return Array.from(d.querySelectorAll(".exh-views > *")).map(function (x) { return txt(x).replace(/ [\d,]+$/, ""); }); }

(async function () {
  let t = await boot();
  const d = t.d, page = d.querySelector(".exh-pg-page");
  check("host: #exhibits/progress opens the Progress view", t.M._state.view === "progress" && !!page);
  check("host: Progress is the first view", views(d)[0] === "Progress" && /Review/.test(views(d)[1]));
  check("host: the headline is the Commons row's pair, a title with a review stamp",
    /2,402 of 5,492 college-entered titles carry a review stamp/.test(txt(d.querySelector(".exh-pg-page [aria-label=Progress]"))));
  check("host: the line under it reads the run log's latest change, first sentence, and the stamp split",
    /Recently: The cert link gains a family\. 1,088 by a person, 1,314 by a procedure in force or a session cohort\./.test(txt(page)));
  check("host: with every call answered, no decision waits", /No decisions wait on Sam\./.test(txt(page)) && /In progress/.test(txt(d.querySelector(".exh-pg-status"))));
  const att = d.getElementById("exh-pg-attention");
  check("host: a held title shows with its action", /1 title the nightly run held for a curator\./.test(txt(att)) && /Review them/.test(txt(att)));
  check("host: a conflict shows with its action", /1 saved title disagrees with one a person approved\./.test(txt(att)) && /Decide them/.test(txt(att)));
  check("host: the nightly run's held titles, already counted live, are not listed a second time from the Commons row (S561)",
    !/titles held for a person/.test(txt(att)));
  check("host: the foot names why the Commons card's list is shorter (S561)", /The CPL Commons card counts the nightly procedures run/.test(txt(page)));
  check("host: the row's known issue reads who settles it",
    /621 titles in the reference that have left MAP, for a curator to retire or keep\./.test(txt(att)));
  const toCer = Array.from(att.querySelectorAll("a")).find(function (a) { return txt(a) === "Review the 621"; });
  check("host: an issue the tab does not hold links where the Commons sends it", toCer && toCer.getAttribute("href") === "#credential-reference/all");
  check("host: the team's next step from the run log", /Next for the team: Move the panel rows\. After each run\./.test(txt(att)));
  const groups = d.querySelectorAll(".exh-pg-groups > section");
  check("host: the three questions, in the mock's order", groups.length === 3 &&
    ["What is it called?", "What credit does it carry?", "Who could adopt it?"].every(function (q, i) { return txt(groups[i].querySelector("h3")) === q; }));
  check("host: every count is over the reference's credentials", /Issuer named 1 of 3/.test(txt(groups[0])) &&
    /Credit recommendation in MAP 2 of 3/.test(txt(groups[1])) && /Statewide recommendation 1 of 3/.test(txt(groups[1])) &&
    /Articulated by two or more colleges 0 of 3/.test(txt(groups[2])) && /Each count is of the 3 credentials in the reference\./.test(txt(page)));
  const cc = t.M._credCounts();
  check("host: the groups read the tiles' own counts", cc.n === 3 && cc.iss === 1 && cc.recs === 2 && cc.statewide === 1);
  check("host: a count whose file has not been read says so", /Field of study \(CIP\) assigned Could not be read|Field of study \(CIP\) assigned Reading/.test(txt(groups[0])));
  const links = Array.from(d.querySelectorAll(".exh-pg-links > *")).map(txt);
  check("host: its own words: how it is kept, with the procedures' count, and the decision record",
    links.length === 2 && links[0] === "How it is kept: 16 procedures" && links[1] === "Decision record"
    && d.querySelector(".exh-pg-links a").getAttribute("href") === SHEET);
  Array.from(att.querySelectorAll("button")).find(function (b) { return txt(b) === "Decide them"; }).click();
  await settle();
  check("host: an action opens its place (Decide them opens Review on Conflict with the reference)",
    t.M._state.view === "review" && t.M._state.filter === "Conflict with the reference");

  // An open call on Sam.
  t = await boot({ files: { "kb/status/exhibit.json": runlog({ calls: [{ title: "Name the page", link: "https://claude.ai/artifact/OpenSheet" }] }) } });
  check("host: an open call says a decision waits and reads Needs you", /One decision waits on Sam\./.test(txt(t.d.querySelector(".exh-pg-page")))
    && txt(t.d.querySelector(".exh-pg-status")) === "Needs you");
  const call = Array.from(t.d.querySelectorAll("#exh-pg-attention a")).find(function (a) { return txt(a) === "Open the decision sheet"; });
  check("host: the open call is in Needs attention with its sheet", call && call.getAttribute("href") === "https://claude.ai/artifact/OpenSheet");

  // The Commons file could not be read.
  t = await boot({ files: { "kb/status/commons.json": 404 } });
  check("host: a failed Commons read says Could not be read, never a zero",
    /Could not be read/.test(txt(t.d.querySelector(".exh-pg-page [aria-label=Progress]"))) && !/\b0 of\b/.test(txt(t.d.querySelector(".exh-pg-page [aria-label=Progress]"))));

  // The tab with no address still opens on Review.
  t = await boot({ hash: "" });
  check("host: the tab still opens on Review (Sheet 147)", t.M._state.view === "review");

  // The shared renderer did not load.
  t = await boot({ noPage: true });
  check("host: when the renderer cannot load, the view says so in words", /could not be loaded; reload the tab/.test(txt(t.d.querySelector(".exh-wrap"))));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch(function (e) { console.error(e); process.exit(1); });
