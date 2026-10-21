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
//      The introductions keep the film's own clock.
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
//  10. The Scenario 2 narrated draft (sheet 4 card 8, 2026-09-30): n2 runs every
//      narrated check n1 runs, on narration_s2.*; its voice names two funded
//      priorities and the Chancellor's Office reporting career attainment with
//      the innovation projects; and the explainer's Scenario 2 view links it
//      (Sam, 2026-10-02: "Narration sounds good to start with").
//
//  11. Its second draft (Sam, 2026-10-02: "write a script for the scenario 2
//      video for an ElevenLabs narrator. Keep it very simple and focused... give
//      her the name Sierra on the video as a sample"; "The music can drop to
//      background level"): a short script over the introduction's own picture,
//      targets slide included, read by Sierra in ElevenLabs. Each clip was read
//      from its scene's current text; a scene still waiting on its read says
//      why and plays its picture at the film's pace; the film names her where
//      she says her name and says, at the close, that she is a synthetic voice.
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

check("a1 the explainer's link says introduction, not guide, and the film's true length",
  /id="video-link"[^>]*>Watch the 100-second introduction</.test(explainer));
// Since 2026-10-20 (S439) the link is the published film alone, so no
// per-scenario label rewrites it.
check("a2 the link opens the published film and no per-scenario label renames it",
  /id="video-link" href="\.\.\/prototype\/funding_video\/funding_in_motion_s2\.html"/.test(explainer) && !/label: "Watch/.test(explainer));
// Sam, 2026-10-09 (a marked-up screenshot of the explainer): the Contents keeps
// the introduction alone; the MP4 download and the narrated cut left it. The
// files stay where the narrated checks below read them.
check("a3 the explainer offers the introduction alone: no MP4 download, no narrated cut",
  !/id="video-mp4"/.test(explainer) && !/id="video-narrated"/.test(explainer) && !/\.mp4"/.test(explainer));
check("a4 the source never calls itself a guide for colleges", !/guide for colleges|Play the guide/i.test(src));
// a5 (the MP4 links point at files that exist) retired with the links, 2026-10-09.

// a6 and a7 (the explainer links each scenario's narrated cut) retired with the
// link, 2026-10-09; the cuts themselves stay checked below.

const readScript = (s) => JSON.parse(fs.readFileSync(path.join(DIR, "narration_" + s + ".json"), "utf8"));
// Each scene's film span, from the source's scene() calls, as film_spans.py reads them: a
// narration that voices the targets slide plays it at 46 s for D seconds, and every later scene D later.
function spansFor(L) {
  let spans = Array.from(src.matchAll(/=scene\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),/g)).map((m) => [Number(m[1]), Number(m[2])]);
  if (L.scenes.some((x) => x.scene === "How a target is set")) {
    const D = Number(/D=HOW\?([\d.]+):0/.exec(src)[1]), k = spans.findIndex((x) => x[0] >= 46);
    spans = spans.slice(0, k).concat([[46, 46 + D]], spans.slice(k).map((x) => [x[0] + D, x[1] + D]));
  }
  return spans;
}
const narration = readScript("s1");
// The narrated cuts: n1 is Scenario 1's (draft 4, Kokoro), n2 Scenario 2's (draft 3, Sierra).
const NARRATED = [
  { tag: "n1 ", v: "n1", s: "s1", mp4: "20260926_CPL_Funding_in_Motion_Narrated_Draft_4.mp4" },
  { tag: "n2 ", v: "n2", s: "s2", mp4: "20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_6.mp4" },
];
const sha1 = (t) => crypto.createHash("sha1").update(t, "utf8").digest("hex");
NARRATED.forEach(({ s }) => {
  const script = readScript(s), spoken = script.scenes.map((x) => x.text).join(" "), tag = s + " ";
  check(tag + "n1 acronyms are written unspaced, so each reads as one quick word", !/\b[A-Z] [A-Z]\b/.test(spoken) && /\bCPL\b/.test(spoken));
  check(tag + "n2 MAP is written 'map', so it is said as the word", !/\bMAP\b/.test(spoken) && /\bmap\b/.test(spoken));
  check(tag + "n3 no digits: a year in digits reads as 'two thousand'", !/\d/.test(spoken));
  if (!script.engine) {
    // Kokoro reads phonemes this repo controls
    check(tag + "n4 FTES carries the letters fix (unspaced it reads 'eftess')",
      (script.phoneme_fixes || []).some((f) => f.find === "ˈɛftˈɛs" && f.use === "ˌɛftˌiːˌiːˈɛs"));
    check(tag + "n5 the stilted v2 readings stay banned",
      ["sˈiː pˈiː ˈɛl", "twˈɛnti twˈɛnti", "ˌɛmˌeɪpˈiː"].every((b) => (script.never || []).some((n) => n.phonemes === b)));
  } else {
    // ElevenLabs reads outside the repo: each committed clip must have been read from its scene's current text
    // (its `say`, the spoken form, where the captions' written form differs: C.P.L. for CPL)
    const eng = script.engine, voiced = script.scenes.filter((x) => !x.pending);
    check(tag + "n4 every voiced scene's clip is committed and was read from the scene's current text",
      voiced.length > 0 && voiced.every((x) => x.read && x.read.text_sha1 === sha1(x.say || x.text) && fs.existsSync(path.join(DIR, eng.clips, x.read.clip))));
    check(tag + "n5 a scene still waiting on its read says why, and carries no clip",
      script.scenes.filter((x) => x.pending).every((x) => x.pending.length > 40 && !x.read));
  }
});

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

[["funding_in_motion.html", "20260926_CPL_Funding_in_Motion_v4.mp4", ""],
 ["funding_in_motion_s2.html", "20260926_CPL_Funding_in_Motion_Scenario_2_v9.mp4", "s2 "]].forEach(([file, mp4, tag]) => {
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
  // The targets slide (2026-10-01) plays at 46 s for 9.6 s; the Targets scene follows it.
  const SHIFT = w.__film.dur - 90;
  check(tag + "e0 the introduction runs 99.6 s: the 90-second film and the 9.6-second targets slide", Math.abs(w.__film.dur - 99.6) < 1e-9);
  w.__film.seek(51.8 + SHIFT);
  check(tag + "e1 the half-target hold shows the engine's half figure (" + cfg.target.halfFtesWords + ")", ftesShown() === cfg.target.halfFtesWords + " FTES");
  w.__film.seek(55.5 + SHIFT);
  check(tag + "e2 the full target shows the engine's figure (" + cfg.target.ftesWords + ")", ftesShown() === cfg.target.ftesWords + " FTES");
  const wr = boot(file, true);
  wr.__film.seek(15.1);
  check(tag + "d4 reduced motion: no barriers", Array.from(wr.document.querySelectorAll("#fx .inv")).every((e) => e.style.visibility !== "visible"));
  w.close(); wr.close();
});

NARRATED.forEach(({ tag, v, s, mp4 }) => {
  const file = "funding_in_motion_" + v + ".html";
  const L = JSON.parse(fs.readFileSync(path.join(DIR, "narration_" + s + "_layout.json"), "utf8"));
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const w = boot(file, false), d = w.document;
  const mmss = (t) => Math.floor(t / 60) + ":" + String(Math.floor(t + 1e-6) % 60).padStart(2, "0");
  check(tag + "g1 the player runs on the narration's length", w.__film.narrated === true && Math.abs(w.__film.dur - L.total) < 1e-6);
  const N = L.scenes.length;
  check(tag + "g2 each scene holds its whole clip, back to back (a scene waiting on its read holds none)",
    N === spansFor(L).length && L.scenes.every((s, i) => s.start < s.speech_start && s.speech_end < s.end
      && (s.pending ? s.speech_end === s.speech_start : s.speech_start < s.speech_end)
      && (i === 0 || Math.abs(s.start - L.scenes[i - 1].end) < 1e-6)) && Math.abs(L.scenes[N - 1].end - L.total) < 1e-6);
  const tcs = Array.from(d.querySelectorAll(".chap .tc")).map((e) => e.textContent);
  check(tag + "g3 the scrubber and the chapters follow the narrated clock",
    Number(d.getElementById("pos").max) === L.total && tcs.length === N && tcs.every((t, i) => t === mmss(L.scenes[i].start)));
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
  check(tag + "g9 the page plays the committed voice track",
    new RegExp('"audio": ?"narration_' + s + '\\.mp3"').test(raw) && fs.existsSync(path.join(DIR, "narration_" + s + ".mp3")));
  const dl = d.getElementById("dl");
  check(tag + "g10 Download MP4 points at the narrated draft, which exists",
    !!dl && dl.getAttribute("href") === mp4 && fs.existsSync(path.join(DIR, dl.getAttribute("href"))));
  check(tag + "b1 " + file + " has no unfilled placeholder", !/__[A-Z0-9]+__/.test(raw));
  w.close();
});

NARRATED.forEach(({ tag, v, s }) => {
  // 7. The cues: each reveal pinned to the word that names it.
  const file = "funding_in_motion_" + v + ".html", narration = readScript(s);
  const L = JSON.parse(fs.readFileSync(path.join(DIR, "narration_" + s + "_layout.json"), "utf8"));
  const H = JSON.parse(fs.readFileSync(path.join(DIR, "narration_" + s + "_words.json"), "utf8"));
  const w = boot(file, false), { ft, nt } = w.__film;
  // each scene's film span, as cues.py reads them (film_spans.py)
  const spans = spansFor(L);
  const anchors = L.scenes.flatMap((s, i) => (s.anchors || []).map((a) => Object.assign({ scene: i, film: spans[i][0] + a.at }, a)));
  // a scene waiting on its read has no words, so none of its cues can be pinned
  const cues = narration.scenes.filter((s) => !s.pending).flatMap((s) => s.cues || []);
  check(tag + "h1 every cue is pinned, or says why it is skipped",
    anchors.length > 0 && anchors.length === cues.filter((c) => !c.skip).length
      && narration.scenes.flatMap((s) => s.cues || []).every((c) => typeof c.why === "string"));
  const off = anchors.map((a) => Math.max(Math.abs(nt(a.film) - a.t), Math.abs(ft(a.t) - a.film)));
  check(tag + "h2 the clock passes through each anchor within 0.05 s (worst " + Math.max(...off).toExponential(1) + " s)",
    spans.length === L.scenes.length && off.every((x) => x < 0.05));
  const norm = (t) => t.replace(/\u2019/g, "'").replace(/^[^\w']+|[^\w']+$/g, "").replace(/\./g, "").toLowerCase();
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
  const mp3 = crypto.createHash("sha256").update(fs.readFileSync(path.join(DIR, "narration_" + s + ".mp3"))).digest("hex");
  check(tag + "h7 the words were heard from the committed voice track, with the model and the date",
    H.sha256 === mp3 && H.hearing.model === "small" && /^\d{4}-\d{2}-\d{2}$/.test(H.heard_on));
  // A barrier keeps its own pace (BAR) around its hit, while the arrow flies on
  // the picture's clock: the arrow must already sit under the invader when its
  // recoil begins, 0.27 barrier-seconds before the hit.
  const BAR = Number((/var BAR=NARR\?([\d.]+):1/.exec(src) || [])[1]);
  // a barrier after the targets slide is written LS(t), which is t in a narrated draft
  const hits = Array.from(src.matchAll(/\{t:(?:LS\()?([\d.]+)\)?,x:/g)).map((m) => Number(m[1]));
  check(tag + "h8 the arrow is under each barrier before it fires",
    BAR > 0 && hits.length === 5 && hits.every((e) => ft(nt(e) - 0.27 * BAR) >= e - 0.5 - 1e-9));
  w.close();
});

[["funding_in_motion.html", ""], ["funding_in_motion_s2.html", "s2 "]].forEach(([file, tag]) => {
  const w = boot(file, false), d = w.document, ts = [];
  for (let t = -1; t <= 101; t += 0.25) ts.push(t);
  check(tag + "i1 " + file + " keeps the film's own clock", ts.every((t) => w.__film.ft(t) === t && w.__film.nt(t) === t));
  check(tag + "i2 its chapters: the 90-second times, the targets slide at 0:46, and the rest 9.6 s later",
    Array.from(d.querySelectorAll(".chap .tc")).map((e) => e.textContent).join(" ") === "0:00 0:06 0:15 0:25 0:32 0:46 0:55 1:05 1:14 1:24 1:33");
  w.close();
});

{
  // 8. The retired word. Only text is read: CSS such as align-items:baseline
  // lives in style attributes and never reaches textContent.
  const RETIRED = /\bbaseline\b/i;
  NARRATED.forEach(({ s }) => {
    const L = JSON.parse(fs.readFileSync(path.join(DIR, "narration_" + s + "_layout.json"), "utf8"));
    const spoken8 = readScript(s).scenes.map((x) => [x.scene, x.text].concat((x.cues || []).map((c) => c.word + " " + c.why)).join(" ")).join(" ");
    check(s + " t1 the narration says minimum conditions, never baseline",
      !RETIRED.test(spoken8) && /meets three minimum conditions|needs to meet three conditions/.test(spoken8));
    check(s + " t2 the captions and the narrated timeline's scene names never say baseline",
      !RETIRED.test(L.cues.map((c) => c.text).concat(L.scenes.map((x) => x.scene)).join(" ")));
  });
  // Each introduction dates its minimum conditions from its scenario's
  // participationDeadline (Scenario 1: 2026-12-01); the narrated drafts keep
  // the date their voice reads.
  [["funding_in_motion.html", "", "December 1, 2026"], ["funding_in_motion_s2.html", "s2 ", "December 30, 2026"],
   ["funding_in_motion_n1.html", "n1 ", "November 1, 2026"], ["funding_in_motion_n2.html", "n2 ", "December 30, 2026"]].forEach(([file, tag, by]) => {
    const w = boot(file, false), d = w.document;
    // every scene's text, its chapter and what the page announces, second by second of the film
    let shown = d.title + " " + d.getElementById("chapters").textContent;
    for (let t = 0; t <= 100; t += 1) { w.__film.seek(w.__film.nt(Math.min(t, 99.6))); shown += " " + d.getElementById("stage").textContent; }
    // the narrated cut's own scenes too, by the narrated clock (n2 carries the targets slide)
    if (w.__film.narrated) for (let t = 0; t <= w.__film.dur; t += 1) { w.__film.seek(t); shown += " " + d.getElementById("stage").textContent; }
    check(tag + "t3 " + file + " shows minimum conditions, never baseline",
      !RETIRED.test(shown) && shown.includes("Meet the minimum conditions by " + by));
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

{
  // 10 and 11. The Scenario 2 narrated draft. Sam, 2026-09-29: "We're going with
  // Scenario 2" (college funding follows P1 and P2), and "I will be reporting on
  // P3 Career Attainment together with P4 projects using more qualitative data
  // rather than tying it to FTES." Draft 2 (2026-10-02): "Keep it very simple
  // and focused", over the introduction's own picture, read by Sierra.
  const s2 = readScript("s2");
  const byName = (sc, n) => (sc.scenes.find((x) => x.scene === n) || {}).text || "";
  const prio = byName(s2, "Two priorities"), targets = byName(s2, "Targets");
  // Sam's edited script (2026-10-21): his words for the two priorities and the
  // reported outcomes, and the published Scenario 3's average Access target.
  check("k1 two funded priorities, and career attainment reported with the infrastructure and innovation projects",
    /^Funding is based on two priority outcomes/.test(prio) && /access priority counts/.test(prio) && /completion priority counts/.test(prio)
      && /Chancellor's Office will report on career attainment together with the infrastructure and innovation projects/.test(prio)
      && !/EDD|wage records/.test(prio));
  check("k2 the Targets voice says the average Access target the picture shows (31.3 FTES, said as about thirty-one)",
    targets.includes("For the average allocation, the Access target is about thirty-one FTES."));
  const L2 = JSON.parse(fs.readFileSync(path.join(DIR, "narration_s2_layout.json"), "utf8"));
  const words = s2.scenes.reduce((n, x) => n + x.text.split(/\s+/).length, 0);
  check("k3 a short script (" + words + " words, under 360) voicing each of the picture's eleven scenes, the targets slide included, in its order",
    words < 360 && s2.scenes.length === 11 && L2.scenes.map((x) => x.scene).join("|") === s2.scenes.map((x) => x.scene).join("|")
      && s2.scenes[5].scene === "How a target is set" && /^Greetings CPL heroes!/.test(s2.scenes[0].text));
  check("k4 every scene is read (the plan moved to paid, 2026-10-02)",
    s2.scenes.every((x) => !x.pending && x.read));
  const cfgOf2 = (file) => JSON.parse(/CFG=(\{[\s\S]*?\}),EXPLAINER=/.exec(fs.readFileSync(path.join(DIR, file), "utf8"))[1]);
  const cfg = cfgOf2("funding_in_motion_n2.html"), intro = cfgOf2("funding_in_motion_s2.html");
  // Re-voiced from the published scenario's figures (S443, 2026-10-21, Sam's
  // edited script): the narrated cut's picture reads the model, as the
  // introduction does, so the two share every figure the voice names.
  const PICTURE = ["split", "timing", "deadline", "close", "explainer", "kick", "titleText", "how", "target"];
  check("k5 the n2 picture shares the introduction's figures, dates, closing and address",
    PICTURE.every((k) => JSON.stringify(cfg[k]) === JSON.stringify(intro[k])) && cfg.how && cfg.target.ftesWords === intro.target.ftesWords);
  // Sierra by name, on the video (Sam, 2026-10-02): beneath the lockup as she says it, and in the closing credit
  const w = boot("funding_in_motion_n2.html", false), d = w.document;
  const said = L2.scenes[0].anchors.find((a) => a.word === "Greetings CPL heroes");
  // the name line's opacity at a moment of the narrated clock (-1 when the page has no name line)
  const nameAt = (t) => { w.__film.seek(t); const e = Array.from(d.querySelectorAll("#stage p")).find((x) => x.textContent === "Narrated by Sierra"); return e ? Number(e.style.opacity) : -1; };
  const early = nameAt(0.2), later = nameAt(said.said + 0.8);
  check("k6 the title scene names her, Narrated by Sierra, appearing as she greets the viewer",
    early === 0 && later > 0.9 && said.t <= said.said);
  w.__film.seek(L2.total - 0.3);
  check("k7 the closing credit says Sierra is a synthetic voice made with ElevenLabs",
    Array.from(d.querySelectorAll("#stage p")).some((e) => e.textContent === "Sierra is a synthetic voice made with ElevenLabs."));
  // a scene waiting on its read plays its picture at the film's own pace, and the score does not dip for a voice that is not there
  const pend = L2.scenes.map((x, i) => [x, i]).filter(([x]) => x.pending), spans2 = spansFor(L2);
  check("k8 a scene waiting on its read plays at the film's pace (" + pend.map(([x]) => x.scene).join(", ") + ")",
    pend.every(([x, i]) => Math.abs((x.end - x.start) - (spans2[i][1] - spans2[i][0])) < 1e-6 && !(x.anchors || []).length)
      && /function duck\(t\)\{var d=1;NARR\.scenes\.forEach\(function\(n\)\{if\(!\(n\.speech_end>n\.speech_start\)\)return;/.test(src));
  w.close();
}

{
  // 10. The 2026-10-01 round (Sam, the S312 evening asks): the introductions
  // gain a slide on how a target is set, the statewide funding under each
  // priority, the Targets kick led by the priority, dates from the config, and
  // a plain closing label; neither film nor page names the published scenario.
  // The narrated drafts keep the frames their voice was laid out on.
  const cfgOf = (file) => JSON.parse(/CFG=(\{[\s\S]*?\}),EXPLAINER=/.exec(fs.readFileSync(path.join(DIR, file), "utf8"))[1]);
  const stageAt = (w, t) => { w.__film.seek(t); return w.document.getElementById("stage").textContent.replace(/\s+/g, " "); };
  [["funding_in_motion.html", "", "Access", "$8,329,302", "2,948.6", "Dec 2026"],
   ["funding_in_motion_s2.html", "s2 ", "Access", "$12,620,154", "4,268.6", "Dec 2026"]].forEach(([file, tag, first, funding, target, conf]) => {
    const raw = fs.readFileSync(path.join(DIR, file), "utf8"), cfg = cfgOf(file), w = boot(file, false);
    const how = stageAt(w, 54.5);
    check(tag + "m1 the targets slide divides the statewide funding by the FTES reimbursement rate, and never says price (Sam, 2026-10-02)",
      how.includes("How a target is set") && how.includes(funding) && how.includes("$2,824.82") && how.includes("FTES reimbursement rate")
        && how.includes("the $5,649.63 base rate times a factor of 0.5") && how.includes(target) && !/\bpric(e|ed|es|ing)\b/i.test(how));
    // Sheet 19 card 2 ("sum"): where the published target is the institutions'
    // targets added up, the slide takes the maximum award's difference off the
    // division, and the arithmetic it shows holds to the printed tenth.
    const sum = cfg.how.rows[0][3] != null;
    check(tag + "m1b " + (sum ? "the slide subtracts the maximum award's difference and names the target the institutions' sum"
                               : "the slide prints the division as the target"),
      sum ? how.includes((cfg.how.rows[0][2] - cfg.how.rows[0][3]).toFixed(1)) && how.includes("the maximum award lowers seven institutions’ targets")
              && how.includes("the institutions’ targets added up") && !how.includes("4,467.6")
              && cfg.how.rows.every((r) => Math.round(r[2] * 10) - Math.round((r[2] - r[3]) * 10) === Math.round(r[3] * 10))
          : !/maximum award/.test(how));
    check(tag + "m2 its figures are the engine's: target = funding / (rate x factor), to the printed tenth",
      cfg.how.rows.every((r) => Math.abs(r[1] / (cfg.how.rate * cfg.how.factor) - r[2]) < 0.05)
        && Math.round(cfg.how.rate * cfg.how.factor * 100) === Math.round(cfg.how.price * 100));
    const prios = stageAt(w, 45.5);
    check(tag + "m3 the statewide funding sits under each priority", cfg.prios.every((p) => prios.includes("$" + p[3].toLocaleString("en-US"))) && /statewide/i.test(prios));
    check(tag + "m4 Access counts every applied unit (no origin clause in the film or its text)",
      !/start at the CPL Portal|landing page, or a batch upload/i.test(raw) && prios.includes("Applied CPL units, from every CPL request."));
    check(tag + "m5 the Targets kick leads with the priority", stageAt(w, 50 + 9.6).includes("Priority 1 · Access · average allocation · target"));
    const timing = stageAt(w, 72 + 9.6);
    check(tag + "m6 the Timing nodes come from the config: Oct 2026 for the procedure and memo, " + conf + " for confirmation",
      timing.includes("Oct 2026") && timing.includes("Procedure and guidance memo") && timing.includes(conf) && !/Sep 2026|Model released/.test(timing));
    const close = stageAt(w, 98);
    const a = w.document.querySelector("#stage a");
    check(tag + "m7 the closing scene: the CPL funding page, a plain label linked to the real address",
      close.includes("Find your college on the CPL funding page") && a && a.textContent === "How CPL Funding Works" && a.getAttribute("href") === cfg.explainer);
    check(tag + "m8 no github.io address and no scenario name in the film or the page chrome",
      !/github\.io/.test(Array.from({ length: 100 }, (_, t) => stageAt(w, t)).join(" "))
        && !/Scenario 2/.test(w.document.querySelector("header").textContent + " " + w.document.title + " " + a.textContent));
    check(tag + "m9 the page says what the film is: a 100-second introduction to CPL funding",
      /^A 100-second introduction to CPL funding for colleges, with music\./.test(w.document.querySelector(".dek").textContent)
        && w.document.querySelector("main a").textContent === "How CPL funding works");
    w.close();
  });
  // The clock's shift is LS, never L: buildK declares its own `var L` (the
  // closing loop's box), and a reference to L anywhere else either shadows or
  // misses (2026-10-01: a blank film, then a silent score, `.map(L)`). jsdom
  // never runs buildK's measured path or the offline score, so read the source.
  {
    const bk = src.slice(src.indexOf("function buildK(){"), src.indexOf("function arrowAt("));
    const rest = src.replace(bk, "");
    // the two shapes that broke: a call, L(…), and L passed as a value, map(L)
    const code = rest.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    check("m0 nothing outside buildK calls L or passes it as a function (the slide's shift is LS)",
      !/[^\w.$]L\s*\(/.test(code) && !/[(,]\s*L\s*[),]/.test(code) && /function LS\(t\)/.test(src));
  }
  check("m10 Scenario 2 is the published scenario, so its introduction links the bare address; Scenario 1's names its own",
    cfgOf("funding_in_motion_s2.html").explainer === "https://cpl-initiative.github.io/cpl-project-tracker/funding-model/"
      && cfgOf("funding_in_motion.html").explainer.endsWith("?scenario=Scenario%201"));
  [["funding_in_motion_n1.html", "n1 "]].forEach(([file, tag]) => {
    const cfg = cfgOf(file), w = boot(file, false);
    check(tag + "m11 the narrated draft keeps its voiced frames: no slide, the voiced box, dates and closing",
      cfg.how === null && w.__film.dur === cfg.narr.total && cfg.prios.every((p) => p.length === 3)
        && /start at the CPL Portal/.test(cfg.prios[0][2]) && cfg.timing[0][1] === "Sep 2026"
        && cfg.close.head.includes("funding model page") && /^Read the full explainer: /.test(cfg.close.label)
        && cfg.ex.kickLead === "Sample College · Access");
    w.close();
  });
}

{
  // 12. Sam, 2026-10-21, on Draft 5: "There is one spot that has a bit of a
  // white screen lag and another that has the pointer moving slowly... Would be
  // nice to use those moments for the pointer to shoot down some more
  // barriers:) Can you add a gold star to the vet sprint qualifying condition
  // and highlight that 63 colleges already meet this condition, which was also
  // a commitment for the previous $50k funding?"
  const cfgOf = (file) => JSON.parse(/CFG=(\{[\s\S]*?\}),EXPLAINER=/.exec(fs.readFileSync(path.join(DIR, file), "utf8"))[1]);
  const BAR = Number((/var BAR=NARR\?([\d.]+):1/.exec(src) || [])[1]);
  const cfg = cfgOf("funding_in_motion_n2.html"), L = cfg.narr, V = cfg.volleys || [];
  check("v1 n2 carries two volleys, Targets and Minimum conditions, seven barriers in all, each captioned",
    V.length === 2 && V.map((v) => v.scene).join() === "Targets,Minimum conditions" &&
    V.reduce((n, v) => n + v.hits.length, 0) === 7 && V.every((v) => v.hits.every((h) => h.label.length > 8)));
  const w = boot("funding_in_motion_n2.html", false), d = w.document, { ft } = w.__film;
  const inv = Array.from(d.querySelectorAll("#fx .inv"));
  check("v2 the page draws them: five seam barriers and seven in the volleys", inv.length === 12);
  // each window is where the narration outran the picture: the film moves less than a third of real time
  check("v3 each volley fills a window where the picture is held (film advances under a third of narration time)",
    V.every((v) => v.to - v.from > 4 && (ft(v.to) - ft(v.from)) / (v.to - v.from) < 0.34 &&
      L.scenes.some((s) => s.scene === v.scene && Math.abs(s.start - v.from) < 1e-9)));
  check("v4 every volley barrier drops in after its window opens and is gone before the word that closes it",
    V.every((v) => v.hits.every((h, i) => h.t - 0.95 * BAR > v.from - 0.3 && h.t + 0.8 * BAR < v.to + 0.7 &&
      (i === 0 || h.t - v.hits[i - 1].t >= 1.2))));
  const visibleAt = (win, t) => { win.__film.seek(t); return Array.from(win.document.querySelectorAll("#fx .inv")).filter((e) => e.style.visibility === "visible").length; };
  check("v5 a barrier shows at each volley hit", V.every((v) => v.hits.every((h) => visibleAt(w, h.t) >= 1)));
  // jsdom lays nothing out, so the flight is read from the source: the arrow reaches each barrier
  // before its recoil begins (0.27 barrier-seconds before the hit) and stays until after the burst
  const arrive = Number((/P\(h\.t-([\d.]+),h\.x,ty,0\),P\(h\.t\+([\d.]+),h\.x,ty,0\)/.exec(src) || [])[1]);
  check("v6 inside a volley the arrow flies on the narration's clock and sits under each barrier before it fires",
    arrive >= 0.27 * BAR && /vw=volAt\(t\),a=vw\?arrowAt\(t,vw\.K\):arrowAt\(T\)/.test(src) && /K=k2;buildVol\(\)/.test(src));
  const wr = boot("funding_in_motion_n2.html", true);
  check("v7 reduced motion: no volley barriers either", V.every((v) => v.hits.every((h) => visibleAt(wr, h.t) === 0)));
  check("v8 the introductions carry no volleys", ["funding_in_motion.html", "funding_in_motion_s2.html"].every((f) => !cfgOf(f).volleys));
  w.close(); wr.close();
  // The Veteran Star and the count, in s2 and n2; the count is the model's (figures.json `vet`)
  const FIG = JSON.parse(fs.readFileSync(path.join(DIR, "figures.json"), "utf8"));
  const vet = FIG.scenarios[FIG.published].vet;
  check("v9 figures.json files the colleges meeting the veterans' condition, from the performance feed",
    vet && Number.isInteger(vet.met) && vet.met > 0 && vet.met <= vet.of && vet.threshold === 0.75 && /^\d{4}-\d{2}-\d{2}$/.test(vet.asOf));
  [["funding_in_motion_s2.html", "s2 ", 65.6 + 7.5], ["funding_in_motion_n2.html", "n2 ", null]].forEach(([file, tag, t]) => {
    const c = cfgOf(file), ww = boot(file, false), dd = ww.document;
    const sc = c.narr ? c.narr.scenes.find((s) => s.scene === "Minimum conditions") : null;
    ww.__film.seek(t != null ? t : sc.end - 1);
    const star = dd.querySelector("#stage .vstar"), line = dd.querySelector("#stage .vetline");
    const want = vet.met + " colleges already meet this condition, a commitment they also made for the 2025–26 $50,000 funding.";
    check(tag + "v10 the veterans' condition carries the Veteran Star, gold, beside it",
      !!star && star.textContent === "★" && star.getAttribute("aria-label") === "Veteran Star" &&
      /\.vstar\{[^}]*color:var\(--stage-gold\)/.test(src) && star.parentNode.textContent.includes("Joint Services Transcripts"));
    check(tag + "v11 and the line beneath it says how many colleges meet it (" + vet.met + "), and the 2025–26 commitment",
      !!line && line.textContent === want && c.vet.met === vet.met && Number(line.style.opacity) > 0.99);
    ww.close();
  });
  const w1 = boot("funding_in_motion.html", false);
  w1.__film.seek(72);
  check("v12 Scenario 1's introduction is unchanged: no star, no count", !w1.document.querySelector("#stage .vstar") && !cfgOf("funding_in_motion.html").vet);
  w1.close();
  check("v13 the new marks use the page's tokens, no raw color", ![".vstar{", ".vetline{"].some((sel) => {
    const i = src.indexOf(sel); return i < 0 || /#[0-9A-Fa-f]{3,6}\b/.test(src.slice(i, src.indexOf("}", i))); }));
}

let fail = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + n); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
