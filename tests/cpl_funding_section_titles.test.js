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
//   4. HIDING IS PUBLIC-ONLY AND REVERSIBLE. A section held back must still
//      render for the curator, carrying a word that says so — a control that
//      makes a section vanish from its own author has no way back.
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
  check("signed in, EVERY rendered section carries Rename and a public-visibility word",
    doc.querySelectorAll(".cplfund-sec").length === nSections &&
    doc.querySelectorAll("[data-secrename]").length === nSections &&
    doc.querySelectorAll("[data-sechide], [data-secshow]").length === nSections);
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

  // 4 — hide the formula section from the public page.
  clickSel(window, doc, '[data-sechide="formula"]');
  check("hiding stores the flag under secHidden.<id>", T._getShared().secHidden && T._getShared().secHidden.formula === true);
  check("the curator still sees the section, and a word says it is held back",
    !!sec(doc, "formula") &&
    /Hidden on the public page/.test(sec(doc, "formula").querySelector("summary").textContent) &&
    !!doc.querySelector('[data-secshow="formula"]'));
  T._state.previewPublic = true;
  T.render();
  check("on the public rendering the hidden section is gone, and the others remain",
    !sec(doc, "formula") && !!sec(doc, "about") && !!sec(doc, "college"));
  check("the public rendering carries no Rename, no Hide and no title input",
    !doc.querySelector("[data-secrename]") && !doc.querySelector("[data-sechide]") &&
    !doc.querySelector("[data-secshow]") && !doc.querySelector("[data-sectitle]"));
  T._state.previewPublic = false;
  T.render();
  clickSel(window, doc, '[data-secshow="formula"]');
  check("Show brings it back and leaves no empty secHidden map behind",
    !!sec(doc, "formula") && !(T._getShared().secHidden && T._getShared().secHidden.formula));
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
