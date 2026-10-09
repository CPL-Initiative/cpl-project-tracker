// Fact Sheet capture (S352): render the public Fact Sheet from a repo tree with
// its own code, answer the curator overrides from a fixture, and write the page
// as a reader receives it (the body after every script has run, plus the CSS
// the scripts inject) for assemble_fact_sheet.py to restyle.
//   node capture_fact_sheet.mjs <treeDir> <outDir> <overrides.json>
// overrides.json: the factsheet_overrides rows for page 'fact-sheet'
// ([{block_key, html, hidden}]), read through the Supabase MCP. They are the
// public page's own text, but the file stays out of git like every fixture here.
import { createRequire } from "module";
import fs from "fs";
import http from "http";
import path from "path";
const require = createRequire("/home/user/cpl-project-tracker/package.json");
const { chromium } = require("playwright");

const [, , treeArg, outArg, fxArg] = process.argv;
const treeDir = path.resolve(treeArg);
const outDir = path.resolve(outArg);
const overrides = JSON.parse(fs.readFileSync(fxArg, "utf8"));
fs.mkdirSync(path.join(outDir, "shots"), { recursive: true });

const TYPES = { ".js": "application/javascript", ".json": "application/json", ".html": "text/html",
  ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const f = path.join(treeDir, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(treeDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/fact-sheet/index.html`;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const unanswered = [];
await page.route(/supabase\.co\//, (route) => {
  const u = new URL(route.request().url());
  if (u.pathname === "/rest/v1/factsheet_overrides") {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(overrides) });
  }
  unanswered.push(u.pathname);
  return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
});
// The story photos live on staging2.map.rccd.edu, which the sandbox cannot
// reach; the assembler restores their tags so a reader's browser can.
await page.route(/staging2\.map\.rccd\.edu/, (route) => route.abort());
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForFunction(() => /as of/i.test((document.querySelector('[data-bind="as_of_label"]') || {}).textContent || ""),
  null, { timeout: 15000 }).catch(() => {});

for (const [w, h] of [[1440, 1000], [390, 844]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: path.join(outDir, "shots", `today-${w}.png`), fullPage: true });
}
await page.setViewportSize({ width: 1440, height: 1000 });

const cap = await page.evaluate(() => {
  const styles = [...document.querySelectorAll("head style")].map((s) => ({ id: s.id || "", css: s.textContent }));
  const body = document.body.cloneNode(true);
  body.querySelectorAll("script").forEach((s) => s.remove());
  return {
    as_of: (document.querySelector('[data-bind="as_of_label"]') || {}).textContent || "",
    live_chip: (document.getElementById("live-chip-text") || {}).textContent || "",
    title: document.title,
    styles,
    body: body.innerHTML,
  };
});
const metrics = JSON.parse(fs.readFileSync(path.join(treeDir, "live_metrics.json"), "utf8"));
cap.scraped_at = metrics.scraped_at || "";
cap.captured_at = new Date().toISOString();
cap.unanswered = unanswered;
fs.writeFileSync(path.join(outDir, "capture.json"), JSON.stringify(cap));
console.log(`captured ${cap.body.length} chars of body, ${cap.styles.length} injected style blocks; ${cap.as_of}; unanswered: ${unanswered.join(", ") || "none"}`);
await browser.close();
server.close();
