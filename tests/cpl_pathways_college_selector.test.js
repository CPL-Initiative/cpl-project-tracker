// CPL Pathways: a College select ahead of the pathway select.
//
// Sam, 2026-10-08: "need to maybe have another selector that allows to narrow the
// current pathways selector to a college selected. The current selector is based on
// pathways first and colleges second, which is great when you want to see what
// pathways are available regardless of the college...but for other purposes, we'll
// want to first select a college and then the pathways they offer."
//
// Guards:
//   (a) both selects are labeled, the College select comes first, and it opens on
//       All colleges with every college the pathways name, sorted;
//   (b) All colleges is today's view: every pathway, in its groups;
//   (c) choosing a college narrows the pathway select to that college's featured
//       maps, baccalaureates and catalog records, keeping the groups, says so in the
//       caption, and opens its first pathway when the one shown is not the college's;
//   (d) going back to All colleges keeps the pathway shown;
//   (e) nothing is written to location.hash (the dashboard routes tabs on it).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
const w = dom.window;
w.eval(DATA); w.eval(ROEP); w.eval(BACC); w.eval(SRC);
w.Element.prototype.scrollIntoView = function () {};
w.CPL_PATHWAYS_TAB.activate();
const root = w.document.getElementById("cpl-pathways-root");
const col = root.querySelector("select.cplpw-colsel");
const sel = root.querySelector("select.cplpw-select");
const change = (s, v) => { s.value = v; s.dispatchEvent(new w.Event("change", { bubbles: true })); };
const texts = () => [...sel.querySelectorAll("option")].map((o) => o.textContent);
const groups = () => [...sel.querySelectorAll("optgroup")].map((g) => g.label);

// ── (a) ──
check("(a) the College select exists", !!col);
check("(a) it comes before the pathway select",
  col && sel && (col.compareDocumentPosition(sel) & w.Node.DOCUMENT_POSITION_FOLLOWING));
const labelFor = (s) => s && root.querySelector('label[for="' + s.id + '"]');
check("(a) each select has its own visible label",
  labelFor(col) && labelFor(col).textContent === "College:" && labelFor(sel) && labelFor(sel).textContent === "Pathway:");
const names = [...col.options].map((o) => o.textContent);
check("(a) it opens on All colleges", col.value === "" && names[0] === "All colleges", names[0]);
const items = []
  .concat((w.CPL_PATHWAYS.programs || []).map((p) => p.college))
  .concat((w.CPL_BACCALAUREATES.programs || []).map((p) => p.college))
  .concat((w.CPL_PATHWAYS_ROEP.programs || []).map((p) => p.college))
  .filter(Boolean);
const expected = [...new Set(items)].sort((a, b) => a.localeCompare(b));
check("(a) it lists every college the pathways name, sorted, once each",
  JSON.stringify(names.slice(1)) === JSON.stringify(expected), names.length - 1 + " vs " + expected.length);

// ── (b) ──
const all = texts().length;
const total = w.CPL_PATHWAYS.programs.length + w.CPL_BACCALAUREATES.programs.length + w.CPL_PATHWAYS_ROEP.programs.length;
check("(b) All colleges lists every pathway", all === total, all + " of " + total);
check("(b) and keeps the catalog-record group", groups().includes("Catalog records, Beta draft"));
const before = sel.value;

// ── (c) ──
change(col, "Mt. San Antonio College");
const mtsac = texts();
check("(c) a college narrows the pathways to its own",
  mtsac.length > 0 && mtsac.length < all && mtsac.every((t) => t.startsWith("Mt. San Antonio College — ")), mtsac.join(" | "));
check("(c) it holds every catalog record the college has",
  mtsac.filter((t) => / · /.test(t)).length === w.CPL_PATHWAYS_ROEP.programs.filter((p) => p.college === "Mt. San Antonio College").length);
check("(c) the groups stay", groups().includes("Catalog records, Beta draft"));
check("(c) the caption names the college", /^Mt\. San Antonio College: /.test(root.querySelector(".cplpw-selcount").textContent));
check("(c) the pathway shown is the college's first",
  sel.value === sel.options[0].value && /Mt\. San Antonio College|Fire Technology|Nursing|Early Childhood/.test(root.textContent));
change(col, "Cerritos College");
const cer = texts();
check("(c) Cerritos lists its featured maps and its catalog records",
  cer.some((t) => /Field Ironworkers, high school to career/.test(t)) && cer.some((t) => /Apprenticeship: Field Ironworkers/.test(t)),
  cer.join(" | "));
check("(c) another college's pathway is gone", !cer.some((t) => /Foothill College/.test(t)));
const picked = [...sel.options].find((o) => /Community Health Worker/.test(o.textContent));
if (picked) change(sel, picked.value);

// ── (d) ──
change(col, "");
check("(d) All colleges brings every pathway back", texts().length === all);
check("(d) and keeps the pathway shown", picked && sel.value === picked.value);

// ── (e) ──
check("(e) the selects leave location.hash alone", w.location.hash === "#cpl-pathways", w.location.hash);
check("(e) the first view is unchanged by the new select", before === "0");

let failed = 0;
for (const [name, ok, why] of results) {
  if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + why + "]" : "")); }
}
console.log((results.length - failed) + "/" + results.length + " CPL Pathways college selector checks passed");
if (failed) process.exit(1);
