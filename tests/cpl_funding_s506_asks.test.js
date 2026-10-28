// Sam's funding-tab asks of 2026-10-28 (S506), the ones no older suite covers.
//
//   3. "Gray all unchecked qualifying boxes so users don't think they should
//      click on them to take action."
//   4. "Make the Confirm by link on college rows the same font size as other
//      row data."
//   7. The Explainer and My CPL Funding text: "I am able to edit and save some
//      but others I try to delete the text and it reappears on save", and "I
//      need a way to indent (tab) bullets". Two causes brought text back: an
//      empty save deleted the override, so the house words returned; and a
//      signed-in save went to the shared config while the tab read this
//      browser's what-if copy first (cpl_memory
//      pitfall-funding-edit-saves-to-browser-whatif-2026-10-26).
//
// The email-first forms (ask 1) live in cpl_funding_optin and
// cpl_funding_nc_attestation; the attest word's place (ask 2) in the latter;
// the memo's Contents item and the version's place (asks 5 and 6) in
// funding_memo_page and funding_model_page.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_s506_asks.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { check, freshDom, boot, finish } = require("./lib/cpl_funding_harness.js");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const src = read("cpl_funding.js");
const editSrc = read("funding-model/edit_page.js");
const pageHtml = read("funding-model/index.html");
const flat = (s) => String(s || "").replace(/\s+/g, " ").trim();
function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
const KEY = "x_timing";   // an explainer passage (rich): lists render in it

// ── 3 and 4: the boxes and the Confirm word, in the stylesheet ──────────────
check("3: an unmet condition's box is gray (the border and fill tokens), the met box keeps the seal blue",
  /"\.cf-cond:not\(\.cf-met\) \.cf-box \{ border-color: var\(--border-strong\); background: var\(--surface-subtle\); \}"/.test(src) &&
  /"\.cf-met \.cf-box \{ background: var\(--seal-blue/.test(src));
check("4: the row's Confirm word takes the row's own type size",
  /"\.cplfund-table td\.cf-inst \.cplfund-optin-jump \{ float: right; margin-left: 12px; font-size: inherit; \}"/.test(src));
check("2: the conditions line is three columns, label, first box, the rest, one column on a phone",
  /"\.cf-conds \{ display: grid; grid-template-columns: max-content auto minmax\(0, 1fr\);/.test(src) &&
  /@media \(max-width: 560px\) \{ \.cf-conds \{ grid-template-columns: minmax\(0, 1fr\); \} \}/.test(src));

// ── 7a. bullets nest ────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const html = (txt) => { T._setScenario({ text: { [KEY]: txt } }); return T.explainerTextHtml(KEY, {}); };
  check("7a1: a tab or two spaces before a bullet nests it under the one above, and the list closes in order",
    html("- one\n\t- two\n    - three\n- four") ===
      "<ul><li>one<ul><li>two<ul><li>three</li></ul></li></ul></li><li>four</li></ul>");
  check("7a2: the stored text keeps the depth as two spaces a level",
    T.textPlain(KEY) === "- one\n  - two\n    - three\n- four");
  check("7a3: a flat list renders as it always did", html("- a\n- b") === "<ul><li>a</li><li>b</li></ul>");
  check("7a4: a numbered list may carry bullets under an item",
    html("1. first\n  - detail\n2. second") === "<ol><li>first<ul><li>detail</li></ul></li><li>second</li></ol>");
  check("7a5: an item more than one level in nests one level, never a list with no item",
    html("- a\n      - b") === "<ul><li>a<ul><li>b</li></ul></li></ul>");
  check("7a6: a top level that mixes bullets and numbers stays a paragraph, as before",
    /^<p>- a<br>1\. b<\/p>$/.test(html("- a\n1. b")));
  check("7a7: indentation on a line that is no list item is still trimmed", T.textPlain(KEY) === "- a\n1. b" &&
    (T._setScenario({ text: { [KEY]: "   plain words" } }), T.textPlain(KEY) === "plain words"));
}

// ── 7b. Indent and Outdent, a pure function ─────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const t = "- a\n- b\n- c";
  const r1 = T.indentLines(t, 5, 5, 1);
  check("7b1: Indent moves the caret's list line one level in, and the caret with it",
    r1.changed && r1.text === "- a\n  - b\n- c" && r1.a === 7 && r1.b === 7);
  const r2 = T.indentLines(r1.text, 7, 7, -1);
  check("7b2: Outdent moves it back", r2.changed && r2.text === t);
  const r3 = T.indentLines(t, 0, t.length, 1);
  check("7b3: a selection across lines moves every list line it touches", r3.text === "  - a\n  - b\n  - c");
  check("7b4: a top-level line cannot go further out, so Shift+Tab there leaves the box",
    T.indentLines(t, 1, 1, -1).changed === false);
  check("7b5: a prose line cannot move, so Tab there leaves the box",
    T.indentLines("plain words", 3, 3, 1).changed === false);
  check("7b6: a line at the deepest level cannot go further in",
    T.indentLines("- a\n      - b", 10, 10, 1).changed === false);
}

// ── 7c. an emptied passage stays empty; Restore brings the house words back ─
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const house = T.textPlain(KEY);
  T.setText(KEY, "   \n\n  ");
  check("7c1: a passage saved with no words stays without words, and reads as customized (so Restore shows)",
    house.length > 0 && T.textPlain(KEY) === "" && T.textIsBlank(KEY) && T.textIsCustom(KEY) &&
    T.explainerTextHtml(KEY, {}) === "");
  T.setText(KEY, "", true);
  check("7c2: Restore the default text brings the house words back", T.textPlain(KEY) === house && !T.textIsCustom(KEY));
  // A save that matches the house words stores nothing, unless a layer beneath would then show other words.
  T._setShared({ text: { [KEY]: "The shared words." } });
  T.setText(KEY, house);
  check("7c3: a what-if save of the house words over other shared words keeps the house words",
    T.textPlain(KEY) === house && T._getScenario().text[KEY] === house);
}

// ── 7d. signed in, a save is what the tab shows, whatever this browser held ─
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ text: { [KEY]: "Old words from a what-if edit.", x_choices: "Another what-if passage." } });
  window.CPL_SESSION = session();
  T.render();
  T.setText(KEY, "New shared words.");
  check("7d1: the shared save shows, and this browser's what-if copy of that passage is gone",
    T.textPlain(KEY) === "New shared words." && T._getShared().text[KEY] === "New shared words." &&
    !Object.prototype.hasOwnProperty.call(T._getScenario().text || {}, KEY));
  check("7d2: the browser's what-if copies of other passages are left alone",
    (T._getScenario().text || {}).x_choices === "Another what-if passage.");
  T.setText(KEY, "");
  check("7d3: signed in, deleting every word saves an empty passage, which stays empty after the save",
    T.textPlain(KEY) === "" && T._getShared().text[KEY] === "__blank__");

  // The editor: Indent and Outdent on a rich passage, none on a plain one; Tab on a list line.
  T.setText(KEY, "", true);
  T.render();
  const edit = doc.querySelector('[data-textedit="' + KEY + '"]');
  edit.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const ta = doc.querySelector('[data-textarea="' + KEY + '"]');
  check("7d4: a rich passage's editor offers Indent and Outdent, and its hint names Tab",
    !!doc.querySelector('[data-textindent="1"][data-textfor="' + KEY + '"]') &&
    !!doc.querySelector('[data-textindent="-1"][data-textfor="' + KEY + '"]') &&
    /Indent, or Tab on a bulleted line/.test(ta.parentNode.textContent));
  ta.value = "- a\n- b";
  ta.setSelectionRange(6, 6);
  const tab = new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  ta.dispatchEvent(tab);
  check("7d5: Tab on a bulleted line indents it and keeps the focus in the box",
    ta.value === "- a\n  - b" && tab.defaultPrevented);
  ta.value = "plain words";
  ta.setSelectionRange(3, 3);
  const tab2 = new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  ta.dispatchEvent(tab2);
  check("7d6: Tab on prose is left alone, so the keyboard moves on", ta.value === "plain words" && !tab2.defaultPrevented);
  ta.value = "- a\n  - b";
  ta.setSelectionRange(9, 9);
  doc.querySelector('[data-textindent="-1"][data-textfor="' + KEY + '"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  check("7d7: Outdent moves the line back", ta.value === "- a\n- b");
}

// ── 7e. the public page paints an emptied passage empty ─────────────────────
{
  const dom = new JSDOM(pageHtml, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const win = dom.window;
  win.CPL_FUNDING_NO_REMOTE = true;
  win.scrollTo = function () {};
  win.eval(read("cpl_funding_data.js"));
  win.eval(read("funding_model_payload.js"));
  win.eval(read("cpl_funding.js"));
  Array.from(win.document.querySelectorAll("script:not([src])")).forEach(function (s) { win.eval(s.textContent); });
  const T = win.CPL_FUNDING_TAB;
  const box = win.document.querySelector('[data-ftext="' + KEY + '"]');
  const before = flat(box && box.textContent);
  T._setShared({ text: { [KEY]: "__blank__" } });
  T.render();
  check("7e1: a passage its curator emptied paints empty on the page, never the typed house words beneath it",
    before.length > 0 && flat(box.textContent) === "");
}

// ── 7f. the page's own editor saves the same way ────────────────────────────
check("7f1: the page editor's Restore passes the reset, so its Save of an empty passage stays empty",
  /T\.setText\(key, a\("data-pe-restore"\) != null \? "" : \(ta \? ta\.value : ""\), a\("data-pe-restore"\) != null\);/.test(editSrc));
check("7f2: the page editor offers Indent and Outdent on a rich passage, and Tab on a list line",
  /word\("Indent", \{ "data-pe-indent": "1"/.test(editSrc) && /word\("Outdent", \{ "data-pe-indent": "-1"/.test(editSrc) &&
  /T\.indentLines\(ta\.value, ta\.selectionStart, ta\.selectionEnd, e\.shiftKey \? -1 : 1, ta\)/.test(editSrc));

finish();
