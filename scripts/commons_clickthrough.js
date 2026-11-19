#!/usr/bin/env node
/* commons_clickthrough.js — the Commons' links, clicked in a real browser, read only (#3510 B6; #3447 item 6).

   Commons Clarity's walk of Nov 17, 2026 found that Start and the "Waiting on a person" links opened their tab with the
   Progress summary unfolded on top and the named filter out of sight, and that a count on the Commons and the same label
   on the List differed with no word on why (12,540 common courses against 42,787 local courses). jsdom cannot see a
   scroll position or a fold, so this script opens the page in Chromium, signed out, and for every link on the Commons'
   first view and in its "Waiting on a person" fold that names a List filter (#<tab>/list/<filter>) it:
     1. clicks the link from a fresh Commons page;
     2. checks the address is the link's, the named tab is the one shown, the List has that filter selected
        (commons_list.js marks the arrival with data-arrived), and the selected filter word is on the first screen;
     3. compares the Commons' count with the List's, as scripts/commons_clickthrough.json says it should: equal to a
        figure the List writes (its common-course count), or a written difference with its reason.

   Read only: any request that is not a GET is refused, and so is every request off the local server (apart from the
   public tables' anon reads when COMMONS_CLICKTHROUGH_LIVE=1, the nightly setting). No sign-in.
   Usage:  node scripts/commons_clickthrough.js [--json out.json]
   Exit 0 when every link lands and every count matches or matches its written difference; 1 otherwise, with the list.
   The nightly workflow (.github/workflows/commons-clickthrough.yml) opens one tracking issue on a failure. */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const REPO = path.resolve(__dirname, "..");
const EXPECT = JSON.parse(fs.readFileSync(path.join(__dirname, "commons_clickthrough.json"), "utf8"));
// The nightly run sets COMMONS_CLICKTHROUGH_LIVE=1: the page may then read the public tables as anon (GET only, no
// sign-in), which the Programs List needs to draw. Without it, a link whose rule says "live" is reported as skipped.
const LIVE = process.env.COMMONS_CLICKTHROUGH_LIVE === "1";
const LIVE_HOST = /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\//;
const OUT = (() => { const i = process.argv.indexOf("--json"); return i > 0 ? process.argv[i + 1] : null; })();

function serve() {
  const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
    ".svg": "image/svg+xml", ".geojson": "application/json", ".csv": "text/csv", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
  const srv = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(REPO, rel);
    if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => srv.listen(0, "127.0.0.1", () => resolve({ srv, port: srv.address().port })));
}

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  try {
    const root = "/opt/pw-browsers", dir = fs.readdirSync(root).filter((f) => /^chromium-\d+$/.test(f)).sort().pop();
    for (const sub of ["chrome-linux", "chrome-linux64"]) { const p = path.join(root, dir, sub, "chrome"); if (dir && fs.existsSync(p)) return p; }
  } catch (e) { /* playwright's own browser */ }
  return undefined;
}
const num = (s) => { const m = /(\d[\d,]*)/.exec(String(s || "")); return m ? Number(m[1].replace(/,/g, "")) : null; };

async function openCommons(ctx, base) {
  const page = await ctx.newPage();
  await page.route("**/*", (route) => {
    const u = route.request().url();
    if (route.request().method() !== "GET") return route.abort();
    if (!u.startsWith(base) && !(LIVE && LIVE_HOST.test(u))) return route.abort();
    return route.continue();
  });
  await page.goto(base + "/index.html#commons", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#cmn-queue-h", { timeout: 60000 });
  // Every fold on the Commons' first view opens, so its links can be clicked.
  await page.evaluate(() => document.querySelectorAll("#tab-commons details").forEach((d) => { d.open = true; }));
  return page;
}

/* The Commons' links that name a List filter, each with its count and words as the Commons draws them. */
async function commonsLinks(page) {
  return page.evaluate(() => {
    const out = [], seen = {};
    document.querySelectorAll('#tab-commons a[href*="/list/"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (!/^#[a-z0-9-]+\/list\/[a-z0-9-]+$/i.test(href) || seen[href]) return;
      seen[href] = true;
      const line = (a.closest("li, p, .cmn-next, section") || a).textContent.replace(/\s+/g, " ").trim();
      out.push({ href, text: a.textContent.replace(/\s+/g, " ").trim(), line: line.slice(0, 240) });
    });
    return out;
  });
}

/* Where the click landed, read in the page. */
async function landing(page, tab, filter) {
  return page.evaluate(([tab, filter]) => {
    const pane = document.getElementById("tab-" + tab);
    const shown = !!pane && pane.offsetParent !== null && getComputedStyle(pane).display !== "none";
    const fl = pane && pane.querySelector('[data-arrived="' + filter + '"]');
    const cur = fl && (fl.querySelector("[aria-current]") || fl);
    const r = cur && cur.getBoundingClientRect();
    const meta = pane ? [...pane.querySelectorAll(".cplcoci-meta, .ccl-doubt-note p, [data-unit]")].map((n) => n.textContent.replace(/\s+/g, " ").trim()) : [];
    const doubt = pane && pane.querySelector("[data-doubt-desc]");
    return { hash: location.hash, shown, selected: !!fl, current: cur ? cur.textContent.replace(/\s+/g, " ").trim() : null,
      inView: !!r && r.bottom > 0 && r.top < window.innerHeight, unit: (pane && pane.querySelector("[data-unit]") || {}).textContent || null,
      meta, doubtDesc: doubt ? Number(doubt.getAttribute("data-doubt-desc")) : null,
      doubtDescOpen: doubt ? Number(doubt.getAttribute("data-doubt-desc-open")) : null,
      doubtDescRuled: doubt ? Number(doubt.getAttribute("data-doubt-desc-ruled")) : null };
  }, [tab, filter]);
}

/* The List's figure a rule compares with. */
function listFigure(rule, L) {
  if (rule.compare === "doubt_description") return L.doubtDesc;
  if (rule.compare === "filter_label") return num(L.current);
  const re = new RegExp(rule.pattern);
  for (const t of L.meta) { const m = re.exec(t); if (m) return Number(m[1].replace(/,/g, "")); }
  return null;
}

(async function main() {
  const { srv, port } = await serve();
  const base = "http://127.0.0.1:" + port;
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // The daily painting greets a first visit; it is no part of this check.
  await ctx.addInitScript(() => { try { localStorage.setItem("cplFirstLight.optOut.v1", "1"); } catch (e) { /* blocked */ } });
  const results = [];
  try {
    const first = await openCommons(ctx, base);
    const links = await commonsLinks(first);
    await first.close();
    if (!links.length) results.push({ href: "(none)", ok: false, why: "the Commons drew no link that names a List filter" });
    for (const link of links) {
      const [, tab, filter] = /^#([a-z0-9-]+)\/list\/([a-z0-9-]+)$/i.exec(link.href);
      const rule0 = (EXPECT.links || {})[link.href];
      if (rule0 && rule0.live && !LIVE) { results.push({ href: link.href, text: link.text, ok: true, skipped: "needs the live tables (COMMONS_CLICKTHROUGH_LIVE=1)", why: [] }); continue; }
      const page = await openCommons(ctx, base);
      const why = [];
      try {
        // A person's click where the link is clickable; a link the page draws under another layer is clicked in the page.
        await page.click('#tab-commons a[href="' + link.href + '"] >> nth=0', { timeout: 5000 })
          .catch(() => page.evaluate((h) => document.querySelector('#tab-commons a[href="' + h + '"]').click(), link.href));
        await page.waitForFunction(([t, f]) => !!document.querySelector('#tab-' + t + ' [data-arrived="' + f + '"]'), [tab, filter], { timeout: 90000 }).catch(() => {});
        await page.waitForTimeout(400);
        const L = await landing(page, tab, filter);
        if (L.hash !== link.href) why.push("the address is " + L.hash + ", not " + link.href);
        if (!L.shown) why.push("the " + tab + " tab is not the one shown");
        if (!L.selected) why.push("the List does not have the " + filter + " filter selected");
        else if (!L.inView) why.push("the selected filter word is not on the first screen");
        const rule = (EXPECT.links || {})[link.href];
        const n = num(link.text);
        let compared = null;
        if (!rule) why.push("no written rule in scripts/commons_clickthrough.json for this link");
        else if (rule.differs) {
          // A written difference holds only for the figures it was written against: once recorded, a move on either
          // side fails, so the reason is re-read. Unrecorded figures (a first run) print so they can be written down.
          const got = rule.list_pattern ? listFigure({ pattern: rule.list_pattern }, L) : num(L.current);
          compared = { differs: rule.differs, commons: n, list: got };
          if (rule.commons == null || rule.list == null) compared.record = "write commons " + n + " and list " + got + " into this rule";
          else if (n !== rule.commons || got !== rule.list)
            why.push("the written difference was for Commons " + rule.commons + " and List " + rule.list + "; now the Commons says " + n + " and the List says " + got);
        } else {
          const got = listFigure(rule, L);
          compared = { commons: n, list: got };
          if (got == null) why.push("the List wrote no figure to compare (" + (rule.compare || rule.pattern) + ")");
          else if (got !== n) why.push("the Commons says " + n + " and the List says " + got + (rule.note ? " (" + rule.note + ")" : ""));
          // The cards the List shows waiting (data-doubt-open's description share) against the Commons' count: the List may
          // never hold more, and the Commons may count more only by the cards a person ruled since its last build, which
          // the List's note names (#3510 B3, the clash Commons Clarity found on KIN P134).
          if (rule.compare === "doubt_description") {
            compared.waiting = L.doubtDescOpen; compared.ruled = L.doubtDescRuled;
            if (L.doubtDescOpen == null) why.push("the List wrote no count of the cards waiting for a ruling");
            else if (L.doubtDescOpen > n) why.push("the List has " + L.doubtDescOpen + " description cards waiting, more than the Commons' " + n);
            else if (n - L.doubtDescOpen > (L.doubtDescRuled || 0))
              why.push("the Commons counts " + n + " and the List has " + L.doubtDescOpen + " waiting; only " + (L.doubtDescRuled || 0) + " are ruled, so the gap is unexplained");
          }
        }
        if (rule && rule.unit && !(L.unit && new RegExp(rule.unit).test(L.unit))) why.push("the List does not say which unit its counts are in");
        results.push({ href: link.href, text: link.text, ok: !why.length, why, landed: { shown: L.shown, selected: L.selected, inView: L.inView, current: L.current }, compared });
      } catch (e) {
        results.push({ href: link.href, text: link.text, ok: false, why: ["the click failed: " + String(e && e.message || e).slice(0, 200)] });
      }
      await page.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }
  const bad = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.skipped ? "  skip " : r.ok ? "  ok   " : "  FAIL ") + r.href + "  " + (r.text || "") + (r.skipped ? "  (" + r.skipped + ")" : r.ok ? "" : "\n         " + r.why.join("; ")) +
    (r.compared && r.compared.record ? "\n         record: " + r.compared.record : "")));
  console.log("\n" + (results.length - bad.length) + "/" + results.length + " links land on their filter, counts as written");
  if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); } if (OUT) fs.writeFileSync(OUT, JSON.stringify({ checked_at: new Date().toISOString(), results }, null, 1) + "\n");
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
