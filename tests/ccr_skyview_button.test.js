/* The SkyView launcher on the Common Course Reference tab.
 *
 * Sam, 2026-08-24: "it should be a button on the CCR Tab top right and prominent."
 *
 * The failure mode this guards is not "the button is missing" — it is the button
 * pointing at something that is not deployed. The self-contained SkyView build
 * (prototype/ccr_atlas_v1.built.html) is 9.9 MB and GITIGNORED, so a link to it
 * 404s on the live site while working perfectly on the machine that built it.
 * The served entry point prototype/skyview.html exists precisely so the button
 * has a real target, and it must stay committed.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.dirname(__dirname);
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
let n = 0;
const ok = (name, cond) => { assert.ok(cond, name); n++; };

for (const f of ["index.html", "CPL_Dashboard.html"]) {
  const s = read(f);
  const i = s.indexOf('id="tab-unified-courses"');
  ok(`${f}: the CCR tab exists`, i > 0);
  const pane = s.slice(i, i + 40000);

  ok(`${f}: the launcher is on the CCR tab`, /class="uc-skyview"/.test(pane));
  ok(`${f}: it points at the SERVED page, not the gitignored build`,
    /href="prototype\/skyview\.html"/.test(pane) && !/ccr_atlas_v1\.built\.html/.test(pane));
  ok(`${f}: it opens in a new tab, safely`,
    /target="_blank"/.test(pane) && /rel="noopener"/.test(pane));
  // "Top right" is a layout claim; the flex header is what makes it one.
  ok(`${f}: the header row that puts it top-right exists`,
    /class="uc-head"/.test(pane) && /justify-content:space-between/.test(s));
  // The glyph is decorative; the word must carry the meaning on its own.
  ok(`${f}: it is named in words, not by a glyph alone`, /Open SkyView/.test(pane));
  ok(`${f}: the decorative mark is hidden from assistive tech`,
    /<span aria-hidden="true">✦<\/span>/.test(pane));
}

// The target must actually be committed, or the button is a 404 on the live site.
ok("prototype/skyview.html is committed", fs.existsSync(path.join(ROOT, "prototype/skyview.html")));
const sv = read("prototype/skyview.html");
ok("it fetches its payloads rather than inlining them (so it stays committable)",
  /fetch\(/.test(sv) && /ccr_universe\.json/.test(sv) && /ccr_universe_members\.json/.test(sv));
ok("it is small enough to commit", Buffer.byteLength(sv) < 1_500_000);
ok("it opens straight on the graph", /__ccrUniverse\(\)/.test(sv));
// A blank canvas and a corpus with nothing in it look identical; only one is a bug.
ok("a failed load reports itself rather than rendering an empty page",
  /could not load its data/i.test(sv));
ok("its payloads are committed too",
  fs.existsSync(path.join(ROOT, "prototype/ccr_universe.json")) &&
  fs.existsSync(path.join(ROOT, "prototype/ccr_universe_members.json")));

console.log(`  ${n} assertions passed`);
