// The Commons data dashboard (#3215): slice 1's statewide figures and college list, slice 2's row and side panel (commons_data.js, opened by
// commons.js at #commons/data).
//
// WHAT THIS GUARDS (each a way the page could mislead):
//   (1) ⭐ a figure that is a button counts exactly the list it opens (CLAUDE.md: a figure card opens what it counts);
//   (2) ⭐ a figure's filter: each opens only its colleges, an unread college reads "Not read yet" (never 0%);
//   (3) ⭐ the address: #commons/data and #commons/data/<filter> open the view, the view reports its address, a later
//       visit on #commons draws the first view again, and the filter is never stored;
//   (4) ⭐ TBA where no committed file supplies the figure (overall, confidence, APIs, the JST funnel), never a number;
//   (5) the age cue reads its thresholds from the file; the sort words; the search;
//   (7) ⭐ with spot-check receipts, the three confidence figures each open the colleges at that level, and a row
//       shows the level and its reason as the builder wrote them (the page derives no level of its own);
//   (6) static: tokens only, no write path, no storage, th scope and a labeled scrolling region, no mock values.
//   (8) ⭐ slice 2: a college's name opens its row in place (aria-expanded), and the row shows the datasets the
//       builder holds for that college and nothing else; one row at a time; the row opens the same college in a
//       side panel (a dialog: its heading takes the focus, Tab stays inside, Escape closes it and returns the focus);
//       a section with no committed source reads TBA with the builder's reason; #commons/data[/<filter>]/college/<slug>
//       opens the panel, the view reports it, and a new visit remembers neither the panel nor the row.
// The committed file itself is guarded by tests/commons_data_status_build_test.py.
//
// Run from repo root: `npm test` (or `node tests/commons_data.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_data.js", "utf8");

const NOW = Date.now();
const ago = (d) => new Date(NOW - d * 86400000).toISOString();
function college(o) {
  return Object.assign({ id: 0, name: "", district: "A CCD", kind: "college", harvested: false, slug: null, programs: null, passing: null, gap: null,
    causes: null, read_at: null, read_kind: null, cost_usd: null, passed_at_read: null, slo_queue: null, scout: null, spot_check: null }, o);
}
const COLLEGES = [
  college({ id: 1, name: "Alpha College", district: "Alpha CCD", harvested: true, slug: "alpha", programs: 100, passing: 80, gap: 20, causes: { no_closed_list: 20 },
    read_at: ago(3), read_kind: "capture", cost_usd: 8, passed_at_read: 80 }),
  college({ id: 2, name: "Beta College", district: "Beta CCD", harvested: true, slug: "beta", programs: 50, passing: 50, gap: 0, causes: {},
    read_at: ago(20), read_kind: "capture_preview", cost_usd: 2, passed_at_read: 40, slo_queue: { state: "held", why: "a parser", on: "2026-11-12" } }),
  college({ id: 3, name: "Gamma College", district: "Beta CCD", harvested: true, slug: "gamma", programs: 40, passing: 10, gap: 30, causes: { page_not_found: 30 },
    read_at: ago(60), read_kind: "capture", cost_usd: 4, passed_at_read: 10, scout: { recommendation: "blocked", challenge: "firewall", checked_at: ago(1), wave: "w" } }),
  college({ id: 4, name: "Delta College", district: "Delta CCD" }),
  college({ id: 5, name: "Epsilon Continuing Education", district: "Delta CCD", kind: "continuing_education" })
];
const DATA = {
  schema: 1, written_at: "2026-11-13T12:00:00Z",
  sources: { universe: "kb/college_identity/2026-11-10/crosswalk.json", harvest: "kb/program_requirements_college/<slug>/" },
  rule: { basis: "committed files only", passing: "the tab's test", overall: "the whole-harvest rule", confidence: "strong, partial, limited", age_days: { fresh: 7, recent: 30 } },
  fields: {}, tba: { confidence: "No spot-check receipt is committed yet.", overall: "Catalog source, SLOs and PLOs are live tables.", apis: "Not a committed file yet.", jst: "Waits on a feed." },
  statewide: { colleges: 5, continuing_education: 1, districts: 3, harvested: 3, unread: 2, programs: 190, passing: 140, gap: 50, with_gap: 2,
    cost_usd: 14, passed_at_read: 130, cost_receipts: 3, slo_waiting: 1, scouted: 1, scout_barrier: 1, spot_checked: 0 },
  colleges: COLLEGES
};
const STATUS = { schema: 1, written_at: "2026-11-12T06:00:00Z", rows: [] };

function load(hash, data) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, calls = [];
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; }, _o: o }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = { "kb/status/commons_data.json": data || DATA, "kb/status/commons.json": STATUS };
  w.fetch = function (url, init) {
    calls.push([String(url), (init && init.method) || "GET"]);
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [SESSION, PROGRESS, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, calls, M: w.CPL_COMMONS, D: w.CPL_COMMONS_DATA };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
function reported(x) { x.w.CPL_SESSION.stashReturnTab("commons"); return (JSON.parse(x.w.localStorage.getItem("cpl_sb_return_tab")) || {}).tab; }
function rows(x) { return Array.from(x.d.querySelectorAll("#cdd-colleges tbody tr[data-college]")).map((r) => r.getAttribute("data-college")); }
function tile(x, f) { return x.d.querySelector('.cdd-tile[data-filter="' + f + '"]'); }
function plain(x, label) { return x.d.querySelector('.cdd-tile[data-tile="' + label + '"]'); }

(async function () {
  // ── (6) static ──
  const css = SRC.slice(SRC.indexOf("var CSS = ["), SRC.indexOf("].join(", SRC.indexOf("var CSS = [")));
  check("static: the injected CSS names no raw hex color and uses the tab's --cmn tokens", !/#[0-9a-fA-F]{3,8}\b/.test(css) && /var\(--cmn-link\)/.test(css));
  check("static: a scrolling table sits in a labeled region; th scope on every header", /role: "region", "aria-label"/.test(SRC) && !/el\("th", \{ (?!scope)/.test(SRC));
  check("static: no write path and no browser storage", !/method:\s*"POST"|\/rpc\/|kb_curation|localStorage|sessionStorage|REST \+/.test(SRC));
  check("static: no mock value ships (the mock's sample figures)", !/14,?525|20,?282|130,?793|141,?738|103,?088|7,?082|1 of 15/.test(SRC));
  check("static: focus-visible and reduced motion in the CSS; one column under 560px", /:focus-visible/.test(css) && /prefers-reduced-motion/.test(css) && /max-width: 560px/.test(css));
  check("static: American spelling", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst)\b/i.test(SRC));

  // ── (3) the address ──
  const o = load("#commons/data");
  await o.M.boot(); await settle();
  check("address 1 ⭐: #commons/data opens the dashboard", txt(o.d.querySelector("#cdd-h")) === "How complete each college's data is");
  check("address 2 ⭐: the view reports commons/data", reported(o) === "commons/data");
  check("address 3: it read only its one file", o.calls.every((c) => c[1] === "GET") && o.calls.some((c) => c[0] === "kb/status/commons_data.json"));

  // ── (1) every figure that is a button counts exactly the list it opens ──
  const D = o.D, M = D.model(DATA);
  Object.keys(D.FILTERS).filter((f) => tile(o, f)).forEach(function (f) {
    tile(o, f).click();
    const shown = rows(o).length, figure = Number(txt(tile(o, f).querySelector(".cdd-v")).replace(/,/g, ""));
    check("figure " + f + " ⭐: the figure (" + figure + ") equals the list it opens (" + shown + ") and the model's count", figure === shown && shown === D.listFor(M, f).length);
    check("figure " + f + ": pressed, and the address carries it", tile(o, f).getAttribute("aria-pressed") === "true"
      && o.w.location.hash === (f === "all" ? "#commons/data" : "#commons/data/" + f) && reported(o) === (f === "all" ? "commons/data" : "commons/data/" + f));
  });
  check("figure: six figures open a list", o.d.querySelectorAll("button.cdd-tile").length === 6);

  // ── (2) each filter's colleges ──
  tile(o, "unread").click();
  check("filter unread ⭐: only the colleges with no committed harvest, and each reads Not read yet, never 0%",
    JSON.stringify(rows(o)) === JSON.stringify(["Delta College", "Epsilon Continuing Education"])
    && Array.from(o.d.querySelectorAll("#cdd-colleges tbody tr")).every((r) => /Not read yet/.test(txt(r)) && !/0%/.test(txt(r))));
  tile(o, "gaps").click();
  check("filter gaps: the harvested colleges with programs still to pass, most first", JSON.stringify(rows(o)) === JSON.stringify(["Gamma College", "Alpha College"]));
  tile(o, "slo").click();
  check("filter slo: the colleges in the SLO queue", JSON.stringify(rows(o)) === JSON.stringify(["Beta College"]) && /SLO read held/.test(txt(o.d.querySelector("#cdd-colleges tbody"))));
  tile(o, "scouted").click();
  check("filter scouted: the scouted colleges, with the barrier named", JSON.stringify(rows(o)) === JSON.stringify(["Gamma College"]) && /firewall/.test(txt(o.d.querySelector("#cdd-colleges tbody"))));
  check("filter: the count line says what is shown", /^Showing 1 of 5: Scouted for a wave$/.test(txt(o.d.querySelector("#cdd-shown"))));
  o.d.querySelector("#cdd-all").click();
  check("filter: Show all colleges returns the whole universe", rows(o).length === 5 && o.w.location.hash === "#commons/data");

  // ── (4) TBA where no committed file supplies it; summed figures stay plain ──
  ["Overall completeness", "Confidence", "APIs connected"].forEach(function (l) {
    const t = plain(o, l);
    check("TBA ⭐: " + l + " reads TBA with its reason and opens nothing", t && txt(t.querySelector(".cdd-v")) === "TBA" && t.tagName === "DIV" && txt(t.querySelector(".cdd-d")).length > 0);
  });
  check("slice 3: the JST funnel draws no empty tile; it is a line under Coming next", !plain(o, "JST funnel") && /The JST funnel\. Waits on a feed\./.test(txt(o.d.querySelector('#cdd-next [data-next="The JST funnel"]'))));
  check("slice 3: before the first live read the overall tile says the live read has not run yet", /The live read has not run yet\./.test(txt(plain(o, "Overall completeness"))));
  check("plain: program requirements passing is the file's sum, shown, not a button",
    plain(o, "Program requirements passing") && txt(plain(o, "Program requirements passing").querySelector(".cdd-v")) === "74%"
    && /140 of 190 listed programs/.test(txt(plain(o, "Program requirements passing"))));
  check("plain: read cost per passing program from the receipts", txt(plain(o, "Read cost per passing program").querySelector(".cdd-v")) === "$0.108");
  check("TBA: every college's confidence reads TBA without a spot-check receipt",
    Array.from(o.d.querySelectorAll('#cdd-colleges td[data-label="Confidence"]')).every((td) => txt(td) === "TBA"));

  // ── (5) the age cue, the sort, the search ──
  const rowOf = (n) => o.d.querySelector('#cdd-colleges tr[data-college="' + n + '"]');
  check("age: fresh, recent and stale from the file's thresholds", /fresh/.test(txt(rowOf("Alpha College"))) && /recent/.test(txt(rowOf("Beta College"))) && /stale/.test(txt(rowOf("Gamma College"))));
  check("age: a read on a pull request branch says so", /Read on a pull request branch/.test(txt(rowOf("Beta College"))));
  check("age: the thresholds are read, not restated", D.age(ago(10), { age_days: { fresh: 14, recent: 30 } }) === "fresh" && D.age(ago(10), DATA.rule) === "recent");
  const sortBtn = (k) => o.d.querySelector('button.cdd-sort[data-sort="' + k + '"]');
  sortBtn("pr").click();
  check("sort 1: program requirements low first, unread at the top, with the words on the heading",
    rows(o)[0] === "Delta College" && rows(o)[2] === "Gamma College" && /low first/.test(txt(sortBtn("pr")))
    && sortBtn("pr").parentNode.getAttribute("aria-sort") === "ascending");
  sortBtn("pr").click();
  check("sort 2: a second click reverses", rows(o)[0] === "Beta College" && sortBtn("pr").parentNode.getAttribute("aria-sort") === "descending");
  check("sort 3: sorting is no part of the address", o.w.location.hash === "#commons/data");
  const q = o.d.querySelector("#cdd-q");
  q.value = "beta ccd"; q.dispatchEvent(new o.w.Event("input"));
  check("search: by district too", JSON.stringify(rows(o).sort()) === JSON.stringify(["Beta College", "Gamma College"]));

  // ── (3) continued: a filter in the address, a later visit, nothing stored ──
  const g = load("#commons/data/gaps");
  await g.M.boot(); await settle();
  check("address 4 ⭐: #commons/data/gaps opens the gaps list", tile(g, "gaps").getAttribute("aria-pressed") === "true" && rows(g).length === 2 && reported(g) === "commons/data/gaps");
  g.w.history.replaceState(null, "", "#commons");
  g.w.dispatchEvent(new g.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("address 5: a later visit on #commons draws the first view, with the line that opens the dashboard",
    !g.d.querySelector("#cdd-h") && g.d.querySelector('#cmn-data-line a[href="#commons/data"]') && reported(g) === "commons");
  g.w.dispatchEvent(new g.w.CustomEvent("cpl-tab-activated", { detail: { tab: "other" } }));
  g.w.history.replaceState(null, "", "#commons/data");
  g.w.dispatchEvent(new g.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("address 6 ⭐: a new visit on #commons/data starts on All, the old filter not remembered",
    txt(g.d.querySelector("#cdd-h")) === "How complete each college's data is" && tile(g, "all").getAttribute("aria-pressed") === "true" && rows(g).length === 5);
  check("storage: nothing in local or session storage names the filter",
    !/gaps|commons\/data/.test(Object.values(g.w.localStorage._o || {}).filter((v) => !/^\{"tab"/.test(v)).join(" ")));
  const u = load("#commons/data/nonsense");
  await u.M.boot(); await settle();
  check("address 7: an unknown filter opens All", tile(u, "all").getAttribute("aria-pressed") === "true" && reported(u) === "commons/data");

  // ── (7) confidence from the receipts ──
  const LV = { 1: ["strong", "5 agree, 0 differ, 0 unreachable"], 2: ["partial", "4 agree, 1 differ, 0 unreachable"], 3: ["limited", "machine checks only; no spot-check yet"] };
  const DATA2 = JSON.parse(JSON.stringify(DATA));
  delete DATA2.tba.confidence;
  DATA2.colleges.forEach((c) => { c.confidence = LV[c.id] ? { level: LV[c.id][0], why: LV[c.id][1] } : null; });
  DATA2.colleges[0].spot_check = { agrees: 5, differs: 0, unreachable: 0 };
  const k = load("#commons/data", DATA2);
  await k.M.boot(); await settle();
  check("confidence 1: no Confidence TBA tile once receipts are read", !plain(k, "Confidence"));
  ["strong", "partial", "limited"].forEach(function (lv) {
    const t = tile(k, lv);
    t && t.click();
    check("confidence 2 ⭐: the " + lv + " figure counts exactly the colleges it opens",
      t && Number(txt(t.querySelector(".cdd-v"))) === rows(k).length && rows(k).length === 1
      && rows(k)[0] === DATA2.colleges.filter((c) => c.confidence && c.confidence.level === lv)[0].name && k.w.location.hash === "#commons/data/" + lv);
  });
  tile(k, "partial").click();
  check("confidence 3: the row shows the level and the builder's reason, not a bare word",
    /^Partial 4 agree, 1 differ, 0 unreachable$/.test(txt(k.d.querySelector('#cdd-colleges tr[data-college="Beta College"] td[data-label="Confidence"]'))));
  tile(k, "all").click();
  check("confidence 4: an unread college reads TBA", txt(k.d.querySelector('#cdd-colleges tr[data-college="Delta College"] td[data-label="Confidence"]')) === "TBA");
  k.d.querySelector('button.cdd-sort[data-sort="conf"]').click();
  check("confidence 5: the column sorts strong first", rows(k)[0] === "Alpha College" && rows(k)[1] === "Beta College" && rows(k)[2] === "Gamma College");
  check("confidence 6: the page derives no level of its own", !/agrees\s*>=|differs\s*>=|STRONG_AT/.test(SRC));

  // ── (8) slice 2: a college's row opened in place, and the same college in the side panel ──
  const DATA3 = JSON.parse(JSON.stringify(DATA2));
  Object.assign(DATA3.tba, { slo: "SLO reason.", plo: "PLO reason.", objectives: "Objectives reason.", catalog_registry: "Registry reason.", ppm: "PPM reason.",
    descriptions: "Descriptions reason.", cpl: "CPL reason.", mis: "MIS reason.", coe: "COE reason.", loaded: "Loaded reason.", owners: "Owners reason.",
    teachout_approved: "Teachout reason." });
  DATA3.rule.causes = { no_closed_list: "no closed list in the Program Course File", page_not_found: "page not found" };
  DATA3.rule.levers = { program_course_file_check: { kind: "free", what: "check the Program Course File for its courses" }, reader_page_search: { kind: "free", what: "a reader change finds the program's page" } };
  DATA3.sources.census = "kb/_harvest_gap_census.py (committed-files functions)";
  Object.assign(DATA3.colleges[0], { listed_closed: 95, found: 90, extracted: 88, platform: "courseleaf", catalog_year: "2026-2027", catalog_url: "https://alpha.example.edu/catalog/",
    read_seconds: 600, run: "123", levers: { program_course_file_check: 20 } });
  DATA3.colleges[0].spot_check = { agrees: 5, differs: 0, unreachable: 0, checked_at: ago(2), file: "kb/spot_checks/a.check.json", pr: 1, held: false };
  Object.assign(DATA3.colleges[2], { platform: "pdf", catalog_year: "2025-2026", levers: { reader_page_search: 30 } });
  const x = load("#commons/data", DATA3);
  await x.M.boot(); await settle();
  const word = (id) => x.d.querySelector('[data-expand="' + id + '"]');
  const more = () => Array.from(x.d.querySelectorAll("#cdd-colleges tr.cdd-more"));
  check("row 1: the college's name is a button word, closed at rest", word(1).tagName === "BUTTON" && word(1).getAttribute("aria-expanded") === "false" && !more().length);
  word(1).click();
  const m1 = x.d.getElementById("cdd-more-1");
  check("row 2 ⭐: the name opens its row in place, aria-expanded and aria-controls naming it",
    word(1).getAttribute("aria-expanded") === "true" && word(1).getAttribute("aria-controls") === "cdd-more-1" && m1 && m1.previousSibling.getAttribute("data-college") === "Alpha College");
  const cards = (m) => Array.from(m.querySelectorAll("[data-ds]")).map((c) => c.getAttribute("data-ds"));
  check("row 3 ⭐: the row shows the datasets the builder holds for that college and nothing else",
    JSON.stringify(cards(m1)) === JSON.stringify(["pr", "cat", "confidence", "cost"]) && !/TBA|PLO|Course objectives|Pathways Mapper/.test(txt(m1)), cards(m1));
  const pr1 = txt(m1.querySelector('[data-ds="pr"]'));
  check("row 4: program requirements read listed, closed list, found, extracted, passing and by cause, with its bar",
    /80 of 100 listed programs/.test(pr1) && /With a closed course list\s*95/.test(pr1) && /Programs whose page the capture found\s*90/.test(pr1) && /Records extracted \(a reread can add some\)\s*88/.test(pr1)
    && /no closed list in the Program Course File 20/.test(pr1) && m1.querySelector('[data-ds="pr"] .cdd-meter i').style.width === "80%");
  check("row 5: the stamp is Pacific time with its age cue from the file", /Updated .* PT \(read\), fresh/.test(pr1));
  check("row 6: the catalog read's platform and year, the spot-check and its reason, the cost",
    /CourseLeaf/.test(txt(m1)) && /2026-2027/.test(txt(m1)) && /Strong/.test(txt(m1.querySelector('[data-ds="confidence"]'))) && /5 agree, 0 differ, 0 unreachable/.test(txt(m1))
    && /\$8\.00/.test(txt(m1)) && /\$0\.100/.test(txt(m1)) && /Page-finding time \(the capture, before the paid read\)\s*10 minutes/.test(txt(m1)) && !/Run time/.test(txt(m1)));
  check("row 7: the open gaps are the census's causes in its words", /No closed list in the Program Course File: 20 programs/.test(txt(m1.querySelector(".cdd-gapbox"))));
  word(2).click();
  const m2 = x.d.getElementById("cdd-more-2");
  check("row 8: one row open at a time; Beta's row shows its SLO queue state", !x.d.getElementById("cdd-more-1") && word(1).getAttribute("aria-expanded") === "false"
    && m2 && cards(m2).indexOf("slo") >= 0 && /SLO read held/.test(txt(m2)) && /a parser/.test(txt(m2)));
  word(4).click();
  const m4 = x.d.getElementById("cdd-more-4");
  check("row 9 ⭐: an unread college's row says Not read yet, never a zero", m4 && !cards(m4).length && /Not read yet/.test(txt(m4)) && !/0%/.test(txt(m4)));
  word(4).click();
  check("row 10: the word closes its row again, and the row is no part of the address", !more().length && x.w.location.hash === "#commons/data");

  // the panel
  word(1).click();
  const opener = x.d.querySelector('[data-panel-open="1"]');
  opener.focus(); opener.click();
  const P = x.d.getElementById("cdd-panel");
  check("panel 1 ⭐: the row's word opens the same college in a dialog beside the list, its heading focused",
    P && !P.hasAttribute("hidden") && P.getAttribute("role") === "dialog" && P.getAttribute("aria-modal") === "true"
    && txt(x.d.getElementById("cdd-panel-h")) === "Alpha College" && x.d.activeElement === x.d.getElementById("cdd-panel-h"));
  check("inert 1 ⭐: while the panel is open, the list behind it is inert (a college word cannot be clicked or reached), the panel is not",
    word(2).closest("[inert]") && x.d.querySelector("#cdd-q").closest("[inert]") && !P.closest("[inert]") && x.d.querySelectorAll("[inert]").length >= 1);
  check("panel 2 ⭐: the address names the college, and the view reports it", x.w.location.hash === "#commons/data/college/alpha-college" && reported(x) === "commons/data/college/alpha-college");
  const sec = (k) => txt(P.querySelector('[data-ds="' + k + '"]'));
  [["plo", "PLO reason."], ["obj", "Objectives reason."], ["ppm", "PPM reason."], ["desc", "Descriptions reason."], ["cpl", "CPL reason."], ["mis", "MIS reason."], ["coe", "COE reason."], ["slo", "SLO reason."]].forEach(function (t) {
    check("panel TBA ⭐: " + t[0] + " reads TBA with the builder's reason, no number", sec(t[0]).indexOf("TBA. " + t[1]) >= 0 && !/\d+%/.test(sec(t[0])));
  });
  check("panel 3: the overall bar reads TBA with its reason; Teachout and Approved too", /Overall\s*TBA\. The live read has not run yet\. Catalog source, SLOs and PLOs are live tables\./.test(txt(P)) && /Teachout and Approved programs: TBA\. The live read has not run yet\./.test(sec("pr")));
  check("panel 4: the panel groups the datasets Harvested then Connected", JSON.stringify(Array.from(P.querySelectorAll(".cdd-psec > h3")).map(txt).slice(2, 4)) === '["Harvested","Connected"]');
  check("panel 5: the dates: last read, last loaded TBA, last spot-checked, last confirmed TBA", /Last read\s*\w.* PT/.test(txt(P)) && /Last loaded\s*TBA/.test(txt(P)) && /Last spot-checked\s*\w.* PT/.test(txt(P)) && /Last confirmed by a person\s*TBA/.test(txt(P)) && /Loaded reason\./.test(txt(P)));
  check("panel 6: the asks are the census's levers in its words, the owner TBA with the reason", /Check the Program Course File for its courses/.test(txt(P)) && /20 programs, free\. Owner: TBA/.test(txt(P)) && /Owners reason\./.test(txt(P)));
  check("panel 7: the catalog's own link, the cost, the sources", P.querySelector('a[href="https://alpha.example.edu/catalog/"]') && /\$8\.00/.test(txt(P)) && /kb\/spot_checks\/a\.check\.json/.test(txt(P)));
  check("panel 8: never 'no data yet'", !/no data yet/i.test(txt(P)) && !/no data yet/i.test(SRC));
  // the focus trap
  const f = Array.from(P.querySelectorAll('a[href], button:not([disabled]), input, [tabindex="0"]'));
  const key = (k, shift) => { const e = new x.w.KeyboardEvent("keydown", { key: k, shiftKey: !!shift, bubbles: true, cancelable: true }); x.d.activeElement.dispatchEvent(e); return e; };
  f[f.length - 1].focus();
  const t1 = key("Tab");
  check("trap 1 ⭐: Tab on the last control returns to the first", t1.defaultPrevented && x.d.activeElement === f[0]);
  const t2 = key("Tab", true);
  check("trap 2 ⭐: Shift+Tab on the first goes to the last", t2.defaultPrevented && x.d.activeElement === f[f.length - 1]);
  x.d.getElementById("cdd-panel-h").focus(); key("Tab", true);
  check("trap 3: Shift+Tab from the heading stays inside", P.contains(x.d.activeElement));
  // the width
  const grip = P.querySelector('[role="separator"]');
  grip.focus(); key("ArrowLeft");
  check("width 1: the edge is a focusable separator; the arrow keys change the width within 300 to 900", grip.getAttribute("aria-valuenow") === "500" && grip.getAttribute("aria-valuemin") === "300" && grip.getAttribute("aria-valuemax") === "900");
  grip.dispatchEvent(new x.w.MouseEvent("dblclick", { bubbles: true }));
  check("width 2: a double-click resets it", grip.getAttribute("aria-valuenow") === "480");
  // Escape
  f[1].focus();
  key("Escape");
  check("escape 1 ⭐: Escape closes the panel and the focus returns to the word that opened it",
    P.hasAttribute("hidden") && x.d.activeElement === x.d.querySelector('[data-panel-open="1"]'));
  check("inert 2 ⭐: closing the panel removes every inert it set", !x.d.querySelector("[inert]"));
  check("escape 2: the address drops the college", x.w.location.hash === "#commons/data" && reported(x) === "commons/data");
  x.d.querySelector('[data-panel-open="1"]').click();
  x.d.getElementById("cdd-panel-close").click();
  check("close: the Close word closes it too, focus returned", P.hasAttribute("hidden") && x.d.activeElement === x.d.querySelector('[data-panel-open="1"]'));
  // a college with no spot-check gets COBIx's ask
  word(3).click(); x.d.querySelector('[data-panel-open="3"]').click();
  check("panel 9: a college with no spot-check carries the spot-check ask, owner COBIx", /Spot-check five records against the catalog.*Owner: COBIx/.test(txt(P)));
  key("Escape");

  // the address round trip
  const y = load("#commons/data/college/beta-college", DATA3);
  await y.M.boot(); await settle();
  const PY = y.d.getElementById("cdd-panel");
  check("address 8 ⭐: #commons/data/college/<slug> opens the panel on that college, its heading focused",
    PY && !PY.hasAttribute("hidden") && txt(y.d.getElementById("cdd-panel-h")) === "Beta College" && y.d.activeElement === y.d.getElementById("cdd-panel-h") && reported(y) === "commons/data/college/beta-college");
  const ke = new y.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
  y.d.activeElement.dispatchEvent(ke);
  check("inert 3: an arrival on a college's address holds the page inert until Escape, then releases it", !y.d.querySelector("[inert]"));
  check("address 9: closing it from an arrival returns the focus to the college's word in the list", PY.hasAttribute("hidden") && y.d.activeElement === y.d.querySelector('[data-expand="2"]'));
  const z = load("#commons/data/gaps/college/gamma-college", DATA3);
  await z.M.boot(); await settle();
  check("address 10 ⭐: a filter and a college together: the gaps list with Gamma's panel",
    tile(z, "gaps").getAttribute("aria-pressed") === "true" && txt(z.d.getElementById("cdd-panel-h")) === "Gamma College" && reported(z) === "commons/data/gaps/college/gamma-college");
  z.w.dispatchEvent(new z.w.CustomEvent("cpl-tab-activated", { detail: { tab: "other" } }));
  z.w.history.replaceState(null, "", "#commons/data");
  z.w.dispatchEvent(new z.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("address 11 ⭐: a new visit on #commons/data opens no panel and no row: nothing remembered",
    z.d.getElementById("cdd-panel").hasAttribute("hidden") && !z.d.querySelector("#cdd-colleges tr.cdd-more") && tile(z, "all").getAttribute("aria-pressed") === "true");
  check("storage: nothing in local or session storage names a college", !/college\/|gamma|beta-college/.test(Object.values(z.w.localStorage._o || {}).filter((v) => !/^\{"tab"/.test(v)).join(" ")));
  const n = load("#commons/data/college/nowhere", DATA3);
  await n.M.boot(); await settle();
  check("address 12: an unknown college opens no panel and reports the list", n.d.getElementById("cdd-panel").hasAttribute("hidden") && reported(n) === "commons/data");
  check("slug: accents drop and words join by hyphens", x.D.slugOf({ name: "Cañada College" }) === "canada-college" && x.D.slugOf({ name: "Mt. San Antonio College" }) === "mt-san-antonio-college");
  check("static: the panel's CSS goes full width under 560px and hides the edge", /max-width: 560px\) \{[\s\S]*\.cdd-panel \{ width:100vw/.test(css) && /\.cdd-grip, \.cdd-gripnote \{ display:none/.test(css));

  // ── (9) the #3231 review: each finding, a check that failed before its fix ──
  // the catalog card: each source its own lines and stamp; both shown, labeled, where the scout and the capture disagree
  const DATA4 = JSON.parse(JSON.stringify(DATA3));
  Object.assign(DATA4.colleges[2], { read_at: ago(40), read_seconds: 300, run: "456", catalog_url: "https://gamma.example.edu/catalog.pdf" });
  Object.assign(DATA4.colleges[2].scout, { platform: "coursedog", catalog_year: "2026-2027", catalog_url: "https://catalog.gamma.example.edu/" });
  const r9 = load("#commons/data", DATA4);
  await r9.M.boot(); await settle();
  // the site's header and menu sit beside the tab, as in COBI; the panel must make them inert, and leaving must release them
  const head9 = r9.d.createElement("header"); head9.id = "site-head"; r9.d.body.insertBefore(head9, r9.d.body.firstChild);
  r9.d.querySelector('[data-expand="3"]').click();
  const cat9 = r9.d.querySelector('#cdd-more-3 [data-ds="cat"]');
  const capP = cat9 && cat9.querySelector('[data-part="capture"]'), scP = cat9 && cat9.querySelector('[data-part="scout"]');
  check("review catalog 1 ⭐: the capture's platform and year carry the capture's own stamp (stale), never the scout's fresh one",
    capP && /PDF/.test(txt(capP)) && /2025-2026/.test(txt(capP)) && /\(read\), stale/.test(txt(capP)) && !/scouted/.test(txt(capP)));
  check("review catalog 2 ⭐: the scout's findings show beside it, labeled, with the scout's stamp",
    scP && /What the source scout found/.test(txt(scP)) && /Coursedog/.test(txt(scP)) && /2026-2027/.test(txt(scP)) && /\(scouted\), fresh/.test(txt(scP)));
  check("review catalog 3: the disagreement is said in words", cat9 && /different platform and catalog year than the capture read/.test(txt(cat9.querySelector("[data-differ]"))));
  r9.d.querySelector('[data-panel-open="3"]').click();
  const P9 = r9.d.getElementById("cdd-panel");
  check("review cost: the capture's time is labeled as the capture's, apart from the paid read's run",
    /Page-finding time \(the capture, before the paid read\)/.test(txt(P9)) && !/Run time/.test(txt(P9)));
  // Escape after a click on the panel's plain text (the focus is then the body)
  r9.d.activeElement.blur();
  r9.d.body.dispatchEvent(new r9.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  check("review escape ⭐: Escape closes the panel when the focus is the body, not the panel", P9.hasAttribute("hidden") && !r9.d.querySelector("[inert]"));
  // the Tab trap skips a control with no box (the width edge is display:none under 560px)
  r9.d.querySelector('[data-panel-open="3"]').click();
  const grip9 = P9.querySelector('[role="separator"]');
  grip9.style.display = "none";
  const f9 = Array.from(P9.querySelectorAll('a[href], button:not([disabled])'));
  f9[f9.length - 1].focus();
  f9[f9.length - 1].dispatchEvent(new r9.w.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
  check("review trap ⭐: Tab on the last control wraps to the first drawn one, past the hidden edge",
    r9.d.activeElement === r9.d.getElementById("cdd-panel-close"));
  // inert released when the address moves to another Commons view while the panel is open
  check("review inert 0: the panel holds the page inert, the site's header with it", head9.hasAttribute("inert"));
  r9.w.history.replaceState(null, "", "#commons");
  r9.w.dispatchEvent(new r9.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("review inert 1 ⭐: moving to #commons with the panel open releases every inert (the header and menu live again)", !head9.hasAttribute("inert") && !r9.d.querySelector("[inert]") && !r9.d.querySelector("#cdd-h"));
  const r10 = load("#commons/data/college/gamma-college", DATA4);
  await r10.M.boot(); await settle();
  r10.w.history.replaceState(null, "", "#commons/ase");
  r10.w.dispatchEvent(new r10.w.HashChangeEvent("hashchange"));
  check("review inert 2: a hashchange to #commons/ase releases it too", !r10.d.querySelector("[inert]"));
  // a session renewal redraws the view as it stands, never the arrival's college
  const r11 = load("#commons/data/college/gamma-college", DATA4);
  await r11.M.boot(); await settle();
  r11.d.getElementById("cdd-panel-close").click();
  r11.w.dispatchEvent(new r11.w.CustomEvent("cpl-session-changed", { detail: { signedIn: true } }));
  await settle();
  check("review renewal 1 ⭐: a renewal after Close does not reopen the arrival's panel", r11.d.getElementById("cdd-panel").hasAttribute("hidden") && r11.w.location.hash === "#commons/data");
  r11.d.querySelector('[data-expand="1"]').click(); r11.d.querySelector('[data-panel-open="1"]').click();
  r11.w.dispatchEvent(new r11.w.CustomEvent("cpl-session-changed", { detail: { signedIn: true } }));
  await settle();
  check("review renewal 2 ⭐: a renewal keeps a panel opened by a click open, on its college",
    !r11.d.getElementById("cdd-panel").hasAttribute("hidden") && txt(r11.d.getElementById("cdd-panel-h")) === "Alpha College" && r11.w.location.hash === "#commons/data/college/alpha-college");

  // ── (10) slice 3: the overall bar and the live counts (read, not read, kept), the dictionary, the API checklist,
  //        the platform filter, the addresses ──
  const LIVE_COLLEGES = {
    1: { names: ["Alpha College"], programs: { active: 100, teachout: 3, approved: 4 },
      records: { total: 96, checked: 2, active: 95, active_passing: 80, active_with_plos: 50 },
      program_courses: { rows: 900, active_courses: 400 },
      outcomes: { slo_courses: 320, slo_courses_on_active: 300, slo_loaded_at: ago(2), objective_courses: 0, objective_courses_on_active: 0, objective_loaded_at: null },
      registry: { row: true, catalog_link: true, course_outline_link: false, sequence_source: false, sequence_checked: true } },
    3: { names: ["Gamma College"], programs: { active: 40, teachout: 0, approved: 1 },
      records: { total: 20, checked: 0, active: 20, active_passing: 10, active_with_plos: 0 },
      program_courses: { rows: 200, active_courses: 100 },
      outcomes: { slo_courses: 0, slo_courses_on_active: 0, slo_loaded_at: null, objective_courses: 0, objective_courses_on_active: 0, objective_loaded_at: null },
      registry: { row: true, catalog_link: true, course_outline_link: true, sequence_source: true, sequence_checked: true } }
  };
  const READ_AT = "2026-11-13T16:00:00Z";
  function withLive(base, state) {
    const d = JSON.parse(JSON.stringify(base));
    if (state === "not read") {
      d.live = { basis: "live", state: "not read yet", read_at: null, colleges: {}, last_attempt: null, flag: "internal" };
      d.overall = { basis: "live", state: "not read yet", read_at: null, rule: "the rule", statewide: { mean: null, colleges: 0 }, colleges: {} };
      return d;
    }
    if (state === "first failed") {
      d.live = { basis: "live", state: "not read yet", read_at: null, colleges: {}, last_attempt: { at: "2026-11-13T17:00:00Z", ok: false, error_class: "timeout" }, flag: "internal" };
      d.overall = { basis: "live", state: "not read yet", read_at: null, rule: "the rule", statewide: { mean: null, colleges: 0 }, colleges: {} };
      return d;
    }
    d.live = { basis: "live", state: "read", read_at: READ_AT, colleges: LIVE_COLLEGES, tables: { programs: "coci_college_programs", records: "program_requirement_records",
      outcomes: "course_outcomes", program_courses: "coci_program_courses", registry: "program_source_registry" }, rule: { registry: "catalog link = catalog_url held" },
      last_attempt: state === "kept" ? { at: "2026-11-14T16:00:00Z", ok: false, error_class: "short read" } : { at: READ_AT, ok: true }, flag: "internal" };
    d.overall = { basis: "live", state: "read", read_at: READ_AT, rule: "the whole-harvest rule", flag: "shareable", statewide: { mean: 0.45, colleges: 2 },
      colleges: { 1: { value: 0.6, parts: { catalog: 0.6667, requirements: 0.8, slos: 0.75, plos: 0.5 } }, 3: { value: 0.3, parts: { catalog: 1, requirements: 0.25, slos: 0, plos: 0 } } } };
    return d;
  }
  const DICT = { source: "docs/reference/data_dictionary.md", flag: "internal", errors: [], datasets: [
    { name: "Program requirements", group: "Harvested", stage: "Connected", owner: "The college (curriculum office).", procedure_today: "A reader files to `kb/program_requirements_college/<slug>/`.",
      planned_improvement: "One matrix run per wave.", link: "docs/reference/data_dictionary.md#program-requirements", evidence: ["kb/program_requirements_college/", "docs/reference/data_sources.md::### Harvest"],
      evidence_cited: ["docs/reference/data_sources.md::### Harvest"], repo_verifiable: true, evidence_missing: [], unverified_claims: 0 },
    { name: "Course descriptions", group: "Connected", stage: "Connected", owner: "CCCCO (COCI).", procedure_today: "A snapshot.", planned_improvement: "The classifier.",
      link: "docs/reference/data_dictionary.md#course-descriptions", evidence: ["kb/reference/coci_course_list.xlsx", "kb/nowhere.json"], evidence_cited: [], repo_verifiable: true, evidence_missing: ["kb/nowhere.json"], unverified_claims: 0 },
    { name: "JST authorizations", group: "Planned", stage: "Asked", owner: "CCCCO; steward *to confirm*. <img src=x onerror=alert(1)>", procedure_today: "Not yet.", planned_improvement: "A feed.",
      link: "docs/reference/data_dictionary.md#jst-authorizations", evidence: ["docs/reference/data_sources.md::### JST"], evidence_cited: ["docs/reference/data_sources.md::### JST"],
      repo_verifiable: false, evidence_missing: [], unverified_claims: 2 },
    { name: "CVC offerings", group: "Planned", stage: "Assessed", owner: "CVC.", procedure_today: "Not yet.", planned_improvement: "A feed.", link: "docs/reference/data_dictionary.md#cvc-offerings",
      evidence: [], evidence_cited: [], repo_verifiable: false, evidence_missing: [], unverified_claims: 1 }
  ] };
  const APIS = { source: "docs/reference/data_dictionary.md#api-connection-checklist", flag: "internal", connected: 1, total: 4, rows: [
    { api: "MAP CustomReport API", holder: "MAP", needed: "yes", status: "connected", claimed: "connected", priority: false, evidence: ["scripts/daily_build.sh::Fetch CustomReport"], evidence_cited: [], evidence_missing: [], note: "Daily pull." },
    { api: "CCCStart API", holder: "CCCCO", needed: "yes", status: "planned", claimed: "planned", priority: true, evidence: ["docs/reference/data_sources.md::### CCCStart"], evidence_cited: ["docs/reference/data_sources.md::### CCCStart"], evidence_missing: [], note: "Lands in `MAP`." },
    { api: "Catalog platform APIs", holder: "Colleges", needed: "yes", status: "unverified", claimed: "connected", priority: false, evidence: [], evidence_cited: [], evidence_missing: ["kb/x.json"], note: "" },
    { api: "A feed nobody needs", holder: "Someone", needed: "no", status: "planned", claimed: "planned", priority: false, evidence: [], evidence_cited: [], evidence_missing: [], note: "" }
  ] };
  const base3 = JSON.parse(JSON.stringify(DATA3));
  base3.dictionary = DICT; base3.apis = APIS;
  const READ = withLive(base3, "read"), KEPT = withLive(base3, "kept"), NOTREAD = withLive(base3, "not read"), FIRSTFAIL = withLive(base3, "first failed");
  const ovCell = (x, n) => txt(x.d.querySelector('#cdd-colleges tr[data-college="' + n + '"] td[data-label="Overall"]'));

  // read
  const s1 = load("#commons/data", READ);
  await s1.M.boot(); await settle();
  const ovT = tile(s1, "overall");
  check("overall 1 ⭐: after a live read the overall tile shows the statewide mean with its basis and date in words, and is a button",
    ovT && ovT.tagName === "BUTTON" && txt(ovT.querySelector(".cdd-v")) === "45%" && /live read, Nov 13, 2026/.test(txt(ovT)) && !plain(s1, "Overall completeness"));
  ovT.click();
  check("overall 2 ⭐: the tile opens the colleges it averages, lowest first, and the address carries it",
    JSON.stringify(rows(s1)) === JSON.stringify(["Gamma College", "Alpha College"]) && s1.w.location.hash === "#commons/data/overall" && reported(s1) === "commons/data/overall"
    && /Mean of 2 colleges/i.test(txt(ovT)));
  check("overall 3 ⭐: the list column shows each college's bar with Live read and its date; a college the read does not hold is not a zero",
    /^60%\s*Live read, Nov 13, 2026$/.test(ovCell(s1, "Alpha College")) || (/60%/.test(ovCell(s1, "Alpha College")) && /Live read, Nov 13, 2026/.test(ovCell(s1, "Alpha College"))));
  s1.d.querySelector("#cdd-all").click();
  check("overall 4: a college outside the live read says so, never 0%", ovCell(s1, "Beta College") === "Not in the live read" && !/0%/.test(ovCell(s1, "Beta College")));
  check("overall 5: the committed basis stays labeled apart from the live one", /From the committed files\./.test(txt(s1.d.querySelector("#cdd-stamp"))) && /From the live read\. .*live read, Nov 13, 2026/.test(txt(s1.d.querySelector("#cdd-stamp-live"))));
  s1.d.querySelector('[data-expand="1"]').click();
  const ovCard = s1.d.querySelector('#cdd-more-1 [data-ds="overall"]');
  check("overall 6: the row shows the overall bar, its four parts and its basis", ovCard && /60%/.test(txt(ovCard)) && /Catalog source\s*67%/.test(txt(ovCard)) && /Program requirements passing\s*80%/.test(txt(ovCard)) && /Live read, Nov 13, 2026/.test(txt(ovCard)));
  s1.d.querySelector('[data-panel-open="1"]').click();
  const P1 = s1.d.getElementById("cdd-panel"), psec = (k) => txt(P1.querySelector('[data-ds="' + k + '"]'));
  check("overall 7 ⭐: the panel's overall section shows the bar and parts, no TBA", /Overall\s*60%/.test(txt(P1)) && /Course SLOs\s*75%/.test(txt(P1)) && !/Overall\s*TBA/.test(txt(P1)));
  check("live 1 ⭐: Active, Teachout and Approved are shown apart, from the live read",
    /Active programs\s*100/.test(psec("pr")) && /Teachout programs \(apart from Active\)\s*3/.test(psec("pr")) && /Approved programs \(apart from Active\)\s*4/.test(psec("pr"))
    && /Program records on file\s*96/.test(psec("pr")) && /Active programs with a passing record\s*80/.test(psec("pr")) && /From the live read, Nov 13, 2026/.test(psec("pr")) && !/Teachout and Approved programs: TBA/.test(psec("pr")));
  check("live 2: the committed figure keeps its own label beside the live lines", /80 of 100 listed programs pass the machine checks/.test(psec("pr")));
  check("live 3 ⭐: SLOs and PLOs read from the live counts with their basis; the TBA lines are gone",
    /300 of 400 courses on Active programs have SLOs/.test(psec("slo")) && /75%/.test(psec("slo")) && /Live read, Nov 13, 2026/.test(psec("slo")) && !/SLO reason/.test(psec("slo"))
    && /50 of 100 Active programs carry PLOs/.test(psec("plo")) && !/PLO reason/.test(psec("plo")) && /0 of 400 courses on Active programs have objectives/.test(psec("obj")));
  const reg = P1.querySelector('[data-ds="cat"] [data-part="registry"]');
  check("live 4 ⭐: the registry checks are words, held or not, never 'checked'",
    reg && /Catalog link\s*held/.test(txt(reg)) && /Curriculum view\s*not held/.test(txt(reg)) && /Pathway source\s*none found when looked for/.test(txt(reg)) && !/checked/i.test(txt(reg)) && !/Registry reason/.test(psec("cat")));
  check("live 5: the rest keep their committed-file reasons", /TBA\. PPM reason\./.test(psec("ppm")) && /TBA\. MIS reason\./.test(psec("mis")) && /TBA\. COE reason\./.test(psec("coe")));
  check("live 6: the live sources are named", /live: coci_college_programs; program_requirement_records/.test(psec("pr")) && /live: course_outcomes/.test(psec("slo")));
  // the view changes while the panel is open: nothing stays inert
  const hd = s1.d.createElement("header"); hd.id = "site-head2"; s1.d.body.insertBefore(hd, s1.d.body.firstChild);
  s1.D.closePanel(); s1.D.openPanel(1);
  check("inert 4: the panel holds the page inert", hd.hasAttribute("inert"));
  s1.w.history.replaceState(null, "", "#commons/data/dictionary");
  s1.w.dispatchEvent(new s1.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("inert 5 ⭐: moving to the dictionary view with the panel open hides the panel and releases every inert",
    !s1.d.querySelector("[inert]") && s1.d.getElementById("cdd-panel").hasAttribute("hidden") && s1.d.getElementById("cdd-dict") && reported(s1) === "commons/data/dictionary");

  // kept
  const s2 = load("#commons/data", KEPT);
  await s2.M.boot(); await settle();
  check("kept 1 ⭐: a kept block says its figures are from the earlier read, with that read's date and the failed attempt's",
    /did not complete \(short read\); these figures are from the earlier read of Nov 13, 2026/.test(txt(tile(s2, "overall"))) && /Nov 14, 2026/.test(txt(tile(s2, "overall")))
    && /earlier read of Nov 13, 2026/.test(txt(s2.d.querySelector("#cdd-stamp-live"))));
  s2.d.querySelector('[data-expand="1"]').click(); s2.d.querySelector('[data-panel-open="1"]').click();
  check("kept 2: the panel's overall says it too", /earlier read of Nov 13, 2026/.test(txt(s2.d.querySelector('#cdd-panel [data-kept]'))));

  // not read, and a first attempt that failed
  const s3 = load("#commons/data", NOTREAD);
  await s3.M.boot(); await settle();
  check("not read 1 ⭐: until the first live read the overall tile reads TBA with the reason, and opens nothing",
    plain(s3, "Overall completeness") && txt(plain(s3, "Overall completeness").querySelector(".cdd-v")) === "TBA" && /The live read has not run yet\./.test(txt(plain(s3, "Overall completeness"))) && !tile(s3, "overall"));
  check("not read 2: every row's overall reads TBA", Array.from(s3.d.querySelectorAll('#cdd-colleges td[data-label="Overall"]')).every((td) => txt(td) === "TBA"));
  s3.d.querySelector('[data-expand="1"]').click(); s3.d.querySelector('[data-panel-open="1"]').click();
  const P3 = s3.d.getElementById("cdd-panel");
  check("not read 3: the panel's live lines read TBA with the reason; the committed reasons stay", /Overall\s*TBA\. The live read has not run yet\./.test(txt(P3))
    && /Teachout and Approved programs: TBA\. The live read has not run yet\./.test(txt(P3)) && /TBA\. PLO reason\./.test(txt(P3)) && !P3.querySelector('[data-part="registry"]'));
  const s4 = load("#commons/data", FIRSTFAIL);
  await s4.M.boot(); await settle();
  check("not read 4: a first attempt that failed is named, still TBA", /The live read has not run yet\. Its last attempt, Nov 13, 2026, did not complete \(timeout\)\./.test(txt(plain(s4, "Overall completeness"))));

  // the API checklist and its tile
  const at = s3.d.querySelector('.cdd-tile[data-view="apis"]');
  check("apis 1 ⭐: APIs connected reads connected of needed, the unverified one not counted, and is a button",
    at && at.tagName === "BUTTON" && txt(at.querySelector(".cdd-v")) === "1 of 3" && /1 read unverified/.test(txt(at)));
  at.click();
  const AT = s3.d.getElementById("cdd-api-table");
  const st = (n) => (s3.d.querySelector('#cdd-api-table tr[data-api="' + n + '"]') || { getAttribute: () => "" }).getAttribute("data-status");
  check("apis 2 ⭐: the tile opens the checklist at its address", AT && s3.w.location.hash === "#commons/data/apis" && reported(s3) === "commons/data/apis" && txt(s3.d.querySelector("#cdd-h")) === "The API checklist");
  check("apis 3 ⭐: each status in words; unverified never reads connected; a connection not needed says so",
    st("MAP CustomReport API") === "connected" && st("CCCStart API") === "planned" && st("Catalog platform APIs") === "unverified" && st("A feed nobody needs") === "not needed"
    && /Claimed connected; no evidence for it in the repo/.test(txt(s3.d.querySelector('#cdd-api-table tr[data-api="Catalog platform APIs"]'))));
  check("apis 4: evidence in the repo and evidence only cited are shown apart",
    /Verifiable in the repo \(0\)/.test(txt(s3.d.querySelector('#cdd-api-table tr[data-api="CCCStart API"]'))) && /Cited, outside the repo's checks \(1\)/.test(txt(s3.d.querySelector('#cdd-api-table tr[data-api="CCCStart API"]')))
    && /Verifiable in the repo \(1\)/.test(txt(s3.d.querySelector('#cdd-api-table tr[data-api="MAP CustomReport API"]'))));
  check("apis 5: th scope, a labeled scrolling region, the doc's code spans as code", AT.querySelectorAll("th[scope]").length === AT.querySelectorAll("th").length && AT.closest('[role="region"][aria-label="The API checklist"]') && AT.querySelector("code"));
  check("apis 6: no tiles, no list and no Coming next on the checklist view", !s3.d.querySelector(".cdd-tiles") && !s3.d.querySelector("#cdd-colleges") && !s3.d.querySelector("#cdd-next"));

  // the dictionary
  s3.d.querySelector('.cdd-views a[data-goto="dictionary"]').click();
  const DV = s3.d.getElementById("cdd-dict");
  check("dict 1 ⭐: the view word opens the dictionary at its address", DV && s3.w.location.hash === "#commons/data/dictionary" && reported(s3) === "commons/data/dictionary"
    && s3.d.querySelector('.cdd-views a[aria-current="page"]').getAttribute("data-goto") === "dictionary");
  check("dict 2 ⭐: one entry per dataset, grouped as the doc groups them, in its order",
    JSON.stringify(Array.from(DV.querySelectorAll(".cdd-dgroup")).map((g) => g.getAttribute("data-group"))) === '["Harvested","Connected","Planned"]' && DV.querySelectorAll("article.cdd-entry").length === 4);
  const ent = (n) => DV.querySelector('article[data-dataset="' + n + '"]');
  check("dict 3: each entry gives its stage, owner, today's procedure, the planned improvement and a GitHub link to the doc's anchor",
    /Stage\s*Connected/.test(txt(ent("Program requirements"))) && /Owner or steward\s*The college/.test(txt(ent("Program requirements"))) && /How we get it today/.test(txt(ent("Program requirements")))
    && /Planned improvement\s*One matrix run/.test(txt(ent("Program requirements")))
    && ent("Program requirements").querySelector('a[href="https://github.com/cpl-initiative/cpl-project-tracker/blob/main/docs/reference/data_dictionary.md#program-requirements"]'));
  check("dict 4 ⭐: repo-verifiable and cited evidence shown apart in words; a missing file named",
    /Verifiable in the repo \(1\)/.test(txt(ent("Program requirements"))) && /Cited, outside the repo's checks \(1\)/.test(txt(ent("Program requirements")))
    && /Named but not found in the repo \(1\)\s*kb\/nowhere\.json/.test(txt(ent("Course descriptions"))));
  check("dict 5 ⭐: an unverified claim is marked in words", /Unverified: nothing in the repo outside the doc family backs this entry\. 2 claims in this entry are marked unverified/.test(txt(ent("JST authorizations")))
    && !ent("Program requirements").querySelector("[data-unverified]"));
  check("dict 6 ⭐: text only: markup in the file stays text, a *mark* loses its asterisks",
    !DV.querySelector("img") && /<img src=x/.test(txt(ent("JST authorizations"))) && /steward to confirm/.test(txt(ent("JST authorizations"))));
  check("static: no innerHTML anywhere in the view", !/innerHTML|insertAdjacentHTML|outerHTML/.test(SRC));

  // Coming next, from the dictionary's stages
  const s5 = load("#commons/data", READ);
  await s5.M.boot(); await settle();
  const nx = s5.d.getElementById("cdd-next");
  check("next 1 ⭐: one Coming next section at the foot, each feature a line with what it waits on",
    nx && s5.d.querySelectorAll("#cdd-next").length === 1 && nx === s5.d.querySelector(".cmn-wrap.cdd").lastElementChild
    && ["The College view", "AI workers per college", "The JST funnel", "SIS and curriculum system tiles", "Program Pathways Mapper reads per college", "Course descriptions per college",
      "MIS course matches per college", "COE regional demand per college", "Planned datasets"].every((k) => nx.querySelector('[data-next="' + k + '"]')));
  check("next 2: the JST line carries the dictionary's stage; the planned line lists each planned dataset at its stage",
    /Dictionary stage: Asked\./.test(txt(nx.querySelector('[data-next="The JST funnel"]'))) && /JST authorizations \(Asked\); CVC offerings \(Assessed\)/.test(txt(nx.querySelector('[data-next="Planned datasets"]'))));
  check("next 3: the College view stays internal: no share link, nothing addressed to a college", /no share link/.test(txt(nx)) && !s5.d.querySelector('a[href*="share"]'));

  // the platform filter
  const pb = (x, k) => x.d.querySelector('.cdd-plat[data-platform="' + k + '"]');
  check("platform 1: a word per platform the captures read, with its count, Any pressed", pb(s5, "any").getAttribute("aria-pressed") === "true" && /CourseLeaf \(1\)/.test(txt(pb(s5, "courseleaf"))) && /PDF \(1\)/.test(txt(pb(s5, "pdf"))));
  pb(s5, "pdf").click();
  check("platform 2 ⭐: a platform narrows the list and lives in the address", JSON.stringify(rows(s5)) === '["Gamma College"]' && s5.w.location.hash === "#commons/data/platform/pdf"
    && reported(s5) === "commons/data/platform/pdf" && pb(s5, "pdf").getAttribute("aria-pressed") === "true" && /catalog platform PDF/.test(txt(s5.d.querySelector("#cdd-shown"))));
  tile(s5, "gaps").click();
  check("platform 3: a figure opens its whole list, the platform cleared", s5.w.location.hash === "#commons/data/gaps" && rows(s5).length === 2);
  const s6 = load("#commons/data/gaps/platform/pdf/college/gamma-college", READ);
  await s6.M.boot(); await settle();
  check("platform 4 ⭐: filter, platform and college round-trip from the address", tile(s6, "gaps").getAttribute("aria-pressed") === "true" && JSON.stringify(rows(s6)) === '["Gamma College"]'
    && txt(s6.d.getElementById("cdd-panel-h")) === "Gamma College" && reported(s6) === "commons/data/gaps/platform/pdf/college/gamma-college");
  s6.w.dispatchEvent(new s6.w.CustomEvent("cpl-tab-activated", { detail: { tab: "other" } }));
  s6.w.history.replaceState(null, "", "#commons/data");
  s6.w.dispatchEvent(new s6.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("platform 5 ⭐: a new visit remembers no platform; nothing stored", pb(s6, "any").getAttribute("aria-pressed") === "true" && rows(s6).length === 5
    && !/platform|pdf/.test(Object.values(s6.w.localStorage._o || {}).filter((v) => !/^\{"tab"/.test(v)).join(" ")));
  const s7 = load("#commons/data/platform/nowhere", READ);
  await s7.M.boot(); await settle();
  check("platform 6: an unknown platform opens the whole list", rows(s7).length === 5 && reported(s7) === "commons/data");
  const s8 = load("#commons/data/apis", READ);
  await s8.M.boot(); await settle();
  check("address 13 ⭐: #commons/data/apis opens the checklist from its arrival", s8.d.getElementById("cdd-api-table") && reported(s8) === "commons/data/apis");
  s8.d.querySelector('.cdd-views a[data-goto="list"]').click();
  check("address 14: the list word returns to the list", s8.d.getElementById("cdd-colleges") && s8.w.location.hash === "#commons/data");

  // ── (11) the review of #3236: each confirmed finding, a check that failed before its fix ──
  const R2 = JSON.parse(JSON.stringify(READ));
  R2.colleges[1].platform = "pdf";                                   // Beta: pdf too, so pdf counts 2 statewide
  R2.live.colleges[4] = JSON.parse(JSON.stringify(LIVE_COLLEGES[1]));   // Delta: never harvested, but in the live read
  R2.live.colleges[3].outcomes.slo_courses_on_active = null;            // Gamma: one table came back without a count
  R2.live.colleges[3].registry = { row: false, catalog_link: false, course_outline_link: false, sequence_source: false, sequence_checked: false };
  R2.overall.statewide.colleges = 7;                                    // the builder's own count behind its mean
  const v1 = load("#commons/data/college/beta-college", R2);
  await v1.M.boot(); await settle();
  const PB = v1.d.getElementById("cdd-panel"), bsec = (k) => txt(PB.querySelector('[data-ds="' + k + '"]'));
  check("review3236 missing 1 ⭐: a college the completed live read does not hold gets its own true reason, never 'has not run yet'",
    /Teachout and Approved programs: TBA\. The live read holds no counts for this college\./.test(bsec("pr")) && !/has not run yet/.test(txt(PB)));
  check("review3236 missing 2 ⭐: its SLO, PLO, objective and registry sections say the same, not the not-carried reasons",
    ["slo", "plo", "obj", "cat"].every((k) => /The live read holds no counts for this college\./.test(bsec(k))) && !/Registry reason|PLO reason|Objectives reason/.test(txt(PB)));
  const v2 = load("#commons/data/college/alpha-college", R2);
  await v2.M.boot(); await settle();
  const PA = v2.d.getElementById("cdd-panel"), asec = (k) => txt(PA.querySelector('[data-ds="' + k + '"]'));
  check("review3236 stamp 1 ⭐: a live figure carries the live read's stamp, never 'Not yet' (PLOs, objectives with no load time)",
    /Updated .* PT \(live read\)/.test(asec("plo")) && !/Not yet/.test(asec("plo")) && !/Not yet/.test(asec("obj")));
  const v3 = load("#commons/data/college/delta-college", R2);
  await v3.M.boot(); await settle();
  const PD = v3.d.getElementById("cdd-panel");
  check("review3236 stamp 2: program requirements for a college in the live read but never harvested carry the live stamp",
    /\(live read\)/.test(txt(PD.querySelector('[data-ds="pr"]'))) && !/Not yet/.test(txt(PD.querySelector('[data-ds="pr"]'))) && /Teachout programs \(apart from Active\)\s*3/.test(txt(PD.querySelector('[data-ds="pr"]'))));
  const v4 = load("#commons/data/college/gamma-college", R2);
  await v4.M.boot(); await settle();
  const PG = v4.d.getElementById("cdd-panel"), gsec = (k) => txt(PG.querySelector('[data-ds="' + k + '"]'));
  check("review3236 null ⭐ (COBIx 1): a count the live read lacks reads TBA, never 0%", /TBA\./.test(gsec("slo")) && !/0%|0 of/.test(gsec("slo")));
  const regG = PG.querySelector('[data-ds="cat"] [data-part="registry"]');
  check("review3236 registry (COBIx 3): no registry row reads as such, not three not-held lines", regG && /No registry row for this college/.test(txt(regG)) && !/not held|not looked for/.test(txt(regG)));
  const v5 = load("#commons/data", R2);
  await v5.M.boot(); await settle();
  check("review3236 tile (COBIx 2): the overall tile's count is the builder's, the set behind its mean", /The mean of 7 colleges/.test(txt(tile(v5, "overall"))));
  tile(v5, "gaps").click();
  const pw = v5.d.querySelector('.cdd-plat[data-platform="pdf"]');
  const said = Number((txt(pw).match(/\((\d+)\)/) || [])[1]);
  pw.click();
  check("review3236 platform ⭐: under an active filter a platform word's figure equals the list it opens, and the filter stays",
    said === rows(v5).length && rows(v5).length === 1 && v5.w.location.hash === "#commons/data/gaps/platform/pdf");

  const failed = results.filter((x) => !x[1]);
  results.forEach((x) => console.log((x[1] ? "PASS " : "FAIL ") + x[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
