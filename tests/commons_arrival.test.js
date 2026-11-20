// A Commons link lands on its filter (#3510 B1; Commons Clarity's walk, #3447 item 6e). Start and the "Waiting on a
// person" links name a List filter (#coci-lookup/list/seedless, #exhibits/list/nosubj); the walk found each opened its
// tab with the Progress summary unfolded on top and the named filter out of sight. commons_list.js, the one List engine
// every Commons tab draws with, now:
//   (1) ⭐ folds the top on an arrival whose address names a filter, for the visit only (nothing stored), so the
//       filter and its rows are on the first screen; an address with no filter keeps the reader's stored fold;
//   (2) ⭐ scrolls the selected filter word into view once per arrival, and marks the bar data-arrived (the nightly
//       click-through, scripts/commons_clickthrough.js, reads it);
//   (3) the reader's own Show the top wins from then on, and is stored as before.
// Run from repo root: `npm test` (or `node tests/commons_arrival.test.js`).
const H = require("./csr_list_harness.js");
const results = [];
function check(n, ok, why) { results.push([n, !!ok, why]); }
const txt = H.txt;
function entry(code) {
  return { canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, data_modal_share: 0.8, total_mids: 10, variants_observed: {}, local_subject_variants: {},
    local_subject_total: 0, canonical_source: "csr", authority_flag: "proposed", authority_chips: [], cid_subject_codes: [], ccn_subject_code: null };
}
const SEED = { _counts: {}, disciplines: { "Welding": entry("WELD"), "Mathematics": entry("MATH") } };
const INTRO = '<p class="cs-intro">This is a development draft.</p>';

(async function () {
  // (1) and (2): an arrival that names a filter.
  const scrolled = [];
  const t = H.boot({ seed: SEED, intro: INTRO, hash: "#canonical-subj4/list/confirmed" });
  t.w.HTMLElement.prototype.scrollIntoView = function () { scrolled.push(this); };
  await H.settle(); await H.settle(); await H.settle();
  const fold = t.d.getElementById("csl-fold"), word = t.d.getElementById("csl-fold-w");
  check("(1) ⭐ an arrival at #canonical-subj4/list/confirmed opens with the top folded", !!fold && fold.hidden && word && txt(word) === "Show the top", word && txt(word));
  check("(1) the arrival's fold is for the visit only: nothing is stored", t.w.localStorage.getItem("cplCommonsTopFolded") == null);
  const bar = t.d.getElementById("csl-filters"), cur = bar && bar.querySelector("[aria-current]");
  check("(2) ⭐ the named filter is the one selected, and the bar says the arrival landed", cur && /^Confirmed/.test(txt(cur)) && bar.getAttribute("data-arrived") === "confirmed", cur && txt(cur));
  check("(2) ⭐ the selected filter word is scrolled into view, once", scrolled.filter((n) => n === cur).length === 1, scrolled.map((n) => n.outerHTML.slice(0, 80)));
  // (3) the reader's own choice wins.
  word.click(); await H.settle(); await H.settle();
  check("(3) Show the top unfolds it, and the reader's choice is stored as before", !t.d.getElementById("csl-fold").hidden && t.w.localStorage.getItem("cplCommonsTopFolded") === "0");
  check("(3) no second scroll to the filter on a redraw of the same arrival", scrolled.filter((n) => n.closest && n.closest("#csl-filters")).length === 1, scrolled.length);

  // (1) an address with no filter keeps the stored fold (open on a first visit).
  const u = H.boot({ seed: SEED, intro: INTRO, hash: "#canonical-subj4/list" });
  await H.settle(); await H.settle();
  check("(1) an address with no filter opens as the reader left it: open on a first visit", !u.d.getElementById("csl-fold").hidden && txt(u.d.getElementById("csl-fold-w")) === "Hide the top"
    && !u.d.getElementById("csl-filters").hasAttribute("data-arrived"));
  H.report(results);
})().catch((e) => { console.error(e); process.exit(1); });
