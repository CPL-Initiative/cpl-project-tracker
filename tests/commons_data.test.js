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
  ["Overall completeness", "Confidence", "APIs connected", "JST funnel"].forEach(function (l) {
    const t = plain(o, l);
    check("TBA ⭐: " + l + " reads TBA with its reason and opens nothing", t && txt(t.querySelector(".cdd-v")) === "TBA" && t.tagName === "DIV" && txt(t.querySelector(".cdd-d")).length > 0);
  });
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
    /80 of 100 listed programs/.test(pr1) && /With a closed course list\s*95/.test(pr1) && /Pages found at read time\s*90/.test(pr1) && /Extracted at read time\s*88/.test(pr1)
    && /no closed list in the Program Course File 20/.test(pr1) && m1.querySelector('[data-ds="pr"] .cdd-meter i').style.width === "80%");
  check("row 5: the stamp is Pacific time with its age cue from the file", /Updated .* PT \(read\), fresh/.test(pr1));
  check("row 6: the catalog read's platform and year, the spot-check and its reason, the cost",
    /CourseLeaf/.test(txt(m1)) && /2026-2027/.test(txt(m1)) && /Strong/.test(txt(m1.querySelector('[data-ds="confidence"]'))) && /5 agree, 0 differ, 0 unreachable/.test(txt(m1))
    && /\$8\.00/.test(txt(m1)) && /\$0\.100/.test(txt(m1)) && /10 minutes/.test(txt(m1)));
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
  check("panel 3: the overall bar reads TBA with its reason; Teachout and Approved too", /Overall\s*TBA\. Catalog source, SLOs and PLOs are live tables\./.test(txt(P)) && /Teachout and Approved programs: TBA\. Teachout reason\./.test(sec("pr")));
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

  const failed = results.filter((x) => !x[1]);
  results.forEach((x) => console.log((x[1] ? "PASS " : "FAIL ") + x[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
