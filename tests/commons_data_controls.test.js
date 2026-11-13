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

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = { "kb/status/commons_data.json": DATA, "kb/status/commons.json": STATUS };
  w.fetch = function (url) {
    const hit = files[String(url)];
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
      else if (/^https?:/i.test(h)) {
        if (e.getAttribute("target") !== "_blank" || !/noopener/.test(e.getAttribute("rel") || "")) bad.push(name + " (a link out without a new tab and rel=noopener)");
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

  /* One college's row, read for its shape. */
  const sky = DATA.colleges.filter((c) => c.harvested && c.causes && Object.keys(c.causes).length && !c.spot_check)[0];
  if (sky) {
    x.d.querySelector('[data-expand="' + sky.id + '"]').click();
    const m = x.d.getElementById("cdd-more-" + sky.id);
    const ct = m.querySelector('[data-ds="pr"] table.cdd-causes');
    check("row 1: still to pass, by cause, is a table with column and row headers", ct && ct.querySelectorAll('th[scope="col"]').length === 2
      && ct.querySelectorAll('tbody th[scope="row"]').length === Object.keys(sky.causes).length && !/Still to pass, by cause:/.test(txt(m)));
    const conf = m.querySelector('[data-ds="confidence"]');
    check("row 2: a Confidence card with no spot-check says what each level rests on, never a bare Not yet",
      conf && !/Not yet/.test(txt(conf)) && (!DATA.rule.confidence_card || conf.querySelector("[data-levels]")));
    const srcs = m.querySelector("[data-sources]");
    check("row 3: the row's sources open their pages in a new tab", !!srcs && Array.from(srcs.querySelectorAll("a")).length >= 1
      && Array.from(srcs.querySelectorAll("a")).every((a) => a.target === "_blank" && /noopener/.test(a.rel) && /^https:\/\//.test(a.href)));
    x.d.querySelector('[data-expand="' + sky.id + '"]').click();
  }
  check("list: the count line and the order line do not say the same thing",
    !/lowest first/i.test(txt(x.d.querySelector("#cdd-shown"))));

  /* Every figure card's filter, the platform words and the sort headings. */
  Array.from(x.d.querySelectorAll(".cdd-tiles [data-filter]")).map((b) => b.getAttribute("data-filter")).forEach((f) => {
    const b = x.d.querySelector('.cdd-tiles [data-filter="' + f + '"]'); if (b) b.click();
    audit(x, "filter " + f, bad, seen);
  });

  /* The side panel, a district roll-up, the dictionary and the API checklist, each at its address. */
  const slug = x.D.slugOf(sky || DATA.colleges[0]);
  const views = ["#commons/data/college/" + slug, "#commons/data/districts", "#commons/data/dictionary", "#commons/data/apis"];
  for (const h of views) {
    const y = load(h);
    await y.M.boot(); await settle();
    audit(y, h, bad, seen);
    if (h === "#commons/data/districts") {
      const rowsD = y.d.querySelectorAll("#cdd-dist-table tbody tr");
      const want = new Set(DATA.colleges.map((c) => c.district || "No district on file")).size;
      check("districts 1: one row per district, each name a button word", rowsD.length === want && Array.from(rowsD).every((r) => r.querySelector("th[scope=row] button.cmn-word")), rowsD.length + " of " + want);
      const first = y.d.querySelector("#cdd-dist-table tbody th button");
      const nm = first && first.getAttribute("data-district");
      first.click(); await settle();
      const shown = Array.from(y.d.querySelectorAll("#cdd-colleges tbody tr[data-college]"));
      const inD = DATA.colleges.filter((c) => (c.district || "").toLowerCase().indexOf(String(nm).toLowerCase()) >= 0 || (c.name + " " + (c.district || "")).toLowerCase().indexOf(String(nm).toLowerCase()) >= 0).length;
      check("districts 2 ⭐: a district's name opens the college list searched to its colleges, at the list's address",
        /^#commons\/data$/.test(y.w.location.hash) && y.d.querySelector("#cdd-q").value === nm && shown.length === inD && shown.length > 0, nm + " " + shown.length + "/" + inD);
    }
    if (/college\//.test(h)) {
      const links = Array.from(y.d.querySelectorAll("#cdd-panel .cdd-srcs a"));
      check("panel: the Sources list opens each source's page in a new tab", links.length >= 2 && links.every((a) => a.target === "_blank" && /noopener/.test(a.rel)), links.length);
    }
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
  check("layout: the opened row's cards flow in columns, so short cards stack beside a long one",
    /\.cdd-ds \{ columns:3 16rem;/.test(css) && /\.cdd-card \{[^}]*break-inside:avoid/.test(css));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] ? "" : "  " + JSON.stringify(r[2]))));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
