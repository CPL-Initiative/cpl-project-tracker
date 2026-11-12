// The First Light tab (first_light_tab.js, #first-light; S642, #3153).
//
// Sam, 2026-11-12: "add a cobi tab so I can edit it" and "this is where we should list our photos we cycle on our
// cobi views as well." Phase A shows the sets; editing is phase B.
//
// Guards the FAILURE MODES:
//   (a) the tab is wired: nav button, pane, script tag, menu group, both HTMLs identical (Rule 4);
//   (b) each view draws from the real file: the paintings from the window's own manifest (first_light.js),
//       the photos from library/photos/hero_photos.json, Sierra's set from sierra/art/manifest.json;
//   (c) today's painting on the tab is the window's, and the next seven days follow the window's paintingForDay
//       across a wrap of day % N (the tab calls the window's functions; it never restates the arithmetic);
//   (d) each view's address round-trips (CPL_SESSION.arrival opens it, viewAddress reports it);
//   (e) a signed-out visitor gets the sign-in box, no set, and no door; the menu row narrows the item to a
//       personal sign-in (the receipt the conductor runs);
//   (f) the door "Edit the rotation" in the window opens #first-light/paintings for a signed-in reviewer;
//   (g) the filter lasts the visit;
//   (h) ⭐ the photo list file equals the three hardcoded lists (the CPL Library, the Credential Catalog and
//       CPL Pathways' HERO_PHOTOS), file by file, with sizes and the 7-second pace, so they cannot drift before
//       phase B points the views at the file;
//   (i) Sierra's page today shows no paintings, as the tab says.
//
// Run from repo root: `npm test` (or `node tests/first_light_tab.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const FL = fs.readFileSync("first_light.js", "utf8");
const TAB = fs.readFileSync("first_light_tab.js", "utf8");
const OVERLAY = fs.readFileSync("nav_overlay.js", "utf8");
const NAV = fs.readFileSync("nav_groups.js", "utf8");
const HERO = JSON.parse(fs.readFileSync("library/photos/hero_photos.json", "utf8"));
const SIERRA = JSON.parse(fs.readFileSync("sierra/art/manifest.json", "utf8"));
const FILES = { "library/photos/hero_photos.json": HERO, "sierra/art/manifest.json": SIERRA };
const TOKEN = "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc";

function boot(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="header"></div>' +
    '<div class="cpl-tab-pane" data-tab="first-light"><div id="first-light-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (opts.hash || ""), runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  // Keep the greeting from opening on its own; the tests open it when they want it.
  w.localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
  if (opts.signedIn) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: TOKEN, email: "r@example.org", exp: Date.now() + 3600e3 }));
  w.fetch = (url) => {
    const key = Object.keys(FILES).find((k) => String(url).indexOf(k) === 0);
    return Promise.resolve(key ? { ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(FILES[key]))) }
      : { ok: false, status: 404, json: () => Promise.resolve(null) });
  };
  let current = null;
  w.CPL_TABS = { current: () => current };
  w.CPL_REVIEWER_SIGNIN = { mountInto: (host) => { host.innerHTML = '<form data-signin><label>Email<input></label></form>'; } };
  w.eval(SESSION);
  w.eval(FL);
  w.CPL_FIRST_LIGHT.init();
  w.eval(TAB);
  w.go = (tab) => { current = tab; w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab } })); };
  return w;
}
const $ = (w, sel) => w.document.querySelector(sel);
const $$ = (w, sel) => Array.prototype.slice.call(w.document.querySelectorAll(sel));

(async function main() {
  // ── (a) wiring ───────────────────────────────────────────────────────────
  check("(a) Rule 4: both HTMLs identical", DASH === INDEX);
  check("(a) the nav button", DASH.split('<button class="cpl-tab" data-tab="first-light">First Light</button>').length === 2);
  check("(a) the pane and its root", /id="tab-first-light" data-tab="first-light"/.test(DASH) && /id="first-light-root"/.test(DASH));
  check("(a) the script loads after the window's", DASH.indexOf('<script src="first_light.js"></script>') > 0 &&
    DASH.indexOf('<script src="first_light_tab.js"></script>') > DASH.indexOf('<script src="first_light.js"></script>'));
  check("(a) the tab sits in Sierra & Team Tools", /id: 'sierra'[^\n]*'first-light'/.test(NAV));
  check("(a) the tab leaves first_light.js untouched (no door code there)", !/#first-light|flt-door|Edit the rotation/.test(FL));
  check("(a) tokens only: no raw hex in the tab's CSS", !/#[0-9a-fA-F]{3,6}\b/.test(TAB.slice(TAB.indexOf("function ensureCss"), TAB.indexOf("/* ── address"))));

  // ── (b), (c) the daily paintings ─────────────────────────────────────────
  {
    const w = boot({ signedIn: true, hash: "#first-light" });
    w.go("first-light");
    const F = w.CPL_FIRST_LIGHT, n = F.paintings.length;
    const cards = $$(w, '[data-grid="paintings"] .flt-card');
    check("(b) every painting in the window's manifest is a card", cards.length === n && n > 0, cards.length + " of " + n);
    check("(b) each card shows the painting's own alt, as the image's alt and as text",
      cards.every((c) => { const p = F.paintings[+c.getAttribute("data-painting")]; const img = c.querySelector("img");
        return img.getAttribute("alt") === p.alt && c.textContent.indexOf(p.alt) !== -1 && c.textContent.indexOf(p.artist) !== -1 && c.textContent.indexOf(p.year) !== -1; }));
    check("(b) thumbnails are lazy and from the window's own image source",
      cards.every((c) => { const p = F.paintings[+c.getAttribute("data-painting")], src = c.querySelector("img").getAttribute("src");
        return c.querySelector("img").getAttribute("loading") === "lazy" && src.split("?")[0] === p.img.split("?")[0]; }));
    const today = F.paintingForDay(F.localDayNumber());
    check("(c) ⭐ today's painting on the tab is the window's", $(w, "[data-today]").textContent === today.title);
    check("(c) the count is the rotation's", $(w, "[data-count]").textContent.indexOf(n + " paintings") === 0);
    const next = $$(w, "[data-next] li");
    check("(c) seven days follow today", next.length === 7);
    check("(c) the next seven are the window's next seven", next.every((li, k) => li.textContent.indexOf(F.paintingForDay(F.localDayNumber() + k + 1).title) !== -1));
    // A wrap: put today three paintings before the end of the list.
    const realDay = F.localDayNumber;
    F.localDayNumber = () => n * 2000 + n - 3;
    const s = w.CPL_FIRST_LIGHT_TAB.schedule(7);
    check("(c) ⭐ across the wrap of day % N, the schedule runs to the end and starts again",
      s.length === 8 && s[0].painting === F.paintings[n - 3] && s[2].painting === F.paintings[n - 1] && s[3].painting === F.paintings[0] && s[7].painting === F.paintings[4 % n]);
    check("(c) the dates are consecutive days", s.every((x, k) => k === 0 || Math.round((x.date - s[k - 1].date) / 864e5) === 1));
    F.localDayNumber = realDay;
    check("(c) the tab restates no rotation arithmetic", !/%\s*n|% PAINTINGS|\.length\)\s*%/.test(TAB));

    // (g) the filter lasts the visit
    const q = $(w, "#flt-q");
    const artist = F.paintings[0].artist;
    q.value = artist; q.dispatchEvent(new w.Event("input"));
    const shown = $$(w, '[data-grid="paintings"] .flt-card');
    check("(g) the filter narrows by artist", shown.length > 0 && shown.length < n && shown.every((c) => c.textContent.indexOf(artist) !== -1));
    q.value = F.paintings[0].title.toUpperCase(); q.dispatchEvent(new w.Event("input"));
    check("(g) and by title, any case", $$(w, '[data-grid="paintings"] .flt-card').some((c) => +c.getAttribute("data-painting") === 0));
    w.go("dashboard"); w.go("first-light");
    check("(g) ⭐ a new visit starts with no filter", $(w, "#flt-q").value === "" && $$(w, '[data-grid="paintings"] .flt-card').length === n);
  }

  // ── (b) photos and Sierra, from the real files ───────────────────────────
  {
    const w = boot({ signedIn: true, hash: "#first-light/photos" });
    w.go("first-light");
    await tick(); await tick();
    const cards = $$(w, '[data-grid="photos"] .flt-card');
    check("(b) every photo in hero_photos.json is a card, in its order",
      cards.length === HERO.photos.length && cards.every((c, i) => c.getAttribute("data-photo") === HERO.photos[i].file));
    check("(b) each photo shows once, from library/photos/, with a written alt",
      new Set(HERO.photos.map((p) => p.file)).size === HERO.photos.length &&
      cards.every((c, i) => c.querySelector("img").getAttribute("src") === "library/photos/" + HERO.photos[i].file && c.querySelector("img").getAttribute("alt").length > 20));
    check("(b) every listed photo file exists", HERO.photos.every((p) => fs.existsSync("library/photos/" + p.file)));
    check("(b) the views that play each photo are named", cards.every((c) => /Plays on: CPL Library, Credential Catalog and CPL Pathways \(statewide view\)/.test(c.textContent)));
    check("(b) the pace is said in seconds", $(w, "#first-light-root").textContent.indexOf("every 7 seconds") !== -1);
    const img0 = cards[0].querySelector("img");
    img0.dispatchEvent(new w.Event("error"));
    check("(b) an image that cannot load gives way to a plain panel", !cards[0].querySelector("img") && !!cards[0].querySelector(".flt-noimg"));
    check("(b) the edit line opens the view", $(w, "#first-light-root").textContent.indexOf("Editing arrives next: add, drop and reorder here, and Apply opens a pull request.") !== -1);

    w.location.hash = "#first-light/sierra"; w.go("first-light");
    await tick(); await tick();
    const sc = $$(w, '[data-grid="sierra"] .flt-card');
    check("(b) every work in sierra/art/manifest.json is a card", sc.length === SIERRA.paintings.length && sc.length > 0);
    check("(b) Sierra's images are the local webp beside the list",
      sc.every((c, i) => c.querySelector("img").getAttribute("src") === "sierra/art/" + SIERRA.paintings[i].slug + "-800.webp" && fs.existsSync("sierra/art/" + SIERRA.paintings[i].slug + "-800.webp")));
    check("(b) the Sierra view says she shows no images for now", $(w, "#first-light-root").textContent.indexOf("Sierra shows no images for now") !== -1);
    check("(b) no glyph controls, no disabled buttons", !$(w, "#first-light-root button[disabled]") && !/[←-⇿✀-➿\u{1F300}-\u{1FAFF}]/u.test($(w, "#first-light-root").textContent));
  }

  // ── (d) each view's address round-trips ──────────────────────────────────
  for (const v of ["paintings", "photos", "sierra"]) {
    const w = boot({ signedIn: true, hash: "#first-light/" + v });
    w.go("first-light");
    await tick(); await tick();
    const cur = $(w, '.flt-views a[aria-current="page"]');
    check("(d) #first-light/" + v + " opens " + v, cur && cur.getAttribute("href") === "#first-light/" + v);
    w.CPL_SESSION.stashReturnTab("first-light");
    const back = JSON.parse(w.localStorage.getItem("cpl_sb_return_tab") || "{}").tab;
    check("(d) ⭐ " + v + " reports first-light/" + v + " for the sign-in link", back === "first-light/" + v, back);
  }
  {
    const w = boot({ signedIn: true, hash: "#first-light/nonsense" });
    w.go("first-light");
    check("(d) an unknown view opens the paintings", $(w, '.flt-views a[aria-current="page"]').getAttribute("href") === "#first-light/paintings");
  }

  // ── (e), (f) signed out, signed in, and the door ─────────────────────────
  {
    const w = boot({ hash: "#first-light/paintings" });
    w.go("first-light");
    check("(e) ⭐ signed out: no set is drawn", !$(w, ".flt-grid") && !$(w, "[data-today]"));
    check("(e) signed out: the shared sign-in box is offered", !!$(w, ".flt-signin [data-signin]"));
    w.CPL_FIRST_LIGHT.open(); w.CPL_FIRST_LIGHT_TAB.syncDoor();
    const door = $(w, ".cplfl-overlay .cplfl-actions #flt-door");
    check("(e) ⭐ signed out: the window carries no visible door", !door || door.hidden);
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: TOKEN, email: "r@example.org", exp: Date.now() + 3600e3 }));
    w.dispatchEvent(new w.CustomEvent("cpl-session-changed"));
    check("(f) a sign-in draws the tab without a reload", !!$(w, '[data-grid="paintings"]'));
    const d2 = $(w, ".cplfl-overlay .cplfl-actions #flt-door");
    check("(f) ⭐ signed in: the door shows in the window", !!d2 && !d2.hidden);
    check("(f) the door is an underlined word-link to the paintings", d2 && d2.tagName === "A" && d2.textContent === "Edit the rotation" && d2.getAttribute("href") === "#first-light/paintings");
    d2.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
    check("(f) following the door closes the window", !$(w, ".cplfl-overlay").classList.contains("open"));
  }
  {
    // The menu: the receipt's row narrows the item to a personal sign-in, read by nav_overlay.js itself.
    const RECEIPT = fs.readFileSync("kb/receipts/cobi_nav_first_light_magic_link_2026-11-12_s642.sql", "utf8");
    check("(e) the receipt inserts the tab's row at magic_link, insert only",
      /insert into public\.cobi_nav/i.test(RECEIPT) && /'tab', 'first-light'/.test(RECEIPT) && /'magic_link'/.test(RECEIPT) && /on conflict \(kind, key\) do nothing/i.test(RECEIPT) && /Rollback: delete from public\.cobi_nav/.test(RECEIPT));
    function overlay(signed) {
      const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.org/", runScripts: "outside-only" });
      const w = dom.window;
      w.fetch = () => Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve(null) });
      if (signed) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: TOKEN }));
      w.eval(OVERLAY);
      w.CPL_NAV_OVERLAY._set([{ kind: "tab", key: "first-light", audience: "magic_link" }]);
      return w.CPL_NAV_OVERLAY;
    }
    check("(e) ⭐ with that row, a signed-out visitor's menu has no First Light", overlay(false).audienceAllows("first-light") === false);
    check("(e) with that row, a signed-in reviewer's menu has it", overlay(true).audienceAllows("first-light") === true);
  }

  // ── (h) the one list equals the three hardcoded lists ────────────────────
  {
    const want = HERO.photos.map((p) => [p.file, p.width, p.height]);
    function slides(html, dirPrefix) {
      const block = html.slice(html.indexOf('class="hero-slides"'), html.indexOf("</div>", html.indexOf('class="hero-slides"')));
      const out = [];
      block.replace(/<img class="hero-slide[^"]*" (?:src|data-src)="([^"]+)" alt="" width="(\d+)" height="(\d+)">/g, function (_, src, wd, ht) {
        out.push([src.indexOf(dirPrefix) === 0 ? src.slice(dirPrefix.length) : "WRONG DIR " + src, +wd, +ht]);
      });
      return out;
    }
    const lib = slides(fs.readFileSync("library/index.html", "utf8"), "photos/");
    const adopt = slides(fs.readFileSync("library/adopt/index.html", "utf8"), "../photos/");
    const pw = fs.readFileSync("cpl_pathways.js", "utf8");
    const m = /var HERO_PHOTOS = (\[[\s\S]*?\]\]);/.exec(pw);
    const path = m ? JSON.parse(m[1]) : null;
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    check("(h) ⭐ the CPL Library's slides equal hero_photos.json", same(lib, want), JSON.stringify(lib));
    check("(h) ⭐ the Credential Catalog's slides equal hero_photos.json", same(adopt, want), JSON.stringify(adopt));
    check("(h) ⭐ CPL Pathways' HERO_PHOTOS equals hero_photos.json", same(path, want), JSON.stringify(path));
    check("(h) CPL Pathways reads the same folder", /var HERO_DIR = "library\/photos\/"/.test(pw));
    const pace = (src) => { const x = /HERO_MS = (\d+)/.exec(src); return x ? +x[1] : null; };
    check("(h) the pace is the file's in all three",
      pace(fs.readFileSync("library/public_library.js", "utf8")) === HERO.pace_ms && pace(fs.readFileSync("library/adopt/adopt.js", "utf8")) === HERO.pace_ms && pace(pw) === HERO.pace_ms && HERO.pace_ms === 7000);
    check("(h) every photo plays on all three views it lists", HERO.photos.every((p) => same(p.plays, HERO.views.map((v) => v.id))));
  }

  // ── (j) the tab claims only its own module (COBIx on #3162) ───────────────
  // The tab id matches first_light.js by the builders' naming convention, but that file is the overlay every
  // visitor loads, which reads Wikimedia and writes cpl_reflections. Crediting it to a reviewer-only tab would
  // hide a public writer from a "who else writes" check.
  {
    const sw = { COBI_ADMIN_SURFACE: null };
    new Function("window", fs.readFileSync("cobi_admin_surface.js", "utf8"))(sw);
    const entry = sw.COBI_ADMIN_SURFACE && sw.COBI_ADMIN_SURFACE.tabs && sw.COBI_ADMIN_SURFACE.tabs["first-light"];
    check("(j) ⭐ the admin surface gives the tab its own module and no other", entry && JSON.stringify(entry.modules) === '["first_light_tab.js"]', JSON.stringify(entry && entry.modules));
    check("(j) ⭐ the tab writes no table", entry && Array.isArray(entry.writes) && entry.writes.length === 0, JSON.stringify(entry && entry.writes));
    const MAP = JSON.parse(fs.readFileSync("kb/dependency_map.json", "utf8"));
    const find = (o, key) => { if (!o || typeof o !== "object") return null; if (o[key]) return o[key]; for (const k of Object.keys(o)) { const r = find(o[k], key); if (r) return r; } return null; };
    const refl = find(MAP, "supabase:cpl_reflections");
    const overlay = (refl && refl.consumers || []).filter((c) => c.id === "module:first_light.js");
    check("(j) ⭐ the overlay's read and write of cpl_reflections stay on the page, not the tab",
      overlay.length >= 2 && overlay.some((c) => c.direction === "write") && overlay.every((c) => (c.pages || []).indexOf("CPL_Dashboard.html") !== -1 && !(c.tabs || []).length),
      JSON.stringify(overlay));
    const BUILDER = fs.readFileSync("kb/_build_cobi_admin_surface.py", "utf8");
    check("(j) the builder names first_light.js as a module the tab does not own", /"first-light":\s*\["first_light\.js"\]/.test(BUILDER.slice(BUILDER.indexOf("NOT_TAB_MODULES"))));
  }

  // ── (i) Sierra's page today ──────────────────────────────────────────────
  {
    const page = fs.readFileSync("sierra/index.html", "utf8") + fs.readFileSync("sierra/sierra.js", "utf8") + fs.readFileSync("sierra/sierra.css", "utf8");
    check("(i) Sierra's page loads none of her art", page.indexOf("art/") === -1 && page.indexOf(".webp") === -1);
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
