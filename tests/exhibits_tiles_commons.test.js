// The Exhibits tab's Credentials view carries the Commons' row for the Common Exhibit Reference on its tiles.
//
// Sam, 2026-11-01, comparing the Catalog Commons row with the Exhibits tab's tiles: "I like the tiles above the list
// and thinking you could integrate what's needed into existing tiles and create any others needed to capture everything
// from 1st into Exhibits view." Guarded here:
//   - every item of the row appears: the headline pair with its meter and tests, each known issue with its count and
//     owner, the settled procedures, the Decision Sheet Library (the open count bold, a 0 green, Completed Decision
//     Sheets one line each that opens) and the last run (machine stamp, cadence and state; the session; Next);
//   - the figures come from the status files commons.js reads (kb/status/commons.json, row "exhibit", and the run log
//     it names): change a fixture number and the tile changes; the committed files render item for item;
//   - a failed read of either file says "Could not be read", never a blank or a zero;
//   - the List draws the same tiles above its table (the Catalog Commons List norms, norm 1); a count opens the List
//     filtered to it where the List holds that filter (#exhibits/list/<filter>), else the matching Exhibits view (held
//     titles open Review, the fold's holds open Conflict, the procedures open Rules), else the Commons' own link.
//
// Run from repo root: `node tests/exhibits_tiles_commons.test.js` (or `npm test`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
/* The text a reader sees, a space between the tile's parts (label, number, words), whitespace folded. */
function txt(el) {
  if (!el) return "";
  const parts = [], walk = el.ownerDocument.createTreeWalker(el, 4);
  while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

const src = fs.readFileSync("exhibits.js", "utf8");
const commonsSrc = fs.readFileSync("commons.js", "utf8");
const cssStart = src.indexOf("var CSS = [");
const cssBlock = src.slice(cssStart, src.indexOf("].join(", cssStart));

// ───────────────────────────── static ─────────────────────────────
check("the tiles read the Commons' own status file and its exhibit row",
  /var COMMONS_URL = "kb\/status\/commons\.json";/.test(src) && /var COMMONS_KEY = "exhibit";/.test(src)
  && /var STATUS_URL = "kb\/status\/commons\.json";/.test(commonsSrc));
check("the run log is the one the row names (row.status_file), as commons.js reads it",
  /row\.status_file/.test(src) && /r\.status_file/.test(commonsSrc));
check("no figure of the row is copied into the code", !/\b(2,?402|5,?492|2,?673|2,?188|2,?961)\b/.test(src)
  && !/"351|"621|"16 in force/.test(src));
check("the stale thresholds match commons.js", /MACHINE_SLACK = 1\.5/.test(src) && /MACHINE_SLACK = 1\.5/.test(commonsSrc)
  && /SESSION_STALE_HOURS = 7 \* 24/.test(src) && /SESSION_STALE_HOURS = 7 \* 24/.test(commonsSrc));
check("a wide tile spans its row; the kept group wraps with no fixed width",
  /\.exh-tile\.exh-wide \{ grid-column:1 \/ -1; \}/.test(cssBlock)
  && /\.exh-kept \{ grid-template-columns:repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\); align-items:start; \}/.test(cssBlock));
check("the green 0 is the --hunter token, measured 7.00:1 on glass and 5.55:1 on dark (prototype/check_contrast.py)",
  /\.exh-tile \.exh-zero \{ color:var\(--hunter\); \}/.test(cssBlock));
check("a completed sheet is cut to one line with an ellipsis and opens", /\.exh-done-line \{[^}]*text-overflow:ellipsis/.test(cssBlock)
  && /\.exh-done details\[open\] \.exh-done-line \{ white-space:normal;/.test(cssBlock));
check("the CSS added names no raw hex color", !/#[0-9a-fA-F]{3,8}\b/.test(cssBlock));

// ───────────────────────────── fixtures ─────────────────────────────
const H = 36e5;
function ago(h) { return new Date(Date.now() - h * H).toISOString().replace(/\.\d+Z$/, "Z"); }
const PAIR_WORDS = "titles carry a review stamp (1,088 a person's, 1,314 a cohort's); 2,673 credentials, 2,188 of 2,961 records stamped";
function exhibitRow(over) {
  return Object.assign({
    key: "exhibit", title: "Common Exhibit Reference", tab: "#exhibits", links: [{ href: "#exhibits", text: "Open Exhibits" }],
    status_file: "kb/status/exhibit.json",
    pair: [{ n: 2402, of: 5492, words: PAIR_WORDS, open: "#exhibits/credentials" }],
    tests: ["curator-stamped", "procedure-settled"],
    issues: [
      { n: 351, words: "titles held for a person", owner: "a curator (the classifier is unsure 274, a merge would join two issuers 42)", open: "#exhibits/held", error: null },
      { n: 18, words: "saved assignments the fold holds", owner: "a curator (a human-reviewed classification stands)", open: "#exhibits/conflict", error: null },
      { n: 621, words: "titles in the reference that have left MAP", owner: "a curator (retire or keep)", open: "#credential-reference/all", error: null }
    ],
    procedures: [
      { n: 16, words: "in force: 8 rules applied by code, 8 read by the classifier", open: "#credential-reference/procs", error: null },
      { words: "A procedure's saves undo together" }
    ],
    machine: { what: "the saving run and the fold", at: ago(3), every_hours: 24 }
  }, over || {});
}
function status(row) {
  return { schema: 1, written_at: ago(2), rows: [{ key: "subjects", title: "Common Subjects Reference", pair: [], issues: [], procedures: [] }, row] };
}
const ANSWERED = [
  { title: "Merge EACR into the CER as one Exhibits tab", text: "Answered on Open Asks Sheet 147 card 1.", link: "https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB",
    answer: { by: "Sam", at: "2026-10-31", words: "merge" } },
  { title: "Which names CLEP exams take", text: "Answered fold.", link: "https://claude.ai/artifact/3MJJ8ftqz7BABwnQAsjfFL",
    answer: { by: "Sam", at: "2026-11-01", words: "fold" } }
];
const OPEN_CALL = { title: "Name the public adoption page", text: "Waiting on Sam.", link: "https://claude.ai/artifact/OpenSheetLink00000000" };
function runlog(over) {
  return Object.assign({ schema: 1, session: 541, moniker: "SkyBlatusoff", decider: "Sam", calls: ANSWERED.slice(),
    written_at: ago(1), next_step: { title: "The cert link's next families", text: "Add AP, CLEP and IB." } }, over || {});
}
const REVIEW = { schema: 1, written_at: ago(5), sources: { procedures_run: ago(5) },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 1, of: 2 }, saved_not_folded: 0 },
  colleges: ["Norco College"],
  held: [{ raw: "Welding 1 for", step: "Wording check", why: "a dangling word", colleges: [0], title: "Welding 1", issuer: "", from: "the classifier",
    ids: ["MAPCXI-WELD-1-001"], art: [0], could: [], basis: "", same: false },
  { raw: "ADJU 232", step: "Conflict with the reference", why: "the fold held the saved assignment", colleges: [], title: "Juvenile Law", issuer: "",
    from: "the reference", saved: "Juvenile Justice", ids: ["MAPCXS-A2-J-1-001"], art: [0], could: [], basis: "", same: false, exists: true }] };
const CREDREF = { _generated_at: ago(6), unified_titles: [
  { ut: "CompTIA Security+", issuer: "CompTIA", trainer: null, students_served: 57, served_suppressed: false, raw_variants: [{ r: "Sec Plus" }],
    articulations: [], potential_colleges: [], cpl_types: [], gen_rec: "3 units", ccc_rec: "", disc_modal: "" }] };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits/credentials"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  const files = Object.assign({
    "kb/status/commons.json": status(exhibitRow()),
    "kb/status/exhibit.json": runlog(),
    "kb/exhibits_review.json": REVIEW
  }, opts.files || {});
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET" });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (Object.prototype.hasOwnProperty.call(files, url)) return files[url] === 404 ? bad(404) : ok(files[url]);
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(null); }, authHeaders: function () { return {}; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, root: w.document.getElementById("exhibits-root"), calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
async function boot(opts) { const t = load(opts); await t.M.boot(); await settle(); return t; }
function tiles(d, label) { return Array.from(d.querySelectorAll(".exh-tile")).filter(function (x) { return txt(x.querySelector(".exh-tl")) === label; }); }
function tile(d, label) { return tiles(d, label)[0]; }
function group(d, q) { const h = Array.from(d.querySelectorAll(".exh-group > .exh-q")).find(function (x) { return txt(x) === q; }); return h ? h.parentNode : null; }
function fmt(n) { return Number(n).toLocaleString("en-US"); }

(async function () {
  // ── everything the row carries ──
  let t = await boot();
  const called = group(t.d, "What is it called?"), kept = group(t.d, "How is it kept?");
  check("the view keeps its three questions and adds How is it kept?", !!called && !!group(t.d, "What credit does it carry?")
    && !!group(t.d, "Who could adopt it?") && !!kept);
  const pair = tile(t.d, "Review stamp");
  check("the headline pair leads What is it called?, wide", pair && called.querySelector(".exh-tile") === pair && pair.classList.contains("exh-wide"));
  check("the pair reads 2,402 of 5,492 with the Commons' own words", /Review stamp 2,402 of 5,492/.test(txt(pair)) && txt(pair).indexOf(PAIR_WORDS) !== -1);
  check("the pair draws its meter", !!pair.querySelector('.exh-bar[role="img"][aria-label="43.7 percent"]'));
  check("the pair carries both test chips", Array.from(pair.querySelectorAll(".exh-tests .exh-chip")).map(txt).join("|") === "curator-stamped|procedure-settled");
  check("the pair's count opens this view, so it is not a control", !pair.querySelector("button, a"));
  check("the reference's own tiles stay", !!tile(t.d, "Credentials") && !!tile(t.d, "Issuers") && !!tile(t.d, "Training sites"));
  const issues = tiles(t.d, "Known issue");
  check("each known issue takes a tile in What is it called?, in the wider grid", issues.length === 3 && issues.every(function (x) { return called.contains(x); })
    && issues.every(function (x) { return x.parentNode.matches('.exh-dash.exh-kept[role="list"][aria-label="Known issues"]'); }));
  check("a known issue carries its count, words and owner", /Known issue 351 titles held for a person Owner: a curator \(the classifier is unsure 274/.test(txt(issues[0])));
  check("the fold's holds and the titles that left MAP draw too", /18 saved assignments the fold holds Owner: a curator \(a human-reviewed classification stands\)/.test(txt(issues[1]))
    && /621 titles in the reference that have left MAP Owner: a curator \(retire or keep\)/.test(txt(issues[2])));
  const proc = tile(t.d, "Settled procedures");
  check("Settled procedures sits in How is it kept?, its count and words, and the uncounted procedure beside them",
    kept.contains(proc) && /16 in force: 8 rules applied by code, 8 read by the classifier/.test(txt(proc)) && /A procedure's saves undo together/.test(txt(proc)));
  const lib = tile(t.d, "Decision Sheet Library");
  check("the Decision Sheet Library sits in How is it kept?", kept.contains(lib));
  check("with nothing waiting it reads 0 open in bold, the 0 green", txt(lib.querySelector(".exh-tn b.exh-waiting")) === "0 open"
    && txt(lib.querySelector(".exh-waiting .exh-zero")) === "0");
  const doneH = lib.querySelector(".exh-dsl-h"), doneLi = lib.querySelectorAll(".exh-done li");
  check("answered sheets sit under Completed Decision Sheets, one line each that opens", txt(doneH) === "Completed Decision Sheets" && doneLi.length === 2
    && doneLi[0].querySelector("details > summary .exh-done-line")
    && txt(doneLi[0].querySelector("summary")) === "Merge EACR into the CER as one Exhibits tab · Answered by Sam, 2026-10-31: merge");
  check("an opened sheet gives its note and its link in a new tab", /Answered on Open Asks Sheet 147 card 1\./.test(txt(doneLi[0].querySelector(".exh-done-body")))
    && doneLi[1].querySelector('details a[href="https://claude.ai/artifact/3MJJ8ftqz7BABwnQAsjfFL"][target="_blank"][rel="noopener"]'));
  const run = tile(t.d, "Last run");
  check("Last run names the machine's run, its cadence and current", kept.contains(run) && /Machine: the saving run and the fold, [A-Z][a-z]{2} \d+, \d+:\d\d [AP]M PT · daily · current/.test(txt(run)));
  check("Last run names the session that wrote the run log", /Session: S541 SkyBlatusoff wrote the run log, [A-Z][a-z]{2} \d+, \d+:\d\d [AP]M PT · each checkpoint · current/.test(txt(run)));
  check("Last run carries Next from the run log", /Next: The cert link's next families/.test(txt(run)));
  check("the tiles read each status file once", t.calls.filter(function (c) { return c.url === "kb/status/commons.json"; }).length === 1
    && t.calls.filter(function (c) { return c.url === "kb/status/exhibit.json"; }).length === 1);
  check("no emoji or pictograph on the tiles", !/\p{Extended_Pictographic}/u.test(txt(called) + txt(kept)));

  // ── the counts open the matching view ──
  const held = issues[0].querySelector("button.exh-w.exh-tcount");
  check("the held count is an underlined word naming where it goes", held && txt(held) === "351" && /Opens Review, every held title/.test(held.getAttribute("aria-label")));
  held.click(); await settle();
  check("the held count opens Review on every held title", t.M._state.view === "review" && t.M._state.filter === ""
    && Array.from(t.d.querySelectorAll(".exh-step")).find(function (b) { return /All held/.test(txt(b)); }).getAttribute("aria-pressed") === "true");
  t = await boot();
  tiles(t.d, "Known issue")[1].querySelector("button.exh-tcount").click(); await settle();
  check("the fold's holds open Review on Conflict with the reference", t.M._state.view === "review" && t.M._state.filter === "Conflict with the reference");
  t = await boot();
  const procBtn = tile(t.d, "Settled procedures").querySelector("button.exh-tcount");
  check("the procedures count names the Rules view", procBtn && /Opens the Rules view/.test(procBtn.getAttribute("aria-label")));
  procBtn.click(); await settle();
  check("the procedures count opens the Rules view, which lists every procedure", t.M._state.view === "rules");
  t = await boot();
  const left = tiles(t.d, "Known issue")[2].querySelector("a.exh-tcount");
  check("titles that left MAP open where the Commons sends them (this tab holds no such list)", left && left.getAttribute("href") === "#credential-reference/all"
    && txt(left) === "621");

  // ── the numbers come from the files ──
  const moved = exhibitRow({ pair: [{ n: 2403, of: 5493, words: "titles carry a review stamp (changed)", open: "#exhibits/credentials" }] });
  moved.issues = moved.issues.map(function (i, k) { return Object.assign({}, i, k === 0 ? { n: 352 } : {}); });
  moved.procedures = [{ n: 17, words: "in force: 9 rules applied by code, 8 read by the classifier", open: "#credential-reference/procs" }];
  t = await boot({ files: { "kb/status/commons.json": status(moved), "kb/status/exhibit.json": runlog({ calls: ANSWERED.concat([OPEN_CALL]), session: 600, moniker: "SkyFixture" }) } });
  check("a changed pair changes the tile", /2,403 of 5,493/.test(txt(tile(t.d, "Review stamp"))) && /\(changed\)/.test(txt(tile(t.d, "Review stamp"))));
  check("a changed issue count changes the tile", txt(tiles(t.d, "Known issue")[0].querySelector(".exh-tcount")) === "352" && !/\b351\b/.test(txt(t.root)));
  check("a changed procedure count changes the tile", /17 in force: 9 rules/.test(txt(tile(t.d, "Settled procedures"))));
  const lib2 = tile(t.d, "Decision Sheet Library");
  check("an open call counts in bold with no green, and stays listed in full above the completed ones",
    txt(lib2.querySelector(".exh-waiting")) === "1 open" && !lib2.querySelector(".exh-zero")
    && lib2.querySelector('ul.exh-open a[href="https://claude.ai/artifact/OpenSheetLink00000000"]') && !lib2.querySelector("ul.exh-open details")
    && lib2.querySelectorAll(".exh-done li").length === 2);
  check("a changed run log changes the session line", /Session: S600 SkyFixture wrote the run log/.test(txt(tile(t.d, "Last run"))));
  const dropped = exhibitRow(); dropped.issues = dropped.issues.slice(1);
  t = await boot({ files: { "kb/status/commons.json": status(dropped) } });
  check("an issue the file leaves out leaves the tiles", tiles(t.d, "Known issue").length === 2 && !/titles held for a person/.test(txt(t.root)));
  const none = exhibitRow(); none.issues = [];
  t = await boot({ files: { "kb/status/commons.json": status(none) } });
  check("no issue at all reads None known", /Known issues None known/.test(txt(tile(t.d, "Known issues"))));

  // ── a failed read says so ──
  t = await boot({ files: { "kb/status/commons.json": 404 } });
  ["Review stamp", "Known issues", "Settled procedures"].forEach(function (label) {
    const x = tile(t.d, label);
    check("an unread Commons file: " + label + " says Could not be read, with the reason, and no zero",
      x && /Could not be read/.test(txt(x)) && /kb\/status\/commons\.json answered 404/.test(txt(x)) && !/\b0\b/.test(txt(x.querySelector(".exh-tn"))));
  });
  check("an unread Commons file: the machine stamp says Could not be read", /Machine: Could not be read kb\/status\/commons\.json answered 404/.test(txt(tile(t.d, "Last run"))));
  check("an unread Commons file still reads the run log, so the library stands", txt(tile(t.d, "Decision Sheet Library").querySelector(".exh-waiting")) === "0 open"
    && t.calls.some(function (c) { return c.url === "kb/status/exhibit.json"; }));
  t = await boot({ files: { "kb/status/commons.json": { schema: 1, rows: [exhibitRow()] } } });
  check("a Commons file with no written_at is not read as the Commons'", /names no written_at/.test(txt(tile(t.d, "Review stamp"))));
  t = await boot({ files: { "kb/status/exhibit.json": 404 } });
  const libBad = tile(t.d, "Decision Sheet Library");
  check("an unread run log: the library says Could not be read, with the reason, never 0 open",
    /Could not be read/.test(txt(libBad)) && /kb\/status\/exhibit\.json answered 404/.test(txt(libBad)) && !/0 open/.test(txt(libBad)));
  check("an unread run log: the session stamp says Could not be read", /Session: Could not be read/.test(txt(tile(t.d, "Last run"))));
  check("an unread run log leaves the Commons' figures standing", /2,402 of 5,492/.test(txt(tile(t.d, "Review stamp"))));
  const unread = exhibitRow(); unread.issues = [{ n: null, words: "titles held for a person", owner: "a curator", open: "#exhibits/held", error: "kb/cer_procedures_out/latest.json is missing" }];
  t = await boot({ files: { "kb/status/commons.json": status(unread) } });
  check("a figure the builder could not read says Could not be read and why, never a zero",
    /Known issue Could not be read titles held for a person Owner: a curator kb\/cer_procedures_out\/latest\.json is missing/.test(txt(tile(t.d, "Known issue")))
    && !tile(t.d, "Known issue").querySelector(".exh-tcount"));
  const nolog = exhibitRow({ status_file: null });
  t = await boot({ files: { "kb/status/commons.json": status(nolog) } });
  check("a row with no run log says so", /No run log/.test(txt(tile(t.d, "Decision Sheet Library"))) && /Session: no run log/.test(txt(tile(t.d, "Last run"))));

  // ── state against the cadence ──
  t = await boot({ files: { "kb/status/commons.json": status(exhibitRow({ machine: { what: "the saving run and the fold", at: ago(40), every_hours: 24 } })) } });
  const stale = tile(t.d, "Last run");
  check("a daily stamp older than 36 hours reads stale, in bold words", /daily · stale/.test(txt(stale)) && txt(stale.querySelector(".exh-cm-warn")) === "stale");

  // ── a new visit reads again; Review and the List never read ──
  t = await boot();
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } })); await settle();
  check("a new visit reads the Commons again", t.calls.filter(function (c) { return c.url === "kb/status/commons.json"; }).length === 2);
  t = await boot({ hash: "#exhibits" });
  check("the Review view does not read the Commons", !t.calls.some(function (c) { return /kb\/status\//.test(c.url); }));

  // ── the List carries the same tiles above its table (norm 1, docs/kb-notes/reference-catalog-commons-list-norms.md) ──
  t = await boot({ hash: "#exhibits/list" });
  const lq = Array.from(t.d.querySelectorAll(".exh-group > .exh-q")).map(txt);
  check("the List draws the tiles above its table", t.M._state.view === "list"
    && lq.join("|") === "What is it called?|What credit does it carry?|Who could adopt it?|How is it kept?"
    && !!tile(t.d, "Review stamp") && !!tile(t.d, "Decision Sheet Library") && !!t.d.querySelector("table")
    && (t.d.querySelector(".exh-tile").compareDocumentPosition(t.d.querySelector("table")) & 4) === 4);
  check("on the List the pair names the list on screen, so it is not a control", !tile(t.d, "Review stamp").querySelector("button, a"));
  tiles(t.d, "Known issue")[0].querySelector("button.exh-tcount").click(); await settle();
  check("from the List, the held count opens Review", t.M._state.view === "review" && t.M._state.filter === "");
  const toList = exhibitRow();
  toList.issues = [{ n: 7, words: "credentials no person has reviewed", owner: "a curator", open: "#exhibits/list/unreviewed", error: null }];
  t = await boot({ files: { "kb/status/commons.json": status(toList) } });
  const lb = tile(t.d, "Known issue").querySelector("button.exh-tcount");
  check("a count the List holds a filter for names it", lb && /Opens the List, filtered to Unreviewed/.test(lb.getAttribute("aria-label")));
  lb.click(); await settle(); await settle();
  check("and opens the List filtered to it", t.M._state.view === "list" && t.M._state.ls && t.M._state.ls.f === "unreviewed"
    && txt(t.d.querySelector('[aria-current="true"]')) === "Unreviewed");
  t = await boot({ hash: "#exhibits/list/unreviewed" });
  check("#exhibits/list/<filter> opens the List on that filter", t.M._state.view === "list" && t.M._state.ls.f === "unreviewed");
  t = await boot({ hash: "#exhibits/list/nowhere" });
  check("an unknown List filter opens the List on All", t.M._state.view === "list" && t.M._state.ls.f === "");

  // ── the committed files, item for item ──
  const realStatus = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
  const realRow = realStatus.rows.find(function (r) { return r.key === "exhibit"; });
  const realLog = JSON.parse(fs.readFileSync(realRow.status_file || "kb/status/exhibit.json", "utf8"));
  t = await boot({ files: { "kb/status/commons.json": realStatus, "kb/status/exhibit.json": realLog } });
  const page = txt(t.root);
  check("committed: the pair's words and figures appear", realRow.pair.every(function (p) {
    return page.indexOf(p.words) !== -1 && (p.n == null || page.indexOf(fmt(p.n) + " of " + fmt(p.of)) !== -1); }));
  check("committed: every test chip appears", (realRow.tests || []).every(function (x) {
    return Array.from(t.d.querySelectorAll(".exh-tests .exh-chip")).some(function (c) { return txt(c) === x; }); }));
  check("committed: every known issue appears with its count and owner", (realRow.issues || []).length === tiles(t.d, "Known issue").length
    && realRow.issues.every(function (i, k) { const x = txt(tiles(t.d, "Known issue")[k]);
      return x.indexOf(i.words) !== -1 && (i.n == null || x.indexOf(fmt(i.n)) !== -1) && (!i.owner || x.indexOf(i.owner) !== -1); }));
  check("committed: every settled procedure appears", (realRow.procedures || []).every(function (p) { return txt(kept && group(t.d, "How is it kept?")).indexOf(p.words) !== -1; }));
  const realCalls = realLog.calls || [];
  const realOpen = realCalls.filter(function (c) { return !(c.answer && c.answer.words); }).length;
  const libReal = tile(t.d, "Decision Sheet Library");
  check("committed: the library counts the open calls and lists every call", txt(libReal.querySelector(".exh-waiting")) === fmt(realOpen) + " open"
    && realCalls.every(function (c) { return txt(libReal).indexOf(c.title) !== -1; }));
  check("committed: Last run names the machine's run and the run log's session and next step",
    txt(tile(t.d, "Last run")).indexOf("Machine: " + realRow.machine.what) !== -1
    && txt(tile(t.d, "Last run")).indexOf("S" + realLog.session + " " + realLog.moniker + " wrote the run log") !== -1
    && (!realLog.next_step || txt(tile(t.d, "Last run")).indexOf(realLog.next_step.title) !== -1));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
