// The second axe pass (S495): every select on three internal tabs carries a name,
// where axe-core 4.10.2 found none (select-name, critical; the S494 sweep).
//
//   CCR list view       ten filters (#uc-kind and its neighbors), and the selects
//                       its editors open (stance, discipline, proposed discipline)
//   Common Subjects     the table's Show filter (#cs-filter)
//   MAP Users           the roster's sort (.mapu-select)
//
// A select's first option ("All kinds") is a value, never a name, so each one
// takes an aria-label or a title. Run: node tests/axe_select_names.test.js
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

// ── every el("select", {...}) in the two builders names its select ──────────
for (const f of ["unified_courses.js", "canonical_subj4.js"]) {
  const src = read(f);
  const calls = src.match(/el\("select", \{[^}]*\}/g) || [];
  const unnamed = calls.filter((c) => !/"aria-label":|\btitle:/.test(c));
  check(`${f}: all ${calls.length} selects it builds carry an aria-label or a title`,
    calls.length > 0 && unnamed.length === 0, unnamed.join(" | "));
}

// ── the CCR list view's filter helper names each filter by its id ───────────
{
  const src = read("unified_courses.js");
  const ids = (src.match(/sel\("uc-[a-z]+"/g) || []).map((m) => m.slice(5, -1));
  const names = /var FILTER_NAMES = \{([^}]*)\}/.exec(src);
  const missing = ids.filter((id) => !names || !names[1].includes(`"${id}":`));
  check(`the CCR list view's ${ids.length} filters each have a name in FILTER_NAMES`,
    ids.length >= 10 && missing.length === 0, missing.join(", "));
  check("sel() sets the name on the select it builds",
    /el\("select", \{ id: id, class: "uc-filter", "aria-label": FILTER_NAMES\[id\] \|\| label \}\)/.test(src));
}

// ── MAP Users: the roster's sort, as the page renders it ────────────────────
{
  const src = read("map_users.js");
  const m = /'<select class="mapu-select"[^']*'/.exec(src);
  const doc = new JSDOM("<!doctype html><body>" + (m ? m[0].slice(1, -1) + "</select>" : "")).window.document;
  const s = doc.querySelector("select.mapu-select");
  check("MAP Users' sort select carries a name", s && (s.getAttribute("aria-label") || "").trim().length > 0);
}

let fail = 0;
for (const [ok, name] of results) { console.log(`${ok ? "  ok " : "  FAIL"} ${name}`); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} checks passed`);
process.exit(fail ? 1 : 0);
