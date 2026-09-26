// tests/funding_video_page.test.js
//
// The funding introduction video pages (prototype/funding_video/). Guards the
// five things Sam asked for on 2026-09-26 that a later edit could quietly undo:
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
//   5. The narration's spoken form (narration_s1.json) reads naturally: v2 read
//      "stilted, especially when sounding out C-P-L rather than just saying it
//      quickly--same with sounding out the year numbers". CI has no voice
//      model, so this guards the text narrate.py feeds the voice; narrate.py
//      --check guards the phonemes.
//
//   6. The narrated draft (funding_in_motion_n1.html) runs on the narration's
//      clock: each scene stretches across its lead-in, clip and air, captions
//      follow the voice, and the closing scene says the voice is synthetic.
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

const narration = JSON.parse(fs.readFileSync(path.join(DIR, "narration_s1.json"), "utf8"));
const spoken = narration.scenes.map((s) => s.text).join(" ");
check("n1 acronyms are written unspaced, so each reads as one quick word", !/\b[A-Z] [A-Z]\b/.test(spoken) && /\bCPL\b/.test(spoken));
check("n2 MAP is written 'map', so it is said as the word", !/\bMAP\b/.test(spoken) && /\bmap\b/.test(spoken));
check("n3 no digits: a year in digits reads as 'two thousand'", !/\d/.test(spoken));
check("n4 FTES carries the letters fix (unspaced it reads 'eftess')",
  (narration.phoneme_fixes || []).some((f) => f.find === "ˈɛftˈɛs" && f.use === "ˌɛftˌiːˌiːˈɛs"));
check("n5 the stilted v2 readings stay banned",
  ["sˈiː pˈiː ˈɛl", "twˈɛnti twˈɛnti", "ˌɛmˌeɪpˈiː"].every((b) => (narration.never || []).some((n) => n.phonemes === b)));

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

{
  const tag = "n1 ", file = "funding_in_motion_n1.html";
  const L = JSON.parse(fs.readFileSync(path.join(DIR, "narration_s1_layout.json"), "utf8"));
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const w = boot(file, false), d = w.document;
  const mmss = (t) => Math.floor(t / 60) + ":" + String(Math.floor(t + 1e-6) % 60).padStart(2, "0");
  check(tag + "g1 the player runs on the narration's length", w.__film.narrated === true && Math.abs(w.__film.dur - L.total) < 1e-6);
  check(tag + "g2 each scene holds its whole clip, back to back",
    L.scenes.length === 10 && L.scenes.every((s, i) => s.start < s.speech_start && s.speech_end < s.end
      && (i === 0 || Math.abs(s.start - L.scenes[i - 1].end) < 1e-6)) && Math.abs(L.scenes[9].end - L.total) < 1e-6);
  const tcs = Array.from(d.querySelectorAll(".chap .tc")).map((e) => e.textContent);
  check(tag + "g3 the scrubber and the chapters follow the narrated clock",
    Number(d.getElementById("pos").max) === L.total && tcs.length === 10 && tcs.every((t, i) => t === mmss(L.scenes[i].start)));
  const c = L.cues[Math.floor(L.cues.length / 2)];
  w.__film.seek((c.start + c.end) / 2);
  const cc = d.querySelector(".cc");
  check(tag + "g4 a caption shows the cue being spoken", !!cc && !cc.hidden && cc.textContent === c.text);
  check(tag + "g5 captions write MAP where the voice reads map",
    L.cues.some((q) => /\bMAP\b/.test(q.text)) && !L.cues.some((q) => /\bmap\b/.test(q.text)));
  const btn = d.getElementById("cc");
  if (btn) btn.click();
  check(tag + "g6 the captions control turns them off", !!btn && btn.textContent === "Show captions" && cc.hidden);
  if (btn) btn.click();
  const S2 = L.scenes[2], inv = Array.from(d.querySelectorAll("#fx .inv")), shown = () => inv.some((e) => e.style.visibility === "visible");
  w.__film.seek(S2.start + 0.8);
  const atSeam = shown();
  w.__film.seek((S2.speech_start + S2.speech_end) / 2);
  check(tag + "g7 a barrier plays at the seam, and none mid-scene", atSeam && !shown());
  w.__film.seek(L.total - 0.3);
  check(tag + "g8 the closing scene says the voice is synthetic",
    Array.from(d.querySelectorAll("#stage p")).some((e) => /synthetic voice/.test(e.textContent)));
  check(tag + "g9 the page plays the committed voice track", /"audio": ?"narration_s1\.mp3"/.test(raw) && fs.existsSync(path.join(DIR, "narration_s1.mp3")));
  const dl = d.getElementById("dl");
  check(tag + "g10 Download MP4 points at the narrated draft, which exists",
    !!dl && dl.getAttribute("href") === "20260926_CPL_Funding_in_Motion_Narrated_Draft.mp4" && fs.existsSync(path.join(DIR, dl.getAttribute("href"))));
  check(tag + "b1 " + file + " has no unfilled placeholder", !/__[A-Z0-9]+__/.test(raw));
  w.close();
}

let fail = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + n); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
