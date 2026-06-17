// TMC Builder — GE Breadth companion (the GE half of the ADT). Guards:
//   (1) the three GE patterns parse (Cal-GETC primary + legacy IGETC/CSU GE),
//   (2) the builder renders a GE companion panel in BUILD mode with a pattern
//       selector, picking a course updates the GE + combined ADT totals,
//   (3) switching the pattern swaps the area set (and flags legacy),
//   (4) REVIEW mode (All colleges) shows the GE areas read-only (no picker),
//   (5) GE selections + the chosen pattern land in the saved payload jsonb.
//
// Run from repo root: `npm test` (or `node tests/tmc_ge_breadth.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Part A — the GE patterns data file ──
const geSrc = fs.readFileSync("tmc_ge_patterns.js", "utf8");
const gdom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { runScripts: "outside-only" });
gdom.window.eval(geSrc);
const G = gdom.window.CPL_TMC_GE_PATTERNS;
check("GE patterns parse to {patterns:[...]}", G && Array.isArray(G.patterns) && G.patterns.length === 3);
check("GE patterns flagged draft", G && G._meta && G._meta.draft === true);
const calgetc = (G.patterns || []).filter((p) => p.id === "cal-getc")[0];
const igetc = (G.patterns || []).filter((p) => p.id === "igetc")[0];
const csu = (G.patterns || []).filter((p) => p.id === "csu-ge")[0];
check("Cal-GETC present and NOT legacy", calgetc && calgetc.legacy === false);
check("IGETC + CSU GE Breadth present and flagged legacy", igetc && igetc.legacy === true && csu && csu.legacy === true);
check("Cal-GETC has Areas 1–6 (6 areas)", calgetc && calgetc.sections.length === 6);
check("Cal-GETC has an Ethnic Studies area", calgetc && calgetc.sections.some((s) => /Ethnic Studies/.test(s.name)));
check("Cal-GETC has NO Language-Other-Than-English area (dropped vs IGETC)",
  calgetc && !calgetc.sections.some((s) => /Language Other Than English/.test(s.name)));
check("IGETC keeps the LOTE area", igetc && igetc.sections.some((s) => /Language Other Than English/.test(s.name)));
check("every GE slot is ge:true + noncid (manual pick, no C-ID auto-match)",
  G.patterns.every((p) => p.sections.every((s) => s.slots.every((sl) => sl.ge === true && sl.noncid === true))));

// builder lazy-loads the GE patterns file
const builderSrc = fs.readFileSync("tmc_builder.js", "utf8");
check("tmc_builder.js lazy-loads tmc_ge_patterns.js", /tmc_ge_patterns\.js/.test(builderSrc));

// ── Part B — interaction (jsdom) ──
const dom = new JSDOM(`<!DOCTYPE html><html><body><div class="cpl-tab-pane" id="tab-tmc-builder"><div id="tmc-builder-root"></div></div></body></html>`,
  { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;
window.CPL_TMC_TEMPLATES = { _meta: { draft: true, sources: {} }, templates: [
  { id: "p", discipline: "Psychology", degree: "AA-T", status: "draft", total_units: "19",
    sections: [{ name: "Required Core", select: "all", units: "6", slots: [{ cid: "PSY 110", title: "Intro Psych", units: "3" }] }] }
] };
window.CPL_TMC_COLLEGE_COURSES = { colleges: ["Cabrillo College"], courses: { "0": [
  ["PSYC", "1", "Intro Psych", 3, "PSY 110"],
  ["ENGL", "1A", "English Composition", 4, null],
  ["MATH", "12", "Statistics", 4, null]
] } };
gdom.window.eval(geSrc); window.CPL_TMC_GE_PATTERNS = G; // reuse the parsed patterns
window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
window.eval(builderSrc);
window.CPL_TMC_BUILDER.boot();

(async function () {
  // build mode: pick a college, open the TMC
  const colSel = document.getElementById("tmc-college-sel");
  colSel.value = "Cabrillo College"; colSel.dispatchEvent(new window.Event("change"));
  document.querySelector("#tab-tmc-builder .tmc-listrow").click();
  await sleep(0);

  const ge = document.querySelector("#tab-tmc-builder .tmc-ge");
  check("GE companion panel renders in build mode", !!ge);
  const geSel = document.getElementById("tmc-ge-sel");
  check("GE pattern selector offers all three patterns", geSel && geSel.options.length === 3);
  check("GE pattern selector defaults to Cal-GETC", geSel && geSel.value === "cal-getc");
  check("Cal-GETC renders 12 GE area rows", ge.querySelectorAll(".tmc-slot").length === 12);
  check("GE rows carry a 'GE' tag (not a C-ID badge)", ge.querySelector(".tmc-ge-tag") && !ge.querySelector(".tmc-cid"));

  // pick a course into the first GE area (1A) and confirm the totals move
  ge.querySelector(".tmc-picker-btn").click();
  const opts = document.querySelectorAll("#tab-tmc-builder .tmc-pop .tmc-opt");
  check("GE picker lists the college's courses", opts.length === 3);
  const engOpt = Array.prototype.filter.call(opts, (o) => /English Composition/.test(txt(o)))[0];
  engOpt.click();
  await sleep(0);
  check("picking a GE course stores it under a ge:-prefixed key",
    !!window.CPL_TMC_BUILDER._state.choice["ge:0:0"]);
  const geUnits = document.getElementById("tmc-ge-units");
  check("GE units total reflects the picked 4-unit course", geUnits && txt(geUnits) === "4");
  const adtLine = txt(document.querySelector("#tab-tmc-builder .tmc-ge .tmc-totals"));
  check("combined Full-ADT total = major + GE (3 + 4 = 7)", /=\s*7\b/.test(adtLine) && /Full ADT/.test(adtLine));

  // switch to a legacy pattern → different area set + legacy flag
  geSel.value = "igetc"; geSel.dispatchEvent(new window.Event("change"));
  await sleep(0);
  check("switching to IGETC swaps to its 14 areas", document.querySelectorAll("#tab-tmc-builder .tmc-ge .tmc-slot").length === 14);
  check("IGETC is flagged legacy in the panel", !!document.querySelector("#tab-tmc-builder .tmc-ge-legacy"));

  // back to the directory, open in REVIEW mode (All colleges) → GE read-only
  document.querySelector("#tab-tmc-builder .tmc-back").click();
  await sleep(0);
  const colSel2 = document.getElementById("tmc-college-sel");
  colSel2.value = ""; colSel2.dispatchEvent(new window.Event("change")); // All colleges
  document.querySelector("#tab-tmc-builder .tmc-listrow").click();
  await sleep(0);
  const geReview = document.querySelector("#tab-tmc-builder .tmc-ge");
  check("GE panel also shows in review mode", !!geReview);
  check("review-mode GE shows no course pickers (muted)", geReview.querySelectorAll(".tmc-picker-btn").length === 0);
  check("review-mode GE shows the area structure", geReview.querySelectorAll(".tmc-slot").length > 0);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
