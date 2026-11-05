// Every Commons List's side panel resizes from its left edge (Sam, 2026-11-05: "make all the sidebars horizontal
// resizable"). The engine (commons_list.js) draws the grip on every panel, so one guard on the Subjects List covers the
// five: a separator with its value, the arrow keys (Left widens, Right narrows, Home returns the panel's own width), one
// stored width for every Commons List (localStorage cplCommonsPanelW), and a narrow window keeps the full-row panel.
const H = require("./csr_list_harness.js");
const results = [];
function check(n, ok, why) { results.push([n, !!ok, why]); }
function entry(code) {
  return { canonical_subj4: code, source: "curator_override", reviewed_at: "2026-05-23T17:00:00Z", reviewed_by: "map@rccd.edu",
    data_modal: code, data_modal_is_4letter: true, data_modal_share: 0.8, total_mids: 10, variants_observed: {}, local_subject_variants: {},
    local_subject_total: 0, canonical_source: "csr", authority_flag: "proposed", authority_chips: [], cid_subject_codes: [], ccn_subject_code: null };
}
const SEED = { _counts: {}, disciplines: { "Welding": entry("WELD"), "Mathematics": entry("MATH") } };
(async function () {
  const t = H.boot({ seed: SEED });
  await H.settle(); await H.settle();
  const p = await t.panel("Welding");
  const grip = () => t.d.querySelector("#csl-panel .csl-pgrip");
  check("(1) ⭐ the panel carries a grip on its left edge: a focusable separator with its label and value", !!p && !!grip()
    && grip().getAttribute("role") === "separator" && grip().getAttribute("tabindex") === "0" && grip().getAttribute("aria-label") === "Resize the panel"
    && grip().getAttribute("aria-orientation") === "vertical" && !!grip().getAttribute("aria-valuenow"));
  const key = (k) => grip().dispatchEvent(new t.w.KeyboardEvent("keydown", { key: k, bubbles: true }));
  key("ArrowLeft");
  const aside = () => t.d.getElementById("csl-panel");
  check("(1) ⭐ Left widens the panel a step and stores the width for every Commons List", aside().style.width === "444px"
    && /^0 0 444px$/.test(aside().style.flex) && t.w.localStorage.getItem("cplCommonsPanelW") === "444" && grip().getAttribute("aria-valuenow") === "444",
    aside().style.width + " " + t.w.localStorage.getItem("cplCommonsPanelW"));
  key("ArrowRight"); key("ArrowRight");
  check("(1) Right narrows it", aside().style.width === "396px" && t.w.localStorage.getItem("cplCommonsPanelW") === "396");
  key("Home");
  check("(1) Home returns the panel to its own width and forgets the stored one", aside().style.width === "" && t.w.localStorage.getItem("cplCommonsPanelW") === null);
  // (2) a stored width opens every panel at it, and a repaint keeps it
  const u = H.boot({ seed: SEED, local: { cplCommonsPanelW: "640" } });
  await H.settle(); await H.settle();
  await u.panel("Mathematics");
  check("(2) ⭐ a stored width opens the panel at it", u.d.getElementById("csl-panel").style.width === "640px");
  // (3) the narrow-window rule and the grip's look
  const css = Array.from(t.d.querySelectorAll("style")).map((s) => s.textContent).join("\n");
  check("(3) on a narrow window the panel takes the full row and the grip hides", /@media \(max-width: 900px\)\{\.csl-panel\{flex:1 1 100% !important;width:auto !important;max-width:none !important\}\.csl-pgrip\{display:none\}\}/.test(css));
  check("(3) the grip is drawn on tokens, with a visible focus", /\.csl-pgrip\{position:absolute;left:0;top:0;bottom:0;width:12px;cursor:col-resize;touch-action:none/.test(css)
    && /\.csl-pgrip:focus-visible\{outline:2px solid var\(--seal-blue\)/.test(css));
  H.report(results);
})().catch((e) => { console.error(e); process.exit(1); });
