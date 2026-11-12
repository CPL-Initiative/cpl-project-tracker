// First Light: the painting gallery's marks are applied to the daily rotation.
//
// Sam marked paintings in the gallery artifact on 2026-10-13 (keep, drop, add,
// skip) and no PR applied them, so the painting of the day stayed the June set
// for a month (#3153). The marks now land in the repo as a receipt,
// tools/first_light_gallery/picks_<date>.json (doc id = painting key = the first
// 12 hex of sha1(file)). This test fails while a committed receipt sits
// unapplied.
//
// Guards the FAILURE MODES:
//   (a) a dropped painting is still in tools/first_light_selection.json;
//   (b) an added painting is missing from it, unless the held file beside the
//       receipt (picks_<date>_held.json) names it with a reason;
//   (c) a mark names a painting the gallery index does not know (a guessed id);
//   (d) the selection changed but first_light.js was not rebuilt from it
//       (node tools/build_first_light_manifest.mjs).
//
// Later receipts win over earlier ones for the same painting.
//
// Run from repo root: `npm test` (or `node tests/first_light_picks_applied.test.js`).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }

const DIR = "tools/first_light_gallery";
const key = (file) => crypto.createHash("sha1").update(file, "utf8").digest("hex").slice(0, 12);

const receipts = fs.readdirSync(DIR).filter((f) => /^picks_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const heldFiles = fs.readdirSync(DIR).filter((f) => /^picks_\d{4}-\d{2}-\d{2}_held\.json$/.test(f)).sort();
check("at least one picks receipt is committed", receipts.length > 0, receipts.join(", "));

const marks = {};
for (const f of receipts) {
  const doc = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  for (const [id, m] of Object.entries(doc)) marks[id] = m;
}
const held = {};
for (const f of heldFiles) {
  const doc = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  Object.assign(held, doc.held || {});
}

const index = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf8"));
const known = new Set(index.paintings.map((p) => p.key));
const unknown = Object.keys(marks).filter((id) => !known.has(id));
check("(c) every mark resolves to a painting in the gallery index", unknown.length === 0, unknown.join(", "));

const sel = JSON.parse(fs.readFileSync("tools/first_light_selection.json", "utf8"));
const inSel = new Set(sel.map((e) => key(e.file)));

const dropped = Object.keys(marks).filter((id) => marks[id].v === "drop" && inSel.has(id));
check("(a) no dropped painting is still in the selection", dropped.length === 0, dropped.join(", "));

const missing = Object.keys(marks).filter((id) => marks[id].v === "add" && !inSel.has(id) && !held[id]);
check("(b) every added painting is in the selection or held with a reason", missing.length === 0, missing.join(", "));

const heldBad = Object.keys(held).filter((id) => !marks[id] || marks[id].v !== "add" || inSel.has(id) || !String(held[id]).trim());
check("(b) every held id is an unapplied add mark with a reason", heldBad.length === 0, heldBad.join(", "));

// (d) first_light.js carries exactly the selection, in order.
const js = fs.readFileSync("first_light.js", "utf8");
const block = (js.match(/FL-MANIFEST:START[\s\S]*?FL-MANIFEST:END/) || [""])[0];
const titles = [...block.matchAll(/^\s{6}title: ("(?:[^"\\]|\\.)*"),$/gm)].map((m) => JSON.parse(m[1]));
check("(d) first_light.js has one painting per selection entry", titles.length === sel.length, titles.length + " vs " + sel.length);
check("(d) first_light.js paintings follow the selection order",
  titles.length === sel.length && titles.every((t, i) => t === sel[i].title));

let failed = 0;
for (const [name, ok, detail] of results) {
  console.log((ok ? "PASS " : "FAIL ") + name + (ok || !detail ? "" : " -> " + detail));
  if (!ok) failed++;
}
console.log("\nfirst_light_picks_applied.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
