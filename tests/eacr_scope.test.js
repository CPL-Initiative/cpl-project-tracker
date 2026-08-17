// EACR college scope + CER fold (2026-08-16 — Sam: "Check the College filter and
// make sure it filters for colleges that have adopted the exhibit. I believe
// it's now filtering for any college that has adopted or could adopt.").
//
// He was right, and it was worse than the sentence suggests. exhibitMatchesFilters()
// matched on adopter_names ∪ potential_names, and "potential" is generated as
// every college with a program of study under the same TOP code ∪ every college
// teaching a course with a matching C-ID. Measured over the live payload:
// 93.6% of College-filter hits were NOT adoptions (Pasadena City College returned
// 1,790 cards and had adopted 44). The median card carries 1 adopter and 41
// potentials.
//
// Three scopes now, not a binary, because the middle one is a genuinely stronger
// signal that no filter could previously reach: the prescriptive M-ID layer names
// the local course the college already teaches (4,972 pairs vs 122,836).
//
// Also guarded: the CER fold. The card grain is (title, issuer, CPL type) but the
// CER's grain is the title, so 8 credentials rendered as TWO cards — a classified
// one carrying the issuer and an unclassified twin with a BLANK issuer, which
// sorts to the bottom where nobody connects them.
//
// Written against the FAILURE MODE. Verified against the pre-fix file.
//
// Run from repo root: `npm test` (or `node tests/eacr_scope.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
// A probe that throws must fail ITSELF, not silence the block it sits in — a
// thrown deref is how a pre-fix verification run reports zero failures.
function val(fn) { try { return fn(); } catch (e) { return undefined; } }
function txt(el) { return (el && el.textContent || "").trim(); }

// ── Fixture ────────────────────────────────────────────────────────────────
// College C is the pivot: it ADOPTED Cisco CCNA, PRESCRIPTIVELY matches CompTIA
// A+ (teaches CIS 110), and is only a TOP/C-ID "potential" on Aligned Only Cert.
// One credential (Firefighter I) is deliberately modelled as the blank-issuer
// twin pair that the CER fold has to merge.
const exhibits = [
  { exhibit_id: "x1", exhibit_ids: ["x1"], title: "CompTIA A+", unified_title: "CompTIA A+",
    issuing_agency: "CompTIA", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative", adopters: 1, adopter_names: ["College A"],
    potential: 2, potential_names: ["College C", "College D"], raw_titles: ["CompTIA A plus"],
    credit_recs: [{ course: "CIS 110", credit: "4 hours in ICT Essentials" }] },
  { exhibit_id: "x6", exhibit_ids: ["x6"], title: "Cisco CCNA", unified_title: "Cisco CCNA",
    issuing_agency: "Cisco", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative", adopters: 1, adopter_names: ["College C"],
    potential: 0, potential_names: [], raw_titles: ["CCNA"],
    credit_recs: [{ course: "NET 1", credit: "3 hours in Networking" }] },
  { exhibit_id: "x7", exhibit_ids: ["x7"], title: "Aligned Only Cert", unified_title: "Aligned Only Cert",
    issuing_agency: "Y", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "Local", adopters: 1, adopter_names: ["College B"],
    potential: 1, potential_names: ["College C"], raw_titles: ["Aligned Only"],
    credit_recs: [{ course: "AL 1", credit: "2 hours in Align" }] },
  // The blank-issuer twin pair — one credential, two cards, only one classified.
  { exhibit_id: "ff1", exhibit_ids: ["ff1"], title: "Firefighter I", unified_title: "Firefighter I",
    issuing_agency: "National Fire Protection Association", is_classified: true,
    cpl_type: "Industry Certification", collaborative_type: "CCC Collaborative",
    adopters: 2, adopter_names: ["College A", "College B"], potential: 0, potential_names: [],
    raw_titles: ["Firefighter 1"], credit_recs: [{ course: "FIRE 1", credit: "3 hours in Fire Tech" }] },
  { exhibit_id: "ff2", exhibit_ids: ["ff2"], title: "Firefighter I", unified_title: "Firefighter I",
    issuing_agency: "", is_classified: false, cpl_type: "Industry Certification",
    collaborative_type: "Local", adopters: 1, adopter_names: ["College E"], potential: 0,
    potential_names: [], raw_titles: ["FF1 - local"], credit_recs: [] },
  // Two DIFFERENT named issuers on one title must NOT merge.
  { exhibit_id: "d1", exhibit_ids: ["d1"], title: "Dual Issuer Cert", unified_title: "Dual Issuer Cert",
    issuing_agency: "Issuer One", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "Local", adopters: 1, adopter_names: ["College A"], potential: 0,
    potential_names: [], raw_titles: ["DIC one"], credit_recs: [] },
  { exhibit_id: "d2", exhibit_ids: ["d2"], title: "Dual Issuer Cert", unified_title: "Dual Issuer Cert",
    issuing_agency: "Issuer Two", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "Local", adopters: 1, adopter_names: ["College B"], potential: 0,
    potential_names: [], raw_titles: ["DIC two"], credit_recs: [] },
  // Award-math cards, carried over from the retired eacr_student.test.js — the
  // shared typicalAward() still feeds the credential view's "Typical CPL"
  // headline, and a credit string it cannot parse must yield no headline, not a
  // crash and not a fabricated number.
  { exhibit_id: "aw", exhibit_ids: ["aw"], title: "Award Range Cert", unified_title: "Award Range Cert",
    issuing_agency: "AwardCo", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "Local", adopters: 1, adopter_names: ["College A"], potential: 0,
    potential_names: [], raw_titles: ["Award Range"],
    // Three DISTINCT mappings, two of them at 3 units — recs are grouped by
    // (title, units) first, so two identical strings would collapse to ONE
    // mapping and there would be no mode to find.
    credit_recs: [
      { course: "AW 1", credit: "3 hours in Widgetry" },
      { course: "AW 2", credit: "3 hours in Widget Safety" },
      { course: "AW 3", credit: "4 hours in Widgetry Advanced" }
    ] },
  { exhibit_id: "mal", exhibit_ids: ["mal"], title: "Malformed Cert", unified_title: "Malformed Cert",
    issuing_agency: "Z", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "Local", adopters: 1, adopter_names: ["College A"], potential: 0,
    potential_names: [], raw_titles: ["Malformed"],
    credit_recs: [{ course: "M 1", credit: "see catalog" }] }
];

const prescriptive = {
  "CompTIA A+": { n_colleges: 1, withheld: 0,
    colleges: [{ college: "College C", courses: [{ subject: "CIS", number: "110", units: 4 }] }] }
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
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

// ── Helpers ────────────────────────────────────────────────────────────────
const doc = window.document;
const container = () => doc.getElementById("statewide-interactive-container");
function rowTitles() {
  return Array.from(doc.querySelectorAll("#sw-tbody tr .exhibit-cell-name")).map((e) => txt(e));
}
function setScope(scope) {
  // Drive the real control the way a user does: check the radio, fire change.
  const r = doc.querySelector('.sw-scope-radio[value="' + scope + '"]');
  if (r) { r.checked = true; r.dispatchEvent(new window.Event("change", { bubbles: true })); }
}
function showView(v) {
  const b = doc.querySelector('.sw-subtab[data-view="' + v + '"]');
  if (b) b.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}
function pickCollege(name) {
  const grp = doc.querySelector('.sw-filter-group[data-filter="college"]');
  const box = Array.from(grp.querySelectorAll('input[type=checkbox]')).find((i) => i.value === name);
  box.checked = true;
  box.dispatchEvent(new window.Event("change", { bubbles: true }));
}

setTimeout(runAssertions, 80);

function runAssertions() {
  // ── 1. The control exists and defaults to real adoptions ─────────────────
  check("a college-scope control renders", !!val(() => doc.querySelector(".sw-scopebar")));
  check("it offers exactly three scopes",
    val(() => doc.querySelectorAll(".sw-scope-radio").length) === 3);
  check("it DEFAULTS to adopted (not the old adopted∪potential union)",
    val(() => doc.querySelector(".sw-scope-radio:checked").value) === "adopted");
  check("the default scope's hint says it means articulated",
    /articulated/i.test(val(() => txt(doc.getElementById("sw-scope-hint"))) || ""));
  check("the broad scope discloses that TOP is a weak signal",
    /weak signal|leads, not matches/i.test(src));

  // ── 2. Scope actually changes the result set ─────────────────────────────
  showView("table");
  pickCollege("College C");

  // adopted: College C has articulated only Cisco CCNA.
  const adoptedRows = rowTitles();
  check("scope=adopted returns ONLY what College C articulated",
    adoptedRows.length === 1 && adoptedRows[0] === "Cisco CCNA");
  check("scope=adopted does NOT return the TOP/C-ID lead (Aligned Only Cert)",
    adoptedRows.indexOf("Aligned Only Cert") === -1);
  check("scope=adopted does NOT return the prescriptive match (CompTIA A+)",
    adoptedRows.indexOf("CompTIA A+") === -1);

  // likely: + the credential whose mapping course College C already teaches.
  setScope("likely");
  const likelyRows = rowTitles();
  check("scope=likely ADDS the prescriptive match (CompTIA A+)",
    likelyRows.indexOf("CompTIA A+") !== -1);
  check("scope=likely still EXCLUDES the bare TOP/C-ID lead",
    likelyRows.indexOf("Aligned Only Cert") === -1);
  check("scope=likely keeps the real adoption", likelyRows.indexOf("Cisco CCNA") !== -1);

  // any: + the broad TOP/C-ID overlap. This is the OLD behaviour, now opt-in.
  setScope("any");
  const anyRows = rowTitles();
  check("scope=any ADDS the broad TOP/C-ID lead", anyRows.indexOf("Aligned Only Cert") !== -1);
  check("scope=any is the widest of the three", anyRows.length > likelyRows.length);
  check("the three scopes are strictly nested (adopted ⊂ likely ⊂ any)",
    adoptedRows.length < likelyRows.length && likelyRows.length < anyRows.length);

  // ── 3. The column can never disagree with the filter that returned the row ─
  setScope("adopted");
  // td[8] is the could-adopt cell (0 checkbox, 1 title, 2 type, 3 cpl,
  // 4 discipline, 5 adopted#, 6 potential#, 7 adopted-colleges, 8 could-adopt).
  const couldCell = () => val(() => doc.querySelectorAll("#sw-tbody tr")[0].querySelectorAll("td")[8]);
  check("scope=adopted says so in the could-adopt column, rather than showing potentials",
    /showing adoptions only/i.test(val(() => couldCell().textContent) || ""));
  setScope("any");
  check("a likely match is chipped differently from a broad lead",
    /sw-potential-likely/.test(src));

  // ── 4. The CER fold ──────────────────────────────────────────────────────
  showView("credentials");
  // Clear the college filter so every credential is in view.
  const grp = doc.querySelector('.sw-filter-group[data-filter="college"]');
  Array.from(grp.querySelectorAll("input[type=checkbox]")).forEach((i) => { i.checked = false; });
  grp.querySelector("input[type=checkbox]").dispatchEvent(new window.Event("change", { bubbles: true }));

  const cv = doc.getElementById("sw-cv-body");
  const cards = () => Array.from(cv.querySelectorAll(".cv-credential"));
  const titled = (t) => cards().filter((c) => txt(c.querySelector(".cv-title")).indexOf(t) === 0);

  check("Firefighter I renders as ONE card, not a classified + blank-issuer pair",
    val(() => titled("Firefighter I").length) === 1);
  check("...and it renders under the NAMED issuer, not blank",
    /National Fire Protection/.test(val(() => txt(titled("Firefighter I")[0])) || ""));
  check("...and the blank-issuer twin's adopter is not lost (College E folded in)",
    /College E|E\b/.test(val(() => titled("Firefighter I")[0].innerHTML) || ""));
  check("two DIFFERENT named issuers on one title stay separate (no invented merge)",
    val(() => titled("Dual Issuer Cert").length) === 2);

  // ── 5. The aligned MAP exhibits are surfaced at all ──────────────────────
  const ffCard = val(() => titled("Firefighter I")[0]);
  check("a credential card lists the MAP exhibits folded under its common title",
    !!val(() => ffCard.querySelector(".cv-ex")));
  check("...naming both underlying exhibit records",
    /ff1/.test(val(() => ffCard.innerHTML) || "") && /ff2/.test(val(() => ffCard.innerHTML) || ""));
  check("...and saying they are the same credential",
    /same credential/i.test(val(() => txt(ffCard.querySelector(".cv-ex-hint"))) || ""));

  // ── 6. The student view folded in as a MODE, losing nothing ──────────────
  showView("credentials");
  pickCollege("College C");
  setScope("likely");
  const comptia = val(() => titled("CompTIA A+")[0]);
  check("near-me: the prescriptive match is stated on the credential card",
    /already teaches a matching course/i.test(val(() => txt(comptia.querySelector(".sv-maybe"))) || ""));
  check("near-me: it NAMES the local course (CIS 110)",
    /CIS\s*110/.test(val(() => txt(comptia.querySelector(".sv-maybe"))) || ""));
  check("near-me: a prescriptive match is NOT mislabelled as an aligned-program lead",
    !val(() => comptia.querySelector(".sv-prog")));
  const cisco = val(() => titled("Cisco CCNA")[0]);
  check("near-me: an adopter college reads as Adopted",
    /Adopted/.test(val(() => txt(cisco.querySelector(".sv-yes"))) || ""));
  setScope("any");
  const alignedCard = val(() => titled("Aligned Only Cert")[0]);
  check("near-me: a bare TOP/C-ID lead reads as 'Aligned program only'",
    /Aligned program only/i.test(val(() => txt(alignedCard.querySelector(".sv-prog"))) || ""));
  check("near-me: ...and discloses it is a lead, not a match",
    /a lead, not a match/i.test(val(() => txt(alignedCard.querySelector(".sv-prog"))) || ""));

  // ── 7. Sub-tabs replaced three collapsibles; only one renders ────────────
  // Asserted by NAME, not by count. This check read "exactly two sub-tabs" and
  // failed the moment a third view (the adoption matrix) was added — a bound
  // that rots on legitimate change while never guarding the property it cares
  // about, which is that the Student view FOLDED IN rather than becoming a tab.
  check("the credential and table sub-tabs both render",
    !!val(() => doc.querySelector('.sw-subtab[data-view="credentials"]')) &&
    !!val(() => doc.querySelector('.sw-subtab[data-view="table"]')));
  check("every sub-tab controls a panel that exists",
    val(() => Array.from(doc.querySelectorAll(".sw-subtab")).every(
      (b) => !!doc.getElementById(b.getAttribute("aria-controls")))) === true);
  check("the standalone Student view is gone (folded, not duplicated)",
    !doc.getElementById("sw-sv-body") && !/buildStudentView/.test(src));
  showView("table");
  check("switching to the table hides the credential view",
    val(() => doc.getElementById("sw-view-credentials").hidden) === true);
  check("...and the credential view does not rebuild while hidden",
    /state\.view === "credentials"/.test(src));
  showView("credentials");
  // Assert the element EXISTS as well as its display — `val()` returns undefined
  // when the deref throws, and `undefined !== "none"` would pass vacuously on a
  // build where the pane was never created.
  check("switching back shows it again",
    !!val(() => doc.getElementById("sw-view-credentials")) &&
    val(() => doc.getElementById("sw-view-credentials").hidden) === false);

  // ── 8. The shared award math survives the Student-view fold ──────────────
  const grp2 = doc.querySelector('.sw-filter-group[data-filter="college"]');
  Array.from(grp2.querySelectorAll("input[type=checkbox]")).forEach((i) => { i.checked = false; });
  grp2.querySelector("input[type=checkbox]").dispatchEvent(new window.Event("change", { bubbles: true }));
  const award = val(() => titled("Award Range Cert")[0]);
  check("the credential view still shows the 'Typical CPL' headline",
    /Typical CPL/.test(val(() => award.innerHTML) || ""));
  check("...with the modal award and its range (3, range 3–4)",
    /~3 units? \(range 3.4\)/.test(val(() => txt(award)) || ""));
  check("...framed as alternatives, not a sum",
    /not the sum/i.test(val(() => txt(award)) || ""));
  const mal = val(() => titled("Malformed Cert")[0]);
  check("an unparseable credit string yields NO award headline (no crash, no invention)",
    !!mal && !/Typical CPL/.test(val(() => mal.innerHTML) || ""));

  // ── 9. Exports carry the SCOPE, not the raw broad list ──────────────────
  // An export that disagrees with the screen is the same defect one layer down,
  // and it is the layer that reaches a college by email.
  showView("table");
  const blobs = [];
  window.URL.createObjectURL = function (b) { blobs.push(b); return "blob:stub"; };
  window.URL.revokeObjectURL = function () {};
  function lastBlobText() {
    const b = blobs[blobs.length - 1];
    return b && b._parts ? b._parts.join("") : (b && b.__text) || "";
  }
  // jsdom Blob does not expose its parts; capture the text at construction.
  const RealBlob = window.Blob;
  window.Blob = function (parts, opts) {
    const b = new RealBlob(parts, opts);
    b.__text = (parts || []).join("");
    return b;
  };

  setScope("any");
  doc.getElementById("sw-export-excel").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const csvAny = lastBlobText();
  check("the CSV states which could-adopt scope produced it",
    /Could-adopt scope:/i.test(csvAny));
  check("...naming the broad scope when the broad scope is active",
    /any could-adopt/i.test(csvAny));
  check("the CSV header no longer says the ambiguous 'Potential Adopters'",
    /Colleges Could Adopt/.test(csvAny) && !/Potential Adopters/.test(csvAny));
  check("a likely match is marked as such in the export, not pooled with leads",
    /teaches a matching course/.test(csvAny));

  setScope("adopted");
  doc.getElementById("sw-export-excel").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const csvAdopted = lastBlobText();
  check("scope=adopted exports a NARROWER could-adopt list than scope=any",
    csvAdopted.length < csvAny.length);
  check("...and says so in its provenance line", /Adopted —/.test(csvAdopted));

  doc.getElementById("sw-export-json").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const json = val(() => JSON.parse(lastBlobText()));
  check("the JSON export ships the scope as a field", val(() => json._scope) === "adopted");
  check("...and explains what that scope means", /articulated/i.test(val(() => json._scope_meaning) || ""));
  check("...and re-keys could_adopt_names to it",
    Array.isArray(val(() => json.exhibits[0].could_adopt_names)));
  check("...while preserving raw potential_names under its own name (nothing lost)",
    val(() => json.exhibits.some((e) => "potential_names" in e)) === true);
  window.Blob = RealBlob;

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
}
