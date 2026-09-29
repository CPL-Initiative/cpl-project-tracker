/* cpl_funding_colmenu_dismiss.test.js — the Columns menu can be PUT AWAY.
 *
 * Sam, 2026-09-15, looking at the public funding explainer:
 *   "Notice how the column selector drop down stays up after opening — not
 *    sure how to close it."
 *
 * ⚠️ WHY A BARE <details> IS NOT ENOUGH, AND WHY NOBODY NOTICED FOR WEEKS.
 * The menu is a native <details>, which closes on exactly one gesture: another
 * click on its own <summary>. That is not where a reader's hand goes. They
 * click Columns, read the list, click the table — and the panel stays up,
 * floating over the rows it was opened to reveal, with nothing on screen
 * saying how to dismiss it. The control WORKS; it just never goes away. A
 * DOM test asserting the checkboxes toggle columns passes either way, which is
 * why the report came from a person rather than a suite.
 *
 * What must hold, all three at once:
 *   1. A toggle keeps it OPEN. Hiding two columns in one visit is the normal
 *      case, and a menu that closed on every checkbox would be worse than one
 *      that never closes. This is the behavior the fix must not break.
 *   2. A click OUTSIDE closes it.
 *   3. Escape closes it and returns focus to the summary — the summary IS the
 *      button, so sending focus to the top of the document would strand a
 *      keyboard reader away from the control they just used.
 *
 * And one thing that is not visible from any single interaction:
 *   4. The listeners do not STACK. The mount is rewritten whole on every
 *      render, and an edit or a column toggle triggers one. A document-level
 *      listener registered per render with no teardown would accumulate one
 *      deep per render for the life of the visit, each holding a dead panel.
 *
 * Verified in Chromium as well as here (2026-09-15): open, toggle (stays
 * open), outside click (closes), Escape (closes, focus restored), three
 * re-renders, outside click still closes.
 *
 * Run from repo root: `npm test` (or `node tests/cpl_funding_colmenu_dismiss.test.js`).
 */
const { check, freshDom, boot, click, finish } = require("./lib/cpl_funding_harness.js");

const dom = freshDom();
const window = dom.window;
const doc = boot(window);

const menu = () => doc.querySelector(".cplfund-colmenu");
const summary = () => doc.querySelector(".cplfund-colmenu > summary");

// jsdom implements <details>.open as a property over the attribute but does NOT
// run the UA's click-to-toggle behavior, so the summary click is followed by
// the toggle the browser would have done. Everything AFTER that point is our
// own code, which is what this suite is about.
function openMenu() {
  const s = summary();
  if (!s) return false;
  click(window, s);
  menu().open = true;
  return true;
}
function outsideClick() {
  // mousedown, capture phase — the same event the dismissal listens for. The
  // target is a real element outside the menu, not the document, because
  // `menu.contains(e.target)` is the whole test.
  const h2 = doc.querySelector("h2") || doc.body;
  h2.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true }));
}
function pressEscape() {
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
}

check("the Columns menu exists and starts closed", !!menu() && menu().open === false);
check("its summary is the control, and it is a WORD",
  !!summary() && /^Columns$/.test(summary().textContent.trim()));

// ── 1. a column toggle must NOT close it ─────────────────────────────────
{
  openMenu();
  check("it opens", menu().open === true);
  const cb = doc.querySelector('.cplfund-colmenu input[data-colkey="district"]');
  check("the menu lists a hideable column", !!cb);
  if (cb) {
    cb.checked = !cb.checked;
    cb.dispatchEvent(new window.Event("change", { bubbles: true }));
  }
  check("toggling a column leaves the menu OPEN — several columns in one visit",
    !!menu() && menu().open === true);
}

// ── 2. a click outside closes it ─────────────────────────────────────────
{
  if (!menu().open) openMenu();
  outsideClick();
  check("a click outside the menu closes it", menu().open === false);
}

// ── 3. a click INSIDE does not ───────────────────────────────────────────
{
  openMenu();
  const panel = doc.querySelector(".cplfund-colmenu-panel");
  check("the panel is reachable", !!panel);
  if (panel) panel.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true }));
  check("a click inside the panel leaves it open", menu().open === true);
}

// ── 4. Escape closes it, and focus comes back to the control ─────────────
{
  if (!menu().open) openMenu();
  summary().focus();
  pressEscape();
  check("Escape closes the menu", menu().open === false);
  check("...and focus returns to the summary, which IS the button",
    doc.activeElement === summary());
  // A key that is not Escape must do nothing — a handler that closed on any
  // keystroke would shut the menu the moment a reader tabbed through it.
  openMenu();
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "a", bubbles: true }));
  check("any other key leaves it alone", menu().open === true);
}

// ── 5. the listeners do not stack across renders ─────────────────────────
{
  const T = window.CPL_FUNDING_TAB;
  T.render(); T.render(); T.render();
  check("after three re-renders the menu is still there, closed",
    !!menu() && menu().open === false);
  openMenu();
  outsideClick();
  check("...and outside-click still closes exactly one menu", menu().open === false);
  // The teardown is what keeps render count and listener count apart. Assert on
  // the mechanism by name: a future edit that drops it passes every behavior
  // check above (one live panel behaves the same however many dead listeners
  // watch it) and leaks one listener per render.
  const src = require("fs").readFileSync(
    require("path").join(__dirname, "..", "cpl_funding.js"), "utf8");
  check("each render removes the previous render's listeners",
    /COLMENU_OFF\.forEach\(function \(off\) \{ off\(\); \}\)/.test(src) &&
    /removeEventListener\("mousedown", onDown, true\)/.test(src) &&
    /removeEventListener\("keydown", onKey, true\)/.test(src));
}

finish();
