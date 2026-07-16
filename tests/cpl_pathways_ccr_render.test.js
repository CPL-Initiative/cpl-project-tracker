// CPL Pathways — CCR two-view rendering (cpl_pathways.js renderCcrViews) test.
//
// Guards the consumer of window.CPL_PATHWAY_CCR (built by
// kb/_build_cpl_pathway_ccr.py):
//  (a) both HTMLs boot the CCR data file in the tab's load chain (Rule 4);
//  (b) lookupCcr keys on "<NORMCOLLEGE>|<top4>" and returns null when a program
//      has no articulated rows (so renderDirectory falls back to the legacy card);
//  (c) renderCcrViews builds the Student/College toggle, the ✓ course rows with
//      their local certs ("Qualify with … OR …"), and — as COLLEGE-ONLY (.col-only)
//      elements — the CCR reference chip, the peer field-agreement chip, the
//      over-merge flag, and the adoption-opportunities rows;
//  (d) the container starts in the student view (.view-student), which hides
//      .col-only via CSS — so a student never sees the curation chrome.
//
// Run from repo root: `npm test` (or `node tests/cpl_pathways_ccr_render.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// (a) both HTMLs boot the CCR data file, in the same chain (Rule 4)
["CPL_Dashboard.html", "index.html"].forEach(function (f) {
  const html = fs.readFileSync(f, "utf8");
  check("CCR data file booted in " + f,
    /loadScript\('cpl_pathways_ccr_data\.js', 'CPL_PATHWAY_CCR'/.test(html));
});

// Load the tab module in jsdom
const dom = new JSDOM("<body></body>", { runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window;
["requestAnimationFrame"].forEach(function (k) { if (!w[k]) w[k] = function (cb) { return setTimeout(cb, 0); }; });
w.eval(fs.readFileSync("cpl_pathways.js", "utf8"));
const T = w.CPL_PATHWAYS_TAB;
check("tab module loaded", !!T && typeof T._renderCcrViews === "function");

// (b) lookupCcr keying + null-on-empty
w.CPL_PATHWAY_CCR = {
  pathways: {
    "SAN DIEGO MIRAMAR COLLEGE|2199": { articulated: [{ subj: "FIPT", num: "105" }], units_total: 3, opportunities: [] },
    "EMPTY COLLEGE|9999": { articulated: [], units_total: 0, opportunities: [] },
  },
};
check("lookupCcr resolves cer_college|top4",
  T._lookupCcr({ cer_college: "San Diego Miramar College", top4: "2199" }) != null);
check("lookupCcr returns null for empty articulated (→ legacy fallback)",
  T._lookupCcr({ cer_college: "Empty College", top4: "9999" }) == null);
check("lookupCcr null when no global",
  (function () { const g = w.CPL_PATHWAY_CCR; w.CPL_PATHWAY_CCR = null; const r = T._lookupCcr({ cer_college: "X", top4: "0000" }); w.CPL_PATHWAY_CCR = g; return r == null; })());

// (c)+(d) renderCcrViews DOM
const ccr = {
  articulated: [
    { subj: "FIPT", num: "105", title: "Fire Behavior and Combustion",
      certs: ["State Fire Training Cert", "IFSTA Essentials"],
      ref: { kind: "CCR", id: "FIRE M1268", title: "Fire Behavior and Combustion" },
      agree: 13, peers: ["Allan Hancock College", "Bakersfield College"], flag: null },
    { subj: "AUTO", num: "116", title: "Electrical Fundamentals Lab", certs: ["ASE A6 Cert"],
      ref: { kind: "CCR", id: "CNST M1062", title: "Electrical Fundamentals Lab" },
      agree: 0, peers: [], flag: { kind: "cross_field_merge", detail: "Reference sits in TOP 0957, not this program's TOP 0948." } },
  ],
  units_total: 6,
  opportunities: [
    { my_courses: ["FIPT 250"], title: "Wildland Fire", ref: { kind: "CCR", id: "FIRE M1400" }, agree: 4, peers: ["Butte College"] },
  ],
};
const box = T._renderCcrViews({ college: "San Diego Miramar College" }, ccr);
w.document.body.appendChild(box);

check("container starts in student view", box.classList.contains("view-student") && box.classList.contains("cplccr"));
check("Student/College toggle has two buttons", box.querySelectorAll(".ccr-toggle .ccr-vt").length === 2);
check("CPL intro rendered", /Credit for Prior Learning/.test(box.querySelector(".ccr-intro").textContent));
check("✓ header shows course COUNT, not a unit sum (#777 count-doctrine)", (function () {
  const t = box.querySelector(".cplpw-sec-head .sum.cpl").textContent;
  return /2 courses/.test(t) && !/unit/.test(t);
})());
check("no scope note when the program has no feeders", !box.querySelector(".ccr-scope"));
check("✓ course row renders course code + name", /FIPT 105/.test(box.textContent) && /Fire Behavior and Combustion/.test(box.textContent));
check("certs render as 'Qualify with … OR …'", (function () {
  const c = box.querySelector(".ccr-cert");
  return c && /Qualify with/.test(c.textContent) && box.querySelectorAll(".ccr-or").length >= 1;
})());
check("CCR reference chip is COLLEGE-ONLY (.col-only)", (function () {
  const chip = Array.from(box.querySelectorAll(".ccr-chip")).find(function (e) { return /FIRE M1268/.test(e.textContent); });
  return chip && chip.classList.contains("col-only");
})());
check("field-agreement chip is COLLEGE-ONLY with peer hover", (function () {
  const ag = box.querySelector(".ccr-agree.col-only");
  return ag && /13 colleges also articulate/.test(ag.textContent) && /Allan Hancock/.test(ag.title);
})());
check("over-merge flag renders COLLEGE-ONLY", (function () {
  const fl = box.querySelector(".ccr-flag.col-only");
  return fl && /over-merge|not this program/.test(fl.textContent);
})());
check("adoption opportunities are COLLEGE-ONLY", box.querySelectorAll(".ccr-row.col-only").length >= 1 &&
  /Adoption opportunities/.test(box.textContent));
check("toggling to college view flips the container class", (function () {
  const btns = box.querySelectorAll(".ccr-toggle .ccr-vt");
  btns[1].dispatchEvent(new w.Event("click"));
  const ok = box.classList.contains("view-college") && !box.classList.contains("view-student");
  btns[0].dispatchEvent(new w.Event("click")); // back to student
  return ok && box.classList.contains("view-student");
})());

// Scope note appears ONLY for multidisciplinary (feeder) programs — it explains
// that the CPL is toward the lower-division qualifying associate degree, not the
// program's own upper-division core (the Miramar Public Safety Management case).
const boxF = T._renderCcrViews({ college: "San Diego Miramar College" }, {
  articulated: [{ subj: "FIPT", num: "105", title: "Fire Behavior", certs: [], ref: null, agree: 0, peers: [], flag: null }],
  units_total: 3, opportunities: [], feeders: ["2133", "1250", "2105"],
});
check("feeder program shows the qualifying-associate-degree callout", (function () {
  const s = boxF.querySelector(".ccr-scope");
  return s && /qualifying associate degree/.test(s.textContent) && /Entry requires/.test(s.textContent);
})());
check("callout says the upper-division core is coursework, not CPL", (function () {
  const s = boxF.querySelector(".ccr-scope");
  return s && /upper-division core/.test(s.textContent) && /completed through coursework/.test(s.textContent);
})());
check("feeder ✓ header still carries no unit sum", !/unit/.test(boxF.querySelector(".cplpw-sec-head .sum.cpl").textContent));

// ── report ──
const fail = results.filter(([, ok]) => !ok);
results.forEach(([n, ok]) => { if (!ok) console.log("  ✗ " + n); });
console.log(`\ncpl_pathways_ccr_render: ${results.length - fail.length}/${results.length} checks passed`);
process.exit(fail.length ? 1 : 0);
