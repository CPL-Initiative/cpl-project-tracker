// CPL Implementation Funding — the tab-side changes from Sam's 2026-09-24
// review sheet that are not layout (the drill-in and the star live in
// cpl_funding_dtl_align.test.js).
//
// Item 3: "60 of 116 colleges qualify (auto-measured — Veteran Star ...). The
// MAP Dashboard shows 59 -- which is correct?" Both were: 59 colleges hold the
// Veteran Star and 60 meet the requirement, because Calbright meets it with
// noncredit certificates. The line printed the 60 beside the words "Veteran
// Star", so it read as 60 stars. It now states the two counts apart, and the
// star count must equal the flags the feed carries.
//
// Item 4: "Add to bottom of Timeline: 'Note: CPL data is housed in the MAP
// platform, which serves as the CPL solution supporting our communities,
// colleges, and system.'" An editable prose block, so his words are the default
// and a curator's rewording saves for everyone.
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, check, finish } = H;

{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-24", suppress_below: 10,
    statewide: { pa_u: 300000 }, colleges: { "Laney": { pa_u: 9000 } }, unmatched: {},
    vet_star: { "Alameda": true, "Laney": true, "Chabot": true, "Berkeley City": false },
    vet_star_as_of: "2026-09-24", vet_star_threshold: 0.75 };
  const doc = boot(window);
  // The live config's requirement, verbatim — the line renders only for a
  // veteran-JST requirement (isVetJstReq), as in cpl_funding_rate part I.
  window.CPL_FUNDING_TAB._setShared({ extraReqs: ["Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP"] });
  window.CPL_FUNDING_TAB.render();

  // ── item 3: the two counts, stated apart ─────────────────────────────────
  const lines = Array.from(doc.querySelectorAll(".cplfund-reqstatus"))
    .filter((el) => /Veteran Star/.test(el.textContent));
  check("3a: one Baseline status line speaks for the Veteran Star", lines.length === 1);
  const txt = lines.length ? lines[0].textContent.replace(/\s+/g, " ") : "";
  const met = txt.match(/(\d+) of (\d+) colleges meet this\./);
  const stars = txt.match(/(\d+) hold the Veteran Star/);
  check("3b: it states how many colleges meet the requirement (" + (met ? met[0] : "none") + ")", !!met);
  check("3c: and, separately, how many hold the Veteran Star — the feed's three flags (" +
    (stars ? stars[0] : "none") + ")", !!stars && stars[1] === "3");
  check("3d: the star count never exceeds the met count (a star always meets it)",
    !!met && !!stars && Number(stars[1]) <= Number(met[1]));
  check("3e: the line no longer prints a count beside the words \"colleges qualify\"",
    !/colleges qualify/.test(txt));
  check("3f: it gives the measure and the data date",
    /at least 75% of enrolled veterans' JSTs uploaded in MAP/.test(txt) && /as of 2026-09-24/.test(txt));

  // ── item 4: the Timeline note ────────────────────────────────────────────
  const note = doc.querySelector('.cplfund-timing-note[data-textblock="timing_note"]');
  check("4a: the Timeline carries its note as an editable prose block", !!note);
  check("4b: in Sam's words, verbatim",
    !!note && note.textContent.replace(/\s+/g, " ").trim().indexOf(
      "Note: CPL data is housed in the MAP platform, which serves as the CPL solution supporting our " +
      "communities, colleges, and system.") === 0);
  const timing = note && note.closest('[data-sec="timing"]');
  check("4c: and it sits in the Timeline section, after the milestones",
    !!timing && !!timing.querySelector(".cplfund-timing") &&
    (timing.querySelector(".cplfund-timing").compareDocumentPosition(note) & 4) === 4);
}

finish();
