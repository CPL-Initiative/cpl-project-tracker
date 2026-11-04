// The line over the Courses List, its folded cards and a course's side panel (the List norms, The List is the
// workspace; Sam, 2026-11-03: "incorporating the list view below the action/metric cards and make that top level
// collapsible while keeping the one-line action/metric links like we do elsewhere", and "a side bar open for list items
// to show all the details (like an exhibits or the nice side bar that opens for courses on SkyView)"). The last of the
// five Lists. Guards:
//   (1) the line reads the course row of kb/status/commons.json through the tab's own Progress read (one reader), once;
//       every count opens SkyView in a new tab and says so (Courses keeps SkyView first);
//   (2) the Progress view's opened page folds under the line under its own prefix, less the word that opens this List;
//       Hide the summary hides it; a failed read says the figures could not be read;
//   (3) a title opens the panel: the course, its common course with SkyView one word away, the local courses that M-ID
//       holds (this one marked, another one's title opening its panel), the Title drawer moved in, the rest folded;
//       a course in no M-ID says so and lists none;
//   (4) no raw hex and no glyph in the new code.
// Run from repo root: `npm test` (or `node tests/coci_list_panel.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");
const PAGE_SRC = fs.readFileSync("commons_page.js", "utf8");

// rows: [collegeIdx, ctrl, subj, num, title, units, credit, top, cid, ccn, mid (the extract's, 2026-07-09)]
const LOOKUP = {
  _built_at: "2026-07-09",
  colleges: ["American River College", "Rio Hondo College", "Cypress College "],
  rows: [
    [0, "CCC1", "ENGL", "300", "College Composition", 4, "C", "1501.00: English", "ENGL 100", "ENGL C1000", "ENGL M1001"],
    [1, "CCC2", "ENGL", "101", "Composition and Reading", 3, "C", "1501.00: English", "ENGL 100", "", "ENGL M1999"],
    [2, "CCC3", "ENGL", "100", "Freshman Composition", 4, "C", "1501.00: English", "", "", ""],
    [0, "CCC4", "CARPT", "111", "Tool and Equipment Applications", 1.5, "C", "0952.10: Carpentry", "", "", "CNST M1009"],
    [1, "CCC5", "CARP", "040K", "Rigging", 2, "C", "0952.10: Carpentry", "", "", ""],
    [1, "CCC6", "ESL", "010", "English Fundamentals", 0, "N", "4930.87: English as a Second Language", "", "", ""],
    [0, "CCC7", "WELD", "110", "Welding I", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [1, "CCC8", "WELD", "101", "Intro to Welding", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [1, "CCC9", "ESL", "020", "Conversation", 0, "E", "4930.87: English as a Second Language", "", "", ""]
  ]
};
const MEMBERS = {
  generated_at: "2026-11-01 05:18",
  colleges: ["American River College", "Rio Hondo College", "Cypress College", "Allan Hancock College"],
  members: {
    "ENGL M1001": [{ c: 0, cn: "CCC1" }, { c: 1, cn: "CCC2" }, { c: 2, cn: "CCC3" }],
    "CNST M1009": [{ c: 0, cn: "CCC4" }],
    "WELD M1109": [{ c: 0, cn: "CCC7" }, { c: 1, cn: "CCC8" }, { c: 3, cn: "CCCX" }],
    "MANF M1200": [{ c: 1, cn: "CCC8" }]
  }
};

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/#coci-lookup", runScripts: "dangerously" });
  const w = dom.window, calls = [], fetches = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function (url) {
    fetches.push(String(url));
    if (/kb\/status\/commons\.json/.test(String(url))) {
      if (!opts.commons) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opts.commons))) });
    }
    const rows = /CCC|ENGL%20300/.test(String(url)) ? [{ course_code: "ENGL 300", heading: "Student Learning Outcomes", lead: null,
      outcomes: ["Write an argument.", "Revise a draft."], maps_to: null, shape: "list", fingerprint: "a".repeat(32),
      source_url: "https://example.org/outline/engl300", source_kind: "course_outline", source_system: "curriqunet", read_run: 3,
      loaded_at: "2026-10-13T20:00:00Z" }] : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(rows) });
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push(s);
    if (s === "commons_list.js" && !opts.noEngine) { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "commons_page.js" && opts.modules) { const e = w.document.createElement("script"); e.textContent = PAGE_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js" && !opts.noMembers) w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    if (/^coci_lookup_desc_E\.js$/.test(s)) { w.CPL_COCI_DESC = w.CPL_COCI_DESC || {}; w.CPL_COCI_DESC.E = { CCC1: "Expository writing and critical reading." }; }
    setTimeout(cb, 0);
  } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document, calls, fetches };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P = "ccl-";
function bodyRows(d) { return Array.from(d.querySelectorAll("." + P + "table tbody tr")); }
function dataRows(d) { return bodyRows(d).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow")); }
function heads(d) { return Array.from(d.querySelectorAll("." + P + "table thead th")).map((th) => txt(th.querySelector("." + P + "sort"))).filter(Boolean); }
function colOf(d, name) { return heads(d).findIndex((h) => h.indexOf(name) === 0); }
// The cell under a column, found by its name (the select box comes first).
function cell(tr, d, name) { return tr.children[colOf(d, name) + 1]; }
function titles(d) { return dataRows(d).map((tr) => txt(cell(tr, d, "Title"))); }
function word(d, re) { return Array.from(d.querySelectorAll("button")).find((b) => re.test(txt(b))); }
function input(w, node, v) { node.value = v; node.dispatchEvent(new w.Event("input")); }


const SKY = "https://cpl-initiative.github.io/cpl-project-tracker/prototype/skyview.html";
const COMMONS_DOC = { schema: 1, written_at: "2026-11-04T06:00:00Z", rows: [{ key: "course", title: "Common Course Reference", tab: SKY,
  facts: { total: 27581, ready: 3205, confirmed: 957, tags: {} },
  pair: [{ n: 3205, of: 27581, words: "cards the auditor scores 0.85 or better; 17,036 at needs review", open: SKY },
    { n: 957, of: 27581, words: "confirmed by a person, 152 of them ready", open: SKY, error: null }],
  issues: [{ n: 4179, words: "unit anomalies", owner: "a curator", open: SKY }] }] };
function panel(d) { return d.getElementById(P + "panel"); }
function titleBtn(d, title) { const tr = dataRows(d).find((x) => txt(cell(x, d, "Title")).indexOf(title) === 0); return tr && cell(tr, d, "Title").querySelector("button"); }

(async () => {
  // ── (1) the line ──
  const t = tab({ commons: COMMONS_DOC, modules: true });
  await sleep(200);
  const d = t.d, ln = d.querySelector("." + P + "line");
  const parts = ln ? Array.from(ln.children).filter((x) => !x.classList.contains(P + "sep")).map(txt) : [];
  check("(1) ⭐ the line reads the course row", parts.join(" | ") === "3,205 of 27,581 cards the auditor scores 0.85 or better | 957 confirmed by a person | 4,179 unit anomalies", parts.join(" | "));
  check("(1) one reader: the Commons file is read once for the tab", t.fetches.filter((u) => /commons\.json/.test(u)).length === 1, t.fetches.join(" | "));
  const links = ln ? Array.from(ln.querySelectorAll("a")) : [];
  check("(1) every count opens SkyView in a new tab and says so", links.length === 3 && links.every((a) => a.getAttribute("href") === SKY && a.getAttribute("target") === "_blank"
    && a.getAttribute("rel") === "noopener" && /opens SkyView in a new tab/.test(a.getAttribute("aria-label"))));

  // ── (2) the fold ──
  const fold = d.getElementById(P + "fold"), tog = d.getElementById(P + "fold-w");
  check("(2) ⭐ the Progress view's page sits in the fold under its own prefix", !!fold && !fold.hidden && !!fold.querySelector("#" + P + "pg-attention")
    && !fold.querySelector("[id^='cplcoci-pg-']"), fold && txt(fold).slice(0, 200));
  check("(2) the fold leaves out the word that opens this List", !word(d, /^Open the Courses List$/));
  tog.click(); await sleep(10);
  const tog2 = d.getElementById(P + "fold-w");
  check("(2) Hide the summary hides it; the word says Show the summary and keeps focus", d.getElementById(P + "fold").hidden && txt(tog2) === "Show the summary"
    && tog2.getAttribute("aria-expanded") === "false" && d.activeElement === tog2);
  const tf = tab();
  await sleep(30);
  check("(2) a failed read says the figures could not be read, once", /could not be read/.test(txt(tf.d.querySelector("." + P + "line")))
    && tf.fetches.filter((u) => /commons\.json/.test(u)).length === 1);

  // ── (3) the panel ──
  titleBtn(d, "Composition and Reading").click(); await sleep(20);
  const p = panel(d);
  check("(3) ⭐ a title opens the panel, named for the course and its college", !!p && txt(d.getElementById(P + "panel-t")) === "Course: ENGL 101, Rio Hondo College"
    && /ENGL 101, Composition and Reading/.test(txt(p.querySelector("h2"))) && /C-ID ENGL 100/.test(txt(p.querySelector("." + P + "pn-meta"))));
  check("(3) its common course, with SkyView one word away", /Its common course: ENGL M1001/.test(txt(p))
    && !!Array.from(p.querySelectorAll("a")).find((a) => a.getAttribute("href") === "prototype/skyview.html#outline/ENGL%20M1001"));
  const mt = p.querySelector("#" + P + "pn-members");
  const mrows = mt ? Array.from(mt.querySelectorAll("tbody tr")).map((r) => Array.from(r.children).map(txt).join(",")) : [];
  check("(3) ⭐ the local courses ENGL M1001 holds, this one marked", mrows.length === 3 && mrows.some((x) => /^ENGL 101,Composition and Reading \(this course\),Rio Hondo College,3$/.test(x))
    && /holding 3 local courses at 3 colleges/.test(txt(p)) && !!mt.querySelector("tr[aria-current='true']"), mrows.join(" | "));
  check("(3) the members table is a labelled region with th scope=col", mt.getAttribute("role") === "region" && !!mt.getAttribute("aria-label") && mt.querySelectorAll("th[scope='col']").length === 4);
  check("(3) the Title drawer moves in: the catalog description and the outcomes", !!p.querySelector("." + P + "pdrawer .cplcoci-outs"));
  check("(3) the rest folded: the older M-ID the extract named", /named ENGL M1999; the course has moved since/.test(txt(p.querySelector("details." + P + "pn-more"))));
  Array.from(mt.querySelectorAll("tbody button")).find((b) => txt(b) === "College Composition").click(); await sleep(20);
  check("(3) another course's title opens its panel", txt(d.getElementById(P + "panel-t")) === "Course: ENGL 300, American River College");
  titleBtn(d, "Intro to Welding").click(); await sleep(20);
  check("(3) a course in two M-IDs names both and sits under the larger", /sits in 2 M-IDs \(WELD M1109, MANF M1200\)/.test(txt(panel(d))), txt(panel(d)).slice(0, 400));
  titleBtn(d, "Rigging").click(); await sleep(20);
  check("(3) a course in no M-ID says so and lists none", /No M-ID: the Common Course Reference holds this course in no common course today/.test(txt(panel(d)))
    && !panel(d).querySelector("#" + P + "pn-members"));

  // ── (4) the source ──
  const block = SRC.slice(SRC.indexOf("function listLine("), SRC.indexOf("function listHead("));
  check("(4) no raw hex and no glyph in the new code", block.length > 2000 && !/#[0-9a-fA-F]{3,6}\b/.test(block)
    && !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(block));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\ncoci_list_panel: " + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { results.forEach(([n, ok, why]) => console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why))); console.error(e); process.exit(1); });
