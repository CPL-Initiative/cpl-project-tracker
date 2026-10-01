// My CPL Funding capture (S310): render the funding tab's Public view from a
// repo tree with the product's own code, answer Supabase from fixtures, switch
// the College Dashboard to My CPL Funding, choose one institution, and write
// the section's markup plus every CSS rule that matches it.
//   node capture_mycpl.mjs <treeDir> <out.json> [institution] [fixtures.json]
// fixtures.json: { config: [row], coord: { synced, rows: [[college, coord,
// primary, page], ...] } } — pulled read-only through the Supabase MCP and
// never committed (see README.md).
import { createRequire } from "module";
import fs from "fs";
import http from "http";
import path from "path";
const require = createRequire("/home/user/cpl-project-tracker/package.json");
const { chromium } = require("playwright");

const [, , treeDir, outFile, instArg, fxArg] = process.argv;
const INST = instArg || "Coastline";
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
  const u = decodeURIComponent(req.url.split("?")[0]);
  if (u === "/__host.html") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(host); }
  const f = path.join(treeDir, u);
  if (!f.startsWith(treeDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const unanswered = [];
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
await page.goto(`http://127.0.0.1:${port}/__host.html?fundview=public`);
await page.waitForFunction(() => !!document.querySelector("#cplFundCollegeView"), null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.click('#cplFundCollegeView button[data-val="one"]');
await page.waitForSelector("#cplFundOnePick", { timeout: 20000 });
const optVal = await page.evaluate((inst) => {
  const o = Array.from(document.querySelectorAll("#cplFundOnePick option")).find((x) => x.textContent.trim() === inst || x.value === inst);
  return o ? o.value : null;
}, INST);
if (!optVal) throw new Error("institution not in the chooser: " + INST);
await page.selectOption("#cplFundOnePick", optVal);
await page.waitForFunction(() => !!document.querySelector("#cplFundOnePanel .cb-panel, #cplFundOnePanel .cplfund-onemember"), null, { timeout: 30000 });
await page.waitForTimeout(800);
const shotBase = outFile.replace(/\.json$/, "");
const sec = await page.$('details.cplfund-sec[data-sec="college"]');
await sec.screenshot({ path: shotBase + "-1440.png" });

const out = await page.evaluate(() => {
  const sec = document.querySelector('details.cplfund-sec[data-sec="college"]');
  const clone = sec.cloneNode(true);
  document.body.appendChild(clone);
  clone.style.display = "none";
  const keep = [];
  const matches = (sel) => {
    const bare = sel.replace(/::?(hover|focus-visible|focus-within|focus|active|visited|before|after|marker|placeholder|-webkit-details-marker|first-letter|first-line|selection)\b(\([^)]*\))?/g, "").trim();
    if (!bare || /^(:root|html|body|\*)$/.test(bare)) return true;
    try { return clone.matches(bare) || !!clone.querySelector(bare); } catch (e) { return false; }
  };
  const walk = (rules, into) => {
    Array.from(rules).forEach((r) => {
      if (r.type === 1) {
        const sels = r.selectorText.split(/,(?![^(]*\))/).map((x) => x.trim());
        if (sels.some(matches)) into.push(r.cssText);
      } else if (r.type === 4) {
        const inner = [];
        walk(r.cssRules, inner);
        if (inner.length) into.push("@media " + r.media.mediaText + " {\n" + inner.join("\n") + "\n}");
      }
    });
  };
  Array.from(document.styleSheets).forEach((sh) => { try { walk(sh.cssRules, keep); } catch (e) {} });
  clone.remove();
  clone.style.display = "";
  return { html: clone.outerHTML, css: keep, text: sec.innerText };
});
out.unanswered = unanswered;
out.institution = INST;
fs.writeFileSync(outFile, JSON.stringify(out));
// The phone width, for the layout check.
await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(400);
await (await page.$('details.cplfund-sec[data-sec="college"]')).screenshot({ path: shotBase + "-390.png" });
console.log("institution:", INST, "css rules:", out.css.length, "html bytes:", out.html.length, "unanswered:", unanswered.join(" | ") || "none");
await browser.close();
server.close();
