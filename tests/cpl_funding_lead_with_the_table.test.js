// CPL Implementation Funding — lead with the table (Sam, 2026-09-02).
//
// Session 221's brief, in his words: move the institution table "up just
// after the intro section, so folks don't have to scroll down through the
// steps to see it — most won't care about the details, just their funding";
// "collapse all sections on open except the intro and college table view";
// move the Summary "into the same box as the intro text"; make every priority
// box "the narrower width as is used for the 1st 2 priorities"; drop the
// card's "Combined funding" line; and carry the timing and the strategies to
// the explainer, which is now the public view.
//
// What this guards, and why each needs a guard rather than a look:
//   1. ORDER. The college section is the first fold after the introduction.
//      A section order is one line of one function and the easiest thing to
//      "tidy" back.
//   2. PER-VISIT FOLDS. A section opened last week must not be open today.
//      The old per-browser store is the one thing a screenshot can never
//      show, so the guard seeds it and boots.
//   3. THE SUMMARY IN THE INTRODUCTION, which is open on every visit (R11's
//      requirement, re-aimed): the readout is never hidden on open.
//   4. THE CARDS. A fixed two-column pair in the injected CSS, and no
//      restating line on any Year-1 card — while every figure it carried is
//      still on the card and its band.
//   5. THE FOOTNOTE travels with the table it explains.
//   6. THE API the explainer paints from — _timing() and _prios().strategies
//      read the curator's layers — and EMBED mode renders the table alone,
//      publicly, with the drill-in still working.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_lead_with_the_table.test.js`).
const { check, freshDom, boot, click, finish, footText } = require("./lib/cpl_funding_harness.js");

function cssText(doc) {
  return Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n");
}
function storageKeys(window) {
  const out = [];
  for (let i = 0; i < window.localStorage.length; i++) out.push(window.localStorage.key(i));
  return out;
}

// ── 1–3, 5: order, the Summary, the defaults, the footnote ───────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const secs = Array.from(doc.querySelectorAll("#cplFundingMount details.cplfund-sec"));
  const ids = secs.map((s) => s.getAttribute("data-sec"));
  check("L1: the introduction opens the tab and the institution table is the very next section",
    ids[0] === "about" && ids[1] === "college");
  check("L1: ...and the model's mechanics follow the table, in their standing order",
    ids.slice(2).join(">") === "window>pools>formula>eligibility>priorities>timing");
  check("L2: on open, only the introduction and the table are open",
    secs.length >= 8 &&
    secs.every((s) => s.open === (["about", "college"].indexOf(s.getAttribute("data-sec")) >= 0)));
  const sum = doc.querySelector(".cplfund-summary");
  const about = doc.querySelector('details.cplfund-sec[data-sec="about"]');
  check("L3: the Summary sits inside the introduction's box, after the introduction's prose",
    !!sum && !!about && sum.closest("details") === about &&
    !!(about.querySelector(".cplfund-about").compareDocumentPosition(sum) & 4));
  check("L3: ...one box, not a box in a box — the in-section Summary drops its own border and fill",
    /\.cplfund-sec-body \.cplfund-summary \{[^}]*border: 0;[^}]*border-top: 1px solid var\(--border\)/.test(cssText(doc)));
  check("L3: ...and still reads its balance line — the readout survived the move",
    !!sum && /Allocation balances|out of balance|Over-allocated|unallocated|cannot be honored/.test(sum.textContent));
  check("L5: the table's footnote sits under the table, inside the college section, not at the page foot",
    !!doc.querySelector('details.cplfund-sec[data-sec="college"] .cplfund-foot') &&
    !doc.querySelector("#cplFundingMount > .cplfund > .cplfund-foot"));
  check("L5: ...and no longer points 'above' for the year or the requirements — they sit below the table now",
    !/selected above|requirement above/.test(footText(doc)) && /funding outcomes below/.test(footText(doc)));
  // A toggle THIS visit survives the re-render an edit triggers …
  const win = doc.querySelector('details.cplfund-sec[data-sec="window"]');
  win.open = true;
  win.dispatchEvent(new window.Event("toggle"));
  T.render();
  check("L2: a section opened this visit stays open across a re-render",
    doc.querySelector('details.cplfund-sec[data-sec="window"]').open === true);
  check("L2: ...without writing a per-browser store (no sections key in localStorage)",
    storageKeys(window).every((k) => !/cplfund_sections/.test(k)));
}

// ── 2: the mutation a screenshot cannot show — a store from an earlier visit ─
{
  const { window } = freshDom();
  window.localStorage.setItem("cplfund_sections_v2", JSON.stringify({ priorities: true, pools: true, college: false }));
  const doc = boot(window);
  check("L2: an open-state saved by an earlier visit does NOT reopen anything — the v2 store is retired",
    doc.querySelector('details.cplfund-sec[data-sec="priorities"]').open === false &&
    doc.querySelector('details.cplfund-sec[data-sec="pools"]').open === false &&
    doc.querySelector('details.cplfund-sec[data-sec="college"]').open === true &&
    doc.querySelector('details.cplfund-sec[data-sec="about"]').open === true);
  check("L2: ...and the retired key is cleared on load",
    window.localStorage.getItem("cplfund_sections_v2") === null);
}

// ── 4: the cards ──────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const css = cssText(doc);
  check("L4: the priority cards are a fixed two-column pair — a lone card is the width of one of the pair",
    /\.cplfund-prio \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/.test(css) &&
    !/\.cplfund-prio \{[^}]*auto-fit/.test(css));
  check("L4: ...and a single column on a phone",
    /@media \(max-width: 560px\) \{ \.cplfund-prio \{ grid-template-columns: minmax\(0, 1fr\); \} \}/.test(css));
  T._setScenario({ disbursement: "frontload" });
  T.render();
  const cards = Array.from(doc.querySelectorAll(".cplfund-prio .p"));
  check("L4: under front-load no Year-1 card carries the restating 'Combined funding' line",
    cards.length === 3 && !doc.querySelector(".cplfund-prio .cplfund-fl-line") &&
    cards.every((c) => !/Combined funding/.test(c.textContent)));
  check("L4: ...while every figure it restated is still on the card — the window figure on the Current Total line, the target",
    cards.every((c) => /of \$[\d,]+ full-window Total Possible/.test(c.textContent) &&
      (/Target [\d,.]+ CPL FTES/.test(c.textContent) || /so [\d,]+ students/.test(c.textContent))));
  check("L4: ...and on the band head, as Total Possible",
    Array.from(doc.querySelectorAll(".cplfund-band-tot"))
      .filter((e) => /\$[\d,]+ Total Possible/.test(e.textContent)).length >= 2);
  // The carryover year keeps its one line: a Year-2 card with no funding on
  // it has to say why.
  T._state.viewSlot = "2";
  T.render();
  const carry = doc.querySelector(".cplfund-prio .cplfund-fl-line");
  check("L4: the carryover year keeps its one explanatory line",
    !!carry && /carryover/.test(carry.textContent) && !/Combined funding/.test(carry.textContent));
  T._state.viewSlot = "1";
  T._setScenario({});
  T.render();
}

// ── 6: the API the explainer paints from ─────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const timing = T._timing();
  check("L6: _timing() returns the milestone list the tab renders — a label and a date per item",
    Array.isArray(timing) && timing.length > 3 &&
    timing.every((t) => typeof t.label === "string" && Object.prototype.hasOwnProperty.call(t, "date")));
  check("L6: ...one per rendered timing row",
    doc.querySelectorAll(".cplfund-timing-row").length === timing.length);
  T._setShared({ timing: [{ label: "Curator's milestone", date: "Mar 2027" }] });
  check("L6: ...and it reads the curator's layer, not a baked copy",
    T._timing().length === 1 && T._timing()[0].label === "Curator's milestone");
  T._setShared({ yearPriorities: { "1": { "0": { strategies: ["Strategy one", "Strategy two"] } } } });
  const ps = T._prios("Butte", "1");
  check("L6: _prios() carries each priority's strategies, from the curator's layer",
    !!ps && ps.every((p) => Array.isArray(p.strategies)) &&
    ps.filter((p) => p.strategies.length === 2 && p.strategies[0] === "Strategy one").length === 1);
  // ⚠️ A guard that dies cannot report (S219, S220, and this suite's own first
  // draft under mutation): with the field gone, `p` is undefined and a bare
  // `.push` ends the process before finish() prints. Fail by name instead.
  check("L6: ...and returns a COPY — a consumer cannot edit the model through it",
    (function () {
      const p = (ps || []).filter((x) => Array.isArray(x.strategies) && x.strategies.length === 2)[0];
      if (!p) return false;
      p.strategies.push("tampered");
      return T._prios("Butte", "1").filter((x) => (x.strategies || []).indexOf("tampered") >= 0).length === 0;
    })());
  T._setShared({});
}

// ── 6: EMBED mode — the table alone, publicly, with its drill-in ─────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_EMBED = "college";
  const doc = boot(window);
  const mount = doc.getElementById("cplFundingMount");
  check("L7: EMBED mode renders the institution table and its footnote — nothing of the tab's chrome",
    !!mount.querySelector(".cplfund-embed") &&
    mount.querySelectorAll("tr.cplfund-row").length > 100 &&
    !!mount.querySelector(".cplfund-foot") &&
    !mount.querySelector("details.cplfund-sec") && !mount.querySelector(".cplfund-summary") &&
    !mount.querySelector(".cplfund-actions") && !mount.querySelector(".cplfund-band") &&
    !mount.querySelector("#cplFundXall") && !mount.querySelector(".cplfund-src"));
  check("L7: ...as the PUBLIC rendering — embedding implies it, whatever the host forgot to set",
    !mount.querySelector("[data-edit]") && !mount.querySelector("[data-textedit]") &&
    !mount.querySelector("#cplFundReset") && !mount.querySelector("[data-viewmode]"));
  check("L7: ...the footnote names Year 1 rather than a year selector the host page does not have",
    /for Year 1\)/.test(footText(doc)) && !/selected/.test(footText(doc)));
  check("L7: ...and the search, the grouping and the export still travel with the table",
    !!mount.querySelector("#cplFundSearch") && !!mount.querySelector("#cplFundGroup") &&
    !!mount.querySelector("#cplFundCsv"));
  // The drill-in still works: the institution's name is the row toggle
  // (the calm pass, S220). A control a regression removed FAILS BY NAME.
  const toggle = mount.querySelector("tr.cplfund-row button[aria-expanded]");
  check("control present: the row toggle (the institution's name) inside the embed", !!toggle);
  if (toggle) {
    click(window, toggle);
    check("L7: an institution's row still opens its per-priority detail inside the embed",
      !!mount.querySelector("tr.cplfund-detail"));
  }
}

finish();
