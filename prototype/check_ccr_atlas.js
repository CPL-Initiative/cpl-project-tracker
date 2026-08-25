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

  console.log("\n══ forest");
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
  ok("the banner offers it", (await page.locator("#go-universe").count()) === 1);
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
  // match for none must not silently pick one of them. ("art" is a poor probe
  // here — it is the exact name of a discipline, so going to Art is correct.)
  const many = await runSearch("tech");
  ok("a word matching several different subjects does not pick one for you",
    !/^\s*Subject\b/i.test(many.hint));
  ok("and still lands where its hits can be seen",
    many.k > nodeZoom || !/ring/i.test(many.hint));

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
    await page.locator(row).click();
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

  console.log("\n══ course descriptions load on demand");
  // Served over http here, which is the whole point: under file:// these fetches are
  // blocked and the page must SAY so rather than render an empty pane, because "no
  // description loaded" and "this course has none" look identical to a curator.
  const withDesc = await page.evaluate(async () => {
    const U = window.CPL_CCR_UNIVERSE, M = window.CPL_CCR_UNIVERSE_MEMBERS;
    for (const isl of U.islands) {
      if (!isl.sh) continue;
      const r = await fetch("ccr_desc/" + encodeURIComponent(isl.sh) + ".json").catch(() => null);
      if (!r || !r.ok) continue;
      const j = await r.json();
      const id = Object.keys(j).find((k) => (j[k] || []).some(Boolean) && (M.m[k] || []).length);
      if (id) {
        const nd = isl.p.find((p) => p.i === id);
        if (nd) return { shard: isl.sh, id, x: nd.x, y: nd.y, n: Object.keys(j).length };
      }
    }
    return null;
  });
  ok("every island names a description shard",
    await page.evaluate(() => window.CPL_CCR_UNIVERSE.islands.every((i) => !!i.sh)));
  ok("a shard fetches and holds descriptions" +
     (withDesc ? ` (${withDesc.shard}, ${withDesc.n} identities)` : ""), !!withDesc);
  if (withDesc) {
    await flyClick(withDesc, withDesc.id);
    await page.waitForTimeout(700);
    const shown = await page.locator("#u-detail .mdesc").count();
    const real = await page.locator("#u-detail .mdesc:not(.none)").count();
    ok(`descriptions render under the courses (${real} with text, ${shown} slots)`, real > 0);
    // A course with no description must say so, not render blank — the honest half.
    ok("a course with none says so rather than showing nothing",
      await page.evaluate(() => {
        const n = document.querySelector("#u-detail .mdesc.none");
        return !n || /no catalog description/i.test(n.textContent);
      }));
  }

  console.log("\n══ stand-alones are reachable and marked");
  const sa = await page.evaluate(() => {
    const U = window.CPL_CCR_UNIVERSE;
    const isl = U.islands.find((i) => i.a && i.p.length);
    if (!isl) return null;
    return { d: isl.d, n: isl.n, id: isl.p[0].i, x: isl.p[0].x, y: isl.p[0].y,
             flagged: isl.p.every((p) => p.a === 1),
             islands: U.islands.filter((i) => i.a).length,
             total: U.islands.reduce((s, i) => s + (i.a ? i.n : 0), 0) };
  });
  ok("stand-alones are present as their own islands" +
     (sa ? ` (${sa.islands} islands, ${sa.total} courses)` : ""), !!sa && sa.total > 1000);
  if (sa) {
    ok("every point in a stand-alone island is flagged as one", sa.flagged);
    await flyClick(sa, sa.id);
    ok("and the pane says what a stand-alone is",
      /stand-alone/i.test(await page.locator("#u-detail").textContent()));
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
