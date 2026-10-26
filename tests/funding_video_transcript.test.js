// tests/funding_video_transcript.test.js
//
// The funding introduction film's page, made public at the statewide summit
// (2026-10-30), passes WCAG 2.2 AA (axe sweep, 2026-10-26). Guards:
//
//   1. The page names its language (3.1.1): <html lang="en"> in the source, so
//      every built variant carries it.
//   2. Everything sits in one <main> (axe region): the player, its scrubber,
//      the Download MP4 link and the two links back.
//   3. The film's text alternative (1.2.1 and 1.2.3). The film carries its
//      information as words and figures on screen under music, with no voice, so
//      the page gives a Transcript fold below the player, closed until opened,
//      one entry per scene in the film's order, opening "Music only, no
//      narration."
//   4. It is generated from the picture, so it cannot drift: the published
//      film's transcript carries every figure figures.json files for the
//      published scenario; every text block the stage holds for half a second
//      appears in the transcript; the reader in the source types no figure of
//      its own; and reading a scene puts it back as it was built.
//
// Run from repo root: `npm test` (or `node tests/funding_video_transcript.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const DIR = path.join(__dirname, "..", "prototype", "funding_video");
const src = fs.readFileSync(path.join(DIR, "funding_in_motion.src.html"), "utf8");
const figures = JSON.parse(fs.readFileSync(path.join(DIR, "figures.json"), "utf8"));

function boot(file) {
  const html = fs.readFileSync(path.join(DIR, file), "utf8");
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "file:///" + path.join(DIR, file),
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
      w.HTMLElement.prototype.scrollIntoView = function () {};
    },
  });
  return { w: dom.window, html };
}
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const money = (v) => "$" + Math.round(v).toLocaleString("en-US");

check("a1 the source opens with <html lang=\"en\">", /^<html lang="en">\s*<title>/.test(src));

// The reader types no figure of its own: every number it prints comes off the scene.
{
  const a = src.indexOf("/* ---- the transcript (WCAG"), b = src.indexOf("var btnPlay=", a);
  const block = src.slice(a, b);
  check("a2 the transcript's reader carries no figure: no dollar amount, no FTES figure, no date",
    a > 0 && b > a && !/\$\s*\d|\d[\d,.]*\s*FTES|\b20\d\d\b|\d+%/.test(block.replace(/\/\*[\s\S]*?\*\//g, "")));
}

[["funding_in_motion_s2.html", "s2 ", false], ["funding_in_motion.html", "s1 ", false],
 ["funding_in_motion_n1.html", "n1 ", true], ["funding_in_motion_n2.html", "n2 ", true]].forEach(([file, tag, narrated]) => {
  const { w, html } = boot(file), d = w.document;
  check(tag + "b1 " + file + " names its language", /^<html lang="en">/.test(html) && d.documentElement.getAttribute("lang") === "en");
  const mains = d.querySelectorAll("main");
  const main = mains[0];
  check(tag + "b2 one main holds the player, its scrubber, Download MP4 and the links back",
    mains.length === 1 && ["#player", ".scrub", "#dl", "#to-explainer", "#to-public", "header", "#chapters"].every((s) => main.querySelector(s)));
  check(tag + "b3 nothing in the body sits outside main but the script",
    Array.from(d.body.children).every((e) => e === main || e.tagName === "SCRIPT"));

  const det = d.getElementById("transcript"), sum = det && det.querySelector("summary");
  check(tag + "c1 a Transcript fold below the player, closed until opened",
    !!det && det.tagName === "DETAILS" && !det.open && !!sum && norm(sum.textContent) === "Transcript" && !!sum.querySelector("h2")
      && !!(d.getElementById("player").compareDocumentPosition(det) & w.Node.DOCUMENT_POSITION_FOLLOWING));
  const note = det.querySelector(".tr-note"), items = Array.from(det.querySelectorAll("ol.tr > li"));
  check(tag + "c2 it opens by saying what the film carries" + (narrated ? " (a narrated cut: the captions carry the voice)" : ": music only, no narration"),
    !!note && (narrated ? /^Narrated, with music; the captions on the player carry the narration\./ : /^Music only, no narration\./).test(note.textContent));
  const chapters = Array.from(d.querySelectorAll("#chapters .chap")).map((b) => norm(b.querySelector(".tc").textContent + " " + b.querySelector(".nm").textContent));
  check(tag + "c3 one entry per scene, in the film's order, headed as the scene list is (" + items.length + ")",
    items.length > 9 && items.length === chapters.length && items.every((li, i) => norm(li.querySelector("h3").textContent) === chapters[i]));
  check(tag + "c4 every scene gives words, and the picture lines say Picture",
    items.every((li) => li.querySelectorAll(":scope > p:not(.tr-pic), :scope > ul").length > 0)
      && Array.from(det.querySelectorAll(".tr-pic")).every((p) => /^Picture: [A-Z]/.test(p.textContent)));
  // the transcript's text, each block apart (textContent alone runs one paragraph into the next)
  const T = norm(Array.from(det.querySelectorAll(".tr-note, h3, p, li li")).map((e) => e.textContent).join(" "));

  // Reading a scene puts it back as it was built: at load only the first scene
  // has been drawn, so no other scene carries an opacity a reading left behind.
  const roots = Array.from(d.querySelectorAll("#stage .sc"));
  check(tag + "d1 reading the scenes leaves them as built (no hidden scene carries a drawn state)",
    roots.length === items.length && roots.slice(1).every((r) => !/opacity/.test(r.innerHTML) && !r.getAttribute("style").includes("opacity")));

  // Every text block the stage holds for half a second is in the transcript.
  const visible = (el, root) => { for (let e = el; e && e !== root.parentNode; e = e.parentNode) { if (e.style && e.style.opacity !== "" && Number(e.style.opacity) === 0) return false; } return true; };
  const OPS = new Set(["÷", "−", "="]);
  const zero = /^\$?0(\.0)?%?( FTES)?$/;   // a counter at rest before it counts
  const held = new Map(), missing = new Set(), STEP = 0.1;
  for (let t = 0; t <= w.__film.dur + 1e-9; t += STEP) {
    w.__film.seek(t);
    const now = new Set();
    roots.filter((r) => r.style.visibility === "visible").forEach((r) => {
      Array.from(r.querySelectorAll("p,div")).filter((e) => !e.querySelector("p,div") && visible(e, r)).forEach((e) => now.add(norm(e.textContent)));
    });
    Array.from(d.querySelectorAll("#fx .inv")).filter((e) => e.style.visibility === "visible").forEach((e) => now.add(norm(e.querySelector(".cap").textContent)));
    now.forEach((s) => {
      if (!s || OPS.has(s) || zero.test(s)) return;
      const n = (held.get(s) || 0) + 1;
      held.set(s, n);
      if (n * STEP >= 0.5 && !T.includes(s.replace(/ · /g, ", "))) missing.add(s);
    });
    Array.from(held.keys()).forEach((s) => { if (!now.has(s)) held.delete(s); });
  }
  check(tag + "e1 every text the stage holds for half a second is in the transcript" + (missing.size ? " (missing: " + Array.from(missing).slice(0, 4).join(" | ") + ")" : ""),
    missing.size === 0);
  if (file === "funding_in_motion_s2.html") {
    check(tag + "e2 the targets slide's operators read as words", /divided by \$/.test(T) && / equals [\d,.]+ /.test(T));
    // The published film's figures: what figures.json files for the published scenario.
    const cfg = JSON.parse(/CFG=(\{[\s\S]*?\}),EXPLAINER=/.exec(html)[1]);
    const f = figures.scenarios[figures.published];
    const want = [money(f.appropriation), money(f.toInstitutions), money(f.statewide), f.institutions + " institutions",
      money(f.base) + " base", money(f.cap) + " cap", money(f.average.max), money(f.average.cr) + " credit share", money(f.average.nc) + " noncredit share"]
      .concat(f.priorities.map((p) => p.title + " (" + Math.round(p.share * 100) + "%)"))
      .concat(f.priorities.map((p) => money(p.funding) + " statewide"))
      .concat(f.priorities.map((p) => (Math.round(p.target * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1 })))
      .concat([f.priorities[0].avgTargetFtes.toFixed(1) + " FTES", (f.priorities[0].avgTargetFtes / 2).toFixed(1) + " FTES",
        money(f.priorities[0].avgTargetUsd), money(f.priorities[0].avgTargetUsd / 2)])
      .concat([cfg.deadline, cfg.ncLine || "Only noncredit outcomes"].concat(cfg.timing.map((n) => n[1] + ": " + n[2])));
    const absent = want.filter((s) => !T.includes(s));
    check(tag + "e3 the published film's transcript carries every figure filed for " + figures.published + " (config " + figures.config_md5 + ")" +
      (absent.length ? " (absent: " + absent.join(" | ") + ")" : ""),
      cfg.figures && cfg.figures.config_md5 === figures.config_md5 && cfg.figures.published === true && absent.length === 0);
  }
  w.close();
});

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
