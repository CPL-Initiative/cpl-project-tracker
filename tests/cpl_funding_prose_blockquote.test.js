// CPL Implementation Funding — quoting a passage inside an editable prose block.
//
// WHY THIS EXISTS. The five prose blocks store PLAIN TEXT and escape it on
// render, which is what keeps a page every visitor reads free of markup an
// author can inject. It also meant a statutory quotation rendered at exactly
// the weight of the page's own sentences: asked to put Ed. Code §78093.2(d)
// into the introduction (Sam, 2026-09-09), a reader could not see where the
// statute started or stopped, and the block's one formatting affordance — a
// blank line starts a paragraph — could not say so. Leading spaces cannot:
// plainNormalize() strips them, by design, so a paste keeps its shape.
//
// The convention added: a paragraph whose EVERY line begins with ">" renders
// inside a <blockquote>. What each assertion here defends:
//
//   1. ALL-OR-NOTHING. "3 > 2" mid-sentence must stay literal text. A rule
//      that fired on any ">" would silently reformat ordinary prose, and the
//      author's only clue would be an indent they did not ask for.
//   2. ESCAPING SURVIVES. This adds one BLOCK an author can ask for, not a
//      markup channel. `> <b>x</b>` must still render the tags as text — the
//      same guarantee tests/cpl_funding_calm.test.js pins for plain paragraphs.
//   3. THE ROUND TRIP. Edit re-opens the textarea from the stored text, and
//      Save compares against the default to decide whether to store anything
//      at all. A quotation must survive that loop unchanged or an author's
//      quote silently degrades into "> " lines that lost their marks.
//   4. THE INDENT IS NOT A COLOR. The rule keeps the body text color, so no
//      new foreground/background pair enters the contrast budget and no
//      meaning rides on color alone (presentation doctrine).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_prose_blockquote.test.js`).
const { check, finish, freshDom, boot, click, consumerSrc } = require("./lib/cpl_funding_harness.js");

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    onChange: function () {},
  };
}
function clickSel(window, doc, sel) {
  const el = doc.querySelector(sel);
  check("control present: " + sel, !!el);
  if (el) click(window, el);
}
function setVal(doc, sel, v) {
  const el = doc.querySelector(sel);
  if (el) el.value = v;
}
function saveAbout(window, doc, text) {
  const T = window.CPL_FUNDING_TAB;
  clickSel(window, doc, '[data-textedit="about"]');
  setVal(doc, '[data-textarea="about"]', text);
  clickSel(window, doc, '[data-textsave="about"]');
  return doc.querySelector('.cplfund-prose[data-textblock="about"]');
}

const STATUTE = [
  "This page serves as the model for allocating those funds based on Ed. Code §78093.2(d):",
  "",
  "> (d)(1) Upon appropriation by the Legislature, the chancellor's office shall allocate designated funds using all of the following goals:",
  "> (A) Increasing access to credit for prior learning opportunities equitably for all eligible students.",
  "> (B) Increasing completion through credit for prior learning awards.",
  "",
  "The model calculates the priority outcomes from records in the MAP platform.",
].join("\n");

{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  window.CPL_SESSION = reviewerSession();
  T.render();

  // 1 — a quoted block renders as a quotation, and the marks do not survive
  //     into the reader's text.
  const block = saveAbout(window, doc, STATUTE);
  const bq = block && block.querySelector("blockquote");
  check("a paragraph of > lines renders inside a <blockquote>", !!bq);
  check("the > marks are stripped from what the reader sees",
    !!bq && !/^>|\n>/.test(bq.textContent) && /\(d\)\(1\) Upon appropriation/.test(bq.textContent));
  check("the quoted lines keep their line breaks (one paragraph, three <br>-joined lines)",
    !!bq && bq.querySelectorAll("p").length === 1 && (bq.innerHTML.match(/<br>/g) || []).length === 2);
  check("the prose around it is unchanged — two ordinary paragraphs outside the quotation",
    !!block && block.querySelectorAll(":scope > p").length === 2 &&
    /allocating those funds/.test(block.textContent) && /calculates the priority outcomes/.test(block.textContent));

  // 2 — all-or-nothing: a > inside a sentence is not a quotation.
  const lit = saveAbout(window, doc, "A sentence where 3 > 2 holds.\nAnd a second line.");
  check("a > inside a sentence does NOT make a quotation (all lines must carry the mark)",
    !!lit && !lit.querySelector("blockquote") && /3 > 2 holds/.test(lit.textContent));

  // 3 — escaping is untouched: a block, not a markup channel.
  const esc = saveAbout(window, doc, "> A quoted <b>passage</b> with markup.");
  check("markup inside a quotation is still escaped, not rendered",
    !!esc && !!esc.querySelector("blockquote") && !esc.querySelector("b") &&
    /A quoted <b>passage<\/b> with markup\./.test(esc.textContent));

  // 4 — the round trip: Edit re-opens the stored text with its marks intact.
  saveAbout(window, doc, STATUTE);
  clickSel(window, doc, '[data-textedit="about"]');
  const ta = doc.querySelector('[data-textarea="about"]');
  check("Edit re-opens the quotation with its > marks intact (the round trip is lossless)",
    !!ta && ta.value === STATUTE.replace(/\n\n\n+/g, "\n\n"));
  check("…and the stored override is the plain text, blockquote-free",
    !!T._getShared().text && /^> \(d\)\(1\)/m.test(T._getShared().text.about) &&
    !/blockquote/.test(T._getShared().text.about));
}

// 5 — the styling: an indent and a rule, no new color pair, no color carrying
//     meaning on its own. Read off the source so a token swap (dark mode) or a
//     hand-typed hex is caught here rather than by eye.
{
  const rule = (consumerSrc.match(/"\.cplfund-prose blockquote \{[^"]*"/) || [""])[0];
  check("the blockquote rule exists and indents with a left border", /border-left/.test(rule) && /padding/.test(rule));
  check("it sets no color of its own — the text keeps the body color", !/(^|[^-])color:/.test(rule));
  check("its border uses a token, never a raw hex", /var\(--/.test(rule) && !/#[0-9a-fA-F]{3,8}/.test(rule));
}

finish();
