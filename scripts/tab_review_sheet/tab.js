// Load COBI's Implementation Funding tab from the working tree with the live config snapshot, then run a probe.
// usage: node tab.js <probe.js> [width]
const { chromium } = require("./pw/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = "/home/user/cpl-project-tracker";
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, "fs/snapshot.json"), "utf8"));
const probe = require(path.resolve(process.argv[2]));
const width = +(process.argv[3] || 1280);
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png" };
const srv = http.createServer((q, s) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split("?")[0].split("#")[0]));
  fs.readFile(p, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, {"Content-Type": MIME[path.extname(p)] || "application/octet-stream"}); s.end(b); });
});
srv.listen(0, async () => {
  const port = srv.address().port, base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.route("**", (route) => {
    const u = route.request().url();
    if (u.startsWith(base) || u.startsWith("data:") || u.startsWith("blob:")) return route.continue();
    if (u.includes("supabase.co")) {
      let body = [];
      if (u.includes("cpl_funding_config")) body = [snap.config];
      else if (u.includes("budget_funding")) body = snap.budget;
      else if (u.includes("map_coordinator_summary")) body = snap.coord;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    }
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return route.continue();
    return route.abort();
  });
  await page.addInitScript(() => { try { localStorage.setItem("cplFirstLight.optOut.v1", "1"); } catch (e) {} });
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto(`${base}/index.html#implementation-funding`, { waitUntil: "load" });
  await page.waitForTimeout(6000);
  try { await probe(page, { dir: __dirname }); } catch (e) { console.log("PROBE ERROR", e.message); }
  if (errs.length) console.log("page errors:", errs.slice(0, 3).join(" | "));
  await browser.close(); srv.close();
});
