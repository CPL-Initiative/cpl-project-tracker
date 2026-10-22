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
const texts = () => [...sel.querySelectorAll("option")].filter((o) => o.value !== "").map((o) => o.textContent);
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
  sel.value === sel.options[1].value && /Mt\. San Antonio College|Fire Technology|Nursing|Early Childhood/.test(root.textContent));
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

// ── (f) the pathway clears (Sam, S448: "no way I can see to clear the pathways filter") ──
const clearBtn = root.querySelector(".cplpw-clear");
check("(f) the Pathway list opens with a no-pathway choice", sel.options[0].value === "" && /No pathway chosen/.test(sel.options[0].textContent));
check("(f) a Clear control shows while a pathway is chosen", !!clearBtn && !clearBtn.hidden && clearBtn.tagName === "BUTTON");
clearBtn.click();
check("(f) Clear empties the Pathway list", sel.value === "");
check("(f) and the view says no pathway is chosen", !!root.querySelector(".cplpw-nopath") && !root.querySelector(".cplpw-hero, .cplpw-rprog, .cplpw-ladder"));
check("(f) and Clear hides itself", clearBtn.hidden);
change(col, "Mt. San Antonio College");
check("(f) picking a college keeps the pathway cleared", sel.value === "" && !!root.querySelector(".cplpw-nopath"));
change(sel, sel.options[1].value);
check("(f) choosing a pathway brings Clear back", !root.querySelector(".cplpw-clear").hidden && !root.querySelector(".cplpw-nopath"));
change(sel, "");
check("(f) the no-pathway choice in the list clears it too", !!root.querySelector(".cplpw-nopath"));

// ── (g) the search box (Sam, 2026-10-22: search for something like "drone" and pull up a short list) ──
{
  const find = root.querySelector("#cplpw-path-find");
  const fl = find && root.querySelector('label[for="cplpw-path-find"]');
  check("(g) a labeled search box sits after the College select", !!find && !!fl && fl.textContent === "Search:"
    && (col.compareDocumentPosition(find) & w.Node.DOCUMENT_POSITION_FOLLOWING) && (find.compareDocumentPosition(sel) & w.Node.DOCUMENT_POSITION_FOLLOWING));
  change(col, "");
  const typeIn = (v) => { find.value = v; find.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); };
  typeIn("nursing");
  const hits = texts();
  check("(g) typing narrows the Pathway list to the matches", hits.length > 0 && hits.length < all && hits.every((t) => /nursing/i.test(t)), hits.length);
  const found = [...root.querySelectorAll(".cplpw-found-go")];
  check("(g) and lists every match below, none chosen yet", sel.value === "" && found.length === Math.min(hits.length, 100), found.length + " vs " + hits.length);
  check("(g) the caption counts the matches", /pathways? match(es)? “nursing”/.test(root.querySelector(".cplpw-selcount").textContent));
  found[0].click();
  check("(g) a match opens its pathway", sel.value !== "" && !root.querySelector(".cplpw-found"));
  // Picking a college with the search still typed redraws the matches for that college (Sam, S448).
  typeIn("nursing");
  change(col, "Mt. San Antonio College");
  const atMt = [...root.querySelectorAll(".cplpw-found-go")].map((b) => b.textContent);
  check("(g) a college picked after a search redraws the matches for it", atMt.length > 0 && atMt.every((t) => t.startsWith("Mt. San Antonio College — ") && /nursing/i.test(t)), atMt);
  find.value = "nursing"; find.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  check("(g) Enter on the same words redraws them", root.querySelectorAll(".cplpw-found-go").length === atMt.length);
  change(col, "");
  typeIn("nursing zzzqqq");
  check("(g) words that match nothing say so", texts().length === 0 && /No pathway matches/.test(root.textContent));
  typeIn("");
  check("(g) clearing the search brings every pathway back", texts().length === all);
}

// ── (h) each group lists alphabetically (Sam, 2026-10-22: "sorted alpha") ──
{
  const sorted = [...sel.querySelectorAll("optgroup")].every((g) => {
    const t = [...g.querySelectorAll("option")].map((o) => o.textContent);
    return t.every((x, i) => i === 0 || t[i - 1].localeCompare(x, "en", { sensitivity: "base" }) <= 0);
  });
  check("(h) every group of the Pathway list is in alphabetical order", sorted);
}

// ── (i) My College's sections, folded under the college line (step 2 of the fold) ──
{
  const loads = [];
  w.CPL_TABS = { loadScript: (src, g, cb) => { loads.push(src); w.CPL_COLLEGE_BRIEFING = { mountInto: (host, c) => { host.setAttribute("data-mounted-for", c); } }; cb(); } };
  change(col, "");
  const box = () => root.querySelector("details.cplpw-mycollege");
  check("(i) no My College section until a college is chosen", box() && box().hidden);
  change(col, "Mt. San Antonio College");
  check("(i) a chosen college shows it, folded, named", box() && !box().hidden && !box().open && /My College: Mt\. San Antonio College/.test(box().querySelector("summary").textContent));
  check("(i) nothing loads while it is folded", loads.length === 0, loads);
  box().open = true; box().dispatchEvent(new w.Event("toggle"));
  const host = box().querySelector(".cplpw-mycollege-b");
  check("(i) opening it loads My College and mounts it for the college", loads[0] === "college_briefing.js" && host.getAttribute("data-mounted-for") === "Mt. San Antonio College", loads);
  change(col, "Cerritos College");
  check("(i) another college remounts it while open", box().querySelector(".cplpw-mycollege-b").getAttribute("data-mounted-for") === "Cerritos College");
}

let failed = 0;
for (const [name, ok, why] of results) {
  if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + why + "]" : "")); }
}
console.log((results.length - failed) + "/" + results.length + " CPL Pathways college selector checks passed");
if (failed) process.exit(1);
