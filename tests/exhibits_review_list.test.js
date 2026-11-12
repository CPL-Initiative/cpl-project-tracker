// Sam's Exhibits review list on the Review view, and "a retired title never comes back by accident" as a number
// (COBIx, issue comment 6827701373, points 1 and 2; S643). Guards:
//   (1) the Review view's "What is it called?" tiles carry a Renamed titles tile with the review list's count, and the
//       titles open under it in plain words, not only in kb/credential_title_moves.json;
//   (2) a returned title no one acknowledged (kb/returned_titles_acknowledged.json) reads first and says so in words;
//   (3) the builders carry it: kb/_build_exhibits_review.py writes review_list from kb/credential_aliases.py, the committed
//       review file and the resolver's report agree, and the Commons scorecard holds both numbers beside the old-titles
//       count (review list 11 today, unacknowledged 0);
//   (4) the check is a warning: kb/credential_aliases.py --check exits 0 and prints the count;
//   (5) tokens only, no glyphs, an underlined summary word, American spelling in the rendered words.
// Run from repo root: `npm test` (or `node tests/exhibits_review_list.test.js`).
const fs = require("fs");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const REVIEW_LIST = [
  { title: "Kept Back", kind: "brought back", words: "Renamed once and back in the reference, so it reads as itself. Brought back by a curator on 2026-10-18." },
  { title: "Old Carpentry", kind: "dead end", words: "Renamed to “Gone Title”, which is no longer in the reference." },
  { title: "Water Supply", kind: "dead retire", words: "Retired into “Credit by Exam”, which is no longer in the reference, so it is no search alias." },
  { title: "Put Back", kind: "brought back, not acknowledged", words: "Renamed once and back in the reference with no record of who brought it back or why. Retire it, or add who, when and why to kb/returned_titles_acknowledged.json." }
];
function load(review) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/held", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function (url) {
    url = String(url);
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok(Object.assign({ schema: 1, written_at: "2026-11-12T05:22:00Z", sources: {},
      tiles: { names: { n: 1, of: 2, waiting: 1 }, aligned: { n: 0, of: 0 }, review_list: { n: (review || []).length, unacknowledged: 1 } },
      steps: {}, colleges: [], held: [] }, review ? { review_list: review } : {}));
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(null); }, authHeaders: function () { return {}; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) { setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function tileOf(d, label) { return Array.from(d.querySelectorAll(".exh-tile")).find((t) => txt(t.querySelector(".exh-tl")) === label); }

(async function () {
  const t = load(REVIEW_LIST);
  await t.M.boot(); await settle();
  check("the Review view opens", t.M._state.view === "review");
  const tile = tileOf(t.d, "Renamed titles");
  check("(1) a Renamed titles tile sits with the What is it called? tiles", !!tile && !!tile.closest(".exh-dash"));
  check("(1) the tile counts the review list", tile && txt(tile.querySelector(".exh-tn b")) === "4", tile && txt(tile));
  check("(1) the tile says the kinds in words and the unacknowledged count against its target",
    tile && /1 brought back, 1 dead end, 1 dead retire; 1 brought back with no record \(target 0\)/.test(txt(tile)), tile && txt(tile));
  const box = t.d.querySelector(".exh-group details");
  check("(1) the titles open under the tiles", !!box && txt(box.querySelector("summary")) === "The 4 renamed titles to look at", box && txt(box));
  const items = box ? Array.from(box.querySelectorAll("li")).map(txt) : [];
  check("(1) every title is listed with its kind and its words", items.length === 4
    && items.some((x) => /^Old Carpentry, dead end\. Renamed to .Gone Title., which is no longer in the reference\.$/.test(x)), items.join(" | "));
  check("(2) a returned title no one acknowledged reads first, in words", /^Put Back, brought back, not acknowledged\. .*no record of who brought it back or why/.test(items[0] || ""), items[0]);
  check("(5) no glyph in the rendered list", items.every((x) => !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(x)));

  const none = load(null);
  await none.M.boot(); await settle();
  const nt = tileOf(none.d, "Renamed titles");
  check("(1) a review file with no list says so rather than a zero", nt && txt(nt.querySelector(".exh-tn b")) === "Not built yet" && !none.d.querySelector(".exh-group details"), nt && txt(nt));

  // ── (3) the builders and the committed files ──
  const moves = JSON.parse(fs.readFileSync("kb/credential_title_moves.json", "utf8")).report;
  const review = JSON.parse(fs.readFileSync("kb/exhibits_review.json", "utf8"));
  check("(3) the committed review file carries the resolver's review list, the same titles in the same order",
    Array.isArray(review.review_list) && JSON.stringify(review.review_list) === JSON.stringify(moves.review_list));
  check("(3) the review list is the report's returned, dead ends and dead retires",
    moves.review_list.length === moves.returned.length + moves.dead_ends.length + moves.dead_retires.length);
  check("(3) the review file's tile counts it", review.tiles.review_list.n === moves.review_list.length
    && review.tiles.review_list.unacknowledged === moves.unacknowledged.length);
  check("(3) the review builder reads the list from the one resolver", /credential_aliases\.review_list\(root\)/.test(fs.readFileSync("kb/_build_exhibits_review.py", "utf8")));
  const row = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")).rows.find((r) => r.key === "exhibit");
  check("(3) the scorecard holds both numbers", row.facts.review_list === moves.review_list.length && row.facts.returned_unacknowledged === moves.unacknowledged.length,
    JSON.stringify([row.facts.review_list, row.facts.returned_unacknowledged]));
  const left = row.issues.findIndex((i) => /^old titles no MAP exhibit uses/.test(i.words));
  const rl = row.issues.findIndex((i) => /^renamed titles on the Exhibits review list/.test(i.words));
  const un = row.issues.findIndex((i) => /^unacknowledged returned titles, target 0/.test(i.words));
  check("(3) the review list sits beside the old-titles count, its words carry the unacknowledged count, and that count has its own line once above zero",
    left > -1 && rl === left + 1 && new RegExp("; " + moves.unacknowledged.length + " unacknowledged returned titles \\(target 0\\)$").test(row.issues[rl].words)
    && (moves.unacknowledged.length ? un === left + 2 && row.issues[un].n === moves.unacknowledged.length : un === -1),
    rl > -1 ? row.issues[rl].words : "missing");
  check("(3) the builder gives the unacknowledged count its own line", /"unacknowledged returned titles, target 0: /.test(fs.readFileSync("kb/_build_commons_status.py", "utf8")));
  check("(3) the scorecard reads the resolver's report", /load_json\(root, "kb\/credential_title_moves\.json"\)\["report"\]/.test(fs.readFileSync("kb/_build_commons_status.py", "utf8")));

  // ── (4) a warning, never a failure ──
  let out = "", code = 0;
  try { out = execFileSync("python3", ["kb/credential_aliases.py", "--check"], { encoding: "utf8", env: Object.assign({}, process.env, { GITHUB_ACTIONS: "" }) }); }
  catch (e) { code = e.status; out = String(e.stdout || ""); }
  check("(4) --check exits 0 and prints the returned and unacknowledged counts", code === 0
    && /returned titles: \d+, \d+ not acknowledged \(target 0\)/.test(out), out);
  check("(4) CI's lints job runs the check", /run: python3 kb\/credential_aliases\.py --check/.test(fs.readFileSync(".github/workflows/js-tests.yml", "utf8"))
    && /credential_aliases\.py --check/.test(fs.readFileSync("scripts/check_generated.sh", "utf8")));

  // ── (5) the look ──
  const fn = src.slice(src.indexOf("function reviewListTile"), src.indexOf("function stepTile"));
  check("(5) the new code names no raw hex color", fn.length > 100 && !/#[0-9a-fA-F]{3,8}\b/.test(fn));
  check("(5) the summary is an underlined word (the CSS the List's own details use)", /"\.exh-l-rxmore summary \{[^"]*text-decoration:underline/.test(src));

  let failed = 0;
  results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || why == null ? "" : " — " + why)); });
  console.log((results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
