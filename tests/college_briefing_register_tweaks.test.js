// The occupation register's three narrowing tweaks — jsdom test.
// SkyLedger (Session 269), 2026-09-17.
//
// Sam reviewed the register the morning after it shipped and asked for three
// changes, verbatim:
//
//   1. No need to list items where the college has no aligned course or program
//   2. Need to list the MAP exhibit CER names above any of the aligned credit
//      recommendations and note any that are Statewide exhibits/CRs
//   3. Add a CIP Sector filter rather than the numbered P chips — I think the
//      page chips may not be needed once you get rid of all the non-aligned items
//
// What is guarded here:
//
//  (1) ⭐ THE DROPPED ROWS ARE STILL NAMED, IN THREE SEPARATE DRAWERS. Dropping
//      80% of the payload is the easy half; the failure is reporting "nothing
//      here" about an occupation that has a statewide credit recommendation
//      ready to adopt. The three buckets mean three different things and one
//      heading would misreport two of them.
//  (2) ⭐ THE CER NAME HEADS ITS CREDIT RECOMMENDATIONS, and a statewide exhibit
//      SAYS SO. Before this the row showed that an exhibit matched and never
//      what credit it grants.
//  (2b) ⭐ A DATA FILE WITHOUT `exhibit_detail` STILL PAINTS ITS EXHIBITS. The
//      field arrived 2026-09-17; rendering nothing for an older file would
//      report "no credit recommendations" about an occupation that has them —
//      the same false-absence failure the whole tab is built against.
//  (3) ⭐ THE CIP SECTOR FILTER EXISTS, OFFERS ONLY SECTORS PRESENT, AND ITS
//      TOKEN TEST IS EXACT. `data-cip` is a space-delimited SET, so a substring
//      test would file "4" against sector "47" and quietly show the wrong rows.
//  (3b) ⭐ NO FILTER CONTROL IS A BARE TIER NUMBER. The ask was words.
//
// Run from repo root: `npm test`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function load() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="college-briefing-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" }
  );
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function () { return new Promise(function () {}); };
  [ "team_phrase.js", "college_briefing.js" ].forEach(function (f) {
    const s = w.document.createElement("script");
    s.textContent = fs.readFileSync(f, "utf8");
    w.document.body.appendChild(s);
  });
  return w;
}

const win = load();
const M = win.CPL_COLLEGE_BRIEFING;
check("module exports on window", !!M);
check("exposes the CER block builder", typeof M._cerBlock === "function");
check("exposes the drawer builder", typeof M._oppDrawer === "function");

// ── Fixture. Two sectors so the filter has something to exclude, and a row with
// no CIP at all so the "No CIP assigned yet" bucket is real. ──
const OPPS = {
  meta: {
    region: "the Bay Region",
    colleges: ["Covered College"],
    priority_labels: {
      P1: "Adopt now — you teach it, the exhibit exists, you are not on it",
      P2: "Build first-in-state — you teach it, no exhibit exists anywhere"
    },
    // ⭐ 47 and 4 both present ON PURPOSE: 4 is a prefix of 47, which is exactly
    // what a substring filter gets wrong.
    cip_sector_labels: { "47": "Mechanic and Repair Technologies", "4": "Architecture" },
    accuracy: { rulings: 139, precision: "about nine in ten", recall: "roughly half",
                scored_at: "San Joaquin Delta College" }
  },
  colleges: {
    "Covered College": {
      summary: {},
      rows: [
        { occupation: "Welder", priority: "P1", fit: "confirmed", exhibit_status: "exists",
          programs: ["Welding Technology (A.S.)"], courses: ["WELD 80 — Welding"],
          program_evidence: "welding", cip_sectors: ["47"],
          exhibits: ["Certified Welder"],
          exhibit_detail: [
            { cer: "Certified Welder", statewide: true, adopted: false,
              recs: [{ course: "WELD 80", credit: "3 hours in Construction Welding" }] },
            { cer: "Local Welding Badge", statewide: false, adopted: true, recs: [] }
          ] },
        { occupation: "Drafter", priority: "P1", fit: "confirmed", exhibit_status: "exists",
          programs: ["Architectural Drafting"], courses: ["ARCH 10 — Drafting"],
          program_evidence: "drafting", cip_sectors: ["4"],
          exhibits: ["Drafting Certificate"],
          exhibit_detail: [{ cer: "Drafting Certificate", statewide: false, adopted: false,
                             recs: [{ course: "ARCH 10", credit: "2 hours in Drafting" }] }] },
        // No CIP at all — the build-first-in-state tier has no exhibit and its
        // programs carry no CIP, which is a real bucket rather than an error.
        { occupation: "Drone Operator", priority: "P2", fit: "confirmed", exhibit_status: "nowhere",
          programs: ["UAS Operations"], courses: [], program_evidence: "drone" }
      ],
      not_teaching: ["Radiologic Technologist", "Dental Hygienist"],
      adopted_no_program: ["Emergency Medical Technician"],
      unmatched: ["Actuary"]
    }
  }
};

function body(cip, filter) {
  return M._oppsBodyFor(OPPS, "Covered College", "ready", filter || [], cip || "");
}

function dom(html) {
  return new JSDOM("<!doctype html><body>" + html + "</body>").window.document;
}

// ── (1) the three drawers ──
{
  const d = dom(body());
  const sums = Array.prototype.map.call(d.querySelectorAll("details.cb-strat > summary"),
    function (s) { return s.textContent; });
  check("(1) ⭐ three separate drawers for what is not listed", sums.length === 3,
    "one heading over three different facts misreports two of them");
  check("(1) the not-teaching drawer names its count and its meaning",
    sums.some(function (t) { return /^2 occupations with a credit recommendation this college does not teach toward/.test(t); }));
  check("(1) the already-on-the-exhibit drawer is its own",
    sums.some(function (t) { return /already on the exhibit for, with no program found/.test(t); }));
  check("(1) the nothing-anywhere drawer survives",
    sums.some(function (t) { return /no program and no credit recommendation found/.test(t); }));

  const txt = d.body.textContent;
  check("(1) ⭐ the dropped occupations are NAMED, not just counted",
    /Radiologic Technologist/.test(txt) && /Dental Hygienist/.test(txt)
      && /Emergency Medical Technician/.test(txt) && /Actuary/.test(txt),
    "recall is about half, so a name is what lets the room correct us");
  check("(1) …and none of them is rendered as a register row",
    d.querySelectorAll(".cb-opp").length === 3);

  // A college with an empty bucket gets no drawer rather than an open question
  // with nothing under it.
  check("(1) an empty bucket renders no drawer at all", M._oppDrawer([], "x", "y") === "");
  check("(1) control: a non-empty bucket does render one",
    /<details/.test(M._oppDrawer(["A"], "things", "note")));
}

// ── (2) the CER heads its credit recommendations ──
{
  const d = dom(body());
  const row = d.querySelectorAll(".cb-opp")[0];
  const cer = row.querySelector(".cb-cer .cb-cer-n");
  check("(2) ⭐ the CER name is a heading of its own", !!cer && /Certified Welder/.test(cer.textContent));

  const recs = row.querySelectorAll(".cb-cer .cb-recs li");
  check("(2) ⭐ the credit recommendation hangs UNDER its CER", recs.length === 1);
  check("(2) …and it says the course AND the credit",
    /WELD 80/.test(recs[0].textContent) && /3 hours in Construction Welding/.test(recs[0].textContent),
    "the flat list said only THAT an exhibit matched, never what credit it grants");

  /* ⭐ Order is the whole ask: "above any of the aligned credit recommendations".
   * ⚠ Scoped to the CER block on purpose. Against the whole row this passes for
   * the wrong reason and fails for the wrong reason both: "WELD 80" is also a
   * course chip in the FIRST column, so a row-wide indexOf compares the heading
   * against a string that has nothing to do with it. */
  const cerHtml = row.querySelector(".cb-cer").innerHTML;
  check("(2) ⭐ the CER name comes BEFORE its credit recommendations in the DOM",
    cerHtml.indexOf("Certified Welder") < cerHtml.indexOf("WELD 80")
      && cerHtml.indexOf("Certified Welder") >= 0 && cerHtml.indexOf("WELD 80") > 0);

  const tags = row.querySelectorAll(".cb-cer .cb-tag");
  check("(2) ⭐ the statewide exhibit is marked, as a WORD",
    Array.prototype.some.call(tags, function (t) { return t.textContent === "Statewide"; }));
  check("(2) …and the local one is not",
    row.querySelectorAll(".cb-tag.sw").length === 1,
    "marking everything statewide is the same as marking nothing");
  check("(2) an exhibit this college already holds says so",
    row.querySelectorAll(".cb-tag.on").length === 1);
  check("(2) a CER with no credit recommendation says that rather than rendering blank",
    /No credit recommendation recorded on this exhibit/.test(row.textContent));
  check("(2) the credit text is reachable by the search box",
    /construction welding/.test(row.getAttribute("data-q") || ""),
    "a coordinator searches for the course they already teach");
}

// ── (2b) an older data file still paints its exhibits ──
{
  const flat = M._cerBlock({ exhibits: ["Certified Welder", "Local Badge"] });
  check("(2b) ⭐ a row with no exhibit_detail falls back to the flat CER list",
    /Certified Welder/.test(flat) && /Local Badge/.test(flat),
    "rendering nothing would report 'no credit recommendations' about an occupation that has them");
  check("(2b) a row with neither says 'None recorded'",
    /None recorded/.test(M._cerBlock({})));
}

// ── (3) the CIP Sector filter ──
{
  const d = dom(body());
  const sel = d.querySelector("select.cb-opp-cipsel");
  check("(3) ⭐ a CIP Sector filter is offered", !!sel);
  check("(3) …labelled with Sam's word for the level",
    /CIP Sector/.test(d.querySelector(".cb-opp-cip").textContent));

  const vals = Array.prototype.map.call(sel.options, function (o) { return o.value; });
  check("(3) ⭐ it offers ONLY the sectors present, plus every-sector and no-CIP",
    vals.length === 4 && vals.indexOf("47") >= 0 && vals.indexOf("4") >= 0
      && vals.indexOf("") >= 0 && vals.indexOf("none") >= 0,
    "a control offering a choice that yields nothing reads as broken");
  check("(3) each option carries its family name and its count",
    /47 — Mechanic and Repair Technologies \(1\)/.test(sel.textContent));
  check("(3) the no-CIP bucket uses cip_crosswalk.js's own wording",
    /No CIP assigned yet/.test(sel.textContent));
  check("(3) a chosen sector is the selected option after a re-render",
    dom(body("47")).querySelector("select.cb-opp-cipsel").value === "47");

  // ⭐ The token test. Sector "4" must not match a row whose data-cip is "47".
  const rows = d.querySelectorAll(".cb-opp");
  const cips = Array.prototype.map.call(rows, function (r) { return r.getAttribute("data-cip"); });
  check("(3) every row carries its sectors in data-cip",
    cips[0] === "47" && cips[1] === "4");
  check("(3) ⭐ a row with no CIP carries the 'none' sentinel, never an empty string",
    cips[2] === "none",
    "an empty attribute is indistinguishable from a row the filter should skip");
}

// ── (3) the filter actually filters, through the real DOM path ──
{
  const w = load();
  const MM = w.CPL_COLLEGE_BRIEFING;
  const root = w.document.getElementById("college-briefing-root");
  root.innerHTML = MM._oppsBodyFor(OPPS, "Covered College", "ready", [], "");
  MM._state.oppsCip = "";
  MM._wireOpps(root);
  const sel = root.querySelector("select.cb-opp-cipsel");
  const rows = Array.prototype.slice.call(root.querySelectorAll(".cb-opp"));
  check("(3) all three rows are visible before any narrowing",
    rows.filter(function (r) { return !r.hidden; }).length === 3);

  sel.value = "4";
  sel.onchange();
  const shown = rows.filter(function (r) { return !r.hidden; });
  check("(3) ⭐ choosing sector 4 shows ONLY the sector-4 row, never sector 47's",
    shown.length === 1 && /Drafter/.test(shown[0].textContent),
    "a bare substring test files 4 against 47 and shows the wrong college the wrong work");

  sel.value = "none";
  sel.onchange();
  const none = rows.filter(function (r) { return !r.hidden; });
  check("(3) the no-CIP bucket selects the rows that have no sector",
    none.length === 1 && /Drone Operator/.test(none[0].textContent));

  sel.value = "";
  sel.onchange();
  check("(3) clearing it restores every row",
    rows.filter(function (r) { return !r.hidden; }).length === 3);
}

// ── (3b) no control is a bare tier number ──
{
  const d = dom(body());
  const fs_ = Array.prototype.map.call(d.querySelectorAll(".cb-opp-f"),
    function (b) { return b.textContent.trim(); });
  check("(3b) ⭐ no filter button is a bare P-number", !fs_.some(function (t) { return /^P\d\b/.test(t); }),
    "Sam: 'a CIP Sector filter rather than the numbered P chips'");
  check("(3b) the action tiers are offered as WORDS",
    fs_.some(function (t) { return /^Adopt now \d/.test(t); })
      && fs_.some(function (t) { return /^Build first-in-state \d/.test(t); }));
  check("(3b) the All button still resets", fs_.some(function (t) { return /^All 3$/.test(t); }));
  // The card's own tier pill keeps its code — it is a marker with the full
  // sentence in its title, not a control the reader must decode to use.
  check("(3b) the card pill still carries the tier code for scanning",
    d.querySelector(".cb-opp .cb-opp-t").textContent.trim() === "P1");
}

/* ── (4) ⛔ NO REGISTER RULE LEANS ON AN UNDEFINED TOKEN ──────────────────────
 * COBI defines `--brand`, `--text` and `--link` NOWHERE, deliberately: both
 * HTMLs carry a phantom-token block that names them and says why they are left
 * out. A rule written as `background:var(--brand)` is therefore invalid at
 * computed-value time and paints NOTHING — which is how the register shipped
 * with its default-pressed "All N" chip rendering `--on-accent` WHITE ON THE
 * PAGE at 1.06:1, measured in Chromium on 2026-09-17. It looked like a styled
 * control in the source and was invisible on screen.
 *
 * jsdom cannot paint, so this asserts the only thing it can see and the only
 * thing that actually went wrong: every use inside the register's own CSS
 * carries a FALLBACK to a token COBI really defines. */
{
  const css = fs.readFileSync("college_briefing.js", "utf8");
  const start = css.indexOf("function ensureCss()");
  const block = css.slice(css.indexOf(".cb-opp-tools{", start),
                          css.indexOf("].join(", start));
  check("(4) the register CSS block was located", block.length > 500);
  // Only the CSS strings themselves — this file's own comments quote
  // `var(--brand)` while explaining why it must not be used, and a guard that
  // trips on its own rationale gets deleted rather than obeyed.
  const rules = block.split("\n").filter(function (l) { return /^\s*"/.test(l); }).join("\n");
  const bare = (rules.match(/var\(--(?:brand|text|link)\)/g) || []);
  check("(4) ⛔ no register rule uses var(--brand|--text|--link) with NO fallback",
    bare.length === 0,
    "COBI defines none of them, so the declaration is dropped and paints nothing — "
      + "found: " + bare.join(", "));
  // …and the fallbacks point at tokens that exist in BOTH themes, so the repair
  // needs no dark-mode rule of its own.
  check("(4) the pressed filter chip falls back to --cobalt (defined in both themes)",
    /aria-pressed=true\]\{background:var\(--brand,var\(--cobalt\)\)/.test(block));
  check("(4) the statewide badge falls back to --cobalt",
    /\.cb-tag\.sw\{[^}]*color:var\(--brand,var\(--cobalt\)\)/.test(block));
  check("(4) the already-on-it badge falls back to --green-progress",
    /\.cb-tag\.on\{[^}]*color:var\(--cpl-green,var\(--green-progress\)\)/.test(block));
  /* ⚠ AND NO TINTED GROUND UNDER THE STATEWIDE BADGE: `--brand-soft` is the
   * cobalt at .22, which in dark lifts the ground toward the text color sitting
   * on it — 4.34:1, under AA. Measured, not guessed. */
  check("(4) ⭐ the statewide badge paints on no tinted ground",
    !/\.cb-tag\.sw\{[^}]*--brand-soft/.test(block),
    "the tint measures 4.34:1 in dark, under the 4.5 AA floor");
}

let failed = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name + (ok || !why ? "" : "  — " + why));
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
