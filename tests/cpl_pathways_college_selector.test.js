// CPL Pathways: the college comes first, then its List of pathways.
//
// Sam, 2026-10-08, asked for a College select ahead of the pathways ("we'll want to first select a college and then the
// pathways they offer"); on 2026-11-06 the new format made it the only way in: "Require college first". A chosen
// college shows five figure cards over one List of its pathways (commons_list.js); a program's title opens its pathway
// at full width, with a way back to the List as it was left. Mockup: https://claude.ai/artifact/R3knxBm8aG9D3FMryD377y
//
// Guards:
//   (a) the College select is labeled, opens on "Choose a college", and lists every college the pathways name, sorted,
//       once each; the Pathway select and its search box are retired;
//   (b) ⭐ with no college chosen the page asks for one: no cards, no List, no pathway;
//   (c) a college shows its head, five figure cards and a List of every pathway it has (featured maps, baccalaureates,
//       catalog records) and no other college's;
//   (d) the List's finder and filter words narrow it; a figure card sets its filter and says it is pressed;
//   (e) ⭐ a title opens its pathway at full width; Back returns to the List with its filter and finder as left;
//   (f) nothing is written to location.hash (the dashboard routes tabs on it).

const fs = require("fs");
const { JSDOM } = require("jsdom");
const DRIVE = require("./cpl_pathways_drive.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", url: "https://example.org/#cpl-pathways" });
const w = dom.window;
w.eval(DATA); w.eval(ROEP); w.eval(BACC); w.eval(SRC);
DRIVE.withList(w);
w.Element.prototype.scrollIntoView = function () {};
w.CPL_PATHWAYS_TAB.activate();
const root = w.document.getElementById("cpl-pathways-root");
const col = root.querySelector("select.cplpw-colsel");
const MT = "Mt. San Antonio College";
const own = (c) => []
  .concat(w.CPL_PATHWAYS.programs.filter((p) => p.college === c))
  .concat(w.CPL_BACCALAUREATES.programs.filter((p) => p.college === c))
  .concat(w.CPL_PATHWAYS_ROEP.programs.filter((p) => p.college === c));

// ── (a) ──
check("(a) the College select exists", !!col);
const lab = col && root.querySelector('label[for="' + col.id + '"]');
check("(a) it has its own visible label", lab && lab.textContent === "College:");
const names = [...col.options].map((o) => o.textContent);
check("(a) it opens on Choose a college", col.value === "" && names[0] === "Choose a college", names[0]);
const expected = [...new Set([].concat(w.CPL_PATHWAYS.programs, w.CPL_BACCALAUREATES.programs, w.CPL_PATHWAYS_ROEP.programs)
  .map((p) => p.college).filter(Boolean))].sort((a, b) => a.localeCompare(b));
check("(a) it lists every college the pathways name, sorted, once each",
  JSON.stringify(names.slice(1)) === JSON.stringify(expected), names.length - 1 + " vs " + expected.length);
check("(a) the Pathway select, its search box and Clear are retired",
  !root.querySelector("select.cplpw-select, #cplpw-path-find, .cplpw-clear, .cplpw-selcount"));

// ── (b) ──
check("(b) ⭐ no college: the page asks for one, with no cards, List or pathway",
  /Choose a college to see its pathways/.test(root.textContent) && !root.querySelector(".cplpw-card, #cplpw-list, .cplpw-path"));

// ── (c) ──
DRIVE.chooseCollege(w, root, MT);
const mt = DRIVE.listTitles(root);
check("(c) the college's head names it", (root.querySelector(".cplpw-h") || {}).textContent === MT);
check("(c) five figure cards, the first counting its pathways",
  root.querySelectorAll(".cplpw-card").length === 5 && root.querySelector(".cplpw-card-n").textContent === String(own(MT).length));
check("(c) the List holds every pathway the college has", mt.length === own(MT).length && mt.length > 0, mt.length + " vs " + own(MT).length);
check("(c) and no other college's", !mt.some((t) => /Field Ironworkers/.test(t)));
DRIVE.chooseCollege(w, root, "Cerritos College");
const cer = DRIVE.listTitles(root);
check("(c) Cerritos lists its featured maps and its catalog records",
  cer.includes("Field Ironworkers, high school to career") && cer.includes("Apprenticeship: Field Ironworkers"), cer.join(" | "));
check("(c) every card counts programs and sets a List filter (Sam's call 1, 2026-11-06)",
  JSON.stringify([...root.querySelectorAll(".cplpw-card")].map((b) => b.getAttribute("data-filter") + ":" + b.hasAttribute("aria-pressed")))
    === JSON.stringify([":true", "here:true", "adopt:true", "consider:true", "conf:true"]));
check("(c) the five filter words carry counts", /Certificates \(\d+\)/.test(root.textContent) && /Course maps \(\d+\)/.test(root.textContent));

// ── (d) ──
const find = root.querySelector("#cplpwl-find");
check("(d) the finder is labeled", find && /Find a pathway/.test(find.getAttribute("aria-label") || ""));
find.value = "ironworker"; find.dispatchEvent(new w.Event("input", { bubbles: true }));
const hits = DRIVE.listTitles(root);
check("(d) the finder narrows the List", hits.length > 0 && hits.length < cer.length && hits.every((t) => /ironworker/i.test(t)), hits.join(" | "));
const confCard = [...root.querySelectorAll(".cplpw-card")].find((b) => /Confirmed/.test(b.textContent));
confCard.click();
check("(d) a figure card sets its filter and reads pressed",
  root.querySelector('.cplpw-card[data-filter="conf"]').getAttribute("aria-pressed") === "true" &&
  !!root.querySelector('#cplpwl-filters [aria-current="true"]') && /Confirmed/.test(root.querySelector('#cplpwl-filters [aria-current="true"]').textContent));
const narrowed = DRIVE.listTitles(root);

// ── (e) ──
const first = narrowed[0];
DRIVE.openPathway(w, root, null, first);
check("(e) ⭐ a title opens its pathway at full width, the List and cards stepping aside",
  !!root.querySelector(".cplpw-path") && !root.querySelector("#cplpw-list, .cplpw-card") && !!root.querySelector("button.cplpw-back"));
check("(e) the way back names the college", /Back to Cerritos College's pathways/.test(root.querySelector("button.cplpw-back").textContent));
DRIVE.back(w, root);
check("(e) ⭐ Back returns to the List with its filter and finder as left",
  JSON.stringify(DRIVE.listTitles(root)) === JSON.stringify(narrowed) && root.querySelector("#cplpwl-find").value === "ironworker");
check("(e) and focus returns to the program the reader left", w.document.activeElement && w.document.activeElement.textContent === first);
DRIVE.chooseCollege(w, root, MT);
check("(e) a new college starts its List fresh", root.querySelector("#cplpwl-find").value === "" && DRIVE.listTitles(root).length === own(MT).length);

// ── (f) ──
check("(f) the picker and the List leave location.hash alone", w.location.hash === "#cpl-pathways", w.location.hash);

let pass = 0;
for (const [n, ok, why] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : "")); if (ok) pass++; }
console.log(`\n${pass}/${results.length} CPL Pathways college selector checks passed`);
process.exit(pass === results.length ? 0 : 1);
