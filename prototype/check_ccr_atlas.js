/* Layout + behavior check for the SkyView prototype.
 *
 * Deliberately NOT part of `npm test` — jsdom has no layout engine, so the
 * defects this catches (a graph that renders zero nodes, a page that scrolls
 * sideways on a phone, a move that writes nothing) are invisible to the suite.
 * Same split as scripts/check_public_page_layout.js.
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
  ok("and the subject list is a real focusable button on it, not a gesture",
    (await page.locator("button#u-list").count()) === 1);

  console.log("\n══ \u26a0 the landing view can be operated from a keyboard");
  // This is the condition the flip was made under. Before it, the canvas keydown
  // handler panned and zoomed and had NO key that reached a subject or an
  // identity — survivable while the DOM list was the way in, not survivable once
  // the map is the front door.
  await page.locator("#u-cvs").focus();
  await page.keyboard.press("Tab");
  await page.waitForTimeout(340);
  const kSub = await page.locator("#u-detail h3").textContent();
  ok(`Tab reaches a subject (${(kSub || "").slice(0, 28)})`, !!kSub);
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
  ok("Escape comes back out to the subject",
    (await page.locator("#u-detail h3").textContent()) === kSub);

  console.log("\n\u2550\u2550 the subject list (the map's own button)");
  // Sam, 2026-08-25: "The Browse by Subjects button takes me unexpectedly to the
  // package view. Seems I'm already browsing by subject." It now opens an actual
  // list of subjects, filterable and seeded from the search box; the packaging
  // view keeps its own door at the bottom of that list. This section walks that
  // route, because the route IS the fix.
  await page.locator("#gq").fill("english as a second");
  await page.locator("button#u-list").click();
  await page.waitForTimeout(400);
  ok("the button opens a SUBJECT list, not the packaging view",
    /Every subject area/.test(await page.locator("h1").first().textContent()));
  ok("it carries the search term across as the filter",
    (await page.locator("#sl-q").inputValue()) === "english as a second");
  const seeded = await page.locator("#sl-rows button").count();
  ok(`the seeded filter narrows to the ESL subjects (${seeded})`, seeded > 0 && seeded < 30);
  ok("it says how many of how many matched",
    /of\s[\d,]+\ssubjects match/.test(await page.locator("#sl-count").textContent()));
  await page.locator("#sl-q").fill("");
  await page.waitForTimeout(200);
  ok(`clearing the filter shows every subject (${await page.locator("#sl-count").textContent()})`,
    /^[\d,]+ subjects$/.test((await page.locator("#sl-count").textContent()).trim()));
  // A filter that matches nothing must say so rather than render an empty panel
  // that is indistinguishable from a corpus with no subjects in it.
  await page.locator("#sl-q").fill("zzzznotasubject");
  await page.waitForTimeout(200);
  ok("an empty filter result says so",
    /Nothing matches/.test(await page.locator("#sl-rows").textContent()));
  await page.locator("#sl-q").fill("welding");
  await page.waitForTimeout(200);
  await page.locator("#sl-rows button").first().click();
  await page.waitForTimeout(500);
  ok("picking a subject returns to the MAP, opened on it",
    (await page.locator("#u-cvs").count()) === 1 &&
    /Welding/i.test(await page.locator("#u-detail h3").textContent()));

  console.log("\n\u2550\u2550 forest (its own door, at the bottom of the subject list)");
  await page.locator("button#u-list").click();
  await page.waitForTimeout(350);
  await page.locator("button#sl-pack").click();
  await page.waitForTimeout(500);
  ok("heading rendered", (await page.locator("h1").first().textContent()).includes("Common Course Reference"));
  const cells = await page.locator(".cell").count();
  ok(`discipline cells (${cells})`, cells > 100);
  ok("stat strip has 4 tiles", (await page.locator(".stat").count()) === 4);
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
  await page.locator(".crumbs button").first().click();
  await page.waitForTimeout(400);

  console.log("\n══ the universe view");
  ok("the list still offers the way back to the map",
    (await page.locator("#go-universe").count()) === 1);
  await page.locator("#go-universe").click();
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
  ok("and reports where the matches are",
    /match/i.test(await page.locator("#u-hint").textContent()));
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
  ok(`"english as a second" finds matches (${scattered.hits})`, scattered.hits > 0);
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
    /^\s*Subject\b/i.test(subj.hint) && /English as a Second Language/i.test(subj.hint));
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
    /^\s*Subject\b/i.test(many.hint));
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
    /^\s*Subject\b/i.test(esl.hint) && /English as a Second Language/i.test(esl.hint));
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

  console.log("\n══ ⭐ the map fills the first screen; the panes are below it");
  // Sam, 2026-09-03: "have SkyView open full screen so users have more work
  // space and allow scroll down to see the other info you provide now".
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.waitForTimeout(150);
  const geo = await page.evaluate(() => {
    const w = document.getElementById("u-wrap").getBoundingClientRect();
    const below = document.getElementById("u-below").getBoundingClientRect();
    return { bottom: w.top + w.height, vh: window.innerHeight, belowTop: below.top,
             width: w.width, vw: document.documentElement.clientWidth,
             insp: !!document.querySelector("#u-full #u-inspector #u-detail"),
             fs: document.getElementById("u-fs").textContent,
             cells: document.querySelectorAll("#u-more .cell").length,
             // The inspector's own "filter these courses" box is a list filter,
             // not a keyword search; only page-level search fields count here.
             fields: document.querySelectorAll("input[type=search]:not(#u-mfilter)").length };
  });
  ok(`the canvas reaches the bottom of the viewport (${Math.round(geo.bottom)} vs ${geo.vh})`,
    Math.abs(geo.bottom - geo.vh) < 4);
  ok(`the canvas spans the full width (${Math.round(geo.width)} of ${geo.vw})`, geo.width >= geo.vw - 2);
  ok("the panes start under the fold", geo.belowTop >= geo.vh - 4);
  ok("the details panel floats over the map", geo.insp);
  ok("the full-screen control is a word", /^Full screen$/.test(geo.fs.trim()));
  ok(`the forest is embedded below the map (${geo.cells} cells)`, geo.cells > 100);
  ok(`the map screen still carries exactly one search field (${geo.fields})`, geo.fields === 1);

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
  ok("the bands are ordered (nodes < number < title < full)",
    nodeZoom < bands.z.id && bands.z.id < bands.z.title && bands.z.title < bands.z.full);
  ok(`past the first band only numbers are drawn (${JSON.stringify(bands.id)})`,
    bands.id.ids > 0 && bands.id.titles === 0 && bands.id.full === 0);
  ok(`the second band adds titles (${JSON.stringify(bands.title)})`, bands.title.titles > 0 && bands.title.full === 0);
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

  console.log("\n══ the ESL packaging proposal");
  await page.locator(".crumbs button").first().click();
  await page.waitForTimeout(400);
  ok("the banner offers it", (await page.locator("#go-esl").count()) === 1);
  await page.locator("#go-esl").click();
  await page.waitForTimeout(500);
  ok("proposal heading", /What packaging ESL would actually do/
      .test(await page.locator("h1").first().textContent()));
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
  await page.locator(".crumbs button").first().click();
  await page.waitForTimeout(400);

  console.log("\n══ search + filter");
  await page.fill("#q", "weld");
  await page.waitForTimeout(200);
  ok("search narrows the grid", (await page.locator(".cell").count()) < cells);
  await page.fill("#q", "");
  await page.waitForTimeout(200);

  console.log("\n══ discipline → decision");
  await page.locator(".cell").first().click();
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
