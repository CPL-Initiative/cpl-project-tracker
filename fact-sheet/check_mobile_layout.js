/* ===========================================================================
   Fact Sheet — real-layout accessibility + mobile check (Chromium, on demand)
   ---------------------------------------------------------------------------
   NOT in tests/ and NOT run by `npm test`, deliberately: it needs a browser,
   and CI has jsdom only. jsdom has no layout engine — it cannot tell you that
   a grid column is 31px wider than the phone it is on. So the structural
   invariants live in tests/factsheet_a11y.test.js and the GEOMETRY lives here.

   This is the script that found the 2026-08-20 defects, and the reason the
   pair is split this way: every one of them was invisible to static analysis.
   At a 360px viewport the statewide row overflowed by 31px, its program-area
   column collapsed to nothing so "Construction Technology" painted ON TOP of
   its own Exhibits figure, and "Could adopt" sat entirely off-screen inside
   `.sw-grid details{overflow:hidden}` — unreachable by any gesture, on a page
   that looked complete. A silently clipped column is worse than a broken one.

   What it measures:
     · horizontal overflow of the document at nine viewport widths
     · any element whose box escapes the viewport (the culprit list)
     · whether the statewide row is clipped, and whether its last column is
       actually on screen
     · TRUE 2-D intersection of the program name and the first figure. A
       horizontal-only test is a false positive once the row stacks — they
       share x and never y — and that false positive cost a debugging round.
     · the .tbl-wrap scroll region: focusable exactly while it overflows
     · the skip link: first tab stop, visible on focus, moves focus into <main>
     · prefers-reduced-motion actually stops the live-chip pulse

   Usage:
     node fact-sheet/check_mobile_layout.js            # measure, exit 1 on a defect
     node fact-sheet/check_mobile_layout.js --shots DIR  # also write screenshots

   Exits non-zero if any viewport reports a defect, so it can gate a release by
   hand. Requires playwright + a Chromium; in the sandbox that is
   the newest `chromium-<build>` under /opt/pw-browsers (set PLAYWRIGHT_CHROMIUM
   to override). Note the glob is spelled out rather than written literally —
   an asterisk-slash inside a block comment ends the comment. Screenshots are how the OTHER half gets checked: the heading
   re-levelling in this same pass silently dropped the Contents heading to the
   browser's default 2em, and no assertion caught it — a before/after pixel diff
   did. If you change presentation here, shoot before and after and diff.
   =========================================================================== */
const path = require("path");
const fs = require("fs");

const WIDTHS = [320, 360, 390, 430, 560, 561, 768, 1024, 1440];
const PAGE = "file://" + path.resolve(__dirname, "index.html");

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  const root = "/opt/pw-browsers";
  try {
    const dir = fs.readdirSync(root).filter((f) => /^chromium-\d+$/.test(f)).sort().pop();
    if (dir) {
      const p = path.join(root, dir, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* fall through to playwright's own download */ }
  return undefined;
}

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) {
    console.error("playwright is not installed — `npm install playwright` (this check is not part of `npm test`).");
    process.exit(2);
  }
  const shotsAt = process.argv.indexOf("--shots");
  const shotDir = shotsAt !== -1 ? process.argv[shotsAt + 1] : null;
  if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let bad = 0;

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(PAGE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const r = await page.evaluate(() => {
      const de = document.documentElement, vw = de.clientWidth;
      const escapes = [];
      document.querySelectorAll("body *").forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) return;
        if (el.closest(".tbl-wrap")) return;          // legitimately inside a scroll container
        if (el.closest(".skip-link, .sr-only")) return;
        if (b.right > vw + 1 || b.left < -1) {
          escapes.push(el.tagName.toLowerCase() +
            (el.id ? "#" + el.id : "") +
            (typeof el.className === "string" && el.className.trim()
              ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "") +
            " right=" + Math.round(b.right));
        }
      });
      const summary = document.querySelector(".sw-grid details summary");
      const sec = summary && summary.querySelector(".sw-sec");
      const ex = summary && summary.querySelector('.sw-col[data-col="ex"]');
      const could = summary && summary.querySelector('.sw-col[data-col="could"]');
      // TRUE 2-D intersection — sharing an x range is not an overlap once the
      // row stacks, because the name is on row 1 and the figures on row 2.
      let overlap = null;
      if (sec && ex) {
        const a = sec.getBoundingClientRect(), b = ex.getBoundingClientRect();
        overlap = !(a.right <= b.left + 1 || b.right <= a.left + 1 ||
                    a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
      }
      const wrap = document.querySelector(".tbl-wrap");
      return {
        overflow: de.scrollWidth - de.clientWidth,
        escapes: escapes.slice(0, 5),
        clipped: summary ? summary.scrollWidth > summary.clientWidth + 1 : null,
        lastColOnScreen: could ? could.getBoundingClientRect().right <= vw + 1 : null,
        overlap,
        wrapScrolls: wrap ? wrap.scrollWidth > wrap.clientWidth + 1 : null,
        wrapTabindex: wrap ? wrap.getAttribute("tabindex") : null,
        wrapLabel: wrap ? wrap.getAttribute("aria-label") : null,
      };
    });

    const problems = [];
    if (r.overflow > 0) problems.push(`page scrolls sideways by ${r.overflow}px`);
    if (r.escapes.length) problems.push(`${r.escapes.length} element(s) escape the viewport`);
    if (r.clipped) problems.push("statewide row is clipped");
    if (r.lastColOnScreen === false) problems.push('"Could adopt" is off-screen');
    if (r.overlap) problems.push("program name overlaps its figure");
    // focusable exactly while it overflows — neither unreachable nor a dead tab stop
    if (r.wrapScrolls && r.wrapTabindex !== "0") problems.push("scrolling .tbl-wrap is not keyboard reachable");
    if (r.wrapScrolls && !r.wrapLabel) problems.push("scrolling .tbl-wrap has no accessible name");
    if (r.wrapScrolls === false && r.wrapTabindex === "0") problems.push(".tbl-wrap is a dead tab stop");

    console.log(`${String(width).padStart(5)}px  ${problems.length ? "FAIL  " + problems.join("; ") : "ok"}`);
    if (r.escapes.length) console.log(`          ${r.escapes.join(" | ")}`);
    if (problems.length) bad++;

    if (shotDir) {
      await page.evaluate(() => document.querySelector("#statewide-exhibits").scrollIntoView());
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(shotDir, `w${width}-statewide.png`) });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(shotDir, `w${width}-top.png`) });
    }
    await page.close();
  }

  // ── keyboard: the skip link, end to end ──
  const kb = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await kb.goto(PAGE, { waitUntil: "domcontentloaded" });
  await kb.waitForTimeout(300);
  await kb.keyboard.press("Tab");
  const first = await kb.evaluate(() => {
    const a = document.activeElement, b = a.getBoundingClientRect();
    return { skip: a.classList.contains("skip-link"), visible: b.top >= 0 };
  });
  await kb.keyboard.press("Enter");
  await kb.waitForTimeout(150);
  const landed = await kb.evaluate(() => document.activeElement.id === "main-content");
  const kbOk = first.skip && first.visible && landed;
  console.log(`  keyboard  ${kbOk ? "ok" : "FAIL"}  skip link is first tab stop=${first.skip}, visible on focus=${first.visible}, Enter lands in <main>=${landed}`);
  if (!kbOk) bad++;
  await kb.close();

  // ── reduced motion ──
  const rm = await browser.newPage({ viewport: { width: 1024, height: 900 }, reducedMotion: "reduce" });
  await rm.goto(PAGE, { waitUntil: "domcontentloaded" });
  await rm.waitForTimeout(300);
  const anim = await rm.evaluate(() => {
    const dot = document.querySelector(".live-chip .dot");
    return dot ? getComputedStyle(dot).animationName : "none";
  });
  const rmOk = anim === "none";
  console.log(`  motion    ${rmOk ? "ok" : "FAIL"}  live-chip pulse under prefers-reduced-motion = ${anim}`);
  if (!rmOk) bad++;
  await rm.close();

  await browser.close();
  console.log(bad ? `\n${bad} viewport/check FAILED` : `\nAll ${WIDTHS.length} viewports + keyboard + motion checks pass.`);
  process.exit(bad ? 1 : 0);
})();
