// commons_program_records.js — the one computation of the program-records figure: Active programs complete, the
// target, what is left, the 7-day pace and the projected date. The CPL Commons front page (commons_front.js) and the
// College Data Collection page's ETA clock and Active programs tile (#collect: commons_eta_clock.js, commons_data.js)
// all read it, so the two pages show one date and one count (#3566, design decision 6: "Compute it once and have both
// pages read it"). Before this, the front page took the COCI-only programs out of the target and the clock did not, so
// on November 19 the front page read December 20 and #collect December 25, and #collect's tile read the live table's
// 14,986 against the headline's 14,996.
//
// What it reads: kb/status/program-requirements.json, its `headline` (one entry per day: active, complete). The caller
// fetches the file; compute() is pure.
//
// The rules, each once:
//   collected Complete plus the programs collected with their gaps noted (the census's collected_with_gaps), as
//             the headline day records them in `gaps_noted` (Sam, 2026-11-28, relayed from COBIx: "The 696 'collected,
//             gap noted' programs count as collected, not as work left"; r-eta-gaps-noted-count-collected-sam-2026-11-28).
//             A day with no `gaps_noted` counts complete alone. What is left is the target less collected.
//   target    Every Active program in its college's current catalog: active less the COCI-only programs (in the
//             Chancellor's Office inventory, not the current catalog; COBIx's open question 4 on #3533). Optional
//             cleanup, never part of the date.
//   pace      The last 7 days' net rise in complete (complete alone, so the first day that records gaps_noted is not
//             read as a jump). A missed build day never blanks a pace (COBIx on #3371): each
//             window ends on the closest earlier day that has a count, within 7 days, and divides by the days it
//             really spans. The 7 days before give the earlier pace.
//   date      The last headline day plus the days left at that pace, rounded up; the low end rounds down.
// Tokens, words and drawing belong to the pages. This file writes nothing.
(function () {
  "use strict";

  var URL = "kb/status/program-requirements.json";
  /* COCI-only Active programs, as COBIx's ask gives them (#3533 comment 7006930860); open question 4. When a committed
     source lands, read it here and every page follows. */
  var COCI_ONLY = 713;

  function dnum(s) { var p = String(s).slice(0, 10).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }

  /* The headline's days, oldest first, each { n, day, active, complete }. */
  function series(PR) {
    return ((PR && PR.headline) || []).filter(function (r) { return r && r.day && typeof r.complete === "number"; })
      .map(function (r) { return { n: dnum(r.day), day: String(r.day).slice(0, 10), active: r.active, complete: r.complete,
        gapsNoted: typeof r.gaps_noted === "number" ? r.gaps_noted : 0 }; })
      .sort(function (a, b) { return a.n - b.n; });
  }

  /* null when the file holds no headline of complete programs. */
  function compute(PR) {
    var H = series(PR);
    if (!H.length) return null;
    var by = {};
    H.forEach(function (r) { by[r.n] = r.complete; });
    var last = H[H.length - 1], lastN = last.n;
    function at(n) { return by[n] != null ? by[n] : null; }
    function back(n) { for (var k = n; k >= n - 7; k--) if (at(k) != null) return k; return null; }
    var d7 = back(lastN - 7), d14 = d7 == null ? null : back(d7 - 7);
    var complete = last.complete, active = last.active;
    var gapsNoted = last.gapsNoted, collected = complete + gapsNoted;
    var target = active - COCI_ONLY, left = Math.max(0, target - collected);
    var gain = d7 == null ? null : complete - at(d7), span = d7 == null ? null : lastN - d7;
    var prevGain = d14 == null ? null : at(d7) - at(d14), prevSpan = d14 == null ? null : d7 - d14;
    var pace = gain == null || !span ? null : gain / span, prevPace = prevGain == null || !prevSpan ? null : prevGain / prevSpan;
    var exact = left <= 0 ? 0 : pace > 0 ? left / pace : null;
    return {
      lastN: lastN, day: last.day, written: (PR && PR.written_at) || "",
      complete: complete, gapsNoted: gapsNoted, collected: collected, active: active, cociOnly: COCI_ONLY, target: target, left: left,
      gain: gain, span: span, pace: pace, fromN: d7,
      prevGain: prevGain, prevSpan: prevSpan, prevPace: prevPace, prevFromN: d14,
      exact: exact,
      doneN: exact == null ? null : lastN + Math.ceil(exact),
      lowN: exact == null ? null : lastN + Math.floor(exact),
      prevN: prevPace > 0 ? lastN + Math.ceil(left / prevPace) : null
    };
  }

  window.CPL_PROGRAM_RECORDS = { URL: URL, COCI_ONLY: COCI_ONLY, compute: compute, series: series };
})();
