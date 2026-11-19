// CPL Pathways: a paired alternative reads as one option (S683, #3508 round two's reader finding 1).
//
// kb/_program_requirements_units_rules.py gives alternatives taken together in a row's place one "together"
// label: each member carries its own units from the state's course file, or none, with the group's figure in
// together_units. The By requirement tile printed every alternative as its own "or CODE · units", so after the
// write Long Beach City 44747 would read "or BIO 60L · 1 unit", as if the lab alone replaced ANAT 1, and Citrus
// 11247's ESTH 144 and 145 would read with no figure at all.
//
// Guards, on the two rows as the S681 plan writes them (kb/receipts/program_requirement_records_units_rules_
// 2026-11-19_s681.json):
//   (a) a group is one "or" line naming every member, and no member gets a line of its own;
//   (b) a member with its own units shows them, and the option's figure is their sum (44747: 4 and 1, 5 units);
//   (c) a member with no units shows no figure, and the option's figure is together_units (Citrus: 4 units);
//   (d) an alternative outside a group still reads as before (ANAT 41, PHYSI 1).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

function render(row) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  w.eval(DATA);
  w.eval(ROEP);
  w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  const rec = JSON.parse(JSON.stringify(w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158")));
  rec.record.blocks = [{ name: "Required Courses", rule: "all", minimum: null, option_group: null,
    stated: { min: null, max: null }, courses: [row] }];
  T._roepView.lay = "req"; T._roepView.who = "college";
  T._renderRoepProgram(root, rec);
  const tile = [...root.querySelectorAll(".cplpw-rmap .cplpw-rtile")].find((t) => t.getAttribute("data-code") === row.code);
  return tile ? [...tile.querySelectorAll(".cplpw-ralt")].map((n) => n.textContent) : null;
}

// Long Beach City 44747's ANAT 1 row, as the plan writes it.
const lb = render({ code: "ANAT 1", units: 4, units_max: 5, alternatives: [
  { code: "ANAT 41", units: 4, units_max: 5 },
  { code: "BIO 60", units: 4, units_max: null, together: "BIO 60 + BIO 60L" },
  { code: "BIO 60L", units: 1, units_max: null, together: "BIO 60 + BIO 60L" },
  { code: "PHYSI 1", units: 5 }] });
check("(a) 44747: three options under ANAT 1, the pair one of them", lb && lb.length === 3, lb);
const pair = (lb || []).find((t) => /BIO 60L/.test(t)) || "";
check("(a) 44747: the pair's line names both members", /^or BIO 60\b/.test(pair) && /and BIO 60L/.test(pair) && /taken together/.test(pair), pair);
check("(a) 44747: no line offers BIO 60L alone", !(lb || []).some((t) => /^or BIO 60L/.test(t)), lb);
check("(b) 44747: each member shows its own units, and the option shows their sum",
  /BIO 60 \(4 units\)/.test(pair) && /BIO 60L \(1 unit\)/.test(pair) && /· 5 units$/.test(pair), pair);
check("(d) 44747: ANAT 41 and PHYSI 1 read as before",
  (lb || []).includes("or ANAT 41 · 4 units") && (lb || []).includes("or PHYSI 1 · 5 units"), lb);

// Citrus 11247's ESTH 142 row: a pair the state's file does not confirm, so the group carries the row's 4.
const ci = render({ code: "ESTH 142", units: 4, units_max: null, alternatives: [
  { code: "ESTH 144", units: null, units_max: null, together: "ESTH 144 + ESTH 145", together_units: 4, together_units_max: null },
  { code: "ESTH 145", units: null, units_max: null, together: "ESTH 144 + ESTH 145", together_units: 4, together_units_max: null }] });
check("(a) Citrus: one option for the pair", ci && ci.length === 1, ci);
check("(c) Citrus: the members show no figure, the option shows together_units",
  ci && /^or ESTH 144 and ESTH 145, taken together · 4 units$/.test(ci[0]), ci);

let failed = 0;
for (const [name, ok, why] of results) {
  if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
}
console.log((results.length - failed) + "/" + results.length + " checks passed: CPL Pathways paired alternatives");
if (failed) process.exit(1);
