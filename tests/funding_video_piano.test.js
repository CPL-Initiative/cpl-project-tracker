// prototype/funding_video — the recorded piano (Sam, 2026-10-27: "too obviously electronic--like a childs
// play piano. Any way to get a realistic sound with rich chords?").
//
// ⭐ WHY. The score fetches its piano at play time, so a sample that is missing or misnamed fails silently:
// the nearest-sample lookup skips it and a register goes quiet. This file reads the sample set out of the
// source (never a copy) and checks that every file it names is in assets/piano/, that the page waits for
// the samples before it schedules or renders, that each note starts where its sound starts, that the set
// stays a size a page can fetch, and that the recording's license credit is carried.
//
// Run from repo root: `npm test` (or `node tests/funding_video_piano.test.js`).
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DIR = path.join("prototype", "funding_video");
const SRC = fs.readFileSync(path.join(DIR, "funding_in_motion.src.html"), "utf8");
const README = fs.readFileSync(path.join(DIR, "README.md"), "utf8");

// (1) the sample set, as the source builds it
const loop = /for\(var oc=1;oc<=(\d+);oc\+\+\)\[([^\]]+)\]\.forEach\(function\(n,i\)\{var m=12\*\(oc\+1\)\+3\*i;if\(m<=(\d+)\)PS\.push/.exec(SRC);
check("(1) the source builds its sample list in one loop this file can read", !!loop,
  "if the loop's shape changes, update this reader with it rather than copying the list here");
const names = [];
if (loop) {
  const notes = loop[2].split(",").map((x) => x.trim().replace(/'/g, ""));
  for (let oc = 1; oc <= +loop[1]; oc++) notes.forEach((n, i) => { if (12 * (oc + 1) + 3 * i <= +loop[3]) names.push(n + oc); });
}
check("(1) the set runs C1 to C8 every minor third, 29 samples", names.length === 29 && names[0] === "C1" && names[names.length - 1] === "C8");
const missing = names.filter((n) => !fs.existsSync(path.join(DIR, "assets", "piano", n + ".mp3")));
check("(1) ⭐ every sample the source names is in assets/piano/", missing.length === 0, "missing: " + missing.join(", "));
check("(1) the source fetches them from assets/piano/ by that name", SRC.includes("'assets/piano/'+s.f+'.mp3'"));

// (2) nothing plays or renders before the samples decode
check("(2) ⭐ offline() renders only once the piano has loaded", /offline:function\(\)\{return loadPiano\(\)\.then\(/.test(SRC),
  "without it the MP4's score is rendered with no piano at all");
check("(2) ⭐ the live scheduler waits for the piano", /schedule:function\(T\)\{if\(!ctx\|\|!bus\|\|!pready\)return;/.test(SRC),
  "without it the notes due while the samples load are consumed and never sound");
check("(2) the page starts loading the samples when it opens", /\nMusic\.load\(\);\nwindow\.__film=/.test(SRC));

// (3) a note starts where its sound starts, re-pitched by at most a semitone and a half
check("(3) ⭐ each sample's start is measured past its lead-in and the decoder's padding",
  /while\(i<d\.length&&Math\.abs\(d\[i\]\)<0\.002\)i\+\+;pbuf\[s\.m\]=\{b:b,o:i\/b\.sampleRate\}/.test(SRC) && /src\.start\(t,p\.o\)/.test(SRC),
  "an MP3 decoder pads its start by about 25 ms, which puts every piano note behind the drums");
check("(3) the nearest sample is chosen and re-pitched", /Math\.abs\(s\.m-m\)<Math\.abs\(best\.m-m\)/.test(SRC) && /rate=Math\.pow\(2,\(m-best\.m\)\/12\)/.test(SRC));

// (4) a size a page can fetch
const sizes = names.filter((n) => !missing.includes(n)).map((n) => fs.statSync(path.join(DIR, "assets", "piano", n + ".mp3")).size);
const total = sizes.reduce((a, b) => a + b, 0);
check("(4) each sample is at most 100 KB and the set at most 3 MB", sizes.every((b) => b <= 100 * 1024) && total <= 3 * 1024 * 1024,
  "measured " + Math.round(total / 1024) + " KB in all; the page fetches every one when it opens");

// (5) the license: CC BY 3.0 asks for the credit
check("(5) ⭐ the source and the README credit Alexander Holm's Salamander Grand Piano under CC BY 3.0",
  /Salamander Grand Piano/.test(SRC) && /Alexander Holm/.test(SRC) && /CC BY 3\.0/.test(SRC) &&
  /Salamander Grand Piano/.test(README) && /Alexander Holm/.test(README) && /CC BY 3\.0/.test(README));

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nfunding_video_piano.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
