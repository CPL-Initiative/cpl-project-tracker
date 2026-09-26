// tests/funding_video_page.test.js
//
// The funding introduction video pages (prototype/funding_video/). Guards the
// four things Sam asked for on 2026-09-26 that a later edit could quietly undo:
//
//   1. It is an INTRODUCTION, not a guide ("a guide would be much longer and
//      more detailed"): the page, the explainer's link and the video itself.
//   2. The barriers the arrow shoots down exist, and step aside under
//      prefers-reduced-motion.
//   3. The page opens using the fullest screen: a Full screen control and a
//      Download MP4 link that points at a file that exists.
//   4. The built pages match the one source (build.py fills placeholders; a
//      left-over __PLACEHOLDER__ means someone edited a built page by hand or
//      forgot to rebuild).
//
// Run from repo root: `npm test` (or `node tests/funding_video_page.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const DIR = "prototype/funding_video";
const src = fs.readFileSync(path.join(DIR, "funding_in_motion.src.html"), "utf8");
const explainer = fs.readFileSync("funding-model/index.html", "utf8");

check("a1 the explainer's link says introduction, not guide",
  /id="video-link"[^>]*>Watch the 90-second introduction</.test(explainer));
check("a2 the Scenario 2 label says introduction",
  explainer.includes('label: "Watch the 90-second introduction (Scenario 2)"'));
check("a3 the explainer's MP4 link downloads", /id="video-mp4"[^>]*\sdownload[\s>]/.test(explainer));
check("a4 the source never calls itself a guide for colleges", !/guide for colleges|Play the guide/i.test(src));

function boot(file, reduced) {
  const html = fs.readFileSync(path.join(DIR, file), "utf8");
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "file:///" + path.resolve(DIR, file),
    beforeParse(w) {
      w.matchMedia = (q) => ({ matches: !!reduced && /reduce/.test(q), addListener() {}, removeListener() {} });
      w.HTMLElement.prototype.scrollIntoView = function () {};
    },
  });
  return dom.window;
}

[["funding_in_motion.html", "20260926_CPL_Funding_in_Motion.mp4", ""],
 ["funding_in_motion_s2.html", "20260926_CPL_Funding_in_Motion_Scenario_2.mp4", "s2 "]].forEach(([file, mp4, tag]) => {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  check(tag + "b1 " + file + " has no unfilled placeholder", !/__[A-Z0-9]+__/.test(raw));
  check(tag + "b2 " + file + " carries the current source (the barrier layer)", raw.includes("var ENC=") && raw.includes("Play the introduction"));
  const w = boot(file, false), d = w.document;
  const dl = d.getElementById("dl");
  check(tag + "c1 a Download MP4 link with the download attribute", dl && dl.hasAttribute("download") && dl.textContent === "Download MP4");
  check(tag + "c2 it points at the scenario's MP4, which exists", dl && dl.getAttribute("href") === mp4 && fs.existsSync(path.join(DIR, mp4)));
  check(tag + "c3 a Full screen control inside the player", !!d.querySelector("#player #fs"));
  check(tag + "c4 the stage sits first, before the page header",
    d.getElementById("player").compareDocumentPosition(d.querySelector("header")) & w.Node.DOCUMENT_POSITION_FOLLOWING);
  check(tag + "c5 the big button invites the introduction", d.getElementById("bigplay").textContent === "Play the introduction");
  check(tag + "c6 the region is labeled an introduction", d.getElementById("stage").getAttribute("aria-label") === "Introduction video");
  const inv = d.querySelectorAll("#fx .inv");
  check(tag + "d1 five barriers, each with a caption", inv.length === 5 && Array.from(inv).every((e) => e.querySelector(".cap").textContent.trim().length > 0));
  w.__film.seek(15.1);
  check(tag + "d2 a barrier shows at a scene seam", Array.from(inv).some((e) => e.style.visibility === "visible"));
  w.__film.seek(40);
  check(tag + "d3 and none mid-scene", Array.from(inv).every((e) => e.style.visibility !== "visible"));
  // The targets scene (46 s) holds at half the target, then fills it. The
  // figures on screen must be the ones typed from the engine: halving the
  // ROUNDED target printed 22.1 FTES where the engine's half is 22.2.
  const cfg = JSON.parse(/CFG=(\{[\s\S]*?\}),EXPLAINER=/.exec(raw)[1]);
  const ftesShown = () => Array.from(d.querySelectorAll("#stage div")).map((e) => e.textContent).find((x) => /^\d+\.\d FTES$/.test(x));
  w.__film.seek(51.8);
  check(tag + "e1 the half-target hold shows the engine's half figure (" + cfg.target.halfFtesWords + ")", ftesShown() === cfg.target.halfFtesWords + " FTES");
  w.__film.seek(55.5);
  check(tag + "e2 the full target shows the engine's figure (" + cfg.target.ftesWords + ")", ftesShown() === cfg.target.ftesWords + " FTES");
  const wr = boot(file, true);
  wr.__film.seek(15.1);
  check(tag + "d4 reduced motion: no barriers", Array.from(wr.document.querySelectorAll("#fx .inv")).every((e) => e.style.visibility !== "visible"));
  w.close(); wr.close();
});

let fail = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + n); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
