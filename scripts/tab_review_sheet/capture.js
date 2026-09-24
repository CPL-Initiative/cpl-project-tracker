// Capture the Implementation Funding tab as rendered from the live config, for a review sheet.
const { chromium } = require("./pw/node_modules/playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = "/home/user/cpl-project-tracker";
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, "fs/snapshot.json"), "utf8"));
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png" };
const srv = http.createServer((q, s) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split("?")[0].split("#")[0]));
  fs.readFile(p, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, {"Content-Type": MIME[path.extname(p)] || "application/octet-stream"}); s.end(b); });
});
srv.listen(0, async () => {
  const port = srv.address().port, base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
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
  await page.goto(`${base}/index.html#implementation-funding`, { waitUntil: "load" });
  await page.waitForTimeout(6000);
  const clicked = [];
  for (const t of ["SYSTEM (statewide)", "Allan Hancock"]) {
    try { await page.locator("#tab-implementation-funding .cplfund-caret", { hasText: t }).first().click({ timeout: 3000 }); clicked.push(t); await page.waitForTimeout(1200); }
    catch (e) { try { await page.locator("#tab-implementation-funding td", { hasText: t }).first().click({ timeout: 3000 }); clicked.push(t + " (td)"); await page.waitForTimeout(1200); } catch (e2) { clicked.push(t + " FAILED"); } }
  }
  await page.evaluate(() => document.querySelectorAll("#tab-implementation-funding details").forEach(d => {
    if (!d.closest(".cplfund-colmenu") && !d.classList.contains("cplfund-colmenu")) d.open = true;
  }));
  await page.waitForTimeout(1500);
  const out = await page.evaluate(() => {
    const pane = document.getElementById("tab-implementation-funding");
    const dets = [...pane.querySelectorAll("details")].map(d => (d.className + " | " + ((d.querySelector("summary") || {}).innerText || "")).slice(0, 90));
    const expanded = pane.querySelectorAll("tr.cplfund-detail").length;
    // Freeze live form state into markup so the snapshot shows what the reader sees.
    pane.querySelectorAll("input").forEach(i => { if (i.type === "checkbox" || i.type === "radio") { i.checked ? i.setAttribute("checked", "") : i.removeAttribute("checked"); } else i.setAttribute("value", i.value); });
    pane.querySelectorAll("textarea").forEach(t => { t.textContent = t.value; });
    pane.querySelectorAll("select").forEach(s => [...s.options].forEach(o => o.selected ? o.setAttribute("selected", "") : o.removeAttribute("selected")));
    pane.querySelectorAll("details").forEach(d => d.open ? d.setAttribute("open", "") : d.removeAttribute("open"));

    // ── Review numbering: item N per section, N.k per block of text inside it ──
    const secs = [...pane.querySelectorAll("details.cplfund-sec")];
    const titles = secs.map(d => { const sm = d.querySelector(":scope > summary"); return sm ? (sm.innerText || "").split("\n")[0].replace(/\s*(Hide|Show)\s*$/, "").trim() : d.getAttribute("data-sec"); });
    const items = [];
    const slot = (n, id, title) => { const d = document.createElement("div"); d.className = "rv-slot"; d.setAttribute("data-n", n); d.setAttribute("data-sec", id); d.setAttribute("data-title", title); return d; };
    const tag = (n, k) => { const s = document.createElement("span"); s.className = "rv-ref"; s.textContent = n + "." + k; return s; };
    const BLOCK = /^(block|list-item|flex|grid|table|table-caption|flow-root)$/;
    const isBlock = el => BLOCK.test(getComputedStyle(el).display);
    const letters = t => /[A-Za-z0-9$]/.test(t || "");
    const ownText = el => [...el.childNodes].some(c => c.nodeType === 3 && letters(c.nodeValue));
    const leafBlock = el => ![...el.children].some(c => isBlock(c) && letters(c.innerText));
    function labelScope(n, roots, secRoot) {
      const plan = [];
      const labeled = new Set();
      roots.forEach(root => [root, ...root.querySelectorAll("*")].forEach(el => {
        if (el.closest(".cplfund-colmenu, button, select, script, style")) return;
        if (secRoot && el.closest("details.cplfund-sec") !== secRoot) return;          // a nested section numbers itself
        const sm = el.closest("summary");
        if (sm && sm.parentElement.classList.contains("cplfund-sec")) return;            // the section title carries "Item N"
        const tb = el.closest("table");
        if (tb && el !== tb && !el.closest("tr.cplfund-detail")) return;               // cells: refer to them by column name
        if (getComputedStyle(el).display === "none") return;
        let field = false;
        if (el.tagName === "TEXTAREA") field = letters(el.value);
        else if (el.tagName === "INPUT") field = (!el.type || el.type === "text") && (el.value || "").trim().length >= 12;
        if (field) { plan.push([el, "before"]); return; }
        if (el.tagName === "TABLE") { plan.push([el, "before"]); return; }
        if (!isBlock(el) || !letters(el.innerText)) return;
        const bx = el.getBoundingClientRect(); if (bx.height < 6 || bx.width < 6) return;   // visually hidden text is not a line
        if (!(ownText(el) || leafBlock(el))) return;
        for (let a = el.parentElement; a && a !== pane; a = a.parentElement) if (labeled.has(a) && el.tagName !== "LI") return;
        labeled.add(el); plan.push([el, "inside"]);
      }));
      plan.forEach(([el, where], i) => { const t = tag(n, i + 1); where === "before" ? el.insertAdjacentElement("beforebegin", t) : el.insertBefore(t, el.firstChild); });
      return plan.length;
    }
    const first = secs[0];
    const head = [];
    if (first) for (let el = first; el && el !== pane; el = el.parentElement)
      for (let sib = el.previousElementSibling; sib; sib = sib.previousElementSibling) head.unshift(sib);
    const k1 = labelScope(1, head, null);
    if (first) first.insertAdjacentElement("beforebegin", slot(1, "header", "Page header and controls"));
    items.push({ n: 1, id: "header", title: "Page header and controls", refs: k1 });
    secs.forEach((d, i) => {
      const n = i + 2, id = d.getAttribute("data-sec"), title = titles[i];
      const refs = labelScope(n, [d], d);
      items.push({ n, id, title, refs });
    });
    secs.forEach((d, i) => {
      const n = i + 2, sum = d.querySelector(":scope > summary");
      if (sum) { const b = document.createElement("span"); b.className = "rv-sec"; b.textContent = "Item " + n; sum.insertBefore(b, sum.firstChild); }
      d.insertAdjacentElement("afterend", slot(n, d.getAttribute("data-sec"), titles[i]));
    });
    window.__rvItems = items;
    const clone = pane.cloneNode(true);
    clone.querySelectorAll("script").forEach(s => s.remove());
    clone.querySelectorAll("*").forEach(el => [...el.attributes].forEach(a => { if (/^on/i.test(a.name)) el.removeAttribute(a.name); }));
    let css = [], links = [];
    for (const sh of document.styleSheets) {
      try { css.push([...sh.cssRules].map(r => r.cssText).join("\n")); }
      catch (e) { if (sh.href) links.push(sh.href); }
    }
    const chain = [];
    for (let el = pane.parentElement; el && el !== document.body; el = el.parentElement)
      chain.unshift({ tag: el.tagName.toLowerCase(), id: el.id, cls: String(el.className || "") });
    const attrs = el => Object.fromEntries([...el.attributes].map(a => [a.name, a.value]));
    return { items: window.__rvItems, dets, expanded, css: css.join("\n"), links, chain, html: attrs(document.documentElement), body: attrs(document.body), pane: clone.outerHTML };
  });
  console.log("clicked:", clicked.join(", "), "| detail rows:", out.expanded, "| css KB:", Math.round(out.css.length / 1024), "| pane KB:", Math.round(out.pane.length / 1024));
  console.log("links:", out.links.join(" "), "\nchain:", JSON.stringify(out.chain), "\nhtml:", JSON.stringify(out.html), "body:", JSON.stringify(out.body));
  console.log(JSON.stringify(out.items));
  fs.writeFileSync(path.join(__dirname, "fs/capture.json"), JSON.stringify(out));
  await page.screenshot({ path: path.join(__dirname, "fs/capture.png"), fullPage: true });
  await browser.close(); srv.close();
});
