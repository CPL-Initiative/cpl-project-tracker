// SAM'S FUNDING-PAGE ASKS OF 2026-10-26 (Session 490):
//
//   1. "The edits I made to the NC priority (and other) titles did not make it
//   over to the public page." The live config (read 2026-10-26) held no label
//   for either noncredit outcome while his tab showed one: an edit made
//   without a fresh sign-in lands in this browser's what-if overlay, which the
//   tab shows over the shared scenario and a public surface never reads. And
//   the page offered no way to change those titles, nor its sub-headings
//   ("How a share becomes a target"), where a reader meets them.
//
//   ⚠️ So: a curator renames a noncredit outcome's label and title on the page
//   itself (the fields the tab's card edits, one store); renames each
//   sub-heading (pubTitles); and the curator bar says, in words, when this
//   browser holds edits the page does not show.
//
//   2. "The bullets on some sections of the public page are larger size that
//   what is used elsewhere and should be uniform." The noncredit cards'
//   strategies were a bare <ul> at the body's size inside a card whose text is
//   smaller; they take the credit cards' shape (ul.strat in its fold).
//
// Run from repo root: `npm test` (or `node tests/funding_page_titles_bullets.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("funding-model/index.html");
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();

const OUT = { ncLane: "outcomes", ncOutcomes: { "1": [
  { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["C", "A"], unit_word: "exhibits",
    metric: "Exhibits in MAP built or adopted", metric_src: "nc_exh", target_rule: { kind: "fixed", n: 2 },
    strategies: ["Build a credit-by-exam exhibit", "Build a portfolio exhibit"] },
  { key: "course", title: "Noncredit Career Exploration and CPL Portfolio course", share: 0.5, goals: ["A"],
    unit_word: "courses", metric: "A course", metric_src: "nc_course", target_rule: { kind: "fixed", n: 1 },
    strategies: ["Develop the course"] }
] } };
const clone = (o) => JSON.parse(JSON.stringify(o));

function session() {
  return { get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
           isFresh: function () { return true; }, onChange: function () {} };
}
// opts.local: what this browser's what-if overlay holds for the published scenario.
function page(opts) {
  opts = opts || {};
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w = dom.window;
  w.CPL_FUNDING_NO_REMOTE = true;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  if (opts.signedIn) w.CPL_SESSION = session();
  if (opts.local) w.localStorage.setItem("cpl_funding_whatif_v3", JSON.stringify(opts.local));
  ["cpl_funding_data.js", "funding_model_payload.js", "cpl_funding.js"].forEach((f) => w.eval(read(f)));
  Array.from(w.document.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
  // A curator edits inside COBI's Public page view, which frames this page (Sam, 2026-10-26).
  // jsdom has no frame, so a replaced self stands in for one, set after the funding module has
  // taken its global from self and before edit_page.js reads it.
  if (opts.signedIn && opts.framed !== false) w.eval("self = {}");
  w.eval(read("funding-model/edit_page.js"));
  const T = w.CPL_FUNDING_TAB;
  T._setShared(clone(OUT));
  T.render();
  w.CPL_REPAINT();
  return { w, doc: w.document, T };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const ncName = (doc, i) => flat(doc.querySelectorAll("#nc-outcomes .prio .name")[i || 0]);

// ── 1. the failure, reproduced: a label held in this browser alone ─────────
{
  // The overlay key names the scenario the public page reads; read it from a first boot.
  const probe = page();
  const sc = probe.T._scenario();
  const key = sc.project + "::" + sc.name;
  const local = { [key]: { ncOutcomes: clone(OUT.ncOutcomes) } };
  local[key].ncOutcomes["1"][0].label = "NC Priority 1";
  const { w, doc, T } = page({ signedIn: true, local });
  check("1a the public page reads the shared scenario: a label held in this browser alone never reaches it",
    /^NC-1 · Exhibits built or adopted$/.test(ncName(doc)));
  check("1b the engine names what this browser holds for the published scenario", T.localOnlyAreas().join() === "the noncredit outcomes");
  click(w, doc.getElementById("edit-page-btn"));
  const note = doc.querySelector(".pe-bar .pe-localnote");
  check("1c ⭐ the curator bar says so in words, and how to put the change on the page",
    !!note && /holds changes to the noncredit outcomes that only you can see/.test(flat(note)) &&
    /Publish this browser's changes/.test(flat(note)) && /make them again here/.test(flat(note)));
}
{
  const { w, doc } = page({ signedIn: true });
  click(w, doc.getElementById("edit-page-btn"));
  check("1d with no such edits, the bar carries no note", !doc.querySelector(".pe-localnote"));
}

// ── 2. the noncredit outcome renamed on the page ───────────────────────────
{
  const { w, doc, T } = page({ signedIn: true });
  check("2a a reader gets no Rename on a noncredit card", !doc.querySelector("#nc-outcomes .pe-x"));
  click(w, doc.getElementById("edit-page-btn"));
  const rn = doc.querySelector('#nc-outcomes [data-pe-ncrename="0"]');
  check("2b editing puts Rename on each noncredit card, named for the outcome",
    !!rn && !!doc.querySelector('#nc-outcomes [data-pe-ncrename="1"]') &&
    /Rename the noncredit outcome NC-1, Exhibits built or adopted/.test(rn.getAttribute("aria-label")));
  click(w, rn);
  const lab = doc.getElementById("pe-ncl-0"), tit = doc.getElementById("pe-nct-0");
  check("2c Rename opens the label and the title, each with a visible label",
    !!lab && !!tit && lab.value === "NC-1" && tit.value === "Exhibits built or adopted" &&
    /Label/.test(flat(lab.closest("label"))) && /Title/.test(flat(tit.closest("label"))));
  lab.value = "  NC Priority 1 ";
  tit.value = "Exhibits built or adopted for the program";
  click(w, doc.querySelector('[data-pe-ncsave="0"]'));
  const row = (T._getShared().ncOutcomes || {})["1"] || [];
  check("2d ⭐ Save writes the shared scenario's own fields (the tab's card reads them), trimmed",
    row[0] && row[0].label === "NC Priority 1" && row[0].title === "Exhibits built or adopted for the program" &&
    row[1] && row[1].title === OUT.ncOutcomes["1"][1].title && !row[1].label);
  check("2e ⭐ the page shows the new label and title at once", ncName(doc) === "NC Priority 1 · Exhibits built or adopted for the program");
  check("2f the other outcome keeps NC-2", /^NC-2 · /.test(ncName(doc, 1)));
  click(w, doc.querySelector('[data-pe-ncrename="0"]'));
  doc.getElementById("pe-ncl-0").value = "";
  doc.getElementById("pe-nct-0").value = "";
  click(w, doc.querySelector('[data-pe-ncsave="0"]'));
  check("2g a cleared label reads NC-1 again; a cleared title keeps the one stored",
    ncName(doc) === "NC-1 · Exhibits built or adopted for the program");
}
{
  // Signed out, nothing to edit: the page's editor needs the sign-in.
  const { doc } = page();
  check("2h without a sign-in the page offers no Edit this page", doc.getElementById("edit-page-btn").hidden);
}

// ── 3. the sub-headings ─────────────────────────────────────────────────────
{
  const { w, doc, T } = page({ signedIn: true });
  const subs = Array.from(doc.querySelectorAll("main [data-psub]")).map((h) => h.getAttribute("data-psub"));
  check("3a every sub-heading the engine declares is on the page, and every one on the page is declared",
    T.publicSubheadIds().every((id) => subs.indexOf(id) >= 0) && subs.every((id) => T.publicSubheadIds().indexOf(id) >= 0));
  // The reported cards carry a curator's title from the tab already, and an
  // illustration card's h3 is a college's name, not a heading anyone writes.
  check("3b the page's own sub-headings all carry an id, the painted Noncredit outcomes too",
    Array.from(doc.querySelectorAll("main section h3"))
      .filter((h) => !h.closest("#reported") && !h.closest("#cards") && !h.closest("#cplFundingMount"))
      .every((h) => h.hasAttribute("data-psub")));
  click(w, doc.getElementById("edit-page-btn"));
  const rn = doc.querySelector('[data-pe-subrename="sub_share_target"]');
  check("3c editing puts Rename under How a share becomes a target, outside any summary",
    !!rn && !rn.closest("summary") && /How a share becomes a target/.test(rn.getAttribute("aria-label")));
  click(w, rn);
  const inp = doc.getElementById("pe-st-sub_share_target");
  check("3d Rename opens its words", !!inp && inp.value === "How a share becomes a target");
  inp.value = "From a share to a target";
  click(w, doc.querySelector('[data-pe-subsave="sub_share_target"]'));
  const h = doc.querySelector('[data-psub="sub_share_target"]');
  check("3e ⭐ Save stores it under pubTitles and the page shows it",
    (T._getShared().pubTitles || {}).sub_share_target === "From a share to a target" && flat(h) === "From a share to a target");
  T.render(); w.CPL_REPAINT();
  check("3f a repaint keeps it", flat(doc.querySelector('[data-psub="sub_share_target"]')) === "From a share to a target");
  click(w, doc.querySelector('[data-pe-subrename="sub_share_target"]'));
  click(w, doc.querySelector('[data-pe-subreset="sub_share_target"]'));
  check("3g Restore the default heading stores nothing and brings the house words back",
    !(T._getShared().pubTitles || {}).sub_share_target && flat(doc.querySelector('[data-psub="sub_share_target"]')) === "How a share becomes a target");
  click(w, doc.querySelector('[data-pe-subrename="sub_nc_outcomes"]'));
  doc.getElementById("pe-st-sub_nc_outcomes").value = "What releases the noncredit share";
  click(w, doc.querySelector('[data-pe-subsave="sub_nc_outcomes"]'));
  check("3h the painted Noncredit outcomes heading renames and survives its own repaint",
    flat(doc.querySelector('#nc-outcomes [data-psub="sub_nc_outcomes"]')) === "What releases the noncredit share");
  T.setPubTitle("sub_unknown", "x", "");
  check("3i an id the page does not declare stores nothing", !(T._getShared().pubTitles || {}).sub_unknown);
}

// ── 4. the bullets ──────────────────────────────────────────────────────────
{
  const { doc } = page();
  const cards = Array.from(doc.querySelectorAll("#prios .prio, #nc-outcomes .prio"));
  const lists = cards.reduce((a, c) => a.concat(Array.from(c.querySelectorAll("ul, ol"))), []);
  check("4a ⭐ every list in a priority card, credit or noncredit, is the card's strategies list (ul.strat)",
    lists.length > 0 && lists.every((u) => u.classList.contains("strat")));
  const nc = doc.querySelector("#nc-outcomes .prio details.strat-fold");
  check("4b the noncredit strategies sit in the credit cards' fold, its heading in the summary",
    !!nc && flat(nc.querySelector("summary .strat-h")) === "Recommended strategies" && nc.open &&
    nc.querySelectorAll("ul.strat li").length === 2);
  const css = html.slice(0, html.indexOf("</style>"));
  check("4c the card's list size is set once, under .prio ul.strat, smaller than the body",
    /\.prio ul\.strat\{[^}]*font-size:\.92rem/.test(css));
  check("4d choosing a college folds the noncredit strategies with the credit ones",
    /#prios details\.strat-fold, #nc-outcomes details\.strat-fold/.test(html));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
