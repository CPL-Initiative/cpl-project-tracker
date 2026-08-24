/* ===========================================================================
   Memory tab — Briefing panel: real-layout + real-interaction check
   ---------------------------------------------------------------------------
   Chromium, on demand. NOT in tests/ and NOT run by `npm test`, deliberately —
   the split scripts/check_public_page_layout.js and fact-sheet/
   check_mobile_layout.js established: CI has jsdom only, jsdom has no layout
   engine, and adding playwright to package.json would make CI download a
   browser for a check it never runs.

   tests/cpl_memory_briefing.test.js covers the STRUCTURE — that a citation is a
   number, that the card carries the memory, that Escape closes it, that a click
   opens the edit form. Every one of those calls the handler directly, because
   jsdom has no pointer and no layout. Three claims survive that suite untested,
   and all three are the kind that look fine in code:

     1. THE CARD IS CLAMPED INSIDE THE PANEL. showCiteCard() positions with
        getBoundingClientRect(), which returns ZEROES in jsdom — so the clamp
        arithmetic is completely unexercised there. A card that runs off the
        right edge is the same as no card, and the citation it belongs to is
        usually near the right edge, because that is where lines end.

     2. A REAL POINTER OPENS AND CLOSES IT. The unit test calls onmouseenter().
        That proves the handler works, not that the element is hoverable — a
        superscript number is a small target and could sit under something.

     3. THE PANEL SURVIVES A PHONE. The control row must stack, the body must
        never scroll sideways, and nothing may escape the panel's right edge.
        A page that silently drops a column looks complete (the Fact Sheet's
        statewide grid, #1269) — so this is measured, not asserted in CSS.

   Run:  node scripts/check_memory_briefing_layout.js
         (needs playwright; on this environment pass the preinstalled binary
          via PW_CHROMIUM, e.g.
          PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome)
   =========================================================================== */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const REPO = path.join(__dirname, "..");
const PORT = 8749;
const AA_TARGET_MIN = 24;          // WCAG 2.2 AA 2.5.8, in CSS px

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

// Twelve rows shaped like the tab's own ingest output. Slugs are deliberately
// LONG — that is the real shape of this table, and it is what made inline slug
// citations unreadable in the first place.
const ROWS = [
  "sierra-credit-outages-recurred-twice-and-are-now-monitored",
  "a-cache-breakpoint-must-lead-the-prompt",
  "a-conversation-is-scoped-state",
  "a-guidance-rule-must-name-the-fact-it-depends-on",
  "sam-authorized-the-sierra-guidance-audit",
  "smoke-mode-7-red-is-emphasis-not-capability",
].map((slug, i) => ({
  id: slug, kind: ["risk", "pitfall", "pitfall", "pitfall", "decision", "fact"][i],
  status: "verified",
  title: "A title long enough to wrap inside the hover card, entry " + (i + 1),
  summary: "A summary long enough to wrap onto several lines inside the card, so the "
    + "card's own height and clamping are exercised rather than assumed.",
  detail: "d", tags: ["sierra"], org: "cpl", affects: [], related: [],
}));

// A citation near the END of a line is the one that can overflow, so the text
// deliberately puts one there.
const BRIEF = [
  "Here's what I understand from these entries. The first is about an outage that a scheduled "
  + "test found rather than a person [sierra-credit-outages-recurred-twice-and-are-now-monitored].",
  "",
  "A caching change would have quietly added cost while every answer still looked correct, which "
  + "is the pattern the rest of these entries keep repeating in different places "
  + "[a-cache-breakpoint-must-lead-the-prompt]. The conversation bug is the clearest case of two "
  + "correct decisions adding up to a wrong one [a-conversation-is-scoped-state].",
  "",
  "A rule that refers to something the request does not carry makes her guess "
  + "[a-guidance-rule-must-name-the-fact-it-depends-on], which is what led to the audit "
  + "[sam-authorized-the-sierra-guidance-audit] and to re-reading a failing test as wording "
  + "rather than a gap [smoke-mode-7-red-is-emphasis-not-capability].",
].join("\n");

function serve() {
  const srv = http.createServer((req, res) => {
    const url = decodeURIComponent(String(req.url).split("?")[0]);
    if (url === "/" || url === "/harness") {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{margin:0;font-family:system-ui,sans-serif;background:#F4F2ED;}</style></head>
        <body><div id="tab-memory"><div id="memory-root"></div></div>
        <script src="/team_phrase.js"></script><script src="/cpl_chat.js"></script>
        <script src="/cpl_memory.js"></script></body></html>`);
    }
    // ⚠ Read BEFORE writeHead. Writing the header first and then throwing means
    // the catch writes a second header and the whole server dies mid-run, which
    // reads like a browser failure.
    let buf = null;
    try { buf = fs.readFileSync(path.join(REPO, url.replace(/^\//, ""))); }
    catch (e) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": url.endsWith(".js") ? "text/javascript" : "text/plain" });
    res.end(buf);
  });
  return new Promise((r) => srv.listen(PORT, () => r(srv)));
}

// Mount the tab through its OWN entry point so the module injects its stylesheet,
// then WAIT: activate() starts a fetch, and when it resolves it re-renders and
// renderReport() rebuilds the panel — text painted into the first panel is
// thrown away. Mount, settle, then paint.
async function mount(pg) {
  await pg.goto(`http://127.0.0.1:${PORT}/harness`, { waitUntil: "networkidle" });
  await pg.evaluate(() => { try { localStorage.setItem("cpl_team_pass", "x"); } catch (e) {} });
  await pg.evaluate(({ rows }) => {
    window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(rows) });
    window.CPL_MEMORY.activate(document.getElementById("memory-root"));
    window.CPL_MEMORY._setData(rows);
    window.CPL_MEMORY._setViewMode("report");
  }, { rows: ROWS });
  await pg.waitForTimeout(500);
  return pg.evaluate(({ rows, brief }) => {
    const panel = document.querySelector(".mem-brief");
    if (!panel) return { err: "panel not rendered in report view" };
    const shown = {}; rows.forEach((r) => { shown[r.id] = 1; });
    const s = window.CPL_MEMORY._renderBriefText(panel.querySelector(".mb-out"), brief, shown);
    return { cited: s.cited, sources: s.sources.length };
  }, { rows: ROWS, brief: BRIEF });
}

(async () => {
  const srv = await serve();
  const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
  const browser = await chromium.launch(launch);

  // ── DESKTOP: the hover card ───────────────────────────────────────────────
  const pg = await browser.newPage({ viewport: { width: 1180, height: 1400 } });
  const painted = await mount(pg);
  check("the panel mounts and paints", painted && !painted.err && painted.cited > 0,
    painted && painted.err);

  const cites = await pg.locator("a.mb-cite").count();
  check("citations render as links", cites >= 5, "found " + cites);

  // (1) a REAL pointer opens it — not a called handler
  await pg.locator("a.mb-cite").first().hover();
  await pg.waitForTimeout(200);
  check("(1) a real mouse hover opens the card", await pg.locator(".mb-tip").count() === 1);

  // (2) the card is clamped INSIDE the panel — the arithmetic jsdom cannot run
  for (let i = 0; i < cites; i++) {
    await pg.locator("a.mb-cite").nth(i).focus();     // focus survives scrolling
    await pg.waitForTimeout(90);
    const fit = await pg.evaluate(() => {
      const t = document.querySelector(".mb-tip"), p = document.querySelector(".mem-brief");
      if (!t || !p) return null;
      const tr = t.getBoundingClientRect(), pr = p.getBoundingClientRect();
      return { left: tr.left >= pr.left - 1, right: tr.right <= pr.right + 1,
               inViewport: tr.left >= -1 && tr.right <= window.innerWidth + 1 };
    });
    check("(2) card " + (i + 1) + " is clamped inside the panel",
      fit && fit.left && fit.right && fit.inViewport, JSON.stringify(fit));
  }

  // (3) a real pointer closes it again
  await pg.locator("a.mb-cite").first().hover();
  await pg.waitForTimeout(120);
  await pg.mouse.move(5, 5);
  await pg.waitForTimeout(150);
  check("(3) moving the pointer away closes the card", await pg.locator(".mb-tip").count() === 0);

  // (4) tap targets — the citation is small BY DESIGN, so measure it
  const targets = await pg.evaluate((min) => {
    const out = [];
    document.querySelectorAll(".mem-brief a, .mem-brief button").forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.width && r.height && (r.width < min || r.height < min)) {
        out.push({ cls: e.className, w: Math.round(r.width), h: Math.round(r.height),
                   text: (e.textContent || "").trim().slice(0, 24) });
      }
    });
    return out;
  }, AA_TARGET_MIN);
  // ⚠ A superscript citation is INLINE TEXT, and SC 2.5.8 exempts a target whose
  // position is determined by the flow of the sentence it sits in. It is exempt
  // only because the numbered source list underneath repeats every one of them
  // at full size — delete that list and the exemption goes with it.
  const nonInline = targets.filter((t) => !/mb-cite/.test(t.cls));
  check("(4) no non-inline target is under " + AA_TARGET_MIN + "px",
    nonInline.length === 0, JSON.stringify(nonInline));
  const listRows = await pg.locator(".mb-srclist a").count();
  check("(4) …and the inline-citation exemption is EARNED — every citation is "
    + "repeated at full size in the source list", listRows >= cites - 2,
    listRows + " source rows for " + cites + " citations");

  // ── PHONE ─────────────────────────────────────────────────────────────────
  const phone = await browser.newPage({ viewport: { width: 390, height: 1400 } });
  const paintedM = await mount(phone);
  check("the panel mounts on a phone", paintedM && !paintedM.err, paintedM && paintedM.err);
  const m = await phone.evaluate(() => {
    const p = document.querySelector(".mem-brief");
    const row = p.querySelector(".mb-row");
    const btn = p.querySelector(".mb-btn"), st = p.querySelector(".mb-status");
    const br = btn.getBoundingClientRect(), sr = st.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    const escaped = Array.from(p.querySelectorAll("*")).filter(
      (e) => e.getBoundingClientRect().right > pr.right + 1)
      .map((e) => e.className || e.tagName);
    return {
      docScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      stacked: getComputedStyle(row).flexDirection === "column",
      statusBelow: sr.top >= br.bottom - 1,
      btn: { w: Math.round(br.width), h: Math.round(br.height) },
      escaped: escaped.slice(0, 5),
    };
  });
  check("(5) the body never scrolls sideways on a phone", m.docScroll <= 0, "overflow " + m.docScroll + "px");
  check("(5) the control row stacks below 560px", m.stacked);
  check("(5) …so the status sits below the button, not beside it", m.statusBelow);
  check("(5) nothing escapes the panel's right edge", m.escaped.length === 0, JSON.stringify(m.escaped));
  check("(5) the button clears the " + AA_TARGET_MIN + "px target minimum",
    m.btn.h >= AA_TARGET_MIN && m.btn.w >= AA_TARGET_MIN, JSON.stringify(m.btn));

  await browser.close();
  srv.close();

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "ok  " : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
