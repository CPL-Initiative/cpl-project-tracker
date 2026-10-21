#!/usr/bin/env node
// The funding page, as a note Sierra can quote.
//
// WHY THIS EXISTS. Sam, 2026-10-21: Sierra answered funding questions from
// February-to-July vault notes ("the Governor has also proposed a $35M local
// implementation fund"), then: "Sierra can send the users to the funding dash
// for specific numbers but it would be nice for her to be able to quote
// specifics in her responses. Yes, to any rebuild to switch off the stopgap
// rule." Her corpus is the CPLBrain vault, so this script renders the public
// funding page (funding-model/index.html) the way a reader sees it, under the
// live config, and writes what it says as one markdown note: every section's
// words and figures, then each institution's max award and its credit and
// noncredit shares. The vault's funding-note workflow runs it daily, commits
// the note when it changed and indexes it for Sierra.
//
//   node scripts/funding_sierra_note.js --config live.json --out note.md
//
// live.json is the cpl_funding_config row (config and updated_at) as the
// public REST read returns it, an array of one row, or the bare config.
// Nothing here computes a figure: the page and the model answer, this script
// files what they say. Guard: tests/funding_sierra_note.test.js.
"use strict";

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const PAGE_URL = "https://cpl-initiative.github.io/cpl-project-tracker/funding-model/";

function loadConfig(file) {
  let row = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(row)) row = row[0];
  let cfg = row && row.config ? row.config : row;
  if (typeof cfg === "string") cfg = JSON.parse(cfg);
  if (!cfg || !cfg.projects) throw new Error(file + " has no `projects` key");
  return { cfg: cfg, savedAt: (row && row.updated_at) || "" };
}

// The funding page, painted in jsdom with the given config in place of the
// remote read (the page's own scripts run, so its words are the reader's).
function renderPage(cfg) {
  const html = read("funding-model/index.html");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: PAGE_URL });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.print = function () {};
  ["cpl_funding_data.js", "funding_model_payload.js", "college_short_names.js", "cpl_funding.js"]
    .forEach((f) => w.eval(read(f)));
  w.CPL_FUNDING_TAB._setConfig(cfg);
  Array.from(w.document.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
  return w;
}

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const BLOCKS = { H2: "## ", H3: "### ", H4: "#### ", SUMMARY: "### ", P: "", LI: "- ", DT: "", DD: "", TR: "" };

// One section's words as markdown: headings, paragraphs, list items and table
// rows in document order. A block inside a block already written is skipped,
// so a paragraph inside a list item is not said twice.
function sectionText(sec) {
  const out = [], done = new Set();
  const walk = sec.ownerDocument.createTreeWalker(sec, 1);
  let n = walk.currentNode;
  while (n) {
    const tag = n.tagName;
    if (tag in BLOCKS && !(n.hidden || n.closest("[hidden]"))) {
      let p = n.parentElement, inside = false;
      while (p && p !== sec) { if (done.has(p)) { inside = true; break; } p = p.parentElement; }
      if (!inside) {
        done.add(n);
        if (tag === "TR") {
          const cells = Array.from(n.children).map((c) => clean(c.textContent).replace(/\|/g, "/"));
          if (cells.some(Boolean)) out.push("| " + cells.join(" | ") + " |");
        } else {
          const t = clean(n.textContent);
          if (t) out.push(BLOCKS[tag] + t);
        }
      }
    }
    n = walk.nextNode();
  }
  // A table's rows read as one block, and a header row gets its rule.
  const lines = [];
  out.forEach((l, i) => {
    const prevRow = i > 0 && out[i - 1].charAt(0) === "|";
    if (l.charAt(0) === "|" && !prevRow) {
      lines.push(""); lines.push(l);
      lines.push("|" + l.split(" | ").map(() => " --- ").join("|") + "|");
    } else if (l.charAt(0) === "|") lines.push(l);
    else { lines.push(""); lines.push(l); }
  });
  return lines.join("\n").trim();
}

// The CSV the page's Download as Excel writes, as rows keyed by header.
function csvRows(csv) {
  const parse = (line) => {
    const cells = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ",") { cells.push(cur); cur = ""; } else cur += ch;
    }
    cells.push(cur); return cells;
  };
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const at = lines.findIndex((l) => /^"?#"?,/.test(l));
  const head = parse(lines[at]);
  return lines.slice(at + 1).map(parse).filter((c) => c.length === head.length)
    .map((c) => { const o = {}; head.forEach((h, i) => { o[h] = c[i]; }); return o; });
}
const money = (v) => {
  const n = Number(String(v).replace(/[$,]/g, ""));
  return isFinite(n) && String(v).trim() !== "" ? "$" + Math.round(n).toLocaleString("en-US") : String(v || "");
};
const pick = (row, re) => { const k = Object.keys(row).find((h) => re.test(h)); return k ? row[k] : ""; };

function pacificDay(ts) {
  const d = ts ? new Date(ts) : null;
  if (!d || isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "long", day: "numeric" });
}

function buildNote(cfg, savedAt) {
  const w = renderPage(cfg);
  const T = w.CPL_FUNDING_TAB, doc = w.document;
  const scen = T._scenario().name;
  const asOf = pacificDay(savedAt);
  const parts = [];
  parts.push("---");
  parts.push("title: \"2026-2028 CPL Initiative Funding: the funding model, by institution\"");
  parts.push("type: reference");
  parts.push("project: cpl-initiative");
  parts.push("tags: [\"#cpl\", \"#funding\", \"#sb-135\", \"#reference\"]");
  parts.push("source: " + PAGE_URL);
  parts.push("generated_by: cpl-project-tracker/scripts/funding_sierra_note.js");
  parts.push("scenario: \"" + scen + "\"");
  parts.push("as_of: \"" + (savedAt || "") + "\"");
  parts.push("---");
  parts.push("");
  parts.push("# 2026-2028 CPL Initiative Funding");
  parts.push("");
  parts.push("This note is the public funding page (" + PAGE_URL + ") as it reads" +
    (asOf ? " on " + asOf : "") + ", " + scen + ", the scenario the Chancellor's Office has published. " +
    "The funding is enacted: Senate Bill 135 (Statutes of 2026, Chapter 79) added Article 9 to the Education Code, " +
    "sections 78093 through 78093.2. The funding page always carries the current figures; this note is rebuilt from it daily. " +
    "The guidance memo is at " + PAGE_URL + "memo/.");
  Array.from(doc.querySelectorAll("main > section")).forEach((sec) => {
    if (sec.id === "institutions" || sec.hidden) return;
    const t = sectionText(sec);
    if (t) { parts.push(""); parts.push(t); }
  });
  const all = csvRows(T._csv());
  const total = all.find((r) => /^statewide$/i.test(String(r.Institution || "").trim()));
  const rows = all.filter((r) => r !== total);
  parts.push("");
  parts.push("## Each institution's max award, " + scen);
  parts.push("");
  parts.push("The max award is the maximum funding to be awarded based on measurable outcomes and allocated as credit and noncredit subtotals, across 2026-27 and 2027-28.");
  parts.push("");
  if (total) {
    parts.push("");
    parts.push("Statewide, the " + rows.length + " max awards total " + money(pick(total, /^Max award/)) + ": " +
      money(pick(total, /^Credit share/)) + " credit and " + money(pick(total, /^Noncredit share/)) + " noncredit.");
  }
  // Ten institutions to a heading that names them: the vault's indexer splits a
  // note at headings and blank lines only, so one 118-row table would be one
  // chunk no single college's question could find.
  const GROUP = 10;
  for (let g = 0; g < rows.length; g += GROUP) {
    const part = rows.slice(g, g + GROUP);
    parts.push("");
    parts.push("### Max awards: " + part.map((r) => r.Institution).join(", "));
    parts.push("");
    parts.push("| Institution | District | Max award | Credit share | Noncredit share |");
    parts.push("| --- | --- | --- | --- | --- |");
    part.forEach((r) => {
      parts.push("| " + [r.Institution, r.District, money(pick(r, /^Max award/)), money(pick(r, /^Credit share/)),
        money(pick(r, /^Noncredit share/))].map((c) => String(c || "").replace(/\|/g, "/")).join(" | ") + " |");
    });
  }
  return parts.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

module.exports = { buildNote, csvRows, sectionText, loadConfig };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const cfgPath = flag("--config"), outPath = flag("--out");
  if (!cfgPath) { console.error("usage: node scripts/funding_sierra_note.js --config live.json [--out note.md]"); process.exit(2); }
  const c = loadConfig(cfgPath);
  const note = buildNote(c.cfg, c.savedAt);
  if (outPath) { fs.writeFileSync(outPath, note); console.log("wrote " + outPath + " (" + note.length + " chars)"); }
  else process.stdout.write(note);
}
