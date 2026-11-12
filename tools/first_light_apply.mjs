// Apply the First Light tab's marks to the repo's files (S643; design #3153 comments 6826461825 and 6829695812).
//
// first-light-apply.yml runs this on a runner. It reads every row of first_light_marks, resolves them with the
// tab's own resolver (first_light_tab.js, MARKS.resolveSet: the latest mark per item wins; never restated here)
// and writes:
//   tools/first_light_selection.json   the daily paintings, in order. An added painting arrives with blurb,
//                                      setting and alt set to "__needs_words__"; the manifest builder keeps it out
//                                      of the rotation and tests/first_light_needs_words.test.js fails the build
//                                      until the queue session writes the words on the pull request.
//   library/photos/hero_photos.json    the one list of hero photos. A My CPL Story photo carries the story's
//                                      link and the name exactly as MAP printed it, nothing more, and an alt of
//                                      "__needs_words__" for the queue session to write.
//   library/photos/stories/<file>      each added story photo, fetched from the address MAP published it at. A
//                                      photo no longer in the list is deleted (Drop is the takedown path).
//   library/index.html, library/adopt/index.html, cpl_pathways.js
//                                      their copies of the hero list, rewritten from the list until they read it
//                                      themselves, so a drop leaves every view at the next Apply.
// The workflow then runs tools/build_first_light_manifest.mjs and opens or updates ONE pull request. Sam merges.
//
//   node tools/first_light_apply.mjs --plan  --out plan.json   reads the marks; says what would change
//   node tools/first_light_apply.mjs --apply --plan plan.json  writes the files (fetching story photos)
// Options: --marks <file.json> reads marks from a file instead of Supabase (tests); --root <dir> works on a copy
// of the files (tests). Env: SUPABASE_URL, SUPABASE_SERVICE_KEY; FIRST_LIGHT_STORY_FIXTURE_DIR serves story photos
// from a folder (tests); FIRST_LIGHT_PLAYWRIGHT names the playwright module for the fallback fetch.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(import.meta.url);
const MARKS = require(path.join(HERE, "..", "first_light_tab.js"));
const NEEDS = MARKS.NEEDS_WORDS;

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const has = (k) => argv.includes(k);
const ROOT = path.resolve(opt("--root") || path.join(HERE, ".."));
const P = (rel) => path.join(ROOT, rel);
const readJson = (rel) => JSON.parse(fs.readFileSync(P(rel), "utf8"));
const writeJson = (rel, v) => fs.writeFileSync(P(rel), JSON.stringify(v, null, 2) + "\n");

function fail(msg) { console.error("first_light_apply: " + msg); process.exit(1); }

async function readMarks() {
  const file = opt("--marks");
  if (file) return JSON.parse(fs.readFileSync(file, "utf8"));
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) fail("SUPABASE_URL and SUPABASE_SERVICE_KEY are required (or --marks)");
  const rows = [], PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const r = await fetch(url + "/rest/v1/first_light_marks?select=id,item_set,item_key,mark,position,collection,marked_by,marked_at&order=id.asc", {
      headers: { apikey: key, Authorization: "Bearer " + key, Range: from + "-" + (from + PAGE - 1), "Range-Unit": "items" }
    });
    if (!r.ok) fail("reading first_light_marks: HTTP " + r.status);
    const d = await r.json();
    rows.push(...d);
    if (d.length < PAGE) return rows;
  }
}

function stories() {
  const s = fs.readFileSync(P("fact-sheet/cpl_stories.js"), "utf8");
  const d = JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1));
  return { source: d.source || MARKS.STORY_SOURCE, list: d.stories || [] };
}

// A painting added from the gallery's candidates: the facts the candidate pool holds, and the three fields that
// need a person's words set to the fixed token.
function newPainting(file, cand, gallery) {
  const c = cand.get(file), g = gallery.get(file);
  if (!c) return null;
  const artist = String(c.artist || (g && g.artist) || "").replace(/\s*\([^)]*\)\s*$/, "").trim() || "Artist not recorded";
  const museum = String((g && g.museum) || c.credit || "");
  return {
    file,
    title: (g && g.title) || c.object || file.replace(/\.[a-z0-9]+$/i, ""),
    artist,
    year: String(c.year || "").trim() || "undated",
    museum: /^(https?:|own work)/i.test(museum) || !museum.trim() ? "Collection not recorded" : museum,
    blurb: NEEDS, setting: NEEDS, alt: NEEDS
  };
}

function plan(marks) {
  const sel = readJson("tools/first_light_selection.json");
  const hero = readJson("library/photos/hero_photos.json");
  const cand = new Map(readJson("tools/first_light_candidates.json").candidates.map((c) => [c.file, c]));
  const gallery = new Map(readJson("tools/first_light_gallery/index.json").paintings.map((g) => [g.file, g]));
  const st = stories();

  const pr = MARKS.resolveSet(sel.map((e) => e.file), MARKS.forSet(marks, "paintings"));
  const bySel = new Map(sel.map((e) => [e.file, e]));
  const held = [];
  const paintings = pr.list.map((k) => bySel.get(k) || newPainting(k, cand, gallery) || (held.push(k), null)).filter(Boolean);

  const hr = MARKS.resolveSet(hero.photos.map((p) => p.file), MARKS.forSet(marks, "photos"));
  const byHero = new Map(hero.photos.map((p) => [p.file, p]));
  const viewIds = (hero.views || []).map((v) => v.id);
  const fetches = [];
  const photos = hr.list.map((k) => {
    if (byHero.has(k)) return byHero.get(k);
    const s = st.list.find((x) => MARKS.storyFile(x) === k);
    if (!s) { held.push(k); return null; }
    fetches.push({ file: k, url: s.img });
    // Only what MAP published: the name as printed and the story's page.
    return { file: k, width: 0, height: 0, source: "My CPL Story", name: s.name, story_link: st.source, plays: viewIds, alt: NEEDS };
  }).filter(Boolean);

  if (!paintings.length) fail("the marks would leave no painting in the rotation; refusing");
  if (!photos.length) fail("the marks would leave no hero photo; refusing");
  const keep = new Set(photos.map((p) => p.file));
  const removeFiles = hr.dropped.filter((k) => k.indexOf(MARKS.STORY_DIR) === 0);
  // A story file on disk that the list no longer names is taken down too.
  const dir = P("library/photos/" + MARKS.STORY_DIR);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) { const k = MARKS.STORY_DIR + f; if (!keep.has(k) && !removeFiles.includes(k)) removeFiles.push(k); }

  const label = (set, k) => set === "paintings" ? ((bySel.get(k) || newPainting(k, cand, gallery) || {}).title || k)
    : ((byHero.get(k) || {}).name || (photos.find((p) => p.file === k) || {}).name || k);
  const lines = (set, r) => [
    ...r.added.map((k) => "Add " + label(set, k)),
    ...r.dropped.map((k) => "Drop " + label(set, k)),
    ...r.moved.map((k) => "Move " + label(set, k) + " to number " + (r.list.indexOf(k) + 1))
  ];
  return {
    changed: pr.changed || hr.changed || removeFiles.length > 0,
    paintings, photos, fetches, removeFiles, held,
    needs_words: [...paintings.filter((p) => [p.blurb, p.setting, p.alt].includes(NEEDS)).map((p) => "painting: " + p.title),
      ...photos.filter((p) => p.alt === NEEDS).map((p) => "photo: " + (p.name || p.file))],
    summary: { paintings: lines("paintings", pr), photos: lines("photos", hr), counts: { paintings: paintings.length, photos: photos.length } }
  };
}

// Width and height from the file's own header (PNG, JPEG, WebP); nothing is re-encoded.
function imageSize(b) {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const t = b.toString("ascii", 12, 16);
    if (t === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (t === "VP8L") { const v = b.readUInt32LE(21); return { width: 1 + (v & 0x3fff), height: 1 + ((v >> 14) & 0x3fff) }; }
    if (t === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  return null;
}

let browser = null;
async function fetchImage(f) {
  const fixture = process.env.FIRST_LIGHT_STORY_FIXTURE_DIR;
  if (fixture) return fs.readFileSync(path.join(fixture, path.basename(f.file)));
  try {
    const r = await fetch(f.url, { headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" } });
    const b = Buffer.from(await r.arrayBuffer());
    if (r.ok && imageSize(b)) return b;
    console.log("plain fetch of " + f.url + " gave HTTP " + r.status + "; trying a browser");
  } catch (e) { console.log("plain fetch of " + f.url + " failed (" + e.message + "); trying a browser"); }
  // MAP's site sits behind a bot challenge that a real browser passes (as tools/source_cpl_stories.mjs does).
  if (!browser) {
    const pw = await import(process.env.FIRST_LIGHT_PLAYWRIGHT || "playwright");
    browser = await (pw.chromium || pw.default.chromium).launch();
    browser._ctx = await browser.newContext();
    const page = await browser._ctx.newPage();
    await page.goto(MARKS.STORY_SOURCE, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(5000);
  }
  const r = await browser._ctx.request.get(f.url, { timeout: 60000 });
  const b = Buffer.from(await r.body());
  if (!r.ok() || !imageSize(b)) throw new Error("could not fetch " + f.url + " (HTTP " + r.status() + ")");
  return b;
}

// The three views' copies of the list, rewritten from it (until they read hero_photos.json themselves).
function slideLines(photos, dir, indent) {
  return photos.map((p, i) => indent + '<img class="hero-slide' + (i === 0 ? ' is-on" src="' : '" data-src="') + dir + p.file +
    '" alt="" width="' + p.width + '" height="' + p.height + '">').join("\n");
}
function rewriteSlides(rel, dir, photos) {
  const html = fs.readFileSync(P(rel), "utf8");
  const re = /(<div class="hero-slides"[^>]*>\n)((?:[ \t]*<img class="hero-slide[^\n]*\n)+)/;
  const m = re.exec(html);
  if (!m) fail(rel + ": the hero-slides block was not found");
  const indent = /^[ \t]*/.exec(m[2])[0];
  fs.writeFileSync(P(rel), html.replace(re, (_a, open) => open + slideLines(photos, dir, indent) + "\n"));
}
function rewritePathways(photos) {
  const js = fs.readFileSync(P("cpl_pathways.js"), "utf8");
  const re = /var HERO_PHOTOS = \[[\s\S]*?\]\];/;
  if (!re.test(js)) fail("cpl_pathways.js: HERO_PHOTOS was not found");
  const rows = photos.map((p) => JSON.stringify([p.file, p.width, p.height]).replace(/,/g, ", "));
  const chunks = [];
  for (let i = 0; i < rows.length; i += 3) chunks.push(rows.slice(i, i + 3).join(", "));
  fs.writeFileSync(P("cpl_pathways.js"), js.replace(re, "var HERO_PHOTOS = [" + chunks.join(",\n    ") + "];"));
}

async function apply(pl) {
  const hero = readJson("library/photos/hero_photos.json");
  for (const f of pl.fetches) {
    const b = await fetchImage(f);
    const sz = imageSize(b);
    if (!sz || !sz.width || !sz.height) fail(f.file + ": not a PNG, JPEG or WebP image");
    fs.mkdirSync(path.dirname(P("library/photos/" + f.file)), { recursive: true });
    fs.writeFileSync(P("library/photos/" + f.file), b);
    const p = pl.photos.find((x) => x.file === f.file);
    p.width = sz.width; p.height = sz.height;
  }
  if (browser) await browser.close();
  for (const k of pl.removeFiles) { const f = P("library/photos/" + k); if (fs.existsSync(f)) fs.unlinkSync(f); }
  for (const p of pl.photos) {
    if (!fs.existsSync(P("library/photos/" + p.file))) fail("library/photos/" + p.file + " is missing");
    if (!p.width || !p.height) fail(p.file + ": no size");
  }
  writeJson("tools/first_light_selection.json", pl.paintings);
  hero.photos = pl.photos;
  writeJson("library/photos/hero_photos.json", hero);
  rewriteSlides("library/index.html", "photos/", pl.photos);
  rewriteSlides("library/adopt/index.html", "../photos/", pl.photos);
  rewritePathways(pl.photos);
}

function body(pl) {
  const L = [];
  L.push("The First Light tab's marks, applied by `first-light-apply.yml`. **Sam merges this; nothing auto-merges.**", "");
  for (const [k, t] of [["paintings", "Paintings"], ["photos", "Photos"]]) {
    L.push("**" + t + "** (" + pl.summary.counts[k] + " after this change)");
    L.push(...(pl.summary[k].length ? pl.summary[k].map((x) => "- " + x) : ["- no change"]), "");
  }
  if (pl.removeFiles.length) L.push("Story photos taken down: " + pl.removeFiles.map((f) => "`" + f + "`").join(", "), "");
  if (pl.needs_words.length) {
    L.push("**Words wanted before review.** These carry `" + NEEDS + "` and the `test` check fails until a session writes them on this branch " +
      "(a painting's blurb, setting and alt, a photo's alt), written from the image. An added painting stays out of the rotation until then.");
    L.push(...pl.needs_words.map((x) => "- " + x), "");
  }
  if (pl.held.length) L.push("Held, not found in the candidate pool or the stories file: " + pl.held.map((x) => "`" + x + "`").join(", "), "");
  return L.join("\n");
}

if (has("--plan") && !has("--apply")) {
  const pl = plan(await readMarks());
  const out = opt("--out");
  if (out) fs.writeFileSync(out, JSON.stringify(pl, null, 2));
  if (opt("--body")) fs.writeFileSync(opt("--body"), body(pl));
  console.log(JSON.stringify({ changed: pl.changed, needs_browser: pl.fetches.length > 0, summary: pl.summary, needs_words: pl.needs_words.length, held: pl.held }));
} else if (has("--apply")) {
  const file = opt("--plan");
  const pl = file ? JSON.parse(fs.readFileSync(file, "utf8")) : plan(await readMarks());
  await apply(pl);
  if (opt("--body")) fs.writeFileSync(opt("--body"), body(pl));
  console.log("applied: " + pl.paintings.length + " paintings, " + pl.photos.length + " photos");
} else fail("say --plan or --apply");
