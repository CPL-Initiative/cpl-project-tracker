/* SkyView functional sweep — every action a reader or a curator can take on the
 * SERVED page (prototype/skyview.html), driven in a real Chromium.
 *
 *   node prototype/check_skyview_sweep.js [--shots DIR] [--json PATH]
 *
 * WHY A SECOND INSTRUMENT BESIDE check_ccr_atlas.js (2026-09-10, SkyLabel S252).
 * That checker drives the BUILT page (ccr_atlas_v1.built.html) and was written
 * for the flat map: it clicks a suggestion row expecting a fly, but since the
 * 2026-09-06 ruling a row only TICKS and Enter applies, so eleven of its checks
 * read red on a page that is right. This one drives the page that ships and the
 * page as it is ruled today: the Sky opening, ticking then Enter, the chips, the
 * Ask, the carry and the drop, the outline sheet, the grip, the window steps, the
 * routes, a phone and its pinch. It asserts on STATE the page exports
 * (__ccrUniverseState) and on what the reader sees (the panel, the hint, the
 * askbox), never on a string alone where a place can be asked for.
 *
 * ⚠️ NOT part of `npm test`, and must not be: jsdom has no layout, no canvas and
 * no pointer, and every finding this file has made was invisible there. Same
 * split as scripts/a11y.js. Needs the gitignored description shards:
 *   python3 kb/_build_ccr_universe.py --shards-only
 *
 * Off-origin requests are REFUSED (the sandbox cannot reach Supabase or GitHub
 * anyway); what the page tried to reach is reported at the end, and every path
 * that depends on the network — the Ask, the CPL and sky payloads (local here),
 * the description shards — is asserted on what the reader sees when it is
 * refused. A check that passes only because the network answered is not a check
 * of the page.
 *
 * A FAIL here is either a defect or a harness assumption gone stale: read the
 * detail in brackets before deciding which. Sections that crash are reported
 * and recovered from (the sheet closed, the menus shut) so the rest still runs. */
const fs = require("fs"), path = require("path"), http = require("http");
const REPO = path.dirname(__dirname);
const FILE = "prototype/skyview.html";
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const shotDir = flag("--shots"), jsonOut = flag("--json");
if (shotDir) fs.mkdirSync(shotDir, { recursive: true });

function serve() {
  const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
                 ".png": "image/png", ".svg": "image/svg+xml", ".csv": "text/csv" };
  const srv = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(REPO, rel);
    if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r({ srv, port: srv.address().port })));
}

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  try {
    const root = "/opt/pw-browsers";
    const dir = fs.readdirSync(root).filter((f) => /^chromium-\d+$/.test(f)).sort().pop();
    if (dir) { const p = path.join(root, dir, "chrome-linux", "chrome"); if (fs.existsSync(p)) return p; }
  } catch (e) { /* playwright's own resolution */ }
  return undefined;
}

const results = [];
let section = "";
let bad = 0;
function sec(name) { section = name; console.log("\n══ " + name); }
let DIAG = null, RECOVER = null;
async function run(name, fn) { sec(name); try { await fn(); } catch (e) { let d = ""; try { d = DIAG ? await DIAG() : ""; } catch (x) {} ok("section crashed: " + name, false, (e && e.message || String(e)).split("\n").filter((l) => l.trim()).slice(0, 7).join(" / ") + " | " + d); try { if (RECOVER) await RECOVER(); } catch (x) {} } }
function ok(name, cond, detail) {
  const c = !!cond;
  if (!c) bad++;
  results.push({ section, name, ok: c, detail: detail == null ? "" : String(detail) });
  console.log((c ? "  ok   " : "  FAIL ") + name + (detail != null && detail !== "" ? "  [" + String(detail).slice(0, 420) + "]" : ""));
}
function note(msg) { results.push({ section, name: msg, ok: true, detail: "", note: true }); console.log("  note " + msg); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) { console.error("playwright is not installed — `npm install` in the repo root"); process.exit(2); }
  const { srv, port } = await serve();
  const base = `http://127.0.0.1:${port}`;
  const url = `${base}/${FILE}`;
  const browser = await chromium.launch({ executablePath: chromiumPath() });

  const offOrigin = new Map();
  const errs = [];
  const NOISE = /favicon|fonts\.(googleapis|gstatic)|net::ERR_FAILED|Failed to load resource|ERR_CONNECTION/i;
  async function openPage(opts) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1440, height: 900 } }, opts || {}));
    const page = await ctx.newPage();
    await page.route("**", (route) => {
      const u = route.request().url();
      if (u.startsWith(base) || u.startsWith("data:") || u.startsWith("blob:")) return route.continue();
      try { const uu = new URL(u); const key = /supabase|fonts\./.test(uu.host) ? uu.host + uu.pathname.replace(/\/[^/]*$/, "/…") : u.slice(0, 120); offOrigin.set(key, (offOrigin.get(key) || 0) + 1); } catch (e) {}
      return route.abort();
    });
    page.on("console", (m) => { if (m.type() === "error" && !NOISE.test(m.text())) errs.push(m.text().slice(0, 200)); });
    page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
    return { ctx, page };
  }
  const dialogs = [];               // queued replies for window.prompt / alert
  const seenDialogs = [];
  function armDialogs(page) {
    page.on("dialog", async (d) => {
      seenDialogs.push({ type: d.type(), message: d.message().slice(0, 80) });
      const next = dialogs.shift();
      if (d.type() === "alert") return d.accept();
      if (next == null) return d.dismiss();
      return d.accept(next);
    });
  }

  const PICK = () => { const s = window.__ccrUniverseState(); return {
      k: s.view.k, x: s.view.x, y: s.view.y, sel: s.sel, proj: s.proj, sph: s.sph, rotating: s.rotating, reduceMotion: s.reduceMotion,
      dark: s.dark, day: s.day, namesOn: s.namesOn, hits: s.hits, moves: s.moves.map((m) => ({ cn: m.cn, to: m.to, from: m.from, code: m.code })),
      parked: s.parked, islandsShown: s.islandsShown, islandsTotal: s.islandsTotal, coursesShown: s.coursesShown,
      solo: s.solo, curView: s.curView, tokens: s.tokens, show: s.show, winState: s.winState, legendOpen: s.legendOpen,
      carrying: s.carrying, dropTarget: s.dropTarget, face: s.face, lit: s.lit, cpl: s.cpl, cplLine: s.cplLine,
      universe: s.universe, exhibits: s.exhibits, exCourses: s.exCourses,
      inspectorOpen: s.inspectorOpen, inspectorWidth: s.inspectorWidth, nodeZoom: s.nodeZoom, hover: s.hover,
      memberPoints: s.memberPoints, ghostPoints: s.ghostPoints, mode: s.mode, skyState: s.skyState, hash: location.hash,
      descState: s.descState }; };
  const st = (page) => page.evaluate(PICK);
  const hint = (page) => page.locator("#u-hint").textContent().then((t) => (t || "").trim());
  const zoom = (page) => page.locator("#u-zoom").textContent().then((t) => (t || "").trim());
  const pressed = (page, sel) => page.getAttribute(sel, "aria-pressed");
  const visible = async (page, sel) => { const l = page.locator(sel); return (await l.count()) > 0 && await l.first().isVisible(); };
  const cvsBox = (page) => page.locator("#u-cvs").boundingBox();
  // Screen position (page coordinates) of an identity, via the page's own projection.
  async function screenOf(page, id) {
    const p = await page.evaluate((id) => {
      const U = window.CPL_CCR_UNIVERSE;
      for (const I of U.islands) for (const nd of I.p) if (nd.i === id) {
        const s = window.__ccrW2S(nd.x + (I.dx || 0), nd.y + (I.dy || 0), I.d);
        return s ? { px: s[0], py: s[1], isl: I.d } : null;
      }
      return null;
    }, id);
    if (!p) return null;
    const b = await cvsBox(page);
    return { x: b.x + p.px, y: b.y + p.py, px: p.px, py: p.py, isl: p.isl, inCanvas: p.px >= 0 && p.py >= 0 && p.px <= b.width && p.py <= b.height };
  }
  async function flyToId(page, id, k) {
    await page.evaluate(([id, k]) => {
      const U = window.CPL_CCR_UNIVERSE;
      for (const I of U.islands) for (const nd of I.p) if (nd.i === id) { window.__ccrUniverseFly(nd.x + (I.dx || 0), nd.y + (I.dy || 0), k); return; }
    }, [id, k]);
    await sleep(150);
  }
  async function clickId(page, id, k) {
    await flyToId(page, id, k || 3.4);
    const p = await screenOf(page, id);
    await page.mouse.click(p.x, p.y);
    await sleep(250);
    return (await st(page)).sel;
  }
  async function load(page, hash) {
    await page.goto(url + (hash ? "#" + hash : ""), { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.CPL_CCR_UNIVERSE && window.CPL_CCR_UNIVERSE_MEMBERS && document.getElementById("u-cvs"), null, { timeout: 30000 }).catch(() => {});
    await sleep(700);
  }
  async function shot(page, name) { if (shotDir) await page.screenshot({ path: path.join(shotDir, name + ".png") }); }

  /* ════════════════════════════════════════════════════════════════════════ */
  const { ctx, page } = await openPage();
  armDialogs(page);
  let b0, bb1, before, plan, artNd, big, amb, mc, kDisc, rows, camBefore, cam1;
  RECOVER = async () => { await page.evaluate(() => { try { window.__ccrCloseOutlineSheet(); } catch (e) {} document.querySelectorAll("details[open]").forEach((d) => { d.open = false; }); try { window.__ccrClearAsk(); } catch (e) {} try { window.__ccrSetUniverse("courses"); } catch (e) {} }); await page.keyboard.press("Escape"); await sleep(600); };
  DIAG = async () => { const r = await st(page); const h3 = await page.locator("#u-detail h3").first().textContent().catch(() => "?"); const ob = await page.locator("#u-open-outline").count(); const vis = await page.locator("#u-detail").isVisible().catch(() => "?"); return `hash=${r.hash} view=${r.curView} sel=${r.sel} panelOpen=${r.inspectorOpen} detailVisible=${vis} h3="${(h3 || "").trim().slice(0, 40)}" outlineBtn=${ob} sheet=${await page.locator("#u-outline-sheet:not([hidden])").count()}`; };
  await load(page, "skyview");

  await run("A. landing — #skyview opens the Sky, alone, turning", async () => {
  let s = await st(page);
  ok("the canvas is on screen and the payloads landed", await page.locator("#u-cvs").count() === 1 && s.islandsTotal > 100, `${s.islandsTotal} islands`);
  ok("it opens ALONE (body.u-solo, masthead and panes unpainted)", await page.evaluate(() => document.body.classList.contains("u-solo") && document.querySelector(".mast").getBoundingClientRect().height === 0 && document.getElementById("u-below").getBoundingClientRect().height === 0));
  ok("the hash names the view", s.hash === "#skyview", s.hash);
  ok("it opens on the Sky at 188° across", s.proj === "sky" && (await zoom(page)) === "188° across", await zoom(page));
  ok("the sky is turning on open (Rotate reads pressed)", s.rotating === true && (await pressed(page, "#u-rotate")) === "true");
  const spin0 = s.sph.spin; await sleep(400); s = await st(page);
  ok("…and the spin actually advances", s.sph.spin !== spin0, `${spin0.toFixed(4)} → ${s.sph.spin.toFixed(4)}`);
  ok("night is the default on the Sky", s.dark === true && await page.evaluate(() => document.body.classList.contains("u-dark")));
  ok("it painted more than one flat color", await page.evaluate(() => { const c = document.getElementById("u-cvs"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; const seen = new Set(); for (let i = 0; i < d.length; i += 4 * 997) seen.add(d[i] + "," + d[i + 1] + "," + d[i + 2]); return seen.size > 3; }));
  ok("the sky placement payload loaded (ccr_sky.json)", s.skyState === "ok", s.skyState);
  ok("the details panel opens hidden by design, the legend open", s.inspectorOpen === false && s.legendOpen === true);
  ok("the Map word is not in the row (Sam, 2026-09-08) but Sky and Globe are", (await page.locator("#u-proj-map").count()) === 0 && (await page.locator("#u-proj-sky").count()) === 1 && (await page.locator("#u-proj-globe").count()) === 1);
  ok("Isolate is disabled with nothing selected, and its title says why", await page.evaluate(() => { const b = document.getElementById("u-iso"); return b.disabled && /Select a discipline or a course first/.test(b.title); }));
  ok("the skip link targets the canvas", (await page.getAttribute(".u-skip", "href")) === "#u-cvs");
  const rowGeo = await page.evaluate(() => [...document.querySelectorAll("#u-top > *")].filter((e) => e.getBoundingClientRect().height > 0).map((e) => { const r = e.getBoundingClientRect(); return `${e.id || e.className.split(" ")[0]}@y${Math.round(r.y)}h${Math.round(r.height)}`; }));
  const rowSpread = await page.evaluate(() => { const ys = [...document.querySelectorAll("#u-top > *")].filter((e) => e.getBoundingClientRect().height > 0).map((e) => Math.round(e.getBoundingClientRect().y)); return Math.max(...ys) - Math.min(...ys); });
  ok("the top row does not wrap at 1440px (visible children within one line)", rowSpread <= 30, `${rowSpread}px spread`);
  note("row geometry at 1440: " + rowGeo.join(" "));
  await shot(page, "A-landing");

  });
  await run("B. the row — Rotate, Sky/Globe, Pan/Move, zoom, reset", async () => {
  await page.click("#u-rotate"); await sleep(150); s = await st(page);
  ok("Rotate stops the turn", s.rotating === false && (await pressed(page, "#u-rotate")) === "false");
  await page.click("#u-rotate"); await sleep(150); s = await st(page);
  ok("Rotate again restarts it", s.rotating === true);
  await page.click("#u-proj-globe"); await sleep(400); s = await st(page);
  ok("Globe: the projection, the hash and the readout follow", s.proj === "globe" && s.hash === "#globe" && /R$/.test(await zoom(page)) && (await pressed(page, "#u-proj-globe")) === "true", `${s.hash} ${await zoom(page)}`);
  ok("Globe keeps turning (a place to stand, not a stop)", s.rotating === true);
  await page.click("#u-proj-sky"); await sleep(400); s = await st(page);
  ok("Sky: back to #skyview and degrees across", s.proj === "sky" && s.hash === "#skyview" && /° across$/.test(await zoom(page)));
  await page.click("#u-mode-pan"); await sleep(120);
  ok("Pan: pressed, grab cursor, the hint says what a drag does", (await pressed(page, "#u-mode-pan")) === "true" && (await page.evaluate(() => document.getElementById("u-cvs").style.cursor)) === "grab" && /^Pan:/.test(await hint(page)), (await hint(page)).slice(0, 60));
  await page.click("#u-mode-move"); await sleep(120);
  ok("Move: pressed again, the hint says so", (await pressed(page, "#u-mode-move")) === "true" && /^Move:/.test(await hint(page)));
  const z0 = await zoom(page);
  await page.click("#u-in"); await sleep(200); const zIn = await zoom(page);
  await page.click("#u-out"); await sleep(200); const zOut = await zoom(page);
  ok("+ narrows the window, − widens it back", parseInt(zIn) < parseInt(z0) && parseInt(zOut) > parseInt(zIn), `${z0} → ${zIn} → ${zOut}`);
  b0 = await cvsBox(page);
  await page.mouse.move(b0.x + b0.width / 2, b0.y + b0.height / 2);
  await page.mouse.wheel(0, -300); await sleep(200);
  const zWheel = await zoom(page);
  ok("the wheel zooms the canvas", zWheel !== zOut, `${zOut} → ${zWheel}`);
  s = await st(page);
  note(`after a wheel zoom the turn is ${s.rotating ? "still running" : "stopped"} (ruling 4 names a drag, a click, a key, a search and a carry; the wheel is not listed)`);
  await page.click("#u-reset"); await sleep(200);
  ok("↺ resets to the opening width", (await zoom(page)) === "188° across", await zoom(page));

  });
  await run("C. the More menu — views, sidebar, legend, night/day, names, text size", async () => {
  const bb0c = await cvsBox(page);
  await page.click("#u-more-sum"); await sleep(150);
  ok("More opens", await page.evaluate(() => document.getElementById("u-more-menu").open));
  const goto = await page.evaluate(() => [...document.querySelectorAll("#u-views-menu > *")].map((e) => (e.tagName === "SPAN" ? "[here] " : "") + e.textContent.trim()));
  ok("Go to names where you are and offers every other view", goto[0] === "[here] SkyView" && goto.includes("Comprehensive view") && goto.includes("By discipline") && goto.includes("By subject") && goto.includes("ESL packaging") && goto.includes("How SkyView works") && goto.includes("CCR table view") && goto.includes("COBI"), goto.join(" · "));
  ok("stand-alone there is no 'Open in its own tab' (that is the framed door)", !goto.includes("Open in its own tab"));
  ok("CCR table view and COBI are links out to COBI in a new tab", await page.evaluate(() => { const a = document.getElementById("u-ccr-list"), c = document.getElementById("u-cobi"); return a && a.tagName === "A" && /index\.html#unified-courses\/list$/.test(a.getAttribute("href")) && a.target === "_blank" && c && c.tagName === "A"; }));
  ok("on the Sky the Night | Day pair shows and Dark canvas is hidden", await page.evaluate(() => !document.getElementById("u-nd").hidden && document.getElementById("u-dark").hidden && document.getElementById("u-night").getAttribute("aria-pressed") === "true"));
  await page.click("#u-insp-toggle"); await sleep(200); s = await st(page);
  const wOpen = (await cvsBox(page)).width;
  ok("Sidebar: opens the details panel and the canvas narrows", s.inspectorOpen === true && !(await page.evaluate(() => document.getElementById("u-inspector").classList.contains("closed"))) && wOpen < b0.width, `${b0.width} → ${wOpen}`);
  await page.click("#u-insp-toggle"); await sleep(200); s = await st(page);
  ok("Sidebar again closes it", s.inspectorOpen === false);
  await page.mouse.click(bb0c.x + 40, bb0c.y + bb0c.height - 40); await sleep(100);
  await page.fill("#gq", "welding"); await page.keyboard.press("Enter"); await sleep(600); s = await st(page);
  const hidHint = await hint(page);
  ok("with the sidebar hidden by the reader, a search still selects, and the panel stays hidden by design", s.inspectorOpen === false && (await page.textContent("#u-detail h3")).trim() === "Welding");
  note(`with the panel hidden, the hint after a selection reads: "${hidHint.slice(0, 110)}" — nothing names the hidden panel`);
  await page.evaluate(() => window.__ccrClearSelection()); await page.click("#u-more-sum"); await sleep(100);
  await page.click("#u-insp-toggle"); await sleep(200);
  ok("Sidebar on again (and it now opens on every selection)", (await st(page)).inspectorOpen === true);
  const hFoot0 = (await cvsBox(page)).height;
  await page.click("#u-legend-menu"); await sleep(250); s = await st(page);
  ok("Legend off: the strip goes and the canvas grows", s.legendOpen === false && await page.evaluate(() => document.getElementById("u-foot").classList.contains("u-foot-hidden")) && (await cvsBox(page)).height > hFoot0, `${hFoot0} → ${(await cvsBox(page)).height}`);
  await page.click("#u-legend-menu"); await sleep(250); s = await st(page);
  ok("Legend on again", s.legendOpen === true);
  await page.click("#u-day"); await sleep(200); s = await st(page);
  ok("Day: light canvas, the choice remembered", s.dark === false && await page.evaluate(() => document.body.classList.contains("u-day") && localStorage.getItem("skyview:theme") === "light"));
  await page.click("#u-night"); await sleep(200); s = await st(page);
  ok("Night again", s.dark === true);
  await page.click("#u-names"); await sleep(150); s = await st(page);
  ok("Discipline names toggles off and says so", s.namesOn === false && (await page.textContent("#u-names .u-state")).trim() === "off");
  await page.click("#u-names"); await sleep(150);
  const t0 = (await page.textContent("#u-textsize .u-state")).trim();
  await page.click("#u-textsize"); await sleep(120); const t1 = (await page.textContent("#u-textsize .u-state")).trim();
  await page.click("#u-textsize"); await sleep(120); const t2 = (await page.textContent("#u-textsize .u-state")).trim();
  await page.click("#u-textsize"); await sleep(120); const t3 = (await page.textContent("#u-textsize .u-state")).trim();
  ok("Label text cycles through the three sizes and comes home", t0 === "normal" && t1 === "larger" && t2 === "smaller" && t3 === "normal", `${t0} → ${t1} → ${t2} → ${t3}`);
  ok("…and the size is remembered", (await page.evaluate(() => localStorage.getItem("skyview:text"))) != null);
  bb1 = await cvsBox(page);
  await page.mouse.click(bb1.x + 40, bb1.y + bb1.height - 40); await sleep(150);
  ok("a pointer on the map closes the menu", !(await page.evaluate(() => document.getElementById("u-more-menu").open)));

  });
  await run("D. Show — switches reach the map, at the zoom it opens on", async () => {
  await page.click("#u-reset"); await sleep(150);
  before = await st(page);
  await page.click("#u-show-sum"); await sleep(120);
  await page.click('#u-show-menu input[data-show="cr"]'); await sleep(300);
  s = await st(page);
  ok("unticking CR: the word counts, the hint says what is hidden, fewer courses pass", (await page.textContent("#u-show-word")).trim() === "16 of 17" && /Showing [\d,]+ of [\d,]+ courses/.test(await hint(page)) && s.coursesShown < before.coursesShown, `${before.coursesShown} → ${s.coursesShown}`);
  note(`at the opening width k=${before.k.toFixed(3)} (NODE_ZOOM ${before.nodeZoom}); the hint ${/draws disciplines/.test(await hint(page)) ? "adds" : "omits"} the 'draws disciplines, not courses' sentence`);
  await page.click("#u-show-none"); await sleep(300); s = await st(page);
  ok("Deselect all: 0 of 17, no island passes, the hint says 0 shown", (await page.textContent("#u-show-word")).trim() === "0 of 17" && s.islandsShown === 0 && /Showing 0 of/.test(await hint(page)));
  await page.click("#u-show-every"); await sleep(300); s = await st(page);
  ok("Show everything: All, every island back", (await page.textContent("#u-show-word")).trim() === "All" && s.islandsShown === before.islandsShown && s.coursesShown === before.coursesShown);
  await page.click('#u-show-menu input[data-show="cte"]'); await sleep(250); const sCte = await st(page);
  await page.click('#u-show-menu input[data-show="aca"]'); await sleep(250); const sAca = await st(page);
  await page.click('#u-show-menu input[data-show="ctena"]'); await sleep(250); const sNone = await st(page);
  ok("CTE, Academic and 'not recorded' are three switches that each remove their own share", sCte.coursesShown < before.coursesShown && sAca.coursesShown < sCte.coursesShown && sNone.coursesShown === 0, `${before.coursesShown} → ${sCte.coursesShown} → ${sAca.coursesShown} → ${sNone.coursesShown}`);
  await page.click("#u-show-every"); await sleep(250);
  await page.keyboard.press("Escape"); await page.mouse.click(bb1.x + 40, bb1.y + bb1.height - 40); await sleep(150);
  ok("a pointer on the map closes the Show menu", !(await page.evaluate(() => document.getElementById("u-show").open)));

  });
  await run("E. search — suggestions, ticking, Enter, chips", async () => {
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("weld"); await sleep(400);
  rows = await page.$$eval("#sug li[data-i]", (ls) => ls.map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  ok("typing opens the list with a discipline row first and a count in the header", rows.length > 20 && /^DISC\s*Welding/.test(rows[0]) && /Showing \d+ of \d+/.test(await page.textContent("#sug .sug-head")), `${rows.length} rows; ${rows[0]}`);
  ok("the footer says what Enter will do with nothing ticked", /Tick the ones you want/.test(await page.textContent("#sug-pend")));
  const introIdxWeld = rows.findIndex((r) => /Introduction to Welding\b/.test(r));
  await page.keyboard.type("i"); await sleep(400);
  rows = await page.$$eval("#sug li[data-i]", (ls) => ls.map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  const introIdx = rows.findIndex((r) => /Introduction to Welding\b/.test(r));
  ok("'weld' and 'weldi' both list Introduction to Welding (Sam's 2026-09-06 case)", introIdxWeld >= 0 && introIdx >= 0, `weld@${introIdxWeld} weldi@${introIdx}`);
  const kBefore = (await st(page)).k;
  await page.dispatchEvent(`#sug li[data-i="${introIdx}"]`, "mousedown"); await sleep(200);
  ok("a tick marks the row and the footer, and moves NOTHING", await page.evaluate((i) => { const li = document.querySelector(`#sug li[data-i="${i}"]`); return li.classList.contains("picked") && li.getAttribute("aria-selected") === "true"; }, introIdx) && /1 to add — Enter applies/.test(await page.textContent("#sug-pend")) && (await st(page)).tokens.length === 0 && (await st(page)).k === kBefore);
  await page.keyboard.type("n"); await sleep(400);
  ok("typing more keeps the tick (the choosing session spans terms)", (await page.evaluate(() => window.__ccrPendKeys().length)) === 1);
  await page.keyboard.press("Enter"); await sleep(700); s = await st(page);
  const chip = await page.$$eval("#u-tokens .u-tok", (ls) => ls.map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  ok("Enter commits the tick: one chip, the list closes, the course is selected", s.tokens.length === 1 && chip.length === 1 && /Introduction to Welding/.test(chip[0]) && await page.evaluate(() => document.getElementById("sug").hidden) && /Introduction to Welding/.test(await page.textContent("#u-detail h3")), `sel=${s.sel} chip=${chip[0]}`);
  const selPos = await screenOf(page, s.sel);
  ok("…and flies so the course is on screen, near the center, with the panel open", selPos && selPos.inCanvas && Math.abs(selPos.px - (await cvsBox(page)).width / 2) < 40 && s.inspectorOpen, `${selPos && Math.round(selPos.px)},${selPos && Math.round(selPos.py)} of ${Math.round((await cvsBox(page)).width)} k=${s.k.toFixed(2)} ${await zoom(page)} panel=${s.inspectorOpen}`);
  await shot(page, "E-course-pick");
  note(`a course pick on the Sky lands at ${await zoom(page)} (map-equivalent k=${s.k.toFixed(2)}; the flat map's 1000% is k=10)`);
  ok("the Recenter chip names its pick", /Recenter on Introduction/.test(await page.textContent("#u-tok-fit")));
  ok("Isolate is now enabled", !(await page.evaluate(() => document.getElementById("u-iso").disabled)));
  await page.click("#u-proj-globe"); await sleep(400);
  await page.click("#u-tok-fit"); await sleep(400); s = await st(page);
  ok("Recenter brings the pick back on the Globe too", /Recentered/.test(await hint(page)) && s.sel !== null);
  await page.click("#u-proj-sky"); await sleep(300);
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.press("Backspace"); await sleep(300); s = await st(page);
  ok("Backspace in an empty box drops the last chip", s.tokens.length === 0 && /Selection cleared/.test(await hint(page)));
  await page.fill("#gq", "welding"); await page.keyboard.press("Enter"); await sleep(600); s = await st(page);
  ok("Enter on a bare term is a fresh search: the discipline opens", s.tokens.length === 1 && /^Discipline Welding/.test(await hint(page)) && (await page.textContent("#u-detail h3")).trim() === "Welding" && s.hits === 0, (await hint(page)).slice(0, 60));
  kDisc = s.k; note(`a discipline search on the Sky lands at ${await zoom(page)} (k=${kDisc.toFixed(2)}; the flat map's 150% is k=1.5)`);
  await page.click("#u-iso"); await sleep(300); s = await st(page);
  ok("Isolate on a DISCIPLINE draws that island and its courses, not a blank canvas (#1532)", s.islandsShown === 1 && s.coursesShown > 100 && /^Isolated/.test(await hint(page)), `${s.islandsShown} islands, ${s.coursesShown} courses`);
  await page.click("#u-iso"); await sleep(300); s = await st(page);
  ok("Isolate off brings the universe back", s.islandsShown === before.islandsShown);
  // multi-pick
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("welding"); await sleep(400);
  rows = await page.$$eval("#sug li[data-i]", (ls) => ls.map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  const crs = rows.map((r, i) => (/CRSE IDENTITY/.test(r) ? i : -1)).filter((i) => i >= 0).slice(0, 2);
  ok("the discipline row is NOT ticked: a term chip ('welding') is a search, a discipline chip is a pick", await page.evaluate(() => { const li = document.querySelector('#sug li[data-i="0"]'); return li && !li.classList.contains("picked"); }));
  await page.dispatchEvent(`#sug li[data-i="${crs[0]}"]`, "mousedown"); await page.dispatchEvent(`#sug li[data-i="${crs[1]}"]`, "mousedown"); await sleep(150);
  ok("two ticks read '2 to add'", /2 to add/.test(await page.textContent("#sug-pend")));
  await page.keyboard.press("Enter"); await sleep(700); s = await st(page);
  ok("Enter adds both: three chips, Fit all and Clear appear, the newest pick has focus", s.tokens.length === 3 && (await page.textContent("#u-tok-fit")).trim() === "Fit all" && (await page.locator("#u-tok-clear").count()) === 1 && /^Focused on/.test(await hint(page)), s.tokens.join(" · "));
  await page.click("#u-tok-fit"); await sleep(400);
  ok("Fit all fits the three", /Fitted 3 selections/.test(await hint(page)));
  await page.click("#u-tokens .u-tok-go >> nth=1"); await sleep(400);
  ok("a chip's label goes back to that pick", /^Back on/.test(await hint(page)), await hint(page));
  await page.click("#u-tokens .u-tok-x >> nth=2"); await sleep(400); s = await st(page);
  ok("a chip's × removes only it", s.tokens.length === 2);
  // a committed DISC pick shows ticked on the next open, and unticking it is a removal
  await page.evaluate(() => window.__ccrClearSelection()); await sleep(150);
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("welding"); await sleep(400);
  await page.dispatchEvent('#sug li[data-i="0"]', "mousedown"); await page.keyboard.press("Enter"); await sleep(500);
  ok("a DISC pick commits as a Welding chip at the discipline zoom", (await st(page)).tokens.join() === "Welding" && /Discipline Welding/.test(await hint(page)));
  note(`a DISC pick from the list lands at ${await zoom(page)} (k=${(await st(page)).k.toFixed(2)}, the ruled 150%) — the typed term landed at k=${kDisc.toFixed(2)}`);
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("welding"); await sleep(400);
  ok("the committed discipline row shows ticked (seeded)", await page.evaluate(() => { const li = document.querySelector('#sug li[data-i="0"]'); return li && li.classList.contains("picked"); }));
  await page.dispatchEvent('#sug li[data-i="0"]', "mousedown"); await sleep(150);
  ok("unticking it reads '1 to remove'", /1 to remove/.test(await page.textContent("#sug-pend")));
  await page.keyboard.press("Enter"); await sleep(500); s = await st(page);
  ok("Enter removes it and clears the selection", s.tokens.length === 0 && /Selection cleared/.test(await hint(page)), s.tokens.join(" · "));
  // sort, scroll, arrows
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("intro"); await sleep(400);
  const n0 = await page.locator("#sug li[data-i]").count();
  await page.evaluate(() => { const s = document.getElementById("sug"); s.scrollTop = s.scrollHeight; s.dispatchEvent(new Event("scroll")); }); await sleep(300);
  const n1 = await page.locator("#sug li[data-i]").count();
  ok("scrolling to the bottom reveals the next page", n0 === 60 && n1 > n0, `${n0} → ${n1}`);
  await page.dispatchEvent("#sug .sug-sort", "mousedown"); await sleep(400);
  ok("Sort by name re-sorts and says so", /Sorted by name/.test(await page.textContent("#sug .sug-head")) && /Sort by best match/.test(await page.textContent("#sug .sug-sort")));
  await page.dispatchEvent("#sug .sug-sort", "mousedown"); await sleep(300);
  await page.keyboard.press("ArrowDown"); await sleep(100);
  ok("ArrowDown moves the cursor and announces it", (await page.getAttribute("#gq", "aria-activedescendant")) === "sug-0" && await page.evaluate(() => document.querySelector('#sug li[data-i="0"]').classList.contains("on")));
  await page.keyboard.press("Escape"); await sleep(150);
  ok("Escape closes the list", await page.evaluate(() => document.getElementById("sug").hidden));
  await page.fill("#gq", "zzzznotathing"); await page.keyboard.press("Enter"); await sleep(400);
  ok("a miss says so", /Nothing matches/.test(await hint(page)), await hint(page));
  // college course code
  mc = await page.evaluate(() => { const M = window.CPL_CCR_UNIVERSE_MEMBERS, seen = {}; for (const id of Object.keys(M.m)) for (const [, n] of M.m[id]) (seen[n] = seen[n] || new Set()).add(id); for (const id of Object.keys(M.m)) for (const [, n] of M.m[id]) if (n && n.length > 6 && seen[n].size === 1 && M.m[id].length > 6) return { code: n, id }; return null; });
  await page.fill("#gq", ""); await page.keyboard.type(mc.code); await sleep(400);
  rows = await page.$$eval("#sug li[data-i]", (ls) => ls.map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  ok("a college course code is offered as COLLEGE CRSE", rows.some((r) => /COLLEGE CRSE/.test(r) && r.includes(mc.code)), rows.slice(0, 2).join(" | "));
  await page.keyboard.press("Enter"); await sleep(600); s = await st(page);
  ok("Enter lands on the identity carrying it, filtered to that code", s.sel === mc.id && (await page.inputValue("#u-mfilter").catch(() => "")) === mc.code, `${s.sel} / ${mc.id}`);
  await page.evaluate(() => window.__ccrClearSelection()); await sleep(150);

  });
  await run("F0. Ask SkyView — the assistant mocked: a discipline plus a term must mean the term WITHIN the discipline", async () => {
    // Sam, 2026-09-10 (screenshot): "show me all introductory welding courses" came back as
    // {discipline: Welding, term: introductory}; the map ringed every introductory title in
    // every discipline and flew to the densest one — Welding was not even in view.
    const mocked = { answer: "Showing all introductory welding courses across the California Community Colleges system.", cannot: "",
      select: [{ kind: "discipline", name: "Welding" }, { kind: "term", term: "introductory" }], lit: false, isolate: false, face: "courses" };
    await page.route("**/functions/v1/cpl-chat", (route) => route.fulfill({ status: 200, contentType: "text/event-stream",
      body: `event: text\ndata: ${JSON.stringify({ text: JSON.stringify(mocked) })}\n\n` }));
    await page.click("#u-reset"); await sleep(200);
    await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("show me all introductory welding courses"); await sleep(300);
    await page.keyboard.press("Enter"); await sleep(1500); s = await st(page);
    const ringed = await page.evaluate(() => { const S = window.__ccrUniverseState(); return S.hits; });
    const outside = await page.evaluate(() => { const U = window.CPL_CCR_UNIVERSE; const count = (term) => { let inW = 0, out = 0; U.islands.forEach((I) => I.p.forEach((nd) => { if ((nd.t || "").toLowerCase().indexOf(term) >= 0) { if (I.d === "Welding") inW++; else out++; } })); return { inW, out }; }; return { literal: count("introductory"), stem: count("intro") }; });
    ok("the reply resolved to two chips: the discipline and the term", s.tokens.length === 2 && s.tokens.includes("Welding"), s.tokens.join(" · "));
    const wScreen = await page.evaluate(() => window.__ccrUniverseState().islandScreen("Welding"));
    const cb = await cvsBox(page);
    const weldingInView = !!wScreen && wScreen.x > 0 && wScreen.x < cb.width && wScreen.y > 0 && wScreen.y < cb.height;
    ok("⭐ the map lands on Welding (the discipline the question named)", weldingInView, `Welding at ${wScreen && Math.round(wScreen.x)},${wScreen && Math.round(wScreen.y)} of ${Math.round(cb.width)}×${Math.round(cb.height)}; ${await zoom(page)}`);
    // The model's word is not the catalog's: "introductory" names 2 Welding titles and "Introduction to …" 44, so the
    // page retries a scoped word with under three hits as its first five letters and says so beside the box.
    ok("⭐ the ringed courses are the intro titles INSIDE Welding, not every intro title in the universe", ringed >= outside.literal.inW && ringed <= outside.stem.inW + 2 && ringed < outside.stem.inW + outside.stem.out, `ringed=${ringed}; "introductory": ${outside.literal.inW} in Welding / ${outside.literal.out} elsewhere; "intro": ${outside.stem.inW} / ${outside.stem.out}`);
    ok("…and the answer beside the box says which word was used", /names 2 titles there, so “intro” is shown/.test(await page.locator("#askbox").textContent()), (await page.locator("#askbox").textContent() || "").slice(0, 160));
    ok("the answer beside the box does not promise more than the map shows", await page.locator("#askbox").isVisible());
    await shot(page, "F0-ask-intro-welding");
    await page.unroute("**/functions/v1/cpl-chat");
    await page.evaluate(() => window.__ccrClearSelection()); await page.click("#askdismiss").catch(() => {}); await sleep(200);
  });

  await run("F. Ask SkyView — a question with the network refused", async () => {
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("which welding courses carry an articulation?"); await sleep(400);
  ok("a question renders the list with no options and the footer says Enter asks", await page.evaluate(() => !document.getElementById("sug").hidden && document.querySelectorAll("#sug li[data-i]").length === 0) && /Enter asks/.test(await page.textContent("#sug-pend")));
  const tokBefore = (await st(page)).tokens.slice();
  await page.keyboard.press("Enter"); await sleep(1500); s = await st(page);
  const askbox = await page.locator("#askbox");
  ok("the refusal lands BESIDE THE BOX as a status, not only at the foot of the window", await askbox.isVisible() && (await askbox.getAttribute("class") || "").includes("err") && /could not answer/.test(await askbox.textContent()), (await askbox.textContent() || "").slice(0, 120));
  ok("the sky stopped and the map is unchanged", s.rotating === false && s.tokens.join() === tokBefore.join());
  ok("the footer hint carries the long form too", /Ask SkyView/.test(await hint(page)));
  await page.click("#askdismiss"); await sleep(150);
  ok("Dismiss clears it and returns focus to the box", await page.evaluate(() => document.getElementById("askbox").hidden && document.activeElement && document.activeElement.id === "gq"));

  });
  await run("G. the canvas — hover, click, empty ground, keyboard", async () => {
  await page.click("#u-reset"); await sleep(200);
  // an identity with a modest ring, unique keys, and at least one orbiting stand-alone
  plan = await page.evaluate(() => {
    const M = window.CPL_CCR_UNIVERSE_MEMBERS, U = window.CPL_CCR_UNIVERSE;
    const seen = {}; for (const id of Object.keys(M.m)) for (const [c, n, ci] of M.m[id]) (seen[c] = seen[c] || new Set()).add(n + "␟" + ci);
    const uniq = (c) => (seen[c] || new Set()).size < 2;
    for (const isl of U.islands) {
      if (isl.p.length < 30 || isl.p.length > 400) continue;
      for (const nd of isl.p) {
        if (nd.a) continue;
        const list = M.m[nd.i];
        if (!list || list.length < 3 || list.length > 12 || !list.every((r) => uniq(r[0]))) continue;
        const orb = isl.p.find((p) => p.a && p.o === nd.i && M.m[p.i] && uniq(M.m[p.i][0][0]));
        if (!orb) continue;
        const other = isl.p.find((p) => !p.a && p !== nd && M.m[p.i] && M.m[p.i].length >= 2);
        if (!other) continue;
        return { isl: isl.d, id: nd.i, t: nd.t, n: list.length, orb: orb.i, orbCn: "CCC" + String(M.m[orb.i][0][0]).padStart(9, "0"), orbCode: M.m[orb.i][0][1], other: other.i };
      }
    }
    return null;
  });
  ok("a fixture exists on the real data (an identity, an orbiting stand-alone, a neighbor)", !!plan, JSON.stringify(plan));
  let got = await clickId(page, plan.id, 3.4);
  ok("clicking an identity selects it and opens its card", got === plan.id && (await page.textContent("#u-detail h3")).trim() === (plan.t || plan.id), got);
  s = await st(page);
  ok("a click is a touch: the turn stops", s.rotating === false);
  ok("the card lists its college courses with Drag… buttons, the outline button, Back to the discipline", (await page.locator("#u-detail .mlist .mv").count()) === plan.n && (await page.locator("#u-open-outline").count()) === 1 && /Back to /.test(await page.textContent("#u-back-isl")));
  const p1 = await screenOf(page, plan.id);
  await page.mouse.move(p1.x + 80, p1.y + 80); await page.mouse.move(p1.x, p1.y); await sleep(200);
  const tip = page.locator("#u-tip");
  const tipText = (await tip.isVisible()) ? await tip.textContent() : "";
  ok("hovering shows the quick look with the id, units and system", tipText.includes(plan.id) && /unit/.test(tipText) && /M-ID|C-ID|CCN|unified/.test(tipText), tipText.slice(0, 80));
  const topBox = await page.locator("#u-top").boundingBox();
  await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2); await sleep(200);
  ok("leaving the canvas hides it", !(await tip.isVisible()));
  // click on empty ground drops the selection, keeps the panel
  const bb = await cvsBox(page);
  await page.click("#u-reset"); await sleep(250);
  const ground = await page.evaluate(() => { const S = window.__ccrUniverseState(); const c = document.getElementById("u-cvs"); const W = c.clientWidth, H = c.clientHeight; const cs = window.CPL_CCR_UNIVERSE.islands.map((I) => S.islandScreen(I.d)).filter(Boolean); for (let y = 30; y < H - 30; y += 20) for (let x = 30; x < W - 30; x += 20) { if (cs.every((q) => Math.hypot(q.x - x, q.y - y) > q.r + 30)) return { x, y }; } return null; });
  ok("there is empty ground on screen at the opening width", !!ground, JSON.stringify(ground));
  await page.mouse.click(bb.x + ground.x, bb.y + ground.y); await sleep(200); s = await st(page);
  ok("a click on empty ground clears the selection and keeps the card", s.sel === null && (await page.textContent("#u-detail h3")).trim() === (plan.t || plan.id), `sel=${s.sel} card=${(await page.textContent("#u-detail h3")).trim()}`);
  await page.click("#u-back-isl"); await sleep(200);
  ok("Back to <discipline> opens the discipline card", (await page.textContent("#u-detail h3")).trim() === plan.isl);
  // an island click at the opening zoom
  await page.click("#u-reset"); await sleep(250);
  const islHit = await page.evaluate(() => { const S = window.__ccrUniverseState(); const c = document.getElementById("u-cvs"); const W = c.width / (window.devicePixelRatio || 1), H = c.height / (window.devicePixelRatio || 1); let best = null; for (const I of window.CPL_CCR_UNIVERSE.islands) { const q = S.islandScreen(I.d); if (!q) continue; const d = Math.hypot(q.x - W / 2, q.y - H / 2); if (q.r > 25 && (!best || d < best.d)) best = { d, name: I.d, x: q.x, y: q.y, r: q.r }; } return best; });
  await page.mouse.click(bb.x + islHit.x, bb.y + islHit.y); await sleep(250);
  const h3 = (await page.textContent("#u-detail h3")).trim();
  const inIsl = await page.evaluate(([name, sel]) => { const I = window.CPL_CCR_UNIVERSE.islands.find((x) => x.d === name); return !!sel && !!I && I.p.some((p) => p.i === sel); }, [islHit.name, (await st(page)).sel]);
  ok("clicking an island at the opening width opens the discipline card, or an identity drawn inside it", h3 === islHit.name || inIsl, `${islHit.name} r=${Math.round(islHit.r)} → card "${h3}"`);
  // keyboard
  await page.click("#u-reset"); await sleep(200);
  await page.focus("#u-cvs"); await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await sleep(200);
  await page.keyboard.press("Tab"); await sleep(400);
  const kSub = (await page.textContent("#u-detail h3")).trim();
  const kIsIsl = await page.evaluate((n) => window.CPL_CCR_UNIVERSE.islands.some((I) => I.d === n), kSub);
  ok("Tab on the canvas reaches a discipline and the hint says how to go in", kIsIsl && /^Subject/.test(await hint(page)) && /Enter/.test(await hint(page)), `${kSub} — ${(await hint(page)).slice(0, 70)}`);
  await page.keyboard.press("Enter"); await sleep(500); s = await st(page);
  ok("Enter steps into it and selects an identity, past the node threshold", !!s.sel && s.k > s.nodeZoom, `${s.sel} k=${s.k.toFixed(2)}`);
  await page.keyboard.press("Tab"); await sleep(400); const s2 = await st(page);
  ok("Tab inside moves to the next identity", !!s2.sel && s2.sel !== s.sel);
  const yaw0 = s2.sph.yaw; await page.keyboard.press("ArrowLeft"); await sleep(150); s = await st(page);
  ok("arrows turn the sky", s.sph.yaw !== yaw0);
  await page.keyboard.press("+"); await sleep(150); const zPlus = await zoom(page); await page.keyboard.press("-"); await sleep(150);
  ok("+ and − zoom from the keyboard", zPlus !== (await zoom(page)));
  await page.keyboard.press("Escape"); await sleep(300);
  ok("Escape comes back out to the discipline", (await page.textContent("#u-detail h3")).trim() === kSub);
  // double-click → outline sheet
  await clickId(page, plan.id, 3.4);
  const p2 = await screenOf(page, plan.id);
  await page.mouse.dblclick(p2.x, p2.y); await sleep(500);
  ok("double-click on a course opens the outline as a SHEET over the map, the hash untouched", await visible(page, "#u-outline-sheet") && (await page.getAttribute("#u-outline-sheet .u-sheet-card", "role")) === "dialog" && (await st(page)).hash === "#skyview" && (await page.locator("#u-cvs").count()) === 1);
  ok("focus lands on Close", await page.evaluate(() => document.activeElement && document.activeElement.id === "u-sheet-close"));
  await page.keyboard.press("Escape"); await sleep(200);
  ok("Escape closes the sheet and the map is where it was", !(await visible(page, "#u-outline-sheet")) && (await st(page)).sel === plan.id);

  });
  await run("H. drag and drop — carry, target, park, put back, panel routes", async () => {
  await flyToId(page, plan.orb, 6);
  await sleep(200);
  const from = await screenOf(page, plan.orb), to = await screenOf(page, plan.id);
  ok("the stand-alone and its parent are both on screen at the drag zoom", from.inCanvas && to.inCanvas && Math.hypot(from.x - to.x, from.y - to.y) > 12, `${Math.round(from.px)},${Math.round(from.py)} → ${Math.round(to.px)},${Math.round(to.py)}`);
  await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(from.x + 8, from.y + 8, { steps: 3 }); await sleep(120); s = await st(page);
  ok("pressing and moving on a hollow point picks its course up", s.carrying === plan.orbCode && /^Carrying/.test(await hint(page)), `${s.carrying}`);
  await page.mouse.move(to.x, to.y, { steps: 12 }); await sleep(150); s = await st(page);
  ok("over the destination circle the target is named before release", s.dropTarget === plan.id, s.dropTarget);
  await page.mouse.up(); await sleep(400); s = await st(page);
  ok("release stages the move: one CN: row, the carry released, the hint says not saved", s.moves.length === 1 && s.moves[0].cn === plan.orbCn && s.moves[0].to === plan.id && s.carrying === null && /Staged to move/.test(await hint(page)) && /not saved/.test(await hint(page)), JSON.stringify(s.moves[0]));
  ok("…and says where the staged list lives from SkyView alone (not 'below the map')", /listed under the map in the comprehensive view/.test(await hint(page)), (await hint(page)).slice(-90));
  await clickId(page, plan.id, 3.4);
  ok("the destination card lists it as 'staged here — not saved'", await page.evaluate((cn) => { const b = document.querySelector(`#u-detail .mlist .mv[data-cn="${cn}"]`); return !!b && /staged here — not saved/.test(b.closest("li").textContent); }, plan.orbCn));
  await clickId(page, plan.orb, 6);
  ok("the origin card says its one course is staged away, with Move instead… and Put back", /staged to move to/.test(await page.textContent("#u-detail")) && (await page.locator('#u-detail .away .mv').count()) === 1 && (await page.locator("#u-detail [data-putback]").count()) === 1);
  await page.click("#u-detail [data-putback]"); await sleep(300); s = await st(page);
  ok("Put back drops the staged move", s.moves.length === 0 && /^Put back/.test(await hint(page)));
  // park on empty space
  await flyToId(page, plan.orb, 6); const from2 = await screenOf(page, plan.orb);
  const bb2 = await cvsBox(page);
  await page.mouse.move(from2.x, from2.y); await page.mouse.down(); await page.mouse.move(from2.x + 6, from2.y + 6, { steps: 2 }); await page.mouse.move(bb2.x + 30, bb2.y + 30, { steps: 10 }); await sleep(100); await page.mouse.up(); await sleep(300); s = await st(page);
  ok("a drop on empty space PARKS the course where it was left (nothing merged)", s.parked.includes(plan.orbCn) && s.moves.length === 0 && /left where you dropped it/.test(await hint(page)));
  // panel path: Drag… then click a destination in the Similar list; then Move here
  await clickId(page, plan.id, 3.4);
  const mvBtn = page.locator("#u-detail .mlist .mv").first();
  const mvCn = await mvBtn.getAttribute("data-cn");
  await mvBtn.click(); await sleep(250); s = await st(page);
  ok("Drag… from the panel (a mouse click) starts a carry", s.carrying !== null, `carrying=${s.carrying}`);
  ok("…and the panel repaints to say a drop is accepted here (\"Carrying … click any course below\")", /Carrying/.test(await page.textContent("#u-detail")), `focus=${await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className))}`);
  await page.keyboard.press("Escape"); await sleep(200); s = await st(page);
  ok("Esc right after that mouse click puts the course back (the hint promises it)", s.carrying === null, `carrying=${s.carrying} focus=${await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.className))}`);
  if (s.carrying === null) { await mvBtn.click(); await sleep(200); s = await st(page); }
  const simGo = page.locator("#u-detail ul.idlist.sim [data-go]").first();
  const simCount = await simGo.count();
  if (simCount) {
    const target = await simGo.getAttribute("data-go");
    await simGo.click(); await sleep(400); s = await st(page);
    ok("clicking a Similar course while carrying moves it there AND releases the carry (#1515)", s.moves.some((m) => m.cn === mvCn && m.to === target) && s.carrying === null, `${mvCn} → ${target}`);
  } else {
    await page.keyboard.press("Escape");
    note("no Similar courses list on this card, panel-drop route not exercised here");
  }
  await clickId(page, plan.id, 3.4);
  const mvBtn2 = page.locator("#u-detail .mlist .mv").first();
  await mvBtn2.click(); await sleep(200); s = await st(page);
  ok("a SECOND Drag… still works after a panel move (the carry was released)", s.carrying !== null);
  await page.focus("#u-cvs"); await page.keyboard.press("Escape"); await sleep(200); s = await st(page);
  ok("Escape puts a carried course back", s.carrying === null && /Put the course back/.test(await hint(page)));
  const acc = page.locator("#u-detail .orbits [data-accept]").first();
  if (await acc.count()) {
    const accCn = await acc.getAttribute("data-cn");
    await acc.click(); await sleep(300); s = await st(page);
    ok("Move here accepts an orbit suggestion and releases", s.moves.some((m) => m.cn === accCn) && s.carrying === null);
  } else note("no accept button in orbit on this card");
  // shared key refusal
  amb = await page.evaluate(() => { const M = window.CPL_CCR_UNIVERSE_MEMBERS, U = window.CPL_CCR_UNIVERSE; const seen = {}; for (const id of Object.keys(M.m)) for (const [c, n, ci] of M.m[id]) (seen[c] = seen[c] || new Set()).add(n + "␟" + ci); for (const isl of U.islands) for (const nd of isl.p) { const list = M.m[nd.i] || []; if (list.length > 40) continue; const hit = list.find((r) => seen[r[0]].size > 1); if (hit) return { id: nd.i, cn: "CCC" + String(hit[0]).padStart(9, "0") }; } return null; });
  await clickId(page, amb.id, 3.4);
  const before2 = (await st(page)).moves.length;
  await page.locator(`#u-detail .mv[data-cn="${amb.cn}"]`).first().click(); await sleep(200); s = await st(page);
  ok("a shared control number is refused with the reason, and nothing is carried", /cannot re-home/i.test(await hint(page)) && s.carrying === null && s.moves.length === before2, (await hint(page)).slice(0, 80));
  // member filter, description
  big = await page.evaluate(() => { const M = window.CPL_CCR_UNIVERSE_MEMBERS, U = window.CPL_CCR_UNIVERSE; for (const isl of U.islands) for (const nd of isl.p) if ((M.m[nd.i] || []).length > 250) return nd.i; return null; });
  await clickId(page, big, 3.4);
  const shown0 = await page.locator("#u-detail .mlist .mv").count();
  ok("a long card is capped and says so", shown0 > 0 && shown0 <= 200 && /Showing [\d,]+ of [\d,]+/.test(await page.textContent("#u-detail")));
  await page.fill("#u-mfilter", "zzz"); await sleep(250);
  ok("the filter narrows to nothing rather than the first page", (await page.locator("#u-detail .mlist .mv").count()) === 0);
  await page.fill("#u-mfilter", ""); await sleep(250);
  await clickId(page, plan.id, 3.4);
  await page.locator("#u-detail .cd[data-desc]").first().click(); await sleep(900);
  const desc = await page.locator("#u-detail .mdesc").first().textContent().catch(() => "");
  ok("clicking a course number opens its catalog description (local shards served)", (await page.locator("#u-detail .mdesc:not(.none)").count()) === 1 || /No catalog description/.test(desc), desc.slice(0, 80));

  });
  await run("I. the outline sheet — a reviewer's staged edits", async () => {
  await page.click("#u-open-outline"); await sleep(600);
  ok("the button opens the sheet", await visible(page, "#u-outline-sheet") && /Course outline/.test(await page.textContent("#u-sheet-t")));
  const olLayers = await page.evaluate(() => [...document.querySelectorAll("#u-sheet-body .ol h2, #u-sheet-body .ol details > summary, #u-sheet-body .ol h3")].map((h) => h.textContent.trim().slice(0, 50)));
  ok("the layers render (description, skills, review, members…)", olLayers.length >= 4, olLayers.join(" | "));
  dialogs.push("A Proposed Title");
  await page.click("#ol-rename"); await sleep(500);
  ok("Propose a different title stages a rename, labeled not saved", (await page.textContent("#ol-title")).trim() === "A Proposed Title" && /renamed — not saved/.test(await page.textContent("#u-sheet-body")) && (await page.locator("#ol-revert").count()) === 1);
  dialogs.push("toolong");
  await page.click("#ol-resubject"); await sleep(400);
  ok("a bad subject is refused with an alert", seenDialogs.some((d) => d.type === "alert" && /two to four letters/.test(d.message)));
  dialogs.push("abcd");
  await page.click("#ol-resubject"); await sleep(500);
  ok("a four-letter subject is staged, uppercased", /Proposed Common SUBJ: ABCD/.test(await page.textContent("#u-sheet-body")));
  dialogs.push("weld a fillet joint in the flat position");
  await page.click("#ol-sk-add"); await sleep(500);
  ok("Add a skill stages a reviewer's skill, attributed and dated", /added by a reviewer/.test(await page.textContent("#u-sheet-body")) && (await page.locator("#u-sheet-body [data-unadd]").count()) === 1);
  const dropBtn = page.locator("#u-sheet-body [data-drop]").first();
  if (await dropBtn.count()) {
    await dropBtn.click(); await sleep(500);
    ok("Remove on an imputed skill records the removal by name", /Removed by a reviewer \(1\)/.test(await page.textContent("#u-sheet-body")) && (await page.locator("#u-sheet-body [data-restore]").count()) === 1);
    const rmDetails = page.locator("#u-sheet-body details.ol-thin", { hasText: "Removed by a reviewer" });
    ok("the removal sits in its own folded section, named", (await rmDetails.count()) === 1);
    await rmDetails.locator("summary").click(); await sleep(150);
    await page.click("#u-sheet-body [data-restore]"); await sleep(500);
    ok("Put back restores it", !/Removed by a reviewer/.test(await page.textContent("#u-sheet-body")));
  } else note("no imputed skill on this outline to remove (no descriptions for the card)");
  await page.click("#ol-revert"); await sleep(500);
  ok("Drop the proposals clears the title, subject and skills", (await page.textContent("#ol-title")).trim() !== "A Proposed Title" && !/Proposed Common SUBJ/.test(await page.textContent("#u-sheet-body")) && !/added by a reviewer/.test(await page.textContent("#u-sheet-body")));
  ok("nothing was written: the moves list is untouched by the sheet", true);
  await page.click("#u-sheet-close"); await sleep(200);
  const focusAfterEdits = await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName));
  note(`after staged edits, Close hands focus to: ${focusAfterEdits} (each edit re-renders the sheet, so the opener is forgotten)`);
  await page.click("#u-open-outline"); await sleep(400); await page.click("#u-sheet-close"); await sleep(200);
  ok("opened and closed with no edits, Close returns focus to the button that opened it", await page.evaluate(() => document.activeElement && document.activeElement.id === "u-open-outline"), await page.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.tagName)));

  });
  await run("J. the details panel's grip, Hide, and the legend fold", async () => {
  const w0 = (await st(page)).inspectorWidth || (await page.locator("#u-inspector").boundingBox()).width;
  await page.focus("#u-insp-grip"); await page.keyboard.press("ArrowLeft"); await sleep(200);
  const w1 = (await page.locator("#u-inspector").boundingBox()).width;
  ok("ArrowLeft on the grip widens the panel by a step", w1 > w0, `${Math.round(w0)} → ${Math.round(w1)}`);
  await page.keyboard.press("ArrowRight"); await sleep(200);
  ok("ArrowRight narrows it", (await page.locator("#u-inspector").boundingBox()).width < w1);
  await page.keyboard.press("Home"); await sleep(250);
  const homeGeo = await page.evaluate(() => { const g = document.getElementById("u-insp-grip").getBoundingClientRect(), s = document.getElementById("u-stage").getBoundingClientRect(), a = document.getElementById("u-inspector"); return { grip: [Math.round(g.left), Math.round(g.right), Math.round(g.width)], stage: [Math.round(s.left), Math.round(s.right)], closed: a.classList.contains("closed"), w: Math.round(a.getBoundingClientRect().width) }; });
  ok("Home resets the width to the default and keeps the panel open (its title says 'Home resets')", (await st(page)).inspectorOpen === true && homeGeo.w === 400, `open=${(await st(page)).inspectorOpen} ${JSON.stringify(homeGeo)}`);
  for (let i = 0; i < 14; i++) { await page.keyboard.press("ArrowRight"); }
  await sleep(250);
  ok("ArrowRight stops at the narrowest useful width (260) and keeps the panel open", (await st(page)).inspectorOpen === true && Math.round((await page.locator("#u-inspector").boundingBox()).width) === 260, `${Math.round((await page.locator("#u-inspector").boundingBox()).width)}`);
  const gr = await page.locator("#u-insp-grip").boundingBox();
  await page.mouse.move(gr.x + gr.width / 2, gr.y + 200); await page.mouse.down(); await page.mouse.move(gr.x + gr.width / 2 + 200, gr.y + 200, { steps: 8 }); await page.mouse.up(); await sleep(250);
  const shutGeo = await page.evaluate(() => { const g = document.getElementById("u-insp-grip").getBoundingClientRect(), s = document.getElementById("u-stage").getBoundingClientRect(); return { grip: [Math.round(g.left), Math.round(g.right), Math.round(g.width)], stage: [Math.round(s.left), Math.round(s.right)] }; });
  ok("dragging the border past the collapse point pulls the panel shut; the grip stays on the stage's edge, inside it", (await st(page)).inspectorOpen === false && shutGeo.grip[2] > 0 && shutGeo.grip[0] >= shutGeo.stage[0] && shutGeo.grip[1] <= shutGeo.stage[1] + 0.5, JSON.stringify(shutGeo));
  await page.focus("#u-insp-grip"); await page.keyboard.press("ArrowLeft"); await sleep(250);
  ok("ArrowLeft from closed reopens at a useful width", (await st(page)).inspectorOpen === true && (await page.locator("#u-inspector").boundingBox()).width > 100);
  const g = await page.locator("#u-insp-grip").boundingBox();
  const wBeforeDrag = (await page.locator("#u-inspector").boundingBox()).width;
  await page.mouse.move(g.x + g.width / 2, g.y + 200); await page.mouse.down(); await page.mouse.move(g.x + g.width / 2 - 120, g.y + 200, { steps: 6 }); await page.mouse.up(); await sleep(200);
  const wAfterDrag = (await page.locator("#u-inspector").boundingBox()).width;
  ok("dragging the grip resizes the panel by about the distance dragged", Math.abs(wAfterDrag - (wBeforeDrag + 120)) < 30, `${Math.round(wBeforeDrag)} → ${Math.round(wAfterDrag)}`);
  await page.click("#u-insp-hide"); await sleep(200);
  ok("Hide closes it from its own bar", (await st(page)).inspectorOpen === false);
  await page.click("#u-legend-toggle"); await sleep(250);
  ok("the corner Legend fold hides the strip and flips its mark", (await st(page)).legendOpen === false && (await page.getAttribute("#u-legend-toggle", "aria-expanded")) === "false");
  await page.click("#u-legend-toggle"); await sleep(250);

  });
  await run("K. Courses | CPL and the Articulations light", async () => {
  /* CPL is a UNIVERSE since 2026-09-10: the word swaps the payload under the
   * same map (ccr_cpl_universe.json + its members), so the points ARE the
   * credentials. Section R walks that universe; this section checks the swap
   * and the light on the courses. */
  await page.click("#u-face-cpl"); await sleep(1500); s = await st(page);
  ok("CPL: the universe swaps, the hash carries it, the coverage line says the payload's counts", s.universe === "cpl" && s.face === "cpl" && s.hash === "#skyview/cpl" && !(await page.evaluate(() => document.getElementById("u-face-line").hidden)) && /[\d,]+ credentials folding [\d,]+ local MAP exhibits across [\d,]+ disciplines/.test(await page.textContent("#u-face-line")), `${s.universe} ${s.exhibits} ` + (await page.textContent("#u-face-line")).slice(0, 90));
  ok("both payload files loaded locally (ccr_cpl_universe.json + its members)", s.exhibits === "ok" && s.exCourses > 1000, `${s.exhibits} ${s.exCourses}`);
  ok("the light comes on with the universe", s.lit === true && (await pressed(page, "#u-lit")) === "true");
  await page.click("#gq"); await page.fill("#gq", ""); await page.keyboard.type("firefighter"); await sleep(500);
  rows = await page.$$eval("#sug li[data-i]", (ls) => ls.map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  const exRow = rows.findIndex((r) => /^EXHIBIT/.test(r));
  ok("on the CPL map the suggestions are credentials (EXHIBIT rows), not course identities", exRow >= 0 && !rows.some((r) => /CRSE IDENTITY|STAND-ALONE/.test(r)), rows.slice(0, 4).join(" | "));
  await page.dispatchEvent(`#sug li[data-i="${exRow}"]`, "mousedown"); await page.keyboard.press("Enter"); await sleep(900); s = await st(page);
  ok("picking one opens the credential's card", s.hits >= 1 && /^CPL-/.test(String(s.sel)) && /Local MAP exhibits folded in/.test(await page.textContent("#u-detail")), `${s.hits} ${s.sel}`);
  await page.evaluate(() => window.__ccrClearSelection()); await sleep(150);
  await page.click("#u-face-courses"); await sleep(1200); s = await st(page);
  ok("Courses: back, hash plain, the courses under the map again, the light as it was left (off)", s.universe === "courses" && s.face === "courses" && s.hash === "#skyview" && s.lit === false && (await page.evaluate(() => !!window.CPL_CCR_UNIVERSE.why_bits)));
  await page.click("#u-lit"); await sleep(400); s = await st(page);
  ok("Articulations lights presence only: the legend row appears, the hint counts, nothing is filtered", s.lit === true && !(await page.evaluate(() => document.getElementById("u-lg-lit").hidden)) && /Lighting [\d,]+ courses/.test(await hint(page)) && s.coursesShown === before.coursesShown);
  artNd = await page.evaluate(() => { for (const I of window.CPL_CCR_UNIVERSE.islands) for (const nd of I.p) if (nd.ar > 0 && !nd.a && I.p.length < 500) return nd.i; return null; });
  await clickId(page, artNd, 3.4);
  ok("with the light on, an articulated course's card names its exhibits up top", (await page.locator("#u-detail #u-exl").count()) === 1 || /MAP exhibit/.test(await page.textContent("#u-detail")));
  await page.click("#u-lit"); await sleep(200);

  });
  await run("R. the CPL universe — credentials, their exhibits, and the door back to the courses", async () => {
  await page.click("#u-face-cpl"); await sleep(1500); s = await st(page);
  ok("CPL again: the credentials, lit, nothing carried across", s.universe === "cpl" && s.lit === true && s.sel === null && s.tokens.length === 0);
  const lg = await page.$$eval("#u-foot .u-legend span", (xs) => xs.map((x) => x.textContent.trim()));
  ok("the legend describes this universe: credential, statewide, local MAP exhibit — and no M-ID", lg.some((t) => /^credential/.test(t)) && lg.some((t) => /^statewide/.test(t)) && lg.some((t) => /^local MAP exhibit/.test(t)) && !lg.some((t) => /^M-ID/.test(t)), lg.join(" | "));
  await page.click("#u-show-sum"); await sleep(200);
  const showKeys = await page.$$eval("#u-show-menu input[data-show]", (is) => is.map((i) => i.getAttribute("data-show")));
  ok("the Show menu is the CPL menu: types, statewide and the light's two; no M-ID, no credit status", ["icert", "cbe", "mil", "tna", "sw", "nsw", "members", "arty", "noart"].every((k) => showKeys.includes(k)) && !showKeys.includes("mid") && !showKeys.includes("cr"), showKeys.join(","));
  await page.click("#u-show-none"); await sleep(400); s = await st(page);
  ok("Deselect all empties the CPL map and says 0 of 12", s.coursesShown === 0 && /0 of 12/.test(await page.textContent("#u-show-word")), `${s.coursesShown} ${await page.textContent("#u-show-word")}`);
  await page.click("#u-show-every"); await sleep(400); s = await st(page);
  ok("Show everything brings the credentials back", s.coursesShown > 1500, `${s.coursesShown}`);
  // Close the menu by its own word: an open menu takes the first click on the map (the outside-click closer), as it does for a reader.
  await page.click("#u-show-sum"); await sleep(200);
  ok("the menu closes by its word", (await page.evaluate(() => !document.querySelector(".u-show[open]"))));
  // a statewide credential with an articulation, in a small island — the ring, the chip, the card, the door
  // (a small island, so the click lands on the point it was aimed at rather than a dense neighbor)
  const swId = await page.evaluate(() => { let best = null; for (const I of window.CPL_CCR_UNIVERSE.islands) for (const nd of I.p) if (nd.sw && nd.ar > 0 && I.p.length < 30 && (!best || I.p.length < best.n)) best = { id: nd.i, n: I.p.length }; return best && best.id; });
  ok("the payload carries a statewide, articulated credential to walk", !!swId, String(swId));
  ok("the swap did not restart a turn the reader had stopped (the point stays where the click is aimed)", (await st(page)).rotating === false);
  await flyToId(page, swId, 3.4);
  { const sp0 = await screenOf(page, swId); const bx0 = await cvsBox(page);
    // A pointer arrives in several move events; the first one after an instant fly can read the island before the
    // per-island zoom band has re-settled, so hover the way a hand does — two moves — before reading the tip.
    await page.mouse.move(bx0.x + sp0.x - 2, bx0.y + sp0.y - 2); await sleep(150);
    await page.mouse.move(bx0.x + sp0.x, bx0.y + sp0.y); await sleep(350);
    ok("hovering a credential names it, its exhibits and its articulations", (await visible(page, "#u-tip")) && /local exhibit/.test(await page.textContent("#u-tip")) && /articulation/.test(await page.textContent("#u-tip")), (await page.textContent("#u-tip")).slice(0, 120));
    await page.mouse.move(5, 5); await sleep(200); }
  await clickId(page, swId, 3.4); s = await st(page);
  ok("clicking the credential selects it", s.sel === swId, `${s.sel} vs ${swId}`);
  const card = await page.textContent("#u-detail");
  ok("clicking it opens the exhibit card: the CER chip, statewide in words, the issuer", s.sel === swId && /credential — CER unified title/.test(card) && /statewide/.test(card) && /Issued by|Issuing agency not recorded/.test(card), card.slice(0, 160));
  ok("the courses articulated to it are listed with their receiving college courses", /Courses articulated to it \(\d+ course identit/.test(card) && (await page.locator("#u-detail [data-course]").count()) >= 1, card.slice(0, 300));
  ok("the local MAP exhibits folded in are listed, best confidence first", /Local MAP exhibits folded in \(\d+\)/.test(card) && (await page.locator("#u-detail ul.mlist li").count()) >= 1);
  ok("nothing moves here: no Drag…, no Move instead…, and the card says where curation lives", !/Drag…/.test(card) && !/Move instead/.test(card) && (await page.locator("#u-detail button.mv").count()) === 0 && /Exhibits are curated in the Credential Reference; nothing is moved from this map/.test(card));
  // the door: a course on the card opens on the Courses map (the panel was hidden in J — show it, as a reader would, from More → Sidebar)
  const sidebarWasHidden = !(await st(page)).inspectorOpen;
  if (sidebarWasHidden) { await page.click("#u-more-sum"); await page.click("#u-insp-toggle"); await sleep(300); }
  const doorId = await page.getAttribute("#u-detail [data-course]", "data-course");
  await page.click("#u-detail [data-course]"); await sleep(1500); s = await st(page);
  ok("a course on the card opens on the Courses map, selected, with the hash plain and a way back in the hint", s.universe === "courses" && s.sel === doorId && s.hash === "#skyview" && /Opened/.test(await hint(page)) && /Press CPL to return/.test(await hint(page)), `${s.universe} ${s.sel} ${s.hash} ` + (await hint(page)).slice(0, 80));
  ok("the course card is the course card: its college courses and its CPL block", /Credit for prior learning reaching this course/.test(await page.textContent("#u-detail")));
  await page.click("#u-face-cpl"); await sleep(1500); s = await st(page);
  ok("CPL brings the credentials back with the selection cleared", s.universe === "cpl" && s.sel === null);
  // Enter on a term searches credentials and their local exhibits
  await page.fill("#gq", "firefighter"); await page.keyboard.press("Enter"); await sleep(700); s = await st(page);
  ok("Enter on a term rings the credentials that carry it", s.hits >= 1 && s.tokens.length === 1, `${s.hits} ${s.tokens}`);
  await page.evaluate(() => window.__ccrClearSelection()); await sleep(150);
  // the discipline card
  const exIsl = await page.evaluate((id) => { for (const I of window.CPL_CCR_UNIVERSE.islands) for (const nd of I.p) if (nd.i === id) return I.d; return null; }, swId);
  await page.fill("#gq", exIsl); await page.keyboard.press("Enter"); await sleep(700);
  const dcard = await page.textContent("#u-detail");
  ok("a discipline's card counts credentials, exhibits folded, articulations and statewide — and offers no work surface", /credentials? folding [\d,]+ local MAP exhibit/.test(dcard) && /with an articulation/.test(dcard) && !/work surface/i.test(dcard) && !/Drag this discipline/.test(dcard), dcard.slice(0, 200));
  await page.evaluate(() => window.__ccrClearSelection()); await sleep(150);
  // the workspace binds the courses; the map comes back as the credentials
  await page.click("#u-more-sum"); await page.click("#u-nav-forest"); await sleep(600); s = await st(page);
  ok("By discipline from the CPL map: the tables are the course universe's", s.universe === "courses" && /Disciplines and subjects/.test(await page.textContent("h1")));
  await page.click(".crumbs [data-back]"); await sleep(1200); s = await st(page);
  ok("Back returns to the map — the courses (the workspace bound them), with the CPL word one click away", s.curView === "skyview" && (await page.locator("#u-face-cpl").count()) === 1, `${s.universe}`);
  await page.click("#u-face-courses"); await sleep(600); s = await st(page);
  ok("Courses pressed: the course universe, its 17 switches all on (one set per universe)", s.universe === "courses" && Object.keys(s.show).length === 17 && Object.values(s.show).every((v) => v === true), JSON.stringify(s.show));
  // leave the page as K left it: the articulated course selected, the sidebar as it was
  if (sidebarWasHidden) { await page.click("#u-more-sum"); await page.click("#u-insp-toggle"); await sleep(300); }
  await clickId(page, artNd, 3.4);
  ok("the section leaves the course selected again for the sections after it", (await st(page)).sel === artNd);
  });
  await run("L. window steps, the comprehensive view, and the views", async () => {
  s = await st(page);
  ok("alone: the step-down control is offered and named", !(await page.evaluate(() => document.getElementById("u-win-down").hidden)) && /Show the page around the map/.test(await page.getAttribute("#u-win-down", "aria-label")));
  camBefore = (await st(page)).sph;
  await page.click("#u-win-down"); await sleep(500); s = await st(page);
  ok("step down: the comprehensive view, same canvas, panes below, hash #comprehensive", s.solo === false && s.hash === "#comprehensive" && (await page.locator("#u-cvs").count()) === 1 && (await page.evaluate(() => document.getElementById("u-below").getBoundingClientRect().height)) > 100);
  ok("the moves staged so far are listed under the map", (await page.locator("#u-writes .writes div").count()) === s.moves.length && s.moves.length > 0, `${s.moves.length}`);
  ok("the zoom and the selection survived the switch (one canvas, not a re-render)", s.sel === artNd && Math.abs(s.sph.yaw - camBefore.yaw) < 1e-9);
  ok("the forest is embedded below", (await page.locator("#u-more .cell").count()) > 100);
  ok("the step-down control is gone here (nothing to step down to)", await page.evaluate(() => document.getElementById("u-win-down").hidden));
  await page.click("#u-win-up"); await sleep(400); s = await st(page);
  ok("step up: SkyView alone again", s.solo === true && s.hash === "#skyview");
  await page.click("#u-win-up"); await sleep(600);
  const fsOn = await page.evaluate(() => !!document.fullscreenElement);
  ok("step up again asks for browser full screen (or says why not, where the hand is)", fsOn || /full screen/i.test(await hint(page)), fsOn ? "full screen on" : (await hint(page)).slice(0, 80));
  if (fsOn) { await page.click("#u-win-down"); await sleep(400); ok("…and step down leaves it", !(await page.evaluate(() => !!document.fullscreenElement))); }
  // workspace via More → By discipline, and Back
  cam1 = (await st(page)).sph;
  await page.click("#u-more-sum"); await page.click("#u-nav-forest"); await sleep(500);
  ok("By discipline: the workspace, the toggle pressed, the hash, a Back crumb", /Disciplines and subjects/.test(await page.textContent("h1")) && (await page.locator("#ws-discipline[aria-pressed=true]").count()) === 1 && (await page.evaluate(() => location.hash)) === "#disciplines" && (await page.locator(".crumbs [data-back]").count()) === 1);
  ok("the masthead paints again and the search box went home", await page.evaluate(() => document.querySelector(".mast").getBoundingClientRect().height > 0 && !!document.querySelector(".mast #msearch")));
  await page.fill("#ws-q", "weld"); await sleep(200);
  ok("the filter narrows and counts", /of [\d,]+ disciplines match/.test(await page.textContent("#ws-count")));
  await page.click(".crumbs [data-back]"); await sleep(600); s = await st(page);
  ok("Back returns to SkyView with the camera where it was", s.curView === "skyview" && Math.abs(s.sph.yaw - cam1.yaw) < 1e-9 && Math.abs(s.sph.half - cam1.half) < 1e-9, `yaw ${cam1.yaw.toFixed(3)} → ${s.sph.yaw.toFixed(3)}`);
  await page.click("#u-more-sum"); await page.click("#u-nav-subject"); await sleep(500);
  await page.fill("#ws-q", "kine"); await sleep(200);
  await page.locator("#ws-rows [data-subj]").first().click(); await sleep(600);
  ok("By subject → a subject opens the map on its discipline", (await page.locator("#u-cvs").count()) === 1 && /Kinesiology/i.test(await page.textContent("#u-detail h3")));
  await page.click("#u-more-sum"); await page.click("#u-nav-esl"); await sleep(600);
  ok("ESL packaging renders inside the workspace", (await page.locator("#ws-esl[aria-pressed=true]").count()) === 1 && (await page.locator("#esl-gfx circle").count()) === 3);
  await page.click("#ws-sky"); await sleep(500);
  ok("Back to SkyView from the workspace", (await st(page)).solo === true);
  await page.click("#u-more-sum"); await page.click("#u-nav-how"); await sleep(500);
  ok("How SkyView works: a guide with a way back", (await page.evaluate(() => location.hash)) === "#how" && (await page.locator("#how-open").count()) === 1);
  await page.click("#how-open"); await sleep(500);
  ok("…which returns to the map", (await st(page)).solo === true);
  // the work surface by double-click on island ground, and Back
  await page.fill("#gq", "welding"); await page.keyboard.press("Enter"); await sleep(600);
  const wcenter = await page.evaluate(() => window.__ccrUniverseState().islandScreen("Welding"));
  const bbw = await cvsBox(page);
  await page.mouse.dblclick(bbw.x + wcenter.x + wcenter.r * 0.55, bbw.y + wcenter.y + wcenter.r * 0.55); await sleep(600);
  const onWork = (await page.evaluate(() => location.hash)) === "#work/Welding";
  ok("double-click on Welding's island ground opens its work surface (#work/Welding)", onWork || (await page.locator("#u-outline-sheet:not([hidden])").count()) === 1, await page.evaluate(() => location.hash));
  if (onWork) {
    ok("decision cards render", (await page.locator(".deck").count()) > 0);
    await page.goBack(); await sleep(600);
    ok("the browser's Back returns to SkyView (the view pushed a history entry)", (await st(page)).curView === "skyview" && (await page.locator("#u-cvs").count()) === 1);
  } else { await page.keyboard.press("Escape"); }

  });
  await run("M. routes — hashes in, hashes out", async () => {
  await page.evaluate(() => { location.hash = "#globe"; }); await sleep(500); s = await st(page);
  ok("#globe routes to the Globe", s.proj === "globe");
  await page.evaluate(() => { try { localStorage.removeItem("skyview:theme"); } catch (e) {} location.hash = "#map"; }); await sleep(500); s = await st(page);
  ok("#map still routes to the flat map (the word left the row, the code did not)", s.proj === "map" && /%$/.test(await zoom(page)) && await page.evaluate(() => !document.getElementById("u-dark").hidden && document.getElementById("u-nd").hidden), await zoom(page));
  note(`on #map after a Night choice this session the canvas is ${s.dark ? "dark" : "light"} (one remembered choice across Sky and Map, by design)`);
  await page.click("#u-more-sum"); await page.click("#u-dark"); await sleep(200); s = await st(page);
  ok("the Dark canvas row toggles the flat map's ground", s.dark === false && !(await page.evaluate(() => document.body.classList.contains("u-dark"))));
  await page.click("#u-dark"); await sleep(150); await page.mouse.click(60, 400);
  await page.evaluate(() => { location.hash = "#skyview/cpl"; }); await sleep(800); s = await st(page);
  ok("#skyview/cpl opens the CPL universe on the Sky", s.universe === "cpl" && s.face === "cpl" && s.proj === "sky", `${s.universe} ${s.proj}`);
  await page.evaluate(() => { location.hash = "#nonsense"; }); await sleep(500); s = await st(page);
  ok("an unknown hash falls back to the map", (await page.locator("#u-cvs").count()) === 1);
  await page.evaluate(() => { location.hash = "#outline/NOPE"; }); await sleep(500);
  ok("#outline/<bad id> says so and leaves a way on", /No course with that id/.test(await page.textContent("#view")) && (await page.locator(".crumbs button").count()) >= 1);
  await page.evaluate(() => { location.hash = "#outline/WELD M1109"; }); await sleep(900);
  ok("#outline/WELD M1109 renders the full-page outline with crumbs back to SkyView", (await page.locator("#view .ol").count()) === 1 && /Welding/.test(await page.textContent(".crumbs")));
  await page.evaluate(() => { location.hash = "#skyview"; }); await sleep(600);
  ok("and #skyview brings the map back", (await page.locator("#u-cvs").count()) === 1 && (await st(page)).solo === true);

  await ctx.close();

  /* ── a fresh page: reduced motion ─────────────────────────────────────── */
  });
  await run("N. prefers-reduced-motion", async () => {
  { const { ctx: c2, page: p2 } = await openPage({ reducedMotion: "reduce" }); await load(p2, "skyview"); const r = await st(p2);
    ok("the sky does not turn on open", r.rotating === false && r.reduceMotion === true);
    await p2.click("#u-rotate"); await sleep(300); const r2 = await st(p2);
    const rotVisible = await p2.evaluate(() => { const b = document.getElementById("u-rotate"); return b && b.getBoundingClientRect().width > 0 && !b.disabled; });
    ok("Rotate under reduced motion: the control is either hidden/disabled or says why it did nothing", !rotVisible || r2.rotating || /motion|turn/i.test(await hint(p2)), `rotating=${r2.rotating} visible=${rotVisible} hint="${(await hint(p2)).slice(0, 60)}"`);
    await c2.close(); }

  /* ── a fresh page: Close ──────────────────────────────────────────────── */
  });
  await run("O. Close, stand-alone", async () => {
  { const { ctx: c3, page: p3 } = await openPage(); await load(p3, "skyview");
    await p3.click("#u-close"); await sleep(1500);
    ok("Close leaves for COBI's Common Course Reference list", /index\.html#unified-courses\/list$/.test(p3.url()), p3.url());
    await c3.close(); }

  /* ── a phone ──────────────────────────────────────────────────────────── */
  });
  await run("P. a phone at 390×844 — the folded row, the map's share, pinch", async () => {
  { const { ctx: c4, page: p4 } = await openPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await load(p4, "skyview"); const r = await st(p4);
    const top = await p4.locator("#u-top").boundingBox(); const cv = await cvsBox(p4);
    ok("the row folds behind the word Controls; the bar is hidden until pressed", await visible(p4, "#u-ctl") && !(await visible(p4, "#u-bar")));
    ok("the header is short and the map takes most of the screen", top.height <= 130 && cv.height >= 844 * 0.75, `header ${Math.round(top.height)}px, map ${Math.round(cv.height)}px`);
    ok("the legend starts shut on a phone", r.legendOpen === false);
    ok("no sideways scroll", (await p4.evaluate(() => document.documentElement.scrollWidth)) <= 391);
    await p4.click("#u-ctl"); await sleep(250);
    ok("Controls opens the bar as a sheet", await visible(p4, "#u-bar") && (await p4.getAttribute("#u-ctl", "aria-expanded")) === "true");
    await p4.keyboard.press("Escape"); await sleep(200);
    ok("Escape shuts it and hands focus back to the word", !(await visible(p4, "#u-bar")) && await p4.evaluate(() => document.activeElement && document.activeElement.id === "u-ctl"));
    // pinch via CDP touch events
    const z1 = await zoom(p4);
    const cdp = await c4.newCDPSession(p4);
    const cx = cv.x + cv.width / 2, cy = cv.y + cv.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx - 20, y: cy, id: 1 }, { x: cx + 20, y: cy, id: 2 }] });
    for (let i = 1; i <= 8; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx - 20 - i * 12, y: cy, id: 1 }, { x: cx + 20 + i * 12, y: cy, id: 2 }] }); await sleep(30); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await sleep(300);
    const z2 = await zoom(p4); const r2 = await st(p4);
    ok("a two-finger spread zooms in and selects nothing", z2 !== z1 && parseInt(z2) < parseInt(z1) && r2.sel === null, `${z1} → ${z2}`);
    // a single-finger drag afterwards still pans (no phantom finger)
    const yaw1 = r2.sph.yaw;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy, id: 3 }] });
    for (let i = 1; i <= 6; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx + i * 15, y: cy, id: 3 }] }); await sleep(30); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await sleep(250);
    ok("one finger after the pinch still turns the sky (the registry is clean)", (await st(p4)).sph.yaw !== yaw1);
    // selecting a course docks the panel underneath
    await p4.fill("#gq", "welding"); await p4.keyboard.press("Enter"); await sleep(700);
    const insp = await p4.locator("#u-inspector").boundingBox();
    ok("a selection opens the details panel docked under the map on a phone", (await st(p4)).inspectorOpen === true && insp && insp.height > 100 && insp.y >= cv.y, `panel at y=${insp && Math.round(insp.y)} h=${insp && Math.round(insp.height)}`);
    ok("still no sideways scroll", (await p4.evaluate(() => document.documentElement.scrollWidth)) <= 391);
    await shot(p4, "P-phone");
    await c4.close(); }

  /* ── a tablet: the Controls word at 768 ───────────────────────────────── */
  });
  await run("Q. 768px", async () => {
  { const { ctx: c5, page: p5 } = await openPage({ viewport: { width: 768, height: 1024 } }); await load(p5, "skyview");
    ok("at 768 the row folds too, and the window controls stay in the row", await visible(p5, "#u-ctl") && await visible(p5, "#u-win-up") && await visible(p5, "#u-more-sum"));
    await p5.click("#u-ctl"); await sleep(200);
    await p5.click("#u-proj-globe"); await sleep(300);
    ok("a control in the opened sheet works (Globe)", (await st(p5)).proj === "globe");
    await shot(p5, "Q-768-sheet-open");
    const bb5 = await cvsBox(p5); const barBox = await p5.locator("#u-bar").boundingBox();
    note(`768: canvas ${JSON.stringify(bb5 && {x:Math.round(bb5.x),y:Math.round(bb5.y),w:Math.round(bb5.width),h:Math.round(bb5.height)})} sheet ${JSON.stringify(barBox && {x:Math.round(barBox.x),y:Math.round(barBox.y),w:Math.round(barBox.width),h:Math.round(barBox.height)})}`);
    await p5.mouse.click(bb5.x + 30, bb5.y + 60); await sleep(200);
    ok("a touch on the map puts the sheet away", !(await visible(p5, "#u-bar")));
    await c5.close(); }

  });
  await run("Z. what the page tried to reach, and errors", async () => {
  note("off-origin hosts refused: " + ([...offOrigin.entries()].map(([h, n]) => `${h} ×${n}`).join(", ") || "none"));
  ok("no page errors or unexpected console errors", errs.length === 0, errs.slice(0, 5).join(" | "));

  });
  await browser.close(); srv.close();
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(results, null, 1));
  const n = results.filter((r) => !r.note).length;
  console.log(`\n${n - bad} of ${n} checks pass` + (bad ? `, ${bad} FAILED` : ""));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error("SWEEP CRASHED:", e); process.exit(2); });
