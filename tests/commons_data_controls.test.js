// College Data Collection (commons_data.js, #commons/data): every control does something, and a figure never breaks.
//
// WHAT THIS GUARDS (S648, Sam's Skyline screenshot on #3229: "make sure any card that has what looks like a link
// opens up to something", and the Program requirements card broke 144 into 1 / 4 / 4):
//   (1) ⭐ every element styled as a control (an underlined word, a figure card, a link) in every view, the college
//       list with each college's row opened, the side panel, the district roll-up, the dictionary and the API
//       checklist, is a <button> with a click handler or an <a href>; a link out of COBI is http(s), opens a new tab
//       and carries rel="noopener"; nothing that is not a control wears a control's class;
//   (2) ⭐ a value cell cannot wrap inside a figure: the label/value rows size the value column to its content (never
//       minmax(0, auto) beside it), the value never inherits overflow-wrap:anywhere, and every figure value carries
//       the nowrap class (jsdom has no layout, so the computed rule is asserted; scripts/commons_data_values_check.js
//       measures it in Chromium at 390, 768, 1016 and 1440);
//   (4) the district roll-up: every district opens exactly its colleges at #commons/data/district/<slug> (an inline
//       fixture pins Kern beside West Kern); a whole-card figure at zero draws plain; a new tab says so in words.
//   (5) ⭐ each cause's programs (S649, COBIx's item 1 on #3229): every cause word in every college's row opens the
//       side panel at that cause, at #commons/data/college/<slug>/cause/<key>, listing exactly the programs the cause
//       counts; a program with a catalog page links to it in a new tab, one without is plain text; a college's
//       program file is fetched only when its row or panel opens; a file that cannot be read says so in words.
//   (6) ⭐ every link opens in the side panel (Sam, in session, S649, reversing #3257's new tabs): in every college's
//       row each source word (the catalog, what the capture holds, the paid read, CPL Pathways) and each SLO, PLO and
//       objective word opens the panel at its own address with a heading and content, and the panel's one link out,
//       "Open in a new tab", has a destination; no other link on the page leaves it. The SLO and PLO panes show what
//       the committed files hold (Cuesta: SLO and objective courses by subject, its PLOs); Colleges with collected
//       SLOs (#commons/data/slos) lists exactly the colleges the live read holds SLOs or objectives for, says how
//       many are not read, and each name opens its college's SLO pane; the list carries an SLOs and objectives
//       column; the view uses the window's full width.
//   (3) the opened row's cause sentence is a table with th scope; the Confidence card with no spot-check says what each
//       level rests on rather than a bare "Not yet"; the count line above the list does not repeat the order line.
// Read against the committed kb/status/commons_data.json, so a new figure or control is walked the day it lands.
//
// Run from repo root: `npm test` (or `node tests/commons_data_controls.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_data.js", "utf8");
const DATA = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));
const STATUS = fs.existsSync("kb/status/commons.json") ? JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")) : {};

/* Records every element given a click listener, before any page script runs. */
const RECORD = "window.__clicks = new WeakSet(); (function (add) { EventTarget.prototype.addEventListener = function (t, f, o) {"
  + " if (t === 'click' && this && this.nodeType === 1) window.__clicks.add(this); return add.call(this, t, f, o); }; })(EventTarget.prototype.addEventListener);";

/* An inline fixture for the row's shape and the district filter, so those checks never depend on the nightly file:
   one college shaped like Sam's Skyline row (causes, failed checks, no spot-check, a catalog, a run), and two districts
   whose names contain one another (Kern and West Kern), the case a substring search gets wrong. */
const FIX = JSON.parse(JSON.stringify(DATA));
const fcol = (o) => Object.assign({ kind: "college", harvested: false, slug: null, programs: null, passing: null, gap: null, causes: null, read_at: null,
  read_kind: null, cost_usd: null, passed_at_read: null, slo_queue: null, scout: null, spot_check: null, confidence: null }, o);
FIX.colleges = [
  fcol({ id: 9001, name: "Ridge College", district: "Kern Community College District", harvested: true, slug: "ridge", programs: 144, passing: 40, gap: 104,
    causes: { no_closed_list: 86, places_none: 11, page_not_found: 5, unknown_without_live: 2 }, read_at: "2026-10-17T13:07:43Z", read_kind: "capture",
    cost_usd: 3.83, passed_at_read: 37, listed_closed: 58, found: 53, extracted: 53, failed_checks: { coverage: 11, invented: 0, arithmetic: 16 },
    platform: "custom_html", catalog_year: "2026-2027", catalog_url: "https://catalog.ridge.example.edu/current/", run: "39035209486",
    confidence: { level: "limited", why: "machine checks only; no spot-check yet" } }),
  fcol({ id: 9002, name: "Valley College", district: "Kern Community College District" }),
  fcol({ id: 9003, name: "Hill College", district: "West Kern Community College District", harvested: true, slug: "hill", programs: 10, passing: 10, gap: 0, causes: {},
    read_at: "2026-11-01T13:07:43Z", read_kind: "capture", confidence: { level: "limited", why: "machine checks only; no spot-check yet" } })
];
FIX.live = {}; FIX.overall = {};
FIX.colleges[0].programs_file = "kb/status/commons_data_programs/ridge.json";
/* Ridge's program file: two causes listed in full, one program with a catalog page and one without. */
const RIDGE = { schema: 1, college: "Ridge College", slug: "ridge", basis: "committed files only", programs: [] };
[["no_closed_list", 86], ["places_none", 11], ["page_not_found", 5], ["unknown_without_live", 2]].forEach(([k, n]) => {
  for (let i = 0; i < n; i++) RIDGE.programs.push({ cn: k.slice(0, 3) + i, title: "Program " + k + " " + i, award: "A.S. Degree", cause: k,
    lever: "reconcile_steps", url: k === "page_not_found" ? null : "https://catalog.ridge.example.edu/p/" + k + "/" + i });
});
const SIDE = "kb/status/commons_data_programs/";

function load(hash, data, extra) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = Object.assign({ "kb/status/commons_data.json": data || DATA, "kb/status/commons.json": STATUS }, data === FIX ? { [SIDE + "ridge.json"]: RIDGE } : {}, extra || {});
  w.__fetched = [];
  w.fetch = function (url) {
    w.__fetched.push(String(url));
    let hit = files[String(url)];
    /* The committed sidecars, read from disk, for the committed file's walk. */
    if (hit === undefined && (!data || data === DATA) && String(url).indexOf(SIDE) === 0 && fs.existsSync(String(url))) hit = JSON.parse(fs.readFileSync(String(url), "utf8"));
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [RECORD, SESSION, PROGRESS, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, D: w.CPL_COMMONS_DATA };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }

/* What wears a control's look in this view: the underlined word class, a figure card that opens, the view words, any
   link or button. */
const LOOKS = "a, button, .cmn-word, .cdd-tile.cdd-open, .cdd-viewword, .cdd-partw, .cdd-openw, .cdd-plat, .cdd-sort, [role='button']";
function audit(x, where, bad, seen) {
  Array.from(x.d.querySelectorAll("#commons-root " + LOOKS.split(", ").join(", #commons-root "))).forEach((e) => {
    seen.n++;
    const name = where + ": <" + e.tagName.toLowerCase() + " class=" + (e.className || "") + "> " + txt(e).slice(0, 50);
    if (e.tagName === "BUTTON") {
      if (e.disabled) bad.push(name + " (disabled)");
      else if (!x.w.__clicks.has(e)) bad.push(name + " (a button with no click handler)");
    } else if (e.tagName === "A") {
      const h = e.getAttribute("href") || "";
      if (!h) bad.push(name + " (a link with no href)");
      else if (e.getAttribute("target") === "_blank" || /^https?:/i.test(h)) {
        /* S649: the one link that leaves the page is the panel's "Open in a new tab". */
        if (!e.classList.contains("cdd-newtab") || !e.closest("#cdd-panel")) bad.push(name + " (a link out of the page that is not the panel's new-tab control)");
        else if (e.getAttribute("target") !== "_blank" || !/noopener/.test(e.getAttribute("rel") || "")) bad.push(name + " (a new tab without rel=noopener)");
        else if (txt(e) !== "Open in a new tab") bad.push(name + " (the new-tab control says something else)");
      } else if (!/^#/.test(h)) bad.push(name + " (an href that is neither a page address nor http(s): " + h + ")");
    } else bad.push(name + " (styled as a control but neither a button nor a link)");
  });
}

(async function () {
  const bad = [], seen = { n: 0 };
  /* The list, then every college's row opened in turn. */
  const x = load("#commons/data");
  await x.M.boot(); await settle();
  check("setup: the view drew its list", !!x.d.querySelector("#cdd-colleges tbody tr[data-college]"));
  audit(x, "list", bad, seen);
  const ids = Array.from(x.d.querySelectorAll("#cdd-colleges [data-expand]")).map((b) => b.getAttribute("data-expand"));
  let rowsOpened = 0, ddFig = 0, ddNoClass = [];
  const FIG = /^\$?[\d,.]+%?( (seconds|minutes))?$/;
  ids.forEach((id) => {
    x.d.querySelector('[data-expand="' + id + '"]').click();
    const more = x.d.getElementById("cdd-more-" + id);
    if (!more) return;
    rowsOpened++;
    audit(x, "row " + id, bad, seen);
    more.querySelectorAll("dl.cdd-dl dd").forEach((dd) => {
      if (FIG.test(txt(dd))) { ddFig++; if (!dd.classList.contains("cdd-ddn")) ddNoClass.push(id + ": " + txt(dd)); }
    });
    x.d.querySelector('[data-expand="' + id + '"]').click();
  });
  check("rows: every college's row opens", rowsOpened === ids.length && ids.length > 0, rowsOpened + " of " + ids.length);
  check("figures 1 ⭐: every figure value in every opened row carries the nowrap class", ddFig > 0 && !ddNoClass.length, ddNoClass.slice(0, 5));

  /* One college's row, read for its shape, from the inline fixture. */
  {
    const f = load("#commons/data", FIX);
    await f.M.boot(); await settle();
    f.d.querySelector('[data-expand="9001"]').click();
    const m = f.d.getElementById("cdd-more-9001");
    const ct = m && m.querySelector('[data-ds="pr"] table.cdd-causes');
    check("row 1: still to pass, by cause, is a table with column and row headers", ct && ct.querySelectorAll('th[scope="col"]').length === 2
      && ct.querySelectorAll('tbody th[scope="row"]').length === 4 && !/Still to pass, by cause:/.test(txt(m)));
    const conf = m && m.querySelector('[data-ds="confidence"]');
    check("row 2: a Confidence card with no spot-check says what each level rests on, never a bare Not yet",
      conf && !/Not yet/.test(txt(conf)) && (!FIX.rule.confidence_card || conf.querySelector("[data-levels]")));
    const srcs = m && m.querySelector("[data-sources]");
    check("row 3: the row's sources are words that open the side panel: the catalog, what the capture holds, the paid read, CPL Pathways",
      !!srcs && !srcs.querySelector("a") && JSON.stringify(Array.from(srcs.querySelectorAll("button.cdd-paneword")).map((b) => b.getAttribute("data-pane"))) === '["catalog","capture","run","pathways"]');
    /* Each opens its pane; the catalog's new tab is the catalog, the run's its log, CPL Pathways the college's view. */
    const tabs = {};
    for (const k of ["catalog", "capture", "run", "pathways"]) {
      f.d.querySelector('#cdd-more-9001 button[data-pane="' + k + '"]').click(); await settle();
      const nt = f.d.querySelector("#cdd-panel a.cdd-newtab");
      tabs[k] = [f.w.location.hash, nt ? nt.getAttribute("href") : null, txt(f.d.querySelector("#cdd-panel-h"))];
      f.D.closePanel(); await settle();
    }
    check("row 3b ⭐: each source opens its pane at its address, with a new tab to the same place",
      tabs.catalog[0] === "#commons/data/college/ridge-college/catalog" && tabs.catalog[1] === "https://catalog.ridge.example.edu/current/"
      && tabs.run[1] === "https://github.com/cpl-initiative/cpl-project-tracker/actions/runs/39035209486"
      && tabs.pathways[1] === "#cpl-pathways/college/Ridge%20College" && tabs.capture[1] === "#commons/data/college/ridge-college/capture"
      && tabs.capture[2] === "What the capture holds", tabs);
    check("row 4: the failed checks name their base, the records extracted",
      /Records failing each machine check, of the 53 records extracted as the capture read them/.test(txt(m)) && /Units arithmetic\s*16/.test(txt(m)) && !/invented\s*0/i.test(txt(m)));
    audit(f, "fixture row", bad, seen);
  }
  check("list: the count line and the order line do not say the same thing",
    !/lowest first/i.test(txt(x.d.querySelector("#cdd-shown"))));

  /* Every figure card's filter, the platform words and the sort headings. */
  Array.from(x.d.querySelectorAll(".cdd-tiles [data-filter]")).map((b) => b.getAttribute("data-filter")).forEach((f) => {
    const b = x.d.querySelector('.cdd-tiles [data-filter="' + f + '"]'); if (b) b.click();
    audit(x, "filter " + f, bad, seen);
  });

  /* The side panel, a district roll-up, the dictionary and the API checklist, each at its address. */
  const slug = x.D.slugOf(DATA.colleges.filter((c) => c.harvested)[0] || DATA.colleges[0]);
  const views = ["#commons/data/college/" + slug, "#commons/data/districts", "#commons/data/dictionary", "#commons/data/apis"];
  for (const h of views) {
    const y = load(h);
    await y.M.boot(); await settle();
    audit(y, h, bad, seen);
    if (h === "#commons/data/districts") {
      const rowsD = y.d.querySelectorAll("#cdd-dist-table tbody tr");
      const names = Array.from(new Set(DATA.colleges.map((c) => c.district).filter(Boolean)));
      check("districts 1: one row per district, each name a button word", rowsD.length === names.length + (DATA.colleges.some((c) => !c.district) ? 1 : 0)
        && names.every((n) => y.d.querySelector('#cdd-dist-table th[scope=row] button.cmn-word[data-district="' + n.replace(/"/g, '\\"') + '"]')), rowsD.length + " of " + names.length);
    }
    if (/college\//.test(h)) {
      const words = Array.from(y.d.querySelectorAll("#cdd-panel .cdd-srcs button.cdd-paneword"));
      check("panel: the Sources list's every source is a word that opens the panel, none a link out", words.length >= 3 && !y.d.querySelector("#cdd-panel .cdd-srcs a"), words.length);
    }
  }
  /* Every district's name opens exactly its colleges, at its own address (the fixture pins Kern beside West Kern). */
  for (const data of [DATA, FIX]) {
    const names = Array.from(new Set(data.colleges.map((c) => c.district).filter(Boolean)));
    const off = [];
    const z = load("#commons/data/districts", data);
    await z.M.boot(); await settle();
    for (const n of names) {
      z.D.go("districts"); await settle();
      const b = Array.from(z.d.querySelectorAll("#cdd-dist-table button[data-district]")).filter((x) => x.getAttribute("data-district") === n)[0];
      if (!b) { off.push(n + ": no button"); continue; }
      b.click(); await settle();
      const shown = Array.from(z.d.querySelectorAll("#cdd-colleges tbody tr[data-college]")).map((r) => r.getAttribute("data-college")).sort();
      const want = data.colleges.filter((c) => c.district === n).map((c) => c.name).sort();
      if (JSON.stringify(shown) !== JSON.stringify(want) || !/^#commons\/data\/district\/[a-z0-9-]+$/.test(z.w.location.hash) || z.d.querySelector("#cdd-q").value !== "") off.push(n + ": " + shown.length + " of " + want.length + " " + z.w.location.hash);
    }
    check("districts 2 ⭐ (" + (data === FIX ? "fixture, Kern beside West Kern" : "committed file") + "): every district's name opens exactly its colleges, at #commons/data/district/<slug>",
      names.length > 0 && !off.length, off.slice(0, 5));
  }
  {
    const k = load("#commons/data/district/kern-community-college-district", FIX);
    await k.M.boot(); await settle();
    check("districts 3: the district's address opens its colleges and the count line names it",
      JSON.stringify(Array.from(k.d.querySelectorAll("#cdd-colleges tbody tr[data-college]")).map((r) => r.getAttribute("data-college")).sort()) === '["Ridge College","Valley College"]'
      && /Kern Community College District$/.test(txt(k.d.querySelector("#cdd-shown"))) && !!k.d.querySelector("#cdd-all"));
    const nd = JSON.parse(JSON.stringify(FIX)); nd.colleges[1].district = null;
    const q = load("#commons/data/districts", nd);
    await q.M.boot(); await settle();
    const row = q.d.querySelector('#cdd-dist-table tr[data-district-row="No district on file"] th');
    check("districts 4: the colleges with no district on file are a plain row name, never a word that opens the whole list",
      row && !row.querySelector("button") && /No district on file/.test(txt(row)));
    const zf = JSON.parse(JSON.stringify(FIX)); zf.colleges.forEach((c) => { c.slo_queue = null; c.scout = null; });
    const zz = load("#commons/data", zf);
    await zz.M.boot(); await settle();
    check("tiles: a whole-card figure at zero draws plain, never a button that opens an empty list",
      !zz.d.querySelector('.cdd-tiles button[data-filter="slo"]') && !zz.d.querySelector('.cdd-tiles button[data-filter="scouted"]') && !!zz.d.querySelector('.cdd-tiles [data-zero="slo"]'));
  }
  /* (5) each cause's programs. The committed file: every cause word in every row opens the panel at its cause. */
  {
    const c5 = load("#commons/data");
    await c5.M.boot(); await settle();
    check("causes 1: the list alone fetches no program file", !c5.w.__fetched.some((u) => u.indexOf(SIDE) === 0), c5.w.__fetched);
    const off = [], links = [], plain = [];
    let words = 0;
    for (const c of DATA.colleges.filter((c) => c.harvested && c.gap)) {
      /* The first cause through the row's word, the rest through the panel's own words (the row's words are the same
         buttons drawn the same way; the full walk through the row took two minutes). */
      const k0 = Object.keys(c.causes || {});
      for (let i = 0; i < k0.length; i++) {
        const k = k0[i];
        if (i) {
          const pw0 = c5.d.querySelector('#cdd-panel button.cdd-cause[data-cause="' + k + '"]');
          if (!pw0) { off.push(c.name + " " + k + ": no word in the panel"); continue; }
          words++; pw0.click(); await settle();
          const s0 = c5.d.querySelector('#cdd-panel #cdd-cprogs[data-cause-programs="' + k + '"]');
          const n0 = s0 ? s0.querySelectorAll("ul.cdd-progs > li").length : -1;
          if (n0 !== c.causes[k] || c5.w.location.hash !== "#commons/data/college/" + c5.D.slugOf(c) + "/cause/" + k) off.push(c.name + " " + k + ": " + n0 + " of " + c.causes[k]);
          if (s0) s0.querySelectorAll("ul.cdd-progs > li").forEach((li) => { const a = li.querySelector("button"); (a ? links : plain).push(a || li); });
          continue;
        }
        if (!c5.d.getElementById("cdd-more-" + c.id)) { c5.d.querySelector('[data-expand="' + c.id + '"]').click(); await settle(); }
        const w = c5.d.querySelector("#cdd-more-" + c.id + ' button.cdd-cause[data-cause="' + k + '"]');
        if (!w) { off.push(c.name + " " + k + ": no word in the row"); continue; }
        words++;
        w.click(); await settle();
        const sec = c5.d.querySelector('#cdd-panel #cdd-cprogs[data-cause-programs="' + k + '"]');
        const n = sec ? sec.querySelectorAll("ul.cdd-progs > li").length : -1;
        const pw = c5.d.querySelector('#cdd-panel button.cdd-cause[data-cause="' + k + '"]');
        if (n !== c.causes[k] || c5.w.location.hash !== "#commons/data/college/" + c5.D.slugOf(c) + "/cause/" + k || !pw || pw.getAttribute("aria-expanded") !== "true")
          off.push(c.name + " " + k + ": " + n + " of " + c.causes[k] + " at " + c5.w.location.hash);
        if (sec) sec.querySelectorAll("ul.cdd-progs > li").forEach((li) => { const a = li.querySelector("button"); (a ? links : plain).push(a || li); });
        if (sec && c.id === DATA.colleges.filter((x) => x.harvested && x.gap)[0].id) audit(c5, "panel at " + k, bad, seen);
      }
      if (c5.d.querySelector("#cdd-panel:not([hidden])")) { c5.D.closePanel(); await settle(); }
      const more = c5.d.getElementById("cdd-more-" + c.id);
      if (more) { c5.d.querySelector('[data-expand="' + c.id + '"]').click(); await settle(); }
    }
    const want = DATA.colleges.reduce((n, c) => n + (c.harvested && c.gap ? Object.keys(c.causes || {}).length : 0), 0);
    check("causes 2 ⭐ (committed file): every cause word in every college's row opens the panel at #commons/data/college/<slug>/cause/<key>, listing exactly the programs it counts",
      words === want && want > 0 && !off.length, off.slice(0, 5).concat(["words " + words + " of " + want]));
    const badLinks = links.filter((a) => !/^program\/./.test(a.getAttribute("data-pane") || ""));
    check("causes 3 ⭐: a program with a catalog page is a word that opens it in the panel; one without is plain text, never a control",
      links.length > 0 && plain.length > 0 && !badLinks.length && plain.every((li) => !li.querySelector("a, button")), [links.length, plain.length, badLinks.length]);
    check("causes 4: each college's program file was fetched once, when its row opened",
      c5.w.__fetched.filter((u) => u.indexOf(SIDE) === 0).length === DATA.colleges.filter((c) => c.programs_file && c.gap).length, c5.w.__fetched.filter((u) => u.indexOf(SIDE) === 0).length);
  }
  /* The fixture: the address opens the panel at a cause, the word folds it again, and a missing file says so. */
  {
    const a5 = load("#commons/data/college/ridge-college/cause/places_none", FIX);
    await a5.M.boot(); await settle();
    const sec = a5.d.querySelector('#cdd-panel #cdd-cprogs[data-cause-programs="places_none"]');
    check("causes 5: the cause's address opens the panel with its programs, the word pressed",
      sec && sec.querySelectorAll('ul.cdd-progs > li button[data-pane^="program/"]').length === 11 && /Program places_none 0/.test(txt(sec))
      && a5.d.querySelector('#cdd-panel button.cdd-cause[data-cause="places_none"]').getAttribute("aria-expanded") === "true");
    a5.d.querySelector('#cdd-panel button.cdd-cause[data-cause="places_none"]').click(); await settle();
    check("causes 6: the word folds it again, the address back to the college, the focus on the word",
      !a5.d.querySelector("#cdd-panel #cdd-cprogs") && a5.w.location.hash === "#commons/data/college/ridge-college"
      && a5.d.activeElement && a5.d.activeElement.getAttribute("data-cause") === "places_none", a5.w.location.hash);
    a5.d.querySelector('#cdd-panel button.cdd-cause[data-cause="page_not_found"]').click(); await settle();
    const pn = a5.d.querySelector("#cdd-panel #cdd-cprogs");
    check("causes 7: a program with no catalog page reads plain, and says no page was found",
      pn && pn.querySelectorAll("li").length === 5 && !pn.querySelector("a, button") && /no catalog page found/.test(txt(pn)));
    a5.d.querySelector('#cdd-panel button.cdd-cause[data-cause="places_none"]').click(); await settle();
    a5.d.querySelector('#cdd-panel button[data-pane="program/pla3"]').click(); await settle();
    const pp = a5.d.querySelector("#cdd-panel");
    check("causes 7b ⭐: a program opens what we hold about it in the panel, at its address, with its catalog page in a new tab",
      a5.w.location.hash === "#commons/data/college/ridge-college/program/pla3" && txt(a5.d.querySelector("#cdd-panel-h")) === "Program places_none 3"
      && pp.querySelector('a.cdd-newtab[href="https://catalog.ridge.example.edu/p/places_none/3"]') && /Control number\s*pla3/.test(txt(pp)) && /A\.S\. Degree/.test(txt(pp)), a5.w.location.hash);
    audit(a5, "fixture panel at a cause", bad, seen);
    const e5 = load("#commons/data/college/ridge-college/cause/no_closed_list", FIX, { [SIDE + "ridge.json"]: undefined });
    await e5.M.boot(); await settle();
    check("causes 8: a program file that cannot be read says so in words; the count stands",
      /The program list could not be read/.test(txt(e5.d.querySelector("#cdd-panel #cdd-cprogs"))) && !e5.d.querySelector("#cdd-panel ul.cdd-progs"));
    const u5 = load("#commons/data/college/ridge-college/cause/not_a_cause", FIX);
    await u5.M.boot(); await settle();
    check("causes 9: an address naming a cause the college does not hold opens the college alone",
      !!u5.d.querySelector("#cdd-panel:not([hidden])") && !u5.d.querySelector("#cdd-cprogs") && u5.w.location.hash === "#commons/data/college/ridge-college", u5.w.location.hash);
    check("causes 10: Coming next no longer lists each cause's programs, and the links line says what now opens",
      !x.d.querySelector('#cdd-next [data-next="Each cause\'s programs"]') && /each program still to pass opens its own catalog page/.test(txt(x.d.querySelector("#cdd-next"))));
  }
  /* (6) every pane word in every college's row opens the panel with a heading, content and a new-tab destination. */
  {
    const p6 = load("#commons/data");
    await p6.M.boot(); await settle();
    const off = [];
    let opened = 0;
    for (const c of DATA.colleges) {
      p6.d.querySelector('[data-expand="' + c.id + '"]').click();
      const keys = Array.from(p6.d.querySelectorAll("#cdd-more-" + c.id + " button.cdd-paneword")).map((b) => b.getAttribute("data-pane"));
      for (const k of Array.from(new Set(keys))) {
        const b = p6.d.querySelector("#cdd-more-" + c.id + ' button.cdd-paneword[data-pane="' + k + '"]');
        b.click(); await tick(); await tick();
        opened++;
        const box = p6.d.querySelector("#cdd-panel:not([hidden])"), nt = box && box.querySelector("a.cdd-newtab");
        const want = "#commons/data/college/" + p6.D.slugOf(c) + "/" + k;
        if (!box || !txt(p6.d.querySelector("#cdd-panel-h")) || !nt || !nt.getAttribute("href") || p6.w.location.hash !== want || txt(box).length < 80)
          off.push(c.name + " " + k + ": " + p6.w.location.hash + " tab " + (nt && nt.getAttribute("href")));
        if (c === DATA.colleges[0]) audit(p6, "pane " + k, bad, seen);
        p6.D.closePanel();
      }
      p6.d.querySelector('[data-expand="' + c.id + '"]').click();
    }
    check("panes 1 ⭐ (committed file): every link-styled word in every college's row opens the side panel at its address, with a heading, content and an Open in a new tab destination",
      opened > DATA.colleges.length * 3 && !off.length, off.slice(0, 6).concat(["opened " + opened]));
  }
  {
    const LV = DATA.live && DATA.live.colleges || {};
    const held = DATA.colleges.filter((c) => { const o = (LV[String(c.id)] || {}).outcomes || {}; return o.slo_courses || o.objective_courses; });
    const sv = load("#commons/data/slos");
    await sv.M.boot(); await settle();
    const rows = Array.from(sv.d.querySelectorAll("#cdd-slos-table tbody tr")).map((r) => r.getAttribute("data-slos-row")).sort();
    check("slos 1 ⭐: Colleges with collected SLOs lists exactly the colleges the live read holds SLOs or objectives for, and says how many are not read",
      DATA.live.state !== "read" || (rows.length === held.length && held.length > 0 && JSON.stringify(rows) === JSON.stringify(held.map((c) => c.name).sort())
        && new RegExp("The other " + (DATA.colleges.length - held.length) + " colleges have not been read yet").test(txt(sv.d.querySelector("#cdd-slos-sum")))),
      [rows.length, held.length]);
    const np = held.filter((c) => c.objectives_printed === false).map((c) => c.name).sort();
    const npRows = Array.from(sv.d.querySelectorAll('#cdd-slos-table td[data-noobj]')).map((td) => td.closest("tr").getAttribute("data-slos-row")).sort();
    check("slos 1b: a college whose course outlines print no objectives says so in words, never a missing figure",
      JSON.stringify(np) === JSON.stringify(npRows) && /print no objectives/.test(txt(sv.d.querySelector("#cdd-slos-sum"))) === (np.length > 0), [np, npRows]);
    const cu = DATA.colleges.filter((c) => c.name === "Cuesta College")[0];
    if (cu && held.indexOf(cu) >= 0) {
      sv.d.querySelector('#cdd-slos-table button[data-slos-college="cuesta-college"]').click(); await settle();
      const pane = sv.d.querySelector("#cdd-panel");
      check("slos 2 ⭐: a college's name opens its SLO pane: the live counts, objectives beside SLOs, and courses by subject from the committed reads",
        sv.w.location.hash === "#commons/data/college/cuesta-college/slos" && /Courses with objectives, in all/.test(txt(pane))
        && pane.querySelectorAll("table.cdd-subj tbody tr").length > 5 && pane.querySelector('table.cdd-subj th[scope="col"]'), sv.w.location.hash);
      sv.d.querySelector("#cdd-pane-back").click(); await settle();
      sv.d.querySelector('#cdd-panel button[data-pane="plos"]').click(); await settle();
      check("slos 3: the PLO pane lists each program's PLOs from the committed records, a program's name showing them",
        sv.w.location.hash === "#commons/data/college/cuesta-college/plos" && sv.d.querySelectorAll("#cdd-panel details.cdd-plo").length > 5
        && sv.d.querySelector("#cdd-panel details.cdd-plo ol li"), sv.w.location.hash);
    }
    const lt = load("#commons/data");
    await lt.M.boot(); await settle();
    const tile = lt.d.querySelector('.cdd-tiles button[data-view="slos"]');
    if (tile) tile.click(); await settle();
    check("slos 4: the Colleges with collected SLOs figure opens its view", DATA.live.state !== "read" || (tile && lt.w.location.hash === "#commons/data/slos"), lt.w.location.hash);
    const lt2 = load("#commons/data");
    await lt2.M.boot(); await settle();
    const headCols = Array.from(lt2.d.querySelectorAll("#cdd-colleges thead th")).map(txt);
    const cuRow = cu ? lt2.d.querySelector('#cdd-colleges tr[data-college="Cuesta College"] td[data-label="SLOs and objectives"]') : null;
    check("slos 5: the list carries an SLOs and objectives column, two bars in one cell",
      headCols.some((h) => /^SLOs and objectives/.test(h)) && (!cuRow || (cuRow.querySelectorAll(".cdd-pr").length === 2 && /SLOs/.test(txt(cuRow)) && /Objectives/.test(txt(cuRow)))), headCols);
    check("width: the view uses the window's full width", /\.cmn-wrap\.cdd \{ max-width:none; \}/.test(lt2.D.CSS));
  }
  check("controls ⭐: every element styled as a control is a button with a handler or a link with a destination", seen.n > 200 && !bad.length, bad.slice(0, 8).concat(["walked " + seen.n]));

  /* (2) the computed rule, since jsdom has no layout. */
  const css = x.D.CSS;
  const dlRule = (css.match(/dl\.cdd-dl \{[^}]*\}/) || [""])[0];
  const ddRule = (css.match(/dl\.cdd-dl dd \{[^}]*\}/) || [""])[0];
  check("figures 2 ⭐: the label/value rows size the value column to its content, the label takes the rest",
    /grid-template-columns:minmax\(0, 1fr\) fit-content\(60%\)/.test(dlRule) && !/minmax\(0, auto\)/.test(dlRule), dlRule);
  check("figures 3 ⭐: a value never breaks anywhere; a figure value never wraps",
    ddRule && !/anywhere/.test(ddRule) && /dl\.cdd-dl dd\.cdd-ddn \{[^}]*white-space:nowrap/.test(css) && /\.cdd-n, \.cdd-num, \.cdd-nowrap \{ white-space:nowrap; \}/.test(css), ddRule);
  check("figures 4: the list's table becomes a block per college when its own box is narrow (a container query)",
    /\.cdd-wrap \{ container:cddlist \/ inline-size;/.test(css) && /@container cddlist \(max-width: 760px\)/.test(css));
  check("figures 5: a dictionary entry's prose takes the rest of the width beside its short labels; links and evidence paths break anywhere",
    /\.cdd-entry dl\.cdd-dl \{ grid-template-columns:max-content minmax\(0, 1fr\); \}/.test(css) && /\.cdd a\[target\] \{ overflow-wrap:anywhere; \}/.test(css)
    && /\.cdd-ev, \.cdd-ev > \*, ul\.cdd-srcs > li \{ min-width:0; overflow-wrap:anywhere; \}/.test(css));
  check("layout: the opened row's cards flow in columns, so short cards stack beside a long one",
    /\.cdd-ds \{ columns:3 16rem;/.test(css) && /\.cdd-card \{[^}]*break-inside:avoid/.test(css));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] ? "" : "  " + JSON.stringify(r[2]))));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
