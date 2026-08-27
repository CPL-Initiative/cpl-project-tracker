/* ===========================================================================
   Implementation Funding — the Option A NONCREDIT row: real-layout check
   ---------------------------------------------------------------------------
   Chromium, on demand. NOT in tests/ and NOT run by `npm test`, for the reason
   scripts/check_public_page_layout.js and check_memory_briefing_layout.js
   already established: CI has jsdom only, jsdom has no layout engine, and
   adding playwright to package.json would make CI download a browser for a
   check it never runs.

   tests/cpl_funding_nc_lane.test.js covers the STRUCTURE — that the NC row
   exists, that it carries the same number of cells as the credit row, that its
   chips are the words CR/NC, that its cells read "no feed". Four claims survive
   that suite untested, and every one of them is the kind that looks right in
   the markup:

     1. THE ROW DOES NOT WIDEN THE TABLE. Sam's standing rule is no horizontal
        scroll at desktop widths. A cell count matching proves the row has the
        right NUMBER of cells, not that its CONTENT fits the widths the credit
        row set. A too-wide NC cell pushes the whole table sideways and jsdom,
        which measures nothing, reports it as passing.

     2. THE CELLS ACTUALLY LINE UP UNDER THEIR CREDIT COUNTERPARTS. The whole
        point of Option A over inline lines is that Tgt/Now read DOWN a column.
        Column identity is a layout fact; matching indices is not.

     3. THE ROW IS DISTINGUISHABLE WITHOUT COLOR. The tint is deliberately not
        the signal (First Light: color is never the only signal), so the check
        is that the CR/NC words are actually painted and large enough to read —
        measured, not asserted from the CSS.

     4. IT SURVIVES A NARROW VIEWPORT. The wide table scrolls inside its own
        container; the BODY must never scroll sideways.

   Run:  PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
         node scripts/check_funding_nc_row_layout.js
   =========================================================================== */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const REPO = path.join(__dirname, "..");
const PORT = 8751;

// ⚠️ The real palette, lifted out of the dashboard — NOT a hand-written copy.
// This check compares two BORDER TOKENS against each other, so a stand-in
// palette does not merely look different: it silently answers the question with
// values the product does not use. The first version of this file invented
// `--border-strong` and omitted `--border` entirely, and the comparison read
// both borders as opaque.
function rootTokens() {
  const html = fs.readFileSync(path.join(REPO, "CPL_Dashboard.html"), "utf8");
  const m = /:root\s*\{/.exec(html);
  if (!m) throw new Error("no :root block in CPL_Dashboard.html");
  let depth = 1, j = m.index + m[0].length;
  while (depth && j < html.length) {
    if (html[j] === "{") depth++;
    else if (html[j] === "}") depth--;
    j++;
  }
  return html.slice(m.index, j);
}
const results = [];
const check = (name, ok, detail) => results.push([name, !!ok, detail || ""]);

function serve() {
  const srv = http.createServer((req, res) => {
    const url = decodeURIComponent(String(req.url).split("?")[0]);
    if (url === "/" || url === "/harness") {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          ${rootTokens()}
          body{margin:0;font-family:system-ui,sans-serif;background:#F4F2ED;}
          .main-container{padding:12px;}
        </style></head>
        <body><div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">
        <div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>
        <div id="cplFundingMount">placeholder</div>
        </div></div>
        <script>window.CPL_FUNDING_NO_REMOTE = true;</script>
        <script src="/cpl_funding_data.js"></script>
        <script src="/cpl_funding_performance.js"></script>
        <script src="/cpl_funding.js"></script>
        <script>window.CPL_FUNDING_TAB.boot();</script>
        </body></html>`);
    }
    let buf = null;
    try { buf = fs.readFileSync(path.join(REPO, url.replace(/^\//, ""))); }
    catch (e) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": url.endsWith(".js") ? "text/javascript" : "text/plain" });
    res.end(buf);
  });
  return new Promise((r) => srv.listen(PORT, () => r(srv)));
}

(async () => {
  const srv = await serve();
  const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
  const browser = await chromium.launch(launch);
  try {
    const pg = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await pg.goto(`http://127.0.0.1:${PORT}/harness`, { waitUntil: "networkidle" });
    await pg.waitForSelector("tr.cplfund-ncrow", { timeout: 15000 });

    const m = await pg.evaluate(() => {
      const ncRow = document.querySelector("tr.cplfund-ncrow");
      const crRow = ncRow.previousElementSibling;
      const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, w: r.width, h: r.height }; };
      const cellsOf = (tr) => Array.from(tr.children).map(box);
      const chip = ncRow.querySelector(".cf-lanechip");
      const cs = chip ? getComputedStyle(chip) : null;
      const wrap = document.querySelector(".cplfund-table") &&
        document.querySelector(".cplfund-table").closest("div");
      return {
        ncCells: cellsOf(ncRow), crCells: cellsOf(crRow),
        crIsRow: crRow.classList.contains("cplfund-row"),
        chipText: chip ? chip.textContent.trim() : null,
        chipFont: cs ? parseFloat(cs.fontSize) : 0,
        chipBox: chip ? box(chip) : null,
        bodyScrollW: document.body.scrollWidth,
        bodyClientW: document.body.clientWidth,
        wrapScrollW: wrap ? wrap.scrollWidth : 0,
        wrapClientW: wrap ? wrap.clientWidth : 0,
        ncRowH: box(ncRow).h,
        nNc: document.querySelectorAll("tr.cplfund-ncrow").length,
      };
    });

    check("1: the NC row sits DIRECTLY under its credit row", m.crIsRow);
    check("2: the page body does not scroll sideways at 1440px",
      m.bodyScrollW <= m.bodyClientW + 1, `body ${m.bodyScrollW} vs ${m.bodyClientW}`);
    const aligned = m.ncCells.length === m.crCells.length &&
      m.ncCells.every((c, i) => Math.abs(c.x - m.crCells[i].x) < 1 && Math.abs(c.w - m.crCells[i].w) < 1);
    check("3: every NC cell lines up under its credit counterpart (Tgt/Now read DOWN the column)",
      aligned, `${m.ncCells.length} cells`);
    check("4: the NC row is visibly rendered (non-zero height)", m.ncRowH > 8, `${m.ncRowH}px`);
    check("5: the lane chip paints the WORD, not color alone", /^(CR|NC)$/.test(m.chipText || ""), m.chipText);
    check("6: and the chip is large enough to read", m.chipFont >= 9, `${m.chipFont}px`);
    check("7: an NC row exists for more than one college", m.nNc > 1, `${m.nNc} rows`);

    // The pair must GROUP: the rule between two institutions has to be heavier
    // than the rule inside one institution's CR/NC pair. Inverting these (which
    // is what "underline the CR row" literally asks for) makes a noncredit row
    // read as a separate college. Computed alpha, because both are rgba tokens
    // over the same background and a string compare would pass on any change.
    const rules = await pg.evaluate(() => {
      const nc = document.querySelector("tr.cplfund-ncrow");
      const cr = nc.previousElementSibling;
      const alpha = (c) => {
        const m = /rgba?\(([^)]+)\)/.exec(c || "");
        if (!m) return 1;
        const p = m[1].split(",").map((x) => parseFloat(x));
        return p.length > 3 ? p[3] : 1;
      };
      return {
        withinPair: alpha(getComputedStyle(nc.children[0]).borderTopColor),
        betweenInstitutions: alpha(getComputedStyle(cr.children[0]).borderTopColor),
      };
    });
    check("10: the rule BETWEEN institutions is heavier than the rule INSIDE a CR/NC pair, so the pair groups",
      rules.betweenInstitutions > rules.withinPair,
      `between ${rules.betweenInstitutions} vs within ${rules.withinPair}`);

    // Narrow viewport: the wide table scrolls inside its own container, the body never does.
    await pg.setViewportSize({ width: 390, height: 900 });
    await pg.waitForTimeout(250);
    const n = await pg.evaluate(() => ({
      bodyScrollW: document.body.scrollWidth, bodyClientW: document.body.clientWidth,
      nNc: document.querySelectorAll("tr.cplfund-ncrow").length,
    }));
    check("8: at 390px the BODY still does not scroll sideways (the table scrolls inside its own wrapper)",
      n.bodyScrollW <= n.bodyClientW + 1, `body ${n.bodyScrollW} vs ${n.bodyClientW}`);
    check("9: and the NC rows survive the narrow viewport", n.nNc === m.nNc, `${n.nNc}`);
  } finally {
    await browser.close();
    srv.close();
  }

  let pass = 0;
  for (const [n, ok, d] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (d ? "   [" + d + "]" : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} layout checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
