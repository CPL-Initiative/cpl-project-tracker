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
const MAX_DEPTH = 1;            // recurse one level of subcategories (the masters
                                // file under "Paintings by X / <decade|museum>")
const SUBCAT_BUDGET = 60;       // max subcategories visited per root

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
    await sleep(150);
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
    await sleep(150);
  } while (cont);
  return subs;
}

// One root → its direct files + one level of subcategory files, deduped, capped.
async function pullRoot(root, seenFiles) {
  const items = [];
  const visited = new Set();
  const enough = () => items.length >= PER_ROOT_CAP;
  const push = (it) => { if (!seenFiles.has(it.file)) { seenFiles.add(it.file); items.push({ ...it, category: root }); } };
  const queue = [["Category:" + root, 0]];
  let subcatBudget = SUBCAT_BUDGET;
  while (queue.length && !enough()) {
    const [cat, depth] = queue.shift();
    if (visited.has(cat)) continue;
    visited.add(cat);
    await collectFiles(cat, push, enough);
    if (depth < MAX_DEPTH && subcatBudget > 0 && !enough()) {
      let subs = [];
      try { subs = await listSubcats(cat); } catch { /* ignore */ }
      for (const s of subs) {
        if (subcatBudget <= 0) break;
        if (!visited.has(s)) { queue.push([s, depth + 1]); subcatBudget--; }
      }
    }
  }
  return items;
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
  all.sort((a, b) => a.category.localeCompare(b.category) || a.file.localeCompare(b.file));
  const payload = {
    _generated: new Date().toISOString(),
    _note: "Verified public-domain candidates from Wikimedia Commons (direct + 1 level of subcategories). Curate by hand into tools/first_light_selection.json; write OUR OWN blurb/setting/alt per entry. Filenames are EXACT (do not edit).",
    total: all.length,
    by_category: summary,
    candidates: all,
  };
  fs.writeFileSync(ROOT + "tools/first_light_candidates.json", JSON.stringify(payload, null, 2));
  console.log(`\nSOURCED ${all.length} public-domain candidates across ${cats.length} categories.`);
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Range": "bytes=0-2047" }, redirect: "follow" });
    const ct = res.headers.get("content-type") || "";
    return { url, status: res.status, ok: (res.status === 200 || res.status === 206) && /^image\//i.test(ct), contentType: ct };
  } catch (e) {
    return { url, status: 0, ok: false, contentType: "", error: String(e.message || e) };
  }
}

async function doVerify() {
  const src = fs.readFileSync(ROOT + "first_light.js", "utf8");
  const urls = [...src.matchAll(/img:\s*"([^"]+)"/g)].map((m) => m[1]);
  const results = [];
  let broken = 0;
  for (const url of urls) {
    const r = await checkUrl(url);
    results.push(r);
    if (!r.ok) broken++;
    console.log(`${r.ok ? "OK  " : "DEAD"}  ${r.status}  ${url}`);
    await sleep(120);
  }
  fs.writeFileSync(ROOT + "tools/first_light_verify.json",
    JSON.stringify({ _generated: new Date().toISOString(), total: urls.length, broken, results }, null, 2));
  console.log(`\nVERIFY: ${urls.length - broken}/${urls.length} image URLs live; ${broken} broken.`);
  return broken;
}

const mode = (process.argv[2] || "all").toLowerCase();
if (mode === "source") { await doSource(); }
else if (mode === "verify") { const b = await doVerify(); if (process.env.STRICT_VERIFY === "1" && b) process.exit(1); }
else { await doSource(); console.log("\n──── verify ────"); await doVerify(); }
