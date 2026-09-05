/* Layout + behavior check for the SkyView prototype.
 *
 * Deliberately NOT part of `npm test` — jsdom has no layout engine, so the
 * defects this catches (a graph that renders zero nodes, a page that scrolls
 * sideways on a phone, a move that writes nothing) are invisible to the suite.
 * Same split as scripts/a11y.js.
 *
 * Serves over http:// on purpose: under file:// `sheet.cssRules` throws, and a
 * check that cannot read the stylesheet passes silently.
 *
 *   npm install playwright && node prototype/check_ccr_atlas.js
 */
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.dirname(__dirname);
const FILE = "prototype/ccr_atlas_v1.built.html";

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  try {
    const root = "/opt/pw-browsers";
    const dir = fs.readdirSync(root).filter((f) => /^chromium-\d+$/.test(f)).sort().pop();
    if (dir) {
      const p = path.join(root, dir, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* fall through */ }
  return undefined;
}
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((rq, rs) => {
      const f = path.join(ROOT, decodeURIComponent(rq.url.split("?")[0]).replace(/^\//, ""));
      fs.readFile(f, (e, b) => {
        if (e) { rs.writeHead(404); return rs.end("nope"); }
        rs.writeHead(200, { "Content-Type": /\.js$/.test(f) ? "text/javascript" : "text/html" });
        rs.end(b);
      });
    }).listen(0, "127.0.0.1", () => res({ srv, port: srv.address().port }));
  });
}

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) { console.error("playwright is not installed — `npm install playwright`"); process.exit(2); }

  const { srv, port } = await serve();
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // On the map the crumbs row is hidden (the strip above the canvas carries
  // "All disciplines" since 2026-09-03); elsewhere the crumbs still lead back.
  const backToForest = async () => {
    if (await page.locator("#u-nav-forest").count()) {
      // The view links live behind the Views menu now — open it first.
      if (await page.locator("#u-more-sum").count()) await page.locator("#u-more-sum").click();
      else if (await page.locator("#u-views").count()) await page.locator("#u-views > summary").click();
      await page.locator("#u-nav-forest").click();
    }
    else await page.locator(".crumbs button").first().click();
    await page.waitForTimeout(150);
  };
  // The other views sit behind the map's More menu since 2026-09-05 (flat,
  // under "Go to"); every other view keeps the Go To details menu.
  const openGoTo = async () => {
    if (await page.locator("#u-more-sum").count()) await page.locator("#u-more-sum").click();
    else await page.locator("#u-views > summary").click();
    await page.waitForTimeout(120);
  };
  // Font/favicon fetches are blocked in the sandbox and 404 locally; neither is
  // a page defect, and neither can mask one — the page has full font fallbacks.
  const NOISE = /favicon|fonts\.(googleapis|gstatic)|ERR_CONNECTION_RESET|Failed to load resource/i;
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error" && !NOISE.test(m.text())) errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));   // never noise — always a real defect

  let bad = 0;
  const ok = (n, c) => { if (!c) bad++; console.log((c ? "  ok   " : "  FAIL ") + n); };

  await page.goto(`http://127.0.0.1:${port}/${FILE}`);
  await page.waitForTimeout(500);

  console.log("\n══ \u26a0 the page lands on SkyView, not the list");
  // Sam, 2026-08-25: "SkyView should be the initial CCR tab and the current
  // detailed tab should be a button on SkyView … I think SkyView is more
  // manageable and less intimidating."
  ok("the map is on screen with no clicks", (await page.locator("#u-cvs").count()) === 1);
  ok("and the discipline list is a real focusable button on it, not a gesture",
    (await page.locator("#u-views-menu button#u-nav-forest").count()) === 1);
  // Sam, 2026-09-05: "the full screen SkyView … I would like to henceforth refer
  // to as SkyView" — the page opens on the map ALONE, and nothing else paints.
  ok("\u2b50 it opens ALONE: the masthead, the crumbs and the panes below are not painted",
    await page.evaluate(() => document.body.classList.contains("u-solo") &&
      document.querySelector(".mast").getBoundingClientRect().height === 0 &&
      document.getElementById("u-below").getBoundingClientRect().height === 0));

  console.log("\n══ \u26a0 the landing view can be operated from a keyboard");
  // This is the condition the flip was made under. Before it, the canvas keydown
  // handler panned and zoomed and had NO key that reached a subject or an
  // identity — survivable while the DOM list was the way in, not survivable once
  // the map is the front door.
  await page.locator("#u-cvs").focus();
  await page.keyboard.press("Tab");
  await page.waitForTimeout(340);
  const kSub = await page.locator("#u-detail h3").textContent();
  ok(`Tab reaches a discipline (${(kSub || "").slice(0, 28)})`, !!kSub);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(420);
  const k1 = await page.evaluate(() => window.__ccrUniverseState());
  ok(`Enter steps INTO it and selects an identity (${k1.sel})`, !!k1.sel);
  // A selected identity that is not drawn is not selected as far as a reader is
  // concerned — the same floor the search has to clear.
  ok(`and zooms past the threshold that draws it (${k1.view.k.toFixed(2)} > ${k1.nodeZoom})`,
    k1.view.k > k1.nodeZoom);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(340);
  const k2 = await page.evaluate(() => window.__ccrUniverseState());
  ok(`Tab inside moves to a different identity (${k2.sel})`, !!k2.sel && k2.sel !== k1.sel);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(320);
  ok("Escape comes back out to the discipline",
    (await page.locator("#u-detail h3").textContent()) === kSub);

  console.log("\n\u2550\u2550 the workspace: By discipline (the map's own menu)");
  // Sam, 2026-08-25: "The Browse by Subjects button takes me unexpectedly to the
  // package view. Seems I'm already browsing by subject." Since 2026-09-05 the
  // list is the workspace's By discipline view (items 6-9: one tab, toggles, a
  // way back to SkyView), still seeded from the search box; this walks the
  // route, because the route IS the fix.
  await page.locator("#gq").fill("english as a second");
  // The view links live in a <details> menu (Sam, item 2, 2026-09-04), and a
  // closed <details> is display:none — so the menu opens before the link is
  // reachable. That is the point of the check: it clicks the way a person does.
  await openGoTo();
  await page.locator("button#u-nav-forest").click();
  await page.waitForTimeout(400);
  ok("the menu opens the workspace on By discipline, not the packaging view",
    /Disciplines and subjects/.test(await page.locator("h1").first().textContent()) &&
    (await page.locator("#ws-discipline[aria-pressed=true]").count()) === 1);
  ok("the solo frame comes down with it (the masthead paints again)",
    await page.evaluate(() => !document.body.classList.contains("u-solo") &&
      document.querySelector(".mast").getBoundingClientRect().height > 0));
  ok("it carries the search term across as the filter",
    (await page.locator("#ws-q").inputValue()) === "english as a second");
  const seeded = await page.locator("#ws-rows tr").count();
  ok(`the seeded filter narrows to the ESL disciplines (${seeded})`, seeded > 0 && seeded < 30);
  ok("it says how many of how many matched",
    /of\s[\d,]+\sdisciplines match/.test(await page.locator("#ws-count").textContent()));
  await page.locator("#ws-q").fill("");
  await page.waitForTimeout(200);
  ok(`clearing the filter shows every discipline (${(await page.locator("#ws-count").textContent()).slice(0, 40)})`,
    /^[\d,]+ disciplines ·/.test((await page.locator("#ws-count").textContent()).trim()));
  ok("the table is a labeled scrolling region with a scope on every header",
    (await page.locator(".tblwrap[tabindex='0'][role=region] table.ws-table").count()) === 1 &&
    (await page.locator("table.ws-table th[scope=col]").count()) === (await page.locator("table.ws-table th").count()));
  ok("a line explains the two grains, in words",
    /discipline/.test(await page.locator(".ws-lede").textContent()) && /four-letter Common SUBJ/.test(await page.locator(".ws-lede").textContent()));
  // A filter that matches nothing must say so rather than render an empty panel
  // that is indistinguishable from a corpus with no disciplines in it.
  await page.locator("#ws-q").fill("zzzznotasubject");
  await page.waitForTimeout(200);
  ok("an empty filter result says so",
    /Nothing matches/.test(await page.locator("#ws-rows").textContent()));

  console.log("\n\u2550\u2550 the workspace: By subject (the SUBJ4 grain)");
  // Sam's item 6: "view by subject" — his subject is the four-letter Common
  // SUBJ code, a grain no view carried before 2026-09-05.
  await page.locator("#ws-subject").click();
  await page.waitForTimeout(300);
  ok("the toggle switches the grain", (await page.locator("#ws-subject[aria-pressed=true]").count()) === 1);
  await page.locator("#ws-q").fill("");
  await page.waitForTimeout(200);
  const subjRows = await page.locator("#ws-rows tr").count();
  ok(`subjects are read off the ids (${subjRows} codes, against ${await page.evaluate(() => window.CPL_CCR_UNIVERSE.islands.length)} disciplines)`,
    subjRows > 150 && subjRows < 400);
  ok("the first row is a code with the discipline it belongs to",
    /^[A-Z]{2,4}$/.test((await page.locator("#ws-rows tr").first().locator("td").first().textContent()).trim()));
  ok("a standing column says, in words, how a code relates to its discipline's Common SUBJ",
    /Common SUBJ of|umbrella code|not .*code/.test(await page.locator("#ws-rows tr").first().locator("td").nth(4).textContent()));
  await page.locator("#ws-q").fill("SPAN");
  await page.waitForTimeout(200);
  ok("SPAN is an umbrella code under Foreign Languages",
    /umbrella code under Foreign Languages/.test(await page.locator("#ws-rows").textContent()));
  await page.locator("#ws-q").fill("kine");
  await page.waitForTimeout(200);
  await page.locator("#ws-rows [data-subj]").first().click();
  await page.waitForTimeout(500);
  ok("picking a subject opens the MAP on its discipline, at 150%",
    (await page.locator("#u-cvs").count()) === 1 &&
    /Kinesiology/i.test(await page.locator("#u-detail h3").textContent()) &&
    (await page.locator("#u-zoom").textContent()).trim() === "150%");
  ok("and the hint names the subject and its count in words",
    /Subject/.test(await page.locator("#u-hint").textContent()) && /KINE/.test(await page.locator("#u-hint").textContent()));
  await openGoTo();
  await page.locator("button#u-nav-forest").click();
  await page.waitForTimeout(300);
  await page.locator("#ws-q").fill("welding");
  await page.waitForTimeout(200);
  await page.locator("#ws-rows [data-map]").first().click();
  await page.waitForTimeout(500);
  ok("picking a discipline returns to the MAP, opened on it",
    (await page.locator("#u-cvs").count()) === 1 &&
    /Welding/i.test(await page.locator("#u-detail h3").textContent()));

  console.log("\n\u2550\u2550 the comprehensive view (the map with the panes below)");
  // Sam, 2026-09-05: "an option to navigate to the comprehensive SkyView (the
  // current one), but I don't want it to open by default."
  await openGoTo();
  await page.locator("button#u-nav-comp").click();
  await page.waitForTimeout(500);
  ok("the same canvas, the solo frame off, the panes painted",
    await page.evaluate(() => !document.body.classList.contains("u-solo") &&
      document.getElementById("u-cvs") !== null &&
      document.getElementById("u-below").getBoundingClientRect().height > 100));
  const cells = await page.locator("#u-more .cell").count();
  ok(`the forest is embedded below the map (${cells} cells)`, cells > 100);
  ok("stat strip has 4 tiles", (await page.locator("#u-more .stat").count()) === 4);
  // Read OUR sheet, not styleSheets[0] — that is the cross-origin Google Fonts
  // link, whose cssRules always throws. A check aimed at it reports the sandbox's
  // network policy, never the page.
  ok("our stylesheet is readable over http (rules are being applied)",
    await page.evaluate(() => {
      for (const sh of document.styleSheets) {
        try { if (sh.cssRules && sh.cssRules.length > 20) return true; } catch (e) { /* cross-origin */ }
      }
      return false;
    }));

  console.log("\n══ the graph is on the FIRST screen");
  // The defect this guards: the graph used to be two clicks down, and the grid
  // was sorted by decision count, so the top cells had no sample data. A reader
  // landed, clicked the first thing, hit a dead end and never saw a graph.
  ok(`hero graph renders with no clicks (${await page.locator("#hero-gfx circle").count()} nodes)`,
    (await page.locator("#hero-gfx circle").count()) >= 6);
  ok("hero names the discipline and the course count",
    /local courses sit underneath/.test(await page.locator("#hero-p").textContent()));
  const firstHero = await page.locator("#hero-h").textContent();
  await page.locator("#hero-next").click();
  await page.waitForTimeout(400);
  ok("\u2018Show me another\u2019 draws a different decision",
    (await page.locator("#hero-gfx circle").count()) >= 6);
  ok("hero graph is decorative-safe (role=img with a label)",
    (await page.locator("#hero-gfx svg").getAttribute("role")) === "img" &&
    !!(await page.locator("#hero-gfx svg").getAttribute("aria-label")));

  console.log("\n══ \u26a0 the FIRST cell must open something (the dead-end guard)");
  await page.locator(".cell").first().click();
  await page.waitForTimeout(400);
  ok("first discipline cell reaches real decisions, not a 'no sample data' note",
    (await page.locator(".deck").count()) > 0);
  ok("the crumbs row carries the Views menu here too (every view reachable from every other)",
    (await page.locator("#crumbs-views #u-views").count()) === 1 &&
    (await page.locator("#crumbs-views #u-nav-sky").count()) === 1);
  await backToForest();
  await page.waitForTimeout(400);

  console.log("\n══ the universe view");
  ok("the workspace offers the way back to SkyView, as a word",
    (await page.locator("#ws-sky").count()) === 1 && /Back to SkyView/.test(await page.locator("#ws-sky").textContent()));
  await page.locator("#ws-sky").click();
  await page.waitForTimeout(600);
  ok("canvas is present and sized", await page.evaluate(() => {
    const c = document.getElementById("u-cvs");
    return !!c && c.width > 200 && c.height > 200;
  }));
  // A canvas draws nothing the DOM can see, so assert PIXELS changed — an empty
  // canvas and a broken renderer look identical to any selector-based check.
  ok("it actually painted something", await page.evaluate(() => {
    const c = document.getElementById("u-cvs");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4 * 997) seen.add(d[i] + "," + d[i+1] + "," + d[i+2]);
    return seen.size > 3;                      // more than one flat color
  }));
  ok("the canvas is keyboard-reachable and labeled",
    (await page.locator("#u-cvs[tabindex='0']").count()) === 1 &&
    !!(await page.locator("#u-cvs").getAttribute("aria-label")));

  console.log("\n══ keyword zoom");
  const z0 = await page.evaluate(() => window.__ccrUniverseState().view.k);
  await page.fill("#gq", "welding");
  await page.locator("#msearch button[type=submit]").click();
  await page.waitForTimeout(400);
  const z1 = await page.evaluate(() => window.__ccrUniverseState().view.k);
  ok(`search zooms in (${z0.toFixed(3)} -> ${z1.toFixed(3)})`, z1 > z0);
  // "welding" names a discipline, so the report is the discipline (no rings
  // since 2026-09-03, and the WORD since 2026-09-05 — "subject" is the SUBJ4
  // grain now); a term naming no discipline still reports its matches.
  ok("and reports where it landed",
    /^\s*Discipline\b.*Welding|match/i.test(await page.locator("#u-hint").textContent()));
  await page.fill("#gq", "zzzznotathing");
  await page.locator("#msearch button[type=submit]").click();
  await page.waitForTimeout(300);
  ok("a miss says so rather than flying somewhere arbitrary",
    /Nothing matches/i.test(await page.locator("#u-hint").textContent()));

  console.log("\n══ ⚠ the member payload (nothing is draggable without it)");
  const mp = await page.evaluate(() => {
    const M = window.CPL_CCR_UNIVERSE_MEMBERS, U = window.CPL_CCR_UNIVERSE;
    if (!M || !M.m) return { ok: false, why: "window.CPL_CCR_UNIVERSE_MEMBERS is absent" };
    const placed = new Set();
    U.islands.forEach((i) => i.p.forEach((p) => placed.add(p.i)));
    const ids = Object.keys(M.m);
    const discs = new Set();
    U.islands.forEach((i) => { if (i.p.some((p) => M.m[p.i])) discs.add(i.d); });
    return { ok: true, identities: ids.length, members: M.counts.members,
             stray: ids.filter((id) => !placed.has(id)).length,
             discs: discs.size, islands: U.islands.length,
             dup: M.counts.cn_on_multiple_identities,
             dropped: M.counts.dropped_no_key };
  });
  ok("the member payload loaded" + (mp.ok ? "" : ` — ${mp.why}`), mp.ok);
  // Thresholds, not pinned values: the corpus moves every time the cron runs, and
  // an assertion pinned to today's count stops being a guard the day it changes.
  ok(`it covers the corpus, not a sample (${mp.identities} identities, ${mp.members} members)`,
    mp.identities > 10000 && mp.members > 50000);
  ok(`every identity in it is one the map actually places (${mp.stray} stray)`, mp.stray === 0);
  ok(`members reach most subject areas (${mp.discs} of ${mp.islands})`, mp.discs > mp.islands * 0.7);
  // Not a defect — the state the duplicate-handling below exists for. Printed so
  // a future reader knows the case is live rather than theoretical.
  console.log(`  note  ${mp.dup} control numbers sit under more than one identity; ` +
              `${mp.dropped} members carry no control number and cannot be dragged`);

  console.log("\n══ ⚠ a search must land where its hits can be SEEN");
  // Reported from a browser by Sam, 2026-08-25: searching "english as a second"
  // said "19 match … Ringed in red" and drew nothing, because doSearch flew to
  // "fit all the hits" — which for hits spread across nine subjects is a zoom
  // BELOW the one at which draw() renders any node at all. The search was
  // choosing a zoom the renderer refuses to draw at, then reporting rings.
  const nodeZoom = await page.evaluate(() => window.__ccrUniverseState().nodeZoom);
  ok(`the renderer's node threshold is exported (${nodeZoom})`, nodeZoom > 0);

  // Sam, in a browser: "we have two different keyword searches on the tab,
  // which should be consolidated to one." Two fields that behave differently
  // is a question about which one you are meant to use.
  const fields = await page.locator("input[type=search]").count();
  ok(`the map screen carries exactly one search field (${fields})`, fields === 1);

  // Drive the HEADER box — there is only one search field on the page now, and
  // a test that still typed into a map-local one would keep passing after the
  // header stopped reaching the map.
  const runSearch = async (term) => {
    await page.fill("#gq", term);
    await page.locator("#msearch button[type=submit]").click();
    await page.waitForTimeout(420);
    const st = await page.evaluate(() => window.__ccrUniverseState());
    return { k: st.view.k, hits: st.hits, hint: await page.locator("#u-hint").textContent() };
  };

  // Sam's exact term. Scattered on purpose — this is the case that failed.
  const scattered = await runSearch("english as a second");
  // Since 2026-09-03 a term that names a subject goes to the subject and rings
  // NOTHING (the rings were 408 red names on the Welding island); the landing
  // is the subject itself, which is drawn at the zoom it flies to.
  ok(`"english as a second" lands on its subject (${scattered.hits} rings)`,
    /^\s*Discipline\b/i.test(scattered.hint) && scattered.hits === 0);
  ok(`and lands where nodes are drawn (zoom ${scattered.k.toFixed(3)} > ${nodeZoom})`,
    scattered.k > nodeZoom);
  // The invariant, stated as itself: claiming rings and drawing none is the bug.
  ok("it never claims rings at a zoom that draws none",
    !(/ring/i.test(scattered.hint) && scattered.k <= nodeZoom));

  // A subject name should TAKE you to the subject, not scatter the view — the
  // old order only considered the subject when nothing else matched at all.
  const subj = await runSearch("english as a second language");
  // textContent strips the markup, so assert on the words that survive it.
  ok("a subject name goes to that subject",
    /^\s*Discipline\b/i.test(subj.hint) && /English as a Second Language/i.test(subj.hint));
  ok(`and zooms in to it (zoom ${subj.k.toFixed(3)})`, subj.k > nodeZoom);

  // A word that is a substring of several DIFFERENT disciplines and an exact
  // match for none. ("art" is a poor probe here — it is the exact name of a
  // discipline, so going to Art is correct.)
  //
  // ⚠ THIS CONTRACT CHANGED, 2026-08-25. It used to assert that such a term
  // picked NO subject. That was the honest-looking half of a worse whole: the
  // fallback then chose whichever subject carried the most incidental
  // COURSE-TITLE matches, which is how "english as a second" landed on
  // Interdisciplinary Studies. Both branches guess; only one of them guesses
  // among subjects the term actually named. So the rule now is: pick the
  // biggest of them, and SAY WHICH OTHERS MATCHED so the guess is visible and
  // correctable — with the suggestion list as the way to not guess at all.
  const many = await runSearch("tech");
  ok("a word matching several different subjects still goes to a subject",
    /^\s*Discipline\b/i.test(many.hint));
  ok("\u2b50 \u2026and NAMES the others rather than choosing silently",
    /Also matching/i.test(many.hint));
  ok("and still lands where its hits can be seen",
    many.k > nodeZoom || !/ring/i.test(many.hint));

  // ⭐ SAM'S CASE, 2026-08-25: a PREFIX of one subject spelled three ways.
  // "english as a second" matches "English as a Second Language", "… (ESL)" and
  // "… Noncredit 53412" — three base names, no exact match — so the old
  // one-base test failed and the view flew to Interdisciplinary Studies, a
  // subject the term never named. Variants that EXTEND one another are one
  // subject; the shortest is the one the others qualify.
  const esl = await runSearch("english as a second");
  ok("\u2b50 a prefix of one subject's several spellings goes to THAT subject",
    /^\s*Discipline\b/i.test(esl.hint) && /English as a Second Language/i.test(esl.hint));
  ok("\u2b50 \u2026and not to a subject matched only by course titles",
    !/Interdisciplinary/i.test(esl.hint));
  ok(`and zooms in to it (zoom ${esl.k.toFixed(3)})`, esl.k > nodeZoom);

  // Flying into a dense subject stacked dozens of course names on top of each
  // other. The file already calls that "the exact failure of a global graph
  // view" for island names; it is no less true one grain down.
  // Back to the crowded subject first — course names are only drawn when zoomed
  // in, so measuring this after a wide search checks nothing at all.
  await runSearch("english as a second language");
  const boxes = await page.evaluate(() => window.__ccrUniverseState());
  ok(`the crowded view draws course names at all (${boxes.titlesQueued} queued)`,
    boxes.titlesQueued > 0);
  let overlaps = 0;
  for (let i = 0; i < boxes.placedBoxes.length; i++)
    for (let j = i + 1; j < boxes.placedBoxes.length; j++) {
      const a = boxes.placedBoxes[i], b = boxes.placedBoxes[j];
      if (a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]) overlaps++;
    }
  ok(`the crowded view actually queued more titles than it could fit ` +
     `(${boxes.titlesQueued} queued, ${boxes.placedBoxes.length} placed)`,
    boxes.titlesQueued > boxes.placedBoxes.length);
  ok(`and no two placed names overlap (${overlaps})`, overlaps === 0);

  console.log("\n══ ⚠ the cross-area move (the reason this view exists)");
  // Pick a real source (a course on an identity in one island) and a real target
  // in a DIFFERENT island, then drive the actual UI: select, press Drag…, click
  // the destination. A move that only ever runs through a test hook proves the
  // hook works, not the page.
  const plan = await page.evaluate(() => {
    const M = window.CPL_CCR_UNIVERSE_MEMBERS, U = window.CPL_CCR_UNIVERSE;
    // Every course the payload puts on each control number. A key naming more
    // than one is REFUSED by the page (canMove), so a source picked blindly can
    // land on one and turn this check into an accidental test of the refusal.
    const seen = {};
    for (const id of Object.keys(M.m))
      for (const [c, n, ci] of M.m[id]) (seen[c] = seen[c] || new Set()).add(n + "\u241f" + ci);
    const uniq = (c) => (seen[c] || new Set()).size < 2;
    let src = null;
    for (const isl of U.islands) {
      for (const nd of isl.p) {
        const list = M.m[nd.i];
        if (list && list.length >= 2 && list.length <= 40 && list.every((r) => uniq(r[0]))) {
          src = { id: nd.i, disc: isl.d, x: nd.x, y: nd.y, n: list.length };
          break;
        }
      }
      if (src) break;
    }
    if (!src) return { ok: false, why: "no modest-sized identity with members" };
    let tgt = null;
    for (const isl of U.islands) {
      if (isl.d === src.disc) continue;
      const nd = isl.p.find((p) => M.m[p.i]);
      if (nd) { tgt = { id: nd.i, disc: isl.d, x: nd.x, y: nd.y }; break; }
    }
    if (!tgt) return { ok: false, why: "no identity in a second subject area" };
    U.islands.forEach((i) => { i.dx = 0; i.dy = 0; });   // no stray offsets under us
    return { ok: true, src, tgt };
  });
  ok("a course and a target in ANOTHER subject both exist" +
     (plan.ok ? ` (${plan.src.disc} → ${plan.tgt.disc})` : ` — ${plan.why}`), plan.ok);

  // Fly the identity to the middle of the canvas and click it. `want` is not
  // decoration: overlapping nodes mean a click can land on a NEIGHBOUR, and a
  // check that never asserts what it selected will happily measure the previous
  // card and pass. Returns the identity actually selected.
  const flyClick = async (pt, want) => {
    await page.evaluate(([x, y]) => window.__ccrUniverseFly(x, y, 3.4), [pt.x, pt.y]);
    // Re-measure every time. Pressing "Drag…" calls cvs.focus(), which scrolls the
    // canvas — a center cached once goes stale and the click lands on empty space,
    // which the page correctly reports as "nothing moved". That read as a broken
    // drag for three checks running.
    const b = await page.locator("#u-cvs").boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(220);
    const got = await page.evaluate(() => window.__ccrUniverseState().sel);
    if (want && got !== want) ok(`click landed on ${want} (got ${got})`, false);
    return got;
  };

  await flyClick(plan.src, plan.src.id);
  const listed = await page.locator("#u-detail .mv").count();
  ok(`selecting an identity lists its college courses (${listed})`, listed > 0);
  ok("and does NOT call them colleges — that number is member courses",
    !/college(s)?<\/p>|· \d[\d,]* colleges/i.test(await page.locator("#u-detail").innerHTML()));

  const cn = await page.locator("#u-detail .mv").first().getAttribute("data-cn");
  await page.locator("#u-detail .mv").first().click();
  // No `want` here: a DROP is not a selection. The pane deliberately keeps showing
  // the card you came from, so what proves the drop landed on the right identity is
  // the write line below naming it — not the selection.
  await flyClick(plan.tgt);

  const writeLine = await page.locator("#u-writes").textContent();
  ok(`the move writes one CN: row (${(writeLine || "").trim().slice(0, 46)}…)`,
    new RegExp("CN:" + cn + "\\s+merge_into\\s+" + plan.tgt.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .test(writeLine || ""));

  await flyClick(plan.src, plan.src.id);
  ok("the course has LEFT the card it came from", await page.evaluate((c) =>
    !document.querySelector(`#u-detail .mv[data-cn="${c}"]`), cn));
  await flyClick(plan.tgt, plan.tgt.id);
  ok("and ARRIVED on the destination card, marked as moved", await page.evaluate((c) => {
    const b = document.querySelector(`#u-detail .mv[data-cn="${c}"]`);
    return !!b && /moved here/i.test(b.closest("li").textContent);
  }, cn));

  console.log("\n══ ⚠ a move the write key cannot express is refused");
  // `CN:<control number>` carries no way to say WHICH course, and both receiving
  // ends pick the first one they find (the generator through cn_rows[cn][0], this
  // page through byCn[cn]). 1,761 control numbers in this payload name more than
  // one course — 3,634 draggable rows. So the page must refuse, not guess.
  const amb = await page.evaluate(() => {
    const M = window.CPL_CCR_UNIVERSE_MEMBERS, U = window.CPL_CCR_UNIVERSE;
    const seen = {};
    for (const id of Object.keys(M.m))
      for (const [c, n, ci] of M.m[id]) (seen[c] = seen[c] || new Set()).add(n + "\u241f" + ci);
    let shared = 0;
    for (const c of Object.keys(seen)) if (seen[c].size > 1) shared++;
    // A card that actually SHOWS one, so the refusal can be driven through the UI.
    for (const isl of U.islands) {
      for (const nd of isl.p) {
        const list = M.m[nd.i] || [];
        if (list.length > 40) continue;
        const hit = list.find((r) => seen[r[0]].size > 1);
        if (hit) {
          // A positive control, sourced payload-wide rather than from this card:
          // the card holding a shared key often holds nothing else. A guard
          // asserted only on the case it rejects passes just as well when it
          // rejects everything.
          let uniqCn = null;
          for (const c of Object.keys(seen))
            if (seen[c].size === 1) { uniqCn = "CCC" + String(c).padStart(9, "0"); break; }
          return { shared, id: nd.i, disc: isl.d, x: nd.x, y: nd.y,
                   cn: "CCC" + String(hit[0]).padStart(9, "0"), uniqCn,
                   names: seen[hit[0]].size };
        }
      }
    }
    return { shared };
  });
  // Assert the condition is LIVE in the data. If the payload ever stops carrying
  // collided control numbers, this check must go red rather than pass vacuously
  // against a page whose guard is never reached.
  ok(`the payload still carries collided control numbers (${amb.shared})`, amb.shared > 0);
  ok("and a card shows one, so the guard is reachable through the UI", !!amb.id);

  if (amb.id) {
    await flyClick({ x: amb.x, y: amb.y }, amb.id);
    const row = `#u-detail .mv[data-cn="${amb.cn}"]`;
    ok(`the row is flagged BEFORE the click (${amb.cn} names ${amb.names} courses)`,
      await page.evaluate((sel) => {
        const b = document.querySelector(sel);
        return !!b && /shared key/i.test(b.closest("li").textContent);
      }, row));
    const before = await page.evaluate(() => window.__ccrUniverseState().moves.length);
    // A collided key can put BOTH of its courses on one card (KIN 62C and
    // KINES 62C at Santa Rosa, 2026-09-03), so the selector may match twice.
    await page.locator(row).first().click();
    await page.waitForTimeout(200);
    const hint = await page.locator("#u-hint").textContent();
    ok("pressing Drag… explains the refusal instead of picking the course up",
      /cannot re-home/i.test(hint) && hint.includes(amb.cn));
    ok("the reason names the OTHER course, not just the count",
      /also\s+\S/i.test(hint) && /which one/i.test(hint));
    // The load-bearing half: nothing was carried, so clicking a destination
    // cannot complete a move the key cannot express.
    await flyClick(plan.tgt);
    ok("and no write row is produced by clicking a destination afterwards",
      (await page.evaluate(() => window.__ccrUniverseState().moves.length)) === before);

    // There are TWO guards and only the first is reachable through the UI: the
    // pickup refusal above never lets a shared key reach applyMove, so removing
    // canMove leaves every check above green. Assert it separately, or the
    // deeper guard is untested and a future path that sets `drag` another way
    // walks straight past it.
    const gate = await page.evaluate(([bad, good]) => {
      const f = window.__ccrUniverseState().canMove;
      return { bad: f(bad).ok, others: (f(bad).others || []).length,
               good: good ? f(good).ok : null };
    }, [amb.cn, amb.uniqCn]);
    ok("the write guard itself refuses the ambiguous key, and allows a unique one",
      gate.bad === false && gate.good === true);
    ok(`and reports the courses it could not choose between (${gate.others})`,
      gate.others >= 2);
  }

  console.log("\n══ course descriptions load on demand (shards keyed by control number)");
  // Served over http here, which is the whole point: under file:// these fetches are
  // blocked and the page must SAY so rather than render an empty pane, because "no
  // description loaded" and "this course has none" look identical to a curator.
  // Shard shape since 2026-09-03: { "<control number digits>": [desc, title, units] }.
  const withDesc = await page.evaluate(async () => {
    const U = window.CPL_CCR_UNIVERSE, M = window.CPL_CCR_UNIVERSE_MEMBERS;
    // Courses this harness already moved elsewhere are no longer on their
    // original card, so they cannot be the course whose button we click.
    const moved = new Set(window.__ccrUniverseState().moves.map((m) => m.cn));
    const cnOf = (m) => "CCC" + String(m[0]).padStart(9, "0");
    for (const isl of U.islands) {
      if (!isl.sh) continue;
      const r = await fetch("ccr_desc/" + encodeURIComponent(isl.sh) + ".json").catch(() => null);
      if (!r || !r.ok) continue;
      const j = await r.json();
      for (const nd of isl.p) {
        if (nd.a) continue;
        const list = (M.m[nd.i] || []).filter((m) => !moved.has(cnOf(m)));
        if (!list.length || list.length > 40) continue;
        const rec = (m) => j[String(m[0])];
        const hit = list.find((m) => rec(m) && rec(m)[0]);
        const none = list.find((m) => rec(m) && !rec(m)[0]);
        if (hit) return { shard: isl.sh, id: nd.i, x: nd.x, y: nd.y, n: Object.keys(j).length,
                          cn: "CCC" + String(hit[0]).padStart(9, "0"),
                          noneCn: none ? "CCC" + String(none[0]).padStart(9, "0") : null,
                          title: rec(hit)[1] || "" };
      }
    }
    return null;
  });
  ok("every island names a description shard",
    await page.evaluate(() => window.CPL_CCR_UNIVERSE.islands.every((i) => !!i.sh)));
  ok("a shard fetches and holds courses keyed by control number" +
     (withDesc ? ` (${withDesc.shard}, ${withDesc.n} courses)` : ""), !!withDesc);
  if (withDesc) {
    await flyClick(withDesc, withDesc.id);
    await page.waitForTimeout(800);
    ok("the shard's course titles appear beside the codes",
      !withDesc.title || (await page.locator("#u-detail .mlist").textContent()).includes(withDesc.title));
    // Sam: "course descriptions on click of a course title". The code is the button.
    await page.locator(`#u-detail .cd[data-desc="${withDesc.cn}"]`).click();
    await page.waitForTimeout(250);
    const real = await page.locator("#u-detail .mdesc:not(.none)").count();
    ok(`⭐ clicking a course number opens its catalog description (${real})`, real === 1);
    if (withDesc.noneCn) {
      await page.locator(`#u-detail .cd[data-desc="${withDesc.noneCn}"]`).click();
      await page.waitForTimeout(250);
      // A course with no description must say so, not render blank — the honest half.
      ok("a course with none says so rather than showing nothing",
        /no catalog description/i.test(await page.locator("#u-detail .mdesc.none").first().textContent()));
    } else ok("no undescribed course on this card to exercise — skipped", true);
  }

  console.log("\n══ ⭐ stand-alones orbit the identity they are most aligned to");
  // Sam, 2026-09-03: "have unassigned course individually in orbit around the
  // cluster they are most aligned to (rather than having them all sit in a huge
  // cluster as they are now)". The "· stand-alone" twin islands are gone; every
  // stand-alone is a hollow point inside its discipline, tethered to a parent.
  const sa = await page.evaluate(() => {
    const U = window.CPL_CCR_UNIVERSE;
    let orbiting = 0, rim = 0, twins = 0, stray = 0, ex = null;
    for (const isl of U.islands) {
      if (isl.a || /stand-alone$/.test(isl.d)) twins++;
      const here = new Set(isl.p.map((p) => p.i));
      for (const p of isl.p) {
        if (!p.a) continue;
        if (p.o) {
          orbiting++;
          if (!here.has(p.o)) stray++;
          if (!ex && isl.p.length < 500) ex = { d: isl.d, id: p.i, x: p.x, y: p.y, o: p.o };
        } else rim++;
      }
    }
    return { orbiting, rim, twins, stray, ex, total: U.counts.stand_alone };
  });
  ok(`no stand-alone island survives (${sa.twins})`, sa.twins === 0);
  ok(`most stand-alones orbit an identity (${sa.orbiting} of ${sa.total}; ${sa.rim} on the rim)`,
    sa.orbiting > 0.7 * sa.total);
  ok("every orbit names an identity in the same island", sa.stray === 0);
  if (sa.ex) {
    await flyClick(sa.ex, sa.ex.id);
    const pane = await page.locator("#u-detail").textContent();
    ok("the pane says which identity it orbits and why",
      /In orbit around/.test(pane) && pane.includes(sa.ex.o) && /because the two share/.test(pane));
    ok("and says it is a suggestion, not a decision", /suggestion only/i.test(pane));
    ok("and offers the accept verb (or names why it cannot)",
      (await page.locator("#u-accept").count()) === 1 || /shared key/.test(pane));
    const par = await page.evaluate((id) => {
      for (const isl of window.CPL_CCR_UNIVERSE.islands) {
        const nd = isl.p.find((p) => p.i === id);
        if (nd) return { x: nd.x, y: nd.y, id: nd.i, k: nd.k || 0 };
      }
      return null;
    }, sa.ex.o);
    await flyClick(par, par.id);
    ok(`the parent's pane lists its orbiting courses (${par.k}) with Move here`,
      (await page.locator("#u-detail .orbits li").count()) > 0 &&
      (await page.locator("#u-detail .orbits [data-accept]").count()) > 0);
    // The quick look: hover the parent at the canvas centre.
    const bb = await page.locator("#u-cvs").boundingBox();
    await page.mouse.move(bb.x + bb.width / 2 + 60, bb.y + bb.height / 2 + 60);
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.waitForTimeout(150);
    const tip = page.locator("#u-tip");
    const tipText = (await tip.isVisible()) ? await tip.textContent() : "";
    ok(`⭐ hovering shows the quick look with the number, units and system (${tipText.slice(0, 60)}…)`,
      tipText.includes(par.id) && /unit/.test(tipText) && /M-ID|C-ID|CCN|unified/.test(tipText));
    ok("…and how many courses orbit it", /in orbit/.test(tipText));
  }

  // Sam's example, 2026-09-03: a vocational business course should orbit Business
  // or Small Business — in ANOTHER discipline's island — and say where it is filed.
  const xo = await page.evaluate(() => {
    const U = window.CPL_CCR_UNIVERSE; let n = 0, ex = null;
    for (const isl of U.islands) for (const p of isl.p) if (p.a && p.h) { n++; if (!ex && p.h === "Vocational" && isl.p.length < 700) ex = { d: isl.d, id: p.i, x: p.x, y: p.y, h: p.h }; }
    return { n, ex };
  });
  ok(`⭐ orbits cross disciplines (${xo.n} satellites drawn in another subject's island)`, xo.n > 0);
  if (xo.ex) {
    await flyClick(xo.ex, xo.ex.id);
    const pane = await page.locator("#u-detail .orbit").textContent();
    ok(`a Vocational course orbiting in ${xo.ex.d} says it is filed under Vocational`,
      /filed under Vocational/.test(pane) && pane.includes(xo.ex.d));
  }

  console.log("\n══ ⭐ SkyView alone fills the window; the comprehensive view puts the panes below it");
  // Sam, 2026-09-05: SkyView is the map alone. The comprehensive view is Sam's
  // 2026-09-03 shape — "open full screen so users have more work space and
  // allow scroll down to see the other info you provide now" — one click away.
  await page.evaluate(() => window.__ccrUniverse({ solo: true }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(150);
  const solo = await page.evaluate(() => {
    const full = document.getElementById("u-full").getBoundingClientRect();
    return { on: document.body.classList.contains("u-solo"), top: full.top, bottom: full.top + full.height,
             vh: window.innerHeight, width: full.width, vw: document.documentElement.clientWidth,
             mast: document.querySelector(".mast").getBoundingClientRect().height,
             below: document.getElementById("u-below").getBoundingClientRect().height,
             scroll: document.documentElement.scrollHeight - window.innerHeight,
             hash: location.hash };
  });
  ok(`⭐ alone, the map section starts at the top of the window and ends at its bottom (${Math.round(solo.top)} → ${Math.round(solo.bottom)} of ${solo.vh})`,
    solo.on && solo.top <= 1 && Math.abs(solo.bottom - solo.vh) < 4);
  ok("nothing else is painted: no masthead, no panes, and the window does not scroll",
    solo.mast === 0 && solo.below === 0 && solo.scroll <= 1);
  ok(`the section spans the full width (${Math.round(solo.width)} of ${solo.vw})`, solo.width >= solo.vw - 2);
  ok(`the hash names the view (${solo.hash})`, solo.hash === "#skyview");
  await page.evaluate(() => window.__ccrUniverse({ solo: false }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(150);
  const geo = await page.evaluate(() => {
    const w = document.getElementById("u-wrap").getBoundingClientRect();
    const full = document.getElementById("u-full").getBoundingClientRect();
    const below = document.getElementById("u-below").getBoundingClientRect();
    return { bottom: full.top + full.height, vh: window.innerHeight, belowTop: below.top,
             width: full.width, vw: document.documentElement.clientWidth, canvasW: w.width,
             insp: !!document.querySelector("#u-stage #u-inspector #u-detail"),
             overlay: !!document.querySelector("#u-wrap #u-bar, #u-wrap #u-inspector, #u-wrap .u-legend"),
             modes: [...document.querySelectorAll("#u-top .u-modes .btn")].map((b) => b.textContent.trim()).join("/"),
             nav: !!document.querySelector("#u-full #u-nav-forest"),
             prov: (document.getElementById("prov") || {}).title || "",
             wins: [...document.querySelectorAll("#u-top .u-wins .u-win")].map((b) => b.getAttribute("aria-label") || ""),
             chipHeights: [...document.querySelectorAll("#u-top .btn:not(.mode), #u-top .u-wins .u-win:not([hidden]), #u-top .u-more > summary, #u-top .u-menu, #u-top .u-title, #u-top .u-zgroup, #u-top .u-show > summary, #u-search-slot input, #u-search-slot .u-search-go")]
               .map((b) => Math.round(b.getBoundingClientRect().height)),
             // The search field and its button are joined (6px on the outer corners,
             // 0 on the shared edge), so the outer corner is what is measured.
             chipRadius: [...document.querySelectorAll("#u-top .btn:not(.mode), #u-top .u-wins .u-win:not([hidden]), #u-search-slot input")]
               .map((b) => { const cs = getComputedStyle(b); return [cs.borderTopLeftRadius, cs.borderTopRightRadius].sort().pop(); }),
             legendToggle: !!document.querySelector("#u-wrap #u-legend-toggle"),
             cells: document.querySelectorAll("#u-more .cell").length,
             // The inspector's own "filter these courses" box is a list filter,
             // not a keyword search; only page-level search fields count here.
             fields: document.querySelectorAll("input[type=search]:not(#u-mfilter)").length };
  });
  ok(`the map section (controls, canvas, legend) reaches the bottom of the viewport (${Math.round(geo.bottom)} vs ${geo.vh})`,
    Math.abs(geo.bottom - geo.vh) < 4);
  ok(`the section spans the full width (${Math.round(geo.width)} of ${geo.vw})`, geo.width >= geo.vw - 2);
  ok("the panes start under the fold", geo.belowTop >= geo.vh - 4);
  ok("the details panel is docked beside the map, and nothing floats over the canvas", geo.insp && !geo.overlay);
  ok(`Pan and Move are word chips above the map (${geo.modes})`, geo.modes === "Pan/Move");
  ok("the other views are linked inside the full-screen element", geo.nav);
  ok("the provenance line is a hover on the title", /no writes/.test(geo.prov));
  ok(`the three window controls carry words as their names (${geo.wins.join(" / ")})`,
    geo.wins.length === 3 && geo.wins.every((w) => /[A-Za-z]/.test(w)));
  ok(`every chip in the row is one height (${[...new Set(geo.chipHeights)].join(",")}px) with 6px corners`,
    new Set(geo.chipHeights).size === 1 && geo.chipRadius.every((r) => r === "6px"));
  ok("the legend's fold sits in the map's own corner", geo.legendToggle);
  ok(`the forest is embedded below the map (${geo.cells} cells)`, geo.cells > 100);
  ok(`the map screen still carries exactly one search field (${geo.fields})`, geo.fields === 1);
  await page.evaluate(() => window.__ccrUniverse({ solo: true }));
  await page.waitForTimeout(150);

  console.log("\n══ ⭐ labels grow with zoom: number, then title, then units and system");
  const bands = await page.evaluate(() => {
    const U = window.CPL_CCR_UNIVERSE;
    const isl = U.islands.find((i) => i.n > 20 && i.n < 400) || U.islands[0];
    const nd = isl.p.find((p) => !p.a && p.u != null) || isl.p[0];
    const z = window.__ccrUniverseState().labelZooms, out = { z };
    window.__ccrUniverseFly(nd.x, nd.y, z.id + 0.2);   out.id = { ...window.__ccrUniverseState().labelStats };
    window.__ccrUniverseFly(nd.x, nd.y, z.title + 0.2); out.title = { ...window.__ccrUniverseState().labelStats };
    window.__ccrUniverseFly(nd.x, nd.y, z.full + 0.3);  out.full = { ...window.__ccrUniverseState().labelStats };
    return out;
  });
  ok("the bands are ordered (nodes < brief < titled < full)",
    nodeZoom < bands.z.id && bands.z.id < bands.z.title && bands.z.title < bands.z.full);
  ok(`past the first band a label is the title and units, with a leader line (${JSON.stringify(bands.id)})`,
    bands.id.brief > 0 && bands.id.titled === 0 && bands.id.full === 0 && bands.id.leaders === bands.id.brief);
  ok(`the second band lengthens the title (${JSON.stringify(bands.title)})`, bands.title.titled > 0 && bands.title.full === 0);
  ok(`the third band draws units and the identity system (${JSON.stringify(bands.full)})`, bands.full.full > 0);

  console.log("\n══ ⭐ a college course code finds the identity that carries it");
  const mc = await page.evaluate(() => {
    const M = window.CPL_CCR_UNIVERSE_MEMBERS, seen = {};
    for (const id of Object.keys(M.m)) for (const [, n] of M.m[id]) (seen[n] = seen[n] || new Set()).add(id);
    for (const id of Object.keys(M.m)) for (const [, n] of M.m[id])
      if (n && n.length > 6 && seen[n].size === 1) return { code: n, id };
    return null;
  });
  ok("a uniquely numbered college course exists to search for", !!mc);
  if (mc) {
    await runSearch(mc.code);
    const got = await page.evaluate(() => window.__ccrUniverseState().sel);
    ok(`searching "${mc.code}" selects the identity carrying it (${got})`, got === mc.id);
    ok("the suggestion list offers it as a college course, in words",
      await page.evaluate((code) => window.__ccrSuggest(code, 8)
        .some((s) => s.kind === "member" && s.code === code && s.kindWord === "college course"), mc.code));
  }

  console.log("\n══ a long member list is capped, and says so");
  const capped = await page.evaluate(() => {
    const M = window.CPL_CCR_UNIVERSE_MEMBERS, U = window.CPL_CCR_UNIVERSE;
    for (const isl of U.islands) {
      for (const nd of isl.p) {
        if ((M.m[nd.i] || []).length > 400)
          return { id: nd.i, x: nd.x, y: nd.y, n: M.m[nd.i].length };
      }
    }
    return null;
  });
  if (!capped) {
    ok("no identity carries enough members to exercise the cap — skipped", true);
  } else {
    await flyClick(capped, capped.id);
    const shown = await page.locator("#u-detail .mv").count();
    const txt = await page.locator("#u-detail").textContent();
    ok(`${capped.n} members render as a bounded list (${shown})`, shown > 0 && shown <= 200);
    // A capped list that reads as a census is the defect, not the cap.
    ok("and the pane says how many are off the end", /Showing [\d,]+ of [\d,]+/.test(txt));
    await page.fill("#u-mfilter", "zzzznotacourse");
    await page.waitForTimeout(200);
    ok("filtering to nothing shows nothing rather than the first 200",
      (await page.locator("#u-detail .mv").count()) === 0);
  }

  console.log("\n══ subjects can be pulled next to each other");
  const dragged = await page.evaluate(() => {
    const U = window.CPL_CCR_UNIVERSE;
    const isl = U.islands[0];
    const before = isl.dx || 0;
    isl.dx = before + 500;                     // what a drag does
    return isl.dx !== before;
  });
  ok("an island carries a movable offset", dragged);

  console.log("\n══ the ESL packaging proposal (a toggle of the workspace)");
  // Sam's item 7: fold ESL packaging into the one tab rather than leaving it a door.
  await backToForest();
  await page.waitForTimeout(400);
  ok("the workspace offers it as its third toggle", (await page.locator("#ws-esl").count()) === 1);
  await page.locator("#ws-esl").click();
  await page.waitForTimeout(500);
  ok("proposal heading, one level under the tab's h1", /What packaging ESL would actually do/
      .test(await page.locator("h2").first().textContent()) &&
    /Disciplines and subjects/.test(await page.locator("h1").first().textContent()));
  ok(`three comprehensives drawn (${await page.locator("#esl-gfx circle").count()})`,
    (await page.locator("#esl-gfx circle").count()) === 3);
  // The medium-confidence wedge is the honest half of this picture; a preview
  // that showed only the collapse would read as an argument for applying it.
  ok("the medium-confidence wedge is drawn",
    (await page.locator("#esl-gfx path").count()) >= 3);
  ok("it says plainly that nothing is written",
    /Nothing is written/i.test(await page.locator(".lede").textContent()));
  ok("both blockers are named", (await page.locator(".note li").count()) === 2);
  ok(`comprehensive + carve-out cards (${await page.locator(".deck").count()})`,
    (await page.locator(".deck").count()) === 6);
  // The transfer-level carve-out is the finding; it must not read as intact.
  const carve = await page.locator("#esl-carve").textContent();
  ok("the transfer-level carve-out reports what it LOST, not 22 of 22",
    /8 of 22/.test(carve) && /already gone/.test(carve));

  await page.locator("#esl-decks .deck").first().click();
  await page.waitForTimeout(400);
  ok(`spot-check table rows (${await page.locator("table.uc-like tbody tr").count()})`,
    (await page.locator("table.uc-like tbody tr").count()) > 10);
  ok("every header cell carries scope",
    (await page.locator("table.uc-like th[scope=col]").count()) ===
    (await page.locator("table.uc-like th").count()));
  ok("the scrolling table is a focusable labeled region",
    (await page.locator(".tblwrap[tabindex='0'][role=region]").count()) >= 1);
  ok("medium-confidence rows are listed FIRST",
    /medium|review/i.test(await page.locator("table.uc-like tbody tr").first().textContent()));
  ok("the list says it is a sample, with its denominator",
    /Showing .* of /.test(await page.locator(".empty").last().textContent()));
  ok("a bucket page leads back to the proposal with a word, inside the same tab",
    (await page.locator("#esl-back").count()) === 1 && (await page.locator("#ws-esl[aria-pressed=true]").count()) === 1);
  await page.locator("#esl-back").click();
  await page.waitForTimeout(300);
  ok("…and it comes back", (await page.locator("#esl-decks .deck").count()) === 3);
  await page.locator("#ws-discipline").click();
  await page.waitForTimeout(400);

  console.log("\n══ search + filter");
  const allRows = await page.locator("#ws-rows tr").count();
  await page.fill("#ws-q", "weld");
  await page.waitForTimeout(200);
  ok("the filter narrows the table", (await page.locator("#ws-rows tr").count()) < allRows);
  await page.fill("#ws-q", "");
  await page.waitForTimeout(200);

  console.log("\n══ discipline → decision");
  // Only a row with a decision view offers the door — never a door onto nothing.
  ok("a few rows offer Decisions; most do not", (await page.locator("#ws-rows [data-work]").count()) > 0 &&
    (await page.locator("#ws-rows [data-work]").count()) < 20);
  await page.locator("#ws-rows [data-work]").first().click();
  await page.waitForTimeout(300);
  const decks = await page.locator(".deck").count();
  ok(`decision cards (${decks})`, decks > 0);
  await page.locator(".deck").first().click();
  await page.waitForTimeout(700);
  const nodes = page.locator(".nodeg");
  const n = await nodes.count();
  ok(`graph nodes (${n})`, n >= 2);
  ok("one svg", (await page.locator(".canvas svg").count()) === 1);
  ok(`member rows (${await page.locator(".mlist li").count()})`, (await page.locator(".mlist li").count()) > 0);

  console.log("\n══ nodes are reachable without a mouse");
  ok("tabindex=0 on nodes", (await nodes.first().getAttribute("tabindex")) === "0");
  ok("role=button on nodes", (await nodes.first().getAttribute("role")) === "button");
  const lbl = await nodes.first().getAttribute("aria-label");
  ok("aria-label names the identity and its state", !!lbl && lbl.length > 20 && /courses/.test(lbl));

  console.log("\n══ the move (keyboard path — drag is not the only route)");
  await page.locator(".mv").first().click();
  await page.waitForTimeout(150);
  await nodes.nth(n - 1).press("Enter");
  await page.waitForTimeout(400);
  const writes = await page.locator(".writes div").count();
  ok(`a move produced a write (${writes})`, writes >= 1);
  const wt = await page.locator(".writes").textContent().catch(() => "");
  ok("write is `CN:<control#> merge_into <identity>`", /CN:\S+\s+merge_into\s+\S+/.test(wt));
  ok("moved course is marked in the list", (await page.locator(".chip.ok").count()) > 0);

  /* ── Sam's top-row items 1-5, 10 and 11 (2026-09-04) ───────────────────────
     Everything here is geometry or a real pointer, which is why it is in this
     file and not in tests/: jsdom has no layout, so "one row" and "the search
     is clickable" are both unfalsifiable there. Item 11 in particular — "the
     keyword search in full SkyView has a bug and doesn't allow me to click into
     it" — was the page's ONE search box living in the masthead, which browser
     full screen does not paint at all. */
  console.log("\n══ the top row (items 1-5, 10, 11)");
  await page.setViewportSize({ width: 1600, height: 950 });
  await page.evaluate(() => window.__ccrUniverse());
  await page.waitForTimeout(700);
  // Item 1 (2026-09-04) put SkyView leftmost; the header's own vocabulary
  // (2026-09-05, from Claude's header) puts the icon actions before the title
  // field, so the title is the first thing in the row that is not an icon.
  ok("item 1: the title field is the first thing in the row after the icon actions",
    await page.evaluate(() => {
      const first = [...document.querySelector("#u-top").children]
        .find((e) => !e.classList.contains("u-ico") && !e.classList.contains("u-more"));
      return !!first && first.id === "u-title" && first.textContent.trim() === "SkyView";
    }));
  ok("item 11: a real pointer click reaches the search box",
    await page.locator("#gq").click({ timeout: 4000 }).then(() => true).catch(() => false));
  // ⚠️ Clear first. Earlier blocks in this file leave a term in the box, and
  // typing onto it searched "eslwelding" — which found nothing and looked like
  // a broken suggestion list rather than a dirty fixture.
  await page.locator("#gq").fill("");
  await page.keyboard.type("welding");
  await page.waitForTimeout(500);
  const sugRows = await page.locator("#sug li").evaluateAll((ls) =>
    ls.map((l) => l.textContent.trim().replace(/\s+/g, " ")));
  ok(`typing opens suggestions (${sugRows.length})`, sugRows.length > 0);
  {
    // BY KIND, not by position: the first row for "welding" is the discipline,
    // so a first()-click silently tested the wrong half of item 10.
    // The rows read the short words since 2026-09-05 (DISC · CRSE IDENTITY ·
    // STAND-ALONE CRSE · COLLEGE CRSE), so the match is on those.
    const ci = sugRows.findIndex((t) => /identity|stand-alone|college crse|college course/i.test(t));
    const di = sugRows.findIndex((t) => /^\s*DISC(?:[A-Z\s]|$)|discipline/.test(t));
    if (ci >= 0) {
      await page.locator("#sug li").nth(ci).click(); await page.waitForTimeout(700);
      const z = (await page.locator("#u-zoom").textContent()).trim();
      ok(`item 10: a course flies to 1000% (${z})`, z === "1000%");
    } else ok("a course appears among the suggestions", false);
    // A second pick would JOIN the first (the map fits both — 2026-09-05's
    // selection chips); item 10 is about one pick, so clear the first.
    await page.evaluate(() => window.__ccrClearSelection && window.__ccrClearSelection());
    await page.locator("#gq").fill(""); await page.locator("#gq").type("welding");
    await page.waitForTimeout(500);
    if (di >= 0) {
      await page.locator("#sug li").nth(di).click(); await page.waitForTimeout(700);
      const z = (await page.locator("#u-zoom").textContent()).trim();
      ok(`item 10: a discipline flies to 150% (${z})`, z === "150%");
    } else ok("a discipline appears among the suggestions", false);
  }
  ok("item 2: the Views menu opens, carries every other view, and closes on an outside click",
    await page.evaluate(async () => {
      const d = document.getElementById("u-more-menu") || document.getElementById("u-views");
      if (!d || d.open) return false;
      d.querySelector("summary").click();
      if (!d.open || d.querySelectorAll(".u-views-menu .linkish").length < 3) return false;
      document.getElementById("u-cvs").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      return !d.open;
    }));
  ok("item 5: close sits at the right edge and clears the 24px target floor",
    await page.evaluate(() => {
      const b = document.getElementById("u-close");
      if (!b) return false;
      const r = b.getBoundingClientRect();
      return window.innerWidth - r.right < 40 && r.width >= 24 && r.height >= 24 &&
             /close/i.test(b.getAttribute("aria-label") || "");
    }));
  /* Item 4: "keep it all on one row for a typical PC view." A row is a SPAN,
     not a bucket — flex items of different heights sit at different y. */
  for (const w of [1900, 1600, 1440]) {
    await page.setViewportSize({ width: w, height: 950 });
    await page.waitForTimeout(300);
    const spread = await page.evaluate(() => {
      const ys = [...document.querySelectorAll("#u-top > *")].map((e) => e.getBoundingClientRect().y);
      return Math.round(Math.max(...ys) - Math.min(...ys));
    });
    ok(`item 4: one row at ${w}px (${spread}px of vertical spread)`, spread <= 12);
  }
  /* The map BORROWS the page's one search form. Every other view replaces #view
     wholesale, which would take the borrowed form down with it — `innerHTML =`
     detaches rather than destroys, and a node nobody references is gone. */
  await page.evaluate(() => window.__ccrForest());
  await page.waitForTimeout(500);
  ok("leaving the map returns the search form to the masthead, intact",
    await page.evaluate(() => !!document.querySelector(".mast #msearch") &&
      document.querySelectorAll("#msearch").length === 1 &&
      document.querySelector('.mast label[for="gq"]').classList.contains("sr")));
  await page.evaluate(() => window.__ccrUniverse());
  await page.waitForTimeout(700);
  ok("returning to the map borrows it back",
    await page.evaluate(() => !!document.querySelector("#u-top #msearch")));

  console.log("\n══ mobile");
  for (const w of [360, 414, 768]) {
    await page.setViewportSize({ width: w, height: 780 });
    await page.waitForTimeout(250);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(`no sideways scroll at ${w}px (${sw})`, sw <= w + 1);
  }

  console.log("");
  ok("no console errors", errs.length === 0);
  if (errs.length) console.log(errs.join("\n"));

  await browser.close(); srv.close();
  console.log(bad ? `\n${bad} check(s) FAILED` : "\nall checks passed");
  process.exit(bad ? 1 : 0);
})();
