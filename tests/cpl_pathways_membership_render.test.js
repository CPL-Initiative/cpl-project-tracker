// CPL Pathways — membership-driven rendering (cpl_pathways.js renderMembership) test.
//
// Guards the consumer of window.CPL_PATHWAY_MEMBERSHIP (built by
// kb/_build_cpl_pathway_membership.py) — the AUTHORITATIVE program→course view
// that replaces the TOP-proxy CCR guess (docs/cpl_pathways_lessons.md, StarMora):
//  (a) both HTMLs boot the membership data file in the tab's load chain (Rule 4);
//  (b) lookupMembership keys on prog.control and returns null when absent (so
//      renderDirectory falls back to the CCR/legacy card);
//  (c) renderMembership builds the Student/College toggle, the bachelor's own
//      course rows with per-course CPL glyphs (✓ articulated / ◍ potential /
//      · none), the "Qualify with … OR …" line for an articulated course, the
//      "Potential CPL — N colleges" line for a peer-only course, and the
//      qualifying-credential sub-cards (expandable, with embedded-cert meta);
//  (d) the CCR reference chip + inferred "core" badge are COLLEGE-ONLY
//      (.col-only), and the container starts in the student view (.view-student).
//
// Run from repo root: `npm test` (or `node tests/cpl_pathways_membership_render.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// (a) both HTMLs boot the membership data file, in the same chain (Rule 4)
["CPL_Dashboard.html", "index.html"].forEach(function (f) {
  const html = fs.readFileSync(f, "utf8");
  check("membership data file booted in " + f,
    /loadScript\('cpl_pathways_membership_data\.js', 'CPL_PATHWAY_MEMBERSHIP'/.test(html));
});

// Load the tab module in jsdom
const dom = new JSDOM("<body></body>", { runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window;
["requestAnimationFrame"].forEach(function (k) { if (!w[k]) w[k] = function (cb) { return setTimeout(cb, 0); }; });
w.eval(fs.readFileSync("cpl_pathways.js", "utf8"));
const T = w.CPL_PATHWAYS_TAB;
check("tab module loaded", !!T && typeof T._renderMembership === "function");

// (b) lookupMembership keying + null-when-absent
w.CPL_PATHWAY_MEMBERSHIP = {
  programs: {
    "46284": { control: "46284", kind: "BS", n_resolved: 2, courses: [] },
  },
};
check("lookupMembership resolves by control",
  T._lookupMembership({ control: "46284" }) != null);
check("lookupMembership returns null for unknown control (→ CCR/legacy fallback)",
  T._lookupMembership({ control: "99999" }) == null);
check("lookupMembership null when no global",
  (function () { const g = w.CPL_PATHWAY_MEMBERSHIP; w.CPL_PATHWAY_MEMBERSHIP = null; const r = T._lookupMembership({ control: "46284" }); w.CPL_PATHWAY_MEMBERSHIP = g; return r == null; })());

// (c)+(d) renderMembership DOM against a representative program record
w.CPL_PATHWAY_MEMBERSHIP = {
  programs: {
    // the qualifying A.S. (embeds one cert) + the embedded cert, referenced by the BS
    "04209": {
      control: "04209", kind: "AS", title: "Automotive Technology", degree_abbr: "A.S.",
      n_resolved: 2, embeds: ["08713"], embedded_in: [],
      courses: [
        { subj: "AUTO", num: "102", code: "AUTO 102", title: "Introduction to Automotive", units: 3,
          tier: "core", core_freq: 8, in_certs: ["08713"],
          cpl: { articulated: true, certs: ["ASE Student Certification"], ref: { kind: "C-ID", id: "AUTO 110", title: "" }, agree: 2, peers: ["Rio Hondo College", "De Anza College"] } },
        { subj: "AUTO", num: "299", code: "AUTO 299", title: "Work Experience", units: 2,
          tier: "option", core_freq: 1, in_certs: [],
          cpl: null },
      ],
    },
    "08713": { control: "08713", kind: "CERT", title: "Chassis Service Option", degree_abbr: "Cert.",
      n_resolved: 1, embeds: [], embedded_in: ["04209"], courses: [] },
    // the BS
    "46284": {
      control: "46284", kind: "BS", title: "Automotive Technology", college: "Santa Ana College",
      degree: "Bachelor of Science", n_resolved: 2,
      courses: [
        { subj: "AUTO", num: "318", code: "AUTO 318", title: "Advanced Engine Performance", units: 3,
          cpl: { articulated: false, certs: [], ref: { kind: "C-ID", id: "AUTO 200", title: "" }, agree: 2, peers: ["Rio Hondo College", "De Anza College"] } },
        { subj: "AUTO", num: "300", code: "AUTO 300", title: "Introduction to Automotive Manufacturing", units: 3,
          cpl: null },
      ],
      qualifying: [
        { control: "04209", title: "Automotive Technology", kind: "AS", degree_abbr: "A.S.",
          n_courses: 2, n_cpl: 1, n_embedded_certs: 1, embedded_in: [] },
        { control: "08713", title: "Chassis Service Option", kind: "CERT", degree_abbr: "Cert.",
          n_courses: 1, n_cpl: 0, n_embedded_certs: 0, embedded_in: ["04209"] },
      ],
    },
  },
};
const bs = T._lookupMembership({ control: "46284" });
const box = T._renderMembership({ control: "46284", college: "Santa Ana College" }, bs);
const txt = box.textContent;

check("container starts in the student view", box.className.indexOf("view-student") >= 0);
check("has the Student/College two-view toggle", box.querySelectorAll(".ccr-vt").length === 2);
check("shows the bachelor's course-requirements heading", /bachelor's course requirements/i.test(txt));
check("lists the BS's own course (AUTO 300)", txt.indexOf("AUTO 300") >= 0);
check("BS upper-div course with a peer reference is POTENTIAL CPL (◍ + peer line)",
  /Potential CPL/i.test(txt) && box.querySelector(".mem-glyph.pot") != null);
check("qualifying-credentials section renders", /Where the CPL lives/i.test(txt));
check("qualifying A.S. sub-card is present and collapsible",
  box.querySelectorAll(".mem-qhead").length === 2);

// expand the A.S. sub-card and inspect its course rows
const asHead = box.querySelectorAll(".mem-qhead")[0];
asHead.dispatchEvent(new w.Event("click"));
check("expanding the A.S. reveals its courses (AUTO 102)", box.textContent.indexOf("AUTO 102") >= 0);
check("an articulated course shows the local cert ('Qualify with …')",
  /Qualify with/i.test(box.textContent) && box.textContent.indexOf("ASE Student Certification") >= 0);
check("an articulated course row carries the ✓ glyph", box.querySelector(".mem-glyph.cpl") != null);
check("embedded-cert count surfaces on the A.S. sub-card", /embedded cert/i.test(box.textContent));

// (d) curator-only chrome is .col-only (hidden in student view)
const chip = box.querySelector(".mem-chip");
check("CCR reference chip is college-only", chip != null && chip.className.indexOf("col-only") >= 0);
const core = box.querySelector(".mem-core");
check("inferred 'core' badge is college-only", core != null && core.className.indexOf("col-only") >= 0);

const passed = results.filter(function (r) { return r[1]; }).length;
results.forEach(function (r) { console.log((r[1] ? "  PASS " : "  FAIL ") + r[0]); });
console.log(passed + "/" + results.length + " passed");
process.exit(passed === results.length ? 0 : 1);
