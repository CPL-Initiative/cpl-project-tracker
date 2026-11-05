// The top of every Commons view folds as one, and stays folded (Sam, 2026-11-05: "can you make the top cards section
// collapsible for all commons views. that maximizes my focus on the list"). The engine's line word folds the summary's
// cards and the tab's introduction (line's `top` selectors), stores the choice once for all five Commons views
// (localStorage cplCommonsTopFolded; a fold is no filter), and each tab reads it as a visit starts.
const fs = require("fs");
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
const INTRO = '<p class="cs-intro">This is a development draft.</p><p class="cs-scope-note">Scope.</p><div><button id="cs-guidelines-btn">Curation guidelines</button></div>';
(async function () {
  const t = H.boot({ seed: SEED, intro: INTRO });
  await H.settle(); await H.settle();
  const word = () => t.d.getElementById("csl-fold-w");
  check("(1) the line offers Hide the top, open on a first visit", !!word() && txt(word()) === "Hide the top" && word().getAttribute("aria-expanded") === "true", word() && txt(word()));
  word().click(); await H.settle(); await H.settle();
  const folded = (sel) => { const n = t.d.querySelector(sel); return !!n && n.hasAttribute("data-cmn-top-folded"); };
  check("(1) ⭐ one press folds the summary and the tab's introduction: the draft paragraph, the scope and the guidelines",
    t.d.getElementById("csl-fold").hidden && folded("#tab-canonical-subj4 .cs-intro") && folded("#tab-canonical-subj4 .cs-scope-note")
    && !!t.d.querySelector("#cs-guidelines-btn").closest("[data-cmn-top-folded]"));
  check("(1) the word then reads Show the top", txt(word()) === "Show the top" && word().getAttribute("aria-expanded") === "false");
  check("(1) ⭐ the choice is stored once for every Commons view", t.w.localStorage.getItem("cplCommonsTopFolded") === "1");
  check("(1) the hidden rule is the engine's, not the tab's", Array.from(t.d.querySelectorAll("style")).some((s) => /\[data-cmn-top-folded\]\{display:none !important\}/.test(s.textContent)));
  word().click(); await H.settle(); await H.settle();
  check("(1) Show the top brings it all back", !t.d.getElementById("csl-fold").hidden && !folded("#tab-canonical-subj4 .cs-intro") && t.w.localStorage.getItem("cplCommonsTopFolded") === "0");
  // (2) a new visit opens folded when the reader left it folded
  const u = H.boot({ seed: SEED, intro: INTRO, local: { cplCommonsTopFolded: "1" } });
  await H.settle(); await H.settle();
  check("(2) ⭐ a new visit opens with the top folded", u.d.getElementById("csl-fold").hidden && txt(u.d.getElementById("csl-fold-w")) === "Show the top"
    && u.d.querySelector("#tab-canonical-subj4 .cs-intro").hasAttribute("data-cmn-top-folded"));
  // (3) all five Commons views read the one choice and name what folds with it
  const tabs = { "canonical_subj4.js": "csl-fold", "exhibits.js": "exh-fold", "cr_reference.js": "crl-fold", "program_requirements.js": "prl-fold", "coci_lookup.js": "ccl-fold" };
  Object.keys(tabs).forEach((f) => {
    const src = fs.readFileSync(f, "utf8");
    check("(3) " + f + " reads the stored fold as a visit starts and passes its top", /dashFolded == null && window\.CPL_COMMONS_LIST && CPL_COMMONS_LIST\.topFolded\) \w+\.dashFolded = CPL_COMMONS_LIST\.topFolded\(\)/.test(src)
      && new RegExp('foldId: "' + tabs[f] + '", top: \\[').test(src));
  });
  H.report(results);
})().catch((e) => { console.error(e); process.exit(1); });
