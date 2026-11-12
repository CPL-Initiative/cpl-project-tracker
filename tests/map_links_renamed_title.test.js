// map_links.js reads MAP's verified index through the applied credential renames (the S640 conductor's
// read-time resolution, cpl_memory d-rename-repoint-stopped-resolve-at-read-s640). The index is keyed by
// the title its check saw (kb/reference/map_cpl_opportunities_verified.json, checked 2026-10-26); after the
// 2026-11-12 apply renamed "ASE Bundle — A4, A5", a lookup by the live title found nothing. Guards:
//   1. a renamed key's exhibits show under the title the rename made, after that title's own;
//   2. a live title is itself (the S641 conductor, D1): the reference's titles when the page loaded it, else the
//      table's returned titles; a title that is not live takes its first live hop, else its last;
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
  by_title: { [OLD]: ["X-OLD"], [NEW]: ["X-NEW"], "Brought Back": ["X-LATE"] },
};
const moves = { moves: { [OLD]: [NEW], "Brought Back": ["Elsewhere"], "Chain": ["Middle", "End"] },
  report: { returned: ["Brought Back"] } };

function boot(withMoves, ref) {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { runScripts: "dangerously", url: "https://example.org/" });
  const w = dom.window;
  w.fetch = (url) => Promise.resolve(/credential_title_moves\.json$/.test(url)
    ? (withMoves ? { ok: true, json: () => Promise.resolve(moves) } : { ok: false, status: 404, json: () => Promise.resolve(null) })
    : { ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(verified))) });
  if (ref) w.CPL_CREDENTIAL_REFERENCE = { unified_titles: ref.map((t) => ({ ut: t })) };
  w.eval(src);
  return w;
}

(async () => {
  const A = boot(true), B = boot(false);
  const ix = await A.CPL_MAP_LINKS.load();
  check("a renamed key's exhibits show under the live title, after its own", JSON.stringify(ix.by_title[NEW]) === JSON.stringify(["X-NEW", "X-OLD"]));
  const line = A.CPL_MAP_LINKS.lineHtml(NEW);
  check("the live title's line carries both builders", /Cerritos College/.test(line) && /Rio Hondo College/.test(line));
  check("with no reference loaded, a returned title from the table's report reads as itself",
    !ix.by_title.Elsewhere && ix.by_title["Brought Back"].length === 1);
  const C = boot(true, [NEW, "Middle", "Brought Back"]);
  const ixC = await C.CPL_MAP_LINKS.load();
  check("with the reference loaded, its titles are the live set", ixC.by_title["Brought Back"].length === 1 && ixC.by_title[NEW].length === 2);
  const nt = A.CPL_MAP_LINKS.nowTitle, live = { Middle: 1, [NEW]: 1 };
  check("nowTitle: a live title is itself, else the first live hop, else the last hop, else the title",
    nt(moves.moves, NEW, live) === NEW && nt(moves.moves, "Chain", live) === "Middle" &&
    nt(moves.moves, "Chain", {}) === "End" && nt(moves.moves, "Unknown", live) === "Unknown");
  const ixB = await B.CPL_MAP_LINKS.load();
  check("no table, no change", JSON.stringify(ixB.by_title[NEW]) === JSON.stringify(["X-NEW"]));

  const table = JSON.parse(fs.readFileSync("kb/credential_title_moves.json", "utf8"));
  check("the committed table carries the live stale shape: ASE Bundle — A4, A5 to its 2026-11-12 title",
    (table.moves[OLD] || []).indexOf(NEW) >= 0);
  check("the table is built by the one resolver", table._built_by === "kb/credential_aliases.py");
  check("map_links.js holds no reader of the rename snapshots", src.indexOf("cred_rename_out") < 0 && src.indexOf("alias_map") < 0);

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS  " : "FAIL  ") + r[0]));
  console.log(`\n${results.length - failed.length}/${results.length} assertions passed`);
  process.exit(failed.length ? 1 : 0);
})();
