// tests/noncredit_video_page.test.js
//
// The Noncredit Summit film (prototype/noncredit_video/), a music cut and a
// narrated cut built from one source (Sam, 2026-10-05: "do one version with just
// music and another with voice over from our ElevenLabs narrator"). Guards what a
// later edit could quietly undo:
//
//   1. The built pages match the source: no unfilled placeholder, ten scenes,
//      100 seconds in the music cut.
//   2. Every figure on screen is the summit deck's (CPLBrain
//      20261005_Noncredit_Summit_CPL_Slides_2.md), and the 34% says who it
//      measures, as the deck's .md says to say it.
//   3. A step a college plans to document says so in words, beside its dashed
//      outline (color is never the only signal), each learner carries the words
//      "Illustrative learner and photo", and no path says a college is building
//      it (Sam, 2026-10-06: soften Mt. SAC to "plans to"; drop the NOCE claim).
//   4. The funding scene keeps the funding vocabulary (CLAUDE.md): never money,
//      pool, earn or draw for an institution.
//   5. Five barriers, four words or fewer, each at the top of the scene that
//      answers it, and none under reduced motion.
//   6. The narrated cut runs on the narration's clock: every clip was read from
//      its scene's current text, captions write MAP, the narrator goes
//      unnamed, the close says the voice is synthetic, and every reveal is
//      pinned to the word that names it, never trailing it.
//
// Run from repo root: `npm test` (or `node tests/noncredit_video_page.test.js`).
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const DIR = "prototype/noncredit_video";
const src = fs.readFileSync(path.join(DIR, "noncredit_in_motion.src.html"), "utf8");

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
const cfgOf = (raw) => JSON.parse(/CFG=(\{[\s\S]*?\});\n/.exec(raw)[1]);
// each scene's film span, as narrate_spans.py reads them
const spans = Array.from(src.matchAll(/(?:=scene|person)\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),/g)).map((m) => [Number(m[1]), Number(m[2])]);
check("a1 ten scenes, back to back, from 0 to 100 s",
  spans.length === 10 && spans[0][0] === 0 && spans[9][1] === 100 && spans.every((s, i) => i === 0 || s[0] === spans[i - 1][1]));

const CUTS = [
  { tag: "", file: "noncredit_in_motion.html", other: "noncredit_in_motion_narrated.html" },
  { tag: "narrated ", file: "noncredit_in_motion_narrated.html", other: "noncredit_in_motion.html" },
];
CUTS.forEach(({ tag, file, other }) => {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8"), cfg = cfgOf(raw);
  check(tag + "b1 " + file + " has no unfilled placeholder", !/__[A-Z0-9]+__/.test(raw));
  check(tag + "b2 " + file + " carries the current source", raw.includes("var ENC=") && raw.includes("function person(") && raw.includes("Play the film"));
  const w = boot(file, false), d = w.document;
  // From v2 the MP4s are deliverables filed to the team Drive, never committed (Sam, 2026-10-05), so the page
  // offers no Download button that would point at a file the repo does not hold.
  check(tag + "b3 no Download button, and this cut's MP4 is not committed", !d.getElementById("dl") && !raw.includes("Download MP4")
    && /_v\d+\.mp4$/.test(cfg.mp4) && !fs.existsSync(path.join(DIR, cfg.mp4)));
  const oc = d.getElementById("other-cut");
  check(tag + "b4 the page links the other cut, which is built", !!oc && oc.getAttribute("href").endsWith("/" + other) && fs.existsSync(path.join(DIR, other)));
  check(tag + "b5 ten chapters", d.querySelectorAll(".chap").length === 10);
  w.close();
});

// 2-4. What the music cut shows, scene by scene, at a settled moment of each.
{
  const raw = fs.readFileSync(path.join(DIR, "noncredit_in_motion.html"), "utf8"), cfg = cfgOf(raw);
  const w = boot("noncredit_in_motion.html", false), d = w.document;
  check("c0 the music cut runs 100 s", w.__film.dur === 100 && w.__film.narrated === false);
  const shown = (t) => { w.__film.seek(t); return Array.from(d.querySelectorAll(".sc")).filter((s) => s.style.visibility === "visible").map((s) => s.textContent.replace(/\s+/g, " ")).join(" | "); };
  const FIG = [
    [18.5, ["52,452", "250,000", "Noncredit and not-for-credit learners will be key to meeting this goal.", "7,500 noncredit learners a year"]],
    [28.5, ["1 in 4", "30,795", "+34%", "$7,833 to $10,479", "for students working before they enrolled, a year after finishing or leaving", "6,291 of 2012–13"]],
    [38.5, ["Cabrillo College", "8 units of CPL"]],
    [48.5, ["Moreno Valley College", "8.5 units of CPL", "emergency management"]],
    [58.5, ["Mt. San Antonio College", "22 units of CPL for the LVN license", "College of the Desert awards 22 units", "Los Angeles Pierce College awards a similar 22", "Associate degree in nursing (ADN)"]],
    [66.5, ["North Orange Continuing Education", "CompTIA A+, Network+ and Security+ certifications", "9 units of CPL for all three, as at Saddleback College", "Twelve colleges award credit for all three"]],
    [76.5, ["78%", "28 colleges", "48% across all CPL", "49", "253 college sites", "3,269", "about 4% of all CPL"]],
    [87.5, ["$35 million", "$7 million ongoing", "$50,000 grants", "four noncredit programs: North Orange Continuing Education, Mt. San Antonio College, San Diego College of Continuing Education and Calbright", "$1.8 million", "credit and noncredit FTES together size every max award"]],
    [99.5, ["Mirror a course", "Post your certificates in MAP", "Invite your completers back", "Our Time is Now!"]],
  ];
  FIG.forEach(([t, want]) => {
    const text = shown(t), miss = want.filter((x) => !text.includes(x));
    check("c1 at " + t + " s the screen shows the deck's figures" + (miss.length ? " (missing: " + miss.join("; ") + ")" : ""), miss.length === 0);
  });
  // 3. the learners
  const people = cfg.facts.people;
  check("c2 four learners, each with alt text on the portrait and the words Illustrative learner and photo",
    people.length === 4 && Array.from(d.querySelectorAll(".sc img")).filter((i) => /^Illustrative photo:/.test(i.alt)).length === 4
      && /^Illustrative learner and photo\./.test(cfg.facts.illus));
  const wip = people.flatMap((p) => p.steps.filter((s) => s[1] === "wip"));
  w.__film.seek(58.5);
  const dashed = Array.from(d.querySelectorAll(".sc div")).filter((e) => /dashed/.test(e.style.border || ""));
  check("c3 the step a college plans to document carries the words, not only the dashed outline",
    wip.length === 1 && dashed.length === 1 && dashed.every((e) => e.textContent.startsWith(cfg.facts.wip)) && /planned/i.test(cfg.facts.wip));
  check("c3b no path says a college is building it or documenting it now",
    !/in development|is building|documenting\b|documented now/i.test(JSON.stringify(people) + cfg.facts.wip));
  check("c4 exactly one gold CPL step per learner, where the path is on record",
    people.every((p) => p.steps.filter((s) => s[1] === "cpl" || s[1] === "wip").length === 1));
  // 4. the funding scene's vocabulary
  const fund = JSON.stringify(cfg.facts.funding);
  check("c5 the funding scene says funding, never money, pool, earn or draw", !/\b(money|pool|earn\w*|draws?|unspent|funding model)\b/i.test(fund));
  // 5. the barriers
  const inv = Array.from(d.querySelectorAll("#fx .inv"));
  check("d1 five barriers, four words or fewer, each 0.35 s into the scene that answers it",
    inv.length === 5 && cfg.barriers.every((b) => b[3].split(/\s+/).length <= 4 && spans.some((s) => Math.abs(s[0] + 0.35 - b[0]) < 1e-9)));
  w.__film.seek(29.35);
  const atSeam = inv.some((e) => e.style.visibility === "visible");
  w.__film.seek(34);
  check("d2 a barrier plays at a seam, and none mid-scene", atSeam && inv.every((e) => e.style.visibility !== "visible"));
  const wr = boot("noncredit_in_motion.html", true);
  wr.__film.seek(29.35);
  check("d3 reduced motion: no barriers", Array.from(wr.document.querySelectorAll("#fx .inv")).every((e) => e.style.visibility !== "visible"));
  w.close(); wr.close();
}

// 6. The narrated cut.
{
  const spec = JSON.parse(fs.readFileSync(path.join(DIR, "narration.json"), "utf8"));
  const L = JSON.parse(fs.readFileSync(path.join(DIR, "narration_layout.json"), "utf8"));
  const H = JSON.parse(fs.readFileSync(path.join(DIR, "narration_words.json"), "utf8"));
  const sha1 = (t) => crypto.createHash("sha1").update(t, "utf8").digest("hex");
  const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
  check("n1 every clip is committed and was read from its scene's current text, in ElevenLabs",
    spec.engine.name === "elevenlabs" && spec.scenes.length === 10
      && spec.scenes.every((s) => s.read && s.read.text_sha1 === sha1(s.text) && fs.existsSync(path.join(DIR, spec.engine.clips, s.read.clip))));
  const spoken = spec.scenes.map((s) => s.text).join(" ");
  check("n2 the voice reads words: no digits, CPL unspaced, MAP written map", !/\d/.test(spoken) && /\bCPL\b/.test(spoken) && !/\bMAP\b/.test(spoken) && /\bmap\b/.test(spoken));
  check("n3 the 34% names who it measures, as the deck says to say it",
    /noncredit students who were working before they enrolled saw their median quarterly wages rise thirty-four percent a year after finishing or leaving their program/.test(spoken));
  check("n4 the words file was heard from the committed track", H.sha256 === sha256(path.join(DIR, "narration.mp3")));
  const raw = fs.readFileSync(path.join(DIR, "noncredit_in_motion_narrated.html"), "utf8");
  const w = boot("noncredit_in_motion_narrated.html", false), d = w.document, { ft, nt } = w.__film;
  check("n5 the player runs on the narration's length", w.__film.narrated === true && Math.abs(w.__film.dur - L.total) < 1e-6);
  check("n6 each scene holds its whole clip, back to back",
    L.scenes.every((s, i) => s.start < s.speech_start && s.speech_start < s.speech_end && s.speech_end < s.end && (i === 0 || Math.abs(s.start - L.scenes[i - 1].end) < 1e-6))
      && Math.abs(L.scenes[9].end - L.total) < 1e-6);
  check("n7 captions write MAP where the voice reads map", L.cues.some((q) => /\bMAP\b/.test(q.text)) && !L.cues.some((q) => /\bmap\b/.test(q.text)));
  w.__film.seek(2.5);
  // Sam, 2026-10-06: "Let's take out naming the narrator Sierra and make her anonymous."
  check("n8 the narrator goes unnamed: no name line, and no name in the voice or the page",
    !Array.from(d.querySelectorAll("#stage p")).some((e) => /narrated by/i.test(e.textContent)) && !/Sierra/.test(spoken) && !/Sierra/.test(JSON.stringify(cfgOf(raw))));
  w.__film.seek(L.total - 0.3);
  check("n9 the close says the voice is synthetic", Array.from(d.querySelectorAll("#stage p")).some((e) => /synthetic voice made with ElevenLabs/.test(e.textContent)));
  check("n10 the page plays the committed voice track", /"audio": ?"narration\.mp3"/.test(raw) && fs.existsSync(path.join(DIR, "narration.mp3")));
  const anchors = L.scenes.flatMap((s, i) => (s.anchors || []).map((a) => Object.assign({ film: spans[i][0] + a.at }, a)));
  const cues = spec.scenes.flatMap((s) => s.cues || []);
  check("n11 every cue is pinned, or says why it is skipped",
    anchors.length > 0 && anchors.length === cues.filter((c) => !c.skip).length && cues.every((c) => typeof c.why === "string"));
  const off = anchors.map((a) => Math.max(Math.abs(nt(a.film) - a.t), Math.abs(ft(a.t) - a.film)));
  check("n12 the clock passes through each anchor within 0.05 s", Math.max(...off) < 0.05);
  check("n13 no reveal trails its word, and none leads it by more than 1.4 s",
    anchors.every((a) => a.t <= a.said + 1e-6 && a.said - a.t <= 1.4));
  let mono = true;
  for (let t = 0; t < L.total; t += 0.25) if (ft(t + 0.25) < ft(t) - 1e-9 || ft(t + 0.25) - ft(t) > 0.25 + 1e-6) mono = false;
  check("n14 the picture never runs backward, nor faster than the music cut", mono);
  check("n15 the narrator's scene air says why", spec.scenes.filter((s) => s.air_s != null).every((s) => typeof s.air_why === "string" && s.air_why.length > 40));
  w.close();
}

let fail = 0;
results.forEach(([n, ok]) => { console.log((ok ? "PASS " : "FAIL ") + n); if (!ok) fail++; });
console.log(fail ? fail + " of " + results.length + " failed" : "all " + results.length + " passed");
process.exit(fail ? 1 : 0);
