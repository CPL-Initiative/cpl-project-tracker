// tests/commons_data_cards.test.js — the three college cards in College Data Collection (#3310, Sam, 2026-11-14):
// How it's collected, Program pathway maps, Data sources with the SIS and curriculum system integration line
// (commons_data_cards.js, drawn into the side panel through commons_data.js's card hook).
//
// The page goes to the Chancellor's Office research and data staff, so every line is true or says it is not known.
// Each card is checked in its three states, over the REAL committed rows (kb/status/commons_data.json) for Columbia
// College, Modesto Junior College and Mt. San Antonio College, plus a fixture college with nothing held:
//   held                        Columbia's readers, runs and cost; Mt. SAC's committed maps; Modesto's mapper host
//   looked for, none found      Columbia's pathway maps (the registry looked, found none); a college with records
//                               and no PLOs
//   not known                   the SIS everywhere; every line of the college with nothing held
// and: the integration line reads "None known" for every committed college (nothing records one); no SIS is
// guessed; no person's name; tokens only; the module loads through CPL_TABS.loadScript the first time a panel draws.
//
// Run from repo root: `npm test` (or `node tests/commons_data_cards.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, cond ? "" : detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_data.js", "utf8");
const CARDS = fs.readFileSync("commons_data_cards.js", "utf8");
const REAL = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));
const STATUS = { schema: 1, written_at: "2026-11-12T06:00:00Z", rows: [] };

const pickC = (n) => REAL.colleges.find((c) => c.name === n);
const COL = pickC("Columbia College"), MJC = pickC("Modesto Junior College"), MTSAC = pickC("Mt. San Antonio College");
const NOTHING = { id: 99901, name: "Nowhere College", district: "Nowhere CCD", kind: "college", harvested: false, slug: null, programs: null, passing: null,
  gap: null, causes: null, read_at: null, read_kind: null, cost_usd: null, passed_at_read: null, slo_queue: null, scout: null, spot_check: null, confidence: null,
  collection: { program_reader: null, slo_read: null, plo_programs: 0, ppm_member: null, maps: { held: 0, on_records: 0, files: [] }, integration: { state: "none_known" } } };
// A college with filed records and no PLOs among them: the reader looked and found none (Columbia's row, PLOs taken out).
const NOPLO = JSON.parse(JSON.stringify(COL));
Object.assign(NOPLO, { id: 99902, name: "Noplo College", slug: "noplo" });
NOPLO.collection.plo_programs = 0;
// A college whose integration someone recorded as one to confirm (no committed college carries one today).
const ASK = JSON.parse(JSON.stringify(NOTHING));
Object.assign(ASK, { id: 99903, name: "Askme College" });
ASK.collection.integration = { state: "ask" };

function dataWith(colleges) {
  const d = JSON.parse(JSON.stringify(REAL));
  d.colleges = colleges.map((c) => JSON.parse(JSON.stringify(c)));
  const keep = new Set(colleges.map((c) => String(c.id)));
  d.live.colleges = Object.fromEntries(Object.entries(REAL.live.colleges).filter(([k]) => keep.has(k)));
  return d;
}
const DATA = dataWith([COL, MJC, MTSAC, NOTHING, NOPLO, ASK]);

function load(hash, data, opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, lazy = [];
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; }, _o: o }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = { "kb/status/commons_data.json": data, "kb/status/commons.json": STATUS };
  w.fetch = function (url) {
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  if (opts.lazy) {
    // The real tab loads the module through CPL_TABS.loadScript the first time a panel draws.
    w.CPL_TABS = { loadScript: function (src, name, cb) { lazy.push(src); setTimeout(function () { const t = w.document.createElement("script"); t.textContent = CARDS; w.document.body.appendChild(t); cb(); }, 0); } };
  }
  [SESSION, PROGRESS, SRC].concat(opts.lazy ? [] : [CARDS]).concat([COMMONS]).forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, lazy };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
const card = (x, k) => x.d.querySelector('#cdd-panel [data-card="' + k + '"]');
const lane = (x, k) => x.d.querySelector('#cdd-panel [data-card="how"] [data-lane="' + k + '"]');
// The dl's value for a label inside a node.
function val(node, label) {
  if (!node) return null;
  const dt = Array.from(node.querySelectorAll("dt")).find((t) => txt(t) === label);
  return dt ? txt(dt.nextElementSibling) : null;
}
async function panel(slug) { const x = load("#commons/data/college/" + slug, DATA); await x.M.boot(); await settle(); return x; }

(async function () {
  // ── static ──
  const css = CARDS.slice(CARDS.indexOf("var CSS = ["), CARDS.indexOf("].join(", CARDS.indexOf("var CSS = [")));
  check("static: the module's CSS names no raw hex color and uses the tab's --cmn tokens", !/#[0-9a-fA-F]{3,8}\b/.test(css) && /var\(--cmn-/.test(css));
  check("static: no storage, no write path, no fetch in the module", !/localStorage|sessionStorage|fetch\(|method:\s*"(POST|PATCH|PUT|DELETE)"/.test(CARDS));
  check("static: the builder's committed rows carry the collection key for every college", REAL.colleges.every((c) => c.collection && c.collection.integration) && REAL.collection && REAL.fields.collection === "internal");

  // ── Columbia College: the real row ──
  const x = await panel("columbia-college");
  check("hook: the three cards draw in the panel, in order, after the datasets and before Dates",
    JSON.stringify(Array.from(x.d.querySelectorAll("#cdd-panel .cdd-psec > h3")).map(txt).filter((h) => /collected|pathway maps|Data sources|Dates/.test(h))) === '["How it\'s collected","Program pathway maps","Data sources","Dates"]');

  // How it's collected: held
  const pr = lane(x, "programs");
  check("how, held ⭐: program requirements name the reader, the model the records name, the workflow and run, the last run and the receipt's cost",
    /eLumen catalogs: a capture, then extraction by claude-opus-5-5, 82 records filed/.test(val(pr, "Who or what")) && /GitHub Actions run 42471133430/.test(val(pr, "Workflow"))
    && /Nov 8, 2026/.test(val(pr, "Last run")) && val(pr, "Cost") === "$5.46, from the run's receipt", txt(pr));
  const sl = lane(x, "slos");
  check("how, held ⭐: course SLOs name the course outcomes reader, eLumen's catalog course pages, its run, and no model cost",
    /course outcomes reader \(kb\/_course_outcomes_read\.py\), reading eLumen: the course pages of its public catalog/.test(val(sl, "Who or what"))
    && /Course outcomes read; GitHub Actions run 41979319035/.test(val(sl, "Workflow")) && /Nov 4, 2026|Nov 5, 2026/.test(val(sl, "Last run"))
    && /^No model cost/.test(val(sl, "Cost")) && !!sl.querySelector('button[data-pane="slos"]'), txt(sl));
  const pl = lane(x, "plos");
  check("how, held: PLOs read with each record by the same run, the cost part of that read, the figure opens the PLOs",
    txt(pl.querySelector(".cdd-state")) === "Held" && /the same run/.test(val(pl, "Who or what")) && /not recorded apart/.test(val(pl, "Cost"))
    && txt(pl.querySelector('button[data-pane="plos"]')) === "82 program records carry PLOs", txt(pl));
  const cat = lane(x, "catalog");
  check("how: the catalog source names the registry link the capture read, and its cost reads Not recorded",
    /program source registry's catalog link, read by the program requirements capture/.test(val(cat, "Who or what")) && val(cat, "Cost") === "Not recorded");

  // Program pathway maps: looked for, none found
  const mp = card(x, "maps");
  check("maps, none found ⭐: Columbia reads None found when looked for, apart from not looked for yet",
    txt(mp.querySelector(".cdd-state")) === "None found when looked for" && /^None found when looked for/.test(val(mp, "Program source registry"))
    && val(mp, "Publishes maps") === "None found when looked for" && val(mp, "Where") === "None found" && val(mp, "Maps we hold") === "None", txt(mp));
  check("maps: against Active programs, Columbia's 82 from the live read", /None held, so none to line up with its 82 Active programs \(live read/.test(val(mp, "Against Active programs")));
  check("maps: the Pathway source line left the Catalog source card for this one", !/Pathway source/.test(txt(x.d.querySelector('#cdd-panel [data-ds="cat"]'))));

  // Data sources
  const ds = card(x, "sources");
  check("sources, not known ⭐: the SIS reads Not known and Not read yet; never a vendor", val(ds, "Student information system (SIS)") === "Not known. Not read yet."
    && !/Banner|Colleague|PeopleSoft/.test(txt(ds)), val(ds, "Student information system (SIS)"));
  check("sources, held ⭐: the curriculum system is eLumen, read directly through its catalog's course pages",
    val(ds, "Curriculum system (course outlines)") === "eLumen. Read directly: the course pages of its public catalog.", val(ds, "Curriculum system (course outlines)"));
  check("sources, held: the catalog platform is eLumen, read directly by the capture", /^eLumen\. Read directly: its public catalog pages, by the program requirements capture\.$/.test(val(ds, "Catalog platform")));
  check("sources, none found: the program maps read None found when looked for", /^None found when looked for\. Nothing to read\.$/.test(val(ds, "Program maps")), val(ds, "Program maps"));
  check("sources: COCI is read through an export, with the Active programs the live read holds from it",
    /^COCI\. Read through an export: the committed COCI course and program extracts, loaded by the COCI offerings sync workflow; the 82 Active programs here come from it \(live read, .*\)\.$/.test(val(ds, "COCI (the Chancellor's Office Curriculum Inventory)")));
  const ig = ds.querySelector('[data-lane="integration"]');
  check("integration ⭐: SIS and curriculum system integration reads None known", txt(ig.querySelector(".cdd-state")) === "None known" && /None is recorded for this college/.test(txt(ig)));
  check("no person's name or email on any card", !/\bSam\b|Pedro|Malone|Craig|Jory|@/.test(["how", "maps", "sources"].map((k) => txt(card(x, k))).join(" ")));

  // ── Modesto Junior College: a mapper on the member list, the registry's own check beside it ──
  const y = await panel("modesto-junior-college");
  const my = card(y, "maps");
  check("maps, held ⭐: Modesto is listed as a Program Pathways Mapper member, at its host, platform named",
    txt(my.querySelector(".cdd-state")) === "Publishes maps" && val(my, "Where") === "programmap.mjc.edu" && val(my, "Platform") === "Program Pathways Mapper"
    && val(my, "Program Pathways Mapper member list") === "Listed, at programmap.mjc.edu", txt(my));
  check("sources: Modesto's program maps name the mapper and say they are not read yet", /^Program Pathways Mapper \(programmap\.mjc\.edu\)\. Not read yet\.$/.test(val(card(y, "sources"), "Program maps")), val(card(y, "sources"), "Program maps"));

  // ── Mt. San Antonio College: committed maps, lined up against its records ──
  const z = await panel("mt-san-antonio-college");
  const mz = card(z, "maps");
  check("maps, held ⭐: Mt. SAC's two committed maps, each against its committed program records",
    /^2 term-by-term maps, committed$/.test(val(mz, "Maps we hold")) && /^2 of the 2 name a program in the college's committed program records/.test(val(mz, "Against Active programs")), txt(mz));
  check("sources: committed maps read directly", /Read directly: 2 maps committed\.$/.test(val(card(z, "sources"), "Program maps")));

  // ── a college with nothing held: every card in its not-known state ──
  const n = await panel("nowhere-college");
  const nh = card(n, "how");
  check("how, not known ⭐: with nothing held, each lane says so and every value reads Not recorded, never a zero",
    JSON.stringify(Array.from(nh.querySelectorAll(".cdc-lane .cdd-state")).map(txt)) === '["Not known","Not read yet","Not read yet","Not read yet"]'
    && Array.from(nh.querySelectorAll("dd")).every((d) => txt(d) === "Not recorded") && !/\$0|\b0 /.test(txt(nh)), txt(nh));
  const nm = card(n, "maps");
  check("maps, not known ⭐: Not looked for yet, where and platform Not known", txt(nm.querySelector(".cdd-state")) === "Not looked for yet"
    && val(nm, "Where") === "Not known" && val(nm, "Platform") === "Not known" && val(nm, "Maps we hold") === "None", txt(nm));
  const nd = card(n, "sources");
  check("sources, not known ⭐: every system Not known and Not read yet, but COCI, which is a statewide export",
    ["Student information system (SIS)", "Curriculum system (course outlines)", "Catalog platform", "Program maps"].every((l) => val(nd, l) === "Not known. Not read yet.")
    && /^COCI\. Read through an export/.test(val(nd, "COCI (the Chancellor's Office Curriculum Inventory)")), txt(nd));

  // ── a college with records and no PLOs: looked for, none found ──
  const p = await panel("noplo-college");
  check("how, none found ⭐: records filed with no PLOs read None found when looked for, with the reason", txt(lane(p, "plos").querySelector(".cdd-state")) === "None found when looked for"
    && /none of this college's committed records carries any/.test(txt(lane(p, "plos"))));

  // ── the integration line's other state ──
  const a = await panel("askme-college");
  check("integration: a college recorded to confirm reads the role, never a name", txt(card(a, "sources").querySelector('[data-lane="integration"] .cdd-state')) === "Ask the MAP team's curriculum system lead to confirm");

  // ── counts over the committed file ──
  check("integration ⭐: every committed college reads none known (nothing in the repo records a connection)", REAL.colleges.every((c) => c.collection.integration.state === "none_known"));
  check("committed: Columbia holds no Program Pathways Mapper entry and no committed map", COL.collection.ppm_member === null && COL.collection.maps.held === 0);

  // ── the lazy path: the real tab loads the module the first time a panel draws, then draws the panel again ──
  const l = load("#commons/data/college/columbia-college", DATA, { lazy: true });
  await l.M.boot(); await settle();
  check("lazy ⭐: the panel asks CPL_TABS for commons_data_cards.js once and draws the cards when it arrives",
    JSON.stringify(l.lazy) === '["commons_data_cards.js"]' && !!card(l, "how") && !!card(l, "maps") && !!card(l, "sources"), JSON.stringify(l.lazy));

  // ── the statewide maps line (COBIx's review of #3316): the committed count, then none found and not known, each the
  //    word that opens the colleges it counts ──
  const s = load("#commons/data", DATA);
  await s.M.boot(); await settle();
  const ml = s.d.querySelector("[data-maps-line]");
  const heldMaps = (DATA.collection.maps || {}).held;
  check("maps line ⭐: the statewide line gives the committed maps' count, and none found and not known beside it, never TBA",
    ml && new RegExp("^" + heldMaps + " term-by-term maps? committed").test(txt(ml)) && /none found when looked for/.test(txt(ml)) && /not looked for yet/.test(txt(ml)) && !/not known/.test(txt(ml)) && !/TBA|Waits on/.test(txt(ml.parentNode)), txt(ml));
  const D = s.w.CPL_COMMONS_DATA, MM = D.model(DATA);
  const noneU = D.listFor(MM, "maps_none"), unk = D.listFor(MM, "maps_unknown");
  check("maps line: none found and not known never overlap, and a college with committed maps is in neither",
    noneU.every((c) => unk.indexOf(c) < 0) && D.listFor(MM, "maps").every((c) => c.collection.maps.held > 0 && noneU.indexOf(c) < 0 && unk.indexOf(c) < 0));
  const pubU = D.listFor(MM, "maps_published"), heldU = D.listFor(MM, "maps");
  check("maps line ⭐: the four counts (committed, published not yet committed, none found, not looked for yet) add up to every college, none counted twice",
    heldU.length + pubU.length + noneU.length + unk.length === MM.colleges.length
      && new Set(heldU.concat(pubU, noneU, unk)).size === MM.colleges.length,
    [heldU.length, pubU.length, noneU.length, unk.length, MM.colleges.length].join(" + "));
  check("maps line: a college that publishes maps not yet committed has no committed map",
    pubU.every((c) => !((c.collection || {}).maps || {}).held));
  check("maps line ⭐: the line uses the card's words (publish maps not yet committed; not looked for yet)",
    /publish maps not yet committed/.test(txt(ml)) && /not looked for yet/.test(txt(ml)), txt(ml));
  const mw = ml && ml.querySelector('button[data-filter="maps"]');
  if (mw) mw.click();
  await settle();
  check("maps line ⭐: the committed count opens the colleges whose maps are committed, and the list holds exactly those",
    !!mw && D.address() === "commons/data/maps" && s.d.querySelectorAll("#cdd-colleges tbody tr[data-id]").length === D.listFor(MM, "maps").length, D.address());
  const mcard = await panel("mt-san-antonio-college");
  const st = mcard.d.querySelector('#cdd-panel [data-card="maps"] .cdd-state');
  check("maps line: the card's state and the line's filter agree (one rule, mapState)",
    st && st.getAttribute("data-state") === "held" && D.listFor(MM, "maps").some((c) => c.name === "Mt. San Antonio College")
      && !D.listFor(MM, "maps_none").concat(D.listFor(MM, "maps_unknown")).some((c) => c.name === "Mt. San Antonio College"));

  // ── a card module that throws (COBIx's review of #3316): a quiet line and a console warning, never silence ──
  const b = load("#commons/data/college/columbia-college", DATA);
  const warned = [];
  b.w.console.warn = function () { warned.push([].slice.call(arguments).join(" ")); };
  b.w.CPL_COMMONS_DATA_CARDS.sections = function () { throw new Error("broken on purpose"); };
  await b.M.boot(); await settle();
  const errLine = b.d.querySelector('#cdd-panel [data-card-error="commons_data_cards.js"]');
  check("broken module ⭐: the panel says This card could not be shown, and the console names the module",
    errLine && txt(errLine) === "This card could not be shown." && warned.some((x) => /commons_data_cards\.js/.test(x)) && !card(b, "maps"), JSON.stringify(warned));

  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : " — " + String(r[2]).slice(0, 300))));
  const failed = results.filter((r) => !r[1]);
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
