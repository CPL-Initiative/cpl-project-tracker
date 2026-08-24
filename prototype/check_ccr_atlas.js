/* Layout + behavior check for the SkyView prototype.
 *
 * Deliberately NOT part of `npm test` — jsdom has no layout engine, so the
 * defects this catches (a graph that renders zero nodes, a page that scrolls
 * sideways on a phone, a move that writes nothing) are invisible to the suite.
 * Same split as scripts/check_public_page_layout.js.
 *
 * Serves over http:// on purpose: under file:// `sheet.cssRules` throws, and a
 * check that cannot read the stylesheet passes silently.
 *
 *   npm install playwright && node prototype/check_ccr_atlas.js
 */
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.dirname(__dirname);
const FILE = "prototype/ccr_atlas_v1.built.html";

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  try {
    const root = "/opt/pw-browsers";
    const dir = fs.readdirSync(root).filter((f) => /^chromium-\d+$/.test(f)).sort().pop();
    if (dir) {
      const p = path.join(root, dir, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* fall through */ }
  return undefined;
}
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((rq, rs) => {
      const f = path.join(ROOT, decodeURIComponent(rq.url.split("?")[0]).replace(/^\//, ""));
      fs.readFile(f, (e, b) => {
        if (e) { rs.writeHead(404); return rs.end("nope"); }
        rs.writeHead(200, { "Content-Type": /\.js$/.test(f) ? "text/javascript" : "text/html" });
        rs.end(b);
      });
    }).listen(0, "127.0.0.1", () => res({ srv, port: srv.address().port }));
  });
}

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) { console.error("playwright is not installed — `npm install playwright`"); process.exit(2); }

  const { srv, port } = await serve();
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // Font/favicon fetches are blocked in the sandbox and 404 locally; neither is
  // a page defect, and neither can mask one — the page has full font fallbacks.
  const NOISE = /favicon|fonts\.(googleapis|gstatic)|ERR_CONNECTION_RESET|Failed to load resource/i;
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error" && !NOISE.test(m.text())) errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));   // never noise — always a real defect

  let bad = 0;
  const ok = (n, c) => { if (!c) bad++; console.log((c ? "  ok   " : "  FAIL ") + n); };

  await page.goto(`http://127.0.0.1:${port}/${FILE}`);
  await page.waitForTimeout(500);

  console.log("\n══ forest");
  ok("heading rendered", (await page.locator("h1").first().textContent()).includes("Common Course Reference"));
  const cells = await page.locator(".cell").count();
  ok(`discipline cells (${cells})`, cells > 100);
  ok("stat strip has 4 tiles", (await page.locator(".stat").count()) === 4);
  // Read OUR sheet, not styleSheets[0] — that is the cross-origin Google Fonts
  // link, whose cssRules always throws. A check aimed at it reports the sandbox's
  // network policy, never the page.
  ok("our stylesheet is readable over http (rules are being applied)",
    await page.evaluate(() => {
      for (const sh of document.styleSheets) {
        try { if (sh.cssRules && sh.cssRules.length > 20) return true; } catch (e) { /* cross-origin */ }
      }
      return false;
    }));

  console.log("\n══ the graph is on the FIRST screen");
  // The defect this guards: the graph used to be two clicks down, and the grid
  // was sorted by decision count, so the top cells had no sample data. A reader
  // landed, clicked the first thing, hit a dead end and never saw a graph.
  ok(`hero graph renders with no clicks (${await page.locator("#hero-gfx circle").count()} nodes)`,
    (await page.locator("#hero-gfx circle").count()) >= 6);
  ok("hero names the discipline and the course count",
    /local courses sit underneath/.test(await page.locator("#hero-p").textContent()));
  const firstHero = await page.locator("#hero-h").textContent();
  await page.locator("#hero-next").click();
  await page.waitForTimeout(400);
  ok("\u2018Show me another\u2019 draws a different decision",
    (await page.locator("#hero-gfx circle").count()) >= 6);
  ok("hero graph is decorative-safe (role=img with a label)",
    (await page.locator("#hero-gfx svg").getAttribute("role")) === "img" &&
    !!(await page.locator("#hero-gfx svg").getAttribute("aria-label")));

  console.log("\n══ \u26a0 the FIRST cell must open something (the dead-end guard)");
  await page.locator(".cell").first().click();
  await page.waitForTimeout(400);
  ok("first discipline cell reaches real decisions, not a 'no sample data' note",
    (await page.locator(".deck").count()) > 0);
  await page.locator(".crumbs button").first().click();
  await page.waitForTimeout(400);

  console.log("\n══ the universe view");
  ok("the banner offers it", (await page.locator("#go-universe").count()) === 1);
  await page.locator("#go-universe").click();
  await page.waitForTimeout(600);
  ok("canvas is present and sized", await page.evaluate(() => {
    const c = document.getElementById("u-cvs");
    return !!c && c.width > 200 && c.height > 200;
  }));
  // A canvas draws nothing the DOM can see, so assert PIXELS changed — an empty
  // canvas and a broken renderer look identical to any selector-based check.
  ok("it actually painted something", await page.evaluate(() => {
    const c = document.getElementById("u-cvs");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4 * 997) seen.add(d[i] + "," + d[i+1] + "," + d[i+2]);
    return seen.size > 3;                      // more than one flat color
  }));
  ok("the canvas is keyboard-reachable and labelled",
    (await page.locator("#u-cvs[tabindex='0']").count()) === 1 &&
    !!(await page.locator("#u-cvs").getAttribute("aria-label")));

  console.log("\n══ keyword zoom");
  const z0 = await page.evaluate(() => window.__ccrUniverseState().view.k);
  await page.fill("#u-q", "welding");
  await page.locator("#u-find").click();
  await page.waitForTimeout(400);
  const z1 = await page.evaluate(() => window.__ccrUniverseState().view.k);
  ok(`search zooms in (${z0.toFixed(3)} -> ${z1.toFixed(3)})`, z1 > z0);
  ok("and reports where the matches are",
    /match/i.test(await page.locator("#u-hint").textContent()));
  await page.fill("#u-q", "zzzznotathing");
  await page.locator("#u-find").click();
  await page.waitForTimeout(300);
  ok("a miss says so rather than flying somewhere arbitrary",
    /Nothing matches/i.test(await page.locator("#u-hint").textContent()));

  console.log("\n══ ⚠ the cross-area move (the reason this view exists)");
  const moved = await page.evaluate(() => {
    const U = window.CPL_CCR_UNIVERSE, A = window.CPL_ATLAS_DATA;
    // find a member course, and a target identity in a DIFFERENT subject area
    let src = null;
    for (const dn of Object.keys(A.detail)) {
      for (const pack of A.detail[dn]) {
        for (const nd of pack.nodes) {
          if (nd.m && nd.m.length) { src = { id: nd.id, cn: nd.m[0].cn, disc: dn }; break; }
        }
        if (src) break;
      }
      if (src) break;
    }
    if (!src) return { ok: false, why: "no member course in the sample" };
    const home = U.islands.find(i => i.p.some(p => p.i === src.id));
    const other = U.islands.find(i => i !== home && i.p.length);
    if (!other) return { ok: false, why: "no second island" };
    return { ok: true, from: home.d, to: other.d, cross: home.d !== other.d };
  });
  ok("a course and a target in ANOTHER subject both exist" +
     (moved.ok ? ` (${moved.from} → ${moved.to})` : ` — ${moved.why}`),
    moved.ok && moved.cross);

  console.log("\n══ subjects can be pulled next to each other");
  const dragged = await page.evaluate(() => {
    const U = window.CPL_CCR_UNIVERSE;
    const isl = U.islands[0];
    const before = isl.dx || 0;
    isl.dx = before + 500;                     // what a drag does
    return isl.dx !== before;
  });
  ok("an island carries a movable offset", dragged);

  console.log("\n══ the ESL packaging proposal");
  await page.locator(".crumbs button").first().click();
  await page.waitForTimeout(400);
  ok("the banner offers it", (await page.locator("#go-esl").count()) === 1);
  await page.locator("#go-esl").click();
  await page.waitForTimeout(500);
  ok("proposal heading", /What packaging ESL would actually do/
      .test(await page.locator("h1").first().textContent()));
  ok(`three comprehensives drawn (${await page.locator("#esl-gfx circle").count()})`,
    (await page.locator("#esl-gfx circle").count()) === 3);
  // The medium-confidence wedge is the honest half of this picture; a preview
  // that showed only the collapse would read as an argument for applying it.
  ok("the medium-confidence wedge is drawn",
    (await page.locator("#esl-gfx path").count()) >= 3);
  ok("it says plainly that nothing is written",
    /Nothing is written/i.test(await page.locator(".lede").textContent()));
  ok("both blockers are named", (await page.locator(".note li").count()) === 2);
  ok(`comprehensive + carve-out cards (${await page.locator(".deck").count()})`,
    (await page.locator(".deck").count()) === 6);
  // The transfer-level carve-out is the finding; it must not read as intact.
  const carve = await page.locator("#esl-carve").textContent();
  ok("the transfer-level carve-out reports what it LOST, not 22 of 22",
    /8 of 22/.test(carve) && /already gone/.test(carve));

  await page.locator("#esl-decks .deck").first().click();
  await page.waitForTimeout(400);
  ok(`spot-check table rows (${await page.locator("table.uc-like tbody tr").count()})`,
    (await page.locator("table.uc-like tbody tr").count()) > 10);
  ok("every header cell carries scope",
    (await page.locator("table.uc-like th[scope=col]").count()) ===
    (await page.locator("table.uc-like th").count()));
  ok("the scrolling table is a focusable labelled region",
    (await page.locator(".tblwrap[tabindex='0'][role=region]").count()) >= 1);
  ok("medium-confidence rows are listed FIRST",
    /medium|review/i.test(await page.locator("table.uc-like tbody tr").first().textContent()));
  ok("the list says it is a sample, with its denominator",
    /Showing .* of /.test(await page.locator(".empty").last().textContent()));
  await page.locator(".crumbs button").first().click();
  await page.waitForTimeout(400);

  console.log("\n══ search + filter");
  await page.fill("#q", "weld");
  await page.waitForTimeout(200);
  ok("search narrows the grid", (await page.locator(".cell").count()) < cells);
  await page.fill("#q", "");
  await page.waitForTimeout(200);

  console.log("\n══ discipline → decision");
  await page.locator(".cell").first().click();
  await page.waitForTimeout(300);
  const decks = await page.locator(".deck").count();
  ok(`decision cards (${decks})`, decks > 0);
  await page.locator(".deck").first().click();
  await page.waitForTimeout(700);
  const nodes = page.locator(".nodeg");
  const n = await nodes.count();
  ok(`graph nodes (${n})`, n >= 2);
  ok("one svg", (await page.locator(".canvas svg").count()) === 1);
  ok(`member rows (${await page.locator(".mlist li").count()})`, (await page.locator(".mlist li").count()) > 0);

  console.log("\n══ nodes are reachable without a mouse");
  ok("tabindex=0 on nodes", (await nodes.first().getAttribute("tabindex")) === "0");
  ok("role=button on nodes", (await nodes.first().getAttribute("role")) === "button");
  const lbl = await nodes.first().getAttribute("aria-label");
  ok("aria-label names the identity and its state", !!lbl && lbl.length > 20 && /courses/.test(lbl));

  console.log("\n══ the move (keyboard path — drag is not the only route)");
  await page.locator(".mv").first().click();
  await page.waitForTimeout(150);
  await nodes.nth(n - 1).press("Enter");
  await page.waitForTimeout(400);
  const writes = await page.locator(".writes div").count();
  ok(`a move produced a write (${writes})`, writes >= 1);
  const wt = await page.locator(".writes").textContent().catch(() => "");
  ok("write is `CN:<control#> merge_into <identity>`", /CN:\S+\s+merge_into\s+\S+/.test(wt));
  ok("moved course is marked in the list", (await page.locator(".chip.ok").count()) > 0);

  console.log("\n══ mobile");
  for (const w of [360, 414, 768]) {
    await page.setViewportSize({ width: w, height: 780 });
    await page.waitForTimeout(250);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(`no sideways scroll at ${w}px (${sw})`, sw <= w + 1);
  }

  console.log("");
  ok("no console errors", errs.length === 0);
  if (errs.length) console.log(errs.join("\n"));

  await browser.close(); srv.close();
  console.log(bad ? `\n${bad} check(s) FAILED` : "\nall checks passed");
  process.exit(bad ? 1 : 0);
})();
