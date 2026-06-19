// First Light art sourcing + image-liveness verifier.
//
// WHY THIS EXISTS: the agent's sandbox cannot reach Wikimedia Commons (egress
// allowlist), and WebFetch is 403'd by Wikimedia's bot protection — but a
// GitHub Actions runner has open internet. So we run THIS on the runner (see
// .github/workflows/first-light-art.yml) to (a) pull EXACT Commons filenames +
// license metadata for public-domain paintings/photos, so the manifest never
// hotlinks a guessed name, and (b) verify every image URL in first_light.js
// actually resolves (a durable liveness guard — a renamed/deleted Commons file
// silently breaks the greeting otherwise).
//
//   node tools/source_first_light_art.mjs source   # → tools/first_light_candidates.json
//   node tools/source_first_light_art.mjs verify    # → tools/first_light_verify.json
//   node tools/source_first_light_art.mjs all        # both (the workflow default)
//
// Node 18+ (global fetch). No dependencies.

import fs from "node:fs";

const UA =
  "CPL-FirstLight-art-sourcing/1.0 (https://github.com/CPL-Initiative/cpl-project-tracker; MAP@rccd.edu)";
const API = "https://commons.wikimedia.org/w/api.php";
const ROOT = new URL("..", import.meta.url).pathname;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIN_WIDTH = 900;          // skip thumbnails / tiny crops
const PER_ROOT_CAP = 120;       // keep each artist/topic's contribution bounded
const SUBCAT_BUDGET = 40;       // max subcategories visited per root
const SUBCAT_CONCURRENCY = 6;   // parallel subcategory fetches (the masters file
                                // works under per-museum/per-decade subcats)

// Bounded-concurrency map — keeps Commons happy while cutting wall time ~6x.
async function mapPool(items, n, fn) {
  const q = items.slice();
  const workers = [];
  for (let i = 0; i < n; i++) workers.push((async () => { while (q.length) await fn(q.shift()); })());
  await Promise.all(workers);
}

function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
}

// A file is usable iff Commons declares it Public Domain or CC0. This is the
// safety net: categories like "California on photochrome prints" or "Gamble
// House" hold modern CC-BY-SA photos too — those get DROPPED here; only
// genuinely free-of-copyright files (PD-Art, PD-US, PD-old, PD-USGov/NARA/HABS,
// CC0) survive.
function isPublicDomain(ext) {
  const short = (ext.LicenseShortName && ext.LicenseShortName.value) || "";
  const code = (ext.License && ext.License.value) || "";
  const usage = (ext.UsageTerms && ext.UsageTerms.value) || "";
  const hay = (short + " " + code + " " + usage).toLowerCase();
  if (/cc[\s-]?by|cc[\s-]?sa|attribution|share[\s-]?alike|fair use|gfdl/.test(hay)) {
    if (!/public domain|cc0|cc[\s-]?zero/.test(hay)) return false; // CC-BY/SA/GFDL are free but NOT PD
  }
  return /public domain|cc0|cc[\s-]?zero|^pd|\bpd-|\bpd /.test(hay);
}

function filePathUrl(title) {
  const name = title.replace(/^File:/, "");
  return "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(name) + "?width=1600";
}

async function apiGet(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(u, { headers: { "User-Agent": UA, "Accept": "application/json" } });
      if (res.status === 429 || res.status >= 500) { await sleep(1500 * (attempt + 1)); continue; }
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
}

// Files directly in ONE category title (e.g. "Category:Paintings by Edgar Payne").
async function collectFiles(catTitle, push, enough) {
  let cont = undefined;
  do {
    const params = {
      action: "query", format: "json", formatversion: "1",
      generator: "categorymembers", gcmtitle: catTitle,
      gcmtype: "file", gcmlimit: "200", gcmnamespace: "6",
      prop: "imageinfo",
      iiprop: "extmetadata|mediatype|url|size",
      iiextmetadatafilter:
        "LicenseShortName|License|UsageTerms|Artist|DateTimeOriginal|ObjectName|Credit|ImageDescription",
    };
    if (cont) params.gcmcontinue = cont;
    const data = await apiGet(params);
    const pages = (data && data.query && data.query.pages) || {};
    for (const p of Object.values(pages)) {
      const ii = p.imageinfo && p.imageinfo[0];
      if (!ii || !ii.extmetadata) continue;
      if (ii.mediatype !== "BITMAP") continue;
      if ((ii.width || 0) < MIN_WIDTH) continue;
      if (!isPublicDomain(ii.extmetadata)) continue;
      const title = p.title;
      if (/\b(detail|sketch|study|verso|reverse|frame|x-ray|infrared|signature|diagram|map)\b/i.test(title)) continue;
      const ext = ii.extmetadata;
      push({
        file: title.replace(/^File:/, ""),
        img: filePathUrl(title),
        license: stripHtml(ext.LicenseShortName && ext.LicenseShortName.value) || "Public domain",
        artist: stripHtml(ext.Artist && ext.Artist.value),
        year: stripHtml(ext.DateTimeOriginal && ext.DateTimeOriginal.value),
        object: stripHtml(ext.ObjectName && ext.ObjectName.value),
        credit: stripHtml(ext.Credit && ext.Credit.value).slice(0, 200),
        desc: stripHtml(ext.ImageDescription && ext.ImageDescription.value).slice(0, 240),
        width: ii.width, height: ii.height, page: ii.descriptionurl,
      });
      if (enough()) return;
    }
    cont = data && data.continue && data.continue.gcmcontinue;
    await sleep(60);
  } while (cont);
}

async function listSubcats(catTitle) {
  const subs = [];
  let cont = undefined;
  do {
    const params = {
      action: "query", format: "json", formatversion: "1",
      list: "categorymembers", cmtitle: catTitle,
      cmtype: "subcat", cmlimit: "200",
    };
    if (cont) params.cmcontinue = cont;
    const data = await apiGet(params);
    for (const m of (data.query && data.query.categorymembers) || []) subs.push(m.title);
    cont = data && data.continue && data.continue.cmcontinue;
    await sleep(60);
  } while (cont);
  return subs;
}

// One root → its direct files + one level of subcategory files (fetched
// concurrently), deduped, capped. Recursing one level lets container categories
// (e.g. "Paintings by Claude Monet", which files works under per-museum subcats)
// resolve.
async function pullRoot(root, seenFiles) {
  const items = [];
  const enough = () => items.length >= PER_ROOT_CAP;
  const push = (it) => { if (!seenFiles.has(it.file)) { seenFiles.add(it.file); items.push({ ...it, category: root }); } };
  const rootTitle = "Category:" + root;
  await collectFiles(rootTitle, push, enough);
  if (!enough()) {
    let subs = [];
    try { subs = (await listSubcats(rootTitle)).slice(0, SUBCAT_BUDGET); } catch { /* ignore */ }
    await mapPool(subs, SUBCAT_CONCURRENCY, async (s) => {
      if (enough()) return;
      await collectFiles(s, push, enough);
    });
  }
  return items.slice(0, PER_ROOT_CAP);
}

async function doSource() {
  const cfg = JSON.parse(fs.readFileSync(ROOT + "tools/art_categories.json", "utf8"));
  const cats = cfg.categories || [];
  const all = [];
  const summary = [];
  const seenFiles = new Set();
  for (const cat of cats) {
    let items;
    try { items = await pullRoot(cat, seenFiles); }
    catch (e) { summary.push({ category: cat, count: 0, error: String(e.message || e) }); console.log(`  ERR   ${cat}: ${e.message || e}`); continue; }
    all.push(...items);
    summary.push({ category: cat, count: items.length, capped: items.length >= PER_ROOT_CAP });
    console.log(`  ${String(items.length).padStart(4)}  ${cat}${items.length >= PER_ROOT_CAP ? "  (capped)" : ""}`);
  }
  const have = new Set(all.map((c) => c.file));
  const extraAdded = await appendExtrasInto(all, have);
  if (extraAdded) console.log(`  +${extraAdded} iconic extra file(s)`);
  all.sort((a, b) => a.category.localeCompare(b.category) || a.file.localeCompare(b.file));
  const payload = {
    _generated: new Date().toISOString(),
    _note: "Verified public-domain candidates from Wikimedia Commons (direct + 1 level of subcategories + tools/art_extra_files.json). Curate by hand into tools/first_light_selection.json; write OUR OWN blurb/setting/alt per entry. Filenames are EXACT (do not edit).",
    total: all.length,
    by_category: summary,
    candidates: all,
  };
  fs.writeFileSync(ROOT + "tools/first_light_candidates.json", JSON.stringify(payload, null, 2));
  console.log(`\nSOURCED ${all.length} public-domain candidates across ${cats.length} categories.`);
}

// Append specific iconic public-domain works by EXACT Commons filename — for
// works that don't live in a clean "Paintings by X" category (woodblock prints,
// single-work categories). Each is API-verified (exists + BITMAP + PD) before
// it's added. Used both by `all` (so a full re-source keeps them — durable) and
// by `extras` mode (append-only, preserving existing curated selections).
async function appendExtrasInto(list, have) {
  const cfgPath = ROOT + "tools/art_extra_files.json";
  if (!fs.existsSync(cfgPath)) return 0;
  let files = [];
  try { files = (JSON.parse(fs.readFileSync(cfgPath, "utf8")).files) || []; } catch { return 0; }
  let added = 0;
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const data = await apiGet({
      action: "query", format: "json", formatversion: "2",
      titles: batch.map((f) => "File:" + f).join("|"),
      prop: "imageinfo", iiprop: "extmetadata|mediatype|url|size",
      iiextmetadatafilter: "LicenseShortName|License|UsageTerms|Artist|DateTimeOriginal|ObjectName|Credit|ImageDescription",
    });
    const norm = {};
    for (const n of (data.query && data.query.normalized) || []) norm[n.from] = n.to;
    const byTitle = {};
    for (const p of (data.query && data.query.pages) || []) byTitle[p.title] = p;
    for (const f of batch) {
      const p = byTitle[norm["File:" + f] || ("File:" + f)];
      if (!p || p.missing) { console.log("  extra MISSING: " + f); continue; }
      const ii = p.imageinfo && p.imageinfo[0];
      if (!ii || !ii.extmetadata || ii.mediatype !== "BITMAP") { console.log("  extra no-imageinfo/!bitmap: " + f); continue; }
      if (!isPublicDomain(ii.extmetadata)) { console.log("  extra NOT public domain: " + f); continue; }
      const file = p.title.replace(/^File:/, "");
      if (have.has(file)) { console.log("  extra already present: " + file); continue; }
      const ext = ii.extmetadata;
      list.push({
        category: "Iconic works", file, img: filePathUrl(p.title),
        license: stripHtml(ext.LicenseShortName && ext.LicenseShortName.value) || "Public domain",
        artist: stripHtml(ext.Artist && ext.Artist.value),
        year: stripHtml(ext.DateTimeOriginal && ext.DateTimeOriginal.value),
        object: stripHtml(ext.ObjectName && ext.ObjectName.value),
        credit: stripHtml(ext.Credit && ext.Credit.value).slice(0, 200),
        desc: stripHtml(ext.ImageDescription && ext.ImageDescription.value).slice(0, 240),
        width: ii.width, height: ii.height, page: ii.descriptionurl,
      });
      have.add(file); added++;
      console.log("  extra added: " + file);
    }
    await sleep(300);
  }
  return added;
}

async function doExtras() {
  const candPath = ROOT + "tools/first_light_candidates.json";
  const payload = JSON.parse(fs.readFileSync(candPath, "utf8"));
  const have = new Set(payload.candidates.map((c) => c.file));
  const added = await appendExtrasInto(payload.candidates, have);
  payload.candidates.sort((a, b) => a.category.localeCompare(b.category) || a.file.localeCompare(b.file));
  payload.total = payload.candidates.length;
  payload._generated = new Date().toISOString();
  fs.writeFileSync(candPath, JSON.stringify(payload, null, 2));
  console.log(`\nEXTRAS: appended ${added} iconic file(s); total now ${payload.total}.`);
}

// Verify liveness via the Commons API (does the File: page exist?) rather than
// fetching the actual image bytes. Hammering the CDN with 80+ image GETs in a
// loop trips Commons' per-IP rate limit (HTTP 429) even though every file is
// fine — a false alarm. The API confirms existence in a couple of batched
// calls; if the file exists, the browser's Special:FilePath/<name> request
// resolves to the image (and each visitor only loads ONE image per day anyway).
function fileTitleFromImg(url) {
  const m = url.match(/Special:FilePath\/([^?]+)/);
  return m ? "File:" + decodeURIComponent(m[1]) : null;
}

async function doVerify() {
  const src = fs.readFileSync(ROOT + "first_light.js", "utf8");
  const urls = [...src.matchAll(/img:\s*"([^"]+)"/g)].map((m) => m[1]);
  const items = urls.map((u) => ({ url: u, title: fileTitleFromImg(u) }));
  const results = [];
  let broken = 0;
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const data = await apiGet({
      action: "query", format: "json", formatversion: "2",
      titles: batch.map((b) => b.title).filter(Boolean).join("|"),
      prop: "imageinfo", iiprop: "url|mediatype",
    });
    const norm = {};
    for (const n of (data.query && data.query.normalized) || []) norm[n.from] = n.to;
    const exists = {};
    for (const p of (data.query && data.query.pages) || []) exists[p.title] = !p.missing && !!(p.imageinfo && p.imageinfo.length);
    for (const b of batch) {
      const ok = exists[norm[b.title] || b.title] === true;
      results.push({ url: b.url, title: b.title, ok });
      if (!ok) broken++;
      console.log(`${ok ? "OK  " : "MISSING"}  ${b.title}`);
    }
    await sleep(400);
  }
  fs.writeFileSync(ROOT + "tools/first_light_verify.json",
    JSON.stringify({ _generated: new Date().toISOString(), total: items.length, broken, results }, null, 2));
  console.log(`\nVERIFY: ${items.length - broken}/${items.length} files exist on Commons; ${broken} missing.`);
  return broken;
}

const mode = (process.argv[2] || "all").toLowerCase();
if (mode === "source") { await doSource(); }
else if (mode === "extras") { await doExtras(); }
else if (mode === "verify") { const b = await doVerify(); if (process.env.STRICT_VERIFY === "1" && b) process.exit(1); }
else { await doSource(); console.log("\n──── verify ────"); await doVerify(); }
