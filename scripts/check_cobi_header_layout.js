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

   IT ALSO ASSERTS ACCESSIBILITY, for the same reason: contrast and target
   size are GEOMETRY AND PAINT, so jsdom cannot see them either. Sam asked for
   the masthead to be accessible and mobile friendly (2026-09-04) and the audit
   found seven real AA failures that every existing test passed straight over —
   six of them a control label or a data stamp painted in --text-faint, the
   token the palette itself marks "decorative only - never essential text", at
   3.53-3.62:1 against the 4.5:1 floor; the seventh a 19px-tall button under
   WCAG 2.2 SC 2.5.8's 24px. Three were in code written that same day, one of
   them immediately after a comment saying not to do it. Hence: measured, not
   asserted, with the panes OPEN and a credential held, because a closed pane
   hides most of the text in this header.

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

  // ── accessibility, measured on the painted page ──────────────────────────
  // Panes OPEN and a team phrase held: most of this header's text and every
  // one of its forms live inside a popover, and a closed popover is a check
  // that passes by not looking.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("file://" + PAGE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => { try { localStorage.setItem("cpl_team_pass", "x"); } catch (e) {} });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(() => { var b = document.querySelector(".cobi-ident-btn"); if (b) b.click(); });
  await page.waitForTimeout(150);
  await page.evaluate(() => { var b = document.getElementById("cobiAboutBtn"); if (b) b.click(); });
  await page.waitForTimeout(250);

  const a11y = await page.evaluate(() => {
    function parse(s) {
      var m = String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
    }
    // Composite the real stack: the masthead is glass over the page ground, so
    // treating its declared background as opaque overstates the contrast.
    function ground(el) {
      var st = [], e = el;
      while (e) { var c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) st.push(c); e = e.parentElement; }
      st.push([255, 255, 255, 1]);
      var out = st[st.length - 1].slice(0, 3);
      for (var i = st.length - 2; i >= 0; i--) {
        var s = st[i], a = s[3];
        out = [0, 1, 2].map(function (k) { return s[k] * a + out[k] * (1 - a); });
      }
      return out;
    }
    var hdr = document.querySelector(".header"), text = [], ctrls = [];
    Array.prototype.forEach.call(hdr.querySelectorAll("*"), function (el) {
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || !el.getClientRects().length) return;
      var direct = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (direct) text.push({ sel: el.tagName.toLowerCase() + "." + String(el.className || "").slice(0, 26),
        fg: parse(cs.color).slice(0, 3), bg: ground(el),
        px: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10),
        sample: (el.textContent || "").trim().slice(0, 30) });
      if (/^(button|a|select|input)$/.test(el.tagName.toLowerCase())) {
        var bb = el.getBoundingClientRect();
        var lbl = el.id && document.querySelector('label[for="' + el.id + '"]');
        var name = (el.getAttribute("aria-label") || (lbl && lbl.textContent) ||
          (el.closest("label") && el.closest("label").textContent) || el.textContent ||
          el.getAttribute("title") || "").trim();
        ctrls.push({ sel: el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + "." + String(el.className || "").slice(0, 26),
          name: name, w: Math.round(bb.width), h: Math.round(bb.height) });
      }
    });
    var focusRules = 0;
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules; try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
      for (var j = 0; rules && j < rules.length; j++) if (/focus-visible/.test(rules[j].cssText || "")) focusRules++;
    }
    return { text: text, ctrls: ctrls, focusRules: focusRules, h1: document.querySelectorAll("h1").length };
  });

  function lum(c) { var f = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; }
  function ratio(a, b) { var L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); }

  check("a11y — the audit actually saw the open panes", a11y.text.length >= 25 && a11y.ctrls.length >= 10,
    a11y.text.length + " text nodes, " + a11y.ctrls.length + " controls");
  a11y.text.forEach(function (t) {
    var cr = ratio(t.fg, t.bg);
    var large = t.px >= 24 || (t.px >= 18.66 && t.weight >= 700);
    var need = large ? 3.0 : 4.5;
    check("a11y contrast — " + t.sel + ' "' + t.sample + '"', cr >= need,
      cr.toFixed(2) + ":1, needs " + need + ":1 at " + t.px + "px/" + t.weight);
  });
  a11y.ctrls.forEach(function (c) {
    check("a11y name — " + c.sel, !!c.name, "no accessible name");
    // WCAG 2.2 AA SC 2.5.8: 24x24 CSS px minimum target.
    check("a11y target — " + c.sel, c.w >= 24 && c.h >= 24, c.w + "x" + c.h);
  });
  check("a11y — :focus-visible is styled", a11y.focusRules > 0);
  check("a11y — exactly one <h1> on the page", a11y.h1 === 1, String(a11y.h1));

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
