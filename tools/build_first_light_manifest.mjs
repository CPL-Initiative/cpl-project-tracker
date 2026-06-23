// Build the First Light PAINTINGS manifest into first_light.js from a curated
// selection file, copying each image URL STRAIGHT from the Commons-sourced,
// license-verified candidate pool (tools/first_light_candidates.json) so no
// filename is ever hand-typed. Runs locally (no network).
//
//   node tools/build_first_light_manifest.mjs
//
// Inputs:
//   tools/first_light_selection.json  — ordered [{file,title,artist,year,museum,
//                                        blurb,setting,alt,lic?,mono?}] authored by hand
//   tools/first_light_candidates.json — the verified-PD pool (runner-sourced)
// Output: rewrites the /* FL-MANIFEST:START … END */ block in first_light.js.

import fs from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const sel = JSON.parse(fs.readFileSync(ROOT + "tools/first_light_selection.json", "utf8"));
const entries = Array.isArray(sel) ? sel : sel.paintings;
const cand = JSON.parse(fs.readFileSync(ROOT + "tools/first_light_candidates.json", "utf8"));
const byFile = new Map(cand.candidates.map((c) => [c.file, c]));

const errors = [];
const seen = new Set();
const out = [];

entries.forEach((e, i) => {
  const where = `entry ${i} (${e.title || e.file || "??"})`;
  const c = byFile.get(e.file);
  if (!c) { errors.push(`${where}: file not in verified candidates → "${e.file}". Run the sourcing workflow or fix the exact Commons filename.`); return; }
  if (seen.has(e.file)) { errors.push(`${where}: duplicate image "${e.file}" (would repeat in rotation).`); return; }
  seen.add(e.file);
  const need = ["title", "artist", "year", "museum", "blurb", "setting", "alt"];
  for (const k of need) if (!e[k] || !String(e[k]).trim()) errors.push(`${where}: missing "${k}".`);
  if (e.alt && String(e.alt).trim().length <= 20) errors.push(`${where}: alt text too short (need > 20 chars for a11y).`);
  if (e.blurb && String(e.blurb).trim().length < 30) errors.push(`${where}: blurb too short (< 30 chars).`);
  // Quality bar: First Light's signature is the grayscale→colour reveal, which is
  // a no-op on a black-and-white image. B&W is welcome when it's lovely, but it
  // MUST be flagged mono:true so the greeting skips the dead fade (see first_light.js
  // .cplfl-mono). Scan the ALT (a literal description of the image) — not the blurb,
  // whose prose may say "monochrome" figuratively (e.g. Remington's nocturne).
  if (!e.mono && /\b(black[- ]and[- ]white|b&w|monochrome|grayscale|greyscale|sepia)\b/i.test(e.alt || "")) {
    errors.push(`${where}: alt reads as monochrome but mono:true is not set — set mono:true (B&W is fine when it's lovely) so the reveal skips the no-op fade, or choose a colour image.`);
  }
  if ("mono" in e && e.mono !== true) errors.push(`${where}: mono must be omitted or exactly true (got ${JSON.stringify(e.mono)}).`);
  const lic = e.lic || ("Public domain · " + (e.museum || "via Wikimedia Commons") + " · via Wikimedia Commons");
  if (!/public domain/i.test(lic)) errors.push(`${where}: lic must say "public domain".`);
  out.push({
    title: e.title, artist: e.artist, year: e.year, museum: e.museum,
    img: c.img,                              // authoritative URL from the verified candidate
    alt: e.alt, blurb: e.blurb, setting: e.setting, lic,
    ...(e.mono ? { mono: true } : {}),
  });
});

if (errors.length) {
  console.error("BUILD FAILED:\n" + errors.map((x) => "  • " + x).join("\n"));
  process.exit(1);
}

const q = (s) => JSON.stringify(s);
const body = out.map((p) =>
  "    {\n" +
  `      title: ${q(p.title)},\n` +
  `      artist: ${q(p.artist)}, year: ${q(p.year)},\n` +
  `      museum: ${q(p.museum)},\n` +
  `      img: ${q(p.img)},\n` +
  `      alt: ${q(p.alt)},\n` +
  `      blurb: ${q(p.blurb)},\n` +
  `      setting: ${q(p.setting)},\n` +
  (p.mono ? `      mono: true,\n` : "") +
  `      lic: ${q(p.lic)}\n` +
  "    }"
).join(",\n");

const arrayText = "  var PAINTINGS = [\n" + body + "\n  ];";

const js = fs.readFileSync(ROOT + "first_light.js", "utf8");
const re = /(\/\* FL-MANIFEST:START[\s\S]*?\*\/)\s*var PAINTINGS = \[[\s\S]*?\];\s*(\/\* FL-MANIFEST:END \*\/)/;
if (!re.test(js)) { console.error("Could not find the FL-MANIFEST sentinel block in first_light.js"); process.exit(1); }
const next = js.replace(re, (_m, start, end) => `${start}\n${arrayText}\n  ${end}`);
fs.writeFileSync(ROOT + "first_light.js", next);
console.log(`Built first_light.js manifest: ${out.length} paintings.`);
