// map_links.js reads MAP's verified index through the applied credential renames (the S640 conductor's
// read-time resolution, cpl_memory d-rename-repoint-stopped-resolve-at-read-s640). The index is keyed by
// the title its check saw (kb/reference/map_cpl_opportunities_verified.json, checked 2026-10-26); after the
// 2026-11-12 apply renamed "ASE Bundle — A4, A5", a lookup by the live title found nothing. Guards:
//   1. a renamed key's exhibits show under the title the rename made, after that title's own;
//   2. a key the check saw after its apply is read as written (the era guard);
//   3. the browser picks from kb/credential_title_moves.json and holds no resolver: the committed table
//      carries the live stale shape, and no browser file reads kb/cred_rename_out;
//   4. no table, no change: the index reads as before.
//
// Run from repo root: `npm test` (or `node tests/map_links_renamed_title.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("map_links.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const OLD = "ASE Bundle — A4, A5", NEW = "ASE Certificate Bundles: A4 + A5";
const verified = {
  checked_at: "2026-10-26T23:35Z",
  found: { "X-OLD": { college: "Rio Hondo College" }, "X-NEW": { college: "Cerritos College" }, "X-LATE": { college: "Late College" } },
  by_title: { [OLD]: ["X-OLD"], [NEW]: ["X-NEW"], "Checked After": ["X-LATE"] },
};
const moves = { moves: {
  [OLD]: [["2026-11-12T00:54:43Z", NEW]],
  "Checked After": [["2026-10-01T22:46:20Z", "Elsewhere"]],
} };

function boot(withMoves) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { runScripts: "dangerously", url: "https://example.org/" });
  const w = dom.window;
  w.fetch = (url) => Promise.resolve(/credential_title_moves\.json$/.test(url)
    ? (withMoves ? { ok: true, json: () => Promise.resolve(moves) } : { ok: false, status: 404, json: () => Promise.resolve(null) })
    : { ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(verified))) });
  w.eval(src);
  return w;
}

(async () => {
  const A = boot(true), B = boot(false);
  const ix = await A.CPL_MAP_LINKS.load();
  check("a renamed key's exhibits show under the live title, after its own", JSON.stringify(ix.by_title[NEW]) === JSON.stringify(["X-NEW", "X-OLD"]));
  const line = A.CPL_MAP_LINKS.lineHtml(NEW);
  check("the live title's line carries both builders", /Cerritos College/.test(line) && /Rio Hondo College/.test(line));
  check("a key checked after its apply is read as written", !ix.by_title.Elsewhere && ix.by_title["Checked After"].length === 1);
  check("nowTitle picks the first apply after the time given, and the title itself otherwise",
    A.CPL_MAP_LINKS.nowTitle(moves.moves, OLD, "2026-10-26T23:35Z") === NEW &&
    A.CPL_MAP_LINKS.nowTitle(moves.moves, OLD, "2026-11-13T00:00:00Z") === OLD &&
    A.CPL_MAP_LINKS.nowTitle(moves.moves, "Unknown", null) === "Unknown");
  const ixB = await B.CPL_MAP_LINKS.load();
  check("no table, no change", JSON.stringify(ixB.by_title[NEW]) === JSON.stringify(["X-NEW"]));

  const table = JSON.parse(fs.readFileSync("kb/credential_title_moves.json", "utf8"));
  check("the committed table carries the live stale shape: ASE Bundle — A4, A5 to its 2026-11-12 title",
    (table.moves[OLD] || []).some((p) => p[0] === "2026-11-12T00:54:43Z" && p[1] === NEW));
  check("the table is built by the one resolver", table._built_by === "kb/credential_aliases.py");
  check("map_links.js holds no reader of the rename snapshots", src.indexOf("cred_rename_out") < 0 && src.indexOf("alias_map") < 0);

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS  " : "FAIL  ") + r[0]));
  console.log(`\n${results.length - failed.length}/${results.length} assertions passed`);
  process.exit(failed.length ? 1 : 0);
})();
