// CPL Implementation Funding — two things a reader of the college table could
// not see, both reported by Sam on 2026-08-23.
//
// (1) THE PRIORITY COLUMNS WERE NAMED "P1" "P2" "P3" AND NOTHING ELSE.
//     "Please center the P1,2,3 column headers for the college rows and add the
//     main title to them (e.g., P1 Access)." The ordinal alone made the reader
//     hover to learn which priority a column was, on the three columns carrying
//     the achievement story.
//
//     The title is OPTIONAL and must stay optional: `yearPriorities` in the live
//     config is a SPARSE overlay over the baked priorities, and today one slot
//     carries no title at all. A header that printed "P3 undefined" would be
//     worse than the bare ordinal it replaced.
//
// (2) A GATED COLLEGE WITH NOTHING EARNED SAID NOTHING AT ALL.
//     "Why don't Cosumnes and Grossmont and others have the opt in to begin
//     earning note?" The prompt keyed on `held > 0.5` — the SIZE of the withheld
//     figure — so a college that is gated but whose earnable amount computes to
//     zero rendered no prompt, no explanation, an ordinary-looking row. That is
//     the one cohort the prompt exists for: a college showing nothing is exactly
//     the one that has not started.
//
//     It is the same silent-omission class as the bare "$0 earned" this wording
//     replaced (Sam, 2026-07-30) — a row that says nothing makes no claim a
//     reader can act on. The prompt is now driven by the GATE.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_row_legibility.test.js`).
const { check, freshDom, boot, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// ─────────────────────────────────────────────────────────────────────────────
// L1 — the priority headers carry their name and are centered
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  window.CPL_FUNDING_TAB.render();
  const heads = [...window.document.querySelectorAll("th")]
    .filter((th) => /^P\d/.test(th.textContent.trim()));

  check("the three priority columns are present", heads.length === 3);
  check("each is centered (th.c)", heads.length === 3 && heads.every((th) => /\bc\b/.test(th.className)));
  check("each carries its ordinal AND its name, not the ordinal alone",
    heads.length === 3 && heads.every((th) => /^P\d\s+\S/.test(th.textContent.trim())));
  check("no header prints an undefined title",
    heads.every((th) => !/undefined|null/i.test(th.textContent)));
  // The name must be the priority's own, not a positional guess.
  const T = window.CPL_FUNDING_TAB;
  const names = T._prios ? T._prios(D.colleges[0].college, "1") : null;
  check("the header name matches the priority the column represents",
    !names || heads.every((th, i) => {
      const nm = names[i] && names[i].title;
      return !nm || th.textContent.indexOf(nm) !== -1;
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// L2 — a missing title falls back to the bare ordinal
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ READ BEFORE CHANGING THIS BLOCK. The first draft stripped `title` from
// every entry of `year_priorities` and asserted the headers came out as bare
// ordinals. It FAILED — and the code was right, the test was wrong: the live
// config's `yearPriorities` is a sparse overlay, but `prioTitle()` falls back to
// `DEFAULT_PRIORITY_TITLES` keyed on the priority's SOURCE index, so a title is
// always supplied. Sam's saved config has a null title on one slot and it still
// renders "Success" from that fallback.
//
// So an empty title is NOT reachable through configuration today, and a test
// claiming to exercise that path would be theatre. What IS reachable is adding a
// priority beyond the baked defaults, which is why the guard stays. Assert the
// guard's existence, and assert the property that actually holds at runtime.
{
  check("the header appends a name only when there is one",
    /var nm = p\.title \? String\(p\.title\)\.trim\(\) : "";/.test(consumerSrc) &&
    /label: "P" \+ \(i \+ 1\) \+ \(nm \? " " \+ esc\(nm\) : ""\)/.test(consumerSrc));
  check("the hover text drops the dash too when there is no name",
    /title: p\.label \+ \(nm \? " — " \+ nm : ""\)/.test(consumerSrc));
  // The runtime property: every title the model yields is non-empty, so no
  // header can currently render a dangling ordinal-plus-nothing.
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const titles = T._prios ? T._prios(D.colleges[0].college, "1").map((p) => p.title) : [];
  check("every priority resolves to a non-empty title today (the fallback works)",
    titles.length === 0 || titles.every((t) => typeof t === "string" && t.trim() !== ""));
}

// ─────────────────────────────────────────────────────────────────────────────
// L3 — the opt-in prompt is driven by the GATE, not by the withheld amount
// ─────────────────────────────────────────────────────────────────────────────
// The harness has no coordinator/participation feed, so the gate reads PENDING
// and no row is blocked — which is why this defect could never be reproduced by
// rendering the table offline. Assert on the function's contract instead: it is
// exported through the same module surface the table calls.
{
  const src = consumerSrc;
  // The signature carries the gate.
  check("earnedSubHtml takes a `gated` argument",
    /function earnedSubHtml\(cap, earned, adv, held, gated\)/.test(src));
  check("...and the prompt branch fires on it, not on held alone",
    /if \(held > 0\.5 \|\| gated\)/.test(src));
  check("the window-total cell passes the college's gate state",
    /earnedSubHtml\(row\.total,[\s\S]{0,120}row\.gate_blocked\)/.test(src));
  check("the per-year cell passes it too",
    /earnedSubHtml\(cap, pt\.earned, pt\.adv, pt\.held, row\.gate_blocked\)/.test(src));
  // A gated college with nothing withheld must NOT be told money is held.
  check("the figure renders only when there IS one to hold",
    /var showFig = due && held > 0\.5;/.test(src) &&
    /showFig \? "held " \+ fmtMoney\(held\) : "opt in to start earning"/.test(src));
  // The old unconditional wording would have printed "held $0" after the
  // deadline for exactly the colleges this change is for.
  check("no branch can emit a bare `held $0`",
    !/due \? "held " \+ fmtMoney\(held\)/.test(src));
}

finish();
