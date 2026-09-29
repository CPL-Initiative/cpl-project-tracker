// Round-8 capture: render the College Dashboard from a repo tree with the
// product's own code, answer Supabase from fixtures, open every shown row's
// drill-in, and write the section's markup plus every CSS rule that matches it.
//   node capture.mjs <treeDir> <out.json> [nRows]
import { createRequire } from "module";
import fs from "fs";
import http from "http";
import path from "path";
const require = createRequire("/home/user/cpl-project-tracker/package.json");
const { chromium } = require("playwright");

const [, , treeDir, outFile, nRowsArg] = process.argv;
const N_ROWS = Number(nRowsArg || 13);
const FX = JSON.parse(fs.readFileSync(new URL("./fixtures.json", import.meta.url)));

const dash = fs.readFileSync(path.join(treeDir, "CPL_Dashboard.html"), "utf8");
const styles = (dash.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("\n");
const host = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">${styles}</head><body>
<div class="cpl-tab-pane active" id="tab-implementation-funding"><div class="main-container">
<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>
<div id="cplFundingMount">placeholder</div></div></div>
<script>
window.CPL_SESSION = {
  get: function () { return { access_token: "header.payload.sig", email: "slee@cccco.edu" }; },
  isFresh: function () { return true; },
  authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
};
</script>
<script src="college_short_names.js"></script>
<script src="cpl_funding_data.js"></script>
<script src="cpl_funding_performance.js"></script>
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
  const url = route.request().url();
  const p = new URL(url).pathname;
  const table = p.replace(/^\/rest\/v1\//, "");
  const pubContacts = FX.contacts.map((c) => ({ college: c.college, cpl_coordinator: c.cpl_coordinator, landing_page_url: c.landing_page_url }));
  const answers = {
    "cpl_funding_config": FX.config,
    "cpl_funding_participation": FX.participation,
    "rpc/map_coordinator_summary": FX.coord,
    "rpc/cpl_funding_optin_review": FX.optin_review,
    "budget_funding": FX.budget,
    "cpl_funding_notes": FX.notes,
    "map_college_contacts": FX.contacts,
    "map_college_contacts_pub": pubContacts,
  };
  if (!(table in answers)) unanswered.push(route.request().method() + " " + p);
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(answers[table] || []) });
});
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.goto(`http://127.0.0.1:${port}/__host.html`);
await page.waitForFunction(() => !!document.querySelector('.cplfund-table tbody tr.cplfund-row'), null, { timeout: 60000 });
await page.waitForTimeout(1500);

// Open every shown row's drill-in, one at a time (each open re-renders the table).
const names = await page.evaluate((n) => Array.from(document.querySelectorAll(".cplfund-table tbody tr.cplfund-row"))
  .slice(0, n).map((tr) => tr.getAttribute("data-id")), N_ROWS);
for (const id of names) {
  await page.evaluate((id) => {
    const tr = document.querySelector('.cplfund-table tbody tr.cplfund-row[data-id="' + CSS.escape(id) + '"]');
    const b = tr && tr.querySelector(".cplfund-caret");
    if (b && b.getAttribute("aria-expanded") !== "true") b.click();
  }, id);
  await page.waitForTimeout(120);
}
// The Statewide row's drill-in too.
await page.evaluate(() => {
  const b = document.querySelector(".cplfund-table tbody tr.cplfund-systemrow .cplfund-caret");
  if (b && b.getAttribute("aria-expanded") !== "true") b.click();
});
await page.waitForTimeout(300);

const out = await page.evaluate(({ n }) => {
  const sec = document.querySelector('details.cplfund-sec[data-sec="college"]') ||
    Array.from(document.querySelectorAll("details.cplfund-sec")).find((d) => /College Dashboard/.test(d.textContent));
  const clone = sec.cloneNode(true);
  // Keep the Statewide row, the first n institutions, and each one's drill-in rows.
  const tb = clone.querySelector(".cplfund-table tbody");
  let owner = null, kept = 0;
  Array.from(tb.children).forEach((tr) => {
    if (tr.classList.contains("cplfund-systemrow") || tr.classList.contains("cplfund-row")) {
      owner = tr.getAttribute("data-id");
      if (tr.classList.contains("cplfund-row")) kept++;
      if (kept > n) { tr.remove(); return; }
      const b = tr.querySelector(".cplfund-caret");
      if (b) b.setAttribute("aria-expanded", "false");
      return;
    }
    if (kept > n) { tr.remove(); return; }
    tr.setAttribute("data-for", owner || "");
    tr.setAttribute("hidden", "");
  });
  // Every CSS rule that matches something in the section (hover, focus and
  // pseudo-elements stripped for the test), plus :root, html and body.
  const els = [clone];
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
  return { html: clone.outerHTML, css: keep };
}, { n: N_ROWS });
out.unanswered = unanswered;
fs.writeFileSync(outFile, JSON.stringify(out));
console.log("rows kept:", N_ROWS, "css rules:", out.css.length, "html bytes:", out.html.length, "unanswered:", unanswered.join(" | ") || "none");
await browser.close();
server.close();
