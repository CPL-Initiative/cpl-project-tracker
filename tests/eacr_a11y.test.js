// EACR accessibility + mobile (2026-08-16 — Sam: "make sure everything is
// accessible and mobile friendly").
//
// Written after the sub-tab / scope rework, and it found real defects in what
// had just shipped:
//
//  1. A PARTIAL ARIA tab pattern. `role="tablist"` + `role="tab"` were set with
//     no aria-selected, no aria-controls, no tabpanel and no arrow keys — so
//     a screen reader announced "tab, 1 of 2" and then the interactions it
//     promised did not exist. A half-implemented pattern is worse than none.
//  2. COLOUR-ONLY meaning. A likely could-adopt match was distinguished from a
//     broad TOP/C-ID lead by an outline colour alone (WCAG 1.4.1). To a
//     colour-blind or forced-colours user it was one undifferentiated list.
//  3. The scope control was styled <button>s with no selected state exposed at
//     all — a screen-reader user could not tell which of the three was active.
//     Now native radios in a fieldset: arrow keys, "2 of 3 selected", and the
//     focus ring all come for free and cannot be subtly mis-wired.
//  4. "+N more" was a mouse-only span AND had never worked: the handler wrote
//     state.expanded[eid + "_pot"] while the renderer read state.expanded[eid].
//  5. The tab shipped with NO responsive rules. The filter dropdowns are
//     position:absolute, min-width:220px, anchored to a ~90px button — on a
//     phone they opened off-screen.
//
// Run from repo root: `npm test` (or `node tests/eacr_a11y.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function val(fn) { try { return fn(); } catch (e) { return undefined; } }

const exhibits = [
  { exhibit_id: "x1", exhibit_ids: ["x1"], title: "CompTIA A+", unified_title: "CompTIA A+",
    issuing_agency: "CompTIA", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative", adopters: 1, adopter_names: ["College A"],
    potential: 14, potential_names: ["College B","College C","College D","College E","College F",
      "College G","College H","College I","College J","College K","College L","College M",
      "College N","College O"],
    raw_titles: ["CompTIA A plus"], credit_recs: [{ course: "CIS 110", credit: "4 hours in ICT" }] }
];
const prescriptive = {
  "CompTIA A+": { n_colleges: 1, withheld: 0,
    colleges: [{ college: "College B", courses: [{ subject: "CIS", number: "110", units: 4 }] }] }
};
const lookup = {};
["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"].forEach(function (k) {
  lookup["College " + k] = { district: "D1", swRegion: "R1" };
});

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
try { window.eval(src); } catch (e) { console.error("init threw:", e); }

const doc = window.document;
// DRIVERS MUST BE NULL-SAFE. On the pre-fix source `more()` was null and the
// bare dispatchEvent threw, killing the run after ZERO checks had printed — a
// verification pass that reports nothing is indistinguishable from one that
// passes. This is the "check that never registers can never fail" trap, and it
// has now bitten three harnesses in this repo. A missing element must fail its
// own check, never take the file down.
function key(el, k) {
  if (!el || !el.dispatchEvent) return false;
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  return true;
}
function click(el) {
  if (!el || !el.dispatchEvent) return false;
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  return true;
}
function focus(el) { if (el && el.focus) el.focus(); }
function setScope(scope) {
  const r = doc.querySelector('.sw-scope-radio[value="' + scope + '"]');
  if (r) { r.checked = true; r.dispatchEvent(new window.Event("change", { bubbles: true })); }
}

setTimeout(function () {
  try { run(); }
  catch (e) {
    check("the harness ran to completion (it threw: " + e.message + ")", false);
    report();
  }
}, 80);

function run() {
  // ── 1. The tab pattern is COMPLETE, not half-declared ────────────────────
  const tabs = () => Array.from(doc.querySelectorAll(".sw-subtab"));
  check("tablist carries an accessible name",
    !!val(() => doc.querySelector('[role="tablist"]').getAttribute("aria-label")));
  check("every tab declares aria-selected",
    val(() => tabs().every((t) => t.hasAttribute("aria-selected"))));
  check("exactly one tab is aria-selected=true",
    val(() => tabs().filter((t) => t.getAttribute("aria-selected") === "true").length) === 1);
  check("every tab points at its panel via aria-controls",
    val(() => tabs().every((t) => !!doc.getElementById(t.getAttribute("aria-controls")))));
  check("each panel is a tabpanel labelled by its tab",
    val(() => tabs().every((t) => {
      const p = doc.getElementById(t.getAttribute("aria-controls"));
      return p.getAttribute("role") === "tabpanel" && p.getAttribute("aria-labelledby") === t.id;
    })));
  check("roving tabindex: only the selected tab is in the tab order",
    val(() => tabs().filter((t) => t.getAttribute("tabindex") === "0").length) === 1);
  check("tabs are type=button (they must not submit anything)",
    val(() => tabs().every((t) => t.getAttribute("type") === "button")));
  check("the hidden panel uses [hidden], so it leaves the a11y tree",
    val(() => doc.getElementById("sw-view-table").hidden) === true);

  // Arrow keys — the half of the pattern that was missing entirely.
  const first = tabs()[0];
  focus(first);
  check("there are tabs to navigate", !!first);
  key(first, "ArrowRight");
  check("ArrowRight moves to (and activates) the next tab",
    val(() => tabs()[1].getAttribute("aria-selected")) === "true");
  // Wrap is only observable from the LAST tab. This drove ArrowRight from
  // tabs()[1] and expected tabs()[0], which is only "wrapping" when the bar has
  // exactly two tabs — so adding a third turned a wrap test into a next test
  // that then failed. Jump to the end first and the check stays true for any
  // number of tabs.
  key(tabs()[1], "End");
  check("End jumps to the last tab",
    val(() => tabs()[tabs().length - 1].getAttribute("aria-selected")) === "true");
  key(tabs()[tabs().length - 1], "ArrowRight");
  check("ArrowRight wraps around to the first tab",
    val(() => tabs()[0].getAttribute("aria-selected")) === "true");
  key(tabs()[0], "ArrowLeft");
  check("ArrowLeft wraps backwards to the last tab",
    val(() => tabs()[tabs().length - 1].getAttribute("aria-selected")) === "true");
  key(tabs()[tabs().length - 1], "Home");
  check("Home jumps to the first tab",
    val(() => tabs()[0].getAttribute("aria-selected")) === "true");
  const before = val(() => doc.querySelector(".sw-subtab.on").getAttribute("data-view"));
  key(tabs()[0], "ArrowDown");
  check("an unhandled key does not steal the tab",
    val(() => doc.querySelector(".sw-subtab.on").getAttribute("data-view")) === before);

  // ── 2. The scope control is a real radiogroup ────────────────────────────
  check("the scope control is a fieldset (grouped for AT)",
    val(() => doc.querySelector(".sw-scopebar").tagName) === "FIELDSET");
  check("...with a legend naming the group",
    /College filter matches/.test(val(() => doc.querySelector(".sw-scopebar legend").textContent) || ""));
  check("the options are native radios, not styled buttons",
    val(() => doc.querySelectorAll('.sw-scope-radio[type="radio"]').length) === 3);
  check("...sharing one name, so they are one exclusive group",
    val(() => new Set(Array.from(doc.querySelectorAll(".sw-scope-radio"))
      .map((r) => r.name)).size) === 1);
  check("every radio has a label bound by for/id (clickable + announced)",
    val(() => Array.from(doc.querySelectorAll(".sw-scope-radio"))
      .every((r) => !!doc.querySelector('label[for="' + r.id + '"]'))));
  check("the radios stay focusable (opacity, never display:none)",
    /\.sw-scope-radio\{[^}]*opacity:0/.test(src) && !/\.sw-scope-radio\{[^}]*display:none/.test(src));
  check("the scope hint is a live region, so a change is ANNOUNCED",
    val(() => doc.getElementById("sw-scope-hint").getAttribute("aria-live")) === "polite");
  setScope("any");
  check("...and its text actually updates on change",
    /TOP is a weak signal|leads, not matches/i.test(
      val(() => doc.getElementById("sw-scope-hint").textContent) || ""));

  // ── 3. Meaning is never carried by colour alone (WCAG 1.4.1) ─────────────
  check("the adoption-table tab exists to switch to",
    click(doc.querySelector('.sw-subtab[data-view="table"]')));
  setScope("any");
  const couldCell = () => val(() => doc.querySelectorAll("#sw-tbody tr")[0].querySelectorAll("td")[8]);
  check("could-adopt splits into TEXT-LABELLED groups, not one colour-coded list",
    val(() => couldCell().querySelectorAll(".sw-could-label").length) >= 2);
  check("...the likely group says so in words",
    /Already teaches a matching course/i.test(val(() => couldCell().textContent) || ""));
  check("...and the broad group names itself a lead, in words",
    /Same TOP code or C-ID \(a lead\)/i.test(val(() => couldCell().textContent) || ""));
  check("the selected scope pill is not signalled by background-colour alone",
    /\.sw-scope-radio:checked \+ \.sw-scope-btn\{[^}]*box-shadow/.test(src));
  check("forced-colours keeps the selected/active distinction",
    /@media \(forced-colors: active\)/.test(src));

  // ── 4. "+N more" works, and works from the keyboard ──────────────────────
  const more = () => val(() => couldCell().querySelector(".sw-show-more"));
  check("a long college list offers a '+N more' control", !!more());
  check("...exposed as a button to AT", val(() => more().getAttribute("role")) === "button");
  check("...and reachable by keyboard", val(() => more().getAttribute("tabindex")) === "0");
  const beforeChips = val(() => couldCell().querySelectorAll("abbr").length);
  check("'+N more' can be activated at all (driver reached it)", key(more(), "Enter"));
  const afterChips = val(() => couldCell().querySelectorAll("abbr").length);
  check("pressing Enter on '+N more' ACTUALLY expands the list",
    typeof beforeChips === "number" && typeof afterChips === "number" && afterChips > beforeChips);
  check("...and the expanded key matches the one the renderer reads",
    /state\.expanded\[eid \+ "_pot"\]/.test(src));

  // ── 5. College chips expose the full name, not just a tooltip ────────────
  check("chips are <abbr>, the element AT expands (a <span> title is not read)",
    val(() => couldCell().querySelector("abbr").tagName) === "ABBR");
  check("...carrying the full college name",
    /College /.test(val(() => couldCell().querySelector("abbr").getAttribute("title")) || ""));

  // ── 6. The scrollable table is announced and keyboard-scrollable ─────────
  const wrap = doc.getElementById("sw-table-wrap");
  check("the scroll container is a labelled region",
    val(() => wrap.getAttribute("role")) === "region" && !!val(() => wrap.getAttribute("aria-label")));
  check("...and is focusable, so it can be scrolled without a mouse",
    val(() => wrap.getAttribute("tabindex")) === "0");
  check("a narrow-screen hint says the table scrolls sideways",
    !!val(() => doc.querySelector(".sw-table-hint")));

  // ── 7. Mobile CSS exists at all ──────────────────────────────────────────
  check("the tab ships a mobile breakpoint", /@media \(max-width: 640px\)/.test(src));
  check("dropdowns re-anchor to the filter BAR so they cannot open off-screen",
    /\.sw-filter-group\{position:static;\}/.test(src) && /\.sw-filter-dropdown\{left:0\.6rem;right:0\.6rem/.test(src));
  check("touch targets reach at least 40px on small screens",
    (src.match(/min-height:4[04]px/g) || []).length >= 4);
  check("reduced-motion is honoured for the disclosure animations",
    /@media \(prefers-reduced-motion: reduce\)/.test(src));
  check("focus is visible on every new control",
    /\.sw-subtabs button:focus-visible/.test(src) &&
    /\.sw-scope-radio:focus-visible \+ \.sw-scope-btn/.test(src) &&
    /\.sw-show-more:focus-visible/.test(src));

  report();
}

// Even with null-safe drivers, an unforeseen throw must SHOW UP as a failure
// with the collected results, never as silence.
function report() {
  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
}
