// Regression tests for statewide_interactive.js — the EACR "Student view" (v3,
// Session 34) plus the shared typicalAward() refactor it introduced.
//
// The Student view is the seeker lens: pick a college and each credential is
// classified ✅ available now / 🎯 likely-qualify (names the local course from the
// prescriptive layer) / ○ aligned-program. Guards the behavior + the failure
// modes (malformed credit strings, unclassified raw cards, a credential with no
// prescriptive entry) so they can't silently regress — and that the DRY
// typicalAward() extraction didn't break the v1/v2 "💡 Typical CPL" headline.
//
// Run from repo root: `npm test` (or `node tests/eacr_student.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ── Fixture ──────────────────────────────────────────────────────────────
// CompTIA A+ as two cards (CCC + Local) → tests group-union of adopters.
// College C sits in potential AND prescriptive → must classify as 🎯 (qualify),
// not ○ (aligned). College C as a pure adopter (Cisco) → ✅. College C in
// potential only, no prescriptive (Aligned-Only) → ○. Plus an unclassified raw
// card and a malformed-credit card to exercise the no-crash / no-award paths.
const exhibits = [
  { exhibit_id: "x1", title: "CompTIA A+", unified_title: "CompTIA A+", issuing_agency: "CompTIA",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "CCC Collaborative",
    adopters: 2, adopter_names: ["College A", "College B"], potential: 2, potential_names: ["College C", "College D"],
    credit_recs: [
      { course: "CIS 110", credit: "4 hours in ICT Essentials" },
      { course: "CIS 25",  credit: "4 hours in ICT Essentials" },
      { course: "CIS 212", credit: "3 hours in A+ Prep" }
    ] },
  { exhibit_id: "x2", title: "CompTIA A+", unified_title: "CompTIA A+", issuing_agency: "CompTIA",
    is_classified: true, cpl_type: "Credit By Exam", collaborative_type: "Local",
    adopters: 1, adopter_names: ["College E"], potential: 1, potential_names: ["College C"],
    credit_recs: [{ course: "CIS 50", credit: "3 hours in A+ Challenge" }] },
  { exhibit_id: "x3", title: "Acme Widget Cert", unified_title: "Acme Widget Cert", issuing_agency: "Acme",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "Local",
    adopters: 0, adopter_names: [], potential: 1, potential_names: ["College C"],
    credit_recs: [{ course: "WID 1", credit: "2 hours in Widgets" }] },
  { exhibit_id: "x4", title: "Some Raw Freehand Title", unified_title: "", issuing_agency: "",
    is_classified: false, cpl_type: "Industry Certification", collaborative_type: "Local",
    adopters: 1, adopter_names: ["College A"], potential: 0, potential_names: [], credit_recs: [] },
  { exhibit_id: "x5", title: "Malformed Cert", unified_title: "Malformed Cert", issuing_agency: "Z",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "Local",
    adopters: 1, adopter_names: ["College A"], potential: 0, potential_names: [],
    credit_recs: [{ course: "M 1", credit: "see catalog" }] },
  { exhibit_id: "x6", title: "Cisco CCNA", unified_title: "Cisco CCNA", issuing_agency: "Cisco",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "CCC Collaborative",
    adopters: 1, adopter_names: ["College C"], potential: 0, potential_names: [],
    credit_recs: [{ course: "NET 1", credit: "3 hours in Networking" }] },
  { exhibit_id: "x7", title: "Aligned Only Cert", unified_title: "Aligned Only Cert", issuing_agency: "Y",
    is_classified: true, cpl_type: "Industry Certification", collaborative_type: "Local",
    adopters: 1, adopter_names: ["College B"], potential: 1, potential_names: ["College C"],
    credit_recs: [{ course: "AL 1", credit: "2 hours in Align" }] }
];

const prescriptive = {
  "CompTIA A+":     { n_colleges: 1, withheld: 0, colleges: [{ college: "College C", courses: [{ subject: "CIS", number: "110", units: 4 }] }] },
  "Acme Widget Cert": { n_colleges: 1, withheld: 0, colleges: [{ college: "College C", courses: [{ subject: "WID", number: "100", units: 2 }] }] }
};
const lookup = {
  "College A": { district: "D1", swRegion: "R1" },
  "College B": { district: "D1", swRegion: "R1" },
  "College C": { district: "D2", swRegion: "R2" },
  "College D": { district: "D2", swRegion: "R2" },
  "College E": { district: "D3", swRegion: "R3" }
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CPL_STATEWIDE_PRESCRIPTIVE = ${JSON.stringify(prescriptive)};
  window.CCC_COLLEGE_LOOKUP = ${JSON.stringify(lookup)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
// Only network call on init is fetchFlagOverlay() — stub to an empty overlay.
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(runAssertions, 80);

function runAssertions() {
  const doc = window.document;
  const container = doc.getElementById("statewide-interactive-container");

  // ── Structure ──
  const sums = Array.from(container.querySelectorAll(".sw-gallery-sum")).map(txt);
  check("v3 Student view section present", sums.some((s) => /Student view/.test(s)));
  const sv = doc.getElementById("sw-sv-body");
  check("#sw-sv-body rendered", !!sv && sv.innerHTML.length > 0);
  // v1 table + v2 credential view still build (additive).
  check("v1 table still renders", !!container.querySelector("table.exhibit-table"));
  const cv = doc.getElementById("sw-cv-body");
  check("v2 credential body still renders", !!cv);
  // The DRY typicalAward() refactor must keep the v1/v2 "💡 Typical CPL" headline.
  check("v2 still shows 'Typical CPL' headline", /Typical CPL/.test(cv.innerHTML));

  // ── Browse mode (no college picked) ──
  check("browse: shows the 'pick your college' tip", !!sv.querySelector(".sv-banner-tip") && /Pick your/.test(txt(sv.querySelector(".sv-banner"))));
  const cards = Array.from(sv.querySelectorAll(".cv-credential"));
  check("browse: a card per credential rendered", cards.length >= 5);
  function cardFor(title) { return cards.find((c) => txt(c.querySelector(".cv-title")).indexOf(title) === 0); }
  const comptia = cardFor("CompTIA A+");
  check("browse: CompTIA A+ card present", !!comptia);
  if (comptia) {
    // unitVals across the union = [4 (ICT Essentials), 3 (A+ Prep), 3 (A+ Challenge)] → modal 3, range 3–4.
    check("browse: award headline present", /You.{0,3}d typically earn/.test(txt(comptia.querySelector(".sv-award"))));
    check("browse: award shows the modal/range (3–4)", /3.?4|range 3/.test(txt(comptia.querySelector(".sv-award"))));
    // adopters union across the 2 cards = A, B, E = 3 statewide.
    check("browse: 3 colleges statewide (union of both cards)", /3 colleges statewide/.test(txt(comptia.querySelector(".sv-sw"))));
    check("browse: prescriptive hint nudges to pick a college", /1 more college/.test(txt(comptia.querySelector(".sv-pres-hint"))));
    check("browse: NO near-me status block yet", !comptia.querySelector(".sv-status"));
  }
  const acme = cardFor("Acme Widget Cert");
  check("browse: no-adopter credential says none yet + could", acme && /No college has articulated this yet.*1 could/.test(txt(acme.querySelector(".sv-sw"))));
  // Failure modes: malformed credit → no award line; unclassified → dimmed, no throw.
  const malformed = cardFor("Malformed Cert");
  check("malformed credit → no award headline (no crash)", malformed && !malformed.querySelector(".sv-award"));
  const unclass = cards.find((c) => c.classList.contains("sv-unclass"));
  check("unclassified raw card rendered + dimmed", !!unclass);
  check("unclassified sinks below classified cards", cards.indexOf(unclass) >= cards.length - 1);

  // ── Near-me mode: pick College C ──
  const ddInputs = Array.from(container.querySelectorAll("#sw-filter-college-dd input[type=checkbox]"));
  const ccBox = ddInputs.find((i) => i.value === "College C");
  check("College C is a filter option", !!ccBox);
  let nearThrew = false;
  try {
    ccBox.checked = true;
    ccBox.dispatchEvent(new window.Event("change", { bubbles: true }));
  } catch (e) { nearThrew = true; console.error("near-me toggle threw:", e); }
  check("selecting a college does not throw", !nearThrew);

  const sv2 = doc.getElementById("sw-sv-body");
  check("near-me: banner switches to 'near College C'", /near\s+College C/.test(txt(sv2.querySelector(".sv-banner"))));
  const cards2 = Array.from(sv2.querySelectorAll(".cv-credential"));
  function cardFor2(title) { return cards2.find((c) => txt(c.querySelector(".cv-title")).indexOf(title) === 0); }

  // CompTIA A+: College C ∈ potential AND prescriptive → 🎯 qualify, names CIS 110.
  const comptia2 = cardFor2("CompTIA A+");
  check("near-me: CompTIA shows 🎯 'likely already qualify'", comptia2 && /likely already qualify/.test(txt(comptia2.querySelector(".sv-maybe"))));
  check("near-me: 🎯 names the exact local course (CIS 110)", comptia2 && /CIS\s*110/.test(txt(comptia2.querySelector(".sv-maybe"))));
  check("near-me: 🎯 does NOT mislabel College C as aligned-only", comptia2 && !comptia2.querySelector(".sv-prog"));

  // Cisco CCNA: College C is a real adopter → ✅ available now.
  const cisco = cardFor2("Cisco CCNA");
  check("near-me: adopter college → ✅ 'Available now'", cisco && /Available now/.test(txt(cisco.querySelector(".sv-yes"))));

  // Aligned Only Cert: College C in potential, NO prescriptive → ○ aligned program.
  const aligned = cardFor2("Aligned Only Cert");
  check("near-me: potential-only (no prescriptive) → ○ 'Aligned program'", aligned && /Aligned program/.test(txt(aligned.querySelector(".sv-prog"))));

  // Actionable credentials sort above non-actionable in near-me mode.
  const idxCisco = cards2.indexOf(cisco), idxAligned = cards2.indexOf(aligned);
  check("near-me: ✅-available sorts above ○-aligned", idxCisco >= 0 && idxAligned >= 0 && idxCisco < idxAligned);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
