// "Model" sweep inventory (S311): render the two public funding surfaces with
// the product's own code, answer Supabase from fixtures, open every fold and
// one institution's drill-in, and list every place a reader can see the word
// "model": text, title and aria-label alike, with the block that carries it.
//   node capture_model_words.mjs <treeDir> <out.json> [fixtures.json]
// Surfaces: the explainer (funding-model/index.html) and the tab's Public view
// (?fundview=public), each on the published scenario. fixtures.json is the
// same shape capture_mycpl.mjs reads and is never committed (README.md).
import { createRequire } from "module";
import fs from "fs";
import http from "http";
import path from "path";
const require = createRequire("/home/user/cpl-project-tracker/package.json");
const { chromium } = require("playwright");

const [, , treeDir, outFile, fxArg] = process.argv;
const FX = JSON.parse(fs.readFileSync(fxArg || new URL("./fixtures.json", import.meta.url)));
const coordRows = (FX.coord.rows || []).map((r) => ({
  college: r[0], has_coordinator: r[1], has_primary_contact: r[2], has_landing_page: r[3], last_synced: FX.coord.synced,
}));

const dash = fs.readFileSync(path.join(treeDir, "CPL_Dashboard.html"), "utf8");
const styles = (dash.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("\n");
const host = `<!DOCTYPE html><html lang="en" data-theme="light"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">${styles}</head><body>
<div class="cpl-tab-pane active" id="tab-implementation-funding"><div class="main-container">
<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>
<div id="cplFundingMount">placeholder</div></div></div>
<script src="college_short_names.js"></script>
<script src="cpl_funding_data.js"></script>
<script src="cpl_funding_performance.js"></script>
<script src="cpl_funding_ess.js"></script>
<script src="cpl_funding.js"></script>
<script>window.CPL_FUNDING_TAB.boot();</script>
</body></html>`;

const TYPES = { ".js": "application/javascript", ".json": "application/json", ".html": "text/html", ".css": "text/css" };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/__host.html") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(host); }
  if (u.endsWith("/")) u += "index.html";
  const f = path.join(treeDir, u);
  if (!f.startsWith(treeDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const unanswered = [];
async function open(url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route(/supabase\.co\//, async (route) => {
    const p = new URL(route.request().url()).pathname;
    const table = p.replace(/^\/rest\/v1\//, "");
    const answers = {
      "cpl_funding_config": FX.config,
      "rpc/map_coordinator_summary": coordRows,
      "cpl_funding_participation": [],
      "rpc/cpl_funding_optin_review": [],
      "cpl_funding_notes": [],
      "map_college_contacts_pub": [],
    };
    if (!(table in answers)) unanswered.push(route.request().method() + " " + p);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(answers[table] || []) });
  });
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  await page.goto(`http://127.0.0.1:${port}${url}`);
  return page;
}

// Every visible "model": a text node's block, or an attribute a reader meets.
async function harvest(page, surface) {
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
  await page.waitForTimeout(600);
  return page.evaluate((surface) => {
    const RX = /\bmodel/i;
    const BLOCK = "p,li,h1,h2,h3,h4,h5,h6,td,th,summary,figcaption,caption,label,button,a,span.tag,div.k,p.k,.dk,.cplfund-empty";
    const where = (el) => {
      const s = el.closest("[data-fsec],[data-sec],section[id],details[id]");
      if (!s) return "";
      return s.getAttribute("data-fsec") || s.getAttribute("data-sec") || s.id || "";
    };
    const seen = new Set();
    const hits = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!RX.test(n.nodeValue)) continue;
      const el = n.parentElement;
      if (!el || el.closest("script,style,noscript,template")) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const block = el.closest(BLOCK) || el;
      if (seen.has(block)) continue;
      seen.add(block);
      hits.push({ surface, kind: "text", sec: where(block), tag: block.tagName.toLowerCase(),
        id: block.id || "", text: block.textContent.replace(/\s+/g, " ").trim() });
    }
    document.querySelectorAll("[title],[aria-label],[alt],[placeholder]").forEach((el) => {
      ["title", "aria-label", "alt", "placeholder"].forEach((a) => {
        const v = el.getAttribute(a);
        if (v && RX.test(v)) hits.push({ surface, kind: a, sec: where(el), tag: el.tagName.toLowerCase(), id: el.id || "", text: v });
      });
    });
    if (RX.test(document.title)) hits.push({ surface, kind: "title", sec: "", tag: "title", id: "", text: document.title });
    return hits;
  }, surface);
}

const out = { hits: [], unanswered };

// 1. The explainer: wait for the paint, then open the table's first drill-in.
const ex = await open("/funding-model/index.html");
await ex.waitForFunction(() => document.querySelector("#cplFundingMount tr.cplfund-row, .cplfund-row"), null, { timeout: 60000 });
await ex.waitForTimeout(1500);
out.hits.push(...(await harvest(ex, "explainer")));
const exRow = await ex.$("tr.cplfund-row button, tr.cplfund-row");
if (exRow) { await exRow.click(); await ex.waitForTimeout(800); }
out.hits.push(...(await harvest(ex, "explainer+drill")));
out.explainerScenario = await ex.evaluate(() => (document.getElementById("x-scenario") || {}).textContent || "");
await ex.close();

// 2. The tab's Public view, then its first drill-in.
const tab = await open("/__host.html?fundview=public");
await tab.waitForFunction(() => !!document.querySelector("#cplFundCollegeView"), null, { timeout: 60000 });
await tab.waitForTimeout(1500);
out.hits.push(...(await harvest(tab, "tab-public")));
const tabRow = await tab.$("tr.cplfund-row button, tr.cplfund-row");
if (tabRow) { await tabRow.click(); await tab.waitForTimeout(800); }
out.hits.push(...(await harvest(tab, "tab-public+drill")));
await tab.close();

// One row per distinct (kind, text); the drill-in passes add only what is new.
const uniq = new Map();
out.hits.forEach((h) => {
  const k = h.kind + "|" + h.text;
  if (!uniq.has(k)) uniq.set(k, Object.assign({ surfaces: [] }, h));
  const u = uniq.get(k);
  const base = h.surface.replace("+drill", "");
  if (!u.surfaces.includes(base)) u.surfaces.push(base);
});
out.hits = Array.from(uniq.values()).map((h) => { delete h.surface; return h; });
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log("hits:", out.hits.length, "explainer scenario:", out.explainerScenario, "unanswered:", unanswered.join(" | ") || "none");
await browser.close();
server.close();
