#!/usr/bin/env node
/* College Data Collection (#commons/data): measure, in Chromium, that no figure in a college's opened row breaks across
   lines, at 390, 768, 1016 and 1440 wide, for every college, and that the page never scrolls sideways.

   Why (S648, Sam's Skyline screenshot on #3229): the Program requirements card's label/value rows printed 144 as
   1 / 4 / 4, because the value column shrank to one character while the label took the rest. jsdom has no layout, so
   tests/commons_data_controls.test.js pins the CSS rule; this script measures the rendered result. A figure is any
   value that reads as a number, a percentage or dollars; it fails when its text's line boxes sit on more than one line.

   Usage:  node scripts/commons_data_values_check.js [--shots DIR] [--college "Skyline College"]
   Needs playwright (out of tree, as scripts/a11y.js does) and a Chromium. Serves the repo itself; nothing leaves the
   origin. Exits non-zero on a broken figure or a sideways scroll. */
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const SHOTS = flag("--shots");
const WHO = flag("--college") || "Skyline College";
const WIDTHS = [1440, 1016, 768, 390];

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  try {
    const root = "/opt/pw-browsers";
    const dir = fs.readdirSync(root).filter((f) => /^chromium-\d+$/.test(f)).sort().pop();
    for (const sub of ["chrome-linux", "chrome-linux64"]) {
      const p = path.join(root, dir, sub, "chrome");
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* playwright's own resolution */ }
  return undefined;
}
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split("?")[0]);
      if (p === "/") p = "/index.html";
      const f = path.join(ROOT, path.normalize(p));
      if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
      fs.readFile(f, (e, b) => {
        if (e) { r.writeHead(404); return r.end(); }
        r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(b);
      });
    });
    srv.listen(0, "127.0.0.1", () => ok({ srv, port: srv.address().port }));
  });
}

(async function () {
  let chromium;
  try { ({ chromium } = require("playwright")); } catch (e) { console.error("playwright is not installed; see scripts/a11y.js's note."); process.exit(2); }
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const { srv, port } = await serve();
  const base = "http://127.0.0.1:" + port;
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let bad = 0;
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    await page.route("**", (rt) => rt.request().url().startsWith(base) ? rt.continue() : rt.abort());
    page.on("pageerror", () => {});
    await page.addInitScript(() => { try { localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString()); } catch (e) { /* blocked */ } });
    await page.goto(base + "/index.html#commons/data", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#commons-root .cdd-notes", { state: "attached", timeout: 60000 });
    await page.evaluate(() => { const x = document.querySelector(".cplfl-overlay.open #cplfl-close"); if (x) x.click(); });
    await page.waitForTimeout(400);
    const res = await page.evaluate((who) => {
      const broken = [];
      const FIG = /^\s*\$?[\d,.]+%?\s*$/;
      const lines = (n) => { const r = document.createRange(); r.selectNodeContents(n); return new Set(Array.from(r.getClientRects()).map((x) => Math.round(x.top))).size; };
      const ids = Array.from(document.querySelectorAll("#cdd-colleges [data-expand]")).map((b) => b.getAttribute("data-expand"));
      ids.forEach((id) => {
        const b = document.querySelector('#cdd-colleges [data-expand="' + id + '"]'); b.click();
        const more = document.getElementById("cdd-more-" + id);
        if (more) more.querySelectorAll("dd, .cdd-n, .cdd-num").forEach((d) => { if (FIG.test(d.textContent) && lines(d) > 1) broken.push(b.textContent + ": " + d.textContent.trim()); });
        document.querySelector('#cdd-colleges [data-expand="' + id + '"]').click();
      });
      document.querySelectorAll("#cdd-colleges tbody tr[data-college] .cdd-n, #cdd-colleges tbody tr[data-college] .cdd-num").forEach((d) => {
        if (FIG.test(d.textContent) && lines(d) > 1) broken.push("list: " + d.textContent.trim());
      });
      const t = Array.from(document.querySelectorAll("#cdd-colleges [data-expand]")).filter((x) => x.textContent === who)[0];
      if (t) { t.click(); document.querySelector("#cdd-colleges tr.cdd-open").scrollIntoView(); }
      return { colleges: ids.length, broken, sideways: document.documentElement.scrollWidth > window.innerWidth };
    }, WHO);
    const ok = !res.broken.length && !res.sideways && res.colleges > 0;
    if (!ok) bad++;
    console.log((ok ? "ok   " : "FAIL ") + w + "px: " + res.colleges + " colleges' rows, " + res.broken.length + " broken figures" + (res.sideways ? ", the page scrolls sideways" : "")
      + (res.broken.length ? " (" + res.broken.slice(0, 5).join("; ") + ")" : ""));
    if (SHOTS) {
      const box = await page.evaluate(() => {
        const o = document.querySelector("#cdd-colleges tr.cdd-open"), m = document.querySelector("#cdd-colleges tr.cdd-more");
        if (!o || !m) return null;
        const a = o.getBoundingClientRect(), b = m.getBoundingClientRect();
        return { y: a.top + window.scrollY, h: b.bottom - a.top };
      });
      if (box) await page.screenshot({ path: path.join(SHOTS, "commons_data_row_" + w + ".png"), fullPage: true, clip: { x: 0, y: Math.max(0, box.y - 120), width: w, height: Math.min(box.h + 120, 5000) } });
    }
    await page.close();
  }
  await browser.close(); srv.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
