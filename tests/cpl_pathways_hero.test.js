// CPL Pathways' statewide head carries the Credential Catalog's photos (SkyMeadow, 2026-11-07). Sam, 2026-11-06: yes to
// the hero picture from the standard format. Guards:
//   - the statewide head draws the photo arc, the first photo loaded and the rest waiting for their turn;
//   - the photos are decoration (aria-hidden, empty alt), and the pause control is a word outside them;
//   - Pause photos stops the cycle and says Play photos; it cycles only on screen; reduced motion, or no
//     IntersectionObserver (jsdom), shows the first photo still, with no control and no timer;
//   - a college's head carries no photos;
//   - the CSS names tokens, never a raw hex.
// Run from repo root: `npm test` (or `node tests/cpl_pathways_hero.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const DRIVE = require("./cpl_pathways_drive.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const txt = (n) => (n && n.textContent || "").replace(/\s+/g, " ").trim();
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const BACC = fs.readFileSync("cpl_baccalaureates_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.org/#cpl-pathways" });
  const w = dom.window;
  w.fetch = () => Promise.reject(new Error("offline"));
  w.matchMedia = (q) => ({ matches: !!opts.still && /reduce/.test(q), addListener() {}, removeListener() {} });
  const timers = [];
  w.setInterval = (fn, ms) => { timers.push({ fn, ms, on: true }); return timers.length; };
  w.clearInterval = (id) => { if (timers[id - 1]) timers[id - 1].on = false; };
  const seen = [];
  if (!opts.noObserver) w.IntersectionObserver = function (fn) { this.observe = (n) => { seen.push(fn); w.setTimeout(() => fn([{ target: n, isIntersecting: true }]), 0); }; this.disconnect = () => {}; };
  w.eval(DATA); w.eval(ROEP); w.eval(BACC); w.eval(SRC);
  DRIVE.withList(w);
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_PATHWAYS_TAB.activate();
  return { w, root: w.document.getElementById("cpl-pathways-root"), timers, seen };
}

(async function () {
  let t = load();
  await settle();
  const head = t.root.querySelector(".cplpw-head");
  const v = head && head.querySelector(".cplpw-hero-v");
  const imgs = v ? [...v.querySelectorAll("img")] : [];
  check("the statewide head draws the photo arc", head && /has-hero/.test(head.className) && imgs.length === 11, imgs.length);
  check("the photos come from the Library's folder", imgs.length && imgs.every((i) => /^library\/photos\/hero-[a-z0-9-]+\.jpg$/.test(i.getAttribute("data-src"))));
  check("the first photo loads with the head, the second ahead of its turn, the rest wait",
    imgs[0] && imgs[0].getAttribute("src") && imgs[1].getAttribute("src") && !imgs[2].getAttribute("src") && /is-on/.test(imgs[0].className));
  check("the photos are decoration", v && v.getAttribute("aria-hidden") === "true" && imgs.every((i) => i.getAttribute("alt") === ""));
  const b = head && head.querySelector("button.cplpw-hero-pause");
  check("the pause control is a word outside the hidden photos", b && txt(b) === "Pause photos" && !v.contains(b));
  const live = t.timers.filter((x) => x.on);
  check("the cycle runs at the Catalog's pace", live.length === 1 && live[0].ms === 7000);
  live[0].fn();
  check("a turn shows the next photo and loads the one after", /is-on/.test(imgs[1].className) && !/is-on/.test(imgs[0].className) && imgs[2].getAttribute("src"));
  b.click();
  check("Pause photos stops the cycle and offers Play photos", txt(b) === "Play photos" && t.timers.every((x) => !x.on));
  b.click();
  check("Play photos starts it again", txt(b) === "Pause photos" && t.timers.filter((x) => x.on).length === 1);

  t.seen[0]([{ isIntersecting: false }]);
  check("scrolled off screen, the cycle stops; back on, it runs", t.timers.every((x) => !x.on) &&
    (t.seen[0]([{ isIntersecting: true }]), t.timers.filter((x) => x.on).length === 1));

  DRIVE.chooseCollege(t.w, t.root, "Mt. San Antonio College");
  await settle();
  check("a college's head carries no photos", !t.root.querySelector(".cplpw-hero-v") && !t.root.querySelector(".cplpw-hero-pause"));
  const running = t.timers.filter((x) => x.on);
  running.forEach((x) => x.fn());
  check("the old head's cycle stops once it leaves the page", t.timers.every((x) => !x.on));

  t = load({ still: true });
  await settle();
  const v2 = t.root.querySelector(".cplpw-hero-v");
  check("reduced motion: the first photo stands still, no control, no cycle",
    v2 && /is-on/.test(v2.querySelector("img").className) && !t.root.querySelector(".cplpw-hero-pause") && !t.timers.length);

  t = load({ noObserver: true });
  await settle();
  check("with no way to tell the head is on screen, the first photo stands still", t.root.querySelector(".cplpw-hero-v") && !t.timers.length && !t.root.querySelector(".cplpw-hero-pause"));

  const css = (SRC.match(/"\.cplpw-hero-[^"]*"|"\.cplpw-head\.has-hero[^"]*"/g) || []).join(" ");
  check("the hero CSS names tokens, never a raw hex", css && !/#[0-9a-fA-F]{3,8}\b/.test(css) && /var\(--border\)/.test(css));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  — " + r[2])));
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
