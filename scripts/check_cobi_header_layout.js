/* ===========================================================================
   COBI masthead — real-layout check across the widths browser ZOOM produces
   ---------------------------------------------------------------------------
   Chromium, on demand. NOT in tests/ and NOT run by `npm test`, for the reason
   scripts/check_public_page_layout.js, check_memory_briefing_layout.js and
   check_funding_nc_row_layout.js already established: CI has jsdom only, jsdom
   has no layout engine, and adding a browser download to CI for a check it
   never runs is a cost with no return.

   WHY THIS EXISTS. Sam, 2026-09-04: "the header is all a mess when I zoom in
   or out, it gets messed up and ugly" — with a screenshot of the site switcher
   and the 🔒 control painted straight over the "Where To?" search box.

   ⚠️ EVERY jsdom TEST PASSED WHILE THAT WAS TRUE, AND THEY STILL WOULD.
   tests/cobi_brand.test.js asserts the CSS declares shrinkable tracks; it
   cannot assert the boxes do not intersect, because jsdom returns zeroes for
   every rectangle. The bug was ONLY ever visible as geometry:

     1. `.cobi-brand` was 580px of content in a 322px grid track, because
        `.cobi-orgswitch` is a flex item whose default min-width:auto refuses
        to shrink below min-content — so the cluster grew past its own track
        and painted over its neighbour. Nothing in the markup looks wrong.

     2. A bare `1fr` is minmax(AUTO,1fr), so the flexible track would not
        shrink either, and the row overflowed rather than wrapping.

     3. A non-stretch `justify-self` sizes a grid item to its own CONTENT, so
        `justify-self:start` re-introduces (1) even after the track is fixed.

   ZOOM IS A WIDTH SWEEP. Zooming does not resize the window; it changes how
   many CSS pixels fit inside it. So walking the widths below IS walking Sam's
   zoom range — 2560 covers zooming out on a wide display, 360 covers zooming
   well in.

   WHAT IT ASSERTS: the three masthead clusters never intersect, the header
   never scrolls sideways, and the alpha notice stays on its own full-width
   row. It deliberately does NOT assert on document-level horizontal overflow:
   below ~480px the KPI-card grid overflows (measured 797px at 480, identical
   before this change) and that is a separate, pre-existing lane — failing here
   for it would make this check useless for the header.

   Run:  PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
         node scripts/check_cobi_header_layout.js
   =========================================================================== */
const path = require("path");
const { chromium } = require("playwright");

const PAGE = path.resolve(__dirname, "..", "index.html");
const EXEC = process.env.PW_CHROMIUM || undefined;

// 2560 → zoomed out on a wide display; 360 → zoomed well in. 1180 and 1000 are
// the two breakpoints, and 1440/1280 are where Sam's screenshot was taken.
const WIDTHS = [2560, 1920, 1600, 1440, 1280, 1180, 1100, 1024, 1000, 900, 820, 768, 640, 560, 480, 400, 360];

const results = [];
function check(name, ok, detail) { results.push([name, !!ok, detail]); }

// >1px so sub-pixel rounding is not reported as an overlap.
function overlap(a, b) {
  if (!a || !b) return 0;
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const y = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return (x > 1 && y > 1) ? Math.round(x) : 0;
}

(async () => {
  const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
  const page = await browser.newPage();
  page.on("pageerror", () => { /* unrelated tab scripts may fail on file:// */ });

  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto("file://" + PAGE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(350);

    const m = await page.evaluate(() => {
      const box = (sel) => {
        const e = document.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      };
      const hdr = document.querySelector(".header");
      return {
        brand: box(".cobi-brand"), qs: box(".cobi-qs-slot"), util: box(".cobi-utility"),
        note: box(".cobi-alpha-note"),
        headerOverflow: hdr ? Math.round(hdr.scrollWidth - hdr.clientWidth) : -1,
        headerWidth: hdr ? Math.round(hdr.getBoundingClientRect().width) : -1,
      };
    });

    check(w + "px — brand and search do not intersect", overlap(m.brand, m.qs) === 0,
      overlap(m.brand, m.qs) + "px of overlap");
    check(w + "px — brand and the utility cluster do not intersect", overlap(m.brand, m.util) === 0,
      overlap(m.brand, m.util) + "px of overlap");
    check(w + "px — search and the utility cluster do not intersect", overlap(m.qs, m.util) === 0,
      overlap(m.qs, m.util) + "px of overlap");
    check(w + "px — the header itself never scrolls sideways", m.headerOverflow <= 0,
      m.headerOverflow + "px over");
    // Each cluster must stay INSIDE the header. This is the one that catches a
    // cluster sized to its own content rather than to its grid track — the
    // original defect — even if it happens not to land on a sibling.
    for (const [name, b] of [["brand", m.brand], ["search", m.qs], ["utility", m.util]]) {
      check(w + "px — the " + name + " cluster stays inside the header",
        !!b && b.x + b.width <= m.headerWidth + 1,
        b ? Math.round(b.x + b.width - m.headerWidth) + "px past the edge" : "missing");
    }
    if (m.note) {
      check(w + "px — the alpha notice keeps its own full-width row",
        m.note.width >= Math.min(m.headerWidth, w) * 0.5,
        Math.round(m.note.width) + "px wide");
    }
  }

  await browser.close();

  let failed = 0;
  for (const [name, ok, detail] of results) {
    if (!ok) { failed++; console.log("FAIL  " + name + (detail ? "  — " + detail : "")); }
  }
  console.log(failed === 0
    ? "All " + results.length + " checks passed across " + WIDTHS.length + " widths."
    : failed + " of " + results.length + " checks FAILED.");
  process.exit(failed === 0 ? 0 : 1);
})();
