// CPL Implementation Funding — renaming a section, and holding one back from
// the public page (Sam, 2026-09-09).
//
// "I also need to be able to edit the section titles, not just the text blocks
// on all funding surfaces", and, of the public page, "I will want to be able
// to hide whole sections as I curate."
//
// Both ride sectionShell(), the ONE function every section on every subview
// passes through, which is why this suite can assert over the whole mount
// rather than a list of section ids someone has to remember to extend.
//
// What each assertion defends:
//
//   1. THE CONTROL IS A CURATOR'S, NOT A READER'S. Signed out, and on the
//      public rendering, no Rename and no Hide anywhere — prose is not a dial
//      to explore (S219's ruling, carried over from the prose blocks).
//   2. A RENAME IS PLAIN TEXT. The house title may carry markup — the
//      priorities heading holds a link to the Ed. Code section it names — but
//      what an author types is escaped, on a page every visitor reads.
//   3. THE SEED IS THE TITLE THE CURATOR SEES. Renaming a section whose house
//      title is a link must offer its WORDS, on one line, not its markup.
//   4. HIDING IS PUBLIC-ONLY AND REVERSIBLE — and since 2026-10-15 (Sam's call
//      1 on the one public funding page) it lives on the public page itself:
//      the tab's Public page view frames funding-model/, whose Edit this page
//      hides a block by its own id. The tab's sections carry no Hide, and a
//      stale secHidden key still drops a section from a public rendering of
//      the tab's own sections (asserted in 5 below).
//   5. THE FOLD STILL WORKS. The controls sit in the body, not the <summary>,
//      because a button inside a summary is nested interactive content: it
//      toggles the fold on click and screen readers expose it inconsistently.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_section_titles.test.js`).
const { check, finish, freshDom, boot, click } = require("./lib/cpl_funding_harness.js");

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    onChange: function () {},
  };
}
function sec(doc, id) { return doc.querySelector('.cplfund-sec[data-sec="' + id + '"]'); }
function head(doc, id) { const s = sec(doc, id); return s ? s.querySelector("summary h3") : null; }
function clickSel(window, doc, sel) {
  const el = doc.querySelector(sel);
  check("control present: " + sel, !!el);
  if (el) click(window, el);
  return !!el;
}

{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // 1 — signed out, a section is a section. No curator affordance anywhere.
  check("signed out there is no Rename and no Hide on any section",
    !doc.querySelector("[data-secrename]") && !doc.querySelector("[data-sechide]") &&
    !doc.querySelector("[data-secshow]"));
  const nSections = doc.querySelectorAll(".cplfund-sec").length;
  check("the tab renders several sections to act on", nSections >= 6);

  window.CPL_SESSION = reviewerSession();
  T.render();
  // The explainer's text (2026-10-09) is the one curator-only section: it is
  // never public, so it has no Rename or Hide, and it says so by its mark.
  const curatorOnly = Array.from(doc.querySelectorAll(".cplfund-sec[data-curator-only]"));
  check("signed in, EVERY rendered section carries Rename, and none a Hide (call 1: hiding lives on the public page)",
    doc.querySelectorAll(".cplfund-sec:not([data-curator-only])").length === nSections &&
    doc.querySelectorAll("[data-secrename]").length === nSections &&
    doc.querySelectorAll("[data-sechide], [data-secshow]").length === 0);
  // My CPL Funding's text joined it on 2026-10-15 (Sam, call 8): never public either.
  check("...and the curator-only sections are the explainer's text and My CPL Funding's text, with neither control",
    curatorOnly.length === 2 &&
    curatorOnly.map((d) => d.getAttribute("data-sec")).join(",") === "explainer_text,mc_text" &&
    curatorOnly.every((d) => !d.querySelector("[data-secrename], [data-sechide], [data-secshow]")));
  check("the controls sit in the section BODY, never inside the <summary>",
    !doc.querySelector(".cplfund-sec-sum [data-secrename]") &&
    !doc.querySelector(".cplfund-sec-sum button") &&
    !!doc.querySelector(".cplfund-sec-body .cplfund-sec-ctl [data-secrename]"));

  // 2/3 — rename the priorities section, whose house title carries a link.
  const houseHead = head(doc, "priorities");
  check("the priorities heading's house title carries a link to the Ed. Code section",
    !!houseHead && !!houseHead.querySelector("a") && /78093\.2\(d\)\(1\)/.test(houseHead.textContent));
  clickSel(window, doc, '[data-secrename="priorities"]');
  const input = doc.querySelector('[data-sectitle="priorities"]');
  check("Rename offers the title's WORDS on one line, not its markup",
    !!input && /Funding Outcomes Required by/.test(input.value) &&
    !/<a |href=/.test(input.value) && !/\n/.test(input.value));
  input.value = "Funding Outcomes <b>Required</b> by Ed. Code";
  clickSel(window, doc, '[data-sectitlesave="priorities"]');
  const renamed = head(doc, "priorities");
  check("Save renames the section and ESCAPES what was typed",
    !!renamed && !renamed.querySelector("b") && !renamed.querySelector("a") &&
    /Funding Outcomes <b>Required<\/b> by Ed\. Code/.test(renamed.textContent));
  check("…storing it under titles.<id> in the SHARED layer (signed in = saves for everyone)",
    !!T._getShared().titles && T._getShared().titles.priorities === "Funding Outcomes <b>Required</b> by Ed. Code");
  check("…and the section still folds, with Rename still offered",
    !!sec(doc, "priorities") && sec(doc, "priorities").tagName === "DETAILS" &&
    !!doc.querySelector('[data-secrename="priorities"]'));

  // Restore returns the house title, link and all.
  clickSel(window, doc, '[data-secrename="priorities"]');
  clickSel(window, doc, '[data-sectitlereset="priorities"]');
  check("Restore drops the override and the house title returns with its link",
    !(T._getShared().titles && T._getShared().titles.priorities) &&
    !!head(doc, "priorities") && !!head(doc, "priorities").querySelector("a"));

  // 4 — retired 2026-10-15 (Sam's call 1): the tab's sections carry no Hide;
  // a curator hides a block on the public page with Edit this page
  // (tests/funding_page_edit.test.js). A curator-held secHidden key no longer
  // marks the Internal view either: nothing on it reads that key.
  T._setShared({ secHidden: { formula: true } });
  T.render();
  check("a stored secHidden key leaves the Internal view's section as it was, with no word about the public page",
    !!sec(doc, "formula") && !/Hidden on the public page/.test(sec(doc, "formula").querySelector("summary").textContent));
  T._setShared({});
  T.render();
}

// 5 — a renamed, hidden section on the standalone public page: the rename
//     shows, the hidden section does not, and no control survives.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ titles: { about: "About the funding model" }, secHidden: { window: true } });
  T.render();
  check("the public page honors a rename",
    !!head(doc, "about") && /About the funding model/.test(head(doc, "about").textContent));
  check("the public page honors a hidden section", !sec(doc, "window"));
  check("and offers no curator control of either",
    !doc.querySelector("[data-secrename], [data-sechide], [data-secshow], [data-sectitle]"));
}

finish();
