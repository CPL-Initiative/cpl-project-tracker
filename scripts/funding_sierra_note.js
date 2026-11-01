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
//   node scripts/funding_sierra_note.js --config live.json --out note.md   [--no-public]
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
// pub (optional): the public rows the page reads on load, as fetchPublic()
// returns them. Without it every institution's conditions read as not yet loaded.
function renderPage(cfg, pub) {
  const html = read("funding-model/index.html");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: PAGE_URL });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.print = function () {};
  // The page loads its outcome figures (cpl_funding_performance.js) after boot;
  // here they load first, so every institution's row carries them (S528).
  ["cpl_funding_data.js", "funding_model_payload.js", "college_short_names.js", "cpl_funding_performance.js", "cpl_funding.js"]
    .forEach((f) => w.eval(read(f)));
  w.CPL_FUNDING_TAB._setConfig(cfg);
  if (pub) w.CPL_FUNDING_TAB._ingestElig([pub.coord, pub.part, null, pub.contacts, pub.attest, null]);
  Array.from(w.document.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
  return w;
}

// The public reads the page makes on load (cpl_funding.js loadEligibility),
// with the page's own address and anon key, so the note holds what any visitor
// sees and nothing a reviewer alone sees: the coordinator summary (yes or no per
// college), participation status, the published contacts, and the noncredit
// attestations' published view. A failed read is null, as on the page.
async function fetchPublic() {
  const src = read("cpl_funding.js");
  const url = /var SUPABASE_URL = "([^"]+)"/.exec(src)[1], anon = /var SUPABASE_ANON = "([^"]+)"/.exec(src)[1];
  const h = { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" };
  const get = (u, o) => fetch(url + u, Object.assign({ headers: h }, o || {}))
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [coord, part, contacts, attest] = await Promise.all([
    get("/rest/v1/rpc/map_coordinator_summary", { method: "POST", body: "{}" }),
    get("/rest/v1/cpl_funding_participation?select=college,status,source,requested_at,noted_by,confirmed_at,revoked_at"),
    get("/rest/v1/map_college_contacts_pub?select=college,cpl_coordinator,landing_page_url"),
    get("/rest/v1/cpl_funding_nc_attestation_pub?select=college,fiscal_year,status,coordinator_name,coordinator_title,requested_at,revoked_at&order=fiscal_year.asc,requested_at.desc")
  ]);
  return { coord, part, contacts, attest };
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

const COND_WORDS = {
  coord: "A CPL Coordinator assigned in MAP, with the college's CPL landing page configured",
  part: "A local confirmation of participation on file",
  vetstar: "Joint services transcripts processed in MAP for at least 75 percent of enrolled veterans",
  exhibits: "Noncredit certificates posted as exhibits in MAP",
  nc_coord: "A Noncredit CPL Lead attested for this fiscal year",
  nc_team: "A noncredit CPL strike team"
};
const state = (r) => (r.pending ? "not yet known" : (r.met ? "met" : "not yet met"));

// One institution's standing, as its row and drill-in show it: the conditions,
// the JST counts, and every figure of its row in the page's own export.
// The heading carries the full name a reader types ("Cabrillo College") and the
// short name the page shows ("Cabrillo"), so cpl-chat finds the section by the
// name its college lookup resolves (S529; S528's Cabrillo ask found three other
// colleges). The short name is the page's own key for the row.
// The funding page's two display names that no short-name record or alias folds.
const PAGE_ONLY_NAMES = {
  "NOCE": "North Orange Continuing Education",
  "SD Cont. Ed": "San Diego College of Continuing Education"
};
function fullName(w, short) {
  if (PAGE_ONLY_NAMES[short]) return PAGE_ONLY_NAMES[short];
  const rec = (w.CPL_COLLEGE_SHORT || []).find((r) => r.short === short || r.canonical === short);
  if (rec) return rec.canonical;
  const f = typeof w.cplCollegeShort === "function" ? w.cplCollegeShort(short, "full") : "";
  return f || short;
}

function standing(w, row) {
  const T = w.CPL_FUNDING_TAB, name = row.Institution, full = fullName(w, name);
  const out = ["", "### " + full + SECTION_SUFFIX, ""];
  out.push("- Institution: " + full + (full !== name ? ", shown on the funding page as " + name : "") +
    (row.District ? " (" + row.District + ")" : ""));
  const c = T._conditions(name);
  if (c) {
    c.items.forEach((r) => out.push("- Minimum condition, " + (COND_WORDS[r.kind] || r.kind) + ": " + state(r) +
      (r.counts ? ". " + r.counts : "")));
    (c.ncItems || []).forEach((r) => out.push("- Noncredit share condition, " + (COND_WORDS[r.kind] || r.kind) + ": " + state(r)));
    out.push("- Funding status: " + (c.blocked ? "held until the minimum conditions are met" :
      (c.pending ? "conditions not yet all known" : "the minimum conditions are met, so its outcomes count toward its award")));
  }
  const pf = w.CPL_FUNDING_PERF, vj = pf && pf.vet_jst && pf.vet_jst[name];
  if (vj && vj.vets && !vj.vets_suppressed && !vj.jst_suppressed)
    out.push("- Veteran JSTs: " + vj.jst + " JSTs in MAP for " + vj.vets + " enrolled veterans (" +
      Math.round(vj.jst / vj.vets * 100) + " percent; the condition asks 75 percent)");
  Object.keys(row).forEach((k) => {
    if (k === "#" || k === "Institution" || k === "District") return;
    const v = String(row[k] == null ? "" : row[k]).trim();
    if (!v) return;
    const isMoney = /share|award|qualified so far(?! as)|Demonstrated|Withheld/i.test(k) && /^-?\d+(\.\d+)?$/.test(v);
    const num = /^-?\d+\.\d{2,}$/.test(v) ? String(Math.round(Number(v) * 10) / 10) : v;
    out.push("- " + k + ": " + (isMoney ? money(v) : num));
  });
  return out;
}

// Every institution against the JST condition, in one section (Sam, 2026-11-01:
// asked "which college have not yet met the 75% jst vet sprint goal for the new
// funding?", Sierra said she had no per-college percentages, since each college's
// counts sat only in its own section and the question named none). The verdict is
// the page's own condition (met, not yet met, not yet known), the counts its
// drill-in's; a masked count shows no figures. cpl-chat reads this section by its
// heading for a JST question that names no college.
const JST_ROLLUP_HEADING = "Veteran JSTs: which institutions have met the 75 percent condition";
function jstRollup(w, rows) {
  const T = w.CPL_FUNDING_TAB, pf = w.CPL_FUNDING_PERF || {}, vjAll = pf.vet_jst || {};
  const below = [], met = [], unknown = [];
  let nc = 0;
  rows.forEach((r) => {
    const name = r.Institution, c = T._conditions(name);
    const it = c && c.items.find((x) => x.kind === "vetstar");
    if (!it) { if (c && (c.items.some((x) => x.kind === "exhibits") || (c.ncItems || []).length)) nc++; return; }
    const vj = vjAll[name], full = fullName(w, name);
    let fig;
    if (!vj) fig = ": the funding page shows no counts";
    else if (vj.vets_suppressed) fig = ": fewer than 10 enrolled veterans";
    else if (vj.jst_suppressed) fig = ": fewer than 10 JSTs for " + vj.vets + " enrolled veterans";
    else fig = ": " + vj.jst + " JSTs for " + vj.vets + " enrolled veterans, " + Math.round(vj.jst / vj.vets * 100) + " percent";
    (it.pending ? unknown : (it.met ? met : below)).push({ full, line: "- " + full + fig });
  });
  const byName = (a, b) => a.full.localeCompare(b.full);
  [below, met, unknown].forEach((l) => l.sort(byName));
  const out = ["", "## " + JST_ROLLUP_HEADING, ""];
  out.push("The third minimum condition asks that MAP hold joint services transcripts (JSTs) for at least 75 percent " +
    "of the veterans MIS reports enrolled at the institution. Of the " + (below.length + met.length + unknown.length) +
    " institutions it applies to, " + met.length + " have met it and " + below.length + " have not yet met it" +
    (unknown.length ? "; for " + unknown.length + " it is not yet known" : "") + ". Each line below gives the JSTs in MAP, " +
    "the enrolled veterans and the percent, as the funding page shows them; a count under 10 is not shown. " +
    "Each institution's own section carries its figures." +
    (nc ? " Noncredit-only institutions post certificates in MAP in its place." : "") +
    " The statewide JST count is the MAP dashboard's military students figure.");
  // A list and its label share a paragraph, so the indexer's split keeps them together.
  const names = (l) => l.map((x) => x.full).join("; ") + ".";
  if (below.length) { out.push(""); out.push("Not yet met (" + below.length + "):"); below.forEach((x) => out.push(x.line)); }
  if (met.length) { out.push(""); out.push("Met (" + met.length + "): " + names(met)); }
  if (unknown.length) { out.push(""); out.push("Not yet known (" + unknown.length + "): " + names(unknown)); }
  return out;
}

function buildNote(cfg, savedAt, pub) {
  const w = renderPage(cfg, pub);
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
  parts.push.apply(parts, jstRollup(w, rows));
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
  // One heading per institution (S528; Sam, 2026-10-30: "she should have access
  // to all the data and text info on the page"). The vault's indexer splits a
  // note at headings, so a question naming one college finds its own section:
  // max award and shares, each condition, the JST counts, Funds Qualified So
  // Far and every priority figure the page's export carries.
  parts.push("");
  parts.push("Each institution's section below gives its max award and shares, each minimum condition and whether it is met, " +
    "its veteran JST counts, its Funds Qualified So Far and its priority outcome figures, as its row on the public funding page shows them" +
    (pub ? "" : " (conditions were not read for this build)") + ".");
  parts.push("");
  parts.push("In each section, P1 is Access (applied CPL units available to students in MAP) and P2 is Completion " +
    "(transcribed CPL units), each in FTES; the noncredit P1 counts exhibits built or adopted for the noncredit program's " +
    "learning and the noncredit P2 a Noncredit Career Exploration and CPL Portfolio course. A target is what the share " +
    "asks and an actual is what MAP shows today.");
  rows.forEach((r) => { parts.push.apply(parts, standing(w, r)); });
  return parts.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

// The section heading for one institution, by its full name: cpl-chat reads a
// named college's section with it.
const SECTION_SUFFIX = ": CPL funding standing";

module.exports = { buildNote, csvRows, sectionText, loadConfig, fetchPublic, SECTION_SUFFIX, JST_ROLLUP_HEADING };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const cfgPath = flag("--config"), outPath = flag("--out");
  if (!cfgPath) { console.error("usage: node scripts/funding_sierra_note.js --config live.json [--out note.md]"); process.exit(2); }
  const c = loadConfig(cfgPath);
  // --no-public builds offline (the tests); the workflow reads the public rows.
  (argv.includes("--no-public") ? Promise.resolve(null) : fetchPublic()).then((pub) => {
    const note = buildNote(c.cfg, c.savedAt, pub);
    if (outPath) { fs.writeFileSync(outPath, note); console.log("wrote " + outPath + " (" + note.length + " chars)"); }
    else process.stdout.write(note);
  });
}
