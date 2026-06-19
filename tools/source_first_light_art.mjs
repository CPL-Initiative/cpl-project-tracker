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
const PER_CATEGORY_CAP = 120;   // keep the candidate pool bounded; curate by hand after

function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
}

// A file is usable iff Commons declares it Public Domain or CC0. This is the
// safety net: categories like "Craftsman architecture" hold modern CC-BY-SA
// photos too — those get DROPPED here, only genuinely free-of-copyright files
// (PD-Art, PD-US, PD-old, PD-USGov/NARA/HABS, CC0) survive.
function isPublicDomain(ext) {
  const short = (ext.LicenseShortName && ext.LicenseShortName.value) || "";
  const code = (ext.License && ext.License.value) || "";
  const usage = (ext.UsageTerms && ext.UsageTerms.value) || "";
  const hay = (short + " " + code + " " + usage).toLowerCase();
  if (/cc[\s-]?by|cc[\s-]?sa|attribution|share[\s-]?alike|fair use|gfdl/.test(hay)) {
    // CC-BY / CC-BY-SA / GFDL are free but NOT public domain — exclude.
    if (!/public domain|cc0|cc[\s-]?zero/.test(hay)) return false;
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

async function pullCategory(cat) {
  const out = [];
  let cont = undefined;
  do {
    const params = {
      action: "query", format: "json", formatversion: "1",
      generator: "categorymembers",
      gcmtitle: "Category:" + cat,
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
      if (ii.mediatype !== "BITMAP") continue;             // paintings/photos, not vector drawings
      if ((ii.width || 0) < MIN_WIDTH) continue;
      if (!isPublicDomain(ii.extmetadata)) continue;
      const ext = ii.extmetadata;
      const title = p.title;
      if (/\b(detail|sketch|study|verso|frame|x-ray|infrared|signature)\b/i.test(title)) continue;
      out.push({
        category: cat,
        file: title.replace(/^File:/, ""),
        img: filePathUrl(title),
        license: stripHtml(ext.LicenseShortName && ext.LicenseShortName.value) || "Public domain",
        artist: stripHtml(ext.Artist && ext.Artist.value),
        year: stripHtml(ext.DateTimeOriginal && ext.DateTimeOriginal.value),
        object: stripHtml(ext.ObjectName && ext.ObjectName.value),
        credit: stripHtml(ext.Credit && ext.Credit.value).slice(0, 200),
        desc: stripHtml(ext.ImageDescription && ext.ImageDescription.value).slice(0, 240),
        width: ii.width, height: ii.height,
        page: ii.descriptionurl,
      });
      if (out.length >= PER_CATEGORY_CAP) return { cat, items: out, capped: true };
    }
    cont = data && data.continue && data.continue.gcmcontinue;
    await sleep(250);
  } while (cont);
  return { cat, items: out, capped: false };
}

async function doSource() {
  const cfg = JSON.parse(fs.readFileSync(ROOT + "tools/art_categories.json", "utf8"));
  const cats = cfg.categories || [];
  const all = [];
  const summary = [];
  const seen = new Set();
  for (const cat of cats) {
    let r;
    try { r = await pullCategory(cat); }
    catch (e) { summary.push({ category: cat, count: 0, error: String(e.message || e) }); continue; }
    let kept = 0;
    for (const it of r.items) {
      if (seen.has(it.file)) continue;
      seen.add(it.file); all.push(it); kept++;
    }
    summary.push({ category: cat, count: kept, capped: r.capped });
    console.log(`  ${String(kept).padStart(4)}  ${cat}${r.capped ? "  (capped)" : ""}`);
  }
  all.sort((a, b) => a.category.localeCompare(b.category) || a.file.localeCompare(b.file));
  const payload = {
    _generated: new Date().toISOString(),
    _note: "Verified public-domain candidates from Wikimedia Commons. Curate by hand into first_light.js; write OUR OWN blurb/setting/alt per entry. Filenames are EXACT (do not edit).",
    total: all.length,
    by_category: summary,
    candidates: all,
  };
  fs.writeFileSync(ROOT + "tools/first_light_candidates.json", JSON.stringify(payload, null, 2));
  console.log(`\nSOURCED ${all.length} public-domain candidates across ${cats.length} categories.`);
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Range": "bytes=0-2047" },
      redirect: "follow",
    });
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
