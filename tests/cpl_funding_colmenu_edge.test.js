/* cpl_funding_colmenu_edge.test.js — the Columns menu opens ON the screen.
 *
 * S351, the funding explainer's first UI pass: `npm run a11y -- funding-model`
 * failed at 560 and 561px with div.cplfund-colmenu-panel right=614. The panel
 * hangs from its summary's left edge, and at those widths the toolbar sets
 * Columns far enough right that the open panel ran 53px past the viewport and
 * the page scrolled sideways. Nothing is broken at 390 (Columns sits at the
 * left) or at 1440 (room to spare), which is why no fixed rule fits every width.
 *
 * What must hold:
 *   1. Where the left-hung panel would pass the edge and a right-hung one fits,
 *      the menu takes .cplfund-colmenu-end (the panel hangs from the right).
 *   2. Where the left-hung panel fits, it stays left-hung.
 *   3. Where neither fits (Columns at the left of a very narrow screen), it
 *      stays left-hung: a right-hung panel would leave by the other edge.
 *   4. A resize places it again, both ways, and so does opening it.
 *   5. The resize listener does not stack across renders.
 *
 * jsdom lays nothing out, so the rectangles are stubbed per scenario; the
 * geometry itself is measured in Chromium by `npm run a11y -- funding-model`
 * (clean at all nine widths after the fix).
 *
 * Run from repo root: `npm test` (or `node tests/cpl_funding_colmenu_edge.test.js`).
 */
const fs = require("fs");
const path = require("path");
const { check, freshDom, boot, finish } = require("./lib/cpl_funding_harness.js");

const dom = freshDom();
const window = dom.window;

// Count live "resize" listeners on the window, so a render that adds one
// without removing the last shows as growth.
const live = new Set();
const add = window.addEventListener.bind(window);
const remove = window.removeEventListener.bind(window);
window.addEventListener = function (type, fn, opts) { if (type === "resize") live.add(fn); return add(type, fn, opts); };
window.removeEventListener = function (type, fn, opts) { if (type === "resize") live.delete(fn); return remove(type, fn, opts); };

// The scenario the stubbed layout reports: viewport width, the summary's box,
// and the panel's width when hung from the summary's left edge.
let S = null;
const rect = (left, right) => ({ left, right, width: right - left, top: 0, bottom: 24, height: 24, x: left, y: 0 });
window.HTMLElement.prototype.getBoundingClientRect = function () {
  if (!S) return rect(0, 0);
  if (this.matches && this.matches(".cplfund-colmenu > summary")) return rect(S.sumL, S.sumR);
  if (this.classList && this.classList.contains("cplfund-colmenu-panel")) return rect(S.sumL, S.sumL + S.panW);
  return rect(0, 0);
};

const doc = boot(window);
Object.defineProperty(doc.documentElement, "clientWidth", { configurable: true, get: () => (S ? S.vw : 0) });

const menu = () => doc.querySelector(".cplfund-colmenu");
const isEnd = () => !!menu() && menu().classList.contains("cplfund-colmenu-end");
const resizeTo = (scen) => { S = scen; window.dispatchEvent(new window.Event("resize")); };

// The explainer's geometry, measured in Chromium (S351).
const AT_560 = { vw: 560, sumL: 383, sumR: 445, panW: 231 };     // left-hung right = 614
const AT_1440 = { vw: 1440, sumL: 917, sumR: 979, panW: 231 };   // fits
const AT_390 = { vw: 390, sumL: 16, sumR: 78, panW: 231 };       // Columns at the left: fits
const TOO_NARROW = { vw: 200, sumL: 16, sumR: 78, panW: 231 };   // neither fits

check("the Columns menu exists", !!menu());
check("with no layout yet it is left-hung (nothing measured, nothing moved)", !isEnd());

// 1, 2, 3, and 4 by resize, both ways
resizeTo(AT_560);
check("560px: the left-hung panel would pass the edge, so it hangs from the right", isEnd());
resizeTo(AT_1440);
check("1440px: it fits left-hung, and a resize takes the right hang off again", !isEnd());
resizeTo(AT_390);
check("390px: Columns sits at the left and the panel fits left-hung", !isEnd());
resizeTo(TOO_NARROW);
check("200px: neither hang fits, so it stays left-hung (a right hang leaves by the left edge)", !isEnd());

// 4 by opening: the layout changes with no resize (a browser that lays out a
// shut <details> only once it opens), and opening places it.
S = AT_560;
check("before it opens, nothing has re-measured", !isEnd());
menu().open = true;
menu().dispatchEvent(new window.Event("toggle"));
check("opening it places it: hung from the right at 560px", isEnd());
menu().open = false;

// 5. the resize listener does not stack
const T = window.CPL_FUNDING_TAB;
const before = live.size;
T.render(); T.render(); T.render();
check("three renders leave the live resize listeners where they were (" + before + " -> " + live.size + ")",
  live.size === before);
resizeTo(AT_1440);
resizeTo(AT_560);
check("...and the menu each render draws is still placed on resize", isEnd());

const src = fs.readFileSync(path.join(__dirname, "..", "cpl_funding.js"), "utf8");
check("the teardown removes the resize listener by name",
  /removeEventListener\("resize", place\)/.test(src));
check("the right hang is a rule on the menu class, not a style written per element",
  /"\.cplfund-colmenu\.cplfund-colmenu-end > \.cplfund-colmenu-panel \{ left: auto; right: 0; \}"/.test(src));

finish();
