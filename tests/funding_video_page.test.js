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
//   7. Each reveal is cued to the word that names it (Sam, 2026-09-27): the
//      clock passes through every anchor within 0.05 s, never runs backward and
//      never plays the picture faster than the introduction, and each anchor
//      is its word's onset in the words file heard from the committed track.
//      The 90-second introductions keep the film's own clock.
//
//   8. The conditions a college meets before any funding is released are its
//      minimum conditions (Sam's term, 2026-09-28): the retired word "baseline"
//      never returns to what the video shows or says. A re-versioned MP4 keeps
//      the explainer's download links pointing at files that exist.
//
//   9. Draft 4 (Sam's sheet 3, cards 16 and 17, 2026-09-29): the Timing voice
//      names the release dates before the two-year amount, whose line is cued
//      to its words, and the Targets voice says Sample College's Access target.
//
// Run from repo root: `npm test` (or `node tests/funding_video_page.test.js`).
const crypto = require("crypto");
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
// A re-version renames the MP4s (the original date code and a version suffix),
// so the explainer's two download links must follow or they break.
const explainerMp4 = Array.from(explainer.matchAll(/\.\.\/prototype\/funding_video\/([^"]+\.mp4)"/g)).map((m) => m[1]);
check("a5 the explainer's MP4 links (Scenario 1 and 2) point at files that exist",
  explainerMp4.length === 2 && explainerMp4.every((f) => fs.existsSync(path.join(DIR, f))));

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

[["funding_in_motion.html", "20260926_CPL_Funding_in_Motion_v2.mp4", ""],
 ["funding_in_motion_s2.html", "20260926_CPL_Funding_in_Motion_Scenario_2_v2.mp4", "s2 "]].forEach(([file, mp4, tag]) => {
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
  w.__film.seek(w.__film.nt(15.35));  // the first barrier's hit, 0.35 s into the film's third scene
  const atSeam = shown();
  w.__film.seek((S2.speech_start + S2.speech_end) / 2);
  check(tag + "g7 a barrier plays at the seam, and none mid-scene", atSeam && !shown());
  w.__film.seek(L.total - 0.3);
  check(tag + "g8 the closing scene says the voice is synthetic",
    Array.from(d.querySelectorAll("#stage p")).some((e) => /synthetic voice/.test(e.textContent)));
  check(tag + "g9 the page plays the committed voice track", /"audio": ?"narration_s1\.mp3"/.test(raw) && fs.existsSync(path.join(DIR, "narration_s1.mp3")));
  const dl = d.getElementById("dl");
  check(tag + "g10 Download MP4 points at the narrated draft, which exists",
    !!dl && dl.getAttribute("href") === "20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4" && fs.existsSync(path.join(DIR, dl.getAttribute("href"))));
  check(tag + "b1 " + file + " has no unfilled placeholder", !/__[A-Z0-9]+__/.test(raw));
  w.close();
}

{
  // 7. The cues: each reveal pinned to the word that names it.
  const tag = "n1 ", file = "funding_in_motion_n1.html";
  const L = JSON.parse(fs.readFileSync(path.join(DIR, "narration_s1_layout.json"), "utf8"));
  const H = JSON.parse(fs.readFileSync(path.join(DIR, "narration_s1_words.json"), "utf8"));
  const w = boot(file, false), { ft, nt } = w.__film;
  // each scene's film span, from the source's scene() calls, as cues.py reads them
  const spans = Array.from(src.matchAll(/=scene\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),/g)).map((m) => [Number(m[1]), Number(m[2])]);
  const anchors = L.scenes.flatMap((s, i) => (s.anchors || []).map((a) => Object.assign({ scene: i, film: spans[i][0] + a.at }, a)));
  const cues = narration.scenes.flatMap((s) => s.cues || []);
  check(tag + "h1 every cue is pinned, or says why it is skipped",
    anchors.length > 0 && anchors.length === cues.filter((c) => !c.skip).length && cues.every((c) => typeof c.why === "string"));
  const off = anchors.map((a) => Math.max(Math.abs(nt(a.film) - a.t), Math.abs(ft(a.t) - a.film)));
  check(tag + "h2 the clock passes through each anchor within 0.05 s (worst " + Math.max(...off).toExponential(1) + " s)",
    spans.length === 10 && off.every((x) => x < 0.05));
  const norm = (t) => t.replace(/\u2019/g, "'").replace(/^[^\w']+|[^\w']+$/g, "").toLowerCase();
  const onset = anchors.map((a) => {
    const ws = H.scenes[a.scene].words, ph = a.word.split(/\s+/).map(norm);
    const i = ws.findIndex((_, j) => ph.every((p, k) => ws[j + k] && norm(ws[j + k][0]) === p));
    return i < 0 ? NaN : ws[i][1];
  });
  check(tag + "h3 each anchor is its word's onset in the words file", anchors.every((a, i) => Math.abs(a.said - onset[i]) < 1e-9));
  check(tag + "h4 a reveal may lead its word, by 1.5 s at most, and never trails it",
    anchors.every((a) => a.t <= a.said + 1e-9 && a.said - a.t <= 1.5));
  let back = false, fastest = 0;
  for (let t = -0.5; t < L.total + 0.5; t += 0.01) {
    const step = ft(t + 0.01) - ft(t);
    if (step < 0) back = true;
    fastest = Math.max(fastest, step / 0.01);
  }
  check(tag + "h5 the clock never runs backward, nor faster than the introduction (fastest " + fastest.toFixed(3) + "x)",
    !back && fastest <= 1 + 1e-6);
  check(tag + "h6 each scene still begins at its layout start",
    L.scenes.every((s, i) => Math.abs(ft(s.start) - spans[i][0]) < 1e-9 && Math.abs(nt(spans[i][0]) - s.start) < 1e-9));
  const mp3 = crypto.createHash("sha256").update(fs.readFileSync(path.join(DIR, "narration_s1.mp3"))).digest("hex");
  check(tag + "h7 the words were heard from the committed voice track, with the model and the date",
    H.sha256 === mp3 && H.hearing.model === "small" && /^\d{4}-\d{2}-\d{2}$/.test(H.heard_on));
  // A barrier keeps its own pace (BAR) around its hit, while the arrow flies on
  // the picture's clock: the arrow must already sit under the invader when its
  // recoil begins, 0.27 barrier-seconds before the hit.
  const BAR = Number((/var BAR=NARR\?([\d.]+):1/.exec(src) || [])[1]);
  const hits = Array.from(src.matchAll(/\{t:([\d.]+),x:/g)).map((m) => Number(m[1]));
  check(tag + "h8 the arrow is under each barrier before it fires",
    BAR > 0 && hits.length === 5 && hits.every((e) => ft(nt(e) - 0.27 * BAR) >= e - 0.5 - 1e-9));
  w.close();
}

[["funding_in_motion.html", ""], ["funding_in_motion_s2.html", "s2 "]].forEach(([file, tag]) => {
  const w = boot(file, false), d = w.document, ts = [];
  for (let t = -1; t <= 91; t += 0.25) ts.push(t);
  check(tag + "i1 " + file + " keeps the film's own clock", ts.every((t) => w.__film.ft(t) === t && w.__film.nt(t) === t));
  check(tag + "i2 its chapters keep the 90-second times",
    Array.from(d.querySelectorAll(".chap .tc")).map((e) => e.textContent).join(" ") === "0:00 0:06 0:15 0:25 0:32 0:46 0:56 1:05 1:15 1:24");
  w.close();
});

{
  // 8. The retired word. Only text is read: CSS such as align-items:baseline
  // lives in style attributes and never reaches textContent.
  const RETIRED = /\bbaseline\b/i;
  const L = JSON.parse(fs.readFileSync(path.join(DIR, "narration_s1_layout.json"), "utf8"));
  const spoken8 = narration.scenes.map((s) => [s.scene, s.text].concat((s.cues || []).map((c) => c.word + " " + c.why)).join(" ")).join(" ");
  check("t1 the narration says minimum conditions, never baseline",
    !RETIRED.test(spoken8) && /meets three minimum conditions/.test(spoken8));
  check("t2 the captions and the narrated timeline's scene names never say baseline",
    !RETIRED.test(L.cues.map((c) => c.text).concat(L.scenes.map((s) => s.scene)).join(" ")));
  [["funding_in_motion.html", ""], ["funding_in_motion_s2.html", "s2 "], ["funding_in_motion_n1.html", "n1 "]].forEach(([file, tag]) => {
    const w = boot(file, false), d = w.document;
    // every scene's text, its chapter and what the page announces, second by second of the film
    let shown = d.title + " " + d.getElementById("chapters").textContent;
    for (let t = 0; t <= 90; t += 1) { w.__film.seek(w.__film.nt(t)); shown += " " + d.getElementById("stage").textContent; }
    check(tag + "t3 " + file + " shows minimum conditions, never baseline",
      !RETIRED.test(shown) && shown.includes("Meet the minimum conditions by November 1, 2026"));
    w.close();
  });
}

{
  // 9. Sam's sheet 3 rulings (2026-09-29), cards 16 and 17. Draft 3's Timing
  // voice opened with the two-year amount, which the picture shows after the
  // release dates, so its line trailed its words by 7.6 s; the voice now names
  // the dates first. And the Targets voice says Sample College's Access target,
  // the figure its card shows, in the card's own words.
  const scene = (name) => narration.scenes.find((s) => s.scene === name) || {};
  const timing = scene("Timing"), targets = scene("Targets");
  const at = (s, w) => (s.text || "").indexOf(w);
  check("j1 the Timing voice names the release dates, then the two-year amount, then what remains (card 16)",
    at(timing, "releases funding") >= 0 && at(timing, "releases funding") < at(timing, "The full two-year amount")
      && at(timing, "The full two-year amount") < at(timing, "whatever remains after year one"));
  check("j2 the two-year line is cued to its words, not skipped",
    (timing.cues || []).some((c) => c.word === "The full two-year amount" && !c.skip));
  const SAMPLE = "Sample College's Access target, for example, is about forty-four FTES, behind about a hundred twelve thousand dollars.";
  check("j3 the Targets voice says Sample College's Access target right after the quarter-system line (card 17)",
    at(targets, "quarter system. " + SAMPLE) >= 0);
  check("j4 its card is cued to those words",
    (targets.cues || []).some((c) => c.word === "Sample College's Access target" && !c.skip));
}

let fail = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + n); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
